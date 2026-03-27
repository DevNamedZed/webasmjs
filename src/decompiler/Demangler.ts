/**
 * Name demangler for C++ (Itanium ABI _Z prefix) and Rust (v0 _R prefix, legacy _ZN).
 * Also decodes Rust symbol escapes ($LT$, $GT$, $u20$, etc.).
 * Falls back to the original name if demangling fails.
 */

export function demangleName(mangledName: string): string {
  // Rust v0 mangling: _R<...>
  if (mangledName.startsWith('_R')) {
    try {
      return demangleRustV0(mangledName);
    } catch {
      return mangledName;
    }
  }

  // Itanium ABI (C++ and Rust legacy): _Z<...>
  if (mangledName.startsWith('_Z')) {
    try {
      const result = demangleItanium(mangledName, 2);
      return stripRustHash(decodeRustEscapes(result));
    } catch {
      return mangledName;
    }
  }

  // Rust symbol escapes without _Z prefix (e.g. in some toolchains)
  if (mangledName.includes('$LT$') || mangledName.includes('$GT$') || mangledName.includes('$u20$')) {
    return decodeRustEscapes(mangledName);
  }

  return mangledName;
}

// Best-effort Itanium ABI demangler. Handles nested names, constructors,
// destructors, source names, and common operator encodings. Does not handle
// template arguments, const/volatile qualifiers, references, or variadic parameters.
function demangleItanium(input: string, position: number): string {
  // _Z<encoding>
  // <encoding> := <name> | <name> <bare-function-type>
  const result = parseName(input, position);
  return result.name;
}

interface ParseResult {
  name: string;
  position: number;
}

function parseName(input: string, position: number): ParseResult {
  if (position >= input.length) {
    return { name: input, position };
  }

  // Nested name: N<qualifier+><name>E
  if (input[position] === 'N') {
    position++;
    const parts: string[] = [];
    while (position < input.length && input[position] !== 'E') {
      const segment = parseUnqualifiedName(input, position);
      parts.push(segment.name);
      position = segment.position;
    }
    if (position < input.length) { position++; } // skip E
    return { name: parts.join('::'), position };
  }

  // Simple name
  return parseUnqualifiedName(input, position);
}

/**
 * Parses an Itanium ABI unqualified name component.
 * Handles: C1/C2/C3 constructors, D0/D1/D2 destructors, decimal-length source names,
 * and two-character operator encodings (e.g., "pl" = operator+, "eq" = operator==).
 */
function parseUnqualifiedName(input: string, position: number): ParseResult {
  if (position >= input.length) {
    return { name: '', position };
  }

  // Constructor/destructor
  if (input[position] === 'C') {
    position++;
    if (position < input.length) { position++; } // skip C1, C2, C3
    return { name: '{ctor}', position };
  }
  if (input[position] === 'D') {
    position++;
    if (position < input.length) { position++; }
    return { name: '{dtor}', position };
  }

  // Source name: <length> <identifier>
  if (input[position] >= '0' && input[position] <= '9') {
    let length = 0;
    while (position < input.length && input[position] >= '0' && input[position] <= '9') {
      length = length * 10 + (input.charCodeAt(position) - 48);
      position++;
    }
    const name = input.slice(position, position + length);
    return { name, position: position + length };
  }

  // Operator names
  const operatorMap: Record<string, string> = {
    'nw': 'operator new', 'na': 'operator new[]', 'dl': 'operator delete', 'da': 'operator delete[]',
    'ps': 'operator+', 'ng': 'operator-', 'ad': 'operator&', 'de': 'operator*',
    'co': 'operator~', 'pl': 'operator+', 'mi': 'operator-', 'ml': 'operator*',
    'dv': 'operator/', 'rm': 'operator%', 'an': 'operator&', 'or': 'operator|',
    'eo': 'operator^', 'aS': 'operator=', 'pL': 'operator+=', 'mI': 'operator-=',
    'mL': 'operator*=', 'dV': 'operator/=', 'eq': 'operator==', 'ne': 'operator!=',
    'lt': 'operator<', 'gt': 'operator>', 'le': 'operator<=', 'ge': 'operator>=',
    'ix': 'operator[]', 'cl': 'operator()', 'ls': 'operator<<', 'rs': 'operator>>',
  };
  if (position + 1 < input.length) {
    const opCode = input.slice(position, position + 2);
    const opName = operatorMap[opCode];
    if (opName) {
      return { name: opName, position: position + 2 };
    }
  }

  // Unknown — return remaining
  return { name: input.slice(position), position: input.length };
}

