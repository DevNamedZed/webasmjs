import * as fs from 'fs';
import * as path from 'path';

interface OpCodeJson {
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
  order?: number;
}

interface OpCodeManifest {
  description: string;
  includes: string[];
}

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
  group: string;
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
    case 'TypeIndexField':
      return { param: 'typeIndex: number, fieldIndex: number', call: 'typeIndex, fieldIndex' };
    case 'TypeIndexIndex':
      return { param: 'typeIndex: number, index: number', call: 'typeIndex, index' };
    case 'HeapType':
      return { param: 'heapType: any', call: 'heapType' };
    case 'BrOnCast':
      return { param: 'flags: number, labelBuilder: any, heapType1: any, heapType2: any', call: 'flags, labelBuilder, heapType1, heapType2' };
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

function isManifest(data: unknown): data is OpCodeManifest {
  return typeof data === 'object' && data !== null && 'includes' in data && Array.isArray((data as OpCodeManifest).includes);
}

function loadRawOpcodes(jsonPath: string): OpCodeJson[] {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (isManifest(data)) {
    const dir = path.dirname(jsonPath);
    const entries: OpCodeJson[] = [];
    for (const include of data.includes) {
      const subPath = path.join(dir, include);
      const subEntries: OpCodeJson[] = JSON.parse(fs.readFileSync(subPath, 'utf8'));
      entries.push(...subEntries);
    }
    entries.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return entries;
  }
  return data;
}

function loadOpcodes(jsonPath: string): OpCode[] {
  const raw = loadRawOpcodes(jsonPath);

  return raw.map((entry) => {
    const pop = entry.pop && entry.pop.length > 0 ? entry.pop : null;
    const push = entry.push && entry.push.length > 0 ? entry.push : null;
    const isCall = entry.name.startsWith('call') || entry.name.startsWith('return_call');
    const stackBehavior = isCall ? 'PopPush' : getStackBehavior(pop, push);

    return {
      value: entry.value,
      name: entry.name,
      mnemonic: entry.mnemonic,
      friendlyName: entry.friendlyName,
      immediate: entry.immediate,
      controlFlow: entry.controlFlow,
      stackBehavior,
      popOperands: pop,
      pushOperands: push,
      prefix: entry.prefix,
      feature: entry.feature,
      group: entry.group,
    };
  });
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

function generateTests(opCodes: OpCode[]): string {
  let out = '// AUTO-GENERATED — do not edit. Run `npm run generate` to regenerate.\n';
  out += "import OpCodes from '../../src/OpCodes';\n";
  out += "import OpCodeEmitter from '../../src/OpCodeEmitter';\n\n";

  // Group opcodes
  const groups = new Map<string, OpCode[]>();
  for (const op of opCodes) {
    if (!groups.has(op.group)) groups.set(op.group, []);
    groups.get(op.group)!.push(op);
  }

  // Group opcodes by feature
  const features = new Map<string, OpCode[]>();
  for (const op of opCodes) {
    if (op.feature) {
      if (!features.has(op.feature)) features.set(op.feature, []);
      features.get(op.feature)!.push(op);
    }
  }

  out += `describe('OpCode definitions', () => {\n`;
  out += `  test('total opcode count is ${opCodes.length}', () => {\n`;
  out += `    expect(Object.keys(OpCodes).length).toBe(${opCodes.length});\n`;
  out += `  });\n\n`;

  // Per-group describe blocks
  for (const [group, ops] of groups) {
    out += `  describe('${group}', () => {\n`;
    for (const op of ops) {
      const checks: string[] = [];
      checks.push(`expect(op.value).toBe(${op.value})`);
      checks.push(`expect(op.mnemonic).toBe(${JSON.stringify(op.mnemonic)})`);
      if (op.prefix !== null) {
        checks.push(`expect(op.prefix).toBe(${op.prefix})`);
      }
      if (op.feature) {
        checks.push(`expect(op.feature).toBe(${JSON.stringify(op.feature)})`);
      }

      out += `    test('${op.name}', () => {\n`;
      out += `      const op = (OpCodes as any).${op.name};\n`;
      out += `      expect(op).toBeDefined();\n`;
      for (const check of checks) {
        out += `      ${check};\n`;
      }
      out += `    });\n\n`;
    }
    out += `  });\n\n`;
  }

  // Feature group summaries
  if (features.size > 0) {
    out += `  describe('feature groups', () => {\n`;
    for (const [feature, ops] of features) {
      const prefixes = new Set(ops.map((o) => o.prefix));
      const prefix = prefixes.size === 1 ? [...prefixes][0] : null;
      out += `    test('${feature}: ${ops.length} opcodes', () => {\n`;
      out += `      const ops = Object.values(OpCodes).filter((op: any) => op.feature === '${feature}');\n`;
      out += `      expect(ops.length).toBe(${ops.length});\n`;
      if (prefix !== null) {
        out += `      ops.forEach((op: any) => expect(op.prefix).toBe(${prefix}));\n`;
      }
      out += `    });\n\n`;
    }
    out += `  });\n`;
  }

  out += `});\n\n`;

  // Emitter method tests
  out += `describe('Emitter methods', () => {\n`;
  for (const [group, ops] of groups) {
    out += `  describe('${group}', () => {\n`;
    for (const op of ops) {
      out += `    test('${op.friendlyName}', () => {\n`;
      out += `      expect(typeof (OpCodeEmitter.prototype as any).${op.friendlyName}).toBe('function');\n`;
      out += `    });\n\n`;
    }
    out += `  });\n\n`;
  }
  out += `});\n`;

  return out;
}

// Main
const generatorDir = __dirname;
const jsonPath = path.join(generatorDir, 'opcodes.json');
const srcDir = path.join(generatorDir, '..', 'src');
const testsDir = path.join(generatorDir, '..', 'tests', 'generated');

const opcodeList = loadOpcodes(jsonPath);

const opCodesOutput = generateOpCodes(opcodeList);
const emitterOutput = generateOpCodeEmitter(opcodeList);
const testsOutput = generateTests(opcodeList);

fs.writeFileSync(path.join(srcDir, 'OpCodes.ts'), opCodesOutput);
fs.writeFileSync(path.join(srcDir, 'OpCodeEmitter.ts'), emitterOutput);

// Ensure tests/generated directory exists
if (!fs.existsSync(testsDir)) {
  fs.mkdirSync(testsDir, { recursive: true });
}
fs.writeFileSync(path.join(testsDir, 'OpCodes.test.ts'), testsOutput);

console.log(`Generated ${opcodeList.length} opcodes.`);
console.log(`  OpCodes.ts written to ${path.join(srcDir, 'OpCodes.ts')}`);
console.log(`  OpCodeEmitter.ts written to ${path.join(srcDir, 'OpCodeEmitter.ts')}`);
console.log(`  OpCodes.test.ts written to ${path.join(testsDir, 'OpCodes.test.ts')}`);
