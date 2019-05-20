import BinaryWriter from './BinaryWriter'

export default class LocalBuilder {
    /**
     * Creates and initializes a new local builder.
     * @param {ValueType} valueType The type of the value that will be stored in the local.
     * @param {*} name 
     * @param {*} index 
     * @param {*} count 
     */
    constructor(valueType, name, index, count){
        this.index = index;
        this.valueType = valueType;
        this.name = name;
        this.count = count;
    }

    write(writer){
        writer.writeVarUInt32(this.count);
        writer.writeVarInt7(this.valueType.value);
    }

    toBytes(){
        const buffer = new BinaryWriter();
        this.writeBytes(buffer);
        return buffer.toArray();
    }
}