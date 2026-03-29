import type { ModuleInfo } from '../../src/BinaryReader';
import type Disassembler from '../../src/Disassembler';
import type { DwarfDebugInfo, DwarfFunction } from '../../src/DwarfParser';
import type { NameResolver, FieldResolver } from '../WasmDecompiler';
import type { ParsedSourceMap, SourceMapping } from '../../src/SourceMapParser';
import { lookupMapping } from '../../src/SourceMapParser';
import type { ExplorerContext } from './ui-helpers';
import {
  appendHeading,
  appendSubheading,
  createInfoTable,
  addInfoRow,
  addLinkedInfoRow,
  createCopyButton,
  appendCodeBlock,
  appendHexDump,
  appendByteRange,
  formatFileSize,
} from './ui-helpers';
import type { TreeNode, TreeIcon } from './tree-builder';
import { TREE_ICONS } from './tree-builder';
import {
  SECTION_NAMES,
  EXPORT_KIND_NAMES,
  getValueTypeName,
  formatFuncType,
  flattenTypes,
} from './wasm-types';
import type { CallGraphData } from './call-graph';

export interface DetailContext extends ExplorerContext {
  detailContainer: HTMLElement;
  moduleInfo: ModuleInfo;
  disassembler: Disassembler | null;
  nameResolver: NameResolver | null;
  parsedSourceMap: ParsedSourceMap | null;
  cachedFullWat: string | null;
  fileName: string;
  textDecoder: TextDecoder;
  getDwarfInfo(): DwarfDebugInfo | null;
  buildFieldResolver(funcGlobalIndex: number): FieldResolver | undefined;
  findDwarfFunction(localFuncIndex: number): DwarfFunction | null;
  getCallGraph(): CallGraphData;
  getNameSource(globalFuncIndex: number): string | null;
  findTopLevelTypeIndex(flatTypeIndex: number): number;
  getExportTargetSection(kind: number): string | null;
  getExportTargetItemIndex(kind: number, globalIndex: number): number;
  setCachedFullWat(wat: string): void;
  renderInteractiveBytes(parent: HTMLElement, funcIndex: number): void;
}

