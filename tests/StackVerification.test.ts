import { ValueType, ModuleBuilder, ElementType, BlockType } from '../src/index';
import VerificationTest from './VerificationTest';

test('Stack Verification - end with empty stack', async () => {
  await VerificationTest.assertVerification(
    [ValueType.Int32],
    [ValueType.Int32],
    (asm) => {
      asm.const_i32(0);
      asm.drop();
      asm.end();
    }
  );
});

test('Stack Verification - type mismatch', async () => {
  await VerificationTest.assertVerification(
    [ValueType.Int32],
    [],
    (asm) => {
      asm.const_f32(1.0);
      asm.end();
    }
  );
});

test('Stack Verification - wrong return type f64 instead of i32', async () => {
  await VerificationTest.assertVerification(
    [ValueType.Int32],
    [],
    (asm) => {
      asm.const_f64(1.0);
      asm.end();
    }
  );
});

test('Stack Verification - leftover value on void function', async () => {
  await VerificationTest.assertVerification(
    [],
    [],
    (asm) => {
      asm.const_i32(42);
      asm.end();
    }
  );
});

test('Stack Verification - too few values on stack', async () => {
  await VerificationTest.assertVerification(
    [ValueType.Int32],
    [],
    (asm) => {
      // No values pushed, but function expects i32 return
      asm.end();
    }
  );
});

test('Stack Verification - binary op with wrong type', async () => {
  await VerificationTest.assertVerification(
    [ValueType.Int32],
    [],
    (asm) => {
      asm.const_i32(1);
      asm.const_f32(2.0); // wrong type for i32.add
      asm.add_i32();
      asm.end();
    }
  );
});

describe('call_indirect type mismatch', () => {
  test('passing wrong argument types to call_indirect should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      // Define a function that takes i32 and returns i32
      const target = mod.defineFunction('target', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(f.getParameter(0));
      });

      const table = mod.defineTable(ElementType.AnyFunc, 1, 1);
      table.defineTableSegment([target], 0);

      // Define func type expecting i32 param
      const funcType = mod.defineFuncType([ValueType.Int32], [ValueType.Int32]);

      // Call with f64 on stack instead of i32
      mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
        a.const_f64(3.14); // wrong type: should be i32
        a.const_i32(0);    // table index
        a.call_indirect(funcType);
      });

      mod.toBytes();
    }).toThrow();
  });

  test('valid call_indirect with correct argument types', async () => {
    const mod = new ModuleBuilder('test');
    const target = mod.defineFunction('target', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.const_i32(100);
      a.add_i32();
    });

    const table = mod.defineTable(ElementType.AnyFunc, 1, 1);
    table.defineTableSegment([target], 0);

    const funcType = mod.defineFuncType([ValueType.Int32], [ValueType.Int32]);

    mod.defineFunction('fn', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0)); // i32 param
      a.const_i32(0);                 // table index
      a.call_indirect(funcType);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn(5)).toBe(105);
  });

  test('call_indirect with multiple params - wrong type on one param', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      const target = mod.defineFunction('target', [ValueType.Int32],
        [ValueType.Int32, ValueType.Float64], (f, a) => {
        a.get_local(f.getParameter(0));
      });

      const table = mod.defineTable(ElementType.AnyFunc, 1, 1);
      table.defineTableSegment([target], 0);

      const funcType = mod.defineFuncType([ValueType.Int32], [ValueType.Int32, ValueType.Float64]);

      // Push i32 then i32 -- but second param should be f64
      mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
        a.const_i32(1);     // param 0: i32 (correct)
        a.const_i32(2);     // param 1: i32 (wrong, should be f64)
        a.const_i32(0);     // table index
        a.call_indirect(funcType);
      });

      mod.toBytes();
    }).toThrow();
  });
});

describe('select type mismatch', () => {
  test('select pops Any, Any, Int32 - using wrong condition type should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
        a.const_i32(1);
        a.const_i32(2);
        a.const_f32(1.0); // condition must be i32, not f32
        a.select();
      });
      mod.toBytes();
    }).toThrow();
  });

  test('valid select with matching value types', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.const_i32(100);
      a.const_i32(200);
      a.get_local(f.getParameter(0));
      a.select();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn(1)).toBe(100);
    expect(fn(0)).toBe(200);
  });

  test('select with f64 values and i32 condition should validate', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Float64], [ValueType.Int32], (f, a) => {
      a.const_f64(1.5);
      a.const_f64(2.5);
      a.get_local(f.getParameter(0));
      a.select();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn(1)).toBe(1.5);
    expect(fn(0)).toBe(2.5);
  });

  test('select with i64 values and i32 condition should validate', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int64], [ValueType.Int32], (f, a) => {
      a.const_i64(100n);
      a.const_i64(200n);
      a.get_local(f.getParameter(0));
      a.select();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn(1)).toBe(100n);
    expect(fn(0)).toBe(200n);
  });
});

describe('Multiple return values not supported (mvp)', () => {
  test('defining a function that returns 2 values should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test', { target: 'mvp' });
      mod.defineFunction('fn', [ValueType.Int32, ValueType.Int32], [], (f, a) => {
        a.const_i32(1);
        a.const_i32(2);
      });
    }).toThrow(/zero to one/i);
  });

  test('defineFuncType with 2 return values should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test', { target: 'mvp' });
      mod.defineFuncType([ValueType.Int32, ValueType.Float32], []);
    }).toThrow(/zero to one/i);
  });

  test('defineFuncType with 3 return values should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test', { target: 'mvp' });
      mod.defineFuncType([ValueType.Int32, ValueType.Float32, ValueType.Float64], []);
    }).toThrow(/zero to one/i);
  });

  test('defining a function with exactly 1 return value is valid', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
        a.const_i32(42);
      });
      mod.toBytes();
    }).not.toThrow();
  });

  test('defining a function with 0 return values is valid', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      mod.defineFunction('fn', null, [], (f, a) => {
        a.nop();
      });
      mod.toBytes();
    }).not.toThrow();
  });
});

