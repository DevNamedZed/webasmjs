import ModuleBuilder from '../src/ModuleBuilder';
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
});
