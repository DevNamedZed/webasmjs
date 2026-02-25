import {
  SectionType,
  SectionTypeDescriptor,
  ExternalKind,
  ValueType,
  ElementType,
  ValueTypeDescriptor,
  ImmediateType,
  LanguageType,
  refType,
  refNullType,
} from './types';
import OpCodes from './OpCodes';
import InstructionDecoder, { DecodedInstruction } from './InstructionDecoder';

export interface ModuleInfo {
  version: number;
  types: TypeInfo[];
  imports: ImportInfo[];
  functions: FunctionInfo[];
  tables: TableInfo[];
  memories: MemoryInfo[];
  globals: GlobalInfo[];
  exports: ExportInfo[];
  start: number | null;
  elements: ElementInfo[];
  tags: TagInfo[];
  dataCount: number | null;
  data: DataInfo[];
  customSections: CustomSectionInfo[];
  nameSection?: NameSectionInfo;
}

export type TypeInfo = FuncTypeInfo | StructTypeInfo | ArrayTypeInfo | RecGroupTypeInfo;

export interface FuncTypeInfo {
  kind: 'func';
  parameterTypes: ValueTypeDescriptor[];
  returnTypes: ValueTypeDescriptor[];
}

export interface StructFieldInfo {
  type: number | ValueTypeDescriptor;
  mutable: boolean;
}

export interface StructTypeInfo {
  kind: 'struct';
  fields: StructFieldInfo[];
  superTypes?: number[];
  final?: boolean;
}

export interface ArrayTypeInfo {
  kind: 'array';
  elementType: number | ValueTypeDescriptor;
  mutable: boolean;
  superTypes?: number[];
  final?: boolean;
}

export interface RecGroupTypeInfo {
  kind: 'rec';
  types: TypeInfo[];
}

export interface TagInfo {
  attribute: number;
  typeIndex: number;
}

export interface ImportInfo {
  moduleName: string;
  fieldName: string;
  kind: number;
  typeIndex?: number;
  tableType?: { elementType: number; initial: number; maximum: number | null };
  memoryType?: { initial: number; maximum: number | null; shared: boolean; memory64: boolean };
  globalType?: { valueType: number; mutable: boolean };
  tagType?: { attribute: number; typeIndex: number };
}

export interface FunctionInfo {
  typeIndex: number;
  locals: { count: number; type: number }[];
  body: Uint8Array;
  instructions?: DecodedInstruction[];
}

export interface TableInfo {
  elementType: number;
  initial: number;
  maximum: number | null;
}

export interface MemoryInfo {
  initial: number;
  maximum: number | null;
  shared: boolean;
  memory64: boolean;
}

export interface GlobalInfo {
  valueType: number;
  mutable: boolean;
  initExpr: Uint8Array;
  initInstructions?: DecodedInstruction[];
}

export interface ExportInfo {
  name: string;
  kind: number;
  index: number;
}

export interface ElementInfo {
  tableIndex: number;
  offsetExpr: Uint8Array;
  offsetInstructions?: DecodedInstruction[];
  functionIndices: number[];
  passive: boolean;
}

export interface DataInfo {
  kind: number;
  memoryIndex: number;
  offsetExpr: Uint8Array;
  offsetInstructions?: DecodedInstruction[];
  data: Uint8Array;
  passive: boolean;
}

