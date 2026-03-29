import InstructionDecoder from '../../src/InstructionDecoder';
import type { DetailContext } from './detail-renderers';
import {
  appendHeading,
  appendSubheading,
  createInfoTable,
  addInfoRow,
  formatFileSize,
} from './ui-helpers';
import { SECTION_NAMES } from './wasm-types';

export function renderSizeAnalysisSummary(context: DetailContext): void {
  if (!context.rawBytes) {
    return;
  }
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;

  appendHeading(detail, 'Size Analysis');

  const table = createInfoTable();
  addInfoRow(table, 'Total file size', formatFileSize(context.rawBytes.length));
  const totalCodeSize = moduleInfo.functions.reduce((sum, func) => sum + func.body.length, 0);
  addInfoRow(table, 'Code size', formatFileSize(totalCodeSize));
  const totalDataSize = moduleInfo.data.reduce((sum, dataEntry) => sum + dataEntry.data.length, 0);
  addInfoRow(table, 'Data size', formatFileSize(totalDataSize));
  addInfoRow(table, 'Functions', String(moduleInfo.functions.length));
  addInfoRow(table, 'Data segments', String(moduleInfo.data.length));
  detail.appendChild(table);

  const description = document.createElement('div');
  description.className = 'detail-description';
  description.textContent = 'Expand the child nodes for detailed breakdowns.';
  detail.appendChild(description);
}

export function renderSizeSections(context: DetailContext): void {
  if (!context.rawBytes || !context.byteRanges) {
    return;
  }
  const detail = context.detailContainer;
  const totalSize = context.rawBytes.length;

  appendHeading(detail, 'Section Breakdown');

  const sectionTable = createInfoTable();
  const sortedSections = [...context.byteRanges.sections].sort((sectionA, sectionB) => sectionB.length - sectionA.length);
  for (const sectionRange of sortedSections) {
    const sectionName = SECTION_NAMES[sectionRange.sectionId] || `Unknown (${sectionRange.sectionId})`;
    const percentage = ((sectionRange.length / totalSize) * 100).toFixed(1);

    const row = document.createElement('div');
    row.className = 'detail-info-row';

    const labelElement = document.createElement('span');
    labelElement.className = 'detail-info-label';
    labelElement.textContent = sectionName;
    row.appendChild(labelElement);

    const barContainer = document.createElement('div');
    barContainer.className = 'size-bar-container';
    const bar = document.createElement('div');
    bar.className = 'size-bar';
    bar.style.width = `${Math.max(2, (sectionRange.length / totalSize) * 100)}%`;
    barContainer.appendChild(bar);
    row.appendChild(barContainer);

    const valueElement = document.createElement('span');
    valueElement.className = 'size-value';
    valueElement.textContent = `${formatFileSize(sectionRange.length)} (${percentage}%)`;
    row.appendChild(valueElement);

    sectionTable.appendChild(row);
  }
  detail.appendChild(sectionTable);
}

export function renderSizeFunctions(context: DetailContext): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const importedFuncCount = context.getImportedCount(0);

  appendHeading(detail, 'Function Sizes (largest first)');

  const funcSizes = moduleInfo.functions.map((func, funcIndex) => ({
    globalIndex: importedFuncCount + funcIndex,
    localIndex: funcIndex,
    size: func.body.length,
    name: context.getFunctionName(importedFuncCount + funcIndex),
  }));
  funcSizes.sort((funcA, funcB) => funcB.size - funcA.size);

  const maxFuncSize = funcSizes.length > 0 ? funcSizes[0].size : 1;
  const funcTable = createInfoTable();
  for (const funcSizeEntry of funcSizes) {
    const displayName = funcSizeEntry.name || `func_${funcSizeEntry.globalIndex}`;
    const row = document.createElement('div');
    row.className = 'detail-info-row';

    const link = document.createElement('a');
    link.className = 'detail-info-link';
    link.textContent = displayName;
    link.href = '#';
    link.style.flex = '0 0 180px';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      context.navigateToItem('function', funcSizeEntry.localIndex);
    });
    row.appendChild(link);

    const barContainer = document.createElement('div');
    barContainer.className = 'size-bar-container';
    const bar = document.createElement('div');
    bar.className = 'size-bar';
    bar.style.width = `${Math.max(2, (funcSizeEntry.size / maxFuncSize) * 100)}%`;
    barContainer.appendChild(bar);
    row.appendChild(barContainer);

    const valueElement = document.createElement('span');
    valueElement.className = 'size-value';
    valueElement.textContent = `${funcSizeEntry.size} bytes`;
    row.appendChild(valueElement);

    funcTable.appendChild(row);
  }
  detail.appendChild(funcTable);
}

