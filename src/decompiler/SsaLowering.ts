/**
 * SSA Lowering — converts StructuredNode (with SsaInstr[]) to LoweredNode (with Statement[]).
 *
 * This pass:
 * 1. Resolves SSA variables to named Expression trees
 * 2. Inlines single-use SSA values into their use sites
 * 3. Always inlines constants and compares
 * 4. Names multi-use values via the NameProvider
 * 5. Resolves string literal addresses
 */

import { SsaFunction, SsaInstr, SsaValue, SsaVariable, SsaConst, COMPARE_INVERT, isVariable, isConst } from './SsaBuilder';
import { StructuredNode } from './StructuralAnalysis';
import { Expression, Statement, LoweredNode } from './ExpressionIR';
import { lookupKnownFunction } from './KnownFunctions';

/** Addresses at or below this threshold are not treated as string pointers. */
const MIN_STRING_ADDRESS = 256;

export interface LoweringNameProvider {
  functionName(globalIndex: number): string;
  localName(localIndex: number): string;
  globalName(globalIndex: number): string;
  resolveAddress?(address: number): string | null;
}

export function lowerSsaToStatements(
  node: StructuredNode,
  ssaFunc: SsaFunction,
  names: LoweringNameProvider,
): LoweredNode {
  const defMap = buildDefMap(ssaFunc);
  const useCount = buildUseCount(ssaFunc);
  const useSiteContext = buildUseSiteContext(ssaFunc);
  const exprCache = new Map<number, Expression>();
  const resolvedNames = new Map<number, string>();
  const nameUsageCount = new Map<string, number>();

  // Resolve names for non-inlined temporaries with collision avoidance
  for (const block of ssaFunc.blocks) {
    for (const instr of block.instructions) {
      const result = getResult(instr);
      if (!result || resolvedNames.has(result.id)) { continue; }
      const baseName = result.name;
      if (baseName.startsWith('local') || baseName.startsWith('param') || baseName.startsWith('phi') || baseName.startsWith('neg')) {
        continue;
      }
      // Skip variables that will be inlined (single-use or always-inline)
      const uses = useCount.get(result.id) || 0;
      const alwaysInline = instr.kind === 'const' || instr.kind === 'global_get' || instr.kind === 'compare' || instr.kind === 'unary';
      if ((uses <= 1 || alwaysInline) && canInline(instr)) {
        continue;
      }
      const candidateName = computeVarName(result);
      if (candidateName.startsWith('global_') || candidateName.startsWith('__')) {
        resolvedNames.set(result.id, candidateName);
        continue;
      }
      const usedCount = nameUsageCount.get(candidateName) || 0;
      let finalName: string;
      if (candidateName === 'i' && usedCount > 0) {
        const loopCounterNames = ['i', 'j', 'k', 'n', 'm'];
        finalName = usedCount < loopCounterNames.length ? loopCounterNames[usedCount] : `i${usedCount + 1}`;
      } else {
        finalName = usedCount === 0 ? candidateName : `${candidateName}${usedCount + 1}`;
      }
      nameUsageCount.set(candidateName, usedCount + 1);
      resolvedNames.set(result.id, finalName);
    }
  }

  // Build a set of variable IDs whose single use is inside a select operand
  const usedInSelect = new Set<number>();
  for (const block of ssaFunc.blocks) {
    for (const instr of block.instructions) {
      if (instr.kind === 'select') {
        for (const operand of [instr.condition, instr.trueVal, instr.falseVal]) {
          if (isVariable(operand)) {
            usedInSelect.add(operand.id);
          }
        }
      }
    }
  }

  // Pre-build expression cache for inlineable values
  for (const block of ssaFunc.blocks) {
    for (const instr of block.instructions) {
      const result = getResult(instr);
      if (!result) {
        continue;
      }
      // Never cache calls for inlining — they have side effects and must remain as statements
      if (instr.kind === 'call' || instr.kind === 'call_indirect') {
        continue;
      }
      const uses = useCount.get(result.id) || 0;
      const alwaysInline = instr.kind === 'const' || instr.kind === 'global_get' || instr.kind === 'compare' || instr.kind === 'unary';
      if ((uses <= 1 || alwaysInline) && canInline(instr)) {
        const expr = instrToExpression(instr);
        if (expr) {
          exprCache.set(result.id, expr);
        }
      }
    }
  }

  function resolveValue(value: SsaValue): Expression {
    if (isConst(value)) {
      const numVal = Number(value.value);
      if (names.resolveAddress && numVal > MIN_STRING_ADDRESS) {
        const resolved = names.resolveAddress(numVal);
        if (resolved) {
          return { kind: 'string_literal', value: resolved, address: numVal };
        }
      }
      return { kind: 'const', value: value.value, type: value.type };
    }

    if (isVariable(value)) {
      const cached = exprCache.get(value.id);
      if (cached) {
        return cached;
      }
      // Check if defined by a const — always resolve to literal
      const def = defMap.get(value.id);
      if (def && def.kind === 'const') {
        const constVal = Number(def.value);
        if (names.resolveAddress && constVal > MIN_STRING_ADDRESS) {
          const resolved = names.resolveAddress(constVal);
          if (resolved) {
            return { kind: 'string_literal', value: resolved, address: constVal };
          }
        }
        return { kind: 'const', value: def.value, type: def.type };
      }
      return { kind: 'var', name: resolveVarName(value), type: value.type };
    }

    return { kind: 'const', value: 0, type: 'i32' };
  }

  function resolveVarName(variable: SsaVariable): string {
    const resolved = resolvedNames.get(variable.id);
    if (resolved) {
      return resolved;
    }
    return computeVarName(variable);
  }

  function computeVarName(variable: SsaVariable): string {
    const baseName = variable.name;
    const localMatch = baseName.match(/^(?:local|param)(\d+)/);
    if (localMatch) {
      return names.localName(parseInt(localMatch[1], 10));
    }
    const phiMatch = baseName.match(/^phi_(\d+)/);
    if (phiMatch) {
      return names.localName(parseInt(phiMatch[1], 10));
    }
    // Negation temporaries are always inlined by the expression cache,
    // so this name is only a fallback for diagnostics.
    const negMatch = baseName.match(/^neg_(\d+)/);
    if (negMatch) {
      return `neg_${negMatch[1]}`;
    }

    const def = defMap.get(variable.id);
    if (def) {
      if (def.kind === 'call' && def.target >= 0) {
        const rawName = names.functionName(def.target);
        const known = lookupKnownFunction(rawName);
        if (known && known.returnName) {
          return known.returnName;
        }
        if (rawName.startsWith('is_') || rawName.startsWith('has_') || rawName.startsWith('can_')) {
          return rawName.replace(/^(is_|has_|can_)/, '');
        }
        if (rawName.startsWith('get_')) {
          return rawName.replace(/^get_/, '');
        }
        if (rawName.startsWith('find_') || rawName.startsWith('search_') || rawName.startsWith('lookup_')) {
          return 'found';
        }
        if (rawName.includes('alloc') || rawName.includes('malloc')) {
          return 'buf';
        }
        if (rawName.includes('len') || rawName.includes('length') || rawName.includes('size') || rawName.includes('count')) {
          return 'len';
        }
        return 'result';
      }
      if (def.kind === 'call_indirect') {
        return 'result';
      }
      if (def.kind === 'select') {
        return 'val';
      }
      if (def.kind === 'load') {
        const loadMnemonic = def.loadType;
        if (loadMnemonic.includes('load8')) {
          return 'byte';
        }
        if (loadMnemonic.includes('load16')) {
          return 'word';
        }
        return 'val';
      }
      if (def.kind === 'global_get') {
        const globalName = names.globalName(def.globalIndex);
        if (globalName === '__stack_pointer' || globalName === 'stack_pointer') {
          return 'sp';
        }
        return globalName;
      }
      if (def.kind === 'compare') {
        return 'cond';
      }
      if (def.kind === 'binary' && (def.op === '+' || def.op === '-')) {
        if (isVariable(def.left)) {
          const leftDef = defMap.get(def.left.id);
          if (leftDef && leftDef.kind === 'global_get') {
            const leftGlobalName = names.globalName(leftDef.globalIndex);
            if (leftGlobalName === '__stack_pointer' || leftGlobalName === 'stack_pointer') {
              return 'fp';
            }
          }
        }
      }
      // Boolean flag: only assigned 0 or 1 via const
      if (def.kind === 'const') {
        const constValue = Number(def.value);
        if (constValue === 0 || constValue === 1) {
          return 'flag';
        }
      }
    }
    // Use-site context-based naming
    const contexts = useSiteContext.get(variable.id);
    if (contexts) {
      // Loop counter: compared + incremented (phi variable used in condition and incremented by 1)
      if (contexts.has('compared') && contexts.has('incremented')) {
        return 'i';
      }
      // Pointer: used as address operand in load/store
      if (contexts.has('address')) {
        return 'ptr';
      }
      // Shifted value (likely array index computation)
      if (contexts.has('shifted')) {
        return 'idx';
      }
    }
    return 'val';
  }

  function instrToExpression(instr: SsaInstr): Expression | null {
    switch (instr.kind) {
      case 'const':
        return resolveValue({ kind: 'const', value: instr.value, type: instr.type });
      case 'binary':
        return { kind: 'binary', op: instr.op, left: resolveValue(instr.left), right: resolveValue(instr.right) };
      case 'unary':
        return { kind: 'unary', op: instr.op, operand: resolveValue(instr.operand) };
      case 'compare':
        return { kind: 'compare', op: instr.op, left: resolveValue(instr.left), right: resolveValue(instr.right) };
      case 'load':
        return { kind: 'load', address: resolveValue(instr.address), offset: instr.offset, loadType: instr.loadType };
      case 'convert':
        return { kind: 'convert', op: instr.op, operand: resolveValue(instr.operand) };
      case 'select':
        return { kind: 'select', condition: resolveValue(instr.condition), trueVal: resolveValue(instr.trueVal), falseVal: resolveValue(instr.falseVal) };
      case 'global_get':
        return { kind: 'global', name: names.globalName(instr.globalIndex) };
      case 'assign':
        return resolveValue(instr.value);
      case 'call':
        if (instr.result) {
          const funcName = instr.target >= 0 ? names.functionName(instr.target) : (instr.target === -1 ? 'memory.size' : instr.target === -2 ? 'memory.grow' : 'atomic_cmpxchg');
          return { kind: 'call', name: funcName, args: instr.args.map(a => resolveValue(a)) };
        }
        return null;
      case 'call_indirect':
        if (instr.result) {
          return { kind: 'call_indirect', tableIndex: resolveValue(instr.tableIndex), args: instr.args.map(a => resolveValue(a)) };
        }
        return null;
      default:
        return null;
    }
  }

  function instrToStatement(instr: SsaInstr): Statement | null {
    const result = getResult(instr);

    // Skip inlined values (they'll appear in expressions)
    if (result && exprCache.has(result.id)) {
      return null;
    }

    switch (instr.kind) {
      case 'assign': {
        const targetName = resolveVarName(instr.result);
        return { kind: 'assign', target: targetName, type: instr.result.type, value: resolveValue(instr.value) };
      }
      case 'const': {
        const targetName = resolveVarName(instr.result);
        return { kind: 'assign', target: targetName, type: instr.type, value: { kind: 'const', value: instr.value, type: instr.type } };
      }
      case 'binary': {
        const targetName = resolveVarName(instr.result);
        return { kind: 'assign', target: targetName, type: instr.result.type, value: { kind: 'binary', op: instr.op, left: resolveValue(instr.left), right: resolveValue(instr.right) } };
      }
      case 'unary': {
        const targetName = resolveVarName(instr.result);
        return { kind: 'assign', target: targetName, type: instr.result.type, value: { kind: 'unary', op: instr.op, operand: resolveValue(instr.operand) } };
      }
      case 'compare': {
        const targetName = resolveVarName(instr.result);
        return { kind: 'assign', target: targetName, type: 'i32', value: { kind: 'compare', op: instr.op, left: resolveValue(instr.left), right: resolveValue(instr.right) } };
      }
      case 'load': {
        const targetName = resolveVarName(instr.result);
        return { kind: 'assign', target: targetName, type: instr.result.type, value: { kind: 'load', address: resolveValue(instr.address), offset: instr.offset, loadType: instr.loadType } };
      }
      case 'store':
        return { kind: 'store', address: resolveValue(instr.address), offset: instr.offset, storeType: instr.storeType, value: resolveValue(instr.value) };
      case 'call': {
        const funcName = instr.target >= 0 ? names.functionName(instr.target) : (instr.target === -1 ? 'memory.size' : instr.target === -2 ? 'memory.grow' : 'atomic_cmpxchg');
        const resultName = instr.result ? resolveVarName(instr.result) : null;
        return { kind: 'call', name: funcName, args: instr.args.map(a => resolveValue(a)), result: resultName };
      }
      case 'call_indirect': {
        const resultName = instr.result ? resolveVarName(instr.result) : null;
        return { kind: 'call_indirect', tableIndex: resolveValue(instr.tableIndex), args: instr.args.map(a => resolveValue(a)), result: resultName };
      }
      case 'convert': {
        const targetName = resolveVarName(instr.result);
        return { kind: 'assign', target: targetName, type: instr.result.type, value: { kind: 'convert', op: instr.op, operand: resolveValue(instr.operand) } };
      }
      case 'select': {
        const targetName = resolveVarName(instr.result);
        return { kind: 'assign', target: targetName, type: instr.result.type, value: { kind: 'select', condition: resolveValue(instr.condition), trueVal: resolveValue(instr.trueVal), falseVal: resolveValue(instr.falseVal) } };
      }
      case 'global_get': {
        const targetName = resolveVarName(instr.result);
        return { kind: 'assign', target: targetName, type: instr.result.type, value: { kind: 'global', name: names.globalName(instr.globalIndex) } };
      }
      case 'global_set':
        return { kind: 'global_set', name: names.globalName(instr.globalIndex), value: resolveValue(instr.value) };
      case 'return':
        return { kind: 'return', value: instr.value ? resolveValue(instr.value) : null };
      case 'unreachable':
        return { kind: 'unreachable' };
      case 'phi':
      case 'branch':
      case 'branch_if':
      case 'branch_table':
        return null;
      default:
        return null;
    }
  }

  function lowerNode(structuredNode: StructuredNode): LoweredNode {
    switch (structuredNode.kind) {
      case 'sequence':
        return { kind: 'sequence', children: structuredNode.children.map(c => lowerNode(c)) };
      case 'block': {
        const statements: Statement[] = [];
        for (const instr of structuredNode.body) {
          const stmt = instrToStatement(instr);
          if (stmt) {
            statements.push(stmt);
          }
        }
        return { kind: 'block', body: statements };
      }
      case 'if':
        return {
          kind: 'if',
          condition: resolveValue(structuredNode.condition),
          thenBody: lowerNode(structuredNode.thenBody),
          elseBody: structuredNode.elseBody ? lowerNode(structuredNode.elseBody) : null,
        };
      case 'while':
        return {
          kind: 'while',
          condition: structuredNode.condition ? resolveValue(structuredNode.condition) : null,
          body: lowerNode(structuredNode.body),
        };
      case 'do_while':
        return {
          kind: 'do_while',
          body: lowerNode(structuredNode.body),
          condition: resolveValue(structuredNode.condition),
        };
      case 'switch':
        return {
          kind: 'switch',
          selector: resolveValue(structuredNode.selector),
          cases: structuredNode.cases.map(c => ({ values: c.values, body: lowerNode(c.body) })),
          defaultBody: lowerNode(structuredNode.defaultBody),
        };
      case 'break':
        return { kind: 'break' };
      case 'continue':
        return { kind: 'continue' };
      case 'return':
        return { kind: 'return', value: structuredNode.value ? resolveValue(structuredNode.value) : null };
      case 'unreachable':
        return { kind: 'unreachable' };
      case 'labeled_block':
        return { kind: 'labeled_block', label: structuredNode.label, body: lowerNode(structuredNode.body) };
      case 'labeled_break':
        return { kind: 'labeled_break', label: structuredNode.label };
      case 'labeled_continue':
        return { kind: 'labeled_continue', label: structuredNode.label };
    }
  }

  return reduceNesting(cleanupLowered(detectForLoops(hoistCommonAssigns(eliminateDeadAssigns(lowerNode(node))))));
}

