# API Reference

## ModuleBuilder

The main entry point for building WebAssembly modules.

### Constructor

```typescript
new ModuleBuilder(name: string, options?: ModuleBuilderOptions)
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `generateNameSection` | `boolean` | `true` | Include debug name section in output |
| `disableVerification` | `boolean` | `false` | Skip control flow and operand stack verification |
| `target` | `WasmTarget` | `'latest'` | WebAssembly target: `'mvp'`, `'2.0'`, `'3.0'`, or `'latest'` |
| `features` | `WasmFeature[]` | `[]` | Additional feature flags beyond those included by the target |

### Methods

#### Functions

```typescript
// Define a function with an inline callback
defineFunction(
  name: string,
  returnTypes: ValueType[] | null,
  parameterTypes: ValueType[],
  callback?: (func: FunctionBuilder, emitter: FunctionEmitter) => void
): FunctionBuilder

// Define a function type signature (for call_indirect)
defineFunctionType(returnTypes: ValueType[], parameterTypes: ValueType[]): FuncTypeBuilder

// Set the start function (runs on instantiation)
setStartFunction(func: FunctionBuilder): void
```

#### Imports

```typescript
// Import a function
importFunction(
  module: string,
  name: string,
  returnTypes: ValueType[] | null,
  parameterTypes: ValueType[]
): ImportBuilder

// Import memory
importMemory(module: string, name: string, initial: number, maximum?: number, shared?: boolean): ImportBuilder

// Import a table
importTable(
  module: string,
  name: string,
  elementType: ElementType,
  initial: number,
  maximum?: number
): ImportBuilder

// Import a global
importGlobal(
  module: string,
  name: string,
  valueType: ValueType,
  mutable: boolean
): ImportBuilder

// Import an exception tag
importTag(module: string, name: string, parameters: ValueType[]): ImportBuilder
```

#### Tags

```typescript
// Define an exception tag
defineTag(parameters: ValueType[]): TagBuilder
```

#### GC Types (requires `gc` feature)

```typescript
// Define a struct type
defineStructType(fields: StructField[], options?: StructTypeOptions): StructTypeBuilder

// Define an array type
defineArrayType(elementType: ValueType, mutable: boolean, options?: ArrayTypeOptions): ArrayTypeBuilder

// Define a recursive type group (for mutually recursive types)
defineRecGroup(callback: (builder: RecGroupBuilder) => void): RecGroupBuilder
```

#### Exports

```typescript
exportFunction(func: FunctionBuilder, exportName?: string): ExportBuilder
exportMemory(mem: MemoryBuilder, name: string): ExportBuilder
exportTable(table: TableBuilder, name: string): ExportBuilder
exportGlobal(global: GlobalBuilder, name: string): ExportBuilder
exportTag(tag: TagBuilder, name: string): ExportBuilder
```

#### Memory

```typescript
defineMemory(initial: number, maximum?: number, shared?: boolean, memory64?: boolean): MemoryBuilder
defineData(data: Uint8Array, offset?: number | bigint | GlobalBuilder | ((asm: InitExpressionEmitter) => void)): DataSegmentBuilder
```

#### Tables

```typescript
defineTable(elementType: ElementType, initial: number, maximum?: number): TableBuilder
defineElementSegment(
  table: TableBuilder,
  elements: (FunctionBuilder | ImportBuilder)[],
  offset?: number | GlobalBuilder | ((asm: InitExpressionEmitter) => void)
): ElementSegmentBuilder
```

#### Passive Element Segments

```typescript
// Define a passive element segment (for use with table.init)
definePassiveElementSegment(elements: (FunctionBuilder | ImportBuilder)[]): ElementSegmentBuilder
```

#### Globals

```typescript
defineGlobal(valueType: ValueType, mutable: boolean, initialValue: number | bigint): GlobalBuilder
```

#### Custom Sections

```typescript
defineCustomSection(name: string, data: Uint8Array): CustomSectionBuilder
```

#### Output

```typescript
// Compile to WASM binary
toBytes(): Uint8Array

