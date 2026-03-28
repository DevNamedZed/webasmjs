import { Expression, Statement, LoweredNode } from './ExpressionIR';

interface StackFrameInfo {
  stackPointerName: string;
  frameVarName: string;
  frameSize: number;
}

function isGlobalGet(expression: Expression, globalName: string): boolean {
  return expression.kind === 'global' && expression.name === globalName;
}

function isStackPointerGlobal(name: string): boolean {
  return name === '__stack_pointer' || name === 'sp' || name === 'stack_pointer';
}

function isGlobalSetToStackPointer(statement: Statement): { name: string; value: Expression } | null {
  if (statement.kind === 'global_set' && isStackPointerGlobal(statement.name)) {
    return { name: statement.name, value: statement.value };
  }
  return null;
}

function extractFrameAlloc(statements: Statement[]): StackFrameInfo | null {
  // Pattern 1: sp = __stack_pointer; fp = sp - N; __stack_pointer = fp;
  // Pattern 2: fp = __stack_pointer - N; __stack_pointer = fp;
  for (let statementIdx = 0; statementIdx < Math.min(statements.length, 5); statementIdx++) {
    const statement = statements[statementIdx];
    if (statement.kind !== 'assign') {
      continue;
    }

    // Check if this is sp = global_get(__stack_pointer)
    if (statement.value.kind === 'global' && isStackPointerGlobal(statement.value.name)) {
      const spVarName = statement.target;
      const spGlobalName = statement.value.name;

      // Look for fp = sp - N in next statements
      for (let nextIdx = statementIdx + 1; nextIdx < Math.min(statements.length, statementIdx + 4); nextIdx++) {
        const nextStatement = statements[nextIdx];
        if (nextStatement.kind === 'assign' && nextStatement.value.kind === 'binary' && nextStatement.value.op === 'sub') {
          if (nextStatement.value.left.kind === 'var' && nextStatement.value.left.name === spVarName &&
              nextStatement.value.right.kind === 'const') {
            const frameSize = Number(nextStatement.value.right.value);
            return {
              stackPointerName: spGlobalName,
              frameVarName: nextStatement.target,
              frameSize,
            };
          }
        }
      }
    }

    // Check if this is fp = __stack_pointer - N directly
    if (statement.value.kind === 'binary' && statement.value.op === '-') {
      if (statement.value.left.kind === 'global' && isStackPointerGlobal(statement.value.left.name) &&
          statement.value.right.kind === 'const') {
        const frameSize = Number(statement.value.right.value);
        return {
          stackPointerName: statement.value.left.name,
          frameVarName: statement.target,
          frameSize,
        };
      }
    }
  }

  return null;
}

function isEpilogueRestore(statement: Statement, frameInfo: StackFrameInfo): boolean {
  const globalSet = isGlobalSetToStackPointer(statement);
  if (!globalSet) {
    return false;
  }

  // __stack_pointer = fp + N
  if (globalSet.value.kind === 'binary' && globalSet.value.op === '+') {
    if (globalSet.value.left.kind === 'var' && globalSet.value.left.name === frameInfo.frameVarName &&
        globalSet.value.right.kind === 'const' && Number(globalSet.value.right.value) === frameInfo.frameSize) {
      return true;
    }
  }

  // __stack_pointer = sp (restoring original value)
  if (globalSet.value.kind === 'var') {
    return true;
  }

  return false;
}

function isStackFramePrologue(statement: Statement, frameInfo: StackFrameInfo): boolean {
  // sp = global_get(__stack_pointer)
  if (statement.kind === 'assign' && statement.value.kind === 'global' &&
      statement.value.name === frameInfo.stackPointerName) {
    return true;
  }

  // fp = sp - N
  if (statement.kind === 'assign' && statement.target === frameInfo.frameVarName &&
      statement.value.kind === 'binary' && statement.value.op === '-') {
    return true;
  }

  // __stack_pointer = fp (committing frame pointer)
  if (statement.kind === 'global_set' && isStackPointerGlobal(statement.name)) {
    if (statement.value.kind === 'var' && statement.value.name === frameInfo.frameVarName) {
      return true;
    }
  }

  return false;
}

function filterStatements(statements: Statement[], frameInfo: StackFrameInfo): Statement[] {
  return statements.filter(statement => {
    if (isStackFramePrologue(statement, frameInfo)) {
      return false;
    }
    if (isEpilogueRestore(statement, frameInfo)) {
      return false;
    }
    return true;
  });
}

function processNode(node: LoweredNode, frameInfo: StackFrameInfo): LoweredNode {
  switch (node.kind) {
    case 'block':
      return { kind: 'block', body: filterStatements(node.body, frameInfo) };
    case 'sequence':
      return { kind: 'sequence', children: node.children.map(child => processNode(child, frameInfo)) };
    case 'if':
      return {
        kind: 'if',
        condition: node.condition,
        thenBody: processNode(node.thenBody, frameInfo),
        elseBody: node.elseBody ? processNode(node.elseBody, frameInfo) : null,
      };
    case 'while':
      return { kind: 'while', condition: node.condition, body: processNode(node.body, frameInfo) };
    case 'do_while':
      return { kind: 'do_while', body: processNode(node.body, frameInfo), condition: node.condition };
    case 'for':
      return { kind: 'for', init: node.init, condition: node.condition, increment: node.increment, body: processNode(node.body, frameInfo) };
    case 'labeled_block':
      return { kind: 'labeled_block', label: node.label, body: processNode(node.body, frameInfo) };
    case 'switch':
      return {
        kind: 'switch',
        selector: node.selector,
        cases: node.cases.map(caseEntry => ({ values: caseEntry.values, body: processNode(caseEntry.body, frameInfo) })),
        defaultBody: processNode(node.defaultBody, frameInfo),
      };
    default:
      return node;
  }
}

function getFirstBlock(node: LoweredNode): Statement[] | null {
  if (node.kind === 'block') {
    return node.body;
  }
  if (node.kind === 'sequence' && node.children.length > 0) {
    return getFirstBlock(node.children[0]);
  }
  return null;
}

export interface StackFrameResult {
  node: LoweredNode;
  frameVarName: string | null;
  frameSize: number;
}

export function removeStackFrame(node: LoweredNode): StackFrameResult {
  const firstBlock = getFirstBlock(node);
  if (!firstBlock) {
    return { node, frameVarName: null, frameSize: 0 };
  }

  const frameInfo = extractFrameAlloc(firstBlock);
  if (!frameInfo) {
    return { node, frameVarName: null, frameSize: 0 };
  }

  return {
    node: processNode(node, frameInfo),
    frameVarName: frameInfo.frameVarName,
    frameSize: frameInfo.frameSize,
  };
}
