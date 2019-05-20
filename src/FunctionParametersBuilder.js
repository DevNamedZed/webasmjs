

export default class FunctionParameterBuilder{
    constructor(valueType, index){
        this.name = null;
        this.valueType = valueType;
        this.index = index;
    }

    withName(name){
        this.name = name;
        return this;
    }
} 