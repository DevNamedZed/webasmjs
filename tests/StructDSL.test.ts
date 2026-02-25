import ModuleBuilder from '../src/ModuleBuilder';
import { ValueType, i32, i64, f32, f64, mut, v128 } from '../src/types';
import BinaryReader from '../src/BinaryReader';

describe('Type shorthand aliases', () => {
  test('aliases match ValueType constants', () => {
    expect(i32).toBe(ValueType.Int32);
    expect(i64).toBe(ValueType.Int64);
    expect(f32).toBe(ValueType.Float32);
    expect(f64).toBe(ValueType.Float64);
    expect(v128).toBe(ValueType.V128);
  });
});

describe('mut() helper', () => {
  test('creates a MutableFieldDescriptor', () => {
    const m = mut(f64);
    expect(m.type).toBe(f64);
    expect(m.mutable).toBe(true);
    expect(m._brand).toBe('MutableField');
  });

  test('wraps different value types', () => {
    expect(mut(i32).type).toBe(i32);
    expect(mut(i64).type).toBe(i64);
    expect(mut(f32).type).toBe(f32);
  });
});

describe('defineStructType object syntax', () => {
  test('basic object syntax creates struct with correct fields', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    const Point = mod.defineStructType({ x: f64, y: f64 });
    expect(Point.fields).toHaveLength(2);
    expect(Point.fields[0].name).toBe('x');
    expect(Point.fields[0].type).toBe(f64);
    expect(Point.fields[0].mutable).toBe(false);
    expect(Point.fields[1].name).toBe('y');
    expect(Point.fields[1].type).toBe(f64);
    expect(Point.fields[1].mutable).toBe(false);
  });

  test('mut() creates mutable fields', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    const Point = mod.defineStructType({ x: mut(f64), y: mut(f64) });
    expect(Point.fields[0].mutable).toBe(true);
    expect(Point.fields[1].mutable).toBe(true);
  });

  test('mixed mutability', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    const s = mod.defineStructType({ id: i32, value: mut(f64) });
    expect(s.fields[0].mutable).toBe(false);
    expect(s.fields[1].mutable).toBe(true);
  });

  test('explicit { type, mutable } object form', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    const s = mod.defineStructType({
      a: { type: i32, mutable: true },
      b: { type: f64, mutable: false },
    });
    expect(s.fields[0].mutable).toBe(true);
    expect(s.fields[1].mutable).toBe(false);
  });

  test('field property has correct indices', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    const Point = mod.defineStructType({ x: f64, y: f64, z: f64 });
    expect(Point.field.x).toBe(0);
    expect(Point.field.y).toBe(1);
    expect(Point.field.z).toBe(2);
  });

  test('field indices match getFieldIndex', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    const s = mod.defineStructType({ name: i32, value: mut(f64), flag: i32 });
    expect(s.field.name).toBe(s.getFieldIndex('name'));
    expect(s.field.value).toBe(s.getFieldIndex('value'));
    expect(s.field.flag).toBe(s.getFieldIndex('flag'));
  });

  test('works with subtyping options', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    const Base = mod.defineStructType({ area: f32 });
    const Sub = mod.defineStructType(
      { area: f32, radius: f32 },
      { superTypes: [Base], final: false }
    );
    expect(Sub.superTypes).toHaveLength(1);
    expect(Sub.superTypes[0].index).toBe(Base.index);
    expect(Sub.final).toBe(false);
    expect(Sub.field.area).toBe(0);
    expect(Sub.field.radius).toBe(1);
  });

  test('array syntax still works (backward compat)', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    const s = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: true },
    ]);
    expect(s.fields[0].name).toBe('x');
    // No .field property when using array syntax
    expect((s as any).field).toBeUndefined();
  });

  test('binary roundtrip', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    mod.defineStructType({ x: mut(i32), y: mut(f64) });
    mod.defineFunction('noop', null, [], () => {}).withExport();
    const bytes = mod.toBytes();
    const reader = new BinaryReader(bytes);
    const info = reader.read();
    expect(info.types.length).toBeGreaterThanOrEqual(1);
  });

  test('integration: struct_get/struct_set with field indices', () => {
    const mod = new ModuleBuilder('test', { target: 'latest' });
    const Counter = mod.defineStructType({ count: mut(i32) });
    mod.defineFunction('test', [ValueType.Int32], [], (f, a) => {
      a.const_i32(0);
      a.struct_new(Counter.index);
      const ref = a.declareLocal(ValueType.AnyRef, 'ref');
      a.set_local(ref);
      a.get_local(ref);
      a.const_i32(42);
      a.struct_set(Counter.index, Counter.field.count);
      a.get_local(ref);
      a.struct_get(Counter.index, Counter.field.count);
    }).withExport();

    const wat = mod.toString();
    expect(wat).toContain('struct.set');
    expect(wat).toContain('struct.get');
    expect(() => mod.toBytes()).not.toThrow();
  });
});
