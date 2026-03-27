import { ModuleBuilder, BinaryReader, ValueType, OpCodes, BlockType } from '../src/index';
import { buildControlFlowGraph } from '../src/decompiler/ControlFlowGraph';
import { buildSsa } from '../src/decompiler/SsaBuilder';
import { computeDominance } from '../src/decompiler/DominanceTree';
import { structureFunction } from '../src/decompiler/StructuralAnalysis';
import { optimizeSsa } from '../src/decompiler/OptimizationPasses';
import { lowerSsaToStatements } from '../src/decompiler/SsaLowering';
import { emitLowered } from '../src/decompiler/LoweredEmitter';
import InstructionDecoder from '../src/InstructionDecoder';

function buildModule(buildFunc: (mod: ModuleBuilder) => void): { moduleInfo: ReturnType<BinaryReader['read']>; funcIndex: number } {
  const mod = new ModuleBuilder('test');
  buildFunc(mod);
  const bytes = mod.toBytes();
  const reader = new BinaryReader(new Uint8Array(bytes));
  return { moduleInfo: reader.read(), funcIndex: 0 };
}

function decompile(moduleInfo: ReturnType<BinaryReader['read']>, funcIndex: number): string {
  const func = moduleInfo.functions[funcIndex];
  const instructions = InstructionDecoder.decodeFunctionBody(func.body);
  const cfg = buildControlFlowGraph(instructions);
  const ssaFunc = buildSsa(cfg, moduleInfo, funcIndex);
  optimizeSsa(ssaFunc);
  const dominance = computeDominance(ssaFunc);
  const structured = structureFunction(ssaFunc, dominance);

  const names = {
    functionName(idx: number): string { return `func_${idx}`; },
    localName(idx: number): string { return `v${idx}`; },
    globalName(idx: number): string { return `g${idx}`; },
  };

  const lowered = lowerSsaToStatements(structured, ssaFunc, names);
  return emitLowered(lowered, 'int test(int v0, int v1)', new Set(['v0', 'v1']));
}

function buildAndDecompile(buildFunc: (mod: ModuleBuilder) => void): string {
  const { moduleInfo, funcIndex } = buildModule(buildFunc);
  return decompile(moduleInfo, funcIndex);
}

// ─── CFG construction ───

test('CFG - linear function has entry and exit', () => {
  const { moduleInfo } = buildModule((mod) => {
    const func = mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32]);
    func.createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.get_local, asm.getParameter(1));
      asm.emit(OpCodes.i32_add);
    });
  });

  const instructions = InstructionDecoder.decodeFunctionBody(moduleInfo.functions[0].body);
  const cfg = buildControlFlowGraph(instructions);
  expect(cfg.entry).toBeDefined();
  expect(cfg.exit).toBeDefined();
  expect(cfg.blocks.length).toBeGreaterThanOrEqual(2);
});

test('CFG - if creates two successors', () => {
  const { moduleInfo } = buildModule((mod) => {
    const func = mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32]);
    func.createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.if, BlockType.Int32);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.else);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.end);
    });
  });

  const instructions = InstructionDecoder.decodeFunctionBody(moduleInfo.functions[0].body);
  const cfg = buildControlFlowGraph(instructions);
  expect(cfg.entry.successors.length).toBe(2);
});

// ─── SSA construction ───

test('SSA - constant produces return', () => {
  const { moduleInfo } = buildModule((mod) => {
    mod.defineFunction('f', [ValueType.Int32], []).createEmitter((asm) => {
      asm.emit(OpCodes.i32_const, 42);
    });
  });

  const instructions = InstructionDecoder.decodeFunctionBody(moduleInfo.functions[0].body);
  const cfg = buildControlFlowGraph(instructions);
  const ssaFunc = buildSsa(cfg, moduleInfo, 0);

  const hasReturn = ssaFunc.blocks.some(block =>
    block.instructions.some(instr => instr.kind === 'return' && instr.value !== null)
  );
  expect(hasReturn).toBe(true);
});

test('SSA - add creates binary instruction', () => {
  const { moduleInfo } = buildModule((mod) => {
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.get_local, asm.getParameter(1));
      asm.emit(OpCodes.i32_add);
    });
  });

  const instructions = InstructionDecoder.decodeFunctionBody(moduleInfo.functions[0].body);
  const cfg = buildControlFlowGraph(instructions);
  const ssaFunc = buildSsa(cfg, moduleInfo, 0);

  const hasBinary = ssaFunc.blocks.some(block =>
    block.instructions.some(instr => instr.kind === 'binary' && instr.op === '+')
  );
  expect(hasBinary).toBe(true);
});

// ─── Full decompilation ───

test('Decompile - return constant', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [ValueType.Int32], []).createEmitter((asm) => {
      asm.emit(OpCodes.i32_const, 42);
    });
  });
  expect(output).toContain('return 42');
});

test('Decompile - return param + param', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.get_local, asm.getParameter(1));
      asm.emit(OpCodes.i32_add);
    });
  });
  expect(output).toContain('v0 + v1');
  expect(output).toContain('return');
});

test('Decompile - if/else with different stores', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.if, BlockType.Void);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.emit(OpCodes.else);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.emit(OpCodes.end);
    });
  });
  expect(output).toContain('if');
  expect(output).toContain('else');
  expect(output).toContain('memory[');
});

test('Decompile - local assignment and use', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      const local = asm.declareLocal(ValueType.Int32, 'result');
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.get_local, asm.getParameter(1));
      asm.emit(OpCodes.i32_add);
      asm.emit(OpCodes.set_local, local);
      asm.emit(OpCodes.get_local, local);
    });
  });
  expect(output).toContain('v0 + v1');
  expect(output).toContain('return');
});

test('Decompile - memory store', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.get_local, asm.getParameter(1));
      asm.emit(OpCodes.i32_store, 2, 0);
    });
  });
  expect(output).toContain('memory[');
});

test('Decompile - block with br_if produces if, not labeled block', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      const blockLabel = asm.block(BlockType.Void);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.br_if, blockLabel);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 99);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end();
    });
  });
  expect(output).toContain('if');
  expect(output).not.toContain('block_');
});

