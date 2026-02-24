import BinaryWriter from './BinaryWriter';
import { TypeForm, ValueTypeDescriptor, writeValueType } from './types';
import FuncTypeSignature from './FuncTypeSignature';

export default class FuncTypeBuilder {
  key: string;
  index: number;
  returnTypes: ValueTypeDescriptor[];
  parameterTypes: ValueTypeDescriptor[];

  constructor(
    key: string,
    returnTypes: ValueTypeDescriptor[],
    parameterTypes: ValueTypeDescriptor[],
    index: number
  ) {
    this.key = key;
    this.returnTypes = returnTypes;
    this.parameterTypes = parameterTypes;
    this.index = index;
  }

  get typeForm() {
    return TypeForm.Func;
  }

  static createKey(returnTypes: ValueTypeDescriptor[], parameterTypes: ValueTypeDescriptor[]): string {
    let key = '(';
    returnTypes.forEach((x, i) => {
      key += x.short;
      if (i !== returnTypes.length - 1) {
        key += ', ';
      }
    });

    key += ')(';
    parameterTypes.forEach((x, i) => {
      key += x.short;
      if (i !== parameterTypes.length - 1) {
        key += ', ';
      }
    });

    key += ')';
    return key;
  }

  write(writer: BinaryWriter): void {
    writer.writeVarInt7(TypeForm.Func.value);
    writer.writeVarUInt32(this.parameterTypes.length);
    this.parameterTypes.forEach((x) => {
      writeValueType(writer, x);
    });

    writer.writeVarUInt32(this.returnTypes.length);
    this.returnTypes.forEach((x) => {
      writeValueType(writer, x);
    });
  }

  toSignature(): FuncTypeSignature {
    return new FuncTypeSignature(this.returnTypes, this.parameterTypes);
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