// Compile to WebAssembly.Module (without instantiating)
compile(): Promise<WebAssembly.Module>

// Compile and instantiate
instantiate(imports?: WebAssembly.Imports): Promise<WebAssembly.WebAssemblyInstantiatedSource>

// Generate WAT text
toString(): string
```

#### Feature Checking

```typescript
// Check if a feature is enabled for this module
hasFeature(feature: WasmFeature): boolean
```

---

## FunctionBuilder

Returned by `ModuleBuilder.defineFunction()`. Configures a function's parameters, locals, and export.

### Methods

```typescript
// Access a parameter by index
getParameter(index: number): FunctionParameterBuilder

// Create an emitter to build the function body (alternative to callback)
createEmitter(callback?: (emitter: FunctionEmitter) => void): FunctionEmitter

// Mark the function as exported
withExport(name?: string): FunctionBuilder
```

---

## FunctionEmitter

Emits WASM instructions for a function body. Passed as the second argument to `defineFunction` callbacks.

### Locals

```typescript
declareLocal(type: ValueType, name?: string): LocalBuilder
```

### Variable Access

```typescript
get_local(local: LocalBuilder | FunctionParameterBuilder): void
set_local(local: LocalBuilder | FunctionParameterBuilder): void
tee_local(local: LocalBuilder | FunctionParameterBuilder): void
get_global(global: GlobalBuilder | ImportBuilder): void
set_global(global: GlobalBuilder | ImportBuilder): void
```

### Constants

```typescript
const_i32(value: number): void
const_i64(value: bigint): void
const_f32(value: number): void
const_f64(value: number): void
```

### Integer Arithmetic (i32)

```typescript
add_i32(): void
sub_i32(): void
mul_i32(): void
div_s_i32(): void
div_u_i32(): void
rem_s_i32(): void
rem_u_i32(): void
```

### Integer Comparison (i32)

```typescript
eqz_i32(): void
eq_i32(): void
ne_i32(): void
lt_s_i32(): void
lt_u_i32(): void
gt_s_i32(): void
gt_u_i32(): void
le_s_i32(): void
le_u_i32(): void
ge_s_i32(): void
ge_u_i32(): void
// Shorthand aliases
lt_i32(): void  // alias for lt_s_i32
gt_i32(): void  // alias for gt_s_i32
le_i32(): void  // alias for le_s_i32
ge_i32(): void  // alias for ge_s_i32
```

### Integer Bitwise (i32)

```typescript
and_i32(): void
or_i32(): void
xor_i32(): void
shl_i32(): void
shr_s_i32(): void
shr_u_i32(): void
rotl_i32(): void
rotr_i32(): void
clz_i32(): void
ctz_i32(): void
popcnt_i32(): void
```

### i64, f32, f64 Operations

The emitter provides the same arithmetic, comparison, and bitwise operations for `i64`, `f32`, and `f64` types, following the pattern `operation_type()` (e.g. `add_i64()`, `mul_f64()`, `sqrt_f32()`).

Float types additionally support: `abs`, `neg`, `ceil`, `floor`, `trunc`, `nearest`, `sqrt`, `min`, `max`, `copysign`.

### Type Conversions

```typescript
// i32 conversions
wrap_i64_i32(): void
trunc_f32_s_i32(): void
trunc_f64_s_i32(): void
extend_i32_s_i64(): void
convert_i32_s_f64(): void
promote_f32_f64(): void
// ... and many more
```

### Sign Extension

```typescript
extend8_s_i32(): void     // i32: sign-extend from i8
extend16_s_i32(): void    // i32: sign-extend from i16
extend8_s_i64(): void     // i64: sign-extend from i8
extend16_s_i64(): void    // i64: sign-extend from i16
extend32_s_i64(): void    // i64: sign-extend from i32
```

### Saturating Truncation

```typescript
// Float → i32 (saturating, no trap on overflow)
trunc_sat_f32_s_i32(): void
trunc_sat_f32_u_i32(): void
trunc_sat_f64_s_i32(): void
trunc_sat_f64_u_i32(): void

