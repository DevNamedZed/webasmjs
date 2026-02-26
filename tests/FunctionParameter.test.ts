import { ValueType } from '../src/index';
import ModuleBuilder from '../src/ModuleBuilder';
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

test('Function Parameter - i64 parameter', async () => {
  const fn = await TestHelper.compileFunction(
    'test',
    ValueType.Int64,
    [ValueType.Int64],
    (asm) => {
      asm.get_local(0);
      asm.const_i64(10n);
      asm.add_i64();
      asm.end();
    }
  );

  expect(fn(5n)).toBe(15n);
});

test('Function Parameter - f32 parameter', async () => {
  const fn = await TestHelper.compileFunction(
    'test',
    ValueType.Float32,
    [ValueType.Float32],
    (asm) => {
      asm.get_local(0);
      asm.const_f32(1.0);
      asm.add_f32();
      asm.end();
    }
  );

  expect(fn(2.5)).toBeCloseTo(3.5);
});

test('Function Parameter - mixed types (i32, f64, i32)', async () => {
  const fn = await TestHelper.compileFunction(
    'test',
    ValueType.Float64,
    [ValueType.Int32, ValueType.Float64, ValueType.Int32],
    (asm) => {
      // Convert first i32 to f64, add the f64 param, add converted second i32
      asm.get_local(0);
      asm.convert_i32_s_f64();
      asm.get_local(1);
      asm.add_f64();
      asm.get_local(2);
      asm.convert_i32_s_f64();
      asm.add_f64();
      asm.end();
    }
  );

  expect(fn(10, 0.5, 20)).toBeCloseTo(30.5);
});

test('Function Parameter - multi-value return', async () => {
  const mod = new ModuleBuilder('test', { target: '2.0' });
  const fn = mod.defineFunction('test', [ValueType.Int32, ValueType.Int32], [ValueType.Int32], (f, asm) => {
    // Return (param + 1, param + 2)
    asm.get_local(f.getParameter(0));
    asm.const_i32(1);
    asm.add_i32();
    asm.get_local(f.getParameter(0));
    asm.const_i32(2);
    asm.add_i32();
  });
  mod.exportFunction(fn);

  const instance = await mod.instantiate();
  const result = (instance.instance.exports.test as CallableFunction)(10);
  expect(result).toEqual([11, 12]);
});
