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
defineFuncType(returnTypes: ValueType[], parameterTypes: ValueType[]): FuncTypeBuilder

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
): void

// Import a global
importGlobal(
  module: string,
  name: string,
  valueType: ValueType,
  mutable: boolean
): ImportBuilder
```

#### Tags

```typescript
// Define an exception tag
defineTag(parameters: ValueType[]): TagBuilder
```

#### Exports

```typescript
exportFunction(func: FunctionBuilder, exportName?: string): void
exportMemory(mem: MemoryBuilder, name: string): void
exportTable(table: TableBuilder, name: string): void
exportGlobal(global: GlobalBuilder, name: string): void
```

#### Memory

```typescript
defineMemory(initial: number, maximum?: number, shared?: boolean, memory64?: boolean): MemoryBuilder
defineData(data: Uint8Array, offset: number): DataSegmentBuilder
```

#### Tables

```typescript
defineTable(elementType: ElementType, initial: number, maximum?: number): TableBuilder
defineTableSegment(
  table: TableBuilder,
  functions: FunctionBuilder[],
  offset: number
): ElementSegmentBuilder
```

#### Passive Element Segments

```typescript
// Define a passive element segment (for use with table.init)
definePassiveElementSegment(elements: FunctionBuilder[]): ElementSegmentBuilder
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
br_table(labels: LabelBuilder[], defaultLabel: LabelBuilder): void
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
defineSegment(functions: FunctionBuilder[], offset: number): ElementSegmentBuilder
withExport(name: string): TableBuilder
```

---

## TextModuleWriter

Generates WAT text format from a `ModuleBuilder`.

```typescript
import { TextModuleWriter } from 'webasmjs';

const writer = new TextModuleWriter();
const wat = writer.write(moduleBuilder);
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

### WasmFeature

```typescript
'sign-extend' | 'sat-trunc' | 'bulk-memory' | 'reference-types' | 'simd'
| 'multi-value' | 'mutable-globals' | 'tail-call' | 'extended-const'
| 'threads' | 'exception-handling' | 'multi-memory' | 'multi-table'
| 'relaxed-simd' | 'memory64' | 'gc'
```
