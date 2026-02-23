/**
 * Language-level type descriptors used in the WASM binary encoding.
 * Each type has a name, binary value, and short identifier.
 */
export interface LanguageTypeDescriptor {
  readonly name: string;
  readonly value: number;
  readonly short: string;
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
 * WASM value types (i32, i64, f32, f64, v128).
 */
export const ValueType = {
  Int32: LanguageType.Int32,
  Int64: LanguageType.Int64,
  Float32: LanguageType.Float32,
  Float64: LanguageType.Float64,
  V128: { name: 'v128', value: 0x7b, short: 'v' } as const,
} as const;

export type ValueTypeDescriptor = typeof ValueType[keyof typeof ValueType];
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
} as const;

export type BlockTypeDescriptor = typeof BlockType[keyof typeof BlockType];

/**
 * Element types for tables.
 */
export const ElementType = {
  AnyFunc: LanguageType.AnyFunc,
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
  | 'multi-value';

/**
 * WASM version targets. Each target enables a set of features.
 */
export type WasmTarget = 'mvp' | '2.0' | 'latest';

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
