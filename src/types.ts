/**
 * Language-level type descriptors used in the WASM binary encoding.
 * Each type has a name, binary value, and short identifier.
 */
export interface LanguageTypeDescriptor {
  readonly name: string;
  readonly value: number;
  readonly short: string;
}

/**
 * Descriptor for concrete reference types: (ref $type) and (ref null $type).
 * These require multi-byte encoding: prefix + LEB128 type index.
 */
export interface ConcreteRefTypeDescriptor extends LanguageTypeDescriptor {
  readonly refPrefix: number;
  readonly typeIndex: number;
}

export function isConcreteRefType(vt: LanguageTypeDescriptor): vt is ConcreteRefTypeDescriptor {
  return 'refPrefix' in vt;
}

export const LanguageType = {
  Int32: { name: 'i32', value: 0x7f, short: 'i' } as const,
  Int64: { name: 'i64', value: 0x7e, short: 'l' } as const,
  Float32: { name: 'f32', value: 0x7d, short: 's' } as const,
  Float64: { name: 'f64', value: 0x7c, short: 'd' } as const,
  AnyFunc: { name: 'anyfunc', value: 0x70, short: 'a' } as const,
  Func: { name: 'func', value: 0x60, short: 'f' } as const,
  Void: { name: 'void', value: 0x40, short: 'v' } as const,
} as const;

export type LanguageTypeKey = keyof typeof LanguageType;

/**
 * GC reference type descriptors.
 */
export const RefType = {
  FuncRef: { name: 'funcref', value: 0x70, short: 'F' } as const,
  ExternRef: { name: 'externref', value: 0x6f, short: 'X' } as const,
  AnyRef: { name: 'anyref', value: 0x6e, short: 'A' } as const,
  EqRef: { name: 'eqref', value: 0x6d, short: 'E' } as const,
  I31Ref: { name: 'i31ref', value: 0x6c, short: 'J' } as const,
  StructRef: { name: 'structref', value: 0x6b, short: 'S' } as const,
  ArrayRef: { name: 'arrayref', value: 0x6a, short: 'R' } as const,
  NullRef: { name: 'nullref', value: 0x71, short: 'N' } as const,
  NullFuncRef: { name: 'nullfuncref', value: 0x73, short: 'Z' } as const,
  NullExternRef: { name: 'nullexternref', value: 0x72, short: 'W' } as const,
} as const;

export type RefTypeDescriptor = typeof RefType[keyof typeof RefType];

/**
 * Abstract heap types used as immediates in ref.test, ref.cast, br_on_cast, etc.
 */
export const HeapType = {
  Func: { name: 'func', value: 0x70 } as const,
  Extern: { name: 'extern', value: 0x6f } as const,
  Any: { name: 'any', value: 0x6e } as const,
  Eq: { name: 'eq', value: 0x6d } as const,
  I31: { name: 'i31', value: 0x6c } as const,
  Struct: { name: 'struct', value: 0x6b } as const,
  Array: { name: 'array', value: 0x6a } as const,
  None: { name: 'none', value: 0x71 } as const,
  NoFunc: { name: 'nofunc', value: 0x73 } as const,
  NoExtern: { name: 'noextern', value: 0x72 } as const,
} as const;

export type HeapTypeDescriptor = typeof HeapType[keyof typeof HeapType];

/**
 * Prefix bytes for concrete reference types: (ref $type) and (ref null $type).
 */
export const RefTypePrefix = {
  Ref: 0x64,
  RefNull: 0x63,
} as const;

/**
 * Create a concrete non-nullable reference type: (ref $typeIndex).
 */
export function refType(typeIndex: number, name?: string): ConcreteRefTypeDescriptor {
  return {
    name: name || `(ref ${typeIndex})`,
    value: RefTypePrefix.Ref,
    short: `r${typeIndex}`,
    refPrefix: RefTypePrefix.Ref,
    typeIndex,
  };
}

/**
 * Create a concrete nullable reference type: (ref null $typeIndex).
 */
export function refNullType(typeIndex: number, name?: string): ConcreteRefTypeDescriptor {
  return {
    name: name || `(ref null ${typeIndex})`,
    value: RefTypePrefix.RefNull,
    short: `n${typeIndex}`,
    refPrefix: RefTypePrefix.RefNull,
    typeIndex,
  };
}

/**
 * WASM value types (i32, i64, f32, f64, v128, reference types).
 */
export const ValueType = {
  Int32: LanguageType.Int32,
  Int64: LanguageType.Int64,
  Float32: LanguageType.Float32,
  Float64: LanguageType.Float64,
  V128: { name: 'v128', value: 0x7b, short: 'v' } as const,
  FuncRef: RefType.FuncRef,
  ExternRef: RefType.ExternRef,
  AnyRef: RefType.AnyRef,
  EqRef: RefType.EqRef,
  I31Ref: RefType.I31Ref,
  StructRef: RefType.StructRef,
  ArrayRef: RefType.ArrayRef,
  NullRef: RefType.NullRef,
  NullFuncRef: RefType.NullFuncRef,
  NullExternRef: RefType.NullExternRef,
} as const;

export type ValueTypeDescriptor = typeof ValueType[keyof typeof ValueType] | ConcreteRefTypeDescriptor;
export type ValueTypeKey = keyof typeof ValueType;

/**
 * Block return types (value types + void).
 */
export const BlockType = {
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
  ArrayRef: RefType.ArrayRef,
} as const;

