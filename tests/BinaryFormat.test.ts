import {
  ModuleBuilder,
  BinaryReader,
  ValueType,
  ElementType,
  ElementSegmentBuilder,
} from '../src/index';
import Instruction from '../src/Instruction';
import LocalBuilder from '../src/LocalBuilder';
import LabelBuilder from '../src/LabelBuilder';
import ResizableLimits from '../src/ResizableLimits';
import GlobalType from '../src/GlobalType';
import MemoryType from '../src/MemoryType';
import TableType from '../src/TableType';
import BinaryWriter from '../src/BinaryWriter';
import OpCodes from '../src/OpCodes';

test('Binary Format - magic header and version', () => {
  const mod = new ModuleBuilder('empty');
  const bytes = mod.toBytes();

  // WASM magic: \0asm
  expect(bytes[0]).toBe(0x00);
  expect(bytes[1]).toBe(0x61);
  expect(bytes[2]).toBe(0x73);
  expect(bytes[3]).toBe(0x6d);

  // WASM version 1
  expect(bytes[4]).toBe(0x01);
  expect(bytes[5]).toBe(0x00);
  expect(bytes[6]).toBe(0x00);
  expect(bytes[7]).toBe(0x00);
});

test('Binary Format - empty module validates', () => {
  const mod = new ModuleBuilder('empty');
  const bytes = mod.toBytes();
  const valid = WebAssembly.validate(bytes.buffer as ArrayBuffer);
  expect(valid).toBe(true);
});

test('Binary Format - all sections roundtrip', () => {
  const mod = new ModuleBuilder('full');

  // Memory (needed for data segment)
  const mem = mod.defineMemory(1, 4);

  // Table
  const table = mod.defineTable(ElementType.AnyFunc, 1, 10);

  // Global (immutable so it can be exported)
  const g = mod.defineGlobal(ValueType.Int32, false, 99);
  g.withName('myGlobal');

  // Function
  const fn = mod.defineFunction(
    'compute',
    ValueType.Int32,
    [ValueType.Int32],
    (f, a) => {
      a.get_local(0);
    }
  );

  // Exports
  mod.exportFunction(fn, 'compute');
  mod.exportMemory(mem, 'memory');
  mod.exportGlobal(g, 'myGlobal');

  // Data segment
  mod.defineData(new Uint8Array([0xca, 0xfe]), 0);

  // Element segment
  mod.defineTableSegment(table, [fn], 0);

  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  expect(info.types.length).toBeGreaterThan(0);
  expect(info.functions.length).toBeGreaterThan(0);
  expect(info.memories.length).toBeGreaterThan(0);
  expect(info.globals.length).toBeGreaterThan(0);
  expect(info.tables.length).toBeGreaterThan(0);
  expect(info.exports.length).toBeGreaterThan(0);
  expect(info.data.length).toBeGreaterThan(0);
  expect(info.elements.length).toBeGreaterThan(0);
});

test('Binary Format - custom section roundtrip', () => {
  const mod = new ModuleBuilder('custommod');
  mod.defineCustomSection('mysection', new Uint8Array([1, 2, 3]));
  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  const custom = info.customSections.find((s) => s.name === 'mysection');
  expect(custom).toBeDefined();
  expect(Array.from(custom!.data)).toEqual([1, 2, 3]);
});

