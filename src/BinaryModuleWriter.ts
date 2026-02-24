import { SectionType, SectionTypeDescriptor } from './types';
import BinaryWriter from './BinaryWriter';
import ModuleBuilder from './ModuleBuilder';
import CustomSectionBuilder from './CustomSectionBuilder';

const MagicHeader = 0x6d736100;
const Version = 1;

export default class BinaryModuleWriter {
  moduleBuilder: ModuleBuilder;

  constructor(moduleBuilder: ModuleBuilder) {
    this.moduleBuilder = moduleBuilder;
  }

  static writeSectionHeader(
    writer: BinaryWriter,
    section: SectionTypeDescriptor,
    length: number
  ): void {
    writer.writeVarUInt7(section.value);
    writer.writeVarUInt32(length);
  }

  static writeSection(
    writer: BinaryWriter,
    sectionType: SectionTypeDescriptor,
    sectionItems: { write(writer: BinaryWriter): void }[]
  ): void {
    if (sectionItems.length === 0) {
      return;
    }

    const sectionWriter = new BinaryWriter();
    sectionWriter.writeVarUInt32(sectionItems.length);
    sectionItems.forEach((x) => {
      x.write(sectionWriter);
    });

    BinaryModuleWriter.writeSectionHeader(writer, sectionType, sectionWriter.length);
    writer.writeBytes(sectionWriter);
  }

  static writeCustomSection(writer: BinaryWriter, section: CustomSectionBuilder): void {
    section.write(writer);
  }

  writeTypeSection(writer: BinaryWriter): void {
    BinaryModuleWriter.writeSection(writer, SectionType.Type, this.moduleBuilder._typeSectionEntries);
  }

  writeImportSection(writer: BinaryWriter): void {
    BinaryModuleWriter.writeSection(writer, SectionType.Import, this.moduleBuilder._imports);
  }

  writeFunctionSection(writer: BinaryWriter): void {
    if (this.moduleBuilder._functions.length === 0) {
      return;
    }

    const sectionWriter = new BinaryWriter();
    sectionWriter.writeVarUInt32(this.moduleBuilder._functions.length);
    for (let index = 0; index < this.moduleBuilder._functions.length; index++) {
      sectionWriter.writeVarUInt32(this.moduleBuilder._functions[index].funcTypeBuilder.index);
    }

    BinaryModuleWriter.writeSectionHeader(writer, SectionType.Function, sectionWriter.length);
    writer.writeBytes(sectionWriter);
  }

  writeTableSection(writer: BinaryWriter): void {
    BinaryModuleWriter.writeSection(writer, SectionType.Table, this.moduleBuilder._tables);
  }

  writeMemorySection(writer: BinaryWriter): void {
    BinaryModuleWriter.writeSection(writer, SectionType.Memory, this.moduleBuilder._memories);
  }

  writeGlobalSection(writer: BinaryWriter): void {
    BinaryModuleWriter.writeSection(writer, SectionType.Global, this.moduleBuilder._globals);
  }

  writeExportSection(writer: BinaryWriter): void {
    BinaryModuleWriter.writeSection(writer, SectionType.Export, this.moduleBuilder._exports);
  }

  writeTagSection(writer: BinaryWriter): void {
    BinaryModuleWriter.writeSection(writer, SectionType.Tag, this.moduleBuilder._tags);
  }

  writeStartSection(writer: BinaryWriter): void {
    if (!this.moduleBuilder._startFunction) {
      return;
    }

    const sectionWriter = new BinaryWriter();
    sectionWriter.writeVarUInt32(this.moduleBuilder._startFunction._index);

    BinaryModuleWriter.writeSectionHeader(writer, SectionType.Start, sectionWriter.length);
    writer.writeBytes(sectionWriter);
  }

  writeElementSection(writer: BinaryWriter): void {
    BinaryModuleWriter.writeSection(writer, SectionType.Element, this.moduleBuilder._elements);
  }

  writeCodeSection(writer: BinaryWriter): void {
    BinaryModuleWriter.writeSection(writer, SectionType.Code, this.moduleBuilder._functions);
  }

  writeDataCountSection(writer: BinaryWriter): void {
    if (this.moduleBuilder._data.length === 0) {
      return;
    }

    // DataCount section is required when memory.init or data.drop instructions are used
    const hasPassiveSegment = this.moduleBuilder._data.some((d) => d._passive);
    if (!hasPassiveSegment) {
      return;
    }

    const sectionWriter = new BinaryWriter();
    sectionWriter.writeVarUInt32(this.moduleBuilder._data.length);

    BinaryModuleWriter.writeSectionHeader(writer, SectionType.DataCount, sectionWriter.length);
    writer.writeBytes(sectionWriter);
  }

  writeDataSection(writer: BinaryWriter): void {
    BinaryModuleWriter.writeSection(writer, SectionType.Data, this.moduleBuilder._data);
  }

