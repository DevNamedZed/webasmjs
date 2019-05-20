import ElementType from './ElementType'
import ResizableLimits from './ResizableLimits'
import ModuleBuilder from './ModuleBuilder';

export default class MemoryBuilder {
    /**
     * 
     * @param {*} resizableLimits 
     * @param {*} index 
     */
    constructor(resizableLimits, index){
        this.resizableLimits = resizableLimits;
        this.index = index;
    }

    write(writer){
        this.resizableLimits.write(writer);
    }

    toBytes(){
        const buffer = new BinaryWriter();
        this.writeBytes(buffer);
        return buffer.toArray();
    }
}