test('Binary Format - section ordering', () => {
  const mod = new ModuleBuilder('ordered', { generateNameSection: false });

  // Import
  mod.importFunction('env', 'log', null, [ValueType.Int32]);

  // Memory
  mod.defineMemory(1);

  // Table
  const table = mod.defineTable(ElementType.AnyFunc, 1);

  // Global (immutable)
  mod.defineGlobal(ValueType.Int32, false, 42).withExport('g');

  // Function
  const fn = mod.defineFunction('compute', ValueType.Int32, [], (f, a) => {
    a.const_i32(0);
  });
  mod.exportFunction(fn, 'compute');

  // Element segment
  mod.defineTableSegment(table, [fn], 0);

  // Data segment
  mod.defineData(new Uint8Array([1]), 0);

  const bytes = mod.toBytes();

  // Walk through the binary and collect section IDs in order (skip the 8-byte header)
  const sectionIds: number[] = [];
  let offset = 8;
  while (offset < bytes.length) {
    const sectionId = bytes[offset];
    sectionIds.push(sectionId);

    // Read the section size (LEB128 varuint32) to skip past the section
    offset++;
    let size = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = bytes[offset++];
      size |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte & 0x80);

    offset += size;
  }

  // Verify sections appear in ascending order of their IDs
  // Custom sections (id=0) are allowed at the end but standard sections must be ordered
  const standardSections = sectionIds.filter((id) => id !== 0);
  for (let i = 1; i < standardSections.length; i++) {
    expect(standardSections[i]).toBeGreaterThan(standardSections[i - 1]);
  }

  // Verify we actually found the expected standard section IDs
  // Type=1, Import=2, Function=3, Table=4, Memory=5, Global=6, Export=7, Element=9, Code=10, Data=11
  expect(standardSections).toContain(1); // Type
  expect(standardSections).toContain(2); // Import
  expect(standardSections).toContain(3); // Function
  expect(standardSections).toContain(7); // Export
  expect(standardSections).toContain(10); // Code
});

