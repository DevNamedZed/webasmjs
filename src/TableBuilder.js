import ElementType from './ElementType'
import ResizableLimits from './ResizableLimits'
import ModuleBuilder from './ModuleBuilder';
import { FunctionBuilder } from '.';
import TableType from './TableType';

export default class TableBuilder {
    /**
     * 
     * @param {ModuleBuilder} moduleBuilder 
     * @param {ElementType} elementType 
     * @param {ResizableLimits} resizableLimits 
     * @param {Number} index 
     */
    constructor(moduleBuilder, elementType, resizableLimits, index){
        this._moduleBuilder = moduleBuilder;
        this._tableType = new TableType(elementType, resizableLimits);
        this._index = index;
    }
    
    get elementType(){
        return this._tableType._elementType;
    }

    get resizableLimits(){
        return this._tableType._resizableLimits;
    }

    /**
     * Defines a new element segment in the table, used to initialize the a
     * @param {FunctionBuilder} elements The elements the table should be initialized with. 
     * @param {*} offset 
     */
    defineTableSegment(elements, offset){
        return this._moduleBuilder.defineTableSegment(this, elements, offset);
    }
    
    /**
     * Writes the object to a binary writer.
     * @param {BinaryWriter} writer The binary writer the object should be written to.
     */
    write(writer){
        this._tableType.write(writer);
    }

    /**
     * Creates a byte representation of the object.
     * @returns {Uint8Array} The byte representation of the object.
     */
    toBytes(){
        const buffer = new BinaryWriter();
        this.writeBytes(buffer);
        return buffer.toArray();
    }
}