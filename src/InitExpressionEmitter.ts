import AssemblyEmitter from './AssemblyEmitter';
import GlobalBuilder from './GlobalBuilder';
import { InitExpressionType, ValueTypeDescriptor, OpCodeDef, WasmFeature } from './types';
import OpCodes from './OpCodes';
import FuncTypeSignature from './FuncTypeSignature';
import BinaryWriter from './BinaryWriter';

export default class InitExpressionEmitter extends AssemblyEmitter {
  _initExpressionType: InitExpressionType;
  _features: Set<WasmFeature>;

  constructor(initExpressionType: InitExpressionType, valueType: ValueTypeDescriptor, features?: Set<WasmFeature>) {
    super(new FuncTypeSignature([valueType], []));
    this._initExpressionType = initExpressionType;
    this._features = features || new Set();
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
    // Extended-const allows multiple instructions in init expressions
    const hasExtendedConst = this._features.has('extended-const');
    const maxInstructions = hasExtendedConst ? Infinity : 2;

    if (this._instructions.length >= maxInstructions) {
      return;
    }

    if (!hasExtendedConst && this._instructions.length === 1) {
      if (opCode !== OpCodes.end) {
        throw new Error(`Opcode ${opCode.mnemonic} is not valid after init expression value.`);
      }
      return;
    }

    // With extended-const, end is always valid
    if (opCode === OpCodes.end) {
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
        if (this._initExpressionType === InitExpressionType.Element && !hasExtendedConst) {
          throw new Error(
            'The only valid instruction for an element initializer expression is a constant i32, ' +
              'global not supported.'
          );
        }

        if (!(globalBuilder instanceof GlobalBuilder)) {
          throw new Error('A global builder was expected.');
        }

        if (globalBuilder.globalType.mutable && !hasExtendedConst) {
          throw new Error(
            'An initializer expression cannot reference a mutable global.'
          );
        }

        break;
      }

      // Extended-const: allow arithmetic in init expressions
      case OpCodes.i32_add:
      case OpCodes.i32_sub:
      case OpCodes.i32_mul:
      case OpCodes.i64_add:
      case OpCodes.i64_sub:
      case OpCodes.i64_mul: {
        if (!hasExtendedConst) {
          throw new Error(
            `Opcode ${opCode.mnemonic} is not supported in an initializer expression. Enable the extended-const feature to allow arithmetic in init expressions.`
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
