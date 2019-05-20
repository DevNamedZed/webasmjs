import { ModuleBuilder, ValueType } from "../src";
import TestHelper from "./TestHelper";
import VerificationTest from "./VerificationTest";

test('Stack Verification - end with empty stack', async () => {
    await VerificationTest.assertVerification(
        [ValueType.Int32], 
        [ValueType.Int32],
        asm => {
            asm.const_i32(0);
            asm.drop();
            asm.end();
        });
});