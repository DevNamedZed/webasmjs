import type { ModuleInfo } from '../../src/BinaryReader';
import InstructionDecoder from '../../src/InstructionDecoder';
import { renderHighlightedWat, renderColoredHexDump, buildInstructionByteClasses } from './syntax';

export type ByteRangeSection = 'type' | 'import' | 'function' | 'table' | 'memory' | 'global' | 'export' | 'element' | 'data';

export interface ByteRange {
  offset: number;
  length: number;
}

export interface SectionRange {
  sectionId: number;
  offset: number;
  length: number;
  name: string;
}

export interface ByteRangeMap {
  sections: SectionRange[];
  getItem(section: ByteRangeSection, index: number): ByteRange | null;
}

export function buildByteRanges(data: Uint8Array): ByteRangeMap {
  const sections: SectionRange[] = [];
  const items = new Map<string, ByteRange[]>();
  const sectionNames: Record<number, string> = {
    1: 'Type', 2: 'Import', 3: 'Function', 4: 'Table', 5: 'Memory',
    6: 'Global', 7: 'Export', 9: 'Element', 10: 'Code', 11: 'Data', 0: 'Custom',
  };
  let offset = 8; // skip magic + version
  while (offset < data.length) {
    const sectionId = data[offset];
    let sizeOffset = offset + 1;
    let sectionSize = 0;
    let shift = 0;
    while (sizeOffset < data.length) {
      const byte = data[sizeOffset++];
      sectionSize |= (byte & 0x7f) << shift;
      shift += 7;
      if (!(byte & 0x80)) { break; }
    }
    const sectionStart = sizeOffset;
    sections.push({
      sectionId,
      offset: offset,
      length: sectionStart + sectionSize - offset,
      name: sectionNames[sectionId] || `Section ${sectionId}`,
    });

    // For code section, parse individual function bodies
    if (sectionId === 10) {
      let pos = sectionStart;
      let funcCount = 0;
      shift = 0;
      while (pos < data.length) {
        const byte = data[pos++];
        funcCount |= (byte & 0x7f) << shift;
        shift += 7;
        if (!(byte & 0x80)) { break; }
      }
      const funcRanges: ByteRange[] = [];
      for (let funcIdx = 0; funcIdx < funcCount && pos < sectionStart + sectionSize; funcIdx++) {
        let bodySize = 0;
        shift = 0;
        while (pos < data.length) {
          const byte = data[pos++];
          bodySize |= (byte & 0x7f) << shift;
          shift += 7;
          if (!(byte & 0x80)) { break; }
        }
        funcRanges.push({ offset: pos, length: bodySize });
        pos += bodySize;
      }
      items.set('function', funcRanges);
    }

    offset = sectionStart + sectionSize;
  }

  return {
    sections,
    getItem(section: ByteRangeSection, index: number): ByteRange | null {
      const ranges = items.get(section);
      if (ranges && index >= 0 && index < ranges.length) {
        return ranges[index];
      }
      return null;
    },
  };
}

export interface ExplorerContext {
  navigateToItem(section: string, index: number): void;
  getFunctionName(globalIndex: number): string | null;
  getImportedCount(kind: number): number;
  byteRanges: ByteRangeMap | null;
  rawBytes: Uint8Array | null;
  moduleInfo: ModuleInfo | null;
}

export function appendHeading(parent: HTMLElement, text: string): void {
  const heading = document.createElement('h2');
  heading.className = 'detail-heading';
  heading.textContent = text;
  parent.appendChild(heading);
}

export function appendSubheading(parent: HTMLElement, text: string): void {
  const heading = document.createElement('h3');
  heading.className = 'detail-subheading';
  heading.textContent = text;
  parent.appendChild(heading);
}

export function createInfoTable(): HTMLElement {
  const table = document.createElement('div');
  table.className = 'detail-info-table';
  return table;
}

