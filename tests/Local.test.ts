import { ValueType } from '../src/index';
import TestHelper from './TestHelper';

test('Local - declare and use', async () => {
  const fn = await TestHelper.compileFunction(
    'test',
    ValueType.Int32,
    [ValueType.Int32],
    (asm) => {
      const localX = asm.declareLocal(ValueType.Int32, 'x');
      asm.const_i32(1000);
      asm.tee_local(localX);
      asm.get_local(0);
      asm.add_i32();
      asm.end();
    }
  );

  expect(fn(5)).toBe(1005);
  expect(fn(0)).toBe(1000);
});

test('Local - multiple locals', async () => {
  const fn = await TestHelper.compileFunction(
    'test',
    ValueType.Int32,
    [],
    (asm) => {
      const a = asm.declareLocal(ValueType.Int32, 'a');
      const b = asm.declareLocal(ValueType.Int32, 'b');

      asm.const_i32(10);
      asm.set_local(a);
      asm.const_i32(20);
      asm.set_local(b);

      asm.get_local(a);
      asm.get_local(b);
      asm.add_i32();
      asm.end();
    }
  );

  expect(fn()).toBe(30);
});

test('Local - tee_local', async () => {
  const fn = await TestHelper.compileFunction(
    'test',
    ValueType.Int32,
    [],
    (asm) => {
      const x = asm.declareLocal(ValueType.Int32, 'x');
      asm.const_i32(42);
      asm.tee_local(x);
      asm.get_local(x);
      asm.add_i32();
      asm.end();
    }
  );

  expect(fn()).toBe(84);
});

test('Local - i64 local', async () => {
  const fn = await TestHelper.compileFunction(
    'test',
    ValueType.Int64,
    [],
    (asm) => {
      const x = asm.declareLocal(ValueType.Int64, 'x');
      asm.const_i64(999n);
      asm.set_local(x);
      asm.get_local(x);
      asm.end();
    }
  );

  expect(fn()).toBe(999n);
});

test('Local - f32 and f64 locals', async () => {
  const fn = await TestHelper.compileFunction(
    'test',
    ValueType.Float64,
    [],
    (asm) => {
      const a = asm.declareLocal(ValueType.Float32, 'a');
      const b = asm.declareLocal(ValueType.Float64, 'b');
      asm.const_f32(1.5);
      asm.set_local(a);
      asm.const_f64(2.5);
      asm.set_local(b);
      // promote f32 to f64 and add
      asm.get_local(a);
      asm.promote_f32_f64();
      asm.get_local(b);
      asm.add_f64();
      asm.end();
    }
  );

  expect(fn()).toBeCloseTo(4.0);
});

test('Local - many mixed-type locals', async () => {
  const fn = await TestHelper.compileFunction(
    'test',
    ValueType.Int32,
    [],
    (asm) => {
      const i = asm.declareLocal(ValueType.Int32, 'i');
      const j = asm.declareLocal(ValueType.Int32, 'j');
      const k = asm.declareLocal(ValueType.Int64, 'k');
      const f = asm.declareLocal(ValueType.Float32, 'f');
      const d = asm.declareLocal(ValueType.Float64, 'd');

      asm.const_i32(10);
      asm.set_local(i);
      asm.const_i32(20);
      asm.set_local(j);
      asm.const_i64(30n);
      asm.set_local(k);
      asm.const_f32(1.0);
      asm.set_local(f);
      asm.const_f64(2.0);
      asm.set_local(d);

      // Return i + j
      asm.get_local(i);
      asm.get_local(j);
      asm.add_i32();
      asm.end();
    }
  );

  expect(fn()).toBe(30);
});
