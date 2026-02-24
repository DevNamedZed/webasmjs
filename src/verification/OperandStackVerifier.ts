import OperandStack from './OperandStack';
import OpCodes from '../OpCodes';
import { ValueType, BlockType, ImmediateType, ValueTypeDescriptor, BlockTypeDescriptor, OpCodeDef } from '../types';
import { OperandStackBehavior, OperandStackType, ControlFlowType } from './types';
import Immediate from '../Immediate';
import ControlFlowBlock from './ControlFlowBlock';
import type FunctionBuilder from '../FunctionBuilder';
import ImportBuilder from '../ImportBuilder';
import FuncTypeBuilder from '../FuncTypeBuilder';
import LocalBuilder from '../LocalBuilder';
import GlobalBuilder from '../GlobalBuilder';
import FunctionParameterBuilder from '../FunctionParameterBuilder';
import FuncTypeSignature from '../FuncTypeSignature';
import VerificationError from './VerificationError';

export default class OperandStackVerifier {
  _operandStack: OperandStack;
  _instructionCount: number;
  _funcType: FuncTypeSignature;

  constructor(funcType: FuncTypeSignature) {
    this._operandStack = OperandStack.Empty;
    this._instructionCount = 0;
    this._funcType = funcType;
  }

  get stack(): OperandStack {
    return this._operandStack;
  }

  verifyInstruction(
    controlBlock: ControlFlowBlock,
    opCode: OpCodeDef,
    immediate: Immediate | null
  ): void {
    let modifiedStack = this._operandStack;
    if (opCode.stackBehavior !== OperandStackBehavior.None) {
      modifiedStack = this._verifyStack(controlBlock, opCode, immediate);
    }

    if (opCode.controlFlow === ControlFlowType.Pop) {
      this._verifyControlFlowPop(controlBlock, modifiedStack);
    } else if (opCode === (OpCodes as any).return) {
      modifiedStack = this._verifyReturnValues(modifiedStack, true);
    }

    if (immediate && immediate.type === ImmediateType.RelativeDepth) {
      this._verifyBranch(modifiedStack, immediate);
    }

    this._operandStack = modifiedStack;
    this._instructionCount++;
  }

  verifyElse(controlBlock: ControlFlowBlock): void {
    if (controlBlock.blockType !== BlockType.Void) {
      // Non-void if block: the true branch must have the result on stack
      if (this._operandStack.isEmpty) {
        throw new VerificationError(
          `else: expected ${(controlBlock.blockType as BlockTypeDescriptor).name} on the stack from the if-branch but the stack is empty.`
        );
      }
      const expectedType = controlBlock.blockType as ValueTypeDescriptor;
      if (this._operandStack.valueType !== expectedType) {
        throw new VerificationError(
          `else: expected ${expectedType.name} on the stack but found ${this._operandStack.valueType.name}.`
        );
      }
      const stackAfterPop = this._operandStack.pop();
      if (stackAfterPop !== controlBlock.stack) {
        throw new VerificationError(
          'else: stack (minus result value) does not match the if-block entry stack.'
        );
      }
    } else {
      // Void if block: stack must match entry
      if (this._operandStack !== controlBlock.stack) {
        throw new VerificationError(
          'else: stack does not match the if-block entry stack.'
        );
      }
    }
    // Reset stack for else branch
    this._operandStack = controlBlock.stack;
  }

  _verifyBranch(stack: OperandStack, immediate: Immediate): void {
    const targetBlock = immediate.values[0].block as ControlFlowBlock;
    const targetEntryStack = targetBlock.stack;

    if (targetBlock.isLoop) {
      // Branch to loop header: no result values needed, stack must match entry
      if (targetEntryStack !== stack) {
        throw new VerificationError(
          'Branch to loop: stack does not match the loop entry stack.'
        );
      }
      return;
    }

    if (targetBlock.blockType !== BlockType.Void) {
      // Non-void block: branch must carry the result value
      if (stack.isEmpty) {
        throw new VerificationError(
          `Branch expects ${(targetBlock.blockType as BlockTypeDescriptor).name} on the stack but the stack is empty.`
        );
      }
      const expectedType = targetBlock.blockType as ValueTypeDescriptor;
      if (stack.valueType !== expectedType) {
        throw new VerificationError(
          `Branch expects ${expectedType.name} but found ${stack.valueType.name} on the stack.`
        );
      }
      stack = stack.pop();
    }

    if (targetEntryStack !== stack) {
      throw new VerificationError(
        'Branch: stack does not match the target block entry stack.'
      );
    }
  }

