import ElementType from './ElementType'
import ResizableLimits from './ResizableLimits'
import ModuleBuilder from './ModuleBuilder';

export default class TableBuilder {
    /**
     * 
     * @param {ModuleBuilder} moduleBuilder 
     * @param {*} elementType 
     * @param {*} resizableLimits 
     * @param {*} index 
     */
    constructor(moduleBuilder, elementType, resizableLimits, index){
        this.moduleBuilder = moduleBuilder;
        this.elementType = elementType;
        this.resizableLimits = resizableLimits;
        this.index = index;
    }

    defineTableSegment(elements, offset){
        return this.moduleBuilder.defineTableSegment(this, elements, offset);
    }

    write(writer){
        writer.writeVarUInt32(this.elementType.value);
        this.resizableLimits.write(writer);
    }

    toBytes(){
        const buffer = new BinaryWriter();
        this.writeBytes(buffer);
        return buffer.toArray();
    }
}