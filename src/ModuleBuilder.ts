import Arg from './Arg';
import BinaryModuleWriter from './BinaryModuleWriter';
import DataSegmentBuilder from './DataSegmentBuilder';
import ElementSegmentBuilder from './ElementSegmentBuilder';
import ExportBuilder from './ExportBuilder';
import {
  ExternalKind,
  ElementTypeDescriptor,
  ValueTypeDescriptor,
  ModuleBuilderOptions,
  WasmFeature,
  WasmTarget,
} from './types';
import FunctionBuilder from './FunctionBuilder';
import FuncTypeBuilder from './FuncTypeBuilder';
import GlobalBuilder from './GlobalBuilder';
import GlobalType from './GlobalType';
import ImportBuilder from './ImportBuilder';
import MemoryBuilder from './MemoryBuilder';
import MemoryType from './MemoryType';
import ResizableLimits from './ResizableLimits';
import TableBuilder from './TableBuilder';
import TableType from './TableType';
import TextModuleWriter from './TextModuleWriter';
import TagBuilder from './TagBuilder';
import CustomSectionBuilder from './CustomSectionBuilder';
import FunctionEmitter from './FunctionEmitter';
import VerificationError from './verification/VerificationError';

export default class ModuleBuilder {
  static defaultOptions: ModuleBuilderOptions = {
    generateNameSection: true,
    disableVerification: false,
  };

  static readonly targetFeatures: Record<WasmTarget, WasmFeature[]> = {
    'mvp': [],
    '2.0': ['sign-extend', 'sat-trunc', 'bulk-memory', 'reference-types', 'multi-value', 'mutable-globals'],
    '3.0': ['sign-extend', 'sat-trunc', 'bulk-memory', 'reference-types', 'multi-value', 'mutable-globals',
            'simd', 'tail-call', 'exception-handling', 'threads', 'multi-memory', 'multi-table', 'memory64', 'extended-const'],
    'latest': ['sign-extend', 'sat-trunc', 'bulk-memory', 'reference-types', 'multi-value', 'mutable-globals',
               'simd', 'tail-call', 'exception-handling', 'threads', 'multi-memory', 'multi-table', 'memory64', 'extended-const',
               'relaxed-simd', 'gc'],
  };

  _name: string;
  _types: FuncTypeBuilder[] = [];
  _imports: ImportBuilder[] = [];
  _functions: FunctionBuilder[] = [];
  _tables: TableBuilder[] = [];
  _memories: MemoryBuilder[] = [];
  _globals: GlobalBuilder[] = [];
  _exports: ExportBuilder[] = [];
  _elements: ElementSegmentBuilder[] = [];
  _data: DataSegmentBuilder[] = [];
  _tags: TagBuilder[] = [];
  _customSections: CustomSectionBuilder[] = [];
  _startFunction: FunctionBuilder | null = null;
  _importsIndexSpace = {
    function: 0,
    table: 0,
    memory: 0,
    global: 0,
  };
  _options: ModuleBuilderOptions;
  _resolvedFeatures: Set<WasmFeature>;

  constructor(
    name: string,
    options: ModuleBuilderOptions = { generateNameSection: true, disableVerification: false }
  ) {
    Arg.notNull('name', name);
    this._name = name;
    this._options = options || ModuleBuilder.defaultOptions;
    this._resolvedFeatures = ModuleBuilder._resolveFeatures(this._options);
  }

  static _resolveFeatures(options: ModuleBuilderOptions): Set<WasmFeature> {
    const target = options.target || 'latest';
    const baseFeatures = ModuleBuilder.targetFeatures[target];
    const extra = options.features || [];
    return new Set([...baseFeatures, ...extra]);
  }

  get features(): Set<WasmFeature> {
    return this._resolvedFeatures;
  }

  hasFeature(feature: WasmFeature): boolean {
    return this._resolvedFeatures.has(feature);
  }

  get disableVerification(): boolean {
    return this._options && this._options.disableVerification === true;
  }

