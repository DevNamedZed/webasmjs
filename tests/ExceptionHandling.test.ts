import ModuleBuilder from '../src/ModuleBuilder';
import BinaryReader from '../src/BinaryReader';
import { ValueType, ExternalKind } from '../src/types';

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
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);
    const fn = mod.defineFunction('test', null, [], (f, asm) => {
      asm.const_i32(42);
      asm.throw(tag._index);
    });
    mod.exportFunction(fn);
    expect(() => mod.toBytes()).not.toThrow();
  });

  test('throw WAT output', () => {
    const mod = new ModuleBuilder('test');
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

describe('Tag import/export', () => {
  test('exportTag creates a tag export', () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);
    mod.exportTag(tag, 'myTag');
    const wat = mod.toString();
    expect(wat).toContain('(export "myTag" (tag 0))');
  });

  test('exportTag binary roundtrip', () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);
    mod.exportTag(tag, 'myTag');
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    const tagExport = info.exports.find(e => e.name === 'myTag');
    expect(tagExport).toBeDefined();
    expect(tagExport!.kind).toBe(ExternalKind.Tag.value);
    expect(tagExport!.index).toBe(0);
  });

  test('importTag creates a tag import', () => {
    const mod = new ModuleBuilder('test');
    const imp = mod.importTag('env', 'error', [ValueType.Int32]);
    expect(imp.externalKind).toBe(ExternalKind.Tag);
    expect(imp.index).toBe(0);
    const wat = mod.toString();
    expect(wat).toContain('(import "env" "error"');
    expect(wat).toContain('(tag');
  });

  test('importTag binary roundtrip', () => {
    const mod = new ModuleBuilder('test');
    mod.importTag('env', 'error', [ValueType.Int32]);
    mod.defineFunction('noop', null, [], (f, a) => {}).withExport();
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    const tagImport = info.imports.find(i => i.kind === ExternalKind.Tag.value);
    expect(tagImport).toBeDefined();
    expect(tagImport!.moduleName).toBe('env');
    expect(tagImport!.fieldName).toBe('error');
  });

  test('importTag adjusts local tag indices', () => {
    const mod = new ModuleBuilder('test');
    mod.importTag('env', 'error', [ValueType.Int32]);
    const localTag = mod.defineTag([ValueType.Float64]);
    // Local tag index should be 1 (after the imported tag at index 0)
    expect(localTag._index).toBe(1);
  });

  test('duplicate tag export throws', () => {
    const mod = new ModuleBuilder('test');
    const tag = mod.defineTag([ValueType.Int32]);
    mod.exportTag(tag, 'myTag');
    expect(() => mod.exportTag(tag, 'myTag')).toThrow('already exists');
  });

  test('duplicate tag import throws', () => {
    const mod = new ModuleBuilder('test');
    mod.importTag('env', 'error', [ValueType.Int32]);
    expect(() => mod.importTag('env', 'error', [ValueType.Float64])).toThrow('already exists');
  });
});
