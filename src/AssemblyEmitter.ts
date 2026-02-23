import Arg from './Arg';
import BinaryWriter from './BinaryWriter';
import { BlockTypeDescriptor, ImmediateType, OpCodeDef, WasmFeature } from './types';
import FunctionParameterBuilder from './FunctionParameterBuilder';
import type FunctionBuilder from './FunctionBuilder';
import Immediate from './Immediate';
import ImportBuilder from './ImportBuilder';
import Instruction from './Instruction';
import LabelBuilder from './LabelBuilder';
import LocalBuilder from './LocalBuilder';
import OpCodeEmitter from './OpCodeEmitter';
import OpCodes from './OpCodes';
import ControlFlowVerifier from './verification/ControlFlowVerifier';
import { ControlFlowType } from './verification/types';
import OperandStackVerifier from './verification/OperandStackVerifier';
import FuncTypeSignature from './FuncTypeSignature';
import { BlockType } from './types';

const validateParameters = (immediateType: string, values: any[] | undefined, length: number): void => {
  if (!values || values.length !== length) {
    throw new Error(`Unexpected number of values for ${immediateType}.`);
  }
};

export interface AssemblyEmitterOptions {
  disableVerification: boolean;
  features?: Set<WasmFeature>;
}

export default class AssemblyEmitter extends OpCodeEmitter {
  _instructions: Instruction[];
  _locals: LocalBuilder[];
  _entryLabel: LabelBuilder;
  _controlFlowVerifier: ControlFlowVerifier;
  _operandStackVerifier: OperandStackVerifier;
  _options: AssemblyEmitterOptions;

  constructor(
    funcSignature: FuncTypeSignature,
    options: AssemblyEmitterOptions = { disableVerification: false }
  ) {
    super();

    Arg.instanceOf('funcSignature', funcSignature, FuncTypeSignature);
    this._instructions = [];
    this._locals = [];
    this._controlFlowVerifier = new ControlFlowVerifier(options.disableVerification);
    this._operandStackVerifier = new OperandStackVerifier(funcSignature);
    this._entryLabel = this._controlFlowVerifier.push(
      this._operandStackVerifier.stack,
      BlockType.Void
    );
    this._options = options;
  }

  get returnValues(): any {
    return this;
  }

  get parameters(): FunctionParameterBuilder[] {
    return [];
  }

  get entryLabel(): LabelBuilder {
    return this._entryLabel;
  }

  get disableVerification(): boolean {
    return this._options.disableVerification;
  }

  getParameter(_index: number): FunctionParameterBuilder | LocalBuilder {
    throw new Error('Not supported.');
  }

  declareLocal(
    type: any,
    name: string | null = null,
    count: number = 1
  ): LocalBuilder {
    const localBuilder = new LocalBuilder(
      type,
      name,
      this._locals.length + this.parameters.length,
      count
    );
    this._locals.push(localBuilder);
    return localBuilder;
  }

  defineLabel(): LabelBuilder {
    return this._controlFlowVerifier.defineLabel();
  }

