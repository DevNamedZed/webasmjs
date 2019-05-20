import { FunctionEmitter, ModuleBuilder, ValueType } from '../src/index'
import TestHelper from './TestHelper'
//assertAddI32(x, y, expected)

test('Integer Add', async () => {
  await TestHelper.validateFunction(
    "add",
    ValueType.Int32,
    [],
    /**
     * @param {FunctionEmitter} asmGenerator
     */
    asmGenerator => {
      asmGenerator.const_i32(25);
      asmGenerator.const_i32(12);
      asmGenerator.add_i32();
      asmGenerator.end();
    },
    25 + 12)
});