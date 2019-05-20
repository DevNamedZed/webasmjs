import {  BlockType, ModuleBuilder, ValueType, FunctionEmitter } from '../src/index'
import TestHelper from './TestHelper'



test('aaaaaaaaaaa', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    ValueType.Int32,
    [ValueType.Int32],
    /**
     * @param {FunctionEmitter} asm
    */
    asm => {

  //    asm.const_i32(0)

      asm.block(BlockType.Int32, () =>{        
        asm.const_i32(5555555)  
      });

//      asm.drop();


      // // Push a value on to the stack indicating whether the parameter is less than 1000
      // asmGenerator.get_local(0);
      // asmGenerator.const_i32(1000);
      // asmGenerator.lt_i32_u();
    
      // asmGenerator.if(BlockType.Int32);
      // asmGenerator.get_local(0)
      // asmGenerator.else();
      // asmGenerator.const_i32(0)
      // asmGenerator.end();

      asm.end();
    });

    console.log(testFunction(5))
    console.log(testFunction(500000))
});




test('If Test', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    ValueType.Int32,
    [ValueType.Int32],
    /**
     * @param {AssemblyEmitter} asmGenerator
    */
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

test('If Test - Callback', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    ValueType.Int32,
    [ValueType.Int32],
    /**
     * @param {AssemblyEmitter} asm
    */
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
    /**
     * @param {AssemblyEmitter} asm
    */
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
    /**
     * @param {AssemblyEmitter} asm
    */
    asm => {
      const mainLabel = asm.block(BlockType.Void);
      const loopLabel = asm.loop(BlockType.Void);

      //asm.br(mainLabel);


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

test('Loop Test - Callback', async () => {
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

test('Table Test', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    [ValueType.Int32],
    [ValueType.Int32],
    asm => {      
      asm.block(BlockType.Void, main => {        
        asm.block(BlockType.Void, case1 => {
          asm.block(BlockType.Void, caseDefault => {
            asm.get_local(0);
            asm.br_table(caseDefault, caseDefault, case1);
          });

          asm.const_i32(0);
          asm.set_local(0);
          asm.br(main);
        });

        asm.const_i32(100);
        asm.set_local(0);
      });

      // End the function.
      asm.get_local(0);
      asm.end();
    });

    console.log(testFunction(1))
});


