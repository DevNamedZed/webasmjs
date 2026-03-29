import { expectDecompiles, ValueType } from './DecompilerTestHelper';

describe('Decompiler: Tail Calls', () => {
  test('return_call', () => {
    expectDecompiles((mod) => {
      const target = mod.defineFunction('target', [ValueType.Int32], [], (f, a) => {
        a.const_i32(42);
      });
      mod.defineFunction('f', [ValueType.Int32], [], (f, a) => {
        a.return_call(target);
      });
    });
  });
});
