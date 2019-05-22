import { BlockType, ModuleBuilder, ValueType } from '../src/index'
import TestHelper from './TestHelper'
test('Export Function', async () => {

    const moduleBuilder = new ModuleBuilder("testModule");
    moduleBuilder.defineFunction("func1", [ValueType.Int32], [], (f, a) => { a.const_i32(1); f.withExport() });
    moduleBuilder.defineFunction("func2", [ValueType.Int32], [], (f, a) => { a.const_i32(2); f.withExport() });
    moduleBuilder.defineFunction("func3", [ValueType.Int32], [], (f, a) => { a.const_i32(3); f.withExport() });
    moduleBuilder.defineFunction("func4", [ValueType.Int32], [], (f, a) => { a.const_i32(4); f.withExport() });
    moduleBuilder.defineFunction("func5", [ValueType.Int32], [], (f, a) => { a.const_i32(5); f.withExport() });


    const module = await moduleBuilder.instantiate();
    expect(module.instance.exports.func1()).toBe(1);
    expect(module.instance.exports.func2()).toBe(2);
    expect(module.instance.exports.func3()).toBe(3);
    expect(module.instance.exports.func4()).toBe(4);
    expect(module.instance.exports.func5()).toBe(5);
});

test('Export Function - Alternative Name', async () => {

    const moduleBuilder = new ModuleBuilder("testModule");
    moduleBuilder.defineFunction("func1A", [ValueType.Int32], [], (f, a) => a.const_i32(1)).withExport('func1');
    moduleBuilder.defineFunction("func2A", [ValueType.Int32], [], (f, a) => a.const_i32(2)).withExport('func2');
    moduleBuilder.defineFunction("func3A", [ValueType.Int32], [], (f, a) => a.const_i32(3)).withExport('func3');
    moduleBuilder.defineFunction("func4A", [ValueType.Int32], [], (f, a) => a.const_i32(4)).withExport('func4');
    moduleBuilder.defineFunction("func5A", [ValueType.Int32], [], (f, a) => a.const_i32(5)).withExport('func5');

    const module = await moduleBuilder.instantiate();
    expect(module.instance.exports.func1()).toBe(1);
    expect(module.instance.exports.func2()).toBe(2);
    expect(module.instance.exports.func3()).toBe(3);
    expect(module.instance.exports.func4()).toBe(4);
    expect(module.instance.exports.func5()).toBe(5);
});


test('Export Global', async () => {


});