// Float → i64 (saturating)
trunc_sat_f32_s_i64(): void
trunc_sat_f32_u_i64(): void
trunc_sat_f64_s_i64(): void
trunc_sat_f64_u_i64(): void
```

### Memory Operations

```typescript
load_i32(align: number, offset: number): void
store_i32(align: number, offset: number): void
load8_i32(align: number, offset: number): void     // sign-extended
load8_u_i32(align: number, offset: number): void    // zero-extended
store8_i32(align: number, offset: number): void
load16_i32(align: number, offset: number): void
store16_i32(align: number, offset: number): void
// Similar for i64, with 8/16/32-bit variants
memory_size(): void
memory_grow(): void
```

### Control Flow

```typescript
// Structured blocks
block(blockType: BlockType, callback?: (label: LabelBuilder) => void): LabelBuilder
loop(blockType: BlockType, callback?: (label: LabelBuilder) => void): LabelBuilder
if(blockType: BlockType, callback?: () => void): void
else(): void
end(): void

// Branching
br(label: LabelBuilder): void
br_if(label: LabelBuilder): void
br_table(defaultLabel: LabelBuilder, ...labels: LabelBuilder[]): void
return(): void
unreachable(): void

// Calls
call(target: FunctionBuilder | ImportBuilder): void
call_indirect(funcType: FuncTypeBuilder): void

// Stack
drop(): void
select(): void
nop(): void
```

### Tail Calls

```typescript
return_call(target: FunctionBuilder | ImportBuilder): void
return_call_indirect(funcType: FuncTypeBuilder): void
```

### Atomic Operations

```typescript
// Load/store (alignment and offset immediates)
atomic_load_i32(align: number, offset: number): void
atomic_load_i64(align: number, offset: number): void
atomic_store_i32(align: number, offset: number): void
atomic_store_i64(align: number, offset: number): void

// Read-modify-write
atomic_rmw_add_i32(align: number, offset: number): void
atomic_rmw_sub_i32(align: number, offset: number): void
atomic_rmw_and_i32(align: number, offset: number): void
atomic_rmw_or_i32(align: number, offset: number): void
atomic_rmw_xor_i32(align: number, offset: number): void
atomic_rmw_xchg_i32(align: number, offset: number): void
atomic_rmw_cmpxchg_i32(align: number, offset: number): void
// Same patterns for i64 variants

// Synchronization
atomic_fence(flags: number): void
atomic_notify(align: number, offset: number): void
atomic_wait32(align: number, offset: number): void
atomic_wait64(align: number, offset: number): void
```

### Exception Handling

```typescript
throw(tagIndex: number): void
try(blockType: BlockType): void
catch(tagIndex: number): void
catch_all(): void
rethrow(depth: number): void
delegate(depth: number): void
```

### GC Operations (requires `gc` feature)

```typescript
// Struct operations
struct_new(typeIndex: number): void
struct_new_default(typeIndex: number): void
struct_get(typeIndex: number, fieldIndex: number): void
struct_get_s(typeIndex: number, fieldIndex: number): void
struct_get_u(typeIndex: number, fieldIndex: number): void
struct_set(typeIndex: number, fieldIndex: number): void

// Array operations
array_new(typeIndex: number): void
array_new_default(typeIndex: number): void
array_new_fixed(typeIndex: number, length: number): void
array_new_data(typeIndex: number, dataIndex: number): void
array_new_elem(typeIndex: number, elemIndex: number): void
array_get(typeIndex: number): void
array_get_s(typeIndex: number): void    // Signed packed field access
array_get_u(typeIndex: number): void    // Unsigned packed field access
array_set(typeIndex: number): void
array_len(): void
array_fill(typeIndex: number): void
array_copy(dstTypeIndex: number, srcTypeIndex: number): void
array_init_data(typeIndex: number, dataIndex: number): void
array_init_elem(typeIndex: number, elemIndex: number): void

