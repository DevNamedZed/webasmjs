import GlobalType from './GlobalType';
import { InitExpressionType, ValueType, ValueTypeDescriptor } from './types';
import InitExpressionEmitter from './InitExpressionEmitter';
import BinaryWriter from './BinaryWriter';
import type ModuleBuilder from './ModuleBuilder';

export default class GlobalBuilder {
  _globalType: GlobalType;
  _index: number;
  _initExpressionEmitter: InitExpressionEmitter | null = null;
  _moduleBuilder: ModuleBuilder;
  name: string | null = null;

  constructor(
    moduleBuilder: ModuleBuilder,
    valueType: ValueTypeDescriptor,
    mutable: boolean,
    index: number
  ) {
    this._moduleBuilder = moduleBuilder;
    this._globalType = new GlobalType(valueType, mutable);
    this._index = index;
  }

  withName(name: string): this {
    this.name = name;
    return this;
  }

  get globalType(): GlobalType {
    return this._globalType;
  }

  get valueType(): ValueTypeDescriptor {
    return this._globalType.valueType;
  }

  createInitEmitter(callback?: (asm: InitExpressionEmitter) => void): InitExpressionEmitter {
    if (this._initExpressionEmitter) {
      throw new Error('Initialization expression emitter has already been created.');
    }

    this._initExpressionEmitter = new InitExpressionEmitter(
      InitExpressionType.Global,
      this.valueType,
      this._moduleBuilder.features
    );
    if (callback) {
      callback(this._initExpressionEmitter);
      this._initExpressionEmitter.end();
    }

    return this._initExpressionEmitter;
  }

  value(value: number | bigint | GlobalBuilder | ((asm: InitExpressionEmitter) => void)): void {
    if (typeof value === 'function') {
      this.createInitEmitter(value);
    } else if (value instanceof GlobalBuilder) {
      this.createInitEmitter((asm) => {
        asm.get_global(value);
      });
    } else if (typeof value === 'number' || typeof value === 'bigint') {
      this.createInitEmitter((asm) => {
        const vt = this.valueType;
        if (vt === ValueType.Int32) {
          asm.const_i32(Number(value));
        } else if (vt === ValueType.Int64) {
          asm.const_i64(BigInt(value));
        } else if (vt === ValueType.Float32) {
          asm.const_f32(Number(value));
        } else if (vt === ValueType.Float64) {
          asm.const_f64(Number(value));
        } else {
          throw new Error(`Unsupported global value type: ${vt.name}`);
        }
      });
    } else {
      throw new Error('Unsupported global value.');
    }
  }

  withExport(name: string): this {
    this._moduleBuilder.exportGlobal(this, name);
    return this;
  }

  write(writer: BinaryWriter): void {
    if (!this._initExpressionEmitter) {
      throw new Error('The initialization expression was not defined.');
    }

    this._globalType.write(writer);
    this._initExpressionEmitter.write(writer);
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
