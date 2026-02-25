import Arg from './Arg';
import BinaryWriter from './BinaryWriter';
import ResizableLimits from './ResizableLimits';

export default class MemoryType {
  resizableLimits: ResizableLimits;
  shared: boolean;
  memory64: boolean;

  constructor(resizableLimits: ResizableLimits, shared: boolean = false, memory64: boolean = false) {
    Arg.instanceOf('resizableLimits', resizableLimits, ResizableLimits);
    if (shared && resizableLimits.maximum === null) {
      throw new Error('Shared memory requires a maximum size.');
    }
    this.resizableLimits = resizableLimits;
    this.shared = shared;
    this.memory64 = memory64;
  }

  write(writer: BinaryWriter): void {
    if (this.shared || this.memory64) {
      // Extended flags byte:
      // bit 0: has maximum
      // bit 1: shared
      // bit 2: memory64
      let flags = this.resizableLimits.maximum !== null ? 0b001 : 0;
      if (this.shared) flags |= 0b010;
      if (this.memory64) flags |= 0b100;
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

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
