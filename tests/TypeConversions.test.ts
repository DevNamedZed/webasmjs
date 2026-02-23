import { ValueType } from '../src/index';
import TestHelper from './TestHelper';

test('Wrap i64 to i32', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_i64(0x100000042n);
    asm.wrap_i64_i32();
    asm.end();
  });
  expect(fn()).toBe(0x42);
});

test('Extend i32 to i64 signed', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i32(-1);
    asm.extend_i32_s_i64();
    asm.end();
  });
  expect(fn()).toBe(-1n);
});

test('Extend i32 to i64 unsigned', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i32(-1);
    asm.extend_i32_u_i64();
    asm.end();
  });
  expect(fn()).toBe(4294967295n);
});

test('Trunc f32 to i32 signed', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_f32(-3.7);
    asm.trunc_f32_s_i32();
    asm.end();
  });
  expect(fn()).toBe(-3);
});

test('Trunc f64 to i32 signed', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_f64(42.9);
    asm.trunc_f64_s_i32();
    asm.end();
  });
  expect(fn()).toBe(42);
});

test('Convert i32 to f32 signed', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
    asm.const_i32(42);
    asm.convert_i32_s_f32();
    asm.end();
  });
  expect(fn()).toBeCloseTo(42.0);
});

test('Convert i32 to f64 signed', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_i32(-100);
    asm.convert_i32_s_f64();
    asm.end();
  });
  expect(fn()).toBeCloseTo(-100.0);
});

test('Promote f32 to f64', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_f32(3.14);
    asm.promote_f32_f64();
    asm.end();
  });
  expect(fn()).toBeCloseTo(3.14, 2);
});

test('Demote f64 to f32', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
    asm.const_f64(3.14159265);
    asm.demote_f64_f32();
    asm.end();
  });
  expect(fn()).toBeCloseTo(3.14159, 4);
});

test('Reinterpret f32 as i32', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_f32(1.0);
    asm.reinterpret_f32_i32();
    asm.end();
  });
  // IEEE 754 1.0f = 0x3f800000
  expect(fn()).toBe(0x3f800000);
});

test('Reinterpret i32 as f32', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
    asm.const_i32(0x3f800000);
    asm.reinterpret_i32_f32();
    asm.end();
  });
  expect(fn()).toBeCloseTo(1.0);
});

test('Reinterpret f64 as i64', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_f64(1.0);
    asm.reinterpret_f64_i64();
    asm.end();
  });
  // IEEE 754 1.0 = 0x3FF0000000000000
  expect(fn()).toBe(0x3FF0000000000000n);
});

test('Reinterpret i64 as f64', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_i64(0x3FF0000000000000n);
    asm.reinterpret_i64_f64();
    asm.end();
  });
  expect(fn()).toBeCloseTo(1.0);
});

test('Type Conversion - i32.trunc_f32_u', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_f32(42.9);
    asm.trunc_f32_u_i32();
    asm.end();
  });
  expect(fn()).toBe(42);
});

test('Type Conversion - i64.extend_i32_u', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i32(-1);
    asm.extend_i32_u_i64();
    asm.end();
  });
  expect(fn()).toBe(4294967295n);
});

test('Type Conversion - f64.convert_i32_u', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_i32(-1);
    asm.convert_i32_u_f64();
    asm.end();
  });
  expect(fn()).toBeCloseTo(4294967295.0);
});