// ─── Helpers ───

function getResult(instr: SsaInstr): SsaVariable | null {
  switch (instr.kind) {
    case 'phi': case 'assign': case 'const': case 'binary': case 'unary':
    case 'compare': case 'load': case 'convert': case 'select': case 'global_get':
      return instr.result;
    case 'call': case 'call_indirect':
      return instr.result || null;
    default:
      return null;
  }
}

function canInline(instr: SsaInstr): boolean {
  if (instr.kind === 'assign') {
    if (instr.result.name.startsWith('local') || instr.result.name.startsWith('phi')) {
      return false;
    }
    return true;
  }
  // Calls have side effects — never inline them into expression positions
  if (instr.kind === 'call' || instr.kind === 'call_indirect') {
    return false;
  }
  return instr.kind === 'const' || instr.kind === 'binary' || instr.kind === 'unary' ||
    instr.kind === 'compare' || instr.kind === 'convert' || instr.kind === 'global_get' ||
    instr.kind === 'load' || instr.kind === 'select';
}

function buildDefMap(ssaFunc: SsaFunction): Map<number, SsaInstr> {
  const defMap = new Map<number, SsaInstr>();
  for (const block of ssaFunc.blocks) {
    for (const instr of block.instructions) {
      const result = getResult(instr);
      if (result) {
        defMap.set(result.id, instr);
      }
    }
  }
  return defMap;
}

