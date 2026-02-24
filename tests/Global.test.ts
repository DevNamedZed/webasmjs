import { ModuleBuilder, ValueType, VerificationError } from '../src/index';
import BinaryWriter from '../src/BinaryWriter';

test('Global - Read', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  const globalX = moduleBuilder.defineGlobal(ValueType.Int32, false, 10);
  const func1 = moduleBuilder
    .defineFunction('testFunc', [ValueType.Int32], [ValueType.Int32])
    .withExport();
  func1.createEmitter((asm) => {
    asm.get_global(globalX);
    asm.get_local(0);
    asm.mul_i32();
  });

  const module = await moduleBuilder.instantiate();
  const fn = module.instance.exports.testFunc as CallableFunction;
  expect(fn(0)).toBe(0);
  expect(fn(2)).toBe(20);
  expect(fn(3)).toBe(30);
});

test('Global - Write', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  const globalX = moduleBuilder.defineGlobal(ValueType.Int32, true, 0);
  moduleBuilder
    .defineFunction('set', [], [ValueType.Int32], (f, a) => {
      a.get_local(0);
      a.set_global(globalX);
    })
    .withExport();
  moduleBuilder
    .defineFunction('get', [ValueType.Int32], [], (f, a) => {
      a.get_global(globalX);
    })
    .withExport();

  const module = await moduleBuilder.instantiate();
  const set = module.instance.exports.set as CallableFunction;
  const get = module.instance.exports.get as CallableFunction;
  expect(get()).toBe(0);
  set(42);
  expect(get()).toBe(42);
  set(100);
  expect(get()).toBe(100);
});

test('Global Import - Read', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  const globalX = moduleBuilder.importGlobal('sourceModule', 'someValue', ValueType.Int32, false);
  moduleBuilder
    .defineFunction('func1', [ValueType.Int32], [], (f, a) => {
      a.get_global(globalX);
    })
    .withExport();

  const module = await moduleBuilder.instantiate({ sourceModule: { someValue: 123 } });
  expect((module.instance.exports.func1 as CallableFunction)()).toBe(123);
});

test('Global Export - Read', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder.defineGlobal(ValueType.Int32, false, 124).withExport('global1');

  const module = await moduleBuilder.instantiate();
  expect((module.instance.exports.global1 as WebAssembly.Global).value).toBe(124);
});

test('Global Export - Mutable not allowed (mvp)', () => {
  const moduleBuilder = new ModuleBuilder('testModule', { target: 'mvp' });
  const mutableGlobal = moduleBuilder.defineGlobal(ValueType.Int32, true, 0);
  expect(() => moduleBuilder.exportGlobal(mutableGlobal, 'g')).toThrow(VerificationError);
});

test('Global Export - Mutable allowed with disableVerification', () => {
  const moduleBuilder = new ModuleBuilder('testModule', {
    generateNameSection: true,
    disableVerification: true,
  });
  const mutableGlobal = moduleBuilder.defineGlobal(ValueType.Int32, true, 0);
  expect(() => moduleBuilder.exportGlobal(mutableGlobal, 'g')).not.toThrow();
});

test('Global - Float32', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder
    .defineFunction('get', [ValueType.Float32], [], (f, a) => {
      a.const_f32(3.14);
    })
    .withExport();

  const module = await moduleBuilder.instantiate();
  expect((module.instance.exports.get as CallableFunction)()).toBeCloseTo(3.14);
});

test('Global Import - Duplicate throws', () => {
  const moduleBuilder = new ModuleBuilder('test');
  moduleBuilder.importGlobal('mod', 'g1', ValueType.Int32, false);
  expect(() => moduleBuilder.importGlobal('mod', 'g1', ValueType.Int32, false)).toThrow();
});

describe('GlobalBuilder init expressions', () => {
  test('value() with unsupported type throws', () => {
    const mod = new ModuleBuilder('test', { disableVerification: true });
    const g = mod.defineGlobal(ValueType.V128, false);
    expect(() => g.value(0)).toThrow('Unsupported global value type');
  });

  test('value() with invalid argument type throws', () => {
    const mod = new ModuleBuilder('test');
    const g = mod.defineGlobal(ValueType.Int32, false);
    expect(() => (g as any).value(true)).toThrow('Unsupported global value');
  });

  test('write() without init expression throws', () => {
    const mod = new ModuleBuilder('test');
    const g = mod.defineGlobal(ValueType.Int32, false);
    const writer = new BinaryWriter();
    expect(() => g.write(writer)).toThrow('initialization expression was not defined');
  });

  test('toBytes() standalone', () => {
    const mod = new ModuleBuilder('test');
    const g = mod.defineGlobal(ValueType.Int32, false, 42);
    const bytes = g.toBytes();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe('GlobalBuilder types', () => {
  test('value() with callback', async () => {
    const mod = new ModuleBuilder('test');
    const g = mod.defineGlobal(ValueType.Int32, false);
    g.value((asm: any) => {
      asm.const_i32(42);
    });
    g.withExport('myGlobal');

    const instance = await mod.instantiate();
    const exports = instance.instance.exports as any;
    expect((exports.myGlobal as WebAssembly.Global).value).toBe(42);
  });

  test('createInitEmitter called twice throws', () => {
    const mod = new ModuleBuilder('test');
    const g = mod.defineGlobal(ValueType.Int32, false);
    g.createInitEmitter((asm) => {
      asm.const_i32(0);
    });
    expect(() => {
      g.createInitEmitter((asm) => {
        asm.const_i32(0);
      });
    }).toThrow('Initialization expression emitter has already been created.');
  });

  test('i64 global with bigint', async () => {
    const mod = new ModuleBuilder('test');
    const g = mod.defineGlobal(ValueType.Int64, false);
    g.value(100n);
    g.withExport('g64');

    const instance = await mod.instantiate();
    const exports = instance.instance.exports as any;
    expect((exports.g64 as WebAssembly.Global).value).toBe(100n);
  });
});
