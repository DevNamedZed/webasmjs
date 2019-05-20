import { FunctionEmitter, ModuleBuilder, ValueType } from '../src/index'

/**
 * Callback for emitting a function body..
 * @callback emitFunctionCallback
 * @param {FunctionEmitter} asm The emitter used to generate the expression function.
 */

export default class TestHelper {
  /**
   * 
   * @param {*} name 
   * @param {*} returnType 
   * @param {*} parameters 
   * @param {emitFunctionCallback} generatorCallback 
   * @param {*} options 
   */
  static async compileFunction(name, returnType, parameters, generatorCallback, options) {
    const moduleBuilder = new ModuleBuilder("test", options || ModuleBuilder.defaultOptions);
    const testFunction = moduleBuilder.defineFunction(name, returnType, parameters, { export: true })
    const asmGenerator = testFunction.createAssemblyEmitter();
    generatorCallback(asmGenerator);
  
    const module = await moduleBuilder.instantiate();
    return module.instance.exports[name];
  }


    static async validateFunction(name, returnType, parameters, generatorCallback, expectedResult, ...args) {
      const testFunction = await TestHelper.compileFunction(name, returnType, parameters, generatorCallback);
      const result = testFunction(args);
      expect(result).toBe(expectedResult);
    }
}