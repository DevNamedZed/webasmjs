
/**
 * Represents a control flow enclosure.
 */
export default class ControlFlowBlock{
    // parent;
    // index;
    // depth;
    // childrenCount;

    /**
     * BlockType
     * @param {ControlFlowBlock} parent 
     * @param {*} index 
     * @param {*} depth 
     * @param {*} childrenCount 
     */
    constructor(stack, blockType, parent, index, depth, childrenCount){
        this.stack = stack;
        this.blockType = blockType;
        this.parent = parent;
        this.index = index;
        this.depth = depth;
        this.childrenCount = childrenCount;
    }

    /**
     * Checks to see if enclosing block can be referenced by a branching instruction 
     * in the specified enclosing block.
     * @param {ControlFlowBlock} block The block containing the branching instruction.
     * @returns True if the specified enclosing block is equal to this block or a parent of this block.
     */
    canReference(block){
        if (this.depth > block.depth){
            return false;
        }

        let potentialMatch = block;
        for (let index = 0; index < block.depth - this.depth; index++){
            potentialMatch = potentialMatch.parent;
        }

        return potentialMatch === this;
    }

    /**
     * Checks to see if this block or the other specified block is a parent this block or if this block
     * is a parent of the other block. 
     * @param {ControlFlowBlock} other The other block to check.
     * @returns {ControlFlowBlock} The parent block or null if the blocks are not compatible.
     */
    findParent(other){
        let potentialParent = null;
        let potentialMatch = null;
        
        if (other.depth > this.depth){
            potentialParent = this;
            potentialMatch = other;
        }
        else{
            potentialParent = other;
            potentialMatch = this;
        }

        for (let index = 0; index < potentialParent.depth - potentialMatch.depth; index++){
            potentialMatch = potentialMatch.parent;
        }

        return potentialParent.equals(potentialChild) ? potentialParent : null;
    }
}
