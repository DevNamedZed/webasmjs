import ResizableLimits from './ResizableLimits'
import MemoryType from './MemoryType';

export default class MemoryBuilder {
    /**
     * 
     * @param {ResizableLimits} resizableLimits 
     * @param {Number} index 
     */
    constructor(resizableLimits, index){
        this._memoryType = new MemoryType(resizableLimits);
        this._index = index;
    }

    write(writer){
        this._memoryType.write(writer);
    }

    toBytes(){
        const buffer = new BinaryWriter();
        this.writeBytes(buffer);
        return buffer.toArray();
    }
}