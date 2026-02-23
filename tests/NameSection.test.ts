import { ModuleBuilder, ValueType, BinaryReader } from '../src/index';

test('Name Section - module name', () => {
  const mod = new ModuleBuilder('testmod');
  mod.defineFunction('noop', null, [], (f, a) => {});
  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  expect(info.nameSection).toBeDefined();
  expect(info.nameSection!.moduleName).toBe('testmod');
});

test('Name Section - function names', () => {
  const mod = new ModuleBuilder('fnmod');
  mod.defineFunction('add', null, [], (f, a) => {});
  mod.defineFunction('sub', null, [], (f, a) => {});
  mod.defineFunction('mul', null, [], (f, a) => {});
  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  expect(info.nameSection).toBeDefined();
  expect(info.nameSection!.functionNames).toBeDefined();
  const names = info.nameSection!.functionNames!;
  expect(names.size).toBe(3);
  expect(names.get(0)).toBe('add');
  expect(names.get(1)).toBe('sub');
  expect(names.get(2)).toBe('mul');
});

test('Name Section - imported function names', () => {
  const mod = new ModuleBuilder('impmod');
  mod.importFunction('env', 'log', null, [ValueType.Int32]);
  mod.defineFunction('myFunc', null, [], (f, a) => {});
  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  expect(info.nameSection).toBeDefined();
  expect(info.nameSection!.functionNames).toBeDefined();
  const names = info.nameSection!.functionNames!;
  // Imported function at index 0 uses "module.field" naming convention
  expect(names.get(0)).toBe('env.log');
  // Local function at index 1
  expect(names.get(1)).toBe('myFunc');
});

test('Name Section - parameter names', () => {
  const mod = new ModuleBuilder('parammod');
  mod.defineFunction('myFunc', ValueType.Int32, [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.const_i32(0);
  });
  mod._functions[0].parameters[0].withName('x');
  mod._functions[0].parameters[1].withName('y');
  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  expect(info.nameSection).toBeDefined();
  expect(info.nameSection!.localNames).toBeDefined();
  const localNames = info.nameSection!.localNames!;
  // The function index in the module (no imports, so first function is index 0)
  const funcIndex = mod._functions[0]._index;
  expect(localNames.has(funcIndex)).toBe(true);
  const paramMap = localNames.get(funcIndex)!;
  expect(paramMap.get(0)).toBe('x');
  expect(paramMap.get(1)).toBe('y');
});

test('Name Section - local names', () => {
  const mod = new ModuleBuilder('localmod');
  const fn = mod.defineFunction('myFunc', null, []);
  const asm = fn.createEmitter();
  asm.declareLocal(ValueType.Int32, 'counter');
  asm.end();
  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  expect(info.nameSection).toBeDefined();
  expect(info.nameSection!.localNames).toBeDefined();
  const localNames = info.nameSection!.localNames!;
  const funcIndex = fn._index;
  expect(localNames.has(funcIndex)).toBe(true);
  const locals = localNames.get(funcIndex)!;
  // Local at index 0 (no parameters, so first local is index 0)
  expect(locals.get(0)).toBe('counter');
});

test('Name Section - global names', () => {
  const mod = new ModuleBuilder('globalmod');
  const g1 = mod.defineGlobal(ValueType.Int32, false, 42);
  g1.withName('myGlobal');
  const g2 = mod.defineGlobal(ValueType.Int32, false, 100);
  g2.withName('otherGlobal');
  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  expect(info.nameSection).toBeDefined();
  expect(info.nameSection!.globalNames).toBeDefined();
  const globalNames = info.nameSection!.globalNames!;
  expect(globalNames.get(g1._index)).toBe('myGlobal');
  expect(globalNames.get(g2._index)).toBe('otherGlobal');
});

test('Name Section - disabled', () => {
  const mod = new ModuleBuilder('nonames', { generateNameSection: false });
  mod.defineFunction('noop', null, [], (f, a) => {});
  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  expect(info.nameSection).toBeUndefined();
});

test('Name Section - mixed named/unnamed params', () => {
  const mod = new ModuleBuilder('mixedmod');
  mod.defineFunction(
    'myFunc',
    ValueType.Int32,
    [ValueType.Int32, ValueType.Int32, ValueType.Int32],
    (f, a) => {
      a.const_i32(0);
    }
  );
  // Only name the first and third parameters; leave the second unnamed
  mod._functions[0].parameters[0].withName('first');
  // parameters[1] left unnamed
  mod._functions[0].parameters[2].withName('third');
  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  expect(info.nameSection).toBeDefined();
  expect(info.nameSection!.localNames).toBeDefined();
  const localNames = info.nameSection!.localNames!;
  const funcIndex = mod._functions[0]._index;
  expect(localNames.has(funcIndex)).toBe(true);
  const paramMap = localNames.get(funcIndex)!;
  // Only named params appear
  expect(paramMap.get(0)).toBe('first');
  expect(paramMap.has(1)).toBe(false);
  expect(paramMap.get(2)).toBe('third');
  expect(paramMap.size).toBe(2);
});
