import { BlockType, ModuleBuilder, ValueType } from '../src/index'
import TestHelper from './TestHelper'
test('Import Function', async () => {

    const exportModuleBuilder = new ModuleBuilder("testModule");
    const exportFunction = exportModuleBuilder.defineFunction("inc", [ValueType.Int32], [ValueType.Int32], { export: true })
    exportFunction.createAssemblyEmitter(
        /**
         * @param {AssemblyEmitter} asm
         */
        asm => {
            asm.get_local(0);
            asm.const_i32(1);
            asm.add_i32();
        });


    const importModuleBuilder = new ModuleBuilder("other");
    const testFunction = importModuleBuilder.defineFunction("testFunc", [ValueType.Int32], [ValueType.Int32], { export: true })
    const functionImport = importModuleBuilder.importFunction("testModule", "inc", [ValueType.Int32], [ValueType.Int32]);
    testFunction.createAssemblyEmitter(
        /**
         * @param {AssemblyEmitter} asm
         */
        asm => {
            asm.get_local(0);
            asm.call(functionImport);
        });

        
    const exportModule = await exportModuleBuilder.instantiate();
    const importModule = await importModuleBuilder.instantiate({
        testModule: {
            inc: exportModule.instance.exports.inc
        }
    });

    importModule.instance.exports.testFunc(5);
});