  defineFuncType(
    returnTypes: ValueTypeDescriptor[] | ValueTypeDescriptor | null,
    parameters: ValueTypeDescriptor[]
  ): FuncTypeBuilder {
    let normalizedReturnTypes: ValueTypeDescriptor[];
    if (!returnTypes) {
      normalizedReturnTypes = [];
    } else if (!Array.isArray(returnTypes)) {
      normalizedReturnTypes = [returnTypes];
    } else {
      normalizedReturnTypes = returnTypes;
    }

    if (normalizedReturnTypes.length > 1 && !this._resolvedFeatures.has('multi-value')) {
      throw new Error('A method can only return zero to one values. Enable the multi-value feature to allow multiple return values.');
    }

    const funcTypeKey = FuncTypeBuilder.createKey(normalizedReturnTypes, parameters);
    let funcType = this._types.find((x) => x.key === funcTypeKey);
    if (!funcType) {
      funcType = new FuncTypeBuilder(
        funcTypeKey,
        normalizedReturnTypes,
        parameters,
        this._types.length
      );
      this._types.push(funcType);
    }

    return funcType;
  }

  importFunction(
    moduleName: string,
    name: string,
    returnTypes: ValueTypeDescriptor[] | ValueTypeDescriptor | null,
    parameters: ValueTypeDescriptor[]
  ): ImportBuilder {
    const funcType = this.defineFuncType(returnTypes, parameters);
    if (
      this._imports.some(
        (x) =>
          x.externalKind === ExternalKind.Function &&
          x.moduleName === moduleName &&
          x.fieldName === name
      )
    ) {
      throw new Error(`An import already existing for ${moduleName}.${name}`);
    }

    const importBuilder = new ImportBuilder(
      moduleName,
      name,
      ExternalKind.Function,
      funcType,
      this._importsIndexSpace.function++
    );
    this._imports.push(importBuilder);
    this._functions.forEach((x) => {
      x._index++;
    });

    return importBuilder;
  }

  importTable(
    moduleName: string,
    name: string,
    elementType: ElementTypeDescriptor,
    initialSize: number,
    maximumSize: number | null = null
  ): ImportBuilder {
    if (
      this._imports.find(
        (x) =>
          x.externalKind === ExternalKind.Table &&
          x.moduleName === moduleName &&
          x.fieldName === name
      )
    ) {
      throw new Error(`An import already existing for ${moduleName}.${name}`);
    }

    const tableType = new TableType(
      elementType,
      new ResizableLimits(initialSize, maximumSize)
    );
    const importBuilder = new ImportBuilder(
      moduleName,
      name,
      ExternalKind.Table,
      tableType,
      this._importsIndexSpace.table++
    );
    this._imports.push(importBuilder);
    this._tables.forEach((x) => {
      x._index++;
    });

    return importBuilder;
  }

  importMemory(
    moduleName: string,
    name: string,
    initialSize: number,
    maximumSize: number | null = null,
    shared: boolean = false
  ): ImportBuilder {
    Arg.string('moduleName', moduleName);
    Arg.string('name', name);
    Arg.number('initialSize', initialSize);

    if (
      this._imports.find(
        (x) =>
          x.externalKind === ExternalKind.Memory &&
          x.moduleName === moduleName &&
          x.fieldName === name
      )
    ) {
      throw new Error(`An import already existing for ${moduleName}.${name}`);
    }

    if ((this._memories.length !== 0 || this._importsIndexSpace.memory !== 0) && !this._resolvedFeatures.has('multi-memory')) {
      throw new VerificationError('Only one memory is allowed per module. Enable the multi-memory feature to allow multiple memories.');
    }

    const memoryType = new MemoryType(new ResizableLimits(initialSize, maximumSize), shared);
    const importBuilder = new ImportBuilder(
      moduleName,
      name,
      ExternalKind.Memory,
      memoryType,
      this._importsIndexSpace.memory++
    );
    this._imports.push(importBuilder);

    return importBuilder;
  }

  importGlobal(
    moduleName: string,
    name: string,
    valueType: ValueTypeDescriptor,
    mutable: boolean
  ): ImportBuilder {
    if (
      this._imports.some(
        (x) =>
          x.externalKind === ExternalKind.Global &&
          x.moduleName === moduleName &&
          x.fieldName === name
      )
    ) {
      throw new Error(`An import already existing for ${moduleName}.${name}`);
    }

    const globalType = new GlobalType(valueType, mutable);
    const importBuilder = new ImportBuilder(
      moduleName,
      name,
      ExternalKind.Global,
      globalType,
      this._importsIndexSpace.global++
    );
    this._imports.push(importBuilder);
    this._globals.forEach((x) => {
      x._index++;
    });

    return importBuilder;
  }

