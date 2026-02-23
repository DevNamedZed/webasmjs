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
