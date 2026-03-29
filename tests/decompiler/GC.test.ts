import { expectDecompiles, ValueType, OpCodes } from './DecompilerTestHelper';
import { mut } from '../../src/index';

describe('Decompiler: GC Struct', () => {
  test('struct.new emits struct_new intrinsic', () => {
    const output = expectDecompiles((mod) => {
      const struct = mod.defineStructType({ val: mut(ValueType.Int32) });
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.const_i32(42);
        a.struct_new(struct.index);
        a.struct_get(struct.index, 0);
      });
    });
    expect(output).toContain('struct_new');
    expect(output).toContain('struct_get');
  });

  test('struct.set emits struct_set intrinsic', () => {
    const output = expectDecompiles((mod) => {
      const struct = mod.defineStructType({ val: mut(ValueType.Int32) });
      mod.defineFunction('f', null, [], (f, a) => {
        a.const_i32(10);
        a.struct_new(struct.index);
        a.const_i32(99);
        a.struct_set(struct.index, 0);
      });
    });
    expect(output).toContain('struct_set');
  });

  test('struct.new_default', () => {
    const output = expectDecompiles((mod) => {
      const struct = mod.defineStructType({ val: mut(ValueType.Int32) });
      mod.defineFunction('f', null, [], (f, a) => {
        a.struct_new_default(struct.index);
        a.drop();
      });
    });
    expect(output).toContain('struct_new_default');
  });
});

describe('Decompiler: GC Array', () => {
  test('array.new emits array_new intrinsic', () => {
    const output = expectDecompiles((mod) => {
      const arr = mod.defineArrayType(ValueType.Int32, true);
      mod.defineFunction('f', null, [], (f, a) => {
        a.const_i32(0);
        a.const_i32(10);
        a.array_new(arr.index);
        a.drop();
      });
    });
    expect(output).toContain('array_new');
  });

  test('array.get emits array_get intrinsic', () => {
    const output = expectDecompiles((mod) => {
      const arr = mod.defineArrayType(ValueType.Int32, true);
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.const_i32(0);
        a.const_i32(10);
        a.array_new(arr.index);
        a.const_i32(0);
        a.array_get(arr.index);
      });
    });
    expect(output).toContain('array_get');
  });

  test('array.set emits array_set intrinsic', () => {
    const output = expectDecompiles((mod) => {
      const arr = mod.defineArrayType(ValueType.Int32, true);
      mod.defineFunction('f', null, [], (f, a) => {
        a.const_i32(0);
        a.const_i32(5);
        a.array_new(arr.index);
        a.const_i32(0);
        a.const_i32(99);
        a.array_set(arr.index);
      });
    });
    expect(output).toContain('array_set');
  });

  test('array.len emits array_len intrinsic', () => {
    const output = expectDecompiles((mod) => {
      const arr = mod.defineArrayType(ValueType.Int32, true);
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.const_i32(0);
        a.const_i32(5);
        a.array_new(arr.index);
        a.array_len();
      });
    });
    expect(output).toContain('array_len');
  });
});

describe('Decompiler: GC i31', () => {
  test('ref.i31 and i31.get_s', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.ref_i31);
        a.emit(OpCodes.i31_get_s);
      });
    });
    expect(output).toContain('ref_i31');
    expect(output).toContain('i31_get_s');
  });

  test('i31.get_u', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.ref_i31);
        a.emit(OpCodes.i31_get_u);
      });
    });
    expect(output).toContain('i31_get_u');
  });
});

describe('Decompiler: GC Additional', () => {
  test('array.new_default', () => {
    const output = expectDecompiles((mod) => {
      const arr = mod.defineArrayType(ValueType.Int32, true);
      mod.defineFunction('f', null, [], (f, a) => {
        a.const_i32(5);
        a.array_new_default(arr.index);
        a.drop();
      });
    });
    expect(output).toContain('array_new_default');
  });

  test('ref.test', () => {
    const output = expectDecompiles((mod) => {
      const struct = mod.defineStructType({ val: mut(ValueType.Int32) });
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.const_i32(42);
        a.struct_new(struct.index);
        a.emit(OpCodes.ref_test, struct.index);
      });
    });
    expect(output).toContain('ref_test');
  });

  test('ref.cast', () => {
    const output = expectDecompiles((mod) => {
      const struct = mod.defineStructType({ val: mut(ValueType.Int32) });
      mod.defineFunction('f', null, [], (f, a) => {
        a.const_i32(42);
        a.struct_new(struct.index);
        a.emit(OpCodes.ref_cast, struct.index);
        a.drop();
      });
    });
    expect(output).toContain('ref_cast');
  });

  test('ref.func', () => {
    const output = expectDecompiles((mod) => {
      const target = mod.defineFunction('target', [ValueType.Int32], [], (f, a) => {
        a.const_i32(0);
      });
      mod.defineFunction('f', null, [], (f, a) => {
        a.ref_func(target);
        a.drop();
      });
    });
    expect(output).toContain('ref_func');
  });

  test('array.fill', () => {
    const output = expectDecompiles((mod) => {
      const arr = mod.defineArrayType(ValueType.Int32, true);
      mod.defineFunction('f', null, [], (f, a) => {
        a.const_i32(0);
        a.const_i32(5);
        a.array_new(arr.index);
        a.const_i32(0);
        a.const_i32(99);
        a.const_i32(5);
        a.emit(OpCodes.array_fill, arr.index);
      });
    });
    expect(output).toContain('array_fill');
  });

  test('array.copy', () => {
    const output = expectDecompiles((mod) => {
      const source = mod.defineArrayType(ValueType.Int32, true);
      const destination = mod.defineArrayType(ValueType.Int32, true);
      mod.defineFunction('f', null, [], (f, a) => {
        a.const_i32(0);
        a.const_i32(5);
        a.array_new(destination.index);
        a.const_i32(0);
        a.const_i32(0);
        a.const_i32(3);
        a.array_new(source.index);
        a.const_i32(0);
        a.const_i32(3);
        a.emit(OpCodes.array_copy, destination.index, source.index);
      });
    });
    expect(output).toContain('array_copy');
  });
});
