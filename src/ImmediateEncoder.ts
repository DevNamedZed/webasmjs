import Arg from './Arg';
import BinaryWriter from './BinaryWriter';
import type FunctionBuilder from './FunctionBuilder';
import LocalBuilder from './LocalBuilder';
import FunctionParameterBuilder from './FunctionParameterBuilder';
import FuncTypeBuilder from './FuncTypeBuilder';
import GlobalBuilder from './GlobalBuilder';
import ImportBuilder from './ImportBuilder';
import type LabelBuilder from './LabelBuilder';
import { ExternalKind, BlockTypeDescriptor, HeapTypeRef } from './types';

export default class ImmediateEncoder {
  static encodeBlockSignature(writer: BinaryWriter, blockType: BlockTypeDescriptor): void {
    writer.writeVarInt7(blockType.value);
  }

  static encodeRelativeDepth(writer: BinaryWriter, label: LabelBuilder, depth: number): void {
    const relativeDepth = depth - label.block!.depth;
    writer.writeVarInt7(relativeDepth);
  }

  static encodeBranchTable(
    writer: BinaryWriter,
    defaultLabel: number,
    labels: number[]
  ): void {
    writer.writeVarUInt32(labels.length);
    labels.forEach((x) => {
      writer.writeVarUInt32(x);
    });
    writer.writeVarUInt32(defaultLabel);
  }

  static encodeFunction(writer: BinaryWriter, func: FunctionBuilder | ImportBuilder | number): void {
    let functionIndex = 0;
    if (func instanceof ImportBuilder) {
      functionIndex = func.index;
    } else if (typeof func === 'object' && func !== null && '_index' in func) {
      functionIndex = (func as FunctionBuilder)._index;
    } else if (typeof func === 'number') {
      functionIndex = func;
    } else {
      throw new Error(
        'Function argument must either be the index of the function or a FunctionBuilder.'
      );
    }

    writer.writeVarUInt32(functionIndex);
  }

  static encodeIndirectFunction(writer: BinaryWriter, funcType: FuncTypeBuilder): void {
    writer.writeVarUInt32(funcType.index);
    writer.writeVarUInt1(0);
  }

  static encodeLocal(
    writer: BinaryWriter,
    local: LocalBuilder | FunctionParameterBuilder | number
  ): void {
    Arg.notNull('local', local);

    let localIndex = 0;
    if (local instanceof LocalBuilder) {
      localIndex = local.index;
    } else if (local instanceof FunctionParameterBuilder) {
      localIndex = local.index;
    } else if (typeof local === 'number') {
      localIndex = local;
    } else {
      throw new Error(
        'Local argument must either be the index of the local variable or a LocalBuilder.'
      );
    }

    writer.writeVarUInt32(localIndex);
  }

  static encodeGlobal(
    writer: BinaryWriter,
    global: GlobalBuilder | ImportBuilder | number
  ): void {
    Arg.notNull('global', global);

    let globalIndex = 0;
    if (global instanceof GlobalBuilder) {
      globalIndex = global._index;
    } else if (global instanceof ImportBuilder) {
      if (global.externalKind !== ExternalKind.Global) {
        throw new Error('Import external kind must be global.');
      }
      globalIndex = global.index;
    } else if (typeof global === 'number') {
      globalIndex = global;
    } else {
      throw new Error(
        'Global argument must either be the index of the global variable, GlobalBuilder, or an ImportBuilder.'
      );
    }

    writer.writeVarUInt32(globalIndex);
  }

  static encodeFloat32(writer: BinaryWriter, value: number): void {
    writer.writeFloat32(value);
  }

  static encodeFloat64(writer: BinaryWriter, value: number): void {
    writer.writeFloat64(value);
  }

  static encodeVarInt32(writer: BinaryWriter, value: number): void {
    writer.writeVarInt32(value);
  }

  static encodeVarInt64(writer: BinaryWriter, value: number | bigint): void {
    writer.writeVarInt64(value);
  }

  static encodeVarUInt32(writer: BinaryWriter, value: number): void {
    writer.writeVarUInt32(value);
  }

  static encodeVarUInt1(writer: BinaryWriter, value: number): void {
    writer.writeVarUInt1(value);
  }

  static encodeMemoryImmediate(
    writer: BinaryWriter,
    alignment: number,
    offset: number
  ): void {
    writer.writeVarUInt32(alignment);
    writer.writeVarUInt32(offset);
  }

  static encodeV128Const(writer: BinaryWriter, bytes: Uint8Array): void {
    for (let i = 0; i < 16; i++) {
      writer.writeByte(bytes[i]);
    }
  }

  static encodeLaneIndex(writer: BinaryWriter, index: number): void {
    writer.writeByte(index);
  }

  static encodeShuffleMask(writer: BinaryWriter, mask: Uint8Array): void {
    for (let i = 0; i < 16; i++) {
      writer.writeByte(mask[i]);
    }
  }

  static encodeTypeIndexField(writer: BinaryWriter, typeIndex: number, fieldIndex: number): void {
    writer.writeVarUInt32(typeIndex);
    writer.writeVarUInt32(fieldIndex);
  }

  static encodeTypeIndexIndex(writer: BinaryWriter, typeIndex: number, index: number): void {
    writer.writeVarUInt32(typeIndex);
    writer.writeVarUInt32(index);
  }

  static encodeHeapType(writer: BinaryWriter, heapType: HeapTypeRef): void {
    if (typeof heapType === 'number') {
      // Concrete type index
      writer.writeVarInt32(heapType);
    } else if (typeof heapType === 'object' && 'value' in heapType && typeof heapType.value === 'number') {
      // Abstract heap type descriptor (from HeapType constant)
      writer.writeVarInt7(heapType.value);
    } else if (typeof heapType === 'object' && 'index' in heapType && typeof heapType.index === 'number') {
      // TypeEntry (StructTypeBuilder, ArrayTypeBuilder, FuncTypeBuilder)
      writer.writeVarInt32(heapType.index);
    } else {
      throw new Error('Invalid heap type argument.');
    }
  }

  static encodeBrOnCast(writer: BinaryWriter, flags: number, label: LabelBuilder, heapType1: HeapTypeRef, heapType2: HeapTypeRef, depth: number): void {
    writer.writeByte(flags);
    const relativeDepth = depth - label.block!.depth;
    writer.writeVarUInt32(relativeDepth);
    ImmediateEncoder.encodeHeapType(writer, heapType1);
    ImmediateEncoder.encodeHeapType(writer, heapType2);
  }
}