export function renderSizeData(context: DetailContext): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;

  appendHeading(detail, 'Data Segment Sizes (largest first)');

  const dataSizes = moduleInfo.data.map((dataEntry, dataIndex) => ({
    index: dataIndex,
    size: dataEntry.data.length,
    passive: dataEntry.passive,
    memoryIndex: dataEntry.memoryIndex,
  }));
  dataSizes.sort((entryA, entryB) => entryB.size - entryA.size);

  const maxDataSize = dataSizes.length > 0 ? dataSizes[0].size : 1;
  const dataTable = createInfoTable();
  for (const dataSizeEntry of dataSizes) {
    const passiveLabel = dataSizeEntry.passive ? 'passive' : `memory ${dataSizeEntry.memoryIndex}`;
    const row = document.createElement('div');
    row.className = 'detail-info-row';

    const link = document.createElement('a');
    link.className = 'detail-info-link';
    link.textContent = `data ${dataSizeEntry.index} (${passiveLabel})`;
    link.href = '#';
    link.style.flex = '0 0 180px';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      context.navigateToItem('data', dataSizeEntry.index);
    });
    row.appendChild(link);

    const barContainer = document.createElement('div');
    barContainer.className = 'size-bar-container';
    const bar = document.createElement('div');
    bar.className = 'size-bar';
    bar.style.width = `${Math.max(2, (dataSizeEntry.size / maxDataSize) * 100)}%`;
    barContainer.appendChild(bar);
    row.appendChild(barContainer);

    const valueElement = document.createElement('span');
    valueElement.className = 'size-value';
    valueElement.textContent = formatFileSize(dataSizeEntry.size);
    row.appendChild(valueElement);

    dataTable.appendChild(row);
  }
  detail.appendChild(dataTable);
}

export function renderProducers(context: DetailContext): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const producersSection = moduleInfo.customSections.find(section => section.name === 'producers');
  if (!producersSection) {
    return;
  }

  appendHeading(detail, 'Producers');

  try {
    const data = producersSection.data;
    let offset = 0;
    const textDecoder = context.textDecoder;

    const readULEB128 = (): number => {
      let result = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = data[offset++];
        result |= (byte & 0x7f) << shift;
        shift += 7;
      } while (byte & 0x80);
      return result >>> 0;
    };

    const readString = (): string => {
      const length = readULEB128();
      const str = textDecoder.decode(data.slice(offset, offset + length));
      offset += length;
      return str;
    };

    const fieldCount = readULEB128();
    for (let fieldIndex = 0; fieldIndex < fieldCount; fieldIndex++) {
      const fieldName = readString();
      appendSubheading(detail, fieldName);
      const valueCount = readULEB128();
      const table = createInfoTable();
      for (let valueIndex = 0; valueIndex < valueCount; valueIndex++) {
        const name = readString();
        const version = readString();
        addInfoRow(table, name, version || '(no version)');
      }
      detail.appendChild(table);
    }
  } catch {
    const errorElement = document.createElement('div');
    errorElement.className = 'detail-description';
    errorElement.textContent = 'Failed to parse producers section.';
    detail.appendChild(errorElement);
  }
}

