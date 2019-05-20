import { AssemblyEmitter } from "./Emitters";
import LocalBuilder from "./LocalBuilder"
import FunctionBuilder from "./FunctionBuilder";
import FunctionParameterBuilder from "./FunctionParametersBuilder";

/**
 * Used to emit the body of a function.
 */
export default class FunctionEmitter extends AssemblyEmitter {
    /**
     * @type {FunctionBuilder}
     */
    _functionBuilder;

    /**
     * Creates and initializes a new FunctionEmitter.
     * @param {FunctionBuilder} functionBuilder The FunctionBuilder the function body is being generated for.
     */
    constructor(functionBuilder, options) {
        super(functionBuilder.funcTypeBuilder.toSignature(), options);

        this._functionBuilder = functionBuilder;
        this._locals = [];
    }

    /**
     * Gets a collection of @type {ValueType}s that represent the return values.
     * @returns {ValueType[]}
     */
    get returnValues() {
        return this._functionBuilder.funcTypeBuilder.returnTypes;
    }

    /**
     * Gets a collection of @type {FunctionParameterBuilder} that represent the function parameters.
     * @returns {FunctionParameterBuilder[]}
     */
    get parameters() {
        return this._functionBuilder.funcTypeBuilder.parameterTypes;
    }

    /**
     * Gets the function parameter or local at the specified index.
     * @param {Number} index The index of the local or parameter.
     * @returns { FunctionParameterBuilder | LocalBuilder } 
     */
    getParameter(index) {
        if (index >= 0) {
            if (index < this.parameters.length) {
                return this._functionBuilder.getParameter(index);
            }

            if (index < this._locals.length) {
                return this._locals.getLocal(index);
            }
        }

        throw new Error('Invalid parameter index.')
    }
}