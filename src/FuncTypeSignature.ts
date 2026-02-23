import { ValueTypeDescriptor } from './types';

export default class FuncTypeSignature {
  static empty = new FuncTypeSignature([], []);

  returnTypes: ValueTypeDescriptor[];
  parameterTypes: ValueTypeDescriptor[];

  constructor(returnTypes: ValueTypeDescriptor[], parameterTypes: ValueTypeDescriptor[]) {
    this.returnTypes = returnTypes;
    this.parameterTypes = parameterTypes;
  }
}