/**
 * Counts non-phi uses of each SSA variable for inlining decisions.
 * Phi inputs are excluded because they represent the same value flowing through
 * different control paths — a variable used once in real code and once in a phi
 * is effectively single-use and safe to inline.
 */
function buildUseCount(ssaFunc: SsaFunction): Map<number, number> {
  const useCount = new Map<number, number>();
  function count(value: SsaValue): void {
    if (isVariable(value)) {
      useCount.set(value.id, (useCount.get(value.id) || 0) + 1);
    }
  }
  for (const block of ssaFunc.blocks) {
    for (const instr of block.instructions) {
      if (instr.kind === 'phi') { continue; }
      visitOperands(instr, count);
    }
  }
  return useCount;
}

function buildUseSiteContext(ssaFunc: SsaFunction): Map<number, Set<string>> {
  const contextMap = new Map<number, Set<string>>();
  function addContext(value: SsaValue, context: string): void {
    if (isVariable(value)) {
      let contexts = contextMap.get(value.id);
      if (!contexts) {
        contexts = new Set();
        contextMap.set(value.id, contexts);
      }
      contexts.add(context);
    }
  }
  for (const block of ssaFunc.blocks) {
    for (const instr of block.instructions) {
      if (instr.kind === 'load') {
        addContext(instr.address, 'address');
      } else if (instr.kind === 'store') {
        addContext(instr.address, 'address');
      } else if (instr.kind === 'compare') {
        addContext(instr.left, 'compared');
        addContext(instr.right, 'compared');
      } else if (instr.kind === 'binary') {
        if (instr.op === 'shl' || instr.op === 'shr_u' || instr.op === 'shr_s') {
          addContext(instr.left, 'shifted');
        }
      }
    }
    // Detect increment patterns: phi variable that gets incremented → loop counter
    for (const instr of block.instructions) {
      if (instr.kind === 'binary' && (instr.op === '+' || instr.op === '-')) {
        if (isVariable(instr.left) && !isVariable(instr.right)) {
          const constVal = Number((instr.right as SsaConst).value);
          if (constVal === 1 || constVal === -1 || constVal === 2 || constVal === 4 || constVal === 8) {
            addContext(instr.left, 'incremented');
          }
        }
      }
    }
  }
  return contextMap;
}

