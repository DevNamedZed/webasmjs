import BinaryWriter from "./BinaryWriter";
import TypeForm from "./TypeForm";

export default class FuncTypeSignature {
    
    static empty = new FuncTypeSignature([], []);
    
    returnTypes;
    parameterTypes;



    /**
     * 
     * @param {ValueType[]} returnTypes 
     * @param {ValueType[]} parameterTypes 
     */
    constructor(returnTypes, parameterTypes){
        this.returnTypes = returnTypes;
        this.parameterTypes = parameterTypes;
    }
}