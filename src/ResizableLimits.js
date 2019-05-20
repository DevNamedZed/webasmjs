import BinaryWriter from './BinaryWriter'

export default class ResizableLimits {
    constructor(initial, maximum){
        this.initial = initial;
        this.maximum = maximum;
    }

    write(writer){
        writer.writeVarUInt1(this.maximum ? 1 : 0);
        writer.writeVarUInt32(this.initial);
        if (this.maximum){
            writer.writeVarUInt32(this.maximum);
        }
    }

    toBytes(){
        const buffer = new BinaryWriter();
        this.writeBytes(buffer);
        return buffer.toArray();
    }
}