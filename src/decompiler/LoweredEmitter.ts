/**
 * LoweredEmitter — walks Expression/Statement/LoweredNode trees and emits pseudo-C.
 *
 * No SSA knowledge. No defMap. No expression cache.
 * Just a tree walker with operator precedence and formatting.
 */

import { Expression, Statement, LoweredNode } from './ExpressionIR';

/** Maps WASM value types to C-style type names for display. */
export const WASM_TO_C_TYPE: Record<string, string> = {
  'i32': 'int', 'i64': 'long', 'f32': 'float', 'f64': 'double', 'v128': 'v128',
  'funcref': 'funcref', 'externref': 'externref',
};

const PRECEDENCE: Record<string, number> = {
  '?:': 1, '||': 2, '&&': 3, '|': 4, '^': 5, '&': 6,
  '==': 7, '!=': 7, '<': 8, '>': 8, '<=': 8, '>=': 8, '<u': 8, '>u': 8, '<=u': 8, '>=u': 8,
  '<<': 9, '>>': 9, '>>>': 9, '+': 10, '-': 10,
  '*': 11, '/': 11, '%': 11, '/u': 11, '%u': 11,
  'unary': 12,
};

function cType(wasmType: string): string {
  return WASM_TO_C_TYPE[wasmType] || wasmType;
}

const LOAD_TYPE_CAST: Record<string, string> = {
  'i32.load8_s': 'byte',
  'i32.load8_u': 'ubyte',
  'i32.load16_s': 'short',
  'i32.load16_u': 'ushort',
  'i64.load8_s': 'byte',
  'i64.load8_u': 'ubyte',
  'i64.load16_s': 'short',
  'i64.load16_u': 'ushort',
  'i64.load32_s': 'int',
  'i64.load32_u': 'uint',
};

const UNSIGNED_OPS: Record<string, string> = {
  '<u': '<', '>u': '>', '<=u': '<=', '>=u': '>=', '/u': '/', '%u': '%',
};