// ─── Rust v0 demangler ───

/**
 * Demangles Rust v0 symbol encoding (_R prefix).
 * The encoding uses single-character tags for path components:
 *   N = namespace (followed by a tag byte: C=closure, v=value, etc.)
 *   C = crate root (followed by a length-prefixed identifier)
 *   M/X/Y = impl paths (skipped in simplified output)
 *   I = generic arguments, s = disambiguator (skipped)
 *   E = end marker, h = hash suffix (terminates parsing)
 * Identifiers are decimal-length-prefixed with optional _ separator.
 */
function demangleRustV0(input: string): string {
  let position = 2; // skip _R
  const parts: string[] = [];

  while (position < input.length) {
    const char = input[position];

    if (char === 'N') {
      position++;
      if (position < input.length) {
        position++; // skip namespace tag (C=closure, v=value, etc.)
      }
      continue;
    }

    // Crate root: C<identifier>
    if (char === 'C') {
      position++;
      const ident = parseRustV0Identifier(input, position);
      parts.push(ident.name);
      position = ident.position;
      continue;
    }

    // Impl path: M, X, Y
    if (char === 'M' || char === 'X' || char === 'Y') {
      position++;
      continue;
    }

    // Identifier (starts with digit or underscore+digit)
    if (char >= '0' && char <= '9') {
      const ident = parseRustV0Identifier(input, position);
      parts.push(ident.name);
      position = ident.position;
      continue;
    }

    // Generic args, disambiguators, etc. — skip
    if (char === 'I' || char === 's') {
      position++;
      continue;
    }

    // End marker or unknown
    if (char === 'E') {
      position++;
      continue;
    }

    // Hash suffix: skip
    if (char === 'h') {
      break;
    }

    position++;
  }

  if (parts.length === 0) {
    return input;
  }
  return parts.join('::');
}

function parseRustV0Identifier(input: string, position: number): ParseResult {
  // Optional disambiguator: s<base-62-number>_
  if (position < input.length && input[position] === 's') {
    position++;
    while (position < input.length && input[position] !== '_') { position++; }
    if (position < input.length) { position++; } // skip _
  }

  // Length prefix (decimal)
  let length = 0;
  while (position < input.length && input[position] >= '0' && input[position] <= '9') {
    length = length * 10 + (input.charCodeAt(position) - 48);
    position++;
  }

  // Optional _ separator before identifier
  if (position < input.length && input[position] === '_') {
    position++;
  }

  const name = input.slice(position, position + length);
  return { name: decodeRustEscapes(name), position: position + length };
}

// ─── Rust escape decoder ───

const RUST_ESCAPES: Record<string, string> = {
  '$LT$': '<', '$GT$': '>', '$u20$': ' ', '$u27$': "'", '$u5b$': '[', '$u5d$': ']',
  '$u7b$': '{', '$u7d$': '}', '$u7e$': '~', '$u3b$': ';', '$u2b$': '+',
  '$u22$': '"', '$RF$': '&', '$BP$': '*', '$C$': ',', '$SP$': '@',
};

function stripRustHash(input: string): string {
  // Rust appends ::h<hex> as a hash suffix — strip it
  return input.replace(/::h[0-9a-fA-F]+E?$/, '');
}

function decodeRustEscapes(input: string): string {
  let result = input;
  for (const [escaped, decoded] of Object.entries(RUST_ESCAPES)) {
    result = result.split(escaped).join(decoded);
  }
  // Also replace .. with :: (Rust path separator in some encodings)
  result = result.replace(/\.\./g, '::');
  return result;
}
