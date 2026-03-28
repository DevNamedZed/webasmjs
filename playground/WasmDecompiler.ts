import { ModuleInfo } from '../src/BinaryReader';
import { decompileFunction, createNameResolver } from '../src/decompiler/Decompiler';
import type { NameResolver, NameResolution } from '../src/decompiler/Decompiler';
import type { FieldResolver } from '../src/decompiler/LoweredEmitter';
import type { DwarfDebugInfo, DwarfFunction } from '../src/DwarfParser';

export type { NameResolver, NameResolution, FieldResolver };
export { decompileFunction, createNameResolver };

export function createNameResolverWithDwarf(
  moduleInfo: ModuleInfo,
  dwarfFuncForIndex: (localFuncIndex: number) => DwarfFunction | null,
): NameResolver {
  const importedFuncCount = moduleInfo.imports.filter(imp => imp.kind === 0).length;

  return createNameResolver(moduleInfo, (globalIndex: number): string | null => {
    const localIndex = globalIndex - importedFuncCount;
    if (localIndex >= 0) {
      const dwarfFunc = dwarfFuncForIndex(localIndex);
      if (dwarfFunc) {
        return dwarfFunc.name;
      }
    }
    return null;
  });
}