export function emitLowered(
  node: LoweredNode,
  funcSignature: string,
  paramNames: Set<string>,
): string {
  const lines: string[] = [];
  let indent = 0;

  function emit(text: string): void {
    lines.push('  '.repeat(indent) + text);
  }

  emit(`${funcSignature} {`);
  indent++;

  // Collect and emit local declarations
  const declaredVars = new Set<string>();
  collectAssignTargets(node, declaredVars);
  const referencedVars = new Set<string>();
  collectReferencedVars(node, referencedVars);
  // Add referenced-but-not-assigned variables (e.g., stack frame pointers after prologue removal)
  for (const refVar of referencedVars) {
    declaredVars.add(refVar);
  }
  const varTypes = new Map<string, string>();
  collectAssignTypes(node, varTypes);
  for (const varName of declaredVars) {
    if (!paramNames.has(varName)) {
      const varType = cType(varTypes.get(varName) || 'i32');
      emit(`${varType} ${varName};`);
    }
  }
  const hasNonParamDeclarations = [...declaredVars].some(varName => !paramNames.has(varName));
  if (hasNonParamDeclarations) {
    emit('');
  }

  emitNode(node);

  // Remove trailing bare `return;` in void functions
  if (funcSignature.startsWith('void ') && lines.length > 0 && lines[lines.length - 1].trim() === 'return;') {
    lines.pop();
  }

  indent--;
  emit('}');

  return lines.join('\n');

  function emitNode(loweredNode: LoweredNode): void {
    switch (loweredNode.kind) {
      case 'sequence':
        for (const child of loweredNode.children) {
          emitNode(child);
          if (alwaysTerminates(child)) {
            break;
          }
        }
        break;

      case 'block':
        for (const stmt of loweredNode.body) {
          emitStatement(stmt);
          if (stmt.kind === 'return' || stmt.kind === 'unreachable') {
            break;
          }
        }
        break;

      case 'if': {
        const condStr = formatExpression(loweredNode.condition, 0);
        const hasThen = !isEmptyLowered(loweredNode.thenBody);
        const hasElse = loweredNode.elseBody && !isEmptyLowered(loweredNode.elseBody);

        if (!hasThen && !hasElse) {
          break;
        }

        emit(`if (${condStr}) {`);
        indent++;
        emitNode(loweredNode.thenBody);
        indent--;

        if (hasElse) {
          if (loweredNode.elseBody!.kind === 'if') {
            const elseCond = formatExpression(loweredNode.elseBody!.condition, 0);
            emit(`} else if (${elseCond}) {`);
            indent++;
            emitNode(loweredNode.elseBody!.thenBody);
            indent--;
            if (loweredNode.elseBody!.elseBody && !isEmptyLowered(loweredNode.elseBody!.elseBody)) {
              emit(`} else {`);
              indent++;
              emitNode(loweredNode.elseBody!.elseBody);
              indent--;
            }
            emit('}');
          } else {
            emit(`} else {`);
            indent++;
            emitNode(loweredNode.elseBody!);
            indent--;
            emit('}');
          }
        } else {
          emit('}');
        }
        break;
      }

      case 'while':
        if (loweredNode.condition) {
          emit(`while (${formatExpression(loweredNode.condition, 0)}) {`);
        } else {
          emit(`while (true) {`);
        }
        indent++;
        emitNode(loweredNode.body);
        indent--;
        emit('}');
        break;

      case 'do_while':
        emit('do {');
        indent++;
        emitNode(loweredNode.body);
        indent--;
        emit(`} while (${formatExpression(loweredNode.condition, 0)});`);
        break;

      case 'for': {
        const initStr = formatStatementInline(loweredNode.init);
        const condStr = formatExpression(loweredNode.condition, 0);
        const incrStr = formatStatementInline(loweredNode.increment);
        emit(`for (${initStr}; ${condStr}; ${incrStr}) {`);
        indent++;
        emitNode(loweredNode.body);
        indent--;
        emit('}');
        break;
      }

      case 'switch':
        emit(`switch (${formatExpression(loweredNode.selector, 0)}) {`);
        indent++;
        for (const caseEntry of loweredNode.cases) {
          for (const val of caseEntry.values) {
            emit(`case ${val}:`);
          }
          indent++;
          emitNode(caseEntry.body);
          if (!alwaysTerminates(caseEntry.body)) {
            emit('break;');
          }
          indent--;
        }
        if (!isEmptyLowered(loweredNode.defaultBody)) {
          emit('default:');
          indent++;
          emitNode(loweredNode.defaultBody);
          indent--;
        }
        indent--;
        emit('}');
        break;

      case 'break':
        emit('break;');
        break;

      case 'continue':
        emit('continue;');
        break;

      case 'return':
        if (loweredNode.value) {
          emit(`return ${formatExpression(loweredNode.value, 0)};`);
        } else {
          emit('return;');
        }
        break;

      case 'unreachable':
        emit('unreachable();');
        break;

      case 'labeled_block':
        emit(`${loweredNode.label}: {`);
        indent++;
        emitNode(loweredNode.body);
        indent--;
        emit('}');
        break;

      case 'labeled_break':
        emit(`break ${loweredNode.label};`);
        break;

      case 'labeled_continue':
        emit(`continue ${loweredNode.label};`);
        break;
    }
  }

  function emitStatement(stmt: Statement): void {
    switch (stmt.kind) {
      case 'assign':
        emit(`${stmt.target} = ${formatExpression(stmt.value, 0)};`);
        break;
      case 'store': {
        if (stmt.address.kind === 'field_access') {
          const base = formatExpression(stmt.address.base, 100);
          emit(`${base}[${stmt.address.offset}] = ${formatExpression(stmt.value, 0)};`);
        } else {
          const addr = formatExpression(stmt.address, 0);
          const offsetStr = stmt.offset > 0 ? (addr === '0' ? String(stmt.offset) : `${addr} + ${stmt.offset}`) : addr;
          emit(`memory[${offsetStr}] = ${formatExpression(stmt.value, 0)};`);
        }
        break;
      }
      case 'call':
        if (stmt.result) {
          emit(`${stmt.result} = ${stmt.name}(${stmt.args.map(a => formatExpression(a, 0)).join(', ')});`);
        } else {
          emit(`${stmt.name}(${stmt.args.map(a => formatExpression(a, 0)).join(', ')});`);
        }
        break;
      case 'call_indirect': {
        const tableIdx = formatExpression(stmt.tableIndex, 0);
        const argsStr = stmt.args.map(a => formatExpression(a, 0)).join(', ');
        if (stmt.result) {
          emit(`${stmt.result} = table[${tableIdx}](${argsStr});`);
        } else {
          emit(`table[${tableIdx}](${argsStr});`);
        }
        break;
      }
      case 'global_set':
        emit(`${stmt.name} = ${formatExpression(stmt.value, 0)};`);
        break;
      case 'return':
        if (stmt.value) {
          emit(`return ${formatExpression(stmt.value, 0)};`);
        } else {
          emit('return;');
        }
        break;
      case 'unreachable':
        emit('unreachable();');
        break;
      case 'expr':
        emit(`${formatExpression(stmt.value, 0)};`);
        break;
    }
  }

  function formatExpression(expr: Expression, parentPrec: number): string {
    switch (expr.kind) {
      case 'var':
        return expr.name;
      case 'const':
        return String(expr.value);
      case 'string_literal':
        return expr.value;
      case 'global':
        return expr.name;
      case 'binary': {
        if (expr.op === '[]') {
          return `${formatExpression(expr.left, 100)}[${formatExpression(expr.right, 0)}]`;
        }
        // Strength reduction: x << N → x * 2^N for readability
        if (expr.op === '<<' && expr.right.kind === 'const' && typeof expr.right.value === 'number' && expr.right.value >= 1 && expr.right.value <= 3) {
          const multiplier = 1 << (expr.right.value as number);
          const prec = PRECEDENCE['*'] || 10;
          const left = formatExpression(expr.left, prec);
          return maybeWrap(`${left} * ${multiplier}`, prec, parentPrec);
        }
        const unsigned = UNSIGNED_OPS[expr.op];
        if (unsigned) {
          const left = `(unsigned)${formatExpression(expr.left, PRECEDENCE['unary'])}`;
          const right = `(unsigned)${formatExpression(expr.right, PRECEDENCE['unary'])}`;
          return maybeWrap(`${left} ${unsigned} ${right}`, PRECEDENCE[expr.op] || 10, parentPrec);
        }
        const prec = PRECEDENCE[expr.op] || 10;
        const left = formatExpression(expr.left, prec);
        const right = formatExpression(expr.right, prec + 1);
        return maybeWrap(`${left} ${expr.op} ${right}`, prec, parentPrec);
      }
      case 'compare': {
        const unsigned = UNSIGNED_OPS[expr.op];
        if (unsigned) {
          const left = `(unsigned)${formatExpression(expr.left, PRECEDENCE['unary'])}`;
          const right = `(unsigned)${formatExpression(expr.right, PRECEDENCE['unary'])}`;
          return maybeWrap(`${left} ${unsigned} ${right}`, PRECEDENCE[expr.op] || 8, parentPrec);
        }
        const prec = PRECEDENCE[expr.op] || 8;
        const left = formatExpression(expr.left, prec);
        const right = formatExpression(expr.right, prec + 1);
        return maybeWrap(`${left} ${expr.op} ${right}`, prec, parentPrec);
      }
      case 'unary': {
        const operand = formatExpression(expr.operand, PRECEDENCE['unary']);
        if (expr.op === '!') {
          return maybeWrap(`!${operand}`, PRECEDENCE['unary'], parentPrec);
        }
        if (expr.op === 'neg' || expr.op === '-') {
          return maybeWrap(`-${operand}`, PRECEDENCE['unary'], parentPrec);
        }
        return `${expr.op}(${formatExpression(expr.operand, 0)})`;
      }
      case 'load': {
        if (expr.address.kind === 'field_access') {
          const base = formatExpression(expr.address.base, 100);
          const fieldAccess = `${base}[${expr.address.offset}]`;
          const loadCast = LOAD_TYPE_CAST[expr.loadType];
          if (loadCast) {
            return `(${loadCast})${fieldAccess}`;
          }
          return fieldAccess;
        }
        const addr = formatExpression(expr.address, 0);
        const offsetStr = expr.offset > 0 ? (addr === '0' ? String(expr.offset) : `${addr} + ${expr.offset}`) : addr;
        const loadCast = LOAD_TYPE_CAST[expr.loadType];
        if (loadCast) {
          return `(${loadCast})memory[${offsetStr}]`;
        }
        return `memory[${offsetStr}]`;
      }
      case 'call':
        return `${expr.name}(${expr.args.map(a => formatExpression(a, 0)).join(', ')})`;
      case 'call_indirect':
        return `table[${formatExpression(expr.tableIndex, 0)}](${expr.args.map(a => formatExpression(a, 0)).join(', ')})`;
      case 'select':
        return maybeWrap(
          `${formatExpression(expr.condition, PRECEDENCE['?:'])} ? ${formatExpression(expr.trueVal, PRECEDENCE['?:'])} : ${formatExpression(expr.falseVal, PRECEDENCE['?:'])}`,
          PRECEDENCE['?:'],
          parentPrec,
        );
      case 'convert': {
        const operand = formatExpression(expr.operand, PRECEDENCE['unary']);
        if (expr.op.startsWith('(')) {
          return `${expr.op}${operand}`;
        }
        return `${expr.op}(${formatExpression(expr.operand, 0)})`;
      }
      case 'field_access': {
        const base = formatExpression(expr.base, 100);
        return `${base}[${expr.offset}]`;
      }
    }
  }

  function formatStatementInline(stmt: Statement): string {
    if (stmt.kind === 'assign') {
      return `${stmt.target} = ${formatExpression(stmt.value, 0)}`;
    }
    return '';
  }

  function maybeWrap(text: string, exprPrec: number, parentPrec: number): string {
    return exprPrec < parentPrec ? `(${text})` : text;
  }
}

