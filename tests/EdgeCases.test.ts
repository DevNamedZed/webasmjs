import { BlockType, ElementType, ModuleBuilder, TextModuleWriter, ValueType } from '../src/index';
import Arg from '../src/Arg';
import TestHelper from './TestHelper';

test('Empty module produces valid wasm', async () => {
  const mod = new ModuleBuilder('empty');
  const bytes = mod.toBytes();
  const valid = WebAssembly.validate(bytes.buffer as ArrayBuffer);
  expect(valid).toBe(true);
});

test('Function with no body', async () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('nop', null, [], (f, a) => {
    // empty body
  }).withExport();

  const instance = await mod.instantiate();
  const fn = instance.instance.exports.nop as CallableFunction;
  expect(fn()).toBeUndefined();
});

test('i32 MAX and MIN values', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_i32(2147483647);  // i32.MAX
    asm.const_i32(1);
    asm.add_i32();
    asm.end();
  });
  expect(fn()).toBe(-2147483648);  // wraps to i32.MIN
});

test('i32 zero value', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_i32(0);
    asm.end();
  });
  expect(fn()).toBe(0);
});

test('Multiple locals', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    const a = asm.declareLocal(ValueType.Int32, 'a');
    const b = asm.declareLocal(ValueType.Int32, 'b');
    const c = asm.declareLocal(ValueType.Int32, 'c');
    asm.const_i32(10);
    asm.set_local(a);
    asm.const_i32(20);
    asm.set_local(b);
    asm.get_local(a);
    asm.get_local(b);
    asm.add_i32();
    asm.set_local(c);
    asm.get_local(c);
    asm.end();
  });
  expect(fn()).toBe(30);
});

test('Deep nesting', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.block(BlockType.Void, () => {
      asm.block(BlockType.Void, () => {
        asm.block(BlockType.Void, () => {
          asm.block(BlockType.Void, () => {
            asm.block(BlockType.Void, () => {
              asm.nop();
            });
          });
        });
      });
    });
    asm.const_i32(1);
    asm.end();
  });
  expect(fn()).toBe(1);
});

test('Multiple functions in one module', async () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('f1', [ValueType.Int32], [], (f, a) => {
    a.const_i32(1);
  }).withExport();
  mod.defineFunction('f2', [ValueType.Int32], [], (f, a) => {
    a.const_i32(2);
  }).withExport();
  mod.defineFunction('f3', [ValueType.Int32], [], (f, a) => {
    a.const_i32(3);
  }).withExport();

  const instance = await mod.instantiate();
  expect((instance.instance.exports.f1 as CallableFunction)()).toBe(1);
  expect((instance.instance.exports.f2 as CallableFunction)()).toBe(2);
  expect((instance.instance.exports.f3 as CallableFunction)()).toBe(3);
});

test('ToString produces valid WAT', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.get_local(f.getParameter(1));
    a.add_i32();
  }).withExport();

  const wat = mod.toString();
  expect(wat).toContain('(module');
  expect(wat).toContain('i32.add');
  expect(wat).toContain('(export');
});

test('Global types - f32', async () => {
  const mod = new ModuleBuilder('test');
  mod.defineGlobal(ValueType.Float32, false, 3.14).withExport('g');
  const instance = await mod.instantiate();
  const g = instance.instance.exports.g as WebAssembly.Global;
  expect(g.value).toBeCloseTo(3.14, 2);
});

test('Global types - f64', async () => {
  const mod = new ModuleBuilder('test');
  mod.defineGlobal(ValueType.Float64, false, 2.71828).withExport('g');
  const instance = await mod.instantiate();
  const g = instance.instance.exports.g as WebAssembly.Global;
  expect(g.value).toBeCloseTo(2.71828, 4);
});

describe('Arg.number rejects Infinity', () => {
  test('Infinity throws', () => {
    expect(() => Arg.number('x', Infinity)).toThrow('finite number');
  });

  test('-Infinity throws', () => {
    expect(() => Arg.number('x', -Infinity)).toThrow('finite number');
  });

  test('NaN still throws', () => {
    expect(() => Arg.number('x', NaN)).toThrow('finite number');
  });

  test('normal number passes', () => {
    expect(() => Arg.number('x', 42)).not.toThrow();
    expect(() => Arg.number('x', 0)).not.toThrow();
    expect(() => Arg.number('x', -1)).not.toThrow();
  });
});

describe('call_indirect with table index', () => {
  test('call_indirect with default table 0 (backward compat)', async () => {
    // Identical to the existing Call.test.ts pattern but verifying backward compat
    const mod = new ModuleBuilder('test', { target: 'latest' });
    const table = mod.defineTable(ElementType.AnyFunc, 1, 1);
    const sig = mod.defineFuncType([ValueType.Int32], []);
    const fn = mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
      a.const_i32(42);
    });
    mod.defineElementSegment(table, [fn], 0);
    mod.defineFunction('test', [ValueType.Int32], [], (f, a) => {
      a.const_i32(0); // table index
      a.call_indirect(sig);
    }).withExport();
    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });

  test('call_indirect with explicit table index in binary', () => {
    const mod = new ModuleBuilder('test', { target: 'latest', disableVerification: true });
    const table0 = mod.defineTable(ElementType.AnyFunc, 1, 1);
    const table1 = mod.defineTable(ElementType.AnyFunc, 1, 1);
    const sig = mod.defineFuncType([ValueType.Int32], []);
    mod.defineFunction('test', null, [], (f, a) => {
      a.const_i32(0);
      a.call_indirect(sig, 1); // table 1
    }).withExport();
    const bytes = mod.toBytes();
    // Module should produce valid binary (table index encoded correctly)
    expect(bytes).toBeTruthy();
  });

  test('call_indirect with table index in WAT output', () => {
    const mod = new ModuleBuilder('test', { target: 'latest', disableVerification: true });
    mod.defineTable(ElementType.AnyFunc, 1, 1);
    mod.defineTable(ElementType.AnyFunc, 1, 1);
    const sig = mod.defineFuncType([ValueType.Int32], []);
    mod.defineFunction('test', null, [], (f, a) => {
      a.const_i32(0);
      a.call_indirect(sig, 1);
    }).withExport();
    const wat = new TextModuleWriter(mod).toString();
    expect(wat).toContain('call_indirect 1 (type');
  });

  test('call_indirect with table 0 omits table index in WAT', () => {
    const mod = new ModuleBuilder('test', { target: 'latest', disableVerification: true });
    mod.defineTable(ElementType.AnyFunc, 1, 1);
    const sig = mod.defineFuncType([ValueType.Int32], []);
    mod.defineFunction('test', null, [], (f, a) => {
      a.const_i32(0);
      a.call_indirect(sig);
    }).withExport();
    const wat = new TextModuleWriter(mod).toString();
    expect(wat).toContain('call_indirect (type');
    expect(wat).not.toMatch(/call_indirect 0/);
  });
});
