import Arg from './Arg';
import GlobalBuilder from './GlobalBuilder'
import { InitExpressionEmitter } from "./Emitters";
import TableBuilder from './TableBuilder'
import FunctionBuilder from './FunctionBuilder';
import ImportBuilder from './ImportBuilder';
import InitExpressionType from './InitExpressionType';
import ValueType from './ValueType';

/**
 * Callback for emitting the initialize expression.
 * @callback emitInitCallback
 * @param {InitExpressionEmitter} asm The emitter used to generate the expression body.
 */

/**
 * Initializes a segment of elements in a table.
 */
export default class ElementSegmentBuilder {

    _table;
    _functions = [];
    _initExpressionEmitter;

    /**
     * Creates a initializes a new ElementSegmentBuilder.
     * @param {TableBuilder} table The table this element segment initializes.
     * @param {(FunctionBuilder | ImportBuilder)[]} functions Collection of functions either declared in
     * this module or imported from other modules.
     */
    constructor(table, functions) {
        this._table = table;
        this._functions = functions;
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

        this._initExpressionEmitter = new InitExpressionEmitter(InitExpressionType.Element, ValueType.Int32);
        if (callback) {
            callback(this._initExpressionEmitter);
            this._initExpressionEmitter.end();
        }

        return this._initExpressionEmitter;
    }

    /**
     * Sets the offset in the table where the table should begin.
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
            this.createInitEmitter(asm =>{
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

        writer.writeVarUInt32(this._table.index);
        this._initExpressionEmitter.write(writer);
        writer.writeVarUInt32(this._functions.length);
        this._functions.forEach(x => {
            writer.writeVarUInt32(x.index);
        });
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