import { ModuleInfo, FuncTypeInfo, TypeInfo } from '../BinaryReader';
import { DecodedInstruction } from '../InstructionDecoder';
import OpCodes from '../OpCodes';
import type { OpCodeDef } from '../types';
import { BasicBlock, ControlFlowGraph } from './ControlFlowGraph';

/** Maps comparison operators to their logical inverses. */
export const COMPARE_INVERT: Record<string, string> = {
  '==': '!=', '!=': '==', '<': '>=', '>': '<=', '<=': '>', '>=': '<',
  '<u': '>=u', '>u': '<=u', '<=u': '>u', '>=u': '<u',
};

export interface SsaVariable {
  id: number;
  name: string;
  type: string;
  definedInBlock: number;
}

export type SsaValue = SsaVariable | SsaConst;

export interface SsaConst {
  kind: 'const';
  value: number | bigint;
  type: string;
}

export function isVariable(value: SsaValue): value is SsaVariable {
  return 'id' in value;
}

export function isConst(value: SsaValue): value is SsaConst {
  return 'kind' in value && (value as SsaConst).kind === 'const';
}

export type SsaInstr =
  | { kind: 'phi'; result: SsaVariable; inputs: { blockId: number; value: SsaValue }[] }
  | { kind: 'assign'; result: SsaVariable; value: SsaValue }
  | { kind: 'const'; result: SsaVariable; value: number | bigint; type: string }
  | { kind: 'binary'; result: SsaVariable; op: string; left: SsaValue; right: SsaValue }
  | { kind: 'unary'; result: SsaVariable; op: string; operand: SsaValue }
  | { kind: 'compare'; result: SsaVariable; op: string; left: SsaValue; right: SsaValue }
  | { kind: 'load'; result: SsaVariable; address: SsaValue; offset: number; loadType: string }
  | { kind: 'store'; address: SsaValue; value: SsaValue; offset: number; storeType: string }
  | { kind: 'call'; result: SsaVariable | null; target: number; args: SsaValue[] }
  | { kind: 'call_indirect'; result: SsaVariable | null; tableIndex: SsaValue; typeIndex: number; args: SsaValue[] }
  | { kind: 'convert'; result: SsaVariable; op: string; operand: SsaValue }
  | { kind: 'select'; result: SsaVariable; condition: SsaValue; trueVal: SsaValue; falseVal: SsaValue }
  | { kind: 'global_get'; result: SsaVariable; globalIndex: number }
  | { kind: 'global_set'; globalIndex: number; value: SsaValue }
  | { kind: 'branch'; target: number }
  | { kind: 'branch_if'; condition: SsaValue; trueTarget: number; falseTarget: number }
  | { kind: 'branch_table'; selector: SsaValue; targets: number[]; defaultTarget: number }
  | { kind: 'return'; value: SsaValue | null }
  | { kind: 'unreachable' };

export interface SsaBlock {
  id: number;
  instructions: SsaInstr[];
  successors: number[];
  predecessors: number[];
}

export interface SsaFunction {
  blocks: SsaBlock[];
  variables: SsaVariable[];
  paramCount: number;
  localCount: number;
  entryBlockId: number;
  exitBlockId: number;
}

// ─── Opcode lookup tables built from OpCodes ───

const BINARY_OPS = new Map<OpCodeDef, string>([
  [OpCodes.i32_add, '+'], [OpCodes.i64_add, '+'], [OpCodes.f32_add, '+'], [OpCodes.f64_add, '+'],
  [OpCodes.i32_sub, '-'], [OpCodes.i64_sub, '-'], [OpCodes.f32_sub, '-'], [OpCodes.f64_sub, '-'],
  [OpCodes.i32_mul, '*'], [OpCodes.i64_mul, '*'], [OpCodes.f32_mul, '*'], [OpCodes.f64_mul, '*'],
  [OpCodes.i32_div_s, '/'], [OpCodes.i64_div_s, '/'], [OpCodes.f32_div, '/'], [OpCodes.f64_div, '/'],
  [OpCodes.i32_div_u, '/u'], [OpCodes.i64_div_u, '/u'],
  [OpCodes.i32_rem_s, '%'], [OpCodes.i64_rem_s, '%'], [OpCodes.i32_rem_u, '%u'], [OpCodes.i64_rem_u, '%u'],
  [OpCodes.i32_and, '&'], [OpCodes.i64_and, '&'], [OpCodes.i32_or, '|'], [OpCodes.i64_or, '|'],
  [OpCodes.i32_xor, '^'], [OpCodes.i64_xor, '^'],
  [OpCodes.i32_shl, '<<'], [OpCodes.i64_shl, '<<'],
  [OpCodes.i32_shr_s, '>>'], [OpCodes.i64_shr_s, '>>'], [OpCodes.i32_shr_u, '>>>'], [OpCodes.i64_shr_u, '>>>'],
  [OpCodes.i32_rotl, 'rotl'], [OpCodes.i64_rotl, 'rotl'], [OpCodes.i32_rotr, 'rotr'], [OpCodes.i64_rotr, 'rotr'],
  [OpCodes.f32_min, 'min'], [OpCodes.f64_min, 'min'], [OpCodes.f32_max, 'max'], [OpCodes.f64_max, 'max'],
  [OpCodes.f32_copysign, 'copysign'], [OpCodes.f64_copysign, 'copysign'],
]);