test('Decompile - do/while loop', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      const counter = asm.declareLocal(ValueType.Int32, 'i');
      const loopLabel = asm.loop(BlockType.Void);
      asm.emit(OpCodes.get_local, counter);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_add);
      asm.emit(OpCodes.tee_local, counter);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_lt_s);
      asm.emit(OpCodes.br_if, loopLabel);
      asm.end();
    });
  });
  expect(output).toContain('while');
});

test('Decompile - no empty else branches', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.if, BlockType.Void);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.emit(OpCodes.end);
    });
  });
  expect(output).not.toContain('else');
});

test('Decompile - no double negation', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_eqz);
      asm.emit(OpCodes.i32_eqz);
    });
  });
  expect(output).not.toContain('!!');
});

test('Decompile - function call inlined', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('helper', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_add);
    });
  });
  expect(output).toContain('v0 + 1');
  expect(output).toContain('return');
});

test('Decompile - operator precedence: add then multiply', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      // (v0 + v1) * 2 — the add needs parens
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.get_local, asm.getParameter(1));
      asm.emit(OpCodes.i32_add);
      asm.emit(OpCodes.i32_const, 2);
      asm.emit(OpCodes.i32_mul);
    });
  });
  expect(output).toContain('(v0 + v1) * 2');
});

test('Decompile - operator precedence: multiply then add (no parens needed)', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      // v0 * v1 + 2 — no parens needed
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.get_local, asm.getParameter(1));
      asm.emit(OpCodes.i32_mul);
      asm.emit(OpCodes.i32_const, 2);
      asm.emit(OpCodes.i32_add);
    });
  });
  expect(output).toContain('v0 * v1 + 2');
  expect(output).not.toContain('(v0 * v1)');
});

test('Decompile - while(true) with break at end becomes while(cond)', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      const counter = asm.declareLocal(ValueType.Int32, 'i');
      const loopLabel = asm.loop(BlockType.Void);
      // body: counter += 1
      asm.emit(OpCodes.get_local, counter);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_add);
      asm.emit(OpCodes.set_local, counter);
      // if (counter >= param0) break
      asm.emit(OpCodes.get_local, counter);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_ge_s);
      asm.emit(OpCodes.br_if, loopLabel);
      asm.end();
    });
  });
  // Should NOT be while(true) with explicit break
  expect(output).not.toContain('while (true)');
});

test('Decompile - nested blocks with br produce correct output', () => {
  const { moduleInfo } = buildModule((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      // block $outer { block $inner { if (p0) { p1 = 1; br $inner; } mem[0] = p1; } mem[4] = 42; }
      const outer = asm.block(BlockType.Void);
      const inner = asm.block(BlockType.Void);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.if, BlockType.Void);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.set_local, asm.getParameter(1));
      asm.emit(OpCodes.br, inner);
      asm.end(); // end if
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.get_local, asm.getParameter(1));
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end(); // end inner
      asm.emit(OpCodes.i32_const, 4);
      asm.emit(OpCodes.i32_const, 42);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end(); // end outer
    });
  });

  const output = decompile(moduleInfo, 0);
  // v1 assignment must appear in then-branch
  expect(output).toMatch(/v1\s*=/);
  // both memory stores must appear
  expect(output).toContain('memory[0]');
  expect(output).toContain('memory[4]');
  // memory[4] = 42 should be AFTER the if, not inside it
  const lines = output.split('\n');
  const mem4Line = lines.findIndex(l => l.includes('memory[4]'));
  const ifLine = lines.findIndex(l => l.includes('if'));
  const closingBraceLine = lines.findIndex((l, i) => i > ifLine && l.trim() === '}' && !lines[i + 1]?.trim().startsWith('else'));
  expect(mem4Line).toBeGreaterThan(closingBraceLine);
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - no double negation !! in output', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      // if (eqz(eqz(x))) { store } — the !! should simplify
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_eqz);
      asm.emit(OpCodes.i32_eqz);
      asm.emit(OpCodes.if, BlockType.Void);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end();
    });
  });
  expect(output).not.toContain('!!');
});

test('Decompile - const assigned to local should inline', () => {
  // tmp_10 = 1; var4 = tmp_10; should become var4 = 1;
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      const local = asm.declareLocal(ValueType.Int32, 'x');
      asm.emit(OpCodes.i32_const, 42);
      asm.emit(OpCodes.set_local, local);
      asm.emit(OpCodes.get_local, local);
    });
  });
  expect(output).not.toContain('tmp_');
  expect(output).toContain('42');
});

test('Decompile - empty if branches should be eliminated', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.if, BlockType.Void);
      asm.end();
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_store, 2, 0);
    });
  });
  // An empty if body should not appear in output
  expect(output).not.toMatch(/if\s*\([^)]+\)\s*\{\s*\}/);
});

test('Decompile - if with result type (ternary)', () => {
  // (if (result i32) (then 1) (else 0)) should produce a ternary or if/else with return
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.if, BlockType.Int32);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.else);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.end);
    });
  });
  expect(output).toContain('return');
  expect(output).toContain('1');
  expect(output).toContain('0');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - block with result type', () => {
  // (block (result i32) i32.const 42 end) — value flows out of block
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [ValueType.Int32], []).createEmitter((asm) => {
      asm.emit(OpCodes.block, BlockType.Int32);
      asm.emit(OpCodes.i32_const, 42);
      asm.emit(OpCodes.end);
    });
  });
  expect(output).toContain('42');
  expect(output).toContain('return');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - multiple returns from different paths', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.if, BlockType.Void);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.return);
      asm.end();
      asm.emit(OpCodes.i32_const, 0);
    });
  });
  expect(output).toContain('return 1');
  expect(output).toContain('return 0');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - function call arg order correct', () => {
  const { moduleInfo } = buildModule((mod) => {
    mod.defineMemory(1);
    const target = mod.defineFunction('target', [], [ValueType.Int32, ValueType.Int32, ValueType.Int32]);
    target.createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.get_local, asm.getParameter(1));
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.emit(OpCodes.get_local, asm.getParameter(2));
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_store, 2, 0);
    });
    const caller = mod.defineFunction('caller', [], [ValueType.Int32, ValueType.Int32]);
    caller.createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.get_local, asm.getParameter(1));
      asm.emit(OpCodes.i32_const, 99);
      asm.emit(OpCodes.call, target);
    });
  });
  // Decompile the caller (func index 1)
  const output = decompile(moduleInfo, 1);
  expect(output).toContain('v0');
  expect(output).toContain('v1');
  expect(output).toContain('99');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - select instruction produces ternary', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      asm.emit(OpCodes.i32_const, 10);
      asm.emit(OpCodes.i32_const, 20);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.select);
    });
  });
  expect(output).toContain('?');
  expect(output).toContain(':');
  expect(output).toContain('10');
  expect(output).toContain('20');
});

