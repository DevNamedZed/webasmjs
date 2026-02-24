import { BlockType, ModuleBuilder, ValueType } from '../src/index';
import TestHelper from './TestHelper';

describe('tee_local', () => {
  test('stores value and leaves it on stack', async () => {
    const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
      const local = asm.declareLocal(ValueType.Int32, 'x');
      asm.const_i32(42);
      asm.tee_local(local); // stores 42 to local, leaves 42 on stack
      // stack has 42, local has 42 — drop the stack value, push local
      asm.drop();
      asm.get_local(local);
      asm.end();
    });
    expect(fn()).toBe(42);
  });

  test('in loop — increment and use in same expression', async () => {
    // sum = 0; for i=1..5: sum += i using tee_local
    const mod = new ModuleBuilder('test');
    mod.defineFunction('test', [ValueType.Int32], [], (f, a) => {
      const sum = a.declareLocal(ValueType.Int32, 'sum');
      const i = a.declareLocal(ValueType.Int32, 'i');

      a.const_i32(0);
      a.set_local(sum);
      a.const_i32(1);
      a.set_local(i);

      a.loop(BlockType.Void, (cont) => {
        a.block(BlockType.Void, (brk) => {
          a.get_local(i);
          a.const_i32(5);
          a.gt_i32();
          a.br_if(brk);

          a.get_local(sum);
          a.get_local(i);
          a.tee_local(i); // tee to use i in add AND keep for increment
          a.add_i32();
          a.set_local(sum);

          a.get_local(i);
          a.const_i32(1);
          a.add_i32();
          a.set_local(i);
          a.br(cont);
        });
      });

      a.get_local(sum);
    }).withExport();

    const instance = await mod.instantiate();
    const test = instance.instance.exports.test as CallableFunction;
    expect(test()).toBe(15); // 1+2+3+4+5
  });

  test('with f64 type', async () => {
    const fn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
      const local = asm.declareLocal(ValueType.Float64, 'x');
      asm.const_f64(3.14);
      asm.tee_local(local);
      asm.end();
    });
    expect(fn()).toBeCloseTo(3.14);
  });
});

describe('drop', () => {
  test('discards top of stack', async () => {
    const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
      asm.const_i32(100); // this stays
      asm.const_i32(999); // this gets dropped
      asm.drop();
      asm.end();
    });
    expect(fn()).toBe(100);
  });

  test('after call that returns unwanted value', async () => {
    const mod = new ModuleBuilder('test');
    const helper = mod.defineFunction('helper', [ValueType.Int32], [], (f, a) => {
      a.const_i32(999);
    });

    mod.defineFunction('test', [ValueType.Int32], [], (f, a) => {
      a.call(helper);
      a.drop();
      a.const_i32(42);
    }).withExport();

    const instance = await mod.instantiate();
    const test = instance.instance.exports.test as CallableFunction;
    expect(test()).toBe(42);
  });
});

describe('mem_grow / mem_size', () => {
  test('mem_size returns initial page count', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(2);
    mod.defineFunction('test', [ValueType.Int32], [], (f, a) => {
      a.mem_size(0);
    }).withExport();

    const instance = await mod.instantiate();
    const test = instance.instance.exports.test as CallableFunction;
    expect(test()).toBe(2);
  });

  test('mem_grow adds pages and returns previous size', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1);
    mod.defineFunction('grow', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.mem_grow(0);
    }).withExport();

    mod.defineFunction('size', [ValueType.Int32], [], (f, a) => {
      a.mem_size(0);
    }).withExport();

    const instance = await mod.instantiate();
    const { grow, size } = instance.instance.exports as any;
    expect(size()).toBe(1);
    expect(grow(3)).toBe(1); // returns previous size
    expect(size()).toBe(4);
  });

  test('mem_grow returns -1 on failure', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, 2); // max 2 pages
    mod.defineFunction('grow', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.mem_grow(0);
    }).withExport();

    const instance = await mod.instantiate();
    const grow = instance.instance.exports.grow as CallableFunction;
    expect(grow(10)).toBe(-1); // exceeds maximum
  });

  test('read/write to newly grown memory', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1);
    mod.defineFunction('grow', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.mem_grow(0);
    }).withExport();

    mod.defineFunction('store', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.get_local(f.getParameter(1));
      a.store_i32(2, 0);
    }).withExport();

    mod.defineFunction('load', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.load_i32(2, 0);
    }).withExport();

    const instance = await mod.instantiate();
    const { grow, store, load } = instance.instance.exports as any;
    grow(1);
    // Write to second page (offset 65536)
    store(65536, 12345);
    expect(load(65536)).toBe(12345);
  });
});

describe('unreachable', () => {
  test('traps at runtime', async () => {
    const fn = await TestHelper.compileFunction('test', null, [], (asm) => {
      asm.unreachable();
      asm.end();
    });
    expect(() => fn()).toThrow();
  });

  test('does not trap when branch skips it', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('test', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.eqz_i32();
      a.if(BlockType.Void, () => {
        a.unreachable();
      });
      a.const_i32(42);
    }).withExport();

    const instance = await mod.instantiate();
    const test = instance.instance.exports.test as CallableFunction;
    expect(test(1)).toBe(42); // doesn't trap — branch not taken
    expect(() => test(0)).toThrow(); // traps — branch taken
  });
});

