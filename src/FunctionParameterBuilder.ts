import { ValueTypeDescriptor } from './types';

export default class FunctionParameterBuilder {
  name: string | null;
  valueType: ValueTypeDescriptor;
  index: number;

  constructor(valueType: ValueTypeDescriptor, index: number) {
    this.name = null;
    this.valueType = valueType;
    this.index = index;
  }

  withName(name: string): this {
    this.name = name;
    return this;
  }
}
