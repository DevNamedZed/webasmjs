import Arg from './Arg';
import BinaryWriter from './BinaryWriter';
import ResizableLimits from './ResizableLimits';

export default class MemoryType {
  resizableLimits: ResizableLimits;

  constructor(resizableLimits: ResizableLimits) {
    Arg.instanceOf('resizableLimits', resizableLimits, ResizableLimits);
    this.resizableLimits = resizableLimits;
  }

  write(writer: BinaryWriter): void {
    this.resizableLimits.write(writer);
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
