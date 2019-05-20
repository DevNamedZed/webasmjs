import Arg from "./Arg";
import BinaryWriter from "./BinaryWriter";
import BlockType from "./BlockType";
import FunctionParameterBuilder from "./FunctionParametersBuilder";
import FunctionBuilder from "./FunctionBuilder";
import Immediate from './Immediate'
import ImmediateType from "./ImmediateType";
import ImportBuilder from "./ImportBuilder";
import Instruction from './Instruction'
import LabelBuilder from "./LabelBuilder";
import LocalBuilder from "./LocalBuilder";
import OpCodeEmitter from "./OpCodeEmitter";
import OpCodes from "./OpCodes";
import ControlFlowVerifier from './verification/ControlFlowVerifier';
import ControlFlowType from "./verification/ControlFlowType";
import OperandStackVerifier from "./verification/OperandStackVerifier";
import FuncTypeSignature from "./FuncTypeSignature";

const validateParameters = (immediateType, values, length) => {
    if (!values || values.length !== length) {
        throw new Error(`Unexpected number of values for ${immediateType}.`);
    }
};

/**
 * Used to generate the body of a function.
 */
export default class AssemblyEmitter extends OpCodeEmitter {
    /**
     * @type {Instruction[]}
     */
    _instructions;

    /**
     * @type {LocalBuilder[]}
     */
    _locals;

    /**
     * @type {LabelBuilder}
     */
    _entryLabel;

    /**
     * @type {ControlFlowVerifier}
     */
    _controlFlowVerifier;

    /**
     * @type {OperandStackVerifier}
     */
    _operandStackVerifier;

    _options;

    /**
     * Creates and initializes a new AssemblyEmitter.
     */
    constructor(funcSignature, options = { disableVerification: false }) {
        super();

        Arg.instanceOf('funcSignature', funcSignature, FuncTypeSignature);
        this._instructions = [];
        this._locals = [];
        this._controlFlowVerifier = new ControlFlowVerifier(options.disableVerification);
        this._operandStackVerifier = new OperandStackVerifier(funcSignature);
        this._entryLabel = this._controlFlowVerifier.push(this._operandStackVerifier.stack, BlockType.Void);
        this._options = options;

    }

    /**
     * Gets a collection of @type {ValueType}s that represent the return values.
     */
    get returnValues() {
        return this;
    }

    /**
     * Gets a collection of @type {FunctionParameterBuilder} that represent the function parameters.
     * @returns {FunctionParameterBuilder}
     */
    get parameters() {
        return [];
    }

    /**
     * Gets the entry label that is present for every function.
     * @type {LabelBuilder}
     */
    get entryLabel() {
        return this._entryLabel;
    }

    get disableVerification(){
        return this._options.disableVerification;
    }

    /**
     * Gets the function parameter or local at the specified index.
     * @param {Number} index The index of the local or parameter.
     * @returns { FunctionParameterBuilder | LocalBuilder } The function parameter or local at the specified index.
     */
    getParameter(index) {
        throw new Error('Not supported.');
    }

    /**
     * Declares a new local variable.
     * @param {ValueType} type The type of the value that will be stored in the variable.
     * @param {String} name The name of the local variable.
     * @param {Number} count The number of variables.
     * @returns {LocalBuilder} A new LocalBuilder which can used to access the variable.
     */
    declareLocal(type, name = null, count = 1) {
        const localBuilder = new LocalBuilder(
            type,
            name,
            this._locals.length + this.parameters.length,
            count);
        this._locals.push(localBuilder);
        return localBuilder;
    }

    /**
     * Creates a new unresolved label for branching instructions.
     * AssemblyEmitter.markLbael must be called to associate the label with a code offset.
     */
    defineLabel() {
        // TODO: remove, can only branch to outer blocks, no purpose in defining a label before the block. 
        return this._controlFlowVerifier.defineLabel();
    }

    /**
     * Emits a new instruction.
     * @param {OpCodes} opCode The opcode for the instruction.
     * @param  {...any} args The immediate operands for the instruction.
     */
    emit(opCode, ...args) {
        Arg.notNull('opCode', opCode);
        const depth = this._controlFlowVerifier.size - 1;
        let result = null;
        let immediate = null;
        let pushLabel = null
        let labelCallback = null;

        if (depth < 0) {
            throw new Error(`Cannot add any instructions after the main control enclosure has been closed.`);
        }

        // The user can pass in a label that was created using defineLabel.
        // If a label was passed in extract it from the args
        if (opCode.controlFlow === ControlFlowType.Push && args.length > 1) {
            if (args.length > 2) {
                throw new Error(`Unexpected number of values for ${ImmediateType.BlockSignature}.`);
            }

            if (args[1]) {
                if (args[1] instanceof LabelBuilder) {
                    pushLabel = args[1];
                }
                else if (typeof args[1] === "function") {
                    const userFunction = args[1];
                    labelCallback = x => {
                        userFunction(x);
                    }
                }
                else {
                    throw new Error('Error')
                }
            }

            args = [args[0]];
        }

        if (opCode.immediate) {
            immediate = this._createImmediate(ImmediateType[opCode.immediate], args, depth);

            // If the instruction has a relative depth label as a parameter ensure that 
            // the label can be referenced from the current enclosing block.
            if (immediate.type === ImmediateType.RelativeDepth) {
                this._controlFlowVerifier.reference(args[0]);
            }
        }

        if (!this.disableVerification) {
            this._operandStackVerifier.verifyInstruction(
                this._controlFlowVerifier.peek().block,
                opCode,
                immediate);
        }

        // Update the control flow state, if the instruction marks
        // the start of a new block then return the label for that block.
        if (opCode.controlFlow) {
            result = this._updateControlFlow(opCode, immediate, pushLabel);
        }

        this._instructions.push(new Instruction(opCode, immediate));
        if (labelCallback) {
            labelCallback(result);
            this.end();
        }

        return result;
    }

