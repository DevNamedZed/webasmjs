import { BlockType, ModuleBuilder, ValueType, ElementType, VerificationError } from '../src/index';
import ResizableLimits from '../src/ResizableLimits';
import BinaryWriter from '../src/BinaryWriter';

test('Duplicate function name throws', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('foo', null, []);
  expect(() => mod.defineFunction('foo', null, [])).toThrow(/already been defined/);
});

test('Duplicate function export throws', () => {
  const mod = new ModuleBuilder('test');
  const f1 = mod.defineFunction('f1', null, []);
  const f2 = mod.defineFunction('f2', null, []);
  mod.exportFunction(f1, 'myFunc');
  expect(() => mod.exportFunction(f2, 'myFunc')).toThrow(/already exists/);
});

test('Duplicate memory definition throws (mvp)', () => {
  const mod = new ModuleBuilder('test', { target: 'mvp' });
  mod.defineMemory(1);
  expect(() => mod.defineMemory(1)).toThrow();
});

test('Duplicate table throws (mvp)', () => {
  const mod = new ModuleBuilder('test', { target: 'mvp' });
  mod.defineTable(ElementType.AnyFunc, 10);
  expect(() => mod.defineTable(ElementType.AnyFunc, 10)).toThrow();
});

test('Duplicate import function throws', () => {
  const mod = new ModuleBuilder('test');
  mod.importFunction('mod', 'fn', null, []);
  expect(() => mod.importFunction('mod', 'fn', null, [])).toThrow();
});

test('Duplicate custom section throws', () => {
  const mod = new ModuleBuilder('test');
  mod.defineCustomSection('mySection');
  expect(() => mod.defineCustomSection('mySection')).toThrow();
});

test('Reserved name custom section throws', () => {
  const mod = new ModuleBuilder('test');
  expect(() => mod.defineCustomSection('name')).toThrow(/reserved/);
});

test('Multiple return types throws (mvp)', () => {
  const mod = new ModuleBuilder('test', { target: 'mvp' });
  expect(() => mod.defineFuncType([ValueType.Int32, ValueType.Int32], [])).toThrow();
});

test('Global - init expression not defined throws', () => {
  const mod = new ModuleBuilder('test');
  const g = mod.defineGlobal(ValueType.Int32, false);
  // No value set
  expect(() => mod.toBytes()).toThrow(/initialization expression/i);
});

test('Export mutable global throws with verification (mvp)', () => {
  const mod = new ModuleBuilder('test', { target: 'mvp' });
  const g = mod.defineGlobal(ValueType.Int32, true, 0);
  expect(() => mod.exportGlobal(g, 'g')).toThrow(VerificationError);
});

test('Feature gating - mvp blocks sign-extend', () => {
  const mod = new ModuleBuilder('test', { generateNameSection: true, disableVerification: false, target: 'mvp' });
  const fn = mod.defineFunction('test', ValueType.Int32, []);
  const asm = fn.createEmitter();
  asm.const_i32(0x80);
  expect(() => asm.extend8_s_i32()).toThrow(/feature/);
});

test('Feature gating - latest allows sign-extend', async () => {
  const mod = new ModuleBuilder('test', { generateNameSection: true, disableVerification: false, target: 'latest' });
  mod.defineFunction('test', [ValueType.Int32], [], (f, a) => {
    a.const_i32(0x80);
    a.extend8_s_i32();
  }).withExport();

  const instance = await mod.instantiate();
  const fn = instance.instance.exports.test as CallableFunction;
  expect(fn()).toBe(-128);
});

describe('table error conditions', () => {
  test('table_grow beyond maximum returns -1', async () => {
    const mod = new ModuleBuilder('test', { target: 'latest', disableVerification: true, generateNameSection: true });
    const table = mod.defineTable(ElementType.AnyFunc, 1, 3);

    mod.defineFunction('grow', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.ref_null(0x70); // funcref null
      a.get_local(f.getParameter(0));
      a.table_grow(0);
    }).withExport();

    mod.defineFunction('size', [ValueType.Int32], [], (f, a) => {
      a.table_size(0);
    }).withExport();

    const instance = await mod.instantiate();
    const { grow, size } = instance.instance.exports as any;

    expect(size()).toBe(1);
    expect(grow(2)).toBe(1); // success, returns old size
    expect(size()).toBe(3);
    expect(grow(1)).toBe(-1); // exceeds max=3
    expect(size()).toBe(3);
  });

  test('call_indirect with wrong type traps', async () => {
    const mod = new ModuleBuilder('test', { disableVerification: true });

    // Function type: () -> i32
    const fn1 = mod.defineFunction('retI32', [ValueType.Int32], [], (f, a) => {
      a.const_i32(42);
    });

    // Function type: (i32) -> i32 (different signature)
    const fn2Type = mod.defineFuncType([ValueType.Int32], [ValueType.Int32]);

    const table = mod.defineTable(ElementType.AnyFunc, 1);
    table.defineTableSegment([fn1], 0);

    // Try to call fn1 with fn2's type signature
    mod.defineFunction('test', [ValueType.Int32], [], (f, a) => {
      a.const_i32(0); // dummy arg (for fn2's param)
      a.const_i32(0); // table index
      a.call_indirect(fn2Type);
    }).withExport();

    const instance = await mod.instantiate();
    const test = instance.instance.exports.test as CallableFunction;
    expect(() => test()).toThrow(); // signature mismatch trap
  });
});

