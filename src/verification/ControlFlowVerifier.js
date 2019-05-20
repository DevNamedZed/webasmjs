import BlockType from '../BlockType';
import ControlFlowBlock from './ControlFlowBlock'
import LabelBuilder from '../LabelBuilder'
import OperandStack from './OperandStack'
import VerificationError from './VerificationError';

/**
 * Used to create labels and validate branching.
 */
export default class ControlFlowVerifier {

    _stack = [];
    _unresolvedLabels = [];
    _disableVerification;

    /**
     * Creates and initializes a new ControlFlowVerifier.
     * @param {Boolean} disableVerification Flag indicating whether control flow validation is disabled.
     */
    constructor(disableVerification){
        this._disableVerification = disableVerification;
    }

    /**
     * Gets the number of items in the control flow stack.
     */
    get size(){
        return this._stack.length;
    }

    /**
     * Creates a new enclosing block and pushes a label containing information about the block on to the stack.
     * @param {OperandStack} The operand stack at the start of the label.
     * @param {BlockType} The
     * @param {LabelBuilder} label Optional unresolved label to associate with the new enclosing block. 
     */
    push(operandStack, blockType, label = null){
        const current = this.peek();
        if (label){
            if (!this._disableVerification && label.isResolved){
                throw new VerificationErrorError('Cannot use a label that has already been associated with another block.');
            }

            const labelIndex = this._unresolvedLabels.findIndex(x => x === label);
            if (labelIndex === -1){
                throw new VerificationError('The label was not created for this function.')
            }

            if (!this._disableVerification && label.block && !current.block.canReference(label.block)){
                throw new VerificationError('Label has been referenced by an instruction in an enclosing block that ' + 
                'cannot branch to the current enclosing block.')                
            }

            this._unresolvedLabels.splice(labelIndex, 1);
        } 
        else {
            label = new LabelBuilder();
        }

        const block = !current ?
            new ControlFlowBlock(operandStack, BlockType.Void, null, 0, 0, 0) :
            new ControlFlowBlock(operandStack, blockType, current.block, current.block.childrenCount++, current.block.depth + 1, 0);

        label.resolve(block);        
        this._stack.push(label);
        return label;
    }

    /**
     * Pops the current label off the stack.
     */
    pop(){
        if (this._stack.length === 0){
            throw new VerificationError('Cannot end the block, the stack is empty.');
        }

        this._stack.pop();
    }

    /**
     * Peeks at the current ControlFlowBlock on the top of the stack.
     */
    peek(){
        return this._stack.length === 0 ? null : this._stack[this._stack.length - 1];
    }
    
    /**
     * Creates a new unresolved label.
     * @returns {LabelBuilder} The unresolved label.
     */
    defineLabel(){
        const label = new LabelBuilder();
        this._unresolvedLabels.push(label);
        return label;
    }

    /**
     * Adds a reference to the specified label from the current enclosing block.
     * @param {LabelBuilder} label A label referenced by a branching instruction in the current enclosing block.
     */
    reference(label){        
        if (this._disableVerification){
            return;
        }

        const current = this.peek();
        if (label.isResolved){
            if (!current || !label.block.canReference(current.block)){
                throw new VerificationError('The label cannot be referenced by the current enclosing block.');
            }
        }
        else{
            if (!this._unresolvedLabels.find(x => x == label)){
                throw new VerificationError('The label was not created for this function.');
            }

            const potentialParent = label.block.findParent(current.block);
            if (!potentialParent){
                throw new VerificationError('The reference to this label .');
            }

            label.reference(potentialParent);
        } 
    }

    /**
     * Verifies there are no referenced unresolved labels. If any are found an exception is thrown.
     */
    verify(){
        if (this._disableVerification){
            return;
        }

        if (this._unresolvedLabels.some(x => x.block)){
            throw new VerificationError('The function contains unresolved labels.');
        }

        if (this._stack.length === 1){
            throw new VerificationError('Function is missing closing end instruction.')
        }
        else if (this._stack.length !== 0){
            throw new VerificationError(`Function has ${this._stack.length} control structures ` +
            'that are not closed. Every block, if, and loop must have a corresponding end instruction.');
        }
    }
}