function visitOperands(instr: SsaInstr, visitor: (v: SsaValue) => void): void {
  switch (instr.kind) {
    case 'phi': for (const input of instr.inputs) { visitor(input.value); } break;
    case 'assign': visitor(instr.value); break;
    case 'binary': visitor(instr.left); visitor(instr.right); break;
    case 'unary': visitor(instr.operand); break;
    case 'compare': visitor(instr.left); visitor(instr.right); break;
    case 'load': visitor(instr.address); break;
    case 'store': visitor(instr.address); visitor(instr.value); break;
    case 'call': for (const arg of instr.args) { visitor(arg); } break;
    case 'call_indirect': visitor(instr.tableIndex); for (const arg of instr.args) { visitor(arg); } break;
    case 'convert': visitor(instr.operand); break;
    case 'select': visitor(instr.condition); visitor(instr.trueVal); visitor(instr.falseVal); break;
    case 'global_set': visitor(instr.value); break;
    case 'branch_if': visitor(instr.condition); break;
    case 'branch_table': visitor(instr.selector); break;
    case 'return': if (instr.value) { visitor(instr.value); } break;
  }
}

// Conservative: only catches intra-block dead assigns where the target is
// overwritten before any subsequent read within the same block.
/**
 * Hoists assignments that appear in both branches of an if/else to before the if.
 * When a variable is assigned different constant values (0/1) in each branch,
 * converts the pattern to a conditional expression: var = cond ? val1 : val2.
 */
function hoistCommonAssigns(node: LoweredNode): LoweredNode {
  switch (node.kind) {
    case 'sequence': {
      const children = node.children.map(child => hoistCommonAssigns(child));
      const result: LoweredNode[] = [];
      for (const child of children) {
        if (child.kind === 'if' && child.elseBody !== null) {
          const ifWithElse = child as LoweredNode & { kind: 'if'; elseBody: LoweredNode };
          const hoisted = tryHoistFromBranches(ifWithElse);
          if (hoisted) {
            for (const pre of hoisted.hoisted) { result.push(pre); }
            result.push(hoisted.remaining);
            continue;
          }
        }
        result.push(child);
      }
      if (result.length === 1) { return result[0]; }
      return { kind: 'sequence', children: result };
    }
    case 'if': {
      const thenBody = hoistCommonAssigns(node.thenBody);
      const elseBody = node.elseBody ? hoistCommonAssigns(node.elseBody) : null;
      const ifNode: LoweredNode = { kind: 'if', condition: node.condition, thenBody, elseBody };
      if (elseBody !== null) {
        const ifWithElse = ifNode as LoweredNode & { kind: 'if'; elseBody: LoweredNode };
        const hoisted = tryHoistFromBranches(ifWithElse);
        if (hoisted) {
          const parts = [...hoisted.hoisted];
          if (!isEmptyLowered(hoisted.remaining)) {
            parts.push(hoisted.remaining);
          }
          if (parts.length === 1) { return parts[0]; }
          return { kind: 'sequence', children: parts };
        }
      }
      return ifNode;
    }
    case 'while':
      return { kind: 'while', condition: node.condition, body: hoistCommonAssigns(node.body) };
    case 'do_while':
      return { kind: 'do_while', body: hoistCommonAssigns(node.body), condition: node.condition };
    case 'for':
      return { kind: 'for', init: node.init, condition: node.condition, increment: node.increment, body: hoistCommonAssigns(node.body) };
    case 'labeled_block':
      return { kind: 'labeled_block', label: node.label, body: hoistCommonAssigns(node.body) };
    case 'switch':
      return {
        kind: 'switch', selector: node.selector,
        cases: node.cases.map(caseEntry => ({ values: caseEntry.values, body: hoistCommonAssigns(caseEntry.body) })),
        defaultBody: hoistCommonAssigns(node.defaultBody),
      };
    default:
      return node;
  }
}

interface HoistResult {
  hoisted: LoweredNode[];
  remaining: LoweredNode;
}

