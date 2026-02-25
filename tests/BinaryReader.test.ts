import { ModuleBuilder, ValueType, ElementType } from '../src/index';
import BinaryReader, { FuncTypeInfo, StructTypeInfo, ArrayTypeInfo, RecGroupTypeInfo } from '../src/BinaryReader';

test('BinaryReader - reads magic and version', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.version).toBe(1);
});

test('BinaryReader - reads types', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.get_local(1);
    a.add_i32();
  }).withExport();
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.types.length).toBeGreaterThanOrEqual(1);
  const funcType = result.types[0] as FuncTypeInfo;
  expect(funcType.parameterTypes).toHaveLength(2);
  expect(funcType.returnTypes).toHaveLength(1);
});

test('BinaryReader - reads exports', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('fn1', [ValueType.Int32], [], (f, a) => a.const_i32(1)).withExport();
  mod.defineFunction('fn2', [ValueType.Int32], [], (f, a) => a.const_i32(2)).withExport();
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.exports).toHaveLength(2);
  expect(result.exports[0].name).toBe('fn1');
  expect(result.exports[1].name).toBe('fn2');
});

test('BinaryReader - reads functions', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('fn1', [ValueType.Int32], [], (f, a) => a.const_i32(1)).withExport();
  mod.defineFunction('fn2', [ValueType.Int32], [], (f, a) => a.const_i32(2)).withExport();
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.functions).toHaveLength(2);
});

test('BinaryReader - reads memory', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  mod.defineMemory(1, 4);
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.memories).toHaveLength(1);
  expect(result.memories[0].initial).toBe(1);
  expect(result.memories[0].maximum).toBe(4);
});

test('BinaryReader - reads globals', () => {
  const mod = new ModuleBuilder('test');
  mod.defineGlobal(ValueType.Int32, false, 42).withExport('g');
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.globals).toHaveLength(1);
  expect(result.globals[0].mutable).toBe(false);
});

test('BinaryReader - reads data segments', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  mod.defineData(new Uint8Array([1, 2, 3]), 0);
  mod.defineMemory(1);
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.data).toHaveLength(1);
  expect(Array.from(result.data[0].data)).toEqual([1, 2, 3]);
});

test('BinaryReader - reads imports', () => {
  const mod = new ModuleBuilder('test');
  mod.importFunction('env', 'log', null, [ValueType.Int32]);
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.imports).toHaveLength(1);
  expect(result.imports[0].moduleName).toBe('env');
  expect(result.imports[0].fieldName).toBe('log');
  expect(result.imports[0].kind).toBe(0); // Function
});

test('BinaryReader - reads custom sections', () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  mod.defineCustomSection('myCustom', new Uint8Array([10, 20, 30]));
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  const custom = result.customSections.find((s) => s.name === 'myCustom');
  expect(custom).toBeDefined();
  expect(Array.from(custom!.data)).toEqual([10, 20, 30]);
});

test('BinaryReader - reads start section', () => {
  const mod = new ModuleBuilder('test');
  const globalX = mod.defineGlobal(ValueType.Int32, true, 0);
  const startFn = mod.defineFunction('_start', null, [], (f, a) => {
    a.const_i32(1);
    a.set_global(globalX);
  });
  mod.setStartFunction(startFn);
  mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
  const bytes = mod.toBytes();

  const reader = new BinaryReader(bytes);
  const result = reader.read();
  expect(result.start).not.toBeNull();
});

test('BinaryReader - invalid magic throws', () => {
  const reader = new BinaryReader(new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0]));
  expect(() => reader.read()).toThrow('Invalid WASM magic header');
});

test('BinaryReader - roundtrip validates', async () => {
  const mod = new ModuleBuilder('roundtrip');
  mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.get_local(1);
    a.add_i32();
  }).withExport();
  mod.defineMemory(1, 4);
  mod.defineGlobal(ValueType.Int32, false, 100).withExport('g');

  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  expect(info.types.length).toBeGreaterThan(0);
  expect(info.functions.length).toBe(1);
  expect(info.memories.length).toBe(1);
  expect(info.globals.length).toBe(1);
  expect(info.exports.length).toBe(2);
});

