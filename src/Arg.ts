const formatOrList = (values: string[]): string => {
  if (values.length === 1) {
    return values[0];
  }

  let text = '';
  for (let index = 0; index < values.length; index++) {
    text += values[index];
    if (index === values.length - 2) {
      text += ' or ';
    } else if (index !== values.length - 1) {
      text += ', ';
    }
  }

  return text;
};

export default class Arg {
  static notNull(name: string, value: unknown): void {
    if (value === null || value === undefined) {
      throw new Error(`The parameter ${name} must be specified.`);
    }
  }

  static notEmpty(name: string, value: unknown): void {
    Arg.notNull(name, value);
    if (value === '' || (Array.isArray(value) && value.length === 0)) {
      throw new Error(`The parameter ${name} cannot be empty.`);
    }
  }

  static notEmptyString(name: string, value: unknown): void {
    Arg.string(name, value);
    if (value === '') {
      throw new Error(`The parameter ${name} cannot be empty.`);
    }
  }

  static string(name: string, value: unknown): void {
    Arg.notNull(name, value);
    if (typeof value !== 'string') {
      throw new Error(`The parameter ${name} must be a string.`);
    }
  }

  static number(name: string, value: unknown): void {
    Arg.notNull(name, value);
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`The parameter ${name} must be a number.`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static instanceOf(name: string, value: unknown, ...types: (new (...args: any[]) => any)[]): void {
    if (!types.some((x) => value instanceof x)) {
      throw new Error(
        `The parameter ${name} must be a ${formatOrList(types.map((x) => x.name))}.`
      );
    }
  }
}
