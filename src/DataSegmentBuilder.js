import { InitExpressionEmitter } from "./Emitters";
import BinaryWriter from "./BinaryWriter";
import GlobalBuilder from "./GlobalBuilder";
import InitExpressionType from './InitExpressionType'
import ValueType from "./ValueType";

/**
 * 
 */
export default class DataSegmentBuilder {

    /**
     * The  
     * @type {Uint8Array}
     */
    _data;

    /**
     * Emitter used to generate the initialization expression for the memory offset of the data segment.
     * @type {InitExpressionEmitter}
     */
    _initExpressionEmitter;

    /**
     * Creates an initializes a new DataSegmentBuilder.
     * @param {Uint8Array} data The data 
     */
    constructor(data) {
        this._data = data;
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

        this._initExpressionEmitter = new InitExpressionEmitter(InitExpressionType.Data, ValueType.Int32);
        if (callback) {
            callback(this._initExpressionEmitter);
            this._initExpressionEmitter.end();
        }

        return this._initExpressionEmitter;
    }

    /**
     * Sets the offset in memory where the data segment should begin.
     * @param {Object} value The value can either by an i32 constant, GlobalBuilder, or call back that generates the 
     * offset initialization expression using a parameter that gets passed in.
     */
    offset(value) {
        if (typeof value === "function") {
            this.createInitEmitter(value);
        }
        else if (value instanceof GlobalBuilder) {
            this.createInitEmitter(asm => {
                asm.get_global(value);
            });
        }
        else if (typeof value === 'number') {
            this.createInitEmitter(asm => {
                asm.const_i32(value);
            })
        }
        else {
            throw new Error('Unsupported offset')
        }
    }

    /**
     * Writes the object to a binary writer.
     * @param {BinaryWriter} writer The binary writer the object should be written to.
     */
    write(writer) {
        if (!this._initExpressionEmitter){
            throw new Error('The initialization expression was not defined.');
        }

        writer.writeVarUInt32(0);
        this._initExpressionEmitter.write(writer);
        writer.writeVarUInt32(this._data.length)
        writer.writeBytes(this._data);
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