describe('BinaryReader validation', () => {
  test('invalid magic header throws', () => {
    const buf = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00]);
    const reader = new BinaryReader(buf);
    expect(() => reader.read()).toThrow('Invalid WASM magic header');
  });

  test('table section roundtrip', () => {
    const mod = new ModuleBuilder('test');
    mod.defineTable(ElementType.AnyFunc, 1, 10);
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    expect(info.tables.length).toBe(1);
    expect(info.tables[0].initial).toBe(1);
    expect(info.tables[0].maximum).toBe(10);
  });

  test('data section roundtrip', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1);
    mod.defineData(new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]), 0);
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    expect(info.data.length).toBe(1);
    expect(info.data[0].data).toEqual(new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]));
  });

  test('custom section roundtrip', () => {
    const mod = new ModuleBuilder('test', { generateNameSection: false });
    mod.defineCustomSection('mydata', new Uint8Array([0xCA, 0xFE]));
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    const custom = info.customSections.find(s => s.name === 'mydata');
    expect(custom).toBeDefined();
    expect(custom!.data).toEqual(new Uint8Array([0xCA, 0xFE]));
  });

  test('start section roundtrip', () => {
    const mod = new ModuleBuilder('test');
    const fn = mod.defineFunction('init', null, [], (f, a) => {});
    mod.setStartFunction(fn);
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    expect(info.start).toBe(fn._index);
  });
});

describe('BinaryReader roundtrips', () => {
  test('Unsupported WASM version throws', () => {
    // WASM magic: 0x00 0x61 0x73 0x6d (little-endian: 0x6d736100)
    // Version 2 (little-endian): 0x02 0x00 0x00 0x00
    const bytes = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x02, 0x00, 0x00, 0x00]);
    const reader = new BinaryReader(bytes);
    expect(() => reader.read()).toThrow('Unsupported WASM version: 2');
  });

  test('Import section with table kind roundtrip', () => {
    const mod = new ModuleBuilder('test');
    mod.importTable('env', 'tbl', ElementType.AnyFunc, 2, 8);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const bytes = mod.toBytes();

    const reader = new BinaryReader(bytes);
    const info = reader.read();
    const tableImport = info.imports.find((i) => i.kind === 1);
    expect(tableImport).toBeDefined();
    expect(tableImport!.moduleName).toBe('env');
    expect(tableImport!.fieldName).toBe('tbl');
    expect(tableImport!.tableType).toBeDefined();
    expect(tableImport!.tableType!.initial).toBe(2);
    expect(tableImport!.tableType!.maximum).toBe(8);
    // elementType for anyfunc is 0x70, which is -16 when read as signed varint7
    expect(tableImport!.tableType!.elementType).toBe(-16);
  });

  test('Import section with memory kind roundtrip', () => {
    const mod = new ModuleBuilder('test');
    mod.importMemory('env', 'mem', 1, 16);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const bytes = mod.toBytes();

    const reader = new BinaryReader(bytes);
    const info = reader.read();
    const memImport = info.imports.find((i) => i.kind === 2);
    expect(memImport).toBeDefined();
    expect(memImport!.moduleName).toBe('env');
    expect(memImport!.fieldName).toBe('mem');
    expect(memImport!.memoryType).toBeDefined();
    expect(memImport!.memoryType!.initial).toBe(1);
    expect(memImport!.memoryType!.maximum).toBe(16);
  });

  test('Import section with global kind roundtrip', () => {
    const mod = new ModuleBuilder('test');
    mod.importGlobal('env', 'g', ValueType.Int32, true);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const bytes = mod.toBytes();

    const reader = new BinaryReader(bytes);
    const info = reader.read();
    const globalImport = info.imports.find((i) => i.kind === 3);
    expect(globalImport).toBeDefined();
    expect(globalImport!.moduleName).toBe('env');
    expect(globalImport!.fieldName).toBe('g');
    expect(globalImport!.globalType).toBeDefined();
    // i32 is encoded as 0x7f (or signed -1)
    expect(globalImport!.globalType!.valueType).toBe(-1);
    expect(globalImport!.globalType!.mutable).toBe(true);
  });

  test('Element section roundtrip', () => {
    const mod = new ModuleBuilder('test');
    const fn1 = mod.defineFunction('fn1', [ValueType.Int32], [], (f, a) => {
      a.const_i32(1);
    });
    const fn2 = mod.defineFunction('fn2', [ValueType.Int32], [], (f, a) => {
      a.const_i32(2);
    });
    const fn3 = mod.defineFunction('fn3', [ValueType.Int32], [], (f, a) => {
      a.const_i32(3);
    });
    const table = mod.defineTable(ElementType.AnyFunc, 3, 3);
    table.defineTableSegment([fn1, fn2, fn3], 0);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const bytes = mod.toBytes();

    const reader = new BinaryReader(bytes);
    const info = reader.read();
    expect(info.elements).toHaveLength(1);
    expect(info.elements[0].tableIndex).toBe(0);
    expect(info.elements[0].functionIndices).toEqual([
      fn1._index,
      fn2._index,
      fn3._index,
    ]);
  });

  test('Name section with local names roundtrip', () => {
    const mod = new ModuleBuilder('localMod');
    const fn = mod.defineFunction(
      'myFunc',
      ValueType.Int32,
      [ValueType.Int32, ValueType.Int32],
      (f, a) => {
        a.const_i32(0);
      }
    );
    fn.parameters[0].withName('x');
    fn.parameters[1].withName('y');

    // Also add a named local
    const fn2 = mod.defineFunction('myFunc2', null, []);
    const asm = fn2.createEmitter();
    asm.declareLocal(ValueType.Int32, 'counter');
    asm.end();

    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();

    expect(info.nameSection).toBeDefined();
    expect(info.nameSection!.localNames).toBeDefined();
    const localNames = info.nameSection!.localNames!;

    // fn has params x and y
    const fnLocals = localNames.get(fn._index);
    expect(fnLocals).toBeDefined();
    expect(fnLocals!.get(0)).toBe('x');
    expect(fnLocals!.get(1)).toBe('y');

    // fn2 has local 'counter'
    const fn2Locals = localNames.get(fn2._index);
    expect(fn2Locals).toBeDefined();
    expect(fn2Locals!.get(0)).toBe('counter');
  });

  test('Name section with global names roundtrip', () => {
    const mod = new ModuleBuilder('globalMod');
    const g1 = mod.defineGlobal(ValueType.Int32, false, 10);
    g1.withName('alpha');
    const g2 = mod.defineGlobal(ValueType.Float64, false, 3.14);
    g2.withName('beta');

    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();

    expect(info.nameSection).toBeDefined();
    expect(info.nameSection!.globalNames).toBeDefined();
    const globalNames = info.nameSection!.globalNames!;
    expect(globalNames.get(g1._index)).toBe('alpha');
    expect(globalNames.get(g2._index)).toBe('beta');
  });
});

