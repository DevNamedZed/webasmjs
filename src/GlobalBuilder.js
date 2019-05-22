import GlobalType from "./GlobalType";
import InitExpressionType from "./InitExpressionType";
import ModuleBuilder from "./ModuleBuilder";
import ValueType from './ValueType'
import { InitExpressionEmitter } from "./Emitters";

/**
 * Represents a global variable.
 */
export default class GlobalBuilder {

    /**
     * @type {GlobalType}
     */
    _globalType;

    /**
     * @type {Number}
     */
    _index;

    /**
     * @type {InitExpressionEmitter}
     */
    _initExpressionEmitter;

    /**
     * @type {ModuleBuilder}
     */
    _moduleBuilder;

    /**
     * Creates and initializes a new ModuleBuilder
     * @param {ModuleBuilder} moduleBuilder
     * @param {ValueType} valueType 
     * @param {Boolean} mutable 
     * @param {Number} index 
     */
    constructor(moduleBuilder, valueType, mutable, index) {
        this._moduleBuilder = moduleBuilder;
        this._globalType = new GlobalType(valueType, mutable);
        this._index = index;
    }

    get globalType(){
        return this._globalType;
    }

    get valueType(){
        return this._globalType._valueType;
    }

    /**
    * Create an emitter used to generate the element offset expression.
    * @param {emitInitCallback} callback - Optional callback.
    * @returns {InitExpressionEmitter} The expression emitter.
    */
    createInitEmitter(callback) {
        if (this._initExpressionEmitter) {
            throw new Error('Initialization expression emitter has already been created.');
        }

        this._initExpressionEmitter = new InitExpressionEmitter(InitExpressionType.Global, this.valueType);
        if (callback) {
            callback(this._initExpressionEmitter);
            this._initExpressionEmitter.end();
        }

        return this._initExpressionEmitter;
    }

    /**
     * Sets the initial value of the constant.
     * @param {Object} value The value can either by a constant, GlobalBuilder, or call back that generates the 
     *  initialization expression using a parameter that gets passed in.
     */
    value(value) {
        if (typeof value === "function") {
            this.createInitEmitter(value);
        }
        else if (value instanceof GlobalBuilder) {
            this.createInitEmitter(asm => {
                asm.get_global(value);
            });
        }
        else if (typeof value === 'number') {
            this.createInitEmitter(asm =>{
                asm.const_i32(value);
            })
        }
        else {
            throw new Error('Unsupported global value.');
        }
    }

    
    withExport(name){
        this._moduleBuilder.exportGlobal(this, name);
        return this;
    }

    /**
     * Writes the object to a binary writer.
     * @param {BinaryWriter} writer The binary writer the object should be written to.
     */
    write(writer) {
        if (!this._initExpressionEmitter) {
            throw new Error('The initialization expression was not defined.');
        }

        this._globalType.write(writer);
        this._initExpressionEmitter.write(writer);
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