const COMPARE_OPS = new Map<OpCodeDef, string>([
  [OpCodes.i32_eq, '=='], [OpCodes.i64_eq, '=='], [OpCodes.f32_eq, '=='], [OpCodes.f64_eq, '=='],
  [OpCodes.i32_ne, '!='], [OpCodes.i64_ne, '!='], [OpCodes.f32_ne, '!='], [OpCodes.f64_ne, '!='],
  [OpCodes.i32_lt_s, '<'], [OpCodes.i64_lt_s, '<'], [OpCodes.f32_lt, '<'], [OpCodes.f64_lt, '<'],
  [OpCodes.i32_lt_u, '<u'], [OpCodes.i64_lt_u, '<u'],
  [OpCodes.i32_gt_s, '>'], [OpCodes.i64_gt_s, '>'], [OpCodes.f32_gt, '>'], [OpCodes.f64_gt, '>'],
  [OpCodes.i32_gt_u, '>u'], [OpCodes.i64_gt_u, '>u'],
  [OpCodes.i32_le_s, '<='], [OpCodes.i64_le_s, '<='], [OpCodes.f32_le, '<='], [OpCodes.f64_le, '<='],
  [OpCodes.i32_le_u, '<=u'], [OpCodes.i64_le_u, '<=u'],
  [OpCodes.i32_ge_s, '>='], [OpCodes.i64_ge_s, '>='], [OpCodes.f32_ge, '>='], [OpCodes.f64_ge, '>='],
  [OpCodes.i32_ge_u, '>=u'], [OpCodes.i64_ge_u, '>=u'],
]);

const UNARY_OPS = new Map<OpCodeDef, string>([
  [OpCodes.i32_clz, 'clz'], [OpCodes.i64_clz, 'clz'], [OpCodes.i32_ctz, 'ctz'], [OpCodes.i64_ctz, 'ctz'],
  [OpCodes.i32_popcnt, 'popcnt'], [OpCodes.i64_popcnt, 'popcnt'],
  [OpCodes.f32_abs, 'abs'], [OpCodes.f64_abs, 'abs'], [OpCodes.f32_neg, 'neg'], [OpCodes.f64_neg, 'neg'],
  [OpCodes.f32_ceil, 'ceil'], [OpCodes.f64_ceil, 'ceil'], [OpCodes.f32_floor, 'floor'], [OpCodes.f64_floor, 'floor'],
  [OpCodes.f32_trunc, 'trunc'], [OpCodes.f64_trunc, 'trunc'],
  [OpCodes.f32_nearest, 'nearest'], [OpCodes.f64_nearest, 'nearest'],
  [OpCodes.f32_sqrt, 'sqrt'], [OpCodes.f64_sqrt, 'sqrt'],
  [OpCodes.i32_extend8_s, 'extend8_s'], [OpCodes.i32_extend16_s, 'extend16_s'],
  [OpCodes.i64_extend8_s, 'extend8_s'], [OpCodes.i64_extend16_s, 'extend16_s'], [OpCodes.i64_extend32_s, 'extend32_s'],
]);

const CONVERSION_OPS = new Map<OpCodeDef, string>([
  [OpCodes.i32_wrap_i64, '(int)'], [OpCodes.i64_extend_i32_s, '(long)'], [OpCodes.i64_extend_i32_u, '(unsigned long)'],
  [OpCodes.f32_convert_i32_s, '(float)'], [OpCodes.f32_convert_i32_u, '(float)(unsigned)'],
  [OpCodes.f32_convert_i64_s, '(float)'], [OpCodes.f32_convert_i64_u, '(float)(unsigned long)'],
  [OpCodes.f64_convert_i32_s, '(double)'], [OpCodes.f64_convert_i32_u, '(double)(unsigned)'],
  [OpCodes.f64_convert_i64_s, '(double)'], [OpCodes.f64_convert_i64_u, '(double)(unsigned long)'],
  [OpCodes.i32_trunc_f32_s, '(int)'], [OpCodes.i32_trunc_f32_u, '(unsigned)'],
  [OpCodes.i32_trunc_f64_s, '(int)'], [OpCodes.i32_trunc_f64_u, '(unsigned)'],
  [OpCodes.i64_trunc_f32_s, '(long)'], [OpCodes.i64_trunc_f64_s, '(long)'],
  [OpCodes.f32_demote_f64, '(float)'], [OpCodes.f64_promote_f32, '(double)'],
  [OpCodes.i32_reinterpret_f32, 'reinterpret_i32'], [OpCodes.i64_reinterpret_f64, 'reinterpret_i64'],
  [OpCodes.f32_reinterpret_i32, 'reinterpret_f32'], [OpCodes.f64_reinterpret_i64, 'reinterpret_f64'],
  [OpCodes.i32_trunc_sat_f32_s, '(int)'], [OpCodes.i32_trunc_sat_f32_u, '(unsigned)'],
  [OpCodes.i32_trunc_sat_f64_s, '(int)'], [OpCodes.i32_trunc_sat_f64_u, '(unsigned)'],
  [OpCodes.i64_trunc_sat_f32_s, '(long)'], [OpCodes.i64_trunc_sat_f32_u, '(unsigned long)'],
  [OpCodes.i64_trunc_sat_f64_s, '(long)'], [OpCodes.i64_trunc_sat_f64_u, '(unsigned long)'],
]);