describe('BinaryReader - tag section', () => {
  test('tag section roundtrip', () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    expect(info.tags).toHaveLength(1);
    expect(info.tags[0].attribute).toBe(0);
    expect(info.tags[0].typeIndex).toBe(tag.funcType.index);
  });

  test('multiple tags roundtrip', () => {
    const mod = new ModuleBuilder('test');
    mod.defineTag([ValueType.Int32]);
    mod.defineTag([ValueType.Int32, ValueType.Float64]);
    mod.defineTag([]);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    expect(info.tags).toHaveLength(3);
  });
});

describe('BinaryReader - GC types', () => {
  test('struct type roundtrip', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: false },
      { name: 'y', type: ValueType.Float64, mutable: true },
    ]);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    // Find the struct type (may be in a rec group)
    const structType = info.types.find(t => t.kind === 'struct') as StructTypeInfo | undefined;
    const recGroup = info.types.find(t => t.kind === 'rec') as RecGroupTypeInfo | undefined;
    const found = structType || (recGroup && recGroup.types.find(t => t.kind === 'struct') as StructTypeInfo | undefined);
    expect(found).toBeDefined();
    expect(found!.fields).toHaveLength(2);
    expect(found!.fields[0].mutable).toBe(false);
    expect(found!.fields[1].mutable).toBe(true);
  });

  test('array type roundtrip', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    mod.defineArrayType(ValueType.Int32, true);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    const arrayType = info.types.find(t => t.kind === 'array') as ArrayTypeInfo | undefined;
    const recGroup = info.types.find(t => t.kind === 'rec') as RecGroupTypeInfo | undefined;
    const found = arrayType || (recGroup && recGroup.types.find(t => t.kind === 'array') as ArrayTypeInfo | undefined);
    expect(found).toBeDefined();
    expect(found!.mutable).toBe(true);
  });

  test('rec group roundtrip', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    mod.defineRecGroup((rec) => {
      rec.addStructType([
        { name: 'a', type: ValueType.Int32, mutable: false },
      ]);
      rec.addStructType([
        { name: 'b', type: ValueType.Float64, mutable: true },
      ]);
    });
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    const recGroup = info.types.find(t => t.kind === 'rec') as RecGroupTypeInfo | undefined;
    expect(recGroup).toBeDefined();
    expect(recGroup!.types.length).toBeGreaterThanOrEqual(2);
  });
});

describe('BinaryReader - DataCount section', () => {
  test('passive data segment includes datacount', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    mod.defineMemory(1);
    const seg = mod.defineData(new Uint8Array([1, 2, 3]));
    (seg as any)._passive = true;
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    expect(info.dataCount).not.toBeNull();
  });
});
