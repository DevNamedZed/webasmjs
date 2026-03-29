import InstructionDecoder from '../../src/InstructionDecoder';

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

export interface WatToken {
  text: string;
  kind: 'keyword' | 'type' | 'number' | 'string' | 'annotation' | 'name' | 'paren' | 'plain';
}

export function tokenizeWat(source: string): WatToken[] {
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

export interface HighlightOptions {
  onFunctionClick?: (functionName: string) => void;
}

export function renderHighlightedC(container: HTMLElement, source: string, options?: HighlightOptions): void {
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
      const wordStart = end;
      while (end < source.length && /[a-zA-Z]/.test(source[end])) { end++; }
      const castWord = source.slice(wordStart, end);
      // Allow "unsigned long", "unsigned int" etc.
      let castEnd = end;
      while (castEnd < source.length && source[castEnd] === ' ') { castEnd++; }
      if (castEnd < source.length && /[a-zA-Z]/.test(source[castEnd])) {
        let nextWordEnd = castEnd;
        while (nextWordEnd < source.length && /[a-zA-Z]/.test(source[nextWordEnd])) { nextWordEnd++; }
        const nextWord = source.slice(castEnd, nextWordEnd);
        if (C_CAST_TYPES.has(nextWord)) {
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

export function renderHighlightedWat(container: HTMLElement, source: string): void {
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

export function buildInstructionByteClasses(bytes: Uint8Array): Map<number, string> {
  const classes = new Map<number, string>();
  try {
    const instructions = InstructionDecoder.decodeFunctionBody(bytes);
    for (const instruction of instructions) {
      for (let bytePos = instruction.offset; bytePos < instruction.offset + instruction.length; bytePos++) {
        if (bytePos < instruction.offset + 1 || (instruction.opCode.prefix !== undefined && bytePos < instruction.offset + 2)) {
          classes.set(bytePos, 'hex-opcode');
        } else {
          classes.set(bytePos, 'hex-immediate');
        }
      }
    }
  } catch {
    // fall back to uncolored
  }
  return classes;
}

export function renderColoredHexDump(container: HTMLElement, bytes: Uint8Array, baseOffset: number, byteClasses: Map<number, string>): void {
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
