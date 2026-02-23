import { ModuleBuilder, ValueType } from '../src/index';

describe('comparisons', () => {
  let exports: any;

  beforeAll(async () => {
    const mod = new ModuleBuilder('test');

    // i32 unsigned
    mod.defineFunction('le_i32_u', [ValueType.Int32], [], (f, a) => {
      a.const_i32(-1); a.const_i32(0); a.le_i32_u();
    }).withExport();
    mod.defineFunction('ge_i32_u', [ValueType.Int32], [], (f, a) => {
      a.const_i32(-1); a.const_i32(0); a.ge_i32_u();
    }).withExport();

    // i64 comparisons
    mod.defineFunction('lt_i64_u', [ValueType.Int32], [], (f, a) => {
      a.const_i64(1n); a.const_i64(2n); a.lt_i64_u();
    }).withExport();
    mod.defineFunction('gt_i64', [ValueType.Int32], [], (f, a) => {
      a.const_i64(5n); a.const_i64(3n); a.gt_i64();
    }).withExport();
    mod.defineFunction('gt_i64_u', [ValueType.Int32], [], (f, a) => {
      a.const_i64(5n); a.const_i64(3n); a.gt_i64_u();
    }).withExport();
    mod.defineFunction('le_i64', [ValueType.Int32], [], (f, a) => {
      a.const_i64(5n); a.const_i64(5n); a.le_i64();
    }).withExport();
    mod.defineFunction('le_i64_u', [ValueType.Int32], [], (f, a) => {
      a.const_i64(3n); a.const_i64(5n); a.le_i64_u();
    }).withExport();
    mod.defineFunction('ge_i64', [ValueType.Int32], [], (f, a) => {
      a.const_i64(5n); a.const_i64(5n); a.ge_i64();
    }).withExport();
    mod.defineFunction('ge_i64_u', [ValueType.Int32], [], (f, a) => {
      a.const_i64(5n); a.const_i64(3n); a.ge_i64_u();
    }).withExport();

    // f32 comparisons
    mod.defineFunction('ne_f32', [ValueType.Int32], [], (f, a) => {
      a.const_f32(3.0); a.const_f32(5.0); a.ne_f32();
    }).withExport();
    mod.defineFunction('gt_f32', [ValueType.Int32], [], (f, a) => {
      a.const_f32(5.0); a.const_f32(3.0); a.gt_f32();
    }).withExport();
    mod.defineFunction('le_f32', [ValueType.Int32], [], (f, a) => {
      a.const_f32(3.0); a.const_f32(3.0); a.le_f32();
    }).withExport();
    mod.defineFunction('ge_f32', [ValueType.Int32], [], (f, a) => {
      a.const_f32(5.0); a.const_f32(3.0); a.ge_f32();
    }).withExport();

    // f64 comparisons
    mod.defineFunction('eq_f64', [ValueType.Int32], [], (f, a) => {
      a.const_f64(3.14); a.const_f64(3.14); a.eq_f64();
    }).withExport();
    mod.defineFunction('ne_f64', [ValueType.Int32], [], (f, a) => {
      a.const_f64(3.14); a.const_f64(2.71); a.ne_f64();
    }).withExport();
    mod.defineFunction('le_f64', [ValueType.Int32], [], (f, a) => {
      a.const_f64(3.0); a.const_f64(3.0); a.le_f64();
    }).withExport();
    mod.defineFunction('ge_f64', [ValueType.Int32], [], (f, a) => {
      a.const_f64(5.0); a.const_f64(3.0); a.ge_f64();
    }).withExport();

    const result = await mod.instantiate();
    exports = result.instance.exports;
  });

  // i32 unsigned
  test('le_i32_u', () => expect(exports.le_i32_u()).toBe(0));
  test('ge_i32_u', () => expect(exports.ge_i32_u()).toBe(1));

  // i64
  test('lt_i64_u', () => expect(exports.lt_i64_u()).toBe(1));
  test('gt_i64', () => expect(exports.gt_i64()).toBe(1));
  test('gt_i64_u', () => expect(exports.gt_i64_u()).toBe(1));
  test('le_i64', () => expect(exports.le_i64()).toBe(1));
  test('le_i64_u', () => expect(exports.le_i64_u()).toBe(1));
  test('ge_i64', () => expect(exports.ge_i64()).toBe(1));
  test('ge_i64_u', () => expect(exports.ge_i64_u()).toBe(1));

  // f32
  test('ne_f32', () => expect(exports.ne_f32()).toBe(1));
  test('gt_f32', () => expect(exports.gt_f32()).toBe(1));
  test('le_f32', () => expect(exports.le_f32()).toBe(1));
  test('ge_f32', () => expect(exports.ge_f32()).toBe(1));

  // f64
  test('eq_f64', () => expect(exports.eq_f64()).toBe(1));
  test('ne_f64', () => expect(exports.ne_f64()).toBe(1));
  test('le_f64', () => expect(exports.le_f64()).toBe(1));
  test('ge_f64', () => expect(exports.ge_f64()).toBe(1));
});
