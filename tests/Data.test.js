import { ModuleBuilder, ValueType } from "../src";
import TestHelper from "./TestHelper";

test('Data - ', async () => {
    const moduleBuilder = new ModuleBuilder("testModule");
    moduleBuilder.defineFunction("testFunc", [ValueType.Int32], [], (f, a) => {
            a.const_i32(0);
            a.load8_i32_u(0, 0);
        })
        .withExport();
    moduleBuilder.defineData(new Uint8Array([55]), 0);
    moduleBuilder.defineMemory(1, 1);
        
    const module = await moduleBuilder.instantiate();
    expect(module.instance.exports.testFunc()).toBe(55);
});