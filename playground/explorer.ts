import BinaryReader, {
  ModuleInfo,
  FuncTypeInfo,
  TypeInfo,
} from '../src/BinaryReader';
import Disassembler from '../src/Disassembler';
import InstructionDecoder from '../src/InstructionDecoder';
type ByteRangeSection = 'type' | 'import' | 'function' | 'table' | 'memory' | 'global' | 'export' | 'element' | 'data';

interface ByteRange {
  offset: number;
  length: number;
}

interface SectionRange {
  sectionId: number;
  offset: number;
  length: number;
  name: string;
}

interface ByteRangeMap {
  sections: SectionRange[];
  getItem(section: ByteRangeSection, index: number): ByteRange | null;
}

function buildByteRanges(data: Uint8Array): ByteRangeMap {
  const sections: SectionRange[] = [];
  const items = new Map<string, ByteRange[]>();
  const sectionNames: Record<number, string> = {
    1: 'Type', 2: 'Import', 3: 'Function', 4: 'Table', 5: 'Memory',
    6: 'Global', 7: 'Export', 9: 'Element', 10: 'Code', 11: 'Data', 0: 'Custom',
  };
  const sectionToByteRange: Record<number, ByteRangeSection> = {
    1: 'type', 2: 'import', 3: 'function', 4: 'table', 5: 'memory',
    6: 'global', 7: 'export', 9: 'element', 11: 'data',
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
import { parseDwarfDebugInfo, getLineEntriesForAddressRange } from '../src/DwarfParser';
import type { DwarfDebugInfo, DwarfLineInfo } from '../src/DwarfParser';
import { decompileFunction, createNameResolver } from './WasmDecompiler';
import type { NameResolver } from './WasmDecompiler';
import { parseSourceMap, lookupMapping, getSourceLine } from '../src/SourceMapParser';
import type { ParsedSourceMap, SourceMapping } from '../src/SourceMapParser';

interface TreeNode {
  label: string;
  section: string;
  index: number;
  children?: TreeNode[];
  expanded?: boolean;
  tooltip?: string;
}

const WAT_KEYWORDS = new Set([
  'module', 'func', 'param', 'result', 'local', 'global', 'table', 'memory',
  'type', 'import', 'export', 'start', 'elem', 'data', 'offset',
  'block', 'loop', 'if', 'else', 'end', 'br', 'br_if', 'br_table',
  'call', 'call_indirect', 'return', 'unreachable', 'nop',
  'drop', 'select', 'mut', 'field', 'struct', 'array', 'rec',
  'sub', 'sub_final', 'tag', 'ref', 'null',
]);

const WAT_TYPES = new Set([
  'i32', 'i64', 'f32', 'f64', 'v128',
  'funcref', 'externref', 'anyref', 'eqref', 'i31ref',
  'structref', 'arrayref', 'nullref', 'nullfuncref', 'nullexternref',
  'func', 'extern', 'any', 'eq', 'i31', 'none', 'nofunc', 'noextern',
]);

interface WatToken {
  text: string;
  kind: 'keyword' | 'type' | 'number' | 'string' | 'annotation' | 'name' | 'paren' | 'plain';
}

function tokenizeWat(source: string): WatToken[] {
  const tokens: WatToken[] = [];
  let position = 0;

  while (position < source.length) {
    const char = source[position];

    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      let end = position + 1;
      while (end < source.length && (source[end] === ' ' || source[end] === '\t' || source[end] === '\n' || source[end] === '\r')) {
        end++;
      }
      tokens.push({ text: source.slice(position, end), kind: 'plain' });
      position = end;
      continue;
    }

    if (char === '(' && position + 1 < source.length && source[position + 1] === ';') {
      let end = position + 2;
      while (end + 1 < source.length && !(source[end] === ';' && source[end + 1] === ')')) {
        end++;
      }
      end = Math.min(end + 2, source.length);
      tokens.push({ text: source.slice(position, end), kind: 'annotation' });
      position = end;
      continue;
    }

    if (char === '(' || char === ')') {
      tokens.push({ text: char, kind: 'paren' });
      position++;
      continue;
    }

    if (char === '"') {
      let end = position + 1;
      while (end < source.length && source[end] !== '"') {
        if (source[end] === '\\') {
          end++;
        }
        end++;
      }
      end = Math.min(end + 1, source.length);
      tokens.push({ text: source.slice(position, end), kind: 'string' });
      position = end;
      continue;
    }

    if (char === '$') {
      let end = position + 1;
      while (end < source.length && source[end] !== ' ' && source[end] !== ')' && source[end] !== '\n' && source[end] !== '\t') {
        end++;
      }
      tokens.push({ text: source.slice(position, end), kind: 'name' });
      position = end;
      continue;
    }

    if ((char >= '0' && char <= '9') || char === '-' || char === '+') {
      const remaining = source.slice(position);
      const numberMatch = remaining.match(/^-?(?:0x[0-9a-fA-F_]+|[0-9][0-9_]*(?:\.[0-9_]*)?(?:[eE][+-]?[0-9_]+)?|inf|nan(?::0x[0-9a-fA-F_]+)?)/);
      if (numberMatch) {
        tokens.push({ text: numberMatch[0], kind: 'number' });
        position += numberMatch[0].length;
        continue;
      }
    }

    let end = position;
    while (end < source.length && source[end] !== ' ' && source[end] !== '\t' && source[end] !== '\n' && source[end] !== '(' && source[end] !== ')' && source[end] !== '"') {
      end++;
    }
    const word = source.slice(position, end);

    if (WAT_KEYWORDS.has(word)) {
      tokens.push({ text: word, kind: 'keyword' });
    } else if (WAT_TYPES.has(word)) {
      tokens.push({ text: word, kind: 'type' });
    } else if (/^-?[0-9]/.test(word) || word === 'inf' || word === 'nan' || word === '-inf') {
      tokens.push({ text: word, kind: 'number' });
    } else if (/^(i32|i64|f32|f64|v128|memory|local|global|table|ref|struct|array|br|call|select|drop|return|unreachable|nop|block|loop|if|else|end)[._]/.test(word)) {
      tokens.push({ text: word, kind: 'keyword' });
    } else if (word.startsWith('offset=') || word.startsWith('align=')) {
      tokens.push({ text: word, kind: 'annotation' });
    } else {
      tokens.push({ text: word, kind: 'plain' });
    }
    position = end;
  }

  return tokens;
}

const C_KEYWORDS = new Set([
  'if', 'else', 'while', 'do', 'for', 'switch', 'case', 'default',
  'break', 'continue', 'return', 'void', 'const', 'sizeof',
  'unreachable', 'table',
]);

const C_TYPES = new Set([
  'int', 'long', 'float', 'double', 'short', 'char', 'unsigned',
  'byte', 'ubyte', 'ushort', 'v128',
  'funcref', 'externref', 'anyref', 'eqref', 'i31ref',
  'structref', 'arrayref',
]);

const C_CAST_TYPES = new Set([
  'int', 'long', 'float', 'double', 'unsigned', 'byte', 'ubyte', 'short', 'ushort',
]);

const MULTI_CHAR_OPS = ['>>>', '>>=', '<<=', '!=', '==', '<=', '>=', '&&', '||', '<<', '>>', '->'];

interface HighlightOptions {
  onFunctionClick?: (functionName: string) => void;
}

function renderHighlightedC(container: HTMLElement, source: string, options?: HighlightOptions): void {
  let position = 0;

  function addSpan(className: string, text: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    container.appendChild(span);
    return span;
  }

  while (position < source.length) {
    const char = source[position];

    if (char === ' ' || char === '\t') {
      container.appendChild(document.createTextNode(char));
      position++;
      continue;
    }

    // Line comments (includes /* ... */ string annotations)
    if (char === '/' && position + 1 < source.length && source[position + 1] === '/') {
      let end = position + 2;
      while (end < source.length && source[end] !== '\n') { end++; }
      addSpan('c-comment', source.slice(position, end));
      position = end;
      continue;
    }

    // Inline comments /* ... */
    if (char === '/' && position + 1 < source.length && source[position + 1] === '*') {
      let end = position + 2;
      while (end + 1 < source.length && !(source[end] === '*' && source[end + 1] === '/')) { end++; }
      end = Math.min(end + 2, source.length);
      addSpan('c-comment', source.slice(position, end));
      position = end;
      continue;
    }

    // Strings
    if (char === '"') {
      let end = position + 1;
      while (end < source.length && source[end] !== '"') {
        if (source[end] === '\\') { end++; }
        end++;
      }
      end = Math.min(end + 1, source.length);
      addSpan('c-string', source.slice(position, end));
      position = end;
      continue;
    }

    // Numbers (including negative literals after operators)
    if (char >= '0' && char <= '9') {
      let end = position;
      if (end + 1 < source.length && source[end] === '0' && source[end + 1] === 'x') {
        end += 2;
        while (end < source.length && /[0-9a-fA-F]/.test(source[end])) { end++; }
      } else {
        while (end < source.length && /[0-9.]/.test(source[end])) { end++; }
        if (end < source.length && source[end] === 'f') { end++; }
      }
      addSpan('c-number', source.slice(position, end));
      position = end;
      continue;
    }

    // Cast pattern: (type) — check for (int), (long), (unsigned), etc.
    if (char === '(' && position + 1 < source.length) {
      let end = position + 1;
      while (end < source.length && source[end] === ' ') { end++; }
      let wordStart = end;
      while (end < source.length && /[a-zA-Z]/.test(source[end])) { end++; }
      const castWord = source.slice(wordStart, end);
      // Allow "unsigned long", "unsigned int" etc.
      let fullCast = castWord;
      let castEnd = end;
      while (castEnd < source.length && source[castEnd] === ' ') { castEnd++; }
      if (castEnd < source.length && /[a-zA-Z]/.test(source[castEnd])) {
        let nextWordEnd = castEnd;
        while (nextWordEnd < source.length && /[a-zA-Z]/.test(source[nextWordEnd])) { nextWordEnd++; }
        const nextWord = source.slice(castEnd, nextWordEnd);
        if (C_CAST_TYPES.has(nextWord)) {
          fullCast = castWord + ' ' + nextWord;
          castEnd = nextWordEnd;
        }
      }
      if (C_CAST_TYPES.has(castWord) && castEnd < source.length && source[castEnd] === ')') {
        addSpan('c-cast', source.slice(position, castEnd + 1));
        position = castEnd + 1;
        continue;
      }
    }

    // Multi-character operators
    let matchedOp = false;
    for (const op of MULTI_CHAR_OPS) {
      if (source.startsWith(op, position)) {
        addSpan('c-operator', op);
        position += op.length;
        matchedOp = true;
        break;
      }
    }
    if (matchedOp) { continue; }

    // Single-character operators
    if ('+-*/%=<>!&|^~?:'.includes(char)) {
      addSpan('c-operator', char);
      position++;
      continue;
    }

    // Punctuation (braces, parens, brackets, semicolons, commas)
    if ('{}[]();,'.includes(char)) {
      if (char === '{' || char === '}') {
        addSpan('c-brace', char);
      } else {
        addSpan('c-punct', char);
      }
      position++;
      continue;
    }

    // Words: keywords, types, function calls, variables
    if (/[a-zA-Z_$]/.test(char)) {
      let end = position;
      while (end < source.length && /[a-zA-Z0-9_$]/.test(source[end])) { end++; }
      const word = source.slice(position, end);

      if (C_KEYWORDS.has(word)) {
        addSpan('c-keyword', word);
      } else if (C_TYPES.has(word)) {
        addSpan('c-type', word);
      } else if (word === 'memory') {
        addSpan('c-memory', word);
      } else if (end < source.length && source[end] === '(') {
        // Function call
        const span = addSpan('c-function', word);
        if (options?.onFunctionClick) {
          span.classList.add('c-function-link');
          const funcName = word;
          span.addEventListener('click', (event) => {
            event.stopPropagation();
            options.onFunctionClick!(funcName);
          });
        }
      } else if (word.startsWith('global_')) {
        addSpan('c-global', word);
      } else if (word.startsWith('var') || word.startsWith('param')) {
        addSpan('c-variable', word);
      } else {
        addSpan('c-variable', word);
      }
      position = end;
      continue;
    }

    container.appendChild(document.createTextNode(char));
    position++;
  }
}

function renderHighlightedWat(container: HTMLElement, source: string): void {
  const tokens = tokenizeWat(source);
  for (const token of tokens) {
    if (token.kind === 'plain' || token.kind === 'paren') {
      container.appendChild(document.createTextNode(token.text));
    } else {
      const span = document.createElement('span');
      span.className = `wat-${token.kind}`;
      span.textContent = token.text;
      container.appendChild(span);
    }
  }
}

function buildInstructionByteClasses(bytes: Uint8Array): Map<number, string> {
  const classes = new Map<number, string>();
  try {
    const instructions = InstructionDecoder.decodeFunctionBody(bytes);
    for (const instruction of instructions) {
      const opcodeEnd = instruction.offset + (instruction.length - (instruction.immediates.values.length > 0 ? 1 : 0));
      for (let bytePos = instruction.offset; bytePos < instruction.offset + instruction.length; bytePos++) {
        if (bytePos < instruction.offset + 1 || (instruction.opCode.prefix !== undefined && bytePos < instruction.offset + 2)) {
          classes.set(bytePos, 'hex-opcode');
        } else {
          classes.set(bytePos, 'hex-immediate');
        }
      }
    }
  } catch (decodeError) {
    // fall back to uncolored
  }
  return classes;
}

function renderColoredHexDump(container: HTMLElement, bytes: Uint8Array, baseOffset: number, byteClasses: Map<number, string>): void {
  for (let position = 0; position < bytes.length; position += 16) {
    const address = (baseOffset + position).toString(16).padStart(8, '0');
    const addressSpan = document.createElement('span');
    addressSpan.className = 'hex-address';
    addressSpan.textContent = address + '  ';
    container.appendChild(addressSpan);

    let asciiPart = '';
    for (let byteIndex = 0; byteIndex < 16; byteIndex++) {
      if (byteIndex === 8) {
        container.appendChild(document.createTextNode(' '));
      }
      if (position + byteIndex < bytes.length) {
        const byteValue = bytes[position + byteIndex];
        const hexStr = byteValue.toString(16).padStart(2, '0');
        const cssClass = byteClasses.get(position + byteIndex);
        if (cssClass) {
          const span = document.createElement('span');
          span.className = cssClass;
          span.textContent = hexStr;
          container.appendChild(span);
        } else {
          container.appendChild(document.createTextNode(hexStr));
        }
        container.appendChild(document.createTextNode(' '));
        asciiPart += (byteValue >= 0x20 && byteValue < 0x7f) ? String.fromCharCode(byteValue) : '.';
      } else {
        container.appendChild(document.createTextNode('   '));
        asciiPart += ' ';
      }
    }

    const asciiSpan = document.createElement('span');
    asciiSpan.className = 'hex-ascii';
    asciiSpan.textContent = ' |' + asciiPart + '|';
    container.appendChild(asciiSpan);
    container.appendChild(document.createTextNode('\n'));
  }
}

const SECTION_NAMES: Record<number, string> = {
  0: 'Custom',
  1: 'Type',
  2: 'Import',
  3: 'Function',
  4: 'Table',
  5: 'Memory',
  6: 'Global',
  7: 'Export',
  8: 'Start',
  9: 'Element',
  10: 'Code',
  11: 'Data',
  12: 'DataCount',
  13: 'Tag',
};

const VALUE_TYPE_NAMES: Record<number, string> = {
  [-1]: 'i32', [-2]: 'i64', [-3]: 'f32', [-4]: 'f64', [-5]: 'v128',
  [-16]: 'funcref', [-17]: 'externref', [-18]: 'anyref', [-19]: 'eqref',
  [-20]: 'i31ref', [-21]: 'structref', [-22]: 'arrayref',
  [-15]: 'nullref', [-13]: 'nullfuncref', [-14]: 'nullexternref',
  0x7f: 'i32', 0x7e: 'i64', 0x7d: 'f32', 0x7c: 'f64', 0x7b: 'v128',
  0x70: 'funcref', 0x6f: 'externref', 0x6e: 'anyref', 0x6d: 'eqref',
  0x6c: 'i31ref', 0x6b: 'structref', 0x6a: 'arrayref',
  0x71: 'nullref', 0x73: 'nullfuncref', 0x72: 'nullexternref',
};

const EXPORT_KIND_NAMES: Record<number, string> = {
  0: 'func', 1: 'table', 2: 'memory', 3: 'global', 4: 'tag',
};

function getValueTypeName(valueType: number | { name: string }): string {
  if (typeof valueType === 'object' && 'name' in valueType) {
    return valueType.name;
  }
  return VALUE_TYPE_NAMES[valueType] || `type_${valueType}`;
}

function formatFuncType(funcType: FuncTypeInfo): string {
  const params = funcType.parameterTypes.map(p => getValueTypeName(p)).join(', ');
  const returns = funcType.returnTypes.map(r => getValueTypeName(r)).join(', ');
  return `(${params}) -> (${returns})`;
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

function flattenTypes(moduleInfo: ModuleInfo): TypeInfo[] {
  const flat: TypeInfo[] = [];
  for (const typeEntry of moduleInfo.types) {
    if (typeEntry.kind === 'rec') {
      for (const inner of typeEntry.types) {
        flat.push(inner);
      }
    } else {
      flat.push(typeEntry);
    }
  }
  return flat;
}

interface ExtractedString {
  dataSegmentIndex: number;
  offset: number;
  value: string;
}

interface CallGraphData {
  callees: Map<number, Set<number>>;
  callers: Map<number, Set<number>>;
}

function buildCallGraph(moduleInfo: ModuleInfo): CallGraphData {
  const importedFuncCount = moduleInfo.imports.filter(importEntry => importEntry.kind === 0).length;
  const callees = new Map<number, Set<number>>();
  const callers = new Map<number, Set<number>>();

  for (let funcIndex = 0; funcIndex < moduleInfo.functions.length; funcIndex++) {
    const globalIndex = importedFuncCount + funcIndex;
    const func = moduleInfo.functions[funcIndex];
    const instructions = func.instructions || InstructionDecoder.decodeFunctionBody(func.body);
    const targets = new Set<number>();

    for (const instruction of instructions) {
      if (instruction.opCode.mnemonic === 'call' || instruction.opCode.mnemonic === 'return_call') {
        const targetIndex = instruction.immediates.values[0] as number;
        targets.add(targetIndex);
      }
    }

    callees.set(globalIndex, targets);
    for (const target of targets) {
      if (!callers.has(target)) {
        callers.set(target, new Set());
      }
      callers.get(target)!.add(globalIndex);
    }
  }

  return { callees, callers };
}

export default class Explorer {
  private container: HTMLElement;
  private moduleInfo: ModuleInfo | null = null;
  private byteRanges: ByteRangeMap | null = null;
  private rawBytes: Uint8Array | null = null;
  private fileName: string = '';
  private selectedNode: TreeNode | null = null;
  private treeContainer: HTMLElement | null = null;
  private detailContainer: HTMLElement | null = null;
  private breadcrumbBar: HTMLElement | null = null;
  private treeNodes: TreeNode[] = [];
  private disassembler: Disassembler | null = null;
  private cachedFullWat: string | null = null;
  private callGraph: CallGraphData | null = null;
  private cachedStrings: ExtractedString[] | null = null;
  private dwarfInfo: DwarfDebugInfo | null | undefined = undefined;
  private dwarfFunctionMap: Map<number, string> | null = null;
  private nameResolver: NameResolver | null = null;
  private searchQuery: string = '';
  private visibleNodes: TreeNode[] = [];
  private searchInput: HTMLInputElement | null = null;
  private parsedSourceMap: ParsedSourceMap | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderDropZone();
  }

  loadSourceMap(json: string): void {
    this.parsedSourceMap = parseSourceMap(json);
  }

  private getFunctionName(globalIndex: number): string | null {
    if (this.moduleInfo?.nameSection?.functionNames?.has(globalIndex)) {
      return this.moduleInfo.nameSection.functionNames.get(globalIndex)!;
    }
    const dwarfMap = this.getDwarfFunctionMap();
    if (dwarfMap) {
      return dwarfMap.get(globalIndex) || null;
    }
    return null;
  }

  private getDwarfFunctionMap(): Map<number, string> | null {
    if (this.dwarfFunctionMap !== null) {
      return this.dwarfFunctionMap;
    }

    const dwarfData = this.getDwarfInfo();
    if (!dwarfData || dwarfData.functions.length === 0 || !this.moduleInfo || !this.byteRanges) {
      return null;
    }

    this.dwarfFunctionMap = new Map<number, string>();
    const importedFuncCount = this.moduleInfo.imports.filter(imp => imp.kind === 0).length;

    const codeSectionRange = this.byteRanges.sections.find(section => section.sectionId === 10);
    if (!codeSectionRange) {
      return this.dwarfFunctionMap;
    }

    const codeSectionBodyOffset = this.findCodeSectionDataOffset(codeSectionRange.offset);

    const offsets = [codeSectionBodyOffset, codeSectionRange.offset, 0];

    for (const baseOffset of offsets) {
      for (let funcIndex = 0; funcIndex < this.moduleInfo.functions.length; funcIndex++) {
        const globalIndex = importedFuncCount + funcIndex;
        const byteRange = this.byteRanges.getItem('function', funcIndex);
        if (!byteRange) {
          continue;
        }

        const relativeOffset = byteRange.offset - baseOffset;

        const match = dwarfData.functions.find(
          dwarfFunc => dwarfFunc.lowPc >= relativeOffset && dwarfFunc.lowPc < relativeOffset + byteRange.length
        );
        if (match) {
          this.dwarfFunctionMap.set(globalIndex, match.name);
        }
      }
      if (this.dwarfFunctionMap.size > 0) {
        break;
      }
    }

    if (this.dwarfFunctionMap.size === 0 && dwarfData.functions.length > 0) {
      const sortedDwarfFuncs = [...dwarfData.functions]
        .filter(dwarfFunc => dwarfFunc.name.length > 0)
        .sort((funcA, funcB) => funcA.lowPc - funcB.lowPc);

      for (let funcIndex = 0; funcIndex < Math.min(this.moduleInfo.functions.length, sortedDwarfFuncs.length); funcIndex++) {
        const globalIndex = importedFuncCount + funcIndex;
        this.dwarfFunctionMap.set(globalIndex, sortedDwarfFuncs[funcIndex].name);
      }
    }

    return this.dwarfFunctionMap;
  }

  private buildDwarfLocalNameMap(): Map<number, Map<number, string>> | null {
    const dwarfData = this.getDwarfInfo();
    if (!dwarfData || dwarfData.functions.length === 0 || !this.moduleInfo) {
      return null;
    }

    const dwarfFuncMap = this.getDwarfFunctionMap();
    if (!dwarfFuncMap || dwarfFuncMap.size === 0) {
      return null;
    }

    // Build a reverse map: DWARF function name → DWARF function object
    const dwarfFuncByName = new Map<string, import('./DwarfParser').DwarfFunction>();
    for (const func of dwarfData.functions) {
      if (func.name) {
        dwarfFuncByName.set(func.name, func);
      }
    }

    const result = new Map<number, Map<number, string>>();
    for (const [globalIndex, funcName] of dwarfFuncMap) {
      const dwarfFunc = dwarfFuncByName.get(funcName);
      if (!dwarfFunc) {
        continue;
      }
      const localMap = new Map<number, string>();
      for (const param of dwarfFunc.parameters) {
        if (param.wasmLocal !== null) {
          localMap.set(param.wasmLocal, param.name);
        }
      }
      for (const variable of dwarfFunc.variables) {
        if (variable.wasmLocal !== null) {
          localMap.set(variable.wasmLocal, variable.name);
        }
      }
      if (localMap.size > 0) {
        result.set(globalIndex, localMap);
      }
    }

    return result.size > 0 ? result : null;
  }

  private findDwarfFunction(localFuncIndex: number): import('./DwarfParser').DwarfFunction | null {
    const dwarfData = this.getDwarfInfo();
    if (!dwarfData || dwarfData.functions.length === 0 || !this.byteRanges) {
      return null;
    }

    const byteRange = this.byteRanges.getItem('function', localFuncIndex);
    if (!byteRange) {
      return null;
    }

    const codeSectionRange = this.byteRanges.sections.find(section => section.sectionId === 10);
    if (!codeSectionRange) {
      return null;
    }

    const codeSectionBodyOffset = this.findCodeSectionDataOffset(codeSectionRange.offset);

    for (const baseOffset of [codeSectionBodyOffset, codeSectionRange.offset, 0]) {
      const relativeOffset = byteRange.offset - baseOffset;
      const match = dwarfData.functions.find(
        dwarfFunc => dwarfFunc.lowPc >= relativeOffset && dwarfFunc.lowPc < relativeOffset + byteRange.length
      );
      if (match) {
        return match;
      }
    }

    return null;
  }

  private findCodeSectionDataOffset(codeSectionStart: number): number {
    if (!this.rawBytes) {
      return codeSectionStart;
    }
    let offset = codeSectionStart;
    offset++;
    let byte: number;
    do {
      byte = this.rawBytes[offset++];
    } while (byte & 0x80);
    return offset;
  }

  private getNameSource(globalFuncIndex: number): string | null {
    if (this.moduleInfo?.nameSection?.functionNames?.has(globalFuncIndex)) {
      return 'WASM name section';
    }
    const dwarfMap = this.getDwarfFunctionMap();
    if (dwarfMap && dwarfMap.has(globalFuncIndex)) {
      return 'DWARF debug info';
    }
    return null;
  }

  private getCallGraph(): CallGraphData {
    if (!this.callGraph && this.moduleInfo) {
      this.callGraph = buildCallGraph(this.moduleInfo);
    }
    return this.callGraph!;
  }

  private getDwarfInfo(): DwarfDebugInfo | null {
    if (this.dwarfInfo === undefined) {
      if (this.moduleInfo) {
        this.dwarfInfo = parseDwarfDebugInfo(this.moduleInfo.customSections);
      } else {
        return null;
      }
    }
    return this.dwarfInfo;
  }

  private detectSourceMappingUrl(): void {
    if (!this.moduleInfo) {
      return;
    }

    const sourceMappingSection = this.moduleInfo.customSections.find(
      section => section.name === 'sourceMappingURL'
    );
    if (!sourceMappingSection) {
      return;
    }

    const decoder = new TextDecoder('utf-8');
    const sourceMapUrl = decoder.decode(sourceMappingSection.data);

    if (sourceMapUrl.startsWith('data:application/json;base64,')) {
      const base64Data = sourceMapUrl.slice('data:application/json;base64,'.length);
      const jsonString = atob(base64Data);
      this.parsedSourceMap = parseSourceMap(jsonString);
    }
  }

  private renderSourceTabContent(tabContent: HTMLElement, funcIndex: number): void {
    if (!this.parsedSourceMap || !this.byteRanges) {
      const placeholder = document.createElement('div');
      placeholder.className = 'detail-placeholder';
      placeholder.textContent = 'No source map loaded.';
      tabContent.appendChild(placeholder);
      return;
    }

    const byteRange = this.byteRanges.getItem('function', funcIndex);
    if (!byteRange) {
      const placeholder = document.createElement('div');
      placeholder.className = 'detail-placeholder';
      placeholder.textContent = 'No byte range information available for this function.';
      tabContent.appendChild(placeholder);
      return;
    }

    const startMapping = lookupMapping(this.parsedSourceMap.mappings, byteRange.offset);
    if (!startMapping) {
      const placeholder = document.createElement('div');
      placeholder.className = 'detail-placeholder';
      placeholder.textContent = 'No source mapping found for this function.';
      tabContent.appendChild(placeholder);
      return;
    }

    const endOffset = byteRange.offset + byteRange.length;
    const relevantMappings: SourceMapping[] = [];
    for (const mapping of this.parsedSourceMap.mappings) {
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

    const sourceFileName = this.parsedSourceMap.sources[startMapping.sourceIndex] || 'unknown';
    const sourceRoot = this.parsedSourceMap.sourceRoot;
    const fullSourcePath = sourceRoot ? sourceRoot + sourceFileName : sourceFileName;

    const fileLabel = document.createElement('div');
    fileLabel.className = 'source-file-label';
    fileLabel.textContent = fullSourcePath;
    tabContent.appendChild(fileLabel);

    const sourceContent = this.parsedSourceMap.sourcesContent[startMapping.sourceIndex];
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
    wrapper.appendChild(this.createCopyButton(
      sourceLines.slice(displayStart, displayEnd + 1).join('\n')
    ));
    tabContent.appendChild(wrapper);
  }

  private renderDropZone(): void {
    this.container.innerHTML = '';
    const dropZone = document.createElement('div');
    dropZone.className = 'explorer-drop-zone';

    const icon = document.createElement('div');
    icon.className = 'drop-zone-icon';
    icon.textContent = '\u{1F4C2}';
    dropZone.appendChild(icon);

    const message = document.createElement('div');
    message.className = 'drop-zone-message';
    message.textContent = 'Drop a .wasm file here or click to open';
    dropZone.appendChild(message);

    const hint = document.createElement('div');
    hint.className = 'drop-zone-hint';
    hint.textContent = 'Supports any valid WebAssembly binary';
    dropZone.appendChild(hint);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.wasm';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        this.loadFile(fileInput.files[0]);
      }
    });

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropZone.classList.remove('drag-over');
      if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        this.loadFile(event.dataTransfer.files[0]);
      }
    });

    this.container.appendChild(dropZone);
    this.container.appendChild(fileInput);
  }

  private async loadFile(file: File): Promise<void> {
    this.fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    this.rawBytes = new Uint8Array(arrayBuffer);

    try {
      const reader = new BinaryReader(this.rawBytes);
      this.moduleInfo = reader.read();
      this.byteRanges = buildByteRanges(this.rawBytes);
      this.disassembler = new Disassembler(this.moduleInfo);
      this.cachedFullWat = null;
      this.callGraph = null;
      this.cachedStrings = null;
      this.dwarfFunctionMap = null;
      const hasDebugSections = this.moduleInfo.customSections.some(
        section => section.name === '.debug_info'
      );
      if (hasDebugSections) {
        this.dwarfInfo = parseDwarfDebugInfo(this.moduleInfo.customSections);
      } else {
        this.dwarfInfo = null;
      }
      const dwarfMap = this.getDwarfFunctionMap();
      const dwarfLocalNames = this.buildDwarfLocalNameMap();
      this.nameResolver = createNameResolver(
        this.moduleInfo,
        dwarfMap ? (globalIndex: number) => dwarfMap.get(globalIndex) || null : undefined,
        dwarfLocalNames ? (funcGlobalIndex: number, localIndex: number) => {
          const funcLocals = dwarfLocalNames.get(funcGlobalIndex);
          return funcLocals?.get(localIndex) || null;
        } : undefined,
      );
      this.parsedSourceMap = null;
      this.detectSourceMappingUrl();
      this.renderExplorer();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.container.innerHTML = '';
      const errorDisplay = document.createElement('div');
      errorDisplay.className = 'explorer-error';
      errorDisplay.textContent = `Failed to parse ${this.fileName}: ${errorMessage}`;

      const retryButton = document.createElement('button');
      retryButton.className = 'explorer-retry-btn';
      retryButton.textContent = 'Load another file';
      retryButton.addEventListener('click', () => this.renderDropZone());

      this.container.appendChild(errorDisplay);
      this.container.appendChild(retryButton);
    }
  }

  private renderExplorer(): void {
    this.container.innerHTML = '';

    const toolbar = document.createElement('div');
    toolbar.className = 'explorer-toolbar';

    const fileLabel = document.createElement('span');
    fileLabel.className = 'explorer-file-label';
    fileLabel.textContent = this.fileName;
    toolbar.appendChild(fileLabel);

    if (this.rawBytes) {
      const sizeLabel = document.createElement('span');
      sizeLabel.className = 'explorer-size-label';
      sizeLabel.textContent = this.formatFileSize(this.rawBytes.length);
      toolbar.appendChild(sizeLabel);
    }

    const loadButton = document.createElement('button');
    loadButton.className = 'explorer-load-btn';
    loadButton.textContent = 'Open file';
    loadButton.addEventListener('click', () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.wasm';
      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
          this.loadFile(fileInput.files[0]);
        }
      });
      fileInput.click();
    });
    toolbar.appendChild(loadButton);

    // Source map loading is handled automatically via sourceMappingURL custom section

    const watSearchInput = document.createElement('input');
    watSearchInput.type = 'text';
    watSearchInput.placeholder = 'Search WAT...';
    watSearchInput.className = 'explorer-wat-search';
    watSearchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.searchWat(watSearchInput.value);
      }
    });
    toolbar.appendChild(watSearchInput);

    this.container.appendChild(toolbar);

    const splitView = document.createElement('div');
    splitView.className = 'explorer-split';

    const treePane = document.createElement('div');
    treePane.className = 'explorer-tree-pane';

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Filter tree...';
    this.searchInput.className = 'explorer-tree-search';
    this.searchInput.addEventListener('input', () => {
      this.searchQuery = this.searchInput!.value.toLowerCase().trim();
      this.renderTree();
    });
    this.searchInput.addEventListener('keydown', (event) => this.handleTreeKeydown(event));
    treePane.appendChild(this.searchInput);

    this.treeContainer = document.createElement('div');
    this.treeContainer.className = 'explorer-tree';
    this.treeContainer.tabIndex = 0;
    this.treeContainer.addEventListener('keydown', (event) => this.handleTreeKeydown(event));
    treePane.appendChild(this.treeContainer);

    const detailPane = document.createElement('div');
    detailPane.className = 'explorer-detail-pane';

    this.breadcrumbBar = document.createElement('div');
    this.breadcrumbBar.className = 'explorer-breadcrumbs';
    detailPane.appendChild(this.breadcrumbBar);

    this.detailContainer = document.createElement('div');
    this.detailContainer.className = 'explorer-detail';
    detailPane.appendChild(this.detailContainer);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'explorer-resize-handle';
    this.initExplorerResize(resizeHandle, treePane, splitView);

    splitView.appendChild(treePane);
    splitView.appendChild(resizeHandle);
    splitView.appendChild(detailPane);
    this.container.appendChild(splitView);

    this.buildTree();
    this.renderTree();

    const restored = this.restoreFromHash();
    if (!restored) {
      this.selectNode(this.treeNodes[0]);
    }

    this.container.addEventListener('dragover', (event) => {
      event.preventDefault();
    });
    this.container.addEventListener('drop', (event) => {
      event.preventDefault();
      if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        this.loadFile(event.dataTransfer.files[0]);
      }
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private buildTree(): void {
    if (!this.moduleInfo) {
      return;
    }
    const moduleNode = this.moduleInfo;
    this.treeNodes = [];

    const root: TreeNode = {
      label: this.fileName,
      section: 'module',
      index: -1,
      expanded: true,
      children: [],
    };

    if (moduleNode.types.length > 0) {
      const typesNode: TreeNode = {
        label: `Types (${moduleNode.types.length})`,
        section: 'types',
        index: -1,
        expanded: false,
        children: [],
      };
      let flatIndex = 0;
      for (let typeIndex = 0; typeIndex < moduleNode.types.length; typeIndex++) {
        const typeEntry = moduleNode.types[typeIndex];
        if (typeEntry.kind === 'rec') {
          const recNode: TreeNode = {
            label: `type ${flatIndex}: rec (${typeEntry.types.length} types)`,
            section: 'type',
            index: typeIndex,
            children: [],
          };
          for (let innerIndex = 0; innerIndex < typeEntry.types.length; innerIndex++) {
            recNode.children!.push({
              label: `type ${flatIndex}: ${this.formatTypeLabel(typeEntry.types[innerIndex])}`,
              section: 'type',
              index: typeIndex,
            });
            flatIndex++;
          }
          typesNode.children!.push(recNode);
        } else {
          typesNode.children!.push({
            label: `type ${flatIndex}: ${this.formatTypeLabel(typeEntry)}`,
            section: 'type',
            index: typeIndex,
          });
          flatIndex++;
        }
      }
      root.children!.push(typesNode);
    }

    if (moduleNode.imports.length > 0) {
      const importsNode: TreeNode = {
        label: `Imports (${moduleNode.imports.length})`,
        section: 'imports',
        index: -1,
        expanded: false,
        children: moduleNode.imports.map((importEntry, importIndex) => {
          let importTip = `${importEntry.moduleName}.${importEntry.fieldName}`;
          if (importEntry.typeIndex !== undefined) {
            importTip += `\ntype ${importEntry.typeIndex}`;
          }
          if (importEntry.memoryType) {
            importTip += `\npages: ${importEntry.memoryType.initial}..${importEntry.memoryType.maximum ?? ''}`;
          }
          return {
            label: `"${importEntry.moduleName}"."${importEntry.fieldName}" (${EXPORT_KIND_NAMES[importEntry.kind] || 'unknown'})`,
            section: 'import',
            index: importIndex,
            tooltip: importTip,
          };
        }),
      };
      root.children!.push(importsNode);
    }

    if (moduleNode.functions.length > 0) {
      const importedFuncCount = moduleNode.imports.filter(importEntry => importEntry.kind === 0).length;
      const allFlatTypes = flattenTypes(moduleNode);
      const functionsNode: TreeNode = {
        label: `Functions (${moduleNode.functions.length})`,
        section: 'functions',
        index: -1,
        expanded: false,
        children: moduleNode.functions.map((funcEntry, funcIndex) => {
          const globalIndex = importedFuncCount + funcIndex;
          const funcName = this.getFunctionName(globalIndex);
          let tipSignature = '';
          if (funcEntry.typeIndex < allFlatTypes.length && allFlatTypes[funcEntry.typeIndex].kind === 'func') {
            tipSignature = formatFuncType(allFlatTypes[funcEntry.typeIndex] as FuncTypeInfo);
          }
          const totalLocals = funcEntry.locals.reduce((sum, local) => sum + local.count, 0);
          const label = funcName ? funcName : `func_${globalIndex}`;
          return {
            label,
            section: 'function',
            index: funcIndex,
            tooltip: `func ${globalIndex}\n${tipSignature}\n${funcEntry.body.length} bytes, ${totalLocals} locals`,
          };
        }),
      };
      root.children!.push(functionsNode);
    }

    if (moduleNode.tables.length > 0) {
      const importedTableCount = moduleNode.imports.filter(importEntry => importEntry.kind === 1).length;
      const tablesNode: TreeNode = {
        label: `Tables (${moduleNode.tables.length})`,
        section: 'tables',
        index: -1,
        expanded: false,
        children: moduleNode.tables.map((tableEntry, tableIndex) => ({
          label: `table ${importedTableCount + tableIndex}: ${getValueTypeName(tableEntry.elementType)} (${tableEntry.initial}..${tableEntry.maximum ?? ''})`,
          section: 'table',
          index: tableIndex,
        })),
      };
      root.children!.push(tablesNode);
    }

    if (moduleNode.memories.length > 0) {
      const importedMemCount = moduleNode.imports.filter(importEntry => importEntry.kind === 2).length;
      const memoriesNode: TreeNode = {
        label: `Memories (${moduleNode.memories.length})`,
        section: 'memories',
        index: -1,
        expanded: false,
        children: moduleNode.memories.map((memoryEntry, memIndex) => {
          const flags: string[] = [];
          if (memoryEntry.shared) { flags.push('shared'); }
          if (memoryEntry.memory64) { flags.push('memory64'); }
          const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
          return {
            label: `memory ${importedMemCount + memIndex}: ${memoryEntry.initial}..${memoryEntry.maximum ?? ''}${flagStr}`,
            section: 'memory',
            index: memIndex,
          };
        }),
      };
      root.children!.push(memoriesNode);
    }

    if (moduleNode.globals.length > 0) {
      const importedGlobalCount = moduleNode.imports.filter(importEntry => importEntry.kind === 3).length;
      const globalsNode: TreeNode = {
        label: `Globals (${moduleNode.globals.length})`,
        section: 'globals',
        index: -1,
        expanded: false,
        children: moduleNode.globals.map((globalEntry, globalIndex) => {
          const globalIdx = importedGlobalCount + globalIndex;
          const globalName = moduleNode.nameSection?.globalNames?.get(globalIdx);
          const mutStr = globalEntry.mutable ? 'mut ' : '';
          const globalLabel = globalName || `global_${globalIdx}`;
          return {
            label: `${globalLabel}: ${mutStr}${getValueTypeName(globalEntry.valueType)}`,
            section: 'global',
            index: globalIndex,
          };
        }),
      };
      root.children!.push(globalsNode);
    }

    if (moduleNode.exports.length > 0) {
      const exportsNode: TreeNode = {
        label: `Exports (${moduleNode.exports.length})`,
        section: 'exports',
        index: -1,
        expanded: false,
        children: moduleNode.exports.map((exportEntry, exportIndex) => ({
          label: `"${exportEntry.name}" -> ${EXPORT_KIND_NAMES[exportEntry.kind] || 'unknown'} ${exportEntry.index}`,
          section: 'export',
          index: exportIndex,
          tooltip: `${EXPORT_KIND_NAMES[exportEntry.kind] || 'unknown'} index ${exportEntry.index}`,
        })),
      };
      root.children!.push(exportsNode);
    }

    if (moduleNode.start !== null) {
      root.children!.push({
        label: `Start (func ${moduleNode.start})`,
        section: 'start',
        index: moduleNode.start,
      });
    }

    if (moduleNode.elements.length > 0) {
      const elementsNode: TreeNode = {
        label: `Elements (${moduleNode.elements.length})`,
        section: 'elements',
        index: -1,
        expanded: false,
        children: moduleNode.elements.map((elementEntry, elemIndex) => {
          const passiveLabel = elementEntry.passive ? 'passive' : `table ${elementEntry.tableIndex}`;
          return {
            label: `elem ${elemIndex}: ${passiveLabel} (${elementEntry.functionIndices.length} entries)`,
            section: 'element',
            index: elemIndex,
          };
        }),
      };
      root.children!.push(elementsNode);
    }

    if (moduleNode.data.length > 0) {
      const dataNode: TreeNode = {
        label: `Data (${moduleNode.data.length})`,
        section: 'data-segments',
        index: -1,
        expanded: false,
        children: moduleNode.data.map((dataEntry, dataIndex) => {
          const passiveLabel = dataEntry.passive ? 'passive' : `memory ${dataEntry.memoryIndex}`;
          return {
            label: `data ${dataIndex}: ${passiveLabel} (${dataEntry.data.length} bytes)`,
            section: 'data',
            index: dataIndex,
          };
        }),
      };
      root.children!.push(dataNode);
    }

    if (moduleNode.tags.length > 0) {
      const tagsNode: TreeNode = {
        label: `Tags (${moduleNode.tags.length})`,
        section: 'tags',
        index: -1,
        expanded: false,
        children: moduleNode.tags.map((tagEntry, tagIndex) => ({
          label: `tag ${tagIndex}: type ${tagEntry.typeIndex}`,
          section: 'tag',
          index: tagIndex,
        })),
      };
      root.children!.push(tagsNode);
    }

    if (moduleNode.customSections.length > 0) {
      const customNode: TreeNode = {
        label: `Custom Sections (${moduleNode.customSections.length})`,
        section: 'custom-sections',
        index: -1,
        expanded: false,
        children: moduleNode.customSections.map((customEntry, customIndex) => ({
          label: `"${customEntry.name}" (${customEntry.data.length} bytes)`,
          section: 'custom',
          index: customIndex,
        })),
      };
      root.children!.push(customNode);
    }

    if (moduleNode.nameSection) {
      root.children!.push({
        label: 'Name Section',
        section: 'name-section',
        index: -1,
      });
    }

    {
      const sizeChildren: TreeNode[] = [
        { label: 'Section Breakdown', section: 'size-sections', index: -1 },
      ];
      if (moduleNode.functions.length > 0) {
        sizeChildren.push({ label: 'Function Sizes', section: 'size-functions', index: -1 });
      }
      if (moduleNode.data.length > 0) {
        sizeChildren.push({ label: 'Data Segment Sizes', section: 'size-data', index: -1 });
      }
      root.children!.push({
        label: 'Size Analysis',
        section: 'size-analysis',
        index: -1,
        children: sizeChildren,
      });
    }

    root.children!.push({
      label: 'Instruction Statistics',
      section: 'instruction-stats',
      index: -1,
    });

    const hasDebugSections = moduleNode.customSections.some(
      section => section.name.startsWith('.debug_')
    );
    if (hasDebugSections) {
      root.children!.push({
        label: 'Debug Info',
        section: 'debug-info',
        index: -1,
      });
    }

    if (moduleNode.data.length > 0) {
      root.children!.push({
        label: 'Strings',
        section: 'strings',
        index: -1,
      });
    }

    root.children!.push({
      label: 'Feature Detection',
      section: 'feature-detection',
      index: -1,
    });

    root.children!.push({
      label: 'Module Interface',
      section: 'module-interface',
      index: -1,
    });

    root.children!.push({
      label: 'Function Complexity',
      section: 'function-complexity',
      index: -1,
    });

    root.children!.push({
      label: 'Dead Code',
      section: 'dead-code',
      index: -1,
    });

    const hasProducers = moduleNode.customSections.some(section => section.name === 'producers');
    if (hasProducers) {
      root.children!.push({
        label: 'Producers',
        section: 'producers',
        index: -1,
      });
    }

    const hasTargetFeatures = moduleNode.customSections.some(section => section.name === 'target_features');
    if (hasTargetFeatures) {
      root.children!.push({
        label: 'Target Features',
        section: 'target-features',
        index: -1,
      });
    }

    this.treeNodes = [root];
  }

  private formatTypeLabel(typeEntry: TypeInfo): string {
    if (typeEntry.kind === 'func') {
      return `func ${formatFuncType(typeEntry)}`;
    }
    if (typeEntry.kind === 'struct') {
      return `struct (${typeEntry.fields.length} fields)`;
    }
    if (typeEntry.kind === 'array') {
      const mutStr = typeEntry.mutable ? 'mut ' : '';
      return `array (${mutStr}${getValueTypeName(typeEntry.elementType)})`;
    }
    return typeEntry.kind;
  }

  private renderTree(): void {
    if (!this.treeContainer) {
      return;
    }
    this.treeContainer.innerHTML = '';
    this.visibleNodes = [];
    for (const node of this.treeNodes) {
      this.renderTreeNode(this.treeContainer, node, 0);
    }
  }

  private matchesSearch(node: TreeNode): boolean {
    if (!this.searchQuery) {
      return true;
    }
    if (node.label.toLowerCase().includes(this.searchQuery)) {
      return true;
    }
    if (node.children) {
      return node.children.some(child => this.matchesSearch(child));
    }
    return false;
  }

  private renderTreeNode(parent: HTMLElement, node: TreeNode, depth: number): void {
    if (!this.matchesSearch(node)) {
      return;
    }

    const row = document.createElement('div');
    row.className = 'tree-row';
    if (this.selectedNode === node) {
      row.classList.add('selected');
    }
    row.style.paddingLeft = `${8 + depth * 16}px`;
    if (node.tooltip) {
      row.title = node.tooltip;
    }

    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = node.expanded || (this.searchQuery.length > 0 && hasChildren);

    if (hasChildren) {
      const chevron = document.createElement('span');
      chevron.className = 'tree-chevron';
      chevron.textContent = isExpanded ? '\u25BE' : '\u25B8';
      chevron.addEventListener('click', (event) => {
        event.stopPropagation();
        node.expanded = !node.expanded;
        this.renderTree();
      });
      row.appendChild(chevron);
    } else {
      const spacer = document.createElement('span');
      spacer.className = 'tree-chevron-spacer';
      row.appendChild(spacer);
    }

    const label = document.createElement('span');
    label.className = 'tree-label';
    label.textContent = node.label;
    row.appendChild(label);

    row.addEventListener('click', () => {
      if (hasChildren && !this.searchQuery) {
        node.expanded = !node.expanded;
      }
      this.selectNode(node);
    });

    parent.appendChild(row);
    this.visibleNodes.push(node);

    if (hasChildren && isExpanded) {
      for (const child of node.children!) {
        this.renderTreeNode(parent, child, depth + 1);
      }
    }
  }

  private handleTreeKeydown(event: KeyboardEvent): void {
    if (!this.visibleNodes.length) {
      return;
    }

    const currentIndex = this.selectedNode ? this.visibleNodes.indexOf(this.selectedNode) : -1;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = Math.min(currentIndex + 1, this.visibleNodes.length - 1);
      this.selectNode(this.visibleNodes[nextIndex]);
      this.scrollSelectedIntoView();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = Math.max(currentIndex - 1, 0);
      this.selectNode(this.visibleNodes[prevIndex]);
      this.scrollSelectedIntoView();
    } else if (event.key === 'ArrowRight' && this.selectedNode) {
      event.preventDefault();
      if (this.selectedNode.children && !this.selectedNode.expanded) {
        this.selectedNode.expanded = true;
        this.renderTree();
      }
    } else if (event.key === 'ArrowLeft' && this.selectedNode) {
      event.preventDefault();
      if (this.selectedNode.children && this.selectedNode.expanded) {
        this.selectedNode.expanded = false;
        this.renderTree();
      }
    } else if (event.key === 'Enter' && this.selectedNode) {
      event.preventDefault();
      this.renderDetail(this.selectedNode);
    }
  }

  private initExplorerResize(handle: HTMLElement, treePane: HTMLElement, splitView: HTMLElement): void {
    let isResizing = false;

    handle.addEventListener('mousedown', (event: MouseEvent) => {
      isResizing = true;
      handle.classList.add('active');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      event.preventDefault();
    });

    document.addEventListener('mousemove', (event: MouseEvent) => {
      if (!isResizing) {
        return;
      }
      const rect = splitView.getBoundingClientRect();
      const position = event.clientX - rect.left;
      const percentage = Math.max(15, Math.min(60, (position / rect.width) * 100));
      treePane.style.width = percentage + '%';
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        handle.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  private scrollSelectedIntoView(): void {
    if (!this.treeContainer) {
      return;
    }
    const selectedRow = this.treeContainer.querySelector('.tree-row.selected');
    if (selectedRow) {
      selectedRow.scrollIntoView({ block: 'nearest' });
    }
  }

  private selectNode(node: TreeNode, updateHash: boolean = true): void {
    this.selectedNode = node;
    this.renderTree();
    this.renderBreadcrumbs(node);
    this.renderDetail(node);
    if (updateHash) {
      this.updateHash(node);
    }
  }

  navigateToItem(section: string, index: number): void {
    const node = this.findNode(this.treeNodes, section, index);
    if (node) {
      this.expandParents(this.treeNodes, node);
      this.selectNode(node);
    }
  }

  private renderBreadcrumbs(node: TreeNode): void {
    if (!this.breadcrumbBar) {
      return;
    }
    const path = this.findPathToNode(this.treeNodes, node);
    if (path.length === 0) {
      return;
    }

    const breadcrumbBar = this.breadcrumbBar;
    breadcrumbBar.innerHTML = '';

    for (let pathIndex = 0; pathIndex < path.length; pathIndex++) {
      const pathNode = path[pathIndex];
      if (pathIndex > 0) {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = ' > ';
        breadcrumbBar.appendChild(separator);
      }

      if (pathIndex < path.length - 1) {
        const link = document.createElement('a');
        link.className = 'breadcrumb-link';
        link.textContent = pathNode.label;
        link.href = '#';
        link.addEventListener('click', (event) => {
          event.preventDefault();
          this.selectNode(pathNode);
        });
        breadcrumbBar.appendChild(link);
      } else {
        const current = document.createElement('span');
        current.className = 'breadcrumb-current';
        current.textContent = pathNode.label;
        breadcrumbBar.appendChild(current);
      }
    }
  }

  private findPathToNode(nodes: TreeNode[], target: TreeNode): TreeNode[] {
    for (const node of nodes) {
      if (node === target) {
        return [node];
      }
      if (node.children) {
        const childPath = this.findPathToNode(node.children, target);
        if (childPath.length > 0) {
          return [node, ...childPath];
        }
      }
    }
    return [];
  }

  private restoreFromHash(): boolean {
    const hash = location.hash.replace(/^#/, '');
    const parts = hash.split('/');
    if (parts.length >= 3 && parts[0] === 'explorer') {
      const section = parts[1];
      const index = parseInt(parts[2], 10);
      if (!isNaN(index)) {
        const node = this.findNode(this.treeNodes, section, index);
        if (node) {
          this.expandParents(this.treeNodes, node);
          this.selectNode(node, false);
          return true;
        }
      }
    }
    return false;
  }

  private updateHash(node: TreeNode): void {
    if (node.section === 'module') {
      history.replaceState(null, '', '#explorer');
    } else {
      history.replaceState(null, '', `#explorer/${node.section}/${node.index}`);
    }
  }

  private findNode(nodes: TreeNode[], section: string, index: number): TreeNode | null {
    for (const node of nodes) {
      if (node.section === section && node.index === index) {
        return node;
      }
      if (node.children) {
        const found = this.findNode(node.children, section, index);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  private getExportTargetSection(kind: number): string | null {
    const sectionMap: Record<number, string> = {
      0: 'function',
      1: 'table',
      2: 'memory',
      3: 'global',
      4: 'tag',
    };
    return sectionMap[kind] || null;
  }

  private getExportTargetItemIndex(kind: number, globalIndex: number): number {
    if (!this.moduleInfo) {
      return -1;
    }
    const importedCounts: Record<number, number> = {
      0: this.moduleInfo.imports.filter(importEntry => importEntry.kind === 0).length,
      1: this.moduleInfo.imports.filter(importEntry => importEntry.kind === 1).length,
      2: this.moduleInfo.imports.filter(importEntry => importEntry.kind === 2).length,
      3: this.moduleInfo.imports.filter(importEntry => importEntry.kind === 3).length,
      4: this.moduleInfo.imports.filter(importEntry => importEntry.kind === 4).length,
    };
    const importedCount = importedCounts[kind] || 0;
    return globalIndex - importedCount;
  }

  private findTopLevelTypeIndex(flatTypeIndex: number): number {
    if (!this.moduleInfo) {
      return -1;
    }
    let flatCounter = 0;
    for (let topIndex = 0; topIndex < this.moduleInfo.types.length; topIndex++) {
      const typeEntry = this.moduleInfo.types[topIndex];
      if (typeEntry.kind === 'rec') {
        if (flatTypeIndex >= flatCounter && flatTypeIndex < flatCounter + typeEntry.types.length) {
          return topIndex;
        }
        flatCounter += typeEntry.types.length;
      } else {
        if (flatCounter === flatTypeIndex) {
          return topIndex;
        }
        flatCounter++;
      }
    }
    return -1;
  }

  private expandParents(nodes: TreeNode[], target: TreeNode): boolean {
    for (const node of nodes) {
      if (node === target) {
        return true;
      }
      if (node.children) {
        if (this.expandParents(node.children, target)) {
          node.expanded = true;
          return true;
        }
      }
    }
    return false;
  }

  private renderDetail(node: TreeNode): void {
    if (!this.detailContainer || !this.moduleInfo) {
      return;
    }
    this.detailContainer.innerHTML = '';

    switch (node.section) {
      case 'module':
        this.renderModuleDetail();
        break;
      case 'types':
      case 'imports':
      case 'functions':
      case 'tables':
      case 'memories':
      case 'globals':
      case 'exports':
      case 'elements':
      case 'data-segments':
      case 'tags':
      case 'custom-sections':
        this.renderSectionSummary(node);
        break;
      case 'type':
        this.renderTypeDetail(node.index);
        break;
      case 'import':
        this.renderImportDetail(node.index);
        break;
      case 'function':
        this.renderFunctionDetail(node.index);
        break;
      case 'table':
        this.renderTableDetail(node.index);
        break;
      case 'memory':
        this.renderMemoryDetail(node.index);
        break;
      case 'global':
        this.renderGlobalDetail(node.index);
        break;
      case 'export':
        this.renderExportDetail(node.index);
        break;
      case 'start':
        this.renderStartDetail();
        break;
      case 'element':
        this.renderElementDetail(node.index);
        break;
      case 'data':
        this.renderDataDetail(node.index);
        break;
      case 'tag':
        this.renderTagDetail(node.index);
        break;
      case 'custom':
        this.renderCustomSectionDetail(node.index);
        break;
      case 'name-section':
        this.renderNameSectionDetail();
        break;
      case 'size-analysis':
        this.renderSizeAnalysisSummary();
        break;
      case 'size-sections':
        this.renderSizeSections();
        break;
      case 'size-functions':
        this.renderSizeFunctions();
        break;
      case 'size-data':
        this.renderSizeData();
        break;
      case 'strings':
        this.renderStringsView();
        break;
      case 'instruction-stats':
        this.renderInstructionStats();
        break;
      case 'debug-info':
        this.renderDebugInfo();
        break;
      case 'feature-detection':
        this.renderFeatureDetection();
        break;
      case 'module-interface':
        this.renderModuleInterface();
        break;
      case 'function-complexity':
        this.renderFunctionComplexity();
        break;
      case 'dead-code':
        this.renderDeadCode();
        break;
      case 'producers':
        this.renderProducers();
        break;
      case 'target-features':
        this.renderTargetFeatures();
        break;
    }
  }

  private renderModuleDetail(): void {
    if (!this.moduleInfo || !this.rawBytes) {
      return;
    }
    const detail = this.detailContainer!;

    this.appendHeading(detail, this.fileName);

    const table = this.createInfoTable();
    this.addInfoRow(table, 'Version', String(this.moduleInfo.version));
    this.addInfoRow(table, 'File size', this.formatFileSize(this.rawBytes.length));
    this.addInfoRow(table, 'Types', String(this.moduleInfo.types.length));
    this.addInfoRow(table, 'Imports', String(this.moduleInfo.imports.length));
    this.addInfoRow(table, 'Functions', String(this.moduleInfo.functions.length));
    this.addInfoRow(table, 'Tables', String(this.moduleInfo.tables.length));
    this.addInfoRow(table, 'Memories', String(this.moduleInfo.memories.length));
    this.addInfoRow(table, 'Globals', String(this.moduleInfo.globals.length));
    this.addInfoRow(table, 'Exports', String(this.moduleInfo.exports.length));
    this.addInfoRow(table, 'Start', this.moduleInfo.start !== null ? `func ${this.moduleInfo.start}` : 'none');
    this.addInfoRow(table, 'Elements', String(this.moduleInfo.elements.length));
    this.addInfoRow(table, 'Data segments', String(this.moduleInfo.data.length));
    this.addInfoRow(table, 'Tags', String(this.moduleInfo.tags.length));
    this.addInfoRow(table, 'Custom sections', String(this.moduleInfo.customSections.length));
    detail.appendChild(table);

    if (this.byteRanges && this.byteRanges.sections.length > 0) {
      this.appendSubheading(detail, 'Sections');
      const sectionTable = this.createInfoTable();
      for (const sectionRange of this.byteRanges.sections) {
        const sectionName = SECTION_NAMES[sectionRange.sectionId] || `Unknown (${sectionRange.sectionId})`;
        this.addInfoRow(sectionTable, sectionName, `offset 0x${sectionRange.offset.toString(16)}, ${sectionRange.length} bytes`);
      }
      detail.appendChild(sectionTable);
    }

    this.appendSubheading(detail, 'Header');
    this.appendHexDump(detail, this.rawBytes.slice(0, 8), 0);

    this.appendSubheading(detail, 'Full WAT');
    const showWatButton = document.createElement('button');
    showWatButton.className = 'explorer-load-btn';
    showWatButton.textContent = 'Generate full disassembly';
    showWatButton.addEventListener('click', () => {
      if (this.disassembler) {
        if (!this.cachedFullWat) {
          this.cachedFullWat = this.disassembler.disassemble();
        }
        showWatButton.remove();
        this.appendCodeBlock(detail, this.cachedFullWat);
      }
    });
    detail.appendChild(showWatButton);
  }

  private renderSectionSummary(node: TreeNode): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    this.appendHeading(detail, node.label);

    const sectionDescription = this.getSectionDescription(node.section);
    if (sectionDescription) {
      const descriptionElement = document.createElement('div');
      descriptionElement.className = 'detail-description';
      descriptionElement.textContent = sectionDescription;
      detail.appendChild(descriptionElement);
    }
  }

  private getSectionDescription(section: string): string {
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

  private renderTypeDetail(typeIndex: number): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const typeEntry = this.moduleInfo.types[typeIndex];

    this.appendHeading(detail, `Type ${typeIndex}`);

    if (typeEntry.kind === 'func') {
      const table = this.createInfoTable();
      this.addInfoRow(table, 'Kind', 'func');
      this.addInfoRow(table, 'Parameters', typeEntry.parameterTypes.map(p => getValueTypeName(p)).join(', ') || 'none');
      this.addInfoRow(table, 'Returns', typeEntry.returnTypes.map(r => getValueTypeName(r)).join(', ') || 'none');
      detail.appendChild(table);
    } else if (typeEntry.kind === 'struct') {
      const table = this.createInfoTable();
      this.addInfoRow(table, 'Kind', 'struct');
      this.addInfoRow(table, 'Fields', String(typeEntry.fields.length));
      if (typeEntry.superTypes && typeEntry.superTypes.length > 0) {
        this.addInfoRow(table, 'Super types', typeEntry.superTypes.join(', '));
      }
      if (typeEntry.final !== undefined) {
        this.addInfoRow(table, 'Final', String(typeEntry.final));
      }
      detail.appendChild(table);

      if (typeEntry.fields.length > 0) {
        this.appendSubheading(detail, 'Fields');
        const fieldsTable = this.createInfoTable();
        for (let fieldIndex = 0; fieldIndex < typeEntry.fields.length; fieldIndex++) {
          const field = typeEntry.fields[fieldIndex];
          const mutLabel = field.mutable ? 'mut ' : '';
          this.addInfoRow(fieldsTable, `field ${fieldIndex}`, `${mutLabel}${getValueTypeName(field.type)}`);
        }
        detail.appendChild(fieldsTable);
      }
    } else if (typeEntry.kind === 'array') {
      const table = this.createInfoTable();
      this.addInfoRow(table, 'Kind', 'array');
      this.addInfoRow(table, 'Element type', getValueTypeName(typeEntry.elementType));
      this.addInfoRow(table, 'Mutable', String(typeEntry.mutable));
      detail.appendChild(table);
    } else if (typeEntry.kind === 'rec') {
      const table = this.createInfoTable();
      this.addInfoRow(table, 'Kind', 'rec group');
      this.addInfoRow(table, 'Types', String(typeEntry.types.length));
      detail.appendChild(table);
    }

    this.appendSubheading(detail, 'WAT');
    if (this.disassembler) {
      this.appendCodeBlock(detail, this.disassembler.disassembleType(typeIndex));
    }

    this.appendByteRange(detail, 'type', typeIndex);
  }

  private renderImportDetail(importIndex: number): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const importEntry = this.moduleInfo.imports[importIndex];

    this.appendHeading(detail, `Import ${importIndex}`);

    const table = this.createInfoTable();
    this.addInfoRow(table, 'Module', importEntry.moduleName);
    this.addInfoRow(table, 'Field', importEntry.fieldName);
    this.addInfoRow(table, 'Kind', EXPORT_KIND_NAMES[importEntry.kind] || `unknown (${importEntry.kind})`);

    if (importEntry.typeIndex !== undefined) {
      const topLevelTypeIdx = this.findTopLevelTypeIndex(importEntry.typeIndex);
      this.addLinkedInfoRow(table, 'Type index', String(importEntry.typeIndex), 'type', topLevelTypeIdx);
      const flatTypes = flattenTypes(this.moduleInfo);
      if (importEntry.typeIndex < flatTypes.length) {
        const typeEntry = flatTypes[importEntry.typeIndex];
        if (typeEntry.kind === 'func') {
          this.addInfoRow(table, 'Signature', formatFuncType(typeEntry));
        }
      }
    }
    if (importEntry.tableType) {
      this.addInfoRow(table, 'Element type', getValueTypeName(importEntry.tableType.elementType));
      this.addInfoRow(table, 'Initial', String(importEntry.tableType.initial));
      if (importEntry.tableType.maximum !== null) {
        this.addInfoRow(table, 'Maximum', String(importEntry.tableType.maximum));
      }
    }
    if (importEntry.memoryType) {
      this.addInfoRow(table, 'Initial pages', String(importEntry.memoryType.initial));
      if (importEntry.memoryType.maximum !== null) {
        this.addInfoRow(table, 'Maximum pages', String(importEntry.memoryType.maximum));
      }
      if (importEntry.memoryType.shared) { this.addInfoRow(table, 'Shared', 'true'); }
      if (importEntry.memoryType.memory64) { this.addInfoRow(table, 'Memory64', 'true'); }
    }
    if (importEntry.globalType) {
      const mutStr = importEntry.globalType.mutable ? 'mut ' : '';
      this.addInfoRow(table, 'Type', `${mutStr}${getValueTypeName(importEntry.globalType.valueType)}`);
    }
    if (importEntry.tagType) {
      this.addInfoRow(table, 'Tag type index', String(importEntry.tagType.typeIndex));
    }

    detail.appendChild(table);

    this.appendSubheading(detail, 'WAT');
    if (this.disassembler) {
      this.appendCodeBlock(detail, this.disassembler.disassembleImport(importIndex));
    }

    this.appendByteRange(detail, 'import', importIndex);
  }

  private renderFunctionDetail(funcIndex: number): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const funcEntry = this.moduleInfo.functions[funcIndex];
    const importedFuncCount = this.moduleInfo.imports.filter(importEntry => importEntry.kind === 0).length;
    const globalFuncIndex = importedFuncCount + funcIndex;
    const funcName = this.getFunctionName(globalFuncIndex);

    const rawName = this.moduleInfo.nameSection?.functionNames?.get(globalFuncIndex) || null;
    const heading = funcName || `func_${globalFuncIndex}`;
    this.appendHeading(detail, heading);

    const flatTypes = flattenTypes(this.moduleInfo);
    const table = this.createInfoTable();
    this.addInfoRow(table, 'Index', String(globalFuncIndex));
    if (funcName) { this.addInfoRow(table, 'Name', funcName); }
    if (rawName && rawName !== funcName) { this.addInfoRow(table, 'Raw name', rawName); }
    const topLevelFuncTypeIdx = this.findTopLevelTypeIndex(funcEntry.typeIndex);
    this.addLinkedInfoRow(table, 'Type index', String(funcEntry.typeIndex), 'type', topLevelFuncTypeIdx);

    if (funcEntry.typeIndex < flatTypes.length) {
      const typeEntry = flatTypes[funcEntry.typeIndex];
      if (typeEntry.kind === 'func') {
        this.addInfoRow(table, 'Signature', formatFuncType(typeEntry));
      }
    }

    if (funcEntry.locals.length > 0) {
      const totalLocals = funcEntry.locals.reduce((sum, local) => sum + local.count, 0);
      this.addInfoRow(table, 'Locals', String(totalLocals));
    }
    this.addInfoRow(table, 'Body size', `${funcEntry.body.length} bytes`);

    const dwarfFunc = this.findDwarfFunction(funcIndex);
    if (dwarfFunc) {
      const dwarfData = this.getDwarfInfo();
      if (dwarfFunc.linkageName) {
        this.addInfoRow(table, 'Linkage name', dwarfFunc.linkageName);
      }
      if (dwarfFunc.declFile > 0 && dwarfData && dwarfFunc.declFile <= dwarfData.sourceFiles.length) {
        const sourceFile = dwarfData.sourceFiles[dwarfFunc.declFile - 1];
        this.addInfoRow(table, 'Source', `${sourceFile}:${dwarfFunc.declLine}`);
      }
    }

    detail.appendChild(table);

    const hasLocalNames = this.moduleInfo.nameSection?.localNames?.has(globalFuncIndex);
    if (funcEntry.locals.length > 0 && hasLocalNames) {
      this.appendSubheading(detail, 'Named Locals');
      const localsTable = this.createInfoTable();
      let localOffset = 0;
      const funcType = funcEntry.typeIndex < flatTypes.length ? flatTypes[funcEntry.typeIndex] : null;
      const paramCount = funcType && funcType.kind === 'func' ? funcType.parameterTypes.length : 0;
      for (const localGroup of funcEntry.locals) {
        for (let localIndex = 0; localIndex < localGroup.count; localIndex++) {
          const absoluteLocalIndex = paramCount + localOffset;
          const localName = this.moduleInfo.nameSection?.localNames?.get(globalFuncIndex)?.get(absoluteLocalIndex);
          if (localName) {
            this.addInfoRow(localsTable, `${localName} (local ${absoluteLocalIndex})`, getValueTypeName(localGroup.type));
          }
          localOffset++;
        }
      }
      detail.appendChild(localsTable);
    }

    {
      const callGraphData = this.getCallGraph();
      const calleesSet = callGraphData.callees.get(globalFuncIndex);
      const callersSet = callGraphData.callers.get(globalFuncIndex);

      if ((calleesSet && calleesSet.size > 0) || (callersSet && callersSet.size > 0)) {
        this.appendSubheading(detail, 'Call Graph');
      }

      if (calleesSet && calleesSet.size > 0) {
        this.appendCallList(detail, 'Calls', calleesSet);
      }
      if (callersSet && callersSet.size > 0) {
        this.appendCallList(detail, 'Called by', callersSet);
      }
    }

    const nameSource = this.getNameSource(globalFuncIndex);
    if (nameSource) {
      this.addInfoRow(table, 'Name source', nameSource);
    }

    const tabContainer = document.createElement('div');
    tabContainer.className = 'func-tab-container';

    const tabBar = document.createElement('div');
    tabBar.className = 'func-tab-bar';

    const tabContent = document.createElement('div');
    tabContent.className = 'func-tab-content';

    const tabs: { label: string; id: string }[] = [
      { label: 'WAT', id: 'wat' },
      { label: 'Bytes', id: 'bytes' },
      { label: 'Decompiled', id: 'decompiled' },
      { label: 'Source', id: 'source' },
    ];

    let activeTab = 'decompiled';

    const renderTabContent = (): void => {
      tabContent.innerHTML = '';
      tabBar.querySelectorAll('.func-tab-btn').forEach(btn => {
        btn.classList.toggle('active', (btn as HTMLElement).dataset.tab === activeTab);
      });

      if (activeTab === 'decompiled') {
        if (this.nameResolver && this.moduleInfo) {
          const decompiledCode = decompileFunction(this.moduleInfo, funcIndex, this.nameResolver);

          // Build function name → local index map for clickable calls
          const funcNameMap = new Map<string, number>();
          const importedFuncCount = this.moduleInfo.imports.filter((imp: { kind: number }) => imp.kind === 0).length;
          for (let localFuncIdx = 0; localFuncIdx < this.moduleInfo.functions.length; localFuncIdx++) {
            const globalFuncIdx = importedFuncCount + localFuncIdx;
            const nameRes = this.nameResolver.functionName(globalFuncIdx);
            funcNameMap.set(nameRes.name, localFuncIdx);
          }

          const highlightOptions: HighlightOptions = {
            onFunctionClick: (functionName: string) => {
              const targetLocalIdx = funcNameMap.get(functionName);
              if (targetLocalIdx !== undefined) {
                this.navigateToItem('function', targetLocalIdx);
              }
            },
          };

          const block = document.createElement('div');
          block.className = 'detail-code';
          const lines = decompiledCode.split('\n');
          const gutterWidth = String(lines.length).length;
          for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            const lineEl = document.createElement('div');
            lineEl.className = 'code-line';
            const gutter = document.createElement('span');
            gutter.className = 'code-line-number';
            gutter.textContent = String(lineIdx + 1).padStart(gutterWidth, ' ');
            lineEl.appendChild(gutter);
            const content = document.createElement('span');
            content.className = 'code-line-content';
            renderHighlightedC(content, lines[lineIdx], highlightOptions);
            lineEl.appendChild(content);
            block.appendChild(lineEl);
          }
          const wrapper = document.createElement('div');
          wrapper.className = 'detail-block-wrapper';
          wrapper.appendChild(block);
          wrapper.appendChild(this.createCopyButton(decompiledCode));
          tabContent.appendChild(wrapper);
        }
      } else if (activeTab === 'wat') {
        if (this.disassembler) {
          this.appendCodeBlock(tabContent, this.disassembler.disassembleFunction(funcIndex));
        }
      } else if (activeTab === 'bytes') {
        this.appendByteRange(tabContent, 'function', funcIndex);
      } else if (activeTab === 'source') {
        this.renderSourceTabContent(tabContent, funcIndex);
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

  private renderTableDetail(tableIndex: number): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const tableEntry = this.moduleInfo.tables[tableIndex];
    const importedTableCount = this.moduleInfo.imports.filter(importEntry => importEntry.kind === 1).length;

    this.appendHeading(detail, `Table ${importedTableCount + tableIndex}`);

    const table = this.createInfoTable();
    this.addInfoRow(table, 'Element type', getValueTypeName(tableEntry.elementType));
    this.addInfoRow(table, 'Initial', String(tableEntry.initial));
    if (tableEntry.maximum !== null) {
      this.addInfoRow(table, 'Maximum', String(tableEntry.maximum));
    }
    detail.appendChild(table);

    this.appendSubheading(detail, 'WAT');
    if (this.disassembler) {
      this.appendCodeBlock(detail, this.disassembler.disassembleTable(tableIndex));
    }

    this.appendByteRange(detail, 'table', tableIndex);
  }

  private renderMemoryDetail(memIndex: number): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const memoryEntry = this.moduleInfo.memories[memIndex];
    const importedMemCount = this.moduleInfo.imports.filter(importEntry => importEntry.kind === 2).length;

    this.appendHeading(detail, `Memory ${importedMemCount + memIndex}`);

    const table = this.createInfoTable();
    this.addInfoRow(table, 'Initial pages', String(memoryEntry.initial));
    if (memoryEntry.maximum !== null) {
      this.addInfoRow(table, 'Maximum pages', String(memoryEntry.maximum));
    }
    this.addInfoRow(table, 'Initial size', this.formatFileSize(memoryEntry.initial * 65536));
    if (memoryEntry.shared) { this.addInfoRow(table, 'Shared', 'true'); }
    if (memoryEntry.memory64) { this.addInfoRow(table, 'Memory64', 'true'); }
    detail.appendChild(table);

    this.appendSubheading(detail, 'WAT');
    if (this.disassembler) {
      this.appendCodeBlock(detail, this.disassembler.disassembleMemory(memIndex));
    }

    this.appendByteRange(detail, 'memory', memIndex);
  }

  private renderGlobalDetail(globalIndex: number): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const globalEntry = this.moduleInfo.globals[globalIndex];
    const importedGlobalCount = this.moduleInfo.imports.filter(importEntry => importEntry.kind === 3).length;
    const absoluteGlobalIndex = importedGlobalCount + globalIndex;
    const globalName = this.moduleInfo.nameSection?.globalNames?.get(absoluteGlobalIndex);

    this.appendHeading(detail, globalName || `global_${absoluteGlobalIndex}`);

    const table = this.createInfoTable();
    this.addInfoRow(table, 'Type', getValueTypeName(globalEntry.valueType));
    this.addInfoRow(table, 'Mutable', String(globalEntry.mutable));

    detail.appendChild(table);

    this.appendSubheading(detail, 'WAT');
    if (this.disassembler) {
      this.appendCodeBlock(detail, this.disassembler.disassembleGlobal(globalIndex));
    }

    this.appendByteRange(detail, 'global', globalIndex);
  }

  private renderExportDetail(exportIndex: number): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const exportEntry = this.moduleInfo.exports[exportIndex];

    this.appendHeading(detail, `Export "${exportEntry.name}"`);

    const table = this.createInfoTable();
    this.addInfoRow(table, 'Name', exportEntry.name);
    this.addInfoRow(table, 'Kind', EXPORT_KIND_NAMES[exportEntry.kind] || `unknown (${exportEntry.kind})`);

    const exportTargetSection = this.getExportTargetSection(exportEntry.kind);
    const exportTargetIndex = this.getExportTargetItemIndex(exportEntry.kind, exportEntry.index);
    if (exportTargetSection && exportTargetIndex >= 0) {
      this.addLinkedInfoRow(table, 'Target', `${EXPORT_KIND_NAMES[exportEntry.kind]} ${exportEntry.index}`, exportTargetSection, exportTargetIndex);
    } else {
      this.addInfoRow(table, 'Index', String(exportEntry.index));
    }

    if (exportEntry.kind === 0 && this.moduleInfo.nameSection?.functionNames) {
      const funcName = this.moduleInfo.nameSection.functionNames.get(exportEntry.index);
      if (funcName) {
        this.addInfoRow(table, 'Function name', funcName);
      }
    }
    detail.appendChild(table);

    this.appendSubheading(detail, 'WAT');
    if (this.disassembler) {
      this.appendCodeBlock(detail, this.disassembler.disassembleExport(exportIndex));
    }

    this.appendByteRange(detail, 'export', exportIndex);
  }

  private renderStartDetail(): void {
    if (!this.moduleInfo || this.moduleInfo.start === null) {
      return;
    }
    const detail = this.detailContainer!;

    this.appendHeading(detail, 'Start Function');

    const table = this.createInfoTable();
    this.addInfoRow(table, 'Function index', String(this.moduleInfo.start));
    const funcName = this.moduleInfo.nameSection?.functionNames?.get(this.moduleInfo.start);
    if (funcName) {
      this.addInfoRow(table, 'Function name', funcName);
    }
    detail.appendChild(table);
  }

  private renderElementDetail(elemIndex: number): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const elementEntry = this.moduleInfo.elements[elemIndex];

    this.appendHeading(detail, `Element ${elemIndex}`);

    const table = this.createInfoTable();
    this.addInfoRow(table, 'Passive', String(elementEntry.passive));
    if (!elementEntry.passive) {
      this.addInfoRow(table, 'Table index', String(elementEntry.tableIndex));
    }
    this.addInfoRow(table, 'Entries', String(elementEntry.functionIndices.length));
    detail.appendChild(table);

    if (elementEntry.functionIndices.length > 0) {
      this.appendSubheading(detail, 'Function Indices');
      const indicesBlock = document.createElement('div');
      indicesBlock.className = 'detail-code';
      indicesBlock.textContent = elementEntry.functionIndices.join(', ');
      detail.appendChild(indicesBlock);
    }

    this.appendSubheading(detail, 'WAT');
    if (this.disassembler) {
      this.appendCodeBlock(detail, this.disassembler.disassembleElement(elemIndex));
    }

    this.appendByteRange(detail, 'element', elemIndex);
  }

  private renderDataDetail(dataIndex: number): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const dataEntry = this.moduleInfo.data[dataIndex];

    this.appendHeading(detail, `Data ${dataIndex}`);

    const table = this.createInfoTable();
    this.addInfoRow(table, 'Passive', String(dataEntry.passive));
    if (!dataEntry.passive) {
      this.addInfoRow(table, 'Memory index', String(dataEntry.memoryIndex));
    }
    this.addInfoRow(table, 'Size', `${dataEntry.data.length} bytes`);
    detail.appendChild(table);

    this.appendSubheading(detail, 'WAT');
    if (this.disassembler) {
      this.appendCodeBlock(detail, this.disassembler.disassembleData(dataIndex));
    }

    const isPrintable = dataEntry.data.every(byteValue => (byteValue >= 0x20 && byteValue < 0x7f) || byteValue === 0x0a || byteValue === 0x0d || byteValue === 0x09);
    if (isPrintable && dataEntry.data.length > 0) {
      this.appendSubheading(detail, 'String Preview');
      const preview = document.createElement('div');
      preview.className = 'detail-code';
      preview.textContent = new TextDecoder().decode(dataEntry.data);
      detail.appendChild(preview);
    }

    if (dataEntry.data.length > 0) {
      this.appendSubheading(detail, 'Hex');
      this.appendHexDump(detail, dataEntry.data, 0);
    }

    this.appendByteRange(detail, 'data', dataIndex);
  }

  private renderTagDetail(tagIndex: number): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const tagEntry = this.moduleInfo.tags[tagIndex];

    this.appendHeading(detail, `Tag ${tagIndex}`);

    const table = this.createInfoTable();
    this.addInfoRow(table, 'Attribute', String(tagEntry.attribute));
    const topLevelTagTypeIdx = this.findTopLevelTypeIndex(tagEntry.typeIndex);
    this.addLinkedInfoRow(table, 'Type index', String(tagEntry.typeIndex), 'type', topLevelTagTypeIdx);
    detail.appendChild(table);

    this.appendByteRange(detail, 'tag', tagIndex);
  }

  private renderCustomSectionDetail(customIndex: number): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const customEntry = this.moduleInfo.customSections[customIndex];

    this.appendHeading(detail, `Custom Section "${customEntry.name}"`);

    const table = this.createInfoTable();
    this.addInfoRow(table, 'Name', customEntry.name);
    this.addInfoRow(table, 'Size', `${customEntry.data.length} bytes`);
    detail.appendChild(table);

    if (customEntry.data.length > 0) {
      this.appendSubheading(detail, 'Data');
      const maxDisplay = Math.min(customEntry.data.length, 4096);
      this.appendHexDump(detail, customEntry.data.slice(0, maxDisplay), 0);
      if (customEntry.data.length > maxDisplay) {
        const truncated = document.createElement('div');
        truncated.className = 'detail-truncated';
        truncated.textContent = `(showing ${maxDisplay} of ${customEntry.data.length} bytes)`;
        detail.appendChild(truncated);
      }
    }
  }

  private renderNameSectionDetail(): void {
    if (!this.moduleInfo || !this.moduleInfo.nameSection) {
      return;
    }
    const detail = this.detailContainer!;
    const nameSection = this.moduleInfo.nameSection;

    this.appendHeading(detail, 'Name Section');

    if (nameSection.moduleName) {
      const table = this.createInfoTable();
      this.addInfoRow(table, 'Module name', nameSection.moduleName);
      detail.appendChild(table);
    }

    if (nameSection.functionNames && nameSection.functionNames.size > 0) {
      this.appendSubheading(detail, `Function Names (${nameSection.functionNames.size})`);
      const table = this.createInfoTable();
      const sortedEntries = Array.from(nameSection.functionNames.entries()).sort((entryA, entryB) => entryA[0] - entryB[0]);
      for (const [funcIdx, funcName] of sortedEntries) {
        this.addInfoRow(table, `func ${funcIdx}`, funcName);
      }
      detail.appendChild(table);
    }

    if (nameSection.localNames && nameSection.localNames.size > 0) {
      this.appendSubheading(detail, `Local Names (${nameSection.localNames.size} functions)`);
      const sortedFuncs = Array.from(nameSection.localNames.entries()).sort((entryA, entryB) => entryA[0] - entryB[0]);
      for (const [funcIdx, locals] of sortedFuncs) {
        const funcName = nameSection.functionNames?.get(funcIdx);
        this.appendSubheading(detail, funcName || `func_${funcIdx}`);
        const table = this.createInfoTable();
        const sortedLocals = Array.from(locals.entries()).sort((entryA, entryB) => entryA[0] - entryB[0]);
        for (const [localIdx, localName] of sortedLocals) {
          this.addInfoRow(table, `local ${localIdx}`, localName);
        }
        detail.appendChild(table);
      }
    }

    if (nameSection.globalNames && nameSection.globalNames.size > 0) {
      this.appendSubheading(detail, `Global Names (${nameSection.globalNames.size})`);
      const table = this.createInfoTable();
      const sortedGlobals = Array.from(nameSection.globalNames.entries()).sort((entryA, entryB) => entryA[0] - entryB[0]);
      for (const [globalIdx, globalName] of sortedGlobals) {
        this.addInfoRow(table, `global ${globalIdx}`, globalName);
      }
      detail.appendChild(table);
    }
  }

  private extractStrings(): ExtractedString[] {
    if (this.cachedStrings) {
      return this.cachedStrings;
    }
    if (!this.moduleInfo) {
      return [];
    }
    const results: ExtractedString[] = [];
    const minLength = 4;

    for (let segmentIndex = 0; segmentIndex < this.moduleInfo.data.length; segmentIndex++) {
      const segment = this.moduleInfo.data[segmentIndex];
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
            const value = new TextDecoder().decode(segment.data.slice(runStart, byteIndex));
            results.push({ dataSegmentIndex: segmentIndex, offset: runStart, value });
          }
          runStart = -1;
        }
      }
    }

    this.cachedStrings = results;
    return results;
  }

  private renderSizeAnalysisSummary(): void {
    if (!this.moduleInfo || !this.rawBytes) {
      return;
    }
    const detail = this.detailContainer!;

    this.appendHeading(detail, 'Size Analysis');

    const table = this.createInfoTable();
    this.addInfoRow(table, 'Total file size', this.formatFileSize(this.rawBytes.length));
    const totalCodeSize = this.moduleInfo.functions.reduce((sum, func) => sum + func.body.length, 0);
    this.addInfoRow(table, 'Code size', this.formatFileSize(totalCodeSize));
    const totalDataSize = this.moduleInfo.data.reduce((sum, dataEntry) => sum + dataEntry.data.length, 0);
    this.addInfoRow(table, 'Data size', this.formatFileSize(totalDataSize));
    this.addInfoRow(table, 'Functions', String(this.moduleInfo.functions.length));
    this.addInfoRow(table, 'Data segments', String(this.moduleInfo.data.length));
    detail.appendChild(table);

    const description = document.createElement('div');
    description.className = 'detail-description';
    description.textContent = 'Expand the child nodes for detailed breakdowns.';
    detail.appendChild(description);
  }

  private renderSizeSections(): void {
    if (!this.rawBytes || !this.byteRanges) {
      return;
    }
    const detail = this.detailContainer!;
    const totalSize = this.rawBytes.length;

    this.appendHeading(detail, 'Section Breakdown');

    const sectionTable = this.createInfoTable();
    const sortedSections = [...this.byteRanges.sections].sort((sectionA, sectionB) => sectionB.length - sectionA.length);
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
      valueElement.className = 'detail-info-value';
      valueElement.textContent = `${this.formatFileSize(sectionRange.length)} (${percentage}%)`;
      row.appendChild(valueElement);

      sectionTable.appendChild(row);
    }
    detail.appendChild(sectionTable);
  }

  private renderSizeFunctions(): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const importedFuncCount = this.moduleInfo.imports.filter(importEntry => importEntry.kind === 0).length;

    this.appendHeading(detail, 'Function Sizes (largest first)');

    const funcSizes = this.moduleInfo.functions.map((func, funcIndex) => ({
      globalIndex: importedFuncCount + funcIndex,
      localIndex: funcIndex,
      size: func.body.length,
      name: this.moduleInfo!.nameSection?.functionNames?.get(importedFuncCount + funcIndex) || null,
    }));
    funcSizes.sort((funcA, funcB) => funcB.size - funcA.size);

    const maxFuncSize = funcSizes.length > 0 ? funcSizes[0].size : 1;
    const funcTable = this.createInfoTable();
    for (const funcSizeEntry of funcSizes) {
      const displayName = funcSizeEntry.name || `func_${funcSizeEntry.globalIndex}`;
      const row = document.createElement('div');
      row.className = 'detail-info-row';

      const link = document.createElement('a');
      link.className = 'detail-info-link';
      link.textContent = displayName;
      link.href = '#';
      link.style.minWidth = '120px';
      link.style.flexShrink = '0';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.navigateToItem('function', funcSizeEntry.localIndex);
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
      valueElement.className = 'detail-info-value';
      valueElement.textContent = `${funcSizeEntry.size} bytes`;
      row.appendChild(valueElement);

      funcTable.appendChild(row);
    }
    detail.appendChild(funcTable);
  }

  private renderSizeData(): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;

    this.appendHeading(detail, 'Data Segment Sizes (largest first)');

    const dataSizes = this.moduleInfo.data.map((dataEntry, dataIndex) => ({
      index: dataIndex,
      size: dataEntry.data.length,
      passive: dataEntry.passive,
      memoryIndex: dataEntry.memoryIndex,
    }));
    dataSizes.sort((entryA, entryB) => entryB.size - entryA.size);

    const maxDataSize = dataSizes.length > 0 ? dataSizes[0].size : 1;
    const dataTable = this.createInfoTable();
    for (const dataSizeEntry of dataSizes) {
      const passiveLabel = dataSizeEntry.passive ? 'passive' : `memory ${dataSizeEntry.memoryIndex}`;
      const row = document.createElement('div');
      row.className = 'detail-info-row';

      const link = document.createElement('a');
      link.className = 'detail-info-link';
      link.textContent = `data ${dataSizeEntry.index} (${passiveLabel})`;
      link.href = '#';
      link.style.minWidth = '140px';
      link.style.flexShrink = '0';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.navigateToItem('data', dataSizeEntry.index);
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
      valueElement.className = 'detail-info-value';
      valueElement.textContent = this.formatFileSize(dataSizeEntry.size);
      row.appendChild(valueElement);

      dataTable.appendChild(row);
    }
    detail.appendChild(dataTable);
  }

  private renderStringsView(): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const strings = this.extractStrings();

    this.appendHeading(detail, `Strings (${strings.length})`);

    const table = this.createInfoTable();
    for (const stringEntry of strings) {
      const row = document.createElement('div');
      row.className = 'detail-info-row';

      const link = document.createElement('a');
      link.className = 'detail-info-link';
      link.textContent = `data ${stringEntry.dataSegmentIndex}+${stringEntry.offset}`;
      link.href = '#';
      link.style.minWidth = '100px';
      link.style.flexShrink = '0';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.navigateToItem('data', stringEntry.dataSegmentIndex);
      });
      row.appendChild(link);

      const valueElement = document.createElement('span');
      valueElement.className = 'detail-string-value';
      const displayValue = stringEntry.value.length > 120 ? stringEntry.value.slice(0, 120) + '...' : stringEntry.value;
      valueElement.textContent = displayValue;
      row.appendChild(valueElement);

      table.appendChild(row);
    }
    detail.appendChild(table);
  }

  private renderDebugInfo(): void {
    const dwarfData = this.getDwarfInfo();
    if (!dwarfData) {
      return;
    }
    const detail = this.detailContainer!;

    this.appendHeading(detail, 'Debug Info (DWARF)');

    const summaryTable = this.createInfoTable();
    this.addInfoRow(summaryTable, 'Compilation units', String(dwarfData.compilationUnits.length));
    this.addInfoRow(summaryTable, 'DWARF functions', String(dwarfData.functions.length));
    this.addInfoRow(summaryTable, 'Source files', String(dwarfData.sourceFiles.length));
    if (dwarfData.lineInfo) {
      this.addInfoRow(summaryTable, 'Line entries', String(dwarfData.lineInfo.lineEntries.length));
    }
    detail.appendChild(summaryTable);

    if (dwarfData.compilationUnits.length > 0) {
      this.appendSubheading(detail, 'Compilation Units');
      for (const compilationUnit of dwarfData.compilationUnits) {
        const unitTable = this.createInfoTable();
        if (compilationUnit.name) {
          this.addInfoRow(unitTable, 'Source', compilationUnit.name);
        }
        if (compilationUnit.producer) {
          this.addInfoRow(unitTable, 'Producer', compilationUnit.producer);
        }
        if (compilationUnit.compDir) {
          this.addInfoRow(unitTable, 'Compile dir', compilationUnit.compDir);
        }
        if (compilationUnit.language) {
          this.addInfoRow(unitTable, 'Language', this.getDwarfLanguageName(compilationUnit.language));
        }
        this.addInfoRow(unitTable, 'Functions', String(compilationUnit.functions.length));
        detail.appendChild(unitTable);
      }
    }

    if (dwarfData.functions.length > 0) {
      this.appendSubheading(detail, `DWARF Functions (${dwarfData.functions.length})`);
      const funcTable = this.createInfoTable();
      const sortedFunctions = [...dwarfData.functions].sort((funcA, funcB) => funcA.lowPc - funcB.lowPc);
      for (const dwarfFunc of sortedFunctions) {
        let sourceInfo = '';
        if (dwarfFunc.declFile > 0 && dwarfFunc.declFile <= dwarfData.sourceFiles.length) {
          const fileName = dwarfData.sourceFiles[dwarfFunc.declFile - 1];
          const shortName = fileName.split('/').pop() || fileName;
          sourceInfo = `${shortName}:${dwarfFunc.declLine}`;
        }
        const addressRange = dwarfFunc.lowPc > 0 ? ` [0x${dwarfFunc.lowPc.toString(16)}..0x${dwarfFunc.highPc.toString(16)}]` : '';
        this.addInfoRow(funcTable, dwarfFunc.name, `${sourceInfo}${addressRange}`);
      }
      detail.appendChild(funcTable);
    }

    if (dwarfData.sourceFiles.length > 0) {
      this.appendSubheading(detail, 'Source Files');
      const fileTable = this.createInfoTable();
      for (let fileIndex = 0; fileIndex < dwarfData.sourceFiles.length; fileIndex++) {
        this.addInfoRow(fileTable, String(fileIndex), dwarfData.sourceFiles[fileIndex]);
      }
      detail.appendChild(fileTable);
    }
  }

  private getDwarfLanguageName(language: number): string {
    const languageNames: Record<number, string> = {
      0x01: 'C89', 0x02: 'C', 0x04: 'C++', 0x0c: 'C99',
      0x1a: 'C11', 0x2a: 'C17', 0x1c: 'C++03', 0x21: 'C++11',
      0x1a: 'C++14', 0x22: 'C++14', 0x1d: 'Rust',
      0x12: 'Java', 0x0e: 'Python', 0x1f: 'Swift',
      0x24: 'Kotlin', 0x20: 'Go', 0x25: 'Zig',
    };
    return languageNames[language] || `language_${language} (0x${language.toString(16)})`;
  }

  private searchWat(query: string): void {
    if (!this.moduleInfo || !this.disassembler || !this.detailContainer || !query.trim()) {
      return;
    }
    const detail = this.detailContainer;
    detail.innerHTML = '';
    const lowerQuery = query.toLowerCase();
    const importedFuncCount = this.moduleInfo.imports.filter(importEntry => importEntry.kind === 0).length;

    this.appendHeading(detail, `Search: "${query}"`);

    interface SearchMatch {
      funcIndex: number;
      globalIndex: number;
      funcName: string | null;
      lineNumber: number;
      lineText: string;
    }

    const matches: SearchMatch[] = [];

    for (let funcIndex = 0; funcIndex < this.moduleInfo.functions.length; funcIndex++) {
      const globalIndex = importedFuncCount + funcIndex;
      const funcName = this.moduleInfo.nameSection?.functionNames?.get(globalIndex) || null;
      const wat = this.disassembler.disassembleFunction(funcIndex);
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

    this.addInfoRow(this.createInfoTable(), 'Results', String(matches.length));
    const summaryTable = this.createInfoTable();
    this.addInfoRow(summaryTable, 'Results', String(matches.length));
    this.addInfoRow(summaryTable, 'Functions searched', String(this.moduleInfo.functions.length));
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
        this.navigateToItem('function', match.funcIndex);
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

  private renderFeatureDetection(): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const importedFuncCount = this.moduleInfo.imports.filter(imp => imp.kind === 0).length;

    this.appendHeading(detail, 'Feature Detection');

    const featureOpcodes = new Map<string, string[]>();
    const featureFunctions = new Map<string, Set<number>>();

    for (let funcIndex = 0; funcIndex < this.moduleInfo.functions.length; funcIndex++) {
      const func = this.moduleInfo.functions[funcIndex];
      const instructions = func.instructions || InstructionDecoder.decodeFunctionBody(func.body);
      const globalIndex = importedFuncCount + funcIndex;

      for (const instruction of instructions) {
        const feature = (instruction.opCode as any).feature as string | undefined;
        if (feature) {
          if (!featureOpcodes.has(feature)) {
            featureOpcodes.set(feature, []);
          }
          const opcodes = featureOpcodes.get(feature)!;
          if (!opcodes.includes(instruction.opCode.mnemonic)) {
            opcodes.push(instruction.opCode.mnemonic);
          }
          if (!featureFunctions.has(feature)) {
            featureFunctions.set(feature, new Set());
          }
          featureFunctions.get(feature)!.add(globalIndex);
        }
      }
    }

    const hasMultiValue = this.moduleInfo.types.some(typeEntry => {
      if (typeEntry.kind === 'func') {
        return typeEntry.returnTypes.length > 1;
      }
      return false;
    });

    const hasGcTypes = this.moduleInfo.types.some(typeEntry =>
      typeEntry.kind === 'struct' || typeEntry.kind === 'array' || typeEntry.kind === 'rec'
    );

    const hasSharedMemory = this.moduleInfo.memories.some(mem => mem.shared) ||
      this.moduleInfo.imports.some(imp => imp.memoryType?.shared);

    const hasMemory64 = this.moduleInfo.memories.some(mem => mem.memory64) ||
      this.moduleInfo.imports.some(imp => imp.memoryType?.memory64);

    const hasTags = this.moduleInfo.tags.length > 0 ||
      this.moduleInfo.imports.some(imp => imp.kind === 4);

    const structuralFeatures: [string, boolean][] = [
      ['multi-value', hasMultiValue],
      ['gc (struct/array types)', hasGcTypes],
      ['shared-memory', hasSharedMemory],
      ['memory64', hasMemory64],
      ['exception-handling (tags)', hasTags],
    ];

    if (featureOpcodes.size === 0 && !structuralFeatures.some(([, present]) => present)) {
      const mvpNote = document.createElement('div');
      mvpNote.className = 'detail-description';
      mvpNote.textContent = 'This module uses only MVP features.';
      detail.appendChild(mvpNote);
      return;
    }

    this.appendSubheading(detail, 'Opcode-based Features');
    if (featureOpcodes.size === 0) {
      const noneNote = document.createElement('div');
      noneNote.className = 'detail-description';
      noneNote.textContent = 'No post-MVP opcodes detected.';
      detail.appendChild(noneNote);
    } else {
      const sortedFeatures = Array.from(featureOpcodes.entries()).sort(
        (entryA, entryB) => (featureFunctions.get(entryB[0])?.size || 0) - (featureFunctions.get(entryA[0])?.size || 0)
      );
      const table = this.createInfoTable();
      for (const [featureName, opcodes] of sortedFeatures) {
        const funcCount = featureFunctions.get(featureName)?.size || 0;
        this.addInfoRow(table, featureName, `${funcCount} functions, opcodes: ${opcodes.slice(0, 5).join(', ')}${opcodes.length > 5 ? '...' : ''}`);
      }
      detail.appendChild(table);
    }

    this.appendSubheading(detail, 'Structural Features');
    const structTable = this.createInfoTable();
    for (const [featureName, present] of structuralFeatures) {
      if (present) {
        this.addInfoRow(structTable, featureName, 'detected');
      }
    }
    if (!structuralFeatures.some(([, present]) => present)) {
      this.addInfoRow(structTable, '(none)', 'MVP only');
    }
    detail.appendChild(structTable);
  }

  private renderModuleInterface(): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const flatTypes = flattenTypes(this.moduleInfo);

    this.appendHeading(detail, 'Module Interface');

    this.appendSubheading(detail, `Imports (${this.moduleInfo.imports.length})`);
    if (this.moduleInfo.imports.length > 0) {
      const importTable = this.createInfoTable();
      for (let importIndex = 0; importIndex < this.moduleInfo.imports.length; importIndex++) {
        const importEntry = this.moduleInfo.imports[importIndex];
        const kindName = EXPORT_KIND_NAMES[importEntry.kind] || 'unknown';
        let signature = '';
        if (importEntry.kind === 0 && importEntry.typeIndex !== undefined && importEntry.typeIndex < flatTypes.length) {
          const typeEntry = flatTypes[importEntry.typeIndex];
          if (typeEntry.kind === 'func') {
            signature = ' ' + formatFuncType(typeEntry);
          }
        }
        this.addLinkedInfoRow(
          importTable,
          `${importEntry.moduleName}.${importEntry.fieldName}`,
          `${kindName}${signature}`,
          'import',
          importIndex,
        );
      }
      detail.appendChild(importTable);
    }

    this.appendSubheading(detail, `Exports (${this.moduleInfo.exports.length})`);
    if (this.moduleInfo.exports.length > 0) {
      const exportTable = this.createInfoTable();
      for (let exportIndex = 0; exportIndex < this.moduleInfo.exports.length; exportIndex++) {
        const exportEntry = this.moduleInfo.exports[exportIndex];
        const kindName = EXPORT_KIND_NAMES[exportEntry.kind] || 'unknown';
        let signature = '';
        if (exportEntry.kind === 0) {
          const importedFuncCount = this.moduleInfo.imports.filter(imp => imp.kind === 0).length;
          const localFuncIndex = exportEntry.index - importedFuncCount;
          if (localFuncIndex >= 0 && localFuncIndex < this.moduleInfo.functions.length) {
            const funcEntry = this.moduleInfo.functions[localFuncIndex];
            if (funcEntry.typeIndex < flatTypes.length) {
              const typeEntry = flatTypes[funcEntry.typeIndex];
              if (typeEntry.kind === 'func') {
                signature = ' ' + formatFuncType(typeEntry);
              }
            }
          }
        }
        this.addLinkedInfoRow(
          exportTable,
          exportEntry.name,
          `${kindName}${signature}`,
          'export',
          exportIndex,
        );
      }
      detail.appendChild(exportTable);
    }
  }

  private renderFunctionComplexity(): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const importedFuncCount = this.moduleInfo.imports.filter(imp => imp.kind === 0).length;

    this.appendHeading(detail, 'Function Complexity');

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

    for (let funcIndex = 0; funcIndex < this.moduleInfo.functions.length; funcIndex++) {
      const globalIndex = importedFuncCount + funcIndex;
      const func = this.moduleInfo.functions[funcIndex];
      const instructions = func.instructions || InstructionDecoder.decodeFunctionBody(func.body);
      const funcName = this.moduleInfo.nameSection?.functionNames?.get(globalIndex) || null;

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

    const headerRow = document.createElement('div');
    headerRow.className = 'detail-info-row complexity-header';
    for (const label of ['Function', 'Instructions', 'Branches', 'Max Depth', 'Body']) {
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
      link.style.minWidth = '140px';
      link.style.flexShrink = '0';
      link.href = '#';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.navigateToItem('function', entry.localIndex);
      });
      row.appendChild(link);

      for (const value of [entry.instructionCount, entry.branchCount, entry.maxNestingDepth, entry.bodySize]) {
        const cell = document.createElement('span');
        cell.className = 'detail-info-value';
        cell.style.minWidth = '70px';
        cell.textContent = String(value);
        row.appendChild(cell);
      }

      detail.appendChild(row);
    }
  }

  private renderDeadCode(): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const importedFuncCount = this.moduleInfo.imports.filter(imp => imp.kind === 0).length;
    const callGraphData = this.getCallGraph();

    const exportedFuncIndices = new Set<number>();
    for (const exportEntry of this.moduleInfo.exports) {
      if (exportEntry.kind === 0) {
        exportedFuncIndices.add(exportEntry.index);
      }
    }

    if (this.moduleInfo.start !== null) {
      exportedFuncIndices.add(this.moduleInfo.start);
    }

    for (const elementEntry of this.moduleInfo.elements) {
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
    for (let funcIndex = 0; funcIndex < this.moduleInfo.functions.length; funcIndex++) {
      const globalIndex = importedFuncCount + funcIndex;
      if (!reachable.has(globalIndex)) {
        deadFunctions.push({
          localIndex: funcIndex,
          globalIndex,
          name: this.moduleInfo.nameSection?.functionNames?.get(globalIndex) || null,
          bodySize: this.moduleInfo.functions[funcIndex].body.length,
        });
      }
    }

    this.appendHeading(detail, 'Dead Code Analysis');

    const summaryTable = this.createInfoTable();
    this.addInfoRow(summaryTable, 'Total functions', String(this.moduleInfo.functions.length));
    this.addInfoRow(summaryTable, 'Reachable', String(reachable.size - importedFuncCount));
    this.addInfoRow(summaryTable, 'Unreachable', String(deadFunctions.length));
    const wastedBytes = deadFunctions.reduce((sum, func) => sum + func.bodySize, 0);
    this.addInfoRow(summaryTable, 'Wasted bytes', this.formatFileSize(wastedBytes));
    detail.appendChild(summaryTable);

    if (deadFunctions.length === 0) {
      const noDeadCode = document.createElement('div');
      noDeadCode.className = 'detail-description';
      noDeadCode.textContent = 'No unreachable functions detected.';
      detail.appendChild(noDeadCode);
      return;
    }

    deadFunctions.sort((funcA, funcB) => funcB.bodySize - funcA.bodySize);

    this.appendSubheading(detail, `Unreachable Functions (${deadFunctions.length})`);
    const funcTable = this.createInfoTable();
    for (const deadFunc of deadFunctions) {
      const displayName = deadFunc.name || `func_${deadFunc.globalIndex}`;
      this.addLinkedInfoRow(funcTable, displayName, `${deadFunc.bodySize} bytes`, 'function', deadFunc.localIndex);
    }
    detail.appendChild(funcTable);
  }

  private renderProducers(): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const producersSection = this.moduleInfo.customSections.find(section => section.name === 'producers');
    if (!producersSection) {
      return;
    }

    this.appendHeading(detail, 'Producers');

    try {
      const data = producersSection.data;
      let offset = 0;

      function readULEB128(): number {
        let result = 0;
        let shift = 0;
        let byte: number;
        do {
          byte = data[offset++];
          result |= (byte & 0x7f) << shift;
          shift += 7;
        } while (byte & 0x80);
        return result >>> 0;
      }

      function readString(): string {
        const length = readULEB128();
        const str = new TextDecoder().decode(data.slice(offset, offset + length));
        offset += length;
        return str;
      }

      const fieldCount = readULEB128();
      for (let fieldIndex = 0; fieldIndex < fieldCount; fieldIndex++) {
        const fieldName = readString();
        this.appendSubheading(detail, fieldName);
        const valueCount = readULEB128();
        const table = this.createInfoTable();
        for (let valueIndex = 0; valueIndex < valueCount; valueIndex++) {
          const name = readString();
          const version = readString();
          this.addInfoRow(table, name, version || '(no version)');
        }
        detail.appendChild(table);
      }
    } catch (parseError) {
      const errorElement = document.createElement('div');
      errorElement.className = 'detail-description';
      errorElement.textContent = 'Failed to parse producers section.';
      detail.appendChild(errorElement);
    }
  }

  private renderTargetFeatures(): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const targetFeaturesSection = this.moduleInfo.customSections.find(section => section.name === 'target_features');
    if (!targetFeaturesSection) {
      return;
    }

    this.appendHeading(detail, 'Target Features');

    try {
      const data = targetFeaturesSection.data;
      let offset = 0;

      function readULEB128(): number {
        let result = 0;
        let shift = 0;
        let byte: number;
        do {
          byte = data[offset++];
          result |= (byte & 0x7f) << shift;
          shift += 7;
        } while (byte & 0x80);
        return result >>> 0;
      }

      function readString(): string {
        const length = readULEB128();
        const str = new TextDecoder().decode(data.slice(offset, offset + length));
        offset += length;
        return str;
      }

      const prefixLabels: Record<number, string> = {
        0x2b: 'used (+)',
        0x2d: 'disallowed (-)',
        0x3d: 'required (=)',
      };

      const featureCount = readULEB128();
      const table = this.createInfoTable();
      for (let featureIndex = 0; featureIndex < featureCount; featureIndex++) {
        const prefix = data[offset++];
        const featureName = readString();
        this.addInfoRow(table, featureName, prefixLabels[prefix] || `prefix 0x${prefix.toString(16)}`);
      }
      detail.appendChild(table);
    } catch (parseError) {
      const errorElement = document.createElement('div');
      errorElement.className = 'detail-description';
      errorElement.textContent = 'Failed to parse target_features section.';
      detail.appendChild(errorElement);
    }
  }

  private renderInstructionStats(): void {
    if (!this.moduleInfo) {
      return;
    }
    const detail = this.detailContainer!;
    const opcodeCounts = new Map<string, number>();
    let totalInstructions = 0;

    for (const func of this.moduleInfo.functions) {
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

    this.appendHeading(detail, 'Instruction Statistics');

    const summaryTable = this.createInfoTable();
    this.addInfoRow(summaryTable, 'Total instructions', String(totalInstructions));
    this.addInfoRow(summaryTable, 'Unique opcodes', String(opcodeCounts.size));
    this.addInfoRow(summaryTable, 'Functions', String(this.moduleInfo.functions.length));
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
      } else if (/^(i32|i64|f32|f64)\.(load|store|const|add|sub|mul|div|rem|and|or|xor|shl|shr|rotl|rotr|clz|ctz|popcnt|eqz|eq|ne|lt|gt|le|ge|abs|neg|ceil|floor|trunc|nearest|sqrt|min|max|copysign|wrap|extend|convert|demote|promote|reinterpret|atomic)/.test(mnemonic)) {
        categories['Numeric'].push(mnemonic);
      } else if (/^(memory\.|i32\.load|i64\.load|f32\.load|f64\.load|i32\.store|i64\.store|f32\.store|f64\.store)/.test(mnemonic)) {
        categories['Memory'].push(mnemonic);
      } else if (/^(local\.|global\.)/.test(mnemonic)) {
        categories['Variable'].push(mnemonic);
      } else if (/^(ref\.|struct\.|array\.|i31\.|any\.|extern\.|br_on_cast)/.test(mnemonic)) {
        categories['Reference'].push(mnemonic);
      } else if (/^(table\.|elem\.)/.test(mnemonic)) {
        categories['Table'].push(mnemonic);
      } else {
        categories['Other'].push(mnemonic);
      }
    }

    this.appendSubheading(detail, 'By Category');
    const categoryTable = this.createInfoTable();
    for (const [categoryName, mnemonics] of Object.entries(categories)) {
      if (mnemonics.length === 0) {
        continue;
      }
      const categoryCount = mnemonics.reduce((sum, mnemonic) => sum + (opcodeCounts.get(mnemonic) || 0), 0);
      const percentage = totalInstructions > 0 ? ((categoryCount / totalInstructions) * 100).toFixed(1) : '0';

      const row = document.createElement('div');
      row.className = 'detail-info-row';

      const labelElement = document.createElement('span');
      labelElement.className = 'detail-info-label';
      labelElement.textContent = categoryName;
      row.appendChild(labelElement);

      const barContainer = document.createElement('div');
      barContainer.className = 'size-bar-container';
      const bar = document.createElement('div');
      bar.className = 'size-bar';
      bar.style.width = `${Math.max(2, (categoryCount / totalInstructions) * 100)}%`;
      barContainer.appendChild(bar);
      row.appendChild(barContainer);

      const valueElement = document.createElement('span');
      valueElement.className = 'detail-info-value';
      valueElement.textContent = `${categoryCount} (${percentage}%)`;
      row.appendChild(valueElement);

      categoryTable.appendChild(row);
    }
    detail.appendChild(categoryTable);

    this.appendSubheading(detail, 'All Opcodes (by frequency)');
    const sorted = Array.from(opcodeCounts.entries()).sort((entryA, entryB) => entryB[1] - entryA[1]);
    const maxCount = sorted.length > 0 ? sorted[0][1] : 1;
    const opcodeTable = this.createInfoTable();
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
      valueElement.className = 'detail-info-value';
      valueElement.textContent = `${count} (${percentage}%)`;
      row.appendChild(valueElement);

      opcodeTable.appendChild(row);
    }
    detail.appendChild(opcodeTable);
  }

  private appendHeading(parent: HTMLElement, text: string): void {
    const heading = document.createElement('h2');
    heading.className = 'detail-heading';
    heading.textContent = text;
    parent.appendChild(heading);
  }

  private appendSubheading(parent: HTMLElement, text: string): void {
    const heading = document.createElement('h3');
    heading.className = 'detail-subheading';
    heading.textContent = text;
    parent.appendChild(heading);
  }

  private createInfoTable(): HTMLElement {
    const table = document.createElement('div');
    table.className = 'detail-info-table';
    return table;
  }

  private addInfoRow(table: HTMLElement, label: string, value: string): void {
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

  private addLinkedInfoRow(table: HTMLElement, label: string, value: string, targetSection: string, targetIndex: number): void {
    const row = document.createElement('div');
    row.className = 'detail-info-row';

    const labelElement = document.createElement('span');
    labelElement.className = 'detail-info-label';
    labelElement.textContent = label;
    row.appendChild(labelElement);

    const link = document.createElement('a');
    link.className = 'detail-info-link';
    link.textContent = value;
    link.href = '#';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      this.navigateToItem(targetSection, targetIndex);
    });
    row.appendChild(link);

    table.appendChild(row);
  }

  private appendCallList(parent: HTMLElement, label: string, funcIndices: Set<number>): void {
    if (!this.moduleInfo) {
      return;
    }
    const importedFuncCount = this.moduleInfo.imports.filter(importEntry => importEntry.kind === 0).length;
    const container = document.createElement('div');
    container.className = 'detail-call-list';

    const labelElement = document.createElement('span');
    labelElement.className = 'detail-call-label';
    labelElement.textContent = label + ': ';
    container.appendChild(labelElement);

    const sortedIndices = Array.from(funcIndices).sort((indexA, indexB) => indexA - indexB);
    for (let position = 0; position < sortedIndices.length; position++) {
      const targetGlobalIndex = sortedIndices[position];
      const funcName = this.getFunctionName(targetGlobalIndex);
      const displayName = funcName || `func_${targetGlobalIndex}`;
      const localFuncIndex = targetGlobalIndex - importedFuncCount;

      const link = document.createElement('a');
      link.className = 'detail-info-link';
      link.textContent = displayName;
      link.href = '#';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        if (localFuncIndex >= 0) {
          this.navigateToItem('function', localFuncIndex);
        }
      });
      container.appendChild(link);

      if (position < sortedIndices.length - 1) {
        container.appendChild(document.createTextNode(', '));
      }
    }

    parent.appendChild(container);
  }

  private appendCodeBlock(parent: HTMLElement, code: string): void {
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
      gutter.textContent = String(lineIndex + 1).padStart(gutterWidth, ' ');
      lineElement.appendChild(gutter);

      const content = document.createElement('span');
      content.className = 'code-line-content';
      renderHighlightedWat(content, lines[lineIndex]);
      lineElement.appendChild(content);

      block.appendChild(lineElement);
    }

    wrapper.appendChild(block);
    wrapper.appendChild(this.createCopyButton(code));
    parent.appendChild(wrapper);
  }

  private createCopyButton(text: string): HTMLButtonElement {
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

  private appendHexDump(parent: HTMLElement, bytes: Uint8Array, baseOffset: number, byteClasses?: Map<number, string>): void {
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
    wrapper.appendChild(this.createCopyButton(hexText));
    parent.appendChild(wrapper);
  }

  private appendByteRange(parent: HTMLElement, section: string, index: number): void {
    if (!this.byteRanges || !this.rawBytes) {
      return;
    }
    const range = this.byteRanges.getItem(section as ByteRangeSection, index);
    if (!range) {
      return;
    }

    this.appendSubheading(parent, 'Bytes');
    const rangeInfo = document.createElement('div');
    rangeInfo.className = 'detail-byte-range-info';
    rangeInfo.textContent = `Offset: 0x${range.offset.toString(16)} (${range.offset}), Length: ${range.length} bytes`;
    parent.appendChild(rangeInfo);

    const maxDisplay = Math.min(range.length, 4096);
    const bytes = this.rawBytes.slice(range.offset, range.offset + maxDisplay);

    let byteClasses: Map<number, string> | undefined;
    if (section === 'function' && this.moduleInfo && index < this.moduleInfo.functions.length) {
      const funcBody = this.moduleInfo.functions[index].body;
      byteClasses = buildInstructionByteClasses(funcBody);
    }

    this.appendHexDump(parent, bytes, range.offset, byteClasses);

    if (range.length > maxDisplay) {
      const truncated = document.createElement('div');
      truncated.className = 'detail-truncated';
      truncated.textContent = `(showing ${maxDisplay} of ${range.length} bytes)`;
      parent.appendChild(truncated);
    }
  }
}
