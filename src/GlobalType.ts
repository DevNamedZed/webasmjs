import BinaryWriter from './BinaryWriter';
import { ValueTypeDescriptor } from './types';

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
    writer.writeVarInt7(this._valueType.value);
    writer.writeVarUInt1(this._mutable ? 1 : 0);
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
