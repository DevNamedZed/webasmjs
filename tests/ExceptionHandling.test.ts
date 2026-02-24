import ModuleBuilder from '../src/ModuleBuilder';
import { ValueType } from '../src/types';

describe('Tag section', () => {
  test('defineTag creates a tag', () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);
    expect(tag).toBeDefined();
    expect(tag._index).toBe(0);
    expect(tag.funcType).toBeDefined();
  });

  test('tag binary encoding', () => {
    const mod = new ModuleBuilder('test');
    mod.defineTag([ValueType.Int32]);
    const bytes = mod.toBytes();
    expect(bytes).toBeTruthy();
    expect(bytes.length).toBeGreaterThan(8);
  });

  test('tag WAT output', () => {
    const mod = new ModuleBuilder('test');
    mod.defineTag([ValueType.Int32]);
    const wat = mod.toString();
    expect(wat).toContain('(tag');
    expect(wat).toContain('(param i32)');
  });

  test('multiple tags', () => {
    const mod = new ModuleBuilder('test');
    const tag1 = mod.defineTag([ValueType.Int32]);
    const tag2 = mod.defineTag([ValueType.Int32, ValueType.Float64]);
    expect(tag1._index).toBe(0);
    expect(tag2._index).toBe(1);
    const bytes = mod.toBytes();
    expect(bytes).toBeTruthy();
  });

  test('tag with no parameters', () => {
    const mod = new ModuleBuilder('test');
    mod.defineTag([]);
    const wat = mod.toString();
    expect(wat).toContain('(tag');
  });
});

describe('Exception handling emitter', () => {
  test('throw emits correctly', () => {
    const mod = new ModuleBuilder('test', { disableVerification: true });
    const tag = mod.defineTag([ValueType.Int32]);
    const fn = mod.defineFunction('test', null, [], (f, asm) => {
      asm.const_i32(42);
      asm.throw(tag._index);
    });
    mod.exportFunction(fn);
    expect(() => mod.toBytes()).not.toThrow();
  });

  test('throw WAT output', () => {
    const mod = new ModuleBuilder('test', { disableVerification: true });
    const tag = mod.defineTag([ValueType.Int32]);
    const fn = mod.defineFunction('test', null, [], (f, asm) => {
      asm.const_i32(42);
      asm.throw(tag._index);
    });
    mod.exportFunction(fn);
    const wat = mod.toString();
    expect(wat).toContain('throw');
  });
});
