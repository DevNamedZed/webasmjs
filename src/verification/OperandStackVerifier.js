import OperandStack from "./OperandStack";
import OpCodes from "../OpCodes";
import ValueType from '../ValueType'
import Immediate from "../Immediate";
import OperandStackBehavior from './OperandStackBehavior'
import OperandStackType from './OperandStackType'
import ControlFlowBlock from "./ControlFlowBlock";
import FunctionBuilder from "../FunctionBuilder";
import ImportBuilder from "../ImportBuilder";
import FuncTypeBuilder from "../FuncTypeBuilder";
import ControlFlowType from "./ControlFlowType";
import BlockType from "../BlockType";
import { LocalBuilder } from "..";
import GlobalBuilder from "../GlobalBuilder";
import ImmediateType from "../ImmediateType";
import FunctionParameterBuilder from "../FunctionParametersBuilder";
import FuncTypeSignature from "../FuncTypeSignature";
import VerificationError from "./VerificationError";

export default class OperandStackVerifier {
    /**
     * @type {OperandStack}
     */
    _operandStack;

    /**
     * @type {Number}
     */
    _instructionCount;

    /**
     * @type {FuncTypeSignature}
     */
    _funcType;

    constructor(funcType) {
        this._operandStack = OperandStack.Empty;
        this._instructionCount = 0;
        this._funcType = funcType;
    }

    /**
     * Gets the operand stack.
     */
    get stack() {
        return this._operandStack;
    }

    /**
     * Verifies the instruction is valid given the current state of the stack.
     * @param {OpCodes} opCode The OpCode associated with the current instruction.
     * @param {Immediate} immediate The instruction operand.
     */
    verifyInstruction(controlBlock, opCode, immediate) {
        // Validate any changes the instruction will mark to the operand stack.
        let modifiedStack = this._operandStack;
        if (opCode.stackBehavior !== OperandStackBehavior.None) {
            modifiedStack = this._verifyStack(controlBlock, opCode, immediate)
        }

        if (opCode.controlFlow == ControlFlowType.Pop) {
            this._verifyControlFlowPop(controlBlock, modifiedStack);
        }
        else if (opCode == OpCodes.return) {
            this._verifyReturnValues(modifiedStack);
        }

        if (immediate && immediate.type === ImmediateType.RelativeDepth) {
            this._verifyBranch(modifiedStack, immediate);
        }

        this._operandStack = modifiedStack;
        this._instructionCount++;
    }

    /**
     * Verifies the state of the operand stack after a branching instruction.
     * @param {OpCodes} opCode 
     * @param {*} operand 
     */
    _verifyBranch(stack, immediate) {
        const targetControlFlow = immediate.values[0].block;
        const targetOperandStack = targetControlFlow.stack;

        // const expectedStack = controlBlock.blockType !== BlockType.Void ?
        // stack.pop() :
        // stack;
        if (targetOperandStack !== stack) {
            throw new VerificationError();
        }
    }

    /**
     * Verifies any remaining values on the stack match the return types for the function.
     * @param {OperandStack} stack The stack to check. 
     */
    _verifyReturnValues(stack) {
        const remaining = this._getStackValueTypes(stack, stack.length);
        if (remaining.length !== this._funcType.returnTypes.length) {
            if (remaining.length === 0) {
                throw new VerificationError(
                    `Function expected to return ${this._formatAndList(this._funcType.returnTypes, x => x.name)} ` +
                    'but stack is empty.');
            }
            else if (this._funcType.returnTypes.length === 0) {
                throw new VerificationError(
                    `Function does not have any return values but ${this._formatAndList(remaining, x => x.name)} ` +
                    `was found on the stack.`);
            }

            throw new VerificationError(
                `Function return values do not match the items on the stack. ` +
                `Function: ${this._formatAndList(remaining, x => x.name)} ` +
                `Stack: ${this._formatAndList(this._funcType.returnTypes, x => x.name)} ` +
                `was found on the stack.`);
        }

        let errorMessage = "";
        for (let index = 0; index < remaining.length; index++) {
            if (remaining[index] != this._funcType.returnTypes[index]) {
                errorMessage = `A ${this._funcType.returnTypes[index]} was expected at ${remaining.length - index} ` +
                    `but a ${remaining[index]} was found. `
            }
        }

        if (errorMessage !== "") {
            throw new VerificationError(
                "Error returning from function: " + errorMessage);
        }
    }

