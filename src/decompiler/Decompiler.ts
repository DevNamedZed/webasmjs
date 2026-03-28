import { ModuleInfo, TypeInfo, DataInfo } from '../BinaryReader';
import { demangleName } from './Demangler';
import InstructionDecoder from '../InstructionDecoder';
import { buildControlFlowGraph } from './ControlFlowGraph';
import { buildSsa } from './SsaBuilder';
import { computeDominance } from './DominanceTree';
import { structureFunction } from './StructuralAnalysis';
import { optimizeSsa } from './OptimizationPasses';
import { lowerSsaToStatements } from './SsaLowering';
import type { LoweringNameProvider } from './SsaLowering';
import { emitLowered, WASM_TO_C_TYPE } from './LoweredEmitter';
import { annotateMemoryPatterns } from './MemoryPatterns';
import { removeStackFrame, StackFrameResult } from './StackFramePass';

function sanitizeIdentifier(name: string): string {
  return name.replace(/[^a-zA-Z0-9_$]/g, '_');
}

export interface NameResolver {
  functionName(globalIndex: number): NameResolution;
  localName(funcGlobalIndex: number, localIndex: number): NameResolution;
  parameterType?(funcGlobalIndex: number, paramIndex: number): string | null;
  globalName(globalIndex: number): NameResolution;
  typeName(typeIndex: number): string | null;
}

export interface NameResolution {
  name: string;
  source: 'name-section' | 'dwarf' | 'generated';
}

export function createNameResolver(
  moduleInfo: ModuleInfo,
  functionNameProvider?: (globalIndex: number) => string | null,
  localNameProvider?: (funcGlobalIndex: number, localIndex: number) => string | null,
  parameterTypeProvider?: (funcGlobalIndex: number, paramIndex: number) => string | null,
): NameResolver {
  const nameSection = moduleInfo.nameSection;

  return {
    functionName(globalIndex: number): NameResolution {
      if (nameSection?.functionNames?.has(globalIndex)) {
        const rawName = nameSection.functionNames.get(globalIndex)!;
        return { name: sanitizeIdentifier(demangleName(rawName)), source: 'name-section' };
      }
      if (functionNameProvider) {
        const externalName = functionNameProvider(globalIndex);
        if (externalName) {
          return { name: sanitizeIdentifier(demangleName(externalName)), source: 'dwarf' };
        }
      }
      return { name: `func_${globalIndex}`, source: 'generated' };
    },

    localName(funcGlobalIndex: number, localIndex: number): NameResolution {
      if (nameSection?.localNames?.has(funcGlobalIndex)) {
        const locals = nameSection.localNames.get(funcGlobalIndex)!;
        if (locals.has(localIndex)) {
          return { name: sanitizeIdentifier(locals.get(localIndex)!), source: 'name-section' };
        }
      }
      if (localNameProvider) {
        const dwarfName = localNameProvider(funcGlobalIndex, localIndex);
        if (dwarfName) {
          return { name: sanitizeIdentifier(dwarfName), source: 'dwarf' };
        }
      }
      return { name: `var${localIndex}`, source: 'generated' };
    },

    globalName(globalIndex: number): NameResolution {
      if (nameSection?.globalNames?.has(globalIndex)) {
        return { name: sanitizeIdentifier(nameSection.globalNames.get(globalIndex)!), source: 'name-section' };
      }
      return { name: `global_${globalIndex}`, source: 'generated' };
    },

    typeName(_typeIndex: number): string | null {
      return null;
    },

    parameterType(funcGlobalIndex: number, paramIndex: number): string | null {
      if (parameterTypeProvider) {
        return parameterTypeProvider(funcGlobalIndex, paramIndex);
      }
      return null;
    },
  };
}

function typeStr(valueType: number | { name: string }): string {
  if (typeof valueType === 'object' && 'name' in valueType) {
    return WASM_TO_C_TYPE[valueType.name] || valueType.name;
  }
  const wasmNames: Record<number, string> = {
    [-1]: 'i32', [-2]: 'i64', [-3]: 'f32', [-4]: 'f64', [-5]: 'v128',
    0x7f: 'i32', 0x7e: 'i64', 0x7d: 'f32', 0x7c: 'f64', 0x7b: 'v128',
  };
  const wasmType = wasmNames[valueType] || 'i32';
  return WASM_TO_C_TYPE[wasmType] || wasmType;
}

function flattenTypes(moduleInfo: ModuleInfo): TypeInfo[] {
  const flat: TypeInfo[] = [];
  for (const typeEntry of moduleInfo.types) {
    if (typeEntry.kind === 'rec') {
      for (const inner of typeEntry.types) { flat.push(inner); }
    } else {
      flat.push(typeEntry);
    }
  }
  return flat;
}