describe('get_global type checking', () => {
  test('using an f64 global where i32 is expected should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      const g = mod.defineGlobal(ValueType.Float64, false, 3.14);
      mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
        a.get_global(g);    // pushes f64
        a.const_i32(1);     // pushes i32
        a.add_i32();        // expects two i32 values - should throw
      });
      mod.toBytes();
    }).toThrow();
  });

  test('using an i32 global where i32 is expected should pass', async () => {
    const mod = new ModuleBuilder('test');
    const g = mod.defineGlobal(ValueType.Int32, false, 10);
    mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
      a.get_global(g);    // pushes i32
      a.const_i32(5);     // pushes i32
      a.add_i32();        // expects two i32 values
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn()).toBe(15);
  });

  test('using an i64 global in an i32 operation should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      const g = mod.defineGlobal(ValueType.Int64, false, 100);
      mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
        a.get_global(g);    // pushes i64
        a.const_i32(1);     // pushes i32
        a.add_i32();        // expects two i32 values - should throw
      });
      mod.toBytes();
    }).toThrow();
  });

  test('get_global followed by correct-type operation should pass', async () => {
    const mod = new ModuleBuilder('test');
    const g = mod.defineGlobal(ValueType.Float64, false, 2.5);
    mod.defineFunction('fn', [ValueType.Float64], [], (f, a) => {
      a.get_global(g);     // pushes f64
      a.const_f64(1.5);    // pushes f64
      a.add_f64();         // expects two f64 values
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn()).toBeCloseTo(4.0);
  });

  test('imported global with wrong type in operation should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      const g = mod.importGlobal('env', 'myGlobal', ValueType.Float32, false);
      mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
        a.get_global(g);    // pushes f32
        a.const_i32(1);     // pushes i32
        a.add_i32();        // expects two i32 values - should throw
      });
      mod.toBytes();
    }).toThrow();
  });
});

describe('Instructions after unreachable', () => {
  test('dead code after return should compile fine', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
      a.const_i32(42);
      a.return();
      // Dead code after return -- should not cause verification error
      a.const_i32(99);
      a.const_i32(100);
      a.add_i32();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn()).toBe(42);
  });

  test('unreachable opcode followed by nop in a void block should compile', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', null, [], (f, a) => {
      a.block(BlockType.Void, () => {
        a.unreachable();
        // After unreachable, the wasm stack is polymorphic
        a.nop();
      });
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });

  test('return in void function should compile', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', null, [], (f, a) => {
      a.return();
      a.nop(); // dead code
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });

  test('return with correct value in non-void function should compile', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.const_i32(10);
      a.gt_i32();
      a.if(BlockType.Void, () => {
        a.const_i32(999);
        a.return();
      });
      a.get_local(f.getParameter(0));
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn(5)).toBe(5);
    expect(fn(20)).toBe(999);
  });
});

describe('tee_local type', () => {
  test('tee_local should preserve value on stack with correct type', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
      const local = a.declareLocal(ValueType.Int32, 'x');
      a.const_i32(42);
      a.tee_local(local);
      // tee_local leaves the value on the stack; the stack now has i32
      // We can use it directly for the return value
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn()).toBe(42);
  });

  test('tee_local with f64 preserves f64 on stack', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Float64], [], (f, a) => {
      const local = a.declareLocal(ValueType.Float64, 'x');
      a.const_f64(3.14);
      a.tee_local(local);
      // f64 should still be on the stack
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn()).toBeCloseTo(3.14);
  });

  test('tee_local followed by operation using that type should work', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
      const local = a.declareLocal(ValueType.Int32, 'x');
      a.const_i32(21);
      a.tee_local(local);
      // i32 remains on stack after tee_local
      a.get_local(local); // also i32
      a.add_i32();        // i32 + i32 = i32
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn()).toBe(42);
  });

  test('tee_local preserves correct type through further operations', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      const temp = a.declareLocal(ValueType.Int32, 'temp');
      a.get_local(f.getParameter(0));
      a.tee_local(temp);
      // After tee_local, value is on stack AND in temp
      a.get_local(temp);
      a.mul_i32(); // param * param
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn(5)).toBe(25);
    expect(fn(7)).toBe(49);
  });

  test('tee_local with i64 type', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int64], [], (f, a) => {
      const local = a.declareLocal(ValueType.Int64, 'x');
      a.const_i64(12345n);
      a.tee_local(local);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn()).toBe(12345n);
  });
});

describe('Function return type mismatch', () => {
  test('function returning f32 instead of i32 should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
        a.const_f32(3.14); // f32 instead of expected i32
      });
      mod.toBytes();
    }).toThrow();
  });

  test('void function with leftover value on stack should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      mod.defineFunction('fn', null, [], (f, a) => {
        a.const_i32(42); // leftover value
      });
      mod.toBytes();
    }).toThrow();
  });

  test('function expecting return value but stack is empty should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
        // nothing pushed
        a.nop();
      });
      mod.toBytes();
    }).toThrow();
  });
});
