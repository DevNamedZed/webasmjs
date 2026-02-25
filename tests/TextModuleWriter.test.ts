import { ModuleBuilder, ValueType, ElementType, BlockType } from '../src/index';

test('TextModuleWriter - module header', () => {
  const mod = new ModuleBuilder('myModule');
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  const text = mod.toString();
  expect(text).toContain('(module $myModule');
  expect(text.endsWith(')')).toBe(true);
});

test('TextModuleWriter - types section', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.get_local(1);
    a.add_i32();
  }).withExport();
  const text = mod.toString();
  expect(text).toContain('(type');
  expect(text).toContain('(param i32 i32)');
  expect(text).toContain('(result i32)');
});

test('TextModuleWriter - function with instructions', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('inc', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.const_i32(1);
    a.add_i32();
  }).withExport();
  const text = mod.toString();
  expect(text).toContain('(func $inc');
  expect(text).toContain('local.get');
  expect(text).toContain('i32.const 1');
  expect(text).toContain('i32.add');
});

test('TextModuleWriter - exports', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => a.const_i32(1)).withExport('myExport');
  const text = mod.toString();
  expect(text).toContain('(export "myExport" (func');
});

test('TextModuleWriter - memory', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  mod.defineMemory(1, 4);
  const text = mod.toString();
  expect(text).toContain('(memory');
  expect(text).toContain('1 4');
});

test('TextModuleWriter - global', () => {
  const mod = new ModuleBuilder('test');
  mod.defineGlobal(ValueType.Int32, false, 42).withExport('g');
  const text = mod.toString();
  expect(text).toContain('(global');
  expect(text).toContain('i32');
  expect(text).toContain('i32.const 42');
});

test('TextModuleWriter - mutable global', () => {
  const mod = new ModuleBuilder('test', { generateNameSection: true });
  mod.defineGlobal(ValueType.Int32, true, 0).withExport('g');
  const text = mod.toString();
  expect(text).toContain('(mut i32)');
});

test('TextModuleWriter - imports', () => {
  const mod = new ModuleBuilder('test');
  mod.importFunction('env', 'log', null, [ValueType.Int32]);
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  const text = mod.toString();
  expect(text).toContain('(import "env" "log"');
  expect(text).toContain('(func');
});

test('TextModuleWriter - table', () => {
  const mod = new ModuleBuilder('test');
  const func1 = mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => a.const_i32(1));
  mod.defineTable(ElementType.AnyFunc, 1, 1)
    .defineTableSegment([func1], 0);
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  const text = mod.toString();
  expect(text).toContain('(table');
  expect(text).toContain('anyfunc');
});

test('TextModuleWriter - data segment', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  mod.defineData(new Uint8Array([72, 101, 108, 108, 111]), 0); // "Hello"
  mod.defineMemory(1);
  const text = mod.toString();
  expect(text).toContain('(data');
  expect(text).toContain('Hello');
});

test('TextModuleWriter - start section', () => {
  const mod = new ModuleBuilder('test');
  const startFn = mod.defineFunction('_start', null, [], (f, a) => {});
  mod.setStartFunction(startFn);
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  const text = mod.toString();
  expect(text).toContain('(start');
});

test('TextModuleWriter - block/loop indentation', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('fn', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.block(BlockType.Void, (b) => {
      a.loop(BlockType.Void, (l) => {
        a.get_local(0);
        a.const_i32(10);
        a.gt_i32();
        a.br_if(b);
        a.get_local(0);
        a.const_i32(1);
        a.add_i32();
        a.set_local(0);
        a.br(l);
      });
    });
    a.get_local(0);
  }).withExport();

  const text = mod.toString();
  expect(text).toContain('block');
  expect(text).toContain('loop');
  expect(text).toContain('end');
});

