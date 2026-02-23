import { ModuleBuilder, ValueType } from '../src/index';

test('Memory - size and grow', async () => {
  const mod = new ModuleBuilder('test');
  mod.defineMemory(1);

  mod.defineFunction('memSize', [ValueType.Int32], [], (f, a) => {
    a.mem_size(0);
  }).withExport();

  mod.defineFunction('memGrow', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.mem_grow(0);
  }).withExport();

  const instance = await mod.instantiate();
  const memSize = instance.instance.exports.memSize as CallableFunction;
  const memGrow = instance.instance.exports.memGrow as CallableFunction;

  expect(memSize()).toBe(1);
  const oldSize = memGrow(2);
  expect(oldSize).toBe(1);
  expect(memSize()).toBe(3);
});

test('Memory - sub-word store and load i32', async () => {
  const mod = new ModuleBuilder('test');
  mod.defineMemory(1);

  // Store a byte
  mod.defineFunction('store8', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.get_local(f.getParameter(1));
    a.store8_i32(0, 0);
  }).withExport();

  // Load a byte (unsigned)
  mod.defineFunction('load8u', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.load8_i32_u(0, 0);
  }).withExport();

  // Store 16-bit
  mod.defineFunction('store16', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.get_local(f.getParameter(1));
    a.store16_i32(0, 0);
  }).withExport();

  // Load 16-bit unsigned
  mod.defineFunction('load16u', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.load16_i32_u(0, 0);
  }).withExport();

  const instance = await mod.instantiate();
  const { store8, load8u, store16, load16u } = instance.instance.exports as any;

  store8(0, 0xFF);
  expect(load8u(0)).toBe(255);

  store16(4, 0xABCD);
  expect(load16u(4)).toBe(0xABCD);
});

test('Memory - signed load extends sign', async () => {
  const mod = new ModuleBuilder('test');
  mod.defineMemory(1);

  mod.defineFunction('store8', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.get_local(f.getParameter(1));
    a.store8_i32(0, 0);
  }).withExport();

  mod.defineFunction('load8s', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.load8_i32(0, 0);
  }).withExport();

  const instance = await mod.instantiate();
  const { store8, load8s } = instance.instance.exports as any;

  store8(0, 0x80);  // 128 as unsigned byte
  expect(load8s(0)).toBe(-128);  // Sign-extended to i32
});
