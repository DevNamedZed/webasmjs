import AssemblyEmitter from './AssemblyEmitter';
import GlobalBuilder from './GlobalBuilder';
import ImportBuilder from './ImportBuilder';
import { ExternalKind, InitExpressionType, ValueTypeDescriptor, OpCodeDef, WasmFeature } from './types';
import OpCodes from './OpCodes';
import FuncTypeSignature from './FuncTypeSignature';
import BinaryWriter from './BinaryWriter';

export default class InitExpressionEmitter extends AssemblyEmitter {
  _initExpressionType: InitExpressionType;
  _features: Set<WasmFeature>;

  constructor(initExpressionType: InitExpressionType, valueType: ValueTypeDescriptor, features?: Set<WasmFeature>, disableVerification?: boolean) {
    super(new FuncTypeSignature([valueType], []), { disableVerification: disableVerification || false });
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

        if (globalBuilder instanceof GlobalBuilder) {
          if (globalBuilder.globalType.mutable && !hasExtendedConst) {
            throw new Error(
              'An initializer expression cannot reference a mutable global.'
            );
          }
        } else if (globalBuilder instanceof ImportBuilder) {
          if (globalBuilder.externalKind !== ExternalKind.Global) {
            throw new Error('Import must be a global import to use in global.get.');
          }
          // Imported globals are always valid in init expressions (they're immutable by default in this context)
        } else {
          throw new Error('A GlobalBuilder or global ImportBuilder was expected.');
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

      // GC: allow struct/array/ref operations in init expressions
      case OpCodes.struct_new:
      case OpCodes.struct_new_default:
      case OpCodes.array_new:
      case OpCodes.array_new_default:
      case OpCodes.array_new_fixed:
      case OpCodes.ref_i31:
      case OpCodes.any_convert_extern:
      case OpCodes.extern_convert_any: {
        if (!this._features.has('gc')) {
          throw new Error(
            `Opcode ${opCode.mnemonic} requires the 'gc' feature to be used in an initializer expression.`
          );
        }
        break;
      }

      // ref.null is valid in init expressions (reference-types or gc)
      case OpCodes.ref_null:
        break;

      // ref.func is valid in element segment init expressions
      case OpCodes.ref_func:
        break;

      default:
        throw new Error(
          `Opcode ${opCode.mnemonic} is not supported in an initializer expression.`
        );
    }
  }
}