export function renderModuleDetail(context: DetailContext): void {
  if (!context.rawBytes) {
    return;
  }
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;

  appendHeading(detail, context.fileName);

  const sectionCards: { icon: TreeIcon | undefined; label: string; count: number; section: string }[] = [
    { icon: TREE_ICONS['types'], label: 'Types', count: moduleInfo.types.length, section: 'types' },
    { icon: TREE_ICONS['imports'], label: 'Imports', count: moduleInfo.imports.length, section: 'imports' },
    { icon: TREE_ICONS['functions'], label: 'Functions', count: moduleInfo.functions.length, section: 'functions' },
    { icon: TREE_ICONS['exports'], label: 'Exports', count: moduleInfo.exports.length, section: 'exports' },
    { icon: TREE_ICONS['memories'], label: 'Memories', count: moduleInfo.memories.length, section: 'memories' },
    { icon: TREE_ICONS['globals'], label: 'Globals', count: moduleInfo.globals.length, section: 'globals' },
    { icon: TREE_ICONS['tables'], label: 'Tables', count: moduleInfo.tables.length, section: 'tables' },
    { icon: TREE_ICONS['data-segments'], label: 'Data', count: moduleInfo.data.length, section: 'data-segments' },
    { icon: TREE_ICONS['elements'], label: 'Elements', count: moduleInfo.elements.length, section: 'elements' },
    { icon: TREE_ICONS['custom-sections'], label: 'Custom', count: moduleInfo.customSections.length, section: 'custom-sections' },
  ];

  if (moduleInfo.tags.length > 0) {
    sectionCards.push({ icon: TREE_ICONS['tags'], label: 'Tags', count: moduleInfo.tags.length, section: 'tags' });
  }

  const grid = document.createElement('div');
  grid.className = 'module-summary-grid';
  for (const cardData of sectionCards) {
    if (cardData.count === 0 && cardData.label !== 'Memories') {
      continue;
    }
    const card = document.createElement('div');
    card.className = 'module-summary-card';
    card.addEventListener('click', () => {
      context.navigateToItem(cardData.section, -1);
    });

    if (cardData.icon) {
      const iconEl = document.createElement('i');
      iconEl.className = `module-summary-icon ${cardData.icon.faClass}`;
      iconEl.style.color = cardData.icon.color;
      card.appendChild(iconEl);
    }

    const countEl = document.createElement('span');
    countEl.className = 'module-summary-count';
    countEl.textContent = String(cardData.count);
    card.appendChild(countEl);

    const labelEl = document.createElement('span');
    labelEl.className = 'module-summary-label';
    labelEl.textContent = cardData.label;
    card.appendChild(labelEl);

    grid.appendChild(card);
  }
  detail.appendChild(grid);

  const table = createInfoTable();
  addInfoRow(table, 'Version', String(moduleInfo.version));
  addInfoRow(table, 'File size', formatFileSize(context.rawBytes.length));
  if (moduleInfo.start !== null) {
    addInfoRow(table, 'Start function', `func ${moduleInfo.start}`);
  }
  detail.appendChild(table);

  if (context.byteRanges && context.byteRanges.sections.length > 0) {
    appendSubheading(detail, 'Sections');
    const sectionTable = createInfoTable();
    for (const sectionRange of context.byteRanges.sections) {
      const sectionName = SECTION_NAMES[sectionRange.sectionId] || `Unknown (${sectionRange.sectionId})`;
      addInfoRow(sectionTable, sectionName, `offset 0x${sectionRange.offset.toString(16)}, ${sectionRange.length} bytes`);
    }
    detail.appendChild(sectionTable);
  }

  appendSubheading(detail, 'Header');
  appendHexDump(detail, context.rawBytes.slice(0, 8), 0);

  appendSubheading(detail, 'Full WAT');
  const showWatButton = document.createElement('button');
  showWatButton.className = 'explorer-load-btn';
  showWatButton.textContent = 'Generate full disassembly';
  showWatButton.addEventListener('click', () => {
    if (context.disassembler) {
      showWatButton.textContent = 'Generating...';
      showWatButton.style.opacity = '0.6';
      showWatButton.style.pointerEvents = 'none';
      setTimeout(() => {
        let fullWat = context.cachedFullWat;
        if (!fullWat) {
          fullWat = context.disassembler!.disassemble();
          context.setCachedFullWat(fullWat);
        }
        showWatButton.remove();
        appendCodeBlock(detail, fullWat);
      }, 10);
    }
  });
  detail.appendChild(showWatButton);
}

export function renderSectionSummary(context: DetailContext, node: TreeNode): void {
  const detail = context.detailContainer;
  appendHeading(detail, node.label);

  const sectionDescription = getSectionDescription(node.section);
  if (sectionDescription) {
    const descriptionElement = document.createElement('div');
    descriptionElement.className = 'detail-description';
    descriptionElement.textContent = sectionDescription;
    detail.appendChild(descriptionElement);
  }
}

export function getSectionDescription(section: string): string {
  const descriptions: Record<string, string> = {
    'types': 'Function signatures, struct definitions, and array types used by the module.',
    'imports': 'External functions, tables, memories, globals, and tags imported from the host environment.',
    'functions': 'Functions defined in this module. Select a function to see its body.',
    'tables': 'Tables holding references (funcref, externref, etc.).',
    'memories': 'Linear memory instances.',
    'globals': 'Global variables with their types and initial values.',
    'exports': 'Items exported from this module for external use.',
    'elements': 'Element segments used to initialize table contents.',
    'data-segments': 'Data segments used to initialize linear memory.',
    'tags': 'Exception tags for the exception handling proposal.',
    'custom-sections': 'Custom sections containing metadata, debug info, or tool-specific data.',
  };
  return descriptions[section] || '';
}

