import ModuleBuilder from '../src/ModuleBuilder';
import BinaryReader from '../src/BinaryReader';
import { ValueType, BlockType, ExternalKind } from '../src/types';

describe('Tag section', () => {
  test('defineTag creates a tag', () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);
    expect(tag).toBeDefined();
    expect(tag._index).toBe(0);
    expect(tag.funcType).toBeDefined();
  });

  test('tag binary encoding', () => {
    const mod = new ModuleBuilder('test');
    mod.defineTag([ValueType.Int32]);
    const bytes = mod.toBytes();
    expect(bytes).toBeTruthy();
    expect(bytes.length).toBeGreaterThan(8);
  });

  test('tag WAT output', () => {
    const mod = new ModuleBuilder('test');
    mod.defineTag([ValueType.Int32]);
    const wat = mod.toString();
    expect(wat).toContain('(tag');
    expect(wat).toContain('(param i32)');
  });

  test('multiple tags', () => {
    const mod = new ModuleBuilder('test');
    const tag1 = mod.defineTag([ValueType.Int32]);
    const tag2 = mod.defineTag([ValueType.Int32, ValueType.Float64]);
    expect(tag1._index).toBe(0);
    expect(tag2._index).toBe(1);
    const bytes = mod.toBytes();
    expect(bytes).toBeTruthy();
  });

  test('tag with no parameters', () => {
    const mod = new ModuleBuilder('test');
    mod.defineTag([]);
    const wat = mod.toString();
    expect(wat).toContain('(tag');
  });
});

describe('Exception handling emitter', () => {
  test('throw emits correctly', () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);
    const fn = mod.defineFunction('test', null, [], (f, asm) => {
      asm.const_i32(42);
      asm.throw(tag._index);
    });
    mod.exportFunction(fn);
    expect(() => mod.toBytes()).not.toThrow();
  });

  test('throw WAT output', () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);
    const fn = mod.defineFunction('test', null, [], (f, asm) => {
      asm.const_i32(42);
      asm.throw(tag._index);
    });
    mod.exportFunction(fn);
    const wat = mod.toString();
    expect(wat).toContain('throw');
  });
});

describe('Tag import/export', () => {
  test('exportTag creates a tag export', () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);
    mod.exportTag(tag, 'myTag');
    const wat = mod.toString();
    expect(wat).toContain('(export "myTag" (tag 0))');
  });

  test('exportTag binary roundtrip', () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);
    mod.exportTag(tag, 'myTag');
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    const tagExport = info.exports.find(e => e.name === 'myTag');
    expect(tagExport).toBeDefined();
    expect(tagExport!.kind).toBe(ExternalKind.Tag.value);
    expect(tagExport!.index).toBe(0);
  });

  test('importTag creates a tag import', () => {
    const mod = new ModuleBuilder('test');
    const imp = mod.importTag('env', 'error', [ValueType.Int32]);
    expect(imp.externalKind).toBe(ExternalKind.Tag);
    expect(imp.index).toBe(0);
    const wat = mod.toString();
    expect(wat).toContain('(import "env" "error"');
    expect(wat).toContain('(tag');
  });

  test('importTag binary roundtrip', () => {
    const mod = new ModuleBuilder('test');
    mod.importTag('env', 'error', [ValueType.Int32]);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    const tagImport = info.imports.find(i => i.kind === ExternalKind.Tag.value);
    expect(tagImport).toBeDefined();
    expect(tagImport!.moduleName).toBe('env');
    expect(tagImport!.fieldName).toBe('error');
  });

  test('importTag adjusts local tag indices', () => {
    const mod = new ModuleBuilder('test');
    mod.importTag('env', 'error', [ValueType.Int32]);
    const localTag = mod.defineTag([ValueType.Float64]);
    // Local tag index should be 1 (after the imported tag at index 0)
    expect(localTag._index).toBe(1);
  });

  test('duplicate tag export throws', () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);
    mod.exportTag(tag, 'myTag');
    expect(() => mod.exportTag(tag, 'myTag')).toThrow('already exists');
  });

  test('duplicate tag import throws', () => {
    const mod = new ModuleBuilder('test');
    mod.importTag('env', 'error', [ValueType.Int32]);
    expect(() => mod.importTag('env', 'error', [ValueType.Float64])).toThrow('already exists');
  });
});

