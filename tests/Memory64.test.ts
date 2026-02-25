import ModuleBuilder from '../src/ModuleBuilder';
import BinaryReader from '../src/BinaryReader';
import { ValueType } from '../src/types';

describe('Memory64', () => {
  test('memory64 flag in binary encoding', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, 100, false, true);
    const bytes = mod.toBytes();
    expect(bytes).toBeTruthy();
    // Flag byte should have bit 2 set (0b100 = 4) plus bit 0 for max (0b101 = 5)
    const bytesArray = Array.from(bytes);
    expect(bytesArray).toContain(5); // has_max | memory64
  });

  test('memory64 WAT output shows i64', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, 100, false, true);
    const wat = mod.toString();
    expect(wat).toContain('i64');
    expect(wat).toContain('1 100');
  });

  test('memory64 without max', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, null, false, true);
    const bytes = mod.toBytes();
    expect(bytes).toBeTruthy();
    // Flag byte: only memory64 bit (0b100 = 4)
    const bytesArray = Array.from(bytes);
    expect(bytesArray).toContain(4);
  });

  test('shared + memory64 combined', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, 100, true, true);
    const bytes = mod.toBytes();
    expect(bytes).toBeTruthy();
    // Flag byte: has_max | shared | memory64 = 0b111 = 7
    const bytesArray = Array.from(bytes);
    expect(bytesArray).toContain(7);
  });

  test('non-memory64 does not show i64', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, 100);
    const wat = mod.toString();
    expect(wat).not.toContain('i64');
  });

  test('memory64 limits encoded as varuint64 and roundtrip', () => {
    const mod = new ModuleBuilder('test', { target: 'latest', disableVerification: true });
    mod.defineMemory(1, 16, false, true);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    expect(info.memories).toHaveLength(1);
    expect(info.memories[0].initial).toBe(1);
    expect(info.memories[0].maximum).toBe(16);
    expect(info.memories[0].memory64).toBe(true);
  });

  test('memory64 imported memory limits roundtrip', () => {
    const mod = new ModuleBuilder('test', { target: 'latest', disableVerification: true });
    mod.importMemory('env', 'mem', 1, 256, false, true);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    const memImport = info.imports.find(i => i.kind === 2);
    expect(memImport).toBeDefined();
    expect(memImport!.memoryType!.initial).toBe(1);
    expect(memImport!.memoryType!.maximum).toBe(256);
    expect(memImport!.memoryType!.memory64).toBe(true);
  });
});