function tryHoistFromBranches(ifNode: LoweredNode & { kind: 'if'; elseBody: LoweredNode }): HoistResult | null {
  const hoisted: LoweredNode[] = [];
  let thenBody = ifNode.thenBody;
  let elseBody = ifNode.elseBody;

  // Strategy 1: Hoist common assignments that appear in both branches with the
  // same value. The assignment must be the FIRST write to that variable in the branch
  // (so hoisting doesn't change the order of side effects).
  const thenFirstAssigns = collectFirstAssignPerVar(thenBody);
  const elseFirstAssigns = collectFirstAssignPerVar(elseBody);
  for (const [target, thenStmt] of thenFirstAssigns) {
    const elseStmt = elseFirstAssigns.get(target);
    if (!elseStmt) { continue; }
    if (!expressionsEqual(thenStmt.value, elseStmt.value)) { continue; }
    // Both branches assign the same value to this variable — safe to hoist
    hoisted.push({ kind: 'block', body: [thenStmt] });
    thenBody = removeFirstAssignTo(thenBody, target);
    elseBody = removeFirstAssignTo(elseBody, target);
  }

  // Strategy 2: When both branches assign different small constants (0/1) to the
  // SAME variable as their ONLY assignment to that variable, and neither branch
  // assigns it again, convert to ternary.
  const thenOnlyAssigns = collectUniqueAssigns(thenBody);
  const elseOnlyAssigns = collectUniqueAssigns(elseBody);
  for (const [target, elseStmt] of elseOnlyAssigns) {
    const thenStmt = thenOnlyAssigns.get(target);
    if (!thenStmt) { continue; }
    if (!isSmallConst(thenStmt.value) || !isSmallConst(elseStmt.value)) { continue; }
    if (expressionsEqual(thenStmt.value, elseStmt.value)) { continue; }
    const ternary: Statement = {
      kind: 'assign',
      target: thenStmt.target,
      type: thenStmt.type,
      value: { kind: 'select', condition: ifNode.condition, trueVal: thenStmt.value, falseVal: elseStmt.value },
    };
    hoisted.push({ kind: 'block', body: [ternary] });
    thenBody = removeAssignTo(thenBody, target);
    elseBody = removeAssignTo(elseBody, target);
  }

  if (hoisted.length === 0) {
    return null;
  }

  const thenEmpty = isEmptyLowered(thenBody);
  const elseEmpty = isEmptyLowered(elseBody);
  if (thenEmpty && elseEmpty) {
    return { hoisted, remaining: { kind: 'sequence', children: [] } };
  }
  const remaining: LoweredNode = { kind: 'if', condition: ifNode.condition, thenBody, elseBody: elseEmpty ? null : elseBody };
  return { hoisted, remaining };
}

/**
 * For each variable, find the first assignment in the node tree.
 * Only returns the first write to each variable (so hoisting is safe).
 */
function collectFirstAssignPerVar(node: LoweredNode): Map<string, Statement & { kind: 'assign' }> {
  const result = new Map<string, Statement & { kind: 'assign' }>();
  walkAssigns(node, (stmt) => {
    if (!result.has(stmt.target)) {
      result.set(stmt.target, stmt);
    }
  });
  return result;
}

function walkAssigns(node: LoweredNode, callback: (stmt: Statement & { kind: 'assign' }) => void): void {
  if (node.kind === 'block') {
    for (const stmt of node.body) {
      if (stmt.kind === 'assign') { callback(stmt); }
    }
  } else if (node.kind === 'sequence') {
    for (const child of node.children) { walkAssigns(child, callback); }
  }
  // Don't recurse into if/while/switch — those are conditional and not safe to hoist from
}

/**
 * Collects variables that are assigned exactly once in the node.
 * Returns a map of target → statement for variables with a single assignment.
 */
function collectUniqueAssigns(node: LoweredNode): Map<string, Statement & { kind: 'assign' }> {
  const all = new Map<string, { stmt: Statement & { kind: 'assign' }; count: number }>();
  collectAllAssigns(node, all);
  const result = new Map<string, Statement & { kind: 'assign' }>();
  for (const [target, entry] of all) {
    if (entry.count === 1) {
      result.set(target, entry.stmt);
    }
  }
  return result;
}

function collectAllAssigns(node: LoweredNode, out: Map<string, { stmt: Statement & { kind: 'assign' }; count: number }>): void {
  if (node.kind === 'block') {
    for (const stmt of node.body) {
      if (stmt.kind === 'assign') {
        const existing = out.get(stmt.target);
        if (existing) { existing.count++; }
        else { out.set(stmt.target, { stmt, count: 1 }); }
      }
    }
  } else if (node.kind === 'sequence') {
    for (const child of node.children) { collectAllAssigns(child, out); }
  }
}

function removeFirstAssignTo(node: LoweredNode, target: string): LoweredNode {
  if (node.kind === 'block') {
    for (let index = 0; index < node.body.length; index++) {
      if (node.body[index].kind === 'assign' && (node.body[index] as Statement & { kind: 'assign' }).target === target) {
        const remaining = [...node.body.slice(0, index), ...node.body.slice(index + 1)];
        if (remaining.length === 0) { return { kind: 'sequence', children: [] }; }
        return { kind: 'block', body: remaining };
      }
    }
  }
  if (node.kind === 'sequence') {
    for (let index = 0; index < node.children.length; index++) {
      const updated = removeFirstAssignTo(node.children[index], target);
      if (updated !== node.children[index]) {
        const children = [...node.children.slice(0, index), updated, ...node.children.slice(index + 1)].filter(child => !isEmptyLowered(child));
        if (children.length === 0) { return { kind: 'sequence', children: [] }; }
        if (children.length === 1) { return children[0]; }
        return { kind: 'sequence', children };
      }
    }
  }
  return node;
}

function removeAssignTo(node: LoweredNode, target: string): LoweredNode {
  if (node.kind === 'block') {
    const filtered = node.body.filter(stmt => !(stmt.kind === 'assign' && stmt.target === target));
    if (filtered.length === 0) { return { kind: 'sequence', children: [] }; }
    return { kind: 'block', body: filtered };
  }
  if (node.kind === 'sequence') {
    const children = node.children.map(child => removeAssignTo(child, target)).filter(child => !isEmptyLowered(child));
    if (children.length === 0) { return { kind: 'sequence', children: [] }; }
    if (children.length === 1) { return children[0]; }
    return { kind: 'sequence', children };
  }
  return node;
}

function expressionsEqual(expressionA: Expression, expressionB: Expression): boolean {
  if (expressionA.kind !== expressionB.kind) { return false; }
  if (expressionA.kind === 'const' && expressionB.kind === 'const') {
    return expressionA.value === expressionB.value;
  }
  if (expressionA.kind === 'var' && expressionB.kind === 'var') {
    return expressionA.name === expressionB.name;
  }
  return false;
}

function isSmallConst(expression: Expression): boolean {
  return expression.kind === 'const' && typeof expression.value === 'number' && expression.value >= 0 && expression.value <= 1;
}

