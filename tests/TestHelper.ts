import { FunctionEmitter, ModuleBuilder, ValueType } from '../src/index';
import type { ValueTypeDescriptor, ModuleBuilderOptions } from '../src/types';

export default class TestHelper {
  static async compileFunction(
    name: string,
    returnType: ValueTypeDescriptor[] | ValueTypeDescriptor | null,
    parameters: ValueTypeDescriptor[],
    generatorCallback: (asm: FunctionEmitter) => void,
    options?: ModuleBuilderOptions
  ): Promise<CallableFunction> {
    const moduleBuilder = new ModuleBuilder('test', options || ModuleBuilder.defaultOptions);
    const testFunction = moduleBuilder.defineFunction(name, returnType, parameters);
    const asmGenerator = testFunction.createEmitter();
    testFunction.withExport();
    generatorCallback(asmGenerator);

    const module = await moduleBuilder.instantiate();
    return module.instance.exports[name] as CallableFunction;
  }

  static async validateFunction(
    name: string,
    returnType: ValueTypeDescriptor[] | ValueTypeDescriptor | null,
    parameters: ValueTypeDescriptor[],
    generatorCallback: (asm: FunctionEmitter) => void,
    expectedResult: number,
    ...args: number[]
  ): Promise<void> {
    const testFunction = await TestHelper.compileFunction(name, returnType, parameters, generatorCallback);
    const result = testFunction(...args);
    expect(result).toBe(expectedResult);
  }
}
