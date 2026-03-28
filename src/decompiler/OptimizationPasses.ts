import { SsaFunction, SsaBlock, SsaInstr, SsaValue, SsaVariable, SsaConst, COMPARE_INVERT, isVariable, isConst } from './SsaBuilder';

export function optimizeSsa(ssaFunc: SsaFunction): void {
  stackFrameDetection(ssaFunc);
  let changed = true;
  let iteration = 0;
  while (changed && iteration < 10) {
    changed = false;
    changed = constantFolding(ssaFunc) || changed;
    changed = doubleNegationElimination(ssaFunc) || changed;
    changed = comparisonInversion(ssaFunc) || changed;
    changed = copyPropagation(ssaFunc) || changed;
    changed = localAssignInlining(ssaFunc) || changed;
    changed = localCommonSubexpressionElimination(ssaFunc) || changed;
    changed = deadCodeElimination(ssaFunc) || changed;
    changed = phiSimplification(ssaFunc) || changed;
    iteration++;
  }
}

/**
 * Detects the WASM stack frame prologue pattern: global_get(SP), const(N), sub, local_set, global_set(SP).
 * This is the standard shadow-stack protocol emitted by LLVM/Emscripten. The global_set that
 * saves the decremented stack pointer is removed since the epilogue will restore it.
 */
function stackFrameDetection(ssaFunc: SsaFunction): void {
  if (ssaFunc.blocks.length === 0) {
    return;
  }
  const entryBlock = ssaFunc.blocks.find(block => block.id === ssaFunc.entryBlockId);
  if (!entryBlock || entryBlock.instructions.length < 4) {
    return;
  }

  const instructions = entryBlock.instructions;
  let prologueEnd = -1;

  for (let index = 0; index + 3 < instructions.length; index++) {
    const i0 = instructions[index];
    const i1 = instructions[index + 1];
    const i2 = instructions[index + 2];
    const i3 = instructions[index + 3];

    if (i0.kind === 'global_get' &&
        i1.kind === 'const' && typeof i1.value === 'number' &&
        i2.kind === 'binary' && i2.op === '-' &&
        i3.kind === 'assign' && i3.result.name.startsWith('local')) {
      if (index + 4 < instructions.length) {
        const i4 = instructions[index + 4];
        if (i4.kind === 'global_set' && i4.globalIndex === i0.globalIndex) {
          prologueEnd = index + 5;
          break;
        }
      }
      prologueEnd = index + 4;
      break;
    }
  }

  if (prologueEnd > 0) {
    // Remove only the global_set (epilogue restores it), keep frame pointer computation
    const filtered: SsaInstr[] = [];
    for (let index = 0; index < prologueEnd; index++) {
      const instruction = instructions[index];
      if (instruction.kind !== 'global_set') {
        filtered.push(instruction);
      }
    }
    entryBlock.instructions.splice(0, prologueEnd, ...filtered);
  }
}

function getConstValue(value: SsaValue, defMap?: Map<number, { block: SsaBlock; instruction: SsaInstr }>): number | null {
  if (isConst(value)) {
    return Number(value.value);
  }
  if (isVariable(value) && defMap) {
    const def = defMap.get(value.id);
    if (def && def.instruction.kind === 'const') {
      return Number(def.instruction.value);
    }
  }
  return null;
}

function buildDefMap(ssaFunc: SsaFunction): Map<number, { block: SsaBlock; instruction: SsaInstr }> {
  const defMap = new Map<number, { block: SsaBlock; instruction: SsaInstr }>();
  for (const block of ssaFunc.blocks) {
    for (const instruction of block.instructions) {
      const result = getInstructionResult(instruction);
      if (result) {
        defMap.set(result.id, { block, instruction });
      }
    }
  }
  return defMap;
}

function getInstructionResult(instruction: SsaInstr): SsaVariable | null {
  switch (instruction.kind) {
    case 'phi':
    case 'assign':
    case 'const':
    case 'binary':
    case 'unary':
    case 'compare':
    case 'load':
    case 'convert':
    case 'select':
    case 'global_get':
      return instruction.result;
    case 'call':
    case 'call_indirect':
      return instruction.result || null;
    default:
      return null;
  }
}

function buildUseMap(ssaFunc: SsaFunction): Map<number, number> {
  const useCount = new Map<number, number>();

  function countUse(value: SsaValue): void {
    if (isVariable(value)) {
      useCount.set(value.id, (useCount.get(value.id) || 0) + 1);
    }
  }

  for (const block of ssaFunc.blocks) {
    for (const instruction of block.instructions) {
      visitInstructionOperands(instruction, countUse);
    }
  }
  return useCount;
}

