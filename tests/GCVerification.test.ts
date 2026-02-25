import { ModuleBuilder, ValueType, refType, anyref, structref, eqref, i32, f64 } from '../src/index';
import OpCodes from '../src/OpCodes';

test('struct.new -> struct.get verifies without disableVerification', () => {
  const mod = new ModuleBuilder('test', { target: 'latest' });

  const structType = mod.defineStructType([
    { name: 'x', type: ValueType.Int32, mutable: true },
    { name: 'y', type: ValueType.Float64, mutable: false },
  ]);

  // Function returns the i32 'x' field from a newly created struct
  mod.defineFunction('test', [ValueType.Int32], [], (f, asm) => {
    // Push field values: x=42, y=3.14
    asm.const_i32(42);
    asm.const_f64(3.14);
    // struct.new pops [i32, f64] and pushes (ref structType.index)
    asm.struct_new(structType.index);
    // struct.get pops the struct ref and pushes the field type (i32 for field 0)
    asm.struct_get(structType.index, 0);
  });

  // Should not throw - verification passes without disableVerification
  expect(() => mod.toBytes()).not.toThrow();
});

test('Concrete ref assignable to structref/eqref/anyref', () => {
  const mod = new ModuleBuilder('test', { target: 'latest' });

  const structType = mod.defineStructType([
    { name: 'x', type: ValueType.Int32, mutable: true },
  ]);

  // Function creates a struct and stores it in a local of type structref
  mod.defineFunction('testStructref', null, [], (f, asm) => {
    const localStructRef = asm.declareLocal(structref, 'sr');
    asm.const_i32(10);
    asm.struct_new(structType.index);
    // Concrete (ref structType.index) should be assignable to structref
    asm.set_local(localStructRef);
  });

  // Function creates a struct and stores it in a local of type anyref
  mod.defineFunction('testAnyref', null, [], (f, asm) => {
    const localAnyRef = asm.declareLocal(anyref, 'ar');
    asm.const_i32(20);
    asm.struct_new(structType.index);
    // Concrete (ref structType.index) should be assignable to anyref
    asm.set_local(localAnyRef);
  });

  // Function creates a struct and stores it in a local of type eqref
  mod.defineFunction('testEqref', null, [], (f, asm) => {
    const localEqRef = asm.declareLocal(eqref, 'er');
    asm.const_i32(30);
    asm.struct_new(structType.index);
    // Concrete (ref structType.index) should be assignable to eqref
    asm.set_local(localEqRef);
  });

  // Should not throw - all subtype assignments are valid
  expect(() => mod.toBytes()).not.toThrow();
});

test('Struct subtype child assignable to parent ref', () => {
  const mod = new ModuleBuilder('test', { target: 'latest' });

  const parent = mod.defineStructType([
    { name: 'x', type: ValueType.Int32, mutable: true },
  ], { final: false });

  const child = mod.defineStructType([
    { name: 'x', type: ValueType.Int32, mutable: true },
    { name: 'y', type: ValueType.Float64, mutable: false },
  ], { superTypes: [parent] });

  // Function takes a parent ref parameter and returns the x field
  mod.defineFunction('readParentX', [ValueType.Int32], [refType(parent.index)], (f, asm) => {
    asm.get_local(f.getParameter(0));
    asm.struct_get(parent.index, 0);
  });

  // Function creates a child struct and stores it in a local typed as parent ref
  mod.defineFunction('childAsParent', null, [], (f, asm) => {
    const parentLocal = asm.declareLocal(refType(parent.index), 'p');
    // Push child fields: x=100, y=2.71
    asm.const_i32(100);
    asm.const_f64(2.71);
    asm.struct_new(child.index);
    // (ref child.index) should be assignable to (ref parent.index) via subtyping
    asm.set_local(parentLocal);
  });

  // Should not throw - child ref is assignable to parent ref
  expect(() => mod.toBytes()).not.toThrow();
});

test('array.new pushes concrete ref type', () => {
  const mod = new ModuleBuilder('test', { target: 'latest' });

  const arrayType = mod.defineArrayType(ValueType.Int32, true);

  // Function creates an array and reads element at index 0
  mod.defineFunction('test', [ValueType.Int32], [], (f, asm) => {
    // array.new pops [init_val, length] and pushes (ref arrayType.index)
    asm.const_i32(0);   // init value
    asm.const_i32(5);   // length
    asm.array_new(arrayType.index);
    // array.get pops [array_ref, index] and pushes element type (i32)
    asm.const_i32(0);   // index
    asm.array_get(arrayType.index);
  });

  // Should not throw - verification passes without disableVerification
  expect(() => mod.toBytes()).not.toThrow();
});

test('struct.new_default pushes concrete ref type', () => {
  const mod = new ModuleBuilder('test', { target: 'latest' });

  const structType = mod.defineStructType([
    { name: 'a', type: ValueType.Int32, mutable: true },
    { name: 'b', type: ValueType.Float64, mutable: true },
  ]);

  // Function creates a default struct and reads a field
  mod.defineFunction('test', [ValueType.Int32], [], (f, asm) => {
    // struct.new_default pushes (ref structType.index) without popping any field values
    asm.struct_new_default(structType.index);
    // struct.get pops the struct ref and pushes the field type (i32 for field 0)
    asm.struct_get(structType.index, 0);
  });

  // Should not throw - verification passes without disableVerification
  expect(() => mod.toBytes()).not.toThrow();
});

test('GC opcodes accept builder objects (not just .index)', () => {
  const mod = new ModuleBuilder('test', { target: 'latest' });

  const structType = mod.defineStructType([
    { name: 'x', type: ValueType.Int32, mutable: true },
    { name: 'y', type: ValueType.Int32, mutable: true },
  ]);

  // Pass the builder object directly — not structType.index
  mod.defineFunction('test', [ValueType.Int32], [], (f, asm) => {
    asm.const_i32(10);
    asm.const_i32(20);
    asm.struct_new(structType);          // builder, not .index
    asm.struct_get(structType, 0);       // builder, not .index
  });

  // Verification should pass and binary should be valid
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
});
