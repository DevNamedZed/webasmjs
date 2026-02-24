import { ModuleBuilder, ValueType, BinaryReader, DataSegmentBuilder } from '../src/index';
import BinaryWriter from '../src/BinaryWriter';

test('Data - read data segment', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder
    .defineFunction('testFunc', [ValueType.Int32], [], (f, a) => {
      a.const_i32(0);
      a.load8_i32_u(0, 0);
    })
    .withExport();
  moduleBuilder.defineData(new Uint8Array([55]), 0);
  moduleBuilder.defineMemory(1, 1);

  const module = await moduleBuilder.instantiate();
  expect((module.instance.exports.testFunc as CallableFunction)()).toBe(55);
});

test('Data - multiple bytes', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder
    .defineFunction('read', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(0);
      a.load8_i32_u(0, 0);
    })
    .withExport();
  moduleBuilder.defineData(new Uint8Array([10, 20, 30, 40, 50]), 0);
  moduleBuilder.defineMemory(1, 1);

  const module = await moduleBuilder.instantiate();
  const read = module.instance.exports.read as CallableFunction;
  expect(read(0)).toBe(10);
  expect(read(1)).toBe(20);
  expect(read(2)).toBe(30);
  expect(read(3)).toBe(40);
  expect(read(4)).toBe(50);
});

test('Data - with offset', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder
    .defineFunction('read', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(0);
      a.load8_i32_u(0, 0);
    })
    .withExport();
  moduleBuilder.defineData(new Uint8Array([99]), 100);
  moduleBuilder.defineMemory(1, 1);

  const module = await moduleBuilder.instantiate();
  const read = module.instance.exports.read as CallableFunction;
  expect(read(100)).toBe(99);
});

test('Data - string data', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder
    .defineFunction('read', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(0);
      a.load8_i32_u(0, 0);
    })
    .withExport();

  const encoder = new TextEncoder();
  const helloBytes = encoder.encode('Hello');
  moduleBuilder.defineData(helloBytes, 0);
  moduleBuilder.defineMemory(1, 1);

  const module = await moduleBuilder.instantiate();
  const read = module.instance.exports.read as CallableFunction;
  expect(read(0)).toBe(72); // 'H'
  expect(read(1)).toBe(101); // 'e'
  expect(read(4)).toBe(111); // 'o'
});

describe('DataSegmentBuilder', () => {
  test('toBytes() returns valid bytes', () => {
    const seg = new DataSegmentBuilder(new Uint8Array([1, 2, 3]));
    seg.offset(0);
    const bytes = seg.toBytes();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('unsupported offset type throws', () => {
    const seg = new DataSegmentBuilder(new Uint8Array([1]));
    expect(() => (seg as any).offset(true)).toThrow('Unsupported offset');
  });
});

describe('DataSegmentBuilder offsets', () => {
  test('GlobalBuilder as data segment offset', () => {
    const mod = new ModuleBuilder('test');
    // Use a defined immutable global as the data segment offset via the
    // GlobalBuilder overload of DataSegmentBuilder.offset().
    const g = mod.defineGlobal(ValueType.Int32, false, 0);
    mod.defineMemory(1);
    mod.defineData(new Uint8Array([42]), g);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();

    // Verify the binary roundtrip encodes a global.get init expression
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    expect(info.data).toHaveLength(1);
    expect(Array.from(info.data[0].data)).toEqual([42]);
    // The offset expression should contain a global.get (opcode 0x23)
    expect(info.data[0].offsetExpr[0]).toBe(0x23);
  });

  test('Callback offset for data segment', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1);
    mod.defineData(new Uint8Array([99]), (asm: any) => {
      asm.const_i32(10);
    });
    mod.defineFunction('read', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(0);
      a.load8_i32_u(0, 0);
    }).withExport();

    const instance = await mod.instantiate();
    const exports = instance.instance.exports as any;
    expect(exports.read(10)).toBe(99);
  });

  test('createInitEmitter called twice throws', () => {
    const seg = new DataSegmentBuilder(new Uint8Array([1, 2, 3]));
    seg.createInitEmitter((asm) => {
      asm.const_i32(0);
    });
    expect(() => {
      seg.createInitEmitter((asm) => {
        asm.const_i32(0);
      });
    }).toThrow('Initialization expression emitter has already been created.');
  });

  test('write() without init expression throws', () => {
    const seg = new DataSegmentBuilder(new Uint8Array([1, 2, 3]));
    const writer = new BinaryWriter();
    expect(() => seg.write(writer)).toThrow(
      'The initialization expression was not defined.'
    );
  });
});
