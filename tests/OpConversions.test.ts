import { ModuleBuilder, ValueType } from '../src/index';

const latestOpts = { generateNameSection: true, disableVerification: true, target: 'latest' as const };

describe('type conversions', () => {
  let exports: any;

  beforeAll(async () => {
    const mod = new ModuleBuilder('test');

    mod.defineFunction('trunc_f64_u_i32', [ValueType.Int32], [], (f, a) => {
      a.const_f64(42.9); a.trunc_f64_u_i32();
    }).withExport();
    mod.defineFunction('trunc_f32_s_i64', [ValueType.Int64], [], (f, a) => {
      a.const_f32(42.9); a.trunc_f32_s_i64();
    }).withExport();
    mod.defineFunction('trunc_f32_u_i64', [ValueType.Int64], [], (f, a) => {
      a.const_f32(42.9); a.trunc_f32_u_i64();
    }).withExport();
    mod.defineFunction('trunc_f64_s_i64', [ValueType.Int64], [], (f, a) => {
      a.const_f64(-42.9); a.trunc_f64_s_i64();
    }).withExport();
    mod.defineFunction('trunc_f64_u_i64', [ValueType.Int64], [], (f, a) => {
      a.const_f64(42.9); a.trunc_f64_u_i64();
    }).withExport();
    mod.defineFunction('convert_i32_u_f32', [ValueType.Float32], [], (f, a) => {
      a.const_i32(42); a.convert_i32_u_f32();
    }).withExport();
    mod.defineFunction('convert_i64_s_f32', [ValueType.Float32], [], (f, a) => {
      a.const_i64(-100n); a.convert_i64_s_f32();
    }).withExport();
    mod.defineFunction('convert_i64_u_f32', [ValueType.Float32], [], (f, a) => {
      a.const_i64(100n); a.convert_i64_u_f32();
    }).withExport();
    mod.defineFunction('convert_i64_s_f64', [ValueType.Float64], [], (f, a) => {
      a.const_i64(-100n); a.convert_i64_s_f64();
    }).withExport();
    mod.defineFunction('convert_i64_u_f64', [ValueType.Float64], [], (f, a) => {
      a.const_i64(100n); a.convert_i64_u_f64();
    }).withExport();

    const result = await mod.instantiate();
    exports = result.instance.exports;
  });

  test('trunc_f64_u_i32', () => expect(exports.trunc_f64_u_i32()).toBe(42));
  test('trunc_f32_s_i64', () => expect(exports.trunc_f32_s_i64()).toBe(42n));
  test('trunc_f32_u_i64', () => expect(exports.trunc_f32_u_i64()).toBe(42n));
  test('trunc_f64_s_i64', () => expect(exports.trunc_f64_s_i64()).toBe(-42n));
  test('trunc_f64_u_i64', () => expect(exports.trunc_f64_u_i64()).toBe(42n));
  test('convert_i32_u_f32', () => expect(exports.convert_i32_u_f32()).toBeCloseTo(42.0));
  test('convert_i64_s_f32', () => expect(exports.convert_i64_s_f32()).toBeCloseTo(-100.0));
  test('convert_i64_u_f32', () => expect(exports.convert_i64_u_f32()).toBeCloseTo(100.0));
  test('convert_i64_s_f64', () => expect(exports.convert_i64_s_f64()).toBeCloseTo(-100.0));
  test('convert_i64_u_f64', () => expect(exports.convert_i64_u_f64()).toBeCloseTo(100.0));
});

describe('sign extensions', () => {
  let exports: any;

  beforeAll(async () => {
    const mod = new ModuleBuilder('test', latestOpts);

    mod.defineFunction('extend32_s_i64', [ValueType.Int64], [], (f, a) => {
      a.const_i64(0x80000000n); a.extend32_s_i64();
    }).withExport();

    const result = await mod.instantiate();
    exports = result.instance.exports;
  });

  test('extend32_s_i64', () => expect(exports.extend32_s_i64()).toBe(-2147483648n));
});

describe('saturating truncation', () => {
  let exports: any;

  beforeAll(async () => {
    const mod = new ModuleBuilder('test', latestOpts);

    mod.defineFunction('trunc_sat_f64_u_i32', [ValueType.Int32], [], (f, a) => {
      a.const_f64(42.9); a.trunc_sat_f64_u_i32();
    }).withExport();
    mod.defineFunction('trunc_sat_f32_s_i64', [ValueType.Int64], [], (f, a) => {
      a.const_f32(42.9); a.trunc_sat_f32_s_i64();
    }).withExport();
    mod.defineFunction('trunc_sat_f32_u_i64', [ValueType.Int64], [], (f, a) => {
      a.const_f32(42.9); a.trunc_sat_f32_u_i64();
    }).withExport();
    mod.defineFunction('trunc_sat_f64_s_i64', [ValueType.Int64], [], (f, a) => {
      a.const_f64(-42.9); a.trunc_sat_f64_s_i64();
    }).withExport();
    mod.defineFunction('trunc_sat_f64_u_i64', [ValueType.Int64], [], (f, a) => {
      a.const_f64(42.9); a.trunc_sat_f64_u_i64();
    }).withExport();

    const result = await mod.instantiate();
    exports = result.instance.exports;
  });

  test('trunc_sat_f64_u_i32', () => expect(exports.trunc_sat_f64_u_i32()).toBe(42));
  test('trunc_sat_f32_s_i64', () => expect(exports.trunc_sat_f32_s_i64()).toBe(42n));
  test('trunc_sat_f32_u_i64', () => expect(exports.trunc_sat_f32_u_i64()).toBe(42n));
  test('trunc_sat_f64_s_i64', () => expect(exports.trunc_sat_f64_s_i64()).toBe(-42n));
  test('trunc_sat_f64_u_i64', () => expect(exports.trunc_sat_f64_u_i64()).toBe(42n));
});