export function renderImportDetail(context: DetailContext, importIndex: number): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const importEntry = moduleInfo.imports[importIndex];

  appendHeading(detail, `Import ${importIndex}`);

  const table = createInfoTable();
  addInfoRow(table, 'Module', importEntry.moduleName);
  addInfoRow(table, 'Field', importEntry.fieldName);
  addInfoRow(table, 'Kind', EXPORT_KIND_NAMES[importEntry.kind] || `unknown (${importEntry.kind})`);

  if (importEntry.typeIndex !== undefined) {
    const topLevelTypeIdx = context.findTopLevelTypeIndex(importEntry.typeIndex);
    addLinkedInfoRow(context, table, 'Type index', String(importEntry.typeIndex), 'type', topLevelTypeIdx);
    const flatTypes = flattenTypes(moduleInfo);
    if (importEntry.typeIndex < flatTypes.length) {
      const typeEntry = flatTypes[importEntry.typeIndex];
      if (typeEntry.kind === 'func') {
        addInfoRow(table, 'Signature', formatFuncType(typeEntry));
      }
    }
  }
  if (importEntry.tableType) {
    addInfoRow(table, 'Element type', getValueTypeName(importEntry.tableType.elementType));
    addInfoRow(table, 'Initial', String(importEntry.tableType.initial));
    if (importEntry.tableType.maximum !== null) {
      addInfoRow(table, 'Maximum', String(importEntry.tableType.maximum));
    }
  }
  if (importEntry.memoryType) {
    addInfoRow(table, 'Initial pages', String(importEntry.memoryType.initial));
    if (importEntry.memoryType.maximum !== null) {
      addInfoRow(table, 'Maximum pages', String(importEntry.memoryType.maximum));
    }
    if (importEntry.memoryType.shared) { addInfoRow(table, 'Shared', 'true'); }
    if (importEntry.memoryType.memory64) { addInfoRow(table, 'Memory64', 'true'); }
  }
  if (importEntry.globalType) {
    const mutStr = importEntry.globalType.mutable ? 'mut ' : '';
    addInfoRow(table, 'Type', `${mutStr}${getValueTypeName(importEntry.globalType.valueType)}`);
  }
  if (importEntry.tagType) {
    addInfoRow(table, 'Tag type index', String(importEntry.tagType.typeIndex));
  }

  detail.appendChild(table);

  appendSubheading(detail, 'WAT');
  if (context.disassembler) {
    appendCodeBlock(detail, context.disassembler.disassembleImport(importIndex));
  }

  appendByteRange(context, detail, 'import', importIndex);
}

export function renderExportDetail(context: DetailContext, exportIndex: number): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const exportEntry = moduleInfo.exports[exportIndex];

  appendHeading(detail, `Export "${exportEntry.name}"`);

  const table = createInfoTable();
  addInfoRow(table, 'Name', exportEntry.name);
  addInfoRow(table, 'Kind', EXPORT_KIND_NAMES[exportEntry.kind] || `unknown (${exportEntry.kind})`);

  const exportTargetSection = context.getExportTargetSection(exportEntry.kind);
  const exportTargetIndex = context.getExportTargetItemIndex(exportEntry.kind, exportEntry.index);
  if (exportTargetSection && exportTargetIndex >= 0) {
    addLinkedInfoRow(context, table, 'Target', `${EXPORT_KIND_NAMES[exportEntry.kind]} ${exportEntry.index}`, exportTargetSection, exportTargetIndex);
  } else {
    addInfoRow(table, 'Index', String(exportEntry.index));
  }

  if (exportEntry.kind === 0 && moduleInfo.nameSection?.functionNames) {
    const funcName = moduleInfo.nameSection.functionNames.get(exportEntry.index);
    if (funcName) {
      addInfoRow(table, 'Function name', funcName);
    }
  }
  detail.appendChild(table);

  appendSubheading(detail, 'WAT');
  if (context.disassembler) {
    appendCodeBlock(detail, context.disassembler.disassembleExport(exportIndex));
  }

  appendByteRange(context, detail, 'export', exportIndex);
}

