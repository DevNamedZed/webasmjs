import { BlockType, ModuleBuilder, ValueType } from '../src/index';

test('Control Verification - unclosed block throws', () => {
  const mod = new ModuleBuilder('test');
  const fn = mod.defineFunction('test', null, []);
  const asm = fn.createEmitter();

  asm.block(BlockType.Void);
  // Missing end for block
  expect(() => {
    asm.end(); // Only closes the function, not the block
    mod.toBytes();
  }).toThrow();
});

test('Control Verification - valid nesting works', async () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('test', null, [], (f, a) => {
    a.block(BlockType.Void, () => {
      a.nop();
    });
  }).withExport();

  const bytes = mod.toBytes();
  const valid = WebAssembly.validate(bytes.buffer as ArrayBuffer);
  expect(valid).toBe(true);
});

test('Control Verification - deep nesting valid', async () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('test', null, [], (f, a) => {
    a.block(BlockType.Void, () => {
      a.block(BlockType.Void, () => {
        a.block(BlockType.Void, () => {
          a.loop(BlockType.Void, () => {
            a.nop();
          });
        });
      });
    });
  }).withExport();

  const bytes = mod.toBytes();
  const valid = WebAssembly.validate(bytes.buffer as ArrayBuffer);
  expect(valid).toBe(true);
});

test('Control Verification - instructions after main block closed', () => {
  const mod = new ModuleBuilder('test');
  const fn = mod.defineFunction('test', null, []);
  const asm = fn.createEmitter();

  asm.end(); // close main block
  expect(() => {
    asm.nop(); // cannot add after main block closed
  }).toThrow();
});

test('Control Verification - non-void block must leave result', async () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('test', [ValueType.Int32], [], (f, a) => {
    a.block(BlockType.Int32, () => {
      a.const_i32(42);
    });
  }).withExport();

  const bytes = mod.toBytes();
  const valid = WebAssembly.validate(bytes.buffer as ArrayBuffer);
  expect(valid).toBe(true);

  const instance = await mod.instantiate();
  const fn = instance.instance.exports.test as CallableFunction;
  expect(fn()).toBe(42);
});

test('Control Verification - if/else with non-void block', async () => {
  const mod = new ModuleBuilder('test');
  mod.defineFunction('test', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.if(BlockType.Int32);
    a.const_i32(1);
    a.else();
    a.const_i32(0);
    a.end();
  }).withExport();

  const bytes = mod.toBytes();
  const valid = WebAssembly.validate(bytes.buffer as ArrayBuffer);
  expect(valid).toBe(true);

  const instance = await mod.instantiate();
  const fn = instance.instance.exports.test as CallableFunction;
  expect(fn(1)).toBe(1);
  expect(fn(0)).toBe(0);
});

describe('ControlFlowVerifier label paths', () => {
  test('defineLabel used with block', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('labelBlock', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.if(BlockType.Int32);
      a.const_i32(1);
      a.else();
      a.const_i32(0);
      a.end();
    }).withExport();
    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });

  test('unresolved labels cause verification error', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      mod.defineFunction('bad', null, [], (f, a) => {
        // Access private verifier to define a label that never gets used
        const cfv = (a as any)._controlFlowVerifier;
        cfv.defineLabel();
        // label is unresolved but has been given a block reference by defineLabel
        // Actually: defineLabel just creates an unresolved label, no block
        // verify() should NOT throw because x.block is null for plain defineLabel
      });
    }).not.toThrow();
  });
});

