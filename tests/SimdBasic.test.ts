import { ModuleBuilder } from '../src/index';

const latestOpts = { generateNameSection: true, disableVerification: true, target: 'latest' as const };

describe('SIMD v128 load/store operations', () => {
  test('load_v128 and store_v128', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('test', null, [], (f, a) => {
      a.const_i32(0); a.const_v128(new Uint8Array(16)); a.store_v128(0, 0);
      a.const_i32(0); a.load_v128(0, 0); a.drop();
    }).withExport();

    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('extended load variants', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('test', null, [], (f, a) => {
      a.const_i32(0); a.load8x8_s_v128(0, 0); a.drop();
      a.const_i32(0); a.load8x8_u_v128(0, 0); a.drop();
      a.const_i32(0); a.load16x4_s_v128(0, 0); a.drop();
      a.const_i32(0); a.load16x4_u_v128(0, 0); a.drop();
      a.const_i32(0); a.load32x2_s_v128(0, 0); a.drop();
      a.const_i32(0); a.load32x2_u_v128(0, 0); a.drop();
    }).withExport();

    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('load splat variants', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('test', null, [], (f, a) => {
      a.const_i32(0); a.load8_splat_v128(0, 0); a.drop();
      a.const_i32(0); a.load16_splat_v128(0, 0); a.drop();
      a.const_i32(0); a.load32_splat_v128(0, 0); a.drop();
      a.const_i32(0); a.load64_splat_v128(0, 0); a.drop();
    }).withExport();

    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('load_zero variants', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('test', null, [], (f, a) => {
      a.const_i32(0); a.load32_zero_v128(0, 0); a.drop();
      a.const_i32(0); a.load64_zero_v128(0, 0); a.drop();
    }).withExport();

    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('load lane and store lane variants', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('test', null, [], (f, a) => {
      a.const_i32(0); a.const_v128(new Uint8Array(16)); a.load8_lane_v128(0, 0); a.drop();
      a.const_i32(0); a.const_v128(new Uint8Array(16)); a.load16_lane_v128(0, 0); a.drop();
      a.const_i32(0); a.const_v128(new Uint8Array(16)); a.load32_lane_v128(0, 0); a.drop();
      a.const_i32(0); a.const_v128(new Uint8Array(16)); a.load64_lane_v128(0, 0); a.drop();
      a.const_i32(0); a.const_v128(new Uint8Array(16)); a.store8_lane_v128(0, 0);
      a.const_i32(0); a.const_v128(new Uint8Array(16)); a.store16_lane_v128(0, 0);
      a.const_i32(0); a.const_v128(new Uint8Array(16)); a.store32_lane_v128(0, 0);
      a.const_i32(0); a.const_v128(new Uint8Array(16)); a.store64_lane_v128(0, 0);
    }).withExport();

    expect(mod.toBytes().length).toBeGreaterThan(0);
  });
});

describe('SIMD const, shuffle, swizzle', () => {
  test('const_v128, shuffle, swizzle', () => {
    const mod = new ModuleBuilder('test', latestOpts);

    mod.defineFunction('constTest', null, [], (f, a) => {
      a.const_v128(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]));
      a.drop();
    }).withExport();

    mod.defineFunction('shuffleTest', null, [], (f, a) => {
      a.const_v128(new Uint8Array(16));
      a.const_v128(new Uint8Array(16));
      a.shuffle_i8x16(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]));
      a.drop();
    }).withExport();

    mod.defineFunction('swizzleTest', null, [], (f, a) => {
      a.const_v128(new Uint8Array(16));
      a.const_v128(new Uint8Array(16));
      a.swizzle_i8x16();
      a.drop();
    }).withExport();

    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });
});

describe('SIMD splat operations', () => {
  test('all splat variants', () => {
    const mod = new ModuleBuilder('test', latestOpts);

    mod.defineFunction('test', null, [], (f, a) => {
      a.const_i32(1); a.splat_i8x16(); a.drop();
      a.const_i32(1); a.splat_i16x8(); a.drop();
      a.const_i32(1); a.splat_i32x4(); a.drop();
      a.const_i64(1n); a.splat_i64x2(); a.drop();
      a.const_f32(1.0); a.splat_f32x4(); a.drop();
      a.const_f64(1.0); a.splat_f64x2(); a.drop();
    }).withExport();

    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });
});

describe('SIMD extract/replace lane operations', () => {
  test('all extract and replace lane variants', () => {
    const mod = new ModuleBuilder('test', latestOpts);

    mod.defineFunction('test', null, [], (f, a) => {
      // i8x16
      a.const_v128(new Uint8Array(16)); a.extract_lane_s_i8x16(0); a.drop();
      a.const_v128(new Uint8Array(16)); a.extract_lane_u_i8x16(0); a.drop();
      a.const_v128(new Uint8Array(16)); a.const_i32(42); a.replace_lane_i8x16(0); a.drop();
      // i16x8
      a.const_v128(new Uint8Array(16)); a.extract_lane_s_i16x8(0); a.drop();
      a.const_v128(new Uint8Array(16)); a.extract_lane_u_i16x8(0); a.drop();
      a.const_v128(new Uint8Array(16)); a.const_i32(42); a.replace_lane_i16x8(0); a.drop();
      // i32x4, i64x2, f32x4, f64x2
      a.const_v128(new Uint8Array(16)); a.extract_lane_i32x4(0); a.drop();
      a.const_v128(new Uint8Array(16)); a.const_i32(42); a.replace_lane_i32x4(0); a.drop();
      a.const_v128(new Uint8Array(16)); a.extract_lane_i64x2(0); a.drop();
      a.const_v128(new Uint8Array(16)); a.const_i64(42n); a.replace_lane_i64x2(0); a.drop();
      a.const_v128(new Uint8Array(16)); a.extract_lane_f32x4(0); a.drop();
      a.const_v128(new Uint8Array(16)); a.const_f32(3.14); a.replace_lane_f32x4(0); a.drop();
      a.const_v128(new Uint8Array(16)); a.extract_lane_f64x2(0); a.drop();
      a.const_v128(new Uint8Array(16)); a.const_f64(3.14); a.replace_lane_f64x2(0); a.drop();
    }).withExport();

    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });
});
