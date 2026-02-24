import { ModuleBuilder, ValueType, ElementType } from '../src/index';

// These tests verify the operand stack verifier works correctly with
// heterogeneous types (the fix for pop order and funcType parameter order).

describe('Verifier: store with heterogeneous types', () => {
  test('f32.store with verification enabled', async () => {
    const mod = new ModuleBuilder('test'); // verification enabled by default
    mod.defineMemory(1);

    mod.defineFunction('store_f32', null,
      [ValueType.Int32, ValueType.Float32], (f, a) => {
      a.get_local(f.getParameter(0)); // addr (i32)
      a.get_local(f.getParameter(1)); // value (f32)
      a.store_f32(2, 0);
    }).withExport();

    mod.defineFunction('load_f32', [ValueType.Float32],
      [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.load_f32(2, 0);
    }).withExport();

    const instance = await mod.instantiate();
    const { store_f32, load_f32 } = instance.instance.exports as any;
    store_f32(0, 3.14);
    expect(load_f32(0)).toBeCloseTo(3.14, 2);
  });

  test('f64.store with verification enabled', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1);

    mod.defineFunction('store_f64', null,
      [ValueType.Int32, ValueType.Float64], (f, a) => {
      a.get_local(f.getParameter(0));
      a.get_local(f.getParameter(1));
      a.store_f64(3, 0);
    }).withExport();

    mod.defineFunction('load_f64', [ValueType.Float64],
      [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.load_f64(3, 0);
    }).withExport();

    const instance = await mod.instantiate();
    const { store_f64, load_f64 } = instance.instance.exports as any;
    store_f64(0, 2.718281828);
    expect(load_f64(0)).toBeCloseTo(2.718281828);
  });

  test('i64.store with verification enabled', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1);

    mod.defineFunction('store_i64', null,
      [ValueType.Int32, ValueType.Int64], (f, a) => {
      a.get_local(f.getParameter(0));
      a.get_local(f.getParameter(1));
      a.store_i64(3, 0);
    }).withExport();

    mod.defineFunction('load_i64', [ValueType.Int64],
      [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.load_i64(3, 0);
    }).withExport();

    const instance = await mod.instantiate();
    const { store_i64, load_i64 } = instance.instance.exports as any;
    store_i64(0, 0x123456789ABCDEFn);
    expect(load_i64(0)).toBe(0x123456789ABCDEFn);
  });
});

