import { ValueType } from '../src/index';
import TestHelper from './TestHelper';

test('Function Parameter - single param', async () => {
  await TestHelper.validateFunction(
    'add',
    ValueType.Int32,
    [ValueType.Int32],
    (asm) => {
      asm.get_local(0);
      asm.const_i32(1);
      asm.add_i32();
      asm.end();
    },
    56,
    55
  );
});

test('Function Parameter - two params', async () => {
  const fn = await TestHelper.compileFunction(
    'add',
    ValueType.Int32,
    [ValueType.Int32, ValueType.Int32],
    (asm) => {
      asm.get_local(0);
      asm.get_local(1);
      asm.add_i32();
      asm.end();
    }
  );

  expect(fn(3, 4)).toBe(7);
  expect(fn(100, 200)).toBe(300);
});

test('Function Parameter - mixed types', async () => {
  const fn = await TestHelper.compileFunction(
    'test',
    ValueType.Float64,
    [ValueType.Float64, ValueType.Float64],
    (asm) => {
      asm.get_local(0);
      asm.get_local(1);
      asm.add_f64();
      asm.end();
    }
  );

  expect(fn(1.5, 2.5)).toBeCloseTo(4.0);
});

test('Function Parameter - no return', async () => {
  const fn = await TestHelper.compileFunction(
    'test',
    [],
    [ValueType.Int32],
    (asm) => {
      asm.get_local(0);
      asm.drop();
      asm.end();
    }
  );

  expect(() => fn(42)).not.toThrow();
});