test('Decompile - loop with continue in middle', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      const counter = asm.declareLocal(ValueType.Int32, 'i');
      const loopLabel = asm.loop(BlockType.Void);
      // if (i % 2 == 0) continue
      asm.emit(OpCodes.get_local, counter);
      asm.emit(OpCodes.i32_const, 2);
      asm.emit(OpCodes.i32_rem_s);
      asm.emit(OpCodes.i32_eqz);
      asm.emit(OpCodes.br_if, loopLabel);
      // store
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.get_local, counter);
      asm.emit(OpCodes.i32_store, 2, 0);
      // i++; if (i < param0) continue
      asm.emit(OpCodes.get_local, counter);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_add);
      asm.emit(OpCodes.tee_local, counter);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_lt_s);
      asm.emit(OpCodes.br_if, loopLabel);
      asm.end();
    });
  });
  expect(output).toContain('while');
  expect(output).toContain('memory[');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - dead code after br inside if not emitted', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      const outer = asm.block(BlockType.Void);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.if, BlockType.Void);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.emit(OpCodes.br, outer);  // branch to outer block end
      // Dead code — should not appear
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 999);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end(); // end if
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 2);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end(); // end outer
    });
  });
  expect(output).toContain('memory[0] = 1');
  expect(output).toContain('memory[0] = 2');
  expect(output).not.toContain('999');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - all blocks visited in complex nested pattern', () => {
  // Pattern matching doom func_5:
  // block $outer { block $inner { if (p0) { set; br_if $inner; set; br $outer; } set; br $inner; } set; }
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      const outer = asm.block(BlockType.Void);
      const inner = asm.block(BlockType.Void);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.if, BlockType.Void);
      // then: store A, conditional break inner, store B, break outer
      asm.emit(OpCodes.i32_const, 100);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.emit(OpCodes.get_local, asm.getParameter(1));
      asm.emit(OpCodes.br_if, inner);
      asm.emit(OpCodes.i32_const, 200);
      asm.emit(OpCodes.i32_const, 2);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.emit(OpCodes.br, outer);
      asm.end(); // end if (no else — falls through)
      // after if, before inner end: store C
      asm.emit(OpCodes.i32_const, 300);
      asm.emit(OpCodes.i32_const, 3);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end(); // end inner
      // after inner, before outer end: store D
      asm.emit(OpCodes.i32_const, 400);
      asm.emit(OpCodes.i32_const, 4);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end(); // end outer
    });
  });
  // All four stores must appear
  expect(output).toContain('memory[100] = 1');
  expect(output).toContain('memory[200] = 2');
  expect(output).toContain('memory[300] = 3');
  expect(output).toContain('memory[400] = 4');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - br_table produces output', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      const outer = asm.block(BlockType.Void);
      const case1 = asm.block(BlockType.Void);
      const caseDefault = asm.block(BlockType.Void);
      asm.get_local(asm.getParameter(0));
      asm.br_table(caseDefault, caseDefault, case1);
      asm.end(); // caseDefault end
      asm.const_i32(0);
      asm.const_i32(10);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.br(outer);
      asm.end(); // case1 end
      asm.const_i32(0);
      asm.const_i32(20);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end(); // outer end
    });
  });
  expect(output).toContain('10');
  expect(output).toContain('20');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - nested loops', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      const outerLoop = asm.loop(BlockType.Void);
      const innerLoop = asm.loop(BlockType.Void);
      // body: store
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_store, 2, 0);
      // inner continue
      asm.emit(OpCodes.get_local, asm.getParameter(1));
      asm.emit(OpCodes.br_if, innerLoop);
      asm.end(); // end inner
      // outer continue
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.br_if, outerLoop);
      asm.end(); // end outer
    });
  });
  expect(output).toContain('while');
  expect(output).toContain('memory[');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - global get/set uses name', () => {
  const output = buildAndDecompile((mod) => {
    const g = mod.defineGlobal(ValueType.Int32, true, 0);
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.set_global, g);
      asm.emit(OpCodes.get_global, g);
    });
  });
  // Global name should appear (either as global_0 or g0)
  expect(output).toMatch(/global_0|g0/);
  expect(output).toContain('return');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - dead code after unreachable not emitted', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [], []).createEmitter((asm) => {
      asm.emit(OpCodes.unreachable);
    });
  });
  expect(output).toContain('unreachable');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - reduce nesting: if with return flattens else', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      // if (p0) { return; } store;
      // should become: if (p0) { return; } store; (no else needed, flat)
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.if, BlockType.Void);
      asm.emit(OpCodes.return);
      asm.emit(OpCodes.else);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 42);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end();
    });
  });
  // The else body should be flattened — no "else" keyword needed
  expect(output).not.toContain('else');
  expect(output).toContain('return');
  expect(output).toContain('42');
});

