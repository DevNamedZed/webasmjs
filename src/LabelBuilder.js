

/**
 * Used as a place holder for a branch instruction when the relative code offset is not yet known.
 */
export default class LabelBuilder {
    constructor(){
        this.resolved = false;
        this.block = null;
    }

    get isResolved(){
        return this.resolved;
    }

    resolve(block){
        this.block = block;
        this.resolved = true;
    }

    reference(block){
        if (this.isResolved){
            throw new Error('Cannot add a reference to a label that has been resolved.')
        }

        this.block = block;
    }
}