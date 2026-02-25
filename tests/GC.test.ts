import ModuleBuilder from '../src/ModuleBuilder';
import { ValueType, RefType, HeapType, TypeForm, BlockType, refType, refNullType } from '../src/types';
import StructTypeBuilder from '../src/StructTypeBuilder';
import ArrayTypeBuilder from '../src/ArrayTypeBuilder';
import RecGroupBuilder from '../src/RecGroupBuilder';
import FuncTypeBuilder from '../src/FuncTypeBuilder';
import BinaryWriter from '../src/BinaryWriter';
import BinaryReader from '../src/BinaryReader';

// All GC tests use target 'latest' which includes the 'gc' feature.
const createModule = (name = 'gctest') =>
  new ModuleBuilder(name, { target: 'latest' });

// ─── Struct Type Definition ──────────────────────────────────────────

describe('GC struct types', () => {
  test('defineStructType creates a struct type', () => {
    const mod = createModule();
    const struct = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: true },
      { name: 'y', type: ValueType.Int32, mutable: true },
    ]);

    expect(struct).toBeInstanceOf(StructTypeBuilder);
    expect(struct.index).toBe(0);
    expect(struct.fields.length).toBe(2);
    expect(struct.fields[0].name).toBe('x');
    expect(struct.fields[0].type).toBe(ValueType.Int32);
    expect(struct.fields[0].mutable).toBe(true);
  });

  test('struct type appears in _types array', () => {
    const mod = createModule();
    const struct = mod.defineStructType([
      { name: 'val', type: ValueType.Float64, mutable: false },
    ]);

    expect(mod._types.length).toBe(1);
    expect(mod._types[0]).toBe(struct);
  });

  test('struct type index increments with func types', () => {
    const mod = createModule();
    mod.defineFuncType(null, []);
    const struct = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: true },
    ]);

    expect(struct.index).toBe(1);
    expect(mod._types.length).toBe(2);
    expect(mod._types[0]).toBeInstanceOf(FuncTypeBuilder);
    expect(mod._types[1]).toBeInstanceOf(StructTypeBuilder);
  });

  test('getFieldIndex returns correct index', () => {
    const mod = createModule();
    const struct = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: true },
      { name: 'y', type: ValueType.Float64, mutable: false },
    ]);

    expect(struct.getFieldIndex('x')).toBe(0);
    expect(struct.getFieldIndex('y')).toBe(1);
    expect(() => struct.getFieldIndex('z')).toThrow(/not found/);
  });

  test('struct type binary encoding', () => {
    const struct = new StructTypeBuilder('test', [
      { name: 'x', type: ValueType.Int32, mutable: true },
      { name: 'y', type: ValueType.Float64, mutable: false },
    ], 0);

    const bytes = struct.toBytes();
    // 0x5F (struct) + 2 (field count) + [0x7F (i32) + 1 (mut)] + [0x7C (f64) + 0 (immut)]
    expect(bytes[0]).toBe(0x5f); // struct
    expect(bytes[1]).toBe(2);    // 2 fields
    expect(bytes[2]).toBe(0x7f); // i32
    expect(bytes[3]).toBe(1);    // mutable
    expect(bytes[4]).toBe(0x7c); // f64
    expect(bytes[5]).toBe(0);    // immutable
  });

  test('struct type with subtype encoding', () => {
    const struct = new StructTypeBuilder('test', [
      { name: 'x', type: ValueType.Int32, mutable: true },
    ], 1, { superTypes: [{ index: 0 }], final: false });

    const bytes = struct.toBytes();
    expect(bytes[0]).toBe(0x50); // sub (not final)
    expect(bytes[1]).toBe(1);    // 1 supertype
    expect(bytes[2]).toBe(0);    // supertype index 0
    expect(bytes[3]).toBe(0x5f); // struct
  });

  test('struct type with final subtype encoding', () => {
    const struct = new StructTypeBuilder('test', [
      { name: 'x', type: ValueType.Int32, mutable: true },
    ], 1, { superTypes: [{ index: 0 }], final: true });

    const bytes = struct.toBytes();
    expect(bytes[0]).toBe(0x4f); // sub_final
  });

  test('struct type with reference field', () => {
    const struct = new StructTypeBuilder('test', [
      { name: 'ref', type: ValueType.AnyRef, mutable: true },
    ], 0);

    const bytes = struct.toBytes();
    expect(bytes[0]).toBe(0x5f); // struct
    expect(bytes[1]).toBe(1);    // 1 field
    expect(bytes[2]).toBe(0x6e); // anyref
    expect(bytes[3]).toBe(1);    // mutable
  });
});

