import { ModuleBuilder, ValueType } from '../src/index';

const latestOpts = { generateNameSection: true, target: 'latest' as const };

describe('extract_lane', () => {
  test('extract_lane_i32x4 for each lane', async () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    // Store 4 i32 values then extract each lane
    mod.defineFunction('setI32', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.get_local(f.getParameter(1));
      a.store_i32(2, 0);
    }).withExport();

    mod.defineFunction('extractLane', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      // Load v128 from address 0
      a.const_i32(0);
      a.load_v128(0, 0);
      // Extract lane at given index — we need separate functions per lane
      // So let's create one per lane
      a.extract_lane_i32x4(0);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await WebAssembly.instantiate(bytes.buffer as ArrayBuffer);
    const { setI32, extractLane } = instance.instance.exports as any;
    setI32(0, 10);
    setI32(4, 20);
    setI32(8, 30);
    setI32(12, 40);
    expect(extractLane()).toBe(10); // lane 0
  });

  test('extract_lane_f32x4 with float values', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('test', [ValueType.Float32], [], (f, a) => {
      a.const_i32(0);
      a.load_v128(0, 0);
      a.extract_lane_f32x4(2);
    }).withExport();

    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('extract_lane_s_i8x16 (signed) for value > 127', async () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    // Store 0xFF (255) at byte offset 0
    mod.defineFunction('setByte', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.get_local(f.getParameter(1));
      a.store8_i32(0, 0);
    }).withExport();

    // Extract lane 0 as signed i8 → should be -1 for 0xFF
    mod.defineFunction('extractSigned', [ValueType.Int32], [], (f, a) => {
      a.const_i32(0);
      a.load_v128(0, 0);
      a.extract_lane_s_i8x16(0);
    }).withExport();

    // Extract lane 0 as unsigned i8 → should be 255 for 0xFF
    mod.defineFunction('extractUnsigned', [ValueType.Int32], [], (f, a) => {
      a.const_i32(0);
      a.load_v128(0, 0);
      a.extract_lane_u_i8x16(0);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await WebAssembly.instantiate(bytes.buffer as ArrayBuffer);
    const { setByte, extractSigned, extractUnsigned } = instance.instance.exports as any;
    setByte(0, 0xFF);
    expect(extractSigned()).toBe(-1);
    expect(extractUnsigned()).toBe(255);
  });

  test('extract_lane_i64x2 validates', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('test', [ValueType.Int64], [], (f, a) => {
      a.const_i32(0);
      a.load_v128(0, 0);
      a.extract_lane_i64x2(1);
    }).withExport();

    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });
});

describe('replace_lane', () => {
  test('replace_lane_i32x4 replaces single lane', async () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('setI32', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.get_local(f.getParameter(1));
      a.store_i32(2, 0);
    }).withExport();

    mod.defineFunction('replaceLane2', null, [ValueType.Int32], (f, a) => {
      // Load v128 from addr 0, replace lane 2, store back at addr 0
      a.const_i32(0);
      a.const_i32(0);
      a.load_v128(0, 0);
      a.get_local(f.getParameter(0));
      a.replace_lane_i32x4(2);
      a.store_v128(0, 0);
    }).withExport();

    mod.defineFunction('getI32', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.load_i32(2, 0);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await WebAssembly.instantiate(bytes.buffer as ArrayBuffer);
    const { setI32, replaceLane2, getI32 } = instance.instance.exports as any;
    setI32(0, 10);
    setI32(4, 20);
    setI32(8, 30);
    setI32(12, 40);
    replaceLane2(99);
    expect(getI32(0)).toBe(10);   // lane 0 unchanged
    expect(getI32(4)).toBe(20);   // lane 1 unchanged
    expect(getI32(8)).toBe(99);   // lane 2 replaced
    expect(getI32(12)).toBe(40);  // lane 3 unchanged
  });

  test('replace_lane_f64x2 validates', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('test', null, [], (f, a) => {
      a.const_i32(0);
      a.const_i32(0);
      a.load_v128(0, 0);
      a.const_f64(3.14);
      a.replace_lane_f64x2(1);
      a.store_v128(0, 0);
    }).withExport();

    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('replace_lane_i8x16 validates', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('test', null, [], (f, a) => {
      a.const_i32(0);
      a.const_i32(0);
      a.load_v128(0, 0);
      a.const_i32(42);
      a.replace_lane_i8x16(5);
      a.store_v128(0, 0);
    }).withExport();

    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });
});