describe('ElementSegmentBuilder', () => {
  test('unsupported offset type throws', () => {
    const mod = new ModuleBuilder('test');
    const table = mod.defineTable(ElementType.AnyFunc, 1);
    const fn = mod.defineFunction('f', null, [], (f, a) => {});
    const seg = new ElementSegmentBuilder(table, [fn]);
    expect(() => (seg as any).offset(true)).toThrow('Unsupported offset');
  });

  test('write() without init expression throws', () => {
    const mod = new ModuleBuilder('test');
    const table = mod.defineTable(ElementType.AnyFunc, 1);
    const fn = mod.defineFunction('f', null, [], (f, a) => {});
    const seg = new ElementSegmentBuilder(table, [fn]);
    const writer = new BinaryWriter();
    expect(() => seg.write(writer)).toThrow('initialization expression was not defined');
  });

  test('toBytes() with ImportBuilder function entries', () => {
    const mod = new ModuleBuilder('test');
    const table = mod.defineTable(ElementType.AnyFunc, 2);
    const imp = mod.importFunction('env', 'log', null, [ValueType.Int32]);
    const fn = mod.defineFunction('f', null, [], (f, a) => {});
    const seg = new ElementSegmentBuilder(table, [imp, fn]);
    seg.offset(0);
    const bytes = seg.toBytes();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe('Builder toBytes()', () => {
  test('ExportBuilder toBytes()', () => {
    const mod = new ModuleBuilder('test');
    const fn = mod.defineFunction('f', null, [], (f, a) => {});
    const exp = mod.exportFunction(fn, 'f');
    const bytes = exp.toBytes();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('ImportBuilder toBytes()', () => {
    const mod = new ModuleBuilder('test');
    const imp = mod.importFunction('env', 'log', null, [ValueType.Int32]);
    const bytes = imp.toBytes();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('CustomSectionBuilder toBytes()', () => {
    const mod = new ModuleBuilder('test');
    const cs = mod.defineCustomSection('mySection', new Uint8Array([0xDE, 0xAD]));
    const bytes = cs.toBytes();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('Instruction toBytes()', () => {
    const instr = new Instruction(OpCodes.nop, null);
    const bytes = instr.toBytes();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('LocalBuilder toBytes()', () => {
    const local = new LocalBuilder(ValueType.Int32, null, 0, 1);
    const bytes = local.toBytes();
    expect(bytes).toBeInstanceOf(Uint8Array);
  });

  test('LabelBuilder properties', () => {
    const label = new LabelBuilder();
    expect(label.isResolved).toBe(false);
    expect(label.block).toBeNull();
  });

  test('ResizableLimits toBytes()', () => {
    const limits = new ResizableLimits(1, 10);
    const bytes = limits.toBytes();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('GlobalType toBytes()', () => {
    const gt = new GlobalType(ValueType.Int32, true);
    const bytes = gt.toBytes();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(gt.mutable).toBe(true);
    expect(gt.valueType).toBe(ValueType.Int32);
  });

  test('MemoryType toBytes()', () => {
    const mt = new MemoryType(new ResizableLimits(1, 16));
    const bytes = mt.toBytes();
    expect(bytes).toBeInstanceOf(Uint8Array);
  });

  test('TableType toBytes()', () => {
    const tt = new TableType(ElementType.AnyFunc, new ResizableLimits(1, 10));
    const bytes = tt.toBytes();
    expect(bytes).toBeInstanceOf(Uint8Array);
  });
});

describe('ElementSegmentBuilder offsets', () => {
  test('Callback offset for element segment', async () => {
    const mod = new ModuleBuilder('test');
    const fn1 = mod.defineFunction('fn1', [ValueType.Int32], [], (f, a) => {
      a.const_i32(10);
    });
    const fn2 = mod.defineFunction('fn2', [ValueType.Int32], [], (f, a) => {
      a.const_i32(20);
    });
    const table = mod.defineTable(ElementType.AnyFunc, 4, 4);
    // Use callback to set offset to 1
    mod.defineTableSegment(table, [fn1, fn2], (asm: any) => {
      asm.const_i32(1);
    });
    const funcType = mod.defineFuncType([ValueType.Int32], []);
    mod.defineFunction('dispatch', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(0);
      a.call_indirect(funcType);
    }).withExport();

    const instance = await mod.instantiate();
    const exports = instance.instance.exports as any;
    // fn1 is at table index 1, fn2 at table index 2
    expect(exports.dispatch(1)).toBe(10);
    expect(exports.dispatch(2)).toBe(20);
  });

  test('createInitEmitter called twice throws', () => {
    const mod = new ModuleBuilder('test');
    const fn = mod.defineFunction('fn', null, [], (f, a) => {});
    const table = mod.defineTable(ElementType.AnyFunc, 1, 1);
    const seg = new ElementSegmentBuilder(table, [fn]);
    seg.createInitEmitter((asm) => {
      asm.const_i32(0);
    });
    expect(() => {
      seg.createInitEmitter((asm) => {
        asm.const_i32(0);
      });
    }).toThrow('Initialization expression emitter has already been created.');
  });

  test('Element segment runtime verification - table.get to read back entries', async () => {
    const mod = new ModuleBuilder('test');
    const fn1 = mod.defineFunction('fn1', [ValueType.Int32], [], (f, a) => {
      a.const_i32(100);
    });
    const fn2 = mod.defineFunction('fn2', [ValueType.Int32], [], (f, a) => {
      a.const_i32(200);
    });
    const table = mod.defineTable(ElementType.AnyFunc, 2, 2);
    table.withExport('tbl');
    table.defineTableSegment([fn1, fn2], 0);

    // Also export functions so we can verify via indirect call
    const funcType = mod.defineFuncType([ValueType.Int32], []);
    mod.defineFunction('callAt', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(0);
      a.call_indirect(funcType);
    }).withExport();

    const instance = await mod.instantiate();
    const exports = instance.instance.exports as any;
    // Verify via indirect call
    expect(exports.callAt(0)).toBe(100);
    expect(exports.callAt(1)).toBe(200);

    // Verify table export exists
    const tbl = exports.tbl as WebAssembly.Table;
    expect(tbl).toBeDefined();
    expect(tbl.length).toBe(2);
    // table.get returns a wrapped function
    expect(tbl.get(0)!()).toBe(100);
    expect(tbl.get(1)!()).toBe(200);
  });
});
