import { ModuleBuilder, ValueType } from '../src/index'

test('Global - Read', async () => {
    const moduleBuilder = new ModuleBuilder("testModule");
    const globalX = moduleBuilder.defineGlobal(ValueType.Int32, false, 10);
    const func1 = moduleBuilder.defineFunction("testFunc", [ValueType.Int32], [ValueType.Int32], { export: true });
    const parameter = func1.getParameter(0);
    func1.createAssemblyEmitter(
        asm => {
            asm.get_global(globalX);
            asm.get_local(parameter)
            asm.mul_i32();
        });
        
    const module = await moduleBuilder.instantiate();
    expect(module.instance.exports.testFunc(0)).toBe(0);
    expect(module.instance.exports.testFunc(2)).toBe(20);
    expect(module.instance.exports.testFunc(3)).toBe(30);
});

test('Global Import - Read', async () => {
    const moduleBuilder = new ModuleBuilder("testModule");
    const globalX = moduleBuilder.importGlobal("sourceModule", "someValue", ValueType.Int32, false);
    const func1 = moduleBuilder.defineFunction("func1", [ValueType.Int32], [], { export: true });
    func1.createAssemblyEmitter(
        asm => {
            asm.get_global(globalX);
        });
    const module = await moduleBuilder.instantiate({
        sourceModule: {
            someValue: 123
        }
    });
    expect(module.instance.exports.func1()).toBe(123);
});
