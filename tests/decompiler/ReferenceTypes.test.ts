import { expectDecompiles, ValueType, OpCodes, ElementType } from './DecompilerTestHelper';

describe('Decompiler: Reference Types', () => {
  test('ref.null funcref', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineTable(ElementType.FuncRef, 10);
      mod.defineFunction('f', null, [], (f, a) => {
        a.emit(OpCodes.ref_null, 0x70);
        a.const_i32(0);
        a.emit(OpCodes.table_set, 0);
      });
    });
  });

  test('ref.is_null', () => {
    expectDecompiles((mod) => {
      mod.defineTable(ElementType.FuncRef, 10);
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.const_i32(0);
        a.emit(OpCodes.table_get, 0);
        a.emit(OpCodes.ref_is_null);
      });
    });
  });
});

describe('Decompiler: Element Operations', () => {
  test('elem.drop', () => {
    const output = expectDecompiles((mod) => {
      mod.defineTable(ElementType.FuncRef, 10);
      const target = mod.defineFunction('target', [ValueType.Int32], [], (f, a) => {
        a.const_i32(0);
      });
      mod.definePassiveElementSegment([target]);
      mod.defineFunction('f', null, [], (f, a) => {
        a.elem_drop(0);
      });
    });
    expect(output).toContain('elem_drop');
  });

  test('table.init', () => {
    const output = expectDecompiles((mod) => {
      mod.defineTable(ElementType.FuncRef, 10);
      const target = mod.defineFunction('target', [ValueType.Int32], [], (f, a) => {
        a.const_i32(0);
      });
      mod.definePassiveElementSegment([target]);
      mod.defineFunction('f', null, [], (f, a) => {
        a.const_i32(0);
        a.const_i32(0);
        a.const_i32(1);
        a.table_init(0, 0);
      });
    });
    expect(output).toContain('table_init');
  });
});

describe('Decompiler: Table Operations', () => {
  test('table.get and table.set', () => {
    expectDecompiles((mod) => {
      mod.defineTable(ElementType.FuncRef, 10);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        a.const_i32(0);
        a.emit(OpCodes.table_get, 0);
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.table_set, 0);
      });
    });
  });

  test('table.size', () => {
    expectDecompiles((mod) => {
      mod.defineTable(ElementType.FuncRef, 10);
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.emit(OpCodes.table_size, 0);
      });
    });
  });

  test('table.grow', () => {
    expectDecompiles((mod) => {
      mod.defineTable(ElementType.FuncRef, 10);
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.emit(OpCodes.ref_null, 0x70);
        a.const_i32(5);
        a.emit(OpCodes.table_grow, 0);
      });
    });
  });

  test('table.fill', () => {
    expectDecompiles((mod) => {
      mod.defineTable(ElementType.FuncRef, 10);
      mod.defineFunction('f', null, [], (f, a) => {
        a.const_i32(0);
        a.emit(OpCodes.ref_null, 0x70);
        a.const_i32(10);
        a.emit(OpCodes.table_fill, 0);
      });
    });
  });

  test('table.copy', () => {
    expectDecompiles((mod) => {
      mod.defineTable(ElementType.FuncRef, 10);
      mod.defineFunction('f', null, [], (f, a) => {
        a.const_i32(0);
        a.const_i32(5);
        a.const_i32(3);
        a.emit(OpCodes.table_copy, 0, 0);
      });
    });
  });
});