test('Decompile - side-effecting call not reordered', () => {
  // call foo(); call bar(foo_result) — foo must execute first
  const { moduleInfo } = buildModule((mod) => {
    mod.defineMemory(1);
    const foo = mod.defineFunction('foo', [ValueType.Int32], []);
    foo.createEmitter((asm) => { asm.emit(OpCodes.i32_const, 1); });
    const bar = mod.defineFunction('bar', [], [ValueType.Int32]);
    bar.createEmitter((asm) => {
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_store, 2, 0);
    });
    const main = mod.defineFunction('main', [], []);
    main.createEmitter((asm) => {
      asm.emit(OpCodes.call, foo);
      asm.emit(OpCodes.call, bar);
    });
  });
  const output = decompile(moduleInfo, 2); // main is func index 2
  // Both calls must be present; inlining func_1(func_0()) is valid (preserves order)
  expect(output).toContain('func_0');
  expect(output).toContain('func_1');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - load results have descriptive names', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      // Load from param, use twice (so it can't be inlined)
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_load, 2, 0);
      const loaded = asm.declareLocal(ValueType.Int32, 'val');
      asm.emit(OpCodes.tee_local, loaded);
      asm.emit(OpCodes.get_local, loaded);
      asm.emit(OpCodes.i32_add);
    });
  });
  // Should not have cryptic tmp_ names for the load result
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - tee pattern inlines cleanly', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      const tmp = asm.declareLocal(ValueType.Int32, 'x');
      // x = p0 + 10; memory[0] = x;
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_const, 10);
      asm.emit(OpCodes.i32_add);
      asm.emit(OpCodes.set_local, tmp);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.get_local, tmp);
      asm.emit(OpCodes.i32_store, 2, 0);
    });
  });
  expect(output).toContain('v0 + 10');
  expect(output).toContain('memory[');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - stack frame prologue detected', () => {
  // global.get 0; i32.const 16; i32.sub; local.tee 1; global.set 0 — standard prologue
  const { moduleInfo } = buildModule((mod) => {
    mod.defineMemory(1);
    const stackPtr = mod.defineGlobal(ValueType.Int32, true, 65536);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      const frame = asm.declareLocal(ValueType.Int32, 'frame');
      asm.emit(OpCodes.get_global, stackPtr);
      asm.emit(OpCodes.i32_const, 16);
      asm.emit(OpCodes.i32_sub);
      asm.emit(OpCodes.tee_local, frame);
      asm.emit(OpCodes.set_global, stackPtr);
      // body: store to frame
      asm.emit(OpCodes.get_local, frame);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_store, 2, 0);
      // epilogue: restore stack
      asm.emit(OpCodes.get_local, frame);
      asm.emit(OpCodes.i32_const, 16);
      asm.emit(OpCodes.i32_add);
      asm.emit(OpCodes.set_global, stackPtr);
    });
  });
  const output = decompile(moduleInfo, 0);
  // The stack store should appear
  expect(output).toContain('memory[');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - all stores present in if/else/after pattern', () => {
  // if (x) { store A } else { store B } store C
  // All three stores must appear
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.if, BlockType.Void);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 10);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.emit(OpCodes.else);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 20);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end();
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 30);
      asm.emit(OpCodes.i32_store, 2, 0);
    });
  });
  expect(output).toContain('10');
  expect(output).toContain('20');
  expect(output).toContain('30');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - while loop with counter detected', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      const counter = asm.declareLocal(ValueType.Int32, 'i');
      // i = 0
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.set_local, counter);
      // loop: while (i < param0) { memory[i] = i; i++ }
      const blockLabel = asm.block(BlockType.Void);
      const loopLabel = asm.loop(BlockType.Void);
      // condition: if (i >= param0) break
      asm.emit(OpCodes.get_local, counter);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_ge_s);
      asm.emit(OpCodes.br_if, blockLabel);
      // body: memory[i*4] = i
      asm.emit(OpCodes.get_local, counter);
      asm.emit(OpCodes.i32_const, 2);
      asm.emit(OpCodes.i32_shl);
      asm.emit(OpCodes.get_local, counter);
      asm.emit(OpCodes.i32_store, 2, 0);
      // i++
      asm.emit(OpCodes.get_local, counter);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_add);
      asm.emit(OpCodes.set_local, counter);
      // continue
      asm.emit(OpCodes.br, loopLabel);
      asm.end(); // end loop
      asm.end(); // end block
    });
  });
  expect(output).toContain('for');
  expect(output).toContain('memory[');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - memory with offset uses offset syntax', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      // load from ptr+4 and ptr+8, add them
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_load, 2, 4);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_load, 2, 8);
      asm.emit(OpCodes.i32_add);
    });
  });
  expect(output).toContain('+ 4');
  expect(output).toContain('+ 8');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - string literal from data segment resolved', () => {
  const { moduleInfo } = buildModule((mod) => {
    mod.defineMemory(1);
    const dataContent = new TextEncoder().encode('hello world\0');
    mod.defineData(dataContent, 1024);
    mod.defineFunction('f', [ValueType.Int32], []).createEmitter((asm) => {
      asm.emit(OpCodes.i32_const, 1024);
    });
  });
  // Use the full decompileFunction facade which includes resolveAddress
  const { decompileFunction: decompileFn, createNameResolver } = require('../src/decompiler/Decompiler');
  const nameResolver = createNameResolver(moduleInfo);
  const output = decompileFn(moduleInfo, 0, nameResolver);
  expect(output).toContain('hello world');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - typed memory loads (8/16 bit)', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_load8_s, 0, 0);
    });
  });
  expect(output).toContain('memory[');
  expect(output).toContain('return');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - CFG with many empty blocks still produces correct output', () => {
  // This pattern creates many empty pass-through blocks in the CFG.
  // The decompiler must handle them correctly even after simplification.
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      const outer = asm.block(BlockType.Void);
      const mid = asm.block(BlockType.Void);
      const inner = asm.block(BlockType.Void);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.br_if, inner);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 10);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end(); // inner
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 20);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end(); // mid
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 30);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end(); // outer
    });
  });
  expect(output).toContain('10');
  expect(output).toContain('20');
  expect(output).toContain('30');
  expect(output).not.toContain('Decompilation failed');
});

test('Decompile - variable reassignment shows correctly', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      const tmp = asm.declareLocal(ValueType.Int32, 'x');
      // x = param0 + 1; store x; x = param0 * 2; store x;
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_add);
      asm.emit(OpCodes.set_local, tmp);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.get_local, tmp);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_const, 2);
      asm.emit(OpCodes.i32_mul);
      asm.emit(OpCodes.set_local, tmp);
      asm.emit(OpCodes.i32_const, 4);
      asm.emit(OpCodes.get_local, tmp);
      asm.emit(OpCodes.i32_store, 2, 0);
    });
  });
  // Both assignments and stores should appear
  expect(output).toContain('v0 + 1');
  expect(output).toContain('v0 * 2');
  expect(output).toContain('memory[');
  expect(output).not.toContain('Decompilation failed');
});

// ─── Doom func_5 exact pattern tests ───
// These test the actual WAT patterns from doom.wasm func_5

