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
