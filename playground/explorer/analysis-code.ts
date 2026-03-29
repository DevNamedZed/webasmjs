import InstructionDecoder from '../../src/InstructionDecoder';
import type { DetailContext } from './detail-renderers';
import {
  appendHeading,
  appendSubheading,
  createInfoTable,
  formatFileSize,
} from './ui-helpers';

export function renderFunctionComplexity(context: DetailContext): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const importedFuncCount = context.getImportedCount(0);

  appendHeading(detail, 'Function Complexity');

  interface ComplexityEntry {
    localIndex: number;
    globalIndex: number;
    name: string | null;
    instructionCount: number;
    branchCount: number;
    maxNestingDepth: number;
    bodySize: number;
  }

  const entries: ComplexityEntry[] = [];

  for (let funcIndex = 0; funcIndex < moduleInfo.functions.length; funcIndex++) {
    const globalIndex = importedFuncCount + funcIndex;
    const func = moduleInfo.functions[funcIndex];
    const instructions = func.instructions || InstructionDecoder.decodeFunctionBody(func.body);
    const funcName = context.getFunctionName(globalIndex);

    let instructionCount = 0;
    let branchCount = 0;
    let currentDepth = 0;
    let maxDepth = 0;

    for (const instruction of instructions) {
      const mnemonic = instruction.opCode.mnemonic;
      if (mnemonic === 'end') {
        currentDepth = Math.max(0, currentDepth - 1);
        continue;
      }
      instructionCount++;
      if (mnemonic === 'block' || mnemonic === 'loop' || mnemonic === 'if' || mnemonic === 'try') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      }
      if (mnemonic === 'br' || mnemonic === 'br_if' || mnemonic === 'br_table' || mnemonic === 'if') {
        branchCount++;
      }
    }

    entries.push({
      localIndex: funcIndex,
      globalIndex,
      name: funcName,
      instructionCount,
      branchCount,
      maxNestingDepth: maxDepth,
      bodySize: func.body.length,
    });
  }

  entries.sort((entryA, entryB) => {
    const scoreA = entryA.branchCount * 3 + entryA.maxNestingDepth * 5 + entryA.instructionCount;
    const scoreB = entryB.branchCount * 3 + entryB.maxNestingDepth * 5 + entryB.instructionCount;
    return scoreB - scoreA;
  });

  const maxScore = entries.length > 0
    ? entries[0].branchCount * 3 + entries[0].maxNestingDepth * 5 + entries[0].instructionCount
    : 1;

  const highThreshold = 150;
  const mediumThreshold = 75;
  const highCount = entries.filter(entry => (entry.branchCount * 3 + entry.maxNestingDepth * 5 + entry.instructionCount) >= highThreshold).length;
  const medCount = entries.filter(entry => {
    const score = entry.branchCount * 3 + entry.maxNestingDepth * 5 + entry.instructionCount;
    return score >= mediumThreshold && score < highThreshold;
  }).length;
  const lowCount = entries.length - highCount - medCount;

  const summaryGrid = document.createElement('div');
  summaryGrid.className = 'module-summary-grid';
  for (const [tierLabel, tierCount, tierColor] of [
    ['High', highCount, '#f38ba8'] as const,
    ['Medium', medCount, '#fab387'] as const,
    ['Low', lowCount, '#a6e3a1'] as const,
  ]) {
    const card = document.createElement('div');
    card.className = 'module-summary-card';
    card.style.borderColor = tierColor;
    const countEl = document.createElement('span');
    countEl.className = 'module-summary-count';
    countEl.style.color = tierColor;
    countEl.textContent = String(tierCount);
    card.appendChild(countEl);
    const labelEl = document.createElement('span');
    labelEl.className = 'module-summary-label';
    labelEl.textContent = tierLabel;
    card.appendChild(labelEl);
    summaryGrid.appendChild(card);
  }
  detail.appendChild(summaryGrid);

  appendSubheading(detail, 'By Complexity Score');

  const headerRow = document.createElement('div');
  headerRow.className = 'detail-info-row complexity-header';
  for (const label of ['Function', 'Score', 'Instructions', 'Branches', 'Depth', 'Bytes']) {
    const cell = document.createElement('span');
    cell.className = 'complexity-header-cell';
    cell.textContent = label;
    headerRow.appendChild(cell);
  }
  detail.appendChild(headerRow);

  for (const entry of entries) {
    const row = document.createElement('div');
    row.className = 'detail-info-row';

    const displayName = entry.name || `func_${entry.globalIndex}`;
    const link = document.createElement('a');
    link.className = 'detail-info-link';
    link.textContent = displayName;
    link.style.flex = '2';
    link.href = '#';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      context.navigateToItem('function', entry.localIndex);
    });
    row.appendChild(link);

    const score = entry.branchCount * 3 + entry.maxNestingDepth * 5 + entry.instructionCount;
    let tierColor = '#a6e3a1';
    if (score >= highThreshold) {
      tierColor = '#f38ba8';
    } else if (score >= mediumThreshold) {
      tierColor = '#fab387';
    }

    const scoreCell = document.createElement('span');
    scoreCell.className = 'complexity-cell';

    const barContainer = document.createElement('span');
    barContainer.className = 'size-bar-container';
    barContainer.style.display = 'inline-block';
    barContainer.style.width = '60px';
    barContainer.style.verticalAlign = 'middle';
    barContainer.style.marginRight = '8px';
    const bar = document.createElement('span');
    bar.className = 'size-bar';
    bar.style.width = `${Math.max(2, (score / maxScore) * 100)}%`;
    bar.style.background = tierColor;
    bar.style.display = 'block';
    barContainer.appendChild(bar);
    scoreCell.appendChild(barContainer);
    scoreCell.appendChild(document.createTextNode(String(score)));
    row.appendChild(scoreCell);

    for (const value of [entry.instructionCount, entry.branchCount, entry.maxNestingDepth, entry.bodySize]) {
      const cell = document.createElement('span');
      cell.className = 'complexity-cell';
      cell.textContent = String(value);
      row.appendChild(cell);
    }

    detail.appendChild(row);
  }
}

