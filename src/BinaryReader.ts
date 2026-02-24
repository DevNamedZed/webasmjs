import {
  SectionType,
  SectionTypeDescriptor,
  ExternalKind,
  ValueType,
  ElementType,
  ValueTypeDescriptor,
  ImmediateType,
  LanguageType,
} from './types';
import OpCodes from './OpCodes';

export interface ModuleInfo {
  version: number;
  types: FuncTypeInfo[];
  imports: ImportInfo[];
  functions: FunctionInfo[];
  tables: TableInfo[];
  memories: MemoryInfo[];
  globals: GlobalInfo[];
  exports: ExportInfo[];
  start: number | null;
  elements: ElementInfo[];
  data: DataInfo[];
  customSections: CustomSectionInfo[];
  nameSection?: NameSectionInfo;
}

export interface FuncTypeInfo {
  parameterTypes: ValueTypeDescriptor[];
  returnTypes: ValueTypeDescriptor[];
}

export interface ImportInfo {
  moduleName: string;
  fieldName: string;
  kind: number;
  typeIndex?: number;
  tableType?: { elementType: number; initial: number; maximum: number | null };
  memoryType?: { initial: number; maximum: number | null };
  globalType?: { valueType: number; mutable: boolean };
}

export interface FunctionInfo {
  typeIndex: number;
  locals: { count: number; type: number }[];
  body: Uint8Array;
}

export interface TableInfo {
  elementType: number;
  initial: number;
  maximum: number | null;
}

export interface MemoryInfo {
  initial: number;
  maximum: number | null;
}

export interface GlobalInfo {
  valueType: number;
  mutable: boolean;
  initExpr: Uint8Array;
}

export interface ExportInfo {
  name: string;
  kind: number;
  index: number;
}

export interface ElementInfo {
  tableIndex: number;
  offsetExpr: Uint8Array;
  functionIndices: number[];
}

export interface DataInfo {
  memoryIndex: number;
  offsetExpr: Uint8Array;
  data: Uint8Array;
}

export interface CustomSectionInfo {
  name: string;
  data: Uint8Array;
}

export interface NameSectionInfo {
  moduleName?: string;
  functionNames?: Map<number, string>;
  localNames?: Map<number, Map<number, string>>;
  globalNames?: Map<number, string>;
}

const MagicHeader = 0x6d736100;

