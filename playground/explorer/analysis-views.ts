import type { ModuleInfo } from '../../src/BinaryReader';
import type { DetailContext } from './detail-renderers';
import { getDwarfLanguageName } from './dwarf-helpers';
import {
  appendHeading,
  appendSubheading,
  createInfoTable,
  addInfoRow,
  addLinkedInfoRow,
  formatFileSize,
} from './ui-helpers';

export interface ExtractedString {
  dataSegmentIndex: number;
  offset: number;
  value: string;
}

export function extractStrings(moduleInfo: ModuleInfo): ExtractedString[] {
  const results: ExtractedString[] = [];
  const minLength = 4;
  const textDecoder = new TextDecoder();

  for (let segmentIndex = 0; segmentIndex < moduleInfo.data.length; segmentIndex++) {
    const segment = moduleInfo.data[segmentIndex];
    let runStart = -1;

    for (let byteIndex = 0; byteIndex <= segment.data.length; byteIndex++) {
      const byteValue = byteIndex < segment.data.length ? segment.data[byteIndex] : 0;
      const isPrintable = (byteValue >= 0x20 && byteValue < 0x7f) || byteValue === 0x0a || byteValue === 0x0d || byteValue === 0x09;

      if (isPrintable) {
        if (runStart === -1) {
          runStart = byteIndex;
        }
      } else {
        if (runStart !== -1 && (byteIndex - runStart) >= minLength) {
          const value = textDecoder.decode(segment.data.slice(runStart, byteIndex));
          results.push({ dataSegmentIndex: segmentIndex, offset: runStart, value });
        }
        runStart = -1;
      }
    }
  }

  return results;
}

export function renderDataSegmentsSummary(context: DetailContext): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;

  appendHeading(detail, `Data Segments (${moduleInfo.data.length})`);

  const description = document.createElement('div');
  description.className = 'detail-description';
  description.textContent = 'Data segments used to initialize linear memory.';
  detail.appendChild(description);

  if (moduleInfo.data.length === 0) {
    return;
  }

  const totalDataSize = moduleInfo.data.reduce((sum, entry) => sum + entry.data.length, 0);
  const summaryTable = createInfoTable();
  addInfoRow(summaryTable, 'Segments', String(moduleInfo.data.length));
  addInfoRow(summaryTable, 'Total size', formatFileSize(totalDataSize));
  detail.appendChild(summaryTable);

  const activeSegments: { index: number; offset: number; length: number }[] = [];
  for (let segIndex = 0; segIndex < moduleInfo.data.length; segIndex++) {
    const seg = moduleInfo.data[segIndex];
    if (!seg.passive && seg.offsetInstructions && seg.offsetInstructions.length > 0) {
      const constInstr = seg.offsetInstructions.find(
        instruction => instruction.opCode.mnemonic === 'i32.const' || instruction.opCode.mnemonic === 'i64.const'
      );
      if (constInstr && constInstr.immediates.values.length > 0) {
        activeSegments.push({
          index: segIndex,
          offset: constInstr.immediates.values[0] as number,
          length: seg.data.length,
        });
      }
    }
  }

  if (activeSegments.length > 0) {
    appendSubheading(detail, 'Memory Layout');
    activeSegments.sort((segA, segB) => segA.offset - segB.offset);

    const maxEnd = activeSegments.reduce((max, seg) => Math.max(max, seg.offset + seg.length), 0);
    const mapContainer = document.createElement('div');
    mapContainer.className = 'memory-map';

    for (const seg of activeSegments) {
      const leftPercent = (seg.offset / maxEnd) * 100;
      const widthPercent = Math.max(0.5, (seg.length / maxEnd) * 100);

      const segBar = document.createElement('div');
      segBar.className = 'memory-map-segment';
      segBar.style.left = `${leftPercent}%`;
      segBar.style.width = `${widthPercent}%`;
      segBar.title = `data ${seg.index}: offset 0x${seg.offset.toString(16)}, ${formatFileSize(seg.length)}`;
      segBar.addEventListener('click', () => {
        context.navigateToItem('data', seg.index);
      });
      mapContainer.appendChild(segBar);
    }

    detail.appendChild(mapContainer);

    const legendTable = createInfoTable();
    for (const seg of activeSegments) {
      addLinkedInfoRow(
        context,
        legendTable,
        `data ${seg.index}`,
        `0x${seg.offset.toString(16)} .. 0x${(seg.offset + seg.length).toString(16)} (${formatFileSize(seg.length)})`,
        'data',
        seg.index,
      );
    }
    detail.appendChild(legendTable);
  }
}