export function renderDeadCode(context: DetailContext): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const importedFuncCount = context.getImportedCount(0);
  const callGraphData = context.getCallGraph();

  const exportedFuncIndices = new Set<number>();
  for (const exportEntry of moduleInfo.exports) {
    if (exportEntry.kind === 0) {
      exportedFuncIndices.add(exportEntry.index);
    }
  }

  if (moduleInfo.start !== null) {
    exportedFuncIndices.add(moduleInfo.start);
  }

  for (const elementEntry of moduleInfo.elements) {
    for (const funcIdx of elementEntry.functionIndices) {
      exportedFuncIndices.add(funcIdx);
    }
  }

  const reachable = new Set<number>();
  const worklist = Array.from(exportedFuncIndices);
  while (worklist.length > 0) {
    const current = worklist.pop()!;
    if (reachable.has(current)) {
      continue;
    }
    reachable.add(current);
    const callees = callGraphData.callees.get(current);
    if (callees) {
      for (const callee of callees) {
        if (!reachable.has(callee)) {
          worklist.push(callee);
        }
      }
    }
  }

  const deadFunctions: { localIndex: number; globalIndex: number; name: string | null; bodySize: number }[] = [];
  for (let funcIndex = 0; funcIndex < moduleInfo.functions.length; funcIndex++) {
    const globalIndex = importedFuncCount + funcIndex;
    if (!reachable.has(globalIndex)) {
      deadFunctions.push({
        localIndex: funcIndex,
        globalIndex,
        name: context.getFunctionName(globalIndex),
        bodySize: moduleInfo.functions[funcIndex].body.length,
      });
    }
  }

  appendHeading(detail, 'Dead Code Analysis');

  const wastedBytes = deadFunctions.reduce((sum, func) => sum + func.bodySize, 0);
  const totalCodeSize = moduleInfo.functions.reduce((sum, func) => sum + func.body.length, 0);
  const wastedPercent = totalCodeSize > 0 ? ((wastedBytes / totalCodeSize) * 100).toFixed(1) : '0';

  const summaryGrid = document.createElement('div');
  summaryGrid.className = 'module-summary-grid';

  for (const [label, count, color] of [
    ['Reachable', reachable.size - importedFuncCount, '#a6e3a1'] as const,
    ['Unreachable', deadFunctions.length, deadFunctions.length > 0 ? '#f38ba8' : '#a6e3a1'] as const,
    ['Wasted', formatFileSize(wastedBytes), '#fab387'] as const,
  ]) {
    const card = document.createElement('div');
    card.className = 'module-summary-card';
    const countEl = document.createElement('span');
    countEl.className = 'module-summary-count';
    countEl.style.color = color as string;
    countEl.textContent = String(count);
    card.appendChild(countEl);
    const labelEl = document.createElement('span');
    labelEl.className = 'module-summary-label';
    labelEl.textContent = label;
    card.appendChild(labelEl);
    summaryGrid.appendChild(card);
  }
  detail.appendChild(summaryGrid);

  if (wastedBytes > 0 && totalCodeSize > 0) {
    const wastedInfo = document.createElement('div');
    wastedInfo.className = 'detail-description';
    wastedInfo.textContent = `${wastedPercent}% of code bytes are unreachable.`;
    detail.appendChild(wastedInfo);
  }

  if (deadFunctions.length === 0) {
    const noDeadCode = document.createElement('div');
    noDeadCode.className = 'detail-description';
    noDeadCode.textContent = 'No unreachable functions detected.';
    detail.appendChild(noDeadCode);
    return;
  }

  deadFunctions.sort((funcA, funcB) => funcB.bodySize - funcA.bodySize);
  const maxDeadSize = deadFunctions[0].bodySize;

  appendSubheading(detail, `Unreachable Functions (${deadFunctions.length})`);
  const funcTable = createInfoTable();
  for (const deadFunc of deadFunctions) {
    const displayName = deadFunc.name || `func_${deadFunc.globalIndex}`;
    const row = document.createElement('div');
    row.className = 'detail-info-row';

    const link = document.createElement('a');
    link.className = 'detail-info-link';
    link.style.flex = '0 0 180px';
    link.textContent = displayName;
    link.href = '#';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      context.navigateToItem('function', deadFunc.localIndex);
    });
    row.appendChild(link);

    const barContainer = document.createElement('div');
    barContainer.className = 'size-bar-container';
    const bar = document.createElement('div');
    bar.className = 'size-bar';
    bar.style.width = `${Math.max(2, (deadFunc.bodySize / maxDeadSize) * 100)}%`;
    bar.style.background = '#f38ba8';
    barContainer.appendChild(bar);
    row.appendChild(barContainer);

    const valueElement = document.createElement('span');
    valueElement.className = 'size-value';
    valueElement.textContent = formatFileSize(deadFunc.bodySize);
    row.appendChild(valueElement);

    funcTable.appendChild(row);
  }
  detail.appendChild(funcTable);
}
