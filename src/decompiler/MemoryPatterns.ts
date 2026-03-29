/**
 * Memory pattern detection — recognizes struct field access and array indexing
 * in Expression trees.
 *
 * Struct pattern: load/store at base + constant_offset → base->field_N
 * Array pattern: load/store at base + (index << N) → base[index]
 */

import { Expression, Statement, LoweredNode } from './ExpressionIR';

/**
 * Transform memory access expressions in a lowered tree.
 * Rewrites load expressions:
 * - load(binary(+, var, const)) → load with named offset (struct-like)
 * - load(binary(+, var, binary(<<, index, const))) → array-like
 */
function extractArrayIndex(expression: Expression): Expression | null {
  // index << N (power-of-2 element size)
  if (expression.kind === 'binary' && expression.op === '<<' && expression.right.kind === 'const') {
    const shift = Number(expression.right.value);
    if (shift >= 1 && shift <= 4) {
      return expression.left;
    }
  }
  // index * elementSize (any element size >= 2)
  if (expression.kind === 'binary' && expression.op === '*') {
    if (expression.right.kind === 'const') {
      const elementSize = Number(expression.right.value);
      if (elementSize >= 2 && elementSize <= 256) {
        return expression.left;
      }
    }
    if (expression.left.kind === 'const') {
      const elementSize = Number(expression.left.value);
      if (elementSize >= 2 && elementSize <= 256) {
        return expression.right;
      }
    }
  }
  return null;
}

export function annotateMemoryPatterns(node: LoweredNode, frameVarName?: string | null): LoweredNode {
  // Pass 1: collect struct pointer candidates (variables used as base with 2+ distinct offsets)
  const baseOffsets = new Map<string, Set<number>>();
  collectMemoryBases(node, baseOffsets);
  // A variable qualifies as a struct pointer if it is used as a memory base
  // with at least 2 distinct constant offsets, indicating field-like access patterns.
  // Exclude the stack frame pointer — it's a buffer, not a struct.
  const structBases = new Set<string>();
  for (const [baseName, offsets] of baseOffsets) {
    if (offsets.size >= 2 && baseName !== frameVarName) {
      structBases.add(baseName);
    }
  }
  // Pass 2: transform patterns
  return transformNode(node, structBases);
}

function collectMemoryBases(node: LoweredNode, bases: Map<string, Set<number>>): void {
  function collectFromExpr(expression: Expression): void {
    if (expression.kind === 'load') {
      collectFromExpr(expression.address);
      recordBase(expression.address, expression.offset);
    } else if (expression.kind === 'binary') {
      collectFromExpr(expression.left);
      collectFromExpr(expression.right);
    } else if (expression.kind === 'unary') {
      collectFromExpr(expression.operand);
    } else if (expression.kind === 'compare') {
      collectFromExpr(expression.left);
      collectFromExpr(expression.right);
    } else if (expression.kind === 'select') {
      collectFromExpr(expression.condition);
      collectFromExpr(expression.trueVal);
      collectFromExpr(expression.falseVal);
    } else if (expression.kind === 'call') {
      for (const arg of expression.args) { collectFromExpr(arg); }
    } else if (expression.kind === 'convert') {
      collectFromExpr(expression.operand);
    } else if (expression.kind === 'field_access') {
      collectFromExpr(expression.base);
    }
  }

  function recordBase(address: Expression, instrOffset: number): void {
    // Pattern: var + const
    if (address.kind === 'binary' && address.op === '+' && address.left.kind === 'var' && address.right.kind === 'const') {
      const baseName = address.left.name;
      const offset = Number(address.right.value) + instrOffset;
      if (!bases.has(baseName)) { bases.set(baseName, new Set()); }
      bases.get(baseName)!.add(offset);
    }
    // Pattern: var (with instruction offset > 0)
    if (address.kind === 'var' && instrOffset > 0) {
      const baseName = address.name;
      if (!bases.has(baseName)) { bases.set(baseName, new Set()); }
      bases.get(baseName)!.add(instrOffset);
      bases.get(baseName)!.add(0);
    }
  }

  function collectFromStmt(statement: Statement): void {
    switch (statement.kind) {
      case 'assign': collectFromExpr(statement.value); break;
      case 'store': collectFromExpr(statement.address); collectFromExpr(statement.value); recordBase(statement.address, statement.offset); break;
      case 'call': for (const arg of statement.args) { collectFromExpr(arg); } break;
      case 'call_indirect': collectFromExpr(statement.tableIndex); for (const arg of statement.args) { collectFromExpr(arg); } break;
      case 'global_set': collectFromExpr(statement.value); break;
      case 'return': if (statement.value) { collectFromExpr(statement.value); } break;
    }
  }

  switch (node.kind) {
    case 'sequence': for (const child of node.children) { collectMemoryBases(child, bases); } break;
    case 'block': for (const statement of node.body) { collectFromStmt(statement); } break;
    case 'if': collectMemoryBases(node.thenBody, bases); if (node.elseBody) { collectMemoryBases(node.elseBody, bases); } break;
    case 'while': collectMemoryBases(node.body, bases); break;
    case 'do_while': collectMemoryBases(node.body, bases); break;
    case 'for': collectMemoryBases(node.body, bases); break;
    case 'switch': for (const c of node.cases) { collectMemoryBases(c.body, bases); } collectMemoryBases(node.defaultBody, bases); break;
    case 'labeled_block': collectMemoryBases(node.body, bases); break;
  }
}

