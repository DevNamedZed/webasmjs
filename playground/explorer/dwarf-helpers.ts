import type { ModuleInfo } from '../../src/BinaryReader';
import type { DwarfDebugInfo, DwarfFunction, DwarfTypeInfo } from '../../src/DwarfParser';
import type { FieldResolver } from '../WasmDecompiler';

interface ByteRange {
  offset: number;
  length: number;
}

interface ByteRangeMap {
  sections: SectionRange[];
  getItem(section: string, index: number): ByteRange | null;
}

interface SectionRange {
  sectionId: number;
  offset: number;
  length: number;
  name: string;
}

export function findCodeSectionDataOffset(
  codeSectionStart: number,
  rawBytes: Uint8Array | null,
): number {
  if (!rawBytes) {
    return codeSectionStart;
  }
  let offset = codeSectionStart;
  offset++;
  let byte: number;
  do {
    byte = rawBytes[offset++];
  } while (byte & 0x80);
  return offset;
}

export function resolvePointerToStructFields(
  typeOffset: number,
  types: Map<number, DwarfTypeInfo>,
): Map<number, string> | null {
  const typeInfo = types.get(typeOffset);
  if (!typeInfo) {
    return null;
  }

  if (typeInfo.tag === 'pointer' && typeInfo.referencedType !== null) {
    return resolvePointerToStructFields(typeInfo.referencedType, types);
  }

  if (typeInfo.tag === 'typedef' && typeInfo.referencedType !== null) {
    return resolvePointerToStructFields(typeInfo.referencedType, types);
  }

  if (typeInfo.tag === 'const' && typeInfo.referencedType !== null) {
    return resolvePointerToStructFields(typeInfo.referencedType, types);
  }

  if (typeInfo.tag === 'struct' && typeInfo.fields && typeInfo.fields.length > 0) {
    const fieldMap = new Map<number, string>();
    for (const field of typeInfo.fields) {
      fieldMap.set(field.byteOffset, field.name);
    }
    return fieldMap;
  }

  return null;
}

export function getDwarfLanguageName(language: number): string {
  const languageNames: Record<number, string> = {
    0x01: 'C89', 0x02: 'C', 0x04: 'C++', 0x0c: 'C99',
    0x1a: 'C11', 0x2a: 'C17', 0x1c: 'C++03', 0x21: 'C++11',
    0x22: 'C++14', 0x1d: 'Rust',
    0x12: 'Java', 0x0e: 'Python', 0x1f: 'Swift',
    0x24: 'Kotlin', 0x20: 'Go', 0x25: 'Zig',
  };
  return languageNames[language] || `language_${language} (0x${language.toString(16)})`;
}

export function buildDwarfFunctionMap(
  dwarfInfo: DwarfDebugInfo,
  moduleInfo: ModuleInfo,
  byteRanges: ByteRangeMap,
  rawBytes: Uint8Array | null,
  importedFuncCount: number,
): Map<number, string> {
  const functionMap = new Map<number, string>();

  const codeSectionRange = byteRanges.sections.find(section => section.sectionId === 10);
  if (!codeSectionRange) {
    return functionMap;
  }

  const codeSectionBodyOffset = findCodeSectionDataOffset(codeSectionRange.offset, rawBytes);

  const offsets = [codeSectionBodyOffset, codeSectionRange.offset, 0];

  const sortedDwarfFuncs = [...dwarfInfo.functions]
    .filter(dwarfFunc => dwarfFunc.name.length > 0 && dwarfFunc.lowPc > 0)
    .sort((funcA, funcB) => funcA.lowPc - funcB.lowPc);

  for (const baseOffset of offsets) {
    for (let funcIndex = 0; funcIndex < moduleInfo.functions.length; funcIndex++) {
      const globalIndex = importedFuncCount + funcIndex;
      const byteRange = byteRanges.getItem('function', funcIndex);
      if (!byteRange) {
        continue;
      }

      const relativeOffset = byteRange.offset - baseOffset;

      const exactMatch = sortedDwarfFuncs.find(
        dwarfFunc => dwarfFunc.lowPc === relativeOffset
      );
      if (exactMatch) {
        functionMap.set(globalIndex, exactMatch.name);
      }
    }

    if (functionMap.size > 0) {
      for (let funcIndex = 0; funcIndex < moduleInfo.functions.length; funcIndex++) {
        const globalIndex = importedFuncCount + funcIndex;
        if (functionMap.has(globalIndex)) {
          continue;
        }
        const byteRange = byteRanges.getItem('function', funcIndex);
        if (!byteRange) {
          continue;
        }

        const relativeOffset = byteRange.offset - baseOffset;
        const rangeMatch = sortedDwarfFuncs.find(
          dwarfFunc => dwarfFunc.lowPc >= relativeOffset && dwarfFunc.lowPc < relativeOffset + byteRange.length
        );
        if (rangeMatch) {
          functionMap.set(globalIndex, rangeMatch.name);
        }
      }
      break;
    }
  }

  return functionMap;
}

export function findDwarfFunctionByGlobalIndex(
  globalIndex: number,
  dwarfFunctionMap: Map<number, string> | null,
  dwarfInfo: DwarfDebugInfo | null,
): DwarfFunction | null {
  if (!dwarfFunctionMap) {
    return null;
  }
  const funcName = dwarfFunctionMap.get(globalIndex);
  if (!funcName) {
    return null;
  }
  if (!dwarfInfo) {
    return null;
  }
  return dwarfInfo.functions.find(func => func.name === funcName) || null;
}

