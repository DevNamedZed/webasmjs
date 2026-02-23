import BinaryWriter from './BinaryWriter';

export default class ResizableLimits {
  initial: number;
  maximum: number | null;

  constructor(initial: number, maximum: number | null = null) {
    this.initial = initial;
    this.maximum = maximum;
  }

  write(writer: BinaryWriter): void {
    writer.writeVarUInt1(this.maximum !== null ? 1 : 0);
    writer.writeVarUInt32(this.initial);
    if (this.maximum !== null) {
      writer.writeVarUInt32(this.maximum);
    }
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