function visitInstructionOperands(instruction: SsaInstr, visitor: (value: SsaValue) => void): void {
  switch (instruction.kind) {
    case 'phi':
      for (const input of instruction.inputs) {
        visitor(input.value);
      }
      break;
    case 'assign':
      visitor(instruction.value);
      break;
    case 'binary':
      visitor(instruction.left);
      visitor(instruction.right);
      break;
    case 'unary':
      visitor(instruction.operand);
      break;
    case 'compare':
      visitor(instruction.left);
      visitor(instruction.right);
      break;
    case 'load':
      visitor(instruction.address);
      break;
    case 'store':
      visitor(instruction.address);
      visitor(instruction.value);
      break;
    case 'call':
      for (const arg of instruction.args) { visitor(arg); }
      break;
    case 'call_indirect':
      visitor(instruction.tableIndex);
      for (const arg of instruction.args) { visitor(arg); }
      break;
    case 'convert':
      visitor(instruction.operand);
      break;
    case 'select':
      visitor(instruction.condition);
      visitor(instruction.trueVal);
      visitor(instruction.falseVal);
      break;
    case 'global_set':
      visitor(instruction.value);
      break;
    case 'branch_if':
      visitor(instruction.condition);
      break;
    case 'branch_table':
      visitor(instruction.selector);
      break;
    case 'return':
      if (instruction.value) { visitor(instruction.value); }
      break;
  }
}

function replaceOperand(instruction: SsaInstr, oldId: number, newValue: SsaValue): boolean {
  let replaced = false;

  function replace(value: SsaValue): SsaValue {
    if (isVariable(value) && value.id === oldId) {
      replaced = true;
      return newValue;
    }
    return value;
  }

  switch (instruction.kind) {
    case 'phi':
      for (let inputIndex = 0; inputIndex < instruction.inputs.length; inputIndex++) {
        instruction.inputs[inputIndex].value = replace(instruction.inputs[inputIndex].value);
      }
      break;
    case 'assign':
      instruction.value = replace(instruction.value);
      break;
    case 'binary':
      instruction.left = replace(instruction.left);
      instruction.right = replace(instruction.right);
      break;
    case 'unary':
      instruction.operand = replace(instruction.operand);
      break;
    case 'compare':
      instruction.left = replace(instruction.left);
      instruction.right = replace(instruction.right);
      break;
    case 'load':
      instruction.address = replace(instruction.address);
      break;
    case 'store':
      instruction.address = replace(instruction.address);
      instruction.value = replace(instruction.value);
      break;
    case 'call':
      for (let argIndex = 0; argIndex < instruction.args.length; argIndex++) {
        instruction.args[argIndex] = replace(instruction.args[argIndex]);
      }
      break;
    case 'call_indirect':
      instruction.tableIndex = replace(instruction.tableIndex);
      for (let argIndex = 0; argIndex < instruction.args.length; argIndex++) {
        instruction.args[argIndex] = replace(instruction.args[argIndex]);
      }
      break;
    case 'convert':
      instruction.operand = replace(instruction.operand);
      break;
    case 'select':
      instruction.condition = replace(instruction.condition);
      instruction.trueVal = replace(instruction.trueVal);
      instruction.falseVal = replace(instruction.falseVal);
      break;
    case 'global_set':
      instruction.value = replace(instruction.value);
      break;
    case 'branch_if':
      instruction.condition = replace(instruction.condition);
      break;
    case 'branch_table':
      instruction.selector = replace(instruction.selector);
      break;
    case 'return':
      if (instruction.value) {
        instruction.value = replace(instruction.value);
      }
      break;
  }
  return replaced;
}

function doubleNegationElimination(ssaFunc: SsaFunction): boolean {
  let changed = false;
  const defMap = buildDefMap(ssaFunc);

  for (const block of ssaFunc.blocks) {
    for (let instrIndex = 0; instrIndex < block.instructions.length; instrIndex++) {
      const instruction = block.instructions[instrIndex];
      if (instruction.kind === 'unary' && instruction.op === '!' && isVariable(instruction.operand)) {
        const innerDef = defMap.get(instruction.operand.id);
        if (innerDef && innerDef.instruction.kind === 'unary' && innerDef.instruction.op === '!') {
          block.instructions[instrIndex] = {
            kind: 'assign',
            result: instruction.result,
            value: innerDef.instruction.operand,
          };
          changed = true;
        }
      }
    }
  }
  return changed;
}

function comparisonInversion(ssaFunc: SsaFunction): boolean {
  let changed = false;
  const defMap = buildDefMap(ssaFunc);

  for (const block of ssaFunc.blocks) {
    for (let instrIndex = 0; instrIndex < block.instructions.length; instrIndex++) {
      const instruction = block.instructions[instrIndex];
      if (instruction.kind === 'unary' && instruction.op === '!' && isVariable(instruction.operand)) {
        const innerDef = defMap.get(instruction.operand.id);
        if (innerDef && innerDef.instruction.kind === 'compare') {
          const inverted = COMPARE_INVERT[innerDef.instruction.op];
          if (inverted) {
            block.instructions[instrIndex] = {
              kind: 'compare',
              result: instruction.result,
              op: inverted,
              left: innerDef.instruction.left,
              right: innerDef.instruction.right,
            };
            changed = true;
          }
        }
      }
    }
  }
  return changed;
}

