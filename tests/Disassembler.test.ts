import { ModuleBuilder, BinaryReader, Disassembler, ValueType, OpCodes, TextModuleWriter, ElementType, BlockType } from '../src/index';

test('Disassembler - simple module roundtrip', () => {
  const mod = new ModuleBuilder('test', { generateNameSection: true });
  const func = mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32]);
  func.createEmitter((asm) => {
    asm.emit(OpCodes.get_local, asm.getParameter(0));
    asm.emit(OpCodes.get_local, asm.getParameter(1));
    asm.emit(OpCodes.i32_add);
  });
  mod.exportFunction(func, 'add');

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read({ decodeInstructions: true });
  const disassembler = new Disassembler(info);
  const wat = disassembler.disassemble();

  // Check the output contains key elements
  expect(wat).toContain('(module');
  expect(wat).toContain('(func');
  expect(wat).toContain('local.get');
  expect(wat).toContain('i32.add');
  expect(wat).toContain('(export "add"');
  expect(wat).toContain('(type');
  expect(wat).toContain('(param i32 i32)');
  expect(wat).toContain('(result i32)');
});

test('Disassembler - type section with func types', () => {
  const mod = new ModuleBuilder('test');
  const func = mod.defineFunction('f', null, [ValueType.Int32, ValueType.Float64]);
  func.createEmitter(() => {});

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read();
  const disassembler = new Disassembler(info);
  const wat = disassembler.disassemble();

  expect(wat).toContain('(type');
  expect(wat).toContain('(param i32 f64)');
});

test('Disassembler - imports', () => {
  const mod = new ModuleBuilder('test');
  mod.importFunction('env', 'log', null, [ValueType.Int32]);
  mod.importMemory('env', 'mem', 1, 10);
  mod.importGlobal('env', 'g', ValueType.Int32, false);

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read();
  const disassembler = new Disassembler(info);
  const wat = disassembler.disassemble();

  expect(wat).toContain('(import "env" "log" (func');
  expect(wat).toContain('(import "env" "mem" (memory');
  expect(wat).toContain('(import "env" "g" (global i32)');
});

test('Disassembler - exports', () => {
  const mod = new ModuleBuilder('test');
  mod.defineMemory(1);
  const func = mod.defineFunction('f', null, []);
  func.createEmitter(() => {});
  mod.exportFunction(func, 'myFunc');
  mod.exportMemory(mod._memories[0], 'myMem');

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read();
  const disassembler = new Disassembler(info);
  const wat = disassembler.disassemble();

  expect(wat).toContain('(export "myFunc" (func');
  expect(wat).toContain('(export "myMem" (memory');
});

test('Disassembler - globals with init expressions', () => {
  const mod = new ModuleBuilder('test', { generateNameSection: true });
  const g = mod.defineGlobal(ValueType.Int32, true, 42);
  g.withName('counter');

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read({ decodeInstructions: true });
  const disassembler = new Disassembler(info);
  const wat = disassembler.disassemble();

  expect(wat).toContain('(global');
  expect(wat).toContain('(mut i32)');
  expect(wat).toContain('i32.const 42');
});

test('Disassembler - memory section', () => {
  const mod = new ModuleBuilder('test');
  mod.defineMemory(1, 10);

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read();
  const disassembler = new Disassembler(info);
  const wat = disassembler.disassemble();

  expect(wat).toContain('(memory');
  expect(wat).toContain('1 10');
});

test('Disassembler - data segments', () => {
  const mod = new ModuleBuilder('test');
  mod.defineMemory(1);
  const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
  mod.defineData(data, 0);

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read({ decodeInstructions: true });
  const disassembler = new Disassembler(info);
  const wat = disassembler.disassemble();

  expect(wat).toContain('(data');
  expect(wat).toContain('i32.const 0');
  expect(wat).toContain('Hello');
});

test('Disassembler - name section integration', () => {
  const mod = new ModuleBuilder('myModule', { generateNameSection: true });
  const func = mod.defineFunction('myFunc', [ValueType.Int32], []);
  func.createEmitter((asm) => {
    asm.emit(OpCodes.i32_const, 1);
  });

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read({ decodeInstructions: true });
  const disassembler = new Disassembler(info);
  const wat = disassembler.disassemble();

  expect(wat).toContain('$myModule');
  expect(wat).toContain('$myFunc');
});

test('Disassembler - function with locals', () => {
  const mod = new ModuleBuilder('test');
  const func = mod.defineFunction('test', [ValueType.Int32], [ValueType.Int32]);
  func.createEmitter((asm) => {
    const local = asm.declareLocal(ValueType.Int32);
    asm.emit(OpCodes.get_local, asm.getParameter(0));
    asm.emit(OpCodes.set_local, local);
    asm.emit(OpCodes.get_local, local);
  });

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read({ decodeInstructions: true });
  const disassembler = new Disassembler(info);
  const wat = disassembler.disassemble();

  expect(wat).toContain('(local i32)');
  expect(wat).toContain('local.get');
  expect(wat).toContain('local.set');
});

test('Disassembler - control flow (if/else/end)', () => {
  const mod = new ModuleBuilder('test');
  const func = mod.defineFunction('abs', [ValueType.Int32], [ValueType.Int32]);
  func.createEmitter((asm) => {
    const param = asm.getParameter(0);
    asm.emit(OpCodes.get_local, param);
    asm.emit(OpCodes.i32_const, 0);
    asm.emit(OpCodes.i32_lt_s);
    asm.emit(OpCodes.if, BlockType.Int32);
    asm.emit(OpCodes.i32_const, 0);
    asm.emit(OpCodes.get_local, param);
    asm.emit(OpCodes.i32_sub);
    asm.emit(OpCodes.else);
    asm.emit(OpCodes.get_local, param);
    asm.emit(OpCodes.end);
  });

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read({ decodeInstructions: true });
  const disassembler = new Disassembler(info);
  const wat = disassembler.disassemble();

  expect(wat).toContain('if');
  expect(wat).toContain('else');
  expect(wat).toContain('i32.lt_s');
  expect(wat).toContain('i32.sub');
});
