import BinaryWriter from './BinaryWriter'

export default class ExportBuilder {
    constructor(name, externalKind, index){
        this.name = name;
        this.externalKind = externalKind;
        this.index = index; 
    }

    /**
     * Writes the byte representation of the object to a BinaryWriter.
     * @param {BinaryWriter} writer The writer the object will be written to.
     */
    write(writer){
        writer.writeVarUInt32(this.name.length);
        writer.writeString(this.name);
        writer.writeUInt8(this.externalKind.value);
        writer.writeVarUInt32(this.index);
    }

    toBytes(){
        const buffer = new BinaryWriter();
        this.writeBytes(buffer);
        return buffer.toArray();
    }
}