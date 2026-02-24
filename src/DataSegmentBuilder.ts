import InitExpressionEmitter from './InitExpressionEmitter';
import BinaryWriter from './BinaryWriter';
import GlobalBuilder from './GlobalBuilder';
import { InitExpressionType, ValueType, WasmFeature } from './types';

export default class DataSegmentBuilder {
  _data: Uint8Array;
  _initExpressionEmitter: InitExpressionEmitter | null = null;
  _passive: boolean = false;
  _memoryIndex: number = 0;
  _memory64: boolean = false;
  _features: Set<WasmFeature>;

  _disableVerification: boolean;

  constructor(data: Uint8Array, features?: Set<WasmFeature>, memory64?: boolean, disableVerification?: boolean) {
    this._data = data;
    this._features = features || new Set();
    this._memory64 = memory64 || false;
    this._disableVerification = disableVerification || false;
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
      this._memory64 ? ValueType.Int64 : ValueType.Int32,
      this._features,
      this._disableVerification
    );
    if (callback) {
      callback(this._initExpressionEmitter);
      this._initExpressionEmitter.end();
    }

    return this._initExpressionEmitter;
  }

  offset(value: number | bigint | GlobalBuilder | ((asm: InitExpressionEmitter) => void)): void {
    if (typeof value === 'function') {
      this.createInitEmitter(value);
    } else if (value instanceof GlobalBuilder) {
      this.createInitEmitter((asm) => {
        asm.get_global(value);
      });
    } else if (typeof value === 'bigint') {
      this.createInitEmitter((asm) => {
        asm.const_i64(value);
      });
    } else if (typeof value === 'number') {
      this.createInitEmitter((asm) => {
        if (this._memory64) {
          asm.const_i64(value);
        } else {
          asm.const_i32(value);
        }
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
