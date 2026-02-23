import AssemblyEmitter, { AssemblyEmitterOptions } from './AssemblyEmitter';
import LocalBuilder from './LocalBuilder';
import FunctionBuilder from './FunctionBuilder';
import FunctionParameterBuilder from './FunctionParameterBuilder';
import { ValueTypeDescriptor } from './types';

export default class FunctionEmitter extends AssemblyEmitter {
  _functionBuilder: FunctionBuilder;

  constructor(functionBuilder: FunctionBuilder, options?: AssemblyEmitterOptions) {
    super(functionBuilder.funcTypeBuilder.toSignature(), options);
    this._functionBuilder = functionBuilder;
    this._locals = [];
  }

  get returnValues(): ValueTypeDescriptor[] {
    return this._functionBuilder.funcTypeBuilder.returnTypes;
  }

  get parameters(): FunctionParameterBuilder[] {
    return this._functionBuilder.parameters;
  }

  getParameter(index: number): FunctionParameterBuilder | LocalBuilder {
    if (index >= 0) {
      if (index < this.parameters.length) {
        return this._functionBuilder.getParameter(index);
      }

      const localIndex = index - this.parameters.length;
      if (localIndex < this._locals.length) {
        return this._locals[localIndex];
      }
    }

    throw new Error('Invalid parameter index.');
  }
}