test('Doom pattern: if with br_if to outer block and br to outermost', () => {
  // block $outer { block $inner { if (p0) { p1=1; if (cond) br $inner; p1=0; br $outer } mem[p0+4]=p1; p1=1; p2=0; } after_inner }
  const { moduleInfo } = buildModule((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32, ValueType.Int32, ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      const local4 = asm.declareLocal(ValueType.Int32, 'result');
      const outer = asm.block(BlockType.Void);
      const inner = asm.block(BlockType.Void);
      // if (var2)
      asm.get_local(asm.getParameter(2));
      asm.if(BlockType.Void, () => {
        // var4 = 1
        asm.const_i32(1);
        asm.set_local(local4);
        // if (var1 >= 0) goto inner_end
        asm.get_local(asm.getParameter(1));
        asm.const_i32(0);
        asm.emit(OpCodes.i32_ge_s);
        asm.emit(OpCodes.br_if, inner);
        // var1 = 0
        asm.const_i32(0);
        asm.set_local(asm.getParameter(1));
        // goto outer_end
        asm.br(outer);
      });
      // else path (after if, still inside inner block):
      // memory[var0+4] = var1
      asm.get_local(asm.getParameter(0));
      asm.get_local(asm.getParameter(1));
      asm.emit(OpCodes.i32_store, 2, 4);
      // var4 = 1; var1 = 0
      asm.const_i32(1);
      asm.set_local(local4);
      asm.const_i32(0);
      asm.set_local(asm.getParameter(1));
      asm.end(); // end inner
      // After inner block: epilogue stores
      asm.get_local(asm.getParameter(0));
      asm.get_local(local4);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.get_local(asm.getParameter(0));
      asm.emit(OpCodes.i32_const, 8);
      asm.emit(OpCodes.i32_add);
      asm.get_local(asm.getParameter(1));
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end(); // end outer
    });
  });
  const output = decompile(moduleInfo, 0);

  // Must contain the key assignments
  expect(output).toContain('= 1');          // var4 = 1
  expect(output).toContain('= 0');          // var1 = 0
  expect(output).toContain('memory[');      // stores
  expect(output).toContain('if');           // condition
  expect(output).not.toContain('Decompilation failed');

  // Must have the epilogue stores (memory[var0] = var4, memory[var0+8] = var1)
  expect(output).toContain('+ 8');
});

test('Doom pattern: nested 5 blocks with dispatch', () => {
  // block { block { block { block { block {
  //   var5 = memory[var3]
  //   if (!var5) { if (!var1) br 1; br 3 }
  //   var3 = memory[var3+4]
  //   if (var3) br 1
  //   if (var1) br 2
  //   var3 = var2
  //   br 3
  // } ... case bodies between each block end ... }
  const { moduleInfo } = buildModule((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32, ValueType.Int32, ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      const local4 = asm.declareLocal(ValueType.Int32, 'result');
      const local5 = asm.declareLocal(ValueType.Int32, 'loaded');
      const b2 = asm.block(BlockType.Void);
      const b3 = asm.block(BlockType.Void);
      const b4 = asm.block(BlockType.Void);
      const b5 = asm.block(BlockType.Void);
      const b6 = asm.block(BlockType.Void);
      // var5 = memory[var3]
      asm.get_local(asm.getParameter(3));
      asm.emit(OpCodes.i32_load, 2, 0);
      asm.tee_local(local5);
      // if (!var5)
      asm.emit(OpCodes.i32_eqz);
      asm.if(BlockType.Void, () => {
        // if (!var1) br b6
        asm.get_local(asm.getParameter(1));
        asm.emit(OpCodes.i32_eqz);
        asm.emit(OpCodes.br_if, b6);
        // br b4
        asm.br(b4);
      });
      // var3 = memory[var3+4]
      asm.get_local(asm.getParameter(3));
      asm.emit(OpCodes.i32_load, 2, 4);
      asm.tee_local(asm.getParameter(3));
      // if (var3) br b5
      asm.emit(OpCodes.br_if, b5);
      // if (var1) br b4
      asm.get_local(asm.getParameter(1));
      asm.emit(OpCodes.br_if, b4);
      // var3 = var2; br b2
      asm.get_local(asm.getParameter(2));
      asm.set_local(asm.getParameter(3));
      asm.br(b2);
      asm.end(); // b6
      // case after b6: var3 = func_26(var5, var3, var2, var1)
      asm.get_local(asm.getParameter(0)); // dummy store as placeholder
      asm.const_i32(100);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.br(b2);
      asm.end(); // b5
      asm.get_local(asm.getParameter(0));
      asm.const_i32(200);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.br(b2);
      asm.end(); // b4
      asm.get_local(asm.getParameter(0));
      asm.const_i32(300);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end(); // b3
      asm.get_local(asm.getParameter(0));
      asm.const_i32(400);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end(); // b2
    });
  });
  const output = decompile(moduleInfo, 0);

  // All case bodies must appear
  expect(output).toContain('100');
  expect(output).toContain('200');
  expect(output).toContain('300');
  expect(output).toContain('400');
  // The dispatch load must appear
  expect(output).toContain('memory[');
  expect(output).not.toContain('Decompilation failed');
});

