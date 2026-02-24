import { PackageBuilder, ValueType } from '../src/index';

test('PackageBuilder - single module', async () => {
  const pkg = new PackageBuilder();
  const mod = pkg.defineModule('main');
  mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.get_local(f.getParameter(1));
    a.add_i32();
  }).withExport();

  const result = await pkg.instantiate();
  const add = result.main.exports.add as CallableFunction;
  expect(add(3, 4)).toBe(7);
});

test('PackageBuilder - two modules with dependency', async () => {
  const pkg = new PackageBuilder();

  const mathMod = pkg.defineModule('math');
  mathMod.defineFunction('double', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.const_i32(2);
    a.mul_i32();
  }).withExport();

  const mainMod = pkg.defineModule('main');
  const doubleFn = mainMod.importFunction('math', 'double', [ValueType.Int32], [ValueType.Int32]);
  mainMod.defineFunction('quadruple', [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.call(doubleFn);
    a.call(doubleFn);
  }).withExport();

  pkg.addDependency('main', 'math');
  const result = await pkg.instantiate();
  const quadruple = result.main.exports.quadruple as CallableFunction;
  expect(quadruple(5)).toBe(20);
});

test('PackageBuilder - circular dependency throws', async () => {
  const pkg = new PackageBuilder();
  pkg.defineModule('a');
  pkg.defineModule('b');

  pkg.addDependency('a', 'b');
  pkg.addDependency('b', 'a');

  await expect(pkg.instantiate()).rejects.toThrow(/[Cc]ircular/);
});

test('PackageBuilder - duplicate module throws', () => {
  const pkg = new PackageBuilder();
  pkg.defineModule('test');
  expect(() => pkg.defineModule('test')).toThrow();
});

test('PackageBuilder - compile', async () => {
  const pkg = new PackageBuilder();
  const mod = pkg.defineModule('test');
  mod.defineFunction('nop', null, [], (f, a) => {
    a.nop();
  }).withExport();

  const compiled = await pkg.compile();
  expect(compiled.test).toBeInstanceOf(WebAssembly.Module);
});

describe('PackageBuilder advanced', () => {
  test('getModule returns module', () => {
    const pkg = new PackageBuilder();
    const mod = pkg.defineModule('myMod');
    const result = pkg.getModule('myMod');
    expect(result).toBe(mod);
  });

  test('getModule returns undefined for nonexistent name', () => {
    const pkg = new PackageBuilder();
    pkg.defineModule('exists');
    const result = pkg.getModule('doesNotExist');
    expect(result).toBeUndefined();
  });

  test('addDependency with nonexistent module throws', () => {
    const pkg = new PackageBuilder();
    pkg.defineModule('b');
    expect(() => pkg.addDependency('nonexistent', 'b')).toThrow(
      'Module "nonexistent" not found.'
    );
  });

  test('addDependency with nonexistent dependency throws', () => {
    const pkg = new PackageBuilder();
    pkg.defineModule('a');
    expect(() => pkg.addDependency('a', 'nonexistent')).toThrow(
      'Dependency module "nonexistent" not found.'
    );
  });

  test('Duplicate addDependency is idempotent', () => {
    const pkg = new PackageBuilder();
    pkg.defineModule('a');
    pkg.defineModule('b');
    pkg.addDependency('a', 'b');
    pkg.addDependency('a', 'b'); // second call should not duplicate

    // Verify by checking internal state: only one dependency entry
    const entry = pkg._modules.find((m) => m.name === 'a');
    expect(entry).toBeDefined();
    expect(entry!.dependencies).toEqual(['b']);
    expect(entry!.dependencies.length).toBe(1);
  });

  test('3+ module dependency chain - A depends on B depends on C', async () => {
    const pkg = new PackageBuilder();

    // Module C: provides a base value
    const modC = pkg.defineModule('c');
    modC.defineFunction('base', [ValueType.Int32], [], (f, a) => {
      a.const_i32(10);
    }).withExport();

    // Module B: imports from C, doubles the value
    const modB = pkg.defineModule('b');
    const baseFn = modB.importFunction('c', 'base', [ValueType.Int32], []);
    modB.defineFunction('doubled', [ValueType.Int32], [], (f, a) => {
      a.call(baseFn);
      a.const_i32(2);
      a.mul_i32();
    }).withExport();

    // Module A: imports from B, adds 1
    const modA = pkg.defineModule('a');
    const doubledFn = modA.importFunction('b', 'doubled', [ValueType.Int32], []);
    modA.defineFunction('result', [ValueType.Int32], [], (f, a) => {
      a.call(doubledFn);
      a.const_i32(1);
      a.add_i32();
    }).withExport();

    pkg.addDependency('a', 'b');
    pkg.addDependency('b', 'c');

    const result = await pkg.instantiate();
    const aResult = result.a.exports.result as CallableFunction;
    // base=10, doubled=20, result=21
    expect(aResult()).toBe(21);
  });
});
