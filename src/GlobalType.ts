import BinaryWriter from './BinaryWriter';
import { ValueTypeDescriptor, writeValueType } from './types';

export default class GlobalType {
  private _valueType: ValueTypeDescriptor;
  private _mutable: boolean;

  constructor(valueType: ValueTypeDescriptor, mutable: boolean) {
    this._valueType = valueType;
    this._mutable = mutable;
  }

  get valueType(): ValueTypeDescriptor {
    return this._valueType;
  }

  get mutable(): boolean {
    return this._mutable;
  }

  write(writer: BinaryWriter): void {
    writeValueType(writer, this._valueType);
    writer.writeVarUInt1(this._mutable ? 1 : 0);
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