export function buildFieldResolver(
  funcGlobalIndex: number,
  dwarfInfo: DwarfDebugInfo | null,
  dwarfFunctionMap: Map<number, string> | null,
): FieldResolver | undefined {
  if (!dwarfInfo || dwarfInfo.types.size === 0) {
    return undefined;
  }

  const dwarfFunc = findDwarfFunctionByGlobalIndex(funcGlobalIndex, dwarfFunctionMap, dwarfInfo);
  if (!dwarfFunc) {
    return undefined;
  }

  const varFieldMaps = new Map<string, Map<number, string>>();

  for (const param of dwarfFunc.parameters) {
    if (!param.name || param.typeOffset === null) {
      continue;
    }

    const structFields = resolvePointerToStructFields(param.typeOffset, dwarfInfo.types);
    if (structFields && structFields.size > 0) {
      const paramName = param.name.replace(/[^a-zA-Z0-9_$]/g, '_');
      varFieldMaps.set(paramName, structFields);
    }
  }

  for (const variable of dwarfFunc.variables) {
    if (!variable.name || variable.typeOffset === null) {
      continue;
    }

    const structFields = resolvePointerToStructFields(variable.typeOffset, dwarfInfo.types);
    if (structFields && structFields.size > 0) {
      const varName = variable.name.replace(/[^a-zA-Z0-9_$]/g, '_');
      if (!varFieldMaps.has(varName)) {
        varFieldMaps.set(varName, structFields);
      }
    }
  }

  if (varFieldMaps.size === 0) {
    return undefined;
  }

  return {
    resolveField(baseName: string, offset: number): string | null {
      const fieldMap = varFieldMaps.get(baseName);
      if (fieldMap) {
        return fieldMap.get(offset) || null;
      }
      return null;
    },
  };
}

export function buildDwarfParameterTypeMap(
  dwarfInfo: DwarfDebugInfo,
  dwarfFunctionMap: Map<number, string>,
): Map<number, Map<number, string>> | null {
  const dwarfFuncByName = new Map<string, DwarfFunction>();
  for (const func of dwarfInfo.functions) {
    if (func.name) {
      dwarfFuncByName.set(func.name, func);
    }
  }

  const result = new Map<number, Map<number, string>>();
  for (const [globalIndex, funcName] of dwarfFunctionMap) {
    const dwarfFunc = dwarfFuncByName.get(funcName);
    if (!dwarfFunc) {
      continue;
    }
    const typeMap = new Map<number, string>();
    for (let paramIdx = 0; paramIdx < dwarfFunc.parameters.length; paramIdx++) {
      const param = dwarfFunc.parameters[paramIdx];
      if (param.typeName) {
        typeMap.set(paramIdx, param.typeName);
      }
    }
    if (typeMap.size > 0) {
      result.set(globalIndex, typeMap);
    }
  }

  return result.size > 0 ? result : null;
}

export function buildDwarfLocalNameMap(
  dwarfInfo: DwarfDebugInfo,
  dwarfFunctionMap: Map<number, string>,
): Map<number, Map<number, string>> | null {
  const dwarfFuncByName = new Map<string, DwarfFunction>();
  for (const func of dwarfInfo.functions) {
    if (func.name) {
      dwarfFuncByName.set(func.name, func);
    }
  }

  const result = new Map<number, Map<number, string>>();
  for (const [globalIndex, funcName] of dwarfFunctionMap) {
    const dwarfFunc = dwarfFuncByName.get(funcName);
    if (!dwarfFunc) {
      continue;
    }
    const localMap = new Map<number, string>();
    for (const param of dwarfFunc.parameters) {
      if (param.wasmLocal !== null) {
        localMap.set(param.wasmLocal, param.name);
      }
    }
    for (const variable of dwarfFunc.variables) {
      if (variable.wasmLocal !== null) {
        localMap.set(variable.wasmLocal, variable.name);
      }
    }
    if (localMap.size > 0) {
      result.set(globalIndex, localMap);
    }
  }

  return result.size > 0 ? result : null;
}

export function findDwarfFunction(
  localFuncIndex: number,
  dwarfInfo: DwarfDebugInfo,
  byteRanges: ByteRangeMap,
  rawBytes: Uint8Array | null,
): DwarfFunction | null {
  const byteRange = byteRanges.getItem('function', localFuncIndex);
  if (!byteRange) {
    return null;
  }

  const codeSectionRange = byteRanges.sections.find(section => section.sectionId === 10);
  if (!codeSectionRange) {
    return null;
  }

  const codeSectionBodyOffset = findCodeSectionDataOffset(codeSectionRange.offset, rawBytes);

  for (const baseOffset of [codeSectionBodyOffset, codeSectionRange.offset, 0]) {
    const relativeOffset = byteRange.offset - baseOffset;
    const match = dwarfInfo.functions.find(
      dwarfFunc => dwarfFunc.lowPc >= relativeOffset && dwarfFunc.lowPc < relativeOffset + byteRange.length
    );
    if (match) {
      return match;
    }
  }

  return null;
}

export function getNameSource(
  globalFuncIndex: number,
  moduleInfo: ModuleInfo | null,
  dwarfFunctionMap: Map<number, string> | null,
): string | null {
  if (moduleInfo?.nameSection?.functionNames?.has(globalFuncIndex)) {
    return 'WASM name section';
  }
  if (dwarfFunctionMap && dwarfFunctionMap.has(globalFuncIndex)) {
    return 'DWARF debug info';
  }
  return null;
}
