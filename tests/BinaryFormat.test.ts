import { ModuleBuilder, BinaryReader, ValueType, ElementType } from '../src/index';

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