  _verifyReturnValues(stack: OperandStack, pop: boolean = false): OperandStack {
    const remaining = this._getStackValueTypes(stack, stack.length);
    if (remaining.length !== this._funcType.returnTypes.length) {
      if (remaining.length === 0) {
        throw new VerificationError(
          `Function expected to return ${this._formatAndList(this._funcType.returnTypes, (x) => x.name)} ` +
            'but stack is empty.'
        );
      } else if (this._funcType.returnTypes.length === 0) {
        throw new VerificationError(
          `Function does not have any return values but ${this._formatAndList(remaining, (x) => x.name)} ` +
            `was found on the stack.`
        );
      }

      throw new VerificationError(
        `Function return values do not match the items on the stack. ` +
          `Expected: ${this._formatAndList(this._funcType.returnTypes, (x) => x.name)} ` +
          `Found on stack: ${this._formatAndList(remaining, (x) => x.name)}.`
      );
    }

    let errorMessage = '';
    for (let index = 0; index < remaining.length; index++) {
      if (remaining[index] !== this._funcType.returnTypes[index]) {
        errorMessage =
          `A ${this._funcType.returnTypes[index].name} was expected at ${remaining.length - index} ` +
          `but a ${remaining[index].name} was found. `;
      }
    }

    if (errorMessage !== '') {
      throw new VerificationError('Error returning from function: ' + errorMessage);
    }

    if (pop) {
      for (let index = 0; index < remaining.length; index++) {
        stack = stack.pop();
      }
    }

    return stack;
  }

  _verifyControlFlowPop(controlBlock: ControlFlowBlock, stack: OperandStack): void {
    if (controlBlock.depth === 0) {
      this._verifyReturnValues(stack);
    } else {
      const expectedStack =
        controlBlock.blockType !== BlockType.Void ? stack.pop() : stack;
      if (controlBlock.stack !== expectedStack) {
        throw new VerificationError();
      }
    }
  }

  _verifyStack(
    controlFlowBlock: ControlFlowBlock,
    opCode: OpCodeDef,
    immediate: Immediate | null
  ): OperandStack {
    let modifiedStack = this._operandStack;
    const funcType = this._getFuncType(opCode, immediate);

    if (
      opCode.stackBehavior === OperandStackBehavior.Pop ||
      opCode.stackBehavior === OperandStackBehavior.PopPush
    ) {
      modifiedStack = this._verifyStackPop(modifiedStack, opCode, funcType);
    }

    if (
      opCode.stackBehavior === OperandStackBehavior.Push ||
      opCode.stackBehavior === OperandStackBehavior.PopPush
    ) {
      modifiedStack = this._stackPush(
        modifiedStack,
        controlFlowBlock,
        opCode,
        immediate,
        funcType
      );
    }

    return modifiedStack;
  }

  _verifyStackPop(
    stack: OperandStack,
    opCode: OpCodeDef,
    funcType: FuncTypeBuilder | null
  ): OperandStack {
    // Pop popOperands first (e.g. call_indirect's table index sits on top of params).
    // Iterate in reverse because the array is in push order (bottom-to-top)
    // but we pop from the top of the stack.
    const pops = opCode.popOperands || [];
    for (let idx = pops.length - 1; idx >= 0; idx--) {
      const x = pops[idx];
      if (x === OperandStackType.Any) {
        stack = stack.pop();
        continue;
      }

      const valueType = (ValueType as any)[x] as ValueTypeDescriptor;
      if (valueType !== stack.valueType) {
        throw new VerificationError(
          `Unexpected type found on stack at offset ${this._instructionCount + 1}. ` +
            `A ${valueType.name} was expected but a ${stack.valueType.name} was found.`
        );
      }
      stack = stack.pop();
    }

    // Then pop function parameter types (for call / call_indirect).
    // Iterate in reverse because parameters are pushed in declaration order
    // (param 0 at bottom, last param on top).
    if (funcType) {
      const params = funcType.parameterTypes;
      for (let idx = params.length - 1; idx >= 0; idx--) {
        const x = params[idx];
        if (x !== stack.valueType) {
          throw new VerificationError(
            `Unexpected type found on stack at offset ${this._instructionCount + 1}. ` +
              `A ${x.name} was expected but a ${stack.valueType.name} was found.`
          );
        }
        stack = stack.pop();
      }
    }

    return stack;
  }

