import { expectDecompiles, ValueType, OpCodes, BlockType, ElementType } from './DecompilerTestHelper';

describe('Decompiler: If/Else', () => {
  test('simple if from block + br_if', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        const blk = a.block(BlockType.Void);
        a.get_local(a.getParameter(0));
        a.br_if(blk);
        a.const_i32(0);
        a.const_i32(1);
        a.store_i32(2, 0);
        a.end();
      });
    });
    expect(output).toContain('if');
  });

  test('if/else from WASM if opcode', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.if(BlockType.Void);
        a.const_i32(0);
        a.const_i32(1);
        a.store_i32(2, 0);
        a.else();
        a.const_i32(0);
        a.const_i32(2);
        a.store_i32(2, 0);
        a.end();
      });
    });
    expect(output).toContain('if');
    expect(output).toContain('else');
  });

  test('if with result type', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.if(ValueType.Int32);
        a.const_i32(1);
        a.else();
        a.const_i32(0);
        a.end();
      });
    });
    expect(output).toContain('return');
  });

  test('nested if/else', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.if(BlockType.Void);
        a.get_local(a.getParameter(1));
        a.if(BlockType.Void);
        a.const_i32(0);
        a.const_i32(1);
        a.store_i32(2, 0);
        a.end();
        a.else();
        a.const_i32(0);
        a.const_i32(2);
        a.store_i32(2, 0);
        a.end();
      });
    });
    expect(output).toContain('if');
  });

  test('multiple blocks with breaks produce nested ifs', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        const outer = a.block(BlockType.Void);
        const inner = a.block(BlockType.Void);
        a.get_local(a.getParameter(0));
        a.br_if(inner);
        a.const_i32(0);
        a.const_i32(1);
        a.store_i32(2, 0);
        a.br(outer);
        a.end();
        a.const_i32(0);
        a.const_i32(2);
        a.store_i32(2, 0);
        a.end();
      });
    });
    expect(output).toContain('if');
  });
});

describe('Decompiler: Loops', () => {
  test('loop with br_if produces while or do-while', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [], (f, a) => {
        const lp = a.loop(BlockType.Void);
        a.const_i32(0);
        a.load_i32(2, 0);
        a.br_if(lp);
        a.end();
      });
    });
    expect(output).toMatch(/while|do/);
  });

  test('loop with counter produces for or while', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        const counter = a.declareLocal(ValueType.Int32, 'i');
        a.const_i32(0);
        a.set_local(counter);
        const lp = a.loop(BlockType.Void);
        const exit = a.block(BlockType.Void);
        a.get_local(counter);
        a.get_local(a.getParameter(0));
        a.ge_i32();
        a.br_if(exit);
        a.get_local(counter);
        a.const_i32(2);
        a.shl_i32();
        a.get_local(counter);
        a.store_i32(2, 0);
        a.get_local(counter);
        a.const_i32(1);
        a.add_i32();
        a.set_local(counter);
        a.br(lp);
        a.end();
        a.end();
      });
    });
    expect(output).toMatch(/for|while/);
  });

  test('nested loops', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [], (f, a) => {
        const outer = a.loop(BlockType.Void);
        const inner = a.loop(BlockType.Void);
        a.const_i32(0);
        a.load_i32(2, 0);
        a.br_if(inner);
        a.end();
        a.const_i32(4);
        a.load_i32(2, 0);
        a.br_if(outer);
        a.end();
      });
    });
    expect(output).toMatch(/while|do/);
  });

  test('loop inside if', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.if(BlockType.Void);
        const lp = a.loop(BlockType.Void);
        a.const_i32(0);
        a.load_i32(2, 0);
        a.br_if(lp);
        a.end();
        a.end();
      });
    });
    expect(output).toContain('if');
    expect(output).toMatch(/while|do/);
  });
});

describe('Decompiler: Calls', () => {
  test('call emits function name', () => {
    const output = expectDecompiles((mod) => {
      const helper = mod.defineFunction('helper', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
      });
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.const_i32(42);
        a.call(helper);
      });
    });
    expect(output).toMatch(/helper|func_0/);
  });

  test('call with dropped result still present', () => {
    const output = expectDecompiles((mod) => {
      const helper = mod.defineFunction('helper', [ValueType.Int32], [], (f, a) => {
        a.const_i32(0);
      });
      mod.defineFunction('f', null, [], (f, a) => {
        a.call(helper);
        a.drop();
      });
    });
    expect(output).toMatch(/helper|func_0/);
  });

  test('call result not duplicated', () => {
    const output = expectDecompiles((mod) => {
      const helper = mod.defineFunction('helper', [ValueType.Int32], [], (f, a) => {
        a.const_i32(0);
      });
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.call(helper);
        a.const_i32(2);
        a.add_i32();
      });
    });
    const count = (output.match(/func_0|helper/g) || []).length;
    expect(count).toBe(1);
  });
});

describe('Decompiler: Select and Drop', () => {
  test('select produces ternary', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.const_i32(1);
        a.const_i32(0);
        a.get_local(a.getParameter(0));
        a.select();
      });
    });
    expect(output).toContain('?');
  });

  test('drop removes value from output', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', null, [], (f, a) => {
        a.const_i32(42);
        a.drop();
      });
    });
    expect(output).not.toContain('42');
  });

  test('nop produces no output', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', null, [], (f, a) => {
        a.nop();
      });
    });
    expect(output).not.toContain('nop');
  });

  test('unreachable', () => {
    const output = expectDecompiles((mod) => {
      mod.defineFunction('f', null, [], (f, a) => {
        a.unreachable();
      });
    });
    expect(output).toContain('unreachable');
  });
});

