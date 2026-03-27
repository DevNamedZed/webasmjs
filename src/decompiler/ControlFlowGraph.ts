import { DecodedInstruction } from '../InstructionDecoder';

export interface BasicBlock {
  id: number;
  instructions: DecodedInstruction[];
  successors: BasicBlock[];
  predecessors: BasicBlock[];
  isEntry: boolean;
  isExit: boolean;
  wasmBlockDepth: number;
  brTableTargets: BasicBlock[] | null;
  brTableDefault: BasicBlock | null;
}

export interface ControlFlowGraph {
  entry: BasicBlock;
  exit: BasicBlock;
  blocks: BasicBlock[];
  blockEndTargets: Map<number, number>;  // blockId → WASM scope depth at which this block is an end-target
}

interface BlockScope {
  kind: 'block' | 'loop' | 'if' | 'try';
  headerBlock: BasicBlock;
  endTarget: BasicBlock | null;
  catchBlock: BasicBlock | null;
}

function addEdge(from: BasicBlock, to: BasicBlock): void {
  if (!from.successors.includes(to)) {
    from.successors.push(to);
  }
  if (!to.predecessors.includes(from)) {
    to.predecessors.push(from);
  }
}

/**
 * Translates WASM structured control flow into a flat CFG.
 * WASM uses block/loop/if/br scoping rather than arbitrary gotos, so this maintains
 * a scope stack that maps br depths to target blocks. Each WASM scope kind (block, loop,
 * if, try) pushes a scope entry; br targets resolve to the end-block (for block/if/try)
 * or the header (for loop). After construction, unreachable blocks are pruned.
 */
