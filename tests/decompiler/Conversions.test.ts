import { expectDecompiles, ValueType, OpCodes } from './DecompilerTestHelper';

describe('Decompiler: Type Conversions', () => {
  test('i32.wrap_i64', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_wrap_i64);
      });
    });
    expect(output).toContain('int');
  });

  test('i64.extend_i32_s', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int64], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i64_extend_i32_s);
      });
    });
  });

  test('i64.extend_i32_u', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int64], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i64_extend_i32_u);
      });
    });
  });

  test('f32.convert_i32_s', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Float32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.f32_convert_i32_s);
      });
    });
  });

  test('f64.convert_i32_s', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Float64], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.f64_convert_i32_s);
      });
    });
    expect(output).toContain('double');
  });

  test('i32.trunc_f64_s', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Float64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_trunc_f64_s);
      });
    });
    expect(output).toContain('int');
  });

  test('f32.demote_f64', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Float32], [ValueType.Float64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.f32_demote_f64);
      });
    });
    expect(output).toContain('float');
  });

  test('f64.promote_f32', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Float64], [ValueType.Float32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.f64_promote_f32);
      });
    });
    expect(output).toContain('double');
  });

  test('i32.reinterpret_f32', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Float32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_reinterpret_f32);
      });
    });
  });

  test('f64.reinterpret_i64', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Float64], [ValueType.Int64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.f64_reinterpret_i64);
      });
    });
  });
});

describe('Decompiler: Saturating Truncation', () => {
  test('i32.trunc_sat_f64_s', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Float64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_trunc_sat_f64_s);
      });
    });
    expect(output).toContain('int');
  });

  test('i32.trunc_sat_f32_u', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Float32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_trunc_sat_f32_u);
      });
    });
  });
});

describe('Decompiler: i64 Conversions', () => {
  test('i64.trunc_f64_s', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int64], [ValueType.Float64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i64_trunc_f64_s);
      });
    });
  });

  test('i64.trunc_sat_f64_s', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int64], [ValueType.Float64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i64_trunc_sat_f64_s);
      });
    });
  });

  test('f64.convert_i64_s', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Float64], [ValueType.Int64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.f64_convert_i64_s);
      });
    });
  });
});

describe('Decompiler: Sign Extension', () => {
  test('i32.extend8_s', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_extend8_s);
      });
    });
  });

  test('i32.extend16_s', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_extend16_s);
      });
    });
  });

  test('i64.extend8_s', () => {
    expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int64], [ValueType.Int64], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i64_extend8_s);
      });
    });
  });
});
