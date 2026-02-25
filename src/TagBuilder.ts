import BinaryWriter from './BinaryWriter';
import FuncTypeBuilder from './FuncTypeBuilder';
import type ModuleBuilder from './ModuleBuilder';

/**
 * Represents a WebAssembly exception tag (used with exception-handling proposal).
 * A tag is essentially a typed label for exceptions — it has a function type
 * describing the parameters it carries.
 */
export default class TagBuilder {
  _moduleBuilder: ModuleBuilder;
  _funcType: FuncTypeBuilder;
  _index: number;
  name: string;

  constructor(moduleBuilder: ModuleBuilder, funcType: FuncTypeBuilder, index: number) {
    this._moduleBuilder = moduleBuilder;
    this._funcType = funcType;
    this._index = index;
    this.name = '';
  }

  get funcType(): FuncTypeBuilder {
    return this._funcType;
  }

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withExport(name: string): this {
    this._moduleBuilder.exportTag(this, name);
    return this;
  }

  write(writer: BinaryWriter): void {
    // Tag attribute: 0 = exception (only supported kind)
    writer.writeVarUInt32(0);
    // Type index
    writer.writeVarUInt32(this._funcType.index);
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
