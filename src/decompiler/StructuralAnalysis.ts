import { SsaFunction, SsaBlock, SsaInstr, SsaValue, SsaVariable, SsaConst, COMPARE_INVERT } from './SsaBuilder';
import { DominanceInfo, dominates, findNaturalLoops, NaturalLoop } from './DominanceTree';
import { postProcessNode } from './StructuredPostProcessing';

export type StructuredNode =
  | { kind: 'sequence'; children: StructuredNode[] }
  | { kind: 'block'; body: SsaInstr[] }
  | { kind: 'if'; condition: SsaValue; thenBody: StructuredNode; elseBody: StructuredNode | null }
  | { kind: 'while'; condition: SsaValue | null; body: StructuredNode }
  | { kind: 'do_while'; body: StructuredNode; condition: SsaValue }
  | { kind: 'switch'; selector: SsaValue; cases: { values: number[]; body: StructuredNode }[]; defaultBody: StructuredNode }
  | { kind: 'break' }
  | { kind: 'continue' }
  | { kind: 'return'; value: SsaValue | null }
  | { kind: 'unreachable' }
  | { kind: 'labeled_block'; label: string; body: StructuredNode }
  | { kind: 'labeled_break'; label: string }
  | { kind: 'labeled_continue'; label: string };

/**
 * Recovers high-level control flow (if/while/switch/break/continue) from the SSA CFG.
 * Identifies natural loops via dominance, then walks the CFG in dominator-tree order,
 * classifying edges as loop-back, loop-exit, if-then-else, or linear fall-through.
 * Unstructured regions fall back to labeled blocks.
 */
