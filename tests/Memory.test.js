import { ModuleBuilder, ValueType } from "../src";
import TestHelper from "./TestHelper";

test('Memory - read/write', async () => {
    const moduleBuilder = new ModuleBuilder("testModule");
    moduleBuilder.defineFunction("writeMemory", [], [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(0);
        a.get_local(1);
        a.store8_i32(0, 0);
    })
        .withExport();
    moduleBuilder.defineFunction("readMemory", [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(0);
        a.load8_i32(0, 0);
    })
        .withExport();
    moduleBuilder.defineMemory(1, 1);

    const module = await moduleBuilder.instantiate();
    const readMemory = module.instance.exports.readMemory;
    const writeMemory = module.instance.exports.writeMemory;

    for (let address = 0, value = 1; value < 100; address++ , value += 3) {
        writeMemory(address, value);
    }

    for (let address = 0, value = 1; value < 100; address++ , value += 3) {
        expect(readMemory(address)).toBe(value);
    }
});


test('Memory - Import', async () => {
    const moduleBuilder = new ModuleBuilder("testModule");
    moduleBuilder.defineFunction("writeMemory", [], [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(0);
        a.get_local(1);
        a.store8_i32(0, 0);
    })
        .withExport();
    moduleBuilder.defineFunction("readMemory", [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(0);
        a.load8_i32(0, 0);
    })
        .withExport();
    moduleBuilder.importMemory('importModule', 'mem', 1, 1);

    const module = await moduleBuilder.instantiate({
        importModule: {
            mem: new WebAssembly.Memory({ initial: 1, maximum: 1 })
        }
    });
    const readMemory = module.instance.exports.readMemory;
    const writeMemory = module.instance.exports.writeMemory;

    for (let address = 0, value = 1; value < 100; address++ , value += 3) {
        writeMemory(address, value);
    }


    for (let address = 0, value = 1; value < 100; address++ , value += 3) {
        expect(readMemory(address)).toBe(value);
    }
});


test('Memory - Export', async () => {
    const moduleBuilder = new ModuleBuilder("testModule");
    moduleBuilder.defineFunction("writeMemory", [], [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(0);
        a.get_local(1);
        a.store8_i32(0, 0);
    }).withExport();
    moduleBuilder.defineMemory(1, 1).withExport('mem');

    const module = await moduleBuilder.instantiate();
    const writeMemory = module.instance.exports.writeMemory;
    for (let address = 0, value = 1; value < 100; address++ , value += 3) {
        writeMemory(address, value);
    }

    const mem = new Uint8Array(module.instance.exports.mem.buffer);
    for (let address = 0, value = 1; value < 100; address++ , value += 3) {
        expect(mem[address]).toBe(value);
    }
});
