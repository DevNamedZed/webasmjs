import { ModuleBuilder, BinaryReader, OpCodes, InstructionDecoder, ValueType, BlockType } from '../src/index';

test('InstructionDecoder - decode basic opcodes', () => {
  // nop (0x01), i32.const 42, i32.add, end
  const mod = new ModuleBuilder('test');
  const func = mod.defineFunction('test', [ValueType.Int32], []);
  func.createEmitter((asm) => {
    asm.emit(OpCodes.nop);
    asm.emit(OpCodes.i32_const, 42);
    asm.emit(OpCodes.i32_const, 10);
    asm.emit(OpCodes.i32_add);
  });

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read({ decodeInstructions: true });

  expect(info.functions.length).toBe(1);
  const instructions = info.functions[0].instructions!;
  expect(instructions).toBeDefined();
  expect(instructions.length).toBeGreaterThan(0);

  // Find nop
  const nop = instructions.find(i => i.opCode.mnemonic === 'nop');
  expect(nop).toBeDefined();

  // Find i32.const 42
  const constInstr = instructions.find(i => i.opCode.mnemonic === 'i32.const' && i.immediates.values[0] === 42);
  expect(constInstr).toBeDefined();

  // Find i32.add
  const addInstr = instructions.find(i => i.opCode.mnemonic === 'i32.add');
  expect(addInstr).toBeDefined();

  // Find end
  const endInstr = instructions.find(i => i.opCode.mnemonic === 'end');
  expect(endInstr).toBeDefined();
});

test('InstructionDecoder - decode float immediates', () => {
  const mod = new ModuleBuilder('test');
  const func = mod.defineFunction('test', [ValueType.Float64], []);
  func.createEmitter((asm) => {
    asm.emit(OpCodes.f64_const, 3.14);
  });

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read({ decodeInstructions: true });

  const instructions = info.functions[0].instructions!;
  const f64Const = instructions.find(i => i.opCode.mnemonic === 'f64.const');
  expect(f64Const).toBeDefined();
  expect(f64Const!.immediates.values[0]).toBeCloseTo(3.14);
});

test('InstructionDecoder - decode i64 immediate', () => {
  const mod = new ModuleBuilder('test');
  const func = mod.defineFunction('test', [ValueType.Int64], []);
  func.createEmitter((asm) => {
    asm.emit(OpCodes.i64_const, 123456789n);
  });

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read({ decodeInstructions: true });

  const instructions = info.functions[0].instructions!;
  const i64Const = instructions.find(i => i.opCode.mnemonic === 'i64.const');
  expect(i64Const).toBeDefined();
  expect(i64Const!.immediates.values[0]).toBe(123456789n);
});

test('InstructionDecoder - decode memory immediate (load/store)', () => {
  const mod = new ModuleBuilder('test');
  mod.defineMemory(1);
  const func = mod.defineFunction('test', [ValueType.Int32], []);
  func.createEmitter((asm) => {
    asm.emit(OpCodes.i32_const, 0);
    asm.emit(OpCodes.i32_load, 2, 4); // align=4, offset=4
  });

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read({ decodeInstructions: true });

  const instructions = info.functions[0].instructions!;
  const load = instructions.find(i => i.opCode.mnemonic === 'i32.load');
  expect(load).toBeDefined();
  expect(load!.immediates.type).toBe('MemoryImmediate');
  expect(load!.immediates.values[0]).toBe(2); // alignment
  expect(load!.immediates.values[1]).toBe(4); // offset
});

test('InstructionDecoder - decode local.get/set', () => {
  const mod = new ModuleBuilder('test');
  const func = mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32]);
  func.createEmitter((asm) => {
    asm.emit(OpCodes.get_local, asm.getParameter(0));
    asm.emit(OpCodes.get_local, asm.getParameter(1));
    asm.emit(OpCodes.i32_add);
  });

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read({ decodeInstructions: true });

  const instructions = info.functions[0].instructions!;
  const localGets = instructions.filter(i => i.opCode.mnemonic === 'local.get');
  expect(localGets.length).toBe(2);
  expect(localGets[0].immediates.values[0]).toBe(0);
  expect(localGets[1].immediates.values[0]).toBe(1);
});

