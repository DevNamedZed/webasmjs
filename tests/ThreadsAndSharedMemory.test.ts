import ModuleBuilder from '../src/ModuleBuilder';
import { ValueType } from '../src/types';

// ─── Shared Memory ──────────────────────────────────────────────────

describe('Shared memory', () => {
  test('shared memory requires maximum size', () => {
    const mod = new ModuleBuilder('test');
    expect(() => mod.defineMemory(1, null, true)).toThrow(/maximum/i);
  });

  test('shared memory with max compiles', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, 10, true);
    const bytes = mod.toBytes();
    expect(bytes).toBeTruthy();
  });

  test('shared memory WAT output', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, 10, true);
    const wat = mod.toString();
    expect(wat).toContain('shared');
    expect(wat).toContain('1 10');
  });

  test('shared memory binary encoding has correct flag byte', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, 10, true);
    const bytes = mod.toBytes();
    const bytesArray = Array.from(bytes);
    // Flag byte: has_max | shared = 0b11 = 3
    expect(bytesArray).toContain(3);
  });

  test('non-shared memory does not have shared flag', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, 10);
    const wat = mod.toString();
    expect(wat).not.toContain('shared');
  });

  test('shared imported memory', () => {
    const mod = new ModuleBuilder('test');
    mod.importMemory('env', 'memory', 1, 256, true);
    const bytes = mod.toBytes();
    expect(bytes).toBeTruthy();
  });
});

// ─── Atomic Emitter Integration ─────────────────────────────────────

describe('Atomic emitter integration', () => {
  test('atomic_load_i32 emits correctly', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, 10, true);
    const fn = mod.defineFunction('test', ValueType.Int32, [], (f, asm) => {
      asm.const_i32(0);
      asm.atomic_load_i32(2, 0);
    });
    mod.exportFunction(fn);
    expect(() => mod.toBytes()).not.toThrow();
  });

  test('atomic_store_i32 emits correctly', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, 10, true);
    const fn = mod.defineFunction('test', null, [], (f, asm) => {
      asm.const_i32(0);
      asm.const_i32(42);
      asm.atomic_store_i32(2, 0);
    });
    mod.exportFunction(fn);
    expect(() => mod.toBytes()).not.toThrow();
  });

  test('atomic_rmw_add_i32 emits correctly', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, 10, true);
    const fn = mod.defineFunction('test', ValueType.Int32, [], (f, asm) => {
      asm.const_i32(0);
      asm.const_i32(1);
      asm.atomic_rmw_add_i32(2, 0);
    });
    mod.exportFunction(fn);
    expect(() => mod.toBytes()).not.toThrow();
  });

  test('atomic_rmw_cmpxchg_i32 emits correctly', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, 10, true);
    const fn = mod.defineFunction('test', ValueType.Int32, [], (f, asm) => {
      asm.const_i32(0);
      asm.const_i32(0);
      asm.const_i32(1);
      asm.atomic_rmw_cmpxchg_i32(2, 0);
    });
    mod.exportFunction(fn);
    expect(() => mod.toBytes()).not.toThrow();
  });

  test('atomic_fence emits correctly', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, 10, true);
    const fn = mod.defineFunction('test', null, [], (f, asm) => {
      asm.atomic_fence(0);
    });
    mod.exportFunction(fn);
    expect(() => mod.toBytes()).not.toThrow();
  });

  test('atomic WAT output contains mnemonics', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1, 10, true);
    const fn = mod.defineFunction('test', ValueType.Int32, [], (f, asm) => {
      asm.const_i32(0);
      asm.atomic_load_i32(2, 0);
    });
    mod.exportFunction(fn);
    const wat = mod.toString();
    expect(wat).toContain('i32.atomic.load');
  });
});
