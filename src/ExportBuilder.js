import BinaryWriter from './BinaryWriter'
import ExternalKind from './ExternalKind'

export default class ExportBuilder {
    /**
     * 
     * @param {*} name 
     * @param {ExternalKind} externalKind 
     * @param {*} data 
     */
    constructor(name, externalKind, data){
        this.name = name;
        this.externalKind = externalKind;
        this.data = data; 
    }

    /**
     * Writes the byte representation of the object to a BinaryWriter.
     * @param {BinaryWriter} writer The writer the object will be written to.
     */
    write(writer){
        writer.writeVarUInt32(this.name.length);
        writer.writeString(this.name);
        writer.writeUInt8(this.externalKind.value);
        switch (this.externalKind){
            case ExternalKind.Function:
            case ExternalKind.Global:
            case ExternalKind.Memory:
            case ExternalKind.Table:
                writer.writeVarUInt32(this.data._index);
                break;
        }
    }

    toBytes(){
        const buffer = new BinaryWriter();
        this.writeBytes(buffer);
        return buffer.toArray();
    }
}