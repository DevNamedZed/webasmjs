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

  isFunctionImport(): this is ImportBuilder & { data: FuncTypeBuilder } {
    return this.externalKind === ExternalKind.Function;
  }

  isTagImport(): this is ImportBuilder & { data: FuncTypeBuilder } {
    return this.externalKind === ExternalKind.Tag;
  }

  isGlobalImport(): this is ImportBuilder & { data: GlobalType } {
    return this.externalKind === ExternalKind.Global;
  }

  isMemoryImport(): this is ImportBuilder & { data: MemoryType } {
    return this.externalKind === ExternalKind.Memory;
  }

  isTableImport(): this is ImportBuilder & { data: TableType } {
    return this.externalKind === ExternalKind.Table;
  }

  write(writer: BinaryWriter): void {
    writer.writeLenPrefixedString(this.moduleName);
    writer.writeLenPrefixedString(this.fieldName);
    writer.writeUInt8(this.externalKind.value);
    switch (this.externalKind) {
      case ExternalKind.Function:
        writer.writeVarUInt32((this.data as FuncTypeBuilder).index);
        break;

      case ExternalKind.Tag:
        // Tag import: attribute (0 = exception) + type index
        writer.writeVarUInt32(0); // attribute
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
