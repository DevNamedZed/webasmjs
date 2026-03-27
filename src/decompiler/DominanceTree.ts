import { SsaFunction, SsaBlock } from './SsaBuilder';

export interface DominanceInfo {
  immediateDominator: Map<number, number>;
  dominanceFrontier: Map<number, Set<number>>;
  children: Map<number, number[]>;
  postImmediateDominator: Map<number, number>;
  postDominanceFrontier: Map<number, Set<number>>;
  postChildren: Map<number, number[]>;
}

export function computeDominance(ssaFunc: SsaFunction): DominanceInfo {
  const blocks = ssaFunc.blocks;
  const entryId = ssaFunc.entryBlockId;
  const exitId = ssaFunc.exitBlockId;

  const idom = computeImmediateDominators(blocks, entryId, true);
  const domFrontier = computeDominanceFrontiers(blocks, idom, true);
  const domChildren = buildChildrenMap(idom);

  const postIdom = computeImmediateDominators(blocks, exitId, false);
  const postDomFrontier = computeDominanceFrontiers(blocks, postIdom, false);
  const postDomChildren = buildChildrenMap(postIdom);

  return {
    immediateDominator: idom,
    dominanceFrontier: domFrontier,
    children: domChildren,
    postImmediateDominator: postIdom,
    postDominanceFrontier: postDomFrontier,
    postChildren: postDomChildren,
  };
}

/**
 * Cooper-Harvey-Kennedy iterative dominator algorithm.
 * Computes immediate dominators by iterating over reverse-postorder until fixed point.
 * When forward=true, computes dominance from entry; when false, computes post-dominance from exit.
 * Reference: Cooper, Harvey, Kennedy. "A Simple, Fast Dominance Algorithm." (2001)
 */
function computeImmediateDominators(
  blocks: SsaBlock[],
  rootId: number,
  forward: boolean,
): Map<number, number> {
  const blockMap = new Map<number, SsaBlock>();
  for (const block of blocks) {
    blockMap.set(block.id, block);
  }

  const order = computeReversePostOrder(blocks, rootId, forward);
  const orderIndex = new Map<number, number>();
  for (let position = 0; position < order.length; position++) {
    orderIndex.set(order[position], position);
  }

  const idom = new Map<number, number>();
  idom.set(rootId, rootId);

  /** Finds the nearest common dominator of two blocks by walking up the dominator tree in lockstep. */
  function intersect(blockA: number, blockB: number): number {
    let fingerA = blockA;
    let fingerB = blockB;
    let iterations = 0;
    while (fingerA !== fingerB && iterations < 1000) {
      iterations++;
      while ((orderIndex.get(fingerA) ?? 0) > (orderIndex.get(fingerB) ?? 0)) {
        const next = idom.get(fingerA);
        if (next === undefined || next === fingerA) { return fingerA; }
        fingerA = next;
      }
      while ((orderIndex.get(fingerB) ?? 0) > (orderIndex.get(fingerA) ?? 0)) {
        const next = idom.get(fingerB);
        if (next === undefined || next === fingerB) { return fingerB; }
        fingerB = next;
      }
    }
    return fingerA;
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const blockId of order) {
      if (blockId === rootId) {
        continue;
      }
      const block = blockMap.get(blockId);
      if (!block) {
        continue;
      }

      const preds = forward ? block.predecessors : block.successors;
      let newIdom: number | null = null;

      for (const predId of preds) {
        if (!idom.has(predId)) {
          continue;
        }
        if (newIdom === null) {
          newIdom = predId;
        } else {
          newIdom = intersect(newIdom, predId);
        }
      }

      if (newIdom !== null && idom.get(blockId) !== newIdom) {
        idom.set(blockId, newIdom);
        changed = true;
      }
    }
  }

  return idom;
}

