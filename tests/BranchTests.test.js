import { BlockType, ModuleBuilder, ValueType, FunctionEmitter } from '../src/index'
import TestHelper from './TestHelper'

test('If Test', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    ValueType.Int32,
    [ValueType.Int32],
    asm => {
      // Push a value on to the stack indicating whether the parameter is less than 1000
      asm.get_local(0);
      asm.const_i32(1000);
      asm.lt_i32_u();

      // Update the paremeter to 1000 if the condition on the stack is true
      asm.if(BlockType.Void, () => {
        asm.const_i32(1000);
        asm.set_local(0)
      });

      // Push the result on the stack and end the function.
      asm.get_local(0);
      asm.end();
    });
});

test('Branch to entry enclosure', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    [],
    [],
    asm => {
      asm.block(BlockType.Void);
      asm.br(asm.entryLabel);
      asm.end();

      asm.end();
    });
});

test('Loop Test', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    [ValueType.Int32],
    [ValueType.Int32],
    asm => {
      asm.block(BlockType.Void, mainLabel => {
        asm.loop(BlockType.Void, loopLabel => {
          asm.get_local(0);
          asm.const_i32(1000);
          asm.gt_i32_u();
          asm.br_if(mainLabel);

          asm.get_local(0);
          asm.const_i32(1);
          asm.add_i32();
          asm.set_local(0);
          asm.br(loopLabel);
        })
      })

      asm.get_local(0);
      asm.end();
    });

});

test('Branch Table Test', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    [ValueType.Int32],
    [ValueType.Int32],
    asm => {
      asm.block(BlockType.Void, main => {
        asm.block(BlockType.Void, case1 => {
          asm.block(BlockType.Void, case2 => {
            asm.block(BlockType.Void, case3 => {
              asm.block(BlockType.Void, caseDefault => {
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

      // End the function.
      asm.get_local(0);
      asm.end();
    });

    expect(testFunction(0)).toBe(0);
    expect(testFunction(1)).toBe(1);
    expect(testFunction(2)).toBe(2);
    expect(testFunction(3)).toBe(3);
    expect(testFunction(4)).toBe(0);
});

test('Loop Test - No Callback', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    [ValueType.Int32],
    [ValueType.Int32],
    asm => {
      const mainLabel = asm.block(BlockType.Void);
      const loopLabel = asm.loop(BlockType.Void);

      // Check to see if the value if greater than 1000 otherwise exit the loop
      asm.get_local(0);
      asm.const_i32(1000);
      asm.gt_i32_u();
      asm.br_if(mainLabel);

      // Increment the value.
      asm.get_local(0);
      asm.const_i32(1);
      asm.add_i32();
      asm.set_local(0);
      asm.br(loopLabel);

      asm.end();
      asm.end();

      // End the function.
      asm.get_local(0);
      asm.end();
    });
});

test('If Test - No Callback', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    ValueType.Int32,
    [ValueType.Int32],
    asmGenerator => {
      // Push a value on to the stack indicating whether the parameter is less than 1000
      asmGenerator.get_local(0);
      asmGenerator.const_i32(1000);
      asmGenerator.lt_i32_u();

      // Update the paremeter to 1000 if the condition on the stack is true
      asmGenerator.if(BlockType.Void);
      asmGenerator.const_i32(1000);
      asmGenerator.set_local(0)
      asmGenerator.end();

      // Return the local
      asmGenerator.get_local(0);
      asmGenerator.end();
    });
});