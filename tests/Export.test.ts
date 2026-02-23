import { BlockType, ModuleBuilder, ValueType, ElementType } from '../src/index';

test('Export Function', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder.defineFunction('func1', [ValueType.Int32], [], (f, a) => { a.const_i32(1); f.withExport(); });
  moduleBuilder.defineFunction('func2', [ValueType.Int32], [], (f, a) => { a.const_i32(2); f.withExport(); });
  moduleBuilder.defineFunction('func3', [ValueType.Int32], [], (f, a) => { a.const_i32(3); f.withExport(); });

  const module = await moduleBuilder.instantiate();
  expect((module.instance.exports.func1 as CallableFunction)()).toBe(1);
  expect((module.instance.exports.func2 as CallableFunction)()).toBe(2);
  expect((module.instance.exports.func3 as CallableFunction)()).toBe(3);
});

test('Export Function - Alternative Name', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder.defineFunction('func1A', [ValueType.Int32], [], (f, a) => a.const_i32(1)).withExport('func1');
  moduleBuilder.defineFunction('func2A', [ValueType.Int32], [], (f, a) => a.const_i32(2)).withExport('func2');

  const module = await moduleBuilder.instantiate();
  expect((module.instance.exports.func1 as CallableFunction)()).toBe(1);
  expect((module.instance.exports.func2 as CallableFunction)()).toBe(2);
});

test('Export Function - Duplicate throws', () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  const func = moduleBuilder.defineFunction('func1', [ValueType.Int32], [], (f, a) => a.const_i32(1));
  func.withExport();
  expect(() => moduleBuilder.exportFunction(func)).toThrow();
});

test('Export Memory', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder.defineFunction('writeMemory', [], [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.get_local(1);
    a.store8_i32(0, 0);
  }).withExport();
  moduleBuilder.defineMemory(1, 1).withExport('mem');

  const module = await moduleBuilder.instantiate();
  const writeMemory = module.instance.exports.writeMemory as CallableFunction;
  writeMemory(0, 42);

  const mem = new Uint8Array((module.instance.exports.mem as WebAssembly.Memory).buffer);
  expect(mem[0]).toBe(42);
});

test('Export Global', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder.defineGlobal(ValueType.Int32, false, 124).withExport('global1');

  const module = await moduleBuilder.instantiate();
  expect((module.instance.exports.global1 as WebAssembly.Global).value).toBe(124);
});

test('Export Table', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  const func1 = moduleBuilder.defineFunction('func1', [ValueType.Int32], [], (f, a) => a.const_i32(42));
  moduleBuilder.defineTable(ElementType.AnyFunc, 1, 1)
    .withExport('tbl')
    .defineTableSegment([func1], 0);

  const module = await moduleBuilder.instantiate();
  const tbl = module.instance.exports.tbl as WebAssembly.Table;
  expect(tbl.length).toBe(1);
  expect(tbl.get(0)!()).toBe(42);
});
