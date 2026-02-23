import AssemblyEmitter from './AssemblyEmitter';
import GlobalBuilder from './GlobalBuilder';
import { InitExpressionType, ValueTypeDescriptor, OpCodeDef } from './types';
import OpCodes from './OpCodes';
import FuncTypeSignature from './FuncTypeSignature';
import BinaryWriter from './BinaryWriter';

export default class InitExpressionEmitter extends AssemblyEmitter {
  _initExpressionType: InitExpressionType;

  constructor(initExpressionType: InitExpressionType, valueType: ValueTypeDescriptor) {
    super(new FuncTypeSignature([valueType], []));
    this._initExpressionType = initExpressionType;
  }

  getParameter(_index: number): never {
    throw new Error('An initialization expression does not have any parameters.');
  }

  declareLocal(): never {
    throw new Error('An initialization expression cannot have locals.');
  }

  emit(opCode: OpCodeDef, ...args: any[]): any {
    this._isValidateOp(opCode, args);
    return super.emit(opCode, ...args);
  }

  write(writer: BinaryWriter): void {
    for (let index = 0; index < this._instructions.length; index++) {
      this._instructions[index].write(writer);
    }
  }

  _isValidateOp(opCode: OpCodeDef, args?: any[]): void {
    if (this._instructions.length === 2) {
      return;
    }

    if (this._instructions.length === 1) {
      if (opCode !== OpCodes.end) {
        throw new Error(`Opcode ${opCode.mnemonic} is not valid after init expression value.`);
      }
      return;
    }

    switch (opCode) {
      case OpCodes.f32_const:
      case OpCodes.f64_const:
      case OpCodes.i32_const:
      case OpCodes.i64_const:
        break;

      case OpCodes.get_global: {
        const globalBuilder = args?.[0];
        if (this._initExpressionType === InitExpressionType.Element) {
          throw new Error(
            'The only valid instruction for an element initializer expression is a constant i32, ' +
              'global not supported.'
          );
        }

        if (!(globalBuilder instanceof GlobalBuilder)) {
          throw new Error('A global builder was expected.');
        }

        if (globalBuilder.globalType.mutable) {
          throw new Error(
            'An initializer expression cannot reference a mutable global.'
          );
        }

        break;
      }

      default:
        throw new Error(
          `Opcode ${opCode.mnemonic} is not supported in an initializer expression.`
        );
    }
  }
}
