import InitExpressionEmitter from './InitExpressionEmitter';
import BinaryWriter from './BinaryWriter';
import GlobalBuilder from './GlobalBuilder';
import { InitExpressionType, ValueType } from './types';

export default class DataSegmentBuilder {
  _data: Uint8Array;
  _initExpressionEmitter: InitExpressionEmitter | null = null;

  constructor(data: Uint8Array) {
    this._data = data;
  }

  createInitEmitter(callback?: (asm: InitExpressionEmitter) => void): InitExpressionEmitter {
    if (this._initExpressionEmitter) {
      throw new Error('Initialization expression emitter has already been created.');
    }

    this._initExpressionEmitter = new InitExpressionEmitter(
      InitExpressionType.Data,
      ValueType.Int32
    );
    if (callback) {
      callback(this._initExpressionEmitter);
      this._initExpressionEmitter.end();
    }

    return this._initExpressionEmitter;
  }

  offset(value: number | GlobalBuilder | ((asm: InitExpressionEmitter) => void)): void {
    if (typeof value === 'function') {
      this.createInitEmitter(value);
    } else if (value instanceof GlobalBuilder) {
      this.createInitEmitter((asm) => {
        asm.get_global(value);
      });
    } else if (typeof value === 'number') {
      this.createInitEmitter((asm) => {
        asm.const_i32(value);
      });
    } else {
      throw new Error('Unsupported offset');
    }
  }

  write(writer: BinaryWriter): void {
    if (!this._initExpressionEmitter) {
      throw new Error('The initialization expression was not defined.');
    }

    writer.writeVarUInt32(0);
    this._initExpressionEmitter.write(writer);
    writer.writeVarUInt32(this._data.length);
    writer.writeBytes(this._data);
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
