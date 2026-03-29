import { expectDecompiles, ValueType, OpCodes } from './DecompilerTestHelper';

describe('Decompiler: Loads', () => {
  test('i32.load', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.load_i32(2, 0);
      });
    });
    expect(output).toContain('memory[');
  });

  test('i32.load with offset', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.load_i32(2, 16);
      });
    });
    expect(output).toContain('16');
  });

  test('i32.load8_u produces ubyte cast', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_load8_u, 0, 0);
      });
    });
    expect(output).toContain('ubyte');
  });

  test('i32.load8_s produces byte cast', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_load8_s, 0, 0);
      });
    });
    expect(output).toContain('byte');
  });

  test('i32.load16_s produces short cast', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_load16_s, 1, 0);
      });
    });
    expect(output).toContain('short');
  });

  test('i32.load16_u produces ushort cast', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_load16_u, 1, 0);
      });
    });
    expect(output).toContain('ushort');
  });

  test('i64.load', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Int64], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i64_load, 3, 0);
      });
    });
  });

  test('f32.load', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Float32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.f32_load, 2, 0);
      });
    });
  });

  test('f64.load', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Float64], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.f64_load, 3, 0);
      });
    });
  });
});

describe('Decompiler: Stores', () => {
  test('i32.store', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.store_i32(2, 0);
      });
    });
    expect(output).toContain('memory[');
    expect(output).toContain('=');
  });

  test('i32.store8', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.emit(OpCodes.i32_store8, 0, 0);
      });
    });
  });

  test('i32.store16', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.emit(OpCodes.i32_store16, 1, 0);
      });
    });
  });
});

describe('Decompiler: Memory Operations', () => {
  test('memory.size', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.emit(OpCodes.mem_size, 0);
      });
    });
    expect(output).toContain('memory_size');
  });

  test('memory.grow', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.mem_grow, 0);
      });
    });
    expect(output).toContain('memory_grow');
  });
});

describe('Decompiler: Memory Patterns', () => {
  test('base + (index << 2) becomes array access', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.const_i32(2);
        a.shl_i32();
        a.add_i32();
        a.load_i32(2, 0);
      });
    });
    expect(output).toContain('[');
  });

  test('base + (index * 12) becomes array access', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.const_i32(12);
        a.mul_i32();
        a.add_i32();
        a.load_i32(2, 0);
      });
    });
    expect(output).toContain('[');
  });

  test('base + (index << 2) store becomes array access', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.const_i32(2);
        a.shl_i32();
        a.add_i32();
        a.get_local(a.getParameter(2));
        a.store_i32(2, 0);
      });
    });
    expect(output).toContain('[');
  });

  test('struct field store with distinct offsets', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.store_i32(2, 0);
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(2));
        a.store_i32(2, 4);
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.store_i32(2, 8);
      });
    });
    expect(output).toContain('[4]');
    expect(output).toContain('[8]');
  });

  test('struct field load with distinct offsets', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.load_i32(2, 0);
        a.get_local(a.getParameter(0));
        a.load_i32(2, 4);
        a.add_i32();
        a.get_local(a.getParameter(0));
        a.load_i32(2, 8);
        a.add_i32();
      });
    });
    expect(output).toContain('[4]');
    expect(output).toContain('[8]');
  });

  test('string literal from data segment', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineData(new TextEncoder().encode('hello world\0'), 1024);
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.const_i32(1024);
      });
    });
    expect(output).toContain('hello world');
  });
});
