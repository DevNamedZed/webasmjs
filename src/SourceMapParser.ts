export interface SourceMap {
  version: number;
  sources: string[];
  sourcesContent?: (string | null)[];
  names: string[];
  mappings: string;
  file?: string;
  sourceRoot?: string;
}

export interface SourceMapping {
  generatedOffset: number;
  sourceIndex: number;
  sourceLine: number;
  sourceColumn: number;
  nameIndex: number | null;
}

export interface ParsedSourceMap {
  sources: string[];
  sourcesContent: (string | null)[];
  names: string[];
  mappings: SourceMapping[];
  sourceRoot: string;
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const BASE64_LOOKUP: number[] = new Array(128).fill(-1);
for (let charIndex = 0; charIndex < BASE64_CHARS.length; charIndex++) {
  BASE64_LOOKUP[BASE64_CHARS.charCodeAt(charIndex)] = charIndex;
}

const VLQ_BASE_SHIFT = 5;
const VLQ_BASE = 1 << VLQ_BASE_SHIFT;
const VLQ_BASE_MASK = VLQ_BASE - 1;
const VLQ_CONTINUATION_BIT = VLQ_BASE;

interface VlqDecodeResult {
  value: number;
  charsConsumed: number;
}

function decodeVlq(encoded: string, startPosition: number): VlqDecodeResult {
  let result = 0;
  let shift = 0;
  let position = startPosition;

  while (position < encoded.length) {
    const charCode = encoded.charCodeAt(position);
    const digit = BASE64_LOOKUP[charCode];
    if (digit === -1) {
      throw new Error(`Invalid base64 character '${encoded[position]}' at position ${position}`);
    }
    position++;

    const hasContinuation = (digit & VLQ_CONTINUATION_BIT) !== 0;
    result += (digit & VLQ_BASE_MASK) << shift;
    shift += VLQ_BASE_SHIFT;

    if (!hasContinuation) {
      // The lowest bit of the result encodes the sign.
      const isNegative = (result & 1) === 1;
      const magnitude = result >> 1;
      return {
        value: isNegative ? -magnitude : magnitude,
        charsConsumed: position - startPosition,
      };
    }
  }

  throw new Error('Unexpected end of VLQ-encoded string');
}

function decodeMappings(mappingsString: string): SourceMapping[] {
  const mappings: SourceMapping[] = [];

  if (mappingsString.length === 0) {
    return mappings;
  }

  // For WASM source maps, semicolons delimit "groups" but the generated column
  // (byte offset) is cumulative across groups. Each semicolon resets the
  // generated column to 0 in standard source maps (for text line breaks), but
  // for WASM the generated column represents absolute byte offsets within
  // segments separated by semicolons.
  // In practice, WASM source maps typically use a single line (no semicolons)
  // with comma-separated segments where the first field is a delta-encoded
  // byte offset.
  let generatedOffset = 0;
  let sourceIndex = 0;
  let sourceLine = 0;
  let sourceColumn = 0;
  let nameIndex = 0;

  const groups = mappingsString.split(';');

  for (const group of groups) {
    // Each semicolon resets the generated column per the V3 spec.
    generatedOffset = 0;

    if (group.length === 0) {
      continue;
    }

    const segments = group.split(',');

    for (const segment of segments) {
      if (segment.length === 0) {
        continue;
      }

      let position = 0;

      // Field 1: generated column (byte offset for WASM), always present.
      const offsetResult = decodeVlq(segment, position);
      generatedOffset += offsetResult.value;
      position += offsetResult.charsConsumed;

      if (position >= segment.length) {
        // Segments with only one field have no source information.
        continue;
      }

      // Field 2: source file index (delta-encoded).
      const sourceResult = decodeVlq(segment, position);
      sourceIndex += sourceResult.value;
      position += sourceResult.charsConsumed;

      // Field 3: source line (delta-encoded).
      const lineResult = decodeVlq(segment, position);
      sourceLine += lineResult.value;
      position += lineResult.charsConsumed;

      // Field 4: source column (delta-encoded).
      const columnResult = decodeVlq(segment, position);
      sourceColumn += columnResult.value;
      position += columnResult.charsConsumed;

      // Field 5 (optional): name index (delta-encoded).
      let resolvedNameIndex: number | null = null;
      if (position < segment.length) {
        const nameResult = decodeVlq(segment, position);
        nameIndex += nameResult.value;
        resolvedNameIndex = nameIndex;
      }

      mappings.push({
        generatedOffset,
        sourceIndex,
        sourceLine,
        sourceColumn,
        nameIndex: resolvedNameIndex,
      });
    }
  }

  // Sort by generated offset so binary search works correctly.
  mappings.sort((left, right) => left.generatedOffset - right.generatedOffset);

  return mappings;
}

export function parseSourceMap(json: string): ParsedSourceMap {
  const raw: SourceMap = JSON.parse(json);

  if (raw.version !== 3) {
    throw new Error(`Unsupported source map version: ${raw.version} (expected 3)`);
  }

  if (!Array.isArray(raw.sources)) {
    throw new Error('Source map is missing the "sources" field');
  }

  if (typeof raw.mappings !== 'string') {
    throw new Error('Source map is missing the "mappings" field');
  }

  const sourceRoot = raw.sourceRoot ?? '';
  const sourcesContent = raw.sourcesContent ?? raw.sources.map(() => null);
  const names = raw.names ?? [];

  return {
    sources: raw.sources,
    sourcesContent,
    names,
    mappings: decodeMappings(raw.mappings),
    sourceRoot,
  };
}

export function lookupMapping(mappings: SourceMapping[], wasmOffset: number): SourceMapping | null {
  if (mappings.length === 0) {
    return null;
  }

  let low = 0;
  let high = mappings.length - 1;

  // Find the last mapping whose generatedOffset is <= wasmOffset.
  while (low <= high) {
    const middle = (low + high) >>> 1;
    const middleOffset = mappings[middle].generatedOffset;

    if (middleOffset === wasmOffset) {
      return mappings[middle];
    } else if (middleOffset < wasmOffset) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  // 'high' is now the index of the last mapping with offset <= wasmOffset,
  // or -1 if all mappings have a larger offset.
  if (high < 0) {
    return null;
  }

  return mappings[high];
}

export function getSourceLine(sourceMap: ParsedSourceMap, mapping: SourceMapping): string | null {
  if (mapping.sourceIndex < 0 || mapping.sourceIndex >= sourceMap.sourcesContent.length) {
    return null;
  }

  const content = sourceMap.sourcesContent[mapping.sourceIndex];
  if (content === null) {
    return null;
  }

  const lines = content.split('\n');
  if (mapping.sourceLine < 0 || mapping.sourceLine >= lines.length) {
    return null;
  }

  return lines[mapping.sourceLine];
}
