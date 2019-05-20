import ValueType from "../ValueType";

const createEmpty = () => {
    const operandStack = new OperandStack(null, null);
    operandStack._length = 0;
    return operandStack;
}

export default class OperandStack {
    
    static Empty = createEmpty(); 

    _previous;
    _length;
    _valueType;

    constructor(valueType, previous = null){
        this._valueType = valueType;
        this._previous = previous;
        this._length = this._previous ? 
            this._previous._length + 1 : 
            1;
    }

    get length(){
        return this._length;
    }

    get valueType(){
        if (this.isEmpty){
            throw new Error('The stack is empty.');
        }

        return this._valueType;
    }

    get isEmpty(){
        return this._length === 0;
    }

    push(valueType){
        return new OperandStack(valueType, this);
    }

    pop(){
        if (this.isEmpty){
            throw new Error('The stack is empty.');
        }
        
        return this._previous;
    }

    peek(){
        return this._previous;
    }
}