export function renderInstructionStats(context: DetailContext): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const opcodeCounts = new Map<string, number>();
  let totalInstructions = 0;

  for (const func of moduleInfo.functions) {
    const instructions = func.instructions || InstructionDecoder.decodeFunctionBody(func.body);
    for (const instruction of instructions) {
      if (instruction.opCode.mnemonic === 'end') {
        continue;
      }
      totalInstructions++;
      const mnemonic = instruction.opCode.mnemonic;
      opcodeCounts.set(mnemonic, (opcodeCounts.get(mnemonic) || 0) + 1);
    }
  }

  appendHeading(detail, 'Instruction Statistics');

  const summaryTable = createInfoTable();
  addInfoRow(summaryTable, 'Total instructions', String(totalInstructions));
  addInfoRow(summaryTable, 'Unique opcodes', String(opcodeCounts.size));
  addInfoRow(summaryTable, 'Functions', String(moduleInfo.functions.length));
  detail.appendChild(summaryTable);

  const categories: Record<string, string[]> = {
    'Control Flow': [],
    'Memory': [],
    'Numeric': [],
    'Variable': [],
    'Reference': [],
    'Table': [],
    'Other': [],
  };

  for (const [mnemonic] of opcodeCounts) {
    if (/^(block|loop|if|else|br|br_if|br_table|return|call|call_indirect|return_call|unreachable|nop|select|drop)/.test(mnemonic)) {
      categories['Control Flow'].push(mnemonic);
    } else if (/^(memory\.|.*\.(load|store))/.test(mnemonic)) {
      categories['Memory'].push(mnemonic);
    } else if (/^(local\.|global\.)/.test(mnemonic)) {
      categories['Variable'].push(mnemonic);
    } else if (/^(i32|i64|f32|f64|v128)\.(const|add|sub|mul|div|rem|and|or|xor|shl|shr|rotl|rotr|clz|ctz|popcnt|eqz|eq|ne|lt|gt|le|ge|abs|neg|ceil|floor|trunc|nearest|sqrt|min|max|copysign|wrap|extend|convert|demote|promote|reinterpret|atomic|splat|extract|replace|swizzle|shuffle|bitmask|all_true|any_true|narrow|widen|dot|avgr|extmul|extadd|relaxed)/.test(mnemonic)) {
      categories['Numeric'].push(mnemonic);
    } else if (/^(ref\.|struct\.|array\.|i31\.|any\.|extern\.|br_on_cast)/.test(mnemonic)) {
      categories['Reference'].push(mnemonic);
    } else if (/^(table\.|elem\.)/.test(mnemonic)) {
      categories['Table'].push(mnemonic);
    } else {
      categories['Other'].push(mnemonic);
    }
  }

  const categoryColors: Record<string, string> = {
    'Control Flow': '#cba6f7',
    'Memory': '#a6e3a1',
    'Numeric': '#fab387',
    'Variable': '#89b4fa',
    'Reference': '#f38ba8',
    'Table': '#94e2d5',
    'Other': '#6c7086',
  };

  appendSubheading(detail, 'By Category');
  const categoryTable = createInfoTable();
  for (const [categoryName, mnemonics] of Object.entries(categories)) {
    if (mnemonics.length === 0) {
      continue;
    }
    const categoryCount = mnemonics.reduce((sum, mnemonic) => sum + (opcodeCounts.get(mnemonic) || 0), 0);
    const percentage = totalInstructions > 0 ? ((categoryCount / totalInstructions) * 100).toFixed(1) : '0';
    const barColor = categoryColors[categoryName] || '#89b4fa';

    const row = document.createElement('div');
    row.className = 'detail-info-row';

    const labelElement = document.createElement('span');
    labelElement.className = 'detail-info-label';
    const dot = document.createElement('span');
    dot.className = 'category-dot';
    dot.style.background = barColor;
    labelElement.appendChild(dot);
    labelElement.appendChild(document.createTextNode(categoryName));
    row.appendChild(labelElement);

    const barContainer = document.createElement('div');
    barContainer.className = 'size-bar-container';
    const bar = document.createElement('div');
    bar.className = 'size-bar';
    bar.style.width = `${Math.max(2, (categoryCount / totalInstructions) * 100)}%`;
    bar.style.background = barColor;
    barContainer.appendChild(bar);
    row.appendChild(barContainer);

    const valueElement = document.createElement('span');
    valueElement.className = 'size-value';
    valueElement.textContent = `${categoryCount} (${percentage}%)`;
    row.appendChild(valueElement);

    categoryTable.appendChild(row);
  }
  detail.appendChild(categoryTable);

  appendSubheading(detail, 'All Opcodes (by frequency)');
  const sorted = Array.from(opcodeCounts.entries()).sort((entryA, entryB) => entryB[1] - entryA[1]);
  const maxCount = sorted.length > 0 ? sorted[0][1] : 1;
  const opcodeTable = createInfoTable();
  for (const [mnemonic, count] of sorted) {
    const percentage = totalInstructions > 0 ? ((count / totalInstructions) * 100).toFixed(1) : '0';

    const row = document.createElement('div');
    row.className = 'detail-info-row';

    const labelElement = document.createElement('span');
    labelElement.className = 'detail-info-label';
    labelElement.style.fontFamily = "'SF Mono', 'Fira Code', 'Cascadia Code', monospace";
    labelElement.textContent = mnemonic;
    row.appendChild(labelElement);

    const barContainer = document.createElement('div');
    barContainer.className = 'size-bar-container';
    const bar = document.createElement('div');
    bar.className = 'size-bar';
    bar.style.width = `${Math.max(2, (count / maxCount) * 100)}%`;
    barContainer.appendChild(bar);
    row.appendChild(barContainer);

    const valueElement = document.createElement('span');
    valueElement.className = 'size-value';
    valueElement.textContent = `${count} (${percentage}%)`;
    row.appendChild(valueElement);

    opcodeTable.appendChild(row);
  }
  detail.appendChild(opcodeTable);
}
