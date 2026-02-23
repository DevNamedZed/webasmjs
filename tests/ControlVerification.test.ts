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
