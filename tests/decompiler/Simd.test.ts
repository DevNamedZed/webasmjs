import { expectDecompiles, ValueType, OpCodes } from './DecompilerTestHelper';

const ZERO_V128 = new Uint8Array(16);

describe('Decompiler: SIMD Load/Store', () => {
  test('v128.load and v128.store', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.load_v128(4, 0);
        a.get_local(a.getParameter(0));
        a.store_v128(4, 16);
      });
    });
  });

  test('v128.const', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [], (f, a) => {
        a.const_i32(0);
        a.const_v128(ZERO_V128);
        a.store_v128(4, 0);
      });
    });
  });
});

describe('Decompiler: SIMD i32x4', () => {
  function simdBinaryTest(name: string, op: any) {
    test(name, () => {
      const output = expectDecompiles((mod) => {
        mod.defineMemory(1);
        mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
          a.get_local(a.getParameter(0));
          a.load_v128(4, 0);
          a.get_local(a.getParameter(0));
          a.load_v128(4, 16);
          a.emit(op);
          a.get_local(a.getParameter(0));
          a.store_v128(4, 32);
        });
      });
      const intrinsicName = name.replace(/\./g, '_');
      expect(output).toContain(intrinsicName);
      expect(output).toContain('v128_load');
      expect(output).toContain('v128_store');
    });
  }

  simdBinaryTest('i32x4.add', OpCodes.i32x4_add);
  simdBinaryTest('i32x4.sub', OpCodes.i32x4_sub);
  simdBinaryTest('i32x4.mul', OpCodes.i32x4_mul);
});

describe('Decompiler: SIMD f32x4', () => {
  function simdBinaryTest(name: string, op: any) {
    test(name, () => {
      expectDecompiles((mod) => {
        mod.defineMemory(1);
        mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
          a.get_local(a.getParameter(0));
          a.load_v128(4, 0);
          a.get_local(a.getParameter(0));
          a.load_v128(4, 16);
          a.emit(op);
          a.get_local(a.getParameter(0));
          a.store_v128(4, 32);
        });
      });
    });
  }

  simdBinaryTest('f32x4.add', OpCodes.f32x4_add);
  simdBinaryTest('f32x4.sub', OpCodes.f32x4_sub);
  simdBinaryTest('f32x4.mul', OpCodes.f32x4_mul);
  simdBinaryTest('f32x4.div', OpCodes.f32x4_div);
});

describe('Decompiler: SIMD f64x2', () => {
  function simdBinaryTest(name: string, op: any) {
    test(name, () => {
      expectDecompiles((mod) => {
        mod.defineMemory(1);
        mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
          a.get_local(a.getParameter(0));
          a.load_v128(4, 0);
          a.get_local(a.getParameter(0));
          a.load_v128(4, 16);
          a.emit(op);
          a.get_local(a.getParameter(0));
          a.store_v128(4, 32);
        });
      });
    });
  }

  simdBinaryTest('f64x2.add', OpCodes.f64x2_add);
  simdBinaryTest('f64x2.sub', OpCodes.f64x2_sub);
  simdBinaryTest('f64x2.mul', OpCodes.f64x2_mul);
});

describe('Decompiler: SIMD i8x16/i16x8', () => {
  function simdBinaryTest(name: string, op: any) {
    test(name, () => {
      expectDecompiles((mod) => {
        mod.defineMemory(1);
        mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
          a.get_local(a.getParameter(0));
          a.load_v128(4, 0);
          a.get_local(a.getParameter(0));
          a.load_v128(4, 16);
          a.emit(op);
          a.get_local(a.getParameter(0));
          a.store_v128(4, 32);
        });
      });
    });
  }

  simdBinaryTest('i8x16.add', OpCodes.i8x16_add);
  simdBinaryTest('i8x16.sub', OpCodes.i8x16_sub);
  simdBinaryTest('i16x8.add', OpCodes.i16x8_add);
  simdBinaryTest('i16x8.sub', OpCodes.i16x8_sub);
  simdBinaryTest('i16x8.mul', OpCodes.i16x8_mul);
});

