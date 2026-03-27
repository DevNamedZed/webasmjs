import { SsaValue, SsaVariable, SsaInstr } from './SsaBuilder';
import { StructuredNode } from './StructuralAnalysis';

type NegateFn = (condition: SsaValue) => SsaValue;

export function postProcessNode(node: StructuredNode, negateFn: NegateFn): StructuredNode {
  switch (node.kind) {
    case 'sequence': {
      const processed = node.children.map(child => postProcessNode(child, negateFn));
      const reduced = reduceNesting(processed, negateFn);
      const flattened: StructuredNode[] = [];
      for (const child of reduced) {
        if (child.kind === 'sequence') {
          for (const grandchild of child.children) {
            if (!isEmptyNode(grandchild)) {
              flattened.push(grandchild);
            }
          }
        } else if (!isEmptyNode(child)) {
          flattened.push(child);
        }
      }
      if (flattened.length === 1) {
        return flattened[0];
      }
      return { kind: 'sequence', children: flattened };
    }
    case 'if': {
      let thenBody = postProcessNode(node.thenBody, negateFn);
      let elseBody = node.elseBody ? postProcessNode(node.elseBody, negateFn) : null;
      let condition = node.condition;
      if (isEmptyNode(thenBody) && elseBody && !isEmptyNode(elseBody)) {
        condition = negateFn(condition);
        thenBody = elseBody;
        elseBody = null;
      }
      const processedIf: StructuredNode = { kind: 'if', condition, thenBody, elseBody };
      const reduced = reduceNesting([processedIf], negateFn);
      if (reduced.length === 1) {
        return reduced[0];
      }
      return { kind: 'sequence', children: reduced };
    }
    case 'while':
      return extractLoopCondition({
        kind: 'while',
        condition: node.condition,
        body: postProcessNode(node.body, negateFn),
      }, negateFn);
    case 'do_while':
      return { kind: 'do_while', body: postProcessNode(node.body, negateFn), condition: node.condition };
    case 'labeled_block':
      return { kind: 'labeled_block', label: node.label, body: postProcessNode(node.body, negateFn) };
    default:
      return node;
  }
}

function endsWithExit(node: StructuredNode): boolean {
  if (node.kind === 'return' || node.kind === 'break' || node.kind === 'continue' || node.kind === 'unreachable') {
    return true;
  }
  if (node.kind === 'sequence' && node.children.length > 0) {
    return endsWithExit(node.children[node.children.length - 1]);
  }
  if (node.kind === 'block' && node.body.length > 0) {
    const lastInstr = node.body[node.body.length - 1];
    return lastInstr.kind === 'return' || lastInstr.kind === 'unreachable';
  }
  return false;
}

function reduceNesting(children: StructuredNode[], negateFn: NegateFn): StructuredNode[] {
  const result: StructuredNode[] = [];
  for (const child of children) {
    if (child.kind === 'if' && child.elseBody && !isEmptyNode(child.elseBody) && endsWithExit(child.thenBody)) {
      result.push({ kind: 'if', condition: child.condition, thenBody: child.thenBody, elseBody: null });
      result.push(child.elseBody);
    } else if (child.kind === 'if' && child.elseBody && !isEmptyNode(child.thenBody) && endsWithExit(child.elseBody)) {
      result.push({ kind: 'if', condition: negateFn(child.condition), thenBody: child.elseBody, elseBody: null });
      result.push(child.thenBody);
    } else {
      result.push(child);
    }
  }
  return result;
}

function isEmptyNode(node: StructuredNode): boolean {
  if (node.kind === 'sequence' && node.children.length === 0) { return true; }
  if (node.kind === 'block' && node.body.length === 0) { return true; }
  return false;
}

