import { BlockType, ModuleBuilder, ValueType, ElementType } from '../src/index';

test('Import Function', async () => {
  const exportModuleBuilder = new ModuleBuilder('testModule');
  exportModuleBuilder.defineFunction('inc', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.const_i32(1);
    a.add_i32();
  }).withExport();

  const importModuleBuilder = new ModuleBuilder('other');
  const functionImport = importModuleBuilder.importFunction('testModule', 'inc', [ValueType.Int32], [ValueType.Int32]);
  importModuleBuilder.defineFunction('testFunc', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.call(functionImport);
  }).withExport();

  const exportModule = await exportModuleBuilder.instantiate();
  const importModule = await importModuleBuilder.instantiate({
    testModule: { inc: exportModule.instance.exports.inc },
  });

  expect((importModule.instance.exports.testFunc as CallableFunction)(5)).toBe(6);
  expect((importModule.instance.exports.testFunc as CallableFunction)(2155447)).toBe(2155448);
});

test('Import Function - Duplicate throws', () => {
  const moduleBuilder = new ModuleBuilder('test');
  moduleBuilder.importFunction('mod', 'fn', [ValueType.Int32], []);
  expect(() => moduleBuilder.importFunction('mod', 'fn', [ValueType.Int32], [])).toThrow();
});

test('Import Memory', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder.defineFunction('readMemory', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.load8_i32(0, 0);
  }).withExport();
  moduleBuilder.importMemory('importModule', 'mem', 1, 1);

  const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
  new Uint8Array(memory.buffer)[0] = 77;

  const module = await moduleBuilder.instantiate({ importModule: { mem: memory } });
  expect((module.instance.exports.readMemory as CallableFunction)(0)).toBe(77);
});

test('Import Memory - Only one allowed', () => {
  const moduleBuilder = new ModuleBuilder('test');
  moduleBuilder.importMemory('mod', 'mem1', 1);
  expect(() => moduleBuilder.importMemory('mod', 'mem2', 1)).toThrow();
});

test('Import Global', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  const globalX = moduleBuilder.importGlobal('sourceModule', 'someValue', ValueType.Int32, false);
  moduleBuilder.defineFunction('func1', [ValueType.Int32], [], (f, a) => {
    a.get_global(globalX);
  }).withExport();

  const module = await moduleBuilder.instantiate({ sourceModule: { someValue: 123 } });
  expect((module.instance.exports.func1 as CallableFunction)()).toBe(123);
});

test('Import Table', async () => {
  const exportModuleBuilder = new ModuleBuilder('exportModule');
  const func1 = exportModuleBuilder.defineFunction('func1', [ValueType.Int32], [], (f, a) => a.const_i32(10)).withExport();
  const func2 = exportModuleBuilder.defineFunction('func2', [ValueType.Int32], [], (f, a) => a.const_i32(20)).withExport();
  exportModuleBuilder.defineTable(ElementType.AnyFunc, 2, 2)
    .withExport('t1')
    .defineTableSegment([func1, func2], 0);

  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder.importTable('tableImport', 't1', ElementType.AnyFunc, 2, 2);
  moduleBuilder.defineFunction('testFunc', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.call_indirect(moduleBuilder.defineFuncType([ValueType.Int32], []));
  }).withExport();

  const exportModule = await exportModuleBuilder.instantiate();
  const module = await moduleBuilder.instantiate({ tableImport: { t1: exportModule.instance.exports.t1 } });
  expect((module.instance.exports.testFunc as CallableFunction)(0)).toBe(10);
  expect((module.instance.exports.testFunc as CallableFunction)(1)).toBe(20);
});