// ─── Helpers ───

function wasmTypeStr(valueType: number | { name: string }): string {
  if (typeof valueType === 'object' && 'name' in valueType) {
    return valueType.name;
  }
  const names: Record<number, string> = {
    [-1]: 'i32', [-2]: 'i64', [-3]: 'f32', [-4]: 'f64', [-5]: 'v128',
    0x7f: 'i32', 0x7e: 'i64', 0x7d: 'f32', 0x7c: 'f64', 0x7b: 'v128',
  };
  return names[valueType] || 'i32';
}

function flattenTypes(moduleInfo: ModuleInfo): TypeInfo[] {
  const flat: TypeInfo[] = [];
  for (const typeEntry of moduleInfo.types) {
    if (typeEntry.kind === 'rec') {
      for (const inner of typeEntry.types) { flat.push(inner); }
    } else {
      flat.push(typeEntry);
    }
  }
  return flat;
}

function resultTypeFromOpCode(opCode: OpCodeDef): string {
  return opCode.mnemonic.split('.')[0];
}

/**
 * Constructs SSA form from the CFG by simulating the WASM operand stack per block.
 * Processes blocks in reverse-postorder. At merge points, phi nodes are inserted
 * for both stack slots and local variables. Loop headers use a two-pass approach:
 * phis are created with placeholder inputs on the first pass, then patched with
 * actual back-edge values after all loop body blocks have been processed.
 */
