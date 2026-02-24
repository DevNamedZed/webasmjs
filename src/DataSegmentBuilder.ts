import InitExpressionEmitter from './InitExpressionEmitter';
import BinaryWriter from './BinaryWriter';
import GlobalBuilder from './GlobalBuilder';
import { InitExpressionType, ValueType, WasmFeature } from './types';

export default class DataSegmentBuilder {
  _data: Uint8Array;
  _initExpressionEmitter: InitExpressionEmitter | null = null;
  _passive: boolean = false;
  _memoryIndex: number = 0;
  _features: Set<WasmFeature>;

  constructor(data: Uint8Array, features?: Set<WasmFeature>) {
    this._data = data;
    this._features = features || new Set();
  }

  passive(): this {
    this._passive = true;
    return this;
  }

  memoryIndex(index: number): this {
    this._memoryIndex = index;
    return this;
  }

  createInitEmitter(callback?: (asm: InitExpressionEmitter) => void): InitExpressionEmitter {
    if (this._initExpressionEmitter) {
      throw new Error('Initialization expression emitter has already been created.');
    }

    this._initExpressionEmitter = new InitExpressionEmitter(
      InitExpressionType.Data,
      ValueType.Int32,
      this._features
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
    if (this._passive) {
      // Passive segment: kind=1, no memory index, no offset expression
      writer.writeVarUInt32(1);
      writer.writeVarUInt32(this._data.length);
      writer.writeBytes(this._data);
      return;
    }

    if (!this._initExpressionEmitter) {
      throw new Error('The initialization expression was not defined.');
    }

    if (this._memoryIndex !== 0) {
      // Active segment with explicit memory index: kind=2
      writer.writeVarUInt32(2);
      writer.writeVarUInt32(this._memoryIndex);
    } else {
      // Active segment with default memory 0: kind=0
      writer.writeVarUInt32(0);
    }
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