export function decompileFunction(
  moduleInfo: ModuleInfo,
  localFuncIndex: number,
  nameResolver: NameResolver,
): string {
  const importedFuncCount = moduleInfo.imports.filter(imp => imp.kind === 0).length;
  const globalFuncIndex = importedFuncCount + localFuncIndex;
  const func = moduleInfo.functions[localFuncIndex];
  const flatTypes = flattenTypes(moduleInfo);
  const funcTypeEntry = flatTypes[func.typeIndex];

  if (!funcTypeEntry || funcTypeEntry.kind !== 'func') {
    return '// Could not determine function type';
  }

  const funcNameRes = nameResolver.functionName(globalFuncIndex);
  const returnType = funcTypeEntry.returnTypes.length === 0 ? 'void'
    : funcTypeEntry.returnTypes.map(returnT => typeStr(returnT)).join(', ');

  const params: string[] = [];
  for (let paramIndex = 0; paramIndex < funcTypeEntry.parameterTypes.length; paramIndex++) {
    const paramNameRes = nameResolver.localName(globalFuncIndex, paramIndex);
    const dwarfType = nameResolver.parameterType?.(globalFuncIndex, paramIndex);
    const paramType = dwarfType || typeStr(funcTypeEntry.parameterTypes[paramIndex]);
    params.push(`${paramType} ${paramNameRes.name}`);
  }

  const signature = `${returnType} ${funcNameRes.name}(${params.join(', ')})`;

  try {
    const instructions = func.instructions || InstructionDecoder.decodeFunctionBody(func.body);
    const cfg = buildControlFlowGraph(instructions);
    const ssaFunc = buildSsa(cfg, moduleInfo, localFuncIndex);
    optimizeSsa(ssaFunc);
    const dominance = computeDominance(ssaFunc);
    const structured = structureFunction(ssaFunc, dominance, cfg.blockEndTargets);

    const nameProvider: LoweringNameProvider = {
      functionName(globalIdx: number): string {
        return nameResolver.functionName(globalIdx).name;
      },
      localName(localIdx: number): string {
        return nameResolver.localName(globalFuncIndex, localIdx).name;
      },
      globalName(globalIdx: number): string {
        return nameResolver.globalName(globalIdx).name;
      },
      resolveAddress(address: number): string | null {
        for (const dataSegment of moduleInfo.data) {
          if (dataSegment.passive) { continue; }
          const segmentOffset = getDataSegmentOffset(dataSegment);
          if (segmentOffset === null) { continue; }
          if (address >= segmentOffset && address < segmentOffset + dataSegment.data.length) {
            const localOffset = address - segmentOffset;
            const stringValue = extractString(dataSegment.data, localOffset);
            if (stringValue && stringValue.length >= 2) {
              const displayStr = stringValue.length > 32 ? stringValue.slice(0, 32) + '...' : stringValue;
              return `"${displayStr}"`;
            }
          }
        }
        return null;
      },
    };

    const rawLowered = lowerSsaToStatements(structured, ssaFunc, nameProvider);
    const stackFrameResult = removeStackFrame(rawLowered);
    const lowered = annotateMemoryPatterns(stackFrameResult.node, stackFrameResult.frameVarName);

    const paramNames = new Set<string>();
    for (let paramIndex = 0; paramIndex < funcTypeEntry.parameterTypes.length; paramIndex++) {
      paramNames.add(nameResolver.localName(globalFuncIndex, paramIndex).name);
    }

    return emitLowered(lowered, signature, paramNames);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `${signature} {\n  // Decompilation failed: ${errorMessage}\n}`;
  }
}

function getDataSegmentOffset(dataSegment: DataInfo): number | null {
  if (dataSegment.passive || dataSegment.offsetExpr.length === 0) {
    return null;
  }
  if (dataSegment.offsetExpr.length >= 2 && dataSegment.offsetExpr[0] === 0x41) {
    let offset = 0;
    let shift = 0;
    let position = 1;
    let byte: number;
    do {
      if (position >= dataSegment.offsetExpr.length) {
        return null;
      }
      byte = dataSegment.offsetExpr[position++];
      offset |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte & 0x80);
    return offset;
  }
  return null;
}

function extractString(data: Uint8Array, offset: number): string | null {
  const PRINTABLE_MIN = 0x20;
  const PRINTABLE_MAX = 0x7f;
  let end = offset;
  while (end < data.length && data[end] !== 0 && data[end] >= PRINTABLE_MIN && data[end] < PRINTABLE_MAX) {
    end++;
  }
  if (end - offset < 2) {
    return null;
  }
  return new TextDecoder().decode(data.slice(offset, end));
}
