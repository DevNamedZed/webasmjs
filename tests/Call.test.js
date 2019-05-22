import { BlockType, ElementType, ModuleBuilder, ValueType, FunctionEmitter } from '../src/index'
import TestHelper from './TestHelper'

/**
 * Tests a call to another function in the same module.
 */
test('Call Function', async () => {

    const moduleBuilder = new ModuleBuilder("testModule");
    const incFunction = moduleBuilder.defineFunction("inc", [ValueType.Int32], [ValueType.Int32]).withExport();
    const testFunction = moduleBuilder.defineFunction("testFunc", [ValueType.Int32], [ValueType.Int32]).withExport()

    incFunction.createEmitter(
        asm => {
            asm.get_local(0);
            asm.const_i32(1);
            asm.add_i32();
        });
    testFunction.createEmitter(
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
    func1.createEmitter(
        asm => {
            asm.const_i32(1);
        });
    func2.createEmitter(
        asm => {
            asm.const_i32(2);
        });

    // Create a table and initialize the first two elements with the function indexes.
    const testFunction = moduleBuilder
        .defineFunction("testFunc", [ValueType.Int32], [ValueType.Int32])
        .withExport()
    const parameterX = testFunction.getParameter(0)
        .withName("x");
    const funcType = moduleBuilder.defineFuncType([ValueType.Int32], []);
    const table = moduleBuilder.defineTable(ElementType.AnyFunc, 2, 2);
    table.defineTableSegment([func1, func2], 0);

    testFunction.createEmitter(
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



test('Table - Export ', async () => {
    const moduleBuilder = new ModuleBuilder("testModule");

    // Create functions and a table. Use a table segment two set the first two values
    // in the table to be the indicies of the functions. 
    const func1 = moduleBuilder.defineFunction("func1", [ValueType.Int32], [],
        (f, a) => a.const_i32(1));
    const func2 = moduleBuilder.defineFunction("func2", [ValueType.Int32], [],
        (f, a) => a.const_i32(2));
    const func3 = moduleBuilder.defineFunction("func3", [ValueType.Int32], [],
        (f, a) => a.const_i32(2));
    const func4 = moduleBuilder.defineFunction("func4", [ValueType.Int32], [],
        (f, a) => a.const_i32(200));

    moduleBuilder.defineTable(ElementType.AnyFunc, 2, 2)
        .withExport('table1')
        .defineTableSegment([func1, func4], 0);

    const testFunction = moduleBuilder.defineFunction(
        "testFunc",
        [ValueType.Int32],
        [ValueType.Int32])
        .withExport()
    const address = testFunction.getParameter(0)
        .withName("address");
    testFunction.createEmitter(
        asm => {
            asm.get_local(address);
            asm.call_indirect(moduleBuilder.defineFuncType([ValueType.Int32], []));
        });

    const module = await moduleBuilder.instantiate();
    expect(module.instance.exports.table1.get(0)()).toBe(1);
    expect(module.instance.exports.table1.get(1)()).toBe(200);
});

test('Table - Import', async () => {
    const exportModuleBuilder = new ModuleBuilder("exportModule");
    const func1 = exportModuleBuilder.defineFunction("func1", [ValueType.Int32], [], 
        (f, a) => a.const_i32(10)).withExport();
    const func2 = exportModuleBuilder.defineFunction("func2", [ValueType.Int32], [], 
        (f, a) => a.const_i32(20)).withExport();        
    exportModuleBuilder.defineTable(ElementType.AnyFunc, 2, 2)
        .withExport('t1')
        .defineTableSegment([func1, func2], 0);

    const moduleBuilder = new ModuleBuilder("testModule");
    moduleBuilder.importTable('tableImport', 't1', ElementType.AnyFunc, 2, 2)
    moduleBuilder.defineFunction(
        "testFunc",
        [ValueType.Int32],
        [ValueType.Int32], 
        (f, a) => {
            const address = f.getParameter(0)
                .withName("address");
            a.get_local(address);
            a.call_indirect(moduleBuilder.defineFuncType([ValueType.Int32], []));
        })
        .withExport()

    const exportModule = await exportModuleBuilder.instantiate();
    const module = await moduleBuilder.instantiate({
        tableImport: {
            t1: exportModule.instance.exports.t1
        }
    });
    expect(module.instance.exports.testFunc(0)).toBe(10);
    expect(module.instance.exports.testFunc(1)).toBe(20);
});

test('Table - Import Javascript API', async () => {
    const exportModuleBuilder = new ModuleBuilder("exportModule");
    exportModuleBuilder.defineFunction("func1", [ValueType.Int32], [], 
        (f, a) => a.const_i32(10)).withExport();
    exportModuleBuilder.defineFunction("func2", [ValueType.Int32], [], 
        (f, a) => a.const_i32(20)).withExport();        
    const exportModule = await exportModuleBuilder.instantiate();

    const table = new WebAssembly.Table({ initial: 2, maximum: 2, element: ElementType.AnyFunc.name });
    table.set(0, exportModule.instance.exports.func1)
    table.set(1, exportModule.instance.exports.func2)

    const moduleBuilder = new ModuleBuilder("testModule");
    moduleBuilder.importTable('tableImport', 't1', ElementType.AnyFunc, 2, 2)
    moduleBuilder.defineFunction(
        "testFunc",
        [ValueType.Int32],
        [ValueType.Int32], 
        (f, a) => {
            const address = f.getParameter(0)
                .withName("address");
            a.get_local(address);
            a.call_indirect(moduleBuilder.defineFuncType([ValueType.Int32], []));
        })
        .withExport()

    const module = await moduleBuilder.instantiate({
        tableImport: {
            t1: table
        }
    });
    expect(module.instance.exports.testFunc(0)).toBe(10);
    expect(module.instance.exports.testFunc(1)).toBe(20);
});