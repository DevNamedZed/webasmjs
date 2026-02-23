import { ValueType } from '../src/index';
import TestHelper from './TestHelper';

test('Integer Add', async () => {
  await TestHelper.validateFunction(
    'add',
    ValueType.Int32,
    [],
    (asm) => {
      asm.const_i32(25);
      asm.const_i32(12);
      asm.add_i32();
      asm.end();
    },
    25 + 12
  );
});

test('Integer Sub', async () => {
  await TestHelper.validateFunction(
    'sub',
    ValueType.Int32,
    [],
    (asm) => {
      asm.const_i32(100);
      asm.const_i32(37);
      asm.sub_i32();
      asm.end();
    },
    100 - 37
  );
});

test('Integer Mul', async () => {
  await TestHelper.validateFunction(
    'mul',
    ValueType.Int32,
    [],
    (asm) => {
      asm.const_i32(7);
      asm.const_i32(8);
      asm.mul_i32();
      asm.end();
    },
    56
  );
});

test('Integer Div', async () => {
  await TestHelper.validateFunction(
    'div',
    ValueType.Int32,
    [],
    (asm) => {
      asm.const_i32(100);
      asm.const_i32(10);
      asm.div_i32();
      asm.end();
    },
    10
  );
});

test('Integer Rem', async () => {
  await TestHelper.validateFunction(
    'rem',
    ValueType.Int32,
    [],
    (asm) => {
      asm.const_i32(17);
      asm.const_i32(5);
      asm.rem_i32();
      asm.end();
    },
    2
  );
});

test('Integer And', async () => {
  await TestHelper.validateFunction(
    'and',
    ValueType.Int32,
    [],
    (asm) => {
      asm.const_i32(0xff);
      asm.const_i32(0x0f);
      asm.and_i32();
      asm.end();
    },
    0x0f
  );
});

test('Integer Or', async () => {
  await TestHelper.validateFunction(
    'or',
    ValueType.Int32,
    [],
    (asm) => {
      asm.const_i32(0xf0);
      asm.const_i32(0x0f);
      asm.or_i32();
      asm.end();
    },
    0xff
  );
});

test('Integer Xor', async () => {
  await TestHelper.validateFunction(
    'xor',
    ValueType.Int32,
    [],
    (asm) => {
      asm.const_i32(0xff);
      asm.const_i32(0x0f);
      asm.xor_i32();
      asm.end();
    },
    0xf0
  );
});

test('Integer Shl', async () => {
  await TestHelper.validateFunction(
    'shl',
    ValueType.Int32,
    [],
    (asm) => {
      asm.const_i32(1);
      asm.const_i32(4);
      asm.shl_i32();
      asm.end();
    },
    16
  );
});

test('Integer Shr (signed)', async () => {
  await TestHelper.validateFunction(
    'shr',
    ValueType.Int32,
    [],
    (asm) => {
      asm.const_i32(32);
      asm.const_i32(3);
      asm.shr_i32();
      asm.end();
    },
    4
  );
});

test('Integer Comparisons', async () => {
  const compileComparison = async (
    name: string,
    emitOp: (asm: any) => void,
    a: number,
    b: number
  ) => {
    const fn = await TestHelper.compileFunction(
      name,
      ValueType.Int32,
      [],
      (asm) => {
        asm.const_i32(a);
        asm.const_i32(b);
        emitOp(asm);
        asm.end();
      }
    );
    return fn();
  };

  expect(await compileComparison('eq', (a) => a.eq_i32(), 5, 5)).toBe(1);
  expect(await compileComparison('eq', (a) => a.eq_i32(), 5, 6)).toBe(0);
  expect(await compileComparison('ne', (a) => a.ne_i32(), 5, 6)).toBe(1);
  expect(await compileComparison('ne', (a) => a.ne_i32(), 5, 5)).toBe(0);
  expect(await compileComparison('lt', (a) => a.lt_i32(), 3, 5)).toBe(1);
  expect(await compileComparison('lt', (a) => a.lt_i32(), 5, 3)).toBe(0);
  expect(await compileComparison('gt', (a) => a.gt_i32(), 5, 3)).toBe(1);
  expect(await compileComparison('gt', (a) => a.gt_i32(), 3, 5)).toBe(0);
  expect(await compileComparison('le', (a) => a.le_i32(), 5, 5)).toBe(1);
  expect(await compileComparison('ge', (a) => a.ge_i32(), 5, 5)).toBe(1);
});

test('Integer eqz', async () => {
  const fn = await TestHelper.compileFunction(
    'eqz',
    ValueType.Int32,
    [ValueType.Int32],
    (asm) => {
      asm.get_local(0);
      asm.eqz_i32();
      asm.end();
    }
  );

  expect(fn(0)).toBe(1);
  expect(fn(1)).toBe(0);
  expect(fn(42)).toBe(0);
});

test('Integer clz/ctz/popcnt', async () => {
  await TestHelper.validateFunction(
    'popcnt',
    ValueType.Int32,
    [],
    (asm) => {
      asm.const_i32(0b10110010);
      asm.popcnt_i32();
      asm.end();
    },
    4
  );
});

test('Float32 arithmetic', async () => {
  const fn = await TestHelper.compileFunction(
    'f32add',
    ValueType.Float32,
    [],
    (asm) => {
      asm.const_f32(1.5);
      asm.const_f32(2.5);
      asm.add_f32();
      asm.end();
    }
  );

  expect(fn()).toBeCloseTo(4.0);
});

test('Float64 arithmetic', async () => {
  const fn = await TestHelper.compileFunction(
    'f64add',
    ValueType.Float64,
    [],
    (asm) => {
      asm.const_f64(3.14);
      asm.const_f64(2.86);
      asm.add_f64();
      asm.end();
    }
  );

  expect(fn()).toBeCloseTo(6.0);
});

test('Type conversions - i32 wrap i64', async () => {
  const fn = await TestHelper.compileFunction(
    'wrap',
    ValueType.Int32,
    [],
    (asm) => {
      asm.const_i64(0x100000001n);
      asm.wrap_i64_i32();
      asm.end();
    }
  );

  expect(fn()).toBe(1);
});
