import ModuleBuilder from '../src/ModuleBuilder';
import { ValueType, ElementType } from '../src/types';
import VerificationError from '../src/verification/VerificationError';

// Detect engine support for extended-const (requires V8 11.4+ / Node 21+)
const HAS_EXTENDED_CONST = (() => {
  try {
    // Minimal module: (global i32 (i32.add (i32.const 1) (i32.const 2)))
    const bytes = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, // magic + version
      0x06, 0x09,                                        // global section, 9 bytes
      0x01,                                               // 1 global
      0x7f, 0x00,                                         // i32, immutable
      0x41, 0x01, 0x41, 0x02, 0x6a, 0x0b,                // i32.const 1, i32.const 2, i32.add, end
    ]);
    return WebAssembly.validate(bytes);
  } catch { return false; }
})();

// ─── Target System ───────────────────────────────────────────────────

describe('Target system', () => {
  test('default target is latest with all features', () => {
    const mod = new ModuleBuilder('test');
    expect(mod.hasFeature('multi-value')).toBe(true);
    expect(mod.hasFeature('mutable-globals')).toBe(true);
    expect(mod.hasFeature('multi-memory')).toBe(true);
    expect(mod.hasFeature('multi-table')).toBe(true);
    expect(mod.hasFeature('tail-call')).toBe(true);
    expect(mod.hasFeature('extended-const')).toBe(true);
    expect(mod.hasFeature('simd')).toBe(true);
    expect(mod.hasFeature('relaxed-simd')).toBe(true);
    expect(mod.hasFeature('gc')).toBe(true);
  });

  test('mvp target has no features', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    expect(mod.hasFeature('multi-value')).toBe(false);
    expect(mod.hasFeature('mutable-globals')).toBe(false);
    expect(mod.hasFeature('simd')).toBe(false);
  });

  test('2.0 target has correct feature set', () => {
    const mod = new ModuleBuilder('test', { target: '2.0' });
    expect(mod.hasFeature('sign-extend')).toBe(true);
    expect(mod.hasFeature('sat-trunc')).toBe(true);
    expect(mod.hasFeature('bulk-memory')).toBe(true);
    expect(mod.hasFeature('reference-types')).toBe(true);
    expect(mod.hasFeature('multi-value')).toBe(true);
    expect(mod.hasFeature('mutable-globals')).toBe(true);
    // 3.0+ features NOT present
    expect(mod.hasFeature('simd')).toBe(false);
    expect(mod.hasFeature('tail-call')).toBe(false);
    expect(mod.hasFeature('threads')).toBe(false);
  });

  test('3.0 target has simd but not relaxed-simd', () => {
    const mod = new ModuleBuilder('test', { target: '3.0' });
    expect(mod.hasFeature('simd')).toBe(true);
    expect(mod.hasFeature('tail-call')).toBe(true);
    expect(mod.hasFeature('threads')).toBe(true);
    expect(mod.hasFeature('multi-memory')).toBe(true);
    expect(mod.hasFeature('relaxed-simd')).toBe(false);
    expect(mod.hasFeature('gc')).toBe(false);
  });

  test('explicit features merge with target', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp', features: ['multi-value'] });
    expect(mod.hasFeature('multi-value')).toBe(true);
    expect(mod.hasFeature('simd')).toBe(false);
  });
});

// ─── Multi-value Returns ─────────────────────────────────────────────

describe('Multi-value returns', () => {
  test('allows multiple return types with multi-value feature', () => {
    const mod = new ModuleBuilder('test');
    expect(() => {
      mod.defineFuncType([ValueType.Int32, ValueType.Float32], []);
    }).not.toThrow();
  });

  test('blocks multiple returns without multi-value feature', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    expect(() => {
      mod.defineFuncType([ValueType.Int32, ValueType.Float32], []);
    }).toThrow(/multi-value/i);
  });

  test('multi-value function compiles and runs', async () => {
    const mod = new ModuleBuilder('test');
    const fn = mod.defineFunction('swap', [ValueType.Int32, ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, asm) => {
      asm.get_local(f.getParameter(1));
      asm.get_local(f.getParameter(0));
    });
    mod.exportFunction(fn);
    const result = await mod.instantiate();
    const swap = result.instance.exports.swap as CallableFunction;
    const [a, b] = swap(10, 20);
    expect(a).toBe(20);
    expect(b).toBe(10);
  });
});

// ─── Mutable Global Exports ──────────────────────────────────────────