export type BlockTypeDescriptor = typeof BlockType[keyof typeof BlockType];

/**
 * Element types for tables.
 */
export const ElementType = {
  AnyFunc: LanguageType.AnyFunc,
  FuncRef: RefType.FuncRef,
  ExternRef: RefType.ExternRef,
  AnyRef: RefType.AnyRef,
} as const;

export type ElementTypeDescriptor = typeof ElementType[keyof typeof ElementType];

/**
 * Import/export external kinds.
 */
export interface ExternalKindDescriptor {
  readonly name: string;
  readonly value: number;
}

export const ExternalKind = {
  Function: { name: 'Function', value: 0 } as const,
  Table: { name: 'Table', value: 1 } as const,
  Memory: { name: 'Memory', value: 2 } as const,
  Global: { name: 'Global', value: 3 } as const,
} as const;

export type ExternalKindType = typeof ExternalKind[keyof typeof ExternalKind];

/**
 * WASM binary section types.
 */
export interface SectionTypeDescriptor {
  readonly name: string;
  readonly value: number;
}

export const SectionType = {
  Type: { name: 'Type', value: 1 } as const,
  Import: { name: 'Import', value: 2 } as const,
  Function: { name: 'Function', value: 3 } as const,
  Table: { name: 'Table', value: 4 } as const,
  Memory: { name: 'Memory', value: 5 } as const,
  Global: { name: 'Global', value: 6 } as const,
  Export: { name: 'Export', value: 7 } as const,
  Start: { name: 'Start', value: 8 } as const,
  Element: { name: 'Element', value: 9 } as const,
  Code: { name: 'Code', value: 10 } as const,
  Data: { name: 'Data', value: 11 } as const,
  DataCount: { name: 'DataCount', value: 12 } as const,
  Tag: { name: 'Tag', value: 13 } as const,
  createCustom(name: string): SectionTypeDescriptor {
    return { name, value: 0 };
  },
} as const;

/**
 * Type form descriptors.
 */
export const TypeForm = {
  Func: { name: 'func', value: 0x60 } as const,
  Block: { name: 'block', value: 0x40 } as const,
  Struct: { name: 'struct', value: 0x5f } as const,
  Array: { name: 'array', value: 0x5e } as const,
  Rec: { name: 'rec', value: 0x4e } as const,
  Sub: { name: 'sub', value: 0x50 } as const,
  SubFinal: { name: 'sub_final', value: 0x4f } as const,
} as const;

/**
 * Immediate operand types for instructions.
 */
export enum ImmediateType {
  BlockSignature = 'BlockSignature',
  RelativeDepth = 'RelativeDepth',
  BranchTable = 'BranchTable',
  Function = 'Function',
  IndirectFunction = 'IndirectFunction',
  Local = 'Local',
  Global = 'Global',
  Float32 = 'Float32',
  Float64 = 'Float64',
  VarInt32 = 'VarInt32',
  VarInt64 = 'VarInt64',
  VarUInt1 = 'VarUInt1',
  VarUInt32 = 'VarUInt32',
  MemoryImmediate = 'MemoryImmediate',
  V128Const = 'V128Const',
  LaneIndex = 'LaneIndex',
  ShuffleMask = 'ShuffleMask',
  TypeIndexField = 'TypeIndexField',
  TypeIndexIndex = 'TypeIndexIndex',
  HeapType = 'HeapType',
  BrOnCast = 'BrOnCast',
}

/**
 * Context types for initialization expressions.
 */
export enum InitExpressionType {
  Global = 'Global',
  Element = 'Element',
  Data = 'Data',
}

/**
 * WASM post-MVP feature extensions.
 */
export type WasmFeature =
  | 'sign-extend'
  | 'sat-trunc'
  | 'bulk-memory'
  | 'reference-types'
  | 'simd'
  | 'multi-value'
  | 'mutable-globals'
  | 'tail-call'
  | 'extended-const'
  | 'threads'
  | 'exception-handling'
  | 'multi-memory'
  | 'multi-table'
  | 'relaxed-simd'
  | 'memory64'
  | 'gc';

/**
 * WASM version targets. Each target enables a set of features.
 */
export type WasmTarget = 'mvp' | '2.0' | '3.0' | 'latest';

/**
 * Options for module building.
 */
export interface ModuleBuilderOptions {
  generateNameSection?: boolean;
  disableVerification?: boolean;
  target?: WasmTarget;
  features?: WasmFeature[];
}

/**
 * Opcode definition structure.
 */
export interface OpCodeDef {
  readonly value: number;
  readonly mnemonic: string;
  readonly immediate?: string;
  readonly controlFlow?: string;
  readonly stackBehavior: string;
  readonly popOperands?: readonly string[];
  readonly pushOperands?: readonly string[];
  readonly prefix?: number;
  readonly feature?: WasmFeature;
}

/**
 * Interface for objects that can write themselves to a BinaryWriter.
 */
export interface Writable {
  write(writer: import('./BinaryWriter').default): void;
}

/**
 * Write a value type to a BinaryWriter, handling both single-byte abstract types
 * and multi-byte concrete reference types.
 */
export function writeValueType(writer: import('./BinaryWriter').default, vt: ValueTypeDescriptor): void {
  if (isConcreteRefType(vt)) {
    writer.writeVarInt7(vt.refPrefix);
    writer.writeVarInt32(vt.typeIndex);
  } else {
    writer.writeVarInt7(vt.value);
  }
}