export function structureFunction(
  ssaFunc: SsaFunction,
  dominance: DominanceInfo,
  blockEndTargets?: Map<number, number>,
): StructuredNode {
  const blockMap = new Map<number, SsaBlock>();
  for (const block of ssaFunc.blocks) {
    blockMap.set(block.id, block);
  }

  const loops = findNaturalLoops(ssaFunc.blocks, dominance.immediateDominator);
  const loopsByHeader = new Map<number, NaturalLoop>();
  for (const loop of loops) {
    loopsByHeader.set(loop.headerId, loop);
  }

  const processed = new Set<number>();

  // Build defMap for instruction lookup (used by negateCondition)
  const defMap = new Map<number, SsaInstr>();
  for (const block of ssaFunc.blocks) {
    for (const instr of block.instructions) {
      if ('result' in instr && instr.result) {
        defMap.set(instr.result.id, instr);
      }
    }
  }

  let nextVarId = ssaFunc.variables.length > 0
    ? ssaFunc.variables.reduce((maxId, variable) => Math.max(maxId, variable.id), 0) + 1
    : 1000;

  function isTerminatorKind(kind: string): boolean {
    return kind === 'branch' || kind === 'branch_if' || kind === 'branch_table' || kind === 'return' || kind === 'unreachable';
  }

  function insertBeforeTerminator(block: SsaBlock, instruction: SsaInstr): void {
    const lastInstruction = block.instructions[block.instructions.length - 1];
    if (lastInstruction && isTerminatorKind(lastInstruction.kind)) {
      block.instructions.splice(block.instructions.length - 1, 0, instruction);
    } else {
      block.instructions.push(instruction);
    }
  }

  function findBlockContaining(varId: number): SsaBlock | null {
    for (const block of ssaFunc.blocks) {
      for (const instr of block.instructions) {
        if ('result' in instr && instr.result && instr.result.id === varId) {
          return block;
        }
      }
    }
    return null;
  }

  function negateCondition(condition: SsaValue): SsaValue {
    if ('kind' in condition && condition.kind === 'const') {
      return { kind: 'const', value: condition.value ? 0 : 1, type: 'i32' } as SsaConst;
    }

    if ('id' in condition && !('kind' in condition)) {
      const defInstr = defMap.get(condition.id);

      if (defInstr && defInstr.kind === 'compare') {
        const inverted = COMPARE_INVERT[defInstr.op];
        if (inverted) {
          const newVar: SsaVariable = { id: nextVarId++, name: `neg_${condition.id}`, type: 'i32', definedInBlock: -1 };
          const newInstr: SsaInstr = { kind: 'compare', result: newVar, op: inverted, left: defInstr.left, right: defInstr.right };
          const ownerBlock = findBlockContaining(condition.id);
          if (ownerBlock) {
            insertBeforeTerminator(ownerBlock, newInstr);
          }
          defMap.set(newVar.id, newInstr);
          return newVar;
        }
      }

      if (defInstr && defInstr.kind === 'unary' && defInstr.op === '!') {
        return defInstr.operand;
      }
    }

    const varId = nextVarId++;
    const newVar: SsaVariable = { id: varId, name: `neg_${varId}`, type: 'i32', definedInBlock: -1 };
    const newInstr: SsaInstr = { kind: 'unary', result: newVar, op: '!', operand: condition };
    if ('id' in condition && !('kind' in condition)) {
      const ownerBlock = findBlockContaining(condition.id);
      if (ownerBlock) {
        insertBeforeTerminator(ownerBlock, newInstr);
      }
    } else {
      if (ssaFunc.blocks[0]) {
        insertBeforeTerminator(ssaFunc.blocks[0], newInstr);
      }
    }
    defMap.set(newVar.id, newInstr);
    return newVar;
  }

  function isExitTarget(blockId: number): boolean {
    if (blockId === ssaFunc.exitBlockId) {
      return true;
    }
    const block = blockMap.get(blockId);
    if (!block) {
      return false;
    }
    // Empty block that goes to exit
    if (block.instructions.length === 0 && block.successors.length === 1 && block.successors[0] === ssaFunc.exitBlockId) {
      return true;
    }
    // Block with only phi/return instructions that goes to exit
    if (block.successors.includes(ssaFunc.exitBlockId)) {
      const substantiveInstrs = block.instructions.filter(i => i.kind !== 'return' && i.kind !== 'phi');
      if (substantiveInstrs.length === 0) {
        return true;
      }
    }
    return false;
  }

  function structureRegion(blockId: number, regionEnd: number | null, virtuallyProcessed?: Set<number>): StructuredNode {
    if (processed.has(blockId)) {
      return { kind: 'sequence', children: [] };
    }

    const block = blockMap.get(blockId);
    if (!block) {
      return { kind: 'sequence', children: [] };
    }

    try {
      const loop = loopsByHeader.get(blockId);
      if (loop) {
        return structureLoop(blockId, loop, regionEnd);
      }
      return structureLinear(blockId, regionEnd, virtuallyProcessed);
    } catch (structureError) {
      // Fallback: emit the block as labeled block
      processed.add(blockId);
      return { kind: 'labeled_block', label: `block_${blockId}`, body: { kind: 'block', body: block.instructions } };
    }
  }

  function structureLinear(blockId: number, regionEnd: number | null, virtuallyProcessed?: Set<number>): StructuredNode {
    const children: StructuredNode[] = [];
    let currentBlockId: number | null = blockId;

    while (currentBlockId !== null && currentBlockId !== regionEnd) {
      if (processed.has(currentBlockId)) {
        break;
      }

      const block = blockMap.get(currentBlockId);
      if (!block) {
        break;
      }

      const loop = loopsByHeader.get(currentBlockId);
      if (loop && children.length > 0) {
        children.push(structureLoop(currentBlockId, loop, regionEnd));
        const exitId = findSingleExit(loop);
        currentBlockId = exitId;
        continue;
      }

      processed.add(currentBlockId);

      const terminator = findTerminator(block);

      if (!terminator) {
        children.push(blockToNode(block));
        if (block.successors.length === 1) {
          currentBlockId = block.successors[0];
        } else {
          currentBlockId = null;
        }
        continue;
      }

      if (terminator.kind === 'return' || terminator.kind === 'unreachable') {
        children.push(blockToNode(block));
        currentBlockId = null;
        continue;
      }

      if (terminator.kind === 'branch') {
        children.push(blockToNodeWithoutTerminator(block));

        // If branch goes to exit (or pass-through to exit) → this path exits
        const exitCheck = isExitTarget(terminator.target);
        if (exitCheck) {
          children.push({ kind: 'return', value: null });
          currentBlockId = null;
          continue;
        }

        const targetBlock = blockMap.get(terminator.target);
        // Merge-point heuristic: if a branch target has unprocessed predecessors
        // and the current block does not dominate it, defer processing.
        // This prevents one arm of an if/else from consuming the merge block
        // before the other arm has been structured.
        if (targetBlock && targetBlock.predecessors.length > 1) {
          const unprocessedPreds = targetBlock.predecessors.filter(predId =>
            !processed.has(predId) && !(virtuallyProcessed && virtuallyProcessed.has(predId)));
          // Allow entry if the current block dominates the target
          if (unprocessedPreds.length > 0 && !dominates(dominance.immediateDominator, currentBlockId!, terminator.target)) {
            currentBlockId = null;
            continue;
          }
        }
        currentBlockId = terminator.target;
        continue;
      }

      if (terminator.kind === 'branch_if') {
        const ifNode = structureIf(block, terminator, regionEnd);
        children.push(ifNode.node);
        currentBlockId = ifNode.mergeBlockId;
        continue;
      }

      if (terminator.kind === 'branch_table') {
        children.push(blockToNodeWithoutTerminator(block));
        const switchResult = structureSwitch(terminator, regionEnd, currentBlockId!);
        children.push(switchResult.node);
        currentBlockId = switchResult.mergeBlockId;
        continue;
      }

      children.push(blockToNode(block));
      currentBlockId = null;
    }

    if (children.length === 1) {
      return children[0];
    }
    return { kind: 'sequence', children };
  }

  function structureLoop(
    headerId: number,
    loop: NaturalLoop,
    regionEnd: number | null,
  ): StructuredNode {
    processed.add(headerId);
    const headerBlock = blockMap.get(headerId)!;
    const terminator = findTerminator(headerBlock);

    if (terminator && terminator.kind === 'branch_if') {
      const trueTarget = terminator.trueTarget;
      const falseTarget = terminator.falseTarget;

      const trueInLoop = loop.bodyIds.has(trueTarget);
      const falseInLoop = loop.bodyIds.has(falseTarget);

      if (trueInLoop && !falseInLoop) {
        const bodyNode = structureLoopBody(trueTarget, headerId, loop);
        const preBody = blockToNodeWithoutTerminator(headerBlock);
        const whileNode: StructuredNode = {
          kind: 'while',
          condition: terminator.condition,
          body: prependNode(preBody, bodyNode),
        };
        const exitId = falseTarget;
        if (exitId !== regionEnd && !processed.has(exitId)) {
          const afterLoop = structureRegion(exitId, regionEnd);
          return { kind: 'sequence', children: [whileNode, afterLoop] };
        }
        return whileNode;
      }

      if (!trueInLoop && falseInLoop) {
        const bodyNode = structureLoopBody(falseTarget, headerId, loop);
        const preBody = blockToNodeWithoutTerminator(headerBlock);
        const negatedCondition = negateCondition(terminator.condition);
        const whileNode: StructuredNode = {
          kind: 'while',
          condition: negatedCondition,
          body: prependNode(preBody, bodyNode),
        };
        const exitId = trueTarget;
        if (exitId !== regionEnd && !processed.has(exitId)) {
          const afterLoop = structureRegion(exitId, regionEnd);
          return { kind: 'sequence', children: [whileNode, afterLoop] };
        }
        return whileNode;
      }
    }

    const bodyNode = structureLoopBody(headerId, headerId, loop);
    const whileNode: StructuredNode = { kind: 'while', condition: null, body: bodyNode };

    const exitId = findSingleExit(loop);
    if (exitId !== null && exitId !== regionEnd && !processed.has(exitId)) {
      const afterLoop = structureRegion(exitId, regionEnd);
      return { kind: 'sequence', children: [whileNode, afterLoop] };
    }
    return whileNode;
  }

  function structureLoopBody(
    startId: number,
    headerId: number,
    loop: NaturalLoop,
  ): StructuredNode {
    const children: StructuredNode[] = [];
    let currentBlockId: number | null = startId;

    while (currentBlockId !== null) {
      if (currentBlockId === headerId && children.length > 0) {
        children.push({ kind: 'continue' });
        break;
      }

      if (!loop.bodyIds.has(currentBlockId)) {
        children.push({ kind: 'break' });
        break;
      }

      if (processed.has(currentBlockId) && currentBlockId !== startId) {
        break;
      }

      const block = blockMap.get(currentBlockId);
      if (!block) {
        break;
      }

      processed.add(currentBlockId);
      const terminator = findTerminator(block);

      if (!terminator) {
        children.push(blockToNode(block));
        if (block.successors.length === 1) {
          currentBlockId = block.successors[0];
        } else {
          break;
        }
        continue;
      }

      if (terminator.kind === 'return' || terminator.kind === 'unreachable') {
        children.push(blockToNode(block));
        break;
      }

      if (terminator.kind === 'branch') {
        children.push(blockToNodeWithoutTerminator(block));
        const target = terminator.target;
        if (target === headerId) {
          children.push({ kind: 'continue' });
          break;
        }
        if (!loop.bodyIds.has(target)) {
          children.push({ kind: 'break' });
          break;
        }
        currentBlockId = target;
        continue;
      }

      if (terminator.kind === 'branch_if') {
        const trueTarget = terminator.trueTarget;
        const falseTarget = terminator.falseTarget;

        const trueIsExit = !loop.bodyIds.has(trueTarget) || trueTarget === headerId;
        const falseIsExit = !loop.bodyIds.has(falseTarget) || falseTarget === headerId;

        if (trueIsExit && !falseIsExit) {
          children.push(blockToNodeWithoutTerminator(block));
          if (trueTarget === headerId) {
            children.push({
              kind: 'if',
              condition: terminator.condition,
              thenBody: { kind: 'continue' },
              elseBody: null,
            });
          } else {
            children.push({
              kind: 'if',
              condition: terminator.condition,
              thenBody: { kind: 'break' },
              elseBody: null,
            });
          }
          currentBlockId = falseTarget;
          continue;
        }

        if (falseIsExit && !trueIsExit) {
          children.push(blockToNodeWithoutTerminator(block));
          const negated = negateCondition(terminator.condition);
          if (falseTarget === headerId) {
            children.push({
              kind: 'if',
              condition: negated,
              thenBody: { kind: 'continue' },
              elseBody: null,
            });
          } else {
            children.push({
              kind: 'if',
              condition: negated,
              thenBody: { kind: 'break' },
              elseBody: null,
            });
          }
          currentBlockId = trueTarget;
          continue;
        }

        const ifResult = structureIf(block, terminator, null);
        children.push(ifResult.node);
        currentBlockId = ifResult.mergeBlockId;
        continue;
      }

      children.push(blockToNode(block));
      break;
    }

    if (children.length === 1) {
      return children[0];
    }
    return { kind: 'sequence', children };
  }

  function findMergePoint(targetA: number, targetB: number): number | null {
    const reachableA = new Set<number>();
    const worklistA: number[] = [targetA];
    while (worklistA.length > 0) {
      const blockId = worklistA.pop()!;
      if (reachableA.has(blockId)) { continue; }
      reachableA.add(blockId);
      const block = blockMap.get(blockId);
      if (block) {
        for (const successorId of block.successors) { worklistA.push(successorId); }
      }
    }

    const worklistB: number[] = [targetB];
    const visited = new Set<number>();
    while (worklistB.length > 0) {
      const blockId = worklistB.pop()!;
      if (visited.has(blockId)) { continue; }
      visited.add(blockId);
      if (reachableA.has(blockId)) { return blockId; }
      const block = blockMap.get(blockId);
      if (block) {
        for (const successorId of block.successors) { worklistB.push(successorId); }
      }
    }
    return null;
  }

  function structureSwitch(
    terminator: { kind: 'branch_table'; selector: SsaValue; targets: number[]; defaultTarget: number },
    regionEnd: number | null,
    dispatchBlockId: number,
  ): { node: StructuredNode; mergeBlockId: number | null } {
    // Group case values by target block ID
    const targetToCaseValues = new Map<number, number[]>();
    for (let caseIndex = 0; caseIndex < terminator.targets.length; caseIndex++) {
      const targetId = terminator.targets[caseIndex];
      if (!targetToCaseValues.has(targetId)) {
        targetToCaseValues.set(targetId, []);
      }
      targetToCaseValues.get(targetId)!.push(caseIndex);
    }

    // Collect all unique non-default target block IDs
    const uniqueTargetIds = new Set<number>();
    for (const targetId of terminator.targets) {
      if (targetId !== terminator.defaultTarget) {
        uniqueTargetIds.add(targetId);
      }
    }

    // Find merge point using the post-dominator of the dispatch block
    let mergeBlockId: number | null = null;
    const allTargetIds = new Set([...uniqueTargetIds, terminator.defaultTarget]);
    const postDomCandidate = dominance.postImmediateDominator.get(dispatchBlockId);
    if (postDomCandidate !== undefined && postDomCandidate !== dispatchBlockId && !allTargetIds.has(postDomCandidate)) {
      mergeBlockId = postDomCandidate;
    }

    // Pre-mark all switch targets as "claimed" so the merge-point heuristic
    // allows following into blocks whose only unprocessed predecessors are other switch targets
    const switchTargetSet = new Set(allTargetIds);

    // Structure each case body
    const cases: { values: number[]; body: StructuredNode }[] = [];
    for (const targetId of uniqueTargetIds) {
      const caseValues = targetToCaseValues.get(targetId) || [];
      if (processed.has(targetId)) {
        cases.push({ values: caseValues, body: { kind: 'sequence', children: [] } });
        continue;
      }
      const caseBody = structureRegion(targetId, mergeBlockId ?? regionEnd, switchTargetSet);
      cases.push({ values: caseValues, body: caseBody });
    }

    // Structure default body
    let defaultBody: StructuredNode;
    if (processed.has(terminator.defaultTarget)) {
      defaultBody = { kind: 'sequence', children: [] };
    } else {
      defaultBody = structureRegion(terminator.defaultTarget, mergeBlockId ?? regionEnd, switchTargetSet);
    }

    const switchNode: StructuredNode = {
      kind: 'switch',
      selector: terminator.selector,
      cases,
      defaultBody,
    };

    return { node: switchNode, mergeBlockId };
  }

  function structureIf(
    block: SsaBlock,
    terminator: { kind: 'branch_if'; condition: SsaValue; trueTarget: number; falseTarget: number },
    regionEnd: number | null,
  ): { node: StructuredNode; mergeBlockId: number | null } {
    const trueTarget = terminator.trueTarget;
    const falseTarget = terminator.falseTarget;
    const preBody = blockToNodeWithoutTerminator(block);

    const trueBlock = blockMap.get(trueTarget);
    const falseBlock = blockMap.get(falseTarget);

    const trueInlineable = trueBlock && trueBlock.predecessors.length === 1 && !processed.has(trueTarget);
    const falseInlineable = falseBlock && falseBlock.predecessors.length === 1 && !processed.has(falseTarget);

    // Find where the two branches converge
    const mergePoint = findMergePoint(trueTarget, falseTarget);

    // Both inlineable: if/else with merge at convergence point
    if (trueInlineable && falseInlineable) {
      const thenBody = structureRegion(trueTarget, mergePoint);
      const elseBody = structureRegion(falseTarget, mergePoint);
      const ifNode: StructuredNode = { kind: 'if', condition: terminator.condition, thenBody, elseBody };
      const nextId = mergePoint !== null && mergePoint !== regionEnd && !processed.has(mergePoint) ? mergePoint : null;
      return { node: prependNode(preBody, ifNode), mergeBlockId: nextId };
    }

    // Only true inlineable: if (cond) { then } — false is the merge point
    if (trueInlineable) {
      const thenBody = structureRegion(trueTarget, falseTarget);
      const ifNode: StructuredNode = { kind: 'if', condition: terminator.condition, thenBody, elseBody: null };
      const mergeId = falseTarget !== regionEnd && !processed.has(falseTarget) ? falseTarget : null;
      return { node: prependNode(preBody, ifNode), mergeBlockId: mergeId };
    }

    // Only false inlineable: if (!cond) { else } — true is the merge point
    if (falseInlineable) {
      const elseBody = structureRegion(falseTarget, trueTarget);
      const negated = negateCondition(terminator.condition);
      const ifNode: StructuredNode = { kind: 'if', condition: negated, thenBody: elseBody, elseBody: null };
      const mergeId = trueTarget !== regionEnd && !processed.has(trueTarget) ? trueTarget : null;
      return { node: prependNode(preBody, ifNode), mergeBlockId: mergeId };
    }

    // Neither inlineable — emit block instructions and continue
    const labeledBody = blockToNode(block);
    return { node: labeledBody, mergeBlockId: null };
  }

  function findSingleExit(loop: NaturalLoop): number | null {
    if (loop.exitIds.size > 0) {
      return loop.exitIds.values().next().value ?? null;
    }
    return null;
  }

  const result = structureRegion(ssaFunc.entryBlockId, ssaFunc.exitBlockId);

  // P0-6: Detect unvisited blocks and append as fallback
  const unvisited: StructuredNode[] = [];
  for (const block of ssaFunc.blocks) {
    if (block.id === ssaFunc.exitBlockId) { continue; }
    if (block.instructions.length === 0) { continue; }
    if (processed.has(block.id)) { continue; }
    unvisited.push({ kind: 'labeled_block', label: `unvisited_${block.id}`, body: { kind: 'block', body: block.instructions } });
  }

  const full = unvisited.length > 0
    ? { kind: 'sequence' as const, children: [result, ...unvisited] }
    : result;

  return postProcessNode(full, negateCondition);
}

