import Arg from './Arg'
import ImmediateType from './ImmediateType'
import ImmediateEncoder from './ImmediateEncoder'
import LocalBuilder from './LocalBuilder';
import BinaryWriter from './BinaryWriter';
import ImportBuilder from './ImportBuilder';
import FunctionBuilder from './FunctionBuilder';
import ExternalKind from './ExternalKind';

const validateParameters = (immediateType, values, length) => {
    if (!values || values.length !== length) {
        throw new Error(`Unexpected number of values for ${immediateType}.`);
    }
};

/**
 * Represents an immediate argument to an instruction.
 */
export default class Immediate {
    constructor(type, values) {
        Arg.notNull('type', type);
        Arg.notNull('values', values);

        this.type = type;
        this.values = values;
    }

    // static create(immediateType, depth, values) {
    //     switch (immediateType) {
    //         case ImmediateType.BlockSignature:
    //             validateParameters(immediateType, values, 1);
    //             return Immediate.createBlockSignature(values[0]);

    //         case ImmediateType.BranchTable:
    //             validateParameters(immediateType, values, 2);
    //             return Immediate.createBranchTable(values[0], values[1], depth);

    //         case ImmediateType.Float32:
    //             validateParameters(immediateType, values, 1);
    //             return Immediate.createFloat32(values[0]);

    //         case ImmediateType.Float64:
    //             validateParameters(immediateType, values, 1);
    //             return Immediate.createFloat64(values[0]);

    //         case ImmediateType.Function:
    //             validateParameters(immediateType, values, 1);
    //             return Immediate.createFunction(values[0]);

    //         case ImmediateType.Global:
    //             validateParameters(immediateType, values, 1);
    //             return Immediate.createGlobal(values[0]);

    //         case ImmediateType.IndirectFunction:
    //             validateParameters(immediateType, values, 1);
    //             return Immediate.createIndirectFunction(values[0]);

    //         case ImmediateType.Local:
    //             validateParameters(immediateType, values, 1);
    //             return Immediate.createLocal(values[0]);

    //         case ImmediateType.MemoryImmediate:
    //             validateParameters(immediateType, values, 2);
    //             return Immediate.createMemoryImmediate(values[0], values[0]);

    //         case ImmediateType.RelativeDepth:
    //             validateParameters(immediateType, values, 1);
    //             return Immediate.createRelativeDepth(values[0], depth);

    //         case ImmediateType.VarInt32:
    //             validateParameters(immediateType, values, 1);
    //             return Immediate.createVarInt32(values[0]);

    //         case ImmediateType.VarInt64:
    //             validateParameters(immediateType, values, 1);
    //             return Immediate.createVarInt64(values[0]);

    //         case ImmediateType.VarUInt1:
    //             validateParameters(immediateType, values, 1);
    //             return Immediate.createVarUInt1(values[0]);

    //         default:
    //             throw new Error('Unknown operand type.');
    //     }
    // }

    static createBlockSignature(blockType) {
        return new Immediate(ImmediateType.BlockSignature, [blockType])
    }

    static createBranchTable(defaultLabel, labels, depth) {
        const relativeDepths = labels.map(x => {
            return depth - x.block.depth;
        });

        const defaultLabelDepth = depth - defaultLabel.block.depth;
        return new Immediate(ImmediateType.BranchTable, [defaultLabelDepth, relativeDepths]);
    }

    static createFloat32(value) {
        return new Immediate(ImmediateType.Float32, [value])
    }

    static createFloat64(value) {
        return new Immediate(ImmediateType.Float64, [value])
    }

    static createFunction(functionBuilder) {
        // let functionIndex = null;
        // if (functionBuilder instanceof FunctionBuilder) {
        //     functionIndex = functionBuilder.index;
        // }
        // else if (functionBuilder instanceof ImportBuilder){
        //     if (functionBuilder.externalKind !== ExternalKind.Function){
        //         throw new Error();
        //     }

        //     functionIndex = functionBuilder.data.index;
        // }
        // else if (!isNaN(functionBuilder)){
        //     functionIndex = functionBuilder;
        // }
        // else{
        //     throw new Error('Unsupport.')
        // }

        return new Immediate(ImmediateType.Function, [functionBuilder])
    }

    static createGlobal(globalBuilder) {
        return new Immediate(ImmediateType.Global, [globalBuilder])
    }

    static createIndirectFunction(functionTypeBuilder) {
        return new Immediate(ImmediateType.IndirectFunction, [functionTypeBuilder])
    }

    static createLocal(local) {
        //  Arg.instanceOf('localBuilder', localBuilder, LocalBuilder, Number, FunctionParameterBuilder)
        return new Immediate(ImmediateType.Local, [local])
    }

    static createMemoryImmediate(alignment, offset) {
        return new Immediate(ImmediateType.MemoryImmediate, [alignment, offset])
    }

    static createRelativeDepth(label, depth) {
        return new Immediate(ImmediateType.RelativeDepth, [label, depth])
    }

    static createVarUInt1(value) {
        return new Immediate(ImmediateType.VarUInt1, [value])
    }

    static createVarInt32(value) {
        return new Immediate(ImmediateType.VarInt32, [value])
    }

    static createVarInt64(value) {
        return new Immediate(ImmediateType.VarInt64, [value])
    }

    writeBytes(writer) {
        switch (this.type) {
            case ImmediateType.BlockSignature:
                ImmediateEncoder.encodeBlockSignature(writer, this.values[0]);
                break;

            case ImmediateType.BranchTable:
                ImmediateEncoder.encodeBranchTable(writer, this.values[0], this.values[1])
                break;

            case ImmediateType.Float32:
                ImmediateEncoder.encodeFloat32(writer, this.values[0]);
                break;

            case ImmediateType.Float64:
                ImmediateEncoder.encodeFloat64(writer, this.values[0]);
                break;

            case ImmediateType.Function:
                ImmediateEncoder.encodeFunction(writer, this.values[0]);
                break;

            case ImmediateType.Global:
                ImmediateEncoder.encodeGlobal(writer, this.values[0]);
                break;

            case ImmediateType.IndirectFunction:
                ImmediateEncoder.encodeIndirectFunction(writer, this.values[0]);
                break;

            case ImmediateType.Local:
                ImmediateEncoder.encodeLocal(writer, this.values[0]);
                break;

            case ImmediateType.MemoryImmediate:
                ImmediateEncoder.encodeMemoryImmediate(writer, this.values[0], this.values[1]);
                break;

            case ImmediateType.RelativeDepth:
                ImmediateEncoder.encodeRelativeDepth(writer, this.values[0], this.values[1]);
                break;

            case ImmediateType.VarInt32:
                ImmediateEncoder.encodeVarInt32(writer, this.values[0]);
                break;

            case ImmediateType.VarUInt64:
                ImmediateEncoder.encodeVarInt64(writer, this.values[0]);
                break;

            case ImmediateType.VarUInt1:
                ImmediateEncoder.encodeVarUInt1(writer, this.values[0]);
                break;

            default:
                throw new Error('Cannot encode unknown operand type.');
        }
    }

    toBytes() {
        const buffer = new BinaryWriter();
        this.writeBytes(buffer);
        return buffer.toArray();
    }
}