// ─── Array Type Definition ───────────────────────────────────────────

describe('GC array types', () => {
  test('defineArrayType creates an array type', () => {
    const mod = createModule();
    const arrayType = mod.defineArrayType(ValueType.Int32, true);

    expect(arrayType).toBeInstanceOf(ArrayTypeBuilder);
    expect(arrayType.index).toBe(0);
    expect(arrayType.elementType).toBe(ValueType.Int32);
    expect(arrayType.mutable).toBe(true);
  });

  test('array type binary encoding', () => {
    const arrayType = new ArrayTypeBuilder('test', ValueType.Float64, true, 0);

    const bytes = arrayType.toBytes();
    expect(bytes[0]).toBe(0x5e); // array
    expect(bytes[1]).toBe(0x7c); // f64
    expect(bytes[2]).toBe(1);    // mutable
  });

  test('immutable array type', () => {
    const arrayType = new ArrayTypeBuilder('test', ValueType.Int32, false, 0);

    const bytes = arrayType.toBytes();
    expect(bytes[0]).toBe(0x5e); // array
    expect(bytes[1]).toBe(0x7f); // i32
    expect(bytes[2]).toBe(0);    // immutable
  });

  test('array type with subtype', () => {
    const arrayType = new ArrayTypeBuilder('test', ValueType.Int32, true, 1,
      { superTypes: [{ index: 0 }], final: false });

    const bytes = arrayType.toBytes();
    expect(bytes[0]).toBe(0x50); // sub
    expect(bytes[1]).toBe(1);    // 1 supertype
    expect(bytes[2]).toBe(0);    // supertype index 0
    expect(bytes[3]).toBe(0x5e); // array
  });
});

// ─── Recursive Type Groups ──────────────────────────────────────────

describe('GC recursive type groups', () => {
  test('defineRecGroup creates a rec group', () => {
    const mod = createModule();
    const recGroup = mod.defineRecGroup((builder) => {
      builder.addStructType([
        { name: 'value', type: ValueType.Int32, mutable: false },
      ]);
      builder.addStructType([
        { name: 'data', type: ValueType.Float64, mutable: true },
      ]);
    });

    expect(recGroup._types.length).toBe(2);
    expect(mod._types.length).toBe(2);
    expect(mod._typeSectionEntries.length).toBe(1); // single rec group entry
  });

  test('rec group types get correct indices', () => {
    const mod = createModule();
    mod.defineFuncType(null, []);

    const recGroup = mod.defineRecGroup((builder) => {
      const s1 = builder.addStructType([
        { name: 'x', type: ValueType.Int32, mutable: false },
      ]);
      const s2 = builder.addStructType([
        { name: 'y', type: ValueType.Float64, mutable: false },
      ]);

      expect(s1.index).toBe(1); // func type is 0
      expect(s2.index).toBe(2);
    });

    expect(mod._types.length).toBe(3);
  });

  test('rec group with forward references', () => {
    const mod = createModule();
    const recGroup = mod.defineRecGroup((builder) => {
      const listRef = builder.refNull(1);
      builder.addStructType([
        { name: 'value', type: ValueType.Int32, mutable: false },
        { name: 'next', type: listRef, mutable: false },
      ]);
      builder.addArrayType(builder.refNull(0), true);
    });

    expect(recGroup._types.length).toBe(2);
    expect(recGroup._types[0]).toBeInstanceOf(StructTypeBuilder);
    expect(recGroup._types[1]).toBeInstanceOf(ArrayTypeBuilder);
  });

  test('rec group binary encoding (multi-type)', () => {
    const recGroup = new RecGroupBuilder(0);
    recGroup.addStructType([
      { name: 'x', type: ValueType.Int32, mutable: true },
    ]);
    recGroup.addArrayType(ValueType.Float64, true);

    const bytes = recGroup.toBytes();
    expect(bytes[0]).toBe(0x4e); // rec prefix
    expect(bytes[1]).toBe(2);    // 2 types
    expect(bytes[2]).toBe(0x5f); // struct
    // ... followed by array
  });

  test('rec group with single type omits rec prefix', () => {
    const recGroup = new RecGroupBuilder(0);
    recGroup.addStructType([
      { name: 'x', type: ValueType.Int32, mutable: true },
    ]);

    const bytes = recGroup.toBytes();
    expect(bytes[0]).toBe(0x5f); // struct directly, no rec prefix
  });

  test('empty rec group throws', () => {
    const mod = createModule();
    expect(() => {
      mod.defineRecGroup(() => {});
    }).toThrow(/at least one type/);
  });
});

