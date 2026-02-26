import ModuleBuilder from '../src/ModuleBuilder';
import { ValueType } from '../src/types';

const latestOpts = { target: 'latest' as const };

describe('Relaxed SIMD integration', () => {
  test('relaxed_min_f32x4', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineFunction('test', ValueType.V128, [ValueType.V128, ValueType.V128], (f, asm) => {
      asm.get_local(f.getParameter(0));
      asm.get_local(f.getParameter(1));
      asm.relaxed_min_f32x4();
    }).withExport();
    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('relaxed_max_f32x4', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineFunction('test', ValueType.V128, [ValueType.V128, ValueType.V128], (f, asm) => {
      asm.get_local(f.getParameter(0));
      asm.get_local(f.getParameter(1));
      asm.relaxed_max_f32x4();
    }).withExport();
    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('relaxed_min_f64x2 and relaxed_max_f64x2', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineFunction('test', null, [ValueType.V128, ValueType.V128], (f, asm) => {
      asm.get_local(f.getParameter(0));
      asm.get_local(f.getParameter(1));
      asm.relaxed_min_f64x2();
      asm.drop();
      asm.get_local(f.getParameter(0));
      asm.get_local(f.getParameter(1));
      asm.relaxed_max_f64x2();
      asm.drop();
    }).withExport();
    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('relaxed_trunc_f32x4_s/u_i32x4', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineFunction('test', null, [ValueType.V128], (f, asm) => {
      asm.get_local(f.getParameter(0));
      asm.relaxed_trunc_f32x4_s_i32x4();
      asm.drop();
      asm.get_local(f.getParameter(0));
      asm.relaxed_trunc_f32x4_u_i32x4();
      asm.drop();
    }).withExport();
    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('relaxed_trunc_f64x2_s/u_zero_i32x4', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineFunction('test', null, [ValueType.V128], (f, asm) => {
      asm.get_local(f.getParameter(0));
      asm.relaxed_trunc_f64x2_s_zero_i32x4();
      asm.drop();
      asm.get_local(f.getParameter(0));
      asm.relaxed_trunc_f64x2_u_zero_i32x4();
      asm.drop();
    }).withExport();
    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('relaxed_madd_f32x4 and relaxed_nmadd_f32x4', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineFunction('test', null, [ValueType.V128, ValueType.V128, ValueType.V128], (f, asm) => {
      asm.get_local(f.getParameter(0));
      asm.get_local(f.getParameter(1));
      asm.get_local(f.getParameter(2));
      asm.relaxed_madd_f32x4();
      asm.drop();
      asm.get_local(f.getParameter(0));
      asm.get_local(f.getParameter(1));
      asm.get_local(f.getParameter(2));
      asm.relaxed_nmadd_f32x4();
      asm.drop();
    }).withExport();
    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('relaxed_madd_f64x2 and relaxed_nmadd_f64x2', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineFunction('test', null, [ValueType.V128, ValueType.V128, ValueType.V128], (f, asm) => {
      asm.get_local(f.getParameter(0));
      asm.get_local(f.getParameter(1));
      asm.get_local(f.getParameter(2));
      asm.relaxed_madd_f64x2();
      asm.drop();
      asm.get_local(f.getParameter(0));
      asm.get_local(f.getParameter(1));
      asm.get_local(f.getParameter(2));
      asm.relaxed_nmadd_f64x2();
      asm.drop();
    }).withExport();
    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('relaxed_laneselect_i8x16', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineFunction('test', ValueType.V128, [ValueType.V128, ValueType.V128, ValueType.V128], (f, asm) => {
      asm.get_local(f.getParameter(0));
      asm.get_local(f.getParameter(1));
      asm.get_local(f.getParameter(2));
      asm.relaxed_laneselect_i8x16();
    }).withExport();
    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('relaxed_swizzle_i8x16', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineFunction('test', ValueType.V128, [ValueType.V128, ValueType.V128], (f, asm) => {
      asm.get_local(f.getParameter(0));
      asm.get_local(f.getParameter(1));
      asm.relaxed_swizzle_i8x16();
    }).withExport();
    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('relaxed_q15mulr_s_i16x8', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineFunction('test', ValueType.V128, [ValueType.V128, ValueType.V128], (f, asm) => {
      asm.get_local(f.getParameter(0));
      asm.get_local(f.getParameter(1));
      asm.relaxed_q15mulr_s_i16x8();
    }).withExport();
    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('relaxed_dot_i8x16_i7x16_s_i16x8', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineFunction('test', ValueType.V128, [ValueType.V128, ValueType.V128], (f, asm) => {
      asm.get_local(f.getParameter(0));
      asm.get_local(f.getParameter(1));
      asm.relaxed_dot_i8x16_i7x16_s_i16x8();
    }).withExport();
    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });
});