describe('reinterpret', () => {
  test('f32 to i32 (known pattern: 1.0f = 0x3F800000)', async () => {
    const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
      asm.const_f32(1.0);
      asm.reinterpret_f32_i32();
      asm.end();
    });
    expect(fn() >>> 0).toBe(0x3F800000);
  });

  test('i32 to f32 (known pattern: 0x3F800000 = 1.0f)', async () => {
    const fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
      asm.const_i32(0x3F800000);
      asm.reinterpret_i32_f32();
      asm.end();
    });
    expect(fn()).toBe(1.0);
  });

  test('f64 to i64 and back (round-trip)', async () => {
    const fn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
      asm.const_f64(3.14);
      asm.reinterpret_f64_i64();
      asm.reinterpret_i64_f64();
      asm.end();
    });
    expect(fn()).toBeCloseTo(3.14);
  });

  test('preserves zero exactly', async () => {
    const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
      asm.const_f32(0.0);
      asm.reinterpret_f32_i32();
      asm.end();
    });
    expect(fn()).toBe(0);
  });
});

describe('copysign', () => {
  test('f64 copies sign from second to first', async () => {
    const fn = await TestHelper.compileFunction('test', ValueType.Float64,
      [ValueType.Float64, ValueType.Float64], (asm) => {
      asm.get_local(0);
      asm.get_local(1);
      asm.copysign_f64();
      asm.end();
    });
    expect(fn(5.0, -1.0)).toBe(-5.0);
    expect(fn(-5.0, 1.0)).toBe(5.0);
    expect(fn(3.0, 3.0)).toBe(3.0);
  });

  test('f32 with negative/positive combinations', async () => {
    const fn = await TestHelper.compileFunction('test', ValueType.Float32,
      [ValueType.Float32, ValueType.Float32], (asm) => {
      asm.get_local(0);
      asm.get_local(1);
      asm.copysign_f32();
      asm.end();
    });
    expect(fn(5.0, -1.0)).toBeCloseTo(-5.0);
    expect(fn(-5.0, 1.0)).toBeCloseTo(5.0);
  });
});

describe('nearest', () => {
  test('f64 rounds to nearest even', async () => {
    const fn = await TestHelper.compileFunction('test', ValueType.Float64,
      [ValueType.Float64], (asm) => {
      asm.get_local(0);
      asm.nearest_f64();
      asm.end();
    });
    expect(fn(0.5)).toBe(0.0);  // banker's rounding: 0.5 → 0
    expect(fn(1.5)).toBe(2.0);  // 1.5 → 2
    expect(fn(2.5)).toBe(2.0);  // 2.5 → 2
    expect(fn(3.5)).toBe(4.0);  // 3.5 → 4
    expect(fn(2.3)).toBe(2.0);
    expect(fn(-1.7)).toBe(-2.0);
  });
});

describe('bitwise rotation', () => {
  test('rotl_i32 rotates bits left', async () => {
    const fn = await TestHelper.compileFunction('test', ValueType.Int32,
      [ValueType.Int32, ValueType.Int32], (asm) => {
      asm.get_local(0);
      asm.get_local(1);
      asm.rotl_i32();
      asm.end();
    });
    expect(fn(1, 1)).toBe(2);
    expect(fn(1, 10)).toBe(1024);
    expect(fn(0x80000000 | 0, 1) >>> 0).toBe(1); // high bit wraps to low
  });

  test('rotr_i32 rotates bits right', async () => {
    const fn = await TestHelper.compileFunction('test', ValueType.Int32,
      [ValueType.Int32, ValueType.Int32], (asm) => {
      asm.get_local(0);
      asm.get_local(1);
      asm.rotr_i32();
      asm.end();
    });
    expect(fn(2, 1)).toBe(1);
    expect(fn(1, 1) >>> 0).toBe(0x80000000); // low bit wraps to high
  });
});

describe('bit counting', () => {
  test('clz_i32 counts leading zeros', async () => {
    const fn = await TestHelper.compileFunction('test', ValueType.Int32,
      [ValueType.Int32], (asm) => {
      asm.get_local(0);
      asm.clz_i32();
      asm.end();
    });
    expect(fn(1)).toBe(31);
    expect(fn(0)).toBe(32);
    expect(fn(256)).toBe(23);
    expect(fn(0x80000000 | 0)).toBe(0);
  });

  test('ctz_i32 counts trailing zeros', async () => {
    const fn = await TestHelper.compileFunction('test', ValueType.Int32,
      [ValueType.Int32], (asm) => {
      asm.get_local(0);
      asm.ctz_i32();
      asm.end();
    });
    expect(fn(1)).toBe(0);
    expect(fn(256)).toBe(8);
    expect(fn(0)).toBe(32);
    expect(fn(0x80000000 | 0)).toBe(31);
  });

  test('popcnt_i32 counts set bits', async () => {
    const fn = await TestHelper.compileFunction('test', ValueType.Int32,
      [ValueType.Int32], (asm) => {
      asm.get_local(0);
      asm.popcnt_i32();
      asm.end();
    });
    expect(fn(0)).toBe(0);
    expect(fn(0xFF)).toBe(8);
    expect(fn(0x55555555)).toBe(16);
    expect(fn(-1)).toBe(32); // all bits set
  });
});
