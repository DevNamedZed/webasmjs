/**
 * One-time script to split the monolithic opcodes.json into feature-based sub-files.
 *
 * Usage: npx tsx generator/split-opcodes.ts
 *
 * This reads generator/opcodes.json (the flat array), groups entries by their
 * `feature` field, adds an `order` field to preserve the original array ordering,
 * and writes:
 *   - generator/opcodes/<feature>.json  (one per feature group)
 *   - generator/opcodes.json            (replaced with a manifest)
 */

import * as fs from 'fs';
import * as path from 'path';

interface OpCodeEntry {
  value: number;
  name: string;
  mnemonic: string;
  friendlyName: string;
  immediate: string | null;
  controlFlow: string | null;
  pop: string[] | null;
  push: string[] | null;
  prefix: number | null;
  feature: string | null;
  group: string;
}

const generatorDir = path.dirname(__filename);
const jsonPath = path.join(generatorDir, 'opcodes.json');
const outDir = path.join(generatorDir, 'opcodes');

// Read the monolithic file
const raw: OpCodeEntry[] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
console.log(`Read ${raw.length} opcodes from opcodes.json`);

// Group by feature, preserving original order via `order` field
const groups = new Map<string, (OpCodeEntry & { order: number })[]>();
raw.forEach((entry, index) => {
  const key = entry.feature || 'core';
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key)!.push({ ...entry, order: index });
});

// Create output directory
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Write each feature file
const featureFiles: string[] = [];
for (const [feature, entries] of groups) {
  const filename = `${feature}.json`;
  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(entries, null, 2) + '\n');
  featureFiles.push(`opcodes/${filename}`);
  console.log(`  ${filename}: ${entries.length} opcodes`);
}

// Write manifest (replaces the monolithic file)
const manifest = {
  description: 'WebAssembly opcode definitions, split by feature/proposal.',
  includes: featureFiles,
};
fs.writeFileSync(jsonPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nWrote manifest to opcodes.json with ${featureFiles.length} includes.`);
console.log('Done.');
