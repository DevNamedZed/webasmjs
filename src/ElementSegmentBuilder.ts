import Arg from './Arg';
import GlobalBuilder from './GlobalBuilder';
import InitExpressionEmitter from './InitExpressionEmitter';
import TableBuilder from './TableBuilder';
import FunctionBuilder from './FunctionBuilder';
import ImportBuilder from './ImportBuilder';
import { InitExpressionType, ValueType } from './types';
import BinaryWriter from './BinaryWriter';

export default class ElementSegmentBuilder {
  _table: TableBuilder;
  _functions: (FunctionBuilder | ImportBuilder)[] = [];
  _initExpressionEmitter: InitExpressionEmitter | null = null;

  constructor(table: TableBuilder, functions: (FunctionBuilder | ImportBuilder)[]) {
    this._table = table;
    this._functions = functions;
  }

  createInitEmitter(callback?: (asm: InitExpressionEmitter) => void): InitExpressionEmitter {
    if (this._initExpressionEmitter) {
      throw new Error('Initialization expression emitter has already been created.');
    }

    this._initExpressionEmitter = new InitExpressionEmitter(
      InitExpressionType.Element,
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

    writer.writeVarUInt32(this._table._index);
    this._initExpressionEmitter.write(writer);
    writer.writeVarUInt32(this._functions.length);
    this._functions.forEach((x) => {
      if (x instanceof FunctionBuilder) {
        writer.writeVarUInt32(x._index);
      } else if (x instanceof ImportBuilder) {
        writer.writeVarUInt32(x.index);
      }
    });
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