function transformNode(node: LoweredNode, structBases: Set<string>): LoweredNode {
  const xNode = (childNode: LoweredNode) => transformNode(childNode, structBases);
  const xExpr = (expression: Expression) => transformExpr(expression, structBases);
  const xStmt = (statement: Statement) => transformStatement(statement, structBases);
  switch (node.kind) {
    case 'sequence':
      return { kind: 'sequence', children: node.children.map(xNode) };
    case 'block':
      return { kind: 'block', body: node.body.map(xStmt) };
    case 'if':
      return { kind: 'if', condition: xExpr(node.condition), thenBody: xNode(node.thenBody), elseBody: node.elseBody ? xNode(node.elseBody) : null };
    case 'while':
      return { kind: 'while', condition: node.condition ? xExpr(node.condition) : null, body: xNode(node.body) };
    case 'do_while':
      return { kind: 'do_while', body: xNode(node.body), condition: xExpr(node.condition) };
    case 'for':
      return { kind: 'for', init: xStmt(node.init), condition: xExpr(node.condition), increment: xStmt(node.increment), body: xNode(node.body) };
    case 'switch':
      return { kind: 'switch', selector: xExpr(node.selector), cases: node.cases.map(c => ({ values: c.values, body: xNode(c.body) })), defaultBody: xNode(node.defaultBody) };
    case 'labeled_block':
      return { kind: 'labeled_block', label: node.label, body: xNode(node.body) };
    default:
      return node;
  }
}

function transformStatement(statement: Statement, structBases: Set<string>): Statement {
  const xExpr = (expression: Expression) => transformExpr(expression, structBases);
  switch (statement.kind) {
    case 'assign':
      return { kind: 'assign', target: statement.target, type: statement.type, value: xExpr(statement.value) };
    case 'store': {
      const address = xExpr(statement.address);
      const value = xExpr(statement.value);
      // Skip struct/array pattern detection for v128 and atomic stores
      if (statement.storeType.includes('v128') || statement.storeType.includes('atomic')) {
        return { kind: 'store', address, offset: statement.offset, storeType: statement.storeType, value };
      }
      // Struct field store: base + const where base is a struct pointer
      const structStore = tryStructAccess(address, statement.offset, structBases);
      if (structStore) {
        return { kind: 'store', address: structStore, offset: 0, storeType: statement.storeType, value };
      }
      // Array store: base + (index << N) or base + (index * elementSize)
      if (address.kind === 'binary' && address.op === '+') {
        const arrayIndex = extractArrayIndex(address.right) || extractArrayIndex(address.left);
        const arrayBase = arrayIndex === address.right ? address.left : address.right;
        if (arrayIndex && arrayBase !== arrayIndex) {
          return { kind: 'store', address: { kind: 'binary', op: '[]', left: arrayBase, right: arrayIndex }, offset: statement.offset, storeType: statement.storeType, value };
        }
      }
      return { kind: 'store', address, offset: statement.offset, storeType: statement.storeType, value };
    }
    case 'call':
      return { kind: 'call', name: statement.name, args: statement.args.map(xExpr), result: statement.result };
    case 'call_indirect':
      return { kind: 'call_indirect', tableIndex: xExpr(statement.tableIndex), args: statement.args.map(xExpr), result: statement.result };
    case 'global_set':
      return { kind: 'global_set', name: statement.name, value: xExpr(statement.value) };
    case 'return':
      return { kind: 'return', value: statement.value ? xExpr(statement.value) : null };
    default:
      return statement;
  }
}