// Reference operations
ref_null(heapType: number): void       // Push a null reference (HeapType value)
ref_is_null(): void                     // Test if top of stack is null
ref_func(func: FunctionBuilder | ImportBuilder): void  // Push function reference
ref_test(heapType: HeapTypeRef): void   // Test reference type, push i32 result
ref_test_null(heapType: HeapTypeRef): void
ref_cast(heapType: HeapTypeRef): void   // Cast reference type or trap
ref_cast_null(heapType: HeapTypeRef): void
ref_i31(): void                         // Wrap i32 as i31ref
i31_get_s(): void                       // Extract i31 value (signed)
i31_get_u(): void                       // Extract i31 value (unsigned)

// Reference conversions
any_convert_extern(): void   // Convert externref → anyref
extern_convert_any(): void   // Convert anyref → externref
```

### SIMD Operations (requires `simd` feature)

```typescript
// Load/store/const
load_v128(align: number, offset: number): void
store_v128(align: number, offset: number): void
const_v128(bytes: Uint8Array): void

// Shuffle and splat
shuffle_i8x16(mask: Uint8Array): void
splat_i8x16(): void
splat_i16x8(): void
splat_i32x4(): void
splat_i64x2(): void
splat_f32x4(): void
splat_f64x2(): void

// Lane operations
extract_lane_i8x16(lane: number): void
replace_lane_i8x16(lane: number): void
// Same pattern for i16x8, i32x4, i64x2, f32x4, f64x2

// Arithmetic: add/sub/mul/neg for all lane types
// Pattern: {op}_{lanes}() e.g. add_i32x4(), mul_f64x2(), neg_i8x16()

// Comparisons: eq/ne/lt_s/lt_u/gt_s/gt_u/le_s/le_u/ge_s/ge_u for integer lanes
// Comparisons: eq/ne/lt/gt/le/ge for float lanes

// Bitwise v128 operations
and_v128(): void
or_v128(): void
xor_v128(): void
not_v128(): void
bitselect_v128(): void
```

### Bulk Memory Operations (requires `bulk-memory` feature)

```typescript
memory_copy(): void
memory_fill(): void
memory_init(dataIndex: number): void
data_drop(dataIndex: number): void
table_copy(): void
table_init(elemIndex: number): void
elem_drop(elemIndex: number): void
table_grow(): void
table_size(): void
table_fill(): void
```

---

## GlobalBuilder

Returned by `ModuleBuilder.defineGlobal()`.

```typescript
withExport(name: string): GlobalBuilder
withName(name: string): GlobalBuilder
```

---

## MemoryBuilder

Returned by `ModuleBuilder.defineMemory()`.

```typescript
withExport(name: string): MemoryBuilder
```

---

## TableBuilder

Returned by `ModuleBuilder.defineTable()`.

```typescript
defineElementSegment(elements: (FunctionBuilder | ImportBuilder)[], offset?: number | ((asm: InitExpressionEmitter) => void)): void
withExport(name: string): TableBuilder
```

---

## TagBuilder

Returned by `ModuleBuilder.defineTag()`. Describes an exception tag for use with `throw` / `catch`.

```typescript
// The function type describing the tag's parameter types
get funcType(): FuncTypeBuilder
```

---

## ImportBuilder

Returned by `ModuleBuilder.importFunction()`, `importMemory()`, `importTable()`, `importGlobal()`.

```typescript
// Properties
moduleName: string       // Import module namespace
fieldName: string        // Import name within the module
externalKind: ExternalKindType  // Function, Table, Memory, Global, or Tag
index: number            // Index in the module's import space

