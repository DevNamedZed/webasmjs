import BinaryWriter from "./BinaryWriter";
import TypeForm from "./TypeForm";
import FuncTypeSignature from "./FuncTypeSignature";

export default class FuncTypeBuilder {

    key;
    index;
    returnTypes;
    parameterTypes;

    /**
     * 
     * @param {String} key 
     * @param {ValueType[]} returnTypes 
     * @param {ValueType[]} parameterTypes 
     * @param {Number} index 
     */
    constructor(key, returnTypes, parameterTypes, index){
        this.key = key;
        this.returnTypes = returnTypes;
        this.parameterTypes = parameterTypes;
        this.index = index;
    }

    /**
     * 
     */
    get typeForm(){
        return TypeForm.Func;
    }

    /**
     * Creates a key that can be used to uniquely identify a signature.
     * @param {ValueType[]} returnTypes An array of value types that represent the signature return types.
     * @param {ValueType[]} parameterTypes 
     * @returns {String} The signature key.
     */
    static createKey(returnTypes, parameterTypes){
        let key = "(";
        returnTypes.forEach((x, i) =>{
            key += x.short;
            if (i !== returnTypes.length - 1){
                key +=  ", ";
            }
        });
            
        key += ")("
        parameterTypes.forEach((x, i) =>{
            key += x.short;
            if (i !== parameterTypes.length - 1){
                key +=  ", ";
            }
        });

        key += ")"
        return key;
    }

    
    
    /**
     * Writes the object to a binary writer.
     * @param {BinaryWriter} writer The binary writer the object should be written to.
     */
    write(writer){
        writer.writeVarInt7(TypeForm.Func.value);
        writer.writeVarUInt32(this.parameterTypes.length);
        this.parameterTypes.forEach(x => {
            writer.writeVarInt7(x.value);
        });

        writer.writeVarUInt1(this.returnTypes.length);
        this.returnTypes.forEach(x =>{            
            writer.writeVarInt7(x.value);
        });
    }
    
    toSignature(){
        return new FuncTypeSignature(this.returnTypes, this.parameterTypes);
    }

    /**
     * Creates a byte representation of the object.
     * @returns {Uint8Array} The byte representation of the object.
     */
    toBytes(){
        const buffer = new BinaryWriter();
        this.writeBytes(buffer);
        return buffer.toArray();
    }
}