test('InstructionDecoder - decode global init expression', () => {
  const mod = new ModuleBuilder('test');
  mod.defineGlobal(ValueType.Int32, false, 42);

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read({ decodeInstructions: true });

  expect(info.globals.length).toBe(1);
  const initInstrs = info.globals[0].initInstructions!;
  expect(initInstrs).toBeDefined();
  const constInstr = initInstrs.find(i => i.opCode.mnemonic === 'i32.const');
  expect(constInstr).toBeDefined();
  expect(constInstr!.immediates.values[0]).toBe(42);
});

test('InstructionDecoder - roundtrip build → binary → decode', () => {
  const mod = new ModuleBuilder('test');
  mod.defineMemory(1);
  const func = mod.defineFunction('factorial', [ValueType.Int32], [ValueType.Int32]);
  func.createEmitter((asm) => {
    const n = asm.getParameter(0);
    asm.emit(OpCodes.get_local, n);
    asm.emit(OpCodes.i32_const, 1);
    asm.emit(OpCodes.i32_le_s);
    asm.emit(OpCodes.if, BlockType.Int32); // result i32
    asm.emit(OpCodes.i32_const, 1);
    asm.emit(OpCodes.else);
    asm.emit(OpCodes.get_local, n);
    asm.emit(OpCodes.get_local, n);
    asm.emit(OpCodes.i32_const, 1);
    asm.emit(OpCodes.i32_sub);
    asm.emit(OpCodes.call, func);
    asm.emit(OpCodes.i32_mul);
    asm.emit(OpCodes.end);
  });
  mod.exportFunction(func, 'factorial');

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read({ decodeInstructions: true });

  expect(info.functions.length).toBe(1);
  const instructions = info.functions[0].instructions!;

  // Verify key opcodes are present in the decoded instructions
  const mnemonics = instructions.map(i => i.opCode.mnemonic);
  expect(mnemonics).toContain('local.get');
  expect(mnemonics).toContain('i32.const');
  expect(mnemonics).toContain('i32.le_s');
  expect(mnemonics).toContain('if');
  expect(mnemonics).toContain('else');
  expect(mnemonics).toContain('call');
  expect(mnemonics).toContain('i32.sub');
  expect(mnemonics).toContain('i32.mul');
  expect(mnemonics).toContain('end');
});

test('InstructionDecoder - static decodeInitExpr', () => {
  // i32.const 42, end — 42 in LEB128 = 0x2a
  const bytes = new Uint8Array([0x41, 0x2a, 0x0b]); // i32.const 42, end
  const instructions = InstructionDecoder.decodeInitExpr(bytes);
  expect(instructions.length).toBe(2);
  expect(instructions[0].opCode.mnemonic).toBe('i32.const');
  expect(instructions[0].immediates.values[0]).toBe(42);
  expect(instructions[1].opCode.mnemonic).toBe('end');
});

test('InstructionDecoder - decode block/loop instructions', () => {
  const mod = new ModuleBuilder('test');
  const func = mod.defineFunction('test', [ValueType.Int32], []);
  func.createEmitter((asm) => {
    asm.emit(OpCodes.block, BlockType.Int32); // result i32
    asm.emit(OpCodes.i32_const, 42);
    asm.emit(OpCodes.end);
  });

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read({ decodeInstructions: true });

  const instructions = info.functions[0].instructions!;
  const block = instructions.find(i => i.opCode.mnemonic === 'block');
  expect(block).toBeDefined();
  expect(block!.immediates.type).toBe('BlockSignature');
});

test('InstructionDecoder - BinaryReader without decodeInstructions has no instructions field', () => {
  const mod = new ModuleBuilder('test');
  const func = mod.defineFunction('test', [ValueType.Int32], []);
  func.createEmitter((asm) => {
    asm.emit(OpCodes.i32_const, 42);
  });

  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  const info = reader.read(); // no options

  expect(info.functions[0].instructions).toBeUndefined();
});
