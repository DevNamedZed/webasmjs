import { expectDecompiles, ValueType, OpCodes } from './DecompilerTestHelper';

describe('Decompiler: i32 Binary Operations', () => {
  const ops: [string, any, string][] = [
    ['i32.add', OpCodes.i32_add, '+'],
    ['i32.sub', OpCodes.i32_sub, '-'],
    ['i32.mul', OpCodes.i32_mul, '*'],
    ['i32.div_s', OpCodes.i32_div_s, '/'],
    ['i32.div_u', OpCodes.i32_div_u, '/'],
    ['i32.rem_s', OpCodes.i32_rem_s, '%'],
    ['i32.rem_u', OpCodes.i32_rem_u, '%'],
    ['i32.and', OpCodes.i32_and, '&'],
    ['i32.or', OpCodes.i32_or, '|'],
    ['i32.xor', OpCodes.i32_xor, '^'],
    ['i32.shl', OpCodes.i32_shl, '<<'],
    ['i32.shr_s', OpCodes.i32_shr_s, '>>'],
    ['i32.shr_u', OpCodes.i32_shr_u, '>>>'],
  ];

  for (const [name, op, expected] of ops) {
    test(name, () => {
      const output = expectDecompiles((mod) => {
        mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
          a.get_local(a.getParameter(0));
          a.get_local(a.getParameter(1));
          a.emit(op);
        });
      });
      expect(output).toContain(expected);
    });
  }
});

describe('Decompiler: i64 Binary Operations', () => {
  for (const [name, op] of [
    ['i64.add', OpCodes.i64_add],
    ['i64.sub', OpCodes.i64_sub],
    ['i64.mul', OpCodes.i64_mul],
    ['i64.and', OpCodes.i64_and],
    ['i64.or', OpCodes.i64_or],
    ['i64.shl', OpCodes.i64_shl],
  ] as const) {
    test(name, () => {
      expectDecompiles((mod) => {
        mod.defineFunction('f', [ValueType.Int64], [ValueType.Int64, ValueType.Int64], (f, a) => {
          a.get_local(a.getParameter(0));
          a.get_local(a.getParameter(1));
          a.emit(op);
        });
      });
    });
  }
});

describe('Decompiler: f32 Binary Operations', () => {
  for (const [name, op] of [
    ['f32.add', OpCodes.f32_add],
    ['f32.sub', OpCodes.f32_sub],
    ['f32.mul', OpCodes.f32_mul],
    ['f32.div', OpCodes.f32_div],
    ['f32.min', OpCodes.f32_min],
    ['f32.max', OpCodes.f32_max],
  ] as const) {
    test(name, () => {
      expectDecompiles((mod) => {
        mod.defineFunction('f', [ValueType.Float32], [ValueType.Float32, ValueType.Float32], (f, a) => {
          a.get_local(a.getParameter(0));
          a.get_local(a.getParameter(1));
          a.emit(op);
        });
      });
    });
  }
});

describe('Decompiler: f64 Binary Operations', () => {
  for (const [name, op] of [
    ['f64.add', OpCodes.f64_add],
    ['f64.sub', OpCodes.f64_sub],
    ['f64.mul', OpCodes.f64_mul],
    ['f64.div', OpCodes.f64_div],
  ] as const) {
    test(name, () => {
      expectDecompiles((mod) => {
        mod.defineFunction('f', [ValueType.Float64], [ValueType.Float64, ValueType.Float64], (f, a) => {
          a.get_local(a.getParameter(0));
          a.get_local(a.getParameter(1));
          a.emit(op);
        });
      });
    });
  }
});

describe('Decompiler: Comparisons', () => {
  const ops: [string, any, string][] = [
    ['i32.eq', OpCodes.i32_eq, '=='],
    ['i32.ne', OpCodes.i32_ne, '!='],
    ['i32.lt_s', OpCodes.i32_lt_s, '<'],
    ['i32.gt_s', OpCodes.i32_gt_s, '>'],
    ['i32.le_s', OpCodes.i32_le_s, '<='],
    ['i32.ge_s', OpCodes.i32_ge_s, '>='],
    ['i32.lt_u', OpCodes.i32_lt_u, '<'],
    ['i32.gt_u', OpCodes.i32_gt_u, '>'],
  ];

  for (const [name, op, expected] of ops) {
    test(name, () => {
      const output = expectDecompiles((mod) => {
        mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
          a.get_local(a.getParameter(0));
          a.get_local(a.getParameter(1));
          a.emit(op);
        });
      });
      expect(output).toContain(expected);
    });
  }

  test('i32.eqz produces negation', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.eqz_i32();
      });
    });
    expect(output).toContain('!');
  });

  test('f64 comparisons', () => {
    for (const op of [OpCodes.f64_eq, OpCodes.f64_lt, OpCodes.f64_gt]) {
      expectDecompiles((mod) => {
        mod.defineFunction('f', [ValueType.Int32], [ValueType.Float64, ValueType.Float64], (f, a) => {
          a.get_local(a.getParameter(0));
          a.get_local(a.getParameter(1));
          a.emit(op);
        });
      });
    }
  });
});

