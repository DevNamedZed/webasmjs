import Arg from './Arg'
import BinaryModuleWriter from './BinaryModuleWriter'
import DataSegmentBuilder from './DataSegmentBuilder';
import ElementSegmentBuilder from './ElementSegmentBuilder';
import ElementType from './ElementType'
import ExportBuilder from './ExportBuilder';
import ExternalKind from './ExternalKind'
import FunctionBuilder from './FunctionBuilder'
import FuncTypeBuilder from './FuncTypeBuilder'
import GlobalBuilder from './GlobalBuilder';
import GlobalType from './GlobalType';
import ImportBuilder from './ImportBuilder';
import MemoryBuilder from './MemoryBuilder';
import ResizableLimits from './ResizableLimits';
import TableBuilder from './TableBuilder'
import TextModuleWriter from './TextModuleWriter'

/**
 * Used to construct a new web assembly module.
 */
export default class ModuleBuilder {

    static defaultOptions = { generateNameSection: true, disableVerification: false };

    _name;
    _types = [];
    _imports = [];
    _functions = [];
    _tables = [];
    _memories = [];
    _globals = [];
    _exports = [];
    _elements = [];
    _data = [];
    _customSections = [];
    _importsIndexSpace = {
        function: 0,
        table: 0,
        memory: 0,
        global: 0
    };
    _options;
    
    /**
     * Creates and initializes a new ModuleBuilder.
     * @param {String} name The name of the module.
     * @param {Object} options Additional options for the module.
     * @param {Object} options.generateNameSection Flag used to indicate whether the name section 
     * should be generated. Defaults to true
     * @param {Object} options.disableVerification Flag used to indicate verification should be disabled. 
     * Defaults to false.
     */
    constructor(name, options = { generateNameSection: true, disableVerification: false }) {
        Arg.notNull('name', name)

        this._name = name;
        this._options = options || ModuleBuilder.defaultOptions;
    }

    /**
     * Defines a new function type.
     * @param {ValueType[]} returnType An array of ValueTypes that represent the functions return values.
     * @param {ValueType[]} parameters An array of ValueTypes that represent the functions parameters.
     * @returns {FuncTypeBuilder} A  FuncTypeBuilder that can be used with a call_indirect instruction.
     */
    defineFuncType(returnTypes, parameters) {
        if (!returnTypes) {
            returnTypes = [];
        }
        else if (!Array.isArray(returnTypes)) {
            returnTypes = [returnTypes];
        }
        else {
            // Verify all
        }

        if (returnTypes.length > 1){
            throw new Error('A method can only return one to zero values.')
        }

        const funcTypeKey = FuncTypeBuilder.createKey(returnTypes, parameters);
        let funcType = this._types.find(x => x.key == funcTypeKey);
        if (!funcType) {
            funcType = new FuncTypeBuilder(funcTypeKey, returnTypes, parameters, this._types.length);
            this._types.push(funcType);
        }

        return funcType;
    }

    /**
     * Imports a function from another module.
     * @param {String} moduleName The name of the module.
     * @param {String} name The name of the function.
     * @param {ValueType[]} returnTypes A collection of value types that represent the functions return values.
     * @param {ValueType[]} parameters A collection of value types that represent the functions parameters values.
     * @returns {ImportBuilder} An ImportBuilder that can be used to reference the import. 
     */
    importFunction(moduleName, name, returnTypes, parameters) {
        const funcType = this.defineFuncType(returnTypes, parameters);
        if (this._imports.some(x =>
            x.externalKind === externalKind &&
            x.moduleName === moduleName &&
            x.field === field)) {
            throw new Error(`An import already existing for ${moduleName}.${name}`);
        }

        const importBuilder = new ImportBuilder(
            moduleName, 
            name, 
            ExternalKind.Function, 
            funcType,
            this._importsIndexSpace.function++);
        this._imports.push(importBuilder);
        this._functions.forEach(x => {
            x.index++;
        });

        return importBuilder;
    }

    importTable(moduleName, field) {
        return this.import(ExternalKind.Function, moduleName, field);
    }

    importMemory(moduleName, name) {
        return this.import(ExternalKind.Function, moduleName, field);
    }

    /**
     * Imports a global from another module.
     * @param {String} moduleName The name of the module.
     * @param {String} name The name of the global 
     * @param {ValueType} valueType The type of the value stored in the global.
     * @param {Boolean} mutable A flag used to indicate whether the global is mutable.
     * @returns {ImportBuilder} An ImportBuilder that can be used to reference the import. 
     */
    importGlobal(moduleName, name, valueType, mutable) {
        if (this._imports.some(x =>
            x.externalKind === ExternalKind.Global &&
            x.moduleName === moduleName &&
            x.field === field)) {
            throw new Error(`An import already existing for ${moduleName}.${name}`);
        }

        const globalType = new GlobalType(valueType, mutable);
        const importBuilder = new ImportBuilder(
            moduleName, 
            name, 
            ExternalKind.Global, 
            globalType,
            this._importsIndexSpace.global++);
        this._imports.push(importBuilder);
        this._globals.forEach(x => {
            x.index++;
        });

        return importBuilder;
    }

