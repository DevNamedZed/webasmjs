import { ModuleBuilder, ValueType } from '../src/index';

test('Data - read data segment', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder
    .defineFunction('testFunc', [ValueType.Int32], [], (f, a) => {
      a.const_i32(0);
      a.load8_i32_u(0, 0);
    })
    .withExport();
  moduleBuilder.defineData(new Uint8Array([55]), 0);
  moduleBuilder.defineMemory(1, 1);

  const module = await moduleBuilder.instantiate();
  expect((module.instance.exports.testFunc as CallableFunction)()).toBe(55);
});

test('Data - multiple bytes', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder
    .defineFunction('read', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(0);
      a.load8_i32_u(0, 0);
    })
    .withExport();
  moduleBuilder.defineData(new Uint8Array([10, 20, 30, 40, 50]), 0);
  moduleBuilder.defineMemory(1, 1);

  const module = await moduleBuilder.instantiate();
  const read = module.instance.exports.read as CallableFunction;
  expect(read(0)).toBe(10);
  expect(read(1)).toBe(20);
  expect(read(2)).toBe(30);
  expect(read(3)).toBe(40);
  expect(read(4)).toBe(50);
});

test('Data - with offset', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder
    .defineFunction('read', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(0);
      a.load8_i32_u(0, 0);
    })
    .withExport();
  moduleBuilder.defineData(new Uint8Array([99]), 100);
  moduleBuilder.defineMemory(1, 1);

  const module = await moduleBuilder.instantiate();
  const read = module.instance.exports.read as CallableFunction;
  expect(read(100)).toBe(99);
});

test('Data - string data', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder
    .defineFunction('read', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(0);
      a.load8_i32_u(0, 0);
    })
    .withExport();

  const encoder = new TextEncoder();
  const helloBytes = encoder.encode('Hello');
  moduleBuilder.defineData(helloBytes, 0);
  moduleBuilder.defineMemory(1, 1);

  const module = await moduleBuilder.instantiate();
  const read = module.instance.exports.read as CallableFunction;
  expect(read(0)).toBe(72); // 'H'
  expect(read(1)).toBe(101); // 'e'
  expect(read(4)).toBe(111); // 'o'
});
