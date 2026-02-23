import type ControlFlowBlock from './verification/ControlFlowBlock';

export default class LabelBuilder {
  resolved: boolean;
  block: ControlFlowBlock | null;

  constructor() {
    this.resolved = false;
    this.block = null;
  }

  get isResolved(): boolean {
    return this.resolved;
  }

  resolve(block: ControlFlowBlock): void {
    this.block = block;
    this.resolved = true;
  }

  reference(block: ControlFlowBlock): void {
    if (this.isResolved) {
      throw new Error('Cannot add a reference to a label that has been resolved.');
    }
    this.block = block;
  }
}
