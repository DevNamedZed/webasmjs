import { ValueType } from '../src/index';
import VerificationTest from './VerificationTest';

test('Stack Verification - end with empty stack', async () => {
  await VerificationTest.assertVerification(
    [ValueType.Int32],
    [ValueType.Int32],
    (asm) => {
      asm.const_i32(0);
      asm.drop();
      asm.end();
    }
  );
});

test('Stack Verification - type mismatch', async () => {
  await VerificationTest.assertVerification(
    [ValueType.Int32],
    [],
    (asm) => {
      asm.const_f32(1.0);
      asm.end();
    }
  );
});

test('Stack Verification - wrong return type f64 instead of i32', async () => {
  await VerificationTest.assertVerification(
    [ValueType.Int32],
    [],
    (asm) => {
      asm.const_f64(1.0);
      asm.end();
    }
  );
});

test('Stack Verification - leftover value on void function', async () => {
  await VerificationTest.assertVerification(
    [],
    [],
    (asm) => {
      asm.const_i32(42);
      asm.end();
    }
  );
});

test('Stack Verification - too few values on stack', async () => {
  await VerificationTest.assertVerification(
    [ValueType.Int32],
    [],
    (asm) => {
      // No values pushed, but function expects i32 return
      asm.end();
    }
  );
});

test('Stack Verification - binary op with wrong type', async () => {
  await VerificationTest.assertVerification(
    [ValueType.Int32],
    [],
    (asm) => {
      asm.const_i32(1);
      asm.const_f32(2.0); // wrong type for i32.add
      asm.add_i32();
      asm.end();
    }
  );
});
