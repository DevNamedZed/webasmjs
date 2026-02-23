import { ModuleBuilder, ValueType, ElementType } from '../src/index';
import BinaryReader from '../src/BinaryReader';

test('BinaryReader - reads magic and version', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.version).toBe(1);
});

test('BinaryReader - reads types', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.get_local(1);
    a.add_i32();
  }).withExport();
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.types.length).toBeGreaterThanOrEqual(1);
  expect(result.types[0].parameterTypes).toHaveLength(2);
  expect(result.types[0].returnTypes).toHaveLength(1);
});

test('BinaryReader - reads exports', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('fn1', [ValueType.Int32], [], (f, a) => a.const_i32(1)).withExport();
  mod.defineFunction('fn2', [ValueType.Int32], [], (f, a) => a.const_i32(2)).withExport();
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.exports).toHaveLength(2);
  expect(result.exports[0].name).toBe('fn1');
  expect(result.exports[1].name).toBe('fn2');
});

test('BinaryReader - reads functions', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('fn1', [ValueType.Int32], [], (f, a) => a.const_i32(1)).withExport();
  mod.defineFunction('fn2', [ValueType.Int32], [], (f, a) => a.const_i32(2)).withExport();
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.functions).toHaveLength(2);
});

test('BinaryReader - reads memory', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  mod.defineMemory(1, 4);
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.memories).toHaveLength(1);
  expect(result.memories[0].initial).toBe(1);
  expect(result.memories[0].maximum).toBe(4);
});

test('BinaryReader - reads globals', () => {
  const mod = new ModuleBuilder('test');
  mod.defineGlobal(ValueType.Int32, false, 42).withExport('g');
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.globals).toHaveLength(1);
  expect(result.globals[0].mutable).toBe(false);
});

test('BinaryReader - reads data segments', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  mod.defineData(new Uint8Array([1, 2, 3]), 0);
  mod.defineMemory(1);
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.data).toHaveLength(1);
  expect(Array.from(result.data[0].data)).toEqual([1, 2, 3]);
});

test('BinaryReader - reads imports', () => {
  const mod = new ModuleBuilder('test');
  mod.importFunction('env', 'log', null, [ValueType.Int32]);
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.imports).toHaveLength(1);
  expect(result.imports[0].moduleName).toBe('env');
  expect(result.imports[0].fieldName).toBe('log');
  expect(result.imports[0].kind).toBe(0); // Function
});

test('BinaryReader - reads custom sections', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  mod.defineCustomSection('myCustom', new Uint8Array([10, 20, 30]));
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  const custom = result.customSections.find((s) => s.name === 'myCustom');
  expect(custom).toBeDefined();
  expect(Array.from(custom!.data)).toEqual([10, 20, 30]);
});

test('BinaryReader - reads start section', () => {
  const mod = new ModuleBuilder('test');
  const globalX = mod.defineGlobal(ValueType.Int32, true, 0);
  const startFn = mod.defineFunction('_start', null, [], (f, a) => {
    a.const_i32(1);
    a.set_global(globalX);
  });
  mod.setStartFunction(startFn);
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.start).not.toBeNull();
});

test('BinaryReader - invalid magic throws', () => {
  const reader = new BinaryReader(new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0]));
  expect(() => reader.read()).toThrow('Invalid WASM magic header');
});

test('BinaryReader - roundtrip validates', async () => {
  const mod = new ModuleBuilder('roundtrip');
  mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.get_local(1);
    a.add_i32();
  }).withExport();
  mod.defineMemory(1, 4);
  mod.defineGlobal(ValueType.Int32, false, 100).withExport('g');

  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  expect(info.types.length).toBeGreaterThan(0);
  expect(info.functions.length).toBe(1);
  expect(info.memories.length).toBe(1);
  expect(info.globals.length).toBe(1);
  expect(info.exports.length).toBe(2);
});
