import * as fs from 'fs';
import * as path from 'path';

interface OpCode {
  value: number;
  name: string;
  mnemonic: string;
  friendlyName: string;
  immediate: string | null;
  controlFlow: string | null;
  stackBehavior: string;
  popOperands: string[] | null;
  pushOperands: string[] | null;
  prefix: number | null;
  feature: string | null;
}

interface OperandInfo {
  param: string;
  call: string;
}

function getOperandInfo(operand: string | null): OperandInfo | null {
  switch (operand) {
    case 'VarUInt1':
      return { param: 'varUInt1: number', call: 'varUInt1' };
    case 'MemoryImmediate':
      return { param: 'alignment: number, offset: number', call: 'alignment, offset' };
    case 'IndirectFunction':
      return { param: 'funcTypeBuilder: any', call: 'funcTypeBuilder' };
    case 'BlockSignature':
      return { param: 'blockType: any, label?: any', call: 'blockType, label' };
    case 'Function':
      return { param: 'functionBuilder: any', call: 'functionBuilder' };
    case 'RelativeDepth':
      return { param: 'labelBuilder: any', call: 'labelBuilder' };
    case 'BranchTable':
      return { param: 'defaultLabelBuilder: any, ...labelBuilders: any[]', call: 'defaultLabelBuilder, labelBuilders' };
    case 'Global':
      return { param: 'global: any', call: 'global' };
    case 'Local':
      return { param: 'local: any', call: 'local' };
    case 'Float32':
      return { param: 'float32: number', call: 'float32' };
    case 'Float64':
      return { param: 'float64: number', call: 'float64' };
    case 'VarInt32':
      return { param: 'varInt32: number', call: 'varInt32' };
    case 'VarInt64':
      return { param: 'varInt64: number | bigint', call: 'varInt64' };
    case 'VarUInt32':
      return { param: 'varUInt32: number', call: 'varUInt32' };
    case 'V128Const':
      return { param: 'bytes: Uint8Array', call: 'bytes' };
    case 'LaneIndex':
      return { param: 'laneIndex: number', call: 'laneIndex' };
    case 'ShuffleMask':
      return { param: 'mask: Uint8Array', call: 'mask' };
    default:
      return null;
  }
}

function getStackBehavior(pop: string[] | null, push: string[] | null): string {
  const hasPop = pop && pop.length > 0;
  const hasPush = push && push.length > 0;
  if (hasPush && hasPop) return 'PopPush';
  if (hasPush) return 'Push';
  if (hasPop) return 'Pop';
  return 'None';
}

function parseOperands(value: string): string[] | null {
  if (!value || value === '') return null;
  return JSON.parse(value).filter((x: string) => x !== 'Arguments' && x !== 'Returns');
}

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"' && csv[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current);
        current = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && csv[i + 1] === '\n') i++;
        row.push(current);
        current = '';
        if (row.some((c) => c !== '')) rows.push(row);
        row = [];
      } else {
        current += ch;
      }
    }
  }

  row.push(current);
  if (row.some((c) => c !== '')) rows.push(row);

  return rows;
}

function parseOpcodes(data: string[][]): OpCode[] {
  const result: OpCode[] = [];
  // Header: value,name,mnemonic,friendlyName,immediate,controlflow,pop,push,prefix
  for (let index = 1; index < data.length; index++) {
    const row = data[index];
    if (!row[0] && row[0] !== '0') continue;

    const pop = parseOperands(row[6]);
    const push = parseOperands(row[7]);
    const isCall = row[1].startsWith('call');
    const stackBehavior = isCall ? 'PopPush' : getStackBehavior(
      pop && pop.length !== 0 ? pop : null,
      push && push.length !== 0 ? push : null
    );

    const prefixStr = row[8]?.trim();
    const prefix = prefixStr ? parseInt(prefixStr, 10) : null;
    const featureStr = row[9]?.trim();
    const feature = featureStr || null;

    result.push({
      value: parseInt(row[0], 10),
      name: row[1],
      mnemonic: row[2],
      friendlyName: row[3],
      immediate: row[4] || null,
      controlFlow: row[5] || null,
      stackBehavior,
      popOperands: pop,
      pushOperands: push,
      prefix,
      feature,
    });
  }

  return result;
}

function generateOpCodes(opCodes: OpCode[]): string {
  let out = "import type { OpCodeDef } from './types';\n\n";
  out += 'const OpCodes = {\n';

  for (const op of opCodes) {
    out += `  ${JSON.stringify(op.name)}: {\n`;
    out += `    value: ${op.value},\n`;
    out += `    mnemonic: ${JSON.stringify(op.mnemonic)},\n`;
    if (op.immediate) out += `    immediate: ${JSON.stringify(op.immediate)},\n`;
    if (op.controlFlow) out += `    controlFlow: ${JSON.stringify(op.controlFlow)},\n`;
    out += `    stackBehavior: ${JSON.stringify(op.stackBehavior)},\n`;
    if (op.popOperands) out += `    popOperands: ${JSON.stringify(op.popOperands)} as const,\n`;
    if (op.pushOperands) out += `    pushOperands: ${JSON.stringify(op.pushOperands)} as const,\n`;
    if (op.prefix !== null) out += `    prefix: ${op.prefix},\n`;
    if (op.feature) out += `    feature: ${JSON.stringify(op.feature)},\n`;
    out += '  },\n';
  }

  out += '} as const satisfies Record<string, OpCodeDef>;\n\n';
  out += 'export default OpCodes;\n';
  return out;
}

function generateOpCodeEmitter(opCodes: OpCode[]): string {
  let out = "import OpCodes from './OpCodes';\n\n";
  out += 'export default abstract class OpCodeEmitter {\n';

  for (const op of opCodes) {
    const immediateInfo = getOperandInfo(op.immediate);

    out += `  ${op.friendlyName}(`;
    if (immediateInfo) {
      out += immediateInfo.param;
    }
    out += '): any {\n';
    out += `    return this.emit(OpCodes.${op.name}`;
    if (immediateInfo) {
      out += `, ${immediateInfo.call}`;
    }
    out += ');\n';
    out += '  }\n\n';
  }

  out += '  abstract emit(opCode: any, ...args: any[]): any;\n';
  out += '}\n';
  return out;
}

// Main
const generatorDir = __dirname;
const csvPath = path.join(generatorDir, 'opcodes.csv');
const srcDir = path.join(generatorDir, '..', 'src');

const csv = fs.readFileSync(csvPath, 'utf8');
const csvData = parseCSV(csv);
const opcodeList = parseOpcodes(csvData);

const opCodesOutput = generateOpCodes(opcodeList);
const emitterOutput = generateOpCodeEmitter(opcodeList);

fs.writeFileSync(path.join(srcDir, 'OpCodes.ts'), opCodesOutput);
fs.writeFileSync(path.join(srcDir, 'OpCodeEmitter.ts'), emitterOutput);

console.log(`Generated ${opcodeList.length} opcodes.`);
console.log(`  OpCodes.ts written to ${path.join(srcDir, 'OpCodes.ts')}`);
console.log(`  OpCodeEmitter.ts written to ${path.join(srcDir, 'OpCodeEmitter.ts')}`);
