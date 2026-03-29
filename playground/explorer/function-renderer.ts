import type { DetailContext } from './detail-renderers';
import { decompileFunction } from '../WasmDecompiler';
import type { HighlightOptions } from './syntax';
import { renderHighlightedC } from './syntax';
import {
  appendHeading,
  appendSubheading,
  createInfoTable,
  addInfoRow,
  addLinkedInfoRow,
  createCopyButton,
  appendCodeBlock,
  renderCallGraphVisual,
} from './ui-helpers';
import {
  getValueTypeName,
  formatFuncType,
  flattenTypes,
} from './wasm-types';
import { renderSourceTabContent } from './detail-renderers';

export function renderFunctionDetail(context: DetailContext, funcIndex: number): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const funcEntry = moduleInfo.functions[funcIndex];
  const importedFuncCount = context.getImportedCount(0);
  const globalFuncIndex = importedFuncCount + funcIndex;
  const funcName = context.getFunctionName(globalFuncIndex);

  const rawName = moduleInfo.nameSection?.functionNames?.get(globalFuncIndex) || null;
  const heading = funcName || `func_${globalFuncIndex}`;
  appendHeading(detail, heading);

  const flatTypes = flattenTypes(moduleInfo);

  const columnsContainer = document.createElement('div');
  columnsContainer.className = 'func-detail-columns';

  interface InfoRowData {
    label: string;
    value: string;
    linked?: { section: string; index: number };
  }
  const allRows: InfoRowData[] = [];

  allRows.push({ label: 'Index', value: String(globalFuncIndex) });
  if (funcName) { allRows.push({ label: 'Name', value: funcName }); }
  if (rawName && rawName !== funcName) { allRows.push({ label: 'Raw name', value: rawName }); }
  const topLevelFuncTypeIdx = context.findTopLevelTypeIndex(funcEntry.typeIndex);
  allRows.push({ label: 'Type', value: String(funcEntry.typeIndex), linked: { section: 'type', index: topLevelFuncTypeIdx } });

  if (funcEntry.typeIndex < flatTypes.length) {
    const typeEntry = flatTypes[funcEntry.typeIndex];
    if (typeEntry.kind === 'func') {
      allRows.push({ label: 'Signature', value: formatFuncType(typeEntry) });
    }
  }

  allRows.push({ label: 'Body size', value: `${funcEntry.body.length} bytes` });
  if (funcEntry.locals.length > 0) {
    const totalLocals = funcEntry.locals.reduce((sum, local) => sum + local.count, 0);
    allRows.push({ label: 'Locals', value: String(totalLocals) });
  }

  const dwarfFunc = context.findDwarfFunction(funcIndex);
  if (dwarfFunc) {
    const dwarfData = context.getDwarfInfo();
    if (dwarfFunc.linkageName) {
      allRows.push({ label: 'Linkage name', value: dwarfFunc.linkageName });
    }
    if (dwarfFunc.declFile > 0 && dwarfData && dwarfFunc.declFile <= dwarfData.sourceFiles.length) {
      const sourceFile = dwarfData.sourceFiles[dwarfFunc.declFile - 1];
      allRows.push({ label: 'Source', value: `${sourceFile}:${dwarfFunc.declLine}` });
    }
  }

  const nameSource = context.getNameSource(globalFuncIndex);
  if (nameSource) {
    allRows.push({ label: 'Name source', value: nameSource });
  }

  const targetRowCount = 4;
  while (allRows.length < targetRowCount * 2) {
    allRows.push({ label: '\u00A0', value: '\u00A0' });
  }

  const midpoint = Math.max(targetRowCount, Math.ceil(allRows.length / 2));
  const leftColumn = createInfoTable();
  const rightColumn = createInfoTable();

  for (let rowIdx = 0; rowIdx < allRows.length; rowIdx++) {
    const target = rowIdx < midpoint ? leftColumn : rightColumn;
    const rowData = allRows[rowIdx];
    if (rowData.linked) {
      addLinkedInfoRow(context, target, rowData.label, rowData.value, rowData.linked.section, rowData.linked.index);
    } else {
      addInfoRow(target, rowData.label, rowData.value);
    }
  }

  columnsContainer.appendChild(leftColumn);
  columnsContainer.appendChild(rightColumn);
  detail.appendChild(columnsContainer);

  const hasLocalNames = moduleInfo.nameSection?.localNames?.has(globalFuncIndex);
  if (funcEntry.locals.length > 0 && hasLocalNames) {
    appendSubheading(detail, 'Named Locals');
    const localsTable = createInfoTable();
    let localOffset = 0;
    const funcType = funcEntry.typeIndex < flatTypes.length ? flatTypes[funcEntry.typeIndex] : null;
    const paramCount = funcType && funcType.kind === 'func' ? funcType.parameterTypes.length : 0;
    for (const localGroup of funcEntry.locals) {
      for (let localIndex = 0; localIndex < localGroup.count; localIndex++) {
        const absoluteLocalIndex = paramCount + localOffset;
        const localName = moduleInfo.nameSection?.localNames?.get(globalFuncIndex)?.get(absoluteLocalIndex);
        if (localName) {
          addInfoRow(localsTable, `${localName} (local ${absoluteLocalIndex})`, getValueTypeName(localGroup.type));
        }
        localOffset++;
      }
    }
    detail.appendChild(localsTable);
  }

  {
    const callGraphData = context.getCallGraph();
    const calleesSet = callGraphData.callees.get(globalFuncIndex);
    const callersSet = callGraphData.callers.get(globalFuncIndex);

    if ((calleesSet && calleesSet.size > 0) || (callersSet && callersSet.size > 0)) {
      appendSubheading(detail, 'Call Graph');
      renderCallGraphVisual(context, detail, globalFuncIndex, calleesSet || new Set(), callersSet || new Set());
    }
  }

  const tabContainer = document.createElement('div');
  tabContainer.className = 'func-tab-container';

  const tabBar = document.createElement('div');
  tabBar.className = 'func-tab-bar';

  const tabContent = document.createElement('div');
  tabContent.className = 'func-tab-content';

  const hasSourceMap = context.parsedSourceMap !== null;
  const tabs: { label: string; id: string }[] = [
    { label: 'Decompiled', id: 'decompiled' },
    { label: 'WAT', id: 'wat' },
    { label: 'Bytes', id: 'bytes' },
  ];
  if (hasSourceMap) {
    tabs.push({ label: 'Source', id: 'source' });
  }

  let activeTab = 'decompiled';

  const renderTabContent = (): void => {
    tabContent.innerHTML = '';
    tabBar.querySelectorAll('.func-tab-btn').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.tab === activeTab);
    });

    if (activeTab === 'decompiled') {
      if (context.nameResolver && context.moduleInfo) {
        const globalFuncIdx = context.getImportedCount(0) + funcIndex;
        const decompiledCode = decompileFunction(context.moduleInfo, funcIndex, context.nameResolver, context.buildFieldResolver(globalFuncIdx));

        const funcNameMap = new Map<string, number>();
        const importedCount = context.getImportedCount(0);
        for (let localFuncIdx = 0; localFuncIdx < context.moduleInfo.functions.length; localFuncIdx++) {
          const globalIdx = importedCount + localFuncIdx;
          const nameRes = context.nameResolver.functionName(globalIdx);
          funcNameMap.set(nameRes.name, localFuncIdx);
        }

        const highlightOptions: HighlightOptions = {
          onFunctionClick: (functionName: string) => {
            const targetLocalIdx = funcNameMap.get(functionName);
            if (targetLocalIdx !== undefined) {
              context.navigateToItem('function', targetLocalIdx);
            }
          },
        };

        const block = document.createElement('div');
        block.className = 'detail-code';
        const lines = decompiledCode.split('\n');

        // Match every opening { to its closing }
        const bracePairs = new Map<number, number>();
        const braceStack: number[] = [];
        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
          const stripped = lines[lineIdx].trim();
          if (stripped.startsWith('}')) {
            if (braceStack.length > 0) {
              bracePairs.set(braceStack.pop()!, lineIdx);
            }
          }
          if (stripped.endsWith('{')) {
            braceStack.push(lineIdx);
          }
        }

        const gutterWidth = String(lines.length).length;

        const lineElements: HTMLElement[] = [];
        const foldCollapsed = new Set<number>();

        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
          const lineEl = document.createElement('div');
          lineEl.className = 'code-line';

          const foldSlot = document.createElement('span');
          foldSlot.className = 'code-fold-slot';

          const closingLine = bracePairs.get(lineIdx);
          const isFoldable = closingLine !== undefined && closingLine - lineIdx > 1;

          let ellipsis: HTMLSpanElement | null = null;
          if (isFoldable) {
            foldSlot.classList.add('foldable');
            foldSlot.textContent = '\u25BE';

            const openIdx = lineIdx;
            const closeIdx = closingLine;
            const hiddenCount = closeIdx - openIdx - 1;

            ellipsis = document.createElement('span');
            ellipsis.className = 'code-fold-ellipsis';
            ellipsis.textContent = `\u2026 ${hiddenCount} lines`;
            ellipsis.style.display = 'none';
            ellipsis.addEventListener('click', () => {
              foldSlot.click();
            });

            foldSlot.addEventListener('click', () => {
              const wasCollapsed = foldCollapsed.has(openIdx);
              if (wasCollapsed) {
                foldCollapsed.delete(openIdx);
              } else {
                foldCollapsed.add(openIdx);
              }
              const isNowCollapsed = foldCollapsed.has(openIdx);
              ellipsis!.style.display = isNowCollapsed ? '' : 'none';
              foldSlot.textContent = isNowCollapsed ? '\u25B8' : '\u25BE';
              for (let targetLine = openIdx + 1; targetLine < closeIdx; targetLine++) {
                let shouldHide = false;
                for (const collapsedOpen of foldCollapsed) {
                  const collapsedClose = bracePairs.get(collapsedOpen);
                  if (collapsedClose !== undefined && targetLine > collapsedOpen && targetLine < collapsedClose) {
                    shouldHide = true;
                    break;
                  }
                }
                lineElements[targetLine].style.display = shouldHide ? 'none' : '';
              }
            });
          }

          const gutter = document.createElement('span');
          gutter.className = 'code-line-number';
          gutter.textContent = String(lineIdx + 1).padStart(gutterWidth);
          lineEl.appendChild(gutter);

          lineEl.appendChild(foldSlot);

          const lineContent = document.createElement('span');
          lineContent.className = 'code-line-content';
          renderHighlightedC(lineContent, lines[lineIdx], highlightOptions);
          lineEl.appendChild(lineContent);

          if (ellipsis) {
            lineEl.appendChild(ellipsis);
          }

          block.appendChild(lineEl);
          lineElements.push(lineEl);
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'detail-block-wrapper';
        wrapper.appendChild(block);
        wrapper.appendChild(createCopyButton(decompiledCode));
        tabContent.appendChild(wrapper);
      }
    } else if (activeTab === 'wat') {
      if (context.disassembler) {
        appendCodeBlock(tabContent, context.disassembler.disassembleFunction(funcIndex));
      }
    } else if (activeTab === 'bytes') {
      context.renderInteractiveBytes(tabContent, funcIndex);
    } else if (activeTab === 'source') {
      renderSourceTabContent(context, tabContent, funcIndex);
    }
  };

  for (const tabDef of tabs) {
    const tabButton = document.createElement('button');
    tabButton.className = 'func-tab-btn';
    tabButton.dataset.tab = tabDef.id;
    tabButton.textContent = tabDef.label;
    tabButton.addEventListener('click', () => {
      activeTab = tabDef.id;
      renderTabContent();
    });
    tabBar.appendChild(tabButton);
  }

  tabContainer.appendChild(tabBar);
  tabContainer.appendChild(tabContent);
  detail.appendChild(tabContainer);

  renderTabContent();
}
