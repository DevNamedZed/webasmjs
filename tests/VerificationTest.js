import { FunctionEmitter, ModuleBuilder, VerificationError } from "../src/index.js";

/**
 * Callback for emitting a function body..
 * @callback emitFunctionCallback
 * @param {FunctionEmitter} asm The emitter used to generate the expression function.
 */

const ExecuteResult = {
    VerificationError: "VerificationError",
    CompileError: "CompileError",
    ExecuteError: "ExecuteError",
    Success: "Success"
};


export default class VerificationTest{

    /**
     * 
     * @param {*} returnType 
     * @param {*} parameters 
     * @param {emitFunctionCallback} generatorCallback 
     * @param {*} validateErrorCallback 
     */
    static async assertVerification(returnType, parameters, generatorCallback, validateErrorCallback){
        const resultWithValidation = await VerificationTest._execute(
            returnType, 
            parameters,
            generatorCallback,
            { generateNameSection: true, disableVerification: false });
        const resultNoValidation = await VerificationTest._execute(
            returnType, 
            parameters,
            generatorCallback,
            { generateNameSection: true, disableVerification: true });

        expect(resultWithValidation.result).toBe(ExecuteResult.VerificationError);
        expect(resultNoValidation.result).toBe(ExecuteResult.CompileError);
        expect(resultWithValidation.err).toBeInstanceOf(VerificationError);

        if (validateErrorCallback){
            validateErrorCallback(resultWithValidation.err, resultNoValidation.err);
        }
    }

    static async _execute(returnType, parameters, generatorCallback, options){
        const moduleBuilder = new ModuleBuilder("test", options);
        const testFunction = moduleBuilder.defineFunction("test", returnType, parameters, { export: true })
        const asmGenerator = testFunction.createAssemblyEmitter();
        
        try{
            generatorCallback(asmGenerator);
            moduleBuilder.toBytes();
        }
        catch (err){
            return {
                result: ExecuteResult.VerificationError,
                err: err
            }
        }
                
        let module = null;
        try{
            module = await moduleBuilder.instantiate();
        }
        catch (err){
            return {
                result: ExecuteResult.CompileError,
                err: err
            }
        }
                        
        try{
            module.instance.exports.test();
        }
        catch (err){
            return {
                result: ExecuteResult.ExecuteError,
                err: err
            }
        }

        return {
            result: ExecuteResult.Success,
            err: err
        }
    }
}