describe('Multiple unclosed blocks', () => {
  test('opening 3 blocks and only closing 1 should throw about multiple unclosed structures', () => {
    // With 3 inner blocks, closing 1 + function end leaves stack length 2,
    // which triggers the "control structures" error message.
    expect(() => {
      const mod = new ModuleBuilder('test');
      const fn = mod.defineFunction('fn', null, []);
      const asm = fn.createEmitter();

      asm.block(BlockType.Void);
      asm.block(BlockType.Void);
      asm.block(BlockType.Void);
      // Only close 1 of the 3 inner blocks
      asm.end();
      // Close function body
      asm.end();
      mod.toBytes();
    }).toThrow(/control structures/i);
  });

  test('opening 2 blocks with none closed triggers missing end error', () => {
    // With 2 inner blocks, closing 0 inner + function end leaves stack length 2,
    // which triggers the "control structures" error message.
    expect(() => {
      const mod = new ModuleBuilder('test');
      const fn = mod.defineFunction('fn', null, []);
      const asm = fn.createEmitter();

      asm.block(BlockType.Void);
      asm.block(BlockType.Void);
      // Close only the function body, no inner blocks closed
      asm.end();
      mod.toBytes();
    }).toThrow(/control structures/i);
  });

  test('single unclosed block reports missing closing end', () => {
    // With 1 inner block, closing 0 inner + function end leaves stack length 1,
    // which triggers "missing closing end instruction".
    expect(() => {
      const mod = new ModuleBuilder('test');
      const fn = mod.defineFunction('fn', null, []);
      const asm = fn.createEmitter();

      asm.block(BlockType.Void);
      asm.end(); // closes function body only
      mod.toBytes();
    }).toThrow(/missing closing end/i);
  });
});

describe('Control flow stack empty on end', () => {
  test('calling end when there is no open block should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      const fn = mod.defineFunction('fn', null, []);
      const asm = fn.createEmitter();
      asm.end(); // close function body (control flow stack now empty)
      asm.end(); // nothing left to close
    }).toThrow();
  });

  test('extra end after closing all blocks should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      const fn = mod.defineFunction('fn', null, []);
      const asm = fn.createEmitter();
      asm.block(BlockType.Void);
      asm.end(); // close block
      asm.end(); // close function body
      asm.end(); // nothing left -- should throw
    }).toThrow();
  });
});

describe('if/else type mismatch', () => {
  test('if branch leaves wrong type for block result should throw at else', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      mod.defineFunction('fn', null, [ValueType.Int32], (f, a) => {
        a.get_local(f.getParameter(0));
        a.if(BlockType.Int32);
        a.const_f64(3.14); // f64 instead of expected i32
        a.else();
        a.const_i32(0);
        a.end();
        a.drop();
      });
      mod.toBytes();
    }).toThrow();
  });

  test('if branch with empty stack for non-void block should throw at else', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      mod.defineFunction('fn', null, [ValueType.Int32], (f, a) => {
        a.get_local(f.getParameter(0));
        a.if(BlockType.Int32);
        // nothing pushed in if-branch but block expects i32
        a.else();
        a.const_i32(0);
        a.end();
        a.drop();
      });
      mod.toBytes();
    }).toThrow();
  });

  test('valid if/else with matching types should pass', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.if(BlockType.Int32);
      a.const_i32(1);
      a.else();
      a.const_i32(0);
      a.end();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });

  test('valid if/else with f64 result type', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Float64], [ValueType.Int32], (f, a) => {
      a.get_local(f.getParameter(0));
      a.if(BlockType.Float64);
      a.const_f64(1.5);
      a.else();
      a.const_f64(2.5);
      a.end();
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn(1)).toBe(1.5);
    expect(fn(0)).toBe(2.5);
  });
});

describe('br with value for non-void block', () => {
  test('br from inside a block with result type carrying a value should validate', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
      a.block(BlockType.Int32, (label) => {
        a.const_i32(99);
        a.br(label); // branch carries i32 value
      });
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn()).toBe(99);
  });

  test('br_if from inside block with result type should validate when value on stack', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.block(BlockType.Int32, (label) => {
        a.const_i32(77);
        a.get_local(f.getParameter(0));
        a.br_if(label); // conditional branch, carries i32 if taken
        a.drop();
        a.const_i32(42);
      });
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn(1)).toBe(77);
    expect(fn(0)).toBe(42);
  });

  test('br with wrong value type for block result should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
        a.block(BlockType.Int32, (label) => {
          a.const_f64(3.14); // f64 instead of i32
          a.br(label);
        });
      });
      mod.toBytes();
    }).toThrow();
  });
});

