import { ModuleBuilder, ValueType, VerificationError } from '../src/index';

test('Global - Read', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  const globalX = moduleBuilder.defineGlobal(ValueType.Int32, false, 10);
  const func1 = moduleBuilder
    .defineFunction('testFunc', [ValueType.Int32], [ValueType.Int32])
    .withExport();
  func1.createEmitter((asm) => {
    asm.get_global(globalX);
    asm.get_local(0);
    asm.mul_i32();
  });

  const module = await moduleBuilder.instantiate();
  const fn = module.instance.exports.testFunc as CallableFunction;
  expect(fn(0)).toBe(0);
  expect(fn(2)).toBe(20);
  expect(fn(3)).toBe(30);
});

test('Global - Write', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  const globalX = moduleBuilder.defineGlobal(ValueType.Int32, true, 0);
  moduleBuilder
    .defineFunction('set', [], [ValueType.Int32], (f, a) => {
      a.get_local(0);
      a.set_global(globalX);
    })
    .withExport();
  moduleBuilder
    .defineFunction('get', [ValueType.Int32], [], (f, a) => {
      a.get_global(globalX);
    })
    .withExport();

  const module = await moduleBuilder.instantiate();
  const set = module.instance.exports.set as CallableFunction;
  const get = module.instance.exports.get as CallableFunction;
  expect(get()).toBe(0);
  set(42);
  expect(get()).toBe(42);
  set(100);
  expect(get()).toBe(100);
});

test('Global Import - Read', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  const globalX = moduleBuilder.importGlobal('sourceModule', 'someValue', ValueType.Int32, false);
  moduleBuilder
    .defineFunction('func1', [ValueType.Int32], [], (f, a) => {
      a.get_global(globalX);
    })
    .withExport();

  const module = await moduleBuilder.instantiate({ sourceModule: { someValue: 123 } });
  expect((module.instance.exports.func1 as CallableFunction)()).toBe(123);
});

test('Global Export - Read', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder.defineGlobal(ValueType.Int32, false, 124).withExport('global1');

  const module = await moduleBuilder.instantiate();
  expect((module.instance.exports.global1 as WebAssembly.Global).value).toBe(124);
});

test('Global Export - Mutable not allowed', () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  const mutableGlobal = moduleBuilder.defineGlobal(ValueType.Int32, true, 0);
  expect(() => moduleBuilder.exportGlobal(mutableGlobal, 'g')).toThrow(VerificationError);
});

test('Global Export - Mutable allowed with disableVerification', () => {
  const moduleBuilder = new ModuleBuilder('testModule', {
    generateNameSection: true,
    disableVerification: true,
  });
  const mutableGlobal = moduleBuilder.defineGlobal(ValueType.Int32, true, 0);
  expect(() => moduleBuilder.exportGlobal(mutableGlobal, 'g')).not.toThrow();
});

test('Global - Float32', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder
    .defineFunction('get', [ValueType.Float32], [], (f, a) => {
      a.const_f32(3.14);
    })
    .withExport();

  const module = await moduleBuilder.instantiate();
  expect((module.instance.exports.get as CallableFunction)()).toBeCloseTo(3.14);
});

test('Global Import - Duplicate throws', () => {
  const moduleBuilder = new ModuleBuilder('test');
  moduleBuilder.importGlobal('mod', 'g1', ValueType.Int32, false);
  expect(() => moduleBuilder.importGlobal('mod', 'g1', ValueType.Int32, false)).toThrow();
});
