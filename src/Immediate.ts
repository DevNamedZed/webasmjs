import Arg from './Arg';
import { ImmediateType } from './types';
import ImmediateEncoder from './ImmediateEncoder';
import BinaryWriter from './BinaryWriter';

export default class Immediate {
  type: ImmediateType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(type: ImmediateType, values: any[]) {
    Arg.notNull('type', type);
    Arg.notNull('values', values);
    this.type = type;
    this.values = values;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static createBlockSignature(blockType: any): Immediate {
    return new Immediate(ImmediateType.BlockSignature, [blockType]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static createBranchTable(defaultLabel: any, labels: any[], depth: number): Immediate {
    const relativeDepths = labels.map((x) => {
      return depth - x.block.depth;
    });
    const defaultLabelDepth = depth - defaultLabel.block.depth;
    return new Immediate(ImmediateType.BranchTable, [defaultLabelDepth, relativeDepths]);
  }

  static createFloat32(value: number): Immediate {
    return new Immediate(ImmediateType.Float32, [value]);
  }

  static createFloat64(value: number): Immediate {
    return new Immediate(ImmediateType.Float64, [value]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static createFunction(functionBuilder: any): Immediate {
    return new Immediate(ImmediateType.Function, [functionBuilder]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static createGlobal(globalBuilder: any): Immediate {
    return new Immediate(ImmediateType.Global, [globalBuilder]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static createIndirectFunction(functionTypeBuilder: any): Immediate {
    return new Immediate(ImmediateType.IndirectFunction, [functionTypeBuilder]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static createLocal(local: any): Immediate {
    return new Immediate(ImmediateType.Local, [local]);
  }

  static createMemoryImmediate(alignment: number, offset: number): Immediate {
    return new Immediate(ImmediateType.MemoryImmediate, [alignment, offset]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static createRelativeDepth(label: any, depth: number): Immediate {
    return new Immediate(ImmediateType.RelativeDepth, [label, depth]);
  }

  static createVarUInt1(value: number): Immediate {
    return new Immediate(ImmediateType.VarUInt1, [value]);
  }

  static createVarInt32(value: number): Immediate {
    return new Immediate(ImmediateType.VarInt32, [value]);
  }

  static createVarInt64(value: number | bigint): Immediate {
    return new Immediate(ImmediateType.VarInt64, [value]);
  }

  static createVarUInt32(value: number): Immediate {
    return new Immediate(ImmediateType.VarUInt32, [value]);
  }

  static createV128Const(bytes: Uint8Array): Immediate {
    if (bytes.length !== 16) {
      throw new Error('V128 constant must be exactly 16 bytes.');
    }
    return new Immediate(ImmediateType.V128Const, [bytes]);
  }

  static createLaneIndex(index: number): Immediate {
    return new Immediate(ImmediateType.LaneIndex, [index]);
  }

  static createShuffleMask(mask: Uint8Array): Immediate {
    if (mask.length !== 16) {
      throw new Error('Shuffle mask must be exactly 16 bytes.');
    }
    return new Immediate(ImmediateType.ShuffleMask, [mask]);
  }

  writeBytes(writer: BinaryWriter): void {
    switch (this.type) {
      case ImmediateType.BlockSignature:
        ImmediateEncoder.encodeBlockSignature(writer, this.values[0]);
        break;

      case ImmediateType.BranchTable:
        ImmediateEncoder.encodeBranchTable(writer, this.values[0], this.values[1]);
        break;

      case ImmediateType.Float32:
        ImmediateEncoder.encodeFloat32(writer, this.values[0]);
        break;

      case ImmediateType.Float64:
        ImmediateEncoder.encodeFloat64(writer, this.values[0]);
        break;

      case ImmediateType.Function:
        ImmediateEncoder.encodeFunction(writer, this.values[0]);
        break;

      case ImmediateType.Global:
        ImmediateEncoder.encodeGlobal(writer, this.values[0]);
        break;

      case ImmediateType.IndirectFunction:
        ImmediateEncoder.encodeIndirectFunction(writer, this.values[0]);
        break;

      case ImmediateType.Local:
        ImmediateEncoder.encodeLocal(writer, this.values[0]);
        break;

      case ImmediateType.MemoryImmediate:
        ImmediateEncoder.encodeMemoryImmediate(writer, this.values[0], this.values[1]);
        break;

      case ImmediateType.RelativeDepth:
        ImmediateEncoder.encodeRelativeDepth(writer, this.values[0], this.values[1]);
        break;

      case ImmediateType.VarInt32:
        ImmediateEncoder.encodeVarInt32(writer, this.values[0]);
        break;

      case ImmediateType.VarInt64:
        ImmediateEncoder.encodeVarInt64(writer, this.values[0]);
        break;

      case ImmediateType.VarUInt1:
        ImmediateEncoder.encodeVarUInt1(writer, this.values[0]);
        break;

      case ImmediateType.VarUInt32:
        ImmediateEncoder.encodeVarUInt32(writer, this.values[0]);
        break;

      case ImmediateType.V128Const:
        ImmediateEncoder.encodeV128Const(writer, this.values[0]);
        break;

      case ImmediateType.LaneIndex:
        ImmediateEncoder.encodeLaneIndex(writer, this.values[0]);
        break;

      case ImmediateType.ShuffleMask:
        ImmediateEncoder.encodeShuffleMask(writer, this.values[0]);
        break;

      default:
        throw new Error('Cannot encode unknown operand type.');
    }
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.writeBytes(buffer);
    return buffer.toArray();
  }
}
