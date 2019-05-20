import Arg from './Arg';
import ResizableLimits from './ResizableLimits'

/**
 * Describes memory that is either defined in the module or imported from another module.
 */
export default class MemoryType {
    /**
     * Creates and initializes a new MemoryType
     * @param {ResizableLimits} resizableLimits The memory limits.
     */
    constructor(resizableLimits){
        Arg.instanceOf('resizableLimits', resizableLimits, ResizableLimits);

        this.resizableLimits = resizableLimits;
    }

    /**
     * Writes the object to a binary writer.
     * @param {BinaryWriter} writer The binary writer the object should be written to.
     */
    write(writer){
        this.resizableLimits.write(writer);
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