/**
 * Inlines local variable assignments to eliminate redundant temporaries.
 * When a local_X = assign(temp_Y) and temp_Y has exactly two uses (this assignment
 * and one other), the other use of temp_Y is replaced with local_X. This collapses
 * patterns like "tmp = expr; var = tmp; use(tmp)" into "var = expr; use(var)".
 */
function localAssignInlining(ssaFunc: SsaFunction): boolean {
  let changed = false;
  const useCount = buildUseMap(ssaFunc);

  for (const block of ssaFunc.blocks) {
    for (const instruction of block.instructions) {
      if (instruction.kind !== 'assign') {
        continue;
      }
      if (!instruction.result.name.startsWith('local')) {
        continue;
      }
      if (!isVariable(instruction.value)) {
        continue;
      }
      const sourceVar = instruction.value;
      const uses = useCount.get(sourceVar.id) || 0;
      if (uses !== 2) {
        continue;
      }
      // Replace the other use of sourceVar with the local result
      for (const otherBlock of ssaFunc.blocks) {
        for (const otherInstruction of otherBlock.instructions) {
          if (otherInstruction === instruction) {
            continue;
          }
          if (replaceOperand(otherInstruction, sourceVar.id, instruction.result)) {
            changed = true;
          }
        }
      }
    }
  }
  return changed;
}

function constantFolding(ssaFunc: SsaFunction): boolean {
  let changed = false;
  const defMap = buildDefMap(ssaFunc);

  for (const block of ssaFunc.blocks) {
    for (let instrIndex = 0; instrIndex < block.instructions.length; instrIndex++) {
      const instruction = block.instructions[instrIndex];

      if (instruction.kind === 'binary') {
        const leftConst = getConstValue(instruction.left, defMap);
        const rightConst = getConstValue(instruction.right, defMap);

        if (leftConst !== null && rightConst !== null) {
          const result = evaluateBinaryOp(instruction.op, leftConst, rightConst);
          if (result !== null) {
            block.instructions[instrIndex] = {
              kind: 'const',
              result: instruction.result,
              value: result,
              type: instruction.result.type,
            };
            changed = true;
          }
        }

        if (rightConst === 0 && (instruction.op === '+' || instruction.op === '-' || instruction.op === '|' || instruction.op === '^')) {
          block.instructions[instrIndex] = { kind: 'assign', result: instruction.result, value: instruction.left };
          changed = true;
        }
        // x + (-N) → x - N
        if (rightConst !== null && rightConst < 0 && instruction.op === '+') {
          const positiveConst: SsaValue = { kind: 'const', value: -rightConst, type: instruction.result.type };
          block.instructions[instrIndex] = { kind: 'binary', result: instruction.result, op: '-', left: instruction.left, right: positiveConst };
          changed = true;
        }
        if (rightConst === 1 && instruction.op === '*') {
          block.instructions[instrIndex] = { kind: 'assign', result: instruction.result, value: instruction.left };
          changed = true;
        }
        if (rightConst === 0 && instruction.op === '*') {
          block.instructions[instrIndex] = { kind: 'const', result: instruction.result, value: 0, type: instruction.result.type };
          changed = true;
        }
      }

      if (instruction.kind === 'compare') {
        const leftConst = getConstValue(instruction.left, defMap);
        const rightConst = getConstValue(instruction.right, defMap);

        if (leftConst !== null && rightConst !== null) {
          const result = evaluateCompareOp(instruction.op, leftConst, rightConst);
          if (result !== null) {
            block.instructions[instrIndex] = {
              kind: 'const',
              result: instruction.result,
              value: result ? 1 : 0,
              type: 'i32',
            };
            changed = true;
          }
        }
      }

      if (instruction.kind === 'unary' && instruction.op === '!') {
        const constVal = getConstValue(instruction.operand, defMap);
        if (constVal !== null) {
          block.instructions[instrIndex] = {
            kind: 'const',
            result: instruction.result,
            value: constVal === 0 ? 1 : 0,
            type: 'i32',
          };
          changed = true;
        }
      }
    }
  }
  return changed;
}