export function buildSsa(
  cfg: ControlFlowGraph,
  moduleInfo: ModuleInfo,
  localFuncIndex: number,
): SsaFunction {
  const importedFunctions = moduleInfo.imports.filter(imp => imp.kind === 0);
  const importedGlobals = moduleInfo.imports.filter(imp => imp.kind === 3);
  const importedFuncCount = importedFunctions.length;
  const func = moduleInfo.functions[localFuncIndex];
  const flatTypes = flattenTypes(moduleInfo);
  const funcTypeRaw = flatTypes[func.typeIndex];
  if (!funcTypeRaw || funcTypeRaw.kind !== 'func') {
    return { blocks: [], variables: [], paramCount: 0, localCount: 0, entryBlockId: 0, exitBlockId: 0 };
  }
  const funcType = funcTypeRaw as FuncTypeInfo;

  const paramCount = funcType.parameterTypes.length;
  let totalLocalCount = paramCount;
  for (const localGroup of func.locals) {
    totalLocalCount += localGroup.count;
  }

  let variableCounter = 0;
  const allVariables: SsaVariable[] = [];

  function newVariable(name: string, type: string, blockId: number): SsaVariable {
    const variable: SsaVariable = { id: variableCounter++, name, type, definedInBlock: blockId };
    allVariables.push(variable);
    return variable;
  }

  function getLocalType(localIndex: number): string {
    if (localIndex < paramCount) {
      return wasmTypeStr(funcType.parameterTypes[localIndex]);
    }
    let offset = paramCount;
    for (const localGroup of func.locals) {
      if (localIndex < offset + localGroup.count) {
        return wasmTypeStr(localGroup.type);
      }
      offset += localGroup.count;
    }
    return 'i32';
  }

  function getGlobalType(globalIndex: number): string {
    const importedGlobalCount = importedGlobals.length;
    if (globalIndex >= importedGlobalCount && globalIndex - importedGlobalCount < moduleInfo.globals.length) {
      return wasmTypeStr(moduleInfo.globals[globalIndex - importedGlobalCount].valueType);
    }
    if (globalIndex < importedGlobalCount) {
      const globalImport = importedGlobals[globalIndex];
      if (globalImport?.globalType) {
        return wasmTypeStr(globalImport.globalType.valueType);
      }
    }
    return 'i32';
  }

  function getCallTargetType(targetIndex: number): FuncTypeInfo | null {
    if (targetIndex < importedFuncCount) {
      const importEntry = importedFunctions[targetIndex];
      if (importEntry?.typeIndex !== undefined && importEntry.typeIndex < flatTypes.length) {
        const typeEntry = flatTypes[importEntry.typeIndex];
        if (typeEntry.kind === 'func') { return typeEntry; }
      }
    } else {
      const localIdx = targetIndex - importedFuncCount;
      if (localIdx < moduleInfo.functions.length) {
        const targetFunc = moduleInfo.functions[localIdx];
        if (targetFunc.typeIndex < flatTypes.length) {
          const typeEntry = flatTypes[targetFunc.typeIndex];
          if (typeEntry.kind === 'func') { return typeEntry; }
        }
      }
    }
    return null;
  }

  const ssaBlocks: SsaBlock[] = cfg.blocks.map(cfgBlock => ({
    id: cfgBlock.id,
    instructions: [],
    successors: cfgBlock.successors.map(successor => successor.id),
    predecessors: cfgBlock.predecessors.map(predecessor => predecessor.id),
  }));

  const localVersions = new Map<number, Map<number, SsaVariable>>();
  const stackAtExit = new Map<number, SsaValue[]>();
  for (const block of cfg.blocks) {
    localVersions.set(block.id, new Map());
  }

  const entryLocals = localVersions.get(cfg.entry.id)!;
  for (let localIndex = 0; localIndex < paramCount; localIndex++) {
    entryLocals.set(localIndex, newVariable(`param${localIndex}`, getLocalType(localIndex), cfg.entry.id));
  }
  for (let localIndex = paramCount; localIndex < totalLocalCount; localIndex++) {
    entryLocals.set(localIndex, newVariable(`local${localIndex}`, getLocalType(localIndex), cfg.entry.id));
  }

  const blockOrder = computeReversePostOrder(cfg);
  const processedBlocks = new Set<number>();

  // Track incomplete phis that need back-edge inputs patched
  const incompletePhis: { phi: SsaInstr & { kind: 'phi' }; blockId: number; localIndex: number }[] = [];

  for (const cfgBlock of blockOrder) {
    const ssaBlock = ssaBlocks[cfgBlock.id];
    const stack: SsaValue[] = [];

    // Inherit stack from predecessors
    const hasStackBackEdge = cfgBlock.predecessors.some(pred => !processedBlocks.has(pred.id));
    if (cfgBlock.predecessors.length === 1 && !hasStackBackEdge) {
      const predStack = stackAtExit.get(cfgBlock.predecessors[0].id);
      if (predStack) { stack.push(...predStack); }
    } else if (cfgBlock.predecessors.length > 1) {
      const processedPreds = cfgBlock.predecessors.filter(pred => processedBlocks.has(pred.id));
      const predStacks = processedPreds.map(pred => stackAtExit.get(pred.id) || []);
      const maxDepth = Math.max(0, ...predStacks.map(s => s.length));
      for (let slotIndex = 0; slotIndex < maxDepth; slotIndex++) {
        const values = predStacks.map(s => slotIndex < s.length ? s[slotIndex] : null).filter((v): v is SsaValue => v !== null);
        if (values.length === 0) { continue; }
        if (hasStackBackEdge) {
          // Loop header phi (pass 1): create with known forward-edge values as placeholders.
          // Back-edge inputs are patched in pass 2 after loop body processing completes.
          const phiVar = newVariable(`stack_${slotIndex}_b${cfgBlock.id}`, 'i32', cfgBlock.id);
          const phiInstr: SsaInstr & { kind: 'phi' } = {
            kind: 'phi',
            result: phiVar,
            inputs: cfgBlock.predecessors.map((pred, predIdx) => {
              const predStack = stackAtExit.get(pred.id) || [];
              return { blockId: pred.id, value: predStack[slotIndex] || values[0] };
            }),
          };
          ssaBlock.instructions.push(phiInstr);
          incompletePhis.push({ phi: phiInstr, blockId: cfgBlock.id, localIndex: -(slotIndex + 1) });
          stack.push(phiVar);
        } else {
          const allSameVar = values.every(v => 'id' in v && !('kind' in v) && v.id === (values[0] as SsaVariable).id);
          if (allSameVar) {
            stack.push(values[0]);
          } else {
            const phiVar = newVariable(`stack_${slotIndex}_b${cfgBlock.id}`, 'i32', cfgBlock.id);
            ssaBlock.instructions.push({ kind: 'phi', result: phiVar, inputs: cfgBlock.predecessors.map((pred, predIdx) => ({ blockId: pred.id, value: (stackAtExit.get(pred.id) || [])[slotIndex] || values[0] })) });
            stack.push(phiVar);
          }
        }
      }
    }

    // Inherit locals from predecessors
    const hasBackEdge = cfgBlock.predecessors.some(pred => !processedBlocks.has(pred.id));
    const currentLocals = new Map<number, SsaVariable>(localVersions.get(cfgBlock.id) || new Map());
    if (cfgBlock.predecessors.length === 1 && !hasBackEdge) {
      const predLocals = localVersions.get(cfgBlock.predecessors[0].id);
      if (predLocals) {
        for (const [localIndex, variable] of predLocals) {
          if (!currentLocals.has(localIndex)) { currentLocals.set(localIndex, variable); }
        }
      }
    } else if (cfgBlock.predecessors.length > 1) {
      const allLocalIndices = new Set<number>();
      for (const predecessor of cfgBlock.predecessors) {
        const predLocals = localVersions.get(predecessor.id);
        if (predLocals) {
          for (const localIndex of predLocals.keys()) { allLocalIndices.add(localIndex); }
        }
      }

      if (hasBackEdge) {
        // Loop header phi (pass 1): create phis for all known locals with forward-edge values.
        // Back-edge inputs are patched after the loop body has been fully processed.
        for (const localIndex of allLocalIndices) {
          const knownVersions = cfgBlock.predecessors
            .filter(pred => processedBlocks.has(pred.id))
            .map(pred => (localVersions.get(pred.id) || new Map()).get(localIndex))
            .filter((version): version is SsaVariable => version !== undefined);
          if (knownVersions.length === 0) { continue; }
          const phiVar = newVariable(`phi_${localIndex}_b${cfgBlock.id}`, knownVersions[0].type, cfgBlock.id);
          const phiInstr: SsaInstr & { kind: 'phi' } = {
            kind: 'phi',
            result: phiVar,
            inputs: cfgBlock.predecessors.map(pred => {
              const predLocal = (localVersions.get(pred.id) || new Map()).get(localIndex);
              return { blockId: pred.id, value: predLocal || knownVersions[0] };
            }),
          };
          ssaBlock.instructions.push(phiInstr);
          currentLocals.set(localIndex, phiVar);
          incompletePhis.push({ phi: phiInstr, blockId: cfgBlock.id, localIndex });
        }
      } else {
        for (const localIndex of allLocalIndices) {
          const versions = cfgBlock.predecessors
            .map(pred => (localVersions.get(pred.id) || new Map()).get(localIndex))
            .filter((version): version is SsaVariable => version !== undefined);
          const allSame = versions.length > 0 && versions.every(version => version.id === versions[0].id);
          if (allSame && versions.length > 0) {
            currentLocals.set(localIndex, versions[0]);
          } else if (versions.length > 0) {
            const phiVar = newVariable(`phi_${localIndex}_b${cfgBlock.id}`, versions[0].type, cfgBlock.id);
            ssaBlock.instructions.push({ kind: 'phi', result: phiVar, inputs: cfgBlock.predecessors.map(pred => ({ blockId: pred.id, value: (localVersions.get(pred.id) || new Map()).get(localIndex) || versions[0] })) });
            currentLocals.set(localIndex, phiVar);
          }
        }
      }
    }

    // Process instructions
    for (const instruction of cfgBlock.instructions) {
      const opCode = instruction.opCode;

      // Skip structural markers
      if (opCode === OpCodes.nop || opCode === OpCodes.block || opCode === OpCodes.loop || opCode === OpCodes.end || opCode === OpCodes.else ||
          opCode === OpCodes.try || opCode === OpCodes.catch || opCode === OpCodes.catch_all || opCode === OpCodes.delegate) {
        continue;
      }

      // If — pops condition, creates branch_if
      if (opCode === OpCodes.if) {
        const condition = stack.pop();
        if (condition && cfgBlock.successors.length >= 2) {
          ssaBlock.instructions.push({ kind: 'branch_if', condition, trueTarget: cfgBlock.successors[0].id, falseTarget: cfgBlock.successors[1].id });
        }
        continue;
      }

      // Local access
      if (opCode === OpCodes.get_local) {
        const localIndex = instruction.immediates.values[0] as number;
        const variable = currentLocals.get(localIndex);
        stack.push(variable || newVariable(`local${localIndex}`, getLocalType(localIndex), cfgBlock.id));
        continue;
      }
      if (opCode === OpCodes.set_local) {
        const localIndex = instruction.immediates.values[0] as number;
        const value = stack.pop();
        if (value) {
          const newVar = newVariable(`local${localIndex}_v${variableCounter}`, getLocalType(localIndex), cfgBlock.id);
          ssaBlock.instructions.push({ kind: 'assign', result: newVar, value });
          currentLocals.set(localIndex, newVar);
        }
        continue;
      }
      if (opCode === OpCodes.tee_local) {
        const localIndex = instruction.immediates.values[0] as number;
        const value = stack.pop();
        if (value) {
          const newVar = newVariable(`local${localIndex}_v${variableCounter}`, getLocalType(localIndex), cfgBlock.id);
          ssaBlock.instructions.push({ kind: 'assign', result: newVar, value });
          currentLocals.set(localIndex, newVar);
          stack.push(newVar);
        }
        continue;
      }

      // Global access
      if (opCode === OpCodes.get_global) {
        const globalIndex = instruction.immediates.values[0] as number;
        const result = newVariable(`g${globalIndex}_v${variableCounter}`, getGlobalType(globalIndex), cfgBlock.id);
        ssaBlock.instructions.push({ kind: 'global_get', result, globalIndex });
        stack.push(result);
        continue;
      }
      if (opCode === OpCodes.set_global) {
        const globalIndex = instruction.immediates.values[0] as number;
        const value = stack.pop();
        if (value) { ssaBlock.instructions.push({ kind: 'global_set', globalIndex, value }); }
        continue;
      }

      // Constants
      if (opCode === OpCodes.i32_const || opCode === OpCodes.i64_const || opCode === OpCodes.f32_const || opCode === OpCodes.f64_const) {
        const constType = resultTypeFromOpCode(opCode);
        const result = newVariable(`c${variableCounter}`, constType, cfgBlock.id);
        ssaBlock.instructions.push({ kind: 'const', result, value: instruction.immediates.values[0], type: constType });
        stack.push(result);
        continue;
      }

      // Binary ops
      const binaryOp = BINARY_OPS.get(opCode);
      if (binaryOp) {
        const right = stack.pop();
        const left = stack.pop();
        if (left && right) {
          const result = newVariable(`t${variableCounter}`, resultTypeFromOpCode(opCode), cfgBlock.id);
          ssaBlock.instructions.push({ kind: 'binary', result, op: binaryOp, left, right });
          stack.push(result);
        }
        continue;
      }

      // Compare ops
      const compareOp = COMPARE_OPS.get(opCode);
      if (compareOp) {
        const right = stack.pop();
        const left = stack.pop();
        if (left && right) {
          const result = newVariable(`t${variableCounter}`, 'i32', cfgBlock.id);
          ssaBlock.instructions.push({ kind: 'compare', result, op: compareOp, left, right });
          stack.push(result);
        }
        continue;
      }

      // Eqz (negation)
      if (opCode === OpCodes.i32_eqz || opCode === OpCodes.i64_eqz) {
        const operand = stack.pop();
        if (operand) {
          const result = newVariable(`t${variableCounter}`, 'i32', cfgBlock.id);
          ssaBlock.instructions.push({ kind: 'unary', result, op: '!', operand });
          stack.push(result);
        }
        continue;
      }

      // Unary ops
      const unaryOp = UNARY_OPS.get(opCode);
      if (unaryOp) {
        const operand = stack.pop();
        if (operand) {
          const result = newVariable(`t${variableCounter}`, resultTypeFromOpCode(opCode), cfgBlock.id);
          ssaBlock.instructions.push({ kind: 'unary', result, op: unaryOp, operand });
          stack.push(result);
        }
        continue;
      }

      // Conversion ops
      const conversionOp = CONVERSION_OPS.get(opCode);
      if (conversionOp) {
        const operand = stack.pop();
        if (operand) {
          const result = newVariable(`t${variableCounter}`, resultTypeFromOpCode(opCode), cfgBlock.id);
          ssaBlock.instructions.push({ kind: 'convert', result, op: conversionOp, operand });
          stack.push(result);
        }
        continue;
      }

      // Atomic RMW operations (pop address + value, push old value)
      if (opCode.mnemonic.includes('atomic.rmw')) {
        const offset = instruction.immediates.values.length > 1 ? instruction.immediates.values[1] as number : 0;
        if (opCode.mnemonic.includes('cmpxchg')) {
          const replacement = stack.pop();
          const expected = stack.pop();
          const address = stack.pop();
          if (address && expected && replacement) {
            const result = newVariable(`t${variableCounter}`, resultTypeFromOpCode(opCode), cfgBlock.id);
            const offsetAddr: SsaValue = offset > 0
              ? (() => { const r = newVariable(`t${variableCounter}`, 'i32', cfgBlock.id); ssaBlock.instructions.push({ kind: 'binary', result: r, op: '+', left: address, right: { kind: 'const', value: offset, type: 'i32' } }); return r; })()
              : address;
            ssaBlock.instructions.push({ kind: 'call', result, target: -3, args: [offsetAddr, expected, replacement] });
            stack.push(result);
          }
        } else {
          const value = stack.pop();
          const address = stack.pop();
          if (address) {
            const result = newVariable(`t${variableCounter}`, resultTypeFromOpCode(opCode), cfgBlock.id);
            ssaBlock.instructions.push({ kind: 'load', result, address, offset, loadType: opCode.mnemonic });
            stack.push(result);
          }
        }
        continue;
      }

      // Atomic wait/notify
      if (opCode.mnemonic.includes('atomic.notify') || opCode.mnemonic.includes('atomic.wait')) {
        const extra = opCode.mnemonic.includes('wait') ? stack.pop() : undefined;
        const value = stack.pop();
        const address = stack.pop();
        if (address) {
          const result = newVariable(`t${variableCounter}`, 'i32', cfgBlock.id);
          ssaBlock.instructions.push({ kind: 'load', result, address, offset: 0, loadType: opCode.mnemonic });
          stack.push(result);
        }
        continue;
      }

      // Memory loads
      if (opCode.immediate === 'MemoryImmediate' && opCode.mnemonic.includes('load')) {
        const offset = instruction.immediates.values.length > 1 ? instruction.immediates.values[1] as number : 0;
        const address = stack.pop();
        if (address) {
          const result = newVariable(`t${variableCounter}`, resultTypeFromOpCode(opCode), cfgBlock.id);
          ssaBlock.instructions.push({ kind: 'load', result, address, offset, loadType: opCode.mnemonic });
          stack.push(result);
        }
        continue;
      }

      // Memory stores
      if (opCode.immediate === 'MemoryImmediate' && opCode.mnemonic.includes('store')) {
        const offset = instruction.immediates.values.length > 1 ? instruction.immediates.values[1] as number : 0;
        const value = stack.pop();
        const address = stack.pop();
        if (address && value) {
          ssaBlock.instructions.push({ kind: 'store', address, value, offset, storeType: opCode.mnemonic });
        }
        continue;
      }

      // Calls
      if (opCode === OpCodes.call || opCode === OpCodes.return_call) {
        const targetIndex = instruction.immediates.values[0] as number;
        const targetType = getCallTargetType(targetIndex);
        if (targetType) {
          const args: SsaValue[] = [];
          for (let argIndex = 0; argIndex < targetType.parameterTypes.length; argIndex++) {
            const arg = stack.pop();
            if (arg) { args.unshift(arg); }
          }
          let result: SsaVariable | null = null;
          if (targetType.returnTypes.length > 0) {
            result = newVariable(`t${variableCounter}`, wasmTypeStr(targetType.returnTypes[0]), cfgBlock.id);
            stack.push(result);
          }
          ssaBlock.instructions.push({ kind: 'call', result, target: targetIndex, args });
          // Push dummy values for additional return values to keep stack balanced
          for (let retIdx = 1; retIdx < targetType.returnTypes.length; retIdx++) {
            const extraResult = newVariable(`t${variableCounter}`, wasmTypeStr(targetType.returnTypes[retIdx]), cfgBlock.id);
            ssaBlock.instructions.push({ kind: 'assign', result: extraResult, value: result! });
            stack.push(extraResult);
          }
        }
        continue;
      }

      if (opCode === OpCodes.call_indirect || opCode === OpCodes.return_call_indirect) {
        const typeIdx = instruction.immediates.values[0] as number;
        const tableIndex = stack.pop();
        const calleeType = typeIdx < flatTypes.length ? flatTypes[typeIdx] : null;
        if (calleeType && calleeType.kind === 'func' && tableIndex) {
          const args: SsaValue[] = [];
          for (let argIndex = 0; argIndex < calleeType.parameterTypes.length; argIndex++) {
            const arg = stack.pop();
            if (arg) { args.unshift(arg); }
          }
          let result: SsaVariable | null = null;
          if (calleeType.returnTypes.length > 0) {
            result = newVariable(`t${variableCounter}`, wasmTypeStr(calleeType.returnTypes[0]), cfgBlock.id);
            stack.push(result);
          }
          ssaBlock.instructions.push({ kind: 'call_indirect', result, tableIndex, typeIndex: typeIdx, args });
          for (let retIdx = 1; retIdx < calleeType.returnTypes.length; retIdx++) {
            const extraResult = newVariable(`t${variableCounter}`, wasmTypeStr(calleeType.returnTypes[retIdx]), cfgBlock.id);
            ssaBlock.instructions.push({ kind: 'assign', result: extraResult, value: result! });
            stack.push(extraResult);
          }
        }
        continue;
      }

      // Misc
      if (opCode === OpCodes.drop) { stack.pop(); continue; }

      if (opCode === OpCodes.select) {
        const condition = stack.pop();
        const falseVal = stack.pop();
        const trueVal = stack.pop();
        if (condition && falseVal && trueVal) {
          const selectType = ('type' in trueVal && typeof trueVal.type === 'string') ? trueVal.type : 'i32';
          const result = newVariable(`t${variableCounter}`, selectType, cfgBlock.id);
          ssaBlock.instructions.push({ kind: 'select', result, condition, trueVal, falseVal });
          stack.push(result);
        }
        continue;
      }

      // Branches
      if (opCode === OpCodes.br) {
        const targetBlock = cfgBlock.successors[0];
        if (targetBlock) { ssaBlock.instructions.push({ kind: 'branch', target: targetBlock.id }); }
        continue;
      }

      if (opCode === OpCodes.br_if) {
        const condition = stack.pop();
        if (condition && cfgBlock.successors.length >= 2) {
          ssaBlock.instructions.push({ kind: 'branch_if', condition, trueTarget: cfgBlock.successors[0].id, falseTarget: cfgBlock.successors[1].id });
        }
        continue;
      }

      if (opCode === OpCodes.br_table) {
        const selector = stack.pop();
        if (selector) {
          if (cfgBlock.brTableTargets && cfgBlock.brTableDefault) {
            const targets = cfgBlock.brTableTargets.map(target => target.id);
            const defaultTarget = cfgBlock.brTableDefault.id;
            ssaBlock.instructions.push({ kind: 'branch_table', selector, targets, defaultTarget });
          } else {
            const targets = cfgBlock.successors.slice(0, -1).map(successor => successor.id);
            const defaultTarget = cfgBlock.successors[cfgBlock.successors.length - 1]?.id || 0;
            ssaBlock.instructions.push({ kind: 'branch_table', selector, targets, defaultTarget });
          }
        }
        continue;
      }

      if (opCode === OpCodes.return) {
        const returnValue = funcType.returnTypes.length > 0 ? stack.pop() || null : null;
        ssaBlock.instructions.push({ kind: 'return', value: returnValue });
        continue;
      }

      if (opCode === OpCodes.unreachable || opCode === OpCodes.throw || opCode === OpCodes.rethrow) {
        ssaBlock.instructions.push({ kind: 'unreachable' });
        continue;
      }

      if (opCode === OpCodes.mem_size) {
        const result = newVariable(`t${variableCounter}`, 'i32', cfgBlock.id);
        ssaBlock.instructions.push({ kind: 'call', result, target: -1, args: [] });
        stack.push(result);
        continue;
      }

      if (opCode === OpCodes.mem_grow) {
        const pages = stack.pop();
        const result = newVariable(`t${variableCounter}`, 'i32', cfgBlock.id);
        ssaBlock.instructions.push({ kind: 'call', result, target: -2, args: pages ? [pages] : [] });
        stack.push(result);
        continue;
      }

      // SIMD/GC/Atomic: handle remaining binary ops (pop 2, push 1)
      if (opCode.stackBehavior === 'PopPush') {
        const mnemonic = opCode.mnemonic;
        if (mnemonic.includes('.add') || mnemonic.includes('.sub') || mnemonic.includes('.mul') ||
            mnemonic.includes('.and') || mnemonic.includes('.or') || mnemonic.includes('.xor') ||
            mnemonic.includes('.shl') || mnemonic.includes('.shr') ||
            mnemonic.includes('.min') || mnemonic.includes('.max') ||
            mnemonic.includes('.eq') || mnemonic.includes('.ne') ||
            mnemonic.includes('.lt') || mnemonic.includes('.gt') ||
            mnemonic.includes('.le') || mnemonic.includes('.ge') ||
            mnemonic.includes('.avgr') || mnemonic.includes('.swizzle') ||
            mnemonic.includes('.narrow') || mnemonic.includes('.dot') ||
            mnemonic.includes('.q15mulr')) {
          const right = stack.pop();
          const left = stack.pop();
          if (left && right) {
            const resultType = mnemonic.startsWith('v128') || mnemonic.includes('x') ? 'v128' : resultTypeFromOpCode(opCode);
            const result = newVariable(`t${variableCounter}`, resultType, cfgBlock.id);
            const operatorName = mnemonic.split('.').pop() || mnemonic;
            ssaBlock.instructions.push({ kind: 'binary', result, op: operatorName, left, right });
            stack.push(result);
          }
          continue;
        }
        // Remaining PopPush: treat as unary (pop 1, push 1) for convert/extend/trunc/etc.
        const operand = stack.pop();
        if (operand) {
          const resultType = mnemonic.startsWith('v128') || mnemonic.includes('x') ? 'v128' : resultTypeFromOpCode(opCode);
          const result = newVariable(`t${variableCounter}`, resultType, cfgBlock.id);
          ssaBlock.instructions.push({ kind: 'convert', result, op: mnemonic, operand });
          stack.push(result);
        }
        continue;
      }

      // Generic Push: push a default value (e.g., v128.const)
      if (opCode.stackBehavior === 'Push') {
        const resultType = opCode.mnemonic.includes('v128') ? 'v128' : 'i32';
        const result = newVariable(`t${variableCounter}`, resultType, cfgBlock.id);
        ssaBlock.instructions.push({ kind: 'const', result, value: 0, type: resultType });
        stack.push(result);
        continue;
      }

      // Generic Pop: consume a value (e.g., drop-like ops)
      if (opCode.stackBehavior === 'Pop') {
        stack.pop();
        continue;
      }
    }

    // Implicit return from stack
    const hasExitEdge = cfgBlock.successors.some(successor => successor.id === cfg.exit.id);
    if (hasExitEdge && stack.length > 0 && funcType.returnTypes.length > 0) {
      ssaBlock.instructions.push({ kind: 'return', value: stack.pop()! });
    } else if (hasExitEdge && funcType.returnTypes.length === 0) {
      const lastInstr = ssaBlock.instructions[ssaBlock.instructions.length - 1];
      if (!lastInstr || lastInstr.kind !== 'return') {
        ssaBlock.instructions.push({ kind: 'return', value: null });
      }
    }

    localVersions.set(cfgBlock.id, currentLocals);
    stackAtExit.set(cfgBlock.id, [...stack]);
    processedBlocks.add(cfgBlock.id);

    for (const successor of cfgBlock.successors) {
      let successorLocals = localVersions.get(successor.id);
      if (!successorLocals) {
        successorLocals = new Map();
        localVersions.set(successor.id, successorLocals);
      }
      if (successorLocals.size === 0) {
        for (const [localIndex, variable] of currentLocals) {
          successorLocals.set(localIndex, variable);
        }
      }
    }
  }

  // Patch incomplete phis with back-edge inputs
  for (const { phi, blockId, localIndex } of incompletePhis) {
    const block = cfg.blocks.find(block => block.id === blockId);
    if (!block) { continue; }
    for (let inputIndex = 0; inputIndex < phi.inputs.length; inputIndex++) {
      const predId = block.predecessors[inputIndex].id;
      if (localIndex < 0) {
        // Stack phi: negative index maps to stack slot -(localIndex+1)
        const stackSlot = -(localIndex + 1);
        const predStack = stackAtExit.get(predId);
        if (predStack && stackSlot < predStack.length) {
          phi.inputs[inputIndex] = { blockId: predId, value: predStack[stackSlot] };
        }
      } else {
        const predLocals = localVersions.get(predId);
        if (predLocals && predLocals.has(localIndex)) {
          phi.inputs[inputIndex] = { blockId: predId, value: predLocals.get(localIndex)! };
        }
      }
    }
  }

  return {
    blocks: ssaBlocks,
    variables: allVariables,
    paramCount,
    localCount: totalLocalCount,
    entryBlockId: cfg.entry.id,
    exitBlockId: cfg.exit.id,
  };
}

function computeReversePostOrder(cfg: ControlFlowGraph): BasicBlock[] {
  const visited = new Set<number>();
  const order: BasicBlock[] = [];
  const blockStack: { block: BasicBlock; childIndex: number }[] = [{ block: cfg.entry, childIndex: 0 }];
  visited.add(cfg.entry.id);

  while (blockStack.length > 0) {
    const frame = blockStack[blockStack.length - 1];
    if (frame.childIndex < frame.block.successors.length) {
      const child = frame.block.successors[frame.childIndex];
      frame.childIndex++;
      if (!visited.has(child.id)) {
        visited.add(child.id);
        blockStack.push({ block: child, childIndex: 0 });
      }
    } else {
      order.push(frame.block);
      blockStack.pop();
    }
  }

  order.reverse();
  return order;
}
