import ElementType from './ElementType'
import ResizableLimits from './ResizableLimits'

/**
 * Describes a table that is either defined in the module or imported from another module.
 */
export default class TableType {
    /**
     * Creates and initializes a new TableType.
     * @param {ElementType} elementType The type of elements that will be stored in the tables.
     * @param {ResizableLimits} resizableLimits 
     */
    constructor(elementType, resizableLimits){
        this._elementType = elementType;
        this._resizableLimits = resizableLimits;
    }

    /**
     * Writes the object to a binary writer.
     * @param {BinaryWriter} writer The binary writer the object should be written to.
     */
    write(writer){
        writer.writeVarUInt32(this._elementType.value);
        this._resizableLimits.write(writer);
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