export function addInfoRow(table: HTMLElement, label: string, value: string): void {
  const row = document.createElement('div');
  row.className = 'detail-info-row';

  const labelElement = document.createElement('span');
  labelElement.className = 'detail-info-label';
  labelElement.textContent = label;
  row.appendChild(labelElement);

  const valueElement = document.createElement('span');
  valueElement.className = 'detail-info-value';
  valueElement.textContent = value;
  row.appendChild(valueElement);

  table.appendChild(row);
}

export function addLinkedInfoRow(
  ctx: ExplorerContext,
  table: HTMLElement,
  label: string,
  value: string,
  targetSection: string,
  targetIndex: number,
): void {
  const row = document.createElement('div');
  row.className = 'detail-info-row';

  const labelElement = document.createElement('span');
  labelElement.className = 'detail-info-label';
  labelElement.textContent = label;
  labelElement.title = label;
  row.appendChild(labelElement);

  const link = document.createElement('a');
  link.className = 'detail-info-link';
  link.style.flex = '1';
  link.textContent = value;
  link.href = '#';
  link.addEventListener('click', (event) => {
    event.preventDefault();
    ctx.navigateToItem(targetSection, targetIndex);
  });
  row.appendChild(link);

  table.appendChild(row);
}

export function createCopyButton(text: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'detail-copy-btn';
  button.textContent = 'Copy';
  button.addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => {
      button.textContent = 'Copied';
      setTimeout(() => { button.textContent = 'Copy'; }, 1500);
    });
  });
  return button;
}

export function appendCodeBlock(parent: HTMLElement, code: string): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'detail-block-wrapper';

  const block = document.createElement('div');
  block.className = 'detail-code';

  const lines = code.split('\n');
  const gutterWidth = String(lines.length).length;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineElement = document.createElement('div');
    lineElement.className = 'code-line';

    const gutter = document.createElement('span');
    gutter.className = 'code-line-number';
    gutter.textContent = String(lineIndex + 1).padStart(gutterWidth);
    lineElement.appendChild(gutter);

    const content = document.createElement('span');
    content.className = 'code-line-content';
    renderHighlightedWat(content, lines[lineIndex]);
    lineElement.appendChild(content);

    block.appendChild(lineElement);
  }

  wrapper.appendChild(block);
  wrapper.appendChild(createCopyButton(code));
  parent.appendChild(wrapper);
}

function formatHexDump(bytes: Uint8Array, baseOffset: number): string {
  const lines: string[] = [];
  for (let position = 0; position < bytes.length; position += 16) {
    const address = (baseOffset + position).toString(16).padStart(8, '0');
    const hexParts: string[] = [];
    let asciiPart = '';
    for (let byteIndex = 0; byteIndex < 16; byteIndex++) {
      if (position + byteIndex < bytes.length) {
        const byteValue = bytes[position + byteIndex];
        hexParts.push(byteValue.toString(16).padStart(2, '0'));
        asciiPart += (byteValue >= 0x20 && byteValue < 0x7f) ? String.fromCharCode(byteValue) : '.';
      } else {
        hexParts.push('  ');
        asciiPart += ' ';
      }
    }
    const hexLeft = hexParts.slice(0, 8).join(' ');
    const hexRight = hexParts.slice(8).join(' ');
    lines.push(`${address}  ${hexLeft}  ${hexRight}  |${asciiPart}|`);
  }
  return lines.join('\n');
}

export function appendHexDump(parent: HTMLElement, bytes: Uint8Array, baseOffset: number, byteClasses?: Map<number, string>): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'detail-block-wrapper';

  const hexText = formatHexDump(bytes, baseOffset);
  const block = document.createElement('pre');
  block.className = 'detail-hex';

  if (byteClasses && byteClasses.size > 0) {
    renderColoredHexDump(block, bytes, baseOffset, byteClasses);
  } else {
    block.textContent = hexText;
  }

  wrapper.appendChild(block);
  wrapper.appendChild(createCopyButton(hexText));
  parent.appendChild(wrapper);
}

