import { ModuleBuilder, ValueType } from "../src";
import TestHelper from "./TestHelper";

test('Data - ', async () => {
    const moduleBuilder = new ModuleBuilder("testModule");
    const func1 = moduleBuilder.defineFunction("testFunc", [ValueType.Int32], [], { export: true });
    moduleBuilder.defineData(new Uint8Array([55]), 0);
    moduleBuilder.defineMemory(2, 2);
    func1.createAssemblyEmitter(
        asm => {
            asm.const_i32(0);
            asm.load8_i32_u(0, 0);
        });
        
    const module = await moduleBuilder.instantiate();
    expect(module.instance.exports.testFunc()).toBe(55);
});