export function renderSourceTabContent(context: DetailContext, tabContent: HTMLElement, funcIndex: number): void {
  if (!context.parsedSourceMap || !context.byteRanges) {
    const placeholder = document.createElement('div');
    placeholder.className = 'detail-placeholder';
    placeholder.textContent = 'No source map loaded.';
    tabContent.appendChild(placeholder);
    return;
  }

  const byteRange = context.byteRanges.getItem('function', funcIndex);
  if (!byteRange) {
    const placeholder = document.createElement('div');
    placeholder.className = 'detail-placeholder';
    placeholder.textContent = 'No byte range information available for this function.';
    tabContent.appendChild(placeholder);
    return;
  }

  const startMapping = lookupMapping(context.parsedSourceMap.mappings, byteRange.offset);
  if (!startMapping) {
    const placeholder = document.createElement('div');
    placeholder.className = 'detail-placeholder';
    placeholder.textContent = 'No source mapping found for this function.';
    tabContent.appendChild(placeholder);
    return;
  }

  const endOffset = byteRange.offset + byteRange.length;
  const relevantMappings: SourceMapping[] = [];
  for (const mapping of context.parsedSourceMap.mappings) {
    if (mapping.generatedOffset >= byteRange.offset && mapping.generatedOffset < endOffset) {
      relevantMappings.push(mapping);
    }
  }

  const highlightedLines = new Set<number>();
  for (const mapping of relevantMappings) {
    if (mapping.sourceIndex === startMapping.sourceIndex) {
      highlightedLines.add(mapping.sourceLine);
    }
  }

  const sourceFileName = context.parsedSourceMap.sources[startMapping.sourceIndex] || 'unknown';
  const sourceRoot = context.parsedSourceMap.sourceRoot;
  const fullSourcePath = sourceRoot ? sourceRoot + sourceFileName : sourceFileName;

  const fileLabel = document.createElement('div');
  fileLabel.className = 'source-file-label';
  fileLabel.textContent = fullSourcePath;
  tabContent.appendChild(fileLabel);

  const sourceContent = context.parsedSourceMap.sourcesContent[startMapping.sourceIndex];
  if (!sourceContent) {
    const placeholder = document.createElement('div');
    placeholder.className = 'detail-placeholder';
    placeholder.textContent = 'Source content not available in the source map.';
    tabContent.appendChild(placeholder);
    return;
  }

  const sourceLines = sourceContent.split('\n');

  let minLine = Infinity;
  let maxLine = -Infinity;
  for (const lineNumber of highlightedLines) {
    if (lineNumber < minLine) {
      minLine = lineNumber;
    }
    if (lineNumber > maxLine) {
      maxLine = lineNumber;
    }
  }

  const contextPadding = 5;
  const displayStart = Math.max(0, minLine - contextPadding);
  const displayEnd = Math.min(sourceLines.length - 1, maxLine + contextPadding);

  const block = document.createElement('div');
  block.className = 'detail-code';
  const gutterWidth = String(displayEnd + 2).length;

  for (let lineIndex = displayStart; lineIndex <= displayEnd; lineIndex++) {
    const lineElement = document.createElement('div');
    lineElement.className = 'code-line';
    if (highlightedLines.has(lineIndex)) {
      lineElement.classList.add('source-highlight');
    }

    const gutter = document.createElement('span');
    gutter.className = 'code-line-number';
    gutter.textContent = String(lineIndex + 1).padStart(gutterWidth, ' ');
    lineElement.appendChild(gutter);

    const content = document.createElement('span');
    content.className = 'code-line-content';
    content.textContent = sourceLines[lineIndex];
    lineElement.appendChild(content);

    block.appendChild(lineElement);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'detail-block-wrapper';
  wrapper.appendChild(block);
  wrapper.appendChild(createCopyButton(
    sourceLines.slice(displayStart, displayEnd + 1).join('\n')
  ));
  tabContent.appendChild(wrapper);
}