export interface ReadOptions {
  decodeInstructions?: boolean;
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
  private _options: ReadOptions;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.offset = 0;
    this._options = {};
  }

  read(options?: ReadOptions): ModuleInfo {
    this._options = options || {};
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
      tags: [],
      dataCount: null,
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
        case 12: // DataCount
          module.dataCount = this.readVarUInt32();
          break;
        case 13: // Tag
          this.readTagSection(module);
          break;
        default:
          // Skip unknown section
          this.offset = sectionEnd;
          break;
      }

      this.offset = sectionEnd;
    }

    // Decode instructions if requested
    if (this._options.decodeInstructions) {
      for (const func of module.functions) {
        func.instructions = InstructionDecoder.decodeInitExpr(func.body);
      }
      for (const global of module.globals) {
        if (global.initExpr.length > 0) {
          global.initInstructions = InstructionDecoder.decodeInitExpr(global.initExpr);
        }
      }
      for (const elem of module.elements) {
        if (elem.offsetExpr.length > 0 && !elem.passive) {
          elem.offsetInstructions = InstructionDecoder.decodeInitExpr(elem.offsetExpr);
        }
      }
      for (const data of module.data) {
        if (data.offsetExpr.length > 0 && !data.passive) {
          data.offsetInstructions = InstructionDecoder.decodeInitExpr(data.offsetExpr);
        }
      }
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
      const typeInfo = this.readTypeEntry();
      if (typeInfo.kind === 'rec') {
        // Rec group: add the group itself AND each type within it
        module.types.push(typeInfo);
        // Individual types in a rec group are also indexed in the type space
        // The rec group acts as a container; we don't add children separately
        // since the rec group already tracks them
      } else {
        module.types.push(typeInfo);
      }
    }
  }

  private readTypeEntry(): TypeInfo {
    const form = this.readVarUInt7();

    switch (form) {
      case 0x60: // func
        return this.readFuncType();
      case 0x5f: // struct
        return this.readStructType();
      case 0x5e: // array
        return this.readArrayType();
      case 0x4e: { // rec group
        const typeCount = this.readVarUInt32();
        const types: TypeInfo[] = [];
        for (let j = 0; j < typeCount; j++) {
          types.push(this.readTypeEntry());
        }
        return { kind: 'rec', types };
      }
      case 0x50: // sub (non-final)
      case 0x4f: { // sub_final
        const final = form === 0x4f;
        const superCount = this.readVarUInt32();
        const superTypes: number[] = [];
        for (let j = 0; j < superCount; j++) {
          superTypes.push(this.readVarUInt32());
        }
        // Read the inner type (struct, array, or func)
        const innerType = this.readTypeEntry();
        if (innerType.kind === 'struct') {
          innerType.superTypes = superTypes;
          innerType.final = final;
        } else if (innerType.kind === 'array') {
          innerType.superTypes = superTypes;
          innerType.final = final;
        }
        // For func types with subtyping, return as-is (rare)
        return innerType;
      }
      default:
        throw new Error(`Unknown type form: 0x${(form & 0xff).toString(16)}`);
    }
  }

  private readFuncType(): FuncTypeInfo {
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
    return { kind: 'func', parameterTypes, returnTypes };
  }

  private readStructType(): StructTypeInfo {
    const fieldCount = this.readVarUInt32();
    const fields: StructFieldInfo[] = [];
    for (let j = 0; j < fieldCount; j++) {
      const type = this.readValueType();
      const mutable = this.readVarUInt1() === 1;
      fields.push({ type, mutable });
    }
    return { kind: 'struct', fields };
  }

  private readArrayType(): ArrayTypeInfo {
    const elementType = this.readValueType();
    const mutable = this.readVarUInt1() === 1;
    return { kind: 'array', elementType, mutable };
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
          const { initial, maximum, shared, memory64 } = this.readResizableLimits();
          imp.memoryType = { initial, maximum, shared, memory64 };
          break;
        }
        case 3: { // Global
          const valueType = this.readVarInt7();
          const mutable = this.readVarUInt1() === 1;
          imp.globalType = { valueType, mutable };
          break;
        }
        case 4: { // Tag
          const attribute = this.readVarUInt32();
          const typeIndex = this.readVarUInt32();
          imp.tagType = { attribute, typeIndex };
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
      const { initial, maximum, shared, memory64 } = this.readResizableLimits();
      module.memories.push({ initial, maximum, shared, memory64 });
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
      const kind = this.readVarUInt32();

      if (kind === 0) {
        // Kind 0: active, table 0, offset expr, vec of func indices
        const offsetExpr = this.readInitExpr();
        const numElems = this.readVarUInt32();
        const functionIndices: number[] = [];
        for (let j = 0; j < numElems; j++) {
          functionIndices.push(this.readVarUInt32());
        }
        module.elements.push({ tableIndex: 0, offsetExpr, functionIndices, passive: false });
      } else if (kind === 1) {
        // Kind 1: passive, elemkind byte, vec of func indices
        const _elemKind = this.readUInt8(); // 0x00 = funcref
        const numElems = this.readVarUInt32();
        const functionIndices: number[] = [];
        for (let j = 0; j < numElems; j++) {
          functionIndices.push(this.readVarUInt32());
        }
        module.elements.push({ tableIndex: 0, offsetExpr: new Uint8Array(), functionIndices, passive: true });
      } else if (kind === 2) {
        // Kind 2: active, explicit table index, offset expr, elemkind, vec of func indices
        const tableIndex = this.readVarUInt32();
        const offsetExpr = this.readInitExpr();
        const _elemKind = this.readUInt8(); // 0x00 = funcref
        const numElems = this.readVarUInt32();
        const functionIndices: number[] = [];
        for (let j = 0; j < numElems; j++) {
          functionIndices.push(this.readVarUInt32());
        }
        module.elements.push({ tableIndex, offsetExpr, functionIndices, passive: false });
      } else {
        throw new Error(`Unsupported element segment kind: ${kind}`);
      }
    }
  }

  private readTagSection(module: ModuleInfo): void {
    const count = this.readVarUInt32();
    for (let i = 0; i < count; i++) {
      const attribute = this.readVarUInt32(); // 0 = exception
      const typeIndex = this.readVarUInt32();
      module.tags.push({ attribute, typeIndex });
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
      const kind = this.readVarUInt32();
      if (kind === 1) {
        // Passive segment: kind=1, data bytes only
        const dataSize = this.readVarUInt32();
        const data = this.readBytes(dataSize);
        module.data.push({ kind, memoryIndex: 0, offsetExpr: new Uint8Array(), data, passive: true });
      } else if (kind === 2) {
        // Active with explicit memory index: kind=2, memoryIndex, offsetExpr, data
        const memoryIndex = this.readVarUInt32();
        const offsetExpr = this.readInitExpr();
        const dataSize = this.readVarUInt32();
        const data = this.readBytes(dataSize);
        module.data.push({ kind, memoryIndex, offsetExpr, data, passive: false });
      } else {
        // Active with default memory 0: kind=0, offsetExpr, data
        const offsetExpr = this.readInitExpr();
        const dataSize = this.readVarUInt32();
        const data = this.readBytes(dataSize);
        module.data.push({ kind, memoryIndex: 0, offsetExpr, data, passive: false });
      }
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
        case 0xd0: // ref.null — heap type immediate
          this.readVarInt32();
          break;
        case 0xd2: // ref.func — function index immediate
          this.readVarUInt32();
          break;
        case 0xfb: { // GC prefix
          const subOpcode = this.readVarUInt32();
          switch (subOpcode) {
            case 0:  // struct.new — type index
            case 1:  // struct.new_default — type index
              this.readVarUInt32();
              break;
            case 8:  // array.new_fixed — type index + count
              this.readVarUInt32();
              this.readVarUInt32();
              break;
            case 7:  // array.new_default — type index
            case 6:  // array.new — type index
              this.readVarUInt32();
              break;
            case 28: // i31.new / ref.i31
              break;
            case 26: // any.convert_extern
            case 27: // extern.convert_any
              break;
            // Other GC opcodes with no immediates in init context
          }
          break;
        }
        // Extended-const: i32.add (0x6a), i32.sub (0x6b), i32.mul (0x6c),
        // i64.add (0x7c), i64.sub (0x7d), i64.mul (0x7e) — no immediates
      }
    }
    return this.buffer.slice(start, this.offset);
  }

  private readResizableLimits(): { initial: number; maximum: number | null; shared: boolean; memory64: boolean } {
    const flags = this.readVarUInt7();
    const hasMax = (flags & 0x01) !== 0;
    const shared = (flags & 0x02) !== 0;
    const memory64 = (flags & 0x04) !== 0;
    // memory64 uses varuint64 encoding; convert to number (safe for practical page counts up to 2^53)
    const initial = memory64 ? Number(this.readVarUInt64()) : this.readVarUInt32();
    const maximum = hasMax ? (memory64 ? Number(this.readVarUInt64()) : this.readVarUInt32()) : null;
    return { initial, maximum, shared, memory64 };
  }

  private readValueType(): ValueTypeDescriptor {
    const value = this.readVarInt7();
    // Value types are signed: -1=i32, -2=i64, -3=f32, -4=f64, -5=v128
    // Reference types: -16=funcref, -17=externref, -14=anyref, etc.
    switch (value) {
      case -1: return ValueType.Int32;
      case -2: return ValueType.Int64;
      case -3: return ValueType.Float32;
      case -4: return ValueType.Float64;
      case -5: return ValueType.V128;
      case -16: return ValueType.FuncRef;
      case -17: return ValueType.ExternRef;
      case -18: return ValueType.AnyRef;
      case -19: return ValueType.EqRef;
      case -20: return ValueType.I31Ref;
      case -21: return ValueType.StructRef;
      case -22: return ValueType.ArrayRef;
      case -15: return ValueType.NullRef;
      case -13: return ValueType.NullFuncRef;
      case -14: return ValueType.NullExternRef;
      case -28: return refType(this.readVarInt32());       // 0x64 = (ref $idx)
      case -29: return refNullType(this.readVarInt32());   // 0x63 = (ref null $idx)
      default:
        throw new Error(`Unknown value type: 0x${(value & 0xff).toString(16)}`);
    }
  }

  // --- Primitive readers ---

  private ensureBytes(count: number): void {
    if (this.offset + count > this.buffer.length) {
      throw new Error(
        `Unexpected end of binary data at offset ${this.offset} (need ${count} bytes, have ${this.buffer.length - this.offset})`
      );
    }
  }

  private readUInt8(): number {
    this.ensureBytes(1);
    return this.buffer[this.offset++];
  }

  private readUInt32(): number {
    this.ensureBytes(4);
    const value =
      this.buffer[this.offset] |
      (this.buffer[this.offset + 1] << 8) |
      (this.buffer[this.offset + 2] << 16) |
      (this.buffer[this.offset + 3] << 24);
    this.offset += 4;
    return value >>> 0;
  }

  private readVarUInt1(): number {
    this.ensureBytes(1);
    return this.buffer[this.offset++] & 1;
  }

  private readVarUInt7(): number {
    this.ensureBytes(1);
    return this.buffer[this.offset++] & 0x7f;
  }

  private readVarUInt32(): number {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      this.ensureBytes(1);
      byte = this.buffer[this.offset++];
      result |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte & 0x80);
    return result >>> 0;
  }

  private readVarInt7(): number {
    this.ensureBytes(1);
    const byte = this.buffer[this.offset++];
    return byte & 0x40 ? byte | 0xffffff80 : byte & 0x7f;
  }

  private readVarInt32(): number {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      this.ensureBytes(1);
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
      this.ensureBytes(1);
      byte = this.buffer[this.offset++];
      result |= BigInt(byte & 0x7f) << shift;
      shift += 7n;
    } while (byte & 0x80);
    if (shift < 64n && byte & 0x40) {
      result |= -(1n << shift);
    }
    return result;
  }

  private readVarUInt64(): bigint {
    let result = 0n;
    let shift = 0n;
    let byte: number;
    do {
      this.ensureBytes(1);
      byte = this.buffer[this.offset++];
      result |= BigInt(byte & 0x7f) << shift;
      shift += 7n;
    } while (byte & 0x80);
    return result;
  }

  private readString(length: number): string {
    this.ensureBytes(length);
    const bytes = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return new TextDecoder().decode(bytes);
  }

  private readBytes(length: number): Uint8Array {
    this.ensureBytes(length);
    const bytes = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return bytes;
  }
}
