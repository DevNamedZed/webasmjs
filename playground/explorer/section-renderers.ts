import type { DetailContext } from './detail-renderers';
import {
  appendHeading,
  appendSubheading,
  createInfoTable,
  addInfoRow,
  addLinkedInfoRow,
  appendCodeBlock,
  appendHexDump,
  appendByteRange,
  formatFileSize,
} from './ui-helpers';
import {
  EXPORT_KIND_NAMES,
  getValueTypeName,
  formatFuncType,
  flattenTypes,
} from './wasm-types';

export function renderTypeDetail(context: DetailContext, typeIndex: number): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const typeEntry = moduleInfo.types[typeIndex];

  appendHeading(detail, `Type ${typeIndex}`);

  if (typeEntry.kind === 'func') {
    const table = createInfoTable();
    addInfoRow(table, 'Kind', 'func');
    addInfoRow(table, 'Parameters', typeEntry.parameterTypes.map(p => getValueTypeName(p)).join(', ') || 'none');
    addInfoRow(table, 'Returns', typeEntry.returnTypes.map(r => getValueTypeName(r)).join(', ') || 'none');
    detail.appendChild(table);
  } else if (typeEntry.kind === 'struct') {
    const table = createInfoTable();
    addInfoRow(table, 'Kind', 'struct');
    addInfoRow(table, 'Fields', String(typeEntry.fields.length));
    if (typeEntry.superTypes && typeEntry.superTypes.length > 0) {
      for (const superIdx of typeEntry.superTypes) {
        const topLevelIdx = context.findTopLevelTypeIndex(superIdx);
        addLinkedInfoRow(context, table, 'Extends', `type ${superIdx}`, 'type', topLevelIdx);
      }
    }
    if (typeEntry.final !== undefined) {
      addInfoRow(table, 'Final', String(typeEntry.final));
    }
    detail.appendChild(table);

    if (typeEntry.fields.length > 0) {
      appendSubheading(detail, 'Fields');
      const fieldsTable = createInfoTable();
      for (let fieldIndex = 0; fieldIndex < typeEntry.fields.length; fieldIndex++) {
        const field = typeEntry.fields[fieldIndex];
        const mutLabel = field.mutable ? 'mut ' : '';
        addInfoRow(fieldsTable, `field ${fieldIndex}`, `${mutLabel}${getValueTypeName(field.type)}`);
      }
      detail.appendChild(fieldsTable);
    }
  } else if (typeEntry.kind === 'array') {
    const table = createInfoTable();
    addInfoRow(table, 'Kind', 'array');
    addInfoRow(table, 'Element type', getValueTypeName(typeEntry.elementType));
    addInfoRow(table, 'Mutable', String(typeEntry.mutable));
    if (typeEntry.superTypes && typeEntry.superTypes.length > 0) {
      for (const superIdx of typeEntry.superTypes) {
        const topLevelIdx = context.findTopLevelTypeIndex(superIdx);
        addLinkedInfoRow(context, table, 'Extends', `type ${superIdx}`, 'type', topLevelIdx);
      }
    }
    if (typeEntry.final !== undefined) {
      addInfoRow(table, 'Final', String(typeEntry.final));
    }
    detail.appendChild(table);
  } else if (typeEntry.kind === 'rec') {
    const table = createInfoTable();
    addInfoRow(table, 'Kind', 'rec group');
    addInfoRow(table, 'Types', String(typeEntry.types.length));
    detail.appendChild(table);
  }

  appendSubheading(detail, 'WAT');
  if (context.disassembler) {
    appendCodeBlock(detail, context.disassembler.disassembleType(typeIndex));
  }

  appendByteRange(context, detail, 'type', typeIndex);
}

export function renderTableDetail(context: DetailContext, tableIndex: number): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const tableEntry = moduleInfo.tables[tableIndex];
  const importedTableCount = context.getImportedCount(1);

  appendHeading(detail, `Table ${importedTableCount + tableIndex}`);

  const table = createInfoTable();
  addInfoRow(table, 'Element type', getValueTypeName(tableEntry.elementType));
  addInfoRow(table, 'Initial', String(tableEntry.initial));
  if (tableEntry.maximum !== null) {
    addInfoRow(table, 'Maximum', String(tableEntry.maximum));
  }
  detail.appendChild(table);

  appendSubheading(detail, 'WAT');
  if (context.disassembler) {
    appendCodeBlock(detail, context.disassembler.disassembleTable(tableIndex));
  }

  appendByteRange(context, detail, 'table', tableIndex);
}