describe('Decompiler: SIMD Bitwise', () => {
  function simdBinaryTest(name: string, op: any) {
    test(name, () => {
      expectDecompiles((mod) => {
        mod.defineMemory(1);
        mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
          a.get_local(a.getParameter(0));
          a.load_v128(4, 0);
          a.get_local(a.getParameter(0));
          a.load_v128(4, 16);
          a.emit(op);
          a.get_local(a.getParameter(0));
          a.store_v128(4, 32);
        });
      });
    });
  }

  simdBinaryTest('v128.and', OpCodes.v128_and);
  simdBinaryTest('v128.or', OpCodes.v128_or);
  simdBinaryTest('v128.xor', OpCodes.v128_xor);
  simdBinaryTest('v128.andnot', OpCodes.v128_andnot);

  test('v128.not (unary)', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.load_v128(4, 0);
        a.emit(OpCodes.v128_not);
        a.get_local(a.getParameter(0));
        a.store_v128(4, 16);
      });
    });
  });
});

describe('Decompiler: SIMD Splat', () => {
  test('i32x4.splat', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32x4_splat);
        a.const_i32(0);
        a.store_v128(4, 0);
      });
    });
  });

  test('f32x4.splat', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Float32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.f32x4_splat);
        a.const_i32(0);
        a.store_v128(4, 0);
      });
    });
  });
});

describe('Decompiler: SIMD Comparisons', () => {
  function simdBinaryTest(name: string, op: any) {
    test(name, () => {
      expectDecompiles((mod) => {
        mod.defineMemory(1);
        mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
          a.get_local(a.getParameter(0));
          a.load_v128(4, 0);
          a.get_local(a.getParameter(0));
          a.load_v128(4, 16);
          a.emit(op);
          a.get_local(a.getParameter(0));
          a.store_v128(4, 32);
        });
      });
    });
  }

  simdBinaryTest('i32x4.eq', OpCodes.i32x4_eq);
  simdBinaryTest('i32x4.ne', OpCodes.i32x4_ne);
  simdBinaryTest('f32x4.eq', OpCodes.f32x4_eq);
  simdBinaryTest('f32x4.lt', OpCodes.f32x4_lt);
});

describe('Decompiler: SIMD Unary', () => {
  function simdUnaryTest(name: string, op: any) {
    test(name, () => {
      const output = expectDecompiles((mod) => {
        mod.defineMemory(1);
        mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
          a.get_local(a.getParameter(0));
          a.get_local(a.getParameter(0));
          a.load_v128(4, 0);
          a.emit(op);
          a.store_v128(4, 16);
        });
      });
      expect(output).toContain(name.replace(/\./g, '_'));
    });
  }

  simdUnaryTest('f32x4.abs', OpCodes.f32x4_abs);
  simdUnaryTest('f32x4.neg', OpCodes.f32x4_neg);
  simdUnaryTest('f32x4.sqrt', OpCodes.f32x4_sqrt);
  simdUnaryTest('f64x2.abs', OpCodes.f64x2_abs);
  simdUnaryTest('f64x2.neg', OpCodes.f64x2_neg);
  simdUnaryTest('f64x2.sqrt', OpCodes.f64x2_sqrt);
  simdUnaryTest('i8x16.abs', OpCodes.i8x16_abs);
  simdUnaryTest('i8x16.neg', OpCodes.i8x16_neg);
  simdUnaryTest('i32x4.abs', OpCodes.i32x4_abs);
  simdUnaryTest('i32x4.neg', OpCodes.i32x4_neg);
});

describe('Decompiler: SIMD i64x2', () => {
  function simdBinaryTest(name: string, op: any) {
    test(name, () => {
      expectDecompiles((mod) => {
        mod.defineMemory(1);
        mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
          a.get_local(a.getParameter(0));
          a.load_v128(4, 0);
          a.get_local(a.getParameter(0));
          a.load_v128(4, 16);
          a.emit(op);
          a.get_local(a.getParameter(0));
          a.store_v128(4, 32);
        });
      });
    });
  }

  simdBinaryTest('i64x2.add', OpCodes.i64x2_add);
  simdBinaryTest('i64x2.sub', OpCodes.i64x2_sub);
  simdBinaryTest('i64x2.mul', OpCodes.i64x2_mul);
  simdBinaryTest('i64x2.eq', OpCodes.i64x2_eq);
});