describe('TextModuleWriter formatting', () => {
  test('function with no body outputs single line', () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('empty', null, []);
    const wat = mod.toString();
    expect(wat).toContain('(func $empty');
    expect(wat).toContain(')');
  });

  test('function with locals in WAT output', () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('withLocals', [ValueType.Int32], [], (f, a) => {
      const x = a.declareLocal(ValueType.Int32);
      a.const_i32(5);
      a.set_local(x);
      a.get_local(x);
    }).withExport();
    const wat = mod.toString();
    expect(wat).toContain('(local i32)');
  });

  test('block with result type in WAT output', () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('blockResult', [ValueType.Int32], [], (f, a) => {
      const label = a.block(BlockType.Int32);
      a.const_i32(42);
      a.br(label);
      a.end();
    }).withExport();
    const wat = mod.toString();
    expect(wat).toContain('block');
    expect(wat).toContain('(result i32)');
  });

  test('if/else indentation in WAT output', () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('ifElse', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.if(BlockType.Int32);
      a.const_i32(1);
      a.else();
      a.const_i32(0);
      a.end();
    }).withExport();
    const wat = mod.toString();
    expect(wat).toContain('if');
    expect(wat).toContain('else');
    expect(wat).toContain('end');
  });

  test('memory immediate offset/align in WAT output', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1);
    mod.defineFunction('loadAligned', [ValueType.Int32], [], (f, a) => {
      a.const_i32(8);
      a.load_i32(2, 4);
    }).withExport();
    const wat = mod.toString();
    expect(wat).toContain('offset=');
    expect(wat).toContain('align=');
  });

  test('WAT output for start section', () => {
    const mod = new ModuleBuilder('test');
    const init = mod.defineFunction('init', null, [], (f, a) => {});
    mod.setStartFunction(init);
    const wat = mod.toString();
    expect(wat).toContain('(start');
  });

  test('WAT global init expression with get_global', () => {
    const mod = new ModuleBuilder('test');
    const base = mod.defineGlobal(ValueType.Int32, false, 10);
    const g = mod.defineGlobal(ValueType.Int32, false);
    g.value(base);
    const wat = mod.toString();
    expect(wat).toContain('global.get');
  });
});

describe('TextModuleWriter sections', () => {
  test('WAT output for imported table', () => {
    const mod = new ModuleBuilder('test');
    mod.importTable('env', 'tbl', ElementType.AnyFunc, 2, 10);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const text = mod.toString();

    expect(text).toContain('(import "env" "tbl"');
    expect(text).toContain('(table');
    expect(text).toContain('anyfunc');
    expect(text).toContain('2 10');
  });

  test('WAT output for imported memory', () => {
    const mod = new ModuleBuilder('test');
    mod.importMemory('env', 'mem', 1, 16);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const text = mod.toString();

    expect(text).toContain('(import "env" "mem"');
    expect(text).toContain('(memory');
    expect(text).toContain('1 16');
  });

  test('WAT output for imported global (mutable)', () => {
    const mod = new ModuleBuilder('test');
    mod.importGlobal('env', 'g', ValueType.Int32, true);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const text = mod.toString();

    expect(text).toContain('(import "env" "g"');
    expect(text).toContain('(global');
    expect(text).toContain('(mut i32)');
  });

  test('WAT output for element segment', () => {
    const mod = new ModuleBuilder('test');
    const fn1 = mod.defineFunction('fn1', [ValueType.Int32], [], (f, a) => {
      a.const_i32(1);
    });
    const fn2 = mod.defineFunction('fn2', [ValueType.Int32], [], (f, a) => {
      a.const_i32(2);
    });
    const table = mod.defineTable(ElementType.AnyFunc, 2, 2);
    table.defineTableSegment([fn1, fn2], 0);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const text = mod.toString();

    expect(text).toContain('(elem');
    expect(text).toContain('i32.const 0');
    expect(text).toContain('func');
  });

  test('WAT output with non-ASCII data - bytes < 0x20 should be escaped', () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    // Data with bytes that need escaping: 0x00, 0x01, 0x0a (newline), 0x1f
    mod.defineData(new Uint8Array([0x00, 0x01, 0x0a, 0x1f, 0x41]), 0);
    mod.defineMemory(1);
    const text = mod.toString();

    // Bytes < 0x20 should be escaped as \XX hex
    expect(text).toContain('\\00');
    expect(text).toContain('\\01');
    expect(text).toContain('\\0a');
    expect(text).toContain('\\1f');
    // 0x41 = 'A', should appear as literal
    expect(text).toContain('A');
  });
});
