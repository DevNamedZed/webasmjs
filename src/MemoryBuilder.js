import ResizableLimits from './ResizableLimits'
import ModuleBuilder from './ModuleBuilder';
import MemoryType from './MemoryType';

export default class MemoryBuilder {
    /**
     * 
     * @param {ModuleBuilder} moduleBuilder
     * @param {ResizableLimits} resizableLimits 
     * @param {Number} index 
     */
    constructor(moduleBuilder, resizableLimits, index){
        this._moduleBuilder = moduleBuilder;
        this._memoryType = new MemoryType(resizableLimits);
        this._index = index;
    }

    withExport(name){
        this._moduleBuilder.exportMemory(this, name);
        return this;
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