    /**
     * Verifies the operand stack state after an instruction that exits a control enclosure.
     * @param {ControlFlowBlock} controlBlock The current control structure. 
     * @param {OperandStack} stack The current operand stack.
     */
    _verifyControlFlowPop(controlBlock, stack) {
        if (controlBlock.depth === 0) {
            // If the depth is zero and and control flow pop instruction is found
            // then the function is exiting. Validate the remaining values on the stack 
            // match the return values defined in the func_type for the function.
            this._verifyReturnValues(stack);
        }
        else {
            const expectedStack = controlBlock.blockType !== BlockType.Void ?
                stack.pop() :
                stack;
            if (controlBlock.stack !== expectedStack) {
                throw new VerificationError();
            }
        }
    }

    /**
     * Verifies the instruction can be executed given the current state of the operand stack.
     * @param {ControlFlowBlock} controlFlowBlock 
     * @param {OpCodes} opCode 
     * @param {Immediate} immediate 
     * @returns {OperandStack} The update
     */
    _verifyStack(controlFlowBlock, opCode, immediate) {
        let modifiedStack = this._operandStack;
        const funcType = this._getFuncType(opCode, immediate);

        if (opCode.stackBehavior === OperandStackBehavior.Pop ||
            opCode.stackBehavior === OperandStackBehavior.PopPush) {
            modifiedStack = this._verifyStackPop(modifiedStack, opCode, funcType);
        }

        if (opCode.stackBehavior === OperandStackBehavior.Push ||
            opCode.stackBehavior === OperandStackBehavior.PopPush) {
            modifiedStack = this._stackPush(modifiedStack, controlFlowBlock, opCode, immediate, funcType);
        }

        return modifiedStack;
    }

    /**
     * Pops the arguments for an instruction off the operand stack.
     * @param {OperandStack} stack The operand stack containing arguments for instructions.
     * @param {OpCodes} opCode The opcode that is being validated.
     * @param {FuncTypeBuilder} funcType The funcType that describes the function signature for call 
     * and call indirect instructions.
     * @returns {OperandStack} The modified operand stack.
     */
    _verifyStackPop(stack, opCode, funcType) {
        if (funcType) {
            stack = funcType.parameterTypes.reduce((i, x) => {
                if (x !== i.valueType) {
                    throw new VerificationError(`Unexpected type found on stack at offset ${this._instructionCount + 1}. ` +
                        `A ${x} was expected but a ${i.type} was found.`);
                }

                return i.pop();
            },
                stack);
        }

        stack = opCode.popOperands.reduce((i, x) => {
            if (x === OperandStackType.Any) {
                return i.pop();
            }

            const valueType = ValueType[x];
            if (valueType !== i.valueType) {
                throw new VerificationError(`Unexpected type found on stack at offset ${this._instructionCount + 1}. ` +
                    `A ${valueType} was expected but a ${i.type} was found.`);
            }

            return i.pop();
        },
            stack);

        return stack;
    }