export function renderStringsView(strings: ExtractedString[], context: DetailContext): void {
  const detail = context.detailContainer;

  appendHeading(detail, `Strings (${strings.length})`);

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Filter strings...';
  searchInput.className = 'explorer-tree-search';
  searchInput.style.margin = '0 20px 8px 20px';
  searchInput.style.width = 'calc(100% - 40px)';
  detail.appendChild(searchInput);

  const countLabel = document.createElement('div');
  countLabel.className = 'detail-description';
  countLabel.textContent = `Showing ${strings.length} of ${strings.length}`;
  detail.appendChild(countLabel);

  const table = createInfoTable();

  const renderStringRows = (filter: string): void => {
    table.innerHTML = '';
    const lowerFilter = filter.toLowerCase();
    let visibleCount = 0;

    for (const stringEntry of strings) {
      if (lowerFilter && !stringEntry.value.toLowerCase().includes(lowerFilter)) {
        continue;
      }
      visibleCount++;

      const row = document.createElement('div');
      row.className = 'detail-info-row';

      const link = document.createElement('a');
      link.className = 'detail-info-link';
      link.textContent = `data ${stringEntry.dataSegmentIndex}+${stringEntry.offset}`;
      link.href = '#';
      link.style.flex = '0 0 120px';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        context.navigateToItem('data', stringEntry.dataSegmentIndex);
      });
      row.appendChild(link);

      const valueElement = document.createElement('span');
      valueElement.className = 'detail-string-value';
      valueElement.style.flex = '1';
      const displayValue = stringEntry.value.length > 120 ? stringEntry.value.slice(0, 120) + '...' : stringEntry.value;
      valueElement.textContent = displayValue;
      row.appendChild(valueElement);

      table.appendChild(row);
    }

    countLabel.textContent = lowerFilter
      ? `Showing ${visibleCount} of ${strings.length}`
      : `Showing ${strings.length} of ${strings.length}`;
  };

  renderStringRows('');

  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  searchInput.addEventListener('input', () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      renderStringRows(searchInput.value.trim());
    }, 150);
  });

  detail.appendChild(table);
}

export function renderDebugInfo(context: DetailContext): void {
  const dwarfData = context.getDwarfInfo();
  if (!dwarfData) {
    return;
  }
  const detail = context.detailContainer;

  appendHeading(detail, 'Debug Info (DWARF)');

  const summaryTable = createInfoTable();
  addInfoRow(summaryTable, 'Compilation units', String(dwarfData.compilationUnits.length));
  addInfoRow(summaryTable, 'Functions', String(dwarfData.functions.length));
  addInfoRow(summaryTable, 'Source files', String(dwarfData.sourceFiles.length));
  if (dwarfData.lineInfo) {
    addInfoRow(summaryTable, 'Line entries', String(dwarfData.lineInfo.lineEntries.length));
  }

  if (dwarfData.compilationUnits.length > 0) {
    const uniqueProducers = new Set<string>();
    const uniqueLanguages = new Set<string>();
    for (const compilationUnit of dwarfData.compilationUnits) {
      if (compilationUnit.producer) {
        uniqueProducers.add(compilationUnit.producer);
      }
      if (compilationUnit.language) {
        uniqueLanguages.add(getDwarfLanguageName(compilationUnit.language));
      }
    }
    if (uniqueProducers.size > 0) {
      addInfoRow(summaryTable, 'Producer', Array.from(uniqueProducers).join(', '));
    }
    if (uniqueLanguages.size > 0) {
      addInfoRow(summaryTable, 'Language', Array.from(uniqueLanguages).join(', '));
    }
  }
  detail.appendChild(summaryTable);

  const tabContainer = document.createElement('div');
  tabContainer.className = 'func-tab-container';

  const tabBar = document.createElement('div');
  tabBar.className = 'func-tab-bar';

  const tabContent = document.createElement('div');
  tabContent.className = 'func-tab-content';

  const tabs: { label: string; id: string }[] = [];
  if (dwarfData.functions.length > 0) {
    tabs.push({ label: `Functions (${dwarfData.functions.length})`, id: 'functions' });
  }
  if (dwarfData.sourceFiles.length > 0) {
    tabs.push({ label: `Source Files (${dwarfData.sourceFiles.length})`, id: 'files' });
  }
  if (dwarfData.compilationUnits.length > 1) {
    tabs.push({ label: `Compilation Units (${dwarfData.compilationUnits.length})`, id: 'units' });
  }

  let activeDebugTab = tabs.length > 0 ? tabs[0].id : '';

  const renderDebugTabContent = (): void => {
    tabContent.innerHTML = '';
    tabBar.querySelectorAll('.func-tab-btn').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.tab === activeDebugTab);
    });

    if (activeDebugTab === 'functions') {
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Filter functions...';
      searchInput.className = 'explorer-tree-search';
      searchInput.style.marginBottom = '8px';
      tabContent.appendChild(searchInput);

      const funcTable = createInfoTable();
      const sortedFunctions = [...dwarfData.functions].sort((funcA, funcB) => funcA.lowPc - funcB.lowPc);

      const renderFuncRows = (filter: string): void => {
        funcTable.innerHTML = '';
        const lowerFilter = filter.toLowerCase();
        for (const dwarfFunc of sortedFunctions) {
          if (lowerFilter && !dwarfFunc.name.toLowerCase().includes(lowerFilter)) {
            continue;
          }
          let sourceInfo = '';
          if (dwarfFunc.declFile > 0 && dwarfFunc.declFile <= dwarfData.sourceFiles.length) {
            const fileName = dwarfData.sourceFiles[dwarfFunc.declFile - 1];
            const shortName = fileName.split('/').pop() || fileName;
            sourceInfo = `${shortName}:${dwarfFunc.declLine}`;
          }
          const addressRange = dwarfFunc.lowPc > 0 ? ` [0x${dwarfFunc.lowPc.toString(16)}..0x${dwarfFunc.highPc.toString(16)}]` : '';
          addInfoRow(funcTable, dwarfFunc.name, `${sourceInfo}${addressRange}`);
        }
      };

      renderFuncRows('');

      let searchTimeout: ReturnType<typeof setTimeout> | null = null;
      searchInput.addEventListener('input', () => {
        if (searchTimeout) { clearTimeout(searchTimeout); }
        searchTimeout = setTimeout(() => renderFuncRows(searchInput.value.trim()), 150);
      });

      tabContent.appendChild(funcTable);
    } else if (activeDebugTab === 'files') {
      const fileTable = createInfoTable();
      for (let fileIndex = 0; fileIndex < dwarfData.sourceFiles.length; fileIndex++) {
        addInfoRow(fileTable, String(fileIndex), dwarfData.sourceFiles[fileIndex]);
      }
      tabContent.appendChild(fileTable);
    } else if (activeDebugTab === 'units') {
      for (const compilationUnit of dwarfData.compilationUnits) {
        const unitTable = createInfoTable();
        if (compilationUnit.name) {
          addInfoRow(unitTable, 'Source', compilationUnit.name);
        }
        if (compilationUnit.producer) {
          addInfoRow(unitTable, 'Producer', compilationUnit.producer);
        }
        if (compilationUnit.compDir) {
          addInfoRow(unitTable, 'Compile dir', compilationUnit.compDir);
        }
        if (compilationUnit.language) {
          addInfoRow(unitTable, 'Language', getDwarfLanguageName(compilationUnit.language));
        }
        addInfoRow(unitTable, 'Functions', String(compilationUnit.functions.length));
        tabContent.appendChild(unitTable);
      }
    }
  };

  for (const tabDef of tabs) {
    const tabButton = document.createElement('button');
    tabButton.className = 'func-tab-btn';
    tabButton.dataset.tab = tabDef.id;
    tabButton.textContent = tabDef.label;
    tabButton.addEventListener('click', () => {
      activeDebugTab = tabDef.id;
      renderDebugTabContent();
    });
    tabBar.appendChild(tabButton);
  }

  tabContainer.appendChild(tabBar);
  tabContainer.appendChild(tabContent);
  detail.appendChild(tabContainer);

  renderDebugTabContent();
}

