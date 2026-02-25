import AssemblyEmitter, { AssemblyEmitterOptions } from './AssemblyEmitter';
import LocalBuilder from './LocalBuilder';
import FunctionBuilder from './FunctionBuilder';
import FunctionParameterBuilder from './FunctionParameterBuilder';
import { ValueTypeDescriptor } from './types';
import type { TypeResolver } from './verification/OperandStackVerifier';
import type StructTypeBuilder from './StructTypeBuilder';
import type ArrayTypeBuilder from './ArrayTypeBuilder';

function createTypeResolver(functionBuilder: FunctionBuilder): TypeResolver | undefined {
  const moduleBuilder = functionBuilder._moduleBuilder;
  if (!moduleBuilder || !moduleBuilder._types) return undefined;
  const types = moduleBuilder._types;
  return {
    getStructType(typeIndex: number): StructTypeBuilder | null {
      const t = types[typeIndex];
      if (t && 'fields' in t) return t as StructTypeBuilder;
      return null;
    },
    getArrayType(typeIndex: number): ArrayTypeBuilder | null {
      const t = types[typeIndex];
      if (t && 'elementType' in t) return t as ArrayTypeBuilder;
      return null;
    },
  };
}

export default class FunctionEmitter extends AssemblyEmitter {
  _functionBuilder: FunctionBuilder;

  constructor(functionBuilder: FunctionBuilder, options?: AssemblyEmitterOptions) {
    const moduleBuilder = functionBuilder._moduleBuilder;
    const memory64 = moduleBuilder?._memories?.some((m) => m.isMemory64) || false;
    super(
      functionBuilder.funcTypeBuilder.toSignature(),
      options,
      createTypeResolver(functionBuilder),
      memory64
    );
    this._functionBuilder = functionBuilder;
    this._locals = [];
  }

  get returnValues(): ValueTypeDescriptor[] {
    return this._functionBuilder.funcTypeBuilder.returnTypes;
  }

  get parameters(): FunctionParameterBuilder[] {
    return this._functionBuilder.parameters;
  }

  _getTagParameterTypes(tagIndex: number): ValueTypeDescriptor[] | null {
    const moduleBuilder = this._functionBuilder._moduleBuilder;
    if (moduleBuilder && moduleBuilder._tags && tagIndex < moduleBuilder._tags.length) {
      return moduleBuilder._tags[tagIndex]._funcType.parameterTypes;
    }
    return null;
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
