import { decompileLast, ModuleBuilder, BinaryReader, ValueType, OpCodes, BlockType, decompileFunction, createNameResolver } from './DecompilerTestHelper';

function decompileWithNames(buildFunc: (mod: ModuleBuilder) => void): string {
  const mod = new ModuleBuilder('test', { target: 'latest', disableVerification: true, generateNameSection: true });
  buildFunc(mod);
  const bytes = mod.toBytes();
  const info = new BinaryReader(new Uint8Array(bytes)).read();
  const resolver = createNameResolver(info);
  const output = decompileFunction(info, info.functions.length - 1, resolver);
  expect(output).not.toContain('Decompilation failed');
  return output;
}

describe('Decompiler: Variable Naming', () => {
  test('loop counter preserves name from name section', () => {
    const output = decompileWithNames((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        const counter = a.declareLocal(ValueType.Int32, 'counter');
        a.const_i32(0);
        a.set_local(counter);
        const loopHead = a.loop(BlockType.Void);
        const exitBlock = a.block(BlockType.Void);
        a.get_local(counter);
        a.get_local(a.getParameter(0));
        a.ge_i32();
        a.br_if(exitBlock);
        a.get_local(counter);
        a.const_i32(4);
        a.mul_i32();
        a.get_local(counter);
        a.store_i32(2, 0);
        a.get_local(counter);
        a.const_i32(1);
        a.add_i32();
        a.set_local(counter);
        a.br(loopHead);
        a.end();
        a.end();
      });
    });
    expect(output).toContain('counter');
    expect(output).toMatch(/while|for/);
    expect(output).toContain('+ 1');
  });

  test('nested loops decompile with distinct counter variables', () => {
    const output = decompileWithNames((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        const outerCounter = a.declareLocal(ValueType.Int32, 'outerCounter');
        const innerCounter = a.declareLocal(ValueType.Int32, 'innerCounter');
        a.const_i32(0);
        a.set_local(outerCounter);
        const outerLoop = a.loop(BlockType.Void);
        const outerExit = a.block(BlockType.Void);
        a.get_local(outerCounter);
        a.get_local(a.getParameter(0));
        a.ge_i32();
        a.br_if(outerExit);
        a.const_i32(0);
        a.set_local(innerCounter);
        const innerLoop = a.loop(BlockType.Void);
        const innerExit = a.block(BlockType.Void);
        a.get_local(innerCounter);
        a.get_local(a.getParameter(0));
        a.ge_i32();
        a.br_if(innerExit);
        a.get_local(innerCounter);
        a.const_i32(4);
        a.mul_i32();
        a.get_local(innerCounter);
        a.store_i32(2, 0);
        a.get_local(innerCounter);
        a.const_i32(1);
        a.add_i32();
        a.set_local(innerCounter);
        a.br(innerLoop);
        a.end();
        a.end();
        a.get_local(outerCounter);
        a.const_i32(1);
        a.add_i32();
        a.set_local(outerCounter);
        a.br(outerLoop);
        a.end();
        a.end();
      });
    });
    expect(output).toContain('outerCounter');
    expect(output).toContain('innerCounter');
    expect(output).toMatch(/while|for/);
  });

  test('load8_u result carries ubyte cast', () => {
    const output = decompileWithNames((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.emit(OpCodes.i32_load8_u, 0, 0);
        a.const_i32(1);
        a.add_i32();
      });
    });
    expect(output).toContain('ubyte');
  });

  test('known function return naming for strlen', () => {
    const output = decompileWithNames((mod) => {
      mod.defineMemory(1);
      const strlenImport = mod.importFunction('env', 'strlen', [ValueType.Int32], [ValueType.Int32]);
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.call(strlenImport);
        a.const_i32(1);
        a.add_i32();
      });
    });
    expect(output).toContain('len');
  });

  test('malloc return named buf', () => {
    const output = decompileWithNames((mod) => {
      mod.defineMemory(1);
      const mallocImport = mod.importFunction('env', 'malloc', [ValueType.Int32], [ValueType.Int32]);
      mod.defineFunction('f', null, [ValueType.Int32], (f, a) => {
        const allocated = a.declareLocal(ValueType.Int32);
        a.get_local(a.getParameter(0));
        a.call(mallocImport);
        a.set_local(allocated);
        a.get_local(allocated);
        a.const_i32(0);
        a.store_i32(2, 0);
      });
    });
    expect(output).toContain('buf');
  });

  test('get_ prefix stripped from return variable name', () => {
    const output = decompileWithNames((mod) => {
      const getLength = mod.defineFunction('get_length', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
      });
      mod.defineFunction('f', [ValueType.Int32], [ValueType.Int32], (f, a) => {
        a.get_local(a.getParameter(0));
        a.call(getLength);
        a.const_i32(1);
        a.add_i32();
      });
    });
    expect(output).toContain('length');
  });

  test('stack pointer global removed by stack frame pass', () => {
    const output = decompileWithNames((mod) => {
      mod.defineMemory(1);
      const stackPointer = mod.defineGlobal(ValueType.Int32, true, 65536).withName('__stack_pointer');
      mod.defineFunction('f', null, [], (f, a) => {
        const framePointer = a.declareLocal(ValueType.Int32, 'framePointer');
        a.get_global(stackPointer);
        a.const_i32(16);
        a.sub_i32();
        a.tee_local(framePointer);
        a.set_global(stackPointer);
        a.get_local(framePointer);
        a.const_i32(42);
        a.store_i32(2, 0);
        a.get_local(framePointer);
        a.const_i32(16);
        a.add_i32();
        a.set_global(stackPointer);
      });
    });
    expect(output).not.toContain('__stack_pointer');
    expect(output).not.toContain('global_');
    expect(output).toContain('42');
  });
});