describe('ResizableLimits validation', () => {
  test('negative initial throws', () => {
    expect(() => new ResizableLimits(-1)).toThrow('non-negative');
  });

  test('negative maximum throws', () => {
    expect(() => new ResizableLimits(0, -1)).toThrow('non-negative');
  });

  test('initial > maximum throws', () => {
    expect(() => new ResizableLimits(10, 5)).toThrow('must not exceed');
  });
});

describe('FunctionBuilder error paths', () => {
  test('createEmitter called twice throws', () => {
    const mod = new ModuleBuilder('test');
    const fn = mod.defineFunction('f', null, []);
    fn.createEmitter();
    expect(() => fn.createEmitter()).toThrow('already been created');
  });

  test('write with null emitter throws', () => {
    const mod = new ModuleBuilder('test');
    const fn = mod.defineFunction('f', null, []);
    expect(() => fn.write(new BinaryWriter())).toThrow('body has not been defined');
  });
});

describe('GlobalBuilder error paths', () => {
  test('value with unsupported ref type throws', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    const g = mod.defineGlobal(ValueType.FuncRef, false);
    expect(() => g.value(0)).toThrow('Unsupported global value type');
  });
});

describe('ElementSegmentBuilder error paths', () => {
  test('offset with unsupported type throws', () => {
    const mod = new ModuleBuilder('test');
    const table = mod.defineTable(ElementType.AnyFunc, 1);
    const fn = mod.defineFunction('f', null, [], (f, a) => {});
    const seg = mod.defineElementSegment(table, [fn]);
    expect(() => (seg as any).offset(true)).toThrow('Unsupported offset');
  });
});

describe('Duplicate import/export error paths', () => {
  test('duplicate importTable throws', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    mod.importTable('env', 'tbl', ElementType.AnyFunc, 1);
    expect(() => mod.importTable('env', 'tbl', ElementType.AnyFunc, 1)).toThrow('already exists');
  });

  test('duplicate exportMemory throws', () => {
    const mod = new ModuleBuilder('test');
    const m = mod.defineMemory(1);
    mod.exportMemory(m, 'mem');
    expect(() => mod.exportMemory(m, 'mem')).toThrow('already exists');
  });

  test('duplicate exportTable throws', () => {
    const mod = new ModuleBuilder('test');
    const t = mod.defineTable(ElementType.AnyFunc, 1);
    mod.exportTable(t, 'tbl');
    expect(() => mod.exportTable(t, 'tbl')).toThrow('already exists');
  });

  test('duplicate exportGlobal throws', () => {
    const mod = new ModuleBuilder('test');
    const g = mod.defineGlobal(ValueType.Int32, false, 0);
    mod.exportGlobal(g, 'g');
    expect(() => mod.exportGlobal(g, 'g')).toThrow('already exists');
  });
});

describe('verification edge cases', () => {
  test('deep nesting (30+ levels) verifies without error', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('test', null, [], (f, a) => {
      // 30 nested blocks
      const labels: any[] = [];
      for (let i = 0; i < 30; i++) {
        const label = a.block(BlockType.Void);
        labels.push(label);
      }
      // Close all 30 blocks
      for (let i = 29; i >= 0; i--) {
        a.end();
      }
    }).withExport();

    // Should not throw
    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });

  test('empty function body is valid', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('test', null, [], (f, a) => {
      // empty body — just end
    }).withExport();

    const instance = await mod.instantiate();
    const test = instance.instance.exports.test as CallableFunction;
    expect(() => test()).not.toThrow();
  });

  test('function with only unreachable is valid', () => {
    const mod = new ModuleBuilder('test', { disableVerification: true });
    mod.defineFunction('test', [ValueType.Int32], [], (f, a) => {
      a.unreachable();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });
});