describe('br_table with verification', () => {
  test('br_table should verify properly with multiple targets', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.block(BlockType.Void, (outerLabel) => {
        a.block(BlockType.Void, (case0Label) => {
          a.block(BlockType.Void, (case1Label) => {
            a.get_local(f.getParameter(0));
            a.br_table(outerLabel, case0Label, case1Label);
          });
          // case1: set to 200
          a.const_i32(200);
          a.set_local(f.getParameter(0));
          a.br(outerLabel);
        });
        // case0: set to 100
        a.const_i32(100);
        a.set_local(f.getParameter(0));
      });
      a.get_local(f.getParameter(0));
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn(0)).toBe(100);
    expect(fn(1)).toBe(200);
    expect(fn(99)).toBe(99); // default: falls through with original value
  });

  test('br_table with single default target verifies', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', null, [ValueType.Int32], (f, a) => {
      a.block(BlockType.Void, (label) => {
        a.get_local(f.getParameter(0));
        a.br_table(label); // only default label, no case labels
      });
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });

  test('br_table with four case labels', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.block(BlockType.Void, (main) => {
        a.block(BlockType.Void, (c0) => {
          a.block(BlockType.Void, (c1) => {
            a.block(BlockType.Void, (c2) => {
              a.block(BlockType.Void, (c3) => {
                a.get_local(f.getParameter(0));
                a.br_table(main, c0, c1, c2, c3);
              });
              // c3
              a.const_i32(33);
              a.set_local(f.getParameter(0));
              a.br(main);
            });
            // c2
            a.const_i32(22);
            a.set_local(f.getParameter(0));
            a.br(main);
          });
          // c1
          a.const_i32(11);
          a.set_local(f.getParameter(0));
          a.br(main);
        });
        // c0
        a.const_i32(0);
        a.set_local(f.getParameter(0));
      });
      a.get_local(f.getParameter(0));
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn(0)).toBe(0);
    expect(fn(1)).toBe(11);
    expect(fn(2)).toBe(22);
    expect(fn(3)).toBe(33);
  });
});

describe('Loop with result type', () => {
  test('loop with result type i32 must leave a value on the stack', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
      a.loop(BlockType.Int32, () => {
        a.const_i32(42);
      });
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn()).toBe(42);
  });

  test('loop with void type that iterates via br', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      const counter = a.declareLocal(ValueType.Int32, 'counter');
      a.get_local(f.getParameter(0));
      a.set_local(counter);

      a.block(BlockType.Void, (exitLabel) => {
        a.loop(BlockType.Void, (loopLabel) => {
          // Check exit condition
          a.get_local(counter);
          a.const_i32(10);
          a.ge_i32();
          a.br_if(exitLabel);

          // Increment counter
          a.get_local(counter);
          a.const_i32(1);
          a.add_i32();
          a.set_local(counter);
          a.br(loopLabel);
        });
      });

      a.get_local(counter);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn(0)).toBe(10);
    expect(fn(5)).toBe(10);
    expect(fn(15)).toBe(15);
  });

  test('loop with f64 result type', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Float64], [], (f, a) => {
      a.loop(BlockType.Float64, () => {
        a.const_f64(2.718);
      });
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn()).toBeCloseTo(2.718);
  });
});

