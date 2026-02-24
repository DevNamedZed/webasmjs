import BinaryWriter from './BinaryWriter';
import { TypeForm, ValueTypeDescriptor, writeValueType } from './types';

export interface StructField {
  name: string;
  type: ValueTypeDescriptor;
  mutable: boolean;
}

export interface StructTypeOptions {
  superTypes?: { index: number }[];
  final?: boolean;
}

export default class StructTypeBuilder {
  key: string;
  index: number;
  fields: StructField[];
  superTypes: { index: number }[];
  final: boolean;

  constructor(
    key: string,
    fields: StructField[],
    index: number,
    options?: StructTypeOptions
  ) {
    this.key = key;
    this.fields = fields;
    this.index = index;
    this.superTypes = options?.superTypes || [];
    this.final = options?.final !== false;
  }

  get typeForm() {
    return TypeForm.Struct;
  }

  static createKey(fields: StructField[]): string {
    let key = 'struct(';
    fields.forEach((f, i) => {
      key += f.type.short;
      key += f.mutable ? ':m' : ':i';
      if (i !== fields.length - 1) {
        key += ',';
      }
    });
    key += ')';
    return key;
  }

  getFieldIndex(name: string): number {
    const index = this.fields.findIndex((f) => f.name === name);
    if (index === -1) {
      throw new Error(`Field '${name}' not found in struct type.`);
    }
    return index;
  }

  write(writer: BinaryWriter): void {
    if (this.superTypes.length > 0 || !this.final) {
      writer.writeVarInt7(this.final ? TypeForm.SubFinal.value : TypeForm.Sub.value);
      writer.writeVarUInt32(this.superTypes.length);
      this.superTypes.forEach((st) => {
        writer.writeVarUInt32(st.index);
      });
    }

    writer.writeVarInt7(TypeForm.Struct.value);
    writer.writeVarUInt32(this.fields.length);
    this.fields.forEach((field) => {
      writeValueType(writer, field.type);
      writer.writeVarUInt1(field.mutable ? 1 : 0);
    });
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