export function appendByteRange(ctx: ExplorerContext, parent: HTMLElement, section: string, index: number): void {
  if (!ctx.byteRanges || !ctx.rawBytes) {
    return;
  }
  const range = ctx.byteRanges.getItem(section as ByteRangeSection, index);
  if (!range) {
    return;
  }

  appendSubheading(parent, 'Bytes');
  const rangeInfo = document.createElement('div');
  rangeInfo.className = 'detail-byte-range-info';
  rangeInfo.textContent = `Offset: 0x${range.offset.toString(16)} (${range.offset}), Length: ${range.length} bytes`;
  parent.appendChild(rangeInfo);

  const maxDisplay = Math.min(range.length, 4096);
  const bytes = ctx.rawBytes.slice(range.offset, range.offset + maxDisplay);

  let byteClasses: Map<number, string> | undefined;
  if (section === 'function' && ctx.moduleInfo && index < ctx.moduleInfo.functions.length) {
    const funcBody = ctx.moduleInfo.functions[index].body;
    byteClasses = buildInstructionByteClasses(funcBody);
  }

  appendHexDump(parent, bytes, range.offset, byteClasses);

  if (range.length > maxDisplay) {
    const truncated = document.createElement('div');
    truncated.className = 'detail-truncated';
    truncated.textContent = `(showing ${maxDisplay} of ${range.length} bytes)`;
    parent.appendChild(truncated);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function renderCallGraphVisual(
  ctx: ExplorerContext,
  parent: HTMLElement,
  centerGlobalIndex: number,
  callees: Set<number>,
  callers: Set<number>,
): void {
  if (!ctx.moduleInfo) {
    return;
  }
  const importedFuncCount = ctx.getImportedCount(0);

  const renderFlowSection = (indices: Set<number>, label: string): void => {
    const section = document.createElement('div');
    section.className = 'callgraph-flow';

    const sectionLabel = document.createElement('span');
    sectionLabel.className = 'callgraph-col-label';
    sectionLabel.textContent = `${label} (${indices.size}): `;
    section.appendChild(sectionLabel);

    const sorted = Array.from(indices).sort((indexA, indexB) => indexA - indexB);
    const initialVisible = 10;
    const overflowNodes: HTMLElement[] = [];

    for (let displayIdx = 0; displayIdx < sorted.length; displayIdx++) {
      const globalIdx = sorted[displayIdx];
      const localIdx = globalIdx - importedFuncCount;
      const displayName = ctx.getFunctionName(globalIdx) || `func_${globalIdx}`;
      const node = document.createElement('a');
      node.className = 'callgraph-node';
      node.textContent = displayName;
      node.href = '#';
      node.addEventListener('click', (event) => {
        event.preventDefault();
        if (localIdx >= 0) {
          ctx.navigateToItem('function', localIdx);
        }
      });
      if (displayIdx >= initialVisible) {
        node.style.display = 'none';
        overflowNodes.push(node);
      }
      section.appendChild(node);
    }

    if (overflowNodes.length > 0) {
      const expandBtn = document.createElement('a');
      expandBtn.className = 'callgraph-node';
      expandBtn.style.color = '#6c7086';
      expandBtn.style.cursor = 'pointer';
      expandBtn.textContent = `+${overflowNodes.length} more`;
      expandBtn.href = '#';
      expandBtn.addEventListener('click', (event) => {
        event.preventDefault();
        for (const overflowNode of overflowNodes) {
          overflowNode.style.display = '';
        }
        expandBtn.remove();
      });
      section.appendChild(expandBtn);
    }
    parent.appendChild(section);
  };

  if (callees.size > 0) {
    renderFlowSection(callees, 'Calls');
  }
  if (callers.size > 0) {
    renderFlowSection(callers, 'Called by');
  }
}

export function appendCallList(
  ctx: ExplorerContext,
  parent: HTMLElement,
  label: string,
  funcIndices: Set<number>,
): void {
  if (!ctx.moduleInfo) {
    return;
  }
  const importedFuncCount = ctx.getImportedCount(0);
  const container = document.createElement('div');
  container.className = 'detail-call-list';

  const labelElement = document.createElement('span');
  labelElement.className = 'detail-call-label';
  labelElement.textContent = label + ': ';
  container.appendChild(labelElement);

  const sortedIndices = Array.from(funcIndices).sort((indexA, indexB) => indexA - indexB);
  for (let position = 0; position < sortedIndices.length; position++) {
    const targetGlobalIndex = sortedIndices[position];
    const funcName = ctx.getFunctionName(targetGlobalIndex);
    const displayName = funcName || `func_${targetGlobalIndex}`;
    const localFuncIndex = targetGlobalIndex - importedFuncCount;

    const link = document.createElement('a');
    link.className = 'call-graph-link';
    link.textContent = displayName;
    link.href = '#';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (localFuncIndex >= 0) {
        ctx.navigateToItem('function', localFuncIndex);
      }
    });
    container.appendChild(link);

    if (position < sortedIndices.length - 1) {
      container.appendChild(document.createTextNode(', '));
    }
  }

  parent.appendChild(container);
}

