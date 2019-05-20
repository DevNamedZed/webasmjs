import { ValueType } from "../src";
import TestHelper from "./TestHelper";

test('If Test - Callback', async () => {
  const testFunction = await TestHelper.compileFunction(
    'test',
    ValueType.Int32,
    [ValueType.Int32],
    /**
     * @param {FunctionEmitter} asm
    */
    asm => {

      const localX = asm.declareLocal(
        ValueType.Int32,
        "x");
      asm.const_i32(1000);
      asm.tee_local(localX);

      asm.get_local(0);
      asm.add_i32();
      asm.end();
    });
});