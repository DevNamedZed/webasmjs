import { ModuleBuilder, ValueType } from "../src";
import TestHelper from "./TestHelper";

test('Memory - ', async () => {
    const moduleBuilder = new ModuleBuilder("testModule");
    const writeMemoryBuilder = moduleBuilder.defineFunction("writeMemory", [], [ValueType.Int32, ValueType.Int32], { export: true });
    const readMemoryBuilder = moduleBuilder.defineFunction("readMemory", [ValueType.Int32], [ValueType.Int32], { export: true });
    moduleBuilder.defineMemory(100, 100);
    readMemoryBuilder.createAssemblyEmitter(
        asm => {
            asm.get_local(0);
            asm.load8_i32(0, 0);
        });
    writeMemoryBuilder.createAssemblyEmitter(
        asm => {
            asm.get_local(0);
            asm.get_local(1);
            asm.store8_i32(0, 0);
        });        
        
    const module = await moduleBuilder.instantiate();
    const readMemory = module.instance.exports.readMemory;
    const writeMemory = module.instance.exports.writeMemory;

    for (let address = 0, value = 1; value < 100; address++, value += 3){
        writeMemory(address, value);
    }

    
    for (let address = 0, value = 1; value < 100; address++, value += 3){
        expect(readMemory(address)).toBe(value);
    }
});