    /**
     * Defines a new function in the module.
     * @param {String} name The name of the function.
     * @param {ValueType[]} returnTypes A collection of value types that represent the functions return values.
     * @param {ValueType[]} parameters A collection of value types that represent the functions parameters values.
     * @param {Object} options Optional parameters for the function.
     * @returns {FunctionBuilder} A new function builder.
     */
    defineFunction(name, returnTypes, parameters, options = { export: false }) {
        const existing = this._functions.find(x => x.name === name);
        if (existing) {
            throw new Error(`Function has already been defined with the name ${name}`);
        }

        const funcType = this.defineFuncType(returnTypes, parameters);
        const functionBuilder = new FunctionBuilder(
            name, 
            funcType, 
            this._functions.length + this._importsIndexSpace.function, 
            {...options, disableVerification: this._options.disableVerification});
        this._functions.push(functionBuilder);

        if (options && options.export) {
            const exportBuilder = new ExportBuilder(name, ExternalKind.Function, functionBuilder.index);
            this._exports.push(exportBuilder);
        }

        return functionBuilder;
    }

    /**
     * Defines a new table in the module.
     * @param {ElementType} elementType The type of element that will be stored in the table.
     * @param {Number} initialSize The initial size of the table.
     * @param {Number} maximumSize Optional maximum size of the table
     * @returns {TableBuilder}
     */
    defineTable(elementType, initialSize, maximumSize = null){
        if (this._tables.length === 1){
            throw new Error('Only one table can be created per module.')
        }

        const table = new TableBuilder(
            this,
            elementType, 
            new ResizableLimits(initialSize, maximumSize), 
            this._tables.length + this._importsIndexSpace.table);
        this._tables.push(table);
        return table;
    }

    /**
     * Defines a new memory section in the module.
     * @param {Number} initialSize The initial size of the memory in pages.
     * @param {Number} maximumSize Optional maximum size of the memory in pages.
     * @returns {MemoryBuilder} A memory builder that can used to references the memory.
     */
    defineMemory(initialSize, maximumSize = null){
        if (this._memories.length === 1){
            throw new Error('Only one memory can be created per module.')
        }

        const memory = new MemoryBuilder(
            new ResizableLimits(initialSize, maximumSize), 
            this._memories.length + this._importsIndexSpace.memory);
        this._memories.push(memory);
        return memory;
    }
    
    /**
     * Defines a new global in the module.
     * @param {ValueType} valueType The type of the global.
     * @param {Boolean} mutable A flag used to indicate whether the global is mutable.
     * @param {Object} value The value can either by a constant, GlobalBuilder, or call back that generates the 
     * initialization expression using a parameter that gets passed in.
     */
    defineGlobal(valueType, mutable, value){
        const globalBuilder = new GlobalBuilder(
            valueType, 
            mutable, 
            this._globals.length + this._importsIndexSpace.global);
        if (value){
            globalBuilder.value(value);
        }
        
        this._globals.push(globalBuilder);
        return globalBuilder;
    }
    
    exportFunction(functionBuilder, name = null) {
        const exportBuilder = new ExportBuilder(name, ExternalKind.Function, functionBuilder.index);
        this._exports.push(exportBuilder);

    }

    exportMemory(){
    }

    exportTable(){
    }

    exportGlobal(){        
    }

    /**
     * Creates a new table element segment.
     * @param {*} table 
     * @param {(FunctionBuilder | ImportBuilder)[]} elements Collection of functions either declared in 
     * this module or imported from other modules.
     * @param {Object} offset The value can either by an i32 constant, GlobalBuilder, or call back that generates the 
     * offset initialization expression using an InitExpressionEmitter parameter that gets passed in.
     * @returns {ElementSegmentBuilder}
     */
    defineTableSegment(table, elements, offset){
        const segment = new ElementSegmentBuilder(table, elements);
        if (offset || offset === 0){
            segment.offset(offset)
        }

        this._elements.push(segment);
    }

    /**
     * 
     * @param {*} data 
     * @param {*} offset 
     */
    defineData(data, offset){        
        const dataSegmentBuilder = new DataSegmentBuilder(data);
        if (offset || offset === 0){
            dataSegmentBuilder.offset(offset);
        }

        this._data.push(dataSegmentBuilder);
    }

    defineCustomSection(name, data){        
    }

    /**
     * Compiles and instantiates the module, returning an object containing the compiled module
     * and instance an instance of the module. 
     * @param {Object} imports Optional object with the imports.
     * @returns {Object} The result object.
     */
    instantiate(imports) {
        const moduleBytes = this.toBytes();
        return WebAssembly.instantiate(moduleBytes, imports);
    }

    /**
     * Compiles to the runtime runtime representation of a module.
     * @returns {Object} The compiled module.
     */
    compile(){
        const moduleBytes = this.toBytes();
        return WebAssembly.compile(moduleBytes)
    }

    /**
     * Creates the string representation of the module.
     * @returns {String} The string representation of the module.
     */
    toString() {
        const writer = new TextModuleWriter(this);
        return writer.toArray();
    }

    /**
     * Creates the byte representation of the module.
     * @returns {Uint8Array} The byte representation of the module.
     */
    toBytes() {
        const writer = new BinaryModuleWriter(this);
        return writer.write();
    }
}