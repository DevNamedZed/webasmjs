import { expectDecompiles, ValueType, OpCodes } from './DecompilerTestHelper';

describe('Decompiler: Atomic Loads', () => {
  test('i32.atomic.load', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1, 4, true);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_atomic_load, 2, 0);
      });
    });
  });

  test('i32.atomic.load8_u', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1, 4, true);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_atomic_load8_u, 0, 0);
      });
    });
  });

  test('i32.atomic.load16_u', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1, 4, true);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_atomic_load16_u, 1, 0);
      });
    });
  });
});

describe('Decompiler: Atomic Stores', () => {
  test('i32.atomic.store', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1, 4, true);
      mod.defineFunction('f', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.emit(OpCodes.i32_atomic_store, 2, 0);
      });
    });
  });
});

describe('Decompiler: Atomic RMW', () => {
  for (const [name, op] of [
    ['i32.atomic.rmw.add', OpCodes.i32_atomic_rmw_add],
    ['i32.atomic.rmw.sub', OpCodes.i32_atomic_rmw_sub],
    ['i32.atomic.rmw.and', OpCodes.i32_atomic_rmw_and],
    ['i32.atomic.rmw.or', OpCodes.i32_atomic_rmw_or],
    ['i32.atomic.rmw.xor', OpCodes.i32_atomic_rmw_xor],
    ['i32.atomic.rmw.xchg', OpCodes.i32_atomic_rmw_xchg],
  ] as const) {
    test(name, () => {
      expectDecompiles((mod) => {
        mod.defineMemory(1, 4, true);
        mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
          a.get_local(a.getParameter(0));
          a.get_local(a.getParameter(1));
          a.emit(op, 2, 0);
        });
      });
    });
  }
});

describe('Decompiler: Atomic CmpXchg', () => {
  test('i32.atomic.rmw.cmpxchg', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1, 4, true);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.get_local(a.getParameter(2));
        a.emit(OpCodes.i32_atomic_rmw_cmpxchg, 2, 0);
      });
    });
  });
});

describe('Decompiler: Atomic Wait/Notify', () => {
  test('atomic.notify', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1, 4, true);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.emit(OpCodes.memory_atomic_notify, 2, 0);
      });
    });
  });

  test('i32.atomic.wait', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1, 4, true);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32, ValueType.Int64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.get_local(a.getParameter(2));
        a.emit(OpCodes.memory_atomic_wait32, 2, 0);
      });
    });
  });

  test('atomic.fence', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1, 4, true);
      mod.defineFunction('f', null, [], (f, a) => {
        a.emit(OpCodes.atomic_fence, 0);
      });
    });
  });
});

describe('Decompiler: Atomic Sub-word RMW', () => {
  test('i32.atomic.rmw8.add_u', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1, 4, true);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.emit(OpCodes.i32_atomic_rmw8_add_u, 0, 0);
      });
    });
  });

  test('i32.atomic.rmw16.add_u', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1, 4, true);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.emit(OpCodes.i32_atomic_rmw16_add_u, 1, 0);
      });
    });
  });
});

describe('Decompiler: i64 Atomic', () => {
  test('i64.atomic.load', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1, 4, true);
      mod.defineFunction('f', [ValueType.Int64], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i64_atomic_load, 3, 0);
      });
    });
  });

  test('i64.atomic.store', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1, 4, true);
      mod.defineFunction('f', null, [ValueType.Int32, ValueType.Int64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.emit(OpCodes.i64_atomic_store, 3, 0);
      });
    });
  });

  test('i64.atomic.rmw.add', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1, 4, true);
      mod.defineFunction('f', [ValueType.Int64], [ValueType.Int32, ValueType.Int64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(1));
        a.emit(OpCodes.i64_atomic_rmw_add, 3, 0);
      });
    });
  });
});
