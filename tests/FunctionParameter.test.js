import { FunctionBuilder, ModuleBuilder, ValueType } from '../src/index'
import TestHelper from './TestHelper'

test('Function Parameter - varUInt8', async () => {
  await TestHelper.validateFunction(
    "add",
    ValueType.Int32,
    [ValueType.Int32],
    /**
     * @param {FunctionBuilder} functionBuilder
     * @param {AssemblyEmitter} asmGenerator
     */
    (asmGenerator) => {
      asmGenerator.get_local(0);
      asmGenerator.const_i32(1);
      asmGenerator.add_i32();
      asmGenerator.end();
    },
    55 + 1,
    55)
});