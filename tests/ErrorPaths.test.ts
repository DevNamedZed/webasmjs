import { ModuleBuilder, ValueType, ElementType, VerificationError } from '../src/index';

test('Duplicate function name throws', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('foo', null, []);
  expect(() => mod.defineFunction('foo', null, [])).toThrow(/already been defined/);
});

test('Duplicate function export throws', () => {
  const mod = new ModuleBuilder('test');
  const f1 = mod.defineFunction('f1', null, []);
  const f2 = mod.defineFunction('f2', null, []);
  mod.exportFunction(f1, 'myFunc');
  expect(() => mod.exportFunction(f2, 'myFunc')).toThrow(/already existing/);
});

test('Duplicate memory definition throws', () => {
  const mod = new ModuleBuilder('test');
  mod.defineMemory(1);
  expect(() => mod.defineMemory(1)).toThrow();
});

test('Duplicate table throws', () => {
  const mod = new ModuleBuilder('test');
  mod.defineTable(ElementType.AnyFunc, 10);
  expect(() => mod.defineTable(ElementType.AnyFunc, 10)).toThrow();
});

test('Duplicate import function throws', () => {
  const mod = new ModuleBuilder('test');
  mod.importFunction('mod', 'fn', null, []);
  expect(() => mod.importFunction('mod', 'fn', null, [])).toThrow();
});

test('Duplicate custom section throws', () => {
  const mod = new ModuleBuilder('test');
  mod.defineCustomSection('mySection');
  expect(() => mod.defineCustomSection('mySection')).toThrow();
});

test('Reserved name custom section throws', () => {
  const mod = new ModuleBuilder('test');
  expect(() => mod.defineCustomSection('name')).toThrow(/reserved/);
});

test('Multiple return types throws', () => {
  const mod = new ModuleBuilder('test');
  expect(() => mod.defineFuncType([ValueType.Int32, ValueType.Int32], [])).toThrow();
});

test('Global - init expression not defined throws', () => {
  const mod = new ModuleBuilder('test');
  const g = mod.defineGlobal(ValueType.Int32, false);
  // No value set
  expect(() => mod.toBytes()).toThrow(/initialization expression/i);
});

test('Export mutable global throws with verification', () => {
  const mod = new ModuleBuilder('test');
  const g = mod.defineGlobal(ValueType.Int32, true, 0);
  expect(() => mod.exportGlobal(g, 'g')).toThrow(VerificationError);
});

test('Feature gating - mvp blocks sign-extend', () => {
  const mod = new ModuleBuilder('test', { generateNameSection: true, disableVerification: false, target: 'mvp' });
  const fn = mod.defineFunction('test', ValueType.Int32, []);
  const asm = fn.createEmitter();
  asm.const_i32(0x80);
  expect(() => asm.extend8_s_i32()).toThrow(/feature/);
});

test('Feature gating - latest allows sign-extend', async () => {
  const mod = new ModuleBuilder('test', { generateNameSection: true, disableVerification: false, target: 'latest' });
  mod.defineFunction('test', [ValueType.Int32], [], (f, a) => {
    a.const_i32(0x80);
    a.extend8_s_i32();
  }).withExport();

  const instance = await mod.instantiate();
  const fn = instance.instance.exports.test as CallableFunction;
  expect(fn()).toBe(-128);
});