function findTerminator(block: SsaBlock): SsaInstr | null {
  for (let index = block.instructions.length - 1; index >= 0; index--) {
    const instruction = block.instructions[index];
    if (instruction.kind === 'branch' || instruction.kind === 'branch_if' ||
        instruction.kind === 'branch_table' || instruction.kind === 'return' ||
        instruction.kind === 'unreachable') {
      return instruction;
    }
  }
  return null;
}

function blockToNode(block: SsaBlock): StructuredNode {
  if (block.instructions.length === 0) {
    return { kind: 'sequence', children: [] };
  }
  return { kind: 'block', body: block.instructions };
}

function blockToNodeWithoutTerminator(block: SsaBlock): StructuredNode {
  const nonTerminators = block.instructions.filter(instruction =>
    instruction.kind !== 'branch' && instruction.kind !== 'branch_if' &&
    instruction.kind !== 'branch_table'
  );
  if (nonTerminators.length === 0) {
    return { kind: 'sequence', children: [] };
  }
  return { kind: 'block', body: nonTerminators };
}

function prependNode(prefix: StructuredNode, main: StructuredNode): StructuredNode {
  if (prefix.kind === 'sequence' && prefix.children.length === 0) {
    return main;
  }
  if (prefix.kind === 'block' && prefix.body.length === 0) {
    return main;
  }
  return { kind: 'sequence', children: [prefix, main] };
}


