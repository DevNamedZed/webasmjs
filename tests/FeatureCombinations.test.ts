import { BlockType, ElementType, ModuleBuilder, ValueType } from '../src/index';
import OpCodes from '../src/OpCodes';

const latestOpts = { target: 'latest' as const, disableVerification: true };

describe('Feature combinations', () => {
  test('memory64 + data segment with BigInt offset', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1, null, false, true); // memory64
    mod.defineData(new Uint8Array([1, 2, 3, 4]), 0n); // BigInt offset
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });

  test('GC struct inside try/catch block', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    const pointType = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: false },
    ]);
    const tag = mod.defineTag([ValueType.Int32]);

    mod.defineFunction('test', null, [], (f, a) => {
      a.try(BlockType.Void);
      // Create struct inside try
      a.const_i32(42);
      a.struct_new(pointType.index);
      a.drop();
      a.catch(tag._index);
      a.drop(); // drop the caught i32
      a.end();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });

  test('passive element segment + table_init/elem_drop', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    const fn1 = mod.defineFunction('fn1', [ValueType.Int32], [], (f, a) => {
      a.const_i32(1);
    });
    const fn2 = mod.defineFunction('fn2', [ValueType.Int32], [], (f, a) => {
      a.const_i32(2);
    });

    mod.defineTable(ElementType.AnyFunc, 2, 10);
    mod.definePassiveElementSegment([fn1, fn2]);

    mod.defineFunction('init', null, [], (f, a) => {
      a.const_i32(0);   // dest offset in table
      a.const_i32(0);   // source offset in elem segment
      a.const_i32(2);   // count
      a.table_init(0, 0); // elem segment 0, table 0
      a.elem_drop(0);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });

  test('passive data segment + memory_init/data_drop', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);
    const seg = mod.defineData(new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]));
    seg.passive();

    mod.defineFunction('init', null, [], (f, a) => {
      a.const_i32(0);   // dest offset in memory
      a.const_i32(0);   // source offset in data segment
      a.const_i32(5);   // count
      a.memory_init(0, 0); // data segment 0, memory 0
      a.data_drop(0);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });
});