describe('Decompiler: SIMD Conversions', () => {
  function simdConvertTest(name: string, op: any) {
    test(name, () => {
      expectDecompiles((mod) => {
        mod.defineMemory(1);
        mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
          a.get_local(a.getParameter(0));
          a.get_local(a.getParameter(0));
          a.load_v128(4, 0);
          a.emit(op);
          a.store_v128(4, 16);
        });
      });
    });
  }

  simdConvertTest('i32x4.trunc_sat_f32x4_s', OpCodes.i32x4_trunc_sat_f32x4_s);
  simdConvertTest('f32x4.convert_i32x4_s', OpCodes.f32x4_convert_i32x4_s);
  simdConvertTest('i16x8.extend_low_i8x16_s', OpCodes.i16x8_extend_low_i8x16_s);
  simdConvertTest('i32x4.extend_low_i16x8_s', OpCodes.i32x4_extend_low_i16x8_s);
  simdConvertTest('f32x4.demote_f64x2_zero', OpCodes.f32x4_demote_f64x2_zero);
  simdConvertTest('f64x2.promote_low_f32x4', OpCodes.f64x2_promote_low_f32x4);
});

describe('Decompiler: SIMD Narrow/Dot/ExtMul', () => {
  function simdBinaryTest(name: string, op: any) {
    test(name, () => {
      expectDecompiles((mod) => {
        mod.defineMemory(1);
        mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
          a.get_local(a.getParameter(0));
          a.load_v128(4, 0);
          a.get_local(a.getParameter(0));
          a.load_v128(4, 16);
          a.emit(op);
          a.get_local(a.getParameter(0));
          a.store_v128(4, 32);
        });
      });
    });
  }

  simdBinaryTest('i8x16.narrow_i16x8_s', OpCodes.i8x16_narrow_i16x8_s);
  simdBinaryTest('i16x8.narrow_i32x4_s', OpCodes.i16x8_narrow_i32x4_s);
  simdBinaryTest('i32x4.dot_i16x8_s', OpCodes.i32x4_dot_i16x8_s);
  simdBinaryTest('i16x8.extmul_low_i8x16_s', OpCodes.i16x8_extmul_low_i8x16_s);
  simdBinaryTest('i32x4.extmul_low_i16x8_s', OpCodes.i32x4_extmul_low_i16x8_s);
});

describe('Decompiler: SIMD Extract/Replace Lane', () => {
  test('i32x4.extract_lane', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.load_v128(4, 0);
        a.emit(OpCodes.i32x4_extract_lane, 2);
      });
    });
  });

  test('i32x4.replace_lane', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(0));
        a.load_v128(4, 0);
        a.get_local(a.getParameter(1));
        a.emit(OpCodes.i32x4_replace_lane, 1);
        a.store_v128(4, 16);
      });
    });
  });
});

describe('Decompiler: SIMD Shuffle', () => {
  test('i8x16.shuffle', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(0));
        a.load_v128(4, 0);
        a.get_local(a.getParameter(0));
        a.load_v128(4, 16);
        a.emit(OpCodes.i8x16_shuffle, new Uint8Array([0,1,2,3, 16,17,18,19, 4,5,6,7, 20,21,22,23]));
        a.store_v128(4, 32);
      });
    });
  });
});

describe('Decompiler: SIMD Load Splat', () => {
  test('v128.load32_splat', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.v128_load32_splat, 2, 0);
        a.store_v128(4, 0);
      });
    });
  });
});

describe('Decompiler: Relaxed SIMD', () => {
  test('f32x4.relaxed_madd (ternary)', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(0));
        a.load_v128(4, 0);
        a.get_local(a.getParameter(0));
        a.load_v128(4, 16);
        a.get_local(a.getParameter(0));
        a.load_v128(4, 32);
        a.emit(OpCodes.f32x4_relaxed_madd);
        a.store_v128(4, 48);
      });
    });
  });

  test('i8x16.relaxed_laneselect (ternary)', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(0));
        a.load_v128(4, 0);
        a.get_local(a.getParameter(0));
        a.load_v128(4, 16);
        a.get_local(a.getParameter(0));
        a.load_v128(4, 32);
        a.emit(OpCodes.i8x16_relaxed_laneselect);
        a.store_v128(4, 48);
      });
    });
  });

  test('f32x4.relaxed_min', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.get_local(a.getParameter(0));
        a.load_v128(4, 0);
        a.get_local(a.getParameter(0));
        a.load_v128(4, 16);
        a.emit(OpCodes.f32x4_relaxed_min);
        a.store_v128(4, 32);
      });
    });
    expect(output).toContain('f32x4_relaxed_min');
  });
});
