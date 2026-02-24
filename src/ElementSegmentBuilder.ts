import Arg from './Arg';
import GlobalBuilder from './GlobalBuilder';
import InitExpressionEmitter from './InitExpressionEmitter';
import TableBuilder from './TableBuilder';
import FunctionBuilder from './FunctionBuilder';
import ImportBuilder from './ImportBuilder';
import { InitExpressionType, ValueType, WasmFeature } from './types';
import BinaryWriter from './BinaryWriter';

export default class ElementSegmentBuilder {
  _table: TableBuilder | null;
  _functions: (FunctionBuilder | ImportBuilder)[] = [];
  _initExpressionEmitter: InitExpressionEmitter | null = null;
  _passive: boolean = false;
  _features: Set<WasmFeature>;

  constructor(table: TableBuilder | null, functions: (FunctionBuilder | ImportBuilder)[], features?: Set<WasmFeature>) {
    this._table = table;
    this._functions = functions;
    this._features = features || new Set();
  }

  passive(): this {
    this._passive = true;
    return this;
  }

  createInitEmitter(callback?: (asm: InitExpressionEmitter) => void): InitExpressionEmitter {
    if (this._initExpressionEmitter) {
      throw new Error('Initialization expression emitter has already been created.');
    }

    this._initExpressionEmitter = new InitExpressionEmitter(
      InitExpressionType.Element,
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

  private _writeFuncIndex(writer: BinaryWriter, func: FunctionBuilder | ImportBuilder): void {
    if (func instanceof FunctionBuilder) {
      writer.writeVarUInt32(func._index);
    } else if (func instanceof ImportBuilder) {
      writer.writeVarUInt32(func.index);
    }
  }

  write(writer: BinaryWriter): void {
    if (this._passive) {
      // Passive segment: kind=1, elemkind=0x00 (funcref), vec of func indices
      writer.writeVarUInt32(1);
      writer.writeUInt8(0x00); // elemkind: funcref
      writer.writeVarUInt32(this._functions.length);
      this._functions.forEach((x) => this._writeFuncIndex(writer, x));
      return;
    }

    if (!this._initExpressionEmitter) {
      throw new Error('The initialization expression was not defined.');
    }

    const tableIndex = this._table ? this._table._index : 0;

    if (tableIndex !== 0) {
      // Active segment with explicit table index: kind=2
      writer.writeVarUInt32(2);
      writer.writeVarUInt32(tableIndex);
      this._initExpressionEmitter.write(writer);
      writer.writeUInt8(0x00); // elemkind: funcref
      writer.writeVarUInt32(this._functions.length);
      this._functions.forEach((x) => this._writeFuncIndex(writer, x));
    } else {
      // Active segment with default table 0: kind=0
      writer.writeVarUInt32(0);
      this._initExpressionEmitter.write(writer);
      writer.writeVarUInt32(this._functions.length);
      this._functions.forEach((x) => this._writeFuncIndex(writer, x));
    }
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
