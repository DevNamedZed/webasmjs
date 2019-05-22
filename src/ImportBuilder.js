import BinaryWriter from './BinaryWriter'
import ExternalKind from './ExternalKind';
import GlobalType from './GlobalType';
import FuncTypeBuilder from './FuncTypeBuilder';

/**
 * Represents an import of a function, global, memory, or table from another module.
 */
export default class ImportBuilder {
    /**
     * Creates an initializes a new ImportBuilder.
     * @param {String} moduleName The name of the module. 
     * @param {String} fieldName 
     * @param {ExternalKind} externalKind 
     * @param {Number | FuncTypeBuilder| GlobalType} data 
     * @param {*} index 
     */
    constructor(moduleName, fieldName, externalKind, data, index){
        this.moduleName = moduleName;
        this.fieldName = fieldName;
        this.externalKind = externalKind;
        this.data = data;
        this.index = index;
    }

    /**
     * Writes the byte representation of the object to a BinaryWriter.
     * @param {BinaryWriter} writer The writer the object will be written to.
     */
    write(writer){
        writer.writeVarUInt32(this.moduleName.length);
        writer.writeString(this.moduleName);
        writer.writeVarUInt32(this.fieldName.length);
        writer.writeString(this.fieldName);
        writer.writeUInt8(this.externalKind.value);
        switch (this.externalKind){
            case ExternalKind.Function:
                writer.writeVarUInt32(this.data.value);
                break;

            case ExternalKind.Global:
            case ExternalKind.Memory:
            case ExternalKind.Table:
                this.data.write(writer);
                break;

            default:
                throw new Error('Unknown external kind.');
        }
    }

    toBytes(){
        const buffer = new BinaryWriter();
        this.writeBytes(buffer);
        return buffer.toArray();
    }
}