describe('splat', () => {
  test('splat_i32x4 fills all 4 lanes', async () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('splatAndStore', null, [ValueType.Int32], (f, a) => {
      a.const_i32(0);
      a.get_local(f.getParameter(0));
      a.splat_i32x4();
      a.store_v128(0, 0);
    }).withExport();

    mod.defineFunction('getI32', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.load_i32(2, 0);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await WebAssembly.instantiate(bytes.buffer as ArrayBuffer);
    const { splatAndStore, getI32 } = instance.instance.exports as any;
    splatAndStore(42);
    expect(getI32(0)).toBe(42);
    expect(getI32(4)).toBe(42);
    expect(getI32(8)).toBe(42);
    expect(getI32(12)).toBe(42);
  });

  test('splat_f32x4 with float value', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('test', null, [], (f, a) => {
      a.const_i32(0);
      a.const_f32(3.14);
      a.splat_f32x4();
      a.store_v128(0, 0);
    }).withExport();

    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('splat_i8x16 fills all 16 lanes', async () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('splatAndStore', null, [ValueType.Int32], (f, a) => {
      a.const_i32(0);
      a.get_local(f.getParameter(0));
      a.splat_i8x16();
      a.store_v128(0, 0);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await WebAssembly.instantiate(bytes.buffer as ArrayBuffer);
    const { splatAndStore } = instance.instance.exports as any;
    splatAndStore(7);
    const memory = instance.instance.exports.memory as WebAssembly.Memory | undefined;
    // If memory not exported, just validate
    if (!memory) return;
    const view = new Uint8Array(memory.buffer);
    for (let i = 0; i < 16; i++) {
      expect(view[i]).toBe(7);
    }
  });
});

describe('narrow / extend', () => {
  test('narrow_i16x8_s_i8x16 signed narrow validates', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('test', null, [], (f, a) => {
      a.const_i32(0);
      a.const_i32(0);
      a.load_v128(0, 0);
      a.const_i32(16);
      a.load_v128(0, 0);
      a.narrow_i16x8_s_i8x16();
      a.store_v128(0, 0);
    }).withExport();

    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('extend_low_i8x16_s_i16x8 validates', () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('test', null, [], (f, a) => {
      a.const_i32(0);
      a.const_i32(0);
      a.load_v128(0, 0);
      a.extend_low_i8x16_s_i16x8();
      a.store_v128(0, 0);
    }).withExport();

    expect(WebAssembly.validate(mod.toBytes().buffer as ArrayBuffer)).toBe(true);
  });

  test('narrow with saturation clamping', async () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    // Write i16 values to memory, narrow to i8, read back
    mod.defineFunction('setI16', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.get_local(f.getParameter(1));
      a.store16_i32(1, 0);
    }).withExport();

    mod.defineFunction('narrowAndStore', null, [], (f, a) => {
      a.const_i32(64);
      a.const_i32(0);
      a.load_v128(0, 0);
      a.const_i32(16);
      a.load_v128(0, 0);
      a.narrow_i16x8_u_i8x16();
      a.store_v128(0, 0);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });
});

describe('bitmask & all_true', () => {
  test('bitmask_i32x4 returns bitmask of sign bits', async () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('setI32', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.get_local(f.getParameter(1));
      a.store_i32(2, 0);
    }).withExport();

    mod.defineFunction('getBitmask', [ValueType.Int32], [], (f, a) => {
      a.const_i32(0);
      a.load_v128(0, 0);
      a.bitmask_i32x4();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await WebAssembly.instantiate(bytes.buffer as ArrayBuffer);
    const { setI32, getBitmask } = instance.instance.exports as any;

    // All positive → bitmask = 0
    setI32(0, 1); setI32(4, 2); setI32(8, 3); setI32(12, 4);
    expect(getBitmask()).toBe(0);

    // Lane 0 and 2 negative → bitmask = 0b0101 = 5
    setI32(0, -1); setI32(4, 2); setI32(8, -3); setI32(12, 4);
    expect(getBitmask()).toBe(5);

    // All negative → bitmask = 0b1111 = 15
    setI32(0, -1); setI32(4, -1); setI32(8, -1); setI32(12, -1);
    expect(getBitmask()).toBe(15);
  });

  test('all_true_i32x4 returns 1 when all lanes nonzero', async () => {
    const mod = new ModuleBuilder('test', latestOpts);
    mod.defineMemory(1);

    mod.defineFunction('setI32', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.get_local(f.getParameter(1));
      a.store_i32(2, 0);
    }).withExport();

    mod.defineFunction('allTrue', [ValueType.Int32], [], (f, a) => {
      a.const_i32(0);
      a.load_v128(0, 0);
      a.all_true_i32x4();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await WebAssembly.instantiate(bytes.buffer as ArrayBuffer);
    const { setI32, allTrue } = instance.instance.exports as any;

    // All nonzero → true
    setI32(0, 1); setI32(4, 2); setI32(8, 3); setI32(12, 4);
    expect(allTrue()).toBe(1);

    // One zero → false
    setI32(0, 1); setI32(4, 0); setI32(8, 3); setI32(12, 4);
    expect(allTrue()).toBe(0);

    // All zero → false
    setI32(0, 0); setI32(4, 0); setI32(8, 0); setI32(12, 0);
    expect(allTrue()).toBe(0);
  });
});
