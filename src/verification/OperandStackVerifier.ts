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
import type StructTypeBuilder from '../StructTypeBuilder';
import type ArrayTypeBuilder from '../ArrayTypeBuilder';

/**
 * Provides access to module type definitions for GC opcode verification.
 * The verifier uses this to look up struct field types and array element types.
 */
export interface TypeResolver {
  getStructType(typeIndex: number): StructTypeBuilder | null;
  getArrayType(typeIndex: number): ArrayTypeBuilder | null;
}

// Map heap type encoding values to their corresponding ValueType descriptors
const heapTypeToValueType: Record<number, ValueTypeDescriptor> = {
  0x70: ValueType.FuncRef,
  0x6f: ValueType.ExternRef,
  0x6e: ValueType.AnyRef,
  0x6d: ValueType.EqRef,
  0x6c: ValueType.I31Ref,
  0x6b: ValueType.StructRef,
  0x6a: ValueType.ArrayRef,
  0x71: ValueType.NullRef,
  0x73: ValueType.NullFuncRef,
  0x72: ValueType.NullExternRef,
};

const _refTypes = new Set<ValueTypeDescriptor>([
  ValueType.FuncRef, ValueType.ExternRef, ValueType.AnyRef,
  ValueType.EqRef, ValueType.I31Ref, ValueType.StructRef,
  ValueType.ArrayRef, ValueType.NullRef, ValueType.NullFuncRef,
  ValueType.NullExternRef,
]);

function _isRefType(vt: ValueTypeDescriptor): boolean {
  return _refTypes.has(vt);
}

export default class OperandStackVerifier {
  _operandStack: OperandStack;
  _instructionCount: number;
  _funcType: FuncTypeSignature;
  _unreachable: boolean;
  _typeResolver: TypeResolver | null;
  _memory64: boolean;

  constructor(funcType: FuncTypeSignature, typeResolver?: TypeResolver, memory64?: boolean) {
    this._operandStack = OperandStack.Empty;
    this._instructionCount = 0;
    this._funcType = funcType;
    this._unreachable = false;
    this._typeResolver = typeResolver || null;
    this._memory64 = memory64 || false;
  }

  get stack(): OperandStack {
    return this._operandStack;
  }

  verifyInstruction(
    controlBlock: ControlFlowBlock,
    opCode: OpCodeDef,
    immediate: Immediate | null
  ): void {
    // After unreachable code (throw, br, return, unreachable), skip verification
    // until the next control flow boundary (end, else, catch, catch_all)
    if (this._unreachable) {
      if (opCode.controlFlow === ControlFlowType.Pop) {
        // Reset unreachable on end — restore stack to block entry
        this._unreachable = false;
        this._operandStack = controlBlock.stack;
        if (controlBlock.blockType !== BlockType.Void) {
          // Non-void block produces its result type even when body is unreachable
          const resultType = controlBlock.blockType as ValueTypeDescriptor;
          this._operandStack = this._operandStack.push(resultType);
        }
      }
      this._instructionCount++;
      return;
    }

    let modifiedStack = this._operandStack;
    if (opCode.stackBehavior !== OperandStackBehavior.None) {
      modifiedStack = this._verifyStack(controlBlock, opCode, immediate);
    }

    if (opCode.controlFlow === ControlFlowType.Pop) {
      this._verifyControlFlowPop(controlBlock, modifiedStack);
    } else if (opCode === OpCodes["return"]) {
      modifiedStack = this._verifyReturnValues(modifiedStack, true);
      this._unreachable = true;
    }

    if (immediate && immediate.type === ImmediateType.RelativeDepth) {
      this._verifyBranch(modifiedStack, immediate);
    }
    // Note: BrOnCast branch verification is skipped — br_on_cast carries the
    // narrowed ref type to the target, which requires full GC subtype checking
    // against the block's expected type. The control flow label reference is
    // still tracked by the ControlFlowVerifier.

    // Mark as unreachable after unconditional control transfer
    if (
      opCode === OpCodes["throw"] ||
      opCode === OpCodes.rethrow ||
      opCode === OpCodes.unreachable ||
      opCode === OpCodes.br ||
      opCode === OpCodes.br_table
    ) {
      this._unreachable = true;
    }

    this._operandStack = modifiedStack;
    this._instructionCount++;
  }