function evaluateBinaryOp(op: string, left: number, right: number): number | null {
  switch (op) {
    case '+': return (left + right) | 0;
    case '-': return (left - right) | 0;
    case '*': return Math.imul(left, right);
    case '&': return left & right;
    case '|': return left | right;
    case '^': return left ^ right;
    case '<<': return left << (right & 31);
    case '>>': return left >> (right & 31);
    case '>>>': return left >>> (right & 31);
    case '/': return right !== 0 ? (left / right) | 0 : null;
    case '%': return right !== 0 ? (left % right) | 0 : null;
    case '/u': return right !== 0 ? ((left >>> 0) / (right >>> 0)) | 0 : null;
    case '%u': return right !== 0 ? ((left >>> 0) % (right >>> 0)) | 0 : null;
    default: return null;
  }
}

function evaluateCompareOp(op: string, left: number, right: number): boolean | null {
  switch (op) {
    case '==': return left === right;
    case '!=': return left !== right;
    case '<': return left < right;
    case '>': return left > right;
    case '<=': return left <= right;
    case '>=': return left >= right;
    default: return null;
  }
}

/**
 * Propagates copy assignments (x = y) by replacing all uses of x with y.
 * Local and phi variable assignments are excluded to preserve the user-meaningful
 * names that local variables carry through the lowering pipeline.
 */
function copyPropagation(ssaFunc: SsaFunction): boolean {
  let changed = false;

  for (const block of ssaFunc.blocks) {
    for (const instruction of block.instructions) {
      if (instruction.kind === 'assign' && isVariable(instruction.value)) {
        // Don't propagate local/phi assigns backwards — we want to keep the local name
        if (instruction.result.name.startsWith('local') || instruction.result.name.startsWith('phi')) {
          continue;
        }
        const targetId = instruction.result.id;

        for (const otherBlock of ssaFunc.blocks) {
          for (const otherInstruction of otherBlock.instructions) {
            if (otherInstruction === instruction) {
              continue;
            }
            if (replaceOperand(otherInstruction, targetId, instruction.value)) {
              changed = true;
            }
          }
        }
      }
    }
  }
  return changed;
}

function deadCodeElimination(ssaFunc: SsaFunction): boolean {
  let changed = false;
  const useCount = buildUseMap(ssaFunc);

  for (const block of ssaFunc.blocks) {
    const filtered: SsaInstr[] = [];
    for (const instruction of block.instructions) {
      const result = getInstructionResult(instruction);
      if (result && (useCount.get(result.id) || 0) === 0) {
        if (instruction.kind !== 'call' && instruction.kind !== 'call_indirect' &&
            instruction.kind !== 'store' && instruction.kind !== 'global_set' &&
            instruction.kind !== 'phi') {
          // Don't DCE assigns to local variables — they represent side effects
          // that flow through phi nodes to other blocks
          if (instruction.kind === 'assign' && result.name.startsWith('local')) {
            // keep it
          } else {
            changed = true;
            continue;
          }
        }
      }
      filtered.push(instruction);
    }
    if (filtered.length !== block.instructions.length) {
      block.instructions = filtered;
    }
  }
  return changed;
}

function phiSimplification(ssaFunc: SsaFunction): boolean {
  let changed = false;

  for (const block of ssaFunc.blocks) {
    for (let instrIndex = 0; instrIndex < block.instructions.length; instrIndex++) {
      const instruction = block.instructions[instrIndex];
      if (instruction.kind !== 'phi') {
        continue;
      }

      const uniqueInputs = new Map<number | string, SsaValue>();
      for (const input of instruction.inputs) {
        const key = isVariable(input.value) ? input.value.id : `const_${(input.value as SsaConst).value}`;
        if (!uniqueInputs.has(key)) {
          uniqueInputs.set(key, input.value);
        }
      }

      const filteredInputs = Array.from(uniqueInputs.values())
        .filter(value => !(isVariable(value) && value.id === instruction.result.id));

      if (filteredInputs.length === 1) {
        block.instructions[instrIndex] = {
          kind: 'assign',
          result: instruction.result,
          value: filteredInputs[0],
        };
        changed = true;
      }
    }
  }
  return changed;
}

function localCommonSubexpressionElimination(ssaFunc: SsaFunction): boolean {
  let changed = false;

  for (const block of ssaFunc.blocks) {
    const loadCache = new Map<string, SsaVariable>();

    for (let instrIndex = 0; instrIndex < block.instructions.length; instrIndex++) {
      const instruction = block.instructions[instrIndex];

      if (instruction.kind === 'store' || instruction.kind === 'call' || instruction.kind === 'call_indirect') {
        loadCache.clear();
        continue;
      }

      if (instruction.kind === 'load' && isVariable(instruction.address)) {
        const key = `${instruction.address.id}:${instruction.offset}:${instruction.loadType}`;
        const existing = loadCache.get(key);
        if (existing) {
          block.instructions[instrIndex] = {
            kind: 'assign',
            result: instruction.result,
            value: existing,
          };
          changed = true;
        } else {
          loadCache.set(key, instruction.result);
        }
      }
    }
  }
  return changed;
}