// Type guards
isFunctionImport(): boolean
isGlobalImport(): boolean
isMemoryImport(): boolean
isTableImport(): boolean
isTagImport(): boolean
```

---

## ExportBuilder

Returned by `ModuleBuilder.exportFunction()`, `exportMemory()`, `exportTable()`, `exportGlobal()`, and `exportTag()`. Not created directly.

```typescript
// Properties
name: string                   // Export name
externalKind: ExternalKindType // Function, Table, Memory, Global, or Tag
```

---

## FunctionParameterBuilder

Returned by `FunctionBuilder.getParameter(index)`. Represents a function parameter for use with `get_local` / `set_local`.

```typescript
// Properties
index: number                      // Parameter index
valueType: ValueTypeDescriptor     // The parameter's type
name: string | null                // Optional debug name

// Methods
withName(name: string): this       // Set a debug name for the parameter
```

---

## FuncTypeBuilder

Returned by `ModuleBuilder.defineFunctionType()`. Represents a function type signature, used with `call_indirect`.

```typescript
// Properties
index: number                          // Type index in the module
returnTypes: ValueTypeDescriptor[]     // Return types
parameterTypes: ValueTypeDescriptor[]  // Parameter types

// Methods
toSignature(): FuncTypeSignature       // Convert to a FuncTypeSignature
```

---

## DataSegmentBuilder

Returned by `ModuleBuilder.defineData()`. Configures a data segment for memory initialization.

```typescript
// Methods
passive(): this                        // Mark as passive (not placed until memory.init)
memoryIndex(index: number): this       // Set target memory index (for multi-memory)
offset(value: number | bigint | GlobalBuilder | ((asm: InitExpressionEmitter) => void)): void
                                       // Set the memory offset for an active segment
```

**Example:**
```typescript
// Active segment at offset 0
mod.defineData(new Uint8Array([1, 2, 3]), 0);

// Passive segment (placed later with memory.init)
mod.defineData(new Uint8Array([4, 5, 6])).passive();
```

---

## ElementSegmentBuilder

Returned by `ModuleBuilder.defineElementSegment()` or `definePassiveElementSegment()`. Configures an element segment for table initialization.

```typescript
// Methods
passive(): this                        // Mark as passive (not placed until table.init)
offset(value: number | GlobalBuilder | ((asm: InitExpressionEmitter) => void)): void
                                       // Set the table offset for an active segment
```

**Example:**
```typescript
// Active element segment at table offset 0
mod.defineElementSegment(table, [func1, func2], 0);

// Passive element segment
mod.definePassiveElementSegment([func1, func2]);
```

---

## CustomSectionBuilder

Returned by `ModuleBuilder.defineCustomSection()`. Defines a custom section in the WASM binary.

```typescript
// Properties
name: string          // Section name

// Constructor (called via ModuleBuilder)
mod.defineCustomSection(name: string, data?: Uint8Array): CustomSectionBuilder
```

---

## PackageBuilder

Builds multi-module packages with automatic dependency wiring.

```typescript
import { PackageBuilder } from 'webasmjs';

const pkg = new PackageBuilder();

// Define modules
const mathMod = pkg.defineModule('math');
const mainMod = pkg.defineModule('main');

// Declare dependencies (main imports from math)
pkg.addDependency('main', 'math');

// Compile all modules
const compiled = await pkg.compile();

// Instantiate all modules with imports wired
const instances = await pkg.instantiate();
```

### Methods

```typescript
defineModule(name: string, options?: ModuleBuilderOptions): ModuleBuilder
addDependency(moduleName: string, dependsOn: string): void
getModule(name: string): ModuleBuilder | undefined
compile(): Promise<CompiledPackage>
instantiate(imports?: { [moduleName: string]: WebAssembly.Imports }): Promise<InstantiatedPackage>
```

---

## LocalBuilder

Returned by `FunctionEmitter.declareLocal()`. Represents a local variable within a function.

```typescript
index: number              // Local index (including parameters)
valueType: ValueTypeDescriptor  // The local's type
name: string | null        // Optional debug name
```

---

## LabelBuilder

Returned by control flow instructions (`block()`, `loop()`, `if()`). Used as the target for branch instructions.

```typescript
// Returned by:
const label = a.block(BlockType.Int32);
const label = a.loop(BlockType.Void);