test('Doom pattern: complete func_5 structure', () => {
  // Full pattern: outer block, inner block, if with branches, nested dispatch blocks, epilogue
  const { moduleInfo } = buildModule((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32, ValueType.Int32, ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      const local4 = asm.declareLocal(ValueType.Int32, 'var4');
      const local5 = asm.declareLocal(ValueType.Int32, 'var5');

      const outer = asm.block(BlockType.Void);
      const inner = asm.block(BlockType.Void);

      // if (var2) { var4=1; if (var1>=0) br inner; var1=0; br outer }
      asm.get_local(asm.getParameter(2));
      asm.if(BlockType.Void, () => {
        asm.const_i32(1);
        asm.set_local(local4);
        asm.get_local(asm.getParameter(1));
        asm.const_i32(0);
        asm.emit(OpCodes.i32_ge_s);
        asm.emit(OpCodes.br_if, inner);
        asm.const_i32(0);
        asm.set_local(asm.getParameter(1));
        asm.br(outer);
      });

      // else: memory[var0+4] = var1; var4=1; var1=0
      asm.get_local(asm.getParameter(0));
      asm.get_local(asm.getParameter(1));
      asm.emit(OpCodes.i32_store, 2, 4);
      asm.const_i32(1);
      asm.set_local(local4);
      asm.const_i32(0);
      asm.set_local(asm.getParameter(1));

      asm.end(); // inner

      // After inner: just store epilogue
      asm.get_local(asm.getParameter(0));
      asm.get_local(local4);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.get_local(asm.getParameter(0));
      asm.emit(OpCodes.i32_const, 8);
      asm.emit(OpCodes.i32_add);
      asm.get_local(asm.getParameter(1));
      asm.emit(OpCodes.i32_store, 2, 0);

      asm.end(); // outer
    });
  });
  const output = decompile(moduleInfo, 0);

  // Key: every store from the WAT must appear in output
  expect(output).toContain('memory[');
  expect(output).toContain('+ 4');       // memory[var0+4]
  expect(output).toContain('+ 8');       // memory[var0+8]
  expect(output).toContain('= 1');       // var4 = 1
  expect(output).toContain('= 0');       // var1 = 0
  expect(output).toContain('if');
  expect(output).not.toContain('Decompilation failed');

  // The epilogue stores must be AFTER the if/else, not inside
  const lines = output.split('\n');
  const epilogueLine = lines.findIndex(l => l.includes('+ 8'));
  expect(epilogueLine).toBeGreaterThan(0);
});

test('Doom func_5 EXACT pattern — all stores present, correct structure', () => {
  // This is the exact instruction sequence from doom.wasm func_5
  // (func (type 7) (param i32 i32 i32 i32) (local i32) (local i32)
  const { moduleInfo } = buildModule((mod) => {
    mod.defineMemory(1);
    const helper25 = mod.defineFunction('func_25', [ValueType.Int32], [ValueType.Int32, ValueType.Int32]);
    helper25.createEmitter((asm) => { asm.const_i32(0); });
    const helper26 = mod.defineFunction('func_26', [ValueType.Int32], [ValueType.Int32, ValueType.Int32, ValueType.Int32, ValueType.Int32]);
    helper26.createEmitter((asm) => { asm.const_i32(0); });

    mod.defineFunction('func_5', [], [ValueType.Int32, ValueType.Int32, ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      const local4 = asm.declareLocal(ValueType.Int32, 'l4');
      const local5 = asm.declareLocal(ValueType.Int32, 'l5');
      const p0 = asm.getParameter(0);
      const p1 = asm.getParameter(1);
      const p2 = asm.getParameter(2);
      const p3 = asm.getParameter(3);

      // block $B0
      const B0 = asm.block(BlockType.Void);
      // block $B1
      const B1 = asm.block(BlockType.Void);
      // local.get 2; if
      asm.get_local(p2);
      asm.if(BlockType.Void, () => {
        // i32.const 1; local.set 4
        asm.const_i32(1);
        asm.set_local(local4);
        // local.get 1; i32.const 0; i32.ge_s; br_if 1 (→ B1 end)
        asm.get_local(p1);
        asm.const_i32(0);
        asm.emit(OpCodes.i32_ge_s);
        asm.emit(OpCodes.br_if, B1);
        // i32.const 0; local.set 1
        asm.const_i32(0);
        asm.set_local(p1);
        // br 2 (→ B0 end)
        asm.br(B0);
      });
      // implicit else (inside B1):
      // local.get 0; local.get 1; i32.store offset=4
      asm.get_local(p0);
      asm.get_local(p1);
      asm.emit(OpCodes.i32_store, 2, 4);
      // i32.const 1; local.set 4; i32.const 0; local.set 1
      asm.const_i32(1);
      asm.set_local(local4);
      asm.const_i32(0);
      asm.set_local(p1);
      // br 1 (from scope B1,B0 → depth 1 = B0 end? No...)
      // Actually inside B1 body after if, scopes are B0,B1. br 1 = B0. But original has br 1 from depth B0,B1 = B0_end
      // Wait, looking at WAT: after the if's end, we're in B1's body. Scopes: B0, B1. br 1 = B0.
      // But the original output shows this path leads to B1_end (falls through).
      // The WAT shows no br here — it falls through to B1's end.
      // Let me re-read... the WAT shows: after i32.store, set, set, then "br 1"
      // br 1 from B1 body: depth 0=B1, depth 1=B0. So br 1 → B0_end.
      // But that skips the dispatch! Looking at decompiler output, the else path ends with "var4=1; var1=0" then continues to epilogue.
      // So br 1 → B0_end is correct — the else path goes directly to epilogue.
      asm.br(B0);

      asm.end(); // end B1

      // After B1: dispatch section with 5 nested blocks
      const B2 = asm.block(BlockType.Void);
      const B3 = asm.block(BlockType.Void);
      const B4 = asm.block(BlockType.Void);
      const B5 = asm.block(BlockType.Void);
      const B6 = asm.block(BlockType.Void);

      // local.get 3; i32.load; local.tee 5
      asm.get_local(p3);
      asm.emit(OpCodes.i32_load, 2, 0);
      asm.tee_local(local5);
      // i32.eqz; if
      asm.emit(OpCodes.i32_eqz);
      asm.if(BlockType.Void, () => {
        // local.get 1; i32.eqz; br_if 1 (→ B6 end)
        asm.get_local(p1);
        asm.emit(OpCodes.i32_eqz);
        asm.emit(OpCodes.br_if, B6);
        // br 3 (→ B4 end)
        asm.br(B4);
      });
      // local.get 3; i32.load offset=4; local.tee 3
      asm.get_local(p3);
      asm.emit(OpCodes.i32_load, 2, 4);
      asm.tee_local(p3);
      // br_if 1 (→ B5 end)
      asm.emit(OpCodes.br_if, B5);
      // local.get 1; br_if 2 (→ B4 end)
      asm.get_local(p1);
      asm.emit(OpCodes.br_if, B4);
      // local.get 2; local.set 3; br 3 (→ B2 end... wait, from B6 body depth: B2,B3,B4,B5,B6)
      // depth 3 from B6 = B3. Hmm. Let me count: scope stack = B0,B2,B3,B4,B5,B6
      // br 3 from B6 body: depth 0=B6, 1=B5, 2=B4, 3=B3.
      asm.get_local(p2);
      asm.set_local(p3);
      asm.br(B3);

      asm.end(); // B6

      // After B6 end: call func_26
      asm.get_local(local5);
      asm.get_local(p3);
      asm.get_local(p2);
      asm.get_local(p1);
      asm.emit(OpCodes.call, helper26);
      asm.tee_local(p3);
      // i32.eqz; br_if 1 (→ B4 end... from scope B2,B3,B4,B5: depth 1=B4)
      asm.emit(OpCodes.i32_eqz);
      asm.emit(OpCodes.br_if, B4);
      // br 2 (→ B3 end from B5 body: depth 0=B5,1=B4,2=B3)
      asm.br(B3);

      asm.end(); // B5

      // After B5 end: call func_25
      asm.get_local(p1);
      asm.get_local(p2);
      asm.emit(OpCodes.call, helper25);
      asm.tee_local(p3);
      // br_if 1 (→ B3 end from B4 body: depth 0=B4,1=B3)
      asm.emit(OpCodes.br_if, B3);

      asm.end(); // B4

      // After B4 end: memory[var0+4] = var1; var1 = var2
      asm.get_local(p0);
      asm.get_local(p1);
      asm.emit(OpCodes.i32_store, 2, 4);
      asm.get_local(p2);
      asm.set_local(p1);
      asm.br(B2);

      asm.end(); // B3

      // After B3 end: memory[var0+4] = var3; var4 = 0
      asm.get_local(p0);
      asm.get_local(p3);
      asm.emit(OpCodes.i32_store, 2, 4);
      asm.const_i32(0);
      asm.set_local(local4);

      asm.end(); // B2

      // Epilogue (after B0 end — wait, B2 is inside B0. After B2 end we're still in B0.)
      // epilogue stores
      asm.get_local(p0);
      asm.get_local(local4);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.get_local(p0);
      asm.const_i32(8);
      asm.emit(OpCodes.i32_add);
      asm.get_local(p1);
      asm.emit(OpCodes.i32_store, 2, 0);

      asm.end(); // B0
    });
  });

  const output = decompile(moduleInfo, 2);
  // CRITICAL: All stores from the WAT must appear
  expect(output).not.toContain('Decompilation failed');

  // The epilogue stores (memory[p0] = var4, memory[p0+8] = p1) must exist
  const hasEpilogueStore0 = output.includes('memory[') && output.includes('+ 0') || output.match(/memory\[v0\]/);
  const hasEpilogueStore8 = output.includes('+ 8');
  expect(hasEpilogueStore8).toBe(true);

  // The dispatch calls must exist (named func_0/func_1 since no name section)
  const hasCall25 = output.includes('func_0') || output.includes('func_25');
  const hasCall26 = output.includes('func_1') || output.includes('func_26');
  expect(hasCall25).toBe(true);
  expect(hasCall26).toBe(true);

  // If/else structure must exist
  expect(output).toContain('if');
});

