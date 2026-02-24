import BinaryWriter from './BinaryWriter';
import { TypeForm, ValueTypeDescriptor, writeValueType } from './types';

export interface ArrayTypeOptions {
  superTypes?: { index: number }[];
  final?: boolean;
}

export default class ArrayTypeBuilder {
  key: string;
  index: number;
  elementType: ValueTypeDescriptor;
  mutable: boolean;
  superTypes: { index: number }[];
  final: boolean;

  constructor(
    key: string,
    elementType: ValueTypeDescriptor,
    mutable: boolean,
    index: number,
    options?: ArrayTypeOptions
  ) {
    this.key = key;
    this.elementType = elementType;
    this.mutable = mutable;
    this.index = index;
    this.superTypes = options?.superTypes || [];
    this.final = options?.final !== false;
  }

  get typeForm() {
    return TypeForm.Array;
  }

  static createKey(elementType: ValueTypeDescriptor, mutable: boolean): string {
    return `array(${elementType.short}:${mutable ? 'm' : 'i'})`;
  }

  write(writer: BinaryWriter): void {
    if (this.superTypes.length > 0 || !this.final) {
      writer.writeVarInt7(this.final ? TypeForm.SubFinal.value : TypeForm.Sub.value);
      writer.writeVarUInt32(this.superTypes.length);
      this.superTypes.forEach((st) => {
        writer.writeVarUInt32(st.index);
      });
    }

    writer.writeVarInt7(TypeForm.Array.value);
    writeValueType(writer, this.elementType);
    writer.writeVarUInt1(this.mutable ? 1 : 0);
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