export function renderInteractiveBytes(ctx: ExplorerContext, parent: HTMLElement, funcIndex: number): void {
  if (!ctx.byteRanges || !ctx.rawBytes || !ctx.moduleInfo || funcIndex >= ctx.moduleInfo.functions.length) {
    return;
  }
  const range = ctx.byteRanges.getItem('function' as ByteRangeSection, funcIndex);
  if (!range) {
    appendByteRange(ctx, parent, 'function', funcIndex);
    return;
  }

  const funcBody = ctx.moduleInfo.functions[funcIndex].body;
  let instructions: import('../../src/InstructionDecoder').DecodedInstruction[];
  try {
    instructions = InstructionDecoder.decodeFunctionBody(funcBody);
  } catch {
    appendByteRange(ctx, parent, 'function', funcIndex);
    return;
  }

  const rangeInfo = document.createElement('div');
  rangeInfo.className = 'detail-byte-range-info';
  rangeInfo.textContent = `Offset: 0x${range.offset.toString(16)}, ${range.length} bytes, ${instructions.length} instructions`;
  parent.appendChild(rangeInfo);

  const splitContainer = document.createElement('div');
  splitContainer.className = 'hex-split-view';

  const instrList = document.createElement('div');
  instrList.className = 'hex-instr-list';

  const hexView = document.createElement('pre');
  hexView.className = 'detail-hex hex-interactive';

  const byteSpans = new Map<number, HTMLElement[]>();
  const byteClasses = buildInstructionByteClasses(funcBody);

  const byteToInstrLabel = new Map<number, string>();
  for (const instruction of instructions) {
    const label = instruction.immediates.values.length > 0
      ? `${instruction.opCode.mnemonic} ${instruction.immediates.values.join(', ')}`
      : instruction.opCode.mnemonic;
    for (let bytePos = instruction.offset; bytePos < instruction.offset + instruction.length; bytePos++) {
      byteToInstrLabel.set(bytePos, label);
    }
  }

  for (let position = 0; position < funcBody.length; position += 16) {
    const address = (range.offset + position).toString(16).padStart(8, '0');
    const addressSpan = document.createElement('span');
    addressSpan.className = 'hex-address';
    addressSpan.textContent = address + '  ';
    hexView.appendChild(addressSpan);

    for (let byteIndex = 0; byteIndex < 16; byteIndex++) {
      if (byteIndex === 8) {
        hexView.appendChild(document.createTextNode(' '));
      }
      if (position + byteIndex < funcBody.length) {
        const byteOffset = position + byteIndex;
        const byteValue = funcBody[byteOffset];
        const hexStr = byteValue.toString(16).padStart(2, '0');
        const span = document.createElement('span');
        span.className = byteClasses.get(byteOffset) || '';
        span.dataset.offset = String(byteOffset);
        span.textContent = hexStr;
        const instrLabel = byteToInstrLabel.get(byteOffset);
        if (instrLabel) {
          span.title = instrLabel;
        }
        hexView.appendChild(span);
        hexView.appendChild(document.createTextNode(' '));

        if (!byteSpans.has(byteOffset)) {
          byteSpans.set(byteOffset, []);
        }
        byteSpans.get(byteOffset)!.push(span);
      } else {
        hexView.appendChild(document.createTextNode('   '));
      }
    }
    hexView.appendChild(document.createTextNode('\n'));
  }

  let selectedInstrIdx = -1;
  const instrRows: HTMLElement[] = [];

  const clearHighlight = (): void => {
    if (selectedInstrIdx >= 0 && selectedInstrIdx < instrRows.length) {
      instrRows[selectedInstrIdx].classList.remove('hex-instr-active');
    }
    for (const spans of byteSpans.values()) {
      for (const span of spans) {
        span.classList.remove('hex-byte-active');
      }
    }
    selectedInstrIdx = -1;
  };

  const highlightInstruction = (targetIdx: number): void => {
    if (selectedInstrIdx >= 0 && selectedInstrIdx < instrRows.length) {
      instrRows[selectedInstrIdx].classList.remove('hex-instr-active');
    }
    for (const spans of byteSpans.values()) {
      for (const span of spans) {
        span.classList.remove('hex-byte-active');
      }
    }
    selectedInstrIdx = targetIdx;
    instrRows[targetIdx].classList.add('hex-instr-active');

    const targetInstr = instructions[targetIdx];
    for (let bytePos = targetInstr.offset; bytePos < targetInstr.offset + targetInstr.length; bytePos++) {
      const spans = byteSpans.get(bytePos);
      if (spans) {
        for (const span of spans) {
          span.classList.add('hex-byte-active');
        }
      }
    }
  };

  for (let instrIdx = 0; instrIdx < instructions.length; instrIdx++) {
    const instruction = instructions[instrIdx];
    const row = document.createElement('div');
    row.className = 'hex-instr-row';

    const offsetLabel = document.createElement('span');
    offsetLabel.className = 'hex-instr-offset';
    offsetLabel.textContent = `+${instruction.offset.toString(16).padStart(4, '0')}`;
    row.appendChild(offsetLabel);

    const mnemonic = document.createElement('span');
    mnemonic.className = 'hex-instr-mnemonic';
    mnemonic.textContent = instruction.opCode.mnemonic;
    row.appendChild(mnemonic);

    if (instruction.immediates.values.length > 0) {
      const immediates = document.createElement('span');
      immediates.className = 'hex-instr-imm';
      immediates.textContent = instruction.immediates.values.join(', ');
      row.appendChild(immediates);
    }

    row.addEventListener('mouseenter', () => highlightInstruction(instrIdx));
    instrList.appendChild(row);
    instrRows.push(row);
  }

  instrList.addEventListener('mouseleave', () => clearHighlight());

  hexView.addEventListener('mouseover', (event) => {
    const target = event.target as HTMLElement;
    if (target.dataset.offset !== undefined) {
      const hoveredOffset = parseInt(target.dataset.offset, 10);
      for (let instrIdx = 0; instrIdx < instructions.length; instrIdx++) {
        const instruction = instructions[instrIdx];
        if (hoveredOffset >= instruction.offset && hoveredOffset < instruction.offset + instruction.length) {
          highlightInstruction(instrIdx);
          break;
        }
      }
    }
  });

  hexView.addEventListener('mouseleave', () => clearHighlight());

  splitContainer.appendChild(instrList);
  splitContainer.appendChild(hexView);
  parent.appendChild(splitContainer);
}
