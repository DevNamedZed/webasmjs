const Papa = require('papaparse');
const fs = require("fs");

function getOperandInfo(operand) {
    switch (operand) {
        case "VarUInt1":
            return {
                param: "varUInt1",
                call: "varUInt1"
            };

        case "MemoryImmediate":
            return {
                param: "alignment, offset",
                call: "alignment, offset"
            };

        case "IndirectFunction":
            return {
                param: "funcTypeBuilder",
                call: "funcTypeBuilder"
            };

        case "BlockSignature":
            return {
                param: "blockType, label = null",
                call: "blockType, label"
            };

        case "Function":
            return {
                param: "functionBuilder",
                call: "functionBuilder"
            };

        case "RelativeDepth":
            return {
                param: "labelBuilder",
                call: "labelBuilder"
            };

        case "BranchTable":
            return {
                param: "defaultLabelBuilder, ...labelBuilders",
                call: "defaultLabelBuilder, labelBuilders"
            };

        case "Global":
            return {
                param: "global",
                call: "global"
            };

        case "Local":
            return {
                param: "local",
                call: "local"
            };

        case "Float32":
            return {
                param: "float32",
                call: "float32"
            };

        case "Float64":
            return {
                param: "float64",
                call: "float64"
            };

        case "VarInt32":
            return {
                param: "varInt32",
                call: "varInt32"
            };

        case "VarInt64":
            return {
                param: "varInt64",
                call: "varInt64"
            };
    }

    return null;
}

function getStackBehavior(pop, push){
    if (push && pop){
        return "PopPush";
    }
    else if (push){
        return "Push";
    }
    else if (pop){
        return "Pop";
    }
    
    return "None";
}

function parseOperands(value){
    if (!value || value === ""){
        return null;
    }

    return JSON.parse(value).filter(x => {
        return x !== "Arguments" && x !== "Returns"; 
    })
}

function parseOpcodes(data) {
    const result = [];
    for (let index = 1; index < data.length; index++) {
        if (!data[index][0] || data[index][0] === "") {
            continue;
        }

        const pop = parseOperands(data[index][6]);
        const push = parseOperands(data[index][7]);
        const call = data[index][1].startsWith('call') 
        const stackBehavior = getStackBehavior(
            call || (pop && pop.length !== 0), 
            call || (push && push.length !== 0))

        result.push({
            value: parseInt(data[index][0]),
            name: data[index][1],
            mnemonic: data[index][2],
            friendlyName: data[index][3],
            immediate: data[index][4],
            controlFlow: data[index][5],
            stackBehavior: stackBehavior,
            popOperands: pop,
            pushOperands: push
        });
    }

    return result;
}

function createOpCodeMethods(opCodes) {
    let out = "import OpCodes from './OpCodes';\n\n";
    out += "export default class OpCodeEmitter {\n\n";
    for (let index = 0; index < opCodes.length; index++) {
        const item = opCodes[index];
        const immediateInfo = getOperandInfo(item.immediate);

        out += item.friendlyName + "(";
        if (immediateInfo) {
            out += immediateInfo.param;
        }

        out += ") {";

        out += "return this.emit(OpCodes." + item.name;
        if (immediateInfo) {
            out += ","
            out += immediateInfo.call;
        }

        out += ");};\n\n";
    }

    out += "emit(opCode, ...args) { throw new Error('Not Implemented') }\n\n";
    out += "\n\n}";
    return out;
}

const csv = fs.readFileSync('./opcodes.csv', 'utf8');
const csvData = Papa.parse(csv).data;
const opcodeList = parseOpcodes(csvData);
const opcodeMethods = createOpCodeMethods(opcodeList);
const opcodeObject = opcodeList.reduce((i, x) => {
    i[x.name] = {
        value: x.value,
        mnemonic: x.mnemonic,
        immediate: x.immediate,
        controlFlow: x.controlFlow,        
        stackBehavior: x.stackBehavior,
        popOperands: x.popOperands,
        pushOperands: x.pushOperands
    };
    return i;
},
{});


if (!fs.existsSync('./out/')) {
    fs.mkdirSync('./out/');
}

fs.writeFileSync('./../src/OpCodes.js', "export default " + JSON.stringify(opcodeObject, (key, value) => { if (value !== null && value !== "") return value }, 2));
fs.writeFileSync('./../src/OpCodeEmitter.js', opcodeMethods);
