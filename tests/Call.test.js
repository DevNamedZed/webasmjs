import { BlockType, ElementType, ModuleBuilder, ValueType, FunctionEmitter } from '../src/index'
import TestHelper from './TestHelper'

/**
 * Tests a call to another function in the same module.
 */
test('Call Function', async () => {

    const moduleBuilder = new ModuleBuilder("testModule");
    const incFunction = moduleBuilder.defineFunction("inc", [ValueType.Int32], [ValueType.Int32]);
    const testFunction = moduleBuilder.defineFunction("testFunc", [ValueType.Int32], [ValueType.Int32], { export: true })

    incFunction.createAssemblyEmitter(
        asm => {
            asm.get_local(0);
            asm.const_i32(1);
            asm.add_i32();
        });
    testFunction.createAssemblyEmitter(
        asm => {
            asm.get_local(0);
            asm.call(incFunction);
        });
        
    const module = await moduleBuilder.instantiate();
    expect(module.instance.exports.testFunc(5)).toBe(6);
    expect(module.instance.exports.testFunc(12345)).toBe(12346);
});


test('Call Indirect Function', async () => {
    // Create a moduble with two functions.
    const moduleBuilder = new ModuleBuilder("testModule");
    const func1 = moduleBuilder.defineFunction("func1", [ValueType.Int32], []);
    const func2 = moduleBuilder.defineFunction("func2", [ValueType.Int32], []);
    func1.createAssemblyEmitter(
        asm => {
            asm.const_i32(1);
        });
    func2.createAssemblyEmitter(
        asm => {
            asm.const_i32(2);
        });        

    // Create a table and initialize the first two elements with the function indexes.
    const testFunction = moduleBuilder.defineFunction(
        "testFunc", 
        [ValueType.Int32], 
        [ValueType.Int32], 
        { export: true })
    const parameterX = testFunction.getParameter(0)
        .withName("x");
    const funcType = moduleBuilder.defineFuncType([ValueType.Int32], []);
    const table = moduleBuilder.defineTable(ElementType.AnyFunc, 2, 2);
    table.defineTableSegment([func1, func2], 0);

    testFunction.createAssemblyEmitter(
        asm => {
            // Create a variable and set the value to the index of the first item in the table.
            const funcAddress = asm.declareLocal(
                ValueType.Int32,
                "x");
            asm.const_i32(0);
            asm.set_local(funcAddress);

            // If the parameter that was passed in does not equal zero than
            // set the funcAddress to the second item in the table.
            asm.get_local(parameterX);
            asm.const_i32(0);
            asm.ne_i32();
            asm.if(BlockType.Void, () => {
                asm.const_i32(1);
                asm.set_local(funcAddress);    
            })

            // Push the funcAddress local on the stack and attempt to call the function.
            asm.get_local(funcAddress);
            asm.call_indirect(funcType);
        });
        
    const module = await moduleBuilder.instantiate();
    expect(module.instance.exports.testFunc(0)).toBe(1);
    expect(module.instance.exports.testFunc(2)).toBe(2);
    expect(module.instance.exports.testFunc(3)).toBe(2);
});