  verifyElse(controlBlock: ControlFlowBlock): void {
    // If the if-branch ended in unreachable code, skip stack checks and reset
    if (this._unreachable) {
      this._unreachable = false;
      this._operandStack = controlBlock.stack;
      return;
    }
    if (controlBlock.blockType !== BlockType.Void) {
      // Non-void if block: the true branch must have the result on stack
      if (this._operandStack.isEmpty) {
        throw new VerificationError(
          `else: expected ${(controlBlock.blockType as BlockTypeDescriptor).name} on the stack from the if-branch but the stack is empty.`
        );
      }
      const expectedType = controlBlock.blockType as ValueTypeDescriptor;
      if (!this._isAssignableTo(this._operandStack.valueType, expectedType)) {
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
      if (!this._isAssignableTo(stack.valueType, expectedType)) {
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
      if (!this._isAssignableTo(remaining[index], this._funcType.returnTypes[index])) {
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

    // Handle ref_null: metadata says Int32 but should push the appropriate ref type
    if (opCode === OpCodes.ref_null && immediate) {
      const heapType = immediate.values[0];
      const refVt = (typeof heapType === 'number' && heapTypeToValueType[heapType])
        ? heapTypeToValueType[heapType]
        : ValueType.AnyRef;
      return modifiedStack.push(refVt);
    }

    // Handle ref_is_null: pops any reference type and pushes Int32
    if (opCode === OpCodes.ref_is_null) {
      return modifiedStack.pop().push(ValueType.Int32);
    }

    // Handle ref_func: pushes funcref (metadata says Int32)
    if (opCode === OpCodes.ref_func) {
      return modifiedStack.push(ValueType.FuncRef);
    }

    // Handle struct_new: pop N field values (metadata says Push-only, but it actually pops)
    if (opCode === OpCodes.struct_new && this._typeResolver && immediate) {
      const typeIndex = immediate.values[0];
      const structType = this._typeResolver.getStructType(typeIndex);
      if (structType) {
        // Pop field values in reverse order (last field is on top of stack)
        for (let i = structType.fields.length - 1; i >= 0; i--) {
          modifiedStack = modifiedStack.pop();
        }
      }
      // Then push the struct reference
      modifiedStack = modifiedStack.push(ValueType.AnyRef);
      return modifiedStack;
    }

    // Handle array_new_fixed: pop N element values (metadata says Push-only)
    if (opCode === OpCodes.array_new_fixed && immediate) {
      const fixedLength = immediate.values[1];
      for (let i = 0; i < fixedLength; i++) {
        modifiedStack = modifiedStack.pop();
      }
      modifiedStack = modifiedStack.push(ValueType.AnyRef);
      return modifiedStack;
    }

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
      if (!this._isAssignableTo(stack.valueType, valueType)) {
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

    if (opCode === OpCodes.call || opCode === OpCodes.return_call) {
      if (immediate!.values[0] instanceof ImportBuilder) {
        funcType = immediate!.values[0].data as FuncTypeBuilder;
      } else if (immediate!.values[0] && 'funcTypeBuilder' in immediate!.values[0]) {
        funcType = (immediate!.values[0] as FunctionBuilder).funcTypeBuilder;
      } else {
        throw new VerificationError('Error getting funcType for call, invalid immediate.');
      }
    } else if (opCode === OpCodes.call_indirect || opCode === OpCodes.return_call_indirect) {
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
      opCode === OpCodes.get_global ||
      opCode === OpCodes.set_global
    ) {
      if (immediate!.values[0] instanceof GlobalBuilder) {
        return immediate!.values[0].valueType;
      } else if (immediate!.values[0] instanceof ImportBuilder) {
        return (immediate!.values[0].data as GlobalType).valueType;
      }
      throw new VerificationError('Invalid operand for global instruction.');
    } else if (
      opCode === OpCodes.get_local ||
      opCode === OpCodes.set_local ||
      opCode === OpCodes.tee_local
    ) {
      if (
        !(immediate!.values[0] instanceof LocalBuilder) &&
        !(immediate!.values[0] instanceof FunctionParameterBuilder)
      ) {
        throw new VerificationError('Invalid operand for local instruction.');
      }
      return immediate!.values[0].valueType;
    }

    // ─── GC opcode push type resolution ───

    // struct.get: push the field's value type
    if (opCode === OpCodes.struct_get && this._typeResolver && immediate) {
      const typeIndex = immediate.values[0];
      const fieldIndex = immediate.values[1];
      const structType = this._typeResolver.getStructType(typeIndex);
      if (structType && fieldIndex < structType.fields.length) {
        return structType.fields[fieldIndex].type;
      }
    }

    // struct.new_default: push a ref type (no field pops needed)
    if (opCode === OpCodes.struct_new_default) {
      return ValueType.AnyRef;
    }

    // array.new, array.new_default, array.new_data, array.new_elem: push array ref
    if (
      opCode === OpCodes.array_new ||
      opCode === OpCodes.array_new_default ||
      opCode === OpCodes.array_new_data ||
      opCode === OpCodes.array_new_elem
    ) {
      return ValueType.AnyRef;
    }

    // array.get: push the array's element type
    if (opCode === OpCodes.array_get && this._typeResolver && immediate) {
      const typeIndex = immediate.values[0];
      const arrayType = this._typeResolver.getArrayType(typeIndex);
      if (arrayType) {
        return arrayType.elementType;
      }
    }

    // ref.cast, ref.cast_null: push a ref type
    if (opCode === OpCodes.ref_cast || opCode === OpCodes.ref_cast_null) {
      return ValueType.AnyRef;
    }

    // ref.i31: push i31ref
    if (opCode === OpCodes.ref_i31) {
      return ValueType.I31Ref;
    }

    // any.convert_extern: push anyref
    if (opCode === OpCodes.any_convert_extern) {
      return ValueType.AnyRef;
    }

    // extern.convert_any: push externref
    if (opCode === OpCodes.extern_convert_any) {
      return ValueType.ExternRef;
    }

    // br_on_cast, br_on_cast_fail: push a ref type (the narrowed or original type)
    if (opCode === OpCodes.br_on_cast || opCode === OpCodes.br_on_cast_fail) {
      return ValueType.AnyRef;
    }

    // ref.null: push the corresponding ref type based on heap type immediate
    if (opCode === OpCodes.ref_null && immediate) {
      const heapType = immediate.values[0];
      if (typeof heapType === 'number' && heapTypeToValueType[heapType]) {
        return heapTypeToValueType[heapType];
      }
      return ValueType.AnyRef;
    }

    const stackArgTypes = this._getStackValueTypes(this._operandStack, argCount);
    return stackArgTypes[0];
  }

  /**
   * Check if `actual` is assignable to `expected` considering GC reference subtyping.
   * Subtype hierarchy: anyref ← eqref ← {i31ref, structref, arrayref}
   * Bottom types: nullref → any, nullfuncref → funcref, nullexternref → externref
   */
  _isAssignableTo(actual: ValueTypeDescriptor, expected: ValueTypeDescriptor): boolean {
    if (actual === expected) return true;
    // GC reference type subtyping: anyref ← eqref ← {i31ref, structref, arrayref}
    if (expected === ValueType.AnyRef) {
      return actual === ValueType.EqRef || actual === ValueType.I31Ref ||
        actual === ValueType.StructRef || actual === ValueType.ArrayRef ||
        actual === ValueType.NullRef;
    }
    if (expected === ValueType.EqRef) {
      return actual === ValueType.I31Ref || actual === ValueType.StructRef ||
        actual === ValueType.ArrayRef || actual === ValueType.NullRef;
    }
    if (expected === ValueType.FuncRef) {
      return actual === ValueType.NullFuncRef;
    }
    if (expected === ValueType.ExternRef) {
      return actual === ValueType.NullExternRef;
    }
    // Legacy compatibility: many opcodes (table.set, etc.) use Int32 in metadata
    // as a placeholder for reference types. Allow ref types where Int32 is expected.
    if (expected === ValueType.Int32 && _isRefType(actual)) {
      return true;
    }
    // Memory64: load/store address operands are i64 instead of i32
    if (expected === ValueType.Int32 && actual === ValueType.Int64 && this._memory64) {
      return true;
    }
    return false;
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
