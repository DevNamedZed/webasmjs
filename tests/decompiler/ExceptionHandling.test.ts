import { expectDecompiles, ValueType, OpCodes, BlockType } from './DecompilerTestHelper';

describe('Decompiler: Exception Handling', () => {
  test('try/catch', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      const tag = mod.defineTag([]);
      mod.defineFunction('f', null, [], (f, a) => {
        a.emit(OpCodes.try, BlockType.Void);
        a.const_i32(0);
        a.const_i32(42);
        a.store_i32(2, 0);
        a.emit(OpCodes.catch, tag);
        a.const_i32(0);
        a.const_i32(99);
        a.store_i32(2, 0);
        a.end();
      });
    });
  });

  test('try/catch_all', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      mod.defineFunction('f', null, [], (f, a) => {
        a.emit(OpCodes.try, BlockType.Void);
        a.const_i32(0);
        a.const_i32(1);
        a.store_i32(2, 0);
        a.emit(OpCodes.catch_all);
        a.const_i32(0);
        a.const_i32(2);
        a.store_i32(2, 0);
        a.end();
      });
    });
  });

  test('throw', () => {
    expectDecompiles((mod) => {
      const tag = mod.defineTag([]);
      mod.defineFunction('f', null, [], (f, a) => {
        a.emit(OpCodes.throw, tag);
      });
    });
  });

  test('nested try/catch', () => {
    expectDecompiles((mod) => {
      mod.defineMemory(1);
      const tag = mod.defineTag([]);
      mod.defineFunction('f', null, [], (f, a) => {
        a.emit(OpCodes.try, BlockType.Void);
        a.emit(OpCodes.try, BlockType.Void);
        a.const_i32(0);
        a.const_i32(1);
        a.store_i32(2, 0);
        a.emit(OpCodes.catch, tag);
        a.const_i32(0);
        a.const_i32(2);
        a.store_i32(2, 0);
        a.end();
        a.emit(OpCodes.catch_all);
        a.const_i32(0);
        a.const_i32(3);
        a.store_i32(2, 0);
        a.end();
      });
    });
  });
});
