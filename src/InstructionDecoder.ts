import OpCodes from './OpCodes';
import type { OpCodeDef } from './types';

export interface DecodedInstruction {
  opCode: OpCodeDef;
  immediates: { type: string; values: any[] };
  offset: number;
  length: number;
}

// Build reverse lookup maps from opcode bytes to OpCodeDef
const singleByteOpcodes: Map<number, OpCodeDef> = new Map();
const prefixedOpcodes: Map<number, Map<number, OpCodeDef>> = new Map();

for (const [, opCode] of Object.entries(OpCodes)) {
  const op = opCode as OpCodeDef;
  if (op.prefix !== undefined) {
    if (!prefixedOpcodes.has(op.prefix)) {
      prefixedOpcodes.set(op.prefix, new Map());
    }
    prefixedOpcodes.get(op.prefix)!.set(op.value, op);
  } else {
    singleByteOpcodes.set(op.value, op);
  }
}

export default class InstructionDecoder {
  private buffer: Uint8Array;
  private offset: number;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.offset = 0;
  }

  decode(): DecodedInstruction[] {
    const instructions: DecodedInstruction[] = [];
    this.offset = 0;

    while (this.offset < this.buffer.length) {
      const startOffset = this.offset;
      const byte = this.buffer[this.offset++];

      let opCode: OpCodeDef | undefined;

      // Check for prefixed opcodes (0xFC = sat-trunc/bulk-memory, 0xFB = GC, 0xFD = SIMD, 0xFE = threads)
      if (prefixedOpcodes.has(byte)) {
        const subMap = prefixedOpcodes.get(byte)!;
        const subOpcode = this.readVarUInt32();
        opCode = subMap.get(subOpcode);
        if (!opCode) {
          // Unknown prefixed opcode — skip to end
          break;
        }
      } else {
        opCode = singleByteOpcodes.get(byte);
        if (!opCode) {
          // Unknown opcode — skip to end
          break;
        }
      }

      const immediates = this.decodeImmediates(opCode);
      instructions.push({
        opCode,
        immediates,
        offset: startOffset,
        length: this.offset - startOffset,
      });

      // Stop at end opcode
      if (opCode === OpCodes.end) {
        break;
      }
    }

    return instructions;
  }

  static decodeInitExpr(bytes: Uint8Array): DecodedInstruction[] {
    const decoder = new InstructionDecoder(bytes);
    return decoder.decode();
  }

  private decodeImmediates(opCode: OpCodeDef): { type: string; values: any[] } {
    if (!opCode.immediate) {
      return { type: 'None', values: [] };
    }

    const type = opCode.immediate;
    const values: any[] = [];

    switch (type) {
      case 'BlockSignature': {
        const bt = this.readVarInt7();
        values.push(bt);
        break;
      }
      case 'VarInt32':
        values.push(this.readVarInt32());
        break;
      case 'VarInt64':
        values.push(this.readVarInt64());
        break;
      case 'Float32':
        values.push(this.readFloat32());
        break;
      case 'Float64':
        values.push(this.readFloat64());
        break;
      case 'VarUInt1':
        values.push(this.buffer[this.offset++] & 1);
        break;
      case 'VarUInt32':
        values.push(this.readVarUInt32());
        break;
      case 'RelativeDepth':
        values.push(this.readVarUInt32());
        break;
      case 'BranchTable': {
        const count = this.readVarUInt32();
        const targets: number[] = [];
        for (let i = 0; i < count; i++) {
          targets.push(this.readVarUInt32());
        }
        const defaultTarget = this.readVarUInt32();
        values.push(targets, defaultTarget);
        break;
      }
      case 'Function':
        values.push(this.readVarUInt32());
        break;
      case 'IndirectFunction': {
        const typeIndex = this.readVarUInt32();
        const tableIndex = this.readVarUInt32();
        values.push(typeIndex, tableIndex);
        break;
      }
      case 'Local':
        values.push(this.readVarUInt32());
        break;
      case 'Global':
        values.push(this.readVarUInt32());
        break;
      case 'MemoryImmediate': {
        const alignment = this.readVarUInt32();
        const offset = this.readVarUInt32();
        values.push(alignment, offset);
        break;
      }
      case 'V128Const': {
        const bytes = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
          bytes[i] = this.buffer[this.offset++];
        }
        values.push(bytes);
        break;
      }
      case 'ShuffleMask': {
        const mask = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
          mask[i] = this.buffer[this.offset++];
        }
        values.push(mask);
        break;
      }
      case 'LaneIndex':
        values.push(this.buffer[this.offset++]);
        break;
      case 'TypeIndexField': {
        const typeIndex = this.readVarUInt32();
        const fieldIndex = this.readVarUInt32();
        values.push(typeIndex, fieldIndex);
        break;
      }
      case 'TypeIndexIndex': {
        const typeIndex = this.readVarUInt32();
        const index = this.readVarUInt32();
        values.push(typeIndex, index);
        break;
      }
      case 'HeapType':
        values.push(this.readVarInt32());
        break;
      case 'BrOnCast': {
        const flags = this.buffer[this.offset++];
        const depth = this.readVarUInt32();
        const ht1 = this.readVarInt32();
        const ht2 = this.readVarInt32();
        values.push(flags, depth, ht1, ht2);
        break;
      }
      default:
        // Unknown immediate type — skip
        break;
    }

    return { type, values };
  }

  // --- LEB128 readers ---

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

  private readFloat32(): number {
    const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + this.offset, 4);
    this.offset += 4;
    return view.getFloat32(0, true);
  }

  private readFloat64(): number {
    const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + this.offset, 8);
    this.offset += 8;
    return view.getFloat64(0, true);
  }
}
