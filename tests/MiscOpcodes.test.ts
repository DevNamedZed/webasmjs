import { BlockType, ModuleBuilder, ValueType } from '../src/index';
import TestHelper from './TestHelper';

test('Nop', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.nop();
    asm.nop();
    asm.const_i32(42);
    asm.nop();
    asm.end();
  });
  expect(fn()).toBe(42);
});

test('Drop', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [], (asm) => {
    asm.const_i32(99);
    asm.const_i32(42);
    asm.drop();
    asm.end();
  });
  expect(fn()).toBe(99);
});

test('Select', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [ValueType.Int32], (asm) => {
    asm.const_i32(10);  // val1
    asm.const_i32(20);  // val2
    asm.get_local(0);   // condition
    asm.select();
    asm.end();
  });
  expect(fn(1)).toBe(10);   // condition != 0 => first value
  expect(fn(0)).toBe(20);   // condition == 0 => second value
});

test('Return - early exit', async () => {
  const fn = await TestHelper.compileFunction('test', ValueType.Int32, [ValueType.Int32], (asm) => {
    asm.get_local(0);
    asm.const_i32(0);
    asm.eq_i32();
    asm.if(BlockType.Void, () => {
      asm.const_i32(999);
      asm.return();
    });
    asm.get_local(0);
    asm.end();
  });
  expect(fn(0)).toBe(999);
  expect(fn(42)).toBe(42);
});

test('Unreachable', async () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('test', null, [], (f, a) => {
    a.unreachable();
  }).withExport();

  const instance = await mod.instantiate();
  const fn = instance.instance.exports.test as CallableFunction;
  expect(() => fn()).toThrow();
});

test('If-else', async () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('test', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.if(BlockType.Int32);
    a.const_i32(1);
    a.else();
    a.const_i32(0);
    a.end();
    // result is on stack
  }).withExport();

  const instance = await mod.instantiate();
  const fn = instance.instance.exports.test as CallableFunction;
  expect(fn(1)).toBe(1);
  expect(fn(0)).toBe(0);
  expect(fn(42)).toBe(1);
});