export function buildControlFlowGraph(instructions: DecodedInstruction[]): ControlFlowGraph {
  let nextBlockId = 0;

  function createBlock(): BasicBlock {
    return {
      id: nextBlockId++,
      instructions: [],
      successors: [],
      predecessors: [],
      isEntry: false,
      isExit: false,
      wasmBlockDepth: 0,
      brTableTargets: null,
      brTableDefault: null,
    };
  }

  const entry = createBlock();
  entry.isEntry = true;

  const exit = createBlock();
  exit.isExit = true;

  const blockEndTargets = new Map<number, number>();  // blockId → scope depth

  const allBlocks: BasicBlock[] = [entry, exit];
  let currentBlock = entry;

  const scopeStack: BlockScope[] = [];

  function startNewBlock(): BasicBlock {
    const block = createBlock();
    block.wasmBlockDepth = scopeStack.length;
    allBlocks.push(block);
    return block;
  }

  function resolveBreakTarget(depth: number): BasicBlock | null {
    const targetIndex = scopeStack.length - 1 - depth;
    if (targetIndex < 0 || targetIndex >= scopeStack.length) {
      return null;
    }
    const scope = scopeStack[targetIndex];
    if (scope.kind === 'loop') {
      return scope.headerBlock;
    }
    if (!scope.endTarget) {
      scope.endTarget = startNewBlock();
    }
    return scope.endTarget;
  }

  for (let index = 0; index < instructions.length; index++) {
    const instruction = instructions[index];
    const mnemonic = instruction.opCode.mnemonic;

    if (mnemonic === 'try') {
      currentBlock.instructions.push(instruction);
      const tryBody = startNewBlock();
      const catchBody = startNewBlock();
      addEdge(currentBlock, tryBody);
      addEdge(currentBlock, catchBody);
      const scope: BlockScope = {
        kind: 'try',
        headerBlock: currentBlock,
        endTarget: null,
        catchBlock: catchBody,
      };
      scopeStack.push(scope);
      currentBlock = tryBody;
      continue;
    }

    if (mnemonic === 'catch' || mnemonic === 'catch_all') {
      const scope = scopeStack[scopeStack.length - 1];
      if (scope && scope.kind === 'try' && scope.catchBlock) {
        if (!scope.endTarget) {
          scope.endTarget = startNewBlock();
        }
        addEdge(currentBlock, scope.endTarget);
        currentBlock = scope.catchBlock;
        scope.catchBlock = null;
      }
      continue;
    }

    if (mnemonic === 'throw' || mnemonic === 'rethrow') {
      currentBlock.instructions.push(instruction);
      currentBlock = startNewBlock();
      continue;
    }

    if (mnemonic === 'delegate') {
      if (scopeStack.length > 0) {
        const scope = scopeStack.pop()!;
        if (!scope.endTarget) {
          scope.endTarget = startNewBlock();
        }
        blockEndTargets.set(scope.endTarget.id, scopeStack.length);
        if (currentBlock !== scope.endTarget) {
          addEdge(currentBlock, scope.endTarget);
        }
        currentBlock = scope.endTarget;
      }
      continue;
    }

    if (mnemonic === 'block' || mnemonic === 'loop') {
      currentBlock.instructions.push(instruction);

      const continueBlock = startNewBlock();
      addEdge(currentBlock, continueBlock);

      const scope: BlockScope = {
        kind: mnemonic as 'block' | 'loop',
        headerBlock: continueBlock,
        endTarget: null,
        catchBlock: null,
      };
      scopeStack.push(scope);
      currentBlock = continueBlock;
      continue;
    }

    if (mnemonic === 'if') {
      currentBlock.instructions.push(instruction);

      const thenBlock = startNewBlock();
      const elseBlock = startNewBlock();

      addEdge(currentBlock, thenBlock);
      addEdge(currentBlock, elseBlock);

      const scope: BlockScope = {
        kind: 'if',
        headerBlock: currentBlock,
        endTarget: null,
        catchBlock: null,
      };
      scopeStack.push(scope);
      currentBlock = thenBlock;
      continue;
    }

    if (mnemonic === 'else') {
      const scope = scopeStack[scopeStack.length - 1];
      if (scope && scope.kind === 'if') {
        if (!scope.endTarget) {
          scope.endTarget = startNewBlock();
        }
        addEdge(currentBlock, scope.endTarget);

        const elseBlock = scope.headerBlock.successors[1];
        currentBlock = elseBlock;
      }
      continue;
    }

    if (mnemonic === 'end') {
      if (scopeStack.length === 0) {
        addEdge(currentBlock, exit);
        continue;
      }

      const scope = scopeStack.pop()!;

      if (!scope.endTarget) {
        scope.endTarget = startNewBlock();
      }

      // Record this endTarget's scope depth for dispatch detection
      blockEndTargets.set(scope.endTarget.id, scopeStack.length);

      if (currentBlock !== scope.endTarget) {
        addEdge(currentBlock, scope.endTarget);
      }

      if (scope.kind === 'if') {
        const elseBlock = scope.headerBlock.successors[1];
        if (elseBlock && elseBlock.successors.length === 0 && elseBlock.instructions.length === 0) {
          addEdge(elseBlock, scope.endTarget);
        }
      }

      if (scope.kind === 'try' && scope.catchBlock) {
        addEdge(scope.catchBlock, scope.endTarget);
      }

      currentBlock = scope.endTarget;
      continue;
    }

    if (mnemonic === 'br') {
      currentBlock.instructions.push(instruction);
      const depth = instruction.immediates.values[0] as number;
      const target = resolveBreakTarget(depth);
      if (target) {
        addEdge(currentBlock, target);
      }
      currentBlock = startNewBlock();
      continue;
    }

    if (mnemonic === 'br_if') {
      currentBlock.instructions.push(instruction);
      const depth = instruction.immediates.values[0] as number;
      const target = resolveBreakTarget(depth);
      const fallthrough = startNewBlock();

      if (target) {
        addEdge(currentBlock, target);
      }
      addEdge(currentBlock, fallthrough);
      currentBlock = fallthrough;
      continue;
    }

    if (mnemonic === 'br_table') {
      currentBlock.instructions.push(instruction);
      const targets = instruction.immediates.values[0] as number[];
      const defaultDepth = instruction.immediates.values[1] as number;

      const resolvedTargets: BasicBlock[] = [];
      const visitedTargets = new Set<BasicBlock>();
      for (const depth of targets) {
        const target = resolveBreakTarget(depth);
        if (target) {
          resolvedTargets.push(target);
          if (!visitedTargets.has(target)) {
            addEdge(currentBlock, target);
            visitedTargets.add(target);
          }
        }
      }
      const defaultTarget = resolveBreakTarget(defaultDepth);
      if (defaultTarget && !visitedTargets.has(defaultTarget)) {
        addEdge(currentBlock, defaultTarget);
      }

      currentBlock.brTableTargets = resolvedTargets;
      currentBlock.brTableDefault = defaultTarget;

      currentBlock = startNewBlock();
      continue;
    }

    if (mnemonic === 'return') {
      currentBlock.instructions.push(instruction);
      addEdge(currentBlock, exit);
      currentBlock = startNewBlock();
      continue;
    }

    if (mnemonic === 'unreachable') {
      currentBlock.instructions.push(instruction);
      currentBlock = startNewBlock();
      continue;
    }

    currentBlock.instructions.push(instruction);
  }

  if (currentBlock.successors.length === 0 && currentBlock !== exit) {
    addEdge(currentBlock, exit);
  }

  const reachable = new Set<BasicBlock>();
  const worklist: BasicBlock[] = [entry];
  while (worklist.length > 0) {
    const block = worklist.pop()!;
    if (reachable.has(block)) {
      continue;
    }
    reachable.add(block);
    for (const successor of block.successors) {
      worklist.push(successor);
    }
  }

  const liveBlocks = allBlocks.filter(block => reachable.has(block));

  const oldIdToNewId = new Map<number, number>();
  for (let blockIndex = 0; blockIndex < liveBlocks.length; blockIndex++) {
    oldIdToNewId.set(liveBlocks[blockIndex].id, blockIndex);
    liveBlocks[blockIndex].id = blockIndex;
  }

  const renumberedBlockEndTargets = new Map<number, number>();
  for (const [oldBlockId, scopeDepth] of blockEndTargets) {
    const newBlockId = oldIdToNewId.get(oldBlockId);
    if (newBlockId !== undefined) {
      renumberedBlockEndTargets.set(newBlockId, scopeDepth);
    }
  }

  return {
    entry: liveBlocks[0],
    exit,
    blocks: liveBlocks,
    blockEndTargets: renumberedBlockEndTargets,
  };
}