    /**
     * Pushes the results from an instruction onto the operand stack.
     * @param {OperandStack} stack The current operand stack.
     * @param {ControlFlowBlock} controlBlock The current control enclosure. 
     * @param {OpCodes} opCode The opcode that is being validated.
     * @param {Immediate} immediate The immediate operand for the instruction. 
     * @param {FuncTypeBuilder} funcType The funcType that describes the function signature for call 
     * and call indirect instructions.
     * @returns {OperandStack} The modified operand stack.
     */
    _stackPush(stack, controlBlock, opCode, immediate, funcType) {
        const stackStart = stack;
        if (funcType) {
            stack = funcType.returnTypes.reduce((i, x) => {
                return i.push(x);
            },
                stack);
        }

        stack = opCode.pushOperands.reduce((i, x) => {
            let valueType = null;
            if (x !== OperandStackType.Any) {
                valueType = ValueType[x];
            }
            else {
                const popCount = this._operandStack.length - stackStart.length;
                valueType = this._getStackObjectValueType(opCode, immediate, popCount);
            }

            return i.push(valueType);
        },
            stack);

        return stack;
    }

    /**
     * For a call or call_indirect get the func type that describes the signature of the function that is being called.
     * @param {OpCodes} opCode The opcode to check.
     * @param {Immediate} immediate The immediate operand to the op.
     * @returns {FuncTypeBuilder} The func type associated with the instruction.
     */
    _getFuncType(opCode, immediate) {
        let funcType = null;

        if (opCode === OpCodes.call) {
            if (immediate.values[0] instanceof FunctionBuilder) {
                funcType = immediate.values[0].funcTypeBuilder;
            }
            else if (immediate.values[0] instanceof ImportBuilder) {
                funcType = immediate.values[0].data;
            }
            else {
                throw new VerificationError('Error getting funcType for call, invalid immediate.');
            }
        }
        else if (opCode === OpCodes.call_indirect) {
            if (immediate.values[0] instanceof FuncTypeBuilder) {
                funcType = immediate.values[0];
            }
            else {
                throw new VerificationError('Error getting funcType for call_indirect, invalid immediate.');
            }
        }

        return funcType;
    }


    /**
     * Infers the type of a value being pushed on a stack based on the stack arguments and immediate.
     * @param {OpCodes} opCode The opcode.
     * @param {Immediate} immediate The immediate. 
     * @param {Number} argCount The number of stack arguments being consumed by the opcode. 
     * @returns {ValueType} The value type the instruction will push.
     */
    _getStackObjectValueType(opCode, immediate, argCount) {
        if (opCode === OpCodes.get_global || opCode === OpCodes.set_global) {
            if (immediate.values[0] instanceof GlobalBuilder) {
                return immediate.values[0].valueType;
            }
            else if (immediate.values[0] instanceof ImportBuilder) {
                return immediate.values[0].data.valueType;
            }

            throw new VerificationError('Invalid operand for global instruction.');
        }
        else if (opCode === OpCodes.get_local || opCode === OpCodes.set_local ||
            opCode === OpCodes.tee_local) {
            if (!(immediate.values[0] instanceof LocalBuilder) &&
                !(immediate.values[0] instanceof FunctionParameterBuilder)) {
                throw new VerificationError('Invalid operand for local instruction.');
            }

            return immediate.values[0].valueType;
        }

        const stackArgTypes = this._getStackValueTypes(this._operandStack, argCount);
        return stackArgTypes[0];
    }

    /**
     * Gets an array @type {ValueType}s that represents the values of the items on the stack.
     * @param {OperandStack} stack The operand stack.
     * @param {Number} count The number of items on the stack to check.
     * @returns {ValueType[]} 
     */
    _getStackValueTypes(stack, count) {
        const results = [];
        let current = stack;

        for (let index = 0; index < count; index++) {
            results.push(current.valueType);
            current = current.pop();
        }

        return results.reverse();
    }

    /**
     * Creates a formatted message for the list of values.
     * @param {Object[]} values The list of values.
     * @param {Function} getText Function used to extract the text from a value in the list. 
     */
    _formatAndList(values, getText) {
        if (values.length === 1) {
            return getText ? getText(values[0]) : values[0];
        }

        let text = "";
        for (let index = 0; index < values.length; index++) {
            text += getText ? getText(values[index]) : values[index];
            if (index === values.length - 2) {
                text += " and "
            }
            else if (index !== values.length - 1) {
                text += ", "
            }
        }

        return text;
    }
}