describe('Mutable global exports', () => {
  test('allows mutable global export with mutable-globals feature', () => {
    const mod = new ModuleBuilder('test');
    const g = mod.defineGlobal(ValueType.Int32, true, 42);
    expect(() => mod.exportGlobal(g, 'g')).not.toThrow();
  });

  test('blocks mutable global export without feature', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    const g = mod.defineGlobal(ValueType.Int32, true, 42);
    expect(() => mod.exportGlobal(g, 'g')).toThrow(VerificationError);
  });

  test('mutable global export compiles and runs', async () => {
    const mod = new ModuleBuilder('test');
    const g = mod.defineGlobal(ValueType.Int32, true, 42).withExport('counter');
    const fn = mod.defineFunction('increment', null, [], (f, asm) => {
      asm.get_global(g);
      asm.const_i32(1);
      asm.add_i32();
      asm.set_global(g);
    });
    mod.exportFunction(fn);
    const result = await mod.instantiate();
    const counter = result.instance.exports.counter as WebAssembly.Global;
    expect(counter.value).toBe(42);
    (result.instance.exports.increment as CallableFunction)();
    expect(counter.value).toBe(43);
  });
});

// ─── Multi-memory ────────────────────────────────────────────────────

describe('Multi-memory', () => {
  test('allows multiple memories with multi-memory feature', () => {
    const mod = new ModuleBuilder('test', { features: ['multi-memory'] });
    mod.defineMemory(1);
    expect(() => mod.defineMemory(1)).not.toThrow();
  });

  test('blocks multiple memories without feature', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    mod.defineMemory(1);
    expect(() => mod.defineMemory(1)).toThrow(VerificationError);
  });

  test('blocks multiple imported memories without feature', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    mod.importMemory('env', 'mem1', 1);
    expect(() => mod.importMemory('env', 'mem2', 1)).toThrow(VerificationError);
  });

  test('allows multiple imported memories with feature', () => {
    const mod = new ModuleBuilder('test', { features: ['multi-memory'] });
    mod.importMemory('env', 'mem1', 1);
    expect(() => mod.importMemory('env', 'mem2', 1)).not.toThrow();
  });
});

// ─── Multi-table ─────────────────────────────────────────────────────

describe('Multi-table', () => {
  test('allows multiple tables with multi-table feature', () => {
    const mod = new ModuleBuilder('test', { features: ['multi-table'] });
    mod.defineTable(ElementType.AnyFunc, 1);
    expect(() => mod.defineTable(ElementType.AnyFunc, 1)).not.toThrow();
  });

  test('blocks multiple tables without feature', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    mod.defineTable(ElementType.AnyFunc, 1);
    expect(() => mod.defineTable(ElementType.AnyFunc, 1)).toThrow();
  });
});

// ─── Tail Calls ──────────────────────────────────────────────────────

describe('Tail calls', () => {
  test('return_call opcode exists', () => {
    const mod = new ModuleBuilder('test');
    const fn = mod.defineFunction('target', ValueType.Int32, [], (f, asm) => {
      asm.const_i32(42);
    });
    const caller = mod.defineFunction('caller', ValueType.Int32, [], (f, asm) => {
      asm.return_call(fn);
    });
    mod.exportFunction(caller);
    // Just verify it compiles to bytes without error
    expect(() => mod.toBytes()).not.toThrow();
  });

  test('return_call WAT output', () => {
    const mod = new ModuleBuilder('test');
    const fn = mod.defineFunction('target', ValueType.Int32, [], (f, asm) => {
      asm.const_i32(42);
    });
    const caller = mod.defineFunction('caller', ValueType.Int32, [], (f, asm) => {
      asm.return_call(fn);
    });
    mod.exportFunction(caller);
    const wat = mod.toString();
    expect(wat).toContain('return_call');
  });

  test('return_call_indirect opcode exists', () => {
    const mod = new ModuleBuilder('test');
    const funcType = mod.defineFuncType(ValueType.Int32, []);
    const table = mod.defineTable(ElementType.AnyFunc, 10);
    const fn = mod.defineFunction('caller', ValueType.Int32, [ValueType.Int32], (f, asm) => {
      asm.get_local(f.getParameter(0));
      asm.return_call_indirect(funcType);
    });
    mod.exportFunction(fn);
    expect(() => mod.toBytes()).not.toThrow();
  });
});

// ─── Passive Data Segments ───────────────────────────────────────────

describe('Passive data segments', () => {
  test('passive data segment binary encoding', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1);
    const data = new Uint8Array([1, 2, 3, 4]);
    mod.defineData(data).passive();
    const bytes = mod.toBytes();
    expect(bytes).toBeTruthy();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('passive data segment WAT output', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1);
    mod.defineData(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])).passive();
    const wat = mod.toString();
    // Passive: no offset expression
    expect(wat).toContain('(data (;0;) "Hello")');
  });

  test('active data segment with memory index', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1);
    const data = new Uint8Array([1, 2, 3]);
    const seg = mod.defineData(data, 0);
    seg.memoryIndex(0);
    const bytes = mod.toBytes();
    expect(bytes).toBeTruthy();
  });

  test('mixed active and passive data segments', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1);
    mod.defineData(new Uint8Array([1, 2, 3]), 0); // active
    mod.defineData(new Uint8Array([4, 5, 6])).passive(); // passive
    const bytes = mod.toBytes();
    expect(bytes).toBeTruthy();
  });
});