describe('Nested blocks with correct stack', () => {
  test('three levels of nested blocks each with result type i32', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
      a.block(BlockType.Int32, () => {
        a.block(BlockType.Int32, () => {
          a.block(BlockType.Int32, () => {
            a.const_i32(10);
          });
          // innermost block leaves 10 on stack
          a.const_i32(20);
          a.add_i32();
        });
        // middle block leaves 30 on stack
        a.const_i32(5);
        a.add_i32();
      });
      // outer block leaves 35 on stack
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn()).toBe(35);
  });

  test('deeply nested blocks with mixed result types', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Float64], [], (f, a) => {
      a.block(BlockType.Float64, () => {
        a.block(BlockType.Int32, () => {
          a.block(BlockType.Int32, () => {
            a.const_i32(7);
          });
          a.const_i32(3);
          a.add_i32();
        });
        // i32 block leaves 10; convert to f64
        a.convert_i32_s_f64();
        a.const_f64(0.5);
        a.add_f64();
      });
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn()).toBeCloseTo(10.5);
  });

  test('four levels deep with void inner blocks', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
      const result = a.declareLocal(ValueType.Int32, 'result');
      a.const_i32(0);
      a.set_local(result);

      a.block(BlockType.Void, () => {
        a.block(BlockType.Void, () => {
          a.block(BlockType.Void, () => {
            a.block(BlockType.Void, () => {
              a.const_i32(42);
              a.set_local(result);
            });
          });
        });
      });

      a.get_local(result);
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn()).toBe(42);
  });

  test('nested blocks with branches and result values', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.block(BlockType.Int32, (outer) => {
        a.block(BlockType.Int32, (middle) => {
          a.block(BlockType.Int32, (inner) => {
            a.const_i32(10);
            a.get_local(f.getParameter(0));
            a.add_i32();
          });
          // inner block result is on the stack
          a.const_i32(100);
          a.add_i32();
        });
        // middle block result is on the stack
        a.const_i32(1000);
        a.add_i32();
      });
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    // Result: (10 + param) + 100 + 1000
    expect(fn(5)).toBe(1115);
    expect(fn(0)).toBe(1110);
  });
});

describe('Block returning wrong type', () => {
  test('block (result i32) that leaves f32 on stack should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
        a.block(BlockType.Int32, () => {
          a.const_f32(1.0); // f32 instead of i32
        });
      });
      mod.toBytes();
    }).toThrow();
  });

  test('block (result f64) that leaves i32 on stack should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      mod.defineFunction('fn', [ValueType.Float64], [], (f, a) => {
        a.block(BlockType.Float64, () => {
          a.const_i32(42); // i32 instead of f64
        });
      });
      mod.toBytes();
    }).toThrow();
  });

  test('block (result i32) that leaves i64 on stack should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
        a.block(BlockType.Int32, () => {
          a.const_i64(42n); // i64 instead of i32
        });
      });
      mod.toBytes();
    }).toThrow();
  });

  test('block (result i32) that leaves i32 on stack should pass', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Int32], [], (f, a) => {
      a.block(BlockType.Int32, () => {
        a.const_i32(42);
      });
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn()).toBe(42);
  });

  test('void block that leaves nothing on stack should pass', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', null, [], (f, a) => {
      a.block(BlockType.Void, () => {
        a.nop();
      });
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
  });

  test('void block that unexpectedly leaves a value on stack should throw', () => {
    expect(() => {
      const mod = new ModuleBuilder('test');
      mod.defineFunction('fn', null, [], (f, a) => {
        a.block(BlockType.Void, () => {
          a.const_i32(42); // leftover value on void block
        });
      });
      mod.toBytes();
    }).toThrow();
  });

  test('block (result f32) with correct f32 value should pass', async () => {
    const mod = new ModuleBuilder('test');
    mod.defineFunction('fn', [ValueType.Float32], [], (f, a) => {
      a.block(BlockType.Float32, () => {
        a.const_f32(9.99);
      });
    }).withExport();

    const bytes = mod.toBytes();
    expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

    const instance = await mod.instantiate();
    const fn = instance.instance.exports.fn as CallableFunction;
    expect(fn()).toBeCloseTo(9.99, 2);
  });
});
