import { BlockTypeDescriptor } from '../types';
import OperandStack from './OperandStack';

export default class ControlFlowBlock {
  stack: OperandStack;
  blockType: BlockTypeDescriptor | number;
  parent: ControlFlowBlock | null;
  index: number;
  depth: number;
  childrenCount: number;
  isLoop: boolean;
  isTry: boolean;
  inCatchHandler: boolean;

  constructor(
    stack: OperandStack,
    blockType: BlockTypeDescriptor | number,
    parent: ControlFlowBlock | null,
    index: number,
    depth: number,
    childrenCount: number,
    isLoop: boolean = false,
    isTry: boolean = false
  ) {
    this.stack = stack;
    this.blockType = blockType;
    this.parent = parent;
    this.index = index;
    this.depth = depth;
    this.childrenCount = childrenCount;
    this.isLoop = isLoop;
    this.isTry = isTry;
    this.inCatchHandler = false;
  }

  canReference(block: ControlFlowBlock): boolean {
    if (this.depth > block.depth) {
      return false;
    }

    let potentialMatch: ControlFlowBlock = block;
    for (let index = 0; index < block.depth - this.depth; index++) {
      potentialMatch = potentialMatch.parent!;
    }

    return potentialMatch === this;
  }

  findParent(other: ControlFlowBlock): ControlFlowBlock | null {
    let potentialParent: ControlFlowBlock;
    let potentialMatch: ControlFlowBlock;

    if (other.depth > this.depth) {
      potentialParent = this;
      potentialMatch = other;
    } else {
      potentialParent = other;
      potentialMatch = this;
    }

    for (let index = 0; index < Math.abs(potentialParent.depth - potentialMatch.depth); index++) {
      potentialMatch = potentialMatch.parent!;
    }

    return potentialParent === potentialMatch ? potentialParent : null;
  }
}