function extractLoopCondition(
  node: { kind: 'while'; condition: SsaValue | null; body: StructuredNode },
  negateFn: NegateFn,
): StructuredNode {
  if (node.condition !== null) {
    return node;
  }

  const bodyChildren = getSequenceChildren(node.body);
  if (bodyChildren.length === 0) {
    return node;
  }

  const lastChild = bodyChildren[bodyChildren.length - 1];
  if (lastChild.kind === 'if' && lastChild.elseBody === null) {
    if (lastChild.thenBody.kind === 'break') {
      const conditionUsesBodyVars = conditionReferencesBodyDefinitions(lastChild.condition, bodyChildren.slice(0, -1));
      if (!conditionUsesBodyVars) {
        const newBody = bodyChildren.length > 1
          ? { kind: 'sequence' as const, children: bodyChildren.slice(0, -1) }
          : { kind: 'sequence' as const, children: [] };
        return { kind: 'while', condition: negateFn(lastChild.condition), body: newBody };
      }
    }
    if (lastChild.thenBody.kind === 'continue') {
      const newBody = bodyChildren.length > 1
        ? { kind: 'sequence' as const, children: bodyChildren.slice(0, -1) }
        : { kind: 'sequence' as const, children: [] };
      return { kind: 'do_while', body: newBody, condition: lastChild.condition };
    }
  }

  const firstChild = bodyChildren[0];
  if (firstChild.kind === 'if' && firstChild.elseBody === null && firstChild.thenBody.kind === 'break') {
    const conditionUsesBodyVars = conditionReferencesBodyDefinitions(firstChild.condition, bodyChildren.slice(1));
    if (!conditionUsesBodyVars) {
      const newBody = bodyChildren.length > 1
        ? { kind: 'sequence' as const, children: bodyChildren.slice(1) }
        : { kind: 'sequence' as const, children: [] };
      return { kind: 'while', condition: negateFn(firstChild.condition), body: newBody };
    }
  }

  return node;
}

function conditionReferencesBodyDefinitions(condition: SsaValue, bodyNodes: StructuredNode[]): boolean {
  const definedIds = new Set<number>();
  for (const bodyNode of bodyNodes) {
    collectDefinedIds(bodyNode, definedIds);
  }
  return conditionUsesIdsDeep(condition, definedIds, bodyNodes);
}

function collectDefinedIds(node: StructuredNode, ids: Set<number>): void {
  if (node.kind === 'block') {
    for (const instr of node.body) {
      if ('result' in instr && instr.result && 'id' in instr.result) {
        const result = instr.result as SsaVariable;
        ids.add(result.id);
      }
    }
  } else if (node.kind === 'sequence') {
    for (const child of node.children) { collectDefinedIds(child, ids); }
  } else if (node.kind === 'if') {
    collectDefinedIds(node.thenBody, ids);
    if (node.elseBody) { collectDefinedIds(node.elseBody, ids); }
  }
}

function conditionUsesIdsDeep(
  value: SsaValue,
  ids: Set<number>,
  bodyNodes: StructuredNode[],
): boolean {
  if ('id' in value && !('kind' in value)) {
    if (ids.has(value.id)) {
      return true;
    }
    // Search body nodes for the instruction that defines this variable
    // and recursively check its operands
    const defInstr = findDefiningInstruction(value.id, bodyNodes);
    if (defInstr) {
      return instrOperandsUseIds(defInstr, ids, bodyNodes);
    }
    return false;
  }
  return false;
}

function findDefiningInstruction(varId: number, nodes: StructuredNode[]): SsaInstr | null {
  for (const node of nodes) {
    if (node.kind === 'block') {
      for (const instr of node.body) {
        if ('result' in instr && instr.result && 'id' in instr.result && instr.result.id === varId) {
          return instr;
        }
      }
    } else if (node.kind === 'sequence') {
      const found = findDefiningInstruction(varId, node.children);
      if (found) { return found; }
    } else if (node.kind === 'if') {
      const found = findDefiningInstruction(varId, [node.thenBody]);
      if (found) { return found; }
      if (node.elseBody) {
        const foundElse = findDefiningInstruction(varId, [node.elseBody]);
        if (foundElse) { return foundElse; }
      }
    }
  }
  return null;
}

function instrOperandsUseIds(instr: SsaInstr, ids: Set<number>, bodyNodes: StructuredNode[]): boolean {
  const operands: SsaValue[] = [];
  if ('left' in instr) { operands.push(instr.left as SsaValue); }
  if ('right' in instr) { operands.push(instr.right as SsaValue); }
  if ('operand' in instr) { operands.push(instr.operand as SsaValue); }
  if ('address' in instr && instr.kind === 'load') { operands.push(instr.address as SsaValue); }
  if ('value' in instr && instr.kind === 'assign') { operands.push(instr.value as SsaValue); }
  for (const operand of operands) {
    if (conditionUsesIdsDeep(operand, ids, bodyNodes)) {
      return true;
    }
  }
  return false;
}

function getSequenceChildren(node: StructuredNode): StructuredNode[] {
  if (node.kind === 'sequence') {
    return node.children;
  }
  return [node];
}
