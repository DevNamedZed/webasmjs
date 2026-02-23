import { ValueType } from '../src/index';
import TestHelper from './TestHelper';

test('I64 - Add', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i64(100n);
    asm.const_i64(200n);
    asm.add_i64();
    asm.end();
  });
  expect(fn()).toBe(300n);
});

test('I64 - Sub', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i64(500n);
    asm.const_i64(200n);
    asm.sub_i64();
    asm.end();
  });
  expect(fn()).toBe(300n);
});

test('I64 - Mul', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i64(7n);
    asm.const_i64(8n);
    asm.mul_i64();
    asm.end();
  });
  expect(fn()).toBe(56n);
});

test('I64 - Div signed', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i64(100n);
    asm.const_i64(10n);
    asm.div_i64();
    asm.end();
  });
  expect(fn()).toBe(10n);
});

test('I64 - Rem', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i64(17n);
    asm.const_i64(5n);
    asm.rem_i64();
    asm.end();
  });
  expect(fn()).toBe(2n);
});

test('I64 - And', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i64(0xFFn);
    asm.const_i64(0x0Fn);
    asm.and_i64();
    asm.end();
  });
  expect(fn()).toBe(0x0Fn);
});

test('I64 - Or', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i64(0xF0n);
    asm.const_i64(0x0Fn);
    asm.or_i64();
    asm.end();
  });
  expect(fn()).toBe(0xFFn);
});

test('I64 - Xor', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i64(0xFFn);
    asm.const_i64(0x0Fn);
    asm.xor_i64();
    asm.end();
  });
  expect(fn()).toBe(0xF0n);
});

test('I64 - Shl', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i64(1n);
    asm.const_i64(32n);
    asm.shl_i64();
    asm.end();
  });
  expect(fn()).toBe(4294967296n);
});

test('I64 - Shr signed', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i64(4294967296n);
    asm.const_i64(32n);
    asm.shr_i64();
    asm.end();
  });
  expect(fn()).toBe(1n);
});

test('I64 - Comparisons', async () => {
  // eq
  let fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_i64(5n);
    asm.const_i64(5n);
    asm.eq_i64();
    asm.end();
  });
  expect(fn()).toBe(1);

  // ne
  fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_i64(5n);
    asm.const_i64(6n);
    asm.ne_i64();
    asm.end();
  });
  expect(fn()).toBe(1);

  // lt_s
  fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_i64(3n);
    asm.const_i64(5n);
    asm.lt_i64();
    asm.end();
  });
  expect(fn()).toBe(1);

  // eqz
  fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_i64(0n);
    asm.eqz_i64();
    asm.end();
  });
  expect(fn()).toBe(1);
});

test('I64 - Extend from i32', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i32(42);
    asm.extend_i32_s_i64();
    asm.end();
  });
  expect(fn()).toBe(42n);
});

test('I64 - Extend from i32 unsigned', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int64, [], (asm) => {
    asm.const_i32(-1);
    asm.extend_i32_u_i64();
    asm.end();
  });
  expect(fn()).toBe(4294967295n);
});