describe('Exception handling runtime', () => {
  test('try/catch catches thrown exception', async () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);

    mod.defineFunction('tryCatch', [ValueType.Int32], [], (f, asm) => {
      asm.try(BlockType.Int32);
        asm.const_i32(42);
        asm.throw(tag._index);
        asm.const_i32(-1); // unreachable
      asm.catch(tag._index);
        // tag payload (i32) is on stack
      asm.end();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
    const instance = await mod.instantiate();
    const tryCatch = instance.instance.exports.tryCatch as CallableFunction;
    expect(tryCatch()).toBe(42);
  });

  test('catch_all catches any exception', async () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);

    mod.defineFunction('tryCatchAll', [ValueType.Int32], [], (f, asm) => {
      asm.try(BlockType.Int32);
        asm.const_i32(99);
        asm.throw(tag._index);
        asm.const_i32(-1);
      asm.catch_all();
        asm.const_i32(1); // caught
      asm.end();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
    const instance = await mod.instantiate();
    const tryCatchAll = instance.instance.exports.tryCatchAll as CallableFunction;
    expect(tryCatchAll()).toBe(1);
  });

  test('nested try/catch', async () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);

    mod.defineFunction('nested', [ValueType.Int32], [], (f, asm) => {
      asm.try(BlockType.Int32);
        asm.try(BlockType.Void);
          asm.const_i32(10);
          asm.throw(tag._index);
        asm.catch(tag._index);
          // inner catch: got 10, rethrow it
          asm.drop();
          asm.rethrow(0);
        asm.end();
        asm.const_i32(-1); // unreachable
      asm.catch(tag._index);
        // outer catch: got 10
        asm.const_i32(20);
        asm.add_i32();
      asm.end();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
    const instance = await mod.instantiate();
    const nested = instance.instance.exports.nested as CallableFunction;
    expect(nested()).toBe(30);
  });

  test('multi-tag catch handlers', async () => {
    const mod = new ModuleBuilder('test');
    const tagA = mod.defineTag([ValueType.Int32]);
    const tagB = mod.defineTag([ValueType.Int32]);

    mod.defineFunction('multiCatch', [ValueType.Int32], [ValueType.Int32], (f, asm) => {
      asm.try(BlockType.Int32);
        asm.get_local(f.getParameter(0));
        asm.const_i32(0);
        asm.eq_i32();
        asm.if(BlockType.Void);
          asm.const_i32(100);
          asm.throw(tagA._index);
        asm.else();
          asm.const_i32(200);
          asm.throw(tagB._index);
        asm.end();
        asm.const_i32(-1);
      asm.catch(tagA._index);
        // payload 100
      asm.catch(tagB._index);
        // payload 200
      asm.end();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
    const instance = await mod.instantiate();
    const multiCatch = instance.instance.exports.multiCatch as CallableFunction;
    expect(multiCatch(0)).toBe(100);
    expect(multiCatch(1)).toBe(200);
  });

  test('delegate instruction', async () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);

    mod.defineFunction('withDelegate', [ValueType.Int32], [], (f, asm) => {
      asm.try(BlockType.Int32);
        asm.try(BlockType.Void);
          asm.const_i32(77);
          asm.throw(tag._index);
        asm.delegate(0); // delegate to outer try
        asm.const_i32(-1);
      asm.catch(tag._index);
        // caught here
      asm.end();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
    const instance = await mod.instantiate();
    const withDelegate = instance.instance.exports.withDelegate as CallableFunction;
    expect(withDelegate()).toBe(77);
  });

  test('rethrow instruction', async () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);

    mod.defineFunction('rethrowTest', [ValueType.Int32], [], (f, asm) => {
      asm.try(BlockType.Int32);
        asm.try(BlockType.Void);
          asm.const_i32(55);
          asm.throw(tag._index);
        asm.catch(tag._index);
          asm.drop();
          asm.rethrow(0); // rethrow from this catch handler
        asm.end();
        asm.const_i32(-1);
      asm.catch(tag._index);
        // rethrown exception caught here
      asm.end();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
    const instance = await mod.instantiate();
    const rethrowTest = instance.instance.exports.rethrowTest as CallableFunction;
    expect(rethrowTest()).toBe(55);
  });
});

describe('Exception handling feature gating', () => {
  test('defineTag throws without exception-handling feature', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    expect(() => {
      mod.defineTag([ValueType.Int32]);
    }).toThrow(/exception-handling.*feature.*required/i);
  });

  test('importTag throws without exception-handling feature', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    expect(() => {
      mod.importTag('env', 'error', [ValueType.Int32]);
    }).toThrow(/exception-handling.*feature.*required/i);
  });

  test('exportTag throws without exception-handling feature', () => {
    const mod = new ModuleBuilder('test', { target: '3.0' });
    const tag = mod.defineTag([ValueType.Int32]);
    const mod2 = new ModuleBuilder('test2', { target: 'mvp' });
    // Need to access _tags directly since we can't defineTag
    (mod2 as any)._tags.push(tag);
    expect(() => {
      mod2.exportTag(tag, 'myTag');
    }).toThrow(/exception-handling.*feature.*required/i);
  });

  test('shared memory throws without threads feature', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    expect(() => {
      mod.defineMemory(1, 1, true);
    }).toThrow(/threads.*feature.*required/i);
  });

  test('memory64 throws without memory64 feature', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    expect(() => {
      mod.defineMemory(1, null, false, true);
    }).toThrow(/memory64.*feature.*required/i);
  });

  test('importMemory with memory64 throws without feature', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    expect(() => {
      mod.importMemory('env', 'mem', 1, null, false, true);
    }).toThrow(/memory64.*feature.*required/i);
  });

  test('importMemory with shared throws without threads feature', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    expect(() => {
      mod.importMemory('env', 'mem', 1, 1, true);
    }).toThrow(/threads.*feature.*required/i);
  });

  test('passive element segment throws without bulk-memory feature', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    const fn = mod.defineFunction('noop', null, [], () => {});
    expect(() => {
      mod.definePassiveElementSegment([fn]);
    }).toThrow(/bulk-memory.*feature.*required/i);
  });

  test('passive data segment throws without bulk-memory feature', () => {
    const mod = new ModuleBuilder('test', { target: 'mvp' });
    expect(() => {
      mod.defineData(new Uint8Array([1, 2, 3])).passive();
    }).toThrow(/bulk-memory.*feature.*required/i);
  });
});
