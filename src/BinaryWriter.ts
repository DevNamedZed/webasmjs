const GrowthRate = 1024;

export default class BinaryWriter {
  buffer: Uint8Array;
  size: number;

  constructor(size: number = 1024) {
    this.size = 0;
    this.buffer = new Uint8Array(size);
  }

  get capacity(): number {
    return this.buffer.length;
  }

  get length(): number {
    return this.size;
  }

  get remaining(): number {
    return this.buffer.length - this.size;
  }

  writeUInt8(value: number): void {
    this.writeByte(0xff & value);
  }

  writeUInt16(value: number): void {
    this.writeByte(value & 0xff);
    this.writeByte((value >> 8) & 0xff);
  }

  writeUInt32(value: number): void {
    this.writeByte(value & 0xff);
    this.writeByte((value >> 8) & 0xff);
    this.writeByte((value >> 16) & 0xff);
    this.writeByte((value >> 24) & 0xff);
  }

  writeVarUInt1(value: number): void {
    this.writeByte(value > 0 ? 1 : 0);
  }

  writeVarUInt7(value: number): void {
    this.writeByte(0x7f & value);
  }

  writeVarUInt32(value: number): void {
    do {
      let chunk = value & 0x7f;
      value >>>= 7;
      if (value !== 0) {
        chunk |= 0x80;
      }
      this.writeByte(chunk);
    } while (value !== 0);
  }

  writeVarInt7(value: number): void {
    this.writeByte(value & 0x7f);
  }

  writeVarInt32(value: number): void {
    let more = true;
    while (more) {
      let chunk = value & 0x7f;
      value >>= 7;

      if ((value === 0 && (chunk & 0x40) === 0) || (value === -1 && (chunk & 0x40) !== 0)) {
        more = false;
      } else {
        chunk |= 0x80;
      }

      this.writeByte(chunk);
    }
  }

  writeVarInt64(value: number | bigint): void {
    if (typeof value === 'number' && Number.isInteger(value)) {
      this.writeVarInt32(value);
      return;
    }

    let bigIntValue = BigInt(value);
    let more = true;

    while (more) {
      let chunk = Number(bigIntValue & 0x7fn);
      bigIntValue = bigIntValue >> 7n;

      if (
        (bigIntValue === 0n && (chunk & 0x40) === 0) || (bigIntValue === -1n && (chunk & 0x40) !== 0)
      ) {
        more = false;
      } else {
        chunk |= 0x80;
      }

      this.writeByte(chunk);
    }
  }

  writeString(value: string): void {
    const encoder = new TextEncoder();
    const utfBytes = encoder.encode(value);
    this.writeBytes(utfBytes);
  }

  writeLenPrefixedString(value: string): void {
    const encoder = new TextEncoder();
    const utfBytes = encoder.encode(value);
    this.writeVarUInt32(utfBytes.length);
    this.writeBytes(utfBytes);
  }

  writeFloat32(value: number): void {
    const array = new Float32Array(1);
    array[0] = value;
    this.writeBytes(new Uint8Array(array.buffer));
  }

  writeFloat64(value: number): void {
    const array = new Float64Array(1);
    array[0] = value;
    this.writeBytes(new Uint8Array(array.buffer));
  }

  writeByte(data: number): void {
    this.requireCapacity(1);
    this.buffer[this.size++] = data;
  }

  writeBytes(array: BinaryWriter | Uint8Array): void {
    let innerArray: Uint8Array;
    if (array instanceof BinaryWriter) {
      innerArray = array.toArray();
    } else if (array instanceof Uint8Array) {
      innerArray = array;
    } else {
      throw new Error('Invalid argument, must be a Uint8Array or BinaryWriter');
    }

    this.requireCapacity(innerArray.length);
    this.buffer.set(innerArray, this.size);
    this.size += innerArray.length;
  }

  requireCapacity(size: number): void {
    const remaining = this.remaining;
    if (remaining >= size) {
      return;
    }

    const needed = this.size + size;
    const grown = this.buffer.length + GrowthRate;
    const newSize = Math.max(needed, grown);

    const newBuffer = new Uint8Array(newSize);
    newBuffer.set(this.buffer, 0);
    this.buffer = newBuffer;
  }

  toArray(): Uint8Array {
    const array = new Uint8Array(this.size);
    array.set(this.buffer.subarray(0, this.size), 0);
    return array;
  }
}
