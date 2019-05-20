import Arg from "./Arg";
import BinaryWriter from "./BinaryWriter";
import Immediate from "./Immediate";
import OpCodes from "./OpCodes";

export default class Instruction {
    opCode;
    immediate;

    /**
     * Creates an initializes a new Instruction.
     * @param {OpCodes} opCode The op code associated with this instruction. 
     * @param {Immediate} immediate The immediate operand associated with the instructions.
     */
    constructor(opCode, immediate){
        Arg.notNull('opCode', opCode);

        this.opCode = opCode;
        this.immediate = immediate;
    }

    /**
     * Writes the object to a binary writer.
     * @param {BinaryWriter} writer The binary writer the object should be written to.
     */
    write(writer){
        writer.writeByte(this.opCode.value);
        if (this.immediate){
            this.immediate.writeBytes(writer);
        }
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