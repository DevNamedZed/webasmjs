import FuncTypeBuilder from './FuncTypeBuilder'
import TypeForm from './TypeForm'
import LocalBuilder from './LocalBuilder';
import BinaryWriter from './BinaryWriter';
import FunctionParameterBuilder from './FunctionParametersBuilder';
import { FunctionEmitter } from './Emitters';

/**
 * Callback for emitting a function body..
 * @callback emitFunctionCallback
 * @param {FunctionEmitter} asm The emitter used to generate the expression function.
 */

export default class FunctionBuilder {
    name;

    /**
     * @type {FuncTypeBuilder}
     */
    funcTypeBuilder;
    parameters;
    index;
    options;

    /**
     * @type {FunctionEmitter}
     */
    functionEmitter;

    /**
     * 
     * @param {String} name 
     * @param {FuncTypeBuilder} funcTypeBuilder 
     * @param {Number} index 
     * @param {Object} options 
     */
    constructor(name, funcTypeBuilder, index, options = { export: false, disableVerification: false }) {
        this.name = name;
        this.funcTypeBuilder = funcTypeBuilder;
        this.index = index;
        this.options = options;
        this.parameters = funcTypeBuilder.parameterTypes.map((x, i) => new FunctionParameterBuilder(x, i));
    }

    get returnType() {
        return this.funcTypeBuilder.returnType;
    }

    get parameterTypes() {
        return this.funcTypeBuilder.parameterTypes;
    }

    get export() {
        return this.options.export === true;
    }

    /**
     * Gets
     * @param {*} index 
     * @returns {FunctionParameterBuilder}
     */
    getParameter(index) {
        return this.parameters[index];
    }
    
    /**
     * 
     * @param {emitFunctionCallback} callback 
     * @returns {FunctionEmitter}
     */
    createAssemblyEmitter(callback) {
        if (this.functionEmitter) {
            throw new Error('Function emitter has already been created.');
        }

        this.functionEmitter = new FunctionEmitter(this, { disableVerification: this.options.disableVerification });
        if (callback) {
            callback(this.functionEmitter);
            this.functionEmitter.end();
        }

        return this.functionEmitter;
    }

    write(writer) {
        if (!this.functionEmitter) {
            throw new Error('Function body has not been defined.');
        }

        this.functionEmitter.write(writer);
    }

    toBytes() {
        const buffer = new BinaryWriter();
        this.writeBytes(buffer);
        return buffer.toArray();
    }
}