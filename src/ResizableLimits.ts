import BinaryWriter from './BinaryWriter';

export default class ResizableLimits {
  initial: number;
  maximum: number | null;

  constructor(initial: number, maximum: number | null = null) {
    if (initial < 0) {
      throw new Error('Initial size must be non-negative.');
    }
    if (maximum !== null) {
      if (maximum < 0) {
        throw new Error('Maximum size must be non-negative.');
      }
      if (initial > maximum) {
        throw new Error(`Initial size (${initial}) must not exceed maximum size (${maximum}).`);
      }
    }
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