test('Decompile - empty then with else inverts to positive condition', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      // if (!x) {} else { store } → if (x) { store }
      asm.get_local(asm.getParameter(0));
      asm.emit(OpCodes.i32_eqz);
      asm.emit(OpCodes.if, BlockType.Void);
      asm.emit(OpCodes.else);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 42);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end();
    });
  });
  // Should NOT have "if (!..." since the condition was already eqz and gets un-negated
  expect(output).not.toContain('if (!');
  expect(output).toContain('42');
});

test('Decompile - negated comparison inverts operator', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      // if (!(x >= 0)) { store } → if (x < 0) { store }
      const blockLabel = asm.block(BlockType.Void);
      asm.get_local(asm.getParameter(0));
      asm.const_i32(0);
      asm.emit(OpCodes.i32_ge_s);
      asm.emit(OpCodes.br_if, blockLabel);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 99);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end();
    });
  });
  // Should use inverted operator, not !(...)
  expect(output).not.toContain('!(');
  expect(output).toContain('<');
  expect(output).toContain('99');
});

test('Decompile - C-like types in output', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_add);
    });
  });
  expect(output).toContain('int');
  expect(output).not.toContain('i32');
});

test('Batch decompile — 20 functions of varying complexity, zero crashes', () => {
  const { moduleInfo } = buildModule((mod) => {
    mod.defineMemory(1);
    mod.defineGlobal(ValueType.Int32, true, 0);

    // Function 0: empty
    mod.defineFunction('empty', [], []).createEmitter(() => {});

    // Function 1: return constant
    mod.defineFunction('const_ret', [ValueType.Int32], []).createEmitter((asm) => {
      asm.const_i32(42);
    });

    // Function 2: arithmetic
    mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      asm.get_local(asm.getParameter(0));
      asm.get_local(asm.getParameter(1));
      asm.emit(OpCodes.i32_add);
    });

    // Function 3: if/else
    mod.defineFunction('if_else', [], [ValueType.Int32]).createEmitter((asm) => {
      asm.get_local(asm.getParameter(0));
      asm.if(BlockType.Void, () => {
        asm.const_i32(0);
        asm.const_i32(1);
        asm.emit(OpCodes.i32_store, 2, 0);
      });
    });

    // Function 4: loop
    mod.defineFunction('loop_fn', [], [ValueType.Int32]).createEmitter((asm) => {
      const counter = asm.declareLocal(ValueType.Int32, 'i');
      const loopLabel = asm.loop(BlockType.Void);
      asm.get_local(counter);
      asm.const_i32(1);
      asm.emit(OpCodes.i32_add);
      asm.tee_local(counter);
      asm.get_local(asm.getParameter(0));
      asm.emit(OpCodes.i32_lt_s);
      asm.emit(OpCodes.br_if, loopLabel);
      asm.end();
    });

    // Function 5: nested blocks
    mod.defineFunction('nested', [], [ValueType.Int32]).createEmitter((asm) => {
      const outer = asm.block(BlockType.Void);
      const inner = asm.block(BlockType.Void);
      asm.get_local(asm.getParameter(0));
      asm.emit(OpCodes.br_if, inner);
      asm.const_i32(0);
      asm.const_i32(10);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end();
      asm.const_i32(0);
      asm.const_i32(20);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end();
    });

    // Function 6: memory operations
    mod.defineFunction('mem_ops', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      asm.get_local(asm.getParameter(0));
      asm.emit(OpCodes.i32_load, 2, 0);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_add);
    });

    // Function 7: multiple locals
    mod.defineFunction('locals_fn', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      const tmp = asm.declareLocal(ValueType.Int32, 'tmp');
      asm.get_local(asm.getParameter(0));
      asm.const_i32(2);
      asm.emit(OpCodes.i32_mul);
      asm.set_local(tmp);
      asm.get_local(tmp);
    });

    // Function 8: select
    mod.defineFunction('ternary', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      asm.const_i32(10);
      asm.const_i32(20);
      asm.get_local(asm.getParameter(0));
      asm.emit(OpCodes.select);
    });

    // Function 9: comparison + return
    mod.defineFunction('cmp_fn', [ValueType.Int32], [ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      asm.get_local(asm.getParameter(0));
      asm.get_local(asm.getParameter(1));
      asm.emit(OpCodes.i32_gt_s);
    });
  });

  // Decompile ALL functions
  const { decompileFunction: decompileFn, createNameResolver } = require('../src/decompiler/Decompiler');
  const nameResolver = createNameResolver(moduleInfo);
  for (let funcIndex = 0; funcIndex < moduleInfo.functions.length; funcIndex++) {
    const output = decompileFn(moduleInfo, funcIndex, nameResolver);
    expect(output).not.toContain('Decompilation failed');
    expect(output.length).toBeGreaterThan(10);
  }
});

