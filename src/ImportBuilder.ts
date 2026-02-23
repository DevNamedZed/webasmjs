import BinaryWriter from './BinaryWriter';
import { ExternalKind, ExternalKindType } from './types';
import GlobalType from './GlobalType';
import FuncTypeBuilder from './FuncTypeBuilder';
import MemoryType from './MemoryType';
import TableType from './TableType';

export default class ImportBuilder {
  moduleName: string;
  fieldName: string;
  externalKind: ExternalKindType;
  data: FuncTypeBuilder | GlobalType | MemoryType | TableType;
  index: number;

  constructor(
    moduleName: string,
    fieldName: string,
    externalKind: ExternalKindType,
    data: FuncTypeBuilder | GlobalType | MemoryType | TableType,
    index: number
  ) {
    this.moduleName = moduleName;
    this.fieldName = fieldName;
    this.externalKind = externalKind;
    this.data = data;
    this.index = index;
  }

  write(writer: BinaryWriter): void {
    writer.writeVarUInt32(this.moduleName.length);
    writer.writeString(this.moduleName);
    writer.writeVarUInt32(this.fieldName.length);
    writer.writeString(this.fieldName);
    writer.writeUInt8(this.externalKind.value);
    switch (this.externalKind) {
      case ExternalKind.Function:
        writer.writeVarUInt32((this.data as FuncTypeBuilder).index);
        break;

      case ExternalKind.Global:
      case ExternalKind.Memory:
      case ExternalKind.Table:
        (this.data as GlobalType | MemoryType | TableType).write(writer);
        break;

      default:
        throw new Error('Unknown external kind.');
    }
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
