import { ModuleBuilder, ValueType, ElementType, BlockType } from '../src/index';

test('TextModuleWriter - module header', () => {
  const mod = new ModuleBuilder('myModule');
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  const text = mod.toString();
  expect(text).toContain('(module $myModule');
  expect(text.endsWith(')')).toBe(true);
});

test('TextModuleWriter - types section', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.get_local(1);
    a.add_i32();
  }).withExport();
  const text = mod.toString();
  expect(text).toContain('(type');
  expect(text).toContain('(param i32 i32)');
  expect(text).toContain('(result i32)');
});

test('TextModuleWriter - function with instructions', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('inc', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.const_i32(1);
    a.add_i32();
  }).withExport();
  const text = mod.toString();
  expect(text).toContain('(func $inc');
  expect(text).toContain('local.get');
  expect(text).toContain('i32.const 1');
  expect(text).toContain('i32.add');
});

test('TextModuleWriter - exports', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => a.const_i32(1)).withExport('myExport');
  const text = mod.toString();
  expect(text).toContain('(export "myExport" (func');
});

test('TextModuleWriter - memory', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  mod.defineMemory(1, 4);
  const text = mod.toString();
  expect(text).toContain('(memory');
  expect(text).toContain('1 4');
});

test('TextModuleWriter - global', () => {
  const mod = new ModuleBuilder('test');
  mod.defineGlobal(ValueType.Int32, false, 42).withExport('g');
  const text = mod.toString();
  expect(text).toContain('(global');
  expect(text).toContain('i32');
  expect(text).toContain('i32.const 42');
});

test('TextModuleWriter - mutable global', () => {
  const mod = new ModuleBuilder('test', { generateNameSection: true, disableVerification: true });
  mod.defineGlobal(ValueType.Int32, true, 0).withExport('g');
  const text = mod.toString();
  expect(text).toContain('(mut i32)');
});

test('TextModuleWriter - imports', () => {
  const mod = new ModuleBuilder('test');
  mod.importFunction('env', 'log', null, [ValueType.Int32]);
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  const text = mod.toString();
  expect(text).toContain('(import "env" "log"');
  expect(text).toContain('(func');
});

test('TextModuleWriter - table', () => {
  const mod = new ModuleBuilder('test');
  const func1 = mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => a.const_i32(1));
  mod.defineTable(ElementType.AnyFunc, 1, 1)
    .defineTableSegment([func1], 0);
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  const text = mod.toString();
  expect(text).toContain('(table');
  expect(text).toContain('anyfunc');
});

test('TextModuleWriter - data segment', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  mod.defineData(new Uint8Array([72, 101, 108, 108, 111]), 0); // "Hello"
  mod.defineMemory(1);
  const text = mod.toString();
  expect(text).toContain('(data');
  expect(text).toContain('Hello');
});

test('TextModuleWriter - start section', () => {
  const mod = new ModuleBuilder('test');
  const startFn = mod.defineFunction('_start', null, [], (f, a) => {});
  mod.setStartFunction(startFn);
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  const text = mod.toString();
  expect(text).toContain('(start');
});

test('TextModuleWriter - block/loop indentation', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('fn', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.block(BlockType.Void, (b) => {
      a.loop(BlockType.Void, (l) => {
        a.get_local(0);
        a.const_i32(10);
        a.gt_i32();
        a.br_if(b);
        a.get_local(0);
        a.const_i32(1);
        a.add_i32();
        a.set_local(0);
        a.br(l);
      });
    });
    a.get_local(0);
  }).withExport();

  const text = mod.toString();
  expect(text).toContain('block');
  expect(text).toContain('loop');
  expect(text).toContain('end');
});