function tryStructAccess(address: Expression, instrOffset: number, structBases: Set<string>): Expression | null {
  // Pattern: var + const where var is a struct base
  if (address.kind === 'binary' && address.op === '+' && address.left.kind === 'var' && address.right.kind === 'const') {
    if (structBases.has(address.left.name)) {
      const totalOffset = Number(address.right.value) + instrOffset;
      return { kind: 'field_access', base: address.left, offset: totalOffset };
    }
  }
  // Pattern: var with instrOffset > 0
  if (address.kind === 'var' && instrOffset > 0 && structBases.has(address.name)) {
    return { kind: 'field_access', base: address, offset: instrOffset };
  }
  return null;
}

function transformExpr(expression: Expression, structBases: Set<string>): Expression {
  const xExpr = (childExpr: Expression) => transformExpr(childExpr, structBases);
  switch (expression.kind) {
    case 'load': {
      const address = xExpr(expression.address);
      // Skip struct/array pattern detection for v128 and atomic loads
      if (expression.loadType.includes('v128') || expression.loadType.includes('atomic')) {
        return { kind: 'load', address, offset: expression.offset, loadType: expression.loadType };
      }
      // Struct field access: base + const where base is a struct pointer
      const structAccess = tryStructAccess(address, expression.offset, structBases);
      if (structAccess) {
        return { kind: 'load', address: structAccess, offset: 0, loadType: expression.loadType };
      }
      // Array access: base + (index << N) or base + (index * elementSize)
      if (address.kind === 'binary' && address.op === '+') {
        const arrayIndex = extractArrayIndex(address.right) || extractArrayIndex(address.left);
        const arrayBase = arrayIndex === address.right ? address.left : address.right;
        if (arrayIndex && arrayBase !== arrayIndex) {
          return { kind: 'load', address: { kind: 'binary', op: '[]', left: arrayBase, right: arrayIndex }, offset: expression.offset, loadType: expression.loadType };
        }
      }
      return { kind: 'load', address, offset: expression.offset, loadType: expression.loadType };
    }
    case 'binary':
      return { kind: 'binary', op: expression.op, left: xExpr(expression.left), right: xExpr(expression.right) };
    case 'unary':
      return { kind: 'unary', op: expression.op, operand: xExpr(expression.operand) };
    case 'compare':
      return { kind: 'compare', op: expression.op, left: xExpr(expression.left), right: xExpr(expression.right) };
    case 'select':
      return { kind: 'select', condition: xExpr(expression.condition), trueVal: xExpr(expression.trueVal), falseVal: xExpr(expression.falseVal) };
    case 'convert':
      return { kind: 'convert', op: expression.op, operand: xExpr(expression.operand) };
    case 'call':
      return { kind: 'call', name: expression.name, args: expression.args.map(xExpr) };
    case 'call_indirect':
      return { kind: 'call_indirect', tableIndex: xExpr(expression.tableIndex), args: expression.args.map(xExpr) };
    case 'field_access':
      return { kind: 'field_access', base: xExpr(expression.base), offset: expression.offset };
    default:
      return expression;
  }
}
