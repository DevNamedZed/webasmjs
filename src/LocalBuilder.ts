import BinaryWriter from './BinaryWriter';
import { ValueTypeDescriptor } from './types';

export default class LocalBuilder {
  index: number;
  valueType: ValueTypeDescriptor;
  name: string | null;
  count: number;

  constructor(valueType: ValueTypeDescriptor, name: string | null, index: number, count: number) {
    this.index = index;
    this.valueType = valueType;
    this.name = name;
    this.count = count;
  }

  write(writer: BinaryWriter): void {
    writer.writeVarUInt32(this.count);
    writer.writeVarInt7(this.valueType.value);
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