  emit(opCode: OpCodeDef, ...args: any[]): any {
    Arg.notNull('opCode', opCode);
    const depth = this._controlFlowVerifier.size - 1;
    let result: any = null;
    let immediate: Immediate | null = null;
    let pushLabel: LabelBuilder | null = null;
    let labelCallback: ((label: any) => void) | null = null;

    if (depth < 0) {
      throw new Error(
        'Cannot add any instructions after the main control enclosure has been closed.'
      );
    }

    if (opCode.controlFlow === ControlFlowType.Push && args.length > 1) {
      if (args.length > 2) {
        throw new Error(`Unexpected number of values for ${ImmediateType.BlockSignature}.`);
      }

      if (args[1]) {
        if (args[1] instanceof LabelBuilder) {
          pushLabel = args[1];
        } else if (typeof args[1] === 'function') {
          const userFunction = args[1];
          labelCallback = (x: any) => {
            userFunction(x);
          };
        } else {
          throw new Error('Error');
        }
      }

      args = [args[0]];
    }

    if (opCode.feature && this._options.features && !this._options.features.has(opCode.feature as WasmFeature)) {
      throw new Error(
        `Opcode ${opCode.mnemonic} requires the '${opCode.feature}' feature. ` +
        `Enable it via the 'features' or 'target' option in ModuleBuilder.`
      );
    }

    if (opCode.immediate) {
      immediate = this._createImmediate(
        opCode.immediate as ImmediateType,
        args,
        depth
      );

      if (immediate.type === ImmediateType.RelativeDepth) {
        this._controlFlowVerifier.reference(args[0]);
      }
    }

    if (!this.disableVerification) {
      this._operandStackVerifier.verifyInstruction(
        this._controlFlowVerifier.peek()!.block!,
        opCode,
        immediate
      );

      if (opCode === (OpCodes as any).else) {
        this._operandStackVerifier.verifyElse(
          this._controlFlowVerifier.peek()!.block!
        );
      }
    }

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

  _updateControlFlow(
    opCode: OpCodeDef,
    immediate: Immediate | null,
    label: LabelBuilder | null
  ): any {
    let result: any = null;
    if (opCode.controlFlow === ControlFlowType.Push) {
      const blockType = immediate!.values[0] as BlockTypeDescriptor;
      const isLoop = opCode === (OpCodes as any).loop;
      result = this._controlFlowVerifier.push(
        this._operandStackVerifier.stack,
        blockType,
        label,
        isLoop
      );
    } else if (opCode.controlFlow === ControlFlowType.Pop) {
      this._controlFlowVerifier.pop();
    }

    return result;
  }

  write(writer: BinaryWriter): void {
    this._controlFlowVerifier.verify();

    const bodyWriter = new BinaryWriter();
    this._writeLocals(bodyWriter);

    for (let index = 0; index < this._instructions.length; index++) {
      this._instructions[index].write(bodyWriter);
    }

    writer.writeVarUInt32(bodyWriter.length);
    writer.writeBytes(bodyWriter);
  }

  toBytes(): Uint8Array {
    const buffer = new BinaryWriter();
    this.write(buffer);
    return buffer.toArray();
  }

  _writeLocals(writer: BinaryWriter): void {
    writer.writeVarUInt32(this._locals.length);
    for (let index = 0; index < this._locals.length; index++) {
      this._locals[index].write(writer);
    }
  }

  _createImmediate(immediateType: ImmediateType, values: any[], depth: number): Immediate {
    switch (immediateType) {
      case ImmediateType.BlockSignature:
        validateParameters(immediateType, values, 1);
        return Immediate.createBlockSignature(values[0]);

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
        if (!(values[0] instanceof ImportBuilder) && !(values[0] && '_index' in values[0] && 'funcTypeBuilder' in values[0])) {
          throw new Error('functionBuilder must be a FunctionBuilder or ImportBuilder.');
        }
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
        if (typeof local === 'number') {
          local = this.getParameter(local);
        }
        Arg.instanceOf('local', local, LocalBuilder, FunctionParameterBuilder);
        return Immediate.createLocal(local);

      case ImmediateType.MemoryImmediate:
        validateParameters(immediateType, values, 2);
        return Immediate.createMemoryImmediate(values[0], values[1]);

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

      case ImmediateType.VarUInt32:
        validateParameters(immediateType, values, 1);
        return Immediate.createVarUInt32(values[0]);

      case ImmediateType.V128Const:
        validateParameters(immediateType, values, 1);
        return Immediate.createV128Const(values[0]);

      case ImmediateType.LaneIndex:
        validateParameters(immediateType, values, 1);
        return Immediate.createLaneIndex(values[0]);

      case ImmediateType.ShuffleMask:
        validateParameters(immediateType, values, 1);
        return Immediate.createShuffleMask(values[0]);

      default:
        throw new Error('Unknown operand type.');
    }
  }
}
