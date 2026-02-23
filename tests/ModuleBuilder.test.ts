import { ModuleBuilder, ValueType, ElementType, VerificationError } from '../src/index';

test('ModuleBuilder - constructor', () => {
  const mod = new ModuleBuilder('test');
  expect(mod._name).toBe('test');
  expect(mod._functions).toHaveLength(0);
  expect(mod._imports).toHaveLength(0);
  expect(mod._exports).toHaveLength(0);
});

test('ModuleBuilder - name is required', () => {
  expect(() => new ModuleBuilder(null as any)).toThrow();
});

test('ModuleBuilder - defineFuncType deduplicates', () => {
  const mod = new ModuleBuilder('test');
  const t1 = mod.defineFuncType([ValueType.Int32], [ValueType.Int32]);
  const t2 = mod.defineFuncType([ValueType.Int32], [ValueType.Int32]);
  expect(t1).toBe(t2);
  expect(mod._types).toHaveLength(1);
});

test('ModuleBuilder - defineFuncType rejects multiple returns', () => {
  const mod = new ModuleBuilder('test');
  expect(() => mod.defineFuncType([ValueType.Int32, ValueType.Int32], [])).toThrow();
});

test('ModuleBuilder - defineFunction duplicate name throws', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('fn', null, []);
  expect(() => mod.defineFunction('fn', null, [])).toThrow();
});

test('ModuleBuilder - defineTable only one allowed', () => {
  const mod = new ModuleBuilder('test');
  mod.defineTable(ElementType.AnyFunc, 1);
  expect(() => mod.defineTable(ElementType.AnyFunc, 1)).toThrow();
});

test('ModuleBuilder - defineMemory only one allowed', () => {
  const mod = new ModuleBuilder('test');
  mod.defineMemory(1);
  expect(() => mod.defineMemory(1)).toThrow(VerificationError);
});

test('ModuleBuilder - setStartFunction', async () => {
  const mod = new ModuleBuilder('test');
  const globalX = mod.defineGlobal(ValueType.Int32, true, 0);
  const startFn = mod.defineFunction('_start', null, [], (f, a) => {
    a.const_i32(42);
    a.set_global(globalX);
  });
  mod.setStartFunction(startFn);
  mod.defineFunction('getVal', [ValueType.Int32], [], (f, a) => {
    a.get_global(globalX);
  }).withExport();

  const module = await mod.instantiate();
  // Start function should have been called, setting global to 42
  expect((module.instance.exports.getVal as CallableFunction)()).toBe(42);
});

test('ModuleBuilder - defineCustomSection', () => {
  const mod = new ModuleBuilder('test');
  const section = mod.defineCustomSection('mySection', new Uint8Array([1, 2, 3]));
  expect(section.name).toBe('mySection');
  expect(mod._customSections).toHaveLength(1);
});

test('ModuleBuilder - defineCustomSection duplicate throws', () => {
  const mod = new ModuleBuilder('test');
  mod.defineCustomSection('mySection');
  expect(() => mod.defineCustomSection('mySection')).toThrow();
});

test('ModuleBuilder - defineCustomSection name reserved throws', () => {
  const mod = new ModuleBuilder('test');
  expect(() => mod.defineCustomSection('name')).toThrow();
});

test('ModuleBuilder - toBytes produces valid WASM', async () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.get_local(1);
    a.add_i32();
  }).withExport();

  const bytes = mod.toBytes();
  // WASM magic header
  expect(bytes[0]).toBe(0x00);
  expect(bytes[1]).toBe(0x61);
  expect(bytes[2]).toBe(0x73);
  expect(bytes[3]).toBe(0x6d);
  // Version 1
  expect(bytes[4]).toBe(0x01);
  expect(bytes[5]).toBe(0x00);
  expect(bytes[6]).toBe(0x00);
  expect(bytes[7]).toBe(0x00);

  // Validate with WebAssembly API
  const valid = WebAssembly.validate(bytes.buffer as ArrayBuffer);
  expect(valid).toBe(true);
});

test('ModuleBuilder - toString produces WAT', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.get_local(1);
    a.add_i32();
  }).withExport();

  const text = mod.toString();
  expect(text).toContain('(module $test');
  expect(text).toContain('(func $add');
  expect(text).toContain('(export "add"');
});

test('ModuleBuilder - compile returns WebAssembly.Module', async () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();

  const wasmModule = await mod.compile();
  expect(wasmModule).toBeInstanceOf(WebAssembly.Module);
});

test('ModuleBuilder - import function indices are correct', async () => {
  const mod = new ModuleBuilder('test');
  const imp = mod.importFunction('env', 'log', null, [ValueType.Int32]);
  const fn = mod.defineFunction('test', null, [], (f, a) => {
    a.const_i32(42);
    a.call(imp);
  }).withExport();

  let loggedValue = -1;
  const module = await mod.instantiate({
    env: { log: (v: number) => { loggedValue = v; } },
  });
  (module.instance.exports.test as CallableFunction)();
  expect(loggedValue).toBe(42);
});