export function renderMemoryDetail(context: DetailContext, memIndex: number): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const memoryEntry = moduleInfo.memories[memIndex];
  const importedMemCount = context.getImportedCount(2);

  appendHeading(detail, `Memory ${importedMemCount + memIndex}`);

  const table = createInfoTable();
  addInfoRow(table, 'Initial pages', String(memoryEntry.initial));
  if (memoryEntry.maximum !== null) {
    addInfoRow(table, 'Maximum pages', String(memoryEntry.maximum));
  }
  addInfoRow(table, 'Initial size', formatFileSize(memoryEntry.initial * 65536));
  if (memoryEntry.shared) { addInfoRow(table, 'Shared', 'true'); }
  if (memoryEntry.memory64) { addInfoRow(table, 'Memory64', 'true'); }
  detail.appendChild(table);

  appendSubheading(detail, 'WAT');
  if (context.disassembler) {
    appendCodeBlock(detail, context.disassembler.disassembleMemory(memIndex));
  }

  appendByteRange(context, detail, 'memory', memIndex);
}

export function renderGlobalDetail(context: DetailContext, globalIndex: number): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const globalEntry = moduleInfo.globals[globalIndex];
  const importedGlobalCount = context.getImportedCount(3);
  const absoluteGlobalIndex = importedGlobalCount + globalIndex;
  const globalName = moduleInfo.nameSection?.globalNames?.get(absoluteGlobalIndex);

  appendHeading(detail, globalName || `global_${absoluteGlobalIndex}`);

  const table = createInfoTable();
  addInfoRow(table, 'Type', getValueTypeName(globalEntry.valueType));
  addInfoRow(table, 'Mutable', String(globalEntry.mutable));

  if (globalEntry.initInstructions && globalEntry.initInstructions.length > 0) {
    const initStr = globalEntry.initInstructions
      .filter(instruction => instruction.opCode.mnemonic !== 'end')
      .map(instruction => {
        const immediateValues = instruction.immediates.values;
        if (immediateValues.length > 0) {
          return `${instruction.opCode.mnemonic} ${immediateValues.join(' ')}`;
        }
        return instruction.opCode.mnemonic;
      })
      .join(', ');
    addInfoRow(table, 'Initial value', initStr);
  }

  detail.appendChild(table);

  appendSubheading(detail, 'WAT');
  if (context.disassembler) {
    appendCodeBlock(detail, context.disassembler.disassembleGlobal(globalIndex));
  }

  appendByteRange(context, detail, 'global', globalIndex);
}

export function renderStartDetail(context: DetailContext): void {
  const moduleInfo = context.moduleInfo;
  if (moduleInfo.start === null) {
    return;
  }
  const detail = context.detailContainer;

  appendHeading(detail, 'Start Function');

  const table = createInfoTable();
  addInfoRow(table, 'Function index', String(moduleInfo.start));
  const funcName = moduleInfo.nameSection?.functionNames?.get(moduleInfo.start);
  if (funcName) {
    addInfoRow(table, 'Function name', funcName);
  }
  detail.appendChild(table);
}

export function renderElementDetail(context: DetailContext, elemIndex: number): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const elementEntry = moduleInfo.elements[elemIndex];

  appendHeading(detail, `Element ${elemIndex}`);

  const table = createInfoTable();
  addInfoRow(table, 'Passive', String(elementEntry.passive));
  if (!elementEntry.passive) {
    addInfoRow(table, 'Table index', String(elementEntry.tableIndex));
    if (elementEntry.offsetInstructions && elementEntry.offsetInstructions.length > 0) {
      const offsetStr = elementEntry.offsetInstructions
        .filter(instruction => instruction.opCode.mnemonic !== 'end')
        .map(instruction => {
          const immediateValues = instruction.immediates.values;
          if (immediateValues.length > 0) {
            return `${instruction.opCode.mnemonic} ${immediateValues.join(' ')}`;
          }
          return instruction.opCode.mnemonic;
        })
        .join(', ');
      addInfoRow(table, 'Offset', offsetStr);
    }
  }
  addInfoRow(table, 'Entries', String(elementEntry.functionIndices.length));
  detail.appendChild(table);

  if (elementEntry.functionIndices.length > 0) {
    appendSubheading(detail, 'Function Indices');
    const indicesBlock = document.createElement('div');
    indicesBlock.className = 'detail-code';
    indicesBlock.textContent = elementEntry.functionIndices.join(', ');
    detail.appendChild(indicesBlock);
  }

  appendSubheading(detail, 'WAT');
  if (context.disassembler) {
    appendCodeBlock(detail, context.disassembler.disassembleElement(elemIndex));
  }

  appendByteRange(context, detail, 'element', elemIndex);
}

