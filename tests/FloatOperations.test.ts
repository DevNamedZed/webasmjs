import { ValueType } from '../src/index';
import TestHelper from './TestHelper';

test('F32 - Add', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
    asm.const_f32(1.5);
    asm.const_f32(2.5);
    asm.add_f32();
    asm.end();
  });
  expect(fn()).toBeCloseTo(4.0);
});

test('F32 - Sub', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
    asm.const_f32(10.0);
    asm.const_f32(3.5);
    asm.sub_f32();
    asm.end();
  });
  expect(fn()).toBeCloseTo(6.5);
});

test('F32 - Mul', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
    asm.const_f32(3.0);
    asm.const_f32(4.0);
    asm.mul_f32();
    asm.end();
  });
  expect(fn()).toBeCloseTo(12.0);
});

test('F32 - Div', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
    asm.const_f32(10.0);
    asm.const_f32(4.0);
    asm.div_f32();
    asm.end();
  });
  expect(fn()).toBeCloseTo(2.5);
});

test('F32 - Min/Max', async () => {
  let fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
    asm.const_f32(3.0);
    asm.const_f32(5.0);
    asm.min_f32();
    asm.end();
  });
  expect(fn()).toBeCloseTo(3.0);

  fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
    asm.const_f32(3.0);
    asm.const_f32(5.0);
    asm.max_f32();
    asm.end();
  });
  expect(fn()).toBeCloseTo(5.0);
});

test('F32 - Abs/Neg', async () => {
  let fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
    asm.const_f32(-5.5);
    asm.abs_f32();
    asm.end();
  });
  expect(fn()).toBeCloseTo(5.5);

  fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
    asm.const_f32(5.5);
    asm.neg_f32();
    asm.end();
  });
  expect(fn()).toBeCloseTo(-5.5);
});

test('F32 - Sqrt', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
    asm.const_f32(25.0);
    asm.sqrt_f32();
    asm.end();
  });
  expect(fn()).toBeCloseTo(5.0);
});

test('F32 - Ceil/Floor', async () => {
  let fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
    asm.const_f32(2.3);
    asm.ceil_f32();
    asm.end();
  });
  expect(fn()).toBeCloseTo(3.0);

  fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
    asm.const_f32(2.7);
    asm.floor_f32();
    asm.end();
  });
  expect(fn()).toBeCloseTo(2.0);
});

test('F32 - Comparisons', async () => {
  let fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_f32(3.0);
    asm.const_f32(3.0);
    asm.eq_f32();
    asm.end();
  });
  expect(fn()).toBe(1);

  fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_f32(3.0);
    asm.const_f32(5.0);
    asm.lt_f32();
    asm.end();
  });
  expect(fn()).toBe(1);
});

test('F64 - Arithmetic', async () => {
  let fn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_f64(3.14159);
    asm.const_f64(2.71828);
    asm.add_f64();
    asm.end();
  });
  expect(fn()).toBeCloseTo(5.85987, 4);

  fn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_f64(10.0);
    asm.const_f64(3.0);
    asm.div_f64();
    asm.end();
  });
  expect(fn()).toBeCloseTo(3.33333, 4);
});

test('F64 - Min/Max', async () => {
  let fn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_f64(3.14);
    asm.const_f64(2.71);
    asm.min_f64();
    asm.end();
  });
  expect(fn()).toBeCloseTo(2.71);

  fn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_f64(3.14);
    asm.const_f64(2.71);
    asm.max_f64();
    asm.end();
  });
  expect(fn()).toBeCloseTo(3.14);
});

test('F64 - Sqrt', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_f64(144.0);
    asm.sqrt_f64();
    asm.end();
  });
  expect(fn()).toBeCloseTo(12.0);
});

test('F64 - Comparisons', async () => {
  let fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_f64(1.0);
    asm.const_f64(2.0);
    asm.lt_f64();
    asm.end();
  });
  expect(fn()).toBe(1);

  fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_f64(2.0);
    asm.const_f64(1.0);
    asm.gt_f64();
    asm.end();
  });
  expect(fn()).toBe(1);
});

test('Float Operations - f64 ceil/floor/trunc/nearest', async () => {
  const ceilFn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_f64(2.7);
    asm.ceil_f64();
    asm.end();
  });
  expect(ceilFn()).toBeCloseTo(3.0);

  const floorFn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_f64(2.7);
    asm.floor_f64();
    asm.end();
  });
  expect(floorFn()).toBeCloseTo(2.0);

  const truncFn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_f64(2.7);
    asm.trunc_f64();
    asm.end();
  });
  expect(truncFn()).toBeCloseTo(2.0);

  const nearestFn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_f64(2.7);
    asm.nearest_f64();
    asm.end();
  });
  expect(nearestFn()).toBeCloseTo(3.0);
});

test('Float Operations - f32 copysign', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Float32, [], (asm) => {
    asm.const_f32(5.0);
    asm.const_f32(-1.0);
    asm.copysign_f32();
    asm.end();
  });
  expect(fn()).toBeCloseTo(-5.0);
});

test('Float Operations - f64 copysign', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_f64(5.0);
    asm.const_f64(-1.0);
    asm.copysign_f64();
    asm.end();
  });
  expect(fn()).toBeCloseTo(-5.0);
});

test('Float Operations - infinity arithmetic', async () => {
  const addInfFn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_f64(Infinity);
    asm.const_f64(1.0);
    asm.add_f64();
    asm.end();
  });
  expect(addInfFn()).toBe(Infinity);

  const mulNegFn = await TestHelper.compileFunction('test', ValueType.Float64, [], (asm) => {
    asm.const_f64(Infinity);
    asm.const_f64(-1.0);
    asm.mul_f64();
    asm.end();
  });
  expect(mulNegFn()).toBe(-Infinity);
});