    /**
     * Updates the control flow
     * @param {OpCodes} opCode The 
     * @param {Immediate} immediate The immediate operand for the instruction, used to get the block type 
     * for a control flow push instruction. 
     * @param {LabelBuilder} label Label to associate with a control flow push instruction. 
     */
    _updateControlFlow(opCode, immediate, label) {
        let result = null;
        if (opCode.controlFlow === ControlFlowType.Push) {
            const blockType = immediate.values[0];
            result = this._controlFlowVerifier.push(
                this._operandStackVerifier.stack,
                blockType,
                label);
        }
        else if (opCode.controlFlow === ControlFlowType.Pop) {
            this._controlFlowVerifier.pop();
        }

        return result;
    }

    /**
     * Writes the object to a binary writer.
     * @param {BinaryWriter} writer The binary writer the object should be written to.
     */
    write(writer) {
        this._controlFlowVerifier.verify();

        const bodyWriter = new BinaryWriter();
        this._writeLocals(bodyWriter);

        for (let index = 0; index < this._instructions.length; index++) {
            this._instructions[index].write(bodyWriter);
        }

        writer.writeVarUInt32(bodyWriter.length);
        writer.writeBytes(bodyWriter);
    }

    /**
     * Creates a byte representation of the object.
     * @returns {Uint8Array} The byte representation of the object.
     */
    toBytes() {
        const buffer = new BinaryWriter();
        this.writeBytes(buffer);
        return buffer.toArray();
    }

    /**
     * Writes local entries to the binary writer.
     * @param {BinaryWriter} writer The write to which the locals should be written. 
     */
    _writeLocals(writer) {
        writer.writeVarUInt32(this._locals.length);
        for (let index = 0; index < this._locals.length; index++) {
            this._locals[index].write(writer);
        }
    }

    /**
     * Creates an immediate operand for an instruction.
     * @param {ImmediateType} immediateType The immediate type.
     * @param {object[]} values The values used to construct the operand.
     * @param {Number} depth  The depth of the control flow stack. 
     * @returns {Immediate} The immediate operand for the instruction.
     */
    _createImmediate(immediateType, values, depth) {
        switch (immediateType) {
            case ImmediateType.BlockSignature:
                validateParameters(immediateType, values, 1);

                const block = values[0];
                return Immediate.createBlockSignature(block);

            case ImmediateType.BranchTable:
                validateParameters(immediateType, values, 2);
                return Immediate.createBranchTable(values[0], values[1], depth);

            case ImmediateType.Float32:
                validateParameters(immediateType, values, 1);
                return Immediate.createFloat32(values[0]);

            case ImmediateType.Float64:
                validateParameters(immediateType, values, 1);
                return Immediate.createFloat64(values[0]);

            case ImmediateType.Function:
                validateParameters(immediateType, values, 1);
                const functionBuilder = values[0];
                Arg.instanceOf('functionBuilder', functionBuilder, FunctionBuilder, ImportBuilder);

                return Immediate.createFunction(values[0]);

            case ImmediateType.Global:
                validateParameters(immediateType, values, 1);
                return Immediate.createGlobal(values[0]);

            case ImmediateType.IndirectFunction:
                validateParameters(immediateType, values, 1);
                return Immediate.createIndirectFunction(values[0]);

            case ImmediateType.Local:
                validateParameters(immediateType, values, 1);
                let local = values[0];
                if (typeof local === "number") {
                    local = this.getParameter(local);
                }

                Arg.instanceOf('local', local, LocalBuilder, FunctionParameterBuilder);
                return Immediate.createLocal(local);

            case ImmediateType.MemoryImmediate:
                validateParameters(immediateType, values, 2);
                return Immediate.createMemoryImmediate(values[0], values[0]);

            case ImmediateType.RelativeDepth:
                validateParameters(immediateType, values, 1);
                return Immediate.createRelativeDepth(values[0], depth);

            case ImmediateType.VarInt32:
                validateParameters(immediateType, values, 1);
                return Immediate.createVarInt32(values[0]);

            case ImmediateType.VarInt64:
                validateParameters(immediateType, values, 1);
                return Immediate.createVarInt64(values[0]);

            case ImmediateType.VarUInt1:
                validateParameters(immediateType, values, 1);
                return Immediate.createVarUInt1(values[0]);

            default:
                throw new Error('Unknown operand type.');
        }
    }
}