import { AssemblyEmitter } from "./Emitters";
import GlobalBuilder from "./GlobalBuilder";
import InitExpressionType from './InitExpressionType'
import OpCodes from "./OpCodes";
import FuncTypeSignature from "./FuncTypeSignature";

/**
 * Used to emit initializer expressions for data, element, and globals. 
 */
export default class InitExpressionEmitter extends AssemblyEmitter {
    
    /**
     * @type {InitExpressionType}
     */
    _initExpressionType;
    
    constructor(initExpressionType, valueType){
        super(new FuncTypeSignature([valueType], []));

        this._initExpressionType = initExpressionType;
    }


    /**
     * Gets the function parameter or local at the specified index.
     * @param {Number} index The index of the local or parameter.
     * @returns { FunctionParameterBuilder | LocalBuilder } The function parameter or local at the specified index.
     */
    getParameter(index){
        throw new Error('An initialization expression does not have any parameters.');
    }

    /**
     * Declares a new local variable.
     * @param {ValueType} type The type of the value that will be stored in the variable.
     * @param {String} name The name of the local variable.
     * @param {Number} count The number of variables.
     * @returns {LocalBuilder} A new LocalBuilder which can used to access the variable.
     */
    declareLocal(type, name = null, count = 1) {
        throw new Error('An initialization expression cannot have locals.');
    }

    emit(opCode, ...args){
        this._isValidateOp(opCode);
        return super.emit(opCode, ...args);
    }

    write(writer){
        for (let index = 0; index < this._instructions.length; index++) {
            this._instructions[index].write(writer);
        }
    }

    /**
     * Checks to see if the instruction can be used in an initializer expression.
     * @param {*} opCode The instruction op code.
     * @param {*} args Array of any immediate operands for the instruction.
     */
    _isValidateOp(opCode, args){
        if (this._instructions.length === 2){
            return false;
        }

        if (this._instructions.length === 1){
            return opCode === OpCodes.end;
        }

        switch (opCode){
            case OpCodes.f32_const:
            case OpCodes.f64_const:
            case OpCodes.i32_const:
            case OpCodes.i64_const:
                break;

            case OpCodes.get_global:
                const globalBuilder = args[0];
                if (this._initExpressionType === InitExpressionType.Element){
                    throw new Error('The only valid instruction for an element initializer expression is a constant i32, ' +
                    'global not supported.'); 
                }

                if (!(globalBuilder instanceof GlobalBuilder)){
                    throw new Error('A global builder was expected.'); 
                }

                if (globalBuilder.mutable){
                    throw new Error('An initializer expression cannot reference a mutable global.'); 
                }

                break;

            default:
                throw new Error(`Opcode ${opCode.mnemonic} is not supported in an initializer expression.`);
        }
    }
}