function isEmptyLowered(node: LoweredNode): boolean {
  if (node.kind === 'sequence' && node.children.length === 0) { return true; }
  if (node.kind === 'block' && node.body.length === 0) { return true; }
  return false;
}

function collectAssignTargets(node: LoweredNode, targets: Set<string>): void {
  switch (node.kind) {
    case 'sequence':
      for (const child of node.children) { collectAssignTargets(child, targets); }
      break;
    case 'block':
      for (const stmt of node.body) {
        if (stmt.kind === 'assign') { targets.add(stmt.target); }
        if (stmt.kind === 'call' && stmt.result) { targets.add(stmt.result); }
        if (stmt.kind === 'call_indirect' && stmt.result) { targets.add(stmt.result); }
      }
      break;
    case 'if':
      collectAssignTargets(node.thenBody, targets);
      if (node.elseBody) { collectAssignTargets(node.elseBody, targets); }
      break;
    case 'while':
      collectAssignTargets(node.body, targets);
      break;
    case 'do_while':
      collectAssignTargets(node.body, targets);
      break;
    case 'labeled_block':
      collectAssignTargets(node.body, targets);
      break;
    case 'for':
      if (node.init.kind === 'assign') { targets.add(node.init.target); }
      if (node.increment.kind === 'assign') { targets.add(node.increment.target); }
      collectAssignTargets(node.body, targets);
      break;
    case 'switch':
      for (const c of node.cases) { collectAssignTargets(c.body, targets); }
      collectAssignTargets(node.defaultBody, targets);
      break;
  }
}

