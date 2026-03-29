import { emitLowered } from '../../src/decompiler/LoweredEmitter';
import type { FieldResolver } from '../../src/decompiler/LoweredEmitter';
import type { LoweredNode, Statement, Expression } from '../../src/decompiler/ExpressionIR';
import { isVariable, isConst } from '../../src/decompiler/SsaBuilder';

describe('Emitter: Field Resolver', () => {
  test('produces arrow syntax when resolver matches', () => {
    const fieldAccess: Expression = {
      kind: 'field_access',
      base: { kind: 'var', name: 'player', type: 'i32' },
      offset: 4,
    };
    const stmt: Statement = {
      kind: 'assign', target: 'health', type: 'i32',
      value: { kind: 'load', address: fieldAccess, offset: 0, loadType: 'i32.load' },
    };
    const node: LoweredNode = { kind: 'block', body: [stmt] };
    const resolver: FieldResolver = {
      resolveField(baseName: string, offset: number) {
        if (baseName === 'player' && offset === 4) { return 'health'; }
        return null;
      },
    };
    const output = emitLowered(node, 'void test(int player)', new Set(['player']), resolver);
    expect(output).toContain('player->health');
  });

  test('produces bracket syntax without resolver', () => {
    const fieldAccess: Expression = {
      kind: 'field_access',
      base: { kind: 'var', name: 'ptr', type: 'i32' },
      offset: 8,
    };
    const stmt: Statement = {
      kind: 'assign', target: 'val', type: 'i32',
      value: { kind: 'load', address: fieldAccess, offset: 0, loadType: 'i32.load' },
    };
    const node: LoweredNode = { kind: 'block', body: [stmt] };
    const output = emitLowered(node, 'void test(int ptr)', new Set(['ptr']));
    expect(output).toContain('ptr[8]');
    expect(output).not.toContain('->');
  });

  test('store through field access', () => {
    const fieldAccess: Expression = {
      kind: 'field_access',
      base: { kind: 'var', name: 'obj', type: 'i32' },
      offset: 12,
    };
    const stmt: Statement = {
      kind: 'store', address: fieldAccess, offset: 0, storeType: 'i32.store',
      value: { kind: 'const', value: 42, type: 'i32' },
    };
    const node: LoweredNode = { kind: 'block', body: [stmt] };
    const resolver: FieldResolver = {
      resolveField(baseName: string, offset: number) {
        if (baseName === 'obj' && offset === 12) { return 'score'; }
        return null;
      },
    };
    const output = emitLowered(node, 'void test(int obj)', new Set(['obj']), resolver);
    expect(output).toContain('obj->score');
    expect(output).toContain('42');
  });
});

describe('SSA Type Guards', () => {
  test('isVariable', () => {
    expect(isVariable({ id: 0, name: 'x', type: 'i32', definedInBlock: 0 })).toBe(true);
    expect(isVariable({ kind: 'const' as const, value: 42, type: 'i32' })).toBe(false);
  });

  test('isConst', () => {
    expect(isConst({ kind: 'const' as const, value: 42, type: 'i32' })).toBe(true);
    expect(isConst({ id: 0, name: 'x', type: 'i32', definedInBlock: 0 })).toBe(false);
  });
});

describe('Emitter: Expression Precedence', () => {
  test('add then multiply gets parens', () => {
    const expr: Expression = {
      kind: 'binary', op: '*',
      left: { kind: 'binary', op: '+',
        left: { kind: 'var', name: 'a', type: 'i32' },
        right: { kind: 'var', name: 'b', type: 'i32' },
      },
      right: { kind: 'var', name: 'c', type: 'i32' },
    };
    const stmt: Statement = { kind: 'return', value: expr };
    const node: LoweredNode = { kind: 'block', body: [stmt] };
    const output = emitLowered(node, 'int test(int a, int b, int c)', new Set(['a', 'b', 'c']));
    expect(output).toContain('(a + b)');
  });

  test('multiply then add no parens needed', () => {
    const expr: Expression = {
      kind: 'binary', op: '+',
      left: { kind: 'binary', op: '*',
        left: { kind: 'var', name: 'a', type: 'i32' },
        right: { kind: 'var', name: 'b', type: 'i32' },
      },
      right: { kind: 'var', name: 'c', type: 'i32' },
    };
    const stmt: Statement = { kind: 'return', value: expr };
    const node: LoweredNode = { kind: 'block', body: [stmt] };
    const output = emitLowered(node, 'int test(int a, int b, int c)', new Set(['a', 'b', 'c']));
    expect(output).not.toContain('(a * b)');
    expect(output).toContain('a * b + c');
  });
});
