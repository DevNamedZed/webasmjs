import { ModuleBuilder, BinaryReader, ValueType, ElementType, parseWat, TextModuleWriter } from '../src/index';

test('Roundtrip - binary structure matches builder', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('voidFn', null, [], (f, a) => {
    a.nop();
  }).withExport();
  mod.defineFunction('returnI32', [ValueType.Int32], [], (f, a) => {
    a.const_i32(42);
  }).withExport();

  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  expect(info.functions.length).toBe(2);
  // The two functions have different signatures (void->void and void->i32),
  // so there should be 2 distinct types.
  expect(info.types.length).toBe(2);
});

test('Roundtrip - WAT parse roundtrip', async () => {
  // Start from WAT text, parse to module, verify binary works,
  // then get WAT text from the parsed module and verify it contains
  // expected content.
  const watText = `
    (module $test
      (func $add (param i32) (param i32) (result i32)
        local.get 0
        local.get 1
        i32.add
      )
      (export "add" (func $add))
    )
  `;

  // Parse WAT to a ModuleBuilder
  const mod = parseWat(watText);

  // Get the WAT text representation from the parsed module
  const generatedWat = mod.toString();
  expect(generatedWat).toContain('i32.add');
  expect(generatedWat).toContain('local.get');

  // Verify the binary from the parsed WAT module is functional
  const instance = await mod.instantiate();
  const add = instance.instance.exports.add as CallableFunction;
  expect(add(3, 4)).toBe(7);
  expect(add(100, 200)).toBe(300);

  // Verify binary roundtrip: toBytes -> BinaryReader -> verify structure
  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();
  expect(info.functions.length).toBe(1);
  expect(info.types.length).toBeGreaterThanOrEqual(1);
  expect(info.exports.length).toBe(1);
  expect(info.exports[0].name).toBe('add');
});

test('Roundtrip - module with memory', () => {
  const mod = new ModuleBuilder('test');
  mod.defineMemory(1);
  mod.defineFunction('store', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.get_local(f.getParameter(1));
    a.store_i32(2, 0);
  }).withExport();
  mod.defineFunction('load', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.load_i32(2, 0);
  }).withExport();

  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  expect(info.memories.length).toBe(1);
  expect(info.memories[0].initial).toBe(1);
});

test('Roundtrip - module with imports', () => {
  const mod = new ModuleBuilder('test');
  const logImport = mod.importFunction('env', 'log', null, [ValueType.Int32]);
  mod.defineFunction('callLog', null, [], (f, a) => {
    a.const_i32(42);
    a.call(logImport);
  }).withExport();

  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  expect(info.imports.length).toBe(1);
  expect(info.imports[0].moduleName).toBe('env');
  expect(info.imports[0].fieldName).toBe('log');
});

test('Roundtrip - module with start function', () => {
  const mod = new ModuleBuilder('test');
  const globalX = mod.defineGlobal(ValueType.Int32, true, 0);

  const startFn = mod.defineFunction('_start', null, [], (f, a) => {
    a.const_i32(99);
    a.set_global(globalX);
  });
  mod.setStartFunction(startFn);

  mod.defineFunction('getGlobal', [ValueType.Int32], [], (f, a) => {
    a.get_global(globalX);
  }).withExport();

  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  expect(info.start).not.toBeNull();
});