  defineFunction(
    name: string,
    returnTypes: ValueTypeDescriptor[] | ValueTypeDescriptor | null,
    parameters: ValueTypeDescriptor[],
    createCallback?: (func: FunctionBuilder, asm: FunctionEmitter) => void
  ): FunctionBuilder {
    const existing = this._functions.find((x) => x.name === name);
    if (existing) {
      throw new Error(`Function has already been defined with the name ${name}`);
    }

    const funcType = this.defineFuncType(returnTypes, parameters);
    const functionBuilder = new FunctionBuilder(
      this,
      name,
      funcType,
      this._functions.length + this._importsIndexSpace.function
    );
    this._functions.push(functionBuilder);

    if (createCallback) {
      functionBuilder.createEmitter((x) => {
        createCallback(functionBuilder, x);
      });
    }

    return functionBuilder;
  }

  defineTable(
    elementType: ElementTypeDescriptor,
    initialSize: number,
    maximumSize: number | null = null
  ): TableBuilder {
    if (this._tables.length >= 1 && !this._resolvedFeatures.has('multi-table')) {
      throw new Error('Only one table can be created per module. Enable the multi-table feature to allow multiple tables.');
    }

    const table = new TableBuilder(
      this,
      elementType,
      new ResizableLimits(initialSize, maximumSize),
      this._tables.length + this._importsIndexSpace.table
    );
    this._tables.push(table);
    return table;
  }

  defineMemory(initialSize: number, maximumSize: number | null = null, shared: boolean = false, memory64: boolean = false): MemoryBuilder {
    if ((this._memories.length !== 0 || this._importsIndexSpace.memory !== 0) && !this._resolvedFeatures.has('multi-memory')) {
      throw new VerificationError('Only one memory is allowed per module. Enable the multi-memory feature to allow multiple memories.');
    }

    const memory = new MemoryBuilder(
      this,
      new ResizableLimits(initialSize, maximumSize),
      this._memories.length + this._importsIndexSpace.memory,
      shared,
      memory64
    );
    this._memories.push(memory);
    return memory;
  }

  defineGlobal(
    valueType: ValueTypeDescriptor,
    mutable: boolean,
    value?: number | GlobalBuilder | ((asm: any) => void)
  ): GlobalBuilder {
    const globalBuilder = new GlobalBuilder(
      this,
      valueType,
      mutable,
      this._globals.length + this._importsIndexSpace.global
    );
    if (value !== undefined) {
      globalBuilder.value(value);
    }

    this._globals.push(globalBuilder);
    return globalBuilder;
  }

  defineTag(
    parameters: ValueTypeDescriptor[]
  ): TagBuilder {
    // Tags have no return types — they describe the exception payload
    const funcType = this.defineFuncType(null, parameters);
    const tagBuilder = new TagBuilder(
      this,
      funcType,
      this._tags.length
    );
    this._tags.push(tagBuilder);
    return tagBuilder;
  }

  setStartFunction(functionBuilder: FunctionBuilder): void {
    Arg.instanceOf('functionBuilder', functionBuilder, FunctionBuilder);
    this._startFunction = functionBuilder;
  }

  exportFunction(functionBuilder: FunctionBuilder, name: string | null = null): ExportBuilder {
    Arg.instanceOf('functionBuilder', functionBuilder, FunctionBuilder);

    const functionName = name || functionBuilder.name;
    Arg.notEmptyString('name', functionName);

    if (
      this._exports.find(
        (x) => x.externalKind === ExternalKind.Function && x.name === functionName
      )
    ) {
      throw new Error(`An export already existing for a function named ${functionName}.`);
    }

    const exportBuilder = new ExportBuilder(
      functionName,
      ExternalKind.Function,
      functionBuilder
    );
    this._exports.push(exportBuilder);
    return exportBuilder;
  }