describe('Decompiler: Unary Operations', () => {
  test('i32.clz', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_clz);
      });
    });
  });

  test('i32.ctz', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_ctz);
      });
    });
  });

  test('i32.popcnt', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_popcnt);
      });
    });
  });

  test('f64.abs', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Float64], [ValueType.Float64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.f64_abs);
      });
    });
  });

  test('f64.neg', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Float64], [ValueType.Float64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.f64_neg);
      });
    });
  });

  test('f64.sqrt', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Float64], [ValueType.Float64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.f64_sqrt);
      });
    });
  });

  test('f64.ceil', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Float64], [ValueType.Float64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.f64_ceil);
      });
    });
  });

  test('f64.floor', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Float64], [ValueType.Float64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.f64_floor);
      });
    });
  });
});

describe('Decompiler: Constants', () => {
  test('i32.const', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.const_i32(42);
      });
    });
    expect(output).toContain('42');
  });

  test('i64.const', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int64], [], (f, a) => {
        a.const_i64(BigInt(9999999));
      });
    });
    expect(output).toContain('9999999');
  });

  test('f32.const', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Float32], [], (f, a) => {
        a.const_f32(3.14);
      });
    });
  });

  test('f64.const', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Float64], [], (f, a) => {
        a.const_f64(2.718281828);
      });
    });
  });
});

describe('Decompiler: i64 Additional Operations', () => {
  const operations: [string, any, string][] = [
    ['i64.div_s', OpCodes.i64_div_s, '/'],
    ['i64.rem_s', OpCodes.i64_rem_s, '%'],
    ['i64.shr_s', OpCodes.i64_shr_s, '>>'],
    ['i64.xor', OpCodes.i64_xor, '^'],
    ['i64.rotl', OpCodes.i64_rotl, 'rotl'],
  ];

  for (const [name, op, expected] of operations) {
    test(name, () => {
      const output = expectDecompiles((mod) => {
        mod.defineFunction('f', [ValueType.Int64], [ValueType.Int64, ValueType.Int64], (f, a) => {
          a.get_local(a.getParameter(0));
          a.get_local(a.getParameter(1));
          a.emit(op);
        });
      });
      expect(output).toContain(expected);
    });
  }
});

describe('Decompiler: f64 Additional Operations', () => {
  const operations: [string, any, string][] = [
    ['f64.min', OpCodes.f64_min, 'min'],
    ['f64.max', OpCodes.f64_max, 'max'],
  ];

  for (const [name, op, expected] of operations) {
    test(name, () => {
      const output = expectDecompiles((mod) => {
        mod.defineFunction('f', [ValueType.Float64], [ValueType.Float64, ValueType.Float64], (f, a) => {
          a.get_local(a.getParameter(0));
          a.get_local(a.getParameter(1));
          a.emit(op);
        });
      });
      expect(output).toContain(expected);
    });
  }
});

describe('Decompiler: Constant Folding', () => {
  test('10 + 20 folds to 30', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.const_i32(10);
        a.const_i32(20);
        a.add_i32();
      });
    });
    expect(output).toContain('30');
  });

  test('6 * 7 folds to 42', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.const_i32(6);
        a.const_i32(7);
        a.mul_i32();
      });
    });
    expect(output).toContain('42');
  });

  test('1 << 10 folds to 1024', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.const_i32(1);
        a.const_i32(10);
        a.shl_i32();
      });
    });
    expect(output).toContain('1024');
  });

  test('100 / 5 folds to 20', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.const_i32(100);
        a.const_i32(5);
        a.emit(OpCodes.i32_div_s);
      });
    });
    expect(output).toContain('20');
  });
});