function collectAssignTypes(node: LoweredNode, types: Map<string, string>): void {
  switch (node.kind) {
    case 'sequence':
      for (const child of node.children) { collectAssignTypes(child, types); }
      break;
    case 'block':
      for (const stmt of node.body) {
        if (stmt.kind === 'assign' && !types.has(stmt.target)) { types.set(stmt.target, stmt.type); }
      }
      break;
    case 'if':
      collectAssignTypes(node.thenBody, types);
      if (node.elseBody) { collectAssignTypes(node.elseBody, types); }
      break;
    case 'while': collectAssignTypes(node.body, types); break;
    case 'do_while': collectAssignTypes(node.body, types); break;
    case 'for':
      if (node.init.kind === 'assign' && !types.has(node.init.target)) { types.set(node.init.target, node.init.type); }
      if (node.increment.kind === 'assign' && !types.has(node.increment.target)) { types.set(node.increment.target, node.increment.type); }
      collectAssignTypes(node.body, types);
      break;
    case 'labeled_block': collectAssignTypes(node.body, types); break;
    case 'switch':
      for (const c of node.cases) { collectAssignTypes(c.body, types); }
      collectAssignTypes(node.defaultBody, types);
      break;
  }
}

function collectReferencedVars(node: LoweredNode, refs: Set<string>): void {
  function scanExpr(expr: Expression): void {
    if (expr.kind === 'var') { refs.add(expr.name); }
    if (expr.kind === 'binary') { scanExpr(expr.left); scanExpr(expr.right); }
    if (expr.kind === 'unary') { scanExpr(expr.operand); }
    if (expr.kind === 'compare') { scanExpr(expr.left); scanExpr(expr.right); }
    if (expr.kind === 'load') { scanExpr(expr.address); }
    if (expr.kind === 'call') { for (const arg of expr.args) { scanExpr(arg); } }
    if (expr.kind === 'call_indirect') { scanExpr(expr.tableIndex); for (const arg of expr.args) { scanExpr(arg); } }
    if (expr.kind === 'select') { scanExpr(expr.condition); scanExpr(expr.trueVal); scanExpr(expr.falseVal); }
    if (expr.kind === 'convert') { scanExpr(expr.operand); }
    if (expr.kind === 'field_access') { scanExpr(expr.base); }
  }
  function scanStmt(stmt: Statement): void {
    if (stmt.kind === 'assign') { scanExpr(stmt.value); }
    if (stmt.kind === 'store') { scanExpr(stmt.address); scanExpr(stmt.value); }
    if (stmt.kind === 'call') { for (const arg of stmt.args) { scanExpr(arg); } }
    if (stmt.kind === 'call_indirect') { scanExpr(stmt.tableIndex); for (const arg of stmt.args) { scanExpr(arg); } }
    if (stmt.kind === 'global_set') { scanExpr(stmt.value); }
    if (stmt.kind === 'return' && stmt.value) { scanExpr(stmt.value); }
  }
  switch (node.kind) {
    case 'sequence': for (const child of node.children) { collectReferencedVars(child, refs); } break;
    case 'block': for (const stmt of node.body) { scanStmt(stmt); } break;
    case 'if': if (node.condition) { scanExpr(node.condition); } collectReferencedVars(node.thenBody, refs); if (node.elseBody) { collectReferencedVars(node.elseBody, refs); } break;
    case 'while': if (node.condition) { scanExpr(node.condition); } collectReferencedVars(node.body, refs); break;
    case 'do_while': collectReferencedVars(node.body, refs); scanExpr(node.condition); break;
    case 'for': scanStmt(node.init); scanExpr(node.condition); scanStmt(node.increment); collectReferencedVars(node.body, refs); break;
    case 'labeled_block': collectReferencedVars(node.body, refs); break;
    case 'switch': scanExpr(node.selector); for (const c of node.cases) { collectReferencedVars(c.body, refs); } collectReferencedVars(node.defaultBody, refs); break;
    case 'return': if (node.value) { scanExpr(node.value); } break;
  }
}

function alwaysTerminates(node: LoweredNode): boolean {
  switch (node.kind) {
    case 'return':
    case 'break':
    case 'continue':
    case 'unreachable':
    case 'labeled_break':
    case 'labeled_continue':
      return true;
    case 'sequence':
      return node.children.length > 0 && alwaysTerminates(node.children[node.children.length - 1]);
    case 'block':
      return node.body.length > 0 && node.body[node.body.length - 1].kind === 'return';
    case 'if':
      return node.elseBody !== null && alwaysTerminates(node.thenBody) && alwaysTerminates(node.elseBody);
    default:
      return false;
  }
}