function eliminateDeadAssigns(node: LoweredNode): LoweredNode {
  switch (node.kind) {
    case 'sequence':
      return { kind: 'sequence', children: node.children.map(child => eliminateDeadAssigns(child)) };
    case 'block': {
      const filtered: Statement[] = [];
      for (let index = 0; index < node.body.length; index++) {
        const current = node.body[index];
        // Skip self-assignments (var0 = var0)
        if (current.kind === 'assign' && current.value.kind === 'var' && current.value.name === current.target) {
          continue;
        }
        // Skip dead assigns: target overwritten before next read, with no side effects
        if (current.kind === 'assign' && !expressionHasSideEffect(current.value)) {
          let isDead = false;
          for (let scanIndex = index + 1; scanIndex < node.body.length; scanIndex++) {
            const later = node.body[scanIndex];
            if (later.kind === 'assign' && later.target === current.target) {
              isDead = true;
              break;
            }
            if (statementReadsVariable(later, current.target)) {
              break;
            }
          }
          if (isDead) {
            continue;
          }
        }
        filtered.push(current);
      }
      return { kind: 'block', body: filtered };
    }
    case 'if':
      return {
        kind: 'if', condition: node.condition,
        thenBody: eliminateDeadAssigns(node.thenBody),
        elseBody: node.elseBody ? eliminateDeadAssigns(node.elseBody) : null,
      };
    case 'while':
      return { kind: 'while', condition: node.condition, body: eliminateDeadAssigns(node.body) };
    case 'do_while':
      return { kind: 'do_while', body: eliminateDeadAssigns(node.body), condition: node.condition };
    case 'labeled_block':
      return { kind: 'labeled_block', label: node.label, body: eliminateDeadAssigns(node.body) };
    case 'switch':
      return {
        kind: 'switch', selector: node.selector,
        cases: node.cases.map(caseEntry => ({ values: caseEntry.values, body: eliminateDeadAssigns(caseEntry.body) })),
        defaultBody: eliminateDeadAssigns(node.defaultBody),
      };
    default:
      return node;
  }
}

function expressionHasSideEffect(expression: Expression): boolean {
  switch (expression.kind) {
    case 'call':
    case 'call_indirect':
      return true;
    case 'binary':
      return expressionHasSideEffect(expression.left) || expressionHasSideEffect(expression.right);
    case 'unary':
      return expressionHasSideEffect(expression.operand);
    case 'compare':
      return expressionHasSideEffect(expression.left) || expressionHasSideEffect(expression.right);
    case 'select':
      return expressionHasSideEffect(expression.condition) ||
        expressionHasSideEffect(expression.trueVal) || expressionHasSideEffect(expression.falseVal);
    case 'load':
      return false;
    case 'convert':
      return expressionHasSideEffect(expression.operand);
    case 'field_access':
      return expressionHasSideEffect(expression.base);
    default:
      return false;
  }
}

function extractConditionVariables(condition: Expression): string[] {
  const variables: string[] = [];
  function collect(expression: Expression): void {
    if (expression.kind === 'var') {
      variables.push(expression.name);
    } else if (expression.kind === 'binary' || expression.kind === 'compare') {
      collect(expression.left);
      collect(expression.right);
    } else if (expression.kind === 'unary') {
      collect(expression.operand);
    } else if (expression.kind === 'field_access') {
      collect(expression.base);
    }
  }
  collect(condition);
  return variables;
}

function extractAssignTo(node: LoweredNode, variableName: string): { statement: Statement & { kind: 'assign' }; remaining: LoweredNode | null } | null {
  if (node.kind === 'block') {
    for (let statementIndex = node.body.length - 1; statementIndex >= 0; statementIndex--) {
      const statement = node.body[statementIndex];
      if (statement.kind === 'assign' && statement.target === variableName) {
        const remainingBody = [...node.body.slice(0, statementIndex), ...node.body.slice(statementIndex + 1)];
        const remaining = remainingBody.length > 0 ? { kind: 'block' as const, body: remainingBody } : null;
        return { statement, remaining };
      }
      // Stop if this statement reads the variable (can't move init past a read)
      if (statementReadsVariable(statement, variableName)) {
        break;
      }
    }
  }
  if (node.kind === 'sequence' && node.children.length > 0) {
    // Try the last child first
    const lastChild = node.children[node.children.length - 1];
    const fromLast = extractAssignTo(lastChild, variableName);
    if (fromLast) {
      const newChildren = fromLast.remaining
        ? [...node.children.slice(0, -1), fromLast.remaining]
        : node.children.slice(0, -1);
      const remaining = newChildren.length > 0
        ? { kind: 'sequence' as const, children: newChildren }
        : null;
      return { statement: fromLast.statement, remaining };
    }
  }
  return null;
}

function removeTrailingContinue(node: LoweredNode): LoweredNode {
  if (node.kind === 'sequence' && node.children.length > 0) {
    const lastIndex = node.children.length - 1;
    if (node.children[lastIndex].kind === 'continue') {
      if (node.children.length === 1) { return { kind: 'sequence', children: [] }; }
      return { kind: 'sequence', children: node.children.slice(0, -1) };
    }
    const lastCleaned = removeTrailingContinue(node.children[lastIndex]);
    if (lastCleaned !== node.children[lastIndex]) {
      return { kind: 'sequence', children: [...node.children.slice(0, -1), lastCleaned] };
    }
  }
  if (node.kind === 'continue') {
    return { kind: 'sequence', children: [] };
  }
  return node;
}

function statementReadsVariable(statement: Statement, variableName: string): boolean {
  switch (statement.kind) {
    case 'assign':
      return expressionReferences(statement.value, variableName);
    case 'store':
      return expressionReferences(statement.address, variableName) || expressionReferences(statement.value, variableName);
    case 'call':
      return statement.args.some(arg => expressionReferences(arg, variableName));
    case 'call_indirect':
      return expressionReferences(statement.tableIndex, variableName) ||
        statement.args.some(arg => expressionReferences(arg, variableName));
    case 'global_set':
      return expressionReferences(statement.value, variableName);
    case 'return':
      return statement.value ? expressionReferences(statement.value, variableName) : false;
    case 'expr':
      return expressionReferences(statement.value, variableName);
    default:
      return false;
  }
}