describe('Decompiler: Call Indirect', () => {
  test('call_indirect emits table dispatch', () => {
    const output = expectDecompiles((mod) => {
      const table = mod.defineTable(ElementType.FuncRef, 10);
      const calleeType = mod.defineFunctionType([ValueType.Int32], [ValueType.Int32]);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.const_i32(42);
        a.get_local(a.getParameter(0));
        a.call_indirect(calleeType);
      });
    });
    expect(output).toContain('table[');
  });
});

describe('Decompiler: Switch (br_table)', () => {
  test('br_table produces switch with cases', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        const result = a.declareLocal(ValueType.Int32, 'result');
        const main = a.block(BlockType.Void);
        const case0 = a.block(BlockType.Void);
        const case1 = a.block(BlockType.Void);
        const caseDefault = a.block(BlockType.Void);
        a.get_local(a.getParameter(0));
        a.br_table(caseDefault, case0, case1);
        a.end(); // caseDefault
        a.const_i32(0);
        a.set_local(result);
        a.br(main);
        a.end(); // case1
        a.const_i32(1);
        a.set_local(result);
        a.br(main);
        a.end(); // case0
        a.const_i32(2);
        a.set_local(result);
        a.end(); // main
      });
    });
    expect(output).toContain('switch');
    expect(output).toContain('case');
  });

  test('switch inside loop dispatches cases', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      const readByte = mod.importFunction('env', 'readByte', [ValueType.Int32], []);
      mod.defineFunction('f', null, [], (f, a) => {
        const lp = a.loop(BlockType.Void);
        a.call(readByte);
        const blockDefault = a.block(BlockType.Void);
        const block1 = a.block(BlockType.Void);
        const block0 = a.block(BlockType.Void);
        a.br_table(blockDefault, block0, block1);
        a.end(); // block0
        a.const_i32(0);
        a.const_i32(100);
        a.store_i32(2, 0);
        a.br(lp);
        a.end(); // block1
        a.const_i32(0);
        a.const_i32(200);
        a.store_i32(2, 4);
        a.br(lp);
        a.end(); // blockDefault
        a.return();
        a.end(); // loop
      });
    });
    expect(output).toContain('while');
    expect(output).toContain('switch');
    expect(output).toContain('case');
    expect(output).toContain('100');
    expect(output).toContain('200');
    expect(output).not.toContain('unvisited');
  });
});

describe('Decompiler: Do-While Loop', () => {
  test('loop with br_if at end produces do-while', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [], (f, a) => {
        const counter = a.declareLocal(ValueType.Int32, 'counter');
        a.const_i32(0);
        a.set_local(counter);
        const lp = a.loop(BlockType.Void);
        a.get_local(counter);
        a.const_i32(1);
        a.add_i32();
        a.set_local(counter);
        a.const_i32(0);
        a.get_local(counter);
        a.store_i32(2, 0);
        a.get_local(counter);
        a.const_i32(10);
        a.lt_i32();
        a.br_if(lp);
        a.end();
      });
    });
    expect(output).toMatch(/do|while/);
  });
});

describe('Decompiler: Infinite Loop', () => {
  test('loop with always-true condition produces while true', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [], (f, a) => {
        const lp = a.loop(BlockType.Void);
        a.const_i32(0);
        a.load_i32(2, 0);
        a.drop();
        a.const_i32(1);
        a.br_if(lp);
        a.end();
      });
    });
    expect(output).toContain('while');
  });
});

describe('Decompiler: Labeled Break', () => {
  test('inner br targeting outer block produces labeled break or structured equivalent', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
        const outer = a.block(BlockType.Void);
        const inner = a.block(BlockType.Void);
        a.get_local(a.getParameter(0));
        a.br_if(inner);
        a.get_local(a.getParameter(1));
        a.br_if(outer);
        a.const_i32(0);
        a.const_i32(1);
        a.store_i32(2, 0);
        a.end(); // inner block
        a.const_i32(0);
        a.const_i32(2);
        a.store_i32(2, 0);
        a.end(); // outer block
        a.const_i32(0);
        a.const_i32(3);
        a.store_i32(2, 0);
      });
    });
    expect(output).toMatch(/break|if|label/i);
  });
});

describe('Decompiler: Else-If Chain', () => {
  test('nested if/else/if merges into else if', () => {
    const output = expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.const_i32(1);
        a.eq_i32();
        a.if(BlockType.Void);
        a.const_i32(0);
        a.const_i32(10);
        a.store_i32(2, 0);
        a.else();
        a.get_local(a.getParameter(0));
        a.const_i32(2);
        a.eq_i32();
        a.if(BlockType.Void);
        a.const_i32(0);
        a.const_i32(20);
        a.store_i32(2, 0);
        a.else();
        a.const_i32(0);
        a.const_i32(30);
        a.store_i32(2, 0);
        a.end();
        a.end();
      });
    });
    expect(output).toContain('else if');
  });
});
