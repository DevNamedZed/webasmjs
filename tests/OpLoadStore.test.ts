import { ModuleBuilder, ValueType } from '../src/index';

const opts = { generateNameSection: true };

describe('i64/f32/f64 load/store', () => {
  let exports: any;

  beforeAll(async () => {
    const mod = new ModuleBuilder('test', opts);
    mod.defineMemory(1);

    // i64 store/load
    mod.defineFunction('store_i64', null, [ValueType.Int32, ValueType.Int64], (f, a) => {
      a.get_local(f.getParameter(0)); a.get_local(f.getParameter(1)); a.store_i64(0, 0);
    }).withExport();
    mod.defineFunction('load_i64', [ValueType.Int64], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0)); a.load_i64(0, 0);
    }).withExport();

    // f32 store/load
    mod.defineFunction('store_f32', null, [ValueType.Int32, ValueType.Float32], (f, a) => {
      a.get_local(f.getParameter(0)); a.get_local(f.getParameter(1)); a.store_f32(0, 0);
    }).withExport();
    mod.defineFunction('load_f32', [ValueType.Float32], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0)); a.load_f32(0, 0);
    }).withExport();

    // f64 store/load
    mod.defineFunction('store_f64', null, [ValueType.Int32, ValueType.Float64], (f, a) => {
      a.get_local(f.getParameter(0)); a.get_local(f.getParameter(1)); a.store_f64(0, 0);
    }).withExport();
    mod.defineFunction('load_f64', [ValueType.Float64], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0)); a.load_f64(0, 0);
    }).withExport();

    // i32 sub-word
    mod.defineFunction('store16_i32', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0)); a.get_local(f.getParameter(1)); a.store16_i32(0, 0);
    }).withExport();
    mod.defineFunction('load16_i32', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0)); a.load16_i32(0, 0);
    }).withExport();

    // i64 sub-word loads
    mod.defineFunction('load8_i64_s', [ValueType.Int64], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0)); a.load8_i64(0, 0);
    }).withExport();
    mod.defineFunction('load8_i64_u', [ValueType.Int64], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0)); a.load8_i64_u(0, 0);
    }).withExport();
    mod.defineFunction('load16_i64_s', [ValueType.Int64], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0)); a.load16_i64(0, 0);
    }).withExport();
    mod.defineFunction('load16_i64_u', [ValueType.Int64], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0)); a.load16_i64_u(0, 0);
    }).withExport();
    mod.defineFunction('load32_i64_s', [ValueType.Int64], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0)); a.load32_i64(0, 0);
    }).withExport();
    mod.defineFunction('load32_i64_u', [ValueType.Int64], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0)); a.load32_i64_u(0, 0);
    }).withExport();

    // i64 sub-word stores
    mod.defineFunction('store8_i64', null, [ValueType.Int32, ValueType.Int64], (f, a) => {
      a.get_local(f.getParameter(0)); a.get_local(f.getParameter(1)); a.store8_i64(0, 0);
    }).withExport();
    mod.defineFunction('store16_i64', null, [ValueType.Int32, ValueType.Int64], (f, a) => {
      a.get_local(f.getParameter(0)); a.get_local(f.getParameter(1)); a.store16_i64(0, 0);
    }).withExport();
    mod.defineFunction('store32_i64', null, [ValueType.Int32, ValueType.Int64], (f, a) => {
      a.get_local(f.getParameter(0)); a.get_local(f.getParameter(1)); a.store32_i64(0, 0);
    }).withExport();

    const result = await mod.instantiate();
    exports = result.instance.exports;
  });

  test('load_i64 / store_i64', () => {
    exports.store_i64(0, 0x123456789ABCDEFn);
    expect(exports.load_i64(0)).toBe(0x123456789ABCDEFn);
  });

  test('load_f32 / store_f32', () => {
    exports.store_f32(0, 3.14);
    expect(exports.load_f32(0)).toBeCloseTo(3.14, 2);
  });

  test('load_f64 / store_f64', () => {
    exports.store_f64(0, 2.718281828);
    expect(exports.load_f64(0)).toBeCloseTo(2.718281828, 6);
  });

  test('load16_i32 (signed)', () => {
    exports.store16_i32(0, 0x8000);
    expect(exports.load16_i32(0)).toBe(-32768);
  });

  test('i64 sub-word loads', () => {
    exports.store_i64(0, 0xFFn);
    expect(exports.load8_i64_s(0)).toBe(-1n);
    expect(exports.load8_i64_u(0)).toBe(255n);

    exports.store_i64(0, 0x8000n);
    expect(exports.load16_i64_s(0)).toBe(-32768n);
    expect(exports.load16_i64_u(0)).toBe(32768n);

    exports.store_i64(0, 0x80000000n);
    expect(exports.load32_i64_s(0)).toBe(-2147483648n);
    expect(exports.load32_i64_u(0)).toBe(2147483648n);
  });

  test('i64 sub-word stores', () => {
    exports.store8_i64(0, 0xABn);
    expect(exports.load_i64(0) & 0xFFn).toBe(0xABn);

    exports.store16_i64(16, 0xABCDn);
    expect(exports.load_i64(16) & 0xFFFFn).toBe(0xABCDn);

    exports.store32_i64(32, 0xDEADBEEFn);
    expect(exports.load_i64(32) & 0xFFFFFFFFn).toBe(0xDEADBEEFn);
  });
});