export function searchWat(query: string, context: DetailContext): void {
  if (!context.disassembler || !query.trim()) {
    return;
  }
  const detail = context.detailContainer;
  detail.innerHTML = '';
  const lowerQuery = query.toLowerCase();
  const importedFuncCount = context.getImportedCount(0);
  const moduleInfo = context.moduleInfo;

  appendHeading(detail, `Search: "${query}"`);

  interface SearchMatch {
    funcIndex: number;
    globalIndex: number;
    funcName: string | null;
    lineNumber: number;
    lineText: string;
  }

  const matches: SearchMatch[] = [];

  for (let funcIndex = 0; funcIndex < moduleInfo.functions.length; funcIndex++) {
    const globalIndex = importedFuncCount + funcIndex;
    const funcName = moduleInfo.nameSection?.functionNames?.get(globalIndex) || null;
    const wat = context.disassembler.disassembleFunction(funcIndex);
    const lines = wat.split('\n');

    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
      if (lines[lineNumber].toLowerCase().includes(lowerQuery)) {
        matches.push({
          funcIndex,
          globalIndex,
          funcName,
          lineNumber: lineNumber + 1,
          lineText: lines[lineNumber].trim(),
        });
      }
    }
  }

  addInfoRow(createInfoTable(), 'Results', String(matches.length));
  const summaryTable = createInfoTable();
  addInfoRow(summaryTable, 'Results', String(matches.length));
  addInfoRow(summaryTable, 'Functions searched', String(moduleInfo.functions.length));
  detail.appendChild(summaryTable);

  if (matches.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'detail-description';
    noResults.textContent = 'No matches found.';
    detail.appendChild(noResults);
    return;
  }

  const maxResults = 500;
  const displayMatches = matches.slice(0, maxResults);

  for (const match of displayMatches) {
    const row = document.createElement('div');
    row.className = 'search-result-row';

    const link = document.createElement('a');
    link.className = 'detail-info-link';
    const displayName = match.funcName || `func_${match.globalIndex}`;
    link.textContent = `${displayName}:${match.lineNumber}`;
    link.href = '#';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      context.navigateToItem('function', match.funcIndex);
    });
    row.appendChild(link);

    const linePreview = document.createElement('span');
    linePreview.className = 'search-result-line';
    linePreview.textContent = match.lineText;
    row.appendChild(linePreview);

    detail.appendChild(row);
  }

  if (matches.length > maxResults) {
    const truncated = document.createElement('div');
    truncated.className = 'detail-truncated';
    truncated.textContent = `(showing ${maxResults} of ${matches.length} results)`;
    detail.appendChild(truncated);
  }
}

