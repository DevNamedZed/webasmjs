import BinaryWriter from './BinaryWriter';
import FunctionParameterBuilder from './FunctionParameterBuilder';
import FuncTypeBuilder from './FuncTypeBuilder';
import FunctionEmitter from './FunctionEmitter';
import { ValueTypeDescriptor } from './types';
import type ModuleBuilder from './ModuleBuilder';

export default class FunctionBuilder {
  name: string;
  funcTypeBuilder: FuncTypeBuilder;
  parameters: FunctionParameterBuilder[];
  _index: number;
  functionEmitter: FunctionEmitter | null = null;
  _moduleBuilder: ModuleBuilder;

  constructor(
    moduleBuilder: ModuleBuilder,
    name: string,
    funcTypeBuilder: FuncTypeBuilder,
    index: number
  ) {
    this._moduleBuilder = moduleBuilder;
    this.name = name;
    this.funcTypeBuilder = funcTypeBuilder;
    this._index = index;
    this.parameters = funcTypeBuilder.parameterTypes.map(
      (x, i) => new FunctionParameterBuilder(x, i)
    );
  }

  get returnType(): ValueTypeDescriptor[] {
    return this.funcTypeBuilder.returnTypes;
  }

  get parameterTypes(): ValueTypeDescriptor[] {
    return this.funcTypeBuilder.parameterTypes;
  }

  getParameter(index: number): FunctionParameterBuilder {
    return this.parameters[index];
  }

  createEmitter(callback?: (asm: FunctionEmitter) => void): FunctionEmitter {
    if (this.functionEmitter) {
      throw new Error('Function emitter has already been created.');
    }

    this.functionEmitter = new FunctionEmitter(this, {
      disableVerification: this._moduleBuilder.disableVerification,
      features: this._moduleBuilder.features,
    });
    if (callback) {
      callback(this.functionEmitter);
      this.functionEmitter.end();
    }

    return this.functionEmitter;
  }

  withExport(name?: string): this {
    this._moduleBuilder.exportFunction(this, name || null);
    return this;
  }

  write(writer: BinaryWriter): void {
    if (!this.functionEmitter) {
      throw new Error('Function body has not been defined.');
    }

    this.functionEmitter.write(writer);
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }
}
