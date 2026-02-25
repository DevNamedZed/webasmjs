import {
  ModuleBuilder,
  PackageBuilder,
  ValueType,
  BlockType,
  ElementType,
  TextModuleWriter,
  BinaryReader,
  parseWat,
  RefType,
  HeapType,
  StructTypeBuilder,
  ArrayTypeBuilder,
  RecGroupBuilder,
  refType,
  refNullType,
  OpCodes,
  mut,
} from '../src/index';

import { EXAMPLES } from '../playground/examples';

const webasmjs = {
  ModuleBuilder,
  PackageBuilder,
  ValueType,
  BlockType,
  ElementType,
  TextModuleWriter,
  BinaryReader,
  parseWat,
  RefType,
  HeapType,
  StructTypeBuilder,
  ArrayTypeBuilder,
  RecGroupBuilder,
  refType,
  refNullType,
  OpCodes,
  mut,
};

const ALL_SYMBOLS = Object.keys(webasmjs);

function runExample(code: string): Promise<void> {
  const log = (..._args: any[]) => {};
  const destructure = `const { ${ALL_SYMBOLS.join(', ')} } = webasmjs;`;
  const asyncFn = new Function(
    'log',
    'webasmjs',
    `return (async () => {\n${destructure}\n${code}\n})();`
  );
  return asyncFn(log, webasmjs);
}

describe('Playground Examples', () => {
  const keys = Object.keys(EXAMPLES);

  test('has at least 100 examples', () => {
    expect(keys.length).toBeGreaterThanOrEqual(100);
  });

  for (const key of keys) {
    const example = EXAMPLES[key];
    test(`${example.group} / ${example.label} [${key}]`, async () => {
      await runExample(example.code);
    }, 15000);
  }
});
