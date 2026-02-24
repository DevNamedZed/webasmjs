import BinaryWriter from './BinaryWriter';
import FuncTypeBuilder from './FuncTypeBuilder';
import StructTypeBuilder, { StructField, StructTypeOptions } from './StructTypeBuilder';
import ArrayTypeBuilder, { ArrayTypeOptions } from './ArrayTypeBuilder';
import { TypeForm, ValueTypeDescriptor, refType, refNullType, ConcreteRefTypeDescriptor } from './types';

export type TypeEntry = FuncTypeBuilder | StructTypeBuilder | ArrayTypeBuilder;

export default class RecGroupBuilder {
  _baseIndex: number;
  _types: TypeEntry[] = [];

  constructor(baseIndex: number) {
    this._baseIndex = baseIndex;
  }

  addStructType(fields: StructField[], options?: StructTypeOptions): StructTypeBuilder {
    const index = this._baseIndex + this._types.length;
    const key = StructTypeBuilder.createKey(fields);
    const builder = new StructTypeBuilder(key, fields, index, options);
    this._types.push(builder);
    return builder;
  }

  addArrayType(elementType: ValueTypeDescriptor, mutable: boolean, options?: ArrayTypeOptions): ArrayTypeBuilder {
    const index = this._baseIndex + this._types.length;
    const key = ArrayTypeBuilder.createKey(elementType, mutable);
    const builder = new ArrayTypeBuilder(key, elementType, mutable, index, options);
    this._types.push(builder);
    return builder;
  }

  addFuncType(returnTypes: ValueTypeDescriptor[], parameterTypes: ValueTypeDescriptor[]): FuncTypeBuilder {
    const index = this._baseIndex + this._types.length;
    const key = FuncTypeBuilder.createKey(returnTypes, parameterTypes);
    const builder = new FuncTypeBuilder(key, returnTypes, parameterTypes, index);
    this._types.push(builder);
    return builder;
  }

  /**
   * Create a nullable reference to a type within this group by group-relative index.
   */
  refNull(groupRelativeIndex: number): ConcreteRefTypeDescriptor {
    return refNullType(this._baseIndex + groupRelativeIndex);
  }

  /**
   * Create a non-nullable reference to a type within this group by group-relative index.
   */
  ref(groupRelativeIndex: number): ConcreteRefTypeDescriptor {
    return refType(this._baseIndex + groupRelativeIndex);
  }

  write(writer: BinaryWriter): void {
    if (this._types.length === 1) {
      this._types[0].write(writer);
    } else {
      writer.writeVarInt7(TypeForm.Rec.value);
      writer.writeVarUInt32(this._types.length);
      this._types.forEach((t) => t.write(writer));
    }
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
