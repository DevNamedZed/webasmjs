import Arg from './Arg';
import BinaryWriter from './BinaryWriter';
import Immediate from './Immediate';
import { OpCodeDef } from './types';

export default class Instruction {
  opCode: OpCodeDef;
  immediate: Immediate | null;

  constructor(opCode: OpCodeDef, immediate: Immediate | null) {
    Arg.notNull('opCode', opCode);
    this.opCode = opCode;
    this.immediate = immediate;
  }

  write(writer: BinaryWriter): void {
    if (this.opCode.prefix !== undefined) {
      writer.writeByte(this.opCode.prefix);
      writer.writeVarUInt32(this.opCode.value);
    } else {
      writer.writeByte(this.opCode.value);
    }
    if (this.immediate) {
      this.immediate.writeBytes(writer);
    }
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