/**
 * Reduces nesting depth by converting deep if-bodies into guard clauses.
 * Inside loops: `if (cond) { large_body }` → `if (!cond) continue; large_body`
 * Top-level: `if (cond) { rest }` → `if (!cond) return; rest`
 * Nested ifs: `if (a) { if (b) { body } }` → `if (a && b) { body }` (no-else only)
 */
function reduceNesting(node: LoweredNode): LoweredNode {
  switch (node.kind) {
    case 'sequence': {
      const children = node.children.map(child => reduceNesting(child));
      const flattened = flattenGuardClauses(children);
      if (flattened.length === 1) { return flattened[0]; }
      return { kind: 'sequence', children: flattened };
    }
    case 'if': {
      const thenBody = reduceNesting(node.thenBody);
      const elseBody = node.elseBody ? reduceNesting(node.elseBody) : null;
      // Merge nested if: if (a) { if (b) { body } } → if (a && b) { body }
      if (!elseBody && thenBody.kind === 'if' && !thenBody.elseBody) {
        const merged: Expression = { kind: 'binary', op: '&&', left: node.condition, right: thenBody.condition };
        return { kind: 'if', condition: merged, thenBody: thenBody.thenBody, elseBody: null };
      }
      return { kind: 'if', condition: node.condition, thenBody, elseBody };
    }
    case 'while': {
      const body = reduceNesting(node.body);
      const reduced = reduceLoopBody(body);
      return { kind: 'while', condition: node.condition, body: reduced };
    }
    case 'do_while': {
      const body = reduceNesting(node.body);
      return { kind: 'do_while', body: reduceLoopBody(body), condition: node.condition };
    }
    case 'for':
      return { kind: 'for', init: node.init, condition: node.condition, increment: node.increment, body: reduceNesting(node.body) };
    case 'labeled_block':
      return { kind: 'labeled_block', label: node.label, body: reduceNesting(node.body) };
    case 'switch':
      return {
        kind: 'switch', selector: node.selector,
        cases: node.cases.map(caseEntry => ({ values: caseEntry.values, body: reduceNesting(caseEntry.body) })),
        defaultBody: reduceNesting(node.defaultBody),
      };
    default:
      return node;
  }
}

/**
 * Inside a loop body, if the entire body is wrapped in a single if-without-else,
 * flip to a guard clause: `if (!cond) continue; body_contents`
 */
function reduceLoopBody(body: LoweredNode): LoweredNode {
  const children = getChildren(body);
  if (children.length === 1 && children[0].kind === 'if' && !children[0].elseBody) {
    const guardCondition = negateExpression(children[0].condition);
    const guardClause: LoweredNode = { kind: 'if', condition: guardCondition, thenBody: { kind: 'continue' }, elseBody: null };
    const innerChildren = getChildren(children[0].thenBody);
    return { kind: 'sequence', children: [guardClause, ...innerChildren] };
  }
  return body;
}

/**
 * In a sequence, when an if-without-else ends with return/break/continue,
 * pull the subsequent siblings out of the nesting.
 */
function flattenGuardClauses(children: LoweredNode[]): LoweredNode[] {
  const result: LoweredNode[] = [];
  for (let index = 0; index < children.length; index++) {
    const child = children[index];
    // If this is an if-without-else that ends with an exit, and there are more siblings after,
    // it's already a guard clause — no change needed.
    // But if this is an if-without-else wrapping remaining siblings, convert to guard.
    if (child.kind === 'if' && !child.elseBody && index === children.length - 1) {
      // Last child is an if wrapping everything — check if it's worth flipping
      const innerChildren = getChildren(child.thenBody);
      if (innerChildren.length >= 2) {
        const guardCondition = negateExpression(child.condition);
        const exitNode: LoweredNode = { kind: 'return', value: null };
        result.push({ kind: 'if', condition: guardCondition, thenBody: exitNode, elseBody: null });
        result.push(...innerChildren);
        continue;
      }
    }
    result.push(child);
  }
  return result;
}

function getChildren(node: LoweredNode): LoweredNode[] {
  if (node.kind === 'sequence') { return node.children; }
  return [node];
}

function cleanupLowered(node: LoweredNode): LoweredNode {
  switch (node.kind) {
    case 'sequence': {
      const cleaned: LoweredNode[] = [];
      for (const child of node.children) {
        const result = cleanupLowered(child);
        if (!isEmptyLowered(result)) {
          cleaned.push(result);
        }
      }
      if (cleaned.length === 0) { return { kind: 'sequence', children: [] }; }
      if (cleaned.length === 1) { return cleaned[0]; }
      return { kind: 'sequence', children: cleaned };
    }
    case 'if': {
      const thenBody = cleanupLowered(node.thenBody);
      const elseBody = node.elseBody ? cleanupLowered(node.elseBody) : null;
      if (isEmptyLowered(thenBody) && elseBody && !isEmptyLowered(elseBody)) {
        return { kind: 'if', condition: negateExpression(node.condition), thenBody: elseBody, elseBody: null };
      }
      if (isEmptyLowered(thenBody) && (!elseBody || isEmptyLowered(elseBody))) {
        return { kind: 'sequence', children: [] };
      }
      if (elseBody && isEmptyLowered(elseBody)) {
        return { kind: 'if', condition: node.condition, thenBody, elseBody: null };
      }
      return { kind: 'if', condition: node.condition, thenBody, elseBody };
    }
    case 'while':
      return { kind: 'while', condition: node.condition, body: removeTrailingContinue(cleanupLowered(node.body)) };
    case 'do_while':
      return { kind: 'do_while', body: removeTrailingContinue(cleanupLowered(node.body)), condition: node.condition };
    case 'labeled_block':
      return { kind: 'labeled_block', label: node.label, body: cleanupLowered(node.body) };
    case 'switch':
      return {
        kind: 'switch',
        selector: node.selector,
        cases: node.cases.map(caseEntry => ({ values: caseEntry.values, body: cleanupLowered(caseEntry.body) })),
        defaultBody: cleanupLowered(node.defaultBody),
      };
    default:
      return node;
  }
}

function isEmptyLowered(node: LoweredNode): boolean {
  if (node.kind === 'sequence' && node.children.length === 0) { return true; }
  if (node.kind === 'block' && node.body.length === 0) { return true; }
  return false;
}