// Used with:
a.br(label);
a.br_if(label);
a.br_table(defaultLabel, label1, label2);
```

---

## StructTypeBuilder

Returned by `ModuleBuilder.defineStructType()` or `RecGroupBuilder.addStructType()`. Requires the `gc` feature.

```typescript
// Properties
index: number          // Type index in the module
fields: StructField[]  // Field definitions
final: boolean         // Whether subtyping is allowed

// Methods
getFieldIndex(name: string): number  // Look up field by name
```

**StructField:**
```typescript
{ name: string, type: ValueTypeDescriptor, mutable: boolean }
```

**StructTypeOptions:**
```typescript
{ superTypes?: { index: number }[], final?: boolean }
```

---

## ArrayTypeBuilder

Returned by `ModuleBuilder.defineArrayType()` or `RecGroupBuilder.addArrayType()`. Requires the `gc` feature.

```typescript
// Properties
index: number                   // Type index in the module
elementType: ValueTypeDescriptor  // Element type
mutable: boolean                // Whether elements are mutable
final: boolean                  // Whether subtyping is allowed
```

**ArrayTypeOptions:**
```typescript
{ superTypes?: { index: number }[], final?: boolean }
```

---

## RecGroupBuilder

Defines a group of mutually recursive types. Created via `ModuleBuilder.defineRecGroup()`.

```typescript
ModuleBuilder.defineRecGroup((rec) => {
  const nodeType = rec.addStructType([...]);
  const listType = rec.addArrayType(rec.ref(0), true);
});
```

### Methods

```typescript
addStructType(fields: StructField[], options?: StructTypeOptions): StructTypeBuilder
addArrayType(elementType: ValueTypeDescriptor, mutable: boolean, options?: ArrayTypeOptions): ArrayTypeBuilder
addFuncType(returnTypes: ValueTypeDescriptor[], parameterTypes: ValueTypeDescriptor[]): FuncTypeBuilder
ref(groupRelativeIndex: number): ConcreteRefTypeDescriptor     // Non-nullable ref to type in group
refNull(groupRelativeIndex: number): ConcreteRefTypeDescriptor // Nullable ref to type in group
```

---

## TextModuleWriter

Generates WAT text format from a `ModuleBuilder`.

```typescript
import { TextModuleWriter } from 'webasmjs';

const writer = new TextModuleWriter(moduleBuilder);
const wat = writer.toString();
```

Also available via `moduleBuilder.toString()`.

---

## BinaryReader

Reads and parses compiled WASM binary format.

```typescript
import { BinaryReader } from 'webasmjs';

const reader = new BinaryReader(wasmBytes);
const info = reader.read();

// info.version, info.types, info.functions, info.memories,
// info.globals, info.exports, info.nameSection, etc.
```

---

## parseWat

Parses WAT text format into a `ModuleBuilder`.

```typescript
import { parseWat } from 'webasmjs';

const mod = parseWat(`
  (module
    (func $add (param i32) (param i32) (result i32)
      local.get 0
      local.get 1
      i32.add
    )
    (export "add" (func $add))
  )
`);

const instance = await mod.instantiate();
```

---

## Enums

### ValueType

```typescript
ValueType.Int32    // i32
ValueType.Int64    // i64
ValueType.Float32  // f32
ValueType.Float64  // f64
ValueType.V128     // v128 (128-bit SIMD vector)

