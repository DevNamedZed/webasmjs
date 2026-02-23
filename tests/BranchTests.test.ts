import { BlockType, ValueType } from '../src/index';
import TestHelper from './TestHelper';

test('If Test', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    ValueType.Int32,
    [ValueType.Int32],
    (asm) => {
      asm.get_local(0);
      asm.const_i32(1000);
      asm.lt_i32_u();

      asm.if(BlockType.Void, () => {
        asm.const_i32(1000);
        asm.set_local(0);
      });

      asm.get_local(0);
      asm.end();
    }
  );

  expect(testFunction(500)).toBe(1000);
  expect(testFunction(2000)).toBe(2000);
});

test('If Test - No Callback', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    ValueType.Int32,
    [ValueType.Int32],
    (asm) => {
      asm.get_local(0);
      asm.const_i32(1000);
      asm.lt_i32_u();

      asm.if(BlockType.Void);
      asm.const_i32(1000);
      asm.set_local(0);
      asm.end();

      asm.get_local(0);
      asm.end();
    }
  );

  expect(testFunction(500)).toBe(1000);
  expect(testFunction(2000)).toBe(2000);
});

test('Branch to entry enclosure', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    [],
    [],
    (asm) => {
      asm.block(BlockType.Void);
      asm.br(asm.entryLabel);
      asm.end();
      asm.end();
    }
  );

  expect(() => testFunction()).not.toThrow();
});

test('Loop Test', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    [ValueType.Int32],
    [ValueType.Int32],
    (asm) => {
      asm.block(BlockType.Void, (mainLabel) => {
        asm.loop(BlockType.Void, (loopLabel) => {
          asm.get_local(0);
          asm.const_i32(1000);
          asm.gt_i32_u();
          asm.br_if(mainLabel);

          asm.get_local(0);
          asm.const_i32(1);
          asm.add_i32();
          asm.set_local(0);
          asm.br(loopLabel);
        });
      });

      asm.get_local(0);
      asm.end();
    }
  );

  expect(testFunction(0)).toBe(1001);
  expect(testFunction(999)).toBe(1001);
});

test('Loop Test - No Callback', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    [ValueType.Int32],
    [ValueType.Int32],
    (asm) => {
      const mainLabel = asm.block(BlockType.Void);
      const loopLabel = asm.loop(BlockType.Void);

      asm.get_local(0);
      asm.const_i32(1000);
      asm.gt_i32_u();
      asm.br_if(mainLabel);

      asm.get_local(0);
      asm.const_i32(1);
      asm.add_i32();
      asm.set_local(0);
      asm.br(loopLabel);

      asm.end();
      asm.end();

      asm.get_local(0);
      asm.end();
    }
  );

  expect(testFunction(0)).toBe(1001);
});

test('Branch Table Test', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    [ValueType.Int32],
    [ValueType.Int32],
    (asm) => {
      asm.block(BlockType.Void, (main) => {
        asm.block(BlockType.Void, (case1) => {
          asm.block(BlockType.Void, (case2) => {
            asm.block(BlockType.Void, (case3) => {
              asm.block(BlockType.Void, (caseDefault) => {
                asm.get_local(0);
                asm.br_table(caseDefault, caseDefault, case1, case2, case3);
              });

              asm.const_i32(0);
              asm.set_local(0);
              asm.br(main);
            });

            asm.const_i32(3);
            asm.set_local(0);
            asm.br(main);
          });

          asm.const_i32(2);
          asm.set_local(0);
          asm.br(main);
        });

        asm.const_i32(1);
        asm.set_local(0);
      });

      asm.get_local(0);
      asm.end();
    }
  );

  expect(testFunction(0)).toBe(0);
  expect(testFunction(1)).toBe(1);
  expect(testFunction(2)).toBe(2);
  expect(testFunction(3)).toBe(3);
  expect(testFunction(4)).toBe(0);
});
