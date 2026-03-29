import type {
  ModuleInfo,
  FuncTypeInfo,
  TypeInfo,
} from '../../src/BinaryReader';

export const SECTION_NAMES: Record<number, string> = {
  0: 'Custom',
  1: 'Type',
  2: 'Import',
  3: 'Function',
  4: 'Table',
  5: 'Memory',
  6: 'Global',
  7: 'Export',
  8: 'Start',
  9: 'Element',
  10: 'Code',
  11: 'Data',
  12: 'DataCount',
  13: 'Tag',
};

export const VALUE_TYPE_NAMES: Record<number, string> = {
  [-1]: 'i32', [-2]: 'i64', [-3]: 'f32', [-4]: 'f64', [-5]: 'v128',
  [-16]: 'funcref', [-17]: 'externref', [-18]: 'anyref', [-19]: 'eqref',
  [-20]: 'i31ref', [-21]: 'structref', [-22]: 'arrayref',
  [-15]: 'nullref', [-13]: 'nullfuncref', [-14]: 'nullexternref',
  0x7f: 'i32', 0x7e: 'i64', 0x7d: 'f32', 0x7c: 'f64', 0x7b: 'v128',
  0x70: 'funcref', 0x6f: 'externref', 0x6e: 'anyref', 0x6d: 'eqref',
  0x6c: 'i31ref', 0x6b: 'structref', 0x6a: 'arrayref',
  0x71: 'nullref', 0x73: 'nullfuncref', 0x72: 'nullexternref',
};

export const EXPORT_KIND_NAMES: Record<number, string> = {
  0: 'func', 1: 'table', 2: 'memory', 3: 'global', 4: 'tag',
};

export function getValueTypeName(valueType: number | { name: string }): string {
  if (typeof valueType === 'object' && 'name' in valueType) {
    return valueType.name;
  }
  return VALUE_TYPE_NAMES[valueType] || `type_${valueType}`;
}

export function formatFuncType(funcType: FuncTypeInfo): string {
  const params = funcType.parameterTypes.map(p => getValueTypeName(p)).join(', ');
  const returns = funcType.returnTypes.map(r => getValueTypeName(r)).join(', ');
  return `(${params}) -> (${returns})`;
}

export function flattenTypes(moduleInfo: ModuleInfo): TypeInfo[] {
  const flat: TypeInfo[] = [];
  for (const typeEntry of moduleInfo.types) {
    if (typeEntry.kind === 'rec') {
      for (const inner of typeEntry.types) {
        flat.push(inner);
      }
    } else {
      flat.push(typeEntry);
    }
  }
  return flat;
}
