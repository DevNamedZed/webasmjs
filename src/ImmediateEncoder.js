import Arg from './Arg'
import BinaryWriter from "./BinaryWriter"
import BlockType from "./BlockType"
import FunctionBuilder from './FunctionBuilder'
import LabelBuilder from "./LabelBuilder"
import LocalBuilder from './LocalBuilder'
import FunctionParameterBuilder from './FunctionParametersBuilder';
import FuncTypeBuilder from './FuncTypeBuilder'
import TableBuilder from './TableBuilder';
import GlobalBuilder from './GlobalBuilder';
import ImportBuilder from './ImportBuilder';
import ExternalKind from './ExternalKind';

/**
 * Encodes an immediate operand.
 */
export default class ImmediateEncoder {
    /**
     * Encodes a block signature.
     * @param {BinaryWriter} writer 
     * @param {BlockType} blockType 
     */
    static encodeBlockSignature(writer, blockType) {
        writer.writeVarInt7(blockType.value);
    };

    /**
     * 
     * @param {*} label 
     */
    static encodeRelativeDepth(writer, label, depth) {
        const relativeDepth = depth - label.block.depth;
        writer.writeVarInt7(relativeDepth);
    }

    static encodeBranchTable(writer, defaultLabel, labels) {
        writer.writeVarUInt32(labels.length);
        labels.forEach(x => {
            writer.writeVarUInt32(x);
        });
        writer.writeVarUInt32(defaultLabel);
    }

    static encodeFunction(writer, func) {
        //Arg.notNull('func', func);
        let functionIndex = 0;
        if (func instanceof FunctionBuilder) {
            functionIndex = func._index;
        }
        else if (func instanceof ImportBuilder) {
            functionIndex = func.data.index;
        }
        else if (typeof func === 'number') {
            functionIndex = func;
        }
        else {
            throw new Error('Function argument must either be the index of the function or a FunctionBuilder.')
        }

        return writer.writeVarUInt32(functionIndex);
    }

    /**
     * 
     * @param {BinaryWriter} writer 
     * @param {FuncTypeBuilder} funcType 
     * @param {TableBuilder} table 
     */
    static encodeIndirectFunction(writer, funcType, table) { 
        writer.writeVarUInt32(funcType.index);
        writer.writeVarUInt1(0);
        //call_indirect	0x11	type_index : varuint32, reserved : varuint1	call a function indirect with an expected signature
        //The call_indirect operator takes a list of function arguments and as the last operand the index into the table. 
        //Its reserved immediate is for future :unicorn: use and must be 0 in the MVP.
    }

    static encodeLocal(writer, local) {
        Arg.notNull('local', local);

        let localIndex = 0;
        if (local instanceof LocalBuilder) {
            localIndex = local.index;
        }
        else if (local instanceof FunctionParameterBuilder) {
            localIndex = local.index;
        }
        else if (typeof local === 'number') {
            localIndex = local;
        }
        else {
            throw new Error('Local argument must either be the index of the local variable or a LocalBuilder.')
        }

        return writer.writeVarUInt32(localIndex);
    }

    static encodeGlobal(writer, global) {
        Arg.notNull('global', global);

        let globalIndex = 0;
        if (global instanceof GlobalBuilder) {
            globalIndex = global.index;
        }
        else if (global instanceof ImportBuilder){
            if (global.externalKind !== ExternalKind.Global){
                throw new Error('Import external kind must be global.')
            }
        }
        else if (typeof global === 'number') {
            globalIndex = global;
        }
        else {
            throw new Error('Global argument must either be the index of the global variable, GlobalBuilder, or ' +
            'an ImportBuilder.')
        }

        return writer.writeVarUInt32(globalIndex);
    }

    static encodeFloat32(writer, value) {
        writer.writeFloat32(value);
    }

    static encodeFloat64(writer, value) {
        writer.writeFloat64(value);
    }

    static encodeVarInt32(writer, value) {
        writer.writeVarInt32(value);
    }

    static encodeVarInt64(writer, value) {
        writer.writeVarInt64(value);
    }

    static encodeVarUInt32(writer, value) {
        writer.writeVarUInt32(value);
    }

    static encodeVarUInt1(writer, value) {
        writer.writeVarUInt1(value);
    }

    /**
     * Write the memory operand to the binary write.
     * @param {BinaryWriter} writer 
     * @param {*} alignment 
     * @param {*} offset The offset to an address on the stack that will be consumed by the memory instruction.
     */
    static encodeMemoryImmediate(writer, alignment, offset) {
        writer.writeVarUInt32(alignment);
        writer.writeVarUInt32(offset);
    }
}