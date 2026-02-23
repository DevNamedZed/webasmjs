import { ModuleBuilder, ValueType } from '../src/index';

describe('bit arithmetic', () => {
  let exports: any;

  beforeAll(async () => {
    const mod = new ModuleBuilder('test');

    // i32 bit ops
    mod.defineFunction('clz_i32', [ValueType.Int32], [], (f, a) => {
      a.const_i32(1); a.clz_i32();
    }).withExport();
    mod.defineFunction('ctz_i32', [ValueType.Int32], [], (f, a) => {
      a.const_i32(16); a.ctz_i32();
    }).withExport();
    mod.defineFunction('div_i32_u', [ValueType.Int32], [], (f, a) => {
      a.const_i32(100); a.const_i32(10); a.div_i32_u();
    }).withExport();
    mod.defineFunction('rem_i32_u', [ValueType.Int32], [], (f, a) => {
      a.const_i32(17); a.const_i32(5); a.rem_i32_u();
    }).withExport();
    mod.defineFunction('shr_i32_u', [ValueType.Int32], [], (f, a) => {
      a.const_i32(-1); a.const_i32(1); a.shr_i32_u();
    }).withExport();
    mod.defineFunction('rotl_i32', [ValueType.Int32], [], (f, a) => {
      a.const_i32(1); a.const_i32(1); a.rotl_i32();
    }).withExport();
    mod.defineFunction('rotr_i32', [ValueType.Int32], [], (f, a) => {
      a.const_i32(2); a.const_i32(1); a.rotr_i32();
    }).withExport();

    // i64 bit ops
    mod.defineFunction('clz_i64', [ValueType.Int64], [], (f, a) => {
      a.const_i64(1n); a.clz_i64();
    }).withExport();
    mod.defineFunction('ctz_i64', [ValueType.Int64], [], (f, a) => {
      a.const_i64(16n); a.ctz_i64();
    }).withExport();
    mod.defineFunction('popcnt_i64', [ValueType.Int64], [], (f, a) => {
      a.const_i64(0b10110010n); a.popcnt_i64();
    }).withExport();
    mod.defineFunction('div_i64_u', [ValueType.Int64], [], (f, a) => {
      a.const_i64(100n); a.const_i64(10n); a.div_i64_u();
    }).withExport();
    mod.defineFunction('rem_i64_u', [ValueType.Int64], [], (f, a) => {
      a.const_i64(17n); a.const_i64(5n); a.rem_i64_u();
    }).withExport();
    mod.defineFunction('shr_i64_u', [ValueType.Int64], [], (f, a) => {
      a.const_i64(-1n); a.const_i64(1n); a.shr_i64_u();
    }).withExport();
    mod.defineFunction('rotl_i64', [ValueType.Int64], [], (f, a) => {
      a.const_i64(1n); a.const_i64(1n); a.rotl_i64();
    }).withExport();
    mod.defineFunction('rotr_i64', [ValueType.Int64], [], (f, a) => {
      a.const_i64(2n); a.const_i64(1n); a.rotr_i64();
    }).withExport();

    // f32 unary ops
    mod.defineFunction('trunc_f32', [ValueType.Float32], [], (f, a) => {
      a.const_f32(2.7); a.trunc_f32();
    }).withExport();
    mod.defineFunction('nearest_f32', [ValueType.Float32], [], (f, a) => {
      a.const_f32(2.7); a.nearest_f32();
    }).withExport();

    // f64 ops
    mod.defineFunction('abs_f64', [ValueType.Float64], [], (f, a) => {
      a.const_f64(-5.5); a.abs_f64();
    }).withExport();
    mod.defineFunction('neg_f64', [ValueType.Float64], [], (f, a) => {
      a.const_f64(5.5); a.neg_f64();
    }).withExport();
    mod.defineFunction('sub_f64', [ValueType.Float64], [], (f, a) => {
      a.const_f64(10.0); a.const_f64(3.5); a.sub_f64();
    }).withExport();

    const result = await mod.instantiate();
    exports = result.instance.exports;
  });

  // i32 bit ops
  test('clz_i32', () => expect(exports.clz_i32()).toBe(31));
  test('ctz_i32', () => expect(exports.ctz_i32()).toBe(4));
  test('div_i32_u', () => expect(exports.div_i32_u()).toBe(10));
  test('rem_i32_u', () => expect(exports.rem_i32_u()).toBe(2));
  test('shr_i32_u', () => expect(exports.shr_i32_u()).toBe(0x7FFFFFFF));
  test('rotl_i32', () => expect(exports.rotl_i32()).toBe(2));
  test('rotr_i32', () => expect(exports.rotr_i32()).toBe(1));

  // i64 bit ops
  test('clz_i64', () => expect(exports.clz_i64()).toBe(63n));
  test('ctz_i64', () => expect(exports.ctz_i64()).toBe(4n));
  test('popcnt_i64', () => expect(exports.popcnt_i64()).toBe(4n));
  test('div_i64_u', () => expect(exports.div_i64_u()).toBe(10n));
  test('rem_i64_u', () => expect(exports.rem_i64_u()).toBe(2n));
  test('shr_i64_u', () => expect(exports.shr_i64_u()).toBe(0x7FFFFFFFFFFFFFFFn));
  test('rotl_i64', () => expect(exports.rotl_i64()).toBe(2n));
  test('rotr_i64', () => expect(exports.rotr_i64()).toBe(1n));

  // f32 unary ops
  test('trunc_f32', () => expect(exports.trunc_f32()).toBeCloseTo(2.0));
  test('nearest_f32', () => expect(exports.nearest_f32()).toBeCloseTo(3.0));

  // f64 ops
  test('abs_f64', () => expect(exports.abs_f64()).toBeCloseTo(5.5));
  test('neg_f64', () => expect(exports.neg_f64()).toBeCloseTo(-5.5));
  test('sub_f64', () => expect(exports.sub_f64()).toBeCloseTo(6.5));
});
