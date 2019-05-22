import { ModuleBuilder, ValueType } from '../src/index'
import VerificationTest from './VerificationTest';

test('Global - Read', async () => {
    const moduleBuilder = new ModuleBuilder("testModule");
    const globalX = moduleBuilder.defineGlobal(ValueType.Int32, false, 10);
    const func1 = moduleBuilder
        .defineFunction("testFunc", [ValueType.Int32], [ValueType.Int32])
        .withExport();
    const parameter = func1.getParameter(0);
    func1.createEmitter(
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
    moduleBuilder.defineFunction("func1", [ValueType.Int32], [], (f, a) =>{
        a.get_global(globalX);
    }).withExport();

    const module = await moduleBuilder.instantiate({
        sourceModule: {
            someValue: 123
        }
    });

    expect(module.instance.exports.func1()).toBe(123);
});

test('Global Export - Read', async () => {
    const moduleBuilder = new ModuleBuilder("testModule");
    moduleBuilder.defineGlobal(ValueType.Int32, false, 124)
        .withExport('global1');

    const module = await moduleBuilder.instantiate();
    expect(module.instance.exports.global1).toBe(124);
});


// test('Global Export - Verify Mutable Not Supported', async () => {

//     await VerificationTest.assertVerification(
//         [ValueType.Int32], 
//         [ValueType.Int32],
//         asm => {
//             asm.const_i32(0);
//             asm.drop();
//             asm.end();
//         });
// });
