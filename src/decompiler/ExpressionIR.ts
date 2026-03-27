/**
 * Expression IR — the output of SSA lowering, consumed by the code emitter.
 *
 * Expressions are pure value trees with no SSA variable IDs, no phi nodes.
 * Variables are resolved to names. Constants are inlined.
 * This is the boundary between analysis (SSA) and output (pseudo-C).
 */

export type Expression =
  | { kind: 'var'; name: string; type: string }
  | { kind: 'const'; value: number | bigint; type: string }
  | { kind: 'binary'; op: string; left: Expression; right: Expression }
  | { kind: 'unary'; op: string; operand: Expression }
  | { kind: 'compare'; op: string; left: Expression; right: Expression }
  | { kind: 'load'; address: Expression; offset: number; loadType: string }
  | { kind: 'call'; name: string; args: Expression[] }
  | { kind: 'call_indirect'; tableIndex: Expression; args: Expression[] }
  | { kind: 'select'; condition: Expression; trueVal: Expression; falseVal: Expression }
  | { kind: 'convert'; op: string; operand: Expression }
  | { kind: 'global'; name: string }
  | { kind: 'string_literal'; value: string; address: number }
  | { kind: 'field_access'; base: Expression; offset: number };

export type Statement =
  | { kind: 'assign'; target: string; type: string; value: Expression }
  | { kind: 'store'; address: Expression; offset: number; storeType: string; value: Expression }
  | { kind: 'call'; name: string; args: Expression[]; result: string | null }
  | { kind: 'call_indirect'; tableIndex: Expression; args: Expression[]; result: string | null }
  | { kind: 'global_set'; name: string; value: Expression }
  | { kind: 'return'; value: Expression | null }
  | { kind: 'unreachable' }
  | { kind: 'expr'; value: Expression };

/**
 * LoweredNode replaces StructuredNode for code emission.
 * Same control flow structure, but block bodies are Statement[] not SsaInstr[].
 */
export type LoweredNode =
  | { kind: 'sequence'; children: LoweredNode[] }
  | { kind: 'block'; body: Statement[] }
  | { kind: 'if'; condition: Expression; thenBody: LoweredNode; elseBody: LoweredNode | null }
  | { kind: 'while'; condition: Expression | null; body: LoweredNode }
  | { kind: 'do_while'; body: LoweredNode; condition: Expression }
  | { kind: 'for'; init: Statement; condition: Expression; increment: Statement; body: LoweredNode }
  | { kind: 'switch'; selector: Expression; cases: { values: number[]; body: LoweredNode }[]; defaultBody: LoweredNode }
  | { kind: 'break' }
  | { kind: 'continue' }
  | { kind: 'return'; value: Expression | null }
  | { kind: 'unreachable' }
  | { kind: 'labeled_block'; label: string; body: LoweredNode }
  | { kind: 'labeled_break'; label: string }
  | { kind: 'labeled_continue'; label: string };