function computeDominanceFrontiers(
  blocks: SsaBlock[],
  idom: Map<number, number>,
  forward: boolean,
): Map<number, Set<number>> {
  const frontier = new Map<number, Set<number>>();
  for (const block of blocks) {
    frontier.set(block.id, new Set());
  }

  for (const block of blocks) {
    const preds = forward ? block.predecessors : block.successors;
    if (preds.length < 2) {
      continue;
    }
    for (const predId of preds) {
      let runner: number | undefined = predId;
      const target = idom.get(block.id);
      while (runner !== undefined && runner !== target) {
        const frontierSet = frontier.get(runner);
        if (frontierSet) {
          frontierSet.add(block.id);
        }
        const next = idom.get(runner);
        if (next === undefined || next === runner) {
          break;
        }
        runner = next;
      }
    }
  }

  return frontier;
}

function buildChildrenMap(idom: Map<number, number>): Map<number, number[]> {
  const children = new Map<number, number[]>();
  for (const [blockId, parentId] of idom) {
    if (blockId === parentId) {
      continue;
    }
    if (!children.has(parentId)) {
      children.set(parentId, []);
    }
    children.get(parentId)!.push(blockId);
  }
  return children;
}

function computeReversePostOrder(
  blocks: SsaBlock[],
  rootId: number,
  forward: boolean,
): number[] {
  const visited = new Set<number>();
  const order: number[] = [];
  const blockMap = new Map<number, SsaBlock>();
  for (const block of blocks) {
    blockMap.set(block.id, block);
  }

  function visit(blockId: number): void {
    if (visited.has(blockId)) {
      return;
    }
    visited.add(blockId);
    const block = blockMap.get(blockId);
    if (!block) {
      return;
    }
    const successors = forward ? block.successors : block.predecessors;
    for (const successorId of successors) {
      visit(successorId);
    }
    order.push(blockId);
  }

  visit(rootId);
  order.reverse();
  return order;
}

export function dominates(
  idom: Map<number, number>,
  dominatorId: number,
  blockId: number,
): boolean {
  let current = blockId;
  let iterations = 0;
  while (current !== dominatorId && iterations < 1000) {
    iterations++;
    const parent = idom.get(current);
    if (parent === undefined || parent === current) {
      return false;
    }
    current = parent;
  }
  return current === dominatorId;
}

export interface NaturalLoop {
  headerId: number;
  bodyIds: Set<number>;
  exitIds: Set<number>;
  backEdgeSourceId: number;
}

export function findNaturalLoops(
  blocks: SsaBlock[],
  idom: Map<number, number>,
): NaturalLoop[] {
  const loops: NaturalLoop[] = [];

  for (const block of blocks) {
    for (const successorId of block.successors) {
      if (dominates(idom, successorId, block.id)) {
        const loop = buildNaturalLoop(blocks, idom, successorId, block.id);
        loops.push(loop);
      }
    }
  }

  return loops;
}

function buildNaturalLoop(
  blocks: SsaBlock[],
  idom: Map<number, number>,
  headerId: number,
  backEdgeSourceId: number,
): NaturalLoop {
  const bodyIds = new Set<number>([headerId]);
  const worklist: number[] = [backEdgeSourceId];

  const blockMap = new Map<number, SsaBlock>();
  for (const block of blocks) {
    blockMap.set(block.id, block);
  }

  while (worklist.length > 0) {
    const blockId = worklist.pop()!;
    if (bodyIds.has(blockId)) {
      continue;
    }
    bodyIds.add(blockId);
    const block = blockMap.get(blockId);
    if (block) {
      for (const predId of block.predecessors) {
        worklist.push(predId);
      }
    }
  }

  const exitIds = new Set<number>();
  for (const blockId of bodyIds) {
    const block = blockMap.get(blockId);
    if (block) {
      for (const successorId of block.successors) {
        if (!bodyIds.has(successorId)) {
          exitIds.add(successorId);
        }
      }
    }
  }

  return { headerId, bodyIds, exitIds, backEdgeSourceId };
}
