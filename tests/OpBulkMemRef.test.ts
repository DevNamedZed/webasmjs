import { ModuleBuilder, ValueType, ElementType } from '../src/index';

const latestOpts = { generateNameSection: true, target: 'latest' as const };

describe('bulk memory operations', () => {
  let exports: any;

  beforeAll(async () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('test_memory_copy', [ValueType.Int32], [], (f, a) => {
      a.const_i32(0); a.const_i32(42); a.store_i32(0, 0);
      a.const_i32(16); a.const_i32(0); a.const_i32(4); a.memory_copy(0, 0);
      a.const_i32(16); a.load_i32(0, 0);
    }).withExport();

    mod.defineFunction('test_memory_fill', [ValueType.Int32], [], (f, a) => {
      a.const_i32(0); a.const_i32(0xAB); a.const_i32(4); a.memory_fill(0);
      a.const_i32(0); a.load_i32(0, 0);
    }).withExport();

    const result = await mod.instantiate();
    exports = result.instance.exports;
  });

  test('memory_copy', () => expect(exports.test_memory_copy()).toBe(42));
  test('memory_fill', () => expect(exports.test_memory_fill()).toBe(0xABABABAB | 0));
});

describe('memory_init and data_drop', () => {
  test('compile and produce bytes', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);
    mod.defineData(new Uint8Array([1, 2, 3, 4]), 0);

    mod.defineFunction('doInit', null, [], (f, a) => {
      a.const_i32(0); a.const_i32(0); a.const_i32(4);
      a.memory_init(0, 0);
      a.data_drop(0);
    }).withExport();

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe('table operations', () => {
  test('table_size, table_grow, table_fill compile', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineTable(ElementType.AnyFunc, 1, 10);

    mod.defineFunction('tableSize', [ValueType.Int32], [], (f, a) => {
      a.table_size(0);
    }).withExport();

    mod.defineFunction('tableGrow', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.ref_null(0x70); a.get_local(f.getParameter(0)); a.table_grow(0);
    }).withExport();

    mod.defineFunction('tableFill', null, [], (f, a) => {
      a.const_i32(0); a.ref_null(0x70); a.const_i32(1); a.table_fill(0);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });

  test('table_copy compile', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineTable(ElementType.AnyFunc, 1, 10);

    mod.defineFunction('doTableCopy', null, [], (f, a) => {
      a.const_i32(0); a.const_i32(0); a.const_i32(0); a.table_copy(0, 0);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });

  test('table_init and elem_drop compile', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineTable(ElementType.AnyFunc, 1, 10);

    mod.defineFunction('doInit', null, [], (f, a) => {
      a.const_i32(0); a.const_i32(0); a.const_i32(0);
      a.table_init(0, 0); a.elem_drop(0);
    }).withExport();

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('table_get and table_set compile', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineTable(ElementType.AnyFunc, 1, 10);

    mod.defineFunction('doTableGet', [ValueType.Int32], [], (f, a) => {
      a.const_i32(0); a.table_get(0); a.ref_is_null();
    }).withExport();

    mod.defineFunction('doTableSet', null, [], (f, a) => {
      a.const_i32(0); a.ref_null(0x70); a.table_set(0);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });
});

describe('reference type operations', () => {
  let exports: any;

  beforeAll(async () => {
    const mod = new ModuleBuilder('test', latestOpts);

    const target = mod.defineFunction('target', null, [], (f, a) => {}).withExport();

    mod.defineFunction('test_ref_null', [ValueType.Int32], [], (f, a) => {
      a.ref_null(0x70); a.ref_is_null();
    }).withExport();

    mod.defineFunction('test_ref_func', [ValueType.Int32], [], (f, a) => {
      a.ref_func(target); a.ref_is_null();
    }).withExport();

    const result = await mod.instantiate();
    exports = result.instance.exports;
  });

  test('ref_null and ref_is_null', () => expect(exports.test_ref_null()).toBe(1));
  test('ref_func compiles', () => expect(exports.test_ref_func()).toBe(0));
});
