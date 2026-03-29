import { expectDecompiles, decompileLast, ModuleBuilder, BinaryReader, ValueType, OpCodes, BlockType, decompileFunction, createNameResolver } from './DecompilerTestHelper';

describe('Decompiler: Stack Frame Detection', () => {
  test('prologue and epilogue removed', () => {
    const output = expectDecompiles((mod) => {
      const sp = mod.defineGlobal(ValueType.Int32, true, 65536);
      mod.defineMemory(1);
      mod.defineFunction('f', null, [], (f, a) => {
        const fp = a.declareLocal(ValueType.Int32, 'fp');
        a.get_global(sp);
        a.const_i32(32);
        a.sub_i32();
        a.tee_local(fp);
        a.set_global(sp);
        a.get_local(fp);
        a.const_i32(99);
        a.store_i32(2, 0);
        a.get_local(fp);
        a.const_i32(32);
        a.add_i32();
        a.set_global(sp);
      });
    });
    expect(output).not.toContain('__stack_pointer');
    expect(output).toContain('99');
  });

  test('frame pointer not treated as struct base', () => {
    const output = expectDecompiles((mod) => {
      const sp = mod.defineGlobal(ValueType.Int32, true, 65536);
      mod.defineMemory(1);
      mod.defineFunction('f', null, [], (f, a) => {
        const fp = a.declareLocal(ValueType.Int32, 'fp');
        a.get_global(sp);
        a.const_i32(64);
        a.sub_i32();
        a.tee_local(fp);
        a.set_global(sp);
        a.get_local(fp);
        a.const_i32(1);
        a.store_i32(2, 0);
        a.get_local(fp);
        a.const_i32(2);
        a.store_i32(2, 4);
        a.get_local(fp);
        a.const_i32(3);
        a.store_i32(2, 8);
        a.get_local(fp);
        a.const_i32(64);
        a.add_i32();
        a.set_global(sp);
      });
    });
    expect(output).not.toContain('->');
    expect(output).not.toContain('__stack_pointer');
  });
});

describe('Decompiler: Multi-value Returns', () => {
  test('two i32 returns both present', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32, ValueType.Int32],
        [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(1));
        a.get_local(a.getParameter(0));
      });
    });
    expect(output).toContain('int, int');
    expect(output).toContain('return');
  });

  test('mixed return types', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32, ValueType.Float64], [], (f, a) => {
        a.const_i32(1);
        a.const_f64(3.14);
      });
    });
    expect(output).toContain('int, double');
  });

  test('single return still works', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.const_i32(1);
        a.add_i32();
      });
    });
    expect(output).toContain('return');
  });

  test('void return', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', null, [], (f, a) => {
        a.nop();
      });
    });
    expect(output).toContain('void');
  });
});

describe('Decompiler: Globals', () => {
  test('global get and set decompile', () => {
    expectDecompiles((mod) => {
      const g = mod.defineGlobal(ValueType.Int32, true, 0);
      mod.defineFunction('f', null, [], (f, a) => {
        a.get_global(g);
        a.const_i32(1);
        a.add_i32();
        a.set_global(g);
      });
    });
  });
});

describe('Decompiler: Identifier Sanitization', () => {
  test('colons and dashes replaced with underscores', () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('my:func.name-here', [ValueType.Int32], [], (f, a) => {
      a.const_i32(42);
    });
    const bytes = mod.toBytes();
    const info = new BinaryReader(new Uint8Array(bytes)).read();
    const resolver = createNameResolver(info);
    const output = decompileFunction(info, 0, resolver);
    expect(output).not.toContain(':');
    expect(output).toContain('my_func_name_here');
  });
});

describe('Decompiler: Bulk Memory', () => {
  test('memory.fill', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.const_i32(0);
        a.const_i32(256);
        a.emit(OpCodes.memory_fill, 0);
      });
    });
  });

  test('memory.copy', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.const_i32(100);
        a.emit(OpCodes.memory_copy, 0, 0);
      });
    });
  });

  test('memory.init', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineData(new TextEncoder().encode('test'), 0);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.const_i32(0);
        a.const_i32(4);
        a.emit(OpCodes.memory_init, 0, 0);
      });
    });
  });

  test('data.drop', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineData(new TextEncoder().encode('test'), 0);
      mod.defineFunction('f', null, [], (f, a) => {
        a.emit(OpCodes.data_drop, 0);
      });
    });
  });
});
