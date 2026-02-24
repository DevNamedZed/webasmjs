import BinaryWriter from './BinaryWriter';
import { SectionType, SectionTypeDescriptor } from './types';

export default class CustomSectionBuilder {
  name: string;
  type: SectionTypeDescriptor;
  _data: Uint8Array;

  constructor(name: string, data?: Uint8Array) {
    this.name = name;
    this.type = SectionType.createCustom(name);
    this._data = data || new Uint8Array(0);
  }

  write(writer: BinaryWriter): void {
    const sectionWriter = new BinaryWriter();
    sectionWriter.writeLenPrefixedString(this.name);
    if (this._data.length > 0) {
      sectionWriter.writeBytes(this._data);
    }

    writer.writeVarUInt7(0); // custom section id
    writer.writeVarUInt32(sectionWriter.length);
    writer.writeBytes(sectionWriter);
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
