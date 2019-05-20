import bigInt from 'big-integer'

const BigIntSupported = typeof BigInt === "function";

export default class BigIntCompatibility {
    static get bigIntSupported() {
        return BigIntSupported;
    }

    static toBigInt(value) {
        if (value instanceof bigInt) {
            return value;
        }
        else if (value instanceof Uint8Array) {
            return bigInt.fromArray(value, 255);
        }
        else if (BigIntSupported && value instanceof BigInt) {
            return new bigInt(value);
        }

        return null;
    }
}