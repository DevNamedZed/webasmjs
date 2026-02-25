import { BlockType, BlockTypeDescriptor } from '../types';
import ControlFlowBlock from './ControlFlowBlock';
import LabelBuilder from '../LabelBuilder';
import OperandStack from './OperandStack';
import VerificationError from './VerificationError';

export default class ControlFlowVerifier {
  _stack: LabelBuilder[] = [];
  _unresolvedLabels: LabelBuilder[] = [];
  _disableVerification: boolean;

  constructor(disableVerification: boolean) {
    this._disableVerification = disableVerification;
  }

  get size(): number {
    return this._stack.length;
  }

  push(
    operandStack: OperandStack,
    blockType: BlockTypeDescriptor | number,
    label: LabelBuilder | null = null,
    isLoop: boolean = false,
    isTry: boolean = false
  ): LabelBuilder {
    const current = this.peek();
    if (label) {
      if (!this._disableVerification && label.isResolved) {
        throw new VerificationError(
          'Cannot use a label that has already been associated with another block.'
        );
      }

      const labelIndex = this._unresolvedLabels.findIndex((x) => x === label);
      if (labelIndex === -1) {
        throw new VerificationError('The label was not created for this function.');
      }

      if (
        !this._disableVerification &&
        label.block &&
        current &&
        !current.block!.canReference(label.block)
      ) {
        throw new VerificationError(
          'Label has been referenced by an instruction in an enclosing block that ' +
            'cannot branch to the current enclosing block.'
        );
      }

      this._unresolvedLabels.splice(labelIndex, 1);
    } else {
      label = new LabelBuilder();
    }

    const block = !current
      ? new ControlFlowBlock(operandStack, BlockType.Void, null, 0, 0, 0)
      : new ControlFlowBlock(
          operandStack,
          blockType,
          current.block!,
          current.block!.childrenCount++,
          current.block!.depth + 1,
          0,
          isLoop,
          isTry
        );

    label.resolve(block);
    this._stack.push(label);
    return label;
  }

  pop(): void {
    if (this._stack.length === 0) {
      throw new VerificationError('Cannot end the block, the stack is empty.');
    }
    this._stack.pop();
  }

  peek(): LabelBuilder | null {
    return this._stack.length === 0 ? null : this._stack[this._stack.length - 1];
  }

  defineLabel(): LabelBuilder {
    const label = new LabelBuilder();
    this._unresolvedLabels.push(label);
    return label;
  }

  reference(label: LabelBuilder): void {
    if (this._disableVerification) {
      return;
    }

    const current = this.peek();
    if (label.isResolved) {
      if (!current || !label.block!.canReference(current.block!)) {
        throw new VerificationError(
          'The label cannot be referenced by the current enclosing block.'
        );
      }
    } else {
      if (!this._unresolvedLabels.find((x) => x === label)) {
        throw new VerificationError('The label was not created for this function.');
      }

      if (!label.block) {
        throw new VerificationError('Label has not been associated with any block.');
      }

      const potentialParent = label.block.findParent(current!.block!);
      if (!potentialParent) {
        throw new VerificationError('The reference to this label is invalid.');
      }

      label.reference(potentialParent);
    }
  }

  verify(): void {
    if (this._disableVerification) {
      return;
    }

    if (this._unresolvedLabels.some((x) => x.block)) {
      throw new VerificationError('The function contains unresolved labels.');
    }

    if (this._stack.length === 1) {
      throw new VerificationError('Function is missing closing end instruction.');
    } else if (this._stack.length !== 0) {
      throw new VerificationError(
        `Function has ${this._stack.length} control structures ` +
          'that are not closed. Every block, if, and loop must have a corresponding end instruction.'
      );
    }
  }
}
