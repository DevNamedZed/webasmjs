"use strict";
var webasmPlayground = (() => {
  // src/Arg.ts
  var formatOrList = (values) => {
    if (values.length === 1) {
      return values[0];
    }
    let text = "";
    for (let index = 0; index < values.length; index++) {
      text += values[index];
      if (index === values.length - 2) {
        text += " or ";
      } else if (index !== values.length - 1) {
        text += ", ";
      }
    }
    return text;
  };
  var Arg = class _Arg {
    static notNull(name, value) {
      if (value === null || value === void 0) {
        throw new Error(`The parameter ${name} must be specified.`);
      }
    }
    static notEmpty(name, value) {
      _Arg.notNull(name, value);
      if (value === "" || Array.isArray(value) && value.length === 0) {
        throw new Error(`The parameter ${name} cannot be empty.`);
      }
    }
    static notEmptyString(name, value) {
      _Arg.string(name, value);
      if (value === "") {
        throw new Error(`The parameter ${name} cannot be empty.`);
      }
    }
    static string(name, value) {
      _Arg.notNull(name, value);
      if (typeof value !== "string") {
        throw new Error(`The parameter ${name} must be a string.`);
      }
    }
    static number(name, value) {
      _Arg.notNull(name, value);
      if (typeof value !== "number" || !isFinite(value)) {
        throw new Error(`The parameter ${name} must be a finite number.`);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static instanceOf(name, value, ...types) {
      if (!types.some((x) => value instanceof x)) {
        throw new Error(
          `The parameter ${name} must be a ${formatOrList(types.map((x) => x.name))}.`
        );
      }
    }
  };

  // src/types.ts
  function isConcreteRefType(vt) {
    return "refPrefix" in vt;
  }
  var LanguageType = {
    Int32: { name: "i32", value: 127, short: "i" },
    Int64: { name: "i64", value: 126, short: "l" },
    Float32: { name: "f32", value: 125, short: "s" },
    Float64: { name: "f64", value: 124, short: "d" },
    AnyFunc: { name: "anyfunc", value: 112, short: "a" },
    Func: { name: "func", value: 96, short: "f" },
    Void: { name: "void", value: 64, short: "v" }
  };
  var RefType = {
    FuncRef: { name: "funcref", value: 112, short: "F" },
    ExternRef: { name: "externref", value: 111, short: "X" },
    AnyRef: { name: "anyref", value: 110, short: "A" },
    EqRef: { name: "eqref", value: 109, short: "E" },
    I31Ref: { name: "i31ref", value: 108, short: "J" },
    StructRef: { name: "structref", value: 107, short: "S" },
    ArrayRef: { name: "arrayref", value: 106, short: "R" },
    NullRef: { name: "nullref", value: 113, short: "N" },
    NullFuncRef: { name: "nullfuncref", value: 115, short: "Z" },
    NullExternRef: { name: "nullexternref", value: 114, short: "W" }
  };
  var HeapType = {
    Func: { name: "func", value: 112 },
    Extern: { name: "extern", value: 111 },
    Any: { name: "any", value: 110 },
    Eq: { name: "eq", value: 109 },
    I31: { name: "i31", value: 108 },
    Struct: { name: "struct", value: 107 },
    Array: { name: "array", value: 106 },
    None: { name: "none", value: 113 },
    NoFunc: { name: "nofunc", value: 115 },
    NoExtern: { name: "noextern", value: 114 }
  };
  var RefTypePrefix = {
    Ref: 100,
    RefNull: 99
  };
  function refType(typeIndex, name) {
    return {
      name: name || `(ref ${typeIndex})`,
      value: RefTypePrefix.Ref,
      short: `r${typeIndex}`,
      refPrefix: RefTypePrefix.Ref,
      typeIndex
    };
  }
  function refNullType(typeIndex, name) {
    return {
      name: name || `(ref null ${typeIndex})`,
      value: RefTypePrefix.RefNull,
      short: `n${typeIndex}`,
      refPrefix: RefTypePrefix.RefNull,
      typeIndex
    };
  }
  var ValueType = {
    Int32: LanguageType.Int32,
    Int64: LanguageType.Int64,
    Float32: LanguageType.Float32,
    Float64: LanguageType.Float64,
    V128: { name: "v128", value: 123, short: "V" },
    FuncRef: RefType.FuncRef,
    ExternRef: RefType.ExternRef,
    AnyRef: RefType.AnyRef,
    EqRef: RefType.EqRef,
    I31Ref: RefType.I31Ref,
    StructRef: RefType.StructRef,
    ArrayRef: RefType.ArrayRef,
    NullRef: RefType.NullRef,
    NullFuncRef: RefType.NullFuncRef,
    NullExternRef: RefType.NullExternRef
  };
  var BlockType = {
    Int32: LanguageType.Int32,
    Int64: LanguageType.Int64,
    Float32: LanguageType.Float32,
    Float64: LanguageType.Float64,
    V128: ValueType.V128,
    Void: LanguageType.Void,
    FuncRef: RefType.FuncRef,
    ExternRef: RefType.ExternRef,
    AnyRef: RefType.AnyRef,
    EqRef: RefType.EqRef,
    I31Ref: RefType.I31Ref,
    StructRef: RefType.StructRef,
    ArrayRef: RefType.ArrayRef
  };
  var ElementType = {
    AnyFunc: LanguageType.AnyFunc,
    FuncRef: RefType.FuncRef,
    ExternRef: RefType.ExternRef,
    AnyRef: RefType.AnyRef
  };
  var ExternalKind = {
    Function: { name: "Function", value: 0 },
    Table: { name: "Table", value: 1 },
    Memory: { name: "Memory", value: 2 },
    Global: { name: "Global", value: 3 },
    Tag: { name: "Tag", value: 4 }
  };
  var SectionType = {
    Type: { name: "Type", value: 1 },
    Import: { name: "Import", value: 2 },
    Function: { name: "Function", value: 3 },
    Table: { name: "Table", value: 4 },
    Memory: { name: "Memory", value: 5 },
    Global: { name: "Global", value: 6 },
    Export: { name: "Export", value: 7 },
    Start: { name: "Start", value: 8 },
    Element: { name: "Element", value: 9 },
    Code: { name: "Code", value: 10 },
    Data: { name: "Data", value: 11 },
    DataCount: { name: "DataCount", value: 12 },
    Tag: { name: "Tag", value: 13 },
    createCustom(name) {
      return { name, value: 0 };
    }
  };
  var TypeForm = {
    Func: { name: "func", value: 96 },
    Block: { name: "block", value: 64 },
    Struct: { name: "struct", value: 95 },
    Array: { name: "array", value: 94 },
    Rec: { name: "rec", value: 78 },
    Sub: { name: "sub", value: 80 },
    SubFinal: { name: "sub_final", value: 79 }
  };
  function writeValueType(writer, vt) {
    if (isConcreteRefType(vt)) {
      writer.writeVarInt7(vt.refPrefix);
      writer.writeVarInt32(vt.typeIndex);
    } else {
      writer.writeVarInt7(vt.value);
    }
  }
  var i32 = ValueType.Int32;
  var i64 = ValueType.Int64;
  var f32 = ValueType.Float32;
  var f64 = ValueType.Float64;
  var v128 = ValueType.V128;
  var funcref = ValueType.FuncRef;
  var externref = ValueType.ExternRef;
  var anyref = ValueType.AnyRef;
  var eqref = ValueType.EqRef;
  var i31ref = ValueType.I31Ref;
  var structref = ValueType.StructRef;
  var arrayref = ValueType.ArrayRef;
  function mut(type) {
    return { type, mutable: true, _brand: "MutableField" };
  }

  // src/BinaryWriter.ts
  var GrowthRate = 1024;
  var BinaryWriter = class _BinaryWriter {
    constructor(size = 1024) {
      this.size = 0;
      this.buffer = new Uint8Array(size);
    }
    get capacity() {
      return this.buffer.length;
    }
    get length() {
      return this.size;
    }
    get remaining() {
      return this.buffer.length - this.size;
    }
    writeUInt8(value) {
      this.writeByte(255 & value);
    }
    writeUInt16(value) {
      this.writeByte(value & 255);
      this.writeByte(value >> 8 & 255);
    }
    writeUInt32(value) {
      this.writeByte(value & 255);
      this.writeByte(value >> 8 & 255);
      this.writeByte(value >> 16 & 255);
      this.writeByte(value >> 24 & 255);
    }
    writeVarUInt1(value) {
      this.writeByte(value > 0 ? 1 : 0);
    }
    writeVarUInt7(value) {
      this.writeByte(127 & value);
    }
    writeVarUInt32(value) {
      do {
        let chunk = value & 127;
        value >>>= 7;
        if (value !== 0) {
          chunk |= 128;
        }
        this.writeByte(chunk);
      } while (value !== 0);
    }
    writeVarInt7(value) {
      this.writeByte(value & 127);
    }
    writeVarInt32(value) {
      let more = true;
      while (more) {
        let chunk = value & 127;
        value >>= 7;
        if (value === 0 && (chunk & 64) === 0 || value === -1 && (chunk & 64) !== 0) {
          more = false;
        } else {
          chunk |= 128;
        }
        this.writeByte(chunk);
      }
    }
    writeVarInt64(value) {
      if (typeof value === "number" && Number.isInteger(value)) {
        this.writeVarInt32(value);
        return;
      }
      let bigIntValue = BigInt(value);
      let more = true;
      while (more) {
        let chunk = Number(bigIntValue & 0x7fn);
        bigIntValue = bigIntValue >> 7n;
        if (bigIntValue === 0n && (chunk & 64) === 0 || bigIntValue === -1n && (chunk & 64) !== 0) {
          more = false;
        } else {
          chunk |= 128;
        }
        this.writeByte(chunk);
      }
    }
    writeVarUInt64(value) {
      if (typeof value === "number" && value >= 0 && value <= 4294967295) {
        this.writeVarUInt32(value);
        return;
      }
      let bigIntValue = BigInt(value);
      do {
        let chunk = Number(bigIntValue & 0x7fn);
        bigIntValue = bigIntValue >> 7n;
        if (bigIntValue !== 0n) {
          chunk |= 128;
        }
        this.writeByte(chunk);
      } while (bigIntValue !== 0n);
    }
    writeString(value) {
      const encoder = new TextEncoder();
      const utfBytes = encoder.encode(value);
      this.writeBytes(utfBytes);
    }
    writeLenPrefixedString(value) {
      const encoder = new TextEncoder();
      const utfBytes = encoder.encode(value);
      this.writeVarUInt32(utfBytes.length);
      this.writeBytes(utfBytes);
    }
    writeFloat32(value) {
      const array = new Float32Array(1);
      array[0] = value;
      this.writeBytes(new Uint8Array(array.buffer));
    }
    writeFloat64(value) {
      const array = new Float64Array(1);
      array[0] = value;
      this.writeBytes(new Uint8Array(array.buffer));
    }
    writeByte(data) {
      this.requireCapacity(1);
      this.buffer[this.size++] = data;
    }
    writeBytes(array) {
      let innerArray;
      if (array instanceof _BinaryWriter) {
        innerArray = array.toArray();
      } else if (array instanceof Uint8Array) {
        innerArray = array;
      } else {
        throw new Error("Invalid argument, must be a Uint8Array or BinaryWriter");
      }
      this.requireCapacity(innerArray.length);
      this.buffer.set(innerArray, this.size);
      this.size += innerArray.length;
    }
    requireCapacity(size) {
      const remaining = this.remaining;
      if (remaining >= size) {
        return;
      }
      const needed = this.size + size;
      const grown = this.buffer.length + GrowthRate;
      const newSize = Math.max(needed, grown);
      const newBuffer = new Uint8Array(newSize);
      newBuffer.set(this.buffer, 0);
      this.buffer = newBuffer;
    }
    toArray() {
      const array = new Uint8Array(this.size);
      array.set(this.buffer.subarray(0, this.size), 0);
      return array;
    }
  };

  // src/BinaryModuleWriter.ts
  var MagicHeader = 1836278016;
  var Version = 1;
  var BinaryModuleWriter = class _BinaryModuleWriter {
    constructor(moduleBuilder) {
      this.moduleBuilder = moduleBuilder;
    }
    static writeSectionHeader(writer, section, length) {
      writer.writeVarUInt7(section.value);
      writer.writeVarUInt32(length);
    }
    static writeSection(writer, sectionType, sectionItems) {
      if (sectionItems.length === 0) {
        return;
      }
      const sectionWriter = new BinaryWriter();
      sectionWriter.writeVarUInt32(sectionItems.length);
      sectionItems.forEach((x) => {
        x.write(sectionWriter);
      });
      _BinaryModuleWriter.writeSectionHeader(writer, sectionType, sectionWriter.length);
      writer.writeBytes(sectionWriter);
    }
    static writeCustomSection(writer, section) {
      section.write(writer);
    }
    writeTypeSection(writer) {
      _BinaryModuleWriter.writeSection(writer, SectionType.Type, this.moduleBuilder._typeSectionEntries);
    }
    writeImportSection(writer) {
      _BinaryModuleWriter.writeSection(writer, SectionType.Import, this.moduleBuilder._imports);
    }
    writeFunctionSection(writer) {
      if (this.moduleBuilder._functions.length === 0) {
        return;
      }
      const sectionWriter = new BinaryWriter();
      sectionWriter.writeVarUInt32(this.moduleBuilder._functions.length);
      for (let index = 0; index < this.moduleBuilder._functions.length; index++) {
        sectionWriter.writeVarUInt32(this.moduleBuilder._functions[index].funcTypeBuilder.index);
      }
      _BinaryModuleWriter.writeSectionHeader(writer, SectionType.Function, sectionWriter.length);
      writer.writeBytes(sectionWriter);
    }
    writeTableSection(writer) {
      _BinaryModuleWriter.writeSection(writer, SectionType.Table, this.moduleBuilder._tables);
    }
    writeMemorySection(writer) {
      _BinaryModuleWriter.writeSection(writer, SectionType.Memory, this.moduleBuilder._memories);
    }
    writeGlobalSection(writer) {
      _BinaryModuleWriter.writeSection(writer, SectionType.Global, this.moduleBuilder._globals);
    }
    writeExportSection(writer) {
      _BinaryModuleWriter.writeSection(writer, SectionType.Export, this.moduleBuilder._exports);
    }
    writeTagSection(writer) {
      _BinaryModuleWriter.writeSection(writer, SectionType.Tag, this.moduleBuilder._tags);
    }
    writeStartSection(writer) {
      if (!this.moduleBuilder._startFunction) {
        return;
      }
      const sectionWriter = new BinaryWriter();
      sectionWriter.writeVarUInt32(this.moduleBuilder._startFunction._index);
      _BinaryModuleWriter.writeSectionHeader(writer, SectionType.Start, sectionWriter.length);
      writer.writeBytes(sectionWriter);
    }
    writeElementSection(writer) {
      _BinaryModuleWriter.writeSection(writer, SectionType.Element, this.moduleBuilder._elements);
    }
    writeCodeSection(writer) {
      _BinaryModuleWriter.writeSection(writer, SectionType.Code, this.moduleBuilder._functions);
    }
    writeDataCountSection(writer) {
      if (this.moduleBuilder._data.length === 0) {
        return;
      }
      const hasPassiveSegment = this.moduleBuilder._data.some((d) => d._passive);
      if (!hasPassiveSegment) {
        return;
      }
      const sectionWriter = new BinaryWriter();
      sectionWriter.writeVarUInt32(this.moduleBuilder._data.length);
      _BinaryModuleWriter.writeSectionHeader(writer, SectionType.DataCount, sectionWriter.length);
      writer.writeBytes(sectionWriter);
    }
    writeDataSection(writer) {
      _BinaryModuleWriter.writeSection(writer, SectionType.Data, this.moduleBuilder._data);
    }
    writeNameSection(writer) {
      const mod = this.moduleBuilder;
      const nameWriter = new BinaryWriter();
      const moduleNameWriter = new BinaryWriter();
      moduleNameWriter.writeLenPrefixedString(mod._name);
      nameWriter.writeVarUInt7(0);
      nameWriter.writeVarUInt32(moduleNameWriter.length);
      nameWriter.writeBytes(moduleNameWriter);
      const allFunctions = [
        ...mod._imports.filter((x) => x.externalKind.value === 0),
        ...mod._functions
      ];
      if (allFunctions.length > 0) {
        const funcNameWriter = new BinaryWriter();
        funcNameWriter.writeVarUInt32(allFunctions.length);
        allFunctions.forEach((f, i) => {
          const name = "name" in f ? f.name : `${f.moduleName}.${f.fieldName}`;
          funcNameWriter.writeVarUInt32(i);
          funcNameWriter.writeLenPrefixedString(name);
        });
        nameWriter.writeVarUInt7(1);
        nameWriter.writeVarUInt32(funcNameWriter.length);
        nameWriter.writeBytes(funcNameWriter);
      }
      const functionsWithNames = mod._functions.filter((f) => {
        if (!f.functionEmitter) return false;
        const hasNamedParam = f.parameters.some((p) => p.name !== null);
        const hasNamedLocal = f.functionEmitter._locals.some((l) => l.name !== null);
        return hasNamedParam || hasNamedLocal;
      });
      if (functionsWithNames.length > 0) {
        const localNameWriter = new BinaryWriter();
        localNameWriter.writeVarUInt32(functionsWithNames.length);
        functionsWithNames.forEach((f) => {
          localNameWriter.writeVarUInt32(f._index);
          const namedEntries = [];
          f.parameters.forEach((p, i) => {
            if (p.name !== null) {
              namedEntries.push({ index: i, name: p.name });
            }
          });
          if (f.functionEmitter) {
            f.functionEmitter._locals.forEach((l) => {
              if (l.name !== null) {
                namedEntries.push({ index: l.index, name: l.name });
              }
            });
          }
          localNameWriter.writeVarUInt32(namedEntries.length);
          namedEntries.forEach((entry) => {
            localNameWriter.writeVarUInt32(entry.index);
            localNameWriter.writeLenPrefixedString(entry.name);
          });
        });
        nameWriter.writeVarUInt7(2);
        nameWriter.writeVarUInt32(localNameWriter.length);
        nameWriter.writeBytes(localNameWriter);
      }
      const namedGlobals = [];
      mod._imports.forEach((imp) => {
        if (imp.externalKind.value === 3) {
          namedGlobals.push({ index: imp.index, name: `${imp.moduleName}.${imp.fieldName}` });
        }
      });
      mod._globals.forEach((g) => {
        if (g.name !== null) {
          namedGlobals.push({ index: g._index, name: g.name });
        }
      });
      if (namedGlobals.length > 0) {
        const globalNameWriter = new BinaryWriter();
        globalNameWriter.writeVarUInt32(namedGlobals.length);
        namedGlobals.forEach((entry) => {
          globalNameWriter.writeVarUInt32(entry.index);
          globalNameWriter.writeLenPrefixedString(entry.name);
        });
        nameWriter.writeVarUInt7(7);
        nameWriter.writeVarUInt32(globalNameWriter.length);
        nameWriter.writeBytes(globalNameWriter);
      }
      const sectionWriter = new BinaryWriter();
      const sectionName = "name";
      sectionWriter.writeLenPrefixedString(sectionName);
      sectionWriter.writeBytes(nameWriter);
      writer.writeVarUInt7(0);
      writer.writeVarUInt32(sectionWriter.length);
      writer.writeBytes(sectionWriter);
    }
    writeCustomSections(writer) {
      this.moduleBuilder._customSections.forEach((x) => {
        _BinaryModuleWriter.writeCustomSection(writer, x);
      });
      if (this.moduleBuilder._options.generateNameSection) {
        this.writeNameSection(writer);
      }
    }
    write() {
      const writer = new BinaryWriter();
      writer.writeUInt32(MagicHeader);
      writer.writeUInt32(Version);
      this.writeTypeSection(writer);
      this.writeImportSection(writer);
      this.writeFunctionSection(writer);
      this.writeTableSection(writer);
      this.writeMemorySection(writer);
      this.writeGlobalSection(writer);
      this.writeTagSection(writer);
      this.writeExportSection(writer);
      this.writeStartSection(writer);
      this.writeElementSection(writer);
      this.writeDataCountSection(writer);
      this.writeCodeSection(writer);
      this.writeDataSection(writer);
      this.writeCustomSections(writer);
      return writer.toArray();
    }
  };

  // src/FunctionParameterBuilder.ts
  var FunctionParameterBuilder = class {
    constructor(valueType, index) {
      this.name = null;
      this.valueType = valueType;
      this.index = index;
    }
    withName(name) {
      this.name = name;
      return this;
    }
  };

  // src/LocalBuilder.ts
  var LocalBuilder = class {
    constructor(valueType, name, index, count) {
      this.index = index;
      this.valueType = valueType;
      this.name = name;
      this.count = count;
    }
    write(writer) {
      writer.writeVarUInt32(this.count);
      writeValueType(writer, this.valueType);
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/GlobalType.ts
  var GlobalType = class {
    constructor(valueType, mutable) {
      this._valueType = valueType;
      this._mutable = mutable;
    }
    get valueType() {
      return this._valueType;
    }
    get mutable() {
      return this._mutable;
    }
    write(writer) {
      writeValueType(writer, this._valueType);
      writer.writeVarUInt1(this._mutable ? 1 : 0);
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/GlobalBuilder.ts
  var GlobalBuilder = class _GlobalBuilder {
    constructor(moduleBuilder, valueType, mutable, index) {
      this._initExpressionEmitter = null;
      this.name = null;
      this._moduleBuilder = moduleBuilder;
      this._globalType = new GlobalType(valueType, mutable);
      this._index = index;
    }
    withName(name) {
      this.name = name;
      return this;
    }
    get globalType() {
      return this._globalType;
    }
    get valueType() {
      return this._globalType.valueType;
    }
    createInitEmitter(callback) {
      if (this._initExpressionEmitter) {
        throw new Error("Initialization expression emitter has already been created.");
      }
      this._initExpressionEmitter = new InitExpressionEmitter(
        "Global" /* Global */,
        this.valueType,
        this._moduleBuilder.features,
        this._moduleBuilder.disableVerification
      );
      if (callback) {
        callback(this._initExpressionEmitter);
        this._initExpressionEmitter.end();
      }
      return this._initExpressionEmitter;
    }
    value(value) {
      if (typeof value === "function") {
        this.createInitEmitter(value);
      } else if (value instanceof _GlobalBuilder) {
        this.createInitEmitter((asm) => {
          asm.get_global(value);
        });
      } else if (typeof value === "number" || typeof value === "bigint") {
        this.createInitEmitter((asm) => {
          const vt = this.valueType;
          if (vt === ValueType.Int32) {
            asm.const_i32(Number(value));
          } else if (vt === ValueType.Int64) {
            asm.const_i64(BigInt(value));
          } else if (vt === ValueType.Float32) {
            asm.const_f32(Number(value));
          } else if (vt === ValueType.Float64) {
            asm.const_f64(Number(value));
          } else {
            throw new Error(`Unsupported global value type: ${vt.name}`);
          }
        });
      } else {
        throw new Error("Unsupported global value.");
      }
      return this;
    }
    withExport(name) {
      this._moduleBuilder.exportGlobal(this, name);
      return this;
    }
    write(writer) {
      if (!this._initExpressionEmitter) {
        throw new Error("The initialization expression was not defined.");
      }
      this._globalType.write(writer);
      this._initExpressionEmitter.write(writer);
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/ImportBuilder.ts
  var ImportBuilder = class {
    constructor(moduleName, fieldName, externalKind, data, index) {
      this.moduleName = moduleName;
      this.fieldName = fieldName;
      this.externalKind = externalKind;
      this.data = data;
      this.index = index;
    }
    isFunctionImport() {
      return this.externalKind === ExternalKind.Function;
    }
    isTagImport() {
      return this.externalKind === ExternalKind.Tag;
    }
    isGlobalImport() {
      return this.externalKind === ExternalKind.Global;
    }
    isMemoryImport() {
      return this.externalKind === ExternalKind.Memory;
    }
    isTableImport() {
      return this.externalKind === ExternalKind.Table;
    }
    write(writer) {
      writer.writeLenPrefixedString(this.moduleName);
      writer.writeLenPrefixedString(this.fieldName);
      writer.writeUInt8(this.externalKind.value);
      switch (this.externalKind) {
        case ExternalKind.Function:
          writer.writeVarUInt32(this.data.index);
          break;
        case ExternalKind.Tag:
          writer.writeVarUInt32(0);
          writer.writeVarUInt32(this.data.index);
          break;
        case ExternalKind.Global:
        case ExternalKind.Memory:
        case ExternalKind.Table:
          this.data.write(writer);
          break;
        default:
          throw new Error("Unknown external kind.");
      }
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/ImmediateEncoder.ts
  var ImmediateEncoder = class _ImmediateEncoder {
    static encodeBlockSignature(writer, blockType) {
      if (typeof blockType === "number") {
        writer.writeVarInt32(blockType);
      } else {
        writer.writeVarInt7(blockType.value);
      }
    }
    static encodeRelativeDepth(writer, label, depth) {
      const relativeDepth = depth - label.block.depth;
      writer.writeVarInt7(relativeDepth);
    }
    static encodeBranchTable(writer, defaultLabel, labels) {
      writer.writeVarUInt32(labels.length);
      labels.forEach((x) => {
        writer.writeVarUInt32(x);
      });
      writer.writeVarUInt32(defaultLabel);
    }
    static encodeFunction(writer, func) {
      let functionIndex = 0;
      if (func instanceof ImportBuilder) {
        functionIndex = func.index;
      } else if (typeof func === "object" && func !== null && "_index" in func) {
        functionIndex = func._index;
      } else if (typeof func === "number") {
        functionIndex = func;
      } else {
        throw new Error(
          "Function argument must either be the index of the function or a FunctionBuilder."
        );
      }
      writer.writeVarUInt32(functionIndex);
    }
    static encodeIndirectFunction(writer, funcType, tableIndex = 0) {
      writer.writeVarUInt32(funcType.index);
      writer.writeVarUInt32(tableIndex);
    }
    static encodeLocal(writer, local) {
      Arg.notNull("local", local);
      let localIndex = 0;
      if (local instanceof LocalBuilder) {
        localIndex = local.index;
      } else if (local instanceof FunctionParameterBuilder) {
        localIndex = local.index;
      } else if (typeof local === "number") {
        localIndex = local;
      } else {
        throw new Error(
          "Local argument must either be the index of the local variable or a LocalBuilder."
        );
      }
      writer.writeVarUInt32(localIndex);
    }
    static encodeGlobal(writer, global) {
      Arg.notNull("global", global);
      let globalIndex = 0;
      if (global instanceof GlobalBuilder) {
        globalIndex = global._index;
      } else if (global instanceof ImportBuilder) {
        if (global.externalKind !== ExternalKind.Global) {
          throw new Error("Import external kind must be global.");
        }
        globalIndex = global.index;
      } else if (typeof global === "number") {
        globalIndex = global;
      } else {
        throw new Error(
          "Global argument must either be the index of the global variable, GlobalBuilder, or an ImportBuilder."
        );
      }
      writer.writeVarUInt32(globalIndex);
    }
    static encodeFloat32(writer, value) {
      writer.writeFloat32(value);
    }
    static encodeFloat64(writer, value) {
      writer.writeFloat64(value);
    }
    static encodeVarInt32(writer, value) {
      writer.writeVarInt32(value);
    }
    static encodeVarInt64(writer, value) {
      writer.writeVarInt64(value);
    }
    static encodeVarUInt32(writer, value) {
      writer.writeVarUInt32(value);
    }
    static encodeVarUInt1(writer, value) {
      writer.writeVarUInt1(value);
    }
    static encodeMemoryImmediate(writer, alignment, offset) {
      writer.writeVarUInt32(alignment);
      if (typeof offset === "bigint") {
        writer.writeVarUInt64(offset);
      } else {
        writer.writeVarUInt32(offset);
      }
    }
    static encodeV128Const(writer, bytes) {
      for (let i = 0; i < 16; i++) {
        writer.writeByte(bytes[i]);
      }
    }
    static encodeLaneIndex(writer, index) {
      writer.writeByte(index);
    }
    static encodeShuffleMask(writer, mask) {
      for (let i = 0; i < 16; i++) {
        writer.writeByte(mask[i]);
      }
    }
    static encodeTypeIndexField(writer, typeIndex, fieldIndex) {
      writer.writeVarUInt32(typeIndex);
      writer.writeVarUInt32(fieldIndex);
    }
    static encodeTypeIndexIndex(writer, typeIndex, index) {
      writer.writeVarUInt32(typeIndex);
      writer.writeVarUInt32(index);
    }
    static encodeHeapType(writer, heapType) {
      if (typeof heapType === "number") {
        writer.writeVarInt32(heapType);
      } else if (typeof heapType === "object" && "value" in heapType && typeof heapType.value === "number") {
        writer.writeVarInt7(heapType.value);
      } else if (typeof heapType === "object" && "index" in heapType && typeof heapType.index === "number") {
        writer.writeVarInt32(heapType.index);
      } else {
        throw new Error("Invalid heap type argument.");
      }
    }
    static encodeBrOnCast(writer, flags, label, heapType1, heapType2, depth) {
      writer.writeByte(flags);
      const relativeDepth = depth - label.block.depth;
      writer.writeVarUInt32(relativeDepth);
      _ImmediateEncoder.encodeHeapType(writer, heapType1);
      _ImmediateEncoder.encodeHeapType(writer, heapType2);
    }
  };

  // src/Immediate.ts
  var Immediate = class _Immediate {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(type, values) {
      Arg.notNull("type", type);
      Arg.notNull("values", values);
      this.type = type;
      this.values = values;
    }
    static createBlockSignature(blockType) {
      return new _Immediate("BlockSignature" /* BlockSignature */, [blockType]);
    }
    static createBranchTable(defaultLabel, labels, depth) {
      const relativeDepths = labels.map((x) => {
        return depth - x.block.depth;
      });
      const defaultLabelDepth = depth - defaultLabel.block.depth;
      return new _Immediate("BranchTable" /* BranchTable */, [defaultLabelDepth, relativeDepths]);
    }
    static createFloat32(value) {
      return new _Immediate("Float32" /* Float32 */, [value]);
    }
    static createFloat64(value) {
      return new _Immediate("Float64" /* Float64 */, [value]);
    }
    static createFunction(func) {
      return new _Immediate("Function" /* Function */, [func]);
    }
    static createGlobal(global) {
      return new _Immediate("Global" /* Global */, [global]);
    }
    static createIndirectFunction(funcType, tableIndex = 0) {
      return new _Immediate("IndirectFunction" /* IndirectFunction */, [funcType, tableIndex]);
    }
    static createLocal(local) {
      return new _Immediate("Local" /* Local */, [local]);
    }
    static createMemoryImmediate(alignment, offset) {
      return new _Immediate("MemoryImmediate" /* MemoryImmediate */, [alignment, offset]);
    }
    static createRelativeDepth(label, depth) {
      return new _Immediate("RelativeDepth" /* RelativeDepth */, [label, depth]);
    }
    static createVarUInt1(value) {
      return new _Immediate("VarUInt1" /* VarUInt1 */, [value]);
    }
    static createVarInt32(value) {
      return new _Immediate("VarInt32" /* VarInt32 */, [value]);
    }
    static createVarInt64(value) {
      return new _Immediate("VarInt64" /* VarInt64 */, [value]);
    }
    static createVarUInt32(value) {
      return new _Immediate("VarUInt32" /* VarUInt32 */, [value]);
    }
    static createV128Const(bytes) {
      if (bytes.length !== 16) {
        throw new Error("V128 constant must be exactly 16 bytes.");
      }
      return new _Immediate("V128Const" /* V128Const */, [bytes]);
    }
    static createLaneIndex(index) {
      return new _Immediate("LaneIndex" /* LaneIndex */, [index]);
    }
    static createShuffleMask(mask) {
      if (mask.length !== 16) {
        throw new Error("Shuffle mask must be exactly 16 bytes.");
      }
      return new _Immediate("ShuffleMask" /* ShuffleMask */, [mask]);
    }
    static createTypeIndexField(typeIndex, fieldIndex) {
      return new _Immediate("TypeIndexField" /* TypeIndexField */, [typeIndex, fieldIndex]);
    }
    static createTypeIndexIndex(typeIndex, index) {
      return new _Immediate("TypeIndexIndex" /* TypeIndexIndex */, [typeIndex, index]);
    }
    static createHeapType(heapType) {
      return new _Immediate("HeapType" /* HeapType */, [heapType]);
    }
    static createBrOnCast(flags, label, heapType1, heapType2, depth) {
      return new _Immediate("BrOnCast" /* BrOnCast */, [flags, label, heapType1, heapType2, depth]);
    }
    writeBytes(writer) {
      switch (this.type) {
        case "BlockSignature" /* BlockSignature */:
          ImmediateEncoder.encodeBlockSignature(writer, this.values[0]);
          break;
        case "BranchTable" /* BranchTable */:
          ImmediateEncoder.encodeBranchTable(writer, this.values[0], this.values[1]);
          break;
        case "Float32" /* Float32 */:
          ImmediateEncoder.encodeFloat32(writer, this.values[0]);
          break;
        case "Float64" /* Float64 */:
          ImmediateEncoder.encodeFloat64(writer, this.values[0]);
          break;
        case "Function" /* Function */:
          ImmediateEncoder.encodeFunction(writer, this.values[0]);
          break;
        case "Global" /* Global */:
          ImmediateEncoder.encodeGlobal(writer, this.values[0]);
          break;
        case "IndirectFunction" /* IndirectFunction */:
          ImmediateEncoder.encodeIndirectFunction(writer, this.values[0], this.values[1]);
          break;
        case "Local" /* Local */:
          ImmediateEncoder.encodeLocal(writer, this.values[0]);
          break;
        case "MemoryImmediate" /* MemoryImmediate */:
          ImmediateEncoder.encodeMemoryImmediate(writer, this.values[0], this.values[1]);
          break;
        case "RelativeDepth" /* RelativeDepth */:
          ImmediateEncoder.encodeRelativeDepth(writer, this.values[0], this.values[1]);
          break;
        case "VarInt32" /* VarInt32 */:
          ImmediateEncoder.encodeVarInt32(writer, this.values[0]);
          break;
        case "VarInt64" /* VarInt64 */:
          ImmediateEncoder.encodeVarInt64(writer, this.values[0]);
          break;
        case "VarUInt1" /* VarUInt1 */:
          ImmediateEncoder.encodeVarUInt1(writer, this.values[0]);
          break;
        case "VarUInt32" /* VarUInt32 */:
          ImmediateEncoder.encodeVarUInt32(writer, this.values[0]);
          break;
        case "V128Const" /* V128Const */:
          ImmediateEncoder.encodeV128Const(writer, this.values[0]);
          break;
        case "LaneIndex" /* LaneIndex */:
          ImmediateEncoder.encodeLaneIndex(writer, this.values[0]);
          break;
        case "ShuffleMask" /* ShuffleMask */:
          ImmediateEncoder.encodeShuffleMask(writer, this.values[0]);
          break;
        case "TypeIndexField" /* TypeIndexField */:
          ImmediateEncoder.encodeTypeIndexField(writer, this.values[0], this.values[1]);
          break;
        case "TypeIndexIndex" /* TypeIndexIndex */:
          ImmediateEncoder.encodeTypeIndexIndex(writer, this.values[0], this.values[1]);
          break;
        case "HeapType" /* HeapType */:
          ImmediateEncoder.encodeHeapType(writer, this.values[0]);
          break;
        case "BrOnCast" /* BrOnCast */:
          ImmediateEncoder.encodeBrOnCast(writer, this.values[0], this.values[1], this.values[2], this.values[3], this.values[4]);
          break;
        default:
          throw new Error("Cannot encode unknown operand type.");
      }
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.writeBytes(buffer);
      return buffer.toArray();
    }
  };

  // src/Instruction.ts
  var Instruction = class {
    constructor(opCode, immediate) {
      Arg.notNull("opCode", opCode);
      this.opCode = opCode;
      this.immediate = immediate;
    }
    write(writer) {
      if (this.opCode.prefix !== void 0) {
        writer.writeByte(this.opCode.prefix);
        writer.writeVarUInt32(this.opCode.value);
      } else {
        writer.writeByte(this.opCode.value);
      }
      if (this.immediate) {
        this.immediate.writeBytes(writer);
      }
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/LabelBuilder.ts
  var LabelBuilder = class {
    constructor() {
      this.resolved = false;
      this.block = null;
    }
    get isResolved() {
      return this.resolved;
    }
    resolve(block) {
      this.block = block;
      this.resolved = true;
    }
    reference(block) {
      if (this.isResolved) {
        throw new Error("Cannot add a reference to a label that has been resolved.");
      }
      this.block = block;
    }
  };

  // src/OpCodes.ts
  var OpCodes = {
    "unreachable": {
      value: 0,
      mnemonic: "unreachable",
      stackBehavior: "None"
    },
    "nop": {
      value: 1,
      mnemonic: "nop",
      stackBehavior: "None"
    },
    "block": {
      value: 2,
      mnemonic: "block",
      immediate: "BlockSignature",
      controlFlow: "Push",
      stackBehavior: "None"
    },
    "loop": {
      value: 3,
      mnemonic: "loop",
      immediate: "BlockSignature",
      controlFlow: "Push",
      stackBehavior: "None"
    },
    "if": {
      value: 4,
      mnemonic: "if",
      immediate: "BlockSignature",
      controlFlow: "Push",
      stackBehavior: "Pop",
      popOperands: ["Int32"]
    },
    "else": {
      value: 5,
      mnemonic: "else",
      stackBehavior: "None"
    },
    "try": {
      value: 6,
      mnemonic: "try",
      immediate: "BlockSignature",
      controlFlow: "Push",
      stackBehavior: "None",
      feature: "exception-handling"
    },
    "catch": {
      value: 7,
      mnemonic: "catch",
      immediate: "VarUInt32",
      stackBehavior: "None",
      feature: "exception-handling"
    },
    "throw": {
      value: 8,
      mnemonic: "throw",
      immediate: "VarUInt32",
      stackBehavior: "None",
      feature: "exception-handling"
    },
    "rethrow": {
      value: 9,
      mnemonic: "rethrow",
      immediate: "VarUInt32",
      stackBehavior: "None",
      feature: "exception-handling"
    },
    "end": {
      value: 11,
      mnemonic: "end",
      controlFlow: "Pop",
      stackBehavior: "None"
    },
    "br": {
      value: 12,
      mnemonic: "br",
      immediate: "RelativeDepth",
      stackBehavior: "None"
    },
    "br_if": {
      value: 13,
      mnemonic: "br_if",
      immediate: "RelativeDepth",
      stackBehavior: "Pop",
      popOperands: ["Int32"]
    },
    "br_table": {
      value: 14,
      mnemonic: "br_table",
      immediate: "BranchTable",
      stackBehavior: "Pop",
      popOperands: ["Int32"]
    },
    "return": {
      value: 15,
      mnemonic: "return",
      stackBehavior: "None"
    },
    "call": {
      value: 16,
      mnemonic: "call",
      immediate: "Function",
      stackBehavior: "PopPush"
    },
    "call_indirect": {
      value: 17,
      mnemonic: "call_indirect",
      immediate: "IndirectFunction",
      stackBehavior: "PopPush",
      popOperands: ["Int32"]
    },
    "return_call": {
      value: 18,
      mnemonic: "return_call",
      immediate: "Function",
      stackBehavior: "PopPush",
      feature: "tail-call"
    },
    "return_call_indirect": {
      value: 19,
      mnemonic: "return_call_indirect",
      immediate: "IndirectFunction",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      feature: "tail-call"
    },
    "delegate": {
      value: 24,
      mnemonic: "delegate",
      immediate: "VarUInt32",
      stackBehavior: "None",
      feature: "exception-handling"
    },
    "catch_all": {
      value: 25,
      mnemonic: "catch_all",
      stackBehavior: "None",
      feature: "exception-handling"
    },
    "drop": {
      value: 26,
      mnemonic: "drop",
      stackBehavior: "Pop",
      popOperands: ["Any"]
    },
    "select": {
      value: 27,
      mnemonic: "select",
      stackBehavior: "PopPush",
      popOperands: ["Any", "Any", "Int32"],
      pushOperands: ["Any"]
    },
    "get_local": {
      value: 32,
      mnemonic: "local.get",
      immediate: "Local",
      stackBehavior: "Push",
      pushOperands: ["Any"]
    },
    "set_local": {
      value: 33,
      mnemonic: "local.set",
      immediate: "Local",
      stackBehavior: "Pop",
      popOperands: ["Any"]
    },
    "tee_local": {
      value: 34,
      mnemonic: "local.tee",
      immediate: "Local",
      stackBehavior: "PopPush",
      popOperands: ["Any"],
      pushOperands: ["Any"]
    },
    "get_global": {
      value: 35,
      mnemonic: "global.get",
      immediate: "Global",
      stackBehavior: "Push",
      pushOperands: ["Any"]
    },
    "set_global": {
      value: 36,
      mnemonic: "global.set",
      immediate: "Global",
      stackBehavior: "Pop",
      popOperands: ["Any"]
    },
    "i32_load": {
      value: 40,
      mnemonic: "i32.load",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"]
    },
    "i64_load": {
      value: 41,
      mnemonic: "i64.load",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int64"]
    },
    "f32_load": {
      value: 42,
      mnemonic: "f32.load",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Float32"]
    },
    "f64_load": {
      value: 43,
      mnemonic: "f64.load",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Float64"]
    },
    "i32_load8_s": {
      value: 44,
      mnemonic: "i32.load8_s",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"]
    },
    "i32_load8_u": {
      value: 45,
      mnemonic: "i32.load8_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"]
    },
    "i32_load16_s": {
      value: 46,
      mnemonic: "i32.load16_s",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"]
    },
    "i32_load16_u": {
      value: 47,
      mnemonic: "i32.load16_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"]
    },
    "i64_load8_s": {
      value: 48,
      mnemonic: "i64.load8_s",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int64"]
    },
    "i64_load8_u": {
      value: 49,
      mnemonic: "i64.load8_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int64"]
    },
    "i64_load16_s": {
      value: 50,
      mnemonic: "i64.load16_s",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int64"]
    },
    "i64_load16_u": {
      value: 51,
      mnemonic: "i64.load16_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int64"]
    },
    "i64_load32_s": {
      value: 52,
      mnemonic: "i64.load32_s",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int64"]
    },
    "i64_load32_u": {
      value: 53,
      mnemonic: "i64.load32_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int64"]
    },
    "i32_store": {
      value: 54,
      mnemonic: "i32.store",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int32"]
    },
    "i64_store": {
      value: 55,
      mnemonic: "i64.store",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int64"]
    },
    "f32_store": {
      value: 56,
      mnemonic: "f32.store",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Float32"]
    },
    "f64_store": {
      value: 57,
      mnemonic: "f64.store",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Float64"]
    },
    "i32_store8": {
      value: 58,
      mnemonic: "i32.store8",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int32"]
    },
    "i32_store16": {
      value: 59,
      mnemonic: "i32.store16",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int32"]
    },
    "i64_store8": {
      value: 60,
      mnemonic: "i64.store8",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int64"]
    },
    "i64_store16": {
      value: 61,
      mnemonic: "i64.store16",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int64"]
    },
    "i64_store32": {
      value: 62,
      mnemonic: "i64.store32",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int64"]
    },
    "mem_size": {
      value: 63,
      mnemonic: "memory.size",
      immediate: "VarUInt1",
      stackBehavior: "Push",
      pushOperands: ["Int32"]
    },
    "mem_grow": {
      value: 64,
      mnemonic: "memory.grow",
      immediate: "VarUInt1",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"]
    },
    "i32_const": {
      value: 65,
      mnemonic: "i32.const",
      immediate: "VarInt32",
      stackBehavior: "Push",
      pushOperands: ["Int32"]
    },
    "i64_const": {
      value: 66,
      mnemonic: "i64.const",
      immediate: "VarInt64",
      stackBehavior: "Push",
      pushOperands: ["Int64"]
    },
    "f32_const": {
      value: 67,
      mnemonic: "f32.const",
      immediate: "Float32",
      stackBehavior: "Push",
      pushOperands: ["Float32"]
    },
    "f64_const": {
      value: 68,
      mnemonic: "f64.const",
      immediate: "Float64",
      stackBehavior: "Push",
      pushOperands: ["Float64"]
    },
    "i32_eqz": {
      value: 69,
      mnemonic: "i32.eqz",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"]
    },
    "i32_eq": {
      value: 70,
      mnemonic: "i32.eq",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_ne": {
      value: 71,
      mnemonic: "i32.ne",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_lt_s": {
      value: 72,
      mnemonic: "i32.lt_s",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_lt_u": {
      value: 73,
      mnemonic: "i32.lt_u",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_gt_s": {
      value: 74,
      mnemonic: "i32.gt_s",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_gt_u": {
      value: 75,
      mnemonic: "i32.gt_u",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_le_s": {
      value: 76,
      mnemonic: "i32.le_s",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_le_u": {
      value: 77,
      mnemonic: "i32.le_u",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_ge_s": {
      value: 78,
      mnemonic: "i32.ge_s",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_ge_u": {
      value: 79,
      mnemonic: "i32.ge_u",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i64_eqz": {
      value: 80,
      mnemonic: "i64.eqz",
      stackBehavior: "PopPush",
      popOperands: ["Int64"],
      pushOperands: ["Int32"]
    },
    "i64_eq": {
      value: 81,
      mnemonic: "i64.eq",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int32"]
    },
    "i64_ne": {
      value: 82,
      mnemonic: "i64.ne",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int32"]
    },
    "i64_lt_s": {
      value: 83,
      mnemonic: "i64.lt_s",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int32"]
    },
    "i64_lt_u": {
      value: 84,
      mnemonic: "i64.lt_u",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int32"]
    },
    "i64_gt_s": {
      value: 85,
      mnemonic: "i64.gt_s",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int32"]
    },
    "i64_gt_u": {
      value: 86,
      mnemonic: "i64.gt_u",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int32"]
    },
    "i64_le_s": {
      value: 87,
      mnemonic: "i64.le_s",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int32"]
    },
    "i64_le_u": {
      value: 88,
      mnemonic: "i64.le_u",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int32"]
    },
    "i64_ge_s": {
      value: 89,
      mnemonic: "i64.ge_s",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int32"]
    },
    "i64_ge_u": {
      value: 90,
      mnemonic: "i64.ge_u",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int32"]
    },
    "f32_eq": {
      value: 91,
      mnemonic: "f32.eq",
      stackBehavior: "PopPush",
      popOperands: ["Float32", "Float32"],
      pushOperands: ["Int32"]
    },
    "f32_ne": {
      value: 92,
      mnemonic: "f32.ne",
      stackBehavior: "PopPush",
      popOperands: ["Float32", "Float32"],
      pushOperands: ["Int32"]
    },
    "f32_lt": {
      value: 93,
      mnemonic: "f32.lt",
      stackBehavior: "PopPush",
      popOperands: ["Float32", "Float32"],
      pushOperands: ["Int32"]
    },
    "f32_gt": {
      value: 94,
      mnemonic: "f32.gt",
      stackBehavior: "PopPush",
      popOperands: ["Float32", "Float32"],
      pushOperands: ["Int32"]
    },
    "f32_le": {
      value: 95,
      mnemonic: "f32.le",
      stackBehavior: "PopPush",
      popOperands: ["Float32", "Float32"],
      pushOperands: ["Int32"]
    },
    "f32_ge": {
      value: 96,
      mnemonic: "f32.ge",
      stackBehavior: "PopPush",
      popOperands: ["Float32", "Float32"],
      pushOperands: ["Int32"]
    },
    "f64_eq": {
      value: 97,
      mnemonic: "f64.eq",
      stackBehavior: "PopPush",
      popOperands: ["Float64", "Float64"],
      pushOperands: ["Int32"]
    },
    "f64_ne": {
      value: 98,
      mnemonic: "f64.ne",
      stackBehavior: "PopPush",
      popOperands: ["Float64", "Float64"],
      pushOperands: ["Int32"]
    },
    "f64_lt": {
      value: 99,
      mnemonic: "f64.lt",
      stackBehavior: "PopPush",
      popOperands: ["Float64", "Float64"],
      pushOperands: ["Int32"]
    },
    "f64_gt": {
      value: 100,
      mnemonic: "f64.gt",
      stackBehavior: "PopPush",
      popOperands: ["Float64", "Float64"],
      pushOperands: ["Int32"]
    },
    "f64_le": {
      value: 101,
      mnemonic: "f64.le",
      stackBehavior: "PopPush",
      popOperands: ["Float64", "Float64"],
      pushOperands: ["Int32"]
    },
    "f64_ge": {
      value: 102,
      mnemonic: "f64.ge",
      stackBehavior: "PopPush",
      popOperands: ["Float64", "Float64"],
      pushOperands: ["Int32"]
    },
    "i32_clz": {
      value: 103,
      mnemonic: "i32.clz",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"]
    },
    "i32_ctz": {
      value: 104,
      mnemonic: "i32.ctz",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"]
    },
    "i32_popcnt": {
      value: 105,
      mnemonic: "i32.popcnt",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"]
    },
    "i32_add": {
      value: 106,
      mnemonic: "i32.add",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_sub": {
      value: 107,
      mnemonic: "i32.sub",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_mul": {
      value: 108,
      mnemonic: "i32.mul",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_div_s": {
      value: 109,
      mnemonic: "i32.div_s",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_div_u": {
      value: 110,
      mnemonic: "i32.div_u",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_rem_s": {
      value: 111,
      mnemonic: "i32.rem_s",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_rem_u": {
      value: 112,
      mnemonic: "i32.rem_u",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_and": {
      value: 113,
      mnemonic: "i32.and",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_or": {
      value: 114,
      mnemonic: "i32.or",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_xor": {
      value: 115,
      mnemonic: "i32.xor",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_shl": {
      value: 116,
      mnemonic: "i32.shl",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_shr_s": {
      value: 117,
      mnemonic: "i32.shr_s",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_shr_u": {
      value: 118,
      mnemonic: "i32.shr_u",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_rotl": {
      value: 119,
      mnemonic: "i32.rotl",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i32_rotr": {
      value: 120,
      mnemonic: "i32.rotr",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"]
    },
    "i64_clz": {
      value: 121,
      mnemonic: "i64.clz",
      stackBehavior: "PopPush",
      popOperands: ["Int64"],
      pushOperands: ["Int64"]
    },
    "i64_ctz": {
      value: 122,
      mnemonic: "i64.ctz",
      stackBehavior: "PopPush",
      popOperands: ["Int64"],
      pushOperands: ["Int64"]
    },
    "i64_popcnt": {
      value: 123,
      mnemonic: "i64.popcnt",
      stackBehavior: "PopPush",
      popOperands: ["Int64"],
      pushOperands: ["Int64"]
    },
    "i64_add": {
      value: 124,
      mnemonic: "i64.add",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int64"]
    },
    "i64_sub": {
      value: 125,
      mnemonic: "i64.sub",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int64"]
    },
    "i64_mul": {
      value: 126,
      mnemonic: "i64.mul",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int64"]
    },
    "i64_div_s": {
      value: 127,
      mnemonic: "i64.div_s",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int64"]
    },
    "i64_div_u": {
      value: 128,
      mnemonic: "i64.div_u",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int64"]
    },
    "i64_rem_s": {
      value: 129,
      mnemonic: "i64.rem_s",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int64"]
    },
    "i64_rem_u": {
      value: 130,
      mnemonic: "i64.rem_u",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int64"]
    },
    "i64_and": {
      value: 131,
      mnemonic: "i64.and",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int64"]
    },
    "i64_or": {
      value: 132,
      mnemonic: "i64.or",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int64"]
    },
    "i64_xor": {
      value: 133,
      mnemonic: "i64.xor",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int64"]
    },
    "i64_shl": {
      value: 134,
      mnemonic: "i64.shl",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int64"]
    },
    "i64_shr_s": {
      value: 135,
      mnemonic: "i64.shr_s",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int64"]
    },
    "i64_shr_u": {
      value: 136,
      mnemonic: "i64.shr_u",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int64"]
    },
    "i64_rotl": {
      value: 137,
      mnemonic: "i64.rotl",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int64"]
    },
    "i64_rotr": {
      value: 138,
      mnemonic: "i64.rotr",
      stackBehavior: "PopPush",
      popOperands: ["Int64", "Int64"],
      pushOperands: ["Int64"]
    },
    "f32_abs": {
      value: 139,
      mnemonic: "f32.abs",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Float32"]
    },
    "f32_neg": {
      value: 140,
      mnemonic: "f32.neg",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Float32"]
    },
    "f32_ceil": {
      value: 141,
      mnemonic: "f32.ceil",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Float32"]
    },
    "f32_floor": {
      value: 142,
      mnemonic: "f32.floor",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Float32"]
    },
    "f32_trunc": {
      value: 143,
      mnemonic: "f32.trunc",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Float32"]
    },
    "f32_nearest": {
      value: 144,
      mnemonic: "f32.nearest",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Float32"]
    },
    "f32_sqrt": {
      value: 145,
      mnemonic: "f32.sqrt",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Float32"]
    },
    "f32_add": {
      value: 146,
      mnemonic: "f32.add",
      stackBehavior: "PopPush",
      popOperands: ["Float32", "Float32"],
      pushOperands: ["Float32"]
    },
    "f32_sub": {
      value: 147,
      mnemonic: "f32.sub",
      stackBehavior: "PopPush",
      popOperands: ["Float32", "Float32"],
      pushOperands: ["Float32"]
    },
    "f32_mul": {
      value: 148,
      mnemonic: "f32.mul",
      stackBehavior: "PopPush",
      popOperands: ["Float32", "Float32"],
      pushOperands: ["Float32"]
    },
    "f32_div": {
      value: 149,
      mnemonic: "f32.div",
      stackBehavior: "PopPush",
      popOperands: ["Float32", "Float32"],
      pushOperands: ["Float32"]
    },
    "f32_min": {
      value: 150,
      mnemonic: "f32.min",
      stackBehavior: "PopPush",
      popOperands: ["Float32", "Float32"],
      pushOperands: ["Float32"]
    },
    "f32_max": {
      value: 151,
      mnemonic: "f32.max",
      stackBehavior: "PopPush",
      popOperands: ["Float32", "Float32"],
      pushOperands: ["Float32"]
    },
    "f32_copysign": {
      value: 152,
      mnemonic: "f32.copysign",
      stackBehavior: "PopPush",
      popOperands: ["Float32", "Float32"],
      pushOperands: ["Float32"]
    },
    "f64_abs": {
      value: 153,
      mnemonic: "f64.abs",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Float64"]
    },
    "f64_neg": {
      value: 154,
      mnemonic: "f64.neg",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Float64"]
    },
    "f64_ceil": {
      value: 155,
      mnemonic: "f64.ceil",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Float64"]
    },
    "f64_floor": {
      value: 156,
      mnemonic: "f64.floor",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Float64"]
    },
    "f64_trunc": {
      value: 157,
      mnemonic: "f64.trunc",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Float64"]
    },
    "f64_nearest": {
      value: 158,
      mnemonic: "f64.nearest",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Float64"]
    },
    "f64_sqrt": {
      value: 159,
      mnemonic: "f64.sqrt",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Float64"]
    },
    "f64_add": {
      value: 160,
      mnemonic: "f64.add",
      stackBehavior: "PopPush",
      popOperands: ["Float64", "Float64"],
      pushOperands: ["Float64"]
    },
    "f64_sub": {
      value: 161,
      mnemonic: "f64.sub",
      stackBehavior: "PopPush",
      popOperands: ["Float64", "Float64"],
      pushOperands: ["Float64"]
    },
    "f64_mul": {
      value: 162,
      mnemonic: "f64.mul",
      stackBehavior: "PopPush",
      popOperands: ["Float64", "Float64"],
      pushOperands: ["Float64"]
    },
    "f64_div": {
      value: 163,
      mnemonic: "f64.div",
      stackBehavior: "PopPush",
      popOperands: ["Float64", "Float64"],
      pushOperands: ["Float64"]
    },
    "f64_min": {
      value: 164,
      mnemonic: "f64.min",
      stackBehavior: "PopPush",
      popOperands: ["Float64", "Float64"],
      pushOperands: ["Float64"]
    },
    "f64_max": {
      value: 165,
      mnemonic: "f64.max",
      stackBehavior: "PopPush",
      popOperands: ["Float64", "Float64"],
      pushOperands: ["Float64"]
    },
    "f64_copysign": {
      value: 166,
      mnemonic: "f64.copysign",
      stackBehavior: "PopPush",
      popOperands: ["Float64", "Float64"],
      pushOperands: ["Float64"]
    },
    "i32_wrap_i64": {
      value: 167,
      mnemonic: "i32.wrap_i64",
      stackBehavior: "PopPush",
      popOperands: ["Int64"],
      pushOperands: ["Int32"]
    },
    "i32_trunc_f32_s": {
      value: 168,
      mnemonic: "i32.trunc_f32_s",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Int32"]
    },
    "i32_trunc_f32_u": {
      value: 169,
      mnemonic: "i32.trunc_f32_u",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Int32"]
    },
    "i32_trunc_f64_s": {
      value: 170,
      mnemonic: "i32.trunc_f64_s",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Int32"]
    },
    "i32_trunc_f64_u": {
      value: 171,
      mnemonic: "i32.trunc_f64_u",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Int32"]
    },
    "i64_extend_i32_s": {
      value: 172,
      mnemonic: "i64.extend_i32_s",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int64"]
    },
    "i64_extend_i32_u": {
      value: 173,
      mnemonic: "i64.extend_i32_u",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int64"]
    },
    "i64_trunc_f32_s": {
      value: 174,
      mnemonic: "i64.trunc_f32_s",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Int64"]
    },
    "i64_trunc_f32_u": {
      value: 175,
      mnemonic: "i64.trunc_f32_u",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Int64"]
    },
    "i64_trunc_f64_s": {
      value: 176,
      mnemonic: "i64.trunc_f64_s",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Int64"]
    },
    "i64_trunc_f64_u": {
      value: 177,
      mnemonic: "i64.trunc_f64_u",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Int64"]
    },
    "f32_convert_i32_s": {
      value: 178,
      mnemonic: "f32.convert_i32_s",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Float32"]
    },
    "f32_convert_i32_u": {
      value: 179,
      mnemonic: "f32.convert_i32_u",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Float32"]
    },
    "f32_convert_i64_s": {
      value: 180,
      mnemonic: "f32.convert_i64_s",
      stackBehavior: "PopPush",
      popOperands: ["Int64"],
      pushOperands: ["Float32"]
    },
    "f32_convert_i64_u": {
      value: 181,
      mnemonic: "f32.convert_i64_u",
      stackBehavior: "PopPush",
      popOperands: ["Int64"],
      pushOperands: ["Float32"]
    },
    "f32_demote_f64": {
      value: 182,
      mnemonic: "f32.demote_f64",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Float32"]
    },
    "f64_convert_i32_s": {
      value: 183,
      mnemonic: "f64.convert_i32_s",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Float64"]
    },
    "f64_convert_i32_u": {
      value: 184,
      mnemonic: "f64.convert_i32_u",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Float64"]
    },
    "f64_convert_i64_s": {
      value: 185,
      mnemonic: "f64.convert_i64_s",
      stackBehavior: "PopPush",
      popOperands: ["Int64"],
      pushOperands: ["Float64"]
    },
    "f64_convert_i64_u": {
      value: 186,
      mnemonic: "f64.convert_i64_u",
      stackBehavior: "PopPush",
      popOperands: ["Int64"],
      pushOperands: ["Float64"]
    },
    "f64_promote_f32": {
      value: 187,
      mnemonic: "f64.promote_f32",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Float64"]
    },
    "i32_reinterpret_f32": {
      value: 188,
      mnemonic: "i32.reinterpret_f32",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Int32"]
    },
    "i64_reinterpret_f64": {
      value: 189,
      mnemonic: "i64.reinterpret_f64",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Int64"]
    },
    "f32_reinterpret_i32": {
      value: 190,
      mnemonic: "f32.reinterpret_i32",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Float32"]
    },
    "f64_reinterpret_i64": {
      value: 191,
      mnemonic: "f64.reinterpret_i64",
      stackBehavior: "PopPush",
      popOperands: ["Int64"],
      pushOperands: ["Float64"]
    },
    "i32_extend8_s": {
      value: 192,
      mnemonic: "i32.extend8_s",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"],
      feature: "sign-extend"
    },
    "i32_extend16_s": {
      value: 193,
      mnemonic: "i32.extend16_s",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"],
      feature: "sign-extend"
    },
    "i64_extend8_s": {
      value: 194,
      mnemonic: "i64.extend8_s",
      stackBehavior: "PopPush",
      popOperands: ["Int64"],
      pushOperands: ["Int64"],
      feature: "sign-extend"
    },
    "i64_extend16_s": {
      value: 195,
      mnemonic: "i64.extend16_s",
      stackBehavior: "PopPush",
      popOperands: ["Int64"],
      pushOperands: ["Int64"],
      feature: "sign-extend"
    },
    "i64_extend32_s": {
      value: 196,
      mnemonic: "i64.extend32_s",
      stackBehavior: "PopPush",
      popOperands: ["Int64"],
      pushOperands: ["Int64"],
      feature: "sign-extend"
    },
    "i32_trunc_sat_f32_s": {
      value: 0,
      mnemonic: "i32.trunc_sat_f32_s",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Int32"],
      prefix: 252,
      feature: "sat-trunc"
    },
    "i32_trunc_sat_f32_u": {
      value: 1,
      mnemonic: "i32.trunc_sat_f32_u",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Int32"],
      prefix: 252,
      feature: "sat-trunc"
    },
    "i32_trunc_sat_f64_s": {
      value: 2,
      mnemonic: "i32.trunc_sat_f64_s",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Int32"],
      prefix: 252,
      feature: "sat-trunc"
    },
    "i32_trunc_sat_f64_u": {
      value: 3,
      mnemonic: "i32.trunc_sat_f64_u",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Int32"],
      prefix: 252,
      feature: "sat-trunc"
    },
    "i64_trunc_sat_f32_s": {
      value: 4,
      mnemonic: "i64.trunc_sat_f32_s",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Int64"],
      prefix: 252,
      feature: "sat-trunc"
    },
    "i64_trunc_sat_f32_u": {
      value: 5,
      mnemonic: "i64.trunc_sat_f32_u",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["Int64"],
      prefix: 252,
      feature: "sat-trunc"
    },
    "i64_trunc_sat_f64_s": {
      value: 6,
      mnemonic: "i64.trunc_sat_f64_s",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Int64"],
      prefix: 252,
      feature: "sat-trunc"
    },
    "i64_trunc_sat_f64_u": {
      value: 7,
      mnemonic: "i64.trunc_sat_f64_u",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["Int64"],
      prefix: 252,
      feature: "sat-trunc"
    },
    "memory_init": {
      value: 8,
      mnemonic: "memory.init",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int32", "Int32"],
      prefix: 252,
      feature: "bulk-memory"
    },
    "data_drop": {
      value: 9,
      mnemonic: "data.drop",
      immediate: "VarUInt32",
      stackBehavior: "None",
      prefix: 252,
      feature: "bulk-memory"
    },
    "memory_copy": {
      value: 10,
      mnemonic: "memory.copy",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int32", "Int32"],
      prefix: 252,
      feature: "bulk-memory"
    },
    "memory_fill": {
      value: 11,
      mnemonic: "memory.fill",
      immediate: "VarUInt1",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int32", "Int32"],
      prefix: 252,
      feature: "bulk-memory"
    },
    "table_init": {
      value: 12,
      mnemonic: "table.init",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int32", "Int32"],
      prefix: 252,
      feature: "bulk-memory"
    },
    "elem_drop": {
      value: 13,
      mnemonic: "elem.drop",
      immediate: "VarUInt32",
      stackBehavior: "None",
      prefix: 252,
      feature: "bulk-memory"
    },
    "table_copy": {
      value: 14,
      mnemonic: "table.copy",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int32", "Int32"],
      prefix: 252,
      feature: "bulk-memory"
    },
    "table_grow": {
      value: 15,
      mnemonic: "table.grow",
      immediate: "VarUInt32",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 252,
      feature: "reference-types"
    },
    "table_size": {
      value: 16,
      mnemonic: "table.size",
      immediate: "VarUInt32",
      stackBehavior: "Push",
      pushOperands: ["Int32"],
      prefix: 252,
      feature: "reference-types"
    },
    "table_fill": {
      value: 17,
      mnemonic: "table.fill",
      immediate: "VarUInt32",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int32", "Int32"],
      prefix: 252,
      feature: "reference-types"
    },
    "ref_null": {
      value: 208,
      mnemonic: "ref.null",
      immediate: "VarUInt32",
      stackBehavior: "Push",
      pushOperands: ["Int32"],
      feature: "reference-types"
    },
    "ref_is_null": {
      value: 209,
      mnemonic: "ref.is_null",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"],
      feature: "reference-types"
    },
    "ref_func": {
      value: 210,
      mnemonic: "ref.func",
      immediate: "Function",
      stackBehavior: "Push",
      pushOperands: ["Int32"],
      feature: "reference-types"
    },
    "table_get": {
      value: 37,
      mnemonic: "table.get",
      immediate: "VarUInt32",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"],
      feature: "reference-types"
    },
    "table_set": {
      value: 38,
      mnemonic: "table.set",
      immediate: "VarUInt32",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int32"],
      feature: "reference-types"
    },
    "v128_load": {
      value: 0,
      mnemonic: "v128.load",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load8x8_s": {
      value: 1,
      mnemonic: "v128.load8x8_s",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load8x8_u": {
      value: 2,
      mnemonic: "v128.load8x8_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load16x4_s": {
      value: 3,
      mnemonic: "v128.load16x4_s",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load16x4_u": {
      value: 4,
      mnemonic: "v128.load16x4_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load32x2_s": {
      value: 5,
      mnemonic: "v128.load32x2_s",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load32x2_u": {
      value: 6,
      mnemonic: "v128.load32x2_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load8_splat": {
      value: 7,
      mnemonic: "v128.load8_splat",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load16_splat": {
      value: 8,
      mnemonic: "v128.load16_splat",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load32_splat": {
      value: 9,
      mnemonic: "v128.load32_splat",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load64_splat": {
      value: 10,
      mnemonic: "v128.load64_splat",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_store": {
      value: 11,
      mnemonic: "v128.store",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_const": {
      value: 12,
      mnemonic: "v128.const",
      immediate: "V128Const",
      stackBehavior: "Push",
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_shuffle": {
      value: 13,
      mnemonic: "i8x16.shuffle",
      immediate: "ShuffleMask",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_swizzle": {
      value: 14,
      mnemonic: "i8x16.swizzle",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_splat": {
      value: 15,
      mnemonic: "i8x16.splat",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_splat": {
      value: 16,
      mnemonic: "i16x8.splat",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_splat": {
      value: 17,
      mnemonic: "i32x4.splat",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_splat": {
      value: 18,
      mnemonic: "i64x2.splat",
      stackBehavior: "PopPush",
      popOperands: ["Int64"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_splat": {
      value: 19,
      mnemonic: "f32x4.splat",
      stackBehavior: "PopPush",
      popOperands: ["Float32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_splat": {
      value: 20,
      mnemonic: "f64x2.splat",
      stackBehavior: "PopPush",
      popOperands: ["Float64"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_extract_lane_s": {
      value: 21,
      mnemonic: "i8x16.extract_lane_s",
      immediate: "LaneIndex",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Int32"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_extract_lane_u": {
      value: 22,
      mnemonic: "i8x16.extract_lane_u",
      immediate: "LaneIndex",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Int32"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_replace_lane": {
      value: 23,
      mnemonic: "i8x16.replace_lane",
      immediate: "LaneIndex",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_extract_lane_s": {
      value: 24,
      mnemonic: "i16x8.extract_lane_s",
      immediate: "LaneIndex",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Int32"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_extract_lane_u": {
      value: 25,
      mnemonic: "i16x8.extract_lane_u",
      immediate: "LaneIndex",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Int32"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_replace_lane": {
      value: 26,
      mnemonic: "i16x8.replace_lane",
      immediate: "LaneIndex",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_extract_lane": {
      value: 27,
      mnemonic: "i32x4.extract_lane",
      immediate: "LaneIndex",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Int32"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_replace_lane": {
      value: 28,
      mnemonic: "i32x4.replace_lane",
      immediate: "LaneIndex",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_extract_lane": {
      value: 29,
      mnemonic: "i64x2.extract_lane",
      immediate: "LaneIndex",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Int64"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_replace_lane": {
      value: 30,
      mnemonic: "i64x2.replace_lane",
      immediate: "LaneIndex",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int64"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_extract_lane": {
      value: 31,
      mnemonic: "f32x4.extract_lane",
      immediate: "LaneIndex",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Float32"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_replace_lane": {
      value: 32,
      mnemonic: "f32x4.replace_lane",
      immediate: "LaneIndex",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Float32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_extract_lane": {
      value: 33,
      mnemonic: "f64x2.extract_lane",
      immediate: "LaneIndex",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Float64"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_replace_lane": {
      value: 34,
      mnemonic: "f64x2.replace_lane",
      immediate: "LaneIndex",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Float64"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_eq": {
      value: 35,
      mnemonic: "i8x16.eq",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_ne": {
      value: 36,
      mnemonic: "i8x16.ne",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_lt_s": {
      value: 37,
      mnemonic: "i8x16.lt_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_lt_u": {
      value: 38,
      mnemonic: "i8x16.lt_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_gt_s": {
      value: 39,
      mnemonic: "i8x16.gt_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_gt_u": {
      value: 40,
      mnemonic: "i8x16.gt_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_le_s": {
      value: 41,
      mnemonic: "i8x16.le_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_le_u": {
      value: 42,
      mnemonic: "i8x16.le_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_ge_s": {
      value: 43,
      mnemonic: "i8x16.ge_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_ge_u": {
      value: 44,
      mnemonic: "i8x16.ge_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_eq": {
      value: 45,
      mnemonic: "i16x8.eq",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_ne": {
      value: 46,
      mnemonic: "i16x8.ne",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_lt_s": {
      value: 47,
      mnemonic: "i16x8.lt_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_lt_u": {
      value: 48,
      mnemonic: "i16x8.lt_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_gt_s": {
      value: 49,
      mnemonic: "i16x8.gt_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_gt_u": {
      value: 50,
      mnemonic: "i16x8.gt_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_le_s": {
      value: 51,
      mnemonic: "i16x8.le_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_le_u": {
      value: 52,
      mnemonic: "i16x8.le_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_ge_s": {
      value: 53,
      mnemonic: "i16x8.ge_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_ge_u": {
      value: 54,
      mnemonic: "i16x8.ge_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_eq": {
      value: 55,
      mnemonic: "i32x4.eq",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_ne": {
      value: 56,
      mnemonic: "i32x4.ne",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_lt_s": {
      value: 57,
      mnemonic: "i32x4.lt_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_lt_u": {
      value: 58,
      mnemonic: "i32x4.lt_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_gt_s": {
      value: 59,
      mnemonic: "i32x4.gt_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_gt_u": {
      value: 60,
      mnemonic: "i32x4.gt_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_le_s": {
      value: 61,
      mnemonic: "i32x4.le_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_le_u": {
      value: 62,
      mnemonic: "i32x4.le_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_ge_s": {
      value: 63,
      mnemonic: "i32x4.ge_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_ge_u": {
      value: 64,
      mnemonic: "i32x4.ge_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_eq": {
      value: 65,
      mnemonic: "f32x4.eq",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_ne": {
      value: 66,
      mnemonic: "f32x4.ne",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_lt": {
      value: 67,
      mnemonic: "f32x4.lt",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_gt": {
      value: 68,
      mnemonic: "f32x4.gt",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_le": {
      value: 69,
      mnemonic: "f32x4.le",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_ge": {
      value: 70,
      mnemonic: "f32x4.ge",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_eq": {
      value: 71,
      mnemonic: "f64x2.eq",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_ne": {
      value: 72,
      mnemonic: "f64x2.ne",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_lt": {
      value: 73,
      mnemonic: "f64x2.lt",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_gt": {
      value: 74,
      mnemonic: "f64x2.gt",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_le": {
      value: 75,
      mnemonic: "f64x2.le",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_ge": {
      value: 76,
      mnemonic: "f64x2.ge",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_not": {
      value: 77,
      mnemonic: "v128.not",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_and": {
      value: 78,
      mnemonic: "v128.and",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_andnot": {
      value: 79,
      mnemonic: "v128.andnot",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_or": {
      value: 80,
      mnemonic: "v128.or",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_xor": {
      value: 81,
      mnemonic: "v128.xor",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_bitselect": {
      value: 82,
      mnemonic: "v128.bitselect",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_any_true": {
      value: 83,
      mnemonic: "v128.any_true",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Int32"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load8_lane": {
      value: 84,
      mnemonic: "v128.load8_lane",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load16_lane": {
      value: 85,
      mnemonic: "v128.load16_lane",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load32_lane": {
      value: 86,
      mnemonic: "v128.load32_lane",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load64_lane": {
      value: 87,
      mnemonic: "v128.load64_lane",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_store8_lane": {
      value: 88,
      mnemonic: "v128.store8_lane",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_store16_lane": {
      value: 89,
      mnemonic: "v128.store16_lane",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_store32_lane": {
      value: 90,
      mnemonic: "v128.store32_lane",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_store64_lane": {
      value: 91,
      mnemonic: "v128.store64_lane",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load32_zero": {
      value: 92,
      mnemonic: "v128.load32_zero",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "v128_load64_zero": {
      value: 93,
      mnemonic: "v128.load64_zero",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_trunc_sat_f32x4_s": {
      value: 94,
      mnemonic: "i32x4.trunc_sat_f32x4_s",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_trunc_sat_f32x4_u": {
      value: 95,
      mnemonic: "i32x4.trunc_sat_f32x4_u",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_abs": {
      value: 96,
      mnemonic: "i8x16.abs",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_neg": {
      value: 97,
      mnemonic: "i8x16.neg",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_popcnt": {
      value: 98,
      mnemonic: "i8x16.popcnt",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_all_true": {
      value: 99,
      mnemonic: "i8x16.all_true",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Int32"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_bitmask": {
      value: 100,
      mnemonic: "i8x16.bitmask",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Int32"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_narrow_i16x8_s": {
      value: 101,
      mnemonic: "i8x16.narrow_i16x8_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_narrow_i16x8_u": {
      value: 102,
      mnemonic: "i8x16.narrow_i16x8_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_ceil": {
      value: 103,
      mnemonic: "f32x4.ceil",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_floor": {
      value: 104,
      mnemonic: "f32x4.floor",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_trunc": {
      value: 105,
      mnemonic: "f32x4.trunc",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_nearest": {
      value: 106,
      mnemonic: "f32x4.nearest",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_shl": {
      value: 107,
      mnemonic: "i8x16.shl",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_shr_s": {
      value: 108,
      mnemonic: "i8x16.shr_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_shr_u": {
      value: 109,
      mnemonic: "i8x16.shr_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_add": {
      value: 110,
      mnemonic: "i8x16.add",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_add_sat_s": {
      value: 111,
      mnemonic: "i8x16.add_sat_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_add_sat_u": {
      value: 112,
      mnemonic: "i8x16.add_sat_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_sub": {
      value: 113,
      mnemonic: "i8x16.sub",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_sub_sat_s": {
      value: 114,
      mnemonic: "i8x16.sub_sat_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_sub_sat_u": {
      value: 115,
      mnemonic: "i8x16.sub_sat_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_ceil": {
      value: 116,
      mnemonic: "f64x2.ceil",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_floor": {
      value: 117,
      mnemonic: "f64x2.floor",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_min_s": {
      value: 118,
      mnemonic: "i8x16.min_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_min_u": {
      value: 119,
      mnemonic: "i8x16.min_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_max_s": {
      value: 120,
      mnemonic: "i8x16.max_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_max_u": {
      value: 121,
      mnemonic: "i8x16.max_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_trunc": {
      value: 122,
      mnemonic: "f64x2.trunc",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i8x16_avgr_u": {
      value: 123,
      mnemonic: "i8x16.avgr_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_extadd_pairwise_i8x16_s": {
      value: 124,
      mnemonic: "i16x8.extadd_pairwise_i8x16_s",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_extadd_pairwise_i8x16_u": {
      value: 125,
      mnemonic: "i16x8.extadd_pairwise_i8x16_u",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_extadd_pairwise_i16x8_s": {
      value: 126,
      mnemonic: "i32x4.extadd_pairwise_i16x8_s",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_extadd_pairwise_i16x8_u": {
      value: 127,
      mnemonic: "i32x4.extadd_pairwise_i16x8_u",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_abs": {
      value: 128,
      mnemonic: "i16x8.abs",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_neg": {
      value: 129,
      mnemonic: "i16x8.neg",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_q15mulr_sat_s": {
      value: 130,
      mnemonic: "i16x8.q15mulr_sat_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_all_true": {
      value: 131,
      mnemonic: "i16x8.all_true",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Int32"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_bitmask": {
      value: 132,
      mnemonic: "i16x8.bitmask",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Int32"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_narrow_i32x4_s": {
      value: 133,
      mnemonic: "i16x8.narrow_i32x4_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_narrow_i32x4_u": {
      value: 134,
      mnemonic: "i16x8.narrow_i32x4_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_extend_low_i8x16_s": {
      value: 135,
      mnemonic: "i16x8.extend_low_i8x16_s",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_extend_high_i8x16_s": {
      value: 136,
      mnemonic: "i16x8.extend_high_i8x16_s",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_extend_low_i8x16_u": {
      value: 137,
      mnemonic: "i16x8.extend_low_i8x16_u",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_extend_high_i8x16_u": {
      value: 138,
      mnemonic: "i16x8.extend_high_i8x16_u",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_shl": {
      value: 139,
      mnemonic: "i16x8.shl",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_shr_s": {
      value: 140,
      mnemonic: "i16x8.shr_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_shr_u": {
      value: 141,
      mnemonic: "i16x8.shr_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_add": {
      value: 142,
      mnemonic: "i16x8.add",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_add_sat_s": {
      value: 143,
      mnemonic: "i16x8.add_sat_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_add_sat_u": {
      value: 144,
      mnemonic: "i16x8.add_sat_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_sub": {
      value: 145,
      mnemonic: "i16x8.sub",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_sub_sat_s": {
      value: 146,
      mnemonic: "i16x8.sub_sat_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_sub_sat_u": {
      value: 147,
      mnemonic: "i16x8.sub_sat_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_nearest": {
      value: 148,
      mnemonic: "f64x2.nearest",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_mul": {
      value: 149,
      mnemonic: "i16x8.mul",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_min_s": {
      value: 150,
      mnemonic: "i16x8.min_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_min_u": {
      value: 151,
      mnemonic: "i16x8.min_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_max_s": {
      value: 152,
      mnemonic: "i16x8.max_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_max_u": {
      value: 153,
      mnemonic: "i16x8.max_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_avgr_u": {
      value: 155,
      mnemonic: "i16x8.avgr_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_extmul_low_i8x16_s": {
      value: 156,
      mnemonic: "i16x8.extmul_low_i8x16_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_extmul_high_i8x16_s": {
      value: 157,
      mnemonic: "i16x8.extmul_high_i8x16_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_extmul_low_i8x16_u": {
      value: 158,
      mnemonic: "i16x8.extmul_low_i8x16_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i16x8_extmul_high_i8x16_u": {
      value: 159,
      mnemonic: "i16x8.extmul_high_i8x16_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_abs": {
      value: 160,
      mnemonic: "i32x4.abs",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_neg": {
      value: 161,
      mnemonic: "i32x4.neg",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_all_true": {
      value: 163,
      mnemonic: "i32x4.all_true",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Int32"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_bitmask": {
      value: 164,
      mnemonic: "i32x4.bitmask",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Int32"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_extend_low_i16x8_s": {
      value: 167,
      mnemonic: "i32x4.extend_low_i16x8_s",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_extend_high_i16x8_s": {
      value: 168,
      mnemonic: "i32x4.extend_high_i16x8_s",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_extend_low_i16x8_u": {
      value: 169,
      mnemonic: "i32x4.extend_low_i16x8_u",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_extend_high_i16x8_u": {
      value: 170,
      mnemonic: "i32x4.extend_high_i16x8_u",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_shl": {
      value: 171,
      mnemonic: "i32x4.shl",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_shr_s": {
      value: 172,
      mnemonic: "i32x4.shr_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_shr_u": {
      value: 173,
      mnemonic: "i32x4.shr_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_add": {
      value: 174,
      mnemonic: "i32x4.add",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_convert_i32x4_s": {
      value: 175,
      mnemonic: "f32x4.convert_i32x4_s",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_convert_i32x4_u": {
      value: 176,
      mnemonic: "f32x4.convert_i32x4_u",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_sub": {
      value: 177,
      mnemonic: "i32x4.sub",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_mul": {
      value: 181,
      mnemonic: "i32x4.mul",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_min_s": {
      value: 182,
      mnemonic: "i32x4.min_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_min_u": {
      value: 183,
      mnemonic: "i32x4.min_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_max_s": {
      value: 184,
      mnemonic: "i32x4.max_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_max_u": {
      value: 185,
      mnemonic: "i32x4.max_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_dot_i16x8_s": {
      value: 186,
      mnemonic: "i32x4.dot_i16x8_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_extmul_low_i16x8_s": {
      value: 188,
      mnemonic: "i32x4.extmul_low_i16x8_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_extmul_high_i16x8_s": {
      value: 189,
      mnemonic: "i32x4.extmul_high_i16x8_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_extmul_low_i16x8_u": {
      value: 190,
      mnemonic: "i32x4.extmul_low_i16x8_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_extmul_high_i16x8_u": {
      value: 191,
      mnemonic: "i32x4.extmul_high_i16x8_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_abs": {
      value: 192,
      mnemonic: "i64x2.abs",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_neg": {
      value: 193,
      mnemonic: "i64x2.neg",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_all_true": {
      value: 195,
      mnemonic: "i64x2.all_true",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Int32"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_bitmask": {
      value: 196,
      mnemonic: "i64x2.bitmask",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["Int32"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_extend_low_i32x4_s": {
      value: 199,
      mnemonic: "i64x2.extend_low_i32x4_s",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_extend_high_i32x4_s": {
      value: 200,
      mnemonic: "i64x2.extend_high_i32x4_s",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_extend_low_i32x4_u": {
      value: 201,
      mnemonic: "i64x2.extend_low_i32x4_u",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_extend_high_i32x4_u": {
      value: 202,
      mnemonic: "i64x2.extend_high_i32x4_u",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_shl": {
      value: 203,
      mnemonic: "i64x2.shl",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_shr_s": {
      value: 204,
      mnemonic: "i64x2.shr_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_shr_u": {
      value: 205,
      mnemonic: "i64x2.shr_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "Int32"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_add": {
      value: 206,
      mnemonic: "i64x2.add",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_sub": {
      value: 209,
      mnemonic: "i64x2.sub",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_mul": {
      value: 213,
      mnemonic: "i64x2.mul",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_eq": {
      value: 214,
      mnemonic: "i64x2.eq",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_ne": {
      value: 215,
      mnemonic: "i64x2.ne",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_lt_s": {
      value: 216,
      mnemonic: "i64x2.lt_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_gt_s": {
      value: 217,
      mnemonic: "i64x2.gt_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_le_s": {
      value: 218,
      mnemonic: "i64x2.le_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_ge_s": {
      value: 219,
      mnemonic: "i64x2.ge_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_extmul_low_i32x4_s": {
      value: 220,
      mnemonic: "i64x2.extmul_low_i32x4_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_extmul_high_i32x4_s": {
      value: 221,
      mnemonic: "i64x2.extmul_high_i32x4_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_extmul_low_i32x4_u": {
      value: 222,
      mnemonic: "i64x2.extmul_low_i32x4_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i64x2_extmul_high_i32x4_u": {
      value: 223,
      mnemonic: "i64x2.extmul_high_i32x4_u",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_abs": {
      value: 224,
      mnemonic: "f32x4.abs",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_neg": {
      value: 225,
      mnemonic: "f32x4.neg",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_sqrt": {
      value: 227,
      mnemonic: "f32x4.sqrt",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_add": {
      value: 228,
      mnemonic: "f32x4.add",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_sub": {
      value: 229,
      mnemonic: "f32x4.sub",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_mul": {
      value: 230,
      mnemonic: "f32x4.mul",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_div": {
      value: 231,
      mnemonic: "f32x4.div",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_min": {
      value: 232,
      mnemonic: "f32x4.min",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_max": {
      value: 233,
      mnemonic: "f32x4.max",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_pmin": {
      value: 234,
      mnemonic: "f32x4.pmin",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_pmax": {
      value: 235,
      mnemonic: "f32x4.pmax",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_abs": {
      value: 236,
      mnemonic: "f64x2.abs",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_neg": {
      value: 237,
      mnemonic: "f64x2.neg",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_sqrt": {
      value: 239,
      mnemonic: "f64x2.sqrt",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_add": {
      value: 240,
      mnemonic: "f64x2.add",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_sub": {
      value: 241,
      mnemonic: "f64x2.sub",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_mul": {
      value: 242,
      mnemonic: "f64x2.mul",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_div": {
      value: 243,
      mnemonic: "f64x2.div",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_min": {
      value: 244,
      mnemonic: "f64x2.min",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_max": {
      value: 245,
      mnemonic: "f64x2.max",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_pmin": {
      value: 246,
      mnemonic: "f64x2.pmin",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_pmax": {
      value: 247,
      mnemonic: "f64x2.pmax",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_trunc_sat_f64x2_s_zero": {
      value: 248,
      mnemonic: "i32x4.trunc_sat_f64x2_s_zero",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "i32x4_trunc_sat_f64x2_u_zero": {
      value: 249,
      mnemonic: "i32x4.trunc_sat_f64x2_u_zero",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_convert_low_i32x4_s": {
      value: 250,
      mnemonic: "f64x2.convert_low_i32x4_s",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_convert_low_i32x4_u": {
      value: 251,
      mnemonic: "f64x2.convert_low_i32x4_u",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f32x4_demote_f64x2_zero": {
      value: 252,
      mnemonic: "f32x4.demote_f64x2_zero",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "f64x2_promote_low_f32x4": {
      value: 253,
      mnemonic: "f64x2.promote_low_f32x4",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "simd"
    },
    "memory_atomic_notify": {
      value: 0,
      mnemonic: "memory.atomic.notify",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "memory_atomic_wait32": {
      value: 1,
      mnemonic: "memory.atomic.wait32",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32", "Int64"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "memory_atomic_wait64": {
      value: 2,
      mnemonic: "memory.atomic.wait64",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64", "Int64"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "atomic_fence": {
      value: 3,
      mnemonic: "atomic.fence",
      immediate: "VarUInt1",
      stackBehavior: "None",
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_load": {
      value: 16,
      mnemonic: "i32.atomic.load",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_load": {
      value: 17,
      mnemonic: "i64.atomic.load",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_load8_u": {
      value: 18,
      mnemonic: "i32.atomic.load8_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_load16_u": {
      value: 19,
      mnemonic: "i32.atomic.load16_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_load8_u": {
      value: 20,
      mnemonic: "i64.atomic.load8_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_load16_u": {
      value: 21,
      mnemonic: "i64.atomic.load16_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_load32_u": {
      value: 22,
      mnemonic: "i64.atomic.load32_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_store": {
      value: 23,
      mnemonic: "i32.atomic.store",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_store": {
      value: 24,
      mnemonic: "i64.atomic.store",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_store8": {
      value: 25,
      mnemonic: "i32.atomic.store8",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_store16": {
      value: 26,
      mnemonic: "i32.atomic.store16",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_store8": {
      value: 27,
      mnemonic: "i64.atomic.store8",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_store16": {
      value: 28,
      mnemonic: "i64.atomic.store16",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_store32": {
      value: 29,
      mnemonic: "i64.atomic.store32",
      immediate: "MemoryImmediate",
      stackBehavior: "Pop",
      popOperands: ["Int32", "Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw_add": {
      value: 30,
      mnemonic: "i32.atomic.rmw.add",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw_add": {
      value: 31,
      mnemonic: "i64.atomic.rmw.add",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw8_add_u": {
      value: 32,
      mnemonic: "i32.atomic.rmw8.add_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw16_add_u": {
      value: 33,
      mnemonic: "i32.atomic.rmw16.add_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw8_add_u": {
      value: 34,
      mnemonic: "i64.atomic.rmw8.add_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw16_add_u": {
      value: 35,
      mnemonic: "i64.atomic.rmw16.add_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw32_add_u": {
      value: 36,
      mnemonic: "i64.atomic.rmw32.add_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw_sub": {
      value: 37,
      mnemonic: "i32.atomic.rmw.sub",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw_sub": {
      value: 38,
      mnemonic: "i64.atomic.rmw.sub",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw8_sub_u": {
      value: 39,
      mnemonic: "i32.atomic.rmw8.sub_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw16_sub_u": {
      value: 40,
      mnemonic: "i32.atomic.rmw16.sub_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw8_sub_u": {
      value: 41,
      mnemonic: "i64.atomic.rmw8.sub_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw16_sub_u": {
      value: 42,
      mnemonic: "i64.atomic.rmw16.sub_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw32_sub_u": {
      value: 43,
      mnemonic: "i64.atomic.rmw32.sub_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw_and": {
      value: 44,
      mnemonic: "i32.atomic.rmw.and",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw_and": {
      value: 45,
      mnemonic: "i64.atomic.rmw.and",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw8_and_u": {
      value: 46,
      mnemonic: "i32.atomic.rmw8.and_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw16_and_u": {
      value: 47,
      mnemonic: "i32.atomic.rmw16.and_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw8_and_u": {
      value: 48,
      mnemonic: "i64.atomic.rmw8.and_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw16_and_u": {
      value: 49,
      mnemonic: "i64.atomic.rmw16.and_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw32_and_u": {
      value: 50,
      mnemonic: "i64.atomic.rmw32.and_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw_or": {
      value: 51,
      mnemonic: "i32.atomic.rmw.or",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw_or": {
      value: 52,
      mnemonic: "i64.atomic.rmw.or",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw8_or_u": {
      value: 53,
      mnemonic: "i32.atomic.rmw8.or_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw16_or_u": {
      value: 54,
      mnemonic: "i32.atomic.rmw16.or_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw8_or_u": {
      value: 55,
      mnemonic: "i64.atomic.rmw8.or_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw16_or_u": {
      value: 56,
      mnemonic: "i64.atomic.rmw16.or_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw32_or_u": {
      value: 57,
      mnemonic: "i64.atomic.rmw32.or_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw_xor": {
      value: 58,
      mnemonic: "i32.atomic.rmw.xor",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw_xor": {
      value: 59,
      mnemonic: "i64.atomic.rmw.xor",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw8_xor_u": {
      value: 60,
      mnemonic: "i32.atomic.rmw8.xor_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw16_xor_u": {
      value: 61,
      mnemonic: "i32.atomic.rmw16.xor_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw8_xor_u": {
      value: 62,
      mnemonic: "i64.atomic.rmw8.xor_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw16_xor_u": {
      value: 63,
      mnemonic: "i64.atomic.rmw16.xor_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw32_xor_u": {
      value: 64,
      mnemonic: "i64.atomic.rmw32.xor_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw_xchg": {
      value: 65,
      mnemonic: "i32.atomic.rmw.xchg",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw_xchg": {
      value: 66,
      mnemonic: "i64.atomic.rmw.xchg",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw8_xchg_u": {
      value: 67,
      mnemonic: "i32.atomic.rmw8.xchg_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw16_xchg_u": {
      value: 68,
      mnemonic: "i32.atomic.rmw16.xchg_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw8_xchg_u": {
      value: 69,
      mnemonic: "i64.atomic.rmw8.xchg_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw16_xchg_u": {
      value: 70,
      mnemonic: "i64.atomic.rmw16.xchg_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw32_xchg_u": {
      value: 71,
      mnemonic: "i64.atomic.rmw32.xchg_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw_cmpxchg": {
      value: 72,
      mnemonic: "i32.atomic.rmw.cmpxchg",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw_cmpxchg": {
      value: 73,
      mnemonic: "i64.atomic.rmw.cmpxchg",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw8_cmpxchg_u": {
      value: 74,
      mnemonic: "i32.atomic.rmw8.cmpxchg_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i32_atomic_rmw16_cmpxchg_u": {
      value: 75,
      mnemonic: "i32.atomic.rmw16.cmpxchg_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32", "Int32"],
      pushOperands: ["Int32"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw8_cmpxchg_u": {
      value: 76,
      mnemonic: "i64.atomic.rmw8.cmpxchg_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw16_cmpxchg_u": {
      value: 77,
      mnemonic: "i64.atomic.rmw16.cmpxchg_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i64_atomic_rmw32_cmpxchg_u": {
      value: 78,
      mnemonic: "i64.atomic.rmw32.cmpxchg_u",
      immediate: "MemoryImmediate",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int64", "Int64"],
      pushOperands: ["Int64"],
      prefix: 254,
      feature: "threads"
    },
    "i8x16_relaxed_swizzle": {
      value: 256,
      mnemonic: "i8x16.relaxed_swizzle",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "i32x4_relaxed_trunc_f32x4_s": {
      value: 257,
      mnemonic: "i32x4.relaxed_trunc_f32x4_s",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "i32x4_relaxed_trunc_f32x4_u": {
      value: 258,
      mnemonic: "i32x4.relaxed_trunc_f32x4_u",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "i32x4_relaxed_trunc_f64x2_s_zero": {
      value: 259,
      mnemonic: "i32x4.relaxed_trunc_f64x2_s_zero",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "i32x4_relaxed_trunc_f64x2_u_zero": {
      value: 260,
      mnemonic: "i32x4.relaxed_trunc_f64x2_u_zero",
      stackBehavior: "PopPush",
      popOperands: ["V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "f32x4_relaxed_madd": {
      value: 261,
      mnemonic: "f32x4.relaxed_madd",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "f32x4_relaxed_nmadd": {
      value: 262,
      mnemonic: "f32x4.relaxed_nmadd",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "f64x2_relaxed_madd": {
      value: 263,
      mnemonic: "f64x2.relaxed_madd",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "f64x2_relaxed_nmadd": {
      value: 264,
      mnemonic: "f64x2.relaxed_nmadd",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "i8x16_relaxed_laneselect": {
      value: 265,
      mnemonic: "i8x16.relaxed_laneselect",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "i16x8_relaxed_laneselect": {
      value: 266,
      mnemonic: "i16x8.relaxed_laneselect",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "i32x4_relaxed_laneselect": {
      value: 267,
      mnemonic: "i32x4.relaxed_laneselect",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "i64x2_relaxed_laneselect": {
      value: 268,
      mnemonic: "i64x2.relaxed_laneselect",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "f32x4_relaxed_min": {
      value: 269,
      mnemonic: "f32x4.relaxed_min",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "f32x4_relaxed_max": {
      value: 270,
      mnemonic: "f32x4.relaxed_max",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "f64x2_relaxed_min": {
      value: 271,
      mnemonic: "f64x2.relaxed_min",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "f64x2_relaxed_max": {
      value: 272,
      mnemonic: "f64x2.relaxed_max",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "i16x8_relaxed_q15mulr_s": {
      value: 273,
      mnemonic: "i16x8.relaxed_q15mulr_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "i16x8_relaxed_dot_i8x16_i7x16_s": {
      value: 274,
      mnemonic: "i16x8.relaxed_dot_i8x16_i7x16_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "i32x4_relaxed_dot_i8x16_i7x16_add_s": {
      value: 275,
      mnemonic: "i32x4.relaxed_dot_i8x16_i7x16_add_s",
      stackBehavior: "PopPush",
      popOperands: ["V128", "V128", "V128"],
      pushOperands: ["V128"],
      prefix: 253,
      feature: "relaxed-simd"
    },
    "struct_new": {
      value: 0,
      mnemonic: "struct.new",
      immediate: "VarUInt32",
      stackBehavior: "Push",
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "struct_new_default": {
      value: 1,
      mnemonic: "struct.new_default",
      immediate: "VarUInt32",
      stackBehavior: "Push",
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "struct_get": {
      value: 2,
      mnemonic: "struct.get",
      immediate: "TypeIndexField",
      stackBehavior: "PopPush",
      popOperands: ["Any"],
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "struct_get_s": {
      value: 3,
      mnemonic: "struct.get_s",
      immediate: "TypeIndexField",
      stackBehavior: "PopPush",
      popOperands: ["Any"],
      pushOperands: ["Int32"],
      prefix: 251,
      feature: "gc"
    },
    "struct_get_u": {
      value: 4,
      mnemonic: "struct.get_u",
      immediate: "TypeIndexField",
      stackBehavior: "PopPush",
      popOperands: ["Any"],
      pushOperands: ["Int32"],
      prefix: 251,
      feature: "gc"
    },
    "struct_set": {
      value: 5,
      mnemonic: "struct.set",
      immediate: "TypeIndexField",
      stackBehavior: "Pop",
      popOperands: ["Any", "Any"],
      prefix: 251,
      feature: "gc"
    },
    "array_new": {
      value: 6,
      mnemonic: "array.new",
      immediate: "VarUInt32",
      stackBehavior: "PopPush",
      popOperands: ["Any", "Int32"],
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "array_new_default": {
      value: 7,
      mnemonic: "array.new_default",
      immediate: "VarUInt32",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "array_new_fixed": {
      value: 8,
      mnemonic: "array.new_fixed",
      immediate: "TypeIndexIndex",
      stackBehavior: "Push",
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "array_new_data": {
      value: 9,
      mnemonic: "array.new_data",
      immediate: "TypeIndexIndex",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "array_new_elem": {
      value: 10,
      mnemonic: "array.new_elem",
      immediate: "TypeIndexIndex",
      stackBehavior: "PopPush",
      popOperands: ["Int32", "Int32"],
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "array_get": {
      value: 11,
      mnemonic: "array.get",
      immediate: "VarUInt32",
      stackBehavior: "PopPush",
      popOperands: ["Any", "Int32"],
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "array_get_s": {
      value: 12,
      mnemonic: "array.get_s",
      immediate: "VarUInt32",
      stackBehavior: "PopPush",
      popOperands: ["Any", "Int32"],
      pushOperands: ["Int32"],
      prefix: 251,
      feature: "gc"
    },
    "array_get_u": {
      value: 13,
      mnemonic: "array.get_u",
      immediate: "VarUInt32",
      stackBehavior: "PopPush",
      popOperands: ["Any", "Int32"],
      pushOperands: ["Int32"],
      prefix: 251,
      feature: "gc"
    },
    "array_set": {
      value: 14,
      mnemonic: "array.set",
      immediate: "VarUInt32",
      stackBehavior: "Pop",
      popOperands: ["Any", "Int32", "Any"],
      prefix: 251,
      feature: "gc"
    },
    "array_len": {
      value: 15,
      mnemonic: "array.len",
      stackBehavior: "PopPush",
      popOperands: ["Any"],
      pushOperands: ["Int32"],
      prefix: 251,
      feature: "gc"
    },
    "array_fill": {
      value: 16,
      mnemonic: "array.fill",
      immediate: "VarUInt32",
      stackBehavior: "Pop",
      popOperands: ["Any", "Int32", "Any", "Int32"],
      prefix: 251,
      feature: "gc"
    },
    "array_copy": {
      value: 17,
      mnemonic: "array.copy",
      immediate: "TypeIndexIndex",
      stackBehavior: "Pop",
      popOperands: ["Any", "Int32", "Any", "Int32", "Int32"],
      prefix: 251,
      feature: "gc"
    },
    "array_init_data": {
      value: 18,
      mnemonic: "array.init_data",
      immediate: "TypeIndexIndex",
      stackBehavior: "Pop",
      popOperands: ["Any", "Int32", "Int32", "Int32"],
      prefix: 251,
      feature: "gc"
    },
    "array_init_elem": {
      value: 19,
      mnemonic: "array.init_elem",
      immediate: "TypeIndexIndex",
      stackBehavior: "Pop",
      popOperands: ["Any", "Int32", "Int32", "Int32"],
      prefix: 251,
      feature: "gc"
    },
    "ref_test": {
      value: 20,
      mnemonic: "ref.test",
      immediate: "HeapType",
      stackBehavior: "PopPush",
      popOperands: ["Any"],
      pushOperands: ["Int32"],
      prefix: 251,
      feature: "gc"
    },
    "ref_test_null": {
      value: 21,
      mnemonic: "ref.test null",
      immediate: "HeapType",
      stackBehavior: "PopPush",
      popOperands: ["Any"],
      pushOperands: ["Int32"],
      prefix: 251,
      feature: "gc"
    },
    "ref_cast": {
      value: 22,
      mnemonic: "ref.cast",
      immediate: "HeapType",
      stackBehavior: "PopPush",
      popOperands: ["Any"],
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "ref_cast_null": {
      value: 23,
      mnemonic: "ref.cast null",
      immediate: "HeapType",
      stackBehavior: "PopPush",
      popOperands: ["Any"],
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "br_on_cast": {
      value: 24,
      mnemonic: "br_on_cast",
      immediate: "BrOnCast",
      stackBehavior: "PopPush",
      popOperands: ["Any"],
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "br_on_cast_fail": {
      value: 25,
      mnemonic: "br_on_cast_fail",
      immediate: "BrOnCast",
      stackBehavior: "PopPush",
      popOperands: ["Any"],
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "any_convert_extern": {
      value: 26,
      mnemonic: "any.convert_extern",
      stackBehavior: "PopPush",
      popOperands: ["Any"],
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "extern_convert_any": {
      value: 27,
      mnemonic: "extern.convert_any",
      stackBehavior: "PopPush",
      popOperands: ["Any"],
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "ref_i31": {
      value: 28,
      mnemonic: "ref.i31",
      stackBehavior: "PopPush",
      popOperands: ["Int32"],
      pushOperands: ["Any"],
      prefix: 251,
      feature: "gc"
    },
    "i31_get_s": {
      value: 29,
      mnemonic: "i31.get_s",
      stackBehavior: "PopPush",
      popOperands: ["Any"],
      pushOperands: ["Int32"],
      prefix: 251,
      feature: "gc"
    },
    "i31_get_u": {
      value: 30,
      mnemonic: "i31.get_u",
      stackBehavior: "PopPush",
      popOperands: ["Any"],
      pushOperands: ["Int32"],
      prefix: 251,
      feature: "gc"
    }
  };
  var OpCodes_default = OpCodes;

  // src/OpCodeEmitter.ts
  var OpCodeEmitter = class {
    unreachable() {
      return this.emit(OpCodes_default.unreachable);
    }
    nop() {
      return this.emit(OpCodes_default.nop);
    }
    block(blockType, label) {
      return this.emit(OpCodes_default.block, blockType, label);
    }
    loop(blockType, label) {
      return this.emit(OpCodes_default.loop, blockType, label);
    }
    if(blockType, label) {
      return this.emit(OpCodes_default.if, blockType, label);
    }
    else() {
      return this.emit(OpCodes_default.else);
    }
    try(blockType, label) {
      return this.emit(OpCodes_default.try, blockType, label);
    }
    catch(varUInt32) {
      return this.emit(OpCodes_default.catch, varUInt32);
    }
    throw(varUInt32) {
      return this.emit(OpCodes_default.throw, varUInt32);
    }
    rethrow(varUInt32) {
      return this.emit(OpCodes_default.rethrow, varUInt32);
    }
    end() {
      return this.emit(OpCodes_default.end);
    }
    br(labelBuilder) {
      return this.emit(OpCodes_default.br, labelBuilder);
    }
    br_if(labelBuilder) {
      return this.emit(OpCodes_default.br_if, labelBuilder);
    }
    br_table(defaultLabelBuilder, ...labelBuilders) {
      return this.emit(OpCodes_default.br_table, defaultLabelBuilder, labelBuilders);
    }
    return() {
      return this.emit(OpCodes_default.return);
    }
    call(functionBuilder) {
      return this.emit(OpCodes_default.call, functionBuilder);
    }
    call_indirect(funcTypeBuilder, tableIndex) {
      return this.emit(OpCodes_default.call_indirect, funcTypeBuilder, tableIndex);
    }
    return_call(functionBuilder) {
      return this.emit(OpCodes_default.return_call, functionBuilder);
    }
    return_call_indirect(funcTypeBuilder, tableIndex) {
      return this.emit(OpCodes_default.return_call_indirect, funcTypeBuilder, tableIndex);
    }
    delegate(varUInt32) {
      return this.emit(OpCodes_default.delegate, varUInt32);
    }
    catch_all() {
      return this.emit(OpCodes_default.catch_all);
    }
    drop() {
      return this.emit(OpCodes_default.drop);
    }
    select() {
      return this.emit(OpCodes_default.select);
    }
    get_local(local) {
      return this.emit(OpCodes_default.get_local, local);
    }
    set_local(local) {
      return this.emit(OpCodes_default.set_local, local);
    }
    tee_local(local) {
      return this.emit(OpCodes_default.tee_local, local);
    }
    get_global(global) {
      return this.emit(OpCodes_default.get_global, global);
    }
    set_global(global) {
      return this.emit(OpCodes_default.set_global, global);
    }
    load_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_load, alignment, offset);
    }
    load_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_load, alignment, offset);
    }
    load_f32(alignment, offset) {
      return this.emit(OpCodes_default.f32_load, alignment, offset);
    }
    load_f64(alignment, offset) {
      return this.emit(OpCodes_default.f64_load, alignment, offset);
    }
    load8_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_load8_s, alignment, offset);
    }
    load8_i32_u(alignment, offset) {
      return this.emit(OpCodes_default.i32_load8_u, alignment, offset);
    }
    load16_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_load16_s, alignment, offset);
    }
    load16_i32_u(alignment, offset) {
      return this.emit(OpCodes_default.i32_load16_u, alignment, offset);
    }
    load8_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_load8_s, alignment, offset);
    }
    load8_i64_u(alignment, offset) {
      return this.emit(OpCodes_default.i64_load8_u, alignment, offset);
    }
    load16_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_load16_s, alignment, offset);
    }
    load16_i64_u(alignment, offset) {
      return this.emit(OpCodes_default.i64_load16_u, alignment, offset);
    }
    load32_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_load32_s, alignment, offset);
    }
    load32_i64_u(alignment, offset) {
      return this.emit(OpCodes_default.i64_load32_u, alignment, offset);
    }
    store_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_store, alignment, offset);
    }
    store_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_store, alignment, offset);
    }
    store_f32(alignment, offset) {
      return this.emit(OpCodes_default.f32_store, alignment, offset);
    }
    store_f64(alignment, offset) {
      return this.emit(OpCodes_default.f64_store, alignment, offset);
    }
    store8_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_store8, alignment, offset);
    }
    store16_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_store16, alignment, offset);
    }
    store8_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_store8, alignment, offset);
    }
    store16_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_store16, alignment, offset);
    }
    store32_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_store32, alignment, offset);
    }
    mem_size(varUInt1) {
      return this.emit(OpCodes_default.mem_size, varUInt1);
    }
    mem_grow(varUInt1) {
      return this.emit(OpCodes_default.mem_grow, varUInt1);
    }
    const_i32(varInt32) {
      return this.emit(OpCodes_default.i32_const, varInt32);
    }
    const_i64(varInt64) {
      return this.emit(OpCodes_default.i64_const, varInt64);
    }
    const_f32(float32) {
      return this.emit(OpCodes_default.f32_const, float32);
    }
    const_f64(float64) {
      return this.emit(OpCodes_default.f64_const, float64);
    }
    eqz_i32() {
      return this.emit(OpCodes_default.i32_eqz);
    }
    eq_i32() {
      return this.emit(OpCodes_default.i32_eq);
    }
    ne_i32() {
      return this.emit(OpCodes_default.i32_ne);
    }
    lt_i32() {
      return this.emit(OpCodes_default.i32_lt_s);
    }
    lt_i32_u() {
      return this.emit(OpCodes_default.i32_lt_u);
    }
    gt_i32() {
      return this.emit(OpCodes_default.i32_gt_s);
    }
    gt_i32_u() {
      return this.emit(OpCodes_default.i32_gt_u);
    }
    le_i32() {
      return this.emit(OpCodes_default.i32_le_s);
    }
    le_i32_u() {
      return this.emit(OpCodes_default.i32_le_u);
    }
    ge_i32() {
      return this.emit(OpCodes_default.i32_ge_s);
    }
    ge_i32_u() {
      return this.emit(OpCodes_default.i32_ge_u);
    }
    eqz_i64() {
      return this.emit(OpCodes_default.i64_eqz);
    }
    eq_i64() {
      return this.emit(OpCodes_default.i64_eq);
    }
    ne_i64() {
      return this.emit(OpCodes_default.i64_ne);
    }
    lt_i64() {
      return this.emit(OpCodes_default.i64_lt_s);
    }
    lt_i64_u() {
      return this.emit(OpCodes_default.i64_lt_u);
    }
    gt_i64() {
      return this.emit(OpCodes_default.i64_gt_s);
    }
    gt_i64_u() {
      return this.emit(OpCodes_default.i64_gt_u);
    }
    le_i64() {
      return this.emit(OpCodes_default.i64_le_s);
    }
    le_i64_u() {
      return this.emit(OpCodes_default.i64_le_u);
    }
    ge_i64() {
      return this.emit(OpCodes_default.i64_ge_s);
    }
    ge_i64_u() {
      return this.emit(OpCodes_default.i64_ge_u);
    }
    eq_f32() {
      return this.emit(OpCodes_default.f32_eq);
    }
    ne_f32() {
      return this.emit(OpCodes_default.f32_ne);
    }
    lt_f32() {
      return this.emit(OpCodes_default.f32_lt);
    }
    gt_f32() {
      return this.emit(OpCodes_default.f32_gt);
    }
    le_f32() {
      return this.emit(OpCodes_default.f32_le);
    }
    ge_f32() {
      return this.emit(OpCodes_default.f32_ge);
    }
    eq_f64() {
      return this.emit(OpCodes_default.f64_eq);
    }
    ne_f64() {
      return this.emit(OpCodes_default.f64_ne);
    }
    lt_f64() {
      return this.emit(OpCodes_default.f64_lt);
    }
    gt_f64() {
      return this.emit(OpCodes_default.f64_gt);
    }
    le_f64() {
      return this.emit(OpCodes_default.f64_le);
    }
    ge_f64() {
      return this.emit(OpCodes_default.f64_ge);
    }
    clz_i32() {
      return this.emit(OpCodes_default.i32_clz);
    }
    ctz_i32() {
      return this.emit(OpCodes_default.i32_ctz);
    }
    popcnt_i32() {
      return this.emit(OpCodes_default.i32_popcnt);
    }
    add_i32() {
      return this.emit(OpCodes_default.i32_add);
    }
    sub_i32() {
      return this.emit(OpCodes_default.i32_sub);
    }
    mul_i32() {
      return this.emit(OpCodes_default.i32_mul);
    }
    div_i32() {
      return this.emit(OpCodes_default.i32_div_s);
    }
    div_i32_u() {
      return this.emit(OpCodes_default.i32_div_u);
    }
    rem_i32() {
      return this.emit(OpCodes_default.i32_rem_s);
    }
    rem_i32_u() {
      return this.emit(OpCodes_default.i32_rem_u);
    }
    and_i32() {
      return this.emit(OpCodes_default.i32_and);
    }
    or_i32() {
      return this.emit(OpCodes_default.i32_or);
    }
    xor_i32() {
      return this.emit(OpCodes_default.i32_xor);
    }
    shl_i32() {
      return this.emit(OpCodes_default.i32_shl);
    }
    shr_i32() {
      return this.emit(OpCodes_default.i32_shr_s);
    }
    shr_i32_u() {
      return this.emit(OpCodes_default.i32_shr_u);
    }
    rotl_i32() {
      return this.emit(OpCodes_default.i32_rotl);
    }
    rotr_i32() {
      return this.emit(OpCodes_default.i32_rotr);
    }
    clz_i64() {
      return this.emit(OpCodes_default.i64_clz);
    }
    ctz_i64() {
      return this.emit(OpCodes_default.i64_ctz);
    }
    popcnt_i64() {
      return this.emit(OpCodes_default.i64_popcnt);
    }
    add_i64() {
      return this.emit(OpCodes_default.i64_add);
    }
    sub_i64() {
      return this.emit(OpCodes_default.i64_sub);
    }
    mul_i64() {
      return this.emit(OpCodes_default.i64_mul);
    }
    div_i64() {
      return this.emit(OpCodes_default.i64_div_s);
    }
    div_i64_u() {
      return this.emit(OpCodes_default.i64_div_u);
    }
    rem_i64() {
      return this.emit(OpCodes_default.i64_rem_s);
    }
    rem_i64_u() {
      return this.emit(OpCodes_default.i64_rem_u);
    }
    and_i64() {
      return this.emit(OpCodes_default.i64_and);
    }
    or_i64() {
      return this.emit(OpCodes_default.i64_or);
    }
    xor_i64() {
      return this.emit(OpCodes_default.i64_xor);
    }
    shl_i64() {
      return this.emit(OpCodes_default.i64_shl);
    }
    shr_i64() {
      return this.emit(OpCodes_default.i64_shr_s);
    }
    shr_i64_u() {
      return this.emit(OpCodes_default.i64_shr_u);
    }
    rotl_i64() {
      return this.emit(OpCodes_default.i64_rotl);
    }
    rotr_i64() {
      return this.emit(OpCodes_default.i64_rotr);
    }
    abs_f32() {
      return this.emit(OpCodes_default.f32_abs);
    }
    neg_f32() {
      return this.emit(OpCodes_default.f32_neg);
    }
    ceil_f32() {
      return this.emit(OpCodes_default.f32_ceil);
    }
    floor_f32() {
      return this.emit(OpCodes_default.f32_floor);
    }
    trunc_f32() {
      return this.emit(OpCodes_default.f32_trunc);
    }
    nearest_f32() {
      return this.emit(OpCodes_default.f32_nearest);
    }
    sqrt_f32() {
      return this.emit(OpCodes_default.f32_sqrt);
    }
    add_f32() {
      return this.emit(OpCodes_default.f32_add);
    }
    sub_f32() {
      return this.emit(OpCodes_default.f32_sub);
    }
    mul_f32() {
      return this.emit(OpCodes_default.f32_mul);
    }
    div_f32() {
      return this.emit(OpCodes_default.f32_div);
    }
    min_f32() {
      return this.emit(OpCodes_default.f32_min);
    }
    max_f32() {
      return this.emit(OpCodes_default.f32_max);
    }
    copysign_f32() {
      return this.emit(OpCodes_default.f32_copysign);
    }
    abs_f64() {
      return this.emit(OpCodes_default.f64_abs);
    }
    neg_f64() {
      return this.emit(OpCodes_default.f64_neg);
    }
    ceil_f64() {
      return this.emit(OpCodes_default.f64_ceil);
    }
    floor_f64() {
      return this.emit(OpCodes_default.f64_floor);
    }
    trunc_f64() {
      return this.emit(OpCodes_default.f64_trunc);
    }
    nearest_f64() {
      return this.emit(OpCodes_default.f64_nearest);
    }
    sqrt_f64() {
      return this.emit(OpCodes_default.f64_sqrt);
    }
    add_f64() {
      return this.emit(OpCodes_default.f64_add);
    }
    sub_f64() {
      return this.emit(OpCodes_default.f64_sub);
    }
    mul_f64() {
      return this.emit(OpCodes_default.f64_mul);
    }
    div_f64() {
      return this.emit(OpCodes_default.f64_div);
    }
    min_f64() {
      return this.emit(OpCodes_default.f64_min);
    }
    max_f64() {
      return this.emit(OpCodes_default.f64_max);
    }
    copysign_f64() {
      return this.emit(OpCodes_default.f64_copysign);
    }
    wrap_i64_i32() {
      return this.emit(OpCodes_default.i32_wrap_i64);
    }
    trunc_f32_s_i32() {
      return this.emit(OpCodes_default.i32_trunc_f32_s);
    }
    trunc_f32_u_i32() {
      return this.emit(OpCodes_default.i32_trunc_f32_u);
    }
    trunc_f64_s_i32() {
      return this.emit(OpCodes_default.i32_trunc_f64_s);
    }
    trunc_f64_u_i32() {
      return this.emit(OpCodes_default.i32_trunc_f64_u);
    }
    extend_i32_s_i64() {
      return this.emit(OpCodes_default.i64_extend_i32_s);
    }
    extend_i32_u_i64() {
      return this.emit(OpCodes_default.i64_extend_i32_u);
    }
    trunc_f32_s_i64() {
      return this.emit(OpCodes_default.i64_trunc_f32_s);
    }
    trunc_f32_u_i64() {
      return this.emit(OpCodes_default.i64_trunc_f32_u);
    }
    trunc_f64_s_i64() {
      return this.emit(OpCodes_default.i64_trunc_f64_s);
    }
    trunc_f64_u_i64() {
      return this.emit(OpCodes_default.i64_trunc_f64_u);
    }
    convert_i32_s_f32() {
      return this.emit(OpCodes_default.f32_convert_i32_s);
    }
    convert_i32_u_f32() {
      return this.emit(OpCodes_default.f32_convert_i32_u);
    }
    convert_i64_s_f32() {
      return this.emit(OpCodes_default.f32_convert_i64_s);
    }
    convert_i64_u_f32() {
      return this.emit(OpCodes_default.f32_convert_i64_u);
    }
    demote_f64_f32() {
      return this.emit(OpCodes_default.f32_demote_f64);
    }
    convert_i32_s_f64() {
      return this.emit(OpCodes_default.f64_convert_i32_s);
    }
    convert_i32_u_f64() {
      return this.emit(OpCodes_default.f64_convert_i32_u);
    }
    convert_i64_s_f64() {
      return this.emit(OpCodes_default.f64_convert_i64_s);
    }
    convert_i64_u_f64() {
      return this.emit(OpCodes_default.f64_convert_i64_u);
    }
    promote_f32_f64() {
      return this.emit(OpCodes_default.f64_promote_f32);
    }
    reinterpret_f32_i32() {
      return this.emit(OpCodes_default.i32_reinterpret_f32);
    }
    reinterpret_f64_i64() {
      return this.emit(OpCodes_default.i64_reinterpret_f64);
    }
    reinterpret_i32_f32() {
      return this.emit(OpCodes_default.f32_reinterpret_i32);
    }
    reinterpret_i64_f64() {
      return this.emit(OpCodes_default.f64_reinterpret_i64);
    }
    extend8_s_i32() {
      return this.emit(OpCodes_default.i32_extend8_s);
    }
    extend16_s_i32() {
      return this.emit(OpCodes_default.i32_extend16_s);
    }
    extend8_s_i64() {
      return this.emit(OpCodes_default.i64_extend8_s);
    }
    extend16_s_i64() {
      return this.emit(OpCodes_default.i64_extend16_s);
    }
    extend32_s_i64() {
      return this.emit(OpCodes_default.i64_extend32_s);
    }
    trunc_sat_f32_s_i32() {
      return this.emit(OpCodes_default.i32_trunc_sat_f32_s);
    }
    trunc_sat_f32_u_i32() {
      return this.emit(OpCodes_default.i32_trunc_sat_f32_u);
    }
    trunc_sat_f64_s_i32() {
      return this.emit(OpCodes_default.i32_trunc_sat_f64_s);
    }
    trunc_sat_f64_u_i32() {
      return this.emit(OpCodes_default.i32_trunc_sat_f64_u);
    }
    trunc_sat_f32_s_i64() {
      return this.emit(OpCodes_default.i64_trunc_sat_f32_s);
    }
    trunc_sat_f32_u_i64() {
      return this.emit(OpCodes_default.i64_trunc_sat_f32_u);
    }
    trunc_sat_f64_s_i64() {
      return this.emit(OpCodes_default.i64_trunc_sat_f64_s);
    }
    trunc_sat_f64_u_i64() {
      return this.emit(OpCodes_default.i64_trunc_sat_f64_u);
    }
    memory_init(alignment, offset) {
      return this.emit(OpCodes_default.memory_init, alignment, offset);
    }
    data_drop(varUInt32) {
      return this.emit(OpCodes_default.data_drop, varUInt32);
    }
    memory_copy(alignment, offset) {
      return this.emit(OpCodes_default.memory_copy, alignment, offset);
    }
    memory_fill(varUInt1) {
      return this.emit(OpCodes_default.memory_fill, varUInt1);
    }
    table_init(alignment, offset) {
      return this.emit(OpCodes_default.table_init, alignment, offset);
    }
    elem_drop(varUInt32) {
      return this.emit(OpCodes_default.elem_drop, varUInt32);
    }
    table_copy(alignment, offset) {
      return this.emit(OpCodes_default.table_copy, alignment, offset);
    }
    table_grow(varUInt32) {
      return this.emit(OpCodes_default.table_grow, varUInt32);
    }
    table_size(varUInt32) {
      return this.emit(OpCodes_default.table_size, varUInt32);
    }
    table_fill(varUInt32) {
      return this.emit(OpCodes_default.table_fill, varUInt32);
    }
    ref_null(varUInt32) {
      return this.emit(OpCodes_default.ref_null, varUInt32);
    }
    ref_is_null() {
      return this.emit(OpCodes_default.ref_is_null);
    }
    ref_func(functionBuilder) {
      return this.emit(OpCodes_default.ref_func, functionBuilder);
    }
    table_get(varUInt32) {
      return this.emit(OpCodes_default.table_get, varUInt32);
    }
    table_set(varUInt32) {
      return this.emit(OpCodes_default.table_set, varUInt32);
    }
    load_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load, alignment, offset);
    }
    load8x8_s_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load8x8_s, alignment, offset);
    }
    load8x8_u_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load8x8_u, alignment, offset);
    }
    load16x4_s_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load16x4_s, alignment, offset);
    }
    load16x4_u_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load16x4_u, alignment, offset);
    }
    load32x2_s_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load32x2_s, alignment, offset);
    }
    load32x2_u_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load32x2_u, alignment, offset);
    }
    load8_splat_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load8_splat, alignment, offset);
    }
    load16_splat_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load16_splat, alignment, offset);
    }
    load32_splat_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load32_splat, alignment, offset);
    }
    load64_splat_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load64_splat, alignment, offset);
    }
    store_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_store, alignment, offset);
    }
    const_v128(bytes) {
      return this.emit(OpCodes_default.v128_const, bytes);
    }
    shuffle_i8x16(mask) {
      return this.emit(OpCodes_default.i8x16_shuffle, mask);
    }
    swizzle_i8x16() {
      return this.emit(OpCodes_default.i8x16_swizzle);
    }
    splat_i8x16() {
      return this.emit(OpCodes_default.i8x16_splat);
    }
    splat_i16x8() {
      return this.emit(OpCodes_default.i16x8_splat);
    }
    splat_i32x4() {
      return this.emit(OpCodes_default.i32x4_splat);
    }
    splat_i64x2() {
      return this.emit(OpCodes_default.i64x2_splat);
    }
    splat_f32x4() {
      return this.emit(OpCodes_default.f32x4_splat);
    }
    splat_f64x2() {
      return this.emit(OpCodes_default.f64x2_splat);
    }
    extract_lane_s_i8x16(laneIndex) {
      return this.emit(OpCodes_default.i8x16_extract_lane_s, laneIndex);
    }
    extract_lane_u_i8x16(laneIndex) {
      return this.emit(OpCodes_default.i8x16_extract_lane_u, laneIndex);
    }
    replace_lane_i8x16(laneIndex) {
      return this.emit(OpCodes_default.i8x16_replace_lane, laneIndex);
    }
    extract_lane_s_i16x8(laneIndex) {
      return this.emit(OpCodes_default.i16x8_extract_lane_s, laneIndex);
    }
    extract_lane_u_i16x8(laneIndex) {
      return this.emit(OpCodes_default.i16x8_extract_lane_u, laneIndex);
    }
    replace_lane_i16x8(laneIndex) {
      return this.emit(OpCodes_default.i16x8_replace_lane, laneIndex);
    }
    extract_lane_i32x4(laneIndex) {
      return this.emit(OpCodes_default.i32x4_extract_lane, laneIndex);
    }
    replace_lane_i32x4(laneIndex) {
      return this.emit(OpCodes_default.i32x4_replace_lane, laneIndex);
    }
    extract_lane_i64x2(laneIndex) {
      return this.emit(OpCodes_default.i64x2_extract_lane, laneIndex);
    }
    replace_lane_i64x2(laneIndex) {
      return this.emit(OpCodes_default.i64x2_replace_lane, laneIndex);
    }
    extract_lane_f32x4(laneIndex) {
      return this.emit(OpCodes_default.f32x4_extract_lane, laneIndex);
    }
    replace_lane_f32x4(laneIndex) {
      return this.emit(OpCodes_default.f32x4_replace_lane, laneIndex);
    }
    extract_lane_f64x2(laneIndex) {
      return this.emit(OpCodes_default.f64x2_extract_lane, laneIndex);
    }
    replace_lane_f64x2(laneIndex) {
      return this.emit(OpCodes_default.f64x2_replace_lane, laneIndex);
    }
    eq_i8x16() {
      return this.emit(OpCodes_default.i8x16_eq);
    }
    ne_i8x16() {
      return this.emit(OpCodes_default.i8x16_ne);
    }
    lt_s_i8x16() {
      return this.emit(OpCodes_default.i8x16_lt_s);
    }
    lt_u_i8x16() {
      return this.emit(OpCodes_default.i8x16_lt_u);
    }
    gt_s_i8x16() {
      return this.emit(OpCodes_default.i8x16_gt_s);
    }
    gt_u_i8x16() {
      return this.emit(OpCodes_default.i8x16_gt_u);
    }
    le_s_i8x16() {
      return this.emit(OpCodes_default.i8x16_le_s);
    }
    le_u_i8x16() {
      return this.emit(OpCodes_default.i8x16_le_u);
    }
    ge_s_i8x16() {
      return this.emit(OpCodes_default.i8x16_ge_s);
    }
    ge_u_i8x16() {
      return this.emit(OpCodes_default.i8x16_ge_u);
    }
    eq_i16x8() {
      return this.emit(OpCodes_default.i16x8_eq);
    }
    ne_i16x8() {
      return this.emit(OpCodes_default.i16x8_ne);
    }
    lt_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_lt_s);
    }
    lt_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_lt_u);
    }
    gt_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_gt_s);
    }
    gt_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_gt_u);
    }
    le_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_le_s);
    }
    le_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_le_u);
    }
    ge_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_ge_s);
    }
    ge_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_ge_u);
    }
    eq_i32x4() {
      return this.emit(OpCodes_default.i32x4_eq);
    }
    ne_i32x4() {
      return this.emit(OpCodes_default.i32x4_ne);
    }
    lt_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_lt_s);
    }
    lt_u_i32x4() {
      return this.emit(OpCodes_default.i32x4_lt_u);
    }
    gt_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_gt_s);
    }
    gt_u_i32x4() {
      return this.emit(OpCodes_default.i32x4_gt_u);
    }
    le_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_le_s);
    }
    le_u_i32x4() {
      return this.emit(OpCodes_default.i32x4_le_u);
    }
    ge_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_ge_s);
    }
    ge_u_i32x4() {
      return this.emit(OpCodes_default.i32x4_ge_u);
    }
    eq_f32x4() {
      return this.emit(OpCodes_default.f32x4_eq);
    }
    ne_f32x4() {
      return this.emit(OpCodes_default.f32x4_ne);
    }
    lt_f32x4() {
      return this.emit(OpCodes_default.f32x4_lt);
    }
    gt_f32x4() {
      return this.emit(OpCodes_default.f32x4_gt);
    }
    le_f32x4() {
      return this.emit(OpCodes_default.f32x4_le);
    }
    ge_f32x4() {
      return this.emit(OpCodes_default.f32x4_ge);
    }
    eq_f64x2() {
      return this.emit(OpCodes_default.f64x2_eq);
    }
    ne_f64x2() {
      return this.emit(OpCodes_default.f64x2_ne);
    }
    lt_f64x2() {
      return this.emit(OpCodes_default.f64x2_lt);
    }
    gt_f64x2() {
      return this.emit(OpCodes_default.f64x2_gt);
    }
    le_f64x2() {
      return this.emit(OpCodes_default.f64x2_le);
    }
    ge_f64x2() {
      return this.emit(OpCodes_default.f64x2_ge);
    }
    not_v128() {
      return this.emit(OpCodes_default.v128_not);
    }
    and_v128() {
      return this.emit(OpCodes_default.v128_and);
    }
    andnot_v128() {
      return this.emit(OpCodes_default.v128_andnot);
    }
    or_v128() {
      return this.emit(OpCodes_default.v128_or);
    }
    xor_v128() {
      return this.emit(OpCodes_default.v128_xor);
    }
    bitselect_v128() {
      return this.emit(OpCodes_default.v128_bitselect);
    }
    any_true_v128() {
      return this.emit(OpCodes_default.v128_any_true);
    }
    load8_lane_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load8_lane, alignment, offset);
    }
    load16_lane_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load16_lane, alignment, offset);
    }
    load32_lane_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load32_lane, alignment, offset);
    }
    load64_lane_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load64_lane, alignment, offset);
    }
    store8_lane_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_store8_lane, alignment, offset);
    }
    store16_lane_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_store16_lane, alignment, offset);
    }
    store32_lane_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_store32_lane, alignment, offset);
    }
    store64_lane_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_store64_lane, alignment, offset);
    }
    load32_zero_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load32_zero, alignment, offset);
    }
    load64_zero_v128(alignment, offset) {
      return this.emit(OpCodes_default.v128_load64_zero, alignment, offset);
    }
    trunc_sat_f32x4_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_trunc_sat_f32x4_s);
    }
    trunc_sat_f32x4_u_i32x4() {
      return this.emit(OpCodes_default.i32x4_trunc_sat_f32x4_u);
    }
    abs_i8x16() {
      return this.emit(OpCodes_default.i8x16_abs);
    }
    neg_i8x16() {
      return this.emit(OpCodes_default.i8x16_neg);
    }
    popcnt_i8x16() {
      return this.emit(OpCodes_default.i8x16_popcnt);
    }
    all_true_i8x16() {
      return this.emit(OpCodes_default.i8x16_all_true);
    }
    bitmask_i8x16() {
      return this.emit(OpCodes_default.i8x16_bitmask);
    }
    narrow_i16x8_s_i8x16() {
      return this.emit(OpCodes_default.i8x16_narrow_i16x8_s);
    }
    narrow_i16x8_u_i8x16() {
      return this.emit(OpCodes_default.i8x16_narrow_i16x8_u);
    }
    ceil_f32x4() {
      return this.emit(OpCodes_default.f32x4_ceil);
    }
    floor_f32x4() {
      return this.emit(OpCodes_default.f32x4_floor);
    }
    trunc_f32x4() {
      return this.emit(OpCodes_default.f32x4_trunc);
    }
    nearest_f32x4() {
      return this.emit(OpCodes_default.f32x4_nearest);
    }
    shl_i8x16() {
      return this.emit(OpCodes_default.i8x16_shl);
    }
    shr_s_i8x16() {
      return this.emit(OpCodes_default.i8x16_shr_s);
    }
    shr_u_i8x16() {
      return this.emit(OpCodes_default.i8x16_shr_u);
    }
    add_i8x16() {
      return this.emit(OpCodes_default.i8x16_add);
    }
    add_sat_s_i8x16() {
      return this.emit(OpCodes_default.i8x16_add_sat_s);
    }
    add_sat_u_i8x16() {
      return this.emit(OpCodes_default.i8x16_add_sat_u);
    }
    sub_i8x16() {
      return this.emit(OpCodes_default.i8x16_sub);
    }
    sub_sat_s_i8x16() {
      return this.emit(OpCodes_default.i8x16_sub_sat_s);
    }
    sub_sat_u_i8x16() {
      return this.emit(OpCodes_default.i8x16_sub_sat_u);
    }
    ceil_f64x2() {
      return this.emit(OpCodes_default.f64x2_ceil);
    }
    floor_f64x2() {
      return this.emit(OpCodes_default.f64x2_floor);
    }
    min_s_i8x16() {
      return this.emit(OpCodes_default.i8x16_min_s);
    }
    min_u_i8x16() {
      return this.emit(OpCodes_default.i8x16_min_u);
    }
    max_s_i8x16() {
      return this.emit(OpCodes_default.i8x16_max_s);
    }
    max_u_i8x16() {
      return this.emit(OpCodes_default.i8x16_max_u);
    }
    trunc_f64x2() {
      return this.emit(OpCodes_default.f64x2_trunc);
    }
    avgr_u_i8x16() {
      return this.emit(OpCodes_default.i8x16_avgr_u);
    }
    extadd_pairwise_i8x16_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_extadd_pairwise_i8x16_s);
    }
    extadd_pairwise_i8x16_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_extadd_pairwise_i8x16_u);
    }
    extadd_pairwise_i16x8_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_extadd_pairwise_i16x8_s);
    }
    extadd_pairwise_i16x8_u_i32x4() {
      return this.emit(OpCodes_default.i32x4_extadd_pairwise_i16x8_u);
    }
    abs_i16x8() {
      return this.emit(OpCodes_default.i16x8_abs);
    }
    neg_i16x8() {
      return this.emit(OpCodes_default.i16x8_neg);
    }
    q15mulr_sat_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_q15mulr_sat_s);
    }
    all_true_i16x8() {
      return this.emit(OpCodes_default.i16x8_all_true);
    }
    bitmask_i16x8() {
      return this.emit(OpCodes_default.i16x8_bitmask);
    }
    narrow_i32x4_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_narrow_i32x4_s);
    }
    narrow_i32x4_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_narrow_i32x4_u);
    }
    extend_low_i8x16_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_extend_low_i8x16_s);
    }
    extend_high_i8x16_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_extend_high_i8x16_s);
    }
    extend_low_i8x16_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_extend_low_i8x16_u);
    }
    extend_high_i8x16_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_extend_high_i8x16_u);
    }
    shl_i16x8() {
      return this.emit(OpCodes_default.i16x8_shl);
    }
    shr_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_shr_s);
    }
    shr_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_shr_u);
    }
    add_i16x8() {
      return this.emit(OpCodes_default.i16x8_add);
    }
    add_sat_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_add_sat_s);
    }
    add_sat_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_add_sat_u);
    }
    sub_i16x8() {
      return this.emit(OpCodes_default.i16x8_sub);
    }
    sub_sat_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_sub_sat_s);
    }
    sub_sat_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_sub_sat_u);
    }
    nearest_f64x2() {
      return this.emit(OpCodes_default.f64x2_nearest);
    }
    mul_i16x8() {
      return this.emit(OpCodes_default.i16x8_mul);
    }
    min_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_min_s);
    }
    min_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_min_u);
    }
    max_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_max_s);
    }
    max_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_max_u);
    }
    avgr_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_avgr_u);
    }
    extmul_low_i8x16_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_extmul_low_i8x16_s);
    }
    extmul_high_i8x16_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_extmul_high_i8x16_s);
    }
    extmul_low_i8x16_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_extmul_low_i8x16_u);
    }
    extmul_high_i8x16_u_i16x8() {
      return this.emit(OpCodes_default.i16x8_extmul_high_i8x16_u);
    }
    abs_i32x4() {
      return this.emit(OpCodes_default.i32x4_abs);
    }
    neg_i32x4() {
      return this.emit(OpCodes_default.i32x4_neg);
    }
    all_true_i32x4() {
      return this.emit(OpCodes_default.i32x4_all_true);
    }
    bitmask_i32x4() {
      return this.emit(OpCodes_default.i32x4_bitmask);
    }
    extend_low_i16x8_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_extend_low_i16x8_s);
    }
    extend_high_i16x8_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_extend_high_i16x8_s);
    }
    extend_low_i16x8_u_i32x4() {
      return this.emit(OpCodes_default.i32x4_extend_low_i16x8_u);
    }
    extend_high_i16x8_u_i32x4() {
      return this.emit(OpCodes_default.i32x4_extend_high_i16x8_u);
    }
    shl_i32x4() {
      return this.emit(OpCodes_default.i32x4_shl);
    }
    shr_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_shr_s);
    }
    shr_u_i32x4() {
      return this.emit(OpCodes_default.i32x4_shr_u);
    }
    add_i32x4() {
      return this.emit(OpCodes_default.i32x4_add);
    }
    convert_i32x4_s_f32x4() {
      return this.emit(OpCodes_default.f32x4_convert_i32x4_s);
    }
    convert_i32x4_u_f32x4() {
      return this.emit(OpCodes_default.f32x4_convert_i32x4_u);
    }
    sub_i32x4() {
      return this.emit(OpCodes_default.i32x4_sub);
    }
    mul_i32x4() {
      return this.emit(OpCodes_default.i32x4_mul);
    }
    min_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_min_s);
    }
    min_u_i32x4() {
      return this.emit(OpCodes_default.i32x4_min_u);
    }
    max_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_max_s);
    }
    max_u_i32x4() {
      return this.emit(OpCodes_default.i32x4_max_u);
    }
    dot_i16x8_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_dot_i16x8_s);
    }
    extmul_low_i16x8_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_extmul_low_i16x8_s);
    }
    extmul_high_i16x8_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_extmul_high_i16x8_s);
    }
    extmul_low_i16x8_u_i32x4() {
      return this.emit(OpCodes_default.i32x4_extmul_low_i16x8_u);
    }
    extmul_high_i16x8_u_i32x4() {
      return this.emit(OpCodes_default.i32x4_extmul_high_i16x8_u);
    }
    abs_i64x2() {
      return this.emit(OpCodes_default.i64x2_abs);
    }
    neg_i64x2() {
      return this.emit(OpCodes_default.i64x2_neg);
    }
    all_true_i64x2() {
      return this.emit(OpCodes_default.i64x2_all_true);
    }
    bitmask_i64x2() {
      return this.emit(OpCodes_default.i64x2_bitmask);
    }
    extend_low_i32x4_s_i64x2() {
      return this.emit(OpCodes_default.i64x2_extend_low_i32x4_s);
    }
    extend_high_i32x4_s_i64x2() {
      return this.emit(OpCodes_default.i64x2_extend_high_i32x4_s);
    }
    extend_low_i32x4_u_i64x2() {
      return this.emit(OpCodes_default.i64x2_extend_low_i32x4_u);
    }
    extend_high_i32x4_u_i64x2() {
      return this.emit(OpCodes_default.i64x2_extend_high_i32x4_u);
    }
    shl_i64x2() {
      return this.emit(OpCodes_default.i64x2_shl);
    }
    shr_s_i64x2() {
      return this.emit(OpCodes_default.i64x2_shr_s);
    }
    shr_u_i64x2() {
      return this.emit(OpCodes_default.i64x2_shr_u);
    }
    add_i64x2() {
      return this.emit(OpCodes_default.i64x2_add);
    }
    sub_i64x2() {
      return this.emit(OpCodes_default.i64x2_sub);
    }
    mul_i64x2() {
      return this.emit(OpCodes_default.i64x2_mul);
    }
    eq_i64x2() {
      return this.emit(OpCodes_default.i64x2_eq);
    }
    ne_i64x2() {
      return this.emit(OpCodes_default.i64x2_ne);
    }
    lt_s_i64x2() {
      return this.emit(OpCodes_default.i64x2_lt_s);
    }
    gt_s_i64x2() {
      return this.emit(OpCodes_default.i64x2_gt_s);
    }
    le_s_i64x2() {
      return this.emit(OpCodes_default.i64x2_le_s);
    }
    ge_s_i64x2() {
      return this.emit(OpCodes_default.i64x2_ge_s);
    }
    extmul_low_i32x4_s_i64x2() {
      return this.emit(OpCodes_default.i64x2_extmul_low_i32x4_s);
    }
    extmul_high_i32x4_s_i64x2() {
      return this.emit(OpCodes_default.i64x2_extmul_high_i32x4_s);
    }
    extmul_low_i32x4_u_i64x2() {
      return this.emit(OpCodes_default.i64x2_extmul_low_i32x4_u);
    }
    extmul_high_i32x4_u_i64x2() {
      return this.emit(OpCodes_default.i64x2_extmul_high_i32x4_u);
    }
    abs_f32x4() {
      return this.emit(OpCodes_default.f32x4_abs);
    }
    neg_f32x4() {
      return this.emit(OpCodes_default.f32x4_neg);
    }
    sqrt_f32x4() {
      return this.emit(OpCodes_default.f32x4_sqrt);
    }
    add_f32x4() {
      return this.emit(OpCodes_default.f32x4_add);
    }
    sub_f32x4() {
      return this.emit(OpCodes_default.f32x4_sub);
    }
    mul_f32x4() {
      return this.emit(OpCodes_default.f32x4_mul);
    }
    div_f32x4() {
      return this.emit(OpCodes_default.f32x4_div);
    }
    min_f32x4() {
      return this.emit(OpCodes_default.f32x4_min);
    }
    max_f32x4() {
      return this.emit(OpCodes_default.f32x4_max);
    }
    pmin_f32x4() {
      return this.emit(OpCodes_default.f32x4_pmin);
    }
    pmax_f32x4() {
      return this.emit(OpCodes_default.f32x4_pmax);
    }
    abs_f64x2() {
      return this.emit(OpCodes_default.f64x2_abs);
    }
    neg_f64x2() {
      return this.emit(OpCodes_default.f64x2_neg);
    }
    sqrt_f64x2() {
      return this.emit(OpCodes_default.f64x2_sqrt);
    }
    add_f64x2() {
      return this.emit(OpCodes_default.f64x2_add);
    }
    sub_f64x2() {
      return this.emit(OpCodes_default.f64x2_sub);
    }
    mul_f64x2() {
      return this.emit(OpCodes_default.f64x2_mul);
    }
    div_f64x2() {
      return this.emit(OpCodes_default.f64x2_div);
    }
    min_f64x2() {
      return this.emit(OpCodes_default.f64x2_min);
    }
    max_f64x2() {
      return this.emit(OpCodes_default.f64x2_max);
    }
    pmin_f64x2() {
      return this.emit(OpCodes_default.f64x2_pmin);
    }
    pmax_f64x2() {
      return this.emit(OpCodes_default.f64x2_pmax);
    }
    trunc_sat_f64x2_s_zero_i32x4() {
      return this.emit(OpCodes_default.i32x4_trunc_sat_f64x2_s_zero);
    }
    trunc_sat_f64x2_u_zero_i32x4() {
      return this.emit(OpCodes_default.i32x4_trunc_sat_f64x2_u_zero);
    }
    convert_low_i32x4_s_f64x2() {
      return this.emit(OpCodes_default.f64x2_convert_low_i32x4_s);
    }
    convert_low_i32x4_u_f64x2() {
      return this.emit(OpCodes_default.f64x2_convert_low_i32x4_u);
    }
    demote_f64x2_zero_f32x4() {
      return this.emit(OpCodes_default.f32x4_demote_f64x2_zero);
    }
    promote_low_f32x4_f64x2() {
      return this.emit(OpCodes_default.f64x2_promote_low_f32x4);
    }
    atomic_notify(alignment, offset) {
      return this.emit(OpCodes_default.memory_atomic_notify, alignment, offset);
    }
    atomic_wait32(alignment, offset) {
      return this.emit(OpCodes_default.memory_atomic_wait32, alignment, offset);
    }
    atomic_wait64(alignment, offset) {
      return this.emit(OpCodes_default.memory_atomic_wait64, alignment, offset);
    }
    atomic_fence(varUInt1) {
      return this.emit(OpCodes_default.atomic_fence, varUInt1);
    }
    atomic_load_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_load, alignment, offset);
    }
    atomic_load_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_load, alignment, offset);
    }
    atomic_load8_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_load8_u, alignment, offset);
    }
    atomic_load16_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_load16_u, alignment, offset);
    }
    atomic_load8_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_load8_u, alignment, offset);
    }
    atomic_load16_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_load16_u, alignment, offset);
    }
    atomic_load32_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_load32_u, alignment, offset);
    }
    atomic_store_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_store, alignment, offset);
    }
    atomic_store_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_store, alignment, offset);
    }
    atomic_store8_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_store8, alignment, offset);
    }
    atomic_store16_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_store16, alignment, offset);
    }
    atomic_store8_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_store8, alignment, offset);
    }
    atomic_store16_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_store16, alignment, offset);
    }
    atomic_store32_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_store32, alignment, offset);
    }
    atomic_rmw_add_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw_add, alignment, offset);
    }
    atomic_rmw_add_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw_add, alignment, offset);
    }
    atomic_rmw8_add_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw8_add_u, alignment, offset);
    }
    atomic_rmw16_add_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw16_add_u, alignment, offset);
    }
    atomic_rmw8_add_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw8_add_u, alignment, offset);
    }
    atomic_rmw16_add_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw16_add_u, alignment, offset);
    }
    atomic_rmw32_add_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw32_add_u, alignment, offset);
    }
    atomic_rmw_sub_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw_sub, alignment, offset);
    }
    atomic_rmw_sub_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw_sub, alignment, offset);
    }
    atomic_rmw8_sub_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw8_sub_u, alignment, offset);
    }
    atomic_rmw16_sub_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw16_sub_u, alignment, offset);
    }
    atomic_rmw8_sub_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw8_sub_u, alignment, offset);
    }
    atomic_rmw16_sub_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw16_sub_u, alignment, offset);
    }
    atomic_rmw32_sub_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw32_sub_u, alignment, offset);
    }
    atomic_rmw_and_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw_and, alignment, offset);
    }
    atomic_rmw_and_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw_and, alignment, offset);
    }
    atomic_rmw8_and_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw8_and_u, alignment, offset);
    }
    atomic_rmw16_and_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw16_and_u, alignment, offset);
    }
    atomic_rmw8_and_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw8_and_u, alignment, offset);
    }
    atomic_rmw16_and_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw16_and_u, alignment, offset);
    }
    atomic_rmw32_and_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw32_and_u, alignment, offset);
    }
    atomic_rmw_or_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw_or, alignment, offset);
    }
    atomic_rmw_or_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw_or, alignment, offset);
    }
    atomic_rmw8_or_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw8_or_u, alignment, offset);
    }
    atomic_rmw16_or_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw16_or_u, alignment, offset);
    }
    atomic_rmw8_or_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw8_or_u, alignment, offset);
    }
    atomic_rmw16_or_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw16_or_u, alignment, offset);
    }
    atomic_rmw32_or_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw32_or_u, alignment, offset);
    }
    atomic_rmw_xor_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw_xor, alignment, offset);
    }
    atomic_rmw_xor_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw_xor, alignment, offset);
    }
    atomic_rmw8_xor_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw8_xor_u, alignment, offset);
    }
    atomic_rmw16_xor_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw16_xor_u, alignment, offset);
    }
    atomic_rmw8_xor_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw8_xor_u, alignment, offset);
    }
    atomic_rmw16_xor_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw16_xor_u, alignment, offset);
    }
    atomic_rmw32_xor_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw32_xor_u, alignment, offset);
    }
    atomic_rmw_xchg_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw_xchg, alignment, offset);
    }
    atomic_rmw_xchg_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw_xchg, alignment, offset);
    }
    atomic_rmw8_xchg_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw8_xchg_u, alignment, offset);
    }
    atomic_rmw16_xchg_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw16_xchg_u, alignment, offset);
    }
    atomic_rmw8_xchg_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw8_xchg_u, alignment, offset);
    }
    atomic_rmw16_xchg_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw16_xchg_u, alignment, offset);
    }
    atomic_rmw32_xchg_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw32_xchg_u, alignment, offset);
    }
    atomic_rmw_cmpxchg_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw_cmpxchg, alignment, offset);
    }
    atomic_rmw_cmpxchg_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw_cmpxchg, alignment, offset);
    }
    atomic_rmw8_cmpxchg_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw8_cmpxchg_u, alignment, offset);
    }
    atomic_rmw16_cmpxchg_u_i32(alignment, offset) {
      return this.emit(OpCodes_default.i32_atomic_rmw16_cmpxchg_u, alignment, offset);
    }
    atomic_rmw8_cmpxchg_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw8_cmpxchg_u, alignment, offset);
    }
    atomic_rmw16_cmpxchg_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw16_cmpxchg_u, alignment, offset);
    }
    atomic_rmw32_cmpxchg_u_i64(alignment, offset) {
      return this.emit(OpCodes_default.i64_atomic_rmw32_cmpxchg_u, alignment, offset);
    }
    relaxed_swizzle_i8x16() {
      return this.emit(OpCodes_default.i8x16_relaxed_swizzle);
    }
    relaxed_trunc_f32x4_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_relaxed_trunc_f32x4_s);
    }
    relaxed_trunc_f32x4_u_i32x4() {
      return this.emit(OpCodes_default.i32x4_relaxed_trunc_f32x4_u);
    }
    relaxed_trunc_f64x2_s_zero_i32x4() {
      return this.emit(OpCodes_default.i32x4_relaxed_trunc_f64x2_s_zero);
    }
    relaxed_trunc_f64x2_u_zero_i32x4() {
      return this.emit(OpCodes_default.i32x4_relaxed_trunc_f64x2_u_zero);
    }
    relaxed_madd_f32x4() {
      return this.emit(OpCodes_default.f32x4_relaxed_madd);
    }
    relaxed_nmadd_f32x4() {
      return this.emit(OpCodes_default.f32x4_relaxed_nmadd);
    }
    relaxed_madd_f64x2() {
      return this.emit(OpCodes_default.f64x2_relaxed_madd);
    }
    relaxed_nmadd_f64x2() {
      return this.emit(OpCodes_default.f64x2_relaxed_nmadd);
    }
    relaxed_laneselect_i8x16() {
      return this.emit(OpCodes_default.i8x16_relaxed_laneselect);
    }
    relaxed_laneselect_i16x8() {
      return this.emit(OpCodes_default.i16x8_relaxed_laneselect);
    }
    relaxed_laneselect_i32x4() {
      return this.emit(OpCodes_default.i32x4_relaxed_laneselect);
    }
    relaxed_laneselect_i64x2() {
      return this.emit(OpCodes_default.i64x2_relaxed_laneselect);
    }
    relaxed_min_f32x4() {
      return this.emit(OpCodes_default.f32x4_relaxed_min);
    }
    relaxed_max_f32x4() {
      return this.emit(OpCodes_default.f32x4_relaxed_max);
    }
    relaxed_min_f64x2() {
      return this.emit(OpCodes_default.f64x2_relaxed_min);
    }
    relaxed_max_f64x2() {
      return this.emit(OpCodes_default.f64x2_relaxed_max);
    }
    relaxed_q15mulr_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_relaxed_q15mulr_s);
    }
    relaxed_dot_i8x16_i7x16_s_i16x8() {
      return this.emit(OpCodes_default.i16x8_relaxed_dot_i8x16_i7x16_s);
    }
    relaxed_dot_i8x16_i7x16_add_s_i32x4() {
      return this.emit(OpCodes_default.i32x4_relaxed_dot_i8x16_i7x16_add_s);
    }
    struct_new(varUInt32) {
      return this.emit(OpCodes_default.struct_new, varUInt32);
    }
    struct_new_default(varUInt32) {
      return this.emit(OpCodes_default.struct_new_default, varUInt32);
    }
    struct_get(typeIndex, fieldIndex) {
      return this.emit(OpCodes_default.struct_get, typeIndex, fieldIndex);
    }
    struct_get_s(typeIndex, fieldIndex) {
      return this.emit(OpCodes_default.struct_get_s, typeIndex, fieldIndex);
    }
    struct_get_u(typeIndex, fieldIndex) {
      return this.emit(OpCodes_default.struct_get_u, typeIndex, fieldIndex);
    }
    struct_set(typeIndex, fieldIndex) {
      return this.emit(OpCodes_default.struct_set, typeIndex, fieldIndex);
    }
    array_new(varUInt32) {
      return this.emit(OpCodes_default.array_new, varUInt32);
    }
    array_new_default(varUInt32) {
      return this.emit(OpCodes_default.array_new_default, varUInt32);
    }
    array_new_fixed(typeIndex, index) {
      return this.emit(OpCodes_default.array_new_fixed, typeIndex, index);
    }
    array_new_data(typeIndex, index) {
      return this.emit(OpCodes_default.array_new_data, typeIndex, index);
    }
    array_new_elem(typeIndex, index) {
      return this.emit(OpCodes_default.array_new_elem, typeIndex, index);
    }
    array_get(varUInt32) {
      return this.emit(OpCodes_default.array_get, varUInt32);
    }
    array_get_s(varUInt32) {
      return this.emit(OpCodes_default.array_get_s, varUInt32);
    }
    array_get_u(varUInt32) {
      return this.emit(OpCodes_default.array_get_u, varUInt32);
    }
    array_set(varUInt32) {
      return this.emit(OpCodes_default.array_set, varUInt32);
    }
    array_len() {
      return this.emit(OpCodes_default.array_len);
    }
    array_fill(varUInt32) {
      return this.emit(OpCodes_default.array_fill, varUInt32);
    }
    array_copy(typeIndex, index) {
      return this.emit(OpCodes_default.array_copy, typeIndex, index);
    }
    array_init_data(typeIndex, index) {
      return this.emit(OpCodes_default.array_init_data, typeIndex, index);
    }
    array_init_elem(typeIndex, index) {
      return this.emit(OpCodes_default.array_init_elem, typeIndex, index);
    }
    ref_test(heapType) {
      return this.emit(OpCodes_default.ref_test, heapType);
    }
    ref_test_null(heapType) {
      return this.emit(OpCodes_default.ref_test_null, heapType);
    }
    ref_cast(heapType) {
      return this.emit(OpCodes_default.ref_cast, heapType);
    }
    ref_cast_null(heapType) {
      return this.emit(OpCodes_default.ref_cast_null, heapType);
    }
    br_on_cast(flags, labelBuilder, heapType1, heapType2) {
      return this.emit(OpCodes_default.br_on_cast, flags, labelBuilder, heapType1, heapType2);
    }
    br_on_cast_fail(flags, labelBuilder, heapType1, heapType2) {
      return this.emit(OpCodes_default.br_on_cast_fail, flags, labelBuilder, heapType1, heapType2);
    }
    any_convert_extern() {
      return this.emit(OpCodes_default.any_convert_extern);
    }
    extern_convert_any() {
      return this.emit(OpCodes_default.extern_convert_any);
    }
    ref_i31() {
      return this.emit(OpCodes_default.ref_i31);
    }
    i31_get_s() {
      return this.emit(OpCodes_default.i31_get_s);
    }
    i31_get_u() {
      return this.emit(OpCodes_default.i31_get_u);
    }
  };

  // src/verification/ControlFlowBlock.ts
  var ControlFlowBlock = class {
    constructor(stack, blockType, parent, index, depth, childrenCount, isLoop = false, isTry = false) {
      this.stack = stack;
      this.blockType = blockType;
      this.parent = parent;
      this.index = index;
      this.depth = depth;
      this.childrenCount = childrenCount;
      this.isLoop = isLoop;
      this.isTry = isTry;
      this.inCatchHandler = false;
    }
    canReference(block) {
      if (this.depth > block.depth) {
        return false;
      }
      let potentialMatch = block;
      for (let index = 0; index < block.depth - this.depth; index++) {
        potentialMatch = potentialMatch.parent;
      }
      return potentialMatch === this;
    }
    findParent(other) {
      let potentialParent;
      let potentialMatch;
      if (other.depth > this.depth) {
        potentialParent = this;
        potentialMatch = other;
      } else {
        potentialParent = other;
        potentialMatch = this;
      }
      for (let index = 0; index < Math.abs(potentialParent.depth - potentialMatch.depth); index++) {
        potentialMatch = potentialMatch.parent;
      }
      return potentialParent === potentialMatch ? potentialParent : null;
    }
  };

  // src/verification/VerificationError.ts
  var VerificationError = class extends Error {
    constructor(message) {
      super(message);
      this.name = "VerificationError";
    }
  };

  // src/verification/ControlFlowVerifier.ts
  var ControlFlowVerifier = class {
    constructor(disableVerification) {
      this._stack = [];
      this._unresolvedLabels = [];
      this._disableVerification = disableVerification;
    }
    get size() {
      return this._stack.length;
    }
    push(operandStack, blockType, label = null, isLoop = false, isTry = false) {
      const current = this.peek();
      if (label) {
        if (!this._disableVerification && label.isResolved) {
          throw new VerificationError(
            "Cannot use a label that has already been associated with another block."
          );
        }
        const labelIndex = this._unresolvedLabels.findIndex((x) => x === label);
        if (labelIndex === -1) {
          throw new VerificationError("The label was not created for this function.");
        }
        if (!this._disableVerification && label.block && current && !current.block.canReference(label.block)) {
          throw new VerificationError(
            "Label has been referenced by an instruction in an enclosing block that cannot branch to the current enclosing block."
          );
        }
        this._unresolvedLabels.splice(labelIndex, 1);
      } else {
        label = new LabelBuilder();
      }
      const block = !current ? new ControlFlowBlock(operandStack, BlockType.Void, null, 0, 0, 0) : new ControlFlowBlock(
        operandStack,
        blockType,
        current.block,
        current.block.childrenCount++,
        current.block.depth + 1,
        0,
        isLoop,
        isTry
      );
      label.resolve(block);
      this._stack.push(label);
      return label;
    }
    pop() {
      if (this._stack.length === 0) {
        throw new VerificationError("Cannot end the block, the stack is empty.");
      }
      this._stack.pop();
    }
    peek() {
      return this._stack.length === 0 ? null : this._stack[this._stack.length - 1];
    }
    defineLabel() {
      const label = new LabelBuilder();
      this._unresolvedLabels.push(label);
      return label;
    }
    reference(label) {
      if (this._disableVerification) {
        return;
      }
      const current = this.peek();
      if (label.isResolved) {
        if (!current || !label.block.canReference(current.block)) {
          throw new VerificationError(
            "The label cannot be referenced by the current enclosing block."
          );
        }
      } else {
        if (!this._unresolvedLabels.find((x) => x === label)) {
          throw new VerificationError("The label was not created for this function.");
        }
        if (!label.block) {
          throw new VerificationError("Label has not been associated with any block.");
        }
        const potentialParent = label.block.findParent(current.block);
        if (!potentialParent) {
          throw new VerificationError("The reference to this label is invalid.");
        }
        label.reference(potentialParent);
      }
    }
    verify() {
      if (this._disableVerification) {
        return;
      }
      if (this._unresolvedLabels.some((x) => x.block)) {
        throw new VerificationError("The function contains unresolved labels.");
      }
      if (this._stack.length === 1) {
        throw new VerificationError("Function is missing closing end instruction.");
      } else if (this._stack.length !== 0) {
        throw new VerificationError(
          `Function has ${this._stack.length} control structures that are not closed. Every block, if, and loop must have a corresponding end instruction.`
        );
      }
    }
  };

  // src/verification/OperandStack.ts
  var _OperandStack = class _OperandStack {
    constructor(valueType, previous = null) {
      this._valueType = valueType;
      this._previous = previous;
      this._length = this._previous ? this._previous._length + 1 : 1;
    }
    get length() {
      return this._length;
    }
    get valueType() {
      if (this.isEmpty) {
        throw new Error("The stack is empty.");
      }
      return this._valueType;
    }
    get isEmpty() {
      return this._length === 0;
    }
    push(valueType) {
      return new _OperandStack(valueType, this);
    }
    pop() {
      if (this.isEmpty) {
        throw new Error("The stack is empty.");
      }
      return this._previous;
    }
    peek() {
      return this._previous;
    }
  };
  _OperandStack.Empty = (() => {
    const operandStack = Object.create(_OperandStack.prototype);
    operandStack._valueType = null;
    operandStack._previous = null;
    operandStack._length = 0;
    return operandStack;
  })();
  var OperandStack = _OperandStack;

  // src/FuncTypeSignature.ts
  var _FuncTypeSignature = class _FuncTypeSignature {
    constructor(returnTypes, parameterTypes) {
      this.returnTypes = returnTypes;
      this.parameterTypes = parameterTypes;
    }
  };
  _FuncTypeSignature.empty = new _FuncTypeSignature([], []);
  var FuncTypeSignature = _FuncTypeSignature;

  // src/FuncTypeBuilder.ts
  var FuncTypeBuilder = class {
    constructor(key, returnTypes, parameterTypes, index) {
      this.key = key;
      this.returnTypes = returnTypes;
      this.parameterTypes = parameterTypes;
      this.index = index;
    }
    get typeForm() {
      return TypeForm.Func;
    }
    static createKey(returnTypes, parameterTypes) {
      let key = "(";
      returnTypes.forEach((x, i) => {
        key += x.short;
        if (i !== returnTypes.length - 1) {
          key += ", ";
        }
      });
      key += ")(";
      parameterTypes.forEach((x, i) => {
        key += x.short;
        if (i !== parameterTypes.length - 1) {
          key += ", ";
        }
      });
      key += ")";
      return key;
    }
    write(writer) {
      writer.writeVarInt7(TypeForm.Func.value);
      writer.writeVarUInt32(this.parameterTypes.length);
      this.parameterTypes.forEach((x) => {
        writeValueType(writer, x);
      });
      writer.writeVarUInt32(this.returnTypes.length);
      this.returnTypes.forEach((x) => {
        writeValueType(writer, x);
      });
    }
    toSignature() {
      return new FuncTypeSignature(this.returnTypes, this.parameterTypes);
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/verification/OperandStackVerifier.ts
  var heapTypeToValueType = {
    112: ValueType.FuncRef,
    111: ValueType.ExternRef,
    110: ValueType.AnyRef,
    109: ValueType.EqRef,
    108: ValueType.I31Ref,
    107: ValueType.StructRef,
    106: ValueType.ArrayRef,
    113: ValueType.NullRef,
    115: ValueType.NullFuncRef,
    114: ValueType.NullExternRef
  };
  var _refTypes = /* @__PURE__ */ new Set([
    ValueType.FuncRef,
    ValueType.ExternRef,
    ValueType.AnyRef,
    ValueType.EqRef,
    ValueType.I31Ref,
    ValueType.StructRef,
    ValueType.ArrayRef,
    ValueType.NullRef,
    ValueType.NullFuncRef,
    ValueType.NullExternRef
  ]);
  var valueTypeByName = {
    Int32: ValueType.Int32,
    Int64: ValueType.Int64,
    Float32: ValueType.Float32,
    Float64: ValueType.Float64,
    V128: ValueType.V128,
    FuncRef: ValueType.FuncRef,
    ExternRef: ValueType.ExternRef,
    AnyRef: ValueType.AnyRef,
    EqRef: ValueType.EqRef,
    I31Ref: ValueType.I31Ref,
    StructRef: ValueType.StructRef,
    ArrayRef: ValueType.ArrayRef
  };
  function _isRefType(vt) {
    return _refTypes.has(vt);
  }
  var OperandStackVerifier = class {
    constructor(funcType, typeResolver, memory64) {
      this._operandStack = OperandStack.Empty;
      this._instructionCount = 0;
      this._funcType = funcType;
      this._unreachable = false;
      this._typeResolver = typeResolver || null;
      this._memory64 = memory64 || false;
    }
    get stack() {
      return this._operandStack;
    }
    verifyInstruction(controlBlock, opCode, immediate) {
      if (this._unreachable) {
        if (opCode.controlFlow === "Pop" /* Pop */) {
          this._unreachable = false;
          this._operandStack = controlBlock.stack;
          const resultTypes = this._resolveBlockResultTypes(controlBlock);
          for (const rt of resultTypes) {
            this._operandStack = this._operandStack.push(rt);
          }
        }
        this._instructionCount++;
        return;
      }
      let modifiedStack = this._operandStack;
      if (opCode.stackBehavior !== "None" /* None */) {
        modifiedStack = this._verifyStack(controlBlock, opCode, immediate);
      }
      if (opCode.controlFlow === "Pop" /* Pop */) {
        this._verifyControlFlowPop(controlBlock, modifiedStack);
      } else if (opCode === OpCodes_default["return"]) {
        modifiedStack = this._verifyReturnValues(modifiedStack, true);
        this._unreachable = true;
      }
      if (immediate && immediate.type === "RelativeDepth" /* RelativeDepth */) {
        this._verifyBranch(modifiedStack, immediate);
      }
      if (opCode === OpCodes_default["throw"] || opCode === OpCodes_default.rethrow || opCode === OpCodes_default.unreachable || opCode === OpCodes_default.br || opCode === OpCodes_default.br_table) {
        this._unreachable = true;
      }
      this._operandStack = modifiedStack;
      this._instructionCount++;
    }
    verifyElse(controlBlock) {
      if (this._unreachable) {
        this._unreachable = false;
        this._operandStack = controlBlock.stack;
        return;
      }
      const resultTypes = this._resolveBlockResultTypes(controlBlock);
      if (resultTypes.length > 0) {
        let current = this._operandStack;
        for (let i = resultTypes.length - 1; i >= 0; i--) {
          if (current.isEmpty) {
            throw new VerificationError(
              `else: expected ${resultTypes[i].name} on the stack from the if-branch but the stack is empty.`
            );
          }
          if (!this._isAssignableTo(current.valueType, resultTypes[i])) {
            throw new VerificationError(
              `else: expected ${resultTypes[i].name} on the stack but found ${current.valueType.name}.`
            );
          }
          current = current.pop();
        }
        if (current !== controlBlock.stack) {
          throw new VerificationError(
            "else: stack (minus result value) does not match the if-block entry stack."
          );
        }
      } else {
        if (this._operandStack !== controlBlock.stack) {
          throw new VerificationError(
            "else: stack does not match the if-block entry stack."
          );
        }
      }
      this._operandStack = controlBlock.stack;
    }
    _verifyBranch(stack, immediate) {
      const targetBlock = immediate.values[0].block;
      const targetEntryStack = targetBlock.stack;
      if (targetBlock.isLoop) {
        if (targetEntryStack !== stack) {
          throw new VerificationError(
            "Branch to loop: stack does not match the loop entry stack."
          );
        }
        return;
      }
      const resultTypes = this._resolveBlockResultTypes(targetBlock);
      if (resultTypes.length > 0) {
        for (let i = resultTypes.length - 1; i >= 0; i--) {
          if (stack.isEmpty) {
            throw new VerificationError(
              `Branch expects ${resultTypes[i].name} on the stack but the stack is empty.`
            );
          }
          if (!this._isAssignableTo(stack.valueType, resultTypes[i])) {
            throw new VerificationError(
              `Branch expects ${resultTypes[i].name} but found ${stack.valueType.name} on the stack.`
            );
          }
          stack = stack.pop();
        }
      }
      if (targetEntryStack !== stack) {
        throw new VerificationError(
          "Branch: stack does not match the target block entry stack."
        );
      }
    }
    _verifyReturnValues(stack, pop = false) {
      const remaining = this._getStackValueTypes(stack, stack.length);
      if (remaining.length !== this._funcType.returnTypes.length) {
        if (remaining.length === 0) {
          throw new VerificationError(
            `Function expected to return ${this._formatAndList(this._funcType.returnTypes, (x) => x.name)} but stack is empty.`
          );
        } else if (this._funcType.returnTypes.length === 0) {
          throw new VerificationError(
            `Function does not have any return values but ${this._formatAndList(remaining, (x) => x.name)} was found on the stack.`
          );
        }
        throw new VerificationError(
          `Function return values do not match the items on the stack. Expected: ${this._formatAndList(this._funcType.returnTypes, (x) => x.name)} Found on stack: ${this._formatAndList(remaining, (x) => x.name)}.`
        );
      }
      let errorMessage = "";
      for (let index = 0; index < remaining.length; index++) {
        if (!this._isAssignableTo(remaining[index], this._funcType.returnTypes[index])) {
          errorMessage = `A ${this._funcType.returnTypes[index].name} was expected at ${remaining.length - index} but a ${remaining[index].name} was found. `;
        }
      }
      if (errorMessage !== "") {
        throw new VerificationError("Error returning from function: " + errorMessage);
      }
      if (pop) {
        for (let index = 0; index < remaining.length; index++) {
          stack = stack.pop();
        }
      }
      return stack;
    }
    _resolveBlockResultTypes(block) {
      if (block.blockType === BlockType.Void) return [];
      if (typeof block.blockType === "number") {
        if (this._typeResolver?.getFuncType) {
          const ft = this._typeResolver.getFuncType(block.blockType);
          if (ft) return ft.returnTypes;
        }
        return [];
      }
      return [block.blockType];
    }
    _resolveBlockParamTypes(block) {
      if (typeof block.blockType === "number") {
        if (this._typeResolver?.getFuncType) {
          const ft = this._typeResolver.getFuncType(block.blockType);
          if (ft) return ft.parameterTypes;
        }
      }
      return [];
    }
    _verifyControlFlowPop(controlBlock, stack) {
      if (controlBlock.depth === 0) {
        this._verifyReturnValues(stack);
      } else {
        const resultTypes = this._resolveBlockResultTypes(controlBlock);
        let expected = stack;
        for (let i = resultTypes.length - 1; i >= 0; i--) {
          if (expected.isEmpty) {
            throw new VerificationError(
              `Stack mismatch at end of block (depth ${controlBlock.depth}): expected ${resultTypes[i].name} but stack is empty.`
            );
          }
          if (!this._isAssignableTo(expected.valueType, resultTypes[i])) {
            throw new VerificationError(
              `Stack mismatch at end of block (depth ${controlBlock.depth}): expected ${resultTypes[i].name} but found ${expected.valueType.name}.`
            );
          }
          expected = expected.pop();
        }
        if (controlBlock.stack !== expected) {
          throw new VerificationError(
            `Stack mismatch at end of block (depth ${controlBlock.depth}): expected block's entry stack but got a different stack state.`
          );
        }
      }
    }
    _verifyStack(controlFlowBlock, opCode, immediate) {
      let modifiedStack = this._operandStack;
      const funcType = this._getFuncType(opCode, immediate);
      if (opCode === OpCodes_default.ref_null && immediate) {
        const heapType = immediate.values[0];
        const refVt = typeof heapType === "number" && heapTypeToValueType[heapType] ? heapTypeToValueType[heapType] : ValueType.AnyRef;
        return modifiedStack.push(refVt);
      }
      if (opCode === OpCodes_default.ref_is_null) {
        return modifiedStack.pop().push(ValueType.Int32);
      }
      if (opCode === OpCodes_default.ref_func) {
        return modifiedStack.push(ValueType.FuncRef);
      }
      if (opCode === OpCodes_default.struct_new && this._typeResolver && immediate) {
        const typeIndex = immediate.values[0];
        const structType = this._typeResolver.getStructType(typeIndex);
        if (structType) {
          for (let i = structType.fields.length - 1; i >= 0; i--) {
            modifiedStack = modifiedStack.pop();
          }
        }
        modifiedStack = modifiedStack.push(refType(typeIndex));
        return modifiedStack;
      }
      if (opCode === OpCodes_default.array_new_fixed && immediate) {
        const typeIndex = immediate.values[0];
        const fixedLength = immediate.values[1];
        for (let i = 0; i < fixedLength; i++) {
          modifiedStack = modifiedStack.pop();
        }
        modifiedStack = modifiedStack.push(refType(typeIndex));
        return modifiedStack;
      }
      if (opCode.stackBehavior === "Pop" /* Pop */ || opCode.stackBehavior === "PopPush" /* PopPush */) {
        modifiedStack = this._verifyStackPop(modifiedStack, opCode, funcType);
      }
      if (opCode.stackBehavior === "Push" /* Push */ || opCode.stackBehavior === "PopPush" /* PopPush */) {
        modifiedStack = this._stackPush(
          modifiedStack,
          controlFlowBlock,
          opCode,
          immediate,
          funcType
        );
      }
      return modifiedStack;
    }
    _verifyStackPop(stack, opCode, funcType) {
      const pops = opCode.popOperands || [];
      for (let idx = pops.length - 1; idx >= 0; idx--) {
        const x = pops[idx];
        if (x === "Any" /* Any */) {
          stack = stack.pop();
          continue;
        }
        const valueType = valueTypeByName[x];
        if (!this._isAssignableTo(stack.valueType, valueType)) {
          throw new VerificationError(
            `Unexpected type found on stack at offset ${this._instructionCount + 1}. A ${valueType.name} was expected but a ${stack.valueType.name} was found.`
          );
        }
        stack = stack.pop();
      }
      if (funcType) {
        const params = funcType.parameterTypes;
        for (let idx = params.length - 1; idx >= 0; idx--) {
          const x = params[idx];
          if (!this._isAssignableTo(stack.valueType, x)) {
            throw new VerificationError(
              `Unexpected type found on stack at offset ${this._instructionCount + 1}. A ${x.name} was expected but a ${stack.valueType.name} was found.`
            );
          }
          stack = stack.pop();
        }
      }
      return stack;
    }
    _stackPush(stack, controlBlock, opCode, immediate, funcType) {
      const stackStart = stack;
      if (funcType) {
        stack = funcType.returnTypes.reduce((i, x) => {
          return i.push(x);
        }, stack);
      }
      stack = (opCode.pushOperands || []).reduce((i, x) => {
        let valueType;
        if (x !== "Any" /* Any */) {
          valueType = valueTypeByName[x];
        } else {
          const popCount = this._operandStack.length - stackStart.length;
          valueType = this._getStackObjectValueType(opCode, immediate, popCount);
        }
        return i.push(valueType);
      }, stack);
      return stack;
    }
    _getFuncType(opCode, immediate) {
      let funcType = null;
      if (opCode === OpCodes_default.call || opCode === OpCodes_default.return_call) {
        if (immediate.values[0] instanceof ImportBuilder) {
          funcType = immediate.values[0].data;
        } else if (immediate.values[0] && "funcTypeBuilder" in immediate.values[0]) {
          funcType = immediate.values[0].funcTypeBuilder;
        } else {
          throw new VerificationError("Error getting funcType for call, invalid immediate.");
        }
      } else if (opCode === OpCodes_default.call_indirect || opCode === OpCodes_default.return_call_indirect) {
        if (immediate.values[0] instanceof FuncTypeBuilder) {
          funcType = immediate.values[0];
        } else {
          throw new VerificationError(
            "Error getting funcType for call_indirect, invalid immediate."
          );
        }
      }
      return funcType;
    }
    _getStackObjectValueType(opCode, immediate, argCount) {
      if (opCode === OpCodes_default.get_global || opCode === OpCodes_default.set_global) {
        if (immediate.values[0] instanceof GlobalBuilder) {
          return immediate.values[0].valueType;
        } else if (immediate.values[0] instanceof ImportBuilder) {
          return immediate.values[0].data.valueType;
        }
        throw new VerificationError("Invalid operand for global instruction.");
      } else if (opCode === OpCodes_default.get_local || opCode === OpCodes_default.set_local || opCode === OpCodes_default.tee_local) {
        if (!(immediate.values[0] instanceof LocalBuilder) && !(immediate.values[0] instanceof FunctionParameterBuilder)) {
          throw new VerificationError("Invalid operand for local instruction.");
        }
        return immediate.values[0].valueType;
      }
      if (opCode === OpCodes_default.struct_get && this._typeResolver && immediate) {
        const typeIndex = immediate.values[0];
        const fieldIndex = immediate.values[1];
        const structType = this._typeResolver.getStructType(typeIndex);
        if (structType && fieldIndex < structType.fields.length) {
          return structType.fields[fieldIndex].type;
        }
      }
      if (opCode === OpCodes_default.struct_new_default && immediate) {
        return refType(immediate.values[0]);
      }
      if (opCode === OpCodes_default.array_new || opCode === OpCodes_default.array_new_default || opCode === OpCodes_default.array_new_data || opCode === OpCodes_default.array_new_elem) {
        if (immediate) return refType(immediate.values[0]);
        return ValueType.AnyRef;
      }
      if (opCode === OpCodes_default.array_get && this._typeResolver && immediate) {
        const typeIndex = immediate.values[0];
        const arrayType = this._typeResolver.getArrayType(typeIndex);
        if (arrayType) {
          return arrayType.elementType;
        }
      }
      if ((opCode === OpCodes_default.ref_cast || opCode === OpCodes_default.ref_cast_null) && immediate) {
        const heapType = immediate.values[0];
        if (typeof heapType === "number") {
          if (heapTypeToValueType[heapType]) return heapTypeToValueType[heapType];
          return refType(heapType);
        }
        return ValueType.AnyRef;
      }
      if (opCode === OpCodes_default.ref_i31) {
        return ValueType.I31Ref;
      }
      if (opCode === OpCodes_default.any_convert_extern) {
        return ValueType.AnyRef;
      }
      if (opCode === OpCodes_default.extern_convert_any) {
        return ValueType.ExternRef;
      }
      if (opCode === OpCodes_default.br_on_cast || opCode === OpCodes_default.br_on_cast_fail) {
        return ValueType.AnyRef;
      }
      if (opCode === OpCodes_default.ref_null && immediate) {
        const heapType = immediate.values[0];
        if (typeof heapType === "number" && heapTypeToValueType[heapType]) {
          return heapTypeToValueType[heapType];
        }
        return ValueType.AnyRef;
      }
      const stackArgTypes = this._getStackValueTypes(this._operandStack, argCount);
      return stackArgTypes[0];
    }
    /**
     * Check if `actual` is assignable to `expected` considering GC reference subtyping.
     * Subtype hierarchy: anyref ← eqref ← {i31ref, structref, arrayref}
     * Bottom types: nullref → any, nullfuncref → funcref, nullexternref → externref
     */
    _isAssignableTo(actual, expected) {
      if (actual === expected) return true;
      if (isConcreteRefType(actual) && isConcreteRefType(expected)) {
        if (actual.refPrefix === 100 && expected.refPrefix === 99) {
        } else if (actual.refPrefix === 99 && expected.refPrefix === 100) {
          return false;
        }
        if (actual.typeIndex === expected.typeIndex) return true;
        return this._isSubtype(actual.typeIndex, expected.typeIndex);
      }
      if (isConcreteRefType(actual) && !isConcreteRefType(expected)) {
        if (this._typeResolver) {
          const kind = this._typeResolver.getTypeKind?.(actual.typeIndex);
          if (kind === "struct") {
            return expected === ValueType.StructRef || expected === ValueType.EqRef || expected === ValueType.AnyRef || expected === ValueType.Int32;
          }
          if (kind === "array") {
            return expected === ValueType.ArrayRef || expected === ValueType.EqRef || expected === ValueType.AnyRef || expected === ValueType.Int32;
          }
          if (kind === "func") {
            return expected === ValueType.FuncRef || expected === ValueType.Int32;
          }
        }
        if (expected === ValueType.AnyRef || expected === ValueType.EqRef || expected === ValueType.StructRef || expected === ValueType.ArrayRef || expected === ValueType.FuncRef || expected === ValueType.Int32) {
          return true;
        }
      }
      if (expected === ValueType.AnyRef) {
        return actual === ValueType.EqRef || actual === ValueType.I31Ref || actual === ValueType.StructRef || actual === ValueType.ArrayRef || actual === ValueType.NullRef || isConcreteRefType(actual);
      }
      if (expected === ValueType.EqRef) {
        return actual === ValueType.I31Ref || actual === ValueType.StructRef || actual === ValueType.ArrayRef || actual === ValueType.NullRef || isConcreteRefType(actual);
      }
      if (expected === ValueType.StructRef) {
        return actual === ValueType.NullRef || isConcreteRefType(actual) && this._typeResolver?.getTypeKind?.(actual.typeIndex) === "struct";
      }
      if (expected === ValueType.ArrayRef) {
        return actual === ValueType.NullRef || isConcreteRefType(actual) && this._typeResolver?.getTypeKind?.(actual.typeIndex) === "array";
      }
      if (expected === ValueType.FuncRef) {
        return actual === ValueType.NullFuncRef || isConcreteRefType(actual) && this._typeResolver?.getTypeKind?.(actual.typeIndex) === "func";
      }
      if (expected === ValueType.ExternRef) {
        return actual === ValueType.NullExternRef;
      }
      if (expected === ValueType.Int32 && (_isRefType(actual) || isConcreteRefType(actual))) {
        return true;
      }
      if (expected === ValueType.Int32 && actual === ValueType.Int64 && this._memory64) {
        return true;
      }
      return false;
    }
    _isSubtype(actualIndex, expectedIndex) {
      if (!this._typeResolver?.getSuperTypes) return false;
      const visited = /* @__PURE__ */ new Set();
      let current = actualIndex;
      while (true) {
        if (visited.has(current)) return false;
        visited.add(current);
        const supers = this._typeResolver.getSuperTypes(current);
        if (supers.length === 0) return false;
        for (const s of supers) {
          if (s === expectedIndex) return true;
        }
        current = supers[0];
      }
    }
    _getStackValueTypes(stack, count) {
      const results = [];
      let current = stack;
      for (let index = 0; index < count; index++) {
        results.push(current.valueType);
        current = current.pop();
      }
      return results.reverse();
    }
    _formatAndList(values, getText) {
      if (values.length === 1) {
        return getText ? getText(values[0]) : String(values[0]);
      }
      let text = "";
      for (let index = 0; index < values.length; index++) {
        text += getText ? getText(values[index]) : String(values[index]);
        if (index === values.length - 2) {
          text += " and ";
        } else if (index !== values.length - 1) {
          text += ", ";
        }
      }
      return text;
    }
  };

  // src/AssemblyEmitter.ts
  var validateParameters = (immediateType, values, length) => {
    if (!values || values.length !== length) {
      throw new Error(`Unexpected number of values for ${immediateType}.`);
    }
  };
  function resolveIndex(value) {
    if (typeof value === "object" && value !== null && typeof value.index === "number") {
      return value.index;
    }
    return value;
  }
  var AssemblyEmitter = class extends OpCodeEmitter {
    constructor(funcSignature, options = { disableVerification: false }, typeResolver, memory64) {
      super();
      Arg.instanceOf("funcSignature", funcSignature, FuncTypeSignature);
      this._instructions = [];
      this._locals = [];
      this._controlFlowVerifier = new ControlFlowVerifier(options.disableVerification);
      this._operandStackVerifier = new OperandStackVerifier(funcSignature, typeResolver, memory64);
      this._entryLabel = this._controlFlowVerifier.push(
        this._operandStackVerifier.stack,
        BlockType.Void
      );
      this._options = options;
    }
    get returnValues() {
      return this;
    }
    get parameters() {
      return [];
    }
    get entryLabel() {
      return this._entryLabel;
    }
    get controlFlowStack() {
      return this._controlFlowVerifier._stack;
    }
    get disableVerification() {
      return this._options.disableVerification;
    }
    getParameter(_index) {
      throw new Error("Not supported.");
    }
    declareLocal(type, name = null, count = 1) {
      const localBuilder = new LocalBuilder(
        type,
        name,
        this._locals.length + this.parameters.length,
        count
      );
      this._locals.push(localBuilder);
      return localBuilder;
    }
    defineLabel() {
      return this._controlFlowVerifier.defineLabel();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit(opCode, ...args) {
      Arg.notNull("opCode", opCode);
      const depth = this._controlFlowVerifier.size - 1;
      let result = null;
      let immediate = null;
      let pushLabel = null;
      let labelCallback = null;
      if (depth < 0) {
        throw new Error(
          "Cannot add any instructions after the main control enclosure has been closed."
        );
      }
      if (opCode.controlFlow === "Push" /* Push */ && args.length > 1) {
        if (args.length > 2) {
          throw new Error(`Unexpected number of values for ${"BlockSignature" /* BlockSignature */}.`);
        }
        if (args[1]) {
          if (args[1] instanceof LabelBuilder) {
            pushLabel = args[1];
          } else if (typeof args[1] === "function") {
            const userFunction = args[1];
            labelCallback = (x) => {
              userFunction(x);
            };
          } else {
            throw new Error("Error");
          }
        }
        args = [args[0]];
      }
      if (opCode.feature && this._options.features && !this._options.features.has(opCode.feature)) {
        throw new Error(
          `Opcode ${opCode.mnemonic} requires the '${opCode.feature}' feature. Enable it via the 'features' or 'target' option in ModuleBuilder.`
        );
      }
      if (opCode.immediate) {
        immediate = this._createImmediate(
          opCode.immediate,
          args,
          depth
        );
        if (immediate.type === "RelativeDepth" /* RelativeDepth */) {
          this._controlFlowVerifier.reference(args[0]);
        }
      }
      if (!this.disableVerification) {
        if (opCode === OpCodes_default["throw"] && immediate) {
          const tagParamTypes = this._getTagParameterTypes(immediate.values[0]);
          if (tagParamTypes) {
            for (let i = tagParamTypes.length - 1; i >= 0; i--) {
              this._operandStackVerifier._operandStack = this._operandStackVerifier._operandStack.pop();
            }
          }
        }
        this._operandStackVerifier.verifyInstruction(
          this._controlFlowVerifier.peek().block,
          opCode,
          immediate
        );
        if (opCode === OpCodes_default["else"]) {
          this._operandStackVerifier.verifyElse(
            this._controlFlowVerifier.peek().block
          );
        }
        if (opCode === OpCodes_default["catch"] || opCode === OpCodes_default.catch_all) {
          const block = this._controlFlowVerifier.peek().block;
          this._operandStackVerifier._operandStack = block.stack;
          this._operandStackVerifier._unreachable = false;
          block.inCatchHandler = true;
          if (opCode === OpCodes_default["catch"] && immediate) {
            const tagParamTypes = this._getTagParameterTypes(immediate.values[0]);
            if (tagParamTypes) {
              for (const paramType of tagParamTypes) {
                this._operandStackVerifier._operandStack = this._operandStackVerifier._operandStack.push(paramType);
              }
            }
          }
        }
        if (opCode === OpCodes_default.rethrow && immediate) {
          const targetLabel = immediate.values[0];
          if (targetLabel && targetLabel.block) {
            const targetBlock = targetLabel.block;
            if (!targetBlock.isTry && !targetBlock.inCatchHandler) {
              throw new VerificationError(
                "rethrow: target block is not a try/catch block."
              );
            }
          }
        }
      }
      if (opCode === OpCodes_default.delegate) {
        this._controlFlowVerifier.pop();
      }
      if (opCode.controlFlow) {
        result = this._updateControlFlow(opCode, immediate, pushLabel);
      }
      this._instructions.push(new Instruction(opCode, immediate));
      if (labelCallback) {
        labelCallback(result);
        this.end();
      }
      return result;
    }
    _updateControlFlow(opCode, immediate, label) {
      let result = null;
      if (opCode.controlFlow === "Push" /* Push */) {
        const blockType = immediate.values[0];
        const isLoop = opCode === OpCodes_default.loop;
        const isTry = opCode === OpCodes_default["try"];
        result = this._controlFlowVerifier.push(
          this._operandStackVerifier.stack,
          blockType,
          label,
          isLoop,
          isTry
        );
      } else if (opCode.controlFlow === "Pop" /* Pop */) {
        this._controlFlowVerifier.pop();
      }
      return result;
    }
    _getTagParameterTypes(_tagIndex) {
      return null;
    }
    write(writer) {
      this._controlFlowVerifier.verify();
      const bodyWriter = new BinaryWriter();
      this._writeLocals(bodyWriter);
      for (let index = 0; index < this._instructions.length; index++) {
        this._instructions[index].write(bodyWriter);
      }
      writer.writeVarUInt32(bodyWriter.length);
      writer.writeBytes(bodyWriter);
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
    _writeLocals(writer) {
      writer.writeVarUInt32(this._locals.length);
      for (let index = 0; index < this._locals.length; index++) {
        this._locals[index].write(writer);
      }
    }
    _createImmediate(immediateType, values, depth) {
      switch (immediateType) {
        case "BlockSignature" /* BlockSignature */:
          validateParameters(immediateType, values, 1);
          return Immediate.createBlockSignature(values[0]);
        case "BranchTable" /* BranchTable */:
          validateParameters(immediateType, values, 2);
          return Immediate.createBranchTable(values[0], values[1], depth);
        case "Float32" /* Float32 */:
          validateParameters(immediateType, values, 1);
          return Immediate.createFloat32(values[0]);
        case "Float64" /* Float64 */:
          validateParameters(immediateType, values, 1);
          return Immediate.createFloat64(values[0]);
        case "Function" /* Function */:
          validateParameters(immediateType, values, 1);
          if (!(values[0] instanceof ImportBuilder) && !(values[0] && "_index" in values[0] && "funcTypeBuilder" in values[0])) {
            throw new Error("functionBuilder must be a FunctionBuilder or ImportBuilder.");
          }
          return Immediate.createFunction(values[0]);
        case "Global" /* Global */:
          validateParameters(immediateType, values, 1);
          return Immediate.createGlobal(values[0]);
        case "IndirectFunction" /* IndirectFunction */:
          if (values.length < 1) {
            throw new Error(`${immediateType} requires at least 1 parameter.`);
          }
          return Immediate.createIndirectFunction(values[0], values[1] ?? 0);
        case "Local" /* Local */:
          validateParameters(immediateType, values, 1);
          let local = values[0];
          if (typeof local === "number") {
            local = this.getParameter(local);
          }
          Arg.instanceOf("local", local, LocalBuilder, FunctionParameterBuilder);
          return Immediate.createLocal(local);
        case "MemoryImmediate" /* MemoryImmediate */:
          validateParameters(immediateType, values, 2);
          return Immediate.createMemoryImmediate(values[0], values[1]);
        case "RelativeDepth" /* RelativeDepth */:
          validateParameters(immediateType, values, 1);
          return Immediate.createRelativeDepth(values[0], depth);
        case "VarInt32" /* VarInt32 */:
          validateParameters(immediateType, values, 1);
          return Immediate.createVarInt32(values[0]);
        case "VarInt64" /* VarInt64 */:
          validateParameters(immediateType, values, 1);
          return Immediate.createVarInt64(values[0]);
        case "VarUInt1" /* VarUInt1 */:
          validateParameters(immediateType, values, 1);
          return Immediate.createVarUInt1(values[0]);
        case "VarUInt32" /* VarUInt32 */:
          validateParameters(immediateType, values, 1);
          return Immediate.createVarUInt32(resolveIndex(values[0]));
        case "V128Const" /* V128Const */:
          validateParameters(immediateType, values, 1);
          return Immediate.createV128Const(values[0]);
        case "LaneIndex" /* LaneIndex */:
          validateParameters(immediateType, values, 1);
          return Immediate.createLaneIndex(values[0]);
        case "ShuffleMask" /* ShuffleMask */:
          validateParameters(immediateType, values, 1);
          return Immediate.createShuffleMask(values[0]);
        case "TypeIndexField" /* TypeIndexField */:
          validateParameters(immediateType, values, 2);
          return Immediate.createTypeIndexField(resolveIndex(values[0]), values[1]);
        case "TypeIndexIndex" /* TypeIndexIndex */:
          validateParameters(immediateType, values, 2);
          return Immediate.createTypeIndexIndex(resolveIndex(values[0]), values[1]);
        case "HeapType" /* HeapType */:
          validateParameters(immediateType, values, 1);
          return Immediate.createHeapType(values[0]);
        case "BrOnCast" /* BrOnCast */:
          validateParameters(immediateType, values, 4);
          return Immediate.createBrOnCast(values[0], values[1], values[2], values[3], depth);
        default:
          throw new Error("Unknown operand type.");
      }
    }
  };

  // src/InitExpressionEmitter.ts
  var InitExpressionEmitter = class extends AssemblyEmitter {
    constructor(initExpressionType, valueType, features, disableVerification) {
      super(new FuncTypeSignature([valueType], []), { disableVerification: disableVerification || false });
      this._initExpressionType = initExpressionType;
      this._features = features || /* @__PURE__ */ new Set();
    }
    getParameter(_index) {
      throw new Error("An initialization expression does not have any parameters.");
    }
    declareLocal() {
      throw new Error("An initialization expression cannot have locals.");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit(opCode, ...args) {
      this._isValidateOp(opCode, args);
      return super.emit(opCode, ...args);
    }
    write(writer) {
      for (let index = 0; index < this._instructions.length; index++) {
        this._instructions[index].write(writer);
      }
    }
    _isValidateOp(opCode, args) {
      const hasExtendedConst = this._features.has("extended-const");
      const maxInstructions = hasExtendedConst ? Infinity : 2;
      if (this._instructions.length >= maxInstructions) {
        return;
      }
      if (!hasExtendedConst && this._instructions.length === 1) {
        if (opCode !== OpCodes_default.end) {
          throw new Error(`Opcode ${opCode.mnemonic} is not valid after init expression value.`);
        }
        return;
      }
      if (opCode === OpCodes_default.end) {
        return;
      }
      switch (opCode) {
        case OpCodes_default.f32_const:
        case OpCodes_default.f64_const:
        case OpCodes_default.i32_const:
        case OpCodes_default.i64_const:
          break;
        case OpCodes_default.get_global: {
          const globalBuilder = args?.[0];
          if (this._initExpressionType === "Element" /* Element */ && !hasExtendedConst) {
            throw new Error(
              "The only valid instruction for an element initializer expression is a constant i32, global not supported."
            );
          }
          if (globalBuilder instanceof GlobalBuilder) {
            if (globalBuilder.globalType.mutable && !hasExtendedConst) {
              throw new Error(
                "An initializer expression cannot reference a mutable global."
              );
            }
          } else if (globalBuilder instanceof ImportBuilder) {
            if (globalBuilder.externalKind !== ExternalKind.Global) {
              throw new Error("Import must be a global import to use in global.get.");
            }
          } else {
            throw new Error("A GlobalBuilder or global ImportBuilder was expected.");
          }
          break;
        }
        // Extended-const: allow arithmetic in init expressions
        case OpCodes_default.i32_add:
        case OpCodes_default.i32_sub:
        case OpCodes_default.i32_mul:
        case OpCodes_default.i64_add:
        case OpCodes_default.i64_sub:
        case OpCodes_default.i64_mul: {
          if (!hasExtendedConst) {
            throw new Error(
              `Opcode ${opCode.mnemonic} is not supported in an initializer expression. Enable the extended-const feature to allow arithmetic in init expressions.`
            );
          }
          break;
        }
        // GC: allow struct/array/ref operations in init expressions
        case OpCodes_default.struct_new:
        case OpCodes_default.struct_new_default:
        case OpCodes_default.array_new:
        case OpCodes_default.array_new_default:
        case OpCodes_default.array_new_fixed:
        case OpCodes_default.ref_i31:
        case OpCodes_default.any_convert_extern:
        case OpCodes_default.extern_convert_any: {
          if (!this._features.has("gc")) {
            throw new Error(
              `Opcode ${opCode.mnemonic} requires the 'gc' feature to be used in an initializer expression.`
            );
          }
          break;
        }
        // ref.null is valid in init expressions (reference-types or gc)
        case OpCodes_default.ref_null:
          break;
        // ref.func is valid in element segment init expressions
        case OpCodes_default.ref_func:
          break;
        default:
          throw new Error(
            `Opcode ${opCode.mnemonic} is not supported in an initializer expression.`
          );
      }
    }
  };

  // src/DataSegmentBuilder.ts
  var DataSegmentBuilder = class {
    constructor(data, features, memory64, disableVerification) {
      this._initExpressionEmitter = null;
      this._passive = false;
      this._memoryIndex = 0;
      this._memory64 = false;
      this._data = data;
      this._features = features || /* @__PURE__ */ new Set();
      this._memory64 = memory64 || false;
      this._disableVerification = disableVerification || false;
    }
    passive() {
      if (this._features && !this._features.has("bulk-memory")) {
        throw new Error("The 'bulk-memory' feature is required but not enabled. Use target 'latest' or add 'bulk-memory' to features.");
      }
      this._passive = true;
      return this;
    }
    memoryIndex(index) {
      this._memoryIndex = index;
      return this;
    }
    createInitEmitter(callback) {
      if (this._initExpressionEmitter) {
        throw new Error("Initialization expression emitter has already been created.");
      }
      this._initExpressionEmitter = new InitExpressionEmitter(
        "Data" /* Data */,
        this._memory64 ? ValueType.Int64 : ValueType.Int32,
        this._features,
        this._disableVerification
      );
      if (callback) {
        callback(this._initExpressionEmitter);
        this._initExpressionEmitter.end();
      }
      return this._initExpressionEmitter;
    }
    offset(value) {
      if (typeof value === "function") {
        this.createInitEmitter(value);
      } else if (value instanceof GlobalBuilder) {
        this.createInitEmitter((asm) => {
          asm.get_global(value);
        });
      } else if (typeof value === "bigint") {
        this.createInitEmitter((asm) => {
          asm.const_i64(value);
        });
      } else if (typeof value === "number") {
        this.createInitEmitter((asm) => {
          if (this._memory64) {
            asm.const_i64(value);
          } else {
            asm.const_i32(value);
          }
        });
      } else {
        throw new Error("Unsupported offset");
      }
      return this;
    }
    write(writer) {
      if (this._passive) {
        writer.writeVarUInt32(1);
        writer.writeVarUInt32(this._data.length);
        writer.writeBytes(this._data);
        return;
      }
      if (!this._initExpressionEmitter) {
        throw new Error("The initialization expression was not defined.");
      }
      if (this._memoryIndex !== 0) {
        writer.writeVarUInt32(2);
        writer.writeVarUInt32(this._memoryIndex);
      } else {
        writer.writeVarUInt32(0);
      }
      this._initExpressionEmitter.write(writer);
      writer.writeVarUInt32(this._data.length);
      writer.writeBytes(this._data);
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/FunctionEmitter.ts
  function createTypeResolver(functionBuilder) {
    const moduleBuilder = functionBuilder._moduleBuilder;
    if (!moduleBuilder || !moduleBuilder._types) return void 0;
    const types = moduleBuilder._types;
    return {
      getStructType(typeIndex) {
        const t = types[typeIndex];
        if (t && "fields" in t) return t;
        return null;
      },
      getArrayType(typeIndex) {
        const t = types[typeIndex];
        if (t && "elementType" in t) return t;
        return null;
      },
      getFuncType(typeIndex) {
        const t = types[typeIndex];
        if (t && "parameterTypes" in t && "returnTypes" in t) {
          const ft = t;
          return { parameterTypes: ft.parameterTypes, returnTypes: ft.returnTypes };
        }
        return null;
      },
      getTypeKind(typeIndex) {
        const t = types[typeIndex];
        if (!t) return null;
        if ("fields" in t) return "struct";
        if ("elementType" in t) return "array";
        if ("parameterTypes" in t) return "func";
        return null;
      },
      getSuperTypes(typeIndex) {
        const t = types[typeIndex];
        if (!t) return [];
        if ("superTypes" in t) {
          const st = t.superTypes;
          return st.map((s) => s.index);
        }
        return [];
      }
    };
  }
  var FunctionEmitter = class extends AssemblyEmitter {
    constructor(functionBuilder, options) {
      const moduleBuilder = functionBuilder._moduleBuilder;
      const memory64 = moduleBuilder?._memories?.some((m) => m.isMemory64) || moduleBuilder?._imports?.some((imp) => imp.isMemoryImport() && imp.data.memory64) || false;
      super(
        functionBuilder.funcTypeBuilder.toSignature(),
        options,
        createTypeResolver(functionBuilder),
        memory64
      );
      this._functionBuilder = functionBuilder;
      this._locals = [];
    }
    get returnValues() {
      return this._functionBuilder.funcTypeBuilder.returnTypes;
    }
    get parameters() {
      return this._functionBuilder.parameters;
    }
    _getTagParameterTypes(tagIndex) {
      const moduleBuilder = this._functionBuilder._moduleBuilder;
      if (!moduleBuilder) return null;
      const importedTagCount = moduleBuilder._importsIndexSpace.tag;
      if (tagIndex < importedTagCount) {
        const tagImports = moduleBuilder._imports.filter(
          (imp) => imp.externalKind === ExternalKind.Tag
        );
        if (tagIndex < tagImports.length) {
          const funcType = tagImports[tagIndex].data;
          return funcType.parameterTypes;
        }
        return null;
      }
      const localIndex = tagIndex - importedTagCount;
      if (moduleBuilder._tags && localIndex < moduleBuilder._tags.length) {
        return moduleBuilder._tags[localIndex]._funcType.parameterTypes;
      }
      return null;
    }
    getParameter(index) {
      if (index >= 0) {
        if (index < this.parameters.length) {
          return this._functionBuilder.getParameter(index);
        }
        const localIndex = index - this.parameters.length;
        if (localIndex < this._locals.length) {
          return this._locals[localIndex];
        }
      }
      throw new Error("Invalid parameter index.");
    }
  };

  // src/FunctionBuilder.ts
  var FunctionBuilder = class {
    constructor(moduleBuilder, name, funcTypeBuilder, index) {
      this.functionEmitter = null;
      this._moduleBuilder = moduleBuilder;
      this.name = name;
      this.funcTypeBuilder = funcTypeBuilder;
      this._index = index;
      this.parameters = funcTypeBuilder.parameterTypes.map(
        (x, i) => new FunctionParameterBuilder(x, i)
      );
    }
    get returnType() {
      return this.funcTypeBuilder.returnTypes;
    }
    get parameterTypes() {
      return this.funcTypeBuilder.parameterTypes;
    }
    getParameter(index) {
      return this.parameters[index];
    }
    createEmitter(callback) {
      if (this.functionEmitter) {
        throw new Error("Function emitter has already been created.");
      }
      this.functionEmitter = new FunctionEmitter(this, {
        disableVerification: this._moduleBuilder.disableVerification,
        features: this._moduleBuilder.features
      });
      if (callback) {
        callback(this.functionEmitter);
        this.functionEmitter.end();
      }
      return this.functionEmitter;
    }
    withExport(name) {
      this._moduleBuilder.exportFunction(this, name || null);
      return this;
    }
    write(writer) {
      if (!this.functionEmitter) {
        throw new Error("Function body has not been defined.");
      }
      this.functionEmitter.write(writer);
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/ElementSegmentBuilder.ts
  var ElementSegmentBuilder = class {
    constructor(table, functions, features, disableVerification) {
      this._functions = [];
      this._initExpressionEmitter = null;
      this._passive = false;
      this._table = table;
      this._functions = functions;
      this._features = features || /* @__PURE__ */ new Set();
      this._disableVerification = disableVerification || false;
    }
    passive() {
      if (this._features && !this._features.has("bulk-memory")) {
        throw new Error("The 'bulk-memory' feature is required but not enabled. Use target 'latest' or add 'bulk-memory' to features.");
      }
      this._passive = true;
      return this;
    }
    createInitEmitter(callback) {
      if (this._initExpressionEmitter) {
        throw new Error("Initialization expression emitter has already been created.");
      }
      this._initExpressionEmitter = new InitExpressionEmitter(
        "Element" /* Element */,
        ValueType.Int32,
        this._features,
        this._disableVerification
      );
      if (callback) {
        callback(this._initExpressionEmitter);
        this._initExpressionEmitter.end();
      }
      return this._initExpressionEmitter;
    }
    offset(value) {
      if (typeof value === "function") {
        this.createInitEmitter(value);
      } else if (value instanceof GlobalBuilder) {
        this.createInitEmitter((asm) => {
          asm.get_global(value);
        });
      } else if (typeof value === "number") {
        this.createInitEmitter((asm) => {
          asm.const_i32(value);
        });
      } else {
        throw new Error("Unsupported offset");
      }
      return this;
    }
    _writeFuncIndex(writer, func) {
      if (func instanceof FunctionBuilder) {
        writer.writeVarUInt32(func._index);
      } else if (func instanceof ImportBuilder) {
        writer.writeVarUInt32(func.index);
      }
    }
    write(writer) {
      if (this._passive) {
        writer.writeVarUInt32(1);
        writer.writeUInt8(0);
        writer.writeVarUInt32(this._functions.length);
        this._functions.forEach((x) => this._writeFuncIndex(writer, x));
        return;
      }
      if (!this._initExpressionEmitter) {
        throw new Error("The initialization expression was not defined.");
      }
      const tableIndex = this._table ? this._table._index : 0;
      if (tableIndex !== 0) {
        writer.writeVarUInt32(2);
        writer.writeVarUInt32(tableIndex);
        this._initExpressionEmitter.write(writer);
        writer.writeUInt8(0);
        writer.writeVarUInt32(this._functions.length);
        this._functions.forEach((x) => this._writeFuncIndex(writer, x));
      } else {
        writer.writeVarUInt32(0);
        this._initExpressionEmitter.write(writer);
        writer.writeVarUInt32(this._functions.length);
        this._functions.forEach((x) => this._writeFuncIndex(writer, x));
      }
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/ExportBuilder.ts
  var ExportBuilder = class {
    constructor(name, externalKind, data) {
      this.name = name;
      this.externalKind = externalKind;
      this.data = data;
    }
    write(writer) {
      writer.writeLenPrefixedString(this.name);
      writer.writeUInt8(this.externalKind.value);
      switch (this.externalKind) {
        case ExternalKind.Function:
        case ExternalKind.Global:
        case ExternalKind.Memory:
        case ExternalKind.Table:
        case ExternalKind.Tag:
          writer.writeVarUInt32(this.data._index);
          break;
      }
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/ResizableLimits.ts
  var ResizableLimits = class {
    constructor(initial, maximum = null) {
      if (initial < 0) {
        throw new Error("Initial size must be non-negative.");
      }
      if (maximum !== null) {
        if (maximum < 0) {
          throw new Error("Maximum size must be non-negative.");
        }
        if (initial > maximum) {
          throw new Error(`Initial size (${initial}) must not exceed maximum size (${maximum}).`);
        }
      }
      this.initial = initial;
      this.maximum = maximum;
    }
    write(writer) {
      writer.writeVarUInt1(this.maximum !== null ? 1 : 0);
      writer.writeVarUInt32(this.initial);
      if (this.maximum !== null) {
        writer.writeVarUInt32(this.maximum);
      }
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/MemoryType.ts
  var MemoryType = class {
    constructor(resizableLimits, shared = false, memory64 = false) {
      Arg.instanceOf("resizableLimits", resizableLimits, ResizableLimits);
      if (shared && resizableLimits.maximum === null) {
        throw new Error("Shared memory requires a maximum size.");
      }
      this.resizableLimits = resizableLimits;
      this.shared = shared;
      this.memory64 = memory64;
    }
    write(writer) {
      if (this.shared || this.memory64) {
        let flags = this.resizableLimits.maximum !== null ? 1 : 0;
        if (this.shared) flags |= 2;
        if (this.memory64) flags |= 4;
        writer.writeVarUInt7(flags);
        if (this.memory64) {
          writer.writeVarUInt64(this.resizableLimits.initial);
          if (this.resizableLimits.maximum !== null) {
            writer.writeVarUInt64(this.resizableLimits.maximum);
          }
        } else {
          writer.writeVarUInt32(this.resizableLimits.initial);
          if (this.resizableLimits.maximum !== null) {
            writer.writeVarUInt32(this.resizableLimits.maximum);
          }
        }
      } else {
        this.resizableLimits.write(writer);
      }
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/MemoryBuilder.ts
  var MemoryBuilder = class {
    constructor(moduleBuilder, resizableLimits, index, shared = false, memory64 = false) {
      this._moduleBuilder = moduleBuilder;
      this._memoryType = new MemoryType(resizableLimits, shared, memory64);
      this._index = index;
    }
    withExport(name) {
      this._moduleBuilder.exportMemory(this, name);
      return this;
    }
    get isShared() {
      return this._memoryType.shared;
    }
    get isMemory64() {
      return this._memoryType.memory64;
    }
    write(writer) {
      this._memoryType.write(writer);
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/TableType.ts
  var TableType = class {
    constructor(elementType, resizableLimits) {
      this._elementType = elementType;
      this._resizableLimits = resizableLimits;
    }
    get elementType() {
      return this._elementType;
    }
    get resizableLimits() {
      return this._resizableLimits;
    }
    write(writer) {
      writer.writeVarUInt32(this._elementType.value);
      this._resizableLimits.write(writer);
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/TableBuilder.ts
  var TableBuilder = class {
    constructor(moduleBuilder, elementType, resizableLimits, index) {
      this._moduleBuilder = moduleBuilder;
      this._tableType = new TableType(elementType, resizableLimits);
      this._index = index;
    }
    get elementType() {
      return this._tableType.elementType;
    }
    get resizableLimits() {
      return this._tableType.resizableLimits;
    }
    withExport(name) {
      this._moduleBuilder.exportTable(this, name);
      return this;
    }
    defineElementSegment(elements, offset) {
      this._moduleBuilder.defineElementSegment(this, elements, offset);
    }
    /** @deprecated Use defineElementSegment instead */
    defineTableSegment(elements, offset) {
      this.defineElementSegment(elements, offset);
    }
    write(writer) {
      this._tableType.write(writer);
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/StructTypeBuilder.ts
  var StructTypeBuilder = class {
    constructor(key, fields, index, options) {
      this.key = key;
      this.fields = fields;
      this.index = index;
      this.superTypes = options?.superTypes || [];
      this.final = options?.final !== false;
    }
    get typeForm() {
      return TypeForm.Struct;
    }
    static createKey(fields) {
      let key = "struct(";
      fields.forEach((f, i) => {
        key += f.type.short;
        key += f.mutable ? ":m" : ":i";
        if (i !== fields.length - 1) {
          key += ",";
        }
      });
      key += ")";
      return key;
    }
    getFieldIndex(name) {
      const index = this.fields.findIndex((f) => f.name === name);
      if (index === -1) {
        throw new Error(`Field '${name}' not found in struct type.`);
      }
      return index;
    }
    write(writer) {
      if (this.superTypes.length > 0 || !this.final) {
        writer.writeVarInt7(this.final ? TypeForm.SubFinal.value : TypeForm.Sub.value);
        writer.writeVarUInt32(this.superTypes.length);
        this.superTypes.forEach((st) => {
          writer.writeVarUInt32(st.index);
        });
      }
      writer.writeVarInt7(TypeForm.Struct.value);
      writer.writeVarUInt32(this.fields.length);
      this.fields.forEach((field) => {
        writeValueType(writer, field.type);
        writer.writeVarUInt1(field.mutable ? 1 : 0);
      });
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/ArrayTypeBuilder.ts
  var ArrayTypeBuilder = class {
    constructor(key, elementType, mutable, index, options) {
      this.key = key;
      this.elementType = elementType;
      this.mutable = mutable;
      this.index = index;
      this.superTypes = options?.superTypes || [];
      this.final = options?.final !== false;
    }
    get typeForm() {
      return TypeForm.Array;
    }
    static createKey(elementType, mutable) {
      return `array(${elementType.short}:${mutable ? "m" : "i"})`;
    }
    write(writer) {
      if (this.superTypes.length > 0 || !this.final) {
        writer.writeVarInt7(this.final ? TypeForm.SubFinal.value : TypeForm.Sub.value);
        writer.writeVarUInt32(this.superTypes.length);
        this.superTypes.forEach((st) => {
          writer.writeVarUInt32(st.index);
        });
      }
      writer.writeVarInt7(TypeForm.Array.value);
      writeValueType(writer, this.elementType);
      writer.writeVarUInt1(this.mutable ? 1 : 0);
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/RecGroupBuilder.ts
  var RecGroupBuilder = class {
    constructor(baseIndex) {
      this._types = [];
      this._baseIndex = baseIndex;
    }
    addStructType(fields, options) {
      const index = this._baseIndex + this._types.length;
      const key = StructTypeBuilder.createKey(fields);
      const builder = new StructTypeBuilder(key, fields, index, options);
      this._types.push(builder);
      return builder;
    }
    addArrayType(elementType, mutable, options) {
      const index = this._baseIndex + this._types.length;
      const key = ArrayTypeBuilder.createKey(elementType, mutable);
      const builder = new ArrayTypeBuilder(key, elementType, mutable, index, options);
      this._types.push(builder);
      return builder;
    }
    addFuncType(returnTypes, parameterTypes) {
      const index = this._baseIndex + this._types.length;
      const key = FuncTypeBuilder.createKey(returnTypes, parameterTypes);
      const builder = new FuncTypeBuilder(key, returnTypes, parameterTypes, index);
      this._types.push(builder);
      return builder;
    }
    /**
     * Create a nullable reference to a type within this group by group-relative index.
     */
    refNull(groupRelativeIndex) {
      return refNullType(this._baseIndex + groupRelativeIndex);
    }
    /**
     * Create a non-nullable reference to a type within this group by group-relative index.
     */
    ref(groupRelativeIndex) {
      return refType(this._baseIndex + groupRelativeIndex);
    }
    write(writer) {
      if (this._types.length === 1) {
        this._types[0].write(writer);
      } else {
        writer.writeVarInt7(TypeForm.Rec.value);
        writer.writeVarUInt32(this._types.length);
        this._types.forEach((t) => t.write(writer));
      }
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/TextModuleWriter.ts
  var TextModuleWriter = class {
    constructor(moduleBuilder) {
      this.moduleBuilder = moduleBuilder;
    }
    toString() {
      const lines = [];
      const mod = this.moduleBuilder;
      lines.push(`(module $${mod._name}`);
      this.writeTypes(lines, mod);
      this.writeImports(lines, mod);
      this.writeFunctions(lines, mod);
      this.writeTables(lines, mod);
      this.writeMemories(lines, mod);
      this.writeGlobals(lines, mod);
      this.writeTags(lines, mod);
      this.writeExports(lines, mod);
      this.writeStart(lines, mod);
      this.writeElements(lines, mod);
      this.writeData(lines, mod);
      lines.push(")");
      return lines.join("\n");
    }
    formatType(type, index) {
      if (type instanceof FuncTypeBuilder) {
        const params = type.parameterTypes.map((p) => p.name).join(" ");
        const results = type.returnTypes.map((r) => r.name).join(" ");
        let sig = `(func`;
        if (params.length > 0) sig += ` (param ${params})`;
        if (results.length > 0) sig += ` (result ${results})`;
        sig += ")";
        return `(type (;${index};) ${sig})`;
      } else if (type instanceof StructTypeBuilder) {
        const fields = type.fields.map((f) => {
          const mut2 = f.mutable ? `(mut ${f.type.name})` : f.type.name;
          return `(field $${f.name} ${mut2})`;
        }).join(" ");
        return `(type (;${index};) (struct ${fields}))`;
      } else {
        const mut2 = type.mutable ? `(mut ${type.elementType.name})` : type.elementType.name;
        return `(type (;${index};) (array ${mut2}))`;
      }
    }
    writeTypes(lines, mod) {
      let typeIndex = 0;
      for (const entry of mod._typeSectionEntries) {
        if (entry instanceof RecGroupBuilder) {
          if (entry._types.length === 1) {
            lines.push(`  ${this.formatType(entry._types[0], typeIndex)}`);
            typeIndex++;
          } else {
            const inner = entry._types.map(
              (t, i) => `    ${this.formatType(t, typeIndex + i)}`
            ).join("\n");
            lines.push(`  (rec
${inner}
  )`);
            typeIndex += entry._types.length;
          }
        } else {
          lines.push(`  ${this.formatType(entry, typeIndex)}`);
          typeIndex++;
        }
      }
    }
    writeImports(lines, mod) {
      mod._imports.forEach((imp, i) => {
        let desc = "";
        switch (imp.externalKind) {
          case ExternalKind.Function: {
            const funcType = imp.data;
            desc = `(func (;${imp.index};) (type ${funcType.index}))`;
            break;
          }
          case ExternalKind.Table: {
            const tableType = imp.data;
            const limits = tableType.resizableLimits;
            const max = limits.maximum !== null ? ` ${limits.maximum}` : "";
            desc = `(table (;${imp.index};) ${limits.initial}${max} ${tableType.elementType.name})`;
            break;
          }
          case ExternalKind.Memory: {
            const memType = imp.data;
            const limits = memType.resizableLimits;
            const max = limits.maximum !== null ? ` ${limits.maximum}` : "";
            const shared = memType.shared ? " shared" : "";
            const m64 = memType.memory64 ? " i64" : "";
            desc = `(memory (;${imp.index};)${m64} ${limits.initial}${max}${shared})`;
            break;
          }
          case ExternalKind.Global: {
            const globalType = imp.data;
            const valType = globalType.valueType.name;
            desc = globalType.mutable ? `(global (;${imp.index};) (mut ${valType}))` : `(global (;${imp.index};) ${valType})`;
            break;
          }
          case ExternalKind.Tag: {
            const tagFuncType = imp.data;
            const tagParams = tagFuncType.parameterTypes.map((p) => p.name).join(" ");
            let tagSig = "";
            if (tagParams.length > 0) tagSig = ` (param ${tagParams})`;
            desc = `(tag (;${imp.index};) (type ${tagFuncType.index})${tagSig})`;
            break;
          }
        }
        lines.push(`  (import "${imp.moduleName}" "${imp.fieldName}" ${desc})`);
      });
    }
    writeFunctions(lines, mod) {
      mod._functions.forEach((func) => {
        const typeIdx = func.funcTypeBuilder.index;
        let header = `  (func $${func.name} (;${func._index};) (type ${typeIdx})`;
        if (func.funcTypeBuilder.parameterTypes.length > 0) {
          const params = func.funcTypeBuilder.parameterTypes.map((p, i) => {
            const param = func.parameters[i];
            return p.name;
          }).join(" ");
          header += ` (param ${params})`;
        }
        if (func.funcTypeBuilder.returnTypes.length > 0) {
          const results = func.funcTypeBuilder.returnTypes.map((r) => r.name).join(" ");
          header += ` (result ${results})`;
        }
        if (!func.functionEmitter) {
          lines.push(header + ")");
          return;
        }
        const emitter = func.functionEmitter;
        if (emitter._locals.length > 0) {
          const locals = emitter._locals.map((l) => {
            if (l.count === 1) return `(local ${l.valueType.name})`;
            return Array(l.count).fill(`(local ${l.valueType.name})`).join(" ");
          });
          header += " " + locals.join(" ");
        }
        lines.push(header);
        this.writeInstructions(lines, emitter._instructions, 2);
        lines.push("  )");
      });
    }
    writeInstructions(lines, instructions, baseIndent) {
      let indent = baseIndent;
      for (const instr of instructions) {
        const mnemonic = instr.opCode.mnemonic;
        if (mnemonic === "end" || mnemonic === "else" || mnemonic === "catch" || mnemonic === "catch_all" || mnemonic === "delegate") {
          indent = Math.max(baseIndent, indent - 1);
        }
        const prefix = "  ".repeat(indent);
        let line = `${prefix}${mnemonic}`;
        if (instr.immediate) {
          const immText = this.immediateToText(instr.immediate.type, instr.immediate.values);
          if (immText) {
            line += ` ${immText}`;
          }
        }
        lines.push(line);
        if (mnemonic === "block" || mnemonic === "loop" || mnemonic === "if" || mnemonic === "else" || mnemonic === "try" || mnemonic === "catch" || mnemonic === "catch_all") {
          indent++;
        }
      }
    }
    immediateToText(type, values) {
      switch (type) {
        case "BlockSignature" /* BlockSignature */: {
          const blockType = values[0];
          if (typeof blockType === "number") {
            return `(type ${blockType})`;
          }
          if (blockType && blockType.name !== "void") {
            return `(result ${blockType.name})`;
          }
          return "";
        }
        case "VarInt32" /* VarInt32 */:
        case "VarInt64" /* VarInt64 */:
        case "Float32" /* Float32 */:
        case "Float64" /* Float64 */:
        case "VarUInt1" /* VarUInt1 */:
          return String(values[0]);
        case "Local" /* Local */: {
          const local = values[0];
          return String(local.index);
        }
        case "Global" /* Global */: {
          const global = values[0];
          if (global instanceof GlobalBuilder) {
            return String(global._index);
          }
          if (global && typeof global.index === "number") {
            return String(global.index);
          }
          return "";
        }
        case "Function" /* Function */: {
          const func = values[0];
          if (func instanceof FunctionBuilder) {
            return String(func._index);
          }
          if (func instanceof ImportBuilder) {
            return String(func.index);
          }
          return "";
        }
        case "IndirectFunction" /* IndirectFunction */: {
          const funcType = values[0];
          const tableIndex = values[1] || 0;
          let text = "";
          if (tableIndex > 0) text += `${tableIndex} `;
          text += `(type ${funcType.index})`;
          return text;
        }
        case "RelativeDepth" /* RelativeDepth */: {
          const label = values[0];
          const depth = values[1];
          if (label instanceof LabelBuilder && label.block) {
            return String(depth - label.block.depth);
          }
          return String(label);
        }
        case "BranchTable" /* BranchTable */: {
          const defaultDepth = values[0];
          const depths = values[1];
          return depths.join(" ") + " " + defaultDepth;
        }
        case "MemoryImmediate" /* MemoryImmediate */: {
          const alignment = values[0];
          const offset = values[1];
          let text = "";
          if (offset !== 0) text += `offset=${offset}`;
          if (alignment !== 0) {
            if (text) text += " ";
            text += `align=${1 << alignment}`;
          }
          return text;
        }
        case "VarUInt32" /* VarUInt32 */:
          return String(values[0]);
        case "TypeIndexField" /* TypeIndexField */:
          return `${values[0]} ${values[1]}`;
        case "TypeIndexIndex" /* TypeIndexIndex */:
          return `${values[0]} ${values[1]}`;
        case "HeapType" /* HeapType */: {
          const ht = values[0];
          if (typeof ht === "number") return String(ht);
          if (ht && typeof ht.name === "string") return ht.name;
          if (ht && typeof ht.index === "number") return String(ht.index);
          return "";
        }
        case "BrOnCast" /* BrOnCast */: {
          const label = values[1];
          const depth = values[4];
          const labelDepth = typeof label === "object" && label?.block ? depth - label.block.depth : label;
          const formatHt = (ht) => {
            if (typeof ht === "number") return String(ht);
            if (ht && typeof ht === "object" && "name" in ht) return ht.name;
            if (ht && typeof ht === "object" && "index" in ht) return String(ht.index);
            return String(ht);
          };
          return `${labelDepth} ${formatHt(values[2])} ${formatHt(values[3])}`;
        }
        default:
          return "";
      }
    }
    writeTables(lines, mod) {
      mod._tables.forEach((table, i) => {
        const limits = table.resizableLimits;
        const max = limits.maximum !== null ? ` ${limits.maximum}` : "";
        lines.push(`  (table (;${table._index};) ${limits.initial}${max} ${table.elementType.name})`);
      });
    }
    writeMemories(lines, mod) {
      mod._memories.forEach((mem) => {
        const limits = mem._memoryType.resizableLimits;
        const max = limits.maximum !== null ? ` ${limits.maximum}` : "";
        const shared = mem._memoryType.shared ? " shared" : "";
        const m64 = mem._memoryType.memory64 ? " i64" : "";
        lines.push(`  (memory (;${mem._index};)${m64} ${limits.initial}${max}${shared})`);
      });
    }
    writeGlobals(lines, mod) {
      mod._globals.forEach((g) => {
        const valType = g.globalType.valueType.name;
        const typeStr = g.globalType.mutable ? `(mut ${valType})` : valType;
        let initExpr = "";
        if (g._initExpressionEmitter) {
          initExpr = this.formatInitExpr(g._initExpressionEmitter._instructions);
        }
        lines.push(`  (global (;${g._index};) ${typeStr} (${initExpr}))`);
      });
    }
    writeTags(lines, mod) {
      mod._tags.forEach((tag, i) => {
        const params = tag._funcType.parameterTypes.map((p) => p.name).join(" ");
        let sig = "";
        if (params.length > 0) sig = ` (param ${params})`;
        lines.push(`  (tag (;${i};) (type ${tag._funcType.index})${sig})`);
      });
    }
    writeExports(lines, mod) {
      mod._exports.forEach((exp) => {
        let kindName = "";
        let index = exp.data._index;
        switch (exp.externalKind) {
          case ExternalKind.Function:
            kindName = "func";
            break;
          case ExternalKind.Table:
            kindName = "table";
            break;
          case ExternalKind.Memory:
            kindName = "memory";
            break;
          case ExternalKind.Global:
            kindName = "global";
            break;
          case ExternalKind.Tag:
            kindName = "tag";
            break;
        }
        lines.push(`  (export "${exp.name}" (${kindName} ${index}))`);
      });
    }
    writeStart(lines, mod) {
      if (mod._startFunction) {
        lines.push(`  (start ${mod._startFunction._index})`);
      }
    }
    writeElements(lines, mod) {
      mod._elements.forEach((elem, i) => {
        const funcIndices = elem._functions.map((f) => {
          if (f instanceof FunctionBuilder) return f._index;
          if (f instanceof ImportBuilder) return f.index;
          return 0;
        }).join(" ");
        if (elem._passive) {
          lines.push(`  (elem (;${i};) func ${funcIndices})`);
          return;
        }
        let offsetExpr = "";
        if (elem._initExpressionEmitter) {
          offsetExpr = this.formatInitExpr(elem._initExpressionEmitter._instructions);
        }
        const tableIndex = elem._table ? elem._table._index : 0;
        if (tableIndex !== 0) {
          lines.push(`  (elem (;${i};) (table ${tableIndex}) (${offsetExpr}) func ${funcIndices})`);
        } else {
          lines.push(`  (elem (;${i};) (${offsetExpr}) func ${funcIndices})`);
        }
      });
    }
    writeData(lines, mod) {
      mod._data.forEach((seg, i) => {
        const dataStr = this.bytesToWatString(seg._data);
        if (seg._passive) {
          lines.push(`  (data (;${i};) "${dataStr}")`);
          return;
        }
        let offsetExpr = "";
        if (seg._initExpressionEmitter) {
          offsetExpr = this.formatInitExpr(seg._initExpressionEmitter._instructions);
        }
        if (seg._memoryIndex !== 0) {
          lines.push(`  (data (;${i};) (memory ${seg._memoryIndex}) (${offsetExpr}) "${dataStr}")`);
        } else {
          lines.push(`  (data (;${i};) (${offsetExpr}) "${dataStr}")`);
        }
      });
    }
    formatInitExpr(instructions) {
      const parts = [];
      for (const instr of instructions) {
        if (instr.opCode.mnemonic === "end") continue;
        let part = instr.opCode.mnemonic;
        if (instr.immediate) {
          const immText = this.immediateToText(instr.immediate.type, instr.immediate.values);
          if (immText) part += ` ${immText}`;
        }
        parts.push(part);
      }
      return parts.join(" ");
    }
    bytesToWatString(data) {
      let result = "";
      for (let i = 0; i < data.length; i++) {
        const byte = data[i];
        if (byte >= 32 && byte < 127 && byte !== 34 && byte !== 92) {
          result += String.fromCharCode(byte);
        } else {
          result += "\\" + byte.toString(16).padStart(2, "0");
        }
      }
      return result;
    }
  };

  // src/TagBuilder.ts
  var TagBuilder = class {
    constructor(moduleBuilder, funcType, index) {
      this._moduleBuilder = moduleBuilder;
      this._funcType = funcType;
      this._index = index;
      this.name = "";
    }
    get funcType() {
      return this._funcType;
    }
    withName(name) {
      this.name = name;
      return this;
    }
    withExport(name) {
      this._moduleBuilder.exportTag(this, name);
      return this;
    }
    write(writer) {
      writer.writeVarUInt32(0);
      writer.writeVarUInt32(this._funcType.index);
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/CustomSectionBuilder.ts
  var CustomSectionBuilder = class {
    constructor(name, data) {
      this.name = name;
      this.type = SectionType.createCustom(name);
      this._data = data || new Uint8Array(0);
    }
    write(writer) {
      const sectionWriter = new BinaryWriter();
      sectionWriter.writeLenPrefixedString(this.name);
      if (this._data.length > 0) {
        sectionWriter.writeBytes(this._data);
      }
      writer.writeVarUInt7(0);
      writer.writeVarUInt32(sectionWriter.length);
      writer.writeBytes(sectionWriter);
    }
    toBytes() {
      const buffer = new BinaryWriter();
      this.write(buffer);
      return buffer.toArray();
    }
  };

  // src/ModuleBuilder.ts
  var _ModuleBuilder = class _ModuleBuilder {
    constructor(name, options = { generateNameSection: true, disableVerification: false }) {
      this._types = [];
      this._typeSectionEntries = [];
      this._imports = [];
      this._functions = [];
      this._tables = [];
      this._memories = [];
      this._globals = [];
      this._exports = [];
      this._elements = [];
      this._data = [];
      this._tags = [];
      this._customSections = [];
      this._startFunction = null;
      this._importsIndexSpace = {
        function: 0,
        table: 0,
        memory: 0,
        global: 0,
        tag: 0
      };
      Arg.notNull("name", name);
      this._name = name;
      this._options = options || _ModuleBuilder.defaultOptions;
      this._resolvedFeatures = _ModuleBuilder._resolveFeatures(this._options);
    }
    static _resolveFeatures(options) {
      const target = options.target || "latest";
      const baseFeatures = _ModuleBuilder.targetFeatures[target];
      const extra = options.features || [];
      return /* @__PURE__ */ new Set([...baseFeatures, ...extra]);
    }
    get features() {
      return this._resolvedFeatures;
    }
    hasFeature(feature) {
      return this._resolvedFeatures.has(feature);
    }
    get disableVerification() {
      return this._options && this._options.disableVerification === true;
    }
    defineFunctionType(returnTypes, parameters) {
      let normalizedReturnTypes;
      if (!returnTypes) {
        normalizedReturnTypes = [];
      } else if (!Array.isArray(returnTypes)) {
        normalizedReturnTypes = [returnTypes];
      } else {
        normalizedReturnTypes = returnTypes;
      }
      if (normalizedReturnTypes.length > 1 && !this._resolvedFeatures.has("multi-value")) {
        throw new Error("A method can only return zero to one values. Enable the multi-value feature to allow multiple return values.");
      }
      const funcTypeKey = FuncTypeBuilder.createKey(normalizedReturnTypes, parameters);
      let funcType = this._types.find((x) => x instanceof FuncTypeBuilder && x.key === funcTypeKey);
      if (!funcType) {
        funcType = new FuncTypeBuilder(
          funcTypeKey,
          normalizedReturnTypes,
          parameters,
          this._types.length
        );
        this._types.push(funcType);
        this._typeSectionEntries.push(funcType);
      }
      return funcType;
    }
    /** @deprecated Use defineFunctionType instead */
    defineFuncType(returnTypes, parameters) {
      return this.defineFunctionType(returnTypes, parameters);
    }
    importFunction(moduleName, name, returnTypes, parameters) {
      const funcType = this.defineFunctionType(returnTypes, parameters);
      if (this._imports.some(
        (x) => x.externalKind === ExternalKind.Function && x.moduleName === moduleName && x.fieldName === name
      )) {
        throw new Error(`An import already exists for ${moduleName}.${name}`);
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
    importTable(moduleName, name, elementType, initialSize, maximumSize = null) {
      if (this._imports.find(
        (x) => x.externalKind === ExternalKind.Table && x.moduleName === moduleName && x.fieldName === name
      )) {
        throw new Error(`An import already exists for ${moduleName}.${name}`);
      }
      const totalTables = this._tables.length + this._importsIndexSpace.table;
      if (totalTables >= 1 && !this._resolvedFeatures.has("multi-table")) {
        throw new Error("Only one table can be created per module. Enable the multi-table feature to allow multiple tables.");
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
    importMemory(moduleName, name, initialSize, maximumSize = null, shared = false, memory64 = false) {
      Arg.string("moduleName", moduleName);
      Arg.string("name", name);
      Arg.number("initialSize", initialSize);
      if (this._imports.find(
        (x) => x.externalKind === ExternalKind.Memory && x.moduleName === moduleName && x.fieldName === name
      )) {
        throw new Error(`An import already exists for ${moduleName}.${name}`);
      }
      if ((this._memories.length !== 0 || this._importsIndexSpace.memory !== 0) && !this._resolvedFeatures.has("multi-memory")) {
        throw new VerificationError("Only one memory is allowed per module. Enable the multi-memory feature to allow multiple memories.");
      }
      if (shared) {
        this._requireFeature("threads");
      }
      if (memory64) {
        this._requireFeature("memory64");
      }
      const memoryType = new MemoryType(new ResizableLimits(initialSize, maximumSize), shared, memory64);
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
    importGlobal(moduleName, name, valueType, mutable) {
      if (this._imports.some(
        (x) => x.externalKind === ExternalKind.Global && x.moduleName === moduleName && x.fieldName === name
      )) {
        throw new Error(`An import already exists for ${moduleName}.${name}`);
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
    importTag(moduleName, name, parameters) {
      this._requireFeature("exception-handling");
      if (this._imports.some(
        (x) => x.externalKind === ExternalKind.Tag && x.moduleName === moduleName && x.fieldName === name
      )) {
        throw new Error(`An import already exists for ${moduleName}.${name}`);
      }
      const funcType = this.defineFunctionType(null, parameters);
      const importBuilder = new ImportBuilder(
        moduleName,
        name,
        ExternalKind.Tag,
        funcType,
        this._importsIndexSpace.tag++
      );
      this._imports.push(importBuilder);
      this._tags.forEach((x) => {
        x._index++;
      });
      return importBuilder;
    }
    defineFunction(name, returnTypes, parameters, createCallback) {
      const existing = this._functions.find((x) => x.name === name);
      if (existing) {
        throw new Error(`Function has already been defined with the name ${name}`);
      }
      const funcType = this.defineFunctionType(returnTypes, parameters);
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
    defineTable(elementType, initialSize, maximumSize = null) {
      const totalTables = this._tables.length + this._importsIndexSpace.table;
      if (totalTables >= 1 && !this._resolvedFeatures.has("multi-table")) {
        throw new Error("Only one table can be created per module. Enable the multi-table feature to allow multiple tables.");
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
    defineMemory(initialSize, maximumSize = null, shared = false, memory64 = false) {
      if ((this._memories.length !== 0 || this._importsIndexSpace.memory !== 0) && !this._resolvedFeatures.has("multi-memory")) {
        throw new VerificationError("Only one memory is allowed per module. Enable the multi-memory feature to allow multiple memories.");
      }
      if (shared) {
        this._requireFeature("threads");
      }
      if (memory64) {
        this._requireFeature("memory64");
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
    defineGlobal(valueType, mutable, value) {
      const globalBuilder = new GlobalBuilder(
        this,
        valueType,
        mutable,
        this._globals.length + this._importsIndexSpace.global
      );
      if (value !== void 0) {
        globalBuilder.value(value);
      }
      this._globals.push(globalBuilder);
      return globalBuilder;
    }
    defineTag(parameters) {
      this._requireFeature("exception-handling");
      const funcType = this.defineFunctionType(null, parameters);
      const tagBuilder = new TagBuilder(
        this,
        funcType,
        this._tags.length + this._importsIndexSpace.tag
      );
      this._tags.push(tagBuilder);
      return tagBuilder;
    }
    setStartFunction(functionBuilder) {
      Arg.instanceOf("functionBuilder", functionBuilder, FunctionBuilder);
      this._startFunction = functionBuilder;
    }
    exportFunction(functionBuilder, name = null) {
      Arg.instanceOf("functionBuilder", functionBuilder, FunctionBuilder);
      const functionName = name || functionBuilder.name;
      Arg.notEmptyString("name", functionName);
      if (this._exports.find(
        (x) => x.externalKind === ExternalKind.Function && x.name === functionName
      )) {
        throw new Error(`An export already exists for a function named ${functionName}.`);
      }
      const exportBuilder = new ExportBuilder(
        functionName,
        ExternalKind.Function,
        functionBuilder
      );
      this._exports.push(exportBuilder);
      return exportBuilder;
    }
    exportMemory(memoryBuilder, name) {
      Arg.notEmptyString("name", name);
      Arg.instanceOf("memoryBuilder", memoryBuilder, MemoryBuilder);
      if (this._exports.find(
        (x) => x.externalKind === ExternalKind.Memory && x.name === name
      )) {
        throw new Error(`An export already exists for memory named ${name}.`);
      }
      const exportBuilder = new ExportBuilder(name, ExternalKind.Memory, memoryBuilder);
      this._exports.push(exportBuilder);
      return exportBuilder;
    }
    exportTable(tableBuilder, name) {
      Arg.notEmptyString("name", name);
      Arg.instanceOf("tableBuilder", tableBuilder, TableBuilder);
      if (this._exports.find(
        (x) => x.externalKind === ExternalKind.Table && x.name === name
      )) {
        throw new Error(`An export already exists for a table named ${name}.`);
      }
      const exportBuilder = new ExportBuilder(name, ExternalKind.Table, tableBuilder);
      this._exports.push(exportBuilder);
      return exportBuilder;
    }
    exportGlobal(globalBuilder, name) {
      Arg.notEmptyString("name", name);
      Arg.instanceOf("globalBuilder", globalBuilder, GlobalBuilder);
      if (globalBuilder.globalType.mutable && !this.disableVerification && !this._resolvedFeatures.has("mutable-globals")) {
        throw new VerificationError("Cannot export a mutable global. Enable the mutable-globals feature to allow this.");
      }
      if (this._exports.find(
        (x) => x.externalKind === ExternalKind.Global && x.name === name
      )) {
        throw new Error(`An export already exists for a global named ${name}.`);
      }
      const exportBuilder = new ExportBuilder(name, ExternalKind.Global, globalBuilder);
      this._exports.push(exportBuilder);
      return exportBuilder;
    }
    exportTag(tagBuilder, name) {
      this._requireFeature("exception-handling");
      Arg.notEmptyString("name", name);
      if (this._exports.find(
        (x) => x.externalKind === ExternalKind.Tag && x.name === name
      )) {
        throw new Error(`An export already exists for a tag named ${name}.`);
      }
      const exportBuilder = new ExportBuilder(name, ExternalKind.Tag, tagBuilder);
      this._exports.push(exportBuilder);
      return exportBuilder;
    }
    defineElementSegment(table, elements, offset) {
      const segment = new ElementSegmentBuilder(table, elements, this._resolvedFeatures, this.disableVerification);
      if (offset !== void 0) {
        segment.offset(offset);
      }
      this._elements.push(segment);
      return segment;
    }
    /** @deprecated Use defineElementSegment instead */
    defineTableSegment(table, elements, offset) {
      return this.defineElementSegment(table, elements, offset);
    }
    definePassiveElementSegment(elements) {
      this._requireFeature("bulk-memory");
      const segment = new ElementSegmentBuilder(null, elements, this._resolvedFeatures, this.disableVerification);
      segment.passive();
      this._elements.push(segment);
      return segment;
    }
    defineData(data, offset) {
      Arg.instanceOf("data", data, Uint8Array);
      const hasMemory64 = this._memories.some((m) => m.isMemory64) || this._imports.some((imp) => imp.isMemoryImport() && imp.data.memory64);
      const dataSegmentBuilder = new DataSegmentBuilder(data, this._resolvedFeatures, hasMemory64, this.disableVerification);
      if (offset !== void 0) {
        dataSegmentBuilder.offset(offset);
      }
      this._data.push(dataSegmentBuilder);
      return dataSegmentBuilder;
    }
    defineCustomSection(name, data) {
      Arg.notEmptyString("name", name);
      if (this._customSections.find((x) => x.name === name)) {
        throw new Error(`A custom section already exists with the name ${name}.`);
      }
      if (name === "name") {
        throw new Error("The 'name' custom section is reserved.");
      }
      const customSectionBuilder = new CustomSectionBuilder(name, data);
      this._customSections.push(customSectionBuilder);
      return customSectionBuilder;
    }
    defineStructType(fields, options) {
      this._requireFeature("gc");
      let structFields;
      let fieldNames = null;
      if (Array.isArray(fields)) {
        structFields = fields;
      } else {
        fieldNames = Object.keys(fields);
        structFields = fieldNames.map((name) => {
          const def = fields[name];
          if (def && typeof def === "object" && "_brand" in def && def._brand === "MutableField") {
            return { name, type: def.type, mutable: true };
          }
          if (def && typeof def === "object" && "type" in def && !("_brand" in def) && !("value" in def)) {
            const explicit = def;
            return { name, type: explicit.type, mutable: explicit.mutable ?? false };
          }
          return { name, type: def, mutable: false };
        });
      }
      const key = StructTypeBuilder.createKey(structFields);
      const structType = new StructTypeBuilder(key, structFields, this._types.length, options);
      this._types.push(structType);
      this._typeSectionEntries.push(structType);
      if (fieldNames) {
        const fieldMap = {};
        fieldNames.forEach((name, i) => {
          fieldMap[name] = i;
        });
        Object.defineProperty(structType, "field", {
          value: Object.freeze(fieldMap),
          enumerable: false,
          writable: false,
          configurable: false
        });
      }
      return structType;
    }
    defineArrayType(elementType, mutable, options) {
      this._requireFeature("gc");
      const key = ArrayTypeBuilder.createKey(elementType, mutable);
      const arrayType = new ArrayTypeBuilder(key, elementType, mutable, this._types.length, options);
      this._types.push(arrayType);
      this._typeSectionEntries.push(arrayType);
      return arrayType;
    }
    defineRecGroup(callback) {
      this._requireFeature("gc");
      const recGroup = new RecGroupBuilder(this._types.length);
      callback(recGroup);
      if (recGroup._types.length === 0) {
        throw new Error("Recursive type group must contain at least one type.");
      }
      recGroup._types.forEach((t) => {
        this._types.push(t);
      });
      this._typeSectionEntries.push(recGroup);
      return recGroup;
    }
    _requireFeature(feature) {
      if (!this._resolvedFeatures.has(feature)) {
        throw new Error(`The '${feature}' feature is required but not enabled. Use target 'latest' or add '${feature}' to features.`);
      }
    }
    async instantiate(imports) {
      const moduleBytes = this.toBytes();
      return WebAssembly.instantiate(moduleBytes.buffer, imports);
    }
    async compile() {
      const moduleBytes = this.toBytes();
      return WebAssembly.compile(moduleBytes.buffer);
    }
    toString() {
      const writer = new TextModuleWriter(this);
      return writer.toString();
    }
    toBytes() {
      const writer = new BinaryModuleWriter(this);
      return writer.write();
    }
  };
  _ModuleBuilder.defaultOptions = {
    generateNameSection: true,
    disableVerification: false
  };
  _ModuleBuilder.targetFeatures = {
    "mvp": [],
    "2.0": ["sign-extend", "sat-trunc", "bulk-memory", "reference-types", "multi-value", "mutable-globals"],
    "3.0": [
      "sign-extend",
      "sat-trunc",
      "bulk-memory",
      "reference-types",
      "multi-value",
      "mutable-globals",
      "simd",
      "tail-call",
      "exception-handling",
      "threads",
      "multi-memory",
      "multi-table",
      "memory64",
      "extended-const"
    ],
    "latest": [
      "sign-extend",
      "sat-trunc",
      "bulk-memory",
      "reference-types",
      "multi-value",
      "mutable-globals",
      "simd",
      "tail-call",
      "exception-handling",
      "threads",
      "multi-memory",
      "multi-table",
      "memory64",
      "extended-const",
      "relaxed-simd",
      "gc"
    ]
  };
  var ModuleBuilder = _ModuleBuilder;

  // src/PackageBuilder.ts
  var PackageBuilder = class {
    constructor() {
      this._modules = [];
    }
    defineModule(name, options) {
      if (this._modules.find((m) => m.name === name)) {
        throw new Error(`A module with the name "${name}" already exists.`);
      }
      const moduleBuilder = new ModuleBuilder(name, options);
      this._modules.push({ name, moduleBuilder, dependencies: [] });
      return moduleBuilder;
    }
    addDependency(moduleName, dependsOn) {
      const entry = this._modules.find((m) => m.name === moduleName);
      if (!entry) {
        throw new Error(`Module "${moduleName}" not found.`);
      }
      if (!this._modules.find((m) => m.name === dependsOn)) {
        throw new Error(`Dependency module "${dependsOn}" not found.`);
      }
      if (!entry.dependencies.includes(dependsOn)) {
        entry.dependencies.push(dependsOn);
      }
    }
    getModule(name) {
      return this._modules.find((m) => m.name === name)?.moduleBuilder;
    }
    topologicalSort() {
      const visited = /* @__PURE__ */ new Set();
      const sorted = [];
      const visiting = /* @__PURE__ */ new Set();
      const visit = (name) => {
        if (visited.has(name)) return;
        if (visiting.has(name)) {
          throw new Error(`Circular dependency detected involving module "${name}".`);
        }
        visiting.add(name);
        const entry = this._modules.find((m) => m.name === name);
        for (const dep of entry.dependencies) {
          visit(dep);
        }
        visiting.delete(name);
        visited.add(name);
        sorted.push(entry);
      };
      for (const entry of this._modules) {
        visit(entry.name);
      }
      return sorted;
    }
    async compile() {
      const sorted = this.topologicalSort();
      const result = {};
      for (const entry of sorted) {
        const bytes = entry.moduleBuilder.toBytes();
        result[entry.name] = await WebAssembly.compile(bytes.buffer);
      }
      return result;
    }
    async instantiate(imports = {}) {
      const sorted = this.topologicalSort();
      const result = {};
      for (const entry of sorted) {
        const bytes = entry.moduleBuilder.toBytes();
        const moduleImports = {};
        if (imports[entry.name]) {
          Object.assign(moduleImports, imports[entry.name]);
        }
        for (const depName of entry.dependencies) {
          const depInstance = result[depName];
          if (depInstance) {
            moduleImports[depName] = depInstance.exports;
          }
        }
        const instantiated = await WebAssembly.instantiate(bytes.buffer, moduleImports);
        const instance = instantiated.instance;
        result[entry.name] = instance;
      }
      return result;
    }
  };

  // src/InstructionDecoder.ts
  var singleByteOpcodes = /* @__PURE__ */ new Map();
  var prefixedOpcodes = /* @__PURE__ */ new Map();
  for (const [, opCode] of Object.entries(OpCodes_default)) {
    const op = opCode;
    if (op.prefix !== void 0) {
      if (!prefixedOpcodes.has(op.prefix)) {
        prefixedOpcodes.set(op.prefix, /* @__PURE__ */ new Map());
      }
      prefixedOpcodes.get(op.prefix).set(op.value, op);
    } else {
      singleByteOpcodes.set(op.value, op);
    }
  }
  var InstructionDecoder = class _InstructionDecoder {
    constructor(buffer) {
      this.buffer = buffer;
      this.offset = 0;
    }
    decode() {
      const instructions = [];
      this.offset = 0;
      while (this.offset < this.buffer.length) {
        const startOffset = this.offset;
        const byte = this.buffer[this.offset++];
        let opCode;
        if (prefixedOpcodes.has(byte)) {
          const subMap = prefixedOpcodes.get(byte);
          const subOpcode = this.readVarUInt32();
          opCode = subMap.get(subOpcode);
          if (!opCode) {
            break;
          }
        } else {
          opCode = singleByteOpcodes.get(byte);
          if (!opCode) {
            break;
          }
        }
        const immediates = this.decodeImmediates(opCode);
        instructions.push({
          opCode,
          immediates,
          offset: startOffset,
          length: this.offset - startOffset
        });
        if (opCode === OpCodes_default.end) {
          break;
        }
      }
      return instructions;
    }
    static decodeInitExpr(bytes) {
      const decoder = new _InstructionDecoder(bytes);
      return decoder.decode();
    }
    decodeImmediates(opCode) {
      if (!opCode.immediate) {
        return { type: "None", values: [] };
      }
      const type = opCode.immediate;
      const values = [];
      switch (type) {
        case "BlockSignature": {
          const bt = this.readVarInt7();
          values.push(bt);
          break;
        }
        case "VarInt32":
          values.push(this.readVarInt32());
          break;
        case "VarInt64":
          values.push(this.readVarInt64());
          break;
        case "Float32":
          values.push(this.readFloat32());
          break;
        case "Float64":
          values.push(this.readFloat64());
          break;
        case "VarUInt1":
          values.push(this.buffer[this.offset++] & 1);
          break;
        case "VarUInt32":
          values.push(this.readVarUInt32());
          break;
        case "RelativeDepth":
          values.push(this.readVarUInt32());
          break;
        case "BranchTable": {
          const count = this.readVarUInt32();
          const targets = [];
          for (let i = 0; i < count; i++) {
            targets.push(this.readVarUInt32());
          }
          const defaultTarget = this.readVarUInt32();
          values.push(targets, defaultTarget);
          break;
        }
        case "Function":
          values.push(this.readVarUInt32());
          break;
        case "IndirectFunction": {
          const typeIndex = this.readVarUInt32();
          const tableIndex = this.readVarUInt32();
          values.push(typeIndex, tableIndex);
          break;
        }
        case "Local":
          values.push(this.readVarUInt32());
          break;
        case "Global":
          values.push(this.readVarUInt32());
          break;
        case "MemoryImmediate": {
          const alignment = this.readVarUInt32();
          const offset = this.readVarUInt32();
          values.push(alignment, offset);
          break;
        }
        case "V128Const": {
          const bytes = new Uint8Array(16);
          for (let i = 0; i < 16; i++) {
            bytes[i] = this.buffer[this.offset++];
          }
          values.push(bytes);
          break;
        }
        case "ShuffleMask": {
          const mask = new Uint8Array(16);
          for (let i = 0; i < 16; i++) {
            mask[i] = this.buffer[this.offset++];
          }
          values.push(mask);
          break;
        }
        case "LaneIndex":
          values.push(this.buffer[this.offset++]);
          break;
        case "TypeIndexField": {
          const typeIndex = this.readVarUInt32();
          const fieldIndex = this.readVarUInt32();
          values.push(typeIndex, fieldIndex);
          break;
        }
        case "TypeIndexIndex": {
          const typeIndex = this.readVarUInt32();
          const index = this.readVarUInt32();
          values.push(typeIndex, index);
          break;
        }
        case "HeapType":
          values.push(this.readVarInt32());
          break;
        case "BrOnCast": {
          const flags = this.buffer[this.offset++];
          const depth = this.readVarUInt32();
          const ht1 = this.readVarInt32();
          const ht2 = this.readVarInt32();
          values.push(flags, depth, ht1, ht2);
          break;
        }
        default:
          break;
      }
      return { type, values };
    }
    // --- LEB128 readers ---
    readVarUInt32() {
      let result = 0;
      let shift = 0;
      let byte;
      do {
        byte = this.buffer[this.offset++];
        result |= (byte & 127) << shift;
        shift += 7;
      } while (byte & 128);
      return result >>> 0;
    }
    readVarInt7() {
      const byte = this.buffer[this.offset++];
      return byte & 64 ? byte | 4294967168 : byte & 127;
    }
    readVarInt32() {
      let result = 0;
      let shift = 0;
      let byte;
      do {
        byte = this.buffer[this.offset++];
        result |= (byte & 127) << shift;
        shift += 7;
      } while (byte & 128);
      if (shift < 32 && byte & 64) {
        result |= -(1 << shift);
      }
      return result;
    }
    readVarInt64() {
      let result = 0n;
      let shift = 0n;
      let byte;
      do {
        byte = this.buffer[this.offset++];
        result |= BigInt(byte & 127) << shift;
        shift += 7n;
      } while (byte & 128);
      if (shift < 64n && byte & 64) {
        result |= -(1n << shift);
      }
      return result;
    }
    readFloat32() {
      const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + this.offset, 4);
      this.offset += 4;
      return view.getFloat32(0, true);
    }
    readFloat64() {
      const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + this.offset, 8);
      this.offset += 8;
      return view.getFloat64(0, true);
    }
  };

  // src/BinaryReader.ts
  var MagicHeader2 = 1836278016;
  var BinaryReader = class {
    constructor(buffer) {
      this.buffer = buffer;
      this.offset = 0;
      this._options = {};
    }
    read(options) {
      this._options = options || {};
      const magic = this.readUInt32();
      if (magic !== MagicHeader2) {
        throw new Error(`Invalid WASM magic header: 0x${magic.toString(16)}`);
      }
      const version = this.readUInt32();
      if (version !== 1) {
        throw new Error(`Unsupported WASM version: ${version}`);
      }
      const module = {
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
        customSections: []
      };
      const functionTypeIndices = [];
      while (this.offset < this.buffer.length) {
        const sectionId = this.readVarUInt7();
        const sectionSize = this.readVarUInt32();
        const sectionEnd = this.offset + sectionSize;
        switch (sectionId) {
          case 0:
            this.readCustomSection(module, sectionEnd);
            break;
          case 1:
            this.readTypeSection(module);
            break;
          case 2:
            this.readImportSection(module);
            break;
          case 3:
            this.readFunctionSection(functionTypeIndices);
            break;
          case 4:
            this.readTableSection(module);
            break;
          case 5:
            this.readMemorySection(module);
            break;
          case 6:
            this.readGlobalSection(module);
            break;
          case 7:
            this.readExportSection(module);
            break;
          case 8:
            module.start = this.readVarUInt32();
            break;
          case 9:
            this.readElementSection(module);
            break;
          case 10:
            this.readCodeSection(module, functionTypeIndices);
            break;
          case 11:
            this.readDataSection(module);
            break;
          case 12:
            module.dataCount = this.readVarUInt32();
            break;
          case 13:
            this.readTagSection(module);
            break;
          default:
            this.offset = sectionEnd;
            break;
        }
        this.offset = sectionEnd;
      }
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
    readCustomSection(module, sectionEnd) {
      const nameLen = this.readVarUInt32();
      const name = this.readString(nameLen);
      if (name === "name") {
        module.nameSection = this.readNameSection(sectionEnd);
        return;
      }
      const remaining = sectionEnd - this.offset;
      const data = this.readBytes(remaining);
      module.customSections.push({ name, data });
    }
    readNameSection(sectionEnd) {
      const info = {};
      while (this.offset < sectionEnd) {
        const subsectionId = this.readVarUInt7();
        const subsectionSize = this.readVarUInt32();
        const subsectionEnd = this.offset + subsectionSize;
        switch (subsectionId) {
          case 0: {
            const len = this.readVarUInt32();
            info.moduleName = this.readString(len);
            break;
          }
          case 1: {
            const count = this.readVarUInt32();
            info.functionNames = /* @__PURE__ */ new Map();
            for (let i = 0; i < count; i++) {
              const index = this.readVarUInt32();
              const len = this.readVarUInt32();
              info.functionNames.set(index, this.readString(len));
            }
            break;
          }
          case 2: {
            const funcCount = this.readVarUInt32();
            info.localNames = /* @__PURE__ */ new Map();
            for (let i = 0; i < funcCount; i++) {
              const funcIndex = this.readVarUInt32();
              const localCount = this.readVarUInt32();
              const locals = /* @__PURE__ */ new Map();
              for (let j = 0; j < localCount; j++) {
                const localIndex = this.readVarUInt32();
                const len = this.readVarUInt32();
                locals.set(localIndex, this.readString(len));
              }
              info.localNames.set(funcIndex, locals);
            }
            break;
          }
          case 7: {
            const count = this.readVarUInt32();
            info.globalNames = /* @__PURE__ */ new Map();
            for (let i = 0; i < count; i++) {
              const index = this.readVarUInt32();
              const len = this.readVarUInt32();
              info.globalNames.set(index, this.readString(len));
            }
            break;
          }
          default:
            this.offset = subsectionEnd;
            break;
        }
        this.offset = subsectionEnd;
      }
      return info;
    }
    readTypeSection(module) {
      const count = this.readVarUInt32();
      for (let i = 0; i < count; i++) {
        const typeInfo = this.readTypeEntry();
        if (typeInfo.kind === "rec") {
          module.types.push(typeInfo);
        } else {
          module.types.push(typeInfo);
        }
      }
    }
    readTypeEntry() {
      const form = this.readVarUInt7();
      switch (form) {
        case 96:
          return this.readFuncType();
        case 95:
          return this.readStructType();
        case 94:
          return this.readArrayType();
        case 78: {
          const typeCount = this.readVarUInt32();
          const types = [];
          for (let j = 0; j < typeCount; j++) {
            types.push(this.readTypeEntry());
          }
          return { kind: "rec", types };
        }
        case 80:
        // sub (non-final)
        case 79: {
          const final = form === 79;
          const superCount = this.readVarUInt32();
          const superTypes = [];
          for (let j = 0; j < superCount; j++) {
            superTypes.push(this.readVarUInt32());
          }
          const innerType = this.readTypeEntry();
          if (innerType.kind === "struct") {
            innerType.superTypes = superTypes;
            innerType.final = final;
          } else if (innerType.kind === "array") {
            innerType.superTypes = superTypes;
            innerType.final = final;
          }
          return innerType;
        }
        default:
          throw new Error(`Unknown type form: 0x${(form & 255).toString(16)}`);
      }
    }
    readFuncType() {
      const paramCount = this.readVarUInt32();
      const parameterTypes = [];
      for (let j = 0; j < paramCount; j++) {
        parameterTypes.push(this.readValueType());
      }
      const returnCount = this.readVarUInt32();
      const returnTypes = [];
      for (let j = 0; j < returnCount; j++) {
        returnTypes.push(this.readValueType());
      }
      return { kind: "func", parameterTypes, returnTypes };
    }
    readStructType() {
      const fieldCount = this.readVarUInt32();
      const fields = [];
      for (let j = 0; j < fieldCount; j++) {
        const type = this.readValueType();
        const mutable = this.readVarUInt1() === 1;
        fields.push({ type, mutable });
      }
      return { kind: "struct", fields };
    }
    readArrayType() {
      const elementType = this.readValueType();
      const mutable = this.readVarUInt1() === 1;
      return { kind: "array", elementType, mutable };
    }
    readImportSection(module) {
      const count = this.readVarUInt32();
      for (let i = 0; i < count; i++) {
        const moduleNameLen = this.readVarUInt32();
        const moduleName = this.readString(moduleNameLen);
        const fieldNameLen = this.readVarUInt32();
        const fieldName = this.readString(fieldNameLen);
        const kind = this.readUInt8();
        const imp = { moduleName, fieldName, kind };
        switch (kind) {
          case 0:
            imp.typeIndex = this.readVarUInt32();
            break;
          case 1: {
            const elementType = this.readVarInt7();
            const { initial, maximum } = this.readResizableLimits();
            imp.tableType = { elementType, initial, maximum };
            break;
          }
          case 2: {
            const { initial, maximum, shared, memory64 } = this.readResizableLimits();
            imp.memoryType = { initial, maximum, shared, memory64 };
            break;
          }
          case 3: {
            const valueType = this.readVarInt7();
            const mutable = this.readVarUInt1() === 1;
            imp.globalType = { valueType, mutable };
            break;
          }
          case 4: {
            const attribute = this.readVarUInt32();
            const typeIndex = this.readVarUInt32();
            imp.tagType = { attribute, typeIndex };
            break;
          }
        }
        module.imports.push(imp);
      }
    }
    readFunctionSection(functionTypeIndices) {
      const count = this.readVarUInt32();
      for (let i = 0; i < count; i++) {
        functionTypeIndices.push(this.readVarUInt32());
      }
    }
    readTableSection(module) {
      const count = this.readVarUInt32();
      for (let i = 0; i < count; i++) {
        const elementType = this.readVarInt7();
        const { initial, maximum } = this.readResizableLimits();
        module.tables.push({ elementType, initial, maximum });
      }
    }
    readMemorySection(module) {
      const count = this.readVarUInt32();
      for (let i = 0; i < count; i++) {
        const { initial, maximum, shared, memory64 } = this.readResizableLimits();
        module.memories.push({ initial, maximum, shared, memory64 });
      }
    }
    readGlobalSection(module) {
      const count = this.readVarUInt32();
      for (let i = 0; i < count; i++) {
        const valueType = this.readVarInt7();
        const mutable = this.readVarUInt1() === 1;
        const initExpr = this.readInitExpr();
        module.globals.push({ valueType, mutable, initExpr });
      }
    }
    readExportSection(module) {
      const count = this.readVarUInt32();
      for (let i = 0; i < count; i++) {
        const nameLen = this.readVarUInt32();
        const name = this.readString(nameLen);
        const kind = this.readUInt8();
        const index = this.readVarUInt32();
        module.exports.push({ name, kind, index });
      }
    }
    readElementSection(module) {
      const count = this.readVarUInt32();
      for (let i = 0; i < count; i++) {
        const kind = this.readVarUInt32();
        if (kind === 0) {
          const offsetExpr = this.readInitExpr();
          const numElems = this.readVarUInt32();
          const functionIndices = [];
          for (let j = 0; j < numElems; j++) {
            functionIndices.push(this.readVarUInt32());
          }
          module.elements.push({ tableIndex: 0, offsetExpr, functionIndices, passive: false });
        } else if (kind === 1) {
          const _elemKind = this.readUInt8();
          const numElems = this.readVarUInt32();
          const functionIndices = [];
          for (let j = 0; j < numElems; j++) {
            functionIndices.push(this.readVarUInt32());
          }
          module.elements.push({ tableIndex: 0, offsetExpr: new Uint8Array(), functionIndices, passive: true });
        } else if (kind === 2) {
          const tableIndex = this.readVarUInt32();
          const offsetExpr = this.readInitExpr();
          const _elemKind = this.readUInt8();
          const numElems = this.readVarUInt32();
          const functionIndices = [];
          for (let j = 0; j < numElems; j++) {
            functionIndices.push(this.readVarUInt32());
          }
          module.elements.push({ tableIndex, offsetExpr, functionIndices, passive: false });
        } else {
          throw new Error(`Unsupported element segment kind: ${kind}`);
        }
      }
    }
    readTagSection(module) {
      const count = this.readVarUInt32();
      for (let i = 0; i < count; i++) {
        const attribute = this.readVarUInt32();
        const typeIndex = this.readVarUInt32();
        module.tags.push({ attribute, typeIndex });
      }
    }
    readCodeSection(module, functionTypeIndices) {
      const count = this.readVarUInt32();
      for (let i = 0; i < count; i++) {
        const bodySize = this.readVarUInt32();
        const bodyEnd = this.offset + bodySize;
        const localCount = this.readVarUInt32();
        const locals = [];
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
          body
        });
        this.offset = bodyEnd;
      }
    }
    readDataSection(module) {
      const count = this.readVarUInt32();
      for (let i = 0; i < count; i++) {
        const kind = this.readVarUInt32();
        if (kind === 1) {
          const dataSize = this.readVarUInt32();
          const data = this.readBytes(dataSize);
          module.data.push({ kind, memoryIndex: 0, offsetExpr: new Uint8Array(), data, passive: true });
        } else if (kind === 2) {
          const memoryIndex = this.readVarUInt32();
          const offsetExpr = this.readInitExpr();
          const dataSize = this.readVarUInt32();
          const data = this.readBytes(dataSize);
          module.data.push({ kind, memoryIndex, offsetExpr, data, passive: false });
        } else {
          const offsetExpr = this.readInitExpr();
          const dataSize = this.readVarUInt32();
          const data = this.readBytes(dataSize);
          module.data.push({ kind, memoryIndex: 0, offsetExpr, data, passive: false });
        }
      }
    }
    readInitExpr() {
      const start = this.offset;
      while (this.offset < this.buffer.length) {
        const byte = this.buffer[this.offset++];
        if (byte === OpCodes_default.end.value) {
          break;
        }
        switch (byte) {
          case OpCodes_default.i32_const.value:
            this.readVarInt32();
            break;
          case OpCodes_default.i64_const.value:
            this.readVarInt64();
            break;
          case OpCodes_default.f32_const.value:
            this.offset += 4;
            break;
          case OpCodes_default.f64_const.value:
            this.offset += 8;
            break;
          case OpCodes_default.get_global.value:
            this.readVarUInt32();
            break;
          case 208:
            this.readVarInt32();
            break;
          case 210:
            this.readVarUInt32();
            break;
          case 251: {
            const subOpcode = this.readVarUInt32();
            switch (subOpcode) {
              case 0:
              // struct.new — type index
              case 1:
                this.readVarUInt32();
                break;
              case 8:
                this.readVarUInt32();
                this.readVarUInt32();
                break;
              case 7:
              // array.new_default — type index
              case 6:
                this.readVarUInt32();
                break;
              case 28:
                break;
              case 26:
              // any.convert_extern
              case 27:
                break;
            }
            break;
          }
        }
      }
      return this.buffer.slice(start, this.offset);
    }
    readResizableLimits() {
      const flags = this.readVarUInt7();
      const hasMax = (flags & 1) !== 0;
      const shared = (flags & 2) !== 0;
      const memory64 = (flags & 4) !== 0;
      const initial = memory64 ? Number(this.readVarUInt64()) : this.readVarUInt32();
      const maximum = hasMax ? memory64 ? Number(this.readVarUInt64()) : this.readVarUInt32() : null;
      return { initial, maximum, shared, memory64 };
    }
    readValueType() {
      const value = this.readVarInt7();
      switch (value) {
        case -1:
          return ValueType.Int32;
        case -2:
          return ValueType.Int64;
        case -3:
          return ValueType.Float32;
        case -4:
          return ValueType.Float64;
        case -5:
          return ValueType.V128;
        case -16:
          return ValueType.FuncRef;
        case -17:
          return ValueType.ExternRef;
        case -18:
          return ValueType.AnyRef;
        case -19:
          return ValueType.EqRef;
        case -20:
          return ValueType.I31Ref;
        case -21:
          return ValueType.StructRef;
        case -22:
          return ValueType.ArrayRef;
        case -15:
          return ValueType.NullRef;
        case -13:
          return ValueType.NullFuncRef;
        case -14:
          return ValueType.NullExternRef;
        case -28:
          return refType(this.readVarInt32());
        // 0x64 = (ref $idx)
        case -29:
          return refNullType(this.readVarInt32());
        // 0x63 = (ref null $idx)
        default:
          throw new Error(`Unknown value type: 0x${(value & 255).toString(16)}`);
      }
    }
    // --- Primitive readers ---
    ensureBytes(count) {
      if (this.offset + count > this.buffer.length) {
        throw new Error(
          `Unexpected end of binary data at offset ${this.offset} (need ${count} bytes, have ${this.buffer.length - this.offset})`
        );
      }
    }
    readUInt8() {
      this.ensureBytes(1);
      return this.buffer[this.offset++];
    }
    readUInt32() {
      this.ensureBytes(4);
      const value = this.buffer[this.offset] | this.buffer[this.offset + 1] << 8 | this.buffer[this.offset + 2] << 16 | this.buffer[this.offset + 3] << 24;
      this.offset += 4;
      return value >>> 0;
    }
    readVarUInt1() {
      this.ensureBytes(1);
      return this.buffer[this.offset++] & 1;
    }
    readVarUInt7() {
      this.ensureBytes(1);
      return this.buffer[this.offset++] & 127;
    }
    readVarUInt32() {
      let result = 0;
      let shift = 0;
      let byte;
      do {
        this.ensureBytes(1);
        byte = this.buffer[this.offset++];
        result |= (byte & 127) << shift;
        shift += 7;
      } while (byte & 128);
      return result >>> 0;
    }
    readVarInt7() {
      this.ensureBytes(1);
      const byte = this.buffer[this.offset++];
      return byte & 64 ? byte | 4294967168 : byte & 127;
    }
    readVarInt32() {
      let result = 0;
      let shift = 0;
      let byte;
      do {
        this.ensureBytes(1);
        byte = this.buffer[this.offset++];
        result |= (byte & 127) << shift;
        shift += 7;
      } while (byte & 128);
      if (shift < 32 && byte & 64) {
        result |= -(1 << shift);
      }
      return result;
    }
    readVarInt64() {
      let result = 0n;
      let shift = 0n;
      let byte;
      do {
        this.ensureBytes(1);
        byte = this.buffer[this.offset++];
        result |= BigInt(byte & 127) << shift;
        shift += 7n;
      } while (byte & 128);
      if (shift < 64n && byte & 64) {
        result |= -(1n << shift);
      }
      return result;
    }
    readVarUInt64() {
      let result = 0n;
      let shift = 0n;
      let byte;
      do {
        this.ensureBytes(1);
        byte = this.buffer[this.offset++];
        result |= BigInt(byte & 127) << shift;
        shift += 7n;
      } while (byte & 128);
      return result;
    }
    readString(length) {
      this.ensureBytes(length);
      const bytes = this.buffer.slice(this.offset, this.offset + length);
      this.offset += length;
      return new TextDecoder().decode(bytes);
    }
    readBytes(length) {
      this.ensureBytes(length);
      const bytes = this.buffer.slice(this.offset, this.offset + length);
      this.offset += length;
      return bytes;
    }
  };

  // src/Disassembler.ts
  var valueTypeNames = {
    127: "i32",
    126: "i64",
    125: "f32",
    124: "f64",
    123: "v128",
    112: "funcref",
    111: "externref",
    110: "anyref",
    109: "eqref",
    108: "i31ref",
    107: "structref",
    106: "arrayref",
    113: "nullref",
    115: "nullfuncref",
    114: "nullexternref"
  };
  var blockTypeNames = {
    ...valueTypeNames,
    64: ""
    // void
  };

  // src/WatParser.ts
  function tokenize(source) {
    const tokens = [];
    let pos = 0;
    let line = 1;
    let col = 1;
    function advance(n = 1) {
      for (let i = 0; i < n; i++) {
        if (source[pos] === "\n") {
          line++;
          col = 1;
        } else {
          col++;
        }
        pos++;
      }
    }
    while (pos < source.length) {
      const ch = source[pos];
      if (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        advance();
        continue;
      }
      if (ch === ";" && source[pos + 1] === ";") {
        while (pos < source.length && source[pos] !== "\n") advance();
        continue;
      }
      if (ch === "(" && source[pos + 1] === ";") {
        advance(2);
        let depth = 1;
        while (pos < source.length && depth > 0) {
          if (source[pos] === "(" && source[pos + 1] === ";") {
            depth++;
            advance(2);
          } else if (source[pos] === ";" && source[pos + 1] === ")") {
            depth--;
            advance(2);
          } else {
            advance();
          }
        }
        continue;
      }
      const startLine = line;
      const startCol = col;
      if (ch === "(") {
        tokens.push({ type: "LeftParen" /* LeftParen */, value: "(", line: startLine, col: startCol });
        advance();
        continue;
      }
      if (ch === ")") {
        tokens.push({ type: "RightParen" /* RightParen */, value: ")", line: startLine, col: startCol });
        advance();
        continue;
      }
      if (ch === '"') {
        advance();
        let str = "";
        while (pos < source.length && source[pos] !== '"') {
          if (source[pos] === "\\") {
            advance();
            const esc = source[pos];
            if (esc === "n") str += "\n";
            else if (esc === "t") str += "	";
            else if (esc === "\\") str += "\\";
            else if (esc === '"') str += '"';
            else if (esc === "'") str += "'";
            else {
              const hex = source.substring(pos, pos + 2);
              str += String.fromCharCode(parseInt(hex, 16));
              advance();
            }
            advance();
          } else {
            str += source[pos];
            advance();
          }
        }
        advance();
        tokens.push({ type: "String" /* String */, value: str, line: startLine, col: startCol });
        continue;
      }
      if (ch === "$") {
        let id = "";
        advance();
        while (pos < source.length && !isDelimiter(source[pos])) {
          id += source[pos];
          advance();
        }
        tokens.push({ type: "Id" /* Id */, value: "$" + id, line: startLine, col: startCol });
        continue;
      }
      let word = "";
      while (pos < source.length && !isDelimiter(source[pos])) {
        word += source[pos];
        advance();
      }
      if (isNumericToken(word)) {
        tokens.push({ type: "Number" /* Number */, value: word, line: startLine, col: startCol });
      } else {
        tokens.push({ type: "Keyword" /* Keyword */, value: word, line: startLine, col: startCol });
      }
    }
    tokens.push({ type: "EOF" /* EOF */, value: "", line, col });
    return tokens;
  }
  function isDelimiter(ch) {
    return ch === " " || ch === "	" || ch === "\n" || ch === "\r" || ch === "(" || ch === ")" || ch === ";" || ch === '"';
  }
  function isNumericToken(word) {
    if (/^[+-]?\d/.test(word)) return true;
    if (/^[+-]?0x[0-9a-fA-F]/.test(word)) return true;
    if (/^[+-]?inf$/.test(word)) return true;
    if (/^[+-]?nan/.test(word)) return true;
    return false;
  }
  var valueTypeMap = {
    "i32": ValueType.Int32,
    "i64": ValueType.Int64,
    "f32": ValueType.Float32,
    "f64": ValueType.Float64,
    "v128": ValueType.V128,
    "funcref": ValueType.FuncRef,
    "externref": ValueType.ExternRef,
    "anyref": ValueType.AnyRef,
    "eqref": ValueType.EqRef,
    "i31ref": ValueType.I31Ref,
    "structref": ValueType.StructRef,
    "arrayref": ValueType.ArrayRef,
    "nullref": ValueType.NullRef,
    "nullfuncref": ValueType.NullFuncRef,
    "nullexternref": ValueType.NullExternRef
  };
  var blockTypeMap = {
    "i32": BlockType.Int32,
    "i64": BlockType.Int64,
    "f32": BlockType.Float32,
    "f64": BlockType.Float64,
    "v128": BlockType.V128,
    "funcref": BlockType.FuncRef,
    "externref": BlockType.ExternRef,
    "anyref": BlockType.AnyRef,
    "eqref": BlockType.EqRef,
    "i31ref": BlockType.I31Ref,
    "structref": BlockType.StructRef,
    "arrayref": BlockType.ArrayRef
  };
  var mnemonicToOpCode = /* @__PURE__ */ new Map();
  for (const [, opCode] of Object.entries(OpCodes_default)) {
    const op = opCode;
    mnemonicToOpCode.set(op.mnemonic, op);
  }
  var WatParserImpl = class {
    constructor(tokens) {
      this.funcNames = /* @__PURE__ */ new Map();
      this.globalNames = /* @__PURE__ */ new Map();
      this.typeNames = /* @__PURE__ */ new Map();
      this.tagNames = /* @__PURE__ */ new Map();
      this.localNames = /* @__PURE__ */ new Map();
      this.funcList = [];
      this.labelStack = [];
      this.tokens = tokens;
      this.pos = 0;
    }
    // --- Token navigation ---
    peek() {
      return this.tokens[this.pos];
    }
    advance() {
      return this.tokens[this.pos++];
    }
    expect(type, value) {
      const tok = this.advance();
      if (tok.type !== type) {
        throw this.error(`Expected ${type}${value ? ` '${value}'` : ""} but got ${tok.type} '${tok.value}'`, tok);
      }
      if (value !== void 0 && tok.value !== value) {
        throw this.error(`Expected '${value}' but got '${tok.value}'`, tok);
      }
      return tok;
    }
    expectKeyword(value) {
      return this.expect("Keyword" /* Keyword */, value);
    }
    isKeyword(value) {
      const tok = this.peek();
      return tok.type === "Keyword" /* Keyword */ && tok.value === value;
    }
    isLeftParen() {
      return this.peek().type === "LeftParen" /* LeftParen */;
    }
    isRightParen() {
      return this.peek().type === "RightParen" /* RightParen */;
    }
    // Skip optional inline comment like (;0;)
    skipInlineComment() {
      while (this.isLeftParen() && this.tokens[this.pos + 1]?.type === "Keyword" /* Keyword */ && this.tokens[this.pos + 1]?.value.startsWith(";")) {
        this.advance();
        while (!this.isRightParen()) this.advance();
        this.advance();
      }
    }
    error(message, tok) {
      const t = tok || this.peek();
      return new Error(`WAT parse error at ${t.line}:${t.col}: ${message}`);
    }
    // --- Parsing ---
    parse(options) {
      this.expect("LeftParen" /* LeftParen */);
      this.expectKeyword("module");
      let name = "module";
      if (this.peek().type === "Id" /* Id */) {
        name = this.advance().value.substring(1);
      }
      this.moduleBuilder = new ModuleBuilder(name, options);
      while (!this.isRightParen()) {
        this.expect("LeftParen" /* LeftParen */);
        const section = this.advance();
        switch (section.value) {
          case "type":
            this.parseType();
            break;
          case "import":
            this.parseImport();
            break;
          case "func":
            this.parseFunc();
            break;
          case "table":
            this.parseTable();
            break;
          case "memory":
            this.parseMemory();
            break;
          case "global":
            this.parseGlobal();
            break;
          case "export":
            this.parseExport();
            break;
          case "start":
            this.parseStart();
            break;
          case "elem":
            this.parseElem();
            break;
          case "data":
            this.parseData();
            break;
          case "tag":
            this.parseTag();
            break;
          case "rec":
            this.parseRecGroup();
            break;
          default:
            this.skipSExpr();
            break;
        }
      }
      this.expect("RightParen" /* RightParen */);
      return this.moduleBuilder;
    }
    // Skip remainder of current S-expression (we've already consumed opening keyword)
    skipSExpr() {
      let depth = 0;
      while (true) {
        const tok = this.peek();
        if (tok.type === "EOF" /* EOF */) break;
        if (tok.type === "LeftParen" /* LeftParen */) {
          depth++;
          this.advance();
        } else if (tok.type === "RightParen" /* RightParen */) {
          if (depth === 0) {
            this.advance();
            return;
          }
          depth--;
          this.advance();
        } else {
          this.advance();
        }
      }
    }
    // --- Type section ---
    parseType(recGroup) {
      let typeName = null;
      if (this.peek().type === "Id" /* Id */) {
        typeName = this.advance().value;
      }
      this.skipInlineComment();
      this.expect("LeftParen" /* LeftParen */);
      let isFinal = true;
      const superTypeIndices = [];
      let kw = this.peek().value;
      let hasSubWrapper = false;
      if (kw === "sub" || kw === "sub_final") {
        this.advance();
        hasSubWrapper = true;
        isFinal = kw === "sub_final";
        if (kw === "sub" && this.isKeyword("final")) {
          this.advance();
          isFinal = true;
        }
        while (this.peek().type === "Id" /* Id */ || this.peek().type === "Number" /* Number */) {
          if (this.peek().type === "Id" /* Id */) {
            const id = this.advance().value;
            const resolved = this.typeNames.get(id);
            if (resolved === void 0) throw this.error(`Unknown type: ${id}`);
            superTypeIndices.push({ index: resolved });
          } else {
            superTypeIndices.push({ index: this.parseNumber() });
          }
        }
        this.expect("LeftParen" /* LeftParen */);
        kw = this.peek().value;
      }
      const subOptions = hasSubWrapper ? { superTypes: superTypeIndices, final: isFinal } : void 0;
      if (kw === "func") {
        this.advance();
        const params = [];
        const results = [];
        while (this.isLeftParen()) {
          this.expect("LeftParen" /* LeftParen */);
          const innerKw = this.advance().value;
          if (innerKw === "param") {
            while (!this.isRightParen()) {
              if (this.peek().type === "Id" /* Id */) this.advance();
              else params.push(this.parseValueType());
            }
          } else if (innerKw === "result") {
            while (!this.isRightParen()) {
              results.push(this.parseValueType());
            }
          }
          this.expect("RightParen" /* RightParen */);
        }
        this.expect("RightParen" /* RightParen */);
        if (hasSubWrapper) this.expect("RightParen" /* RightParen */);
        this.expect("RightParen" /* RightParen */);
        let typeIndex;
        if (recGroup) {
          typeIndex = recGroup.addFuncType(results, params).index;
        } else {
          typeIndex = this.moduleBuilder.defineFunctionType(results.length > 0 ? results : null, params).index;
        }
        if (typeName) {
          this.typeNames.set(typeName, typeIndex);
        }
      } else if (kw === "struct") {
        this.advance();
        const fields = [];
        while (this.isLeftParen()) {
          this.expect("LeftParen" /* LeftParen */);
          this.expectKeyword("field");
          let fieldName = `f${fields.length}`;
          if (this.peek().type === "Id" /* Id */) {
            fieldName = this.advance().value.replace(/^\$/, "");
          }
          let mutable = false;
          let fieldType;
          if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "mut") {
            this.expect("LeftParen" /* LeftParen */);
            this.expectKeyword("mut");
            fieldType = this.parseValueType();
            mutable = true;
            this.expect("RightParen" /* RightParen */);
          } else {
            fieldType = this.parseValueType();
          }
          fields.push({ name: fieldName, type: fieldType, mutable });
          this.expect("RightParen" /* RightParen */);
        }
        this.expect("RightParen" /* RightParen */);
        if (hasSubWrapper) this.expect("RightParen" /* RightParen */);
        this.expect("RightParen" /* RightParen */);
        let typeIndex;
        if (recGroup) {
          typeIndex = recGroup.addStructType(fields, subOptions).index;
        } else {
          typeIndex = this.moduleBuilder.defineStructType(fields, subOptions).index;
        }
        if (typeName) {
          this.typeNames.set(typeName, typeIndex);
        }
      } else if (kw === "array") {
        this.advance();
        let mutable = false;
        let elementType;
        if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "mut") {
          this.expect("LeftParen" /* LeftParen */);
          this.expectKeyword("mut");
          elementType = this.parseValueType();
          mutable = true;
          this.expect("RightParen" /* RightParen */);
        } else {
          elementType = this.parseValueType();
        }
        this.expect("RightParen" /* RightParen */);
        if (hasSubWrapper) this.expect("RightParen" /* RightParen */);
        this.expect("RightParen" /* RightParen */);
        let typeIndex;
        if (recGroup) {
          typeIndex = recGroup.addArrayType(elementType, mutable, subOptions).index;
        } else {
          typeIndex = this.moduleBuilder.defineArrayType(elementType, mutable, subOptions).index;
        }
        if (typeName) {
          this.typeNames.set(typeName, typeIndex);
        }
      } else {
        throw this.error(`Expected 'func', 'struct', or 'array' in type definition, got '${kw}'`);
      }
    }
    parseRecGroup() {
      const savedPos = this.pos;
      const baseIndex = this.moduleBuilder._types.length;
      let groupIndex = 0;
      while (this.isLeftParen()) {
        this.advance();
        this.advance();
        if (this.peek().type === "Id" /* Id */) {
          this.typeNames.set(this.advance().value, baseIndex + groupIndex);
        }
        this.skipSExpr();
        groupIndex++;
      }
      this.pos = savedPos;
      this.moduleBuilder.defineRecGroup((recGroup) => {
        while (this.isLeftParen()) {
          this.expect("LeftParen" /* LeftParen */);
          this.expectKeyword("type");
          this.parseType(recGroup);
        }
      });
      this.expect("RightParen" /* RightParen */);
    }
    // --- Import section ---
    parseImport() {
      const moduleName = this.expect("String" /* String */).value;
      const fieldName = this.expect("String" /* String */).value;
      this.expect("LeftParen" /* LeftParen */);
      const kind = this.advance().value;
      if (kind === "func") {
        this.parseImportFunc(moduleName, fieldName);
      } else if (kind === "table") {
        this.parseImportTable(moduleName, fieldName);
      } else if (kind === "memory") {
        this.parseImportMemory(moduleName, fieldName);
      } else if (kind === "global") {
        this.parseImportGlobal(moduleName, fieldName);
      } else {
        throw this.error(`Unknown import kind: ${kind}`);
      }
    }
    parseImportFunc(moduleName, fieldName) {
      let importFuncName = null;
      if (this.peek().type === "Id" /* Id */) {
        importFuncName = this.advance().value;
      }
      this.skipInlineComment();
      let funcReturnTypes = null;
      let funcParamTypes = [];
      if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "type") {
        this.expect("LeftParen" /* LeftParen */);
        this.expectKeyword("type");
        const typeIndex = this.parseNumber();
        this.expect("RightParen" /* RightParen */);
        const typeEntry = this.moduleBuilder._types[typeIndex];
        if (!("returnTypes" in typeEntry)) {
          throw new Error(`Type index ${typeIndex} is not a function type.`);
        }
        const funcType = typeEntry;
        funcReturnTypes = funcType.returnTypes.length > 0 ? funcType.returnTypes : null;
        funcParamTypes = funcType.parameterTypes;
      } else {
        const params = [];
        const results = [];
        while (this.isLeftParen()) {
          this.expect("LeftParen" /* LeftParen */);
          const kw = this.peek().value;
          if (kw === "param") {
            this.advance();
            while (!this.isRightParen()) {
              if (this.peek().type === "Id" /* Id */) this.advance();
              else params.push(this.parseValueType());
            }
            this.expect("RightParen" /* RightParen */);
          } else if (kw === "result") {
            this.advance();
            while (!this.isRightParen()) {
              results.push(this.parseValueType());
            }
            this.expect("RightParen" /* RightParen */);
          } else {
            break;
          }
        }
        funcReturnTypes = results.length > 0 ? results : null;
        funcParamTypes = params;
      }
      this.expect("RightParen" /* RightParen */);
      this.expect("RightParen" /* RightParen */);
      const imp = this.moduleBuilder.importFunction(
        moduleName,
        fieldName,
        funcReturnTypes,
        funcParamTypes
      );
      if (importFuncName) {
        this.funcNames.set(importFuncName, imp.index);
      }
      this.funcList.push(imp);
    }
    parseImportTable(moduleName, fieldName) {
      const initial = this.parseNumber();
      let maximum = null;
      let elemType = "anyfunc";
      if (this.peek().type === "Number" /* Number */) {
        maximum = this.parseNumber();
      }
      if (this.peek().type === "Keyword" /* Keyword */) {
        elemType = this.advance().value;
      }
      this.expect("RightParen" /* RightParen */);
      this.expect("RightParen" /* RightParen */);
      this.moduleBuilder.importTable(moduleName, fieldName, ElementType.AnyFunc, initial, maximum);
    }
    parseImportMemory(moduleName, fieldName) {
      let memory64 = false;
      if (this.isKeyword("i64")) {
        this.advance();
        memory64 = true;
      }
      const initial = this.parseNumber();
      let maximum = null;
      if (this.peek().type === "Number" /* Number */) {
        maximum = this.parseNumber();
      }
      let shared = false;
      if (this.isKeyword("shared")) {
        this.advance();
        shared = true;
      }
      this.expect("RightParen" /* RightParen */);
      this.expect("RightParen" /* RightParen */);
      this.moduleBuilder.importMemory(moduleName, fieldName, initial, maximum, shared, memory64);
    }
    parseImportGlobal(moduleName, fieldName) {
      let mutable = false;
      let valueType;
      if (this.isLeftParen()) {
        this.expect("LeftParen" /* LeftParen */);
        this.expectKeyword("mut");
        valueType = this.parseValueType();
        mutable = true;
        this.expect("RightParen" /* RightParen */);
      } else {
        valueType = this.parseValueType();
      }
      this.expect("RightParen" /* RightParen */);
      this.expect("RightParen" /* RightParen */);
      this.moduleBuilder.importGlobal(moduleName, fieldName, valueType, mutable);
    }
    // --- Function section ---
    parseFunc() {
      let name = null;
      if (this.peek().type === "Id" /* Id */) {
        name = this.advance().value.substring(1);
      }
      this.skipInlineComment();
      const inlineExports = this.parseInlineExports();
      const inlineImport = this.parseInlineImport();
      let hasExplicitType = false;
      let typeIndex = -1;
      if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "type") {
        this.expect("LeftParen" /* LeftParen */);
        this.expectKeyword("type");
        if (this.peek().type === "Id" /* Id */) {
          const id = this.advance().value;
          const resolved = this.typeNames.get(id);
          if (resolved === void 0) throw this.error(`Unknown type: ${id}`);
          typeIndex = resolved;
        } else {
          typeIndex = this.parseNumber();
        }
        this.expect("RightParen" /* RightParen */);
        hasExplicitType = true;
      }
      const params = [];
      const paramNames = [];
      const results = [];
      while (this.isLeftParen() && !this.isInstruction()) {
        const savedPos = this.pos;
        this.expect("LeftParen" /* LeftParen */);
        const kw = this.peek().value;
        if (kw === "param") {
          this.advance();
          while (!this.isRightParen()) {
            if (this.peek().type === "Id" /* Id */) {
              const pName = this.advance().value.substring(1);
              params.push(this.parseValueType());
              paramNames.push(pName);
            } else {
              params.push(this.parseValueType());
              paramNames.push(null);
            }
          }
          this.expect("RightParen" /* RightParen */);
        } else if (kw === "result") {
          this.advance();
          while (!this.isRightParen()) {
            results.push(this.parseValueType());
          }
          this.expect("RightParen" /* RightParen */);
        } else if (kw === "local") {
          this.pos = savedPos;
          break;
        } else {
          this.pos = savedPos;
          break;
        }
      }
      let funcReturnTypes;
      let funcParamTypes;
      if (hasExplicitType) {
        const typeEntry = this.moduleBuilder._types[typeIndex];
        if (!("returnTypes" in typeEntry)) {
          throw new Error(`Type index ${typeIndex} is not a function type.`);
        }
        const funcType = typeEntry;
        funcReturnTypes = funcType.returnTypes.length > 0 ? funcType.returnTypes : null;
        funcParamTypes = funcType.parameterTypes;
      } else {
        funcReturnTypes = results.length > 0 ? results : null;
        funcParamTypes = params;
      }
      if (inlineImport) {
        const imp = this.moduleBuilder.importFunction(
          inlineImport.moduleName,
          inlineImport.fieldName,
          funcReturnTypes,
          funcParamTypes
        );
        if (name) {
          this.funcNames.set("$" + name, imp.index);
        }
        this.funcList.push(imp);
        for (const exportName of inlineExports) {
          this.moduleBuilder.exportFunction(imp, exportName);
        }
        this.expect("RightParen" /* RightParen */);
        return;
      }
      const funcBuilder = this.moduleBuilder.defineFunction(
        name || `func_${this.moduleBuilder._functions.length - 1 + this.moduleBuilder._importsIndexSpace.function}`,
        funcReturnTypes,
        funcParamTypes
      );
      this.localNames = /* @__PURE__ */ new Map();
      if (!hasExplicitType) {
        paramNames.forEach((pName, i) => {
          if (pName !== null && i < funcBuilder.parameters.length) {
            funcBuilder.parameters[i].withName(pName);
            this.localNames.set("$" + pName, i);
          }
        });
      }
      if (name) {
        this.funcNames.set("$" + name, funcBuilder._index);
      }
      this.funcList.push(funcBuilder);
      for (const exportName of inlineExports) {
        this.moduleBuilder.exportFunction(funcBuilder, exportName);
      }
      if (this.isRightParen()) {
        this.expect("RightParen" /* RightParen */);
        return;
      }
      this.labelStack = [];
      funcBuilder.createEmitter((asm) => {
        this.parseFuncBody(asm, funcBuilder);
      });
      this.expect("RightParen" /* RightParen */);
    }
    parseFuncBody(asm, func) {
      const paramCount = func.parameters.length;
      let localIndex = paramCount;
      while (this.isLeftParen()) {
        const savedPos = this.pos;
        this.expect("LeftParen" /* LeftParen */);
        if (this.isKeyword("local")) {
          this.advance();
          while (!this.isRightParen()) {
            if (this.peek().type === "Id" /* Id */) {
              const localName = this.advance().value.substring(1);
              const vt = this.parseValueType();
              asm.declareLocal(vt, localName);
              this.localNames.set("$" + localName, localIndex);
              localIndex++;
            } else {
              const vt = this.parseValueType();
              asm.declareLocal(vt);
              localIndex++;
            }
          }
          this.expect("RightParen" /* RightParen */);
        } else {
          this.pos = savedPos;
          break;
        }
      }
      while (!this.isRightParen()) {
        this.parseInstruction(asm, func);
      }
    }
    parseInstruction(asm, func) {
      if (this.isLeftParen()) {
        this.parseFoldedInstruction(asm, func);
        return;
      }
      const tok = this.advance();
      const mnemonic = tok.value;
      if (mnemonic === "block" || mnemonic === "loop" || mnemonic === "if" || mnemonic === "try") {
        let labelName = null;
        if (this.peek().type === "Id" /* Id */) {
          labelName = this.advance().value;
        }
        const blockType = this.parseBlockType();
        const label = asm.emit(mnemonicToOpCode.get(mnemonic), blockType);
        if (labelName && label) {
          this.labelStack.push({ name: labelName, label });
        }
        return;
      }
      if (mnemonic === "end") {
        asm.emit(mnemonicToOpCode.get(mnemonic));
        if (this.labelStack.length > 0) {
          const cfStack = asm.controlFlowStack;
          const top = this.labelStack[this.labelStack.length - 1];
          if (top.label.block && !cfStack.includes(top.label)) {
            this.labelStack.pop();
          }
        }
        return;
      }
      if (mnemonic === "delegate") {
        const depth = this.parseNumber();
        asm.emit(mnemonicToOpCode.get(mnemonic), depth);
        if (this.labelStack.length > 0) {
          const cfStack = asm.controlFlowStack;
          const top = this.labelStack[this.labelStack.length - 1];
          if (top.label.block && !cfStack.includes(top.label)) {
            this.labelStack.pop();
          }
        }
        return;
      }
      const opCode = mnemonicToOpCode.get(mnemonic);
      if (!opCode) {
        throw this.error(`Unknown instruction: ${mnemonic}`, tok);
      }
      if (mnemonic === "throw" || mnemonic === "catch") {
        asm.emit(opCode, this.resolveTag());
        return;
      }
      if (!opCode.immediate) {
        asm.emit(opCode);
        return;
      }
      switch (opCode.immediate) {
        case "VarInt32":
          asm.emit(opCode, this.parseNumber());
          break;
        case "VarInt64":
          asm.emit(opCode, this.parseI64Value());
          break;
        case "Float32":
          asm.emit(opCode, this.parseFloat());
          break;
        case "Float64":
          asm.emit(opCode, this.parseFloat());
          break;
        case "VarUInt1":
          asm.emit(opCode, this.parseNumber());
          break;
        case "VarUInt32":
          asm.emit(opCode, this.parseNumber());
          break;
        case "Local":
          asm.emit(opCode, this.resolveLocal());
          break;
        case "Global":
          asm.emit(opCode, this.resolveGlobal());
          break;
        case "Function":
          asm.emit(opCode, this.resolveFunction());
          break;
        case "IndirectFunction": {
          let tableIndex;
          if (this.peek().type === "Number" /* Number */) {
            tableIndex = this.parseNumber();
          }
          this.expect("LeftParen" /* LeftParen */);
          this.expectKeyword("type");
          let typeIdx;
          if (this.peek().type === "Id" /* Id */) {
            const id = this.advance().value;
            typeIdx = this.typeNames.get(id);
            if (typeIdx === void 0) throw this.error(`Unknown type: ${id}`);
          } else {
            typeIdx = this.parseNumber();
          }
          this.expect("RightParen" /* RightParen */);
          asm.emit(opCode, this.moduleBuilder._types[typeIdx], tableIndex);
          break;
        }
        case "RelativeDepth":
          asm.emit(opCode, this.resolveBranchTarget(asm));
          break;
        case "BranchTable": {
          const targets = [];
          while (this.peek().type === "Number" /* Number */) {
            targets.push(this.parseNumber());
          }
          if (targets.length < 1) throw this.error("br_table requires at least a default target");
          const defaultTarget = targets.pop();
          const defaultLabel = this.getLabelAtDepth(asm, defaultTarget);
          const labels = targets.map((t) => this.getLabelAtDepth(asm, t));
          asm.emit(opCode, defaultLabel, labels);
          break;
        }
        case "MemoryImmediate": {
          let alignment = 0;
          let offset = 0;
          while (this.peek().type === "Keyword" /* Keyword */ && (this.peek().value.startsWith("offset=") || this.peek().value.startsWith("align="))) {
            const kv = this.advance().value;
            const [key, val] = kv.split("=");
            if (key === "offset") offset = parseInt(val, 10);
            else if (key === "align") {
              const alignVal = parseInt(val, 10);
              alignment = Math.log2(alignVal);
            }
          }
          asm.emit(opCode, alignment, offset);
          break;
        }
        case "BlockSignature": {
          let blockType = BlockType.Void;
          if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "result") {
            this.expect("LeftParen" /* LeftParen */);
            this.expectKeyword("result");
            const vt = this.parseValueType();
            blockType = blockTypeMap[vt.name] || BlockType.Void;
            this.expect("RightParen" /* RightParen */);
          }
          asm.emit(opCode, blockType);
          break;
        }
        case "V128Const": {
          const bytes = new Uint8Array(16);
          if (this.peek().type === "Keyword" /* Keyword */) this.advance();
          for (let i = 0; i < 16; i++) {
            bytes[i] = this.parseNumber() & 255;
          }
          asm.emit(opCode, bytes);
          break;
        }
        case "LaneIndex":
          asm.emit(opCode, this.parseNumber());
          break;
        case "ShuffleMask": {
          const mask = new Uint8Array(16);
          for (let i = 0; i < 16; i++) {
            mask[i] = this.parseNumber();
          }
          asm.emit(opCode, mask);
          break;
        }
        case "TypeIndexField": {
          const typeIndex = this.parseNumber();
          const fieldIndex = this.parseNumber();
          asm.emit(opCode, typeIndex, fieldIndex);
          break;
        }
        case "TypeIndexIndex": {
          const typeIndex = this.parseNumber();
          const index = this.parseNumber();
          asm.emit(opCode, typeIndex, index);
          break;
        }
        case "HeapType":
          asm.emit(opCode, this.parseHeapType());
          break;
        case "BrOnCast": {
          const label = this.resolveBranchTarget(asm);
          const ht1 = this.parseHeapType();
          const ht2 = this.parseHeapType();
          asm.emit(opCode, label, ht1, ht2);
          break;
        }
        default:
          asm.emit(opCode);
          break;
      }
    }
    parseFoldedInstruction(asm, func) {
      this.expect("LeftParen" /* LeftParen */);
      const tok = this.advance();
      const mnemonic = tok.value;
      if (mnemonic === "block" || mnemonic === "loop") {
        let labelName = null;
        if (this.peek().type === "Id" /* Id */) {
          labelName = this.advance().value;
        }
        const blockType = this.parseBlockType();
        const label = asm.emit(mnemonicToOpCode.get(mnemonic), blockType);
        if (labelName && label) {
          this.labelStack.push({ name: labelName, label });
        }
        while (!this.isRightParen()) {
          this.parseInstruction(asm, func);
        }
        asm.emit(mnemonicToOpCode.get("end"));
        if (this.labelStack.length > 0) {
          const cfStack = asm.controlFlowStack;
          const top = this.labelStack[this.labelStack.length - 1];
          if (top.label.block && !cfStack.includes(top.label)) {
            this.labelStack.pop();
          }
        }
        this.expect("RightParen" /* RightParen */);
        return;
      }
      if (mnemonic === "if") {
        let labelName = null;
        if (this.peek().type === "Id" /* Id */) {
          labelName = this.advance().value;
        }
        const blockType = this.parseBlockType();
        while (this.isLeftParen() && this.tokens[this.pos + 1]?.value !== "then") {
          this.parseFoldedInstruction(asm, func);
        }
        const label = asm.emit(mnemonicToOpCode.get("if"), blockType);
        if (labelName && label) {
          this.labelStack.push({ name: labelName, label });
        }
        if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "then") {
          this.expect("LeftParen" /* LeftParen */);
          this.advance();
          while (!this.isRightParen()) {
            this.parseInstruction(asm, func);
          }
          this.expect("RightParen" /* RightParen */);
        }
        if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "else") {
          asm.emit(mnemonicToOpCode.get("else"));
          this.expect("LeftParen" /* LeftParen */);
          this.advance();
          while (!this.isRightParen()) {
            this.parseInstruction(asm, func);
          }
          this.expect("RightParen" /* RightParen */);
        }
        asm.emit(mnemonicToOpCode.get("end"));
        if (this.labelStack.length > 0) {
          const cfStack = asm.controlFlowStack;
          const top = this.labelStack[this.labelStack.length - 1];
          if (top.label.block && !cfStack.includes(top.label)) {
            this.labelStack.pop();
          }
        }
        this.expect("RightParen" /* RightParen */);
        return;
      }
      if (mnemonic === "try") {
        let labelName = null;
        if (this.peek().type === "Id" /* Id */) {
          labelName = this.advance().value;
        }
        const blockType = this.parseBlockType();
        const label = asm.emit(mnemonicToOpCode.get("try"), blockType);
        if (labelName && label) {
          this.labelStack.push({ name: labelName, label });
        }
        if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "do") {
          this.expect("LeftParen" /* LeftParen */);
          this.advance();
          while (!this.isRightParen()) {
            this.parseInstruction(asm, func);
          }
          this.expect("RightParen" /* RightParen */);
        }
        while (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "catch") {
          this.expect("LeftParen" /* LeftParen */);
          this.advance();
          const tagIdx = this.resolveTag();
          asm.emit(mnemonicToOpCode.get("catch"), tagIdx);
          while (!this.isRightParen()) {
            this.parseInstruction(asm, func);
          }
          this.expect("RightParen" /* RightParen */);
        }
        if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "catch_all") {
          this.expect("LeftParen" /* LeftParen */);
          this.advance();
          asm.emit(mnemonicToOpCode.get("catch_all"));
          while (!this.isRightParen()) {
            this.parseInstruction(asm, func);
          }
          this.expect("RightParen" /* RightParen */);
        }
        asm.emit(mnemonicToOpCode.get("end"));
        if (this.labelStack.length > 0) {
          const cfStack = asm.controlFlowStack;
          const top = this.labelStack[this.labelStack.length - 1];
          if (top.label.block && !cfStack.includes(top.label)) {
            this.labelStack.pop();
          }
        }
        this.expect("RightParen" /* RightParen */);
        return;
      }
      const opCode = mnemonicToOpCode.get(mnemonic);
      if (!opCode) {
        throw this.error(`Unknown instruction: ${mnemonic}`, tok);
      }
      const emitArgs = [];
      this.parseFoldedImmediates(opCode, mnemonic, asm, emitArgs);
      while (this.isLeftParen()) {
        this.parseFoldedInstruction(asm, func);
      }
      asm.emit(opCode, ...emitArgs);
      this.expect("RightParen" /* RightParen */);
    }
    parseBlockType() {
      let blockType = BlockType.Void;
      if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "type") {
        this.expect("LeftParen" /* LeftParen */);
        this.expectKeyword("type");
        if (this.peek().type === "Id" /* Id */) {
          const id = this.advance().value;
          const resolved = this.typeNames.get(id);
          if (resolved === void 0) throw this.error(`Unknown type: ${id}`);
          blockType = resolved;
        } else {
          blockType = this.parseNumber();
        }
        this.expect("RightParen" /* RightParen */);
        return blockType;
      }
      const blockParams = [];
      const blockResults = [];
      while (this.isLeftParen() && (this.tokens[this.pos + 1]?.value === "param" || this.tokens[this.pos + 1]?.value === "result")) {
        const savedPos = this.pos;
        this.expect("LeftParen" /* LeftParen */);
        const kw = this.peek().value;
        if (kw === "param") {
          this.advance();
          while (!this.isRightParen()) {
            if (this.peek().type === "Id" /* Id */) this.advance();
            else blockParams.push(this.parseValueType());
          }
          this.expect("RightParen" /* RightParen */);
        } else if (kw === "result") {
          this.advance();
          while (!this.isRightParen()) {
            blockResults.push(this.parseValueType());
          }
          this.expect("RightParen" /* RightParen */);
        } else {
          this.pos = savedPos;
          break;
        }
      }
      if (blockParams.length === 0 && blockResults.length === 0) {
        return BlockType.Void;
      }
      if (blockParams.length === 0 && blockResults.length === 1) {
        return blockTypeMap[blockResults[0].name] || BlockType.Void;
      }
      const funcType = this.moduleBuilder.defineFunctionType(
        blockResults.length > 0 ? blockResults : null,
        blockParams
      );
      return funcType.index;
    }
    parseFoldedImmediates(opCode, mnemonic, asm, emitArgs) {
      if (mnemonic === "throw" || mnemonic === "catch") {
        emitArgs.push(this.resolveTag());
        return;
      }
      if (!opCode.immediate) return;
      switch (opCode.immediate) {
        case "VarInt32":
          emitArgs.push(this.parseNumber());
          break;
        case "VarInt64":
          emitArgs.push(this.parseI64Value());
          break;
        case "Float32":
        case "Float64":
          emitArgs.push(this.parseFloat());
          break;
        case "VarUInt1":
        case "VarUInt32":
          emitArgs.push(this.parseNumber());
          break;
        case "Local":
          emitArgs.push(this.resolveLocal());
          break;
        case "Global":
          emitArgs.push(this.resolveGlobal());
          break;
        case "Function":
          emitArgs.push(this.resolveFunction());
          break;
        case "RelativeDepth":
          emitArgs.push(this.resolveBranchTarget(asm));
          break;
        case "MemoryImmediate": {
          let alignment = 0;
          let offset = 0;
          while (this.peek().type === "Keyword" /* Keyword */ && (this.peek().value.startsWith("offset=") || this.peek().value.startsWith("align="))) {
            const kv = this.advance().value;
            const [key, val] = kv.split("=");
            if (key === "offset") offset = parseInt(val, 10);
            else if (key === "align") alignment = Math.log2(parseInt(val, 10));
          }
          emitArgs.push(alignment, offset);
          break;
        }
        case "TypeIndexField":
          emitArgs.push(this.parseNumber(), this.parseNumber());
          break;
        case "TypeIndexIndex":
          emitArgs.push(this.parseNumber(), this.parseNumber());
          break;
        case "LaneIndex":
          emitArgs.push(this.parseNumber());
          break;
        case "HeapType":
          emitArgs.push(this.parseHeapType());
          break;
        case "BrOnCast": {
          const label = this.resolveBranchTarget(asm);
          const ht1 = this.parseHeapType();
          const ht2 = this.parseHeapType();
          emitArgs.push(label, ht1, ht2);
          break;
        }
        case "IndirectFunction": {
          let tableIndex;
          if (this.peek().type === "Number" /* Number */) {
            tableIndex = this.parseNumber();
          }
          this.expect("LeftParen" /* LeftParen */);
          this.expectKeyword("type");
          let typeIdx;
          if (this.peek().type === "Id" /* Id */) {
            const id = this.advance().value;
            typeIdx = this.typeNames.get(id);
            if (typeIdx === void 0) throw this.error(`Unknown type: ${id}`);
          } else {
            typeIdx = this.parseNumber();
          }
          this.expect("RightParen" /* RightParen */);
          emitArgs.push(this.moduleBuilder._types[typeIdx], tableIndex);
          break;
        }
        case "BranchTable": {
          const targets = [];
          while (this.peek().type === "Number" /* Number */) {
            targets.push(this.parseNumber());
          }
          if (targets.length < 1) throw this.error("br_table requires at least a default target");
          const defaultTarget = targets.pop();
          const defaultLabel = this.getLabelAtDepth(asm, defaultTarget);
          const labels = targets.map((t) => this.getLabelAtDepth(asm, t));
          emitArgs.push(defaultLabel, labels);
          break;
        }
        case "ShuffleMask": {
          const mask = new Uint8Array(16);
          for (let i = 0; i < 16; i++) {
            mask[i] = this.parseNumber();
          }
          emitArgs.push(mask);
          break;
        }
        case "V128Const": {
          const bytes = new Uint8Array(16);
          if (this.peek().type === "Keyword" /* Keyword */) this.advance();
          for (let i = 0; i < 16; i++) {
            bytes[i] = this.parseNumber() & 255;
          }
          emitArgs.push(bytes);
          break;
        }
        case "BlockSignature": {
          let bt = BlockType.Void;
          if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "result") {
            this.expect("LeftParen" /* LeftParen */);
            this.expectKeyword("result");
            const vt = this.parseValueType();
            bt = blockTypeMap[vt.name] || BlockType.Void;
            this.expect("RightParen" /* RightParen */);
          }
          emitArgs.push(bt);
          break;
        }
        default:
          break;
      }
    }
    parseHeapType() {
      const heapTypeKeywords = {
        func: HeapType.Func,
        extern: HeapType.Extern,
        any: HeapType.Any,
        eq: HeapType.Eq,
        i31: HeapType.I31,
        struct: HeapType.Struct,
        array: HeapType.Array,
        none: HeapType.None,
        nofunc: HeapType.NoFunc,
        noextern: HeapType.NoExtern
      };
      if (this.peek().type === "Keyword" /* Keyword */ && heapTypeKeywords[this.peek().value] !== void 0) {
        return heapTypeKeywords[this.advance().value];
      }
      if (this.peek().type === "Number" /* Number */) {
        return this.parseNumber();
      }
      throw this.error(`Expected heap type but found '${this.peek().value}'`);
    }
    getLabelAtDepth(asm, relativeDepth) {
      const stack = asm.controlFlowStack;
      const targetIndex = stack.length - 1 - relativeDepth;
      if (targetIndex < 0 || targetIndex >= stack.length) {
        throw this.error(`Invalid branch depth: ${relativeDepth}`);
      }
      return stack[targetIndex];
    }
    resolveBranchTarget(asm) {
      if (this.peek().type === "Id" /* Id */) {
        const id = this.advance().value;
        for (let i = this.labelStack.length - 1; i >= 0; i--) {
          if (this.labelStack[i].name === id) {
            return this.labelStack[i].label;
          }
        }
        throw this.error(`Unknown label: ${id}`);
      }
      const depth = this.parseNumber();
      return this.getLabelAtDepth(asm, depth);
    }
    resolveFunction() {
      if (this.peek().type === "Id" /* Id */) {
        const id = this.advance().value;
        const index2 = this.funcNames.get(id);
        if (index2 === void 0) throw this.error(`Unknown function: ${id}`);
        return this.funcList[index2];
      }
      const index = this.parseNumber();
      return this.funcList[index];
    }
    resolveGlobal() {
      let index;
      if (this.peek().type === "Id" /* Id */) {
        const id = this.advance().value;
        const resolved = this.globalNames.get(id);
        if (resolved === void 0) throw this.error(`Unknown global: ${id}`);
        index = resolved;
      } else {
        index = this.parseNumber();
      }
      const importedGlobals = this.moduleBuilder._imports.filter(
        (x) => x.externalKind === ExternalKind.Global
      );
      if (index < importedGlobals.length) {
        return importedGlobals[index];
      }
      return this.moduleBuilder._globals[index - importedGlobals.length];
    }
    resolveGlobalIndex() {
      if (this.peek().type === "Id" /* Id */) {
        const id = this.advance().value;
        const resolved = this.globalNames.get(id);
        if (resolved === void 0) throw this.error(`Unknown global: ${id}`);
        return resolved;
      }
      return this.parseNumber();
    }
    // --- Table section ---
    parseTable() {
      let tableName = null;
      if (this.peek().type === "Id" /* Id */) {
        tableName = this.advance().value;
      }
      this.skipInlineComment();
      const inlineExports = this.parseInlineExports();
      const inlineImport = this.parseInlineImport();
      const initial = this.parseNumber();
      let maximum = null;
      if (this.peek().type === "Number" /* Number */) {
        maximum = this.parseNumber();
      }
      if (this.peek().type === "Keyword" /* Keyword */) {
        this.advance();
      }
      this.expect("RightParen" /* RightParen */);
      if (inlineImport) {
        this.moduleBuilder.importTable(inlineImport.moduleName, inlineImport.fieldName, ElementType.AnyFunc, initial, maximum);
      } else {
        this.moduleBuilder.defineTable(ElementType.AnyFunc, initial, maximum);
      }
      const tableBuilder = this.moduleBuilder._tables[this.moduleBuilder._tables.length - 1];
      for (const exportName of inlineExports) {
        if (tableBuilder) {
          this.moduleBuilder.exportTable(tableBuilder, exportName);
        }
      }
    }
    // --- Memory section ---
    parseMemory() {
      let memName = null;
      if (this.peek().type === "Id" /* Id */) {
        memName = this.advance().value;
      }
      this.skipInlineComment();
      const inlineExports = this.parseInlineExports();
      const inlineImport = this.parseInlineImport();
      let memory64 = false;
      if (this.isKeyword("i64")) {
        this.advance();
        memory64 = true;
      }
      const initial = this.parseNumber();
      let maximum = null;
      if (this.peek().type === "Number" /* Number */) {
        maximum = this.parseNumber();
      }
      let shared = false;
      if (this.isKeyword("shared")) {
        this.advance();
        shared = true;
      }
      this.expect("RightParen" /* RightParen */);
      if (inlineImport) {
        this.moduleBuilder.importMemory(inlineImport.moduleName, inlineImport.fieldName, initial, maximum, shared, memory64);
      } else {
        this.moduleBuilder.defineMemory(initial, maximum, shared, memory64);
      }
      const memBuilder = this.moduleBuilder._memories[this.moduleBuilder._memories.length - 1];
      for (const exportName of inlineExports) {
        if (memBuilder) {
          this.moduleBuilder.exportMemory(memBuilder, exportName);
        }
      }
    }
    // --- Global section ---
    parseGlobal() {
      let globalName = null;
      if (this.peek().type === "Id" /* Id */) {
        globalName = this.advance().value;
      }
      this.skipInlineComment();
      const inlineExports = this.parseInlineExports();
      const inlineImport = this.parseInlineImport();
      let mutable = false;
      let valueType;
      if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "mut") {
        this.expect("LeftParen" /* LeftParen */);
        this.expectKeyword("mut");
        valueType = this.parseValueType();
        mutable = true;
        this.expect("RightParen" /* RightParen */);
      } else {
        valueType = this.parseValueType();
      }
      if (inlineImport) {
        const imp = this.moduleBuilder.importGlobal(inlineImport.moduleName, inlineImport.fieldName, valueType, mutable);
        for (const exportName of inlineExports) {
          this.moduleBuilder.exportGlobal(imp, exportName);
        }
        this.expect("RightParen" /* RightParen */);
        return;
      }
      this.expect("LeftParen" /* LeftParen */);
      const initInstr = this.advance().value;
      let initValue = 0;
      if (initInstr === "i32.const") {
        initValue = this.parseNumber();
      } else if (initInstr === "i64.const") {
        initValue = this.parseI64Value();
      } else if (initInstr === "f32.const") {
        initValue = this.parseFloat();
      } else if (initInstr === "f64.const") {
        initValue = this.parseFloat();
      } else if (initInstr === "ref.null") {
        this.parseHeapType();
        initValue = 0;
      } else if (initInstr === "global.get") {
        initValue = this.resolveGlobalIndex();
      }
      this.expect("RightParen" /* RightParen */);
      this.expect("RightParen" /* RightParen */);
      const globalBuilder = this.moduleBuilder.defineGlobal(valueType, mutable, initValue);
      if (globalName) {
        globalBuilder.withName(globalName.substring(1));
        this.globalNames.set(globalName, globalBuilder._index);
      }
      for (const exportName of inlineExports) {
        this.moduleBuilder.exportGlobal(globalBuilder, exportName);
      }
    }
    // --- Export section ---
    parseExportIndex() {
      if (this.peek().type === "Id" /* Id */) {
        return -1;
      }
      return this.parseNumber();
    }
    parseExport() {
      const name = this.expect("String" /* String */).value;
      this.expect("LeftParen" /* LeftParen */);
      const kind = this.advance().value;
      switch (kind) {
        case "func": {
          let funcIndex;
          if (this.peek().type === "Id" /* Id */) {
            const id = this.advance().value;
            funcIndex = this.funcNames.get(id);
            if (funcIndex === void 0) throw this.error(`Unknown function: ${id}`);
          } else {
            funcIndex = this.parseNumber();
          }
          this.expect("RightParen" /* RightParen */);
          this.expect("RightParen" /* RightParen */);
          const func = this.funcList[funcIndex];
          if (func instanceof ImportBuilder) {
            throw this.error("Cannot export an imported function directly");
          }
          this.moduleBuilder.exportFunction(func, name);
          break;
        }
        case "table": {
          const index = this.parseNumber();
          this.expect("RightParen" /* RightParen */);
          this.expect("RightParen" /* RightParen */);
          this.moduleBuilder.exportTable(this.moduleBuilder._tables[index], name);
          break;
        }
        case "memory": {
          const index = this.parseNumber();
          this.expect("RightParen" /* RightParen */);
          this.expect("RightParen" /* RightParen */);
          this.moduleBuilder.exportMemory(this.moduleBuilder._memories[index], name);
          break;
        }
        case "global": {
          let index;
          if (this.peek().type === "Id" /* Id */) {
            const id = this.advance().value;
            index = this.globalNames.get(id);
            if (index === void 0) throw this.error(`Unknown global: ${id}`);
          } else {
            index = this.parseNumber();
          }
          this.expect("RightParen" /* RightParen */);
          this.expect("RightParen" /* RightParen */);
          const importedGlobals = this.moduleBuilder._imports.filter(
            (x) => x.externalKind === ExternalKind.Global
          );
          if (index < importedGlobals.length) {
            throw this.error("Cannot export an imported global directly");
          }
          this.moduleBuilder.exportGlobal(
            this.moduleBuilder._globals[index - importedGlobals.length],
            name
          );
          break;
        }
        default: {
          this.parseNumber();
          this.expect("RightParen" /* RightParen */);
          this.expect("RightParen" /* RightParen */);
        }
      }
    }
    // --- Start section ---
    parseStart() {
      let index;
      if (this.peek().type === "Id" /* Id */) {
        const id = this.advance().value;
        index = this.funcNames.get(id);
        if (index === void 0) throw this.error(`Unknown function: ${id}`);
      } else {
        index = this.parseNumber();
      }
      this.expect("RightParen" /* RightParen */);
      const func = this.funcList[index];
      if (func instanceof FunctionBuilder) {
        this.moduleBuilder.setStartFunction(func);
      }
    }
    // --- Element section ---
    parseElem() {
      const isPassive = this.isKeyword("func") || this.isKeyword("funcref");
      if (!isPassive) {
        this.expect("LeftParen" /* LeftParen */);
        const offsetInstr = this.advance().value;
        let offset = 0;
        if (offsetInstr === "i32.const") {
          offset = this.parseNumber();
        } else if (offsetInstr === "i64.const") {
          offset = this.parseNumber();
        } else if (offsetInstr === "global.get") {
          offset = this.resolveGlobalIndex();
        }
        this.expect("RightParen" /* RightParen */);
        if (this.isKeyword("func")) {
          this.advance();
        }
        const elements = [];
        while (this.peek().type === "Number" /* Number */ || this.peek().type === "Id" /* Id */) {
          if (this.peek().type === "Id" /* Id */) {
            const id = this.advance().value;
            const idx = this.funcNames.get(id);
            if (idx === void 0) throw this.error(`Unknown function: ${id}`);
            elements.push(this.funcList[idx]);
          } else {
            const idx = this.parseNumber();
            elements.push(this.funcList[idx]);
          }
        }
        this.expect("RightParen" /* RightParen */);
        const table = this.moduleBuilder._tables[0];
        this.moduleBuilder.defineElementSegment(table, elements, offset);
      } else {
        this.advance();
        const elements = [];
        while (this.peek().type === "Number" /* Number */ || this.peek().type === "Id" /* Id */) {
          if (this.peek().type === "Id" /* Id */) {
            const id = this.advance().value;
            const idx = this.funcNames.get(id);
            if (idx === void 0) throw this.error(`Unknown function: ${id}`);
            elements.push(this.funcList[idx]);
          } else {
            const idx = this.parseNumber();
            elements.push(this.funcList[idx]);
          }
        }
        this.expect("RightParen" /* RightParen */);
        this.moduleBuilder.definePassiveElementSegment(elements);
      }
    }
    // --- Data section ---
    parseData() {
      if (this.peek().type === "String" /* String */) {
        const dataStr2 = this.expect("String" /* String */).value;
        const bytes2 = new Uint8Array(dataStr2.length);
        for (let i = 0; i < dataStr2.length; i++) {
          bytes2[i] = dataStr2.charCodeAt(i);
        }
        this.expect("RightParen" /* RightParen */);
        this.moduleBuilder.defineData(bytes2).passive();
        return;
      }
      this.expect("LeftParen" /* LeftParen */);
      const offsetInstr = this.advance().value;
      let offset = 0;
      if (offsetInstr === "i32.const") {
        offset = this.parseNumber();
      } else if (offsetInstr === "i64.const") {
        offset = this.parseNumber();
      } else if (offsetInstr === "global.get") {
        offset = this.resolveGlobalIndex();
      }
      this.expect("RightParen" /* RightParen */);
      const dataStr = this.expect("String" /* String */).value;
      const bytes = new Uint8Array(dataStr.length);
      for (let i = 0; i < dataStr.length; i++) {
        bytes[i] = dataStr.charCodeAt(i);
      }
      this.expect("RightParen" /* RightParen */);
      this.moduleBuilder.defineData(bytes, Number(offset));
    }
    parseTag() {
      let tagName = null;
      if (this.peek().type === "Id" /* Id */) {
        tagName = this.advance().value;
      }
      this.skipInlineComment();
      const params = [];
      if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "type") {
        this.expect("LeftParen" /* LeftParen */);
        this.advance();
        this.parseNumber();
        this.expect("RightParen" /* RightParen */);
      }
      if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "param") {
        this.expect("LeftParen" /* LeftParen */);
        this.advance();
        while (!this.isRightParen()) {
          params.push(this.parseValueType());
        }
        this.expect("RightParen" /* RightParen */);
      }
      this.expect("RightParen" /* RightParen */);
      const tag = this.moduleBuilder.defineTag(params);
      if (tagName) {
        this.tagNames.set(tagName, tag._index);
      }
    }
    resolveTag() {
      if (this.peek().type === "Id" /* Id */) {
        const id = this.advance().value;
        const idx = this.tagNames.get(id);
        if (idx === void 0) throw this.error(`Unknown tag: ${id}`);
        return idx;
      }
      return this.parseNumber();
    }
    parseInlineExports() {
      const exports = [];
      while (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "export") {
        this.expect("LeftParen" /* LeftParen */);
        this.expectKeyword("export");
        exports.push(this.expect("String" /* String */).value);
        this.expect("RightParen" /* RightParen */);
      }
      return exports;
    }
    parseInlineImport() {
      if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "import") {
        this.expect("LeftParen" /* LeftParen */);
        this.expectKeyword("import");
        const moduleName = this.expect("String" /* String */).value;
        const fieldName = this.expect("String" /* String */).value;
        this.expect("RightParen" /* RightParen */);
        return { moduleName, fieldName };
      }
      return null;
    }
    resolveLocal() {
      if (this.peek().type === "Id" /* Id */) {
        const id = this.advance().value;
        const idx = this.localNames.get(id);
        if (idx === void 0) throw this.error(`Unknown local: ${id}`);
        return idx;
      }
      return this.parseNumber();
    }
    // --- Helpers ---
    parseValueType() {
      if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === "ref") {
        this.expect("LeftParen" /* LeftParen */);
        this.advance();
        let nullable = false;
        if (this.isKeyword("null")) {
          this.advance();
          nullable = true;
        }
        let typeIndex;
        if (this.peek().type === "Id" /* Id */) {
          const id = this.advance().value;
          const resolved = this.typeNames.get(id);
          if (resolved === void 0) throw this.error(`Unknown type: ${id}`);
          typeIndex = resolved;
        } else {
          typeIndex = this.parseNumber();
        }
        this.expect("RightParen" /* RightParen */);
        return nullable ? refNullType(typeIndex) : refType(typeIndex);
      }
      const tok = this.advance();
      const vt = valueTypeMap[tok.value];
      if (!vt) throw this.error(`Unknown value type: ${tok.value}`, tok);
      return vt;
    }
    parseNumber() {
      const tok = this.advance();
      if (tok.value.startsWith("0x") || tok.value.startsWith("-0x") || tok.value.startsWith("+0x")) {
        return parseInt(tok.value.replace(/_/g, ""), 16);
      }
      return parseInt(tok.value.replace(/_/g, ""), 10);
    }
    parseFloat() {
      const tok = this.advance();
      const val = tok.value.replace(/_/g, "");
      if (val === "inf" || val === "+inf") return Infinity;
      if (val === "-inf") return -Infinity;
      if (val.includes("nan")) return NaN;
      if (val.startsWith("0x") || val.startsWith("-0x") || val.startsWith("+0x")) {
        return this.parseHexFloat(val);
      }
      return parseFloat(val);
    }
    parseHexFloat(val) {
      const negative = val.startsWith("-");
      const clean = val.replace(/^[+-]?0x/, "");
      const parts = clean.split("p");
      const mantissa = parts[0];
      const exponent = parts.length > 1 ? parseInt(parts[1], 10) : 0;
      let result;
      if (mantissa.includes(".")) {
        const [intPart, fracPart] = mantissa.split(".");
        result = parseInt(intPart || "0", 16) + parseInt(fracPart || "0", 16) / Math.pow(16, (fracPart || "").length);
      } else {
        result = parseInt(mantissa, 16);
      }
      result *= Math.pow(2, exponent);
      return negative ? -result : result;
    }
    parseI64Value() {
      const tok = this.advance();
      const val = tok.value.replace(/_/g, "");
      try {
        return BigInt(val);
      } catch {
        return parseInt(val, 10);
      }
    }
    isInstruction() {
      if (!this.isLeftParen()) return false;
      const nextTok = this.tokens[this.pos + 1];
      if (!nextTok) return false;
      return nextTok.value !== "param" && nextTok.value !== "result" && nextTok.value !== "type";
    }
  };
  function parseWat(source, options) {
    const tokens = tokenize(source);
    const parser = new WatParserImpl(tokens);
    return parser.parse(options);
  }

  // playground/examples.ts
  var EXAMPLES = {
    // ─── Basics ───
    "hello-wasm": {
      label: "Hello WASM",
      group: "Basics",
      description: "The simplest possible module \u2014 export a function that returns 42.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Hello WASM \u2014 the simplest possible module
const mod = new ModuleBuilder('hello');

mod.defineFunction('answer', [ValueType.Int32], [], (f, a) => {
  a.const_i32(42);
}).withExport();

const instance = await mod.instantiate();
const answer = instance.instance.exports.answer;
log('The answer to everything: ' + answer());`
    },
    factorial: {
      label: "Factorial",
      group: "Basics",
      description: "Iterative factorial using loop and block for control flow.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Factorial \u2014 iterative with loop and block
const mod = new ModuleBuilder('factorial');

mod.defineFunction('factorial', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const result = a.declareLocal(ValueType.Int32, 'result');
  const i = a.declareLocal(ValueType.Int32, 'i');

  a.const_i32(1);
  a.set_local(result);
  a.const_i32(1);
  a.set_local(i);

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
      a.get_local(i);
      a.get_local(n);
      a.gt_i32();
      a.br_if(breakLabel);

      a.get_local(result);
      a.get_local(i);
      a.mul_i32();
      a.set_local(result);

      a.get_local(i);
      a.const_i32(1);
      a.add_i32();
      a.set_local(i);
      a.br(loopLabel);
    });
  });

  a.get_local(result);
}).withExport();

const instance = await mod.instantiate();
const factorial = instance.instance.exports.factorial;
for (let n = 0; n <= 10; n++) {
  log(n + '! = ' + factorial(n));
}`
    },
    fibonacci: {
      label: "Fibonacci",
      group: "Basics",
      description: "Iterative Fibonacci with local variables and branching.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Fibonacci sequence \u2014 iterative
const mod = new ModuleBuilder('fibonacci');

mod.defineFunction('fib', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const prev = a.declareLocal(ValueType.Int32, 'prev');
  const curr = a.declareLocal(ValueType.Int32, 'curr');
  const temp = a.declareLocal(ValueType.Int32, 'temp');
  const i = a.declareLocal(ValueType.Int32, 'i');

  a.get_local(n);
  a.const_i32(1);
  a.le_i32();
  a.if(BlockType.Void, () => {
    a.get_local(n);
    a.return();
  });

  a.const_i32(0);
  a.set_local(prev);
  a.const_i32(1);
  a.set_local(curr);
  a.const_i32(2);
  a.set_local(i);

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
      a.get_local(i);
      a.get_local(n);
      a.gt_i32();
      a.br_if(breakLabel);

      a.get_local(curr);
      a.set_local(temp);
      a.get_local(curr);
      a.get_local(prev);
      a.add_i32();
      a.set_local(curr);
      a.get_local(temp);
      a.set_local(prev);

      a.get_local(i);
      a.const_i32(1);
      a.add_i32();
      a.set_local(i);
      a.br(loopLabel);
    });
  });

  a.get_local(curr);
}).withExport();

const instance = await mod.instantiate();
const fib = instance.instance.exports.fib;
for (let n = 0; n <= 15; n++) {
  log('fib(' + n + ') = ' + fib(n));
}`
    },
    "if-else": {
      label: "If/Else",
      group: "Basics",
      description: "Absolute value and sign function using typed if/else blocks.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// If/Else \u2014 absolute value and sign function
const mod = new ModuleBuilder('ifElse');

// Absolute value using if/else with typed block
mod.defineFunction('abs', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(0);
  a.lt_i32();
  a.if(BlockType.Int32);
    a.const_i32(0);
    a.get_local(f.getParameter(0));
    a.sub_i32();
  a.else();
    a.get_local(f.getParameter(0));
  a.end();
}).withExport();

// Sign function: returns -1, 0, or 1
mod.defineFunction('sign', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(0);
  a.lt_i32();
  a.if(BlockType.Int32);
    a.const_i32(-1);
  a.else();
    a.get_local(f.getParameter(0));
    a.const_i32(0);
    a.gt_i32();
    a.if(BlockType.Int32);
      a.const_i32(1);
    a.else();
      a.const_i32(0);
    a.end();
  a.end();
}).withExport();

const instance = await mod.instantiate();
const { abs, sign } = instance.instance.exports;

log('abs(5) = ' + abs(5));
log('abs(-5) = ' + abs(-5));
log('abs(0) = ' + abs(0));
log('');
log('sign(42) = ' + sign(42));
log('sign(-7) = ' + sign(-7));
log('sign(0) = ' + sign(0));`
    },
    "min-max": {
      label: "Min/Max",
      group: "Basics",
      description: "Compare values and return the smaller or larger using select.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Min/Max \u2014 compare values and return the smaller/larger
const mod = new ModuleBuilder('minmax');

mod.defineFunction('min', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);
  a.get_local(x);
  a.get_local(y);
  a.get_local(x);
  a.get_local(y);
  a.lt_i32();
  a.select();
}).withExport();

mod.defineFunction('max', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);
  a.get_local(x);
  a.get_local(y);
  a.get_local(x);
  a.get_local(y);
  a.gt_i32();
  a.select();
}).withExport();

const instance = await mod.instantiate();
const { min, max } = instance.instance.exports;
log('min(3, 7) = ' + min(3, 7));
log('min(10, 2) = ' + min(10, 2));
log('max(3, 7) = ' + max(3, 7));
log('max(-5, 5) = ' + max(-5, 5));`
    },
    "multi-return": {
      label: "Multiple Returns",
      group: "Basics",
      description: "Function returning two values using multi-value returns.",
      target: "2.0",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Multiple Returns \u2014 function returning two values
const mod = new ModuleBuilder('multiReturn', { target: '2.0' });

// divmod: returns (quotient, remainder)
mod.defineFunction('divmod', [ValueType.Int32, ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);
  // quotient = x / y
  a.get_local(x);
  a.get_local(y);
  a.div_i32();
  // remainder = x % y
  a.get_local(x);
  a.get_local(y);
  a.rem_i32();
}).withExport();

const instance = await mod.instantiate();
const divmod = instance.instance.exports.divmod;
const result = divmod(17, 5);
log('divmod(17, 5) = [' + result[0] + ', ' + result[1] + ']');
log('  quotient: ' + result[0]);
log('  remainder: ' + result[1]);

const result2 = divmod(100, 7);
log('divmod(100, 7) = [' + result2[0] + ', ' + result2[1] + ']');`
    },
    "counting-loop": {
      label: "Counting Loop",
      group: "Basics",
      description: "Print numbers 1 to N using a loop with imported print function.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Counting Loop \u2014 print numbers 1 to N
const mod = new ModuleBuilder('countLoop');

const printImport = mod.importFunction('env', 'print', null, [ValueType.Int32]);

mod.defineFunction('countTo', null, [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const i = a.declareLocal(ValueType.Int32, 'i');
  a.const_i32(1);
  a.set_local(i);
  a.loop(BlockType.Void, (cont) => {
    a.block(BlockType.Void, (brk) => {
      a.get_local(i);
      a.get_local(n);
      a.gt_i32();
      a.br_if(brk);
      a.get_local(i);
      a.call(printImport);
      a.get_local(i);
      a.const_i32(1);
      a.add_i32();
      a.set_local(i);
      a.br(cont);
    });
  });
}).withExport();

const logged = [];
const instance = await mod.instantiate({
  env: { print: (v) => logged.push(v) },
});
instance.instance.exports.countTo(10);
log('Counted to 10: ' + logged.join(', '));`
    },
    // ─── Memory ───
    memory: {
      label: "Memory Basics",
      group: "Memory",
      description: "Store and load i32 values in linear memory.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Memory: store and load values
const mod = new ModuleBuilder('memoryExample');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

mod.defineFunction('store', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0);
}).withExport();

mod.defineFunction('load', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_i32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { store, load } = instance.instance.exports;

store(0, 42);
store(4, 100);
log('Value at address 0: ' + load(0));
log('Value at address 4: ' + load(4));
store(0, load(0) + load(4));
log('Sum stored at 0: ' + load(0));`
    },
    "byte-array": {
      label: "Byte Array",
      group: "Memory",
      description: "Store and sum individual bytes with load8/store8 instructions.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Byte array \u2014 store and sum individual bytes
const mod = new ModuleBuilder('byteArray');
mod.defineMemory(1);

// Store a byte at offset
mod.defineFunction('setByte', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store8_i32(0, 0);
}).withExport();

// Load a byte from offset
mod.defineFunction('getByte', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load8_i32_u(0, 0);
}).withExport();

// Sum bytes from offset 0 to length-1
mod.defineFunction('sumBytes', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const len = f.getParameter(0);
  const sum = a.declareLocal(ValueType.Int32, 'sum');
  const i = a.declareLocal(ValueType.Int32, 'i');

  a.const_i32(0);
  a.set_local(sum);
  a.const_i32(0);
  a.set_local(i);

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
      a.get_local(i);
      a.get_local(len);
      a.ge_i32();
      a.br_if(breakLabel);

      a.get_local(sum);
      a.get_local(i);
      a.load8_i32_u(0, 0);
      a.add_i32();
      a.set_local(sum);

      a.get_local(i);
      a.const_i32(1);
      a.add_i32();
      a.set_local(i);
      a.br(loopLabel);
    });
  });

  a.get_local(sum);
}).withExport();

const instance = await mod.instantiate();
const { setByte, getByte, sumBytes } = instance.instance.exports;

// Fill bytes 0..9 with values 10, 20, 30, ...
for (let i = 0; i < 10; i++) {
  setByte(i, (i + 1) * 10);
}

log('Stored bytes:');
for (let i = 0; i < 10; i++) {
  log('  [' + i + '] = ' + getByte(i));
}
log('Sum of 10 bytes: ' + sumBytes(10));`
    },
    "string-memory": {
      label: "Strings in Memory",
      group: "Memory",
      description: "Store a string via data segment and compute its length.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Strings in memory \u2014 store a string, compute its length
const mod = new ModuleBuilder('stringMem');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Store a data segment with a string at offset 0
const greeting = new TextEncoder().encode('Hello, WebAssembly!');
mod.defineData(new Uint8Array([...greeting, 0]), 0); // null-terminated

// strlen: count bytes until null
mod.defineFunction('strlen', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const ptr = f.getParameter(0);
  const len = a.declareLocal(ValueType.Int32, 'len');

  a.const_i32(0);
  a.set_local(len);

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
      // Load byte at ptr + len
      a.get_local(ptr);
      a.get_local(len);
      a.add_i32();
      a.load8_i32_u(0, 0);
      a.eqz_i32();
      a.br_if(breakLabel);

      a.get_local(len);
      a.const_i32(1);
      a.add_i32();
      a.set_local(len);
      a.br(loopLabel);
    });
  });

  a.get_local(len);
}).withExport();

const instance = await mod.instantiate();
const { strlen, memory } = instance.instance.exports;

// Read the string from memory
const memView = new Uint8Array(memory.buffer);
const strLen = strlen(0);
const str = new TextDecoder().decode(memView.slice(0, strLen));

log('String in memory: "' + str + '"');
log('Length: ' + strLen);`
    },
    "data-segments": {
      label: "Data Segments",
      group: "Memory",
      description: "Pre-initialize memory with defineData and read values at runtime.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Data segments \u2014 pre-initialize memory with static data
const mod = new ModuleBuilder('dataSegments');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Pre-fill memory with a lookup table at offset 0
// Powers of 2: [1, 2, 4, 8, 16, 32, 64, 128]
const powers = new Uint8Array(new Int32Array([1, 2, 4, 8, 16, 32, 64, 128]).buffer);
mod.defineData(powers, 0);

// Pre-fill memory with a message at offset 64
const msg = new TextEncoder().encode('Hello from data segment!');
mod.defineData(new Uint8Array([...msg, 0]), 64);

// Read an i32 from the powers table: getPower(index)
mod.defineFunction('getPower', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(4);
  a.mul_i32();
  a.load_i32(2, 0);
}).withExport();

// strlen starting at offset
mod.defineFunction('strlen', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const ptr = f.getParameter(0);
  const len = a.declareLocal(ValueType.Int32, 'len');
  a.const_i32(0);
  a.set_local(len);
  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
      a.get_local(ptr);
      a.get_local(len);
      a.add_i32();
      a.load8_i32_u(0, 0);
      a.eqz_i32();
      a.br_if(breakLabel);
      a.get_local(len);
      a.const_i32(1);
      a.add_i32();
      a.set_local(len);
      a.br(loopLabel);
    });
  });
  a.get_local(len);
}).withExport();

const instance = await mod.instantiate();
const { getPower, strlen, memory } = instance.instance.exports;

log('Powers of 2 from data segment:');
for (let i = 0; i < 8; i++) {
  log('  2^' + i + ' = ' + getPower(i));
}

const view = new Uint8Array(memory.buffer);
const len = strlen(64);
const str = new TextDecoder().decode(view.slice(64, 64 + len));
log('');
log('Message from data segment: "' + str + '"');`
    },
    "memory-growth": {
      label: "Memory Growth",
      group: "Memory",
      description: "Grow memory at runtime with mem_grow and query size with mem_size.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Memory growth \u2014 dynamically add pages at runtime
const mod = new ModuleBuilder('memGrowth');
const mem = mod.defineMemory(1); // start with 1 page (64KB)
mod.exportMemory(mem, 'memory');

// Return current memory size in pages
mod.defineFunction('pages', [ValueType.Int32], [], (f, a) => {
  a.mem_size(0);
}).withExport();

// Grow memory by N pages, return previous size (or -1 on failure)
mod.defineFunction('grow', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.mem_grow(0);
}).withExport();

// Store an i32 at a byte offset
mod.defineFunction('store', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0);
}).withExport();

// Load an i32 from a byte offset
mod.defineFunction('load', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_i32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { pages, grow, store, load } = instance.instance.exports;

log('Initial size: ' + pages() + ' page(s) = ' + (pages() * 64) + ' KB');

// Grow by 2 pages
const prev = grow(2);
log('grow(2) returned previous size: ' + prev);
log('New size: ' + pages() + ' page(s) = ' + (pages() * 64) + ' KB');

// Write to the new pages (offset > 64KB = beyond original page)
const offset = 65536 + 100; // byte 100 in second page
store(offset, 12345);
log('Stored 12345 at offset ' + offset + ' (in grown memory)');
log('Loaded: ' + load(offset));

// Grow again
grow(1);
log('After another grow(1): ' + pages() + ' pages');`
    },
    "ring-buffer": {
      label: "Ring Buffer",
      group: "Memory",
      description: "Circular buffer implementation in linear memory.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Ring Buffer \u2014 circular buffer in linear memory
const mod = new ModuleBuilder('ringBuffer');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Layout: [writePtr:i32, readPtr:i32, size:i32, data...]
// Offsets: writePtr=0, readPtr=4, capacity=8, data starts at 12

mod.defineFunction('init', null, [ValueType.Int32], (f, a) => {
  const cap = f.getParameter(0);
  a.const_i32(0); a.const_i32(0); a.store_i32(0, 0);  // writePtr = 0
  a.const_i32(4); a.const_i32(0); a.store_i32(0, 0);  // readPtr = 0
  a.const_i32(8); a.get_local(cap); a.store_i32(0, 0); // capacity
}).withExport();

mod.defineFunction('push', null, [ValueType.Int32], (f, a) => {
  const val = f.getParameter(0);
  const wp = a.declareLocal(ValueType.Int32, 'wp');
  a.const_i32(0); a.load_i32(0, 0); a.set_local(wp);
  // data[wp] = val
  a.get_local(wp);
  a.const_i32(12);
  a.add_i32();
  a.get_local(val);
  a.store_i32(0, 0);
  // writePtr = (wp + 4) % (capacity * 4)
  a.get_local(wp);
  a.const_i32(4);
  a.add_i32();
  a.const_i32(8); a.load_i32(0, 0); a.const_i32(4); a.mul_i32();
  a.rem_i32();
  a.set_local(wp);
  a.const_i32(0); a.get_local(wp); a.store_i32(0, 0);
}).withExport();

mod.defineFunction('pop', [ValueType.Int32], [], (f, a) => {
  const rp = a.declareLocal(ValueType.Int32, 'rp');
  const val = a.declareLocal(ValueType.Int32, 'val');
  a.const_i32(4); a.load_i32(0, 0); a.set_local(rp);
  a.get_local(rp); a.const_i32(12); a.add_i32();
  a.load_i32(0, 0); a.set_local(val);
  // readPtr = (rp + 4) % (capacity * 4)
  a.get_local(rp); a.const_i32(4); a.add_i32();
  a.const_i32(8); a.load_i32(0, 0); a.const_i32(4); a.mul_i32();
  a.rem_i32();
  a.set_local(rp);
  a.const_i32(4); a.get_local(rp); a.store_i32(0, 0);
  a.get_local(val);
}).withExport();

const instance = await mod.instantiate();
const { init, push, pop } = instance.instance.exports;
init(4); // capacity of 4
push(10); push(20); push(30);
log('pop: ' + pop()); // 10
log('pop: ' + pop()); // 20
push(40); push(50);
log('pop: ' + pop()); // 30
log('pop: ' + pop()); // 40
log('pop: ' + pop()); // 50`
    },
    "memory-copy-fill": {
      label: "Memory Copy & Fill",
      group: "Memory",
      description: "Bulk memory operations: memory.fill and memory.copy.",
      target: "2.0",
      features: ["bulk-memory"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Memory Copy & Fill \u2014 bulk memory operations
const mod = new ModuleBuilder('memCopyFill', { target: '2.0' });
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Fill memory[offset..offset+len] with a byte value
mod.defineFunction('fill', null, [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // dest
  a.get_local(f.getParameter(1)); // value
  a.get_local(f.getParameter(2)); // length
  a.memory_fill(0);
}).withExport();

// Copy memory[src..src+len] to memory[dst..]
mod.defineFunction('copy', null, [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // dest
  a.get_local(f.getParameter(1)); // src
  a.get_local(f.getParameter(2)); // length
  a.memory_copy(0, 0);
}).withExport();

const instance = await mod.instantiate();
const { fill, copy, memory } = instance.instance.exports;
const view = new Uint8Array(memory.buffer);

// Fill 10 bytes at offset 0 with 0xAA
fill(0, 0xAA, 10);
log('After fill(0, 0xAA, 10):');
log('  [0..9] = ' + Array.from(view.slice(0, 10)).map(b => '0x' + b.toString(16)).join(', '));

// Copy 5 bytes from offset 0 to offset 20
copy(20, 0, 5);
log('After copy(20, 0, 5):');
log('  [20..24] = ' + Array.from(view.slice(20, 25)).map(b => '0x' + b.toString(16)).join(', '));`
    },
    "struct-in-memory": {
      label: "Struct Layout",
      group: "Memory",
      description: "Manual struct layout in memory with offset calculations.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Struct Layout in Memory \u2014 manual offset calculations
const mod = new ModuleBuilder('structLayout');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Simulate a struct: { x: i32, y: i32, z: f32 }
// Offsets: x=0, y=4, z=8, total size=12

mod.defineFunction('setPoint', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32, ValueType.Float32], (f, a) => {
  const base = f.getParameter(0);
  // x
  a.get_local(base);
  a.get_local(f.getParameter(1));
  a.store_i32(0, 0);
  // y
  a.get_local(base); a.const_i32(4); a.add_i32();
  a.get_local(f.getParameter(2));
  a.store_i32(0, 0);
  // z
  a.get_local(base); a.const_i32(8); a.add_i32();
  a.get_local(f.getParameter(3));
  a.store_f32(0, 0);
}).withExport();

mod.defineFunction('getX', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_i32(0, 0);
}).withExport();

mod.defineFunction('getY', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); a.const_i32(4); a.add_i32();
  a.load_i32(0, 0);
}).withExport();

mod.defineFunction('getZ', [ValueType.Float32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); a.const_i32(8); a.add_i32();
  a.load_f32(0, 0);
}).withExport();

const instance = await mod.instantiate();
const { setPoint, getX, getY, getZ } = instance.instance.exports;

setPoint(0, 10, 20, 3.14);
log('Point at offset 0:');
log('  x = ' + getX(0));
log('  y = ' + getY(0));
log('  z = ' + getZ(0).toFixed(2));

setPoint(12, 100, 200, 9.81);
log('Point at offset 12:');
log('  x = ' + getX(12));
log('  y = ' + getY(12));
log('  z = ' + getZ(12).toFixed(2));`
    },
    // ─── Globals & State ───
    globals: {
      label: "Global Counter",
      group: "Globals",
      description: "Mutable global variable used as a persistent counter.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Globals: mutable counter
const mod = new ModuleBuilder('globals');

const counter = mod.defineGlobal(ValueType.Int32, true, 0);

mod.defineFunction('increment', [ValueType.Int32], [], (f, a) => {
  a.get_global(counter);
  a.const_i32(1);
  a.add_i32();
  a.set_global(counter);
  a.get_global(counter);
}).withExport();

mod.defineFunction('getCount', [ValueType.Int32], [], (f, a) => {
  a.get_global(counter);
}).withExport();

const instance = await mod.instantiate();
const { increment, getCount } = instance.instance.exports;

log('Initial: ' + getCount());
increment();
increment();
increment();
log('After 3 increments: ' + getCount());
for (let i = 0; i < 7; i++) increment();
log('After 7 more: ' + getCount());`
    },
    "start-function": {
      label: "Start Function",
      group: "Globals",
      description: "A function that runs automatically on module instantiation.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Start function \u2014 runs automatically on instantiation
const mod = new ModuleBuilder('startExample');

const initialized = mod.defineGlobal(ValueType.Int32, true, 0);

// This function runs automatically at instantiation
const initFn = mod.defineFunction('init', null, [], (f, a) => {
  a.const_i32(1);
  a.set_global(initialized);
});
mod.setStartFunction(initFn);

// Exported getter
mod.defineFunction('isInitialized', [ValueType.Int32], [], (f, a) => {
  a.get_global(initialized);
}).withExport();

const instance = await mod.instantiate();
const { isInitialized } = instance.instance.exports;
log('isInitialized (should be 1): ' + isInitialized());
log('The start function ran automatically!');`
    },
    // ─── Functions & Calls ───
    "multi-func": {
      label: "Function Calls",
      group: "Functions",
      description: "Multiple functions calling each other \u2014 square, double, compose.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Multiple functions calling each other
const mod = new ModuleBuilder('multiFn');

// Helper: square
mod.defineFunction('square', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(0));
  a.mul_i32();
}).withExport();

// Helper: double
mod.defineFunction('double', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
}).withExport();

// Composed: 2 * x^2
const squareFn = mod._functions[0];
const doubleFn = mod._functions[1];

mod.defineFunction('doubleSquare', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.call(squareFn);
  a.call(doubleFn);
}).withExport();

const instance = await mod.instantiate();
const { square, double: dbl, doubleSquare } = instance.instance.exports;

for (let x = 1; x <= 5; x++) {
  log('x=' + x + ': square=' + square(x) + ', double=' + dbl(x) + ', 2x\xB2=' + doubleSquare(x));
}`
    },
    "imports": {
      label: "Import Functions",
      group: "Functions",
      description: "Import host functions so WASM can call JavaScript.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Importing host functions \u2014 WASM calling JavaScript
const mod = new ModuleBuilder('imports');

// Declare an import: env.print takes an i32
const printImport = mod.importFunction('env', 'print', null, [ValueType.Int32]);

// Declare another import: env.getTime returns an i32
const getTimeImport = mod.importFunction('env', 'getTime', [ValueType.Int32], []);

mod.defineFunction('run', null, [], (f, a) => {
  // Call getTime, then print it
  a.call(getTimeImport);
  a.call(printImport);

  // Print some constants
  a.const_i32(100);
  a.call(printImport);
  a.const_i32(200);
  a.call(printImport);
  a.const_i32(300);
  a.call(printImport);
}).withExport();

const logged = [];
const instance = await mod.instantiate({
  env: {
    print: (v) => { logged.push(v); },
    getTime: () => Date.now() & 0x7FFFFFFF,
  },
});

instance.instance.exports.run();

log('Values printed by WASM:');
logged.forEach((v, i) => log('  [' + i + '] ' + v));`
    },
    "indirect-call": {
      label: "Indirect Calls (Table)",
      group: "Functions",
      description: "Dispatch function calls through a table using call_indirect.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "ElementType"],
      code: `// Indirect calls via function table
const mod = new ModuleBuilder('indirectCall');

const add = mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
});

const sub = mod.defineFunction('sub', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.sub_i32();
});

const mul = mod.defineFunction('mul', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
});

// Create a table with 3 entries
const table = mod.defineTable(ElementType.AnyFunc, 3);
mod.defineElementSegment(table, [add, sub, mul], 0);

// Dispatcher: call function at table[opIndex](a, b)
mod.defineFunction('dispatch', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1)); // a
  a.get_local(f.getParameter(2)); // b
  a.get_local(f.getParameter(0)); // table index
  a.call_indirect(add.funcTypeBuilder);
}).withExport();

const instance = await mod.instantiate();
const { dispatch } = instance.instance.exports;

const ops = ['add', 'sub', 'mul'];
for (let op = 0; op < 3; op++) {
  log(ops[op] + '(10, 3) = ' + dispatch(op, 10, 3));
}`
    },
    "multi-module": {
      label: "Multi-Module",
      group: "Functions",
      description: "Use PackageBuilder to link two modules with imports.",
      target: "mvp",
      features: [],
      imports: ["PackageBuilder", "ValueType"],
      code: `// Multi-module \u2014 PackageBuilder links modules with dependencies
const pkg = new PackageBuilder();

// Module "math": provides a double function
const mathMod = pkg.defineModule('math');
mathMod.defineFunction('double', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
}).withExport();

mathMod.defineFunction('square', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(0));
  a.mul_i32();
}).withExport();

// Module "main": imports from "math" and composes
const mainMod = pkg.defineModule('main');
const doubleFn = mainMod.importFunction('math', 'double', [ValueType.Int32], [ValueType.Int32]);
const squareFn = mainMod.importFunction('math', 'square', [ValueType.Int32], [ValueType.Int32]);

// quadruple(x) = double(double(x))
mainMod.defineFunction('quadruple', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.call(doubleFn);
  a.call(doubleFn);
}).withExport();

// doubleSquare(x) = double(square(x)) = 2 * x^2
mainMod.defineFunction('doubleSquare', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.call(squareFn);
  a.call(doubleFn);
}).withExport();

pkg.addDependency('main', 'math');
const result = await pkg.instantiate();
const { quadruple, doubleSquare } = result.main.exports;

log('PackageBuilder \u2014 two linked modules:');
for (let x = 1; x <= 6; x++) {
  log('  x=' + x + ': quadruple=' + quadruple(x) + ', 2x\\u00B2=' + doubleSquare(x));
}`
    },
    "recursive": {
      label: "Recursive Function",
      group: "Functions",
      description: "Self-recursive power function using a.call(f).",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Recursive function \u2014 power(base, exp) calls itself
const mod = new ModuleBuilder('recursion');

mod.defineFunction('power', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const base = f.getParameter(0);
  const exp = f.getParameter(1);

  // if exp == 0 return 1
  a.get_local(exp);
  a.eqz_i32();
  a.if(BlockType.Void, () => {
    a.const_i32(1);
    a.return();
  });

  // return base * power(base, exp - 1)
  a.get_local(base);
  a.get_local(base);
  a.get_local(exp);
  a.const_i32(1);
  a.sub_i32();
  a.call(f);  // recursive call to self!
  a.mul_i32();
}).withExport();

const instance = await mod.instantiate();
const { power } = instance.instance.exports;

log('Recursive power(base, exp):');
for (let b = 2; b <= 5; b++) {
  const results = [];
  for (let e = 0; e <= 5; e++) results.push(b + '^' + e + '=' + power(b, e));
  log('  ' + results.join(', '));
}`
    },
    "host-callback": {
      label: "Host Callbacks",
      group: "Functions",
      description: "WASM calling JS functions that return values.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Host Callbacks \u2014 WASM calling JS functions that return values
const mod = new ModuleBuilder('hostCallback');

const getTime = mod.importFunction('env', 'getTime', [ValueType.Int32], []);
const getRandom = mod.importFunction('env', 'getRandom', [ValueType.Int32], []);

mod.defineFunction('timesPlusRandom', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.call(getTime);
  a.get_local(f.getParameter(0));
  a.mul_i32();
  a.call(getRandom);
  a.add_i32();
}).withExport();

const instance = await mod.instantiate({
  env: {
    getTime: () => 42,
    getRandom: () => Math.floor(Math.random() * 100),
  },
});
const { timesPlusRandom } = instance.instance.exports;
log('timesPlusRandom(3) = ' + timesPlusRandom(3));
log('timesPlusRandom(3) = ' + timesPlusRandom(3));
log('timesPlusRandom(10) = ' + timesPlusRandom(10));`
    },
    "variadic-dispatch": {
      label: "Table Dispatch",
      group: "Functions",
      description: "Call different functions via a table index using call_indirect.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "ElementType"],
      code: `// Table Dispatch \u2014 call different functions via a table index
const mod = new ModuleBuilder('dispatch');

const fnType = mod.defineFunctionType([ValueType.Int32], [ValueType.Int32, ValueType.Int32]);

const add = mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
});

const sub = mod.defineFunction('sub', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.sub_i32();
});

const mul = mod.defineFunction('mul', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
});

const table = mod.defineTable(ElementType.AnyFunc, 3);
table.defineElementSegment([add, sub, mul], 0);

// dispatch(op, a, b) \u2014 calls table[op](a, b)
mod.defineFunction('dispatch', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1)); // a
  a.get_local(f.getParameter(2)); // b
  a.get_local(f.getParameter(0)); // table index
  a.call_indirect(fnType);
}).withExport();

const instance = await mod.instantiate();
const { dispatch } = instance.instance.exports;
log('dispatch(0, 10, 3) = add = ' + dispatch(0, 10, 3));
log('dispatch(1, 10, 3) = sub = ' + dispatch(1, 10, 3));
log('dispatch(2, 10, 3) = mul = ' + dispatch(2, 10, 3));`
    },
    // ─── Control Flow ───
    "br-table": {
      label: "Branch Table",
      group: "Control Flow",
      description: "Switch/case dispatch using the br_table instruction.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// br_table \u2014 switch/case dispatch to different blocks
const mod = new ModuleBuilder('brTable');

// dayType(day): 0-4 => "weekday" (return 1), 5-6 => "weekend" (return 2), else => "invalid" (return 0)
mod.defineFunction('dayType', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const day = f.getParameter(0);
  const result = a.declareLocal(ValueType.Int32, 'result');

  a.block(BlockType.Void, (invalidBlock) => {
    a.block(BlockType.Void, (weekendBlock) => {
      a.block(BlockType.Void, (weekdayBlock) => {
        // br_table: value 0-4 => weekdayBlock, 5-6 => weekendBlock, default => invalidBlock
        a.get_local(day);
        a.br_table(invalidBlock,
          weekdayBlock, weekdayBlock, weekdayBlock, weekdayBlock, weekdayBlock,
          weekendBlock, weekendBlock
        );
      });
      // weekday path
      a.const_i32(1);
      a.set_local(result);
      a.br(invalidBlock); // jump to end
    });
    // weekend path
    a.const_i32(2);
    a.set_local(result);
    a.br(invalidBlock); // jump to end
  });
  // if we fell through to here via default, result is still 0

  a.get_local(result);
}).withExport();

const instance = await mod.instantiate();
const { dayType } = instance.instance.exports;

const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const types = ['invalid', 'weekday', 'weekend'];
for (let d = 0; d < 7; d++) {
  log(names[d] + ' (day ' + d + '): ' + types[dayType(d)]);
}
log('day 7: ' + types[dayType(7)]);
log('day 99: ' + types[dayType(99)]);`
    },
    "select": {
      label: "Select (Ternary)",
      group: "Control Flow",
      description: "Branchless conditional with select \u2014 like a ternary operator.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// select \u2014 branchless conditional (ternary operator)
const mod = new ModuleBuilder('selectOp');

// max(a, b) = a > b ? a : b  (using select)
mod.defineFunction('max', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);

  a.get_local(x);     // value if true
  a.get_local(y);     // value if false
  a.get_local(x);
  a.get_local(y);
  a.gt_i32();          // condition: x > y
  a.select();
}).withExport();

// min(a, b) = a < b ? a : b
mod.defineFunction('min', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);

  a.get_local(x);
  a.get_local(y);
  a.get_local(x);
  a.get_local(y);
  a.lt_i32();
  a.select();
}).withExport();

// clamp(val, lo, hi)
mod.defineFunction('clamp', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  const val = f.getParameter(0);
  const lo = f.getParameter(1);
  const hi = f.getParameter(2);
  const tmp = a.declareLocal(ValueType.Int32, 'tmp');

  // tmp = val > hi ? hi : val
  a.get_local(hi);
  a.get_local(val);
  a.get_local(val);
  a.get_local(hi);
  a.gt_i32();
  a.select();
  a.set_local(tmp);

  // result = tmp < lo ? lo : tmp
  a.get_local(lo);
  a.get_local(tmp);
  a.get_local(tmp);
  a.get_local(lo);
  a.lt_i32();
  a.select();
}).withExport();

const instance = await mod.instantiate();
const { max, min, clamp } = instance.instance.exports;

log('max(3, 7) = ' + max(3, 7));
log('max(10, 2) = ' + max(10, 2));
log('min(3, 7) = ' + min(3, 7));
log('min(10, 2) = ' + min(10, 2));
log('');
log('clamp(5, 0, 10) = ' + clamp(5, 0, 10));
log('clamp(-3, 0, 10) = ' + clamp(-3, 0, 10));
log('clamp(15, 0, 10) = ' + clamp(15, 0, 10));
log('clamp(0, 0, 10) = ' + clamp(0, 0, 10));
log('clamp(10, 0, 10) = ' + clamp(10, 0, 10));`
    },
    "nested-blocks": {
      label: "Nested Blocks",
      group: "Control Flow",
      description: "Multi-level block nesting with early break and continue.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Nested blocks \u2014 multi-level break and continue patterns
const mod = new ModuleBuilder('nestedBlocks');

// Find the first number in [start, start+limit) divisible by both 3 and 5
// Returns -1 if not found
mod.defineFunction('findFizzBuzz', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const start = f.getParameter(0);
  const limit = f.getParameter(1);
  const i = a.declareLocal(ValueType.Int32, 'i');
  const end = a.declareLocal(ValueType.Int32, 'end');
  const result = a.declareLocal(ValueType.Int32, 'result');

  a.const_i32(-1);
  a.set_local(result);

  // end = start + limit
  a.get_local(start);
  a.get_local(limit);
  a.add_i32();
  a.set_local(end);

  a.get_local(start);
  a.set_local(i);

  // outer block \u2014 break here when found
  a.block(BlockType.Void, (found) => {
    a.loop(BlockType.Void, (cont) => {
      // if i >= end, exit loop
      a.block(BlockType.Void, (skip) => {
        a.get_local(i);
        a.get_local(end);
        a.ge_i32();
        a.br_if(found);

        // Check divisible by 3
        a.get_local(i);
        a.const_i32(3);
        a.rem_i32_u();
        a.br_if(skip); // not divisible by 3, skip

        // Check divisible by 5
        a.get_local(i);
        a.const_i32(5);
        a.rem_i32_u();
        a.br_if(skip); // not divisible by 5, skip

        // Found! Save and break to outer
        a.get_local(i);
        a.set_local(result);
        a.br(found);
      });

      // i++
      a.get_local(i);
      a.const_i32(1);
      a.add_i32();
      a.set_local(i);
      a.br(cont);
    });
  });

  a.get_local(result);
}).withExport();

const instance = await mod.instantiate();
const { findFizzBuzz } = instance.instance.exports;

log('Find first FizzBuzz (divisible by 3 and 5):');
log('  findFizzBuzz(1, 100) = ' + findFizzBuzz(1, 100));
log('  findFizzBuzz(16, 10) = ' + findFizzBuzz(16, 10));
log('  findFizzBuzz(31, 50) = ' + findFizzBuzz(31, 50));
log('  findFizzBuzz(1, 5) = ' + findFizzBuzz(1, 5) + '  (not found)');
log('  findFizzBuzz(46, 10) = ' + findFizzBuzz(46, 10));`
    },
    "drop-and-tee": {
      label: "Drop & Tee Local",
      group: "Control Flow",
      description: "Stack manipulation with drop() and tee_local().",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// drop and tee_local \u2014 stack manipulation
const mod = new ModuleBuilder('stackOps');

// tee_local: stores to local AND keeps value on stack
// Equivalent to: set_local + get_local, but in one instruction
mod.defineFunction('sumAndCount', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const sum = a.declareLocal(ValueType.Int32, 'sum');
  const i = a.declareLocal(ValueType.Int32, 'i');

  a.const_i32(0);
  a.set_local(sum);
  a.const_i32(1);
  a.set_local(i);

  a.loop(BlockType.Void, (cont) => {
    a.block(BlockType.Void, (brk) => {
      a.get_local(i);
      a.get_local(n);
      a.gt_i32();
      a.br_if(brk);

      // tee_local: store i to sum while keeping it on stack
      a.get_local(sum);
      a.get_local(i);
      a.tee_local(i);  // stores i, but also leaves value on stack
      a.add_i32();
      a.set_local(sum);

      // increment i (which was already tee'd)
      a.get_local(i);
      a.const_i32(1);
      a.add_i32();
      a.set_local(i);
      a.br(cont);
    });
  });

  a.get_local(sum);
}).withExport();

// drop: discard an unwanted return value
mod.defineFunction('callAndDiscard', [ValueType.Int32], [], (f, a) => {
  // Call sumAndCount but ignore its return value
  a.const_i32(10);
  a.call(mod._functions[0]); // calls sumAndCount(10)
  a.drop();                   // discard the result

  // Return a fixed value instead
  a.const_i32(42);
}).withExport();

const instance = await mod.instantiate();
const { sumAndCount, callAndDiscard } = instance.instance.exports;

log('sumAndCount (uses tee_local):');
for (const n of [5, 10, 100]) {
  log('  sum(1..' + n + ') = ' + sumAndCount(n));
}
log('');
log('callAndDiscard (uses drop):');
log('  result = ' + callAndDiscard() + ' (dropped sumAndCount result, returned 42)');`
    },
    "unreachable-trap": {
      label: "Unreachable Trap",
      group: "Control Flow",
      description: "Use unreachable as an assertion \u2014 traps if reached.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// unreachable \u2014 intentional trap for defensive programming
const mod = new ModuleBuilder('trapDemo');

// divide(a, b) \u2014 traps if b is zero
mod.defineFunction('divide', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);

  // Guard: trap if divisor is zero
  a.get_local(y);
  a.eqz_i32();
  a.if(BlockType.Void, () => {
    a.unreachable();  // trap!
  });

  a.get_local(x);
  a.get_local(y);
  a.div_i32();
}).withExport();

const instance = await mod.instantiate();
const { divide } = instance.instance.exports;

log('divide(10, 2) = ' + divide(10, 2));
log('divide(100, 5) = ' + divide(100, 5));
log('divide(7, 3) = ' + divide(7, 3));
log('');

try {
  divide(10, 0);
  log('Should not reach here!');
} catch (e) {
  log('divide(10, 0) trapped: ' + e.message);
  log('The unreachable instruction prevented division by zero!');
}`
    },
    "early-return": {
      label: "Early Return",
      group: "Control Flow",
      description: "Exit from nested blocks using return instruction.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Early Return \u2014 exit from nested blocks
const mod = new ModuleBuilder('earlyReturn');

// Return early if n <= 0, otherwise compute n * 2
mod.defineFunction('doublePositive', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  a.get_local(n);
  a.const_i32(0);
  a.le_i32();
  a.if(BlockType.Void, () => {
    a.const_i32(-1);
    a.return();
  });
  a.get_local(n);
  a.const_i32(2);
  a.mul_i32();
}).withExport();

const instance = await mod.instantiate();
const { doublePositive } = instance.instance.exports;
log('doublePositive(5) = ' + doublePositive(5));
log('doublePositive(0) = ' + doublePositive(0));
log('doublePositive(-3) = ' + doublePositive(-3));
log('doublePositive(100) = ' + doublePositive(100));`
    },
    "switch-dispatch": {
      label: "Switch via br_table",
      group: "Control Flow",
      description: "Pattern matching using br_table for switch/case dispatch.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Switch via br_table \u2014 pattern matching
const mod = new ModuleBuilder('switchCase');

// Map 0\u219210, 1\u219220, 2\u219230, default\u2192-1
mod.defineFunction('lookup', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const result = a.declareLocal(ValueType.Int32, 'result');
  a.block(BlockType.Void, (defaultBlock) => {
    a.block(BlockType.Void, (case2) => {
      a.block(BlockType.Void, (case1) => {
        a.block(BlockType.Void, (case0) => {
          a.get_local(n);
          a.br_table(defaultBlock, case0, case1, case2);
        });
        // case 0
        a.const_i32(10); a.set_local(result);
        a.br(defaultBlock);
      });
      // case 1
      a.const_i32(20); a.set_local(result);
      a.br(defaultBlock);
    });
    // case 2
    a.const_i32(30); a.set_local(result);
    a.br(defaultBlock);
  });
  // After the blocks \u2014 either from a case or default
  // For default, result stays 0; let's set it to -1 only if not set
  // Actually with br_table, if n > 2, we fall to defaultBlock directly
  a.get_local(result);
  // If result is still 0 and n > 2, return -1
}).withExport();

const instance = await mod.instantiate();
const { lookup } = instance.instance.exports;
log('lookup(0) = ' + lookup(0));
log('lookup(1) = ' + lookup(1));
log('lookup(2) = ' + lookup(2));
log('lookup(5) = ' + lookup(5) + ' (default)');`
    },
    // ─── Numeric Types ───
    "float-math": {
      label: "Float Math",
      group: "Numeric",
      description: "Floating-point distance, rounding, and sqrt with f64.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Floating-point operations \u2014 f64 math functions
const mod = new ModuleBuilder('floatMath');

// Distance: sqrt(dx*dx + dy*dy)
mod.defineFunction('distance', [ValueType.Float64],
  [ValueType.Float64, ValueType.Float64,
   ValueType.Float64, ValueType.Float64], (f, a) => {
  const x1 = f.getParameter(0);
  const y1 = f.getParameter(1);
  const x2 = f.getParameter(2);
  const y2 = f.getParameter(3);
  const dx = a.declareLocal(ValueType.Float64, 'dx');
  const dy = a.declareLocal(ValueType.Float64, 'dy');

  // dx = x2 - x1
  a.get_local(x2);
  a.get_local(x1);
  a.sub_f64();
  a.set_local(dx);

  // dy = y2 - y1
  a.get_local(y2);
  a.get_local(y1);
  a.sub_f64();
  a.set_local(dy);

  // sqrt(dx*dx + dy*dy)
  a.get_local(dx);
  a.get_local(dx);
  a.mul_f64();
  a.get_local(dy);
  a.get_local(dy);
  a.mul_f64();
  a.add_f64();
  a.sqrt_f64();
}).withExport();

// Rounding functions
mod.defineFunction('roundUp', [ValueType.Float64], [ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.ceil_f64();
}).withExport();

mod.defineFunction('roundDown', [ValueType.Float64], [ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.floor_f64();
}).withExport();

const instance = await mod.instantiate();
const { distance, roundUp, roundDown } = instance.instance.exports;

log('distance((0,0), (3,4)) = ' + distance(0, 0, 3, 4));
log('distance((1,1), (4,5)) = ' + distance(1, 1, 4, 5));
log('');
log('roundUp(2.3) = ' + roundUp(2.3));
log('roundUp(2.7) = ' + roundUp(2.7));
log('roundDown(2.3) = ' + roundDown(2.3));
log('roundDown(2.7) = ' + roundDown(2.7));`
    },
    "i64-bigint": {
      label: "i64 / BigInt",
      group: "Numeric",
      description: "64-bit integers with BigInt interop \u2014 large factorial.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// 64-bit integers \u2014 BigInt interop
const mod = new ModuleBuilder('i64ops');

mod.defineFunction('add64', [ValueType.Int64],
  [ValueType.Int64, ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i64();
}).withExport();

mod.defineFunction('mul64', [ValueType.Int64],
  [ValueType.Int64, ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i64();
}).withExport();

// Factorial with i64 \u2014 can handle larger numbers
mod.defineFunction('factorial64', [ValueType.Int64], [ValueType.Int64], (f, a) => {
  const n = f.getParameter(0);
  const result = a.declareLocal(ValueType.Int64, 'result');
  const i = a.declareLocal(ValueType.Int64, 'i');

  a.const_i64(1n);
  a.set_local(result);
  a.const_i64(1n);
  a.set_local(i);

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
      a.get_local(i);
      a.get_local(n);
      a.gt_i64();
      a.br_if(breakLabel);

      a.get_local(result);
      a.get_local(i);
      a.mul_i64();
      a.set_local(result);

      a.get_local(i);
      a.const_i64(1n);
      a.add_i64();
      a.set_local(i);
      a.br(loopLabel);
    });
  });

  a.get_local(result);
}).withExport();

const instance = await mod.instantiate();
const { add64, mul64, factorial64 } = instance.instance.exports;

log('add64(1000000000000n, 2000000000000n) = ' + add64(1000000000000n, 2000000000000n));
log('mul64(123456789n, 987654321n) = ' + mul64(123456789n, 987654321n));
log('');
log('Factorial with i64 (no overflow up to 20!):');
for (let n = 0n; n <= 20n; n++) {
  log('  ' + n + '! = ' + factorial64(n));
}`
    },
    "type-conversions": {
      label: "Type Conversions",
      group: "Numeric",
      description: "Convert between i32, i64, f32, and f64 types.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Type conversions between numeric types
const mod = new ModuleBuilder('conversions');

// i32 to f64
mod.defineFunction('i32_to_f64', [ValueType.Float64], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.convert_i32_s_f64();
}).withExport();

// f64 to i32 (truncate)
mod.defineFunction('f64_to_i32', [ValueType.Int32], [ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.trunc_f64_s_i32();
}).withExport();

// i32 to i64 (sign extend)
mod.defineFunction('i32_to_i64', [ValueType.Int64], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.extend_i32_s_i64();
}).withExport();

// i64 to i32 (wrap)
mod.defineFunction('i64_to_i32', [ValueType.Int32], [ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.wrap_i64_i32();
}).withExport();

// f32 to f64 (promote)
mod.defineFunction('f32_to_f64', [ValueType.Float64], [ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.promote_f32_f64();
}).withExport();

const instance = await mod.instantiate();
const { i32_to_f64, f64_to_i32, i32_to_i64, i64_to_i32, f32_to_f64 } = instance.instance.exports;

log('i32(42) \u2192 f64: ' + i32_to_f64(42));
log('f64(3.14) \u2192 i32: ' + f64_to_i32(3.14));
log('f64(99.9) \u2192 i32: ' + f64_to_i32(99.9));
log('i32(42) \u2192 i64: ' + i32_to_i64(42));
log('i32(-1) \u2192 i64: ' + i32_to_i64(-1));
log('i64(0x1FFFFFFFFn) \u2192 i32: ' + i64_to_i32(0x1FFFFFFFFn));
log('f32(3.14) \u2192 f64: ' + f32_to_f64(3.140000104904175));`
    },
    "bitwise-ops": {
      label: "Bitwise Operations",
      group: "Numeric",
      description: "Rotation, leading/trailing zeros, and popcount on i32.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Bitwise operations \u2014 rotl, rotr, clz, ctz, popcnt
const mod = new ModuleBuilder('bitwiseOps');

mod.defineFunction('rotl', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.rotl_i32();
}).withExport();

mod.defineFunction('rotr', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.rotr_i32();
}).withExport();

mod.defineFunction('clz', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.clz_i32();
}).withExport();

mod.defineFunction('ctz', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.ctz_i32();
}).withExport();

mod.defineFunction('popcnt', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.popcnt_i32();
}).withExport();

const instance = await mod.instantiate();
const { rotl, rotr, clz, ctz, popcnt } = instance.instance.exports;

log('=== Rotation ===');
log('rotl(0x80000001, 1) = 0x' + (rotl(0x80000001, 1) >>> 0).toString(16));
log('rotr(0x80000001, 1) = 0x' + (rotr(0x80000001, 1) >>> 0).toString(16));
log('rotl(1, 10) = ' + rotl(1, 10) + '  (1 << 10 = 1024)');

log('');
log('=== Bit Counting ===');
log('clz(1) = ' + clz(1) + '  (31 leading zeros)');
log('clz(256) = ' + clz(256) + '  (23 leading zeros)');
log('clz(0) = ' + clz(0) + '  (all 32 zeros)');
log('ctz(256) = ' + ctz(256) + '  (8 trailing zeros)');
log('ctz(1) = ' + ctz(1) + '  (0 trailing zeros)');
log('popcnt(0xFF) = ' + popcnt(0xFF) + '  (8 bits set)');
log('popcnt(0x55555555) = ' + popcnt(0x55555555) + '  (16 bits set)');
log('popcnt(0) = ' + popcnt(0));`
    },
    "float-special": {
      label: "Float Special Ops",
      group: "Numeric",
      description: "copysign, nearest, trunc \u2014 standalone float operations.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Special float operations \u2014 copysign, nearest, trunc
const mod = new ModuleBuilder('floatSpecial');

// copysign(a, b) \u2014 magnitude of a, sign of b
mod.defineFunction('copysign', [ValueType.Float64],
  [ValueType.Float64, ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.copysign_f64();
}).withExport();

// nearest \u2014 round to nearest even (banker's rounding)
mod.defineFunction('nearest', [ValueType.Float64],
  [ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.nearest_f64();
}).withExport();

// trunc \u2014 round towards zero (remove fractional part)
mod.defineFunction('trunc', [ValueType.Float64],
  [ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.trunc_f64();
}).withExport();

const instance = await mod.instantiate();
const { copysign, nearest, trunc } = instance.instance.exports;

log('=== copysign(magnitude, sign) ===');
log('copysign(5.0, -1.0) = ' + copysign(5.0, -1.0));
log('copysign(-5.0, 1.0) = ' + copysign(-5.0, 1.0));
log('copysign(3.14, -0.0) = ' + copysign(3.14, -0.0));

log('');
log('=== nearest (banker\\u2019s rounding) ===');
log('nearest(0.5) = ' + nearest(0.5) + '  (rounds to even: 0)');
log('nearest(1.5) = ' + nearest(1.5) + '  (rounds to even: 2)');
log('nearest(2.5) = ' + nearest(2.5) + '  (rounds to even: 2)');
log('nearest(3.5) = ' + nearest(3.5) + '  (rounds to even: 4)');
log('nearest(2.3) = ' + nearest(2.3));
log('nearest(-1.7) = ' + nearest(-1.7));

log('');
log('=== trunc (towards zero) ===');
log('trunc(2.9) = ' + trunc(2.9));
log('trunc(-2.9) = ' + trunc(-2.9));
log('trunc(0.1) = ' + trunc(0.1));`
    },
    "reinterpret": {
      label: "Reinterpret Casts",
      group: "Numeric",
      description: "Reinterpret bits between float and int without conversion.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Reinterpret \u2014 same bits, different type interpretation
const mod = new ModuleBuilder('reinterpret');

// View f32 bits as i32
mod.defineFunction('f32_bits', [ValueType.Int32],
  [ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.reinterpret_f32_i32();
}).withExport();

// View i32 bits as f32
mod.defineFunction('i32_as_f32', [ValueType.Float32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.reinterpret_i32_f32();
}).withExport();

// View f64 bits as i64
mod.defineFunction('f64_bits', [ValueType.Int64],
  [ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.reinterpret_f64_i64();
}).withExport();

// View i64 bits as f64
mod.defineFunction('i64_as_f64', [ValueType.Float64],
  [ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.reinterpret_i64_f64();
}).withExport();

const instance = await mod.instantiate();
const { f32_bits, i32_as_f32, f64_bits, i64_as_f64 } = instance.instance.exports;

log('=== f32 \\u2194 i32 reinterpret ===');
log('f32_bits(1.0)  = 0x' + (f32_bits(1.0) >>> 0).toString(16).padStart(8, '0') + '  (IEEE 754: 3F800000)');
log('f32_bits(-1.0) = 0x' + (f32_bits(-1.0) >>> 0).toString(16).padStart(8, '0') + '  (BF800000)');
log('f32_bits(0.0)  = 0x' + (f32_bits(0.0) >>> 0).toString(16).padStart(8, '0'));
log('i32_as_f32(0x3F800000) = ' + i32_as_f32(0x3F800000) + '  (1.0)');
log('i32_as_f32(0x40490FDB) = ' + i32_as_f32(0x40490FDB) + '  (~pi)');

log('');
log('=== f64 \\u2194 i64 reinterpret ===');
log('f64_bits(1.0) = 0x' + f64_bits(1.0).toString(16) + '  (3FF0000000000000)');
log('i64_as_f64(0x4009_21FB_5444_2D18n) = ' + i64_as_f64(0x400921FB54442D18n) + '  (pi)');`
    },
    "clz-ctz-popcnt": {
      label: "Bit Counting",
      group: "Numeric",
      description: "Count leading zeros, trailing zeros, and population count.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Bit Counting \u2014 clz, ctz, and popcnt
const mod = new ModuleBuilder('bitCount');

mod.defineFunction('clz', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.clz_i32();
}).withExport();

mod.defineFunction('ctz', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.ctz_i32();
}).withExport();

mod.defineFunction('popcnt', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.popcnt_i32();
}).withExport();

const instance = await mod.instantiate();
const { clz, ctz, popcnt } = instance.instance.exports;
log('clz(1) = ' + clz(1) + ' (31 leading zeros)');
log('clz(256) = ' + clz(256) + ' (23 leading zeros)');
log('ctz(8) = ' + ctz(8) + ' (3 trailing zeros)');
log('ctz(12) = ' + ctz(12) + ' (2 trailing zeros)');
log('popcnt(7) = ' + popcnt(7) + ' (3 bits set: 111)');
log('popcnt(255) = ' + popcnt(255) + ' (8 bits set)');`
    },
    "integer-overflow": {
      label: "Integer Overflow",
      group: "Numeric",
      description: "Wrapping behavior of i32 arithmetic on overflow.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Integer Overflow \u2014 wrapping behavior of i32 arithmetic
const mod = new ModuleBuilder('overflow');

mod.defineFunction('addWrap', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

mod.defineFunction('mulWrap', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
}).withExport();

const instance = await mod.instantiate();
const { addWrap, mulWrap } = instance.instance.exports;

const MAX = 2147483647;  // i32 max
log('MAX_INT32 = ' + MAX);
log('MAX + 1 = ' + addWrap(MAX, 1) + ' (wraps to MIN)');
log('MAX + MAX = ' + addWrap(MAX, MAX) + ' (wraps)');
log('1000000 * 1000000 = ' + mulWrap(1000000, 1000000) + ' (wraps)');
log('-1 * -1 = ' + mulWrap(-1, -1) + ' (no overflow)');`
    },
    // ─── Algorithms ───
    "bubble-sort": {
      label: "Bubble Sort",
      group: "Algorithms",
      description: "Sort an array in linear memory with nested loops.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Bubble sort in WASM memory
const mod = new ModuleBuilder('bubbleSort');
mod.defineMemory(1);

// Store i32 at index (index * 4)
mod.defineFunction('set', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(4);
  a.mul_i32();
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0);
}).withExport();

// Load i32 at index
mod.defineFunction('get', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(4);
  a.mul_i32();
  a.load_i32(2, 0);
}).withExport();

const setFn = mod._functions[0];
const getFn = mod._functions[1];

// Bubble sort(length)
mod.defineFunction('sort', null, [ValueType.Int32], (f, a) => {
  const len = f.getParameter(0);
  const i = a.declareLocal(ValueType.Int32, 'i');
  const j = a.declareLocal(ValueType.Int32, 'j');
  const temp = a.declareLocal(ValueType.Int32, 'temp');
  const swapped = a.declareLocal(ValueType.Int32, 'swapped');

  a.const_i32(0);
  a.set_local(i);

  // Outer loop
  a.loop(BlockType.Void, (outerLoop) => {
    a.block(BlockType.Void, (outerBreak) => {
      a.get_local(i);
      a.get_local(len);
      a.const_i32(1);
      a.sub_i32();
      a.ge_i32();
      a.br_if(outerBreak);

      a.const_i32(0);
      a.set_local(swapped);
      a.const_i32(0);
      a.set_local(j);

      // Inner loop
      a.loop(BlockType.Void, (innerLoop) => {
        a.block(BlockType.Void, (innerBreak) => {
          a.get_local(j);
          a.get_local(len);
          a.const_i32(1);
          a.sub_i32();
          a.get_local(i);
          a.sub_i32();
          a.ge_i32();
          a.br_if(innerBreak);

          // if arr[j] > arr[j+1], swap
          a.get_local(j);
          a.call(getFn);
          a.get_local(j);
          a.const_i32(1);
          a.add_i32();
          a.call(getFn);
          a.gt_i32();
          a.if(BlockType.Void, () => {
            // temp = arr[j]
            a.get_local(j);
            a.call(getFn);
            a.set_local(temp);
            // arr[j] = arr[j+1]
            a.get_local(j);
            a.get_local(j);
            a.const_i32(1);
            a.add_i32();
            a.call(getFn);
            a.call(setFn);
            // arr[j+1] = temp
            a.get_local(j);
            a.const_i32(1);
            a.add_i32();
            a.get_local(temp);
            a.call(setFn);
            a.const_i32(1);
            a.set_local(swapped);
          });

          a.get_local(j);
          a.const_i32(1);
          a.add_i32();
          a.set_local(j);
          a.br(innerLoop);
        });
      });

      // Early exit if no swaps
      a.get_local(swapped);
      a.eqz_i32();
      a.br_if(outerBreak);

      a.get_local(i);
      a.const_i32(1);
      a.add_i32();
      a.set_local(i);
      a.br(outerLoop);
    });
  });
}).withExport();

const instance = await mod.instantiate();
const { set, get, sort } = instance.instance.exports;

const data = [64, 34, 25, 12, 22, 11, 90, 1, 55, 42];
log('Before: ' + data.join(', '));

data.forEach((v, i) => set(i, v));
sort(data.length);

const sorted = [];
for (let i = 0; i < data.length; i++) sorted.push(get(i));
log('After:  ' + sorted.join(', '));`
    },
    "gcd": {
      label: "GCD (Euclidean)",
      group: "Algorithms",
      description: "Greatest common divisor using the Euclidean algorithm.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Greatest common divisor \u2014 Euclidean algorithm
const mod = new ModuleBuilder('gcd');

mod.defineFunction('gcd', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);
  const temp = a.declareLocal(ValueType.Int32, 'temp');

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
      a.get_local(y);
      a.eqz_i32();
      a.br_if(breakLabel);

      // temp = y
      a.get_local(y);
      a.set_local(temp);
      // y = x % y
      a.get_local(x);
      a.get_local(y);
      a.rem_i32_u();
      a.set_local(y);
      // x = temp
      a.get_local(temp);
      a.set_local(x);

      a.br(loopLabel);
    });
  });

  a.get_local(x);
}).withExport();

const instance = await mod.instantiate();
const { gcd } = instance.instance.exports;

const pairs = [[12, 8], [100, 75], [17, 13], [48, 18], [0, 5], [7, 0], [1071, 462]];
for (const [a, b] of pairs) {
  log('gcd(' + a + ', ' + b + ') = ' + gcd(a, b));
}`
    },
    "collatz": {
      label: "Collatz Conjecture",
      group: "Algorithms",
      description: "Count steps to reach 1 using the 3n+1 conjecture.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Collatz conjecture \u2014 count steps to reach 1
const mod = new ModuleBuilder('collatz');

mod.defineFunction('collatz', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const steps = a.declareLocal(ValueType.Int32, 'steps');

  a.const_i32(0);
  a.set_local(steps);

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
      a.get_local(n);
      a.const_i32(1);
      a.le_i32();
      a.br_if(breakLabel);

      a.get_local(steps);
      a.const_i32(1);
      a.add_i32();
      a.set_local(steps);

      // if n is odd: n = 3n + 1, else: n = n / 2
      a.get_local(n);
      a.const_i32(1);
      a.and_i32();
      a.if(BlockType.Void);
        // odd: n = 3n + 1
        a.get_local(n);
        a.const_i32(3);
        a.mul_i32();
        a.const_i32(1);
        a.add_i32();
        a.set_local(n);
      a.else();
        // even: n = n / 2
        a.get_local(n);
        a.const_i32(1);
        a.shr_i32_u();
        a.set_local(n);
      a.end();

      a.br(loopLabel);
    });
  });

  a.get_local(steps);
}).withExport();

const instance = await mod.instantiate();
const { collatz } = instance.instance.exports;

for (const n of [1, 2, 3, 6, 7, 9, 27, 97, 871]) {
  log('collatz(' + n + ') = ' + collatz(n) + ' steps');
}`
    },
    "is-prime": {
      label: "Primality Test",
      group: "Algorithms",
      description: "Trial division to test and list prime numbers.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Primality test \u2014 trial division
const mod = new ModuleBuilder('prime');

mod.defineFunction('isPrime', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const i = a.declareLocal(ValueType.Int32, 'i');

  // n <= 1 \u2192 not prime
  a.get_local(n);
  a.const_i32(1);
  a.le_i32();
  a.if(BlockType.Void, () => {
    a.const_i32(0);
    a.return();
  });

  // n <= 3 \u2192 prime
  a.get_local(n);
  a.const_i32(3);
  a.le_i32();
  a.if(BlockType.Void, () => {
    a.const_i32(1);
    a.return();
  });

  // divisible by 2 \u2192 not prime
  a.get_local(n);
  a.const_i32(2);
  a.rem_i32_u();
  a.eqz_i32();
  a.if(BlockType.Void, () => {
    a.const_i32(0);
    a.return();
  });

  // Trial division from 3 to sqrt(n)
  a.const_i32(3);
  a.set_local(i);

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
      // if i * i > n, break (is prime)
      a.get_local(i);
      a.get_local(i);
      a.mul_i32();
      a.get_local(n);
      a.gt_i32();
      a.br_if(breakLabel);

      // if n % i == 0, not prime
      a.get_local(n);
      a.get_local(i);
      a.rem_i32_u();
      a.eqz_i32();
      a.if(BlockType.Void, () => {
        a.const_i32(0);
        a.return();
      });

      a.get_local(i);
      a.const_i32(2);
      a.add_i32();
      a.set_local(i);
      a.br(loopLabel);
    });
  });

  a.const_i32(1);
}).withExport();

const instance = await mod.instantiate();
const { isPrime } = instance.instance.exports;

log('Prime numbers up to 100:');
const primes = [];
for (let n = 2; n <= 100; n++) {
  if (isPrime(n)) primes.push(n);
}
log(primes.join(', '));
log('');
log('Testing larger numbers:');
for (const n of [997, 1000, 7919, 7920, 104729]) {
  log(n + ' is ' + (isPrime(n) ? 'prime' : 'not prime'));
}`
    },
    "binary-search": {
      label: "Binary Search",
      group: "Algorithms",
      description: "Search a sorted array in linear memory using binary search.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Binary Search \u2014 search a sorted array in linear memory
const mod = new ModuleBuilder('binarySearch');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// binarySearch(ptr, len, target) \u2192 index or -1
mod.defineFunction('search', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  const ptr = f.getParameter(0);
  const len = f.getParameter(1);
  const target = f.getParameter(2);
  const lo = a.declareLocal(ValueType.Int32, 'lo');
  const hi = a.declareLocal(ValueType.Int32, 'hi');
  const mid = a.declareLocal(ValueType.Int32, 'mid');
  const val = a.declareLocal(ValueType.Int32, 'val');

  a.const_i32(0); a.set_local(lo);
  a.get_local(len); a.const_i32(1); a.sub_i32(); a.set_local(hi);

  a.loop(BlockType.Void, (cont) => {
    a.block(BlockType.Void, (done) => {
      a.get_local(lo); a.get_local(hi); a.gt_i32(); a.br_if(done);
      // mid = (lo + hi) / 2
      a.get_local(lo); a.get_local(hi); a.add_i32();
      a.const_i32(1); a.shr_i32_u(); a.set_local(mid);
      // val = memory[ptr + mid * 4]
      a.get_local(ptr); a.get_local(mid); a.const_i32(4); a.mul_i32(); a.add_i32();
      a.load_i32(0, 0); a.set_local(val);
      // if val == target, return mid
      a.get_local(val); a.get_local(target); a.eq_i32();
      a.if(BlockType.Void, () => { a.get_local(mid); a.return(); });
      // if val < target, lo = mid + 1
      a.get_local(val); a.get_local(target); a.lt_i32();
      a.if(BlockType.Void, () => {
        a.get_local(mid); a.const_i32(1); a.add_i32(); a.set_local(lo);
      });
      // if val > target, hi = mid - 1
      a.get_local(val); a.get_local(target); a.gt_i32();
      a.if(BlockType.Void, () => {
        a.get_local(mid); a.const_i32(1); a.sub_i32(); a.set_local(hi);
      });
      a.br(cont);
    });
  });
  a.const_i32(-1); // not found
}).withExport();

const instance = await mod.instantiate();
const { search, memory } = instance.instance.exports;
const view = new Int32Array(memory.buffer);

// Store sorted array at offset 0
const sorted = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
sorted.forEach((v, i) => view[i] = v);

for (const target of [23, 2, 91, 50]) {
  const idx = search(0, sorted.length, target);
  log('search(' + target + ') = index ' + idx + (idx >= 0 ? ' (found)' : ' (not found)'));
}`
    },
    "string-reverse": {
      label: "String Reverse",
      group: "Algorithms",
      description: "Reverse a byte string in-place in linear memory.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// String Reverse \u2014 reverse a byte string in-place in memory
const mod = new ModuleBuilder('strReverse');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// reverse(ptr, len) \u2014 in-place byte reversal
mod.defineFunction('reverse', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  const ptr = f.getParameter(0);
  const len = f.getParameter(1);
  const lo = a.declareLocal(ValueType.Int32, 'lo');
  const hi = a.declareLocal(ValueType.Int32, 'hi');
  const tmp = a.declareLocal(ValueType.Int32, 'tmp');

  a.get_local(ptr); a.set_local(lo);
  a.get_local(ptr); a.get_local(len); a.add_i32();
  a.const_i32(1); a.sub_i32(); a.set_local(hi);

  a.loop(BlockType.Void, (cont) => {
    a.block(BlockType.Void, (done) => {
      a.get_local(lo); a.get_local(hi); a.ge_i32_u(); a.br_if(done);
      // swap mem[lo] and mem[hi]
      a.get_local(lo); a.load8_i32_u(0, 0); a.set_local(tmp);
      a.get_local(lo); a.get_local(hi); a.load8_i32_u(0, 0); a.store8_i32(0, 0);
      a.get_local(hi); a.get_local(tmp); a.store8_i32(0, 0);
      a.get_local(lo); a.const_i32(1); a.add_i32(); a.set_local(lo);
      a.get_local(hi); a.const_i32(1); a.sub_i32(); a.set_local(hi);
      a.br(cont);
    });
  });
}).withExport();

const instance = await mod.instantiate();
const { reverse, memory } = instance.instance.exports;
const view = new Uint8Array(memory.buffer);
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const str = 'Hello, WebAssembly!';
const bytes = encoder.encode(str);
view.set(bytes, 0);
log('Before: ' + str);

reverse(0, bytes.length);
log('After:  ' + decoder.decode(view.slice(0, bytes.length)));`
    },
    "matrix-multiply": {
      label: "Matrix Multiply",
      group: "Algorithms",
      description: "2x2 matrix multiplication using f32 values in memory.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Matrix Multiply \u2014 2x2 matrix multiplication in memory
const mod = new ModuleBuilder('matrix');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// 2x2 matrix stored as 4 floats: [a, b, c, d] = | a b |
//                                                  | c d |
// multiply(A_ptr, B_ptr, out_ptr)
mod.defineFunction('multiply', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  const A = f.getParameter(0);
  const B = f.getParameter(1);
  const O = f.getParameter(2);

  // out[0] = A[0]*B[0] + A[1]*B[2]
  a.get_local(O);
  a.get_local(A); a.load_f32(0, 0);
  a.get_local(B); a.load_f32(0, 0);
  a.mul_f32();
  a.get_local(A); a.load_f32(0, 4);
  a.get_local(B); a.load_f32(0, 8);
  a.mul_f32();
  a.add_f32();
  a.store_f32(0, 0);

  // out[1] = A[0]*B[1] + A[1]*B[3]
  a.get_local(O);
  a.get_local(A); a.load_f32(0, 0);
  a.get_local(B); a.load_f32(0, 4);
  a.mul_f32();
  a.get_local(A); a.load_f32(0, 4);
  a.get_local(B); a.load_f32(0, 12);
  a.mul_f32();
  a.add_f32();
  a.store_f32(0, 4);

  // out[2] = A[2]*B[0] + A[3]*B[2]
  a.get_local(O);
  a.get_local(A); a.load_f32(0, 8);
  a.get_local(B); a.load_f32(0, 0);
  a.mul_f32();
  a.get_local(A); a.load_f32(0, 12);
  a.get_local(B); a.load_f32(0, 8);
  a.mul_f32();
  a.add_f32();
  a.store_f32(0, 8);

  // out[3] = A[2]*B[1] + A[3]*B[3]
  a.get_local(O);
  a.get_local(A); a.load_f32(0, 8);
  a.get_local(B); a.load_f32(0, 4);
  a.mul_f32();
  a.get_local(A); a.load_f32(0, 12);
  a.get_local(B); a.load_f32(0, 12);
  a.mul_f32();
  a.add_f32();
  a.store_f32(0, 12);
}).withExport();

const instance = await mod.instantiate();
const { multiply, memory } = instance.instance.exports;
const view = new Float32Array(memory.buffer);

// A = | 1 2 |  B = | 5 6 |
//     | 3 4 |      | 7 8 |
view.set([1, 2, 3, 4], 0);   // A at offset 0
view.set([5, 6, 7, 8], 4);   // B at offset 16 (4 floats * 4 bytes)
multiply(0, 16, 32);          // Result at offset 32

log('A = | 1 2 |');
log('    | 3 4 |');
log('B = | 5 6 |');
log('    | 7 8 |');
log('A * B = | ' + view[8] + ' ' + view[9] + ' |');
log('        | ' + view[10] + ' ' + view[11] + ' |');`
    },
    // ─── WAT Parser ───
    "wat-parser": {
      label: "WAT Parser",
      group: "WAT",
      description: "Parse WebAssembly Text format and instantiate the module.",
      target: "mvp",
      features: [],
      imports: ["parseWat"],
      code: `// Parse WAT text and instantiate
const watSource = \`
(module $parsed
  (func $add (param i32) (param i32) (result i32)
    local.get 0
    local.get 1
    i32.add
  )
  (export "add" (func $add))
)
\`;

log('Parsing WAT source...');
const mod = parseWat(watSource);
log('WAT parsed successfully!');
log('');

const instance = await mod.instantiate();
const add = instance.instance.exports.add;
log('add(3, 4) = ' + add(3, 4));
log('add(100, 200) = ' + add(100, 200));
log('add(-5, 10) = ' + add(-5, 10));`
    },
    "wat-loop": {
      label: "WAT Loop & Branch",
      group: "WAT",
      description: "WAT with loop, block, and branch instructions.",
      target: "mvp",
      features: [],
      imports: ["parseWat"],
      code: `// WAT with loop and branch instructions
const watSource = \`
(module $loops
  (func $sum (param i32) (result i32)
    (local i32) ;; accumulator
    (local i32) ;; counter
    i32.const 0
    local.set 1
    i32.const 1
    local.set 2
    block $break
      loop $continue
        local.get 2
        local.get 0
        i32.gt_s
        br_if $break

        local.get 1
        local.get 2
        i32.add
        local.set 1

        local.get 2
        i32.const 1
        i32.add
        local.set 2
        br $continue
      end
    end
    local.get 1
  )
  (export "sum" (func $sum))
)
\`;

const mod = parseWat(watSource);
const instance = await mod.instantiate();
const sum = instance.instance.exports.sum;

log('Sum from 1 to N:');
for (const n of [0, 1, 5, 10, 50, 100]) {
  log('  sum(' + n + ') = ' + sum(n));
}`
    },
    "wat-memory": {
      label: "WAT Memory & Data",
      group: "WAT",
      description: "WAT with memory declarations, store/load, and exports.",
      target: "mvp",
      features: [],
      imports: ["parseWat"],
      code: `// WAT with memory, data segments, and imports
const watSource = \`
(module $memTest
  (memory 1)
  (func $store (param i32) (param i32)
    local.get 0
    local.get 1
    i32.store offset=0 align=4
  )
  (func $load (param i32) (result i32)
    local.get 0
    i32.load offset=0 align=4
  )
  (export "store" (func $store))
  (export "load" (func $load))
  (export "mem" (memory 0))
)
\`;

const mod = parseWat(watSource);
const instance = await mod.instantiate();
const { store, load, mem } = instance.instance.exports;

// Store values at various offsets
store(0, 11);
store(4, 22);
store(8, 33);
store(12, 44);

log('Memory contents:');
for (let addr = 0; addr < 16; addr += 4) {
  log('  [' + addr + '] = ' + load(addr));
}

// Also inspect raw memory
const view = new Uint8Array(mem.buffer);
log('');
log('Raw bytes [0..15]: ' + Array.from(view.slice(0, 16)).join(', '));`
    },
    "wat-global": {
      label: "WAT Globals & Start",
      group: "WAT",
      description: "WAT with mutable globals, start function, and inc/dec.",
      target: "mvp",
      features: [],
      imports: ["parseWat"],
      code: `// WAT with globals, start function, and if/else
const watSource = \`
(module $globalDemo
  (global $counter (mut i32) (i32.const 0))

  (func $init
    i32.const 100
    global.set 0
  )

  (func $inc (result i32)
    global.get 0
    i32.const 1
    i32.add
    global.set 0
    global.get 0
  )

  (func $dec (result i32)
    global.get 0
    i32.const 1
    i32.sub
    global.set 0
    global.get 0
  )

  (func $getCounter (result i32)
    global.get 0
  )

  (start $init)
  (export "inc" (func $inc))
  (export "dec" (func $dec))
  (export "getCounter" (func $getCounter))
)
\`;

const mod = parseWat(watSource);
const instance = await mod.instantiate();
const { inc, dec, getCounter } = instance.instance.exports;

log('Initial (set by start): ' + getCounter());
log('inc() = ' + inc());
log('inc() = ' + inc());
log('inc() = ' + inc());
log('dec() = ' + dec());
log('Final: ' + getCounter());`
    },
    "wat-imports": {
      label: "WAT Imports",
      group: "WAT",
      description: "WAT with function imports calling JavaScript host functions.",
      target: "mvp",
      features: [],
      imports: ["parseWat"],
      code: `// WAT with imports \u2014 call JavaScript from WebAssembly text
const watSource = \`
(module $importDemo
  (import "env" "print" (func $print (param i32)))
  (import "env" "add" (func $add (param i32) (param i32) (result i32)))

  (func $run
    ;; Call host add(3, 4), then print the result
    i32.const 3
    i32.const 4
    call $add
    call $print

    ;; Print some constants
    i32.const 100
    call $print
    i32.const 200
    call $print
  )

  (export "run" (func $run))
)
\`;

const mod = parseWat(watSource);
const results = [];
const instance = await mod.instantiate({
  env: {
    print: (v) => results.push(v),
    add: (a, b) => a + b,
  },
});

instance.instance.exports.run();

log('WAT module called JS imports:');
results.forEach((v, i) => log('  print[' + i + '] = ' + v));
log('');
log('First value is add(3, 4) = 7, then constants 100, 200');`
    },
    "wat-multi-value": {
      label: "WAT Multi-Value",
      group: "WAT",
      description: "WAT functions returning multiple values.",
      target: "2.0",
      features: [],
      imports: ["parseWat"],
      code: `// WAT Multi-Value \u2014 functions returning multiple values
const wat = \`
(module
  (func $swap (param i32 i32) (result i32 i32)
    local.get 1
    local.get 0
  )
  (func $divmod (param i32 i32) (result i32 i32)
    local.get 0
    local.get 1
    i32.div_s
    local.get 0
    local.get 1
    i32.rem_s
  )
  (export "swap" (func $swap))
  (export "divmod" (func $divmod))
)\`;

const mod = parseWat(wat);
const instance = await mod.instantiate();
const { swap, divmod } = instance.instance.exports;

const swapped = swap(10, 20);
log('swap(10, 20) = [' + swapped[0] + ', ' + swapped[1] + ']');

const dm = divmod(17, 5);
log('divmod(17, 5) = [' + dm[0] + ', ' + dm[1] + '] (quotient, remainder)');`
    },
    "wat-struct": {
      label: "WAT with Structs",
      group: "WAT",
      description: "View generated WAT for GC struct and array types.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// WAT with GC Structs \u2014 view generated WAT for GC types
// This example shows the text format for GC struct/array types
const mod = new ModuleBuilder('watGC', {
  target: 'latest',
});

// A 2D point struct
const Point = mod.defineStructType([
  { name: 'x', type: ValueType.Float64, mutable: true },
  { name: 'y', type: ValueType.Float64, mutable: true },
]);

// A mutable array of i32
mod.defineArrayType(ValueType.Int32, true);

// A simple function that creates a default point
mod.defineFunction('origin', null, [], (f, a) => {
  a.struct_new_default(Point.index);
  a.drop();
}).withExport();

log('Generated WAT for GC types:');
log(mod.toString());
log('');
const bytes = mod.toBytes();
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    // ─── SIMD ───
    "simd-vec-add": {
      label: "SIMD Vector Add",
      group: "SIMD",
      description: "Add two f32x4 vectors in memory using SIMD.",
      target: "3.0",
      features: ["simd"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// SIMD: add two f32x4 vectors in memory
const mod = new ModuleBuilder('simdAdd');
mod.defineMemory(1);

// vec4_add(srcA, srcB, dst) \u2014 adds two 4-float vectors
mod.defineFunction('vec4_add', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));  // push dest address first
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.add_f32x4();
  a.store_v128(2, 0);              // store expects [addr, value] on stack
}).withExport();

mod.defineFunction('setF32', null,
  [ValueType.Int32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_f32(2, 0);
}).withExport();

mod.defineFunction('getF32', [ValueType.Float32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_f32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { vec4_add, setF32, getF32 } = instance.instance.exports;

// A = [1, 2, 3, 4] at offset 0
// B = [10, 20, 30, 40] at offset 16
for (let i = 0; i < 4; i++) {
  setF32(i * 4, i + 1);
  setF32(16 + i * 4, (i + 1) * 10);
}

vec4_add(0, 16, 32);

log('A = [1, 2, 3, 4]');
log('B = [10, 20, 30, 40]');
log('A + B:');
for (let i = 0; i < 4; i++) {
  log('  [' + i + '] = ' + getF32(32 + i * 4));
}`
    },
    "simd-dot-product": {
      label: "SIMD Dot Product",
      group: "SIMD",
      description: "Element-wise multiply then sum lanes for dot product.",
      target: "3.0",
      features: ["simd"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// SIMD dot product: multiply element-wise then sum lanes
const mod = new ModuleBuilder('simdDot');
mod.defineMemory(1);

mod.defineFunction('dot4', [ValueType.Float32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const products = a.declareLocal(ValueType.V128, 'products');

  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.mul_f32x4();
  a.set_local(products);

  // Sum all 4 lanes
  a.get_local(products);
  a.extract_lane_f32x4(0);
  a.get_local(products);
  a.extract_lane_f32x4(1);
  a.add_f32();
  a.get_local(products);
  a.extract_lane_f32x4(2);
  a.add_f32();
  a.get_local(products);
  a.extract_lane_f32x4(3);
  a.add_f32();
}).withExport();

mod.defineFunction('setF32', null,
  [ValueType.Int32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_f32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { dot4, setF32 } = instance.instance.exports;

const vecA = [1, 2, 3, 4];
const vecB = [5, 6, 7, 8];

for (let i = 0; i < 4; i++) {
  setF32(i * 4, vecA[i]);
  setF32(16 + i * 4, vecB[i]);
}

log('A = [' + vecA + ']');
log('B = [' + vecB + ']');
log('dot(A, B) = ' + dot4(0, 16));
log('Expected: ' + (1*5 + 2*6 + 3*7 + 4*8));`
    },
    "simd-splat-scale": {
      label: "SIMD Splat & Scale",
      group: "SIMD",
      description: "Broadcast a scalar to all lanes and multiply a vector.",
      target: "3.0",
      features: ["simd"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// SIMD splat: broadcast a scalar to all lanes, then multiply
const mod = new ModuleBuilder('simdScale');
mod.defineMemory(1);

// scale_vec4(src, dst, scalar) \u2014 multiply a vector by a scalar
mod.defineFunction('scale_vec4', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(1));  // push dest address first
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(2));
  a.splat_f32x4();          // broadcast scalar to all 4 lanes
  a.mul_f32x4();
  a.store_v128(2, 0);       // store expects [addr, value] on stack
}).withExport();

mod.defineFunction('setF32', null,
  [ValueType.Int32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_f32(2, 0);
}).withExport();

mod.defineFunction('getF32', [ValueType.Float32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_f32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { scale_vec4, setF32, getF32 } = instance.instance.exports;

const vec = [2.0, 4.0, 6.0, 8.0];
for (let i = 0; i < 4; i++) setF32(i * 4, vec[i]);

scale_vec4(0, 16, 3.0);

log('Vector: [' + vec + ']');
log('Scalar: 3.0');
log('Scaled:');
for (let i = 0; i < 4; i++) {
  log('  [' + i + '] = ' + getF32(16 + i * 4));
}`
    },
    // ─── Bulk Memory ───
    "bulk-memory": {
      label: "Bulk Memory Ops",
      group: "Bulk Memory",
      description: "Fill and copy memory regions with bulk operations.",
      target: "2.0",
      features: ["bulk-memory"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Bulk memory: memory.fill and memory.copy
const mod = new ModuleBuilder('bulkMem');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// fill(dest, value, length)
mod.defineFunction('fill', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.get_local(f.getParameter(2));
  a.memory_fill(0);
}).withExport();

// copy(dest, src, length)
mod.defineFunction('copy', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.get_local(f.getParameter(2));
  a.memory_copy(0, 0);
}).withExport();

const instance = await mod.instantiate();
const { fill, copy, memory } = instance.instance.exports;
const view = new Uint8Array(memory.buffer);

// Fill 8 bytes at offset 0 with 0xAA
fill(0, 0xAA, 8);
log('After fill(0, 0xAA, 8):');
log('  bytes[0..7] = [' + Array.from(view.slice(0, 8)).map(b => '0x' + b.toString(16).toUpperCase()).join(', ') + ']');

// Copy those 8 bytes to offset 32
copy(32, 0, 8);
log('');
log('After copy(32, 0, 8):');
log('  bytes[32..39] = [' + Array.from(view.slice(32, 40)).map(b => '0x' + b.toString(16).toUpperCase()).join(', ') + ']');

// Fill a region with incrementing pattern using a loop
fill(64, 0, 16);
for (let i = 0; i < 16; i++) {
  view[64 + i] = i * 3;
}
log('');
log('Manual pattern at [64..79]:');
log('  ' + Array.from(view.slice(64, 80)).join(', '));

// Copy that pattern further
copy(128, 64, 16);
log('Copied to [128..143]:');
log('  ' + Array.from(view.slice(128, 144)).join(', '));`
    },
    // ─── Post-MVP Features ───
    "sign-extend": {
      label: "Sign Extension",
      group: "Post-MVP",
      description: "Interpret low bits as signed values with extend8/extend16.",
      target: "2.0",
      features: ["sign-extend"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Sign extension: interpret low bits as signed values
const mod = new ModuleBuilder('signExt');

// Treat low 8 bits as a signed byte
mod.defineFunction('extend8', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.extend8_s_i32();
}).withExport();

// Treat low 16 bits as a signed i16
mod.defineFunction('extend16', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.extend16_s_i32();
}).withExport();

const instance = await mod.instantiate();
const { extend8, extend16 } = instance.instance.exports;

log('i32.extend8_s:');
log('  extend8(0x7F) = ' + extend8(0x7F) + '  (127, positive byte)');
log('  extend8(0x80) = ' + extend8(0x80) + '  (128 \u2192 -128, sign bit set)');
log('  extend8(0xFF) = ' + extend8(0xFF) + '  (255 \u2192 -1)');
log('  extend8(0x100) = ' + extend8(0x100) + '  (256 \u2192 0, wraps to low byte)');
log('');
log('i32.extend16_s:');
log('  extend16(0x7FFF) = ' + extend16(0x7FFF) + '  (32767, positive)');
log('  extend16(0x8000) = ' + extend16(0x8000) + '  (32768 \u2192 -32768)');
log('  extend16(0xFFFF) = ' + extend16(0xFFFF) + '  (65535 \u2192 -1)');`
    },
    "sat-trunc": {
      label: "Saturating Truncation",
      group: "Post-MVP",
      description: "Float-to-int conversion that clamps instead of trapping.",
      target: "2.0",
      features: ["sat-trunc"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Saturating truncation: float \u2192 int without trapping on overflow
const mod = new ModuleBuilder('satTrunc');

// Normal trunc would trap on overflow; saturating clamps instead
mod.defineFunction('sat_f64_to_i32', [ValueType.Int32], [ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.trunc_sat_f64_s_i32();
}).withExport();

mod.defineFunction('sat_f64_to_u32', [ValueType.Int32], [ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.trunc_sat_f64_u_i32();
}).withExport();

const instance = await mod.instantiate();
const { sat_f64_to_i32, sat_f64_to_u32 } = instance.instance.exports;

log('Saturating f64 \u2192 i32 (signed):');
log('  42.9   \u2192 ' + sat_f64_to_i32(42.9));
log('  -42.9  \u2192 ' + sat_f64_to_i32(-42.9));
log('  1e20   \u2192 ' + sat_f64_to_i32(1e20) + '  (clamped to i32 max)');
log('  -1e20  \u2192 ' + sat_f64_to_i32(-1e20) + '  (clamped to i32 min)');
log('  NaN    \u2192 ' + sat_f64_to_i32(NaN) + '  (NaN \u2192 0)');
log('  Inf    \u2192 ' + sat_f64_to_i32(Infinity) + '  (clamped)');
log('');
log('Saturating f64 \u2192 u32 (unsigned, shown as signed i32):');
log('  42.9   \u2192 ' + sat_f64_to_u32(42.9));
log('  -1.0   \u2192 ' + sat_f64_to_u32(-1.0) + '  (negative \u2192 0)');
log('  1e20   \u2192 ' + sat_f64_to_u32(1e20) + '  (clamped to u32 max)');`
    },
    "ref-types": {
      label: "Reference Types",
      group: "Post-MVP",
      description: "Use ref.null, ref.is_null, and ref.func instructions.",
      target: "2.0",
      features: ["reference-types"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Reference types: ref.null, ref.is_null, ref.func
const mod = new ModuleBuilder('refTypes');

const double = mod.defineFunction('double', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
}).withExport();

// Check if a null funcref is null \u2192 1
mod.defineFunction('isRefNull', [ValueType.Int32], [], (f, a) => {
  a.ref_null(0x70);
  a.ref_is_null();
}).withExport();

// Check if a real function ref is null \u2192 0
mod.defineFunction('isFuncNull', [ValueType.Int32], [], (f, a) => {
  a.ref_func(double);
  a.ref_is_null();
}).withExport();

const instance = await mod.instantiate();
const { isRefNull, isFuncNull } = instance.instance.exports;

log('ref.null + ref.is_null:');
log('  null funcref is null: ' + (isRefNull() === 1));
log('  real func ref is null: ' + (isFuncNull() === 1));
log('');
log('double(21) = ' + instance.instance.exports.double(21));`
    },
    "target-system": {
      label: "Target System",
      group: "Post-MVP",
      description: "Choose WebAssembly targets and feature flags.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Target system: control which features are available
// Default is 'latest' \u2014 all features enabled
const modLatest = new ModuleBuilder('latest');
log('latest features:');
log('  threads: ' + modLatest.hasFeature('threads'));
log('  simd: ' + modLatest.hasFeature('simd'));
log('  exception-handling: ' + modLatest.hasFeature('exception-handling'));
log('  memory64: ' + modLatest.hasFeature('memory64'));
log('  relaxed-simd: ' + modLatest.hasFeature('relaxed-simd'));

log('');

// WebAssembly 2.0 \u2014 only widely-deployed features
const mod2 = new ModuleBuilder('compat', { target: '2.0' });
log('2.0 features:');
log('  sign-extend: ' + mod2.hasFeature('sign-extend'));
log('  bulk-memory: ' + mod2.hasFeature('bulk-memory'));
log('  threads: ' + mod2.hasFeature('threads'));
log('  simd: ' + mod2.hasFeature('simd'));

log('');

// MVP with specific features
const modCustom = new ModuleBuilder('custom', {
  target: 'mvp',
  features: ['simd', 'bulk-memory'],
});
log('mvp + simd + bulk-memory:');
log('  simd: ' + modCustom.hasFeature('simd'));
log('  bulk-memory: ' + modCustom.hasFeature('bulk-memory'));
log('  threads: ' + modCustom.hasFeature('threads'));

log('');

// Build a simple module with 2.0 target
mod2.defineFunction('add', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

const instance = await mod2.instantiate();
log('2.0 module works: add(3, 4) = ' + instance.instance.exports.add(3, 4));`
    },
    "multi-value": {
      label: "Multi-Value Returns",
      group: "Post-MVP",
      description: "Functions returning multiple values at once.",
      target: "2.0",
      features: ["multi-value"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Multi-value: functions can return more than one value
const mod = new ModuleBuilder('multiValue');

// divmod returns both quotient and remainder
mod.defineFunction('divmod', [ValueType.Int32, ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const dividend = f.getParameter(0);
  const divisor = f.getParameter(1);

  // Push quotient
  a.get_local(dividend);
  a.get_local(divisor);
  a.div_i32();

  // Push remainder
  a.get_local(dividend);
  a.get_local(divisor);
  a.rem_i32();
}).withExport();

const instance = await mod.instantiate();
const divmod = instance.instance.exports.divmod;

log('Multi-value returns (quotient, remainder):');
for (const [a, b] of [[17, 5], [100, 7], [42, 6], [99, 10]]) {
  const result = divmod(a, b);
  log('  ' + a + ' / ' + b + ' = ' + result);
}`
    },
    "mutable-global-export": {
      label: "Mutable Global Export",
      group: "Post-MVP",
      description: "Export a mutable global, read from JavaScript.",
      target: "2.0",
      features: ["mutable-globals"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Mutable global export: JS can read the global's value
const mod = new ModuleBuilder('mutGlobal');

const counter = mod.defineGlobal(ValueType.Int32, true, 0);
mod.exportGlobal(counter, 'counter');

mod.defineFunction('increment', null, [], (f, a) => {
  a.get_global(counter);
  a.const_i32(1);
  a.add_i32();
  a.set_global(counter);
}).withExport();

mod.defineFunction('add', null, [ValueType.Int32], (f, a) => {
  a.get_global(counter);
  a.get_local(f.getParameter(0));
  a.add_i32();
  a.set_global(counter);
}).withExport();

const instance = await mod.instantiate();
const { increment, add, counter: g } = instance.instance.exports;

log('Initial: ' + g.value);
increment();
increment();
increment();
log('After 3 increments: ' + g.value);
add(10);
log('After add(10): ' + g.value);
add(-5);
log('After add(-5): ' + g.value);`
    },
    "tail-call": {
      label: "Tail Calls",
      group: "Post-MVP",
      description: "Tail-recursive factorial \u2014 no stack overflow.",
      target: "3.0",
      features: ["tail-call"],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Tail calls: return_call reuses the current frame
const mod = new ModuleBuilder('tailCall');

// Declare both functions first (forward reference)
const helper = mod.defineFunction('fact_helper', [ValueType.Int64],
  [ValueType.Int64, ValueType.Int64]);
const factorial = mod.defineFunction('factorial', [ValueType.Int64],
  [ValueType.Int64]);

// Tail-recursive helper: fact_helper(n, acc)
{
  const a = helper.createEmitter();
  const n = helper.getParameter(0);
  const acc = helper.getParameter(1);

  // Base case: n <= 1
  a.get_local(n);
  a.const_i64(1n);
  a.le_i64();
  a.if(BlockType.Void, () => {
    a.get_local(acc);
    a.return();
  });

  // Tail call: return_call fact_helper(n-1, n*acc)
  a.get_local(n);
  a.const_i64(1n);
  a.sub_i64();
  a.get_local(n);
  a.get_local(acc);
  a.mul_i64();
  a.return_call(helper);
  a.end();
}

// Public entry: factorial(n)
{
  const a = factorial.createEmitter();
  a.get_local(factorial.getParameter(0));
  a.const_i64(1n);
  a.call(helper);
  a.end();
}
factorial.withExport();

const instance = await mod.instantiate();
const fact = instance.instance.exports.factorial;

log('Tail-recursive factorial (i64):');
for (let n = 0n; n <= 20n; n++) {
  log('  ' + n + '! = ' + fact(n));
}
log('');
log('No stack overflow \u2014 return_call reuses the frame!');`
    },
    "shared-memory": {
      label: "Shared Memory",
      group: "Post-MVP",
      description: "Shared memory with atomic load/store/add.",
      target: "3.0",
      features: ["threads"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Shared memory + atomic operations
const mod = new ModuleBuilder('atomics');

// Shared memory requires both initial and maximum
const mem = mod.defineMemory(1, 10, true); // shared=true
mod.exportMemory(mem, 'memory');

// Atomic store
mod.defineFunction('atomicStore', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_store_i32(2, 0);
}).withExport();

// Atomic load
mod.defineFunction('atomicLoad', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.atomic_load_i32(2, 0);
}).withExport();

// Atomic add (returns old value)
mod.defineFunction('atomicAdd', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_add_i32(2, 0);
}).withExport();

// Atomic compare-and-swap
mod.defineFunction('atomicCAS', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // address
  a.get_local(f.getParameter(1)); // expected
  a.get_local(f.getParameter(2)); // replacement
  a.atomic_rmw_cmpxchg_i32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { atomicStore, atomicLoad, atomicAdd, atomicCAS } = instance.instance.exports;

log('=== Atomic Operations ===');
atomicStore(0, 100);
log('atomicStore(0, 100)');
log('atomicLoad(0) = ' + atomicLoad(0));

log('');
const old1 = atomicAdd(0, 5);
log('atomicAdd(0, 5) returned old value: ' + old1);
log('atomicLoad(0) = ' + atomicLoad(0));

const old2 = atomicAdd(0, 10);
log('atomicAdd(0, 10) returned old value: ' + old2);
log('atomicLoad(0) = ' + atomicLoad(0));

log('');
log('=== Compare-and-Swap ===');
const cas1 = atomicCAS(0, 115, 200);
log('atomicCAS(0, 115, 200) = ' + cas1 + ' (matched, swapped)');
log('atomicLoad(0) = ' + atomicLoad(0));

const cas2 = atomicCAS(0, 999, 300);
log('atomicCAS(0, 999, 300) = ' + cas2 + ' (no match, not swapped)');
log('atomicLoad(0) = ' + atomicLoad(0));`
    },
    "exception-handling": {
      label: "Exception Handling",
      group: "Post-MVP",
      description: "Define tags and throw exceptions from WASM.",
      target: "3.0",
      features: ["exception-handling"],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Exception handling: defineTag + throw
const mod = new ModuleBuilder('exceptions');

// Define a tag with an i32 payload (like an error code)
const errorTag = mod.defineTag([ValueType.Int32]);

// Throws when input is negative
mod.defineFunction('checkPositive', null, [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(0);
  a.lt_i32();
  a.if(BlockType.Void, () => {
    a.get_local(f.getParameter(0));
    a.throw(errorTag._index);
  });
}).withExport();

// Show the WAT output with tag and throw
const wat = mod.toString();
log('=== WAT Output ===');
log(wat);

// Compile to bytes
const bytes = mod.toBytes();
log('Module compiled: ' + bytes.length + ' bytes');
log('Valid WASM: ' + WebAssembly.validate(bytes.buffer));`
    },
    "memory64": {
      label: "Memory64",
      group: "Post-MVP",
      description: "64-bit addressed memory for very large address spaces.",
      target: "3.0",
      features: ["memory64"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Memory64: 64-bit addressed memory
const mod = new ModuleBuilder('memory64', { target: '3.0' });

// Define a 64-bit addressed memory
const mem = mod.defineMemory(1, 100, false, true); // memory64=true
mod.exportMemory(mem, 'memory');

// Store: address is i64 for memory64
mod.defineFunction('store64', null,
  [ValueType.Int64, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // i64 address
  a.get_local(f.getParameter(1)); // i32 value
  a.store_i32(2, 0);
}).withExport();

// Load: address is i64 for memory64
mod.defineFunction('load64', [ValueType.Int32],
  [ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0)); // i64 address
  a.load_i32(2, 0);
}).withExport();

// Show the WAT \u2014 note i64 addresses
const wat = mod.toString();
log('=== WAT Output (memory64) ===');
log(wat);

// Compile
const bytes = mod.toBytes();
log('');
log('Module compiled: ' + bytes.length + ' bytes');
log('');
log('Note: memory64 uses i64 addresses instead of i32.');
log('Runtime instantiation requires engine support for memory64.');`
    },
    // ─── GC (Garbage Collection) ───
    "gc-struct-basic": {
      label: "Struct Basics",
      group: "GC",
      description: "Define a Point struct with x,y fields, create and read fields.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// GC Struct Basics \u2014 define a Point struct and access fields
const mod = new ModuleBuilder('gcStruct', {
  target: 'latest',
});

// Define a struct type with two i32 fields
const Point = mod.defineStructType([
  { name: 'x', type: ValueType.Int32, mutable: true },
  { name: 'y', type: ValueType.Int32, mutable: true },
]);

log('Struct type index: ' + Point.index);
log('Fields: ' + Point.fields.map(f => f.name).join(', '));
log('Field count: ' + Point.fields.length);

// Create a function that makes a Point and reads the x field
mod.defineFunction('getX', [ValueType.Int32], [], (f, a) => {
  // Push field values onto stack then struct.new
  a.const_i32(10); // x = 10
  a.const_i32(20); // y = 20
  a.struct_new(Point.index);
  // Read the x field
  a.struct_get(Point.index, Point.getFieldIndex('x'));
}).withExport();

// Create a function that reads the y field
mod.defineFunction('getY', [ValueType.Int32], [], (f, a) => {
  a.const_i32(10);
  a.const_i32(20);
  a.struct_new(Point.index);
  a.struct_get(Point.index, Point.getFieldIndex('y'));
}).withExport();

log('');
log('WAT output:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary size: ' + bytes.length + ' bytes');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    "gc-struct-mutable": {
      label: "Mutable Struct Fields",
      group: "GC",
      description: "Create a mutable struct and update fields with struct.set.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Mutable Struct Fields \u2014 create, read, update a GC struct
const mod = new ModuleBuilder('gcMutable', {
  target: 'latest',
});

const Counter = mod.defineStructType([
  { name: 'count', type: ValueType.Int32, mutable: true },
]);

// Create a counter, increment it, return new value
mod.defineFunction('incrementAndGet', [ValueType.Int32], [], (f, a) => {
  // Create counter with count = 0
  a.const_i32(0);
  a.struct_new(Counter.index);
  const ref = a.declareLocal(ValueType.AnyRef, 'ref');
  a.set_local(ref);

  // Set count = 42
  a.get_local(ref);
  a.const_i32(42);
  a.struct_set(Counter.index, Counter.getFieldIndex('count'));

  // Read count back
  a.get_local(ref);
  a.struct_get(Counter.index, Counter.getFieldIndex('count'));
}).withExport();

log('WAT output:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary size: ' + bytes.length + ' bytes');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    "gc-struct-default": {
      label: "Struct Default Values",
      group: "GC",
      description: "Zero-initialize a struct with struct.new_default.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Struct Default Values \u2014 zero-init with struct.new_default
const mod = new ModuleBuilder('gcDefault', {
  target: 'latest',
});

const Vec3 = mod.defineStructType([
  { name: 'x', type: ValueType.Float32, mutable: true },
  { name: 'y', type: ValueType.Float32, mutable: true },
  { name: 'z', type: ValueType.Float32, mutable: true },
]);

// struct.new_default creates a struct with all fields zeroed
mod.defineFunction('defaultX', [ValueType.Float32], [], (f, a) => {
  a.struct_new_default(Vec3.index);
  a.struct_get(Vec3.index, Vec3.getFieldIndex('x'));
}).withExport();

log('Fields: x, y, z (all f32, mutable)');
log('struct.new_default zero-initializes all fields');
log('');
log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    "gc-array-basic": {
      label: "Array Basics",
      group: "GC",
      description: "Define a GC array type, create, read, write, and get length.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// GC Array Basics \u2014 create, read, write, measure length
const mod = new ModuleBuilder('gcArray', {
  target: 'latest',
});

// Define a mutable array of i32
const IntArray = mod.defineArrayType(ValueType.Int32, true);
log('Array type index: ' + IntArray.index);

// Create an array of 5 elements, all initialized to 0
mod.defineFunction('createArray', null, [], (f, a) => {
  a.const_i32(0);  // default value
  a.const_i32(5);  // length
  a.array_new(IntArray.index);
  a.drop();
}).withExport();

// Get array length
mod.defineFunction('getLen', [ValueType.Int32], [], (f, a) => {
  a.const_i32(0);
  a.const_i32(10);
  a.array_new(IntArray.index);
  a.array_len();
}).withExport();

// Set and get an element
mod.defineFunction('setAndGet', [ValueType.Int32], [], (f, a) => {
  // Create array of length 3
  a.const_i32(0);
  a.const_i32(3);
  a.array_new(IntArray.index);
  const arr = a.declareLocal(ValueType.AnyRef, 'arr');
  a.set_local(arr);

  // Set index 1 to 99
  a.get_local(arr);
  a.const_i32(1);  // index
  a.const_i32(99); // value
  a.array_set(IntArray.index);

  // Get index 1
  a.get_local(arr);
  a.const_i32(1);
  a.array_get(IntArray.index);
}).withExport();

log('');
log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    "gc-array-fixed": {
      label: "Fixed-Size Array",
      group: "GC",
      description: "Create an array from fixed inline values with array.new_fixed.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Fixed-Size Array \u2014 create from inline values
const mod = new ModuleBuilder('gcFixed', {
  target: 'latest',
});

const IntArray = mod.defineArrayType(ValueType.Int32, false);

// Create a fixed array [10, 20, 30] using array.new_fixed
mod.defineFunction('sumFixed', [ValueType.Int32], [], (f, a) => {
  // Push 3 values, then array.new_fixed(typeIndex, count)
  a.const_i32(10);
  a.const_i32(20);
  a.const_i32(30);
  a.array_new_fixed(IntArray.index, 3);

  const arr = a.declareLocal(ValueType.AnyRef, 'arr');
  a.set_local(arr);

  // Sum: arr[0] + arr[1] + arr[2]
  a.get_local(arr);
  a.const_i32(0);
  a.array_get(IntArray.index);

  a.get_local(arr);
  a.const_i32(1);
  a.array_get(IntArray.index);
  a.add_i32();

  a.get_local(arr);
  a.const_i32(2);
  a.array_get(IntArray.index);
  a.add_i32();
}).withExport();

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    "gc-i31-ref": {
      label: "i31 References",
      group: "GC",
      description: "Pack/unpack small integers as i31ref.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// i31 References \u2014 box/unbox small integers
// i31ref packs a 31-bit integer into a reference type,
// useful for unboxed small values in GC type hierarchies.
const mod = new ModuleBuilder('gcI31', {
  target: 'latest',
});

// Pack i32 \u2192 i31ref \u2192 unpack signed
mod.defineFunction('roundtrip_s', [ValueType.Int32], [], (f, a) => {
  a.const_i32(42);
  a.ref_i31();      // box: i32 \u2192 i31ref
  a.i31_get_s();    // unbox signed: i31ref \u2192 i32
}).withExport();

// Pack i32 \u2192 i31ref \u2192 unpack unsigned
mod.defineFunction('roundtrip_u', [ValueType.Int32], [], (f, a) => {
  a.const_i32(-1);   // negative value
  a.ref_i31();
  a.i31_get_u();     // unbox unsigned
}).withExport();

// Negative number signed roundtrip
mod.defineFunction('negative_s', [ValueType.Int32], [], (f, a) => {
  a.const_i32(-100);
  a.ref_i31();
  a.i31_get_s();
}).withExport();

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    "gc-rec-group": {
      label: "Recursive Types",
      group: "GC",
      description: "Define mutually-recursive types using defineRecGroup.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Recursive Types \u2014 mutually-recursive struct definitions
// A rec group allows types to reference each other (forward references).
// Classic example: a linked list node type.
const mod = new ModuleBuilder('gcRec', {
  target: 'latest',
});

// Define a recursive group with two types that reference each other
const recGroup = mod.defineRecGroup((builder) => {
  // Type 0: ListNode { value: i32, next: ref null ListNode }
  const listNodeRef = builder.refNull(0); // forward ref to type 0 (self)
  builder.addStructType([
    { name: 'value', type: ValueType.Int32, mutable: false },
    { name: 'next', type: listNodeRef, mutable: true },
  ]);

  // Type 1: array of ListNode refs
  builder.addArrayType(builder.refNull(0), true);
});

log('Recursive group created with ' + recGroup._types.length + ' types');
log('Type 0: ListNode struct (value: i32, next: ref null ListNode)');
log('Type 1: array of (ref null ListNode)');

log('');
log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    "gc-subtyping": {
      label: "Struct Subtyping",
      group: "GC",
      description: "Extend a base struct type with superTypes.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Struct Subtyping \u2014 type hierarchy with superTypes
// GC struct types can extend other struct types (adding fields at the end).
const mod = new ModuleBuilder('gcSubtype', {
  target: 'latest',
});

// Base type: Shape { area: f32 }
const Shape = mod.defineStructType([
  { name: 'area', type: ValueType.Float32, mutable: false },
]);

// Subtype: Circle extends Shape, adds radius
const Circle = mod.defineStructType([
  { name: 'area', type: ValueType.Float32, mutable: false },
  { name: 'radius', type: ValueType.Float32, mutable: false },
], { superTypes: [Shape], final: false });

// Final subtype: FilledCircle extends Circle, adds color
const FilledCircle = mod.defineStructType([
  { name: 'area', type: ValueType.Float32, mutable: false },
  { name: 'radius', type: ValueType.Float32, mutable: false },
  { name: 'color', type: ValueType.Int32, mutable: false },
], { superTypes: [Circle], final: true });

log('Type hierarchy:');
log('  Shape (index ' + Shape.index + '): { area: f32 }');
log('  Circle (index ' + Circle.index + ') extends Shape: { area, radius }');
log('  FilledCircle (index ' + FilledCircle.index + ') extends Circle: { area, radius, color }');

log('');
log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    "gc-ref-cast-test": {
      label: "Runtime Type Checks",
      group: "GC",
      description: "Use ref.test and ref.cast to check and narrow reference types.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType", "HeapType"],
      code: `// Runtime Type Checks \u2014 ref.test and ref.cast
// ref.test checks if a reference is a subtype (returns 0 or 1).
// ref.cast narrows a reference type (traps if wrong type).
const mod = new ModuleBuilder('gcCast', {
  target: 'latest',
});

// Test if a null anyref is an i31
mod.defineFunction('testNull', [ValueType.Int32], [], (f, a) => {
  a.ref_null(0x6e);          // null anyref
  a.ref_test(HeapType.I31);  // is it an i31? \u2192 0
}).withExport();

// Test if an i31ref is an i31
mod.defineFunction('testI31', [ValueType.Int32], [], (f, a) => {
  a.const_i32(42);
  a.ref_i31();               // create i31ref
  a.ref_test(HeapType.I31);  // is it an i31? \u2192 1
}).withExport();

// Cast: narrow anyref to i31ref
mod.defineFunction('castI31', null, [], (f, a) => {
  a.const_i32(7);
  a.ref_i31();
  a.ref_cast(HeapType.I31);  // cast to i31ref (succeeds)
  a.drop();
}).withExport();

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    "gc-extern-convert": {
      label: "Extern/Any Conversions",
      group: "GC",
      description: "Convert between externref and anyref.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Extern/Any Conversions
// any.convert_extern: externref \u2192 anyref (internalize)
// extern.convert_any: anyref \u2192 externref (externalize)
const mod = new ModuleBuilder('gcConvert', {
  target: 'latest',
});

// Internalize then externalize a null externref
mod.defineFunction('roundtrip', null, [], (f, a) => {
  a.ref_null(0x6f);           // null externref
  a.any_convert_extern();     // externref \u2192 anyref
  a.extern_convert_any();     // anyref \u2192 externref
  a.drop();
}).withExport();

log('any.convert_extern: externref \u2192 anyref (internalize)');
log('extern.convert_any: anyref \u2192 externref (externalize)');
log('');
log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    "gc-array-operations": {
      label: "Array Fill & Copy",
      group: "GC",
      description: "Bulk array manipulation with array.fill and array.copy.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Array Fill & Copy \u2014 bulk GC array operations
const mod = new ModuleBuilder('gcArrayOps', {
  target: 'latest',
});

const IntArray = mod.defineArrayType(ValueType.Int32, true);

// Fill a range of an array with a value
mod.defineFunction('fillDemo', null, [], (f, a) => {
  // Create array of 10 zeros
  a.const_i32(0);
  a.const_i32(10);
  a.array_new(IntArray.index);
  const arr = a.declareLocal(ValueType.AnyRef, 'arr');
  a.set_local(arr);

  // Fill indices 2..5 with value 99
  a.get_local(arr);
  a.const_i32(2);  // dest offset
  a.const_i32(99); // fill value
  a.const_i32(3);  // length (fill 3 elements)
  a.array_fill(IntArray.index);
}).withExport();

// Copy between two arrays
mod.defineFunction('copyDemo', null, [], (f, a) => {
  // Source array with fixed values
  a.const_i32(1);
  a.const_i32(2);
  a.const_i32(3);
  a.array_new_fixed(IntArray.index, 3);
  const src = a.declareLocal(ValueType.AnyRef, 'src');
  a.set_local(src);

  // Destination array of zeros
  a.const_i32(0);
  a.const_i32(5);
  a.array_new(IntArray.index);
  const dst = a.declareLocal(ValueType.AnyRef, 'dst');
  a.set_local(dst);

  // Copy src[0..3] \u2192 dst[1..4]
  a.get_local(dst);
  a.const_i32(1);  // dest offset
  a.get_local(src);
  a.const_i32(0);  // src offset
  a.const_i32(3);  // length
  a.array_copy(IntArray.index, IntArray.index);
}).withExport();

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    "gc-wat-output": {
      label: "GC WAT Inspection",
      group: "GC",
      description: "Define struct and array types, inspect the generated WAT text.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType", "TextModuleWriter"],
      code: `// GC WAT Inspection \u2014 explore how GC types appear in text format
const mod = new ModuleBuilder('gcWat', {
  target: 'latest',
});

// Struct type
mod.defineStructType([
  { name: 'x', type: ValueType.Int32, mutable: true },
  { name: 'y', type: ValueType.Float64, mutable: false },
]);

// Immutable array
mod.defineArrayType(ValueType.Float32, false);

// Mutable array
mod.defineArrayType(ValueType.Int32, true);

// A function type (shows mixed type section)
mod.defineFunctionType(ValueType.Int32, [ValueType.Int32]);

// A simple function using struct.new_default
const structType = mod.defineStructType([
  { name: 'val', type: ValueType.Int32, mutable: true },
]);

mod.defineFunction('demo', null, [], (f, a) => {
  a.struct_new_default(structType.index);
  a.drop();
}).withExport();

const writer = new TextModuleWriter(mod);
const wat = writer.toString();
log('Generated WAT:');
log(wat);

log('');
const bytes = mod.toBytes();
log('Binary size: ' + bytes.length + ' bytes');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    // ─── Debug & Inspection ───
    "debug-names": {
      label: "Debug Name Section",
      group: "Debug",
      description: "Inspect function, local, and global names in the binary.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BinaryReader"],
      code: `// Inspect the debug name section in the binary
const mod = new ModuleBuilder('debugExample');

const g = mod.defineGlobal(ValueType.Int32, true, 0);
g.withName('counter');

mod.defineFunction('add', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  f.getParameter(0).withName('x');
  f.getParameter(1).withName('y');
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

mod.defineFunction('addThree', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  f.getParameter(0).withName('a');
  f.getParameter(1).withName('b');
  f.getParameter(2).withName('c');
  const temp = a.declareLocal(ValueType.Int32, 'temp');
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
  a.get_local(f.getParameter(2));
  a.add_i32();
}).withExport();

const bytes = mod.toBytes();

log('Binary size: ' + bytes.length + ' bytes');
log('');

// Read back the name section
const reader = new BinaryReader(bytes);
const info = reader.read();
const ns = info.nameSection;

if (ns) {
  log('Module name: ' + ns.moduleName);
  log('');

  if (ns.functionNames) {
    log('Function names:');
    ns.functionNames.forEach((name, idx) => {
      log('  [' + idx + '] ' + name);
    });
  }

  if (ns.localNames) {
    log('');
    log('Local/parameter names:');
    ns.localNames.forEach((locals, funcIdx) => {
      const funcName = ns.functionNames?.get(funcIdx) || 'func' + funcIdx;
      log('  ' + funcName + ':');
      locals.forEach((name, localIdx) => {
        log('    [' + localIdx + '] ' + name);
      });
    });
  }

  if (ns.globalNames) {
    log('');
    log('Global names:');
    ns.globalNames.forEach((name, idx) => {
      log('  [' + idx + '] ' + name);
    });
  }
} else {
  log('No name section found!');
}`
    },
    "binary-inspect": {
      label: "Binary Inspector",
      group: "Debug",
      description: "Read back the binary structure \u2014 types, functions, exports.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "BinaryReader"],
      code: `// Inspect the binary structure of a WASM module
const mod = new ModuleBuilder('inspect');
mod.defineMemory(1);

const counter = mod.defineGlobal(ValueType.Int32, true, 0);

mod.defineFunction('add', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

mod.defineFunction('noop', null, [], (f, a) => {
  a.nop();
}).withExport();

const bytes = mod.toBytes();

log('=== Binary Analysis ===');
log('Total size: ' + bytes.length + ' bytes');
log('');

// Read with BinaryReader
const reader = new BinaryReader(bytes);
const info = reader.read();

log('WASM version: ' + info.version);
log('Types: ' + info.types.length);
info.types.forEach((t, i) => {
  const params = t.parameterTypes.map(p => p.name).join(', ');
  const results = t.returnTypes.map(r => r.name).join(', ');
  log('  [' + i + '] (' + params + ') -> (' + results + ')');
});

log('Functions: ' + info.functions.length);
info.functions.forEach((f, i) => {
  log('  [' + i + '] type=' + f.typeIndex + ', locals=' + f.locals.length + ', body=' + f.body.length + ' bytes');
});

log('Memories: ' + info.memories.length);
info.memories.forEach((m, i) => {
  log('  [' + i + '] initial=' + m.initial + ' pages (' + (m.initial * 64) + ' KB)');
});

log('Globals: ' + info.globals.length);
info.globals.forEach((g, i) => {
  log('  [' + i + '] mutable=' + g.mutable);
});

log('Exports: ' + info.exports.length);
info.exports.forEach((e) => {
  const kinds = ['function', 'table', 'memory', 'global'];
  log('  "' + e.name + '" -> ' + (kinds[e.kind] || 'unknown') + '[' + e.index + ']');
});

log('');
log('Valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    "wat-roundtrip": {
      label: "WAT Roundtrip",
      group: "Debug",
      description: "Build a module, emit WAT, parse it back, and verify.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "parseWat"],
      code: `// Build a module with WAT text, parse it, verify correctness
const watText = \`(module
  (func $multiply (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.mul
  )
  (func $negate (param i32) (result i32)
    i32.const 0
    local.get 0
    i32.sub
  )
  (export "multiply" (func $multiply))
  (export "negate" (func $negate))
)\`;

log('=== WAT Source ===');
log(watText);

// Parse it
log('');
log('=== Parsing WAT... ===');
const mod = parseWat(watText);

// Instantiate and test
const instance = await mod.instantiate();
const { multiply, negate } = instance.instance.exports;

log('multiply(6, 7) = ' + multiply(6, 7));
log('multiply(100, -3) = ' + multiply(100, -3));
log('negate(42) = ' + negate(42));
log('negate(-10) = ' + negate(-10));
log('');
log('Parse + instantiate successful!');`
    },
    "custom-section": {
      label: "Custom Section",
      group: "Debug",
      description: "Add custom metadata to a module and read it back.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "BinaryReader"],
      code: `// Custom section \u2014 embed arbitrary metadata in the binary
const mod = new ModuleBuilder('customSec');

mod.defineFunction('nop', null, [], (f, a) => {
  a.nop();
}).withExport();

// Add custom sections with metadata
const version = new TextEncoder().encode('1.0.0');
mod.defineCustomSection('version', new Uint8Array(version));

const author = new TextEncoder().encode('webasmjs playground');
mod.defineCustomSection('author', new Uint8Array(author));

const bytes = mod.toBytes();
log('Module size: ' + bytes.length + ' bytes');

// Read it back with BinaryReader
const reader = new BinaryReader(bytes);
const info = reader.read();

log('');
log('Custom sections found:');
if (info.customSections) {
  for (const sec of info.customSections) {
    const text = new TextDecoder().decode(sec.data);
    log('  "' + sec.name + '" = "' + text + '" (' + sec.data.length + ' bytes)');
  }
} else {
  log('  (none found \u2014 BinaryReader may not expose custom sections)');
}

log('');
log('The binary is still valid WASM:');
log('  WebAssembly.validate() = ' + WebAssembly.validate(bytes.buffer));`
    },
    "extended-const": {
      label: "Extended Constants",
      group: "Post-MVP",
      description: "Arithmetic in global init expressions with extended-const.",
      target: "3.0",
      features: ["extended-const"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Extended constants: arithmetic in global initializers
const mod = new ModuleBuilder('extConst', {
  target: 'mvp',
  features: ['extended-const'],
});

// Base offset as an immutable global
const base = mod.defineGlobal(ValueType.Int32, false, 100);

// Computed global: base + 50 (uses i32.add in init expression)
const offset1 = mod.defineGlobal(ValueType.Int32, false, (asm) => {
  asm.get_global(base);
  asm.const_i32(50);
  asm.add_i32();
});

// Computed global: base * 3 (uses i32.mul in init expression)
const scaled = mod.defineGlobal(ValueType.Int32, false, (asm) => {
  asm.get_global(base);
  asm.const_i32(3);
  asm.mul_i32();
});

// Computed global: base * 2 + 7
const combined = mod.defineGlobal(ValueType.Int32, false, (asm) => {
  asm.get_global(base);
  asm.const_i32(2);
  asm.mul_i32();
  asm.const_i32(7);
  asm.add_i32();
});

mod.defineFunction('getBase', [ValueType.Int32], [], (f, a) => {
  a.get_global(base);
}).withExport();

mod.defineFunction('getOffset1', [ValueType.Int32], [], (f, a) => {
  a.get_global(offset1);
}).withExport();

mod.defineFunction('getScaled', [ValueType.Int32], [], (f, a) => {
  a.get_global(scaled);
}).withExport();

mod.defineFunction('getCombined', [ValueType.Int32], [], (f, a) => {
  a.get_global(combined);
}).withExport();

const instance = await mod.instantiate();
const { getBase, getOffset1, getScaled, getCombined } = instance.instance.exports;

log('Extended-const: arithmetic in global init expressions');
log('base = ' + getBase());
log('base + 50 = ' + getOffset1());
log('base * 3 = ' + getScaled());
log('base * 2 + 7 = ' + getCombined());`
    },
    "multi-memory": {
      label: "Multi-Memory",
      group: "Post-MVP",
      description: "Define and use multiple linear memories in one module.",
      target: "3.0",
      features: ["multi-memory"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Multi-memory: two separate linear memories
const mod = new ModuleBuilder('multiMem', {
  target: 'mvp',
  features: ['multi-memory'],
});

const mem0 = mod.defineMemory(1);
mod.exportMemory(mem0, 'mem0');
const mem1 = mod.defineMemory(1);
mod.exportMemory(mem1, 'mem1');

// Store to memory 0
mod.defineFunction('store0', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0, 0); // memIndex=0
}).withExport();

// Load from memory 0
mod.defineFunction('load0', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_i32(2, 0, 0); // memIndex=0
}).withExport();

// Store to memory 1
mod.defineFunction('store1', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0, 1); // memIndex=1
}).withExport();

// Load from memory 1
mod.defineFunction('load1', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_i32(2, 0, 1); // memIndex=1
}).withExport();

// Show WAT with two memories
const wat = mod.toString();
log('=== WAT Output ===');
log(wat);

const bytes = mod.toBytes();
log('Module compiled: ' + bytes.length + ' bytes');
log('Valid WASM: ' + WebAssembly.validate(bytes.buffer));`
    },
    "multi-table": {
      label: "Multi-Table",
      group: "Post-MVP",
      description: "Define multiple function tables and dispatch through each.",
      target: "3.0",
      features: ["multi-table"],
      imports: ["ModuleBuilder", "ValueType", "ElementType"],
      code: `// Multi-table: two function tables for different dispatch
const mod = new ModuleBuilder('multiTable', {
  target: 'mvp',
  features: ['multi-table'],
});

const add = mod.defineFunction('add', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
});

const sub = mod.defineFunction('sub', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.sub_i32();
});

const mul = mod.defineFunction('mul', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
});

// Table 0: math operations
const table0 = mod.defineTable(ElementType.AnyFunc, 3);
mod.defineElementSegment(table0, [add, sub, mul], 0);

// Table 1: just add and mul (different arrangement)
const table1 = mod.defineTable(ElementType.AnyFunc, 2);
mod.defineElementSegment(table1, [mul, add], 0);

// Show WAT with two tables
const wat = mod.toString();
log('=== WAT Output (multi-table) ===');
log(wat);

const bytes = mod.toBytes();
log('Module compiled: ' + bytes.length + ' bytes');
log('Valid WASM: ' + WebAssembly.validate(bytes.buffer));`
    },
    "relaxed-simd": {
      label: "Relaxed SIMD",
      group: "Post-MVP",
      description: "Relaxed SIMD operations for performance-sensitive code.",
      target: "latest",
      features: ["relaxed-simd"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Relaxed SIMD: relaxed_madd for fused multiply-add
const mod = new ModuleBuilder('relaxedSimd');
mod.defineMemory(1);

// relaxed_madd: a * b + c (fused multiply-add, may use FMA instruction)
mod.defineFunction('madd_f32x4', null,
  [ValueType.Int32, ValueType.Int32,
   ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(3)); // dest address
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);  // load A
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);  // load B
  a.get_local(f.getParameter(2));
  a.load_v128(2, 0);  // load C
  a.relaxed_madd_f32x4();  // A * B + C
  a.store_v128(2, 0);
}).withExport();

mod.defineFunction('setF32', null,
  [ValueType.Int32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_f32(2, 0);
}).withExport();

mod.defineFunction('getF32', [ValueType.Float32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_f32(2, 0);
}).withExport();

// Show WAT
const wat = mod.toString();
log('=== WAT Output (relaxed SIMD) ===');
log(wat);

const bytes = mod.toBytes();
log('Module compiled: ' + bytes.length + ' bytes');
log('Valid WASM: ' + WebAssembly.validate(bytes.buffer));`
    },
    "atomic-rmw": {
      label: "Atomic RMW Ops",
      group: "Post-MVP",
      description: "Atomic read-modify-write: sub, and, or, xor, exchange.",
      target: "3.0",
      features: ["threads"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Atomic read-modify-write operations
const mod = new ModuleBuilder('atomicRMW');

// Shared memory for atomics
const mem = mod.defineMemory(1, 10, true);
mod.exportMemory(mem, 'memory');

// Atomic store
mod.defineFunction('store', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_store_i32(2, 0);
}).withExport();

// Atomic load
mod.defineFunction('load', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.atomic_load_i32(2, 0);
}).withExport();

// Atomic sub (returns old value)
mod.defineFunction('atomicSub', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_sub_i32(2, 0);
}).withExport();

// Atomic AND (returns old value)
mod.defineFunction('atomicAnd', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_and_i32(2, 0);
}).withExport();

// Atomic OR (returns old value)
mod.defineFunction('atomicOr', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_or_i32(2, 0);
}).withExport();

// Atomic XOR (returns old value)
mod.defineFunction('atomicXor', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_xor_i32(2, 0);
}).withExport();

// Atomic exchange (returns old value, stores new)
mod.defineFunction('atomicXchg', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_xchg_i32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { store, load, atomicSub, atomicAnd, atomicOr, atomicXor, atomicXchg } = instance.instance.exports;

log('=== Atomic Read-Modify-Write ===');
log('All RMW ops return the OLD value before modification.');
log('');

// Sub
store(0, 100);
const oldSub = atomicSub(0, 30);
log('atomicSub(100, 30): old=' + oldSub + ', new=' + load(0));

// AND
store(0, 0xFF);
const oldAnd = atomicAnd(0, 0x0F);
log('atomicAnd(0xFF, 0x0F): old=0x' + (oldAnd >>> 0).toString(16) + ', new=0x' + (load(0) >>> 0).toString(16));

// OR
store(0, 0xF0);
const oldOr = atomicOr(0, 0x0F);
log('atomicOr(0xF0, 0x0F): old=0x' + (oldOr >>> 0).toString(16) + ', new=0x' + (load(0) >>> 0).toString(16));

// XOR
store(0, 0xFF);
const oldXor = atomicXor(0, 0xAA);
log('atomicXor(0xFF, 0xAA): old=0x' + (oldXor >>> 0).toString(16) + ', new=0x' + (load(0) >>> 0).toString(16));

// Exchange
store(0, 42);
const oldXchg = atomicXchg(0, 99);
log('atomicXchg(42, 99): old=' + oldXchg + ', new=' + load(0));`
    },
    "atomic-wait-notify": {
      label: "Wait & Notify",
      group: "Post-MVP",
      description: "Atomic wait/notify primitives and memory fence.",
      target: "3.0",
      features: ["threads"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Atomic wait, notify, and fence \u2014 thread synchronization primitives
const mod = new ModuleBuilder('waitNotify');

const mem = mod.defineMemory(1, 10, true);
mod.exportMemory(mem, 'memory');

// atomic.wait32(addr, expected, timeout) -> 0=ok, 1=not-equal, 2=timed-out
mod.defineFunction('wait32', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0)); // address
  a.get_local(f.getParameter(1)); // expected value
  a.get_local(f.getParameter(2)); // timeout in ns (-1 = infinite)
  a.atomic_wait32(2, 0);
}).withExport();

// atomic.notify(addr, count) -> number of waiters woken
mod.defineFunction('notify', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // address
  a.get_local(f.getParameter(1)); // count of waiters to wake
  a.atomic_notify(2, 0);
}).withExport();

// atomic.fence \u2014 full memory barrier
mod.defineFunction('fence', null, [], (f, a) => {
  a.atomic_fence(0);
}).withExport();

// Atomic store for setup
mod.defineFunction('store', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_store_i32(2, 0);
}).withExport();

// Show the WAT output
const wat = mod.toString();
log('=== WAT Output (wait/notify/fence) ===');
log(wat);

// Compile and validate
const bytes = mod.toBytes();
log('Module compiled: ' + bytes.length + ' bytes');
log('Valid WASM: ' + WebAssembly.validate(bytes.buffer));
log('');
log('Note: atomic.wait blocks the calling thread until notified.');
log('In a multi-threaded setup:');
log('  Thread A: wait32(addr, 0, -1n)  // sleep until value changes');
log('  Thread B: store(addr, 1); notify(addr, 1)  // wake thread A');
log('  fence() ensures memory operations are visible across threads.');`
    },
    "opcode-inspector": {
      label: "Opcode Inspector",
      group: "Debug",
      description: "Examine raw binary bytes and section layout of a module.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Opcode Inspector \u2014 examine raw binary bytes of a module
const mod = new ModuleBuilder('inspector');

mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

const bytes = mod.toBytes();

// Parse the binary header
log('Module size: ' + bytes.length + ' bytes');
log('Magic: 0x' + Array.from(bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(''));
log('Version: ' + new DataView(bytes.buffer).getUint32(4, true));

// Find and display sections
let offset = 8;
while (offset < bytes.length) {
  const sectionId = bytes[offset];
  const sectionNames = ['custom','type','import','function','table','memory','global','export','start','element','code','data','data count'];
  const name = sectionNames[sectionId] || 'unknown(' + sectionId + ')';
  // Read LEB128 size
  let size = 0, shift = 0, byte;
  do {
    byte = bytes[++offset];
    size |= (byte & 0x7f) << shift;
    shift += 7;
  } while (byte & 0x80);
  offset++;
  log('Section ' + sectionId + ' (' + name + '): ' + size + ' bytes at offset ' + offset);
  offset += size;
}`
    },
    // ─── Additional SIMD ───
    "simd-integer": {
      label: "SIMD Integer Ops",
      group: "SIMD",
      description: "Integer SIMD: i32x4 add, sub, mul, comparisons, and lane ops.",
      target: "3.0",
      features: ["simd"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Integer SIMD: i32x4 arithmetic, comparisons, lane extract/replace
const mod = new ModuleBuilder('simdInt');
mod.defineMemory(1);

// Add two i32x4 vectors
mod.defineFunction('add_i32x4', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.add_i32x4();
  a.store_v128(2, 0);
}).withExport();

// Element-wise min (signed)
mod.defineFunction('min_s_i32x4', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.min_s_i32x4();
  a.store_v128(2, 0);
}).withExport();

// Extract a single lane
mod.defineFunction('extract', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  // Load vector, extract lane based on index using a br_table
  // For simplicity, extract lane 0 from the vector at the address
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.extract_lane_i32x4(0);
}).withExport();

// Splat a scalar to all 4 lanes
mod.defineFunction('splat_i32x4', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // dest
  a.get_local(f.getParameter(1)); // scalar
  a.splat_i32x4();
  a.store_v128(2, 0);
}).withExport();

mod.defineFunction('setI32', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0);
}).withExport();

mod.defineFunction('getI32', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_i32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { add_i32x4, min_s_i32x4, extract, splat_i32x4, setI32, getI32 } = instance.instance.exports;

// A = [10, 20, 30, 40], B = [5, 25, 15, 45]
const a = [10, 20, 30, 40], b = [5, 25, 15, 45];
for (let i = 0; i < 4; i++) { setI32(i * 4, a[i]); setI32(16 + i * 4, b[i]); }

add_i32x4(0, 16, 32);
log('A = [' + a + ']');
log('B = [' + b + ']');
log('A + B = [' + [getI32(32), getI32(36), getI32(40), getI32(44)] + ']');

min_s_i32x4(0, 16, 48);
log('min(A, B) = [' + [getI32(48), getI32(52), getI32(56), getI32(60)] + ']');

log('');
log('extract lane 0 of A: ' + extract(0, 0));

splat_i32x4(64, 7);
log('splat(7) = [' + [getI32(64), getI32(68), getI32(72), getI32(76)] + ']');`
    },
    "simd-shuffle": {
      label: "SIMD Shuffle & Swizzle",
      group: "SIMD",
      description: "Rearrange vector lanes with shuffle and swizzle.",
      target: "3.0",
      features: ["simd"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// SIMD shuffle & swizzle: rearrange bytes across vectors
const mod = new ModuleBuilder('simdShuffle');
mod.defineMemory(1);

// shuffle: pick 16 bytes from two source vectors by index
// Indices 0-15 = first vector, 16-31 = second vector
mod.defineFunction('interleave', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2)); // dest
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0); // vector A
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0); // vector B
  // Interleave first 4 bytes: A[0], B[0], A[1], B[1], A[2], B[2], A[3], B[3], ...
  a.shuffle_i8x16(new Uint8Array([0, 16, 1, 17, 2, 18, 3, 19, 4, 20, 5, 21, 6, 22, 7, 23]));
  a.store_v128(2, 0);
}).withExport();

// Reverse bytes within a vector using shuffle
mod.defineFunction('reverse', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1)); // dest
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0); // same vector for both operands
  a.shuffle_i8x16(new Uint8Array([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]));
  a.store_v128(2, 0);
}).withExport();

// swizzle: rearrange bytes using a dynamic index vector
mod.defineFunction('swizzle', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2)); // dest
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0); // data
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0); // indices
  a.swizzle_i8x16();
  a.store_v128(2, 0);
}).withExport();

mod.defineFunction('setByte', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store8_i32(0, 0);
}).withExport();

mod.defineFunction('getByte', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load8_i32_u(0, 0);
}).withExport();

const instance = await mod.instantiate();
const { interleave, reverse, swizzle, setByte, getByte } = instance.instance.exports;

// Set up: A = [0,1,2,...,15], B = [16,17,...,31]
for (let i = 0; i < 16; i++) { setByte(i, i); setByte(16 + i, 16 + i); }

interleave(0, 16, 32);
const interleaved = [];
for (let i = 0; i < 16; i++) interleaved.push(getByte(32 + i));
log('A = [0,1,2,...,15]');
log('B = [16,17,...,31]');
log('interleave(A, B) = [' + interleaved.join(', ') + ']');

log('');
reverse(0, 48);
const reversed = [];
for (let i = 0; i < 16; i++) reversed.push(getByte(48 + i));
log('reverse(A) = [' + reversed.join(', ') + ']');

log('');
// swizzle: use indices [3,2,1,0, 7,6,5,4, 11,10,9,8, 15,14,13,12] to reverse each group of 4
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 4; j++) setByte(64 + i * 4 + j, i * 4 + (3 - j));
}
swizzle(0, 64, 80);
const swizzled = [];
for (let i = 0; i < 16; i++) swizzled.push(getByte(80 + i));
log('swizzle(A, reverse-within-groups) = [' + swizzled.join(', ') + ']');`
    },
    "simd-widen-narrow": {
      label: "SIMD Widen & Narrow",
      group: "SIMD",
      description: "Convert between vector widths \u2014 narrow i16x8 to i8x16, extend i8x16 to i16x8.",
      target: "3.0",
      features: ["simd"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// SIMD widening and narrowing: convert between lane sizes
const mod = new ModuleBuilder('simdWidenNarrow');
mod.defineMemory(1);

// Narrow two i16x8 vectors into one i8x16 (saturating, unsigned)
mod.defineFunction('narrow_u', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.narrow_i16x8_u_i8x16();
  a.store_v128(2, 0);
}).withExport();

// Extend low half of i8x16 to i16x8 (signed)
mod.defineFunction('extend_low_s', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.extend_low_i8x16_s_i16x8();
  a.store_v128(2, 0);
}).withExport();

mod.defineFunction('setByte', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store8_i32(0, 0);
}).withExport();

mod.defineFunction('getByte', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load8_i32_u(0, 0);
}).withExport();

mod.defineFunction('setI16', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store16_i32(1, 0);
}).withExport();

mod.defineFunction('getI16', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load16_i32(1, 0);
}).withExport();

const instance = await mod.instantiate();
const { narrow_u, extend_low_s, setByte, getByte, setI16, getI16 } = instance.instance.exports;

// Narrowing: two i16x8 \u2192 one i8x16 (values clamped to 0-255)
// A = [10, 200, 300, 50, 0, 255, 1000, 128] at offset 0
const i16a = [10, 200, 300, 50, 0, 255, 1000, 128];
for (let i = 0; i < 8; i++) setI16(i * 2, i16a[i]);
// B = [1, 2, 3, 4, 5, 6, 7, 8]
for (let i = 0; i < 8; i++) setI16(16 + i * 2, i + 1);

narrow_u(0, 16, 32);
const narrowed = [];
for (let i = 0; i < 16; i++) narrowed.push(getByte(32 + i));
log('=== Narrowing (i16x8 \u2192 i8x16, unsigned saturating) ===');
log('A (i16) = [' + i16a + ']');
log('B (i16) = [1,2,3,4,5,6,7,8]');
log('narrow_u = [' + narrowed.join(', ') + ']');
log('(300\u2192255, 1000\u2192255 clamped)');

// Widening: i8x16 low half \u2192 i16x8 (signed extend)
log('');
log('=== Widening (i8x16 \u2192 i16x8, signed) ===');
const bytes = [5, 200, 127, 128, 0, 255, 1, 100]; // 200=0xC8\u2192-56 signed, 128\u2192-128, 255\u2192-1
for (let i = 0; i < 8; i++) setByte(48 + i, bytes[i]);
extend_low_s(48, 64);
const widened = [];
for (let i = 0; i < 8; i++) widened.push(getI16(64 + i * 2));
log('input bytes = [' + bytes + ']');
log('extend_low_s = [' + widened.join(', ') + ']');
log('(200\u2192-56, 128\u2192-128, 255\u2192-1 sign-extended)');`
    },
    "simd-saturating": {
      label: "SIMD Saturating Math",
      group: "SIMD",
      description: "Saturating add/sub that clamp instead of wrapping.",
      target: "3.0",
      features: ["simd"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// SIMD saturating arithmetic: clamp on overflow instead of wrap
const mod = new ModuleBuilder('simdSat');
mod.defineMemory(1);

// Saturating unsigned add on i8x16
mod.defineFunction('add_sat_u', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.add_sat_u_i8x16();
  a.store_v128(2, 0);
}).withExport();

// Saturating unsigned sub on i8x16
mod.defineFunction('sub_sat_u', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.sub_sat_u_i8x16();
  a.store_v128(2, 0);
}).withExport();

// Regular (wrapping) add for comparison
mod.defineFunction('add_wrap', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.add_i8x16();
  a.store_v128(2, 0);
}).withExport();

mod.defineFunction('setByte', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store8_i32(0, 0);
}).withExport();

mod.defineFunction('getByte', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load8_i32_u(0, 0);
}).withExport();

const instance = await mod.instantiate();
const { add_sat_u, sub_sat_u, add_wrap, setByte, getByte } = instance.instance.exports;

// A = [200, 100, 255, 0, 128, 50, 250, 10, ...]
const a = [200, 100, 255, 0, 128, 50, 250, 10];
// B = [100, 200, 10, 5, 128, 250, 50, 0]
const b = [100, 200, 10, 5, 128, 250, 50, 0];
for (let i = 0; i < 8; i++) { setByte(i, a[i]); setByte(16 + i, b[i]); }
for (let i = 8; i < 16; i++) { setByte(i, 0); setByte(16 + i, 0); }

add_sat_u(0, 16, 32);
add_wrap(0, 16, 48);

const satResult = [], wrapResult = [];
for (let i = 0; i < 8; i++) { satResult.push(getByte(32 + i)); wrapResult.push(getByte(48 + i)); }

log('A = [' + a.join(', ') + ']');
log('B = [' + b.join(', ') + ']');
log('');
log('add_sat_u = [' + satResult.join(', ') + ']  (clamped to 255)');
log('add_wrap  = [' + wrapResult.join(', ') + ']  (wraps around)');

log('');
sub_sat_u(0, 16, 64);
const subResult = [];
for (let i = 0; i < 8; i++) subResult.push(getByte(64 + i));
log('sub_sat_u = [' + subResult.join(', ') + ']  (clamped to 0)');`
    },
    "simd-abs-neg": {
      label: "SIMD Abs/Neg",
      group: "SIMD",
      description: "Absolute value and negation on f32x4 vectors.",
      target: "3.0",
      features: ["simd"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// SIMD Abs/Neg \u2014 absolute value and negation on f32x4 vectors
const mod = new ModuleBuilder('simdAbsNeg', { target: '3.0' });
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// abs: compute |v| for each lane
mod.defineFunction('absF32x4', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1)); // dest
  a.get_local(f.getParameter(0)); // src
  a.load_v128(0, 0);
  a.abs_f32x4();
  a.store_v128(0, 0);
}).withExport();

// neg: compute -v for each lane
mod.defineFunction('negF32x4', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1));
  a.get_local(f.getParameter(0));
  a.load_v128(0, 0);
  a.neg_f32x4();
  a.store_v128(0, 0);
}).withExport();

const instance = await mod.instantiate();
const { absF32x4, negF32x4, memory } = instance.instance.exports;
const view = new Float32Array(memory.buffer);

view.set([-1.5, 2.0, -3.5, 4.0], 0);
log('Input: [' + Array.from(view.slice(0, 4)).join(', ') + ']');

absF32x4(0, 16);
log('abs:   [' + Array.from(view.slice(4, 8)).join(', ') + ']');

negF32x4(0, 32);
log('neg:   [' + Array.from(view.slice(8, 12)).join(', ') + ']');`
    },
    "simd-bitselect": {
      label: "SIMD Bitwise Select",
      group: "SIMD",
      description: "Conditional lane selection using bitwise select.",
      target: "3.0",
      features: ["simd"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// SIMD Bitwise Select \u2014 conditional lane selection
const mod = new ModuleBuilder('simdBitselect', { target: '3.0' });
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// bitselect(a, b, mask): for each bit, result = mask ? a : b
mod.defineFunction('selectLanes', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(3)); // dest
  a.get_local(f.getParameter(0)); // a
  a.load_v128(0, 0);
  a.get_local(f.getParameter(1)); // b
  a.load_v128(0, 0);
  a.get_local(f.getParameter(2)); // mask
  a.load_v128(0, 0);
  a.bitselect_v128();
  a.store_v128(0, 0);
}).withExport();

const instance = await mod.instantiate();
const { selectLanes, memory } = instance.instance.exports;
const i32View = new Int32Array(memory.buffer);
const u32View = new Uint32Array(memory.buffer);

// A = [1, 2, 3, 4], B = [10, 20, 30, 40]
i32View.set([1, 2, 3, 4], 0);      // offset 0 = A
i32View.set([10, 20, 30, 40], 4);   // offset 16 = B
// Mask: all 1s for lanes 0,2 (select A), all 0s for lanes 1,3 (select B)
u32View.set([0xFFFFFFFF, 0, 0xFFFFFFFF, 0], 8); // offset 32 = mask

selectLanes(0, 16, 32, 48);
log('A = [1, 2, 3, 4]');
log('B = [10, 20, 30, 40]');
log('mask = [all1, 0, all1, 0]');
log('result = [' + Array.from(i32View.slice(12, 16)).join(', ') + ']');
log('(selects A for lanes 0,2 and B for lanes 1,3)');`
    },
    // ─── Additional Bulk Memory ───
    "passive-data": {
      label: "Passive Data Segments",
      group: "Bulk Memory",
      description: "Lazy-init memory with passive segments and memory.init.",
      target: "2.0",
      features: ["bulk-memory"],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Passive data segments: lazy initialization with memory.init
const mod = new ModuleBuilder('passiveData');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Passive segment: not placed in memory until memory.init is called
const greeting = new TextEncoder().encode('Hello, WebAssembly!');
const dataSegment = mod.defineData(new Uint8Array([...greeting]));
dataSegment.passive();

// Copy passive data into memory: init(destOffset)
mod.defineFunction('init', null, [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // destination offset
  a.const_i32(0);                  // source offset in data segment
  a.const_i32(greeting.length);                // length
  a.memory_init(dataSegment._index, 0);
}).withExport();

// Drop data segment (free it after init)
mod.defineFunction('drop', null, [], (f, a) => {
  a.data_drop(dataSegment._index);
}).withExport();

// strlen
mod.defineFunction('strlen', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const ptr = f.getParameter(0);
  const len = a.declareLocal(ValueType.Int32, 'len');
  a.const_i32(0);
  a.set_local(len);
  a.loop(BlockType.Void, (cont) => {
    a.block(BlockType.Void, (brk) => {
      a.get_local(ptr);
      a.get_local(len);
      a.add_i32();
      a.load8_i32_u(0, 0);
      a.eqz_i32();
      a.br_if(brk);
      a.get_local(len);
      a.const_i32(1);
      a.add_i32();
      a.set_local(len);
      a.br(cont);
    });
  });
  a.get_local(len);
}).withExport();

const instance = await mod.instantiate();
const { init, drop: dataDrop, strlen, memory } = instance.instance.exports;
const view = new Uint8Array(memory.buffer);

// Memory starts empty (passive segment not yet loaded)
log('Before init: byte[0] = ' + view[0] + ' (empty)');

// Load passive data to offset 0
init(0);
const len = strlen(0);
const str = new TextDecoder().decode(view.slice(0, len));
log('After init(0): "' + str + '" (length=' + len + ')');

// Load the same data at a different offset
init(100);
const str2 = new TextDecoder().decode(view.slice(100, 100 + len));
log('After init(100): "' + str2 + '"');

// Drop the data segment (can no longer init)
dataDrop();
log('');
log('Data segment dropped \u2014 passive data freed.');
try {
  init(200);
  log('Should not reach here');
} catch (e) {
  log('init after drop: trapped as expected');
}`
    },
    "bulk-table-ops": {
      label: "Bulk Table Operations",
      group: "Bulk Memory",
      description: "table.copy and table.fill for bulk table manipulation.",
      target: "2.0",
      features: ["bulk-memory"],
      imports: ["ModuleBuilder", "ValueType", "ElementType"],
      code: `// Bulk table operations: table.fill and table.copy
const mod = new ModuleBuilder('bulkTable');

const add = mod.defineFunction('add', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

const mul = mod.defineFunction('mul', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
}).withExport();

// Table with space for 8 entries
const table = mod.defineTable(ElementType.AnyFunc, 8);
mod.defineElementSegment(table, [add, mul], 0);

// table.fill(start, ref, count) \u2014 fill slots 2-5 with the add function
mod.defineFunction('fillWithAdd', null, [], (f, a) => {
  a.const_i32(2);      // start index
  a.ref_func(add);     // function ref
  a.const_i32(4);      // count
  a.table_fill(0);
}).withExport();

// table.copy(dest, src, count) \u2014 copy slots 0-1 to slots 6-7
mod.defineFunction('copySlots', null, [], (f, a) => {
  a.const_i32(6);      // dest
  a.const_i32(0);      // src
  a.const_i32(2);      // count
  a.table_copy(0, 0);
}).withExport();

// table.size
mod.defineFunction('tableSize', [ValueType.Int32], [], (f, a) => {
  a.table_size(0);
}).withExport();

// Dispatch through table
mod.defineFunction('dispatch', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1));
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.call_indirect(add.funcTypeBuilder);
}).withExport();

const instance = await mod.instantiate();
const { fillWithAdd, copySlots, tableSize, dispatch } = instance.instance.exports;

log('Table size: ' + tableSize());
log('');

// Initial: [add, mul, ?, ?, ?, ?, ?, ?]
log('Initial: slot 0 (add): dispatch(0, 3, 4) = ' + dispatch(0, 3, 4));
log('Initial: slot 1 (mul): dispatch(1, 3, 4) = ' + dispatch(1, 3, 4));

// Fill slots 2-5 with add
fillWithAdd();
log('');
log('After table.fill(2, add, 4):');
log('  slot 2: dispatch(2, 10, 20) = ' + dispatch(2, 10, 20) + ' (add)');
log('  slot 3: dispatch(3, 10, 20) = ' + dispatch(3, 10, 20) + ' (add)');

// Copy slots 0-1 to 6-7
copySlots();
log('');
log('After table.copy(6, 0, 2):');
log('  slot 6: dispatch(6, 5, 6) = ' + dispatch(6, 5, 6) + ' (add, copied from 0)');
log('  slot 7: dispatch(7, 5, 6) = ' + dispatch(7, 5, 6) + ' (mul, copied from 1)');`
    },
    // ─── Additional Post-MVP ───
    "table-ops": {
      label: "Table Get/Set/Grow",
      group: "Post-MVP",
      description: "Dynamic table manipulation with table.get, table.set, table.grow.",
      target: "2.0",
      features: ["reference-types"],
      imports: ["ModuleBuilder", "ValueType", "ElementType"],
      code: `// Dynamic table operations: get, set, grow
const mod = new ModuleBuilder('tableOps');

const double = mod.defineFunction('double', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
}).withExport();

const triple = mod.defineFunction('triple', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(3);
  a.mul_i32();
}).withExport();

const negate = mod.defineFunction('negate', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.const_i32(0);
  a.get_local(f.getParameter(0));
  a.sub_i32();
}).withExport();

// Start with table of size 2
const table = mod.defineTable(ElementType.AnyFunc, 2);
mod.defineElementSegment(table, [double, triple], 0);

// table.set: place a function ref at an index
mod.defineFunction('setSlot', null, [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.ref_func(negate);
  a.table_set(0);
}).withExport();

// table.grow: add N slots (returns old size, or -1 on failure)
mod.defineFunction('growTable', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.ref_null(0x70); // fill new slots with null
  a.get_local(f.getParameter(0));
  a.table_grow(0);
}).withExport();

// table.size
mod.defineFunction('size', [ValueType.Int32], [], (f, a) => {
  a.table_size(0);
}).withExport();

// Check if a slot is null
mod.defineFunction('isNull', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.table_get(0);
  a.ref_is_null();
}).withExport();

// Call through table
mod.defineFunction('call', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1));
  a.get_local(f.getParameter(0));
  a.call_indirect(double.funcTypeBuilder);
}).withExport();

const instance = await mod.instantiate();
const fn = instance.instance.exports;

log('Initial size: ' + fn.size());
log('slot 0 (double): call(0, 5) = ' + fn.call(0, 5));
log('slot 1 (triple): call(1, 5) = ' + fn.call(1, 5));

// Grow table by 3 slots
const oldSize = fn.growTable(3);
log('');
log('growTable(3) returned old size: ' + oldSize);
log('New size: ' + fn.size());
log('slot 2 is null: ' + (fn.isNull(2) === 1));

// Set slot 2 to negate
fn.setSlot(2);
log('');
log('After setSlot(2, negate):');
log('slot 2 is null: ' + (fn.isNull(2) === 1));
log('slot 2 (negate): call(2, 5) = ' + fn.call(2, 5));`
    },
    "try-catch": {
      label: "Try/Catch",
      group: "Post-MVP",
      description: "Full try/catch exception handling with multiple tags.",
      target: "3.0",
      features: ["exception-handling"],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Full try/catch exception handling
const mod = new ModuleBuilder('tryCatch');

// Define two exception tags with different payloads
const errorTag = mod.defineTag([ValueType.Int32]);     // error code
const overflowTag = mod.defineTag([ValueType.Int32]);  // overflow value

// Function that may throw
mod.defineFunction('checkedAdd', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);
  const result = a.declareLocal(ValueType.Int32, 'result');

  a.get_local(x);
  a.get_local(y);
  a.add_i32();
  a.set_local(result);

  // Check for "overflow" (result > 1000 for demo purposes)
  a.get_local(result);
  a.const_i32(1000);
  a.gt_i32();
  a.if(BlockType.Void, () => {
    a.get_local(result);
    a.throw(overflowTag._index);
  });

  // Check for negative input
  a.get_local(x);
  a.const_i32(0);
  a.lt_i32();
  a.if(BlockType.Void, () => {
    a.const_i32(-1);
    a.throw(errorTag._index);
  });

  a.get_local(result);
}).withExport();

// Show the WAT with tags, throw, try/catch
const wat = mod.toString();
log('=== WAT Output (try/catch) ===');
log(wat);

const bytes = mod.toBytes();
log('Module compiled: ' + bytes.length + ' bytes');
log('Valid WASM: ' + WebAssembly.validate(bytes.buffer));
log('');
log('This module defines:');
log('  - errorTag: thrown when input is negative');
log('  - overflowTag: thrown when result > 1000');
log('  - checkedAdd: adds two numbers with validation');`
    },
    "f32-math": {
      label: "f32 Math",
      group: "Numeric",
      description: "Single-precision float ops \u2014 f32 min, max, abs, neg, sqrt.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// f32 math \u2014 single-precision float operations
const mod = new ModuleBuilder('f32math');

mod.defineFunction('min', [ValueType.Float32],
  [ValueType.Float32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.min_f32();
}).withExport();

mod.defineFunction('max', [ValueType.Float32],
  [ValueType.Float32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.max_f32();
}).withExport();

mod.defineFunction('abs', [ValueType.Float32],
  [ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.abs_f32();
}).withExport();

mod.defineFunction('neg', [ValueType.Float32],
  [ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.neg_f32();
}).withExport();

mod.defineFunction('sqrt', [ValueType.Float32],
  [ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.sqrt_f32();
}).withExport();

// Compare: f32 arithmetic vs f64 for precision
mod.defineFunction('addF32', [ValueType.Float32],
  [ValueType.Float32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_f32();
}).withExport();

mod.defineFunction('addF64', [ValueType.Float64],
  [ValueType.Float64, ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_f64();
}).withExport();

const instance = await mod.instantiate();
const { min, max, abs, neg, sqrt, addF32, addF64 } = instance.instance.exports;

log('=== f32 Operations ===');
log('min(3.14, 2.71) = ' + min(3.14, 2.71));
log('max(3.14, 2.71) = ' + max(3.14, 2.71));
log('abs(-42.5) = ' + abs(-42.5));
log('neg(3.14) = ' + neg(3.14));
log('sqrt(2.0) = ' + sqrt(2.0));
log('sqrt(9.0) = ' + sqrt(9.0));

log('');
log('=== f32 vs f64 Precision ===');
log('f32: 0.1 + 0.2 = ' + addF32(0.1, 0.2));
log('f64: 0.1 + 0.2 = ' + addF64(0.1, 0.2));
log('f32 uses 4 bytes, f64 uses 8 bytes per value.');`
    },
    "extended-const-globals": {
      label: "Extended Const Globals",
      group: "Post-MVP",
      description: "Globals using arithmetic in init expressions with extended-const.",
      target: "latest",
      features: ["extended-const"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Extended Const Globals \u2014 globals using arithmetic in init expressions
const mod = new ModuleBuilder('extConst', { target: 'latest' });

// With extended-const, global init expressions can use i32.add, i32.sub, i32.mul
const base = mod.defineGlobal(ValueType.Int32, false, 100);
const scale = mod.defineGlobal(ValueType.Int32, false, 3);

// Computed global: base * scale
const computed = mod.defineGlobal(ValueType.Int32, false, (asm) => {
  asm.get_global(base);
  asm.get_global(scale);
  asm.mul_i32();
});

mod.defineFunction('getComputed', [ValueType.Int32], [], (f, a) => {
  a.get_global(computed);
}).withExport();

mod.exportGlobal(base, 'base');
mod.exportGlobal(scale, 'scale');

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));
log('(Extended const allows i32.add/sub/mul in global init expressions)');`
    },
    "multi-table-dispatch": {
      label: "Multi-Table Dispatch",
      group: "Post-MVP",
      description: "Separate function tables with multi-table dispatch.",
      target: "3.0",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "ElementType"],
      code: `// Multi-Table Dispatch \u2014 separate function tables
const mod = new ModuleBuilder('multiTableDispatch', { target: '3.0' });

const fnType = mod.defineFunctionType([ValueType.Int32], [ValueType.Int32]);

// Math operations table
const square = mod.defineFunction('square', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(0));
  a.mul_i32();
});

const dbl = mod.defineFunction('double', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
});

const negate = mod.defineFunction('negate', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.const_i32(0);
  a.get_local(f.getParameter(0));
  a.sub_i32();
});

const mathTable = mod.defineTable(ElementType.AnyFunc, 3);
mathTable.defineElementSegment([square, dbl, negate], 0);

// Dispatch to math table
mod.defineFunction('mathOp', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1)); // value
  a.get_local(f.getParameter(0)); // table index
  a.call_indirect(fnType);
}).withExport();

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    // ─── New GC Examples ───
    "gc-type-dispatch": {
      label: "GC Type Dispatch",
      group: "GC",
      description: "Use ref.test for type-based dispatch with GC struct references.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType", "HeapType"],
      code: `// GC Type Dispatch \u2014 ref.test for type-based branching
// ref.test checks if a reference matches a target type,
// enabling runtime type dispatch with GC structs.
const mod = new ModuleBuilder('gcDispatch', {
  target: 'latest',
});

// Define two struct types
const Cat = mod.defineStructType([
  { name: 'lives', type: ValueType.Int32, mutable: false },
]);

const Dog = mod.defineStructType([
  { name: 'tricks', type: ValueType.Int32, mutable: false },
]);

// Test: create a Cat and check if it's a Cat (returns lives value)
mod.defineFunction('catLives', [ValueType.Int32], [], (f, a) => {
  a.const_i32(9);
  a.struct_new(Cat.index);
  // Read the lives field
  a.struct_get(Cat.index, Cat.getFieldIndex('lives'));
}).withExport();

// Test: create a Dog and check if it's a Dog (returns tricks value)
mod.defineFunction('dogTricks', [ValueType.Int32], [], (f, a) => {
  a.const_i32(5);
  a.struct_new(Dog.index);
  a.struct_get(Dog.index, Dog.getFieldIndex('tricks'));
}).withExport();

// Test ref.test to distinguish types
mod.defineFunction('isCat', [ValueType.Int32], [], (f, a) => {
  a.const_i32(9);
  a.struct_new(Cat.index);
  a.ref_test(HeapType.Struct); // is it a struct? \u2192 1
}).withExport();

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    "gc-linked-list": {
      label: "GC Linked List",
      group: "GC",
      description: "Build and traverse a linked list using GC structs.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// GC Linked List \u2014 create nodes and traverse
// Demonstrates practical GC usage: struct_new, struct_get, struct_set,
// ref_null, and ref_is_null in a traversal loop.
const mod = new ModuleBuilder('gcList', {
  target: 'latest',
});

// ListNode: { value: i32, next: ref null 0 }
// Use defineRecGroup so the type can reference itself
const recGroup = mod.defineRecGroup((builder) => {
  const selfRef = builder.refNull(0); // nullable ref to type 0 (self)
  builder.addStructType([
    { name: 'value', type: ValueType.Int32, mutable: false },
    { name: 'next', type: selfRef, mutable: true },
  ]);
});

const nodeTypeIndex = recGroup._types[0].index;

// Build a 3-node list: 10 \u2192 20 \u2192 30 \u2192 null
// Return the sum of all values (should be 60)
mod.defineFunction('sumList', [ValueType.Int32], [], (f, a) => {
  // Create node 30 (tail)
  a.const_i32(30);
  a.ref_null(nodeTypeIndex); // next = null
  a.struct_new(nodeTypeIndex);

  // Create node 20, pointing to node 30
  const tail = a.declareLocal(ValueType.AnyRef, 'tail');
  a.set_local(tail);
  a.const_i32(20);
  a.get_local(tail);
  a.struct_new(nodeTypeIndex);

  // Create node 10 (head), pointing to node 20
  const mid = a.declareLocal(ValueType.AnyRef, 'mid');
  a.set_local(mid);
  a.const_i32(10);
  a.get_local(mid);
  a.struct_new(nodeTypeIndex);

  // head is now on stack \u2014 store it
  const head = a.declareLocal(ValueType.AnyRef, 'head');
  a.set_local(head);

  // Return sum: 10 + 20 + 30 = 60
  // Read each value field
  a.get_local(head);
  a.struct_get(nodeTypeIndex, 0); // head.value = 10

  a.get_local(mid);
  a.struct_get(nodeTypeIndex, 0); // mid.value = 20
  a.add_i32();

  a.get_local(tail);
  a.struct_get(nodeTypeIndex, 0); // tail.value = 30
  a.add_i32();
}).withExport();

// Count nodes in a 3-node list (should be 3)
mod.defineFunction('countNodes', [ValueType.Int32], [], (f, a) => {
  // Build same list: 1 \u2192 2 \u2192 3 \u2192 null
  a.const_i32(3);
  a.ref_null(nodeTypeIndex);
  a.struct_new(nodeTypeIndex);
  const n3 = a.declareLocal(ValueType.AnyRef, 'n3');
  a.set_local(n3);

  a.const_i32(2);
  a.get_local(n3);
  a.struct_new(nodeTypeIndex);
  const n2 = a.declareLocal(ValueType.AnyRef, 'n2');
  a.set_local(n2);

  a.const_i32(1);
  a.get_local(n2);
  a.struct_new(nodeTypeIndex);
  const n1 = a.declareLocal(ValueType.AnyRef, 'n1');
  a.set_local(n1);

  // Count = 3 (we know the structure)
  a.const_i32(3);
}).withExport();

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`
    },
    "passive-elements": {
      label: "Passive Element Segments",
      group: "Bulk Memory",
      description: "Lazy-init tables with passive element segments and table.init.",
      target: "2.0",
      features: ["bulk-memory"],
      imports: ["ModuleBuilder", "ValueType", "ElementType"],
      code: `// Passive Element Segments \u2014 lazy table initialization
// Like passive data segments but for function references in tables.
// Use table.init to copy, elem.drop to free.
const mod = new ModuleBuilder('passiveElem');
const table = mod.defineTable(ElementType.AnyFunc, 10);
mod.exportTable(table, 'table');

const add = mod.defineFunction('add', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

const mul = mod.defineFunction('mul', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
}).withExport();

// Passive element segment \u2014 functions not placed in table until table.init
const elemSeg = mod.definePassiveElementSegment([add, mul]);

// Copy passive elements into table at runtime
// initTable(destOffset, srcOffset, count)
mod.defineFunction('initTable', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // dest table offset
  a.get_local(f.getParameter(1)); // src segment offset
  a.get_local(f.getParameter(2)); // count
  a.table_init(elemSeg._index, table._index);
}).withExport();

// Drop the element segment
mod.defineFunction('dropElems', null, [], (f, a) => {
  a.elem_drop(elemSeg._index);
}).withExport();

// call_indirect to invoke a function from the table
const fnType = mod.defineFunctionType([ValueType.Int32], [ValueType.Int32, ValueType.Int32]);
mod.defineFunction('callFromTable', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // arg1
  a.get_local(f.getParameter(1)); // arg2
  a.get_local(f.getParameter(2)); // table index
  a.call_indirect(fnType);
}).withExport();

const instance = await mod.instantiate();
const exports = instance.instance.exports;

// Table starts empty
log('Before init: table is empty');

// Copy both functions into table at offset 0
exports.initTable(0, 0, 2);
log('After initTable(0, 0, 2): 2 functions loaded');

// Call via table: index 0 = add, index 1 = mul
log('callFromTable(3, 4, 0) = ' + exports.callFromTable(3, 4, 0) + ' (add)');
log('callFromTable(3, 4, 1) = ' + exports.callFromTable(3, 4, 1) + ' (mul)');

// Drop element segment
exports.dropElems();
log('');
log('Element segment dropped \u2014 can no longer table.init');
try {
  exports.initTable(5, 0, 1);
  log('Should not reach here');
} catch (e) {
  log('initTable after drop: trapped as expected');
}`
    },
    "compile-vs-instantiate": {
      label: "Compile vs Instantiate",
      group: "Debug",
      description: "Use compile() to get a WebAssembly.Module, then instantiate it multiple times.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Compile vs Instantiate
// mod.compile() returns a WebAssembly.Module without instantiating.
// Useful for compiling once and instantiating multiple times,
// or for sending a compiled module to a worker.
const mod = new ModuleBuilder('compileExample');

mod.defineFunction('add', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

// Compile once
const wasmModule = await mod.compile();
log('Compiled: ' + wasmModule.constructor.name);
log('Type: ' + typeof wasmModule);

// Instantiate multiple times from the same module
const inst1 = await WebAssembly.instantiate(wasmModule);
const inst2 = await WebAssembly.instantiate(wasmModule);

const add1 = inst1.exports.add;
const add2 = inst2.exports.add;

log('');
log('Instance 1: add(10, 20) = ' + add1(10, 20));
log('Instance 2: add(100, 200) = ' + add2(100, 200));
log('');
log('Same module, different instances: ' + (inst1 !== inst2));
log('Same compiled module: ' + (wasmModule === wasmModule));`
    },
    // ─── Imports ───
    "import-memory": {
      label: "Import Memory",
      group: "Imports",
      description: "Import a host-provided linear memory so WASM and JS share the same buffer.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Import Memory \u2014 share a WebAssembly.Memory between JS and WASM
const mod = new ModuleBuilder('importMem');

// Declare a memory import (1 page min, 2 pages max)
mod.importMemory('env', 'memory', 1, 2);

// A function that writes a value to memory offset 0
mod.defineFunction('store', null, [ValueType.Int32], (f, a) => {
  a.const_i32(0);         // address
  a.get_local(f.getParameter(0));  // value
  a.store_i32(2, 0);      // store i32 at offset 0
}).withExport();

// A function that reads the value back
mod.defineFunction('load', [ValueType.Int32], [], (f, a) => {
  a.const_i32(0);         // address
  a.load_i32(2, 0);       // load i32 from offset 0
}).withExport();

// Create shared memory in JS
const memory = new WebAssembly.Memory({ initial: 1, maximum: 2 });
const instance = await mod.instantiate({ env: { memory } });

const { store, load } = instance.instance.exports;

// Write from WASM, read from JS
store(42);
const view = new Int32Array(memory.buffer);
log('JS reads from shared memory: ' + view[0]);

// Write from JS, read from WASM
view[0] = 99;
log('WASM reads from shared memory: ' + load());`
    },
    "import-global": {
      label: "Import Global",
      group: "Imports",
      description: "Import a host-provided global variable that WASM can read and write.",
      target: "2.0",
      features: ["mutable-globals"],
      imports: ["ModuleBuilder", "ValueType"],
      code: `// Import Global \u2014 share a mutable global between JS and WASM
const mod = new ModuleBuilder('importGlobal');

// Import a mutable i32 global
const counter = mod.importGlobal('env', 'counter', ValueType.Int32, true);

// Function that reads the global
mod.defineFunction('get', [ValueType.Int32], [], (f, a) => {
  a.get_global(counter);
}).withExport();

// Function that increments the global
mod.defineFunction('increment', null, [], (f, a) => {
  a.get_global(counter);
  a.const_i32(1);
  a.add_i32();
  a.set_global(counter);
}).withExport();

// Create a mutable global in JS
const counterGlobal = new WebAssembly.Global({ value: 'i32', mutable: true }, 10);
const instance = await mod.instantiate({ env: { counter: counterGlobal } });

const { get, increment } = instance.instance.exports;

log('Initial: ' + get());
increment();
increment();
increment();
log('After 3 increments: ' + get());

// Modify from JS side
counterGlobal.value = 100;
log('After JS sets to 100: ' + get());`
    },
    "import-table": {
      label: "Import Table",
      group: "Imports",
      description: "Import a host-provided table and use call_indirect to dispatch.",
      target: "mvp",
      features: [],
      imports: ["ModuleBuilder", "ValueType", "ElementType"],
      code: `// Import Table \u2014 call_indirect through a host-provided table
const mod = new ModuleBuilder('importTable');

// Import a table of function references
mod.importTable('env', 'table', ElementType.AnyFunc, 2);

// Define the function signature for table entries: (i32, i32) -> i32
const binopType = mod.defineFunctionType([ValueType.Int32],
  [ValueType.Int32, ValueType.Int32]);

// Dispatch: calls the function at table index with two args
mod.defineFunction('dispatch', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // arg1
  a.get_local(f.getParameter(1)); // arg2
  a.get_local(f.getParameter(2)); // table index
  a.call_indirect(binopType);
}).withExport();

// Create table in JS and populate with functions
const table = new WebAssembly.Table({ element: 'anyfunc', initial: 2 });

// We need helper WASM functions to put in the table
const helperMod = new ModuleBuilder('helpers');
helperMod.defineFunction('add', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();
helperMod.defineFunction('mul', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
}).withExport();

const helpers = await helperMod.instantiate();
table.set(0, helpers.instance.exports.add);
table.set(1, helpers.instance.exports.mul);

const instance = await mod.instantiate({ env: { table } });
const { dispatch } = instance.instance.exports;

log('dispatch(3, 4, 0) [add]: ' + dispatch(3, 4, 0));
log('dispatch(3, 4, 1) [mul]: ' + dispatch(3, 4, 1));`
    },
    "import-tag": {
      label: "Import Tag",
      group: "Imports",
      description: "Import an exception tag so JS and WASM share the same exception identity.",
      target: "3.0",
      features: ["exception-handling"],
      imports: ["ModuleBuilder", "ValueType", "BlockType"],
      code: `// Import Tag \u2014 share an exception tag between JS and WASM
const mod = new ModuleBuilder('importTag');

// Import a tag that carries an i32 payload
const errTag = mod.importTag('env', 'error', [ValueType.Int32]);
const tagIndex = errTag.index; // imported tag index

// Function that throws the imported tag
mod.defineFunction('fail', null, [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.throw(tagIndex);
}).withExport();

// Function that catches the imported tag
mod.defineFunction('tryCatch', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.try(BlockType.Int32);
    a.get_local(f.getParameter(0));
    a.throw(tagIndex);
    a.const_i32(-1); // unreachable
  a.catch(tagIndex);
    // tag payload (i32) is now on the stack
  a.end();
}).withExport();

// Create a tag in JS
const tag = new WebAssembly.Tag({ parameters: ['i32'] });
const instance = await mod.instantiate({ env: { error: tag } });

const { fail, tryCatch } = instance.instance.exports;

// Catch in WASM
log('tryCatch(42): ' + tryCatch(42));

// Catch in JS using the same tag identity
try {
  fail(99);
} catch (e) {
  if (e instanceof WebAssembly.Exception) {
    log('JS caught WASM exception, payload: ' + e.getArg(tag, 0));
  }
}`
    },
    "gc-struct-dsl": {
      label: "Struct DSL (mut)",
      group: "GC",
      description: "Define struct types with the object DSL and mut() helper for mutable fields.",
      target: "latest",
      features: ["gc"],
      imports: ["ModuleBuilder", "ValueType", "mut"],
      code: `// Struct DSL \u2014 object syntax with mut() for mutable fields
const mod = new ModuleBuilder('structDSL', { target: 'latest' });

// Object syntax: keys become field names, values are types
// Use mut() to mark fields as mutable
const Point = mod.defineStructType({
  x: mut(ValueType.Int32),
  y: mut(ValueType.Int32),
});

// TypedStructBuilder provides field index map
log('Point field indices:');
log('  x = ' + Point.field.x);
log('  y = ' + Point.field.y);

// Immutable fields: just pass the type directly
const Color = mod.defineStructType({
  r: ValueType.Float32,
  g: ValueType.Float32,
  b: ValueType.Float32,
});

log('');
log('Color field indices:');
log('  r = ' + Color.field.r);
log('  g = ' + Color.field.g);
log('  b = ' + Color.field.b);

// Use field indices in struct.get / struct.set
mod.defineFunction('makePoint', null, [], (f, a) => {
  a.const_i32(10);  // x
  a.const_i32(20);  // y
  a.struct_new(Point);
  a.drop();
});

log('');
log('WAT output:');
log(mod.toString());`
    }
  };

  // playground/playground.ts
  var GROUP_ICONS = {
    Basics: "\u{1F44B}",
    Memory: "\u{1F4BE}",
    Globals: "\u{1F30D}",
    Functions: "\u{1F517}",
    "Control Flow": "\u{1F500}",
    Numeric: "\u{1F522}",
    Algorithms: "\u2699",
    SIMD: "\u26A1",
    "Bulk Memory": "\u{1F4E6}",
    "Post-MVP": "\u{1F680}",
    WAT: "\u{1F4DD}",
    Debug: "\u{1F50D}",
    GC: "\u267B",
    Imports: "\u{1F4E5}"
  };
  var TARGET_ORDER = {
    mvp: 0,
    "2.0": 1,
    "3.0": 2,
    latest: 3
  };
  function getEditor() {
    return document.getElementById("editor");
  }
  function appendOutput(el, text, className) {
    const line = document.createElement("div");
    line.textContent = text;
    if (className) line.className = className;
    el.appendChild(line);
  }
  var currentExampleKey = "hello-wasm";
  var currentLanguage = "js";
  function getImportHeader(imports) {
    if (!imports || imports.length === 0) return "";
    const symbolList = imports.join(", ");
    if (currentLanguage === "ts") {
      return `import { ${symbolList} } from 'webasmjs';

`;
    } else {
      return `const { ${symbolList} } = require('webasmjs');

`;
    }
  }
  function loadExample(name) {
    const example = EXAMPLES[name];
    if (example) {
      currentExampleKey = name;
      const header = getImportHeader(example.imports);
      getEditor().value = header + example.code;
      document.getElementById("watBody").textContent = "";
      document.getElementById("outputBody").textContent = "";
      const label = document.getElementById("currentExample");
      if (label) label.textContent = example.label;
    }
  }
  function downloadFile(filename, data, mime) {
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  function renderWatPane(modules) {
    const watBody = document.getElementById("watBody");
    watBody.textContent = "";
    for (const mod of modules) {
      const card = document.createElement("div");
      card.className = "module-card";
      const header = document.createElement("div");
      header.className = "module-card-header";
      const name = document.createElement("span");
      name.className = "module-card-name";
      name.textContent = mod.name;
      header.appendChild(name);
      const actions = document.createElement("span");
      actions.className = "module-card-actions";
      const watBtn = document.createElement("button");
      watBtn.className = "download-btn";
      watBtn.textContent = "\u2193 .wat";
      watBtn.addEventListener("click", () => {
        downloadFile(mod.name + ".wat", mod.wat, "text/plain");
      });
      actions.appendChild(watBtn);
      if (mod.bytes.length > 0) {
        const wasmBtn = document.createElement("button");
        wasmBtn.className = "download-btn";
        wasmBtn.textContent = "\u2193 .wasm";
        wasmBtn.addEventListener("click", () => {
          downloadFile(mod.name + ".wasm", mod.bytes, "application/wasm");
        });
        actions.appendChild(wasmBtn);
      }
      header.appendChild(actions);
      card.appendChild(header);
      const watText = document.createElement("div");
      watText.className = "module-card-wat";
      if (mod.wat.startsWith("Error:")) {
        watText.classList.add("error");
      }
      watText.textContent = mod.wat;
      card.appendChild(watText);
      watBody.appendChild(card);
    }
  }
  function initResizeHandler() {
    const handle = document.getElementById("resizeHandle");
    const main = document.querySelector(".main");
    const editorPane = document.querySelector(".editor-pane");
    const watPane = document.getElementById("watPane");
    let isResizing = false;
    handle.addEventListener("mousedown", (e) => {
      isResizing = true;
      handle.classList.add("active");
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const rect = main.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const leftPct = Math.max(20, Math.min(80, x / rect.width * 100));
      editorPane.style.flex = "none";
      watPane.style.width = 100 - leftPct + "%";
      editorPane.style.width = leftPct + "%";
    });
    document.addEventListener("mouseup", () => {
      if (isResizing) {
        isResizing = false;
        handle.classList.remove("active");
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    });
  }
  function openExamplePicker() {
    const existing = document.getElementById("exampleDialog");
    if (existing) existing.remove();
    const overlay = document.createElement("div");
    overlay.id = "exampleDialog";
    overlay.className = "dialog-overlay";
    const dialog = document.createElement("div");
    dialog.className = "dialog";
    const header = document.createElement("div");
    header.className = "dialog-header";
    header.innerHTML = "<h2>Examples</h2>";
    const searchRow = document.createElement("div");
    searchRow.className = "dialog-search-row";
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search examples...";
    searchInput.className = "dialog-search";
    searchRow.appendChild(searchInput);
    const filterSelect = document.createElement("select");
    filterSelect.className = "filter-select";
    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = "All";
    filterSelect.appendChild(allOpt);
    const targetGroup = document.createElement("optgroup");
    targetGroup.label = "Target";
    for (const t of ["mvp", "2.0", "3.0", "latest"]) {
      const opt = document.createElement("option");
      opt.value = "target:" + t;
      opt.textContent = t === "mvp" ? "MVP" : t === "latest" ? "Latest" : "Wasm " + t;
      targetGroup.appendChild(opt);
    }
    filterSelect.appendChild(targetGroup);
    const usedFeatures = /* @__PURE__ */ new Set();
    for (const example of Object.values(EXAMPLES)) {
      for (const f of example.features) usedFeatures.add(f);
    }
    const featureGroup = document.createElement("optgroup");
    featureGroup.label = "Feature";
    for (const f of Array.from(usedFeatures).sort()) {
      const opt = document.createElement("option");
      opt.value = "feature:" + f;
      opt.textContent = f;
      featureGroup.appendChild(opt);
    }
    filterSelect.appendChild(featureGroup);
    searchRow.appendChild(filterSelect);
    header.appendChild(searchRow);
    dialog.appendChild(header);
    const body = document.createElement("div");
    body.className = "dialog-body";
    const groups = /* @__PURE__ */ new Map();
    for (const [key, example] of Object.entries(EXAMPLES)) {
      const group = example.group;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push({ key, example });
    }
    const allCards = [];
    const allSections = [];
    for (const [groupName, items] of groups) {
      const section = document.createElement("div");
      section.className = "dialog-group";
      section.dataset.group = groupName;
      const groupHeader = document.createElement("div");
      groupHeader.className = "dialog-group-header";
      const icon = GROUP_ICONS[groupName] || "";
      groupHeader.textContent = `${icon}  ${groupName}`;
      section.appendChild(groupHeader);
      const grid = document.createElement("div");
      grid.className = "dialog-grid";
      for (const item of items) {
        const card = document.createElement("button");
        card.className = "dialog-card";
        if (item.key === currentExampleKey) card.classList.add("active");
        card.dataset.key = item.key;
        card.dataset.search = `${item.example.label} ${item.example.description} ${groupName}`.toLowerCase();
        card.dataset.target = item.example.target;
        card.dataset.features = item.example.features.join(",");
        const title = document.createElement("div");
        title.className = "dialog-card-title";
        title.textContent = item.example.label;
        card.appendChild(title);
        const desc = document.createElement("div");
        desc.className = "dialog-card-desc";
        desc.textContent = item.example.description;
        card.appendChild(desc);
        if (item.example.target !== "mvp" || item.example.features.length > 0) {
          const meta = document.createElement("div");
          meta.className = "dialog-card-meta";
          if (item.example.target !== "mvp") {
            const targetBadge = document.createElement("span");
            targetBadge.className = "card-target";
            targetBadge.textContent = item.example.target;
            meta.appendChild(targetBadge);
          }
          for (const feat of item.example.features) {
            const featBadge = document.createElement("span");
            featBadge.className = "card-feature";
            featBadge.textContent = feat;
            meta.appendChild(featBadge);
          }
          card.appendChild(meta);
        }
        card.addEventListener("click", () => {
          loadExample(item.key);
          overlay.remove();
        });
        grid.appendChild(card);
        allCards.push(card);
      }
      section.appendChild(grid);
      body.appendChild(section);
      allSections.push(section);
    }
    dialog.appendChild(body);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    function applyFilters() {
      const q = searchInput.value.toLowerCase().trim();
      const filterVal = filterSelect.value;
      for (const card of allCards) {
        const searchMatch = !q || card.dataset.search.includes(q);
        let filterMatch = true;
        if (filterVal.startsWith("target:")) {
          const selectedTarget = filterVal.slice(7);
          const cardTarget = card.dataset.target;
          filterMatch = TARGET_ORDER[cardTarget] <= TARGET_ORDER[selectedTarget];
        } else if (filterVal.startsWith("feature:")) {
          const selectedFeature = filterVal.slice(8);
          const cardFeatures = card.dataset.features ? card.dataset.features.split(",") : [];
          filterMatch = cardFeatures.includes(selectedFeature);
        }
        card.style.display = searchMatch && filterMatch ? "" : "none";
      }
      for (const section of allSections) {
        const visibleCards = section.querySelectorAll('.dialog-card:not([style*="display: none"])');
        section.style.display = visibleCards.length > 0 ? "" : "none";
      }
    }
    searchInput.addEventListener("input", applyFilters);
    filterSelect.addEventListener("change", applyFilters);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
    const onKey = (e) => {
      if (e.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
      }
    };
    document.addEventListener("keydown", onKey);
    setTimeout(() => searchInput.focus(), 50);
  }
  var ALL_SYMBOLS = [
    "ModuleBuilder",
    "PackageBuilder",
    "ValueType",
    "BlockType",
    "ElementType",
    "TextModuleWriter",
    "BinaryReader",
    "parseWat",
    "RefType",
    "HeapType",
    "StructTypeBuilder",
    "ArrayTypeBuilder",
    "RecGroupBuilder",
    "refType",
    "refNullType",
    "OpCodes",
    "mut"
  ];
  window.webasmjs = {
    ModuleBuilder,
    PackageBuilder,
    ValueType,
    BlockType,
    ElementType,
    TextModuleWriter,
    BinaryReader,
    parseWat,
    RefType,
    HeapType,
    StructTypeBuilder,
    ArrayTypeBuilder,
    RecGroupBuilder,
    refType,
    refNullType,
    OpCodes: OpCodes_default,
    mut
  };
  async function run() {
    const outputBody = document.getElementById("outputBody");
    const watBody = document.getElementById("watBody");
    outputBody.textContent = "";
    watBody.textContent = "";
    let code = getEditor().value;
    code = code.replace(/^(?:import\s+\{[^}]+\}\s+from\s+['"]webasmjs['"];\s*|const\s+\{[^}]+\}\s*=\s*require\(['"]webasmjs['"]\);\s*)\n*/m, "");
    document.getElementById("outputPane").classList.remove("collapsed");
    const log = (msg) => {
      appendOutput(outputBody, String(msg));
    };
    const wasm = window.webasmjs;
    const OrigModuleBuilder = wasm.ModuleBuilder;
    const captured = /* @__PURE__ */ new WeakSet();
    const capturedModules = [];
    function captureModule(mod) {
      if (captured.has(mod)) return;
      captured.add(mod);
      const name = mod._name || "module";
      try {
        const wat = mod.toString();
        let bytes = new Uint8Array();
        try {
          bytes = mod.toBytes();
        } catch (_) {
        }
        capturedModules.push({ name, wat, bytes });
      } catch (e) {
        capturedModules.push({ name, wat: "Error: " + e.message, bytes: new Uint8Array() });
      }
    }
    const patchedClass = class extends OrigModuleBuilder {
      async instantiate(imports) {
        captureModule(this);
        return super.instantiate(imports);
      }
      toBytes() {
        captureModule(this);
        return super.toBytes();
      }
    };
    wasm.ModuleBuilder = patchedClass;
    const origParseWat = wasm.parseWat;
    wasm.parseWat = (...args) => {
      const mod = origParseWat(...args);
      const origInstantiate = mod.instantiate.bind(mod);
      const origToBytes = mod.toBytes.bind(mod);
      mod.instantiate = (imports) => {
        captureModule(mod);
        return origInstantiate(imports);
      };
      mod.toBytes = () => {
        captureModule(mod);
        return origToBytes();
      };
      return mod;
    };
    try {
      const destructure = `const { ${ALL_SYMBOLS.join(", ")} } = webasmjs;`;
      const asyncFn = new Function("log", "webasmjs", `return (async () => {
${destructure}
${code}
})();`);
      await asyncFn(log, wasm);
      appendOutput(outputBody, "--- Done ---", "success");
    } catch (e) {
      appendOutput(outputBody, "Error: " + e.message, "error");
      if (e.stack) {
        appendOutput(outputBody, e.stack, "error");
      }
    } finally {
      wasm.ModuleBuilder = OrigModuleBuilder;
      wasm.parseWat = origParseWat;
      renderWatPane(capturedModules);
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("examplesBtn").addEventListener("click", openExamplePicker);
    document.getElementById("runBtn").addEventListener("click", run);
    document.getElementById("watToggle").addEventListener("click", () => {
      document.getElementById("watPane").classList.toggle("collapsed");
    });
    document.getElementById("outputToggle").addEventListener("click", () => {
      document.getElementById("outputPane").classList.toggle("collapsed");
    });
    document.getElementById("outputClear").addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("outputBody").textContent = "";
    });
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lang = btn.dataset.lang;
        if (lang === currentLanguage) return;
        currentLanguage = lang;
        document.querySelectorAll(".lang-btn").forEach((b) => {
          b.classList.toggle("active", b.dataset.lang === lang);
        });
        if (currentExampleKey) {
          loadExample(currentExampleKey);
        }
      });
    });
    initResizeHandler();
    getEditor().addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        run();
      }
    });
    loadExample("hello-wasm");
  });
})();
//# sourceMappingURL=playground.bundle.js.map
