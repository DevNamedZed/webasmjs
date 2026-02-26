export interface Token {
  type: 'number' | 'string' | 'ident' | 'op' | 'punct' | 'newline' | 'eof';
  value: string;
  line: number;
}

export const KEYWORDS = new Set([
  'if', 'else', 'while', 'for', 'in', 'end', 'print', 'len',
  'def', 'return', 'and', 'or', 'not',
]);

const TWO_CHAR_OPS = new Set(['==', '!=', '>=', '<=']);
const SINGLE_CHAR_OPS = new Set(['+', '-', '*', '/', '%', '>', '<', '=']);

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const lines = source.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    let i = 0;

    while (i < line.length) {
      if (line[i] === ' ' || line[i] === '\t') { i++; continue; }
      if (line[i] === '#') break;

      // String literal
      if (line[i] === '"') {
        i++;
        let str = '';
        while (i < line.length && line[i] !== '"') {
          if (line[i] === '\\' && i + 1 < line.length) {
            i++;
            if (line[i] === 'n') str += '\n';
            else if (line[i] === 't') str += '\t';
            else if (line[i] === '\\') str += '\\';
            else if (line[i] === '"') str += '"';
            else str += line[i];
          } else {
            str += line[i];
          }
          i++;
        }
        if (i < line.length) i++;
        tokens.push({ type: 'string', value: str, line: lineNum + 1 });
        continue;
      }

      // Number
      if (line[i] >= '0' && line[i] <= '9') {
        let num = '';
        while (i < line.length && line[i] >= '0' && line[i] <= '9') num += line[i++];
        tokens.push({ type: 'number', value: num, line: lineNum + 1 });
        continue;
      }

      // Identifier / keyword
      if ((line[i] >= 'a' && line[i] <= 'z') || (line[i] >= 'A' && line[i] <= 'Z') || line[i] === '_') {
        let id = '';
        while (i < line.length && ((line[i] >= 'a' && line[i] <= 'z') || (line[i] >= 'A' && line[i] <= 'Z') || (line[i] >= '0' && line[i] <= '9') || line[i] === '_')) {
          id += line[i++];
        }
        tokens.push({ type: 'ident', value: id, line: lineNum + 1 });
        continue;
      }

      // Two-character operators
      if (i + 1 < line.length && TWO_CHAR_OPS.has(line[i] + line[i + 1])) {
        tokens.push({ type: 'op', value: line[i] + line[i + 1], line: lineNum + 1 });
        i += 2;
        continue;
      }

      // Single-character operators
      if (SINGLE_CHAR_OPS.has(line[i])) {
        tokens.push({ type: 'op', value: line[i], line: lineNum + 1 });
        i++;
        continue;
      }

      // Punctuation
      if (':[]{},().'.includes(line[i])) {
        tokens.push({ type: 'punct', value: line[i], line: lineNum + 1 });
        i++;
        continue;
      }

      throw new Error(`Unexpected character '${line[i]}' at line ${lineNum + 1}`);
    }

    if (tokens.length > 0 && tokens[tokens.length - 1].type !== 'newline') {
      tokens.push({ type: 'newline', value: '\n', line: lineNum + 1 });
    }
  }

  tokens.push({ type: 'eof', value: '', line: lines.length });
  return tokens;
}