describe('Verifier: SIMD with verification enabled', () => {
  test('v128 load/store/add', async () => {
    const mod = new ModuleBuilder('test'); // verification ON
    mod.defineMemory(1);

    mod.defineFunction('vec4_add', null,
      [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(2));  // dest addr
      a.get_local(f.getParameter(0));
      a.load_v128(2, 0);
      a.get_local(f.getParameter(1));
      a.load_v128(2, 0);
      a.add_f32x4();
      a.store_v128(2, 0);
    }).withExport();

    mod.defineFunction('setF32', null,
      [ValueType.Int32, ValueType.Float32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.get_local(f.getParameter(1));
      a.store_f32(2, 0);
    }).withExport();

    mod.defineFunction('getF32', [ValueType.Float32],
      [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.load_f32(2, 0);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const { vec4_add, setF32, getF32 } = instance.instance.exports as any;
    for (let i = 0; i < 4; i++) {
      setF32(i * 4, i + 1);
      setF32(16 + i * 4, (i + 1) * 10);
    }
    vec4_add(0, 16, 32);
    expect(getF32(32)).toBeCloseTo(11);
    expect(getF32(36)).toBeCloseTo(22);
    expect(getF32(40)).toBeCloseTo(33);
    expect(getF32(44)).toBeCloseTo(44);
  });

  test('SIMD dot product with verification enabled', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1);

    mod.defineFunction('dot4', [ValueType.Float32],
      [ValueType.Int32, ValueType.Int32], (f, a) => {
      const products = a.declareLocal(ValueType.V128, 'products');
      a.get_local(f.getParameter(0));
      a.load_v128(2, 0);
      a.get_local(f.getParameter(1));
      a.load_v128(2, 0);
      a.mul_f32x4();
      a.set_local(products);
      a.get_local(products);
      a.extract_lane_f32x4(0);
      a.get_local(products);
      a.extract_lane_f32x4(1);
      a.add_f32();
      a.get_local(products);
      a.extract_lane_f32x4(2);
      a.add_f32();
      a.get_local(products);
      a.extract_lane_f32x4(3);
      a.add_f32();
    }).withExport();

    mod.defineFunction('setF32', null,
      [ValueType.Int32, ValueType.Float32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.get_local(f.getParameter(1));
      a.store_f32(2, 0);
    }).withExport();

    const instance = await mod.instantiate();
    const { dot4, setF32 } = instance.instance.exports as any;
    const vecA = [1, 2, 3, 4];
    const vecB = [5, 6, 7, 8];
    for (let i = 0; i < 4; i++) {
      setF32(i * 4, vecA[i]);
      setF32(16 + i * 4, vecB[i]);
    }
    expect(dot4(0, 16)).toBeCloseTo(70);
  });

  test('SIMD splat, replace_lane, extract_lane with verification', () => {
    const mod = new ModuleBuilder('test');

    mod.defineFunction('test', [ValueType.Float32], [], (f, a) => {
      a.const_f32(3.14);
      a.splat_f32x4();
      a.const_f32(99.0);
      a.replace_lane_f32x4(2);
      a.extract_lane_f32x4(2);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });

  test('SIMD shift (v128 + i32 operands) with verification', () => {
    const mod = new ModuleBuilder('test');

    mod.defineFunction('test', null, [], (f, a) => {
      a.const_i32(42);
      a.splat_i32x4();
      a.const_i32(2);
      a.shl_i32x4();
      a.drop();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });
});

describe('Verifier: select with heterogeneous types', () => {
  test('select with f64 values and i32 condition', async () => {
    const mod = new ModuleBuilder('test');

    mod.defineFunction('selF64', [ValueType.Float64],
      [ValueType.Float64, ValueType.Float64, ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0)); // val1 (f64)
      a.get_local(f.getParameter(1)); // val2 (f64)
      a.get_local(f.getParameter(2)); // condition (i32)
      a.select();
    }).withExport();

    const instance = await mod.instantiate();
    const { selF64 } = instance.instance.exports as any;
    expect(selF64(1.5, 2.5, 1)).toBe(1.5);
    expect(selF64(1.5, 2.5, 0)).toBe(2.5);
  });
});

describe('Verifier: bulk memory with verification enabled', () => {
  test('memory.fill and memory.copy', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1);

    mod.defineFunction('test_fill', [ValueType.Int32], [], (f, a) => {
      a.const_i32(0);    // dest
      a.const_i32(0xAB); // value
      a.const_i32(4);    // length
      a.memory_fill(0);
      a.const_i32(0);
      a.load_i32(0, 0);
    }).withExport();

    mod.defineFunction('test_copy', [ValueType.Int32], [], (f, a) => {
      a.const_i32(0); a.const_i32(42); a.store_i32(0, 0);
      a.const_i32(16); // dest
      a.const_i32(0);  // src
      a.const_i32(4);  // length
      a.memory_copy(0, 0);
      a.const_i32(16);
      a.load_i32(0, 0);
    }).withExport();

    const instance = await mod.instantiate();
    const exports = instance.instance.exports as any;
    expect(exports.test_fill()).toBe(0xABABABAB | 0);
    expect(exports.test_copy()).toBe(42);
  });
});

describe('Verifier: reference types with verification enabled', () => {
  test('ref.null, ref.is_null, ref.func', async () => {
    const mod = new ModuleBuilder('test');

    const target = mod.defineFunction('target', null, [], (f, a) => {}).withExport();

    mod.defineFunction('test_ref_null', [ValueType.Int32], [], (f, a) => {
      a.ref_null(0x70);
      a.ref_is_null();
    }).withExport();

    mod.defineFunction('test_ref_func', [ValueType.Int32], [], (f, a) => {
      a.ref_func(target);
      a.ref_is_null();
    }).withExport();

    const instance = await mod.instantiate();
    const exports = instance.instance.exports as any;
    expect(exports.test_ref_null()).toBe(1);
    expect(exports.test_ref_func()).toBe(0);
  });
});
