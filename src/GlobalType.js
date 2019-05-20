import BinaryWriter from './BinaryWriter'
import ValueType from './ValueType'

/**
 * Describes a global declared in the module or referenced from another module.
 */
export default class GlobalType {

    /**
     * Creates and initializes a new GlobalType.
     * @param {ValueType} valueType 
     * @param {Boolean} mutable 
     */
    constructor(valueType, mutable){
        this._valueType = valueType;
        this._mutable = mutable;
    }

    /**
     * Gets the type for the global.
     * @type {ValueType} 
     */
    get valueType() {
        return this._valueType;
    }

    /**
     * Gets a value indicating whether the global is mutable.
     * @type {Boolean} 
     */
    get mutable() {
        return this._mutable;
    }
    
    /**
     * Writes the object to a binary writer.
     * @param {BinaryWriter} writer The binary writer the object should be written to.
     */
    write(writer){
        writer.writeVarInt7(this._valueType.value);
        writer.writeVarUInt1(this._mutable ? 1 : 0);
    }
    
    /**
     * Creates a byte representation of the object.
     * @returns {Uint8Array} The byte representation of the object.
     */
    toBytes(){
        const buffer = new BinaryWriter();
        this.writeBytes(buffer);
        return buffer.toArray();
    }
}