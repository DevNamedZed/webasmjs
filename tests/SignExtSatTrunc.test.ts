import { ValueType } from '../src/index';
import TestHelper from './TestHelper';

const opts = { generateNameSection: true, disableVerification: false, target: 'latest' as const };

test('Sign Extend - i32.extend8_s', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_i32(0x80);  // 128, sign bit of byte is set
    asm.extend8_s_i32();
    asm.end();
  }, opts);
  expect(fn()).toBe(-128);
});

test('Sign Extend - i32.extend16_s', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_i32(0x8000);  // 32768, sign bit of 16-bit is set
    asm.extend16_s_i32();
    asm.end();
  }, opts);
  expect(fn()).toBe(-32768);
});

test('Sign Extend - i64.extend8_s', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i64(0x80n);
    asm.extend8_s_i64();
    asm.end();
  }, opts);
  expect(fn()).toBe(-128n);
});

test('Sign Extend - i64.extend16_s', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i64(0x8000n);
    asm.extend16_s_i64();
    asm.end();
  }, opts);
  expect(fn()).toBe(-32768n);
});

test('Saturating Trunc - f32 to i32 signed', async () => {
  // Normal value
  let fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_f32(42.9);
    asm.trunc_sat_f32_s_i32();
    asm.end();
  }, opts);
  expect(fn()).toBe(42);

  // Overflow saturates to max
  fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_f32(3e+38);
    asm.trunc_sat_f32_s_i32();
    asm.end();
  }, opts);
  expect(fn()).toBe(2147483647);
});

test('Saturating Trunc - f32 to i32 unsigned', async () => {
  let fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_f32(42.9);
    asm.trunc_sat_f32_u_i32();
    asm.end();
  }, opts);
  expect(fn()).toBe(42);

  // Negative saturates to 0
  fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_f32(-1.0);
    asm.trunc_sat_f32_u_i32();
    asm.end();
  }, opts);
  expect(fn()).toBe(0);
});

test('Saturating Trunc - f64 to i32 signed', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_f64(-3e+38);
    asm.trunc_sat_f64_s_i32();
    asm.end();
  }, opts);
  expect(fn()).toBe(-2147483648);
});

test('Feature gating - sign-extend blocked on mvp', async () => {
  const mvpOpts = { generateNameSection: true, disableVerification: false, target: 'mvp' as const };
  await expect(
    TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
      asm.const_i32(0x80);
      asm.extend8_s_i32();
      asm.end();
    }, mvpOpts)
  ).rejects.toThrow(/feature/);
});