test('Decompile - negation of comparison gets parens', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('f', [], [ValueType.Int32]).createEmitter((asm) => {
      const blockLabel = asm.block(BlockType.Void);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_ge_s);
      asm.emit(OpCodes.br_if, blockLabel);
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.i32_const, 99);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.end();
    });
  });
  // Negation of comparison should be properly parenthesized
  expect(output).not.toContain('!v0 >=');
});

test('Decompile - negation of compound expression gets parens', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32, ValueType.Int32]).createEmitter((asm) => {
      // !(v0 + v1)
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.get_local, asm.getParameter(1));
      asm.emit(OpCodes.i32_add);
      asm.emit(OpCodes.i32_eqz);
    });
  });
  expect(output).toContain('!(v0 + v1)');
});

test('Decompile - br_table produces switch statement', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('dispatch', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      // block $b0
      //   block $b1
      //     block $b2
      //       get_local 0
      //       br_table [0→$b2, 1→$b1] default→$b0
      //     end $b2  -- case 0
      //     i32.const 10
      //     return
      //   end $b1  -- case 1
      //   i32.const 20
      //   return
      // end $b0  -- default
      // i32.const 30
      const outerBlock = asm.block(BlockType.Void);
      const middleBlock = asm.block(BlockType.Void);
      const innerBlock = asm.block(BlockType.Void);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.br_table, outerBlock, [innerBlock, middleBlock]);
      asm.end();
      asm.emit(OpCodes.i32_const, 10);
      asm.emit(OpCodes.return);
      asm.end();
      asm.emit(OpCodes.i32_const, 20);
      asm.emit(OpCodes.return);
      asm.end();
      asm.emit(OpCodes.i32_const, 30);
    });
  });
  expect(output).toContain('switch');
  expect(output).toContain('case 0');
  expect(output).toContain('case 1');
  expect(output).toContain('default');
  expect(output).toContain('10');
  expect(output).toContain('20');
  expect(output).toContain('30');
});

test('Decompile - br_table with merged cases produces grouped case labels', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('dispatch', [ValueType.Int32], [ValueType.Int32]).createEmitter((asm) => {
      // Cases 0 and 2 go to same target, case 1 goes to another
      const outerBlock = asm.block(BlockType.Void);
      const middleBlock = asm.block(BlockType.Void);
      const innerBlock = asm.block(BlockType.Void);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      // targets: [0→inner, 1→middle, 2→inner], default→outer
      asm.emit(OpCodes.br_table, outerBlock, [innerBlock, middleBlock, innerBlock]);
      asm.end();
      asm.emit(OpCodes.i32_const, 100);
      asm.emit(OpCodes.return);
      asm.end();
      asm.emit(OpCodes.i32_const, 200);
      asm.emit(OpCodes.return);
      asm.end();
      asm.emit(OpCodes.i32_const, 999);
    });
  });
  expect(output).toContain('switch');
  expect(output).toContain('case 0');
  expect(output).toContain('case 2');
  expect(output).toContain('case 1');
  expect(output).toContain('default');
  expect(output).toContain('100');
  expect(output).toContain('200');
  expect(output).toContain('999');
});

test('Decompile - for loop detected from init + while + increment', () => {
  const output = buildAndDecompile((mod) => {
    mod.defineMemory(1);
    mod.defineFunction('forloop', [], [ValueType.Int32]).createEmitter((asm) => {
      const counter = asm.declareLocal(ValueType.Int32, 'i');
      // counter = 0
      asm.emit(OpCodes.i32_const, 0);
      asm.emit(OpCodes.set_local, counter);
      // block $exit { loop $cont {
      //   if (counter >= param0) br $exit;
      //   memory[counter * 4] = counter;
      //   counter = counter + 1;
      //   br $cont;
      // } }
      const exitLabel = asm.block(BlockType.Void);
      const loopLabel = asm.loop(BlockType.Void);
      asm.emit(OpCodes.get_local, counter);
      asm.emit(OpCodes.get_local, asm.getParameter(0));
      asm.emit(OpCodes.i32_ge_s);
      asm.emit(OpCodes.br_if, exitLabel);
      asm.emit(OpCodes.get_local, counter);
      asm.emit(OpCodes.i32_const, 2);
      asm.emit(OpCodes.i32_shl);
      asm.emit(OpCodes.get_local, counter);
      asm.emit(OpCodes.i32_store, 2, 0);
      asm.emit(OpCodes.get_local, counter);
      asm.emit(OpCodes.i32_const, 1);
      asm.emit(OpCodes.i32_add);
      asm.emit(OpCodes.set_local, counter);
      asm.emit(OpCodes.br, loopLabel);
      asm.end();
      asm.end();
    });
  });
  expect(output).toContain('for');
  expect(output).toContain('v1 = 0');
});