// ─── GC Opcodes ─────────────────────────────────────────────────────

describe('GC struct opcodes', () => {
  test('struct.new emits with type index', () => {
    const mod = createModule();
    const struct = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: true },
    ]);

    mod.defineFunction('create', null, [], (func, asm) => {
      asm.const_i32(42);
      asm.struct_new(struct.index);
      asm.drop();
    });

    const bytes = mod.toBytes();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('struct.new_default emits with type index', () => {
    const mod = createModule();
    const struct = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: true },
    ]);

    mod.defineFunction('create', null, [], (func, asm) => {
      asm.struct_new_default(struct.index);
      asm.drop();
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('struct.get/set emit with type and field index', () => {
    const mod = createModule();
    const struct = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: true },
      { name: 'y', type: ValueType.Int32, mutable: true },
    ]);

    mod.defineFunction('access', null, [], (func, asm) => {
      asm.struct_new_default(struct.index);
      const local = asm.declareLocal(ValueType.AnyRef);
      asm.set_local(local);
      asm.get_local(local);
      asm.struct_get(struct.index, struct.getFieldIndex('y'));
      asm.drop();
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe('GC array opcodes', () => {
  test('array.new emits with type index', () => {
    const mod = createModule();
    const arrayType = mod.defineArrayType(ValueType.Int32, true);

    mod.defineFunction('create', null, [], (func, asm) => {
      asm.const_i32(0);  // default value
      asm.const_i32(10); // length
      asm.array_new(arrayType.index);
      asm.drop();
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('array.len emits (no immediate)', () => {
    const mod = createModule();
    const arrayType = mod.defineArrayType(ValueType.Int32, true);

    mod.defineFunction('len', null, [], (func, asm) => {
      asm.const_i32(0);
      asm.const_i32(5);
      asm.array_new(arrayType.index);
      asm.array_len();
      asm.drop();
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('array.get/set emit correctly', () => {
    const mod = createModule();
    const arrayType = mod.defineArrayType(ValueType.Int32, true);

    mod.defineFunction('access', null, [], (func, asm) => {
      asm.const_i32(0);
      asm.const_i32(5);
      asm.array_new(arrayType.index);
      const local = asm.declareLocal(ValueType.AnyRef);
      asm.set_local(local);
      asm.get_local(local);
      asm.const_i32(0);
      asm.array_get(arrayType.index);
      asm.drop();
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe('GC i31 opcodes', () => {
  test('ref.i31 and i31.get_s emit correctly', () => {
    const mod = createModule();

    mod.defineFunction('i31_ops', ValueType.Int32, [], (func, asm) => {
      asm.const_i32(42);
      asm.ref_i31();
      asm.i31_get_s();
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('i31.get_u emits correctly', () => {
    const mod = createModule();

    mod.defineFunction('i31_ops', ValueType.Int32, [], (func, asm) => {
      asm.const_i32(42);
      asm.ref_i31();
      asm.i31_get_u();
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe('GC conversion opcodes', () => {
  test('any.convert_extern and extern.convert_any emit correctly', () => {
    const mod = createModule();

    mod.defineFunction('convert', null, [], (func, asm) => {
      asm.ref_null(0x6f); // externref
      asm.any_convert_extern();
      asm.extern_convert_any();
      asm.drop();
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe('GC cast opcodes', () => {
  test('ref.test emits with heap type', () => {
    const mod = createModule();

    mod.defineFunction('test_ref', ValueType.Int32, [], (func, asm) => {
      asm.ref_null(0x6e); // anyref
      asm.ref_test(HeapType.I31);
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('ref.cast emits with heap type', () => {
    const mod = createModule();

    mod.defineFunction('cast_ref', null, [], (func, asm) => {
      asm.ref_null(0x6e); // anyref
      asm.ref_cast(HeapType.I31);
      asm.drop();
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });
});

// ─── Feature Gating ─────────────────────────────────────────────────

describe('GC feature gating', () => {
  test('defineStructType throws without gc feature', () => {
    const mod = new ModuleBuilder('test', { target: '3.0' });
    expect(() => {
      mod.defineStructType([
        { name: 'x', type: ValueType.Int32, mutable: true },
      ]);
    }).toThrow(/gc.*feature.*required/i);
  });

  test('defineArrayType throws without gc feature', () => {
    const mod = new ModuleBuilder('test', { target: '3.0' });
    expect(() => {
      mod.defineArrayType(ValueType.Int32, true);
    }).toThrow(/gc.*feature.*required/i);
  });

  test('defineRecGroup throws without gc feature', () => {
    const mod = new ModuleBuilder('test', { target: '3.0' });
    expect(() => {
      mod.defineRecGroup((builder) => {
        builder.addStructType([
          { name: 'x', type: ValueType.Int32, mutable: true },
        ]);
      });
    }).toThrow(/gc.*feature.*required/i);
  });

  test('gc opcodes throw without gc feature', () => {
    const mod = new ModuleBuilder('test', { target: '3.0', disableVerification: true });
    expect(() => {
      mod.defineFunction('test_fn', null, [], (func, asm) => {
        asm.ref_i31();
      });
    }).toThrow(/gc.*feature/i);
  });
});

// ─── WAT Output ─────────────────────────────────────────────────────

describe('GC WAT output', () => {
  test('struct type in WAT output', () => {
    const mod = createModule();
    mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: true },
      { name: 'y', type: ValueType.Float64, mutable: false },
    ]);

    const wat = mod.toString();
    expect(wat).toContain('(type (;0;) (struct (field $x (mut i32)) (field $y f64)))');
  });

  test('array type in WAT output', () => {
    const mod = createModule();
    mod.defineArrayType(ValueType.Int32, true);

    const wat = mod.toString();
    expect(wat).toContain('(type (;0;) (array (mut i32)))');
  });

  test('immutable array type in WAT output', () => {
    const mod = createModule();
    mod.defineArrayType(ValueType.Float64, false);

    const wat = mod.toString();
    expect(wat).toContain('(type (;0;) (array f64))');
  });

  test('mixed types in WAT output', () => {
    const mod = createModule();
    mod.defineFuncType(ValueType.Int32, [ValueType.Int32]);
    mod.defineStructType([
      { name: 'val', type: ValueType.Int32, mutable: true },
    ]);
    mod.defineArrayType(ValueType.Float64, true);

    const wat = mod.toString();
    expect(wat).toContain('(type (;0;) (func (param i32) (result i32)))');
    expect(wat).toContain('(type (;1;) (struct (field $val (mut i32))))');
    expect(wat).toContain('(type (;2;) (array (mut f64)))');
  });
});

// ─── Reference Types ────────────────────────────────────────────────

describe('GC reference types', () => {
  test('RefType constants have correct values', () => {
    expect(RefType.AnyRef.value).toBe(0x6e);
    expect(RefType.EqRef.value).toBe(0x6d);
    expect(RefType.I31Ref.value).toBe(0x6c);
    expect(RefType.StructRef.value).toBe(0x6b);
    expect(RefType.ArrayRef.value).toBe(0x6a);
    expect(RefType.ExternRef.value).toBe(0x6f);
    expect(RefType.FuncRef.value).toBe(0x70);
    expect(RefType.NullRef.value).toBe(0x71);
    expect(RefType.NullExternRef.value).toBe(0x72);
    expect(RefType.NullFuncRef.value).toBe(0x73);
  });

  test('HeapType constants have correct values', () => {
    expect(HeapType.Any.value).toBe(0x6e);
    expect(HeapType.Eq.value).toBe(0x6d);
    expect(HeapType.I31.value).toBe(0x6c);
    expect(HeapType.Struct.value).toBe(0x6b);
    expect(HeapType.Array.value).toBe(0x6a);
    expect(HeapType.Extern.value).toBe(0x6f);
    expect(HeapType.Func.value).toBe(0x70);
    expect(HeapType.None.value).toBe(0x71);
    expect(HeapType.NoExtern.value).toBe(0x72);
    expect(HeapType.NoFunc.value).toBe(0x73);
  });

  test('ref types can be used as function parameters', () => {
    const mod = createModule();
    mod.defineFunction('takes_ref', null, [ValueType.AnyRef], (func, asm) => {
      // no-op
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('ref types can be used as function return types', () => {
    const mod = createModule();
    mod.defineFunction('returns_ref', ValueType.AnyRef, [], (func, asm) => {
      asm.ref_null(0x6e); // anyref
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('ref types can be used as local variables', () => {
    const mod = createModule();
    mod.defineFunction('local_ref', null, [], (func, asm) => {
      const local = asm.declareLocal(ValueType.EqRef);
      asm.ref_null(0x6d); // eqref
      asm.set_local(local);
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('concrete ref type (ref null $type) encoding', () => {
    const concreteRef = refNullType(5);
    expect(concreteRef.refPrefix).toBe(0x63);
    expect(concreteRef.typeIndex).toBe(5);
    expect(concreteRef.name).toBe('(ref null 5)');
  });

  test('concrete ref type (ref $type) encoding', () => {
    const concreteRef = refType(3);
    expect(concreteRef.refPrefix).toBe(0x64);
    expect(concreteRef.typeIndex).toBe(3);
    expect(concreteRef.name).toBe('(ref 3)');
  });
});

// ─── TypeForm ───────────────────────────────────────────────────────

describe('TypeForm constants', () => {
  test('TypeForm has correct values', () => {
    expect(TypeForm.Func.value).toBe(0x60);
    expect(TypeForm.Block.value).toBe(0x40);
    expect(TypeForm.Struct.value).toBe(0x5f);
    expect(TypeForm.Array.value).toBe(0x5e);
    expect(TypeForm.Rec.value).toBe(0x4e);
    expect(TypeForm.Sub.value).toBe(0x50);
    expect(TypeForm.SubFinal.value).toBe(0x4f);
  });
});

// ─── Module Binary Output ───────────────────────────────────────────

describe('GC module binary output', () => {
  test('module with struct type produces valid binary', () => {
    const mod = createModule();
    const struct = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: true },
      { name: 'y', type: ValueType.Int32, mutable: true },
    ]);

    mod.defineFunction('create', null, [], (func, asm) => {
      asm.const_i32(1);
      asm.const_i32(2);
      asm.struct_new(struct.index);
      asm.drop();
    });

    const bytes = mod.toBytes();
    // Verify WASM magic header
    expect(bytes[0]).toBe(0x00);
    expect(bytes[1]).toBe(0x61);
    expect(bytes[2]).toBe(0x73);
    expect(bytes[3]).toBe(0x6d);
    // Verify version
    expect(bytes[4]).toBe(0x01);
  });

  test('module with array type produces valid binary', () => {
    const mod = createModule();
    const arrayType = mod.defineArrayType(ValueType.Float64, true);

    mod.defineFunction('create', null, [], (func, asm) => {
      asm.const_f64(0.0);
      asm.const_i32(10);
      asm.array_new(arrayType.index);
      asm.drop();
    });

    const bytes = mod.toBytes();
    expect(bytes[0]).toBe(0x00); // magic
    expect(bytes.length).toBeGreaterThan(8);
  });

  test('module with rec group produces valid binary', () => {
    const mod = createModule();
    mod.defineRecGroup((builder) => {
      builder.addStructType([
        { name: 'val', type: ValueType.Int32, mutable: false },
        { name: 'next', type: builder.refNull(0), mutable: false },
      ]);
    });

    const bytes = mod.toBytes();
    expect(bytes[0]).toBe(0x00); // magic
    expect(bytes.length).toBeGreaterThan(8);
  });
});

// ─── Init Expressions ───────────────────────────────────────────────

describe('GC init expressions', () => {
  test('ref.null allowed in init expression', () => {
    const mod = createModule();
    const g = mod.defineGlobal(ValueType.AnyRef, false, (asm: any) => {
      asm.ref_null(0x6e); // anyref
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('struct.new_default allowed in init expression with gc', () => {
    const mod = createModule();
    const struct = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: true },
    ]);

    // struct.new_default should be valid in a global init expression with gc feature
    const g = mod.defineGlobal(ValueType.AnyRef, false, (asm: any) => {
      asm.struct_new_default(struct.index);
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('ref.i31 allowed in init expression with gc', () => {
    const mod = createModule();
    const g = mod.defineGlobal(ValueType.AnyRef, false, (asm: any) => {
      asm.const_i32(42);
      asm.ref_i31();
    });

    // This requires extended-const or gc to allow multi-instruction init expressions
    // Since latest target includes extended-const, this should work
    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe('br_on_cast', () => {
  test('encodes correct relative depth', () => {
    const mod = createModule();
    const struct = mod.defineStructType([
      { name: 'val', type: ValueType.Int32, mutable: false },
    ]);
    const structRef = refNullType(struct.index);

    mod.defineFunction('test_cast', ValueType.Int32, [structRef], (fn, asm) => {
      const param = fn.getParameter(0);
      // block $target (result i32)
      const label = asm.block(BlockType.Int32);
      // br_on_cast flags=1(nullable src), $target, anyref → struct type
      asm.get_local(param);
      asm.br_on_cast(1, label, HeapType.Any, struct);
      // fall-through: not a struct, return 0
      asm.drop();
      asm.const_i32(0);
      asm.br(label);
      // end block - cast succeeded, struct is on stack
      asm.end();
      asm.struct_get(struct.index, 0);
    }).withExport('test_cast');

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);

    // Verify binary contains the br_on_cast opcode (0xFB 0x18)
    const hexStr = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    expect(hexStr).toContain('fb18');
  });

  test('br_on_cast_fail encodes correctly', () => {
    const mod = createModule();
    const struct = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: false },
    ]);
    const structRef = refNullType(struct.index);

    mod.defineFunction('test', ValueType.Int32, [structRef], (fn, asm) => {
      const param = fn.getParameter(0);
      const label = asm.block(BlockType.Int32);
      asm.get_local(param);
      asm.br_on_cast_fail(1, label, HeapType.Any, struct);
      // Cast succeeded - get field
      asm.struct_get(struct.index, 0);
      asm.br(label);
      asm.end();
      // Cast failed - default
    }).withExport('test');

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);

    const hexStr = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    expect(hexStr).toContain('fb19');
  });
});

// ─── Additional GC Opcode Coverage ─────────────────────────────────

describe('GC struct signed/unsigned getters', () => {
  test('struct.get_s emits correctly', () => {
    const mod = createModule();
    const struct = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: false },
    ]);

    mod.defineFunction('test', ValueType.Int32, [], (func, asm) => {
      asm.struct_new_default(struct.index);
      asm.struct_get_s(struct.index, 0);
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('struct.get_u emits correctly', () => {
    const mod = createModule();
    const struct = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: false },
    ]);

    mod.defineFunction('test', ValueType.Int32, [], (func, asm) => {
      asm.struct_new_default(struct.index);
      asm.struct_get_u(struct.index, 0);
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe('GC array creation variants', () => {
  test('array.new_default emits correctly', () => {
    const mod = createModule();
    const arrayType = mod.defineArrayType(ValueType.Int32, true);

    mod.defineFunction('test', null, [], (func, asm) => {
      asm.const_i32(10);
      asm.array_new_default(arrayType.index);
      asm.drop();
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('array.new_fixed emits with type index and count', () => {
    const mod = createModule();
    const arrayType = mod.defineArrayType(ValueType.Int32, true);

    mod.defineFunction('test', null, [], (func, asm) => {
      asm.const_i32(1);
      asm.const_i32(2);
      asm.const_i32(3);
      asm.array_new_fixed(arrayType.index, 3);
      asm.drop();
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
    // Verify binary contains the array.new_fixed opcode (0xFB 0x08)
    const hexStr = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    expect(hexStr).toContain('fb08');
  });

  test('array.get_s and array.get_u emit correctly', () => {
    const mod = createModule();
    const arrayType = mod.defineArrayType(ValueType.Int32, true);

    mod.defineFunction('test', null, [], (func, asm) => {
      asm.const_i32(0);
      asm.const_i32(5);
      asm.array_new(arrayType.index);
      const local = asm.declareLocal(ValueType.AnyRef);
      asm.set_local(local);

      asm.get_local(local);
      asm.const_i32(0);
      asm.array_get_s(arrayType.index);
      asm.drop();

      asm.get_local(local);
      asm.const_i32(0);
      asm.array_get_u(arrayType.index);
      asm.drop();
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe('GC array bulk operations', () => {
  test('array.fill emits correctly', () => {
    const mod = createModule();
    const arrayType = mod.defineArrayType(ValueType.Int32, true);

    mod.defineFunction('test', null, [], (func, asm) => {
      asm.const_i32(0);
      asm.const_i32(10);
      asm.array_new(arrayType.index);
      const local = asm.declareLocal(ValueType.AnyRef);
      asm.set_local(local);

      // array.fill: [arrayref, offset, value, count]
      asm.get_local(local);
      asm.const_i32(0);  // offset
      asm.const_i32(42); // fill value
      asm.const_i32(10); // count
      asm.array_fill(arrayType.index);
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
    const hexStr = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    expect(hexStr).toContain('fb10');  // array.fill = 0xFB 0x10 (16 = 0x10)
  });

  test('array.copy emits correctly', () => {
    const mod = createModule();
    const arrayType = mod.defineArrayType(ValueType.Int32, true);

    mod.defineFunction('test', null, [], (func, asm) => {
      asm.const_i32(0);
      asm.const_i32(5);
      asm.array_new(arrayType.index);
      const src = asm.declareLocal(ValueType.AnyRef);
      asm.set_local(src);

      asm.const_i32(0);
      asm.const_i32(5);
      asm.array_new(arrayType.index);
      const dst = asm.declareLocal(ValueType.AnyRef);
      asm.set_local(dst);

      // array.copy: [dst, dstOffset, src, srcOffset, count]
      asm.get_local(dst);
      asm.const_i32(0);
      asm.get_local(src);
      asm.const_i32(0);
      asm.const_i32(5);
      asm.array_copy(arrayType.index, arrayType.index);
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe('GC ref type variants', () => {
  test('ref.test_null emits with heap type', () => {
    const mod = createModule();

    mod.defineFunction('test', ValueType.Int32, [], (func, asm) => {
      asm.ref_null(0x6e); // anyref
      asm.ref_test_null(HeapType.I31);
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
    const hexStr = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    expect(hexStr).toContain('fb15'); // ref.test_null = 0xFB 0x15 (21 = 0x15)
  });

  test('ref.cast_null emits with heap type', () => {
    const mod = createModule();

    mod.defineFunction('test', null, [], (func, asm) => {
      asm.ref_null(0x6e); // anyref
      asm.ref_cast_null(HeapType.I31);
      asm.drop();
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
    const hexStr = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    expect(hexStr).toContain('fb17'); // ref.cast_null = 0xFB 0x17 (23 = 0x17)
  });

  test('ref.test with concrete type index', () => {
    const mod = createModule();
    const struct = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: false },
    ]);

    mod.defineFunction('test', ValueType.Int32, [], (func, asm) => {
      asm.ref_null(0x6e); // anyref
      asm.ref_test(struct);
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });

  test('ref.cast with concrete type index', () => {
    const mod = createModule();
    const struct = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: false },
    ]);

    mod.defineFunction('test', null, [], (func, asm) => {
      asm.ref_null(0x6e); // anyref
      asm.ref_cast(struct);
      asm.drop();
    });

    const bytes = mod.toBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe('GC WAT text output for opcodes', () => {
  test('struct opcodes appear in WAT output', () => {
    const mod = createModule();
    const struct = mod.defineStructType([
      { name: 'x', type: ValueType.Int32, mutable: true },
    ]);

    mod.defineFunction('test', null, [], (func, asm) => {
      asm.struct_new_default(struct.index);
      const local = asm.declareLocal(ValueType.AnyRef);
      asm.set_local(local);
      asm.get_local(local);
      asm.const_i32(99);
      asm.struct_set(struct.index, 0);
      asm.get_local(local);
      asm.struct_get(struct.index, 0);
      asm.drop();
    }).withExport();

    const wat = mod.toString();
    expect(wat).toContain('struct.new_default');
    expect(wat).toContain('struct.set');
    expect(wat).toContain('struct.get');
  });

  test('array opcodes appear in WAT output', () => {
    const mod = createModule();
    const arrayType = mod.defineArrayType(ValueType.Int32, true);

    mod.defineFunction('test', null, [], (func, asm) => {
      asm.const_i32(10);
      asm.array_new_default(arrayType.index);
      asm.array_len();
      asm.drop();
    }).withExport();

    const wat = mod.toString();
    expect(wat).toContain('array.new_default');
    expect(wat).toContain('array.len');
  });

  test('i31 and conversion opcodes appear in WAT output', () => {
    const mod = createModule();

    mod.defineFunction('test', null, [], (func, asm) => {
      asm.const_i32(42);
      asm.ref_i31();
      asm.i31_get_s();
      asm.drop();
    }).withExport();

    const wat = mod.toString();
    expect(wat).toContain('ref.i31');
    expect(wat).toContain('i31.get_s');
  });
});