  writeNameSection(writer: BinaryWriter): void {
    const mod = this.moduleBuilder;
    const nameWriter = new BinaryWriter();

    // Sub-section 0: module name
    const moduleNameWriter = new BinaryWriter();
    moduleNameWriter.writeLenPrefixedString(mod._name);
    nameWriter.writeVarUInt7(0);
    nameWriter.writeVarUInt32(moduleNameWriter.length);
    nameWriter.writeBytes(moduleNameWriter);

    // Sub-section 1: function names
    const allFunctions = [
      ...mod._imports.filter((x) => x.externalKind.value === 0),
      ...mod._functions,
    ];
    if (allFunctions.length > 0) {
      const funcNameWriter = new BinaryWriter();
      funcNameWriter.writeVarUInt32(allFunctions.length);
      allFunctions.forEach((f, i) => {
        const name = 'name' in f ? f.name : `${f.moduleName}.${f.fieldName}`;
        funcNameWriter.writeVarUInt32(i);
        funcNameWriter.writeLenPrefixedString(name);
      });
      nameWriter.writeVarUInt7(1);
      nameWriter.writeVarUInt32(funcNameWriter.length);
      nameWriter.writeBytes(funcNameWriter);
    }

    // Sub-section 2: local names (parameters + locals per function)
    const functionsWithNames = mod._functions.filter((f) => {
      if (!f.functionEmitter) return false;
      const hasNamedParam = f.parameters.some((p) => p.name !== null);
      const hasNamedLocal = f.functionEmitter._locals.some((l) => l.name !== null);
      return hasNamedParam || hasNamedLocal;
    });
    if (functionsWithNames.length > 0) {
      const localNameWriter = new BinaryWriter();
      localNameWriter.writeVarUInt32(functionsWithNames.length);
      functionsWithNames.forEach((f) => {
        localNameWriter.writeVarUInt32(f._index);
        const namedEntries: { index: number; name: string }[] = [];
        f.parameters.forEach((p, i) => {
          if (p.name !== null) {
            namedEntries.push({ index: i, name: p.name });
          }
        });
        if (f.functionEmitter) {
          f.functionEmitter._locals.forEach((l) => {
            if (l.name !== null) {
              namedEntries.push({ index: l.index, name: l.name });
            }
          });
        }
        localNameWriter.writeVarUInt32(namedEntries.length);
        namedEntries.forEach((entry) => {
          localNameWriter.writeVarUInt32(entry.index);
          localNameWriter.writeLenPrefixedString(entry.name);
        });
      });
      nameWriter.writeVarUInt7(2);
      nameWriter.writeVarUInt32(localNameWriter.length);
      nameWriter.writeBytes(localNameWriter);
    }

    // Sub-section 7: global names
    const namedGlobals: { index: number; name: string }[] = [];
    mod._imports.forEach((imp) => {
      if (imp.externalKind.value === 3) {
        namedGlobals.push({ index: imp.index, name: `${imp.moduleName}.${imp.fieldName}` });
      }
    });
    mod._globals.forEach((g) => {
      if (g.name !== null) {
        namedGlobals.push({ index: g._index, name: g.name });
      }
    });
    if (namedGlobals.length > 0) {
      const globalNameWriter = new BinaryWriter();
      globalNameWriter.writeVarUInt32(namedGlobals.length);
      namedGlobals.forEach((entry) => {
        globalNameWriter.writeVarUInt32(entry.index);
        globalNameWriter.writeLenPrefixedString(entry.name);
      });
      nameWriter.writeVarUInt7(7);
      nameWriter.writeVarUInt32(globalNameWriter.length);
      nameWriter.writeBytes(globalNameWriter);
    }

    // Write as custom section with name "name"
    const sectionWriter = new BinaryWriter();
    const sectionName = 'name';
    sectionWriter.writeLenPrefixedString(sectionName);
    sectionWriter.writeBytes(nameWriter);

    writer.writeVarUInt7(0); // custom section id
    writer.writeVarUInt32(sectionWriter.length);
    writer.writeBytes(sectionWriter);
  }

  writeCustomSections(writer: BinaryWriter): void {
    // Write user-defined custom sections (excluding "name" which is reserved)
    this.moduleBuilder._customSections.forEach((x) => {
      BinaryModuleWriter.writeCustomSection(writer, x);
    });

    // Auto-generate name section if enabled and not user-provided
    if (this.moduleBuilder._options.generateNameSection) {
      this.writeNameSection(writer);
    }
  }

  write(): Uint8Array {
    const writer = new BinaryWriter();
    writer.writeUInt32(MagicHeader);
    writer.writeUInt32(Version);

    this.writeTypeSection(writer);
    this.writeImportSection(writer);
    this.writeFunctionSection(writer);
    this.writeTableSection(writer);
    this.writeMemorySection(writer);
    this.writeGlobalSection(writer);
    this.writeTagSection(writer);
    this.writeExportSection(writer);
    this.writeStartSection(writer);
    this.writeElementSection(writer);
    this.writeDataCountSection(writer);
    this.writeCodeSection(writer);
    this.writeDataSection(writer);
    this.writeCustomSections(writer);

    return writer.toArray();
  }
}
