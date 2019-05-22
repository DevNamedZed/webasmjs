import BinaryWriter from './BinaryWriter';
import FunctionParameterBuilder from './FunctionParametersBuilder';
import FuncTypeBuilder from './FuncTypeBuilder'
import LocalBuilder from './LocalBuilder';
import ModuleBuilder from './ModuleBuilder';
import TypeForm from './TypeForm'
import { FunctionEmitter } from './Emitters';

/**
 * Callback for emitting a function body..
 * @callback emitFunctionCallback
 * @param {FunctionEmitter} asm The emitter used to generate the expression function.
 */

 /**
  * Constructs a new function.
  */
export default class FunctionBuilder {
    /**
     * @type {String}
     */
    name;

    /**
     * @type {FuncTypeBuilder}
     */
    funcTypeBuilder;

    /**
     * @type {FunctionParameterBuilder[]}
     */
    parameters;

    /**
     * @type {Number}
     */
    _index;

    /**
     * @type {FunctionEmitter}
     */
    functionEmitter;

    /**
     * @type {ModuleBuilder}
     */
    _moduleBuilder;

    /**
     * Creates and initializes a new FunctionBuilder. 
     * @param {ModuleBuilder} moduleBuilder The module this function belongs to.
     * @param {String} name The name of the function.
     * @param {FuncTypeBuilder} funcTypeBuilder Func type that describes the signature of the function.
     * @param {Number} index Index of the function.
     */
    constructor(moduleBuilder, name, funcTypeBuilder, index) {
        this._moduleBuilder = moduleBuilder;
        this.name = name;
        this.funcTypeBuilder = funcTypeBuilder;
        this._index = index;
        this.parameters = funcTypeBuilder.parameterTypes.map((x, i) => new FunctionParameterBuilder(x, i));
    }

    /**
     * Gets a collection of  {@link ValueType} that represent the function return value types.
     */
    get returnType() {
        return this.funcTypeBuilder.returnType;
    }

    /**
     * Gets a collection of {@link ValueType} that represent the function parameter types.
     */
    get parameterTypes() {
        return this.funcTypeBuilder.parameterTypes;
    }

    /**
     * Gets the @type {FunctionParameterBuilder} for the function parameter at the specified index.
     * @param {Number} index The function parameter index. 
     * @returns {FunctionParameterBuilder}
     */
    getParameter(index) {
        return this.parameters[index];
    }
    
    /**
     * Creates a new {@link FunctionEmitter} used to generate the body for this function.
     * @param {emitFunctionCallback=} callback Optional callback used to generate the function body.
     * @returns {FunctionEmitter}
     */
    createEmitter(callback) {
        if (this.functionEmitter) {
            throw new Error('Function emitter has already been created.');
        }

        this.functionEmitter = new FunctionEmitter(this, { disableVerification: this._moduleBuilder.disableVerification });
        if (callback) {
            callback(this.functionEmitter);
            this.functionEmitter.end();
        }

        return this.functionEmitter;
    }

    /**
     * Marks this function for export.
     * @param {String=} name The name that function should be exported as. 
     * @returns {FunctionBuilder}
     */
    withExport(name){
        this._moduleBuilder.exportFunction(this, name);
        return this;        
    }
    
    /**
     * Writes the object to a binary writer.
     * @param {BinaryWriter} writer The binary writer the object should be written to.
     */
    write(writer) {
        if (!this.functionEmitter) {
            throw new Error('Function body has not been defined.');
        }

        this.functionEmitter.write(writer);
    }

    /**
     * Creates a byte representation of the object.
     * @returns {Uint8Array} The byte representation of the object.
     */
    toBytes() {
        const buffer = new BinaryWriter();
        this.writeBytes(buffer);
        return buffer.toArray();
    }
}