  _stackPush(
    stack: OperandStack,
    controlBlock: ControlFlowBlock,
    opCode: OpCodeDef,
    immediate: Immediate | null,
    funcType: FuncTypeBuilder | null
  ): OperandStack {
    const stackStart = stack;
    if (funcType) {
      stack = funcType.returnTypes.reduce((i, x) => {
        return i.push(x);
      }, stack);
    }

    stack = (opCode.pushOperands || []).reduce((i, x) => {
      let valueType: ValueTypeDescriptor;
      if (x !== OperandStackType.Any) {
        valueType = (ValueType as any)[x] as ValueTypeDescriptor;
      } else {
        const popCount = this._operandStack.length - stackStart.length;
        valueType = this._getStackObjectValueType(opCode, immediate, popCount);
      }
      return i.push(valueType);
    }, stack);

    return stack;
  }

  _getFuncType(opCode: OpCodeDef, immediate: Immediate | null): FuncTypeBuilder | null {
    let funcType: FuncTypeBuilder | null = null;

    if (opCode === (OpCodes as any).call || opCode === (OpCodes as any).return_call) {
      if (immediate!.values[0] instanceof ImportBuilder) {
        funcType = immediate!.values[0].data as FuncTypeBuilder;
      } else if (immediate!.values[0] && 'funcTypeBuilder' in immediate!.values[0]) {
        funcType = (immediate!.values[0] as FunctionBuilder).funcTypeBuilder;
      } else {
        throw new VerificationError('Error getting funcType for call, invalid immediate.');
      }
    } else if (opCode === (OpCodes as any).call_indirect || opCode === (OpCodes as any).return_call_indirect) {
      if (immediate!.values[0] instanceof FuncTypeBuilder) {
        funcType = immediate!.values[0];
      } else {
        throw new VerificationError(
          'Error getting funcType for call_indirect, invalid immediate.'
        );
      }
    }

    return funcType;
  }

  _getStackObjectValueType(
    opCode: OpCodeDef,
    immediate: Immediate | null,
    argCount: number
  ): ValueTypeDescriptor {
    if (
      opCode === (OpCodes as any).get_global ||
      opCode === (OpCodes as any).set_global
    ) {
      if (immediate!.values[0] instanceof GlobalBuilder) {
        return immediate!.values[0].valueType;
      } else if (immediate!.values[0] instanceof ImportBuilder) {
        return (immediate!.values[0].data as GlobalType).valueType;
      }
      throw new VerificationError('Invalid operand for global instruction.');
    } else if (
      opCode === (OpCodes as any).get_local ||
      opCode === (OpCodes as any).set_local ||
      opCode === (OpCodes as any).tee_local
    ) {
      if (
        !(immediate!.values[0] instanceof LocalBuilder) &&
        !(immediate!.values[0] instanceof FunctionParameterBuilder)
      ) {
        throw new VerificationError('Invalid operand for local instruction.');
      }
      return immediate!.values[0].valueType;
    }

    const stackArgTypes = this._getStackValueTypes(this._operandStack, argCount);
    return stackArgTypes[0];
  }

  _getStackValueTypes(stack: OperandStack, count: number): ValueTypeDescriptor[] {
    const results: ValueTypeDescriptor[] = [];
    let current = stack;

    for (let index = 0; index < count; index++) {
      results.push(current.valueType);
      current = current.pop();
    }

    return results.reverse();
  }

  _formatAndList<T>(values: T[], getText?: (item: T) => string): string {
    if (values.length === 1) {
      return getText ? getText(values[0]) : String(values[0]);
    }

    let text = '';
    for (let index = 0; index < values.length; index++) {
      text += getText ? getText(values[index]) : String(values[index]);
      if (index === values.length - 2) {
        text += ' and ';
      } else if (index !== values.length - 1) {
        text += ', ';
      }
    }

    return text;
  }
}

// Import at the end to avoid circular dependency issues at type level
import type GlobalType from '../GlobalType';
