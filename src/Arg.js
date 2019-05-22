
const formatOrList = (values) => {
    if (values.length === 1) {
        return values[0]
    }

    let text = "";
    for (let index = 0; index < values.length; index++) {
        text += values[index];
        if (index === values.length - 2) {
            text += " or "
        }
        else if (index !== values.length - 1){
            text += ", "
        }
    }

    return text;
}

export default class Arg {
    static notNull(name, value) {
        if (!value && value !== 0) {
            throw new Error(`The parameter ${name} must be specified.`);
        }
    }

    static notEmpty(name, value) {
        Arg.notNull(name, value);
        if (value === "" || (Array.isArray(value) && value.length === 0)) {
            throw new Error(`The parameter ${name} cannot be empty.`);
        }
    }

    static notEmptyString(name, value) {
        Arg.string(name, value);
        if (value === "") {
            throw new Error(`The parameter ${name} cannot be empty.`);
        }

    }

    static string(name, value) {
        Arg.notNull(name, value);
        if (!(typeof value === 'string' || value instanceof String)) {
            throw new Error(`The parameter ${name} must be a string.`);
        }
    }

    static number(name, value) {
        Arg.notNull(name, value);
        if (isNaN(value)) {
            throw new Error(`The parameter ${name} must be a number.`);
        }
    }

    static instanceOf(name, value, ...types) {
        if (!(types.some(x => value instanceof x))) {
            throw new Error(`The parameter ${name} must be a ${formatOrList(types.map(x => x.name))}.`);
        }
    }
}