function negateExpression(expression: Expression): Expression {
  if (expression.kind === 'compare') {
    const inverted = COMPARE_INVERT[expression.op];
    if (inverted) {
      return { kind: 'compare', op: inverted, left: expression.left, right: expression.right };
    }
  }
  if (expression.kind === 'unary' && expression.op === '!') {
    return expression.operand;
  }
  return { kind: 'unary', op: '!', operand: expression };
}

// Detects for-loop patterns at one nesting level (sequence → while pairs).
// Nested for-loops inside the body are detected by recursive descent but
// the init/increment extraction only looks at direct children of a sequence.
function detectForLoops(node: LoweredNode): LoweredNode {
  switch (node.kind) {
    case 'sequence': {
      const transformed = node.children.map(child => detectForLoops(child));
      const result: LoweredNode[] = [];
      for (let index = 0; index < transformed.length; index++) {
        const current = transformed[index];
        const next = transformed[index + 1];
        if (next && next.kind === 'while' && next.condition) {
          // Find condition variables
          const conditionVars = extractConditionVariables(next.condition);
          // Try each condition variable as potential loop counter
          let matched = false;
          for (const counterName of conditionVars) {
            const incrementStatement = extractTrailingIncrement(next.body, counterName);
            if (!incrementStatement) { continue; }
            // Find init in the preceding block
            const initResult = extractAssignTo(current, counterName);
            if (!initResult) { continue; }
            const bodyWithoutIncrement = removeIncrementAndContinue(next.body, counterName);
            if (initResult.remaining) {
              result.push(initResult.remaining);
            }
            result.push(detectForLoops({
              kind: 'for',
              init: initResult.statement,
              condition: next.condition,
              increment: incrementStatement,
              body: detectForLoops(bodyWithoutIncrement),
            }));
            index++;
            matched = true;
            break;
          }
          if (matched) { continue; }
        }
        result.push(current);
      }
      if (result.length === 1) {
        return result[0];
      }
      return { kind: 'sequence', children: result };
    }
    case 'if':
      return {
        kind: 'if',
        condition: node.condition,
        thenBody: detectForLoops(node.thenBody),
        elseBody: node.elseBody ? detectForLoops(node.elseBody) : null,
      };
    case 'while':
      return { kind: 'while', condition: node.condition, body: detectForLoops(node.body) };
    case 'do_while':
      return { kind: 'do_while', body: detectForLoops(node.body), condition: node.condition };
    case 'labeled_block':
      return { kind: 'labeled_block', label: node.label, body: detectForLoops(node.body) };
    case 'switch':
      return {
        kind: 'switch',
        selector: node.selector,
        cases: node.cases.map(caseEntry => ({ values: caseEntry.values, body: detectForLoops(caseEntry.body) })),
        defaultBody: detectForLoops(node.defaultBody),
      };
    default:
      return node;
  }
}

function extractTrailingIncrement(node: LoweredNode, variableName: string): Statement & { kind: 'assign' } | null {
  if (node.kind === 'block' && node.body.length > 0) {
    const lastStatement = node.body[node.body.length - 1];
    if (lastStatement.kind === 'assign' && lastStatement.target === variableName) {
      return lastStatement;
    }
  }
  if (node.kind === 'sequence' && node.children.length > 0) {
    // Skip trailing continue/break — the increment is before them
    let lastIndex = node.children.length - 1;
    while (lastIndex >= 0 && (node.children[lastIndex].kind === 'continue' || node.children[lastIndex].kind === 'break')) {
      lastIndex--;
    }
    if (lastIndex >= 0) {
      return extractTrailingIncrement(node.children[lastIndex], variableName);
    }
  }
  return null;
}

function removeIncrementAndContinue(node: LoweredNode, variableName: string): LoweredNode {
  if (node.kind === 'sequence') {
    const filtered: LoweredNode[] = [];
    for (const child of node.children) {
      if (child.kind === 'continue') { continue; }
      if (child.kind === 'block') {
        const withoutIncrement = removeTrailingAssignTo(child, variableName);
        if (withoutIncrement) {
          filtered.push(withoutIncrement);
        }
      } else {
        filtered.push(child);
      }
    }
    if (filtered.length === 0) { return { kind: 'sequence', children: [] }; }
    if (filtered.length === 1) { return filtered[0]; }
    return { kind: 'sequence', children: filtered };
  }
  if (node.kind === 'block') {
    return removeTrailingAssignTo(node, variableName) || { kind: 'sequence', children: [] };
  }
  if (node.kind === 'continue') {
    return { kind: 'sequence', children: [] };
  }
  if (node.kind === 'if') {
    return {
      kind: 'if',
      condition: node.condition,
      thenBody: removeIncrementAndContinue(node.thenBody, variableName),
      elseBody: node.elseBody ? removeIncrementAndContinue(node.elseBody, variableName) : null,
    };
  }
  if (node.kind === 'for') {
    return {
      kind: 'for',
      init: node.init,
      condition: node.condition,
      increment: node.increment,
      body: removeIncrementAndContinue(node.body, variableName),
    };
  }
  return node;
}

function removeTrailingAssignTo(node: LoweredNode & { kind: 'block' }, variableName: string): LoweredNode | null {
  const lastStatement = node.body[node.body.length - 1];
  if (lastStatement && lastStatement.kind === 'assign' && lastStatement.target === variableName) {
    if (node.body.length <= 1) { return null; }
    return { kind: 'block', body: node.body.slice(0, -1) };
  }
  return node;
}

function expressionReferences(expression: Expression, variableName: string): boolean {
  switch (expression.kind) {
    case 'var':
      return expression.name === variableName;
    case 'binary':
      return expressionReferences(expression.left, variableName) || expressionReferences(expression.right, variableName);
    case 'unary':
      return expressionReferences(expression.operand, variableName);
    case 'compare':
      return expressionReferences(expression.left, variableName) || expressionReferences(expression.right, variableName);
    case 'call':
      return expression.args.some(arg => expressionReferences(arg, variableName));
    case 'select':
      return expressionReferences(expression.condition, variableName) ||
        expressionReferences(expression.trueVal, variableName) ||
        expressionReferences(expression.falseVal, variableName);
    case 'load':
      return expressionReferences(expression.address, variableName);
    case 'convert':
      return expressionReferences(expression.operand, variableName);
    case 'field_access':
      return expressionReferences(expression.base, variableName);
    default:
      return false;
  }
}
