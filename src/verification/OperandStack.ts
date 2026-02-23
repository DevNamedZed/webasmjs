import { ValueTypeDescriptor } from '../types';

export default class OperandStack {
  static Empty: OperandStack = (() => {
    const operandStack = Object.create(OperandStack.prototype) as OperandStack;
    operandStack._valueType = null!;
    operandStack._previous = null;
    operandStack._length = 0;
    return operandStack;
  })();

  _previous: OperandStack | null;
  _length: number;
  _valueType: ValueTypeDescriptor;

  constructor(valueType: ValueTypeDescriptor, previous: OperandStack | null = null) {
    this._valueType = valueType;
    this._previous = previous;
    this._length = this._previous ? this._previous._length + 1 : 1;
  }

  get length(): number {
    return this._length;
  }

  get valueType(): ValueTypeDescriptor {
    if (this.isEmpty) {
      throw new Error('The stack is empty.');
    }
    return this._valueType;
  }

  get isEmpty(): boolean {
    return this._length === 0;
  }

  push(valueType: ValueTypeDescriptor): OperandStack {
    return new OperandStack(valueType, this);
  }

  pop(): OperandStack {
    if (this.isEmpty) {
      throw new Error('The stack is empty.');
    }
    return this._previous!;
  }

  peek(): OperandStack | null {
    return this._previous;
  }
}
