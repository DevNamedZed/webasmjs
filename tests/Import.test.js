import { BlockType, ModuleBuilder, ValueType } from '../src/index'
import TestHelper from './TestHelper'
test('Import Function', async () => {

    const exportModuleBuilder = new ModuleBuilder("testModule");
    exportModuleBuilder.defineFunction("inc", [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(0);
        a.const_i32(1);
        a.add_i32();
    }).withExport();

    const importModuleBuilder = new ModuleBuilder("other");
    const functionImport = importModuleBuilder.importFunction("testModule", "inc", [ValueType.Int32], [ValueType.Int32]);
    importModuleBuilder.defineFunction("testFunc", [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(0);
        a.call(functionImport);
    }).withExport()
        
    const exportModule = await exportModuleBuilder.instantiate();
    const importModule = await importModuleBuilder.instantiate({
        testModule: {
            inc: exportModule.instance.exports.inc
        }
    });

    expect(importModule.instance.exports.testFunc(5)).toBe(6);
    expect(importModule.instance.exports.testFunc(544)).toBe(545);
    expect(importModule.instance.exports.testFunc(2155447)).toBe(2155448);
});