export default class BinaryReader {
  buffer: Uint8Array;
  offset: number;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.offset = 0;
  }

  read(): ModuleInfo {
    const magic = this.readUInt32();
    if (magic !== MagicHeader) {
      throw new Error(`Invalid WASM magic header: 0x${magic.toString(16)}`);
    }

    const version = this.readUInt32();
    if (version !== 1) {
      throw new Error(`Unsupported WASM version: ${version}`);
    }

    const module: ModuleInfo = {
      version,
      types: [],
      imports: [],
      functions: [],
      tables: [],
      memories: [],
      globals: [],
      exports: [],
      start: null,
      elements: [],
      data: [],
      customSections: [],
    };

    // Track function type indices separately (function section only stores type indices)
    const functionTypeIndices: number[] = [];

    while (this.offset < this.buffer.length) {
      const sectionId = this.readVarUInt7();
      const sectionSize = this.readVarUInt32();
      const sectionEnd = this.offset + sectionSize;

      switch (sectionId) {
        case 0: // Custom
          this.readCustomSection(module, sectionEnd);
          break;
        case 1: // Type
          this.readTypeSection(module);
          break;
        case 2: // Import
          this.readImportSection(module);
          break;
        case 3: // Function
          this.readFunctionSection(functionTypeIndices);
          break;
        case 4: // Table
          this.readTableSection(module);
          break;
        case 5: // Memory
          this.readMemorySection(module);
          break;
        case 6: // Global
          this.readGlobalSection(module);
          break;
        case 7: // Export
          this.readExportSection(module);
          break;
        case 8: // Start
          module.start = this.readVarUInt32();
          break;
        case 9: // Element
          this.readElementSection(module);
          break;
        case 10: // Code
          this.readCodeSection(module, functionTypeIndices);
          break;
        case 11: // Data
          this.readDataSection(module);
          break;
        default:
          // Skip unknown section
          this.offset = sectionEnd;
          break;
      }

      this.offset = sectionEnd;
    }

    return module;
  }

  private readCustomSection(module: ModuleInfo, sectionEnd: number): void {
    const nameLen = this.readVarUInt32();
    const name = this.readString(nameLen);

    if (name === 'name') {
      module.nameSection = this.readNameSection(sectionEnd);
      return;
    }

    const remaining = sectionEnd - this.offset;
    const data = this.readBytes(remaining);
    module.customSections.push({ name, data });
  }

  private readNameSection(sectionEnd: number): NameSectionInfo {
    const info: NameSectionInfo = {};

    while (this.offset < sectionEnd) {
      const subsectionId = this.readVarUInt7();
      const subsectionSize = this.readVarUInt32();
      const subsectionEnd = this.offset + subsectionSize;

      switch (subsectionId) {
        case 0: { // module name
          const len = this.readVarUInt32();
          info.moduleName = this.readString(len);
          break;
        }
        case 1: { // function names
          const count = this.readVarUInt32();
          info.functionNames = new Map();
          for (let i = 0; i < count; i++) {
            const index = this.readVarUInt32();
            const len = this.readVarUInt32();
            info.functionNames.set(index, this.readString(len));
          }
          break;
        }
        case 2: { // local names
          const funcCount = this.readVarUInt32();
          info.localNames = new Map();
          for (let i = 0; i < funcCount; i++) {
            const funcIndex = this.readVarUInt32();
            const localCount = this.readVarUInt32();
            const locals = new Map<number, string>();
            for (let j = 0; j < localCount; j++) {
              const localIndex = this.readVarUInt32();
              const len = this.readVarUInt32();
              locals.set(localIndex, this.readString(len));
            }
            info.localNames.set(funcIndex, locals);
          }
          break;
        }
        case 7: { // global names
          const count = this.readVarUInt32();
          info.globalNames = new Map();
          for (let i = 0; i < count; i++) {
            const index = this.readVarUInt32();
            const len = this.readVarUInt32();
            info.globalNames.set(index, this.readString(len));
          }
          break;
        }
        default:
          // Skip unknown subsections
          this.offset = subsectionEnd;
          break;
      }

      this.offset = subsectionEnd;
    }

    return info;
  }

  private readTypeSection(module: ModuleInfo): void {
    const count = this.readVarUInt32();
    for (let i = 0; i < count; i++) {
      const form = this.readVarInt7(); // 0x60 = func
      const paramCount = this.readVarUInt32();
      const parameterTypes: ValueTypeDescriptor[] = [];
      for (let j = 0; j < paramCount; j++) {
        parameterTypes.push(this.readValueType());
      }
      const returnCount = this.readVarUInt32();
      const returnTypes: ValueTypeDescriptor[] = [];
      for (let j = 0; j < returnCount; j++) {
        returnTypes.push(this.readValueType());
      }
      module.types.push({ parameterTypes, returnTypes });
    }
  }

  private readImportSection(module: ModuleInfo): void {
    const count = this.readVarUInt32();
    for (let i = 0; i < count; i++) {
      const moduleNameLen = this.readVarUInt32();
      const moduleName = this.readString(moduleNameLen);
      const fieldNameLen = this.readVarUInt32();
      const fieldName = this.readString(fieldNameLen);
      const kind = this.readUInt8();

      const imp: ImportInfo = { moduleName, fieldName, kind };

      switch (kind) {
        case 0: // Function
          imp.typeIndex = this.readVarUInt32();
          break;
        case 1: { // Table
          const elementType = this.readVarInt7();
          const { initial, maximum } = this.readResizableLimits();
          imp.tableType = { elementType, initial, maximum };
          break;
        }
        case 2: { // Memory
          const { initial, maximum } = this.readResizableLimits();
          imp.memoryType = { initial, maximum };
          break;
        }
        case 3: { // Global
          const valueType = this.readVarInt7();
          const mutable = this.readVarUInt1() === 1;
          imp.globalType = { valueType, mutable };
          break;
        }
      }

      module.imports.push(imp);
    }
  }

  private readFunctionSection(functionTypeIndices: number[]): void {
    const count = this.readVarUInt32();
    for (let i = 0; i < count; i++) {
      functionTypeIndices.push(this.readVarUInt32());
    }
  }

  private readTableSection(module: ModuleInfo): void {
    const count = this.readVarUInt32();
    for (let i = 0; i < count; i++) {
      const elementType = this.readVarInt7();
      const { initial, maximum } = this.readResizableLimits();
      module.tables.push({ elementType, initial, maximum });
    }
  }

  private readMemorySection(module: ModuleInfo): void {
    const count = this.readVarUInt32();
    for (let i = 0; i < count; i++) {
      const { initial, maximum } = this.readResizableLimits();
      module.memories.push({ initial, maximum });
    }
  }

  private readGlobalSection(module: ModuleInfo): void {
    const count = this.readVarUInt32();
    for (let i = 0; i < count; i++) {
      const valueType = this.readVarInt7();
      const mutable = this.readVarUInt1() === 1;
      const initExpr = this.readInitExpr();
      module.globals.push({ valueType, mutable, initExpr });
    }
  }

  private readExportSection(module: ModuleInfo): void {
    const count = this.readVarUInt32();
    for (let i = 0; i < count; i++) {
      const nameLen = this.readVarUInt32();
      const name = this.readString(nameLen);
      const kind = this.readUInt8();
      const index = this.readVarUInt32();
      module.exports.push({ name, kind, index });
    }
  }

  private readElementSection(module: ModuleInfo): void {
    const count = this.readVarUInt32();
    for (let i = 0; i < count; i++) {
      const tableIndex = this.readVarUInt32();
      const offsetExpr = this.readInitExpr();
      const numElems = this.readVarUInt32();
      const functionIndices: number[] = [];
      for (let j = 0; j < numElems; j++) {
        functionIndices.push(this.readVarUInt32());
      }
      module.elements.push({ tableIndex, offsetExpr, functionIndices });
    }
  }

  private readCodeSection(module: ModuleInfo, functionTypeIndices: number[]): void {
    const count = this.readVarUInt32();
    for (let i = 0; i < count; i++) {
      const bodySize = this.readVarUInt32();
      const bodyEnd = this.offset + bodySize;

      const localCount = this.readVarUInt32();
      const locals: { count: number; type: number }[] = [];
      for (let j = 0; j < localCount; j++) {
        const lCount = this.readVarUInt32();
        const type = this.readVarInt7();
        locals.push({ count: lCount, type });
      }

      const bodyLength = bodyEnd - this.offset;
      const body = this.readBytes(bodyLength);

      module.functions.push({
        typeIndex: functionTypeIndices[i],
        locals,
        body,
      });

      this.offset = bodyEnd;
    }
  }

  private readDataSection(module: ModuleInfo): void {
    const count = this.readVarUInt32();
    for (let i = 0; i < count; i++) {
      const memoryIndex = this.readVarUInt32();
      const offsetExpr = this.readInitExpr();
      const dataSize = this.readVarUInt32();
      const data = this.readBytes(dataSize);
      module.data.push({ memoryIndex, offsetExpr, data });
    }
  }

  private readInitExpr(): Uint8Array {
    const start = this.offset;
    while (this.offset < this.buffer.length) {
      const byte = this.buffer[this.offset++];
      if (byte === OpCodes.end.value) {
        break;
      }
      // Skip over immediate operands for known init expression opcodes
      switch (byte) {
        case OpCodes.i32_const.value:
          this.readVarInt32();
          break;
        case OpCodes.i64_const.value:
          this.readVarInt64();
          break;
        case OpCodes.f32_const.value:
          this.offset += 4;
          break;
        case OpCodes.f64_const.value:
          this.offset += 8;
          break;
        case OpCodes.get_global.value:
          this.readVarUInt32();
          break;
      }
    }
    return this.buffer.slice(start, this.offset);
  }

  private readResizableLimits(): { initial: number; maximum: number | null } {
    const flags = this.readVarUInt1();
    const initial = this.readVarUInt32();
    const maximum = flags === 1 ? this.readVarUInt32() : null;
    return { initial, maximum };
  }

  private readValueType(): ValueTypeDescriptor {
    const value = this.readVarInt7();
    // Value types are signed: -1=i32, -2=i64, -3=f32, -4=f64
    switch (value) {
      case -1: return ValueType.Int32;
      case -2: return ValueType.Int64;
      case -3: return ValueType.Float32;
      case -4: return ValueType.Float64;
      default:
        throw new Error(`Unknown value type: 0x${(value & 0xff).toString(16)}`);
    }
  }

  // --- Primitive readers ---

  private readUInt8(): number {
    return this.buffer[this.offset++];
  }

  private readUInt32(): number {
    const value =
      this.buffer[this.offset] |
      (this.buffer[this.offset + 1] << 8) |
      (this.buffer[this.offset + 2] << 16) |
      (this.buffer[this.offset + 3] << 24);
    this.offset += 4;
    return value >>> 0;
  }

  private readVarUInt1(): number {
    return this.buffer[this.offset++] & 1;
  }

  private readVarUInt7(): number {
    return this.buffer[this.offset++] & 0x7f;
  }

  private readVarUInt32(): number {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = this.buffer[this.offset++];
      result |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte & 0x80);
    return result >>> 0;
  }

  private readVarInt7(): number {
    const byte = this.buffer[this.offset++];
    return byte & 0x40 ? byte | 0xffffff80 : byte & 0x7f;
  }

  private readVarInt32(): number {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = this.buffer[this.offset++];
      result |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte & 0x80);
    if (shift < 32 && byte & 0x40) {
      result |= -(1 << shift);
    }
    return result;
  }

  private readVarInt64(): bigint {
    let result = 0n;
    let shift = 0n;
    let byte: number;
    do {
      byte = this.buffer[this.offset++];
      result |= BigInt(byte & 0x7f) << shift;
      shift += 7n;
    } while (byte & 0x80);
    if (shift < 64n && byte & 0x40) {
      result |= -(1n << shift);
    }
    return result;
  }

  private readString(length: number): string {
    const bytes = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return new TextDecoder().decode(bytes);
  }

  private readBytes(length: number): Uint8Array {
    const bytes = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return bytes;
  }
}
