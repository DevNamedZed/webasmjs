// ─── Core builders ───
export { default as ModuleBuilder } from './ModuleBuilder';
export { default as PackageBuilder } from './PackageBuilder';
export { default as FunctionBuilder } from './FunctionBuilder';
export { default as FunctionEmitter } from './FunctionEmitter';
export { default as GlobalBuilder } from './GlobalBuilder';
export { default as MemoryBuilder } from './MemoryBuilder';
export { default as TableBuilder } from './TableBuilder';
export { default as ImportBuilder } from './ImportBuilder';
export { default as ExportBuilder } from './ExportBuilder';
export { default as TagBuilder } from './TagBuilder';
export { default as LocalBuilder } from './LocalBuilder';
export { default as LabelBuilder } from './LabelBuilder';
export { default as FunctionParameterBuilder } from './FunctionParameterBuilder';

// ─── Section builders ───
export { default as DataSegmentBuilder } from './DataSegmentBuilder';
export { default as ElementSegmentBuilder } from './ElementSegmentBuilder';
export { default as CustomSectionBuilder } from './CustomSectionBuilder';

// ─── Type builders (GC) ───
export { default as FuncTypeBuilder } from './FuncTypeBuilder';
export { default as StructTypeBuilder } from './StructTypeBuilder';
export type { StructField, StructTypeOptions, TypedStructBuilder } from './StructTypeBuilder';
export { default as ArrayTypeBuilder } from './ArrayTypeBuilder';
export type { ArrayTypeOptions } from './ArrayTypeBuilder';
export { default as RecGroupBuilder } from './RecGroupBuilder';
export type { TypeEntry } from './RecGroupBuilder';

// ─── Reading / writing ───
export { default as TextModuleWriter } from './TextModuleWriter';
export { default as BinaryReader } from './BinaryReader';
export type { ModuleInfo, NameSectionInfo, TypeInfo, FuncTypeInfo, StructTypeInfo, ArrayTypeInfo, RecGroupTypeInfo, TagInfo, ReadOptions, FunctionInfo } from './BinaryReader';
export { default as InstructionDecoder } from './InstructionDecoder';
export type { DecodedInstruction } from './InstructionDecoder';
export { default as Disassembler } from './Disassembler';
export { default as OpCodes } from './OpCodes';
export { parseWat } from './WatParser';

// ─── Types & constants ───
export {
  BlockType,
  ElementType,
  ExternalKind,
  HeapType,
  RefType,
  ValueType,
  refType,
  refNullType,
  // Shorthand type aliases
  i32, i64, f32, f64, v128,
  funcref, externref, anyref, eqref, i31ref, structref, arrayref,
  // Struct field DSL
  mut,
} from './types';

export type {
  BlockTypeDescriptor,
  ConcreteRefTypeDescriptor,
  ElementTypeDescriptor,
  ExternalKindType,
  HeapTypeDescriptor,
  HeapTypeRef,
  ModuleBuilderOptions,
  OpCodeDef,
  ValueTypeDescriptor,
  WasmFeature,
  WasmTarget,
  // Struct field DSL types
  MutableFieldDescriptor,
  FieldInput,
  StructFieldsObject,
} from './types';

// ─── Errors ───
export { default as VerificationError } from './verification/VerificationError';