// ─── Passive Element Segments ────────────────────────────────────────

describe('Passive element segments', () => {
  test('passive element segment binary encoding', () => {
    const mod = new ModuleBuilder('test');
    const table = mod.defineTable(ElementType.AnyFunc, 10);
    const fn = mod.defineFunction('fn', null, [], (f, asm) => {
      asm.nop();
    });
    mod.definePassiveElementSegment([fn]);
    const bytes = mod.toBytes();
    expect(bytes).toBeTruthy();
  });

  test('passive element segment WAT output', () => {
    const mod = new ModuleBuilder('test');
    const table = mod.defineTable(ElementType.AnyFunc, 10);
    const fn = mod.defineFunction('fn', null, [], (f, asm) => {
      asm.nop();
    });
    mod.definePassiveElementSegment([fn]);
    const wat = mod.toString();
    // Passive: no offset, just func indices
    expect(wat).toContain('(elem (;0;) func');
    expect(wat).not.toContain('i32.const');
  });

  test('active element segment with table index', () => {
    const mod = new ModuleBuilder('test');
    const table = mod.defineTable(ElementType.AnyFunc, 10);
    const fn = mod.defineFunction('fn', null, [], (f, asm) => {
      asm.nop();
    });
    mod.defineTableSegment(table, [fn], 0);
    const bytes = mod.toBytes();
    expect(bytes).toBeTruthy();
  });
});

// ─── Extended Const Expressions ──────────────────────────────────────

describe('Extended const expressions', () => {
  test('i32.add in init expression with extended-const', () => {
    const mod = new ModuleBuilder('test', { features: ['extended-const'] });
    const g = mod.defineGlobal(ValueType.Int32, false);
    g.createInitEmitter((asm) => {
      asm.const_i32(10);
      asm.const_i32(20);
      asm.add_i32();
    });
    expect(() => mod.toBytes()).not.toThrow();
  });

  test('i32.sub in init expression with extended-const', () => {
    const mod = new ModuleBuilder('test', { features: ['extended-const'] });
    const g = mod.defineGlobal(ValueType.Int32, false);
    g.createInitEmitter((asm) => {
      asm.const_i32(30);
      asm.const_i32(10);
      asm.sub_i32();
    });
    expect(() => mod.toBytes()).not.toThrow();
  });

  test('i32.mul in init expression with extended-const', () => {
    const mod = new ModuleBuilder('test', { features: ['extended-const'] });
    const g = mod.defineGlobal(ValueType.Int32, false);
    g.createInitEmitter((asm) => {
      asm.const_i32(5);
      asm.const_i32(6);
      asm.mul_i32();
    });
    expect(() => mod.toBytes()).not.toThrow();
  });

  test('i64 arithmetic in init expression with extended-const', () => {
    const mod = new ModuleBuilder('test', { features: ['extended-const'] });
    const g = mod.defineGlobal(ValueType.Int64, false);
    g.createInitEmitter((asm) => {
      asm.const_i64(100n);
      asm.const_i64(200n);
      asm.add_i64();
    });
    expect(() => mod.toBytes()).not.toThrow();
  });

  test('arithmetic in init expression blocked without feature', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    const g = mod.defineGlobal(ValueType.Int32, false);
    // Without extended-const, only one const + end allowed
    // The second const triggers "not valid after init expression value"
    expect(() => {
      g.createInitEmitter((asm) => {
        asm.const_i32(10);
        asm.const_i32(20);
        asm.add_i32();
      });
    }).toThrow(/not valid after init expression/i);
  });

  test('add_i32 in init expression blocked without feature', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    const g = mod.defineGlobal(ValueType.Int32, false);
    // At instructions.length=0, add_i32 hits the extended-const guard
    const emitter = g.createInitEmitter();
    expect(() => emitter.add_i32()).toThrow(/extended-const/i);
  });

  (HAS_EXTENDED_CONST ? test : test.skip)('extended-const global init compiles and runs', async () => {
    const mod = new ModuleBuilder('test');
    const g = mod.defineGlobal(ValueType.Int32, false);
    g.createInitEmitter((asm) => {
      asm.const_i32(10);
      asm.const_i32(32);
      asm.add_i32();
    });
    mod.exportGlobal(g, 'result');
    const result = await mod.instantiate();
    expect((result.instance.exports.result as WebAssembly.Global).value).toBe(42);
  });
});
