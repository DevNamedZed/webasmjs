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
import CustomSectionBuilder from './CustomSectionBuilder';
import { FunctionEmitter } from './Emitters'
import MemoryType from './MemoryType';
import TableType from './TableType';


/**
 * Callback for creating a function.
 * @callback createFunctionCallback
 * @param {FunctionBuilder} func The function that is being created.
 * @param {FunctionEmitter} asm The emitter used to generate the function body.
 */

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

    /**
     * @type {DataSegmentBuilder[]}
     */
    _data = [];

    /**
     * @type {CustomSectionBuilder[]}
     */
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

        if (returnTypes.length > 1) {
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
    
    /**
     * Imports a table from another module.
     * @param {String} moduleName The name of the module.
     * @param {String} name The name of the global 
     * @param {ElementType} elementType The type of element that is stored in the table.
     * @param {Number} initialSize The initial size of the table.
     * @param {Number} maximumSize Optional maximum size of the table
     * @returns {ImportBuilder} An ImportBuilder that can be used to reference the import. 
     */
    importTable(moduleName, field, elementType, initialSize, maximumSize = null) {
        if (this._imports.find(x =>
            x.externalKind === ExternalKind.Table &&
            x.moduleName === moduleName &&
            x.field === field)) {
            throw new Error(`An import already existing for ${moduleName}.${name}`);
        }

        const tableType = new TableType(elementType, new ResizableLimits(initialSize, maximumSize));
        const importBuilder = new ImportBuilder(
            moduleName,
            name,
            ExternalKind.Table,
            tableType,
            this._importsIndexSpace.table++);
        this._imports.push(importBuilder);
        this._globals.forEach(x => {
            x.index++;
        });

        return importBuilder;   
    }
    
    /**
     * Imports memory from another module.
     * @param {String} moduleName The name of the module.
     * @param {String} name The name of the global 
     * @param {Number} initialSize The initial size of the memory in pages.
     * @param {Number} maximumSize Optional maximum size of the memory in pages.
     * @returns {ImportBuilder} An ImportBuilder that can be used to reference the import. 
     */
    importMemory(moduleName, name, initialSize, maximumSize = null) {
        if (this._imports.find(x =>
            x.externalKind === ExternalKind.Global &&
            x.moduleName === moduleName &&
            x.field === field)) {
            throw new Error(`An import already existing for ${moduleName}.${name}`);
        }

        const memoryType = new MemoryType(new ResizableLimits(initialSize, maximumSize));
        const importBuilder = new ImportBuilder(
            moduleName,
            name,
            ExternalKind.Memory,
            memoryType,
            this._importsIndexSpace.memory++);
        this._imports.push(importBuilder);
        this._globals.forEach(x => {
            x.index++;
        });

        return importBuilder;   
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
     * @param {createFunctionCallback} createCallback
     * @returns {FunctionBuilder} A new function builder.
     */
    defineFunction(name, returnTypes, parameters, options = { export: false }, createCallback = null) {
        const existing = this._functions.find(x => x.name === name);
        if (existing) {
            throw new Error(`Function has already been defined with the name ${name}`);
        }

        const funcType = this.defineFuncType(returnTypes, parameters);
        const functionBuilder = new FunctionBuilder(
            name,
            funcType,
            this._functions.length + this._importsIndexSpace.function,
            { ...options, disableVerification: this._options.disableVerification });
        this._functions.push(functionBuilder);

        if (options && options.export) {
            const exportBuilder = new ExportBuilder(name, ExternalKind.Function, functionBuilder);
            this._exports.push(exportBuilder);
        }

        if (createCallback) {
            functionBuilder.createAssemblyEmitter(x => {
                createCallback(functionBuilder, x);
            });
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
    defineTable(elementType, initialSize, maximumSize = null) {
        if (this._tables.length === 1) {
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
    defineMemory(initialSize, maximumSize = null) {
        if (this._memories.length === 1) {
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
    defineGlobal(valueType, mutable, value) {
        const globalBuilder = new GlobalBuilder(
            valueType,
            mutable,
            this._globals.length + this._importsIndexSpace.global);
        if (value) {
            globalBuilder.value(value);
        }

        this._globals.push(globalBuilder);
        return globalBuilder;
    }

    /**
     * Marks a function for export making it callable outside the module.
     * @param {FunctionBuilder} functionBuilder The function to export.
     * @param {String} name The name for the export, if this is not provided the function name will be used. 
     * @returns {ExportBuilder} 
     */
    exportFunction(functionBuilder, name = null) {
        Arg.instanceOf('functionBuilder', functionBuilder, functionBuilder);

        const functionName = name || functionBuilder.name;
        Arg.notEmptyString('name', functionName);

        if (this._exports.find(x =>
            x.externalKind === ExternalKind.Function &&
            x.field === functionName)) {
            throw new Error(`An export already existing for a function named ${name}.`);
        }

        const exportBuilder = new ExportBuilder(functionName, ExternalKind.Function, functionBuilder);
        this._exports.push(exportBuilder);
        return exportBuilder;
    }

    /**
     * Marks memory for export making it accessible outside the module.
     * @param {MemoryBuilder} memoryBuilder A MemoryBuilder that represents the memory to export.
     * @param {String} name The name of the export.
     * @returns {ExportBuilder} 
     */
    exportMemory(memoryBuilder, name) {
        Arg.notEmptyString('name', name);
        Arg.instanceOf('memoryBuilder', memoryBuilder, MemoryBuilder);

        if (this._exports.find(x =>
            x.externalKind === ExternalKind.Memory &&
            x.field === name)) {
            throw new Error(`An export already existing for memory named ${name}.`);
        }

        const exportBuilder = new ExportBuilder(name, ExternalKind.Memory, memoryBuilder);
        this._exports.push(exportBuilder);
        return exportBuilder;
    }

    /**
     * Marks table for export making it accessible out the module.
     * @param {TableBuilder} tableBuilder A TableBuilder that represents the table to export.
     * @param {NamedCurve} name The name of the table.
     * @returns {ExportBuilder}  
     */
    exportTable(tableBuilder, name) {
        Arg.notEmptyString('name', name);
        Arg.instanceOf('tableBuilder', tableBuilder, TableBuilder);

        if (this._exports.find(x =>
            x.externalKind === ExternalKind.Table &&
            x.field === name)) {
            throw new Error(`An export already existing for a table named ${name}.`);
        }

        const exportBuilder = new ExportBuilder(name, ExternalKind.Table, tableBuilder);
        this._exports.push(exportBuilder);
        return exportBuilder;
    }

    /**
     * Marks a global for export making it accessible outside the module.
     * @param {GlobalBuilder} functionBuilder The global to export.
     * @param {String} name The name for the export, if this is not provided the function name will be used. 
     * @returns {ExportBuilder} 
     */
    exportGlobal(globalBuilder, name) {
        Arg.notEmptyString('name', name);
        Arg.instanceOf('globalBuilder', globalBuilder, GlobalBuilder);

        if (this._exports.find(x =>
            x.externalKind === ExternalKind.Global &&
            x.field === name)) {
            throw new Error(`An export already existing for a global named ${name}.`);
        }

        const exportBuilder = new ExportBuilder(name, ExternalKind.Global, globalBuilder);
        this._exports.push(exportBuilder);
        return exportBuilder;
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
    defineTableSegment(table, elements, offset) {
        const segment = new ElementSegmentBuilder(table, elements);
        if (offset || offset === 0) {
            segment.offset(offset)
        }

        this._elements.push(segment);
    }

    /**
     * Creates a new data section.
     * @param {Uint8Array} data A byte array of the data that will be written in the section.
     * @param {Object} offset The value can either by an i32 constant, GlobalBuilder, or call back that generates the 
     * offset initialization expression using an InitExpressionEmitter parameter that gets passed in.     
     * @returns {DataSegmentBuilder}
     * */
    defineData(data, offset) {
        Arg.instanceOf('data', data, Uint8Array);

        const dataSegmentBuilder = new DataSegmentBuilder(data);
        if (offset || offset === 0) {
            dataSegmentBuilder.offset(offset);
        }

        this._data.push(dataSegmentBuilder);
        return dataSegmentBuilder;
    }

    /**
     * Defines a new custom section.
     * @param {String} name The name of the custom section.
     * @param {Uint8Array} data The data to write in the custom section.
     * @returns {CustomSectionBuilder}
     */
    defineCustomSection(name, data) {
        Arg.notEmptyString('name', name);

        if (this._customSections.find(x => x.name === name)){
            throw new Error(`A custom section already exists with the name ${name}.`);
        }

        if (name === "name"){
            throw new Error("The 'name' custom section is reserved.");
        }

        const customSectionBuilder = new CustomSectionBuilder(name, data);
        this._customSections.push(customSectionBuilder);
        return customSectionBuilder;
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
    compile() {
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