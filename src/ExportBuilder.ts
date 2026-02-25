import BinaryWriter from './BinaryWriter';
import { ExternalKind, ExternalKindType } from './types';

export default class ExportBuilder {
  name: string;
  externalKind: ExternalKindType;
  data: { _index: number };

  constructor(name: string, externalKind: ExternalKindType, data: { _index: number }) {
    this.name = name;
    this.externalKind = externalKind;
    this.data = data;
  }

  write(writer: BinaryWriter): void {
    writer.writeVarUInt32(this.name.length);
    writer.writeString(this.name);
    writer.writeUInt8(this.externalKind.value);
    switch (this.externalKind) {
      case ExternalKind.Function:
      case ExternalKind.Global:
      case ExternalKind.Memory:
      case ExternalKind.Table:
      case ExternalKind.Tag:
        writer.writeVarUInt32(this.data._index);
        break;
    }
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