// Reference types (GC)
ValueType.FuncRef      // funcref
ValueType.ExternRef    // externref
ValueType.AnyRef       // anyref
ValueType.EqRef        // eqref
ValueType.I31Ref       // i31ref
ValueType.StructRef    // structref
ValueType.ArrayRef     // arrayref
ValueType.NullRef      // nullref
ValueType.NullFuncRef  // nullfuncref
ValueType.NullExternRef // nullexternref
```

### BlockType

```typescript
BlockType.Void     // block produces no value
BlockType.Int32    // block produces an i32
BlockType.Int64    // block produces an i64
BlockType.Float32  // block produces an f32
BlockType.Float64  // block produces an f64
BlockType.V128     // block produces a v128
```

### ElementType

```typescript
ElementType.AnyFunc  // function reference (for tables)
```

### ExternalKind

```typescript
ExternalKind.Function
ExternalKind.Table
ExternalKind.Memory
ExternalKind.Global
```

### WasmTarget

```typescript
'mvp'     // WebAssembly 1.0 — no extensions
'2.0'     // WebAssembly 2.0 — widely deployed post-MVP features
'3.0'     // WebAssembly 3.0 — all standardized features
'latest'  // Everything in 3.0 + newly standardized extensions (default)
```

### HeapType

Used with GC reference operations (`ref_null`, `ref_test`, `ref_cast`).

```typescript
HeapType.Func       // 0x70 — function references
HeapType.Extern     // 0x6f — external references
HeapType.Any        // 0x6e — any reference (GC top type)
HeapType.Eq         // 0x6d — equatable references
HeapType.I31        // 0x6c — i31 references
HeapType.Struct     // 0x6b — struct references
HeapType.Array      // 0x6a — array references
HeapType.None       // 0x71 — null reference (bottom type)
HeapType.NoFunc     // 0x73 — null function reference
HeapType.NoExtern   // 0x72 — null external reference
```

### Reference Type Utilities

```typescript
// Create concrete reference types (for struct/array type indices)
refType(typeIndex: number): ConcreteRefTypeDescriptor      // Non-nullable ref
refNullType(typeIndex: number): ConcreteRefTypeDescriptor  // Nullable ref
```

### Shorthand Type Aliases

Convenience re-exports of `ValueType` constants for more concise code:

| Alias | Equivalent |
|-------|-----------|
| `i32` | `ValueType.Int32` |
| `i64` | `ValueType.Int64` |
| `f32` | `ValueType.Float32` |
| `f64` | `ValueType.Float64` |
| `v128` | `ValueType.V128` |
| `funcref` | `ValueType.FuncRef` |
| `externref` | `ValueType.ExternRef` |
| `anyref` | `ValueType.AnyRef` |
| `eqref` | `ValueType.EqRef` |
| `i31ref` | `ValueType.I31Ref` |
| `structref` | `ValueType.StructRef` |
| `arrayref` | `ValueType.ArrayRef` |

### Struct Field DSL

`mut(type)` — wraps a value type as a mutable struct field descriptor. Used with `defineStructType()` when passing fields as an object:

```typescript
import { ModuleBuilder, i32, f64, mut } from 'webasmjs';

const mod = new ModuleBuilder('example', { target: 'latest' });
const pointType = mod.defineStructType({ x: mut(i32), y: mut(i32), velocity: f64 });
```

### WasmFeature

```typescript
'sign-extend' | 'sat-trunc' | 'bulk-memory' | 'reference-types' | 'simd'
| 'multi-value' | 'mutable-globals' | 'tail-call' | 'extended-const'
| 'threads' | 'exception-handling' | 'multi-memory' | 'multi-table'
| 'relaxed-simd' | 'memory64' | 'gc'
```

---

## VerificationError

Thrown when control flow or operand stack verification fails during `toBytes()` or `instantiate()`. Extends `Error`.

```typescript
import { ModuleBuilder, VerificationError } from 'webasmjs';

try {
  mod.toBytes();
} catch (e) {
  if (e instanceof VerificationError) {
    console.log(e.message);
  }
}
```