  exportMemory(memoryBuilder: MemoryBuilder, name: string): ExportBuilder {
    Arg.notEmptyString('name', name);
    Arg.instanceOf('memoryBuilder', memoryBuilder, MemoryBuilder);

    if (
      this._exports.find(
        (x) => x.externalKind === ExternalKind.Memory && x.name === name
      )
    ) {
      throw new Error(`An export already existing for memory named ${name}.`);
    }

    const exportBuilder = new ExportBuilder(name, ExternalKind.Memory, memoryBuilder);
    this._exports.push(exportBuilder);
    return exportBuilder;
  }

  exportTable(tableBuilder: TableBuilder, name: string): ExportBuilder {
    Arg.notEmptyString('name', name);
    Arg.instanceOf('tableBuilder', tableBuilder, TableBuilder);

    if (
      this._exports.find(
        (x) => x.externalKind === ExternalKind.Table && x.name === name
      )
    ) {
      throw new Error(`An export already existing for a table named ${name}.`);
    }

    const exportBuilder = new ExportBuilder(name, ExternalKind.Table, tableBuilder);
    this._exports.push(exportBuilder);
    return exportBuilder;
  }

  exportGlobal(globalBuilder: GlobalBuilder, name: string): ExportBuilder {
    Arg.notEmptyString('name', name);
    Arg.instanceOf('globalBuilder', globalBuilder, GlobalBuilder);
    if (globalBuilder.globalType.mutable && !this.disableVerification && !this._resolvedFeatures.has('mutable-globals')) {
      throw new VerificationError('Cannot export a mutable global. Enable the mutable-globals feature to allow this.');
    }

    if (
      this._exports.find(
        (x) => x.externalKind === ExternalKind.Global && x.name === name
      )
    ) {
      throw new Error(`An export already existing for a global named ${name}.`);
    }

    const exportBuilder = new ExportBuilder(name, ExternalKind.Global, globalBuilder);
    this._exports.push(exportBuilder);
    return exportBuilder;
  }

  defineTableSegment(
    table: TableBuilder,
    elements: (FunctionBuilder | ImportBuilder)[],
    offset?: number | GlobalBuilder | ((asm: any) => void)
  ): ElementSegmentBuilder {
    const segment = new ElementSegmentBuilder(table, elements, this._resolvedFeatures);
    if (offset !== undefined) {
      segment.offset(offset as any);
    }

    this._elements.push(segment);
    return segment;
  }

  definePassiveElementSegment(
    elements: (FunctionBuilder | ImportBuilder)[]
  ): ElementSegmentBuilder {
    const segment = new ElementSegmentBuilder(null, elements, this._resolvedFeatures);
    segment.passive();
    this._elements.push(segment);
    return segment;
  }

  defineData(
    data: Uint8Array,
    offset?: number | GlobalBuilder | ((asm: any) => void)
  ): DataSegmentBuilder {
    Arg.instanceOf('data', data, Uint8Array);

    const dataSegmentBuilder = new DataSegmentBuilder(data, this._resolvedFeatures);
    if (offset !== undefined) {
      dataSegmentBuilder.offset(offset as any);
    }

    this._data.push(dataSegmentBuilder);
    return dataSegmentBuilder;
  }

  defineCustomSection(name: string, data?: Uint8Array): CustomSectionBuilder {
    Arg.notEmptyString('name', name);

    if (this._customSections.find((x) => x.name === name)) {
      throw new Error(`A custom section already exists with the name ${name}.`);
    }

    if (name === 'name') {
      throw new Error("The 'name' custom section is reserved.");
    }

    const customSectionBuilder = new CustomSectionBuilder(name, data);
    this._customSections.push(customSectionBuilder);
    return customSectionBuilder;
  }

  async instantiate(imports?: WebAssembly.Imports): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
    const moduleBytes = this.toBytes();
    return WebAssembly.instantiate(moduleBytes.buffer as ArrayBuffer, imports);
  }

  async compile(): Promise<WebAssembly.Module> {
    const moduleBytes = this.toBytes();
    return WebAssembly.compile(moduleBytes.buffer as ArrayBuffer);
  }

  toString(): string {
    const writer = new TextModuleWriter(this);
    return writer.toString();
  }

  toBytes(): Uint8Array {
    const writer = new BinaryModuleWriter(this);
    return writer.write();
  }
}
