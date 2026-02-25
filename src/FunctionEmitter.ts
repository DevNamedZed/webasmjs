import AssemblyEmitter, { AssemblyEmitterOptions } from './AssemblyEmitter';
import LocalBuilder from './LocalBuilder';
import FunctionBuilder from './FunctionBuilder';
import FunctionParameterBuilder from './FunctionParameterBuilder';
import FuncTypeBuilder from './FuncTypeBuilder';
import { ExternalKind, ValueTypeDescriptor } from './types';
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
    getFuncType(typeIndex: number): { parameterTypes: ValueTypeDescriptor[]; returnTypes: ValueTypeDescriptor[] } | null {
      const t = types[typeIndex];
      if (t && 'parameterTypes' in t && 'returnTypes' in t) {
        const ft = t as FuncTypeBuilder;
        return { parameterTypes: ft.parameterTypes, returnTypes: ft.returnTypes };
      }
      return null;
    },
    getTypeKind(typeIndex: number): 'struct' | 'array' | 'func' | null {
      const t = types[typeIndex];
      if (!t) return null;
      if ('fields' in t) return 'struct';
      if ('elementType' in t) return 'array';
      if ('parameterTypes' in t) return 'func';
      return null;
    },
    getSuperTypes(typeIndex: number): number[] {
      const t = types[typeIndex];
      if (!t) return [];
      if ('superTypes' in t) {
        const st = (t as StructTypeBuilder | ArrayTypeBuilder).superTypes;
        return st.map((s: { index: number }) => s.index);
      }
      return [];
    },
  };
}

export default class FunctionEmitter extends AssemblyEmitter {
  _functionBuilder: FunctionBuilder;

  constructor(functionBuilder: FunctionBuilder, options?: AssemblyEmitterOptions) {
    const moduleBuilder = functionBuilder._moduleBuilder;
    const memory64 = moduleBuilder?._memories?.some((m) => m.isMemory64) ||
      moduleBuilder?._imports?.some((imp) => imp.isMemoryImport() && imp.data.memory64) || false;
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
    if (!moduleBuilder) return null;

    const importedTagCount = moduleBuilder._importsIndexSpace.tag;

    if (tagIndex < importedTagCount) {
      // Look up imported tag by index
      const tagImports = moduleBuilder._imports.filter(
        (imp) => imp.externalKind === ExternalKind.Tag
      );
      if (tagIndex < tagImports.length) {
        const funcType = tagImports[tagIndex].data as FuncTypeBuilder;
        return funcType.parameterTypes;
      }
      return null;
    }

    // Local tag: adjust index past imports
    const localIndex = tagIndex - importedTagCount;
    if (moduleBuilder._tags && localIndex < moduleBuilder._tags.length) {
      return moduleBuilder._tags[localIndex]._funcType.parameterTypes;
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
