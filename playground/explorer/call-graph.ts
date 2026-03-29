import type { ModuleInfo } from '../../src/BinaryReader';
import InstructionDecoder from '../../src/InstructionDecoder';

export interface CallGraphData {
  callees: Map<number, Set<number>>;
  callers: Map<number, Set<number>>;
}

export function buildCallGraph(moduleInfo: ModuleInfo): CallGraphData {
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