export function renderDataDetail(context: DetailContext, dataIndex: number): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const dataEntry = moduleInfo.data[dataIndex];

  appendHeading(detail, `Data ${dataIndex}`);

  const table = createInfoTable();
  addInfoRow(table, 'Passive', String(dataEntry.passive));
  if (!dataEntry.passive) {
    addInfoRow(table, 'Memory index', String(dataEntry.memoryIndex));
    if (dataEntry.offsetInstructions && dataEntry.offsetInstructions.length > 0) {
      const offsetStr = dataEntry.offsetInstructions
        .filter(instruction => instruction.opCode.mnemonic !== 'end')
        .map(instruction => {
          const immediateValues = instruction.immediates.values;
          if (immediateValues.length > 0) {
            return `${instruction.opCode.mnemonic} ${immediateValues.join(' ')}`;
          }
          return instruction.opCode.mnemonic;
        })
        .join(', ');
      addInfoRow(table, 'Offset', offsetStr);
    }
  }
  addInfoRow(table, 'Size', `${dataEntry.data.length} bytes`);
  detail.appendChild(table);

  appendSubheading(detail, 'WAT');
  if (context.disassembler) {
    appendCodeBlock(detail, context.disassembler.disassembleData(dataIndex));
  }

  const isPrintable = dataEntry.data.every(byteValue => (byteValue >= 0x20 && byteValue < 0x7f) || byteValue === 0x0a || byteValue === 0x0d || byteValue === 0x09);
  if (isPrintable && dataEntry.data.length > 0) {
    appendSubheading(detail, 'String Preview');
    const preview = document.createElement('div');
    preview.className = 'detail-code';
    preview.textContent = context.textDecoder.decode(dataEntry.data);
    detail.appendChild(preview);
  }

  if (dataEntry.data.length > 0) {
    appendSubheading(detail, 'Hex');
    appendHexDump(detail, dataEntry.data, 0);
  }

  appendByteRange(context, detail, 'data', dataIndex);
}

export function renderTagDetail(context: DetailContext, tagIndex: number): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const tagEntry = moduleInfo.tags[tagIndex];

  appendHeading(detail, `Tag ${tagIndex}`);

  const table = createInfoTable();
  addInfoRow(table, 'Attribute', String(tagEntry.attribute));
  const topLevelTagTypeIdx = context.findTopLevelTypeIndex(tagEntry.typeIndex);
  addLinkedInfoRow(context, table, 'Type index', String(tagEntry.typeIndex), 'type', topLevelTagTypeIdx);
  detail.appendChild(table);

  appendByteRange(context, detail, 'tag', tagIndex);
}

export function renderCustomSectionDetail(context: DetailContext, customIndex: number): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const customEntry = moduleInfo.customSections[customIndex];

  appendHeading(detail, `Custom Section "${customEntry.name}"`);

  const table = createInfoTable();
  addInfoRow(table, 'Name', customEntry.name);
  addInfoRow(table, 'Size', `${customEntry.data.length} bytes`);
  detail.appendChild(table);

  if (customEntry.data.length > 0) {
    appendSubheading(detail, 'Data');
    const maxDisplay = Math.min(customEntry.data.length, 4096);
    appendHexDump(detail, customEntry.data.slice(0, maxDisplay), 0);
    if (customEntry.data.length > maxDisplay) {
      const truncated = document.createElement('div');
      truncated.className = 'detail-truncated';
      truncated.textContent = `(showing ${maxDisplay} of ${customEntry.data.length} bytes)`;
      detail.appendChild(truncated);
    }
  }
}

export function renderNameSectionDetail(context: DetailContext): void {
  const moduleInfo = context.moduleInfo;
  if (!moduleInfo.nameSection) {
    return;
  }
  const detail = context.detailContainer;
  const nameSection = moduleInfo.nameSection;

  appendHeading(detail, 'Name Section');

  if (nameSection.moduleName) {
    const table = createInfoTable();
    addInfoRow(table, 'Module name', nameSection.moduleName);
    detail.appendChild(table);
  }

  if (nameSection.functionNames && nameSection.functionNames.size > 0) {
    appendSubheading(detail, `Function Names (${nameSection.functionNames.size})`);
    const table = createInfoTable();
    const sortedEntries = Array.from(nameSection.functionNames.entries()).sort((entryA, entryB) => entryA[0] - entryB[0]);
    for (const [funcIdx, funcName] of sortedEntries) {
      addInfoRow(table, `func ${funcIdx}`, funcName);
    }
    detail.appendChild(table);
  }

  if (nameSection.localNames && nameSection.localNames.size > 0) {
    appendSubheading(detail, `Local Names (${nameSection.localNames.size} functions)`);
    const sortedFuncs = Array.from(nameSection.localNames.entries()).sort((entryA, entryB) => entryA[0] - entryB[0]);
    for (const [funcIdx, locals] of sortedFuncs) {
      const funcName = nameSection.functionNames?.get(funcIdx);
      appendSubheading(detail, funcName || `func_${funcIdx}`);
      const table = createInfoTable();
      const sortedLocals = Array.from(locals.entries()).sort((entryA, entryB) => entryA[0] - entryB[0]);
      for (const [localIdx, localName] of sortedLocals) {
        addInfoRow(table, `local ${localIdx}`, localName);
      }
      detail.appendChild(table);
    }
  }

  if (nameSection.globalNames && nameSection.globalNames.size > 0) {
    appendSubheading(detail, `Global Names (${nameSection.globalNames.size})`);
    const table = createInfoTable();
    const sortedGlobals = Array.from(nameSection.globalNames.entries()).sort((entryA, entryB) => entryA[0] - entryB[0]);
    for (const [globalIdx, globalName] of sortedGlobals) {
      addInfoRow(table, `global ${globalIdx}`, globalName);
    }
    detail.appendChild(table);
  }
}
