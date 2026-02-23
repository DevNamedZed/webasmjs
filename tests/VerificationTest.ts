import { FunctionEmitter, ModuleBuilder, VerificationError } from '../src/index';
import type { ValueTypeDescriptor } from '../src/types';

const ExecuteResult = {
  VerificationError: 'VerificationError',
  CompileError: 'CompileError',
  ExecuteError: 'ExecuteError',
  Success: 'Success',
} as const;

interface ExecuteResultInfo {
  result: string;
  err: Error | null;
}

export default class VerificationTest {
  static async assertVerification(
    returnType: ValueTypeDescriptor[] | ValueTypeDescriptor | null,
    parameters: ValueTypeDescriptor[],
    generatorCallback: (asm: FunctionEmitter) => void,
    validateErrorCallback?: (verifyErr: Error, compileErr: Error) => void
  ): Promise<void> {
    const resultWithValidation = await VerificationTest._execute(
      returnType,
      parameters,
      generatorCallback,
      { generateNameSection: true, disableVerification: false }
    );
    const resultNoValidation = await VerificationTest._execute(
      returnType,
      parameters,
      generatorCallback,
      { generateNameSection: true, disableVerification: true }
    );

    expect(resultWithValidation.result).toBe(ExecuteResult.VerificationError);
    expect(resultNoValidation.result).toBe(ExecuteResult.CompileError);
    expect(resultWithValidation.err).toBeInstanceOf(VerificationError);

    if (validateErrorCallback) {
      validateErrorCallback(resultWithValidation.err!, resultNoValidation.err!);
    }
  }

  static async _execute(
    returnType: ValueTypeDescriptor[] | ValueTypeDescriptor | null,
    parameters: ValueTypeDescriptor[],
    generatorCallback: (asm: FunctionEmitter) => void,
    options: { generateNameSection: boolean; disableVerification: boolean }
  ): Promise<ExecuteResultInfo> {
    const moduleBuilder = new ModuleBuilder('test', options);
    const testFunction = moduleBuilder.defineFunction('test', returnType, parameters);

    const asmGenerator = testFunction.createEmitter();
    testFunction.withExport();

    try {
      generatorCallback(asmGenerator);
      moduleBuilder.toBytes();
    } catch (err) {
      return {
        result: ExecuteResult.VerificationError,
        err: err as Error,
      };
    }

    let module: WebAssembly.WebAssemblyInstantiatedSource;
    try {
      module = await moduleBuilder.instantiate();
    } catch (err) {
      return {
        result: ExecuteResult.CompileError,
        err: err as Error,
      };
    }

    try {
      (module.instance.exports.test as CallableFunction)();
    } catch (err) {
      return {
        result: ExecuteResult.ExecuteError,
        err: err as Error,
      };
    }

    return {
      result: ExecuteResult.Success,
      err: null,
    };
  }
}
