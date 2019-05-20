import { TextEncoder } from 'text-encoding'
import bigInt from 'big-integer'
import Arg from './Arg';

const GrowthRate = 1024;

const BigIntSupported = typeof BigInt === "function";


export default class BinaryWriter {
    buffer;
    size;

    constructor(size = 1024) {
        this.size = 0;
        this.buffer = new Uint8Array(size);
    }

    get capacity() {
        return this.buffer.length;
    }

    get length() {
        return this.size;
    }

    get remaining() {
        return this.buffer.length - this.size;
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

        throw new Error('Error creating bigInt');
    }

    writeUInt8(value) {
        this.writeByte(0xFF & value);
    }

    writeUInt16(value) {
        this.writeByte(value & 0xFF);
        this.writeByte((value >> 8) & 0xFF);
    }

    writeUInt32(value) {
        this.writeByte(value & 0xFF);
        this.writeByte((value >> 8) & 0xFF);
        this.writeByte((value >> 16) & 0xFF);
        this.writeByte((value >> 24) & 0xFF);
    }

    writeVarUInt1(value) {
        this.writeByte(value > 0 ? 1 : 0);
    }

    writeVarUInt7(value) {
        this.writeByte(0x7F & value);
    }

    writeVarUInt32(value) {
        do {
            let chunk = value & 0x7f;
            value >>= 7;
            if (value != 0) {
                chunk |= 0x80;
            }

            this.writeByte(chunk)

        } while (value != 0);
    }

    writeVarInt7(value) {
        this.writeByte(value & 0x7F)
    }

    writeVarInt32(value) {
        let more = true;
        while (more) {
            let chunk = value & 0x7F;
            value >>= 7;

            if ((value === 0 && (chunk & 0x40) === 0) || 
                (value === -1 && (chunk & 0x40) !== 0)) {
                more = false;
            }
            else {
                chunk |= 0x80;
            }

            this.writeByte(chunk);
        }
    }

    writeVarInt64(value) {
        if (Number.isInteger(value)) {
            this.writeVarInt32(value);
            return;
        }

        let bigIntValue = toBigInt(value);
        let more = true;

        while (more) {
            let chunk = bigIntValue.and(0x7F).toJSNumber();
            bigIntValue = bigIntValue.shiftRight(7)

            if (((chunk & 0x40) === 0) && (bigIntValue.eq(0) || bigIntValue.eq(-1))) {
                more = false;
            }
            else {
                chunk |= 0x80;
            }

            this.writeByte(chunk);
        }
    }

    writeString(value) {
        const encoder = new TextEncoder("utf-8");
        const utfBytes = encoder.encode(value);
        this.writeBytes(utfBytes);
    }

    writeFloat32(value) {
        const array = new Float32Array(1)
        array[0] = value;
        this.writeBytes(new Uint8Array(array.buffer));
    }

    writeFloat64(writer, value) {
        const array = new Float64Array(1)
        array[0] = value;
        this.writeBytes(new Uint8Array(array.buffer));
    }

    writeByte(data) {
        this.requireCapacity(1);
        this.buffer[this.size++] = data;
    }

    writeBytes(array) {
        let innerArray = null;
        if (array instanceof BinaryWriter) {
            innerArray = array.toArray();
        }
        else if (array instanceof Uint8Array) {
            innerArray = array;
        }
        else {
            throw new Error("Invalid argument, must be an Uint8Array or BinaryWriter")
        }

        this.requireCapacity(innerArray.length);
        this.buffer.set(innerArray, this.size);
        this.size += innerArray.length;
    }

    requireCapacity(size) {
        const remaining = this.remaining;
        if (remaining >= size) {
            return;
        }

        const newSize = size - remaining > GrowthRate ?
            this.size + size :
            this.size + GrowthRate;

        const newBuffer = new Uint8Array(newSize);
        newBuffer.set(this.buffer, 0)
        this.buffer = newBuffer;
    }

    toArray() {
        const array = new Uint8Array(this.size);
        array.set(this.buffer.subarray(0, this.size), 0);
        return array;
    }
}