# Examples

## Factorial

Iterative factorial using a loop with block/break pattern:

```typescript
import { ModuleBuilder, ValueType, BlockType } from 'webasmjs';

const mod = new ModuleBuilder('factorial');

mod.defineFunction('factorial', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const result = a.declareLocal(ValueType.Int32, 'result');
  const i = a.declareLocal(ValueType.Int32, 'i');

  a.const_i32(1);
  a.set_local(result);
  a.const_i32(1);
  a.set_local(i);

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
      a.get_local(i);
      a.get_local(n);
      a.gt_i32();
      a.br_if(breakLabel);

      a.get_local(result);
      a.get_local(i);
      a.mul_i32();
      a.set_local(result);

      a.get_local(i);
      a.const_i32(1);
      a.add_i32();
      a.set_local(i);
      a.br(loopLabel);
    });
  });

  a.get_local(result);
}).withExport();

const instance = await mod.instantiate();
const factorial = instance.instance.exports.factorial as Function;

for (let n = 0; n <= 10; n++) {
  console.log(`${n}! = ${factorial(n)}`);
}
```

## Fibonacci

Iterative Fibonacci sequence:

```typescript
import { ModuleBuilder, ValueType, BlockType } from 'webasmjs';

const mod = new ModuleBuilder('fibonacci');

mod.defineFunction('fib', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const prev = a.declareLocal(ValueType.Int32, 'prev');
  const curr = a.declareLocal(ValueType.Int32, 'curr');
  const temp = a.declareLocal(ValueType.Int32, 'temp');
  const i = a.declareLocal(ValueType.Int32, 'i');

  // Base case: n <= 1, return n
  a.get_local(n);
  a.const_i32(1);
  a.le_i32();
  a.if(BlockType.Void, () => {
    a.get_local(n);
    a.return();
  });

  a.const_i32(0);
  a.set_local(prev);
  a.const_i32(1);
  a.set_local(curr);
  a.const_i32(2);
  a.set_local(i);

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
      a.get_local(i);
      a.get_local(n);
      a.gt_i32();
      a.br_if(breakLabel);

      a.get_local(curr);
      a.set_local(temp);
      a.get_local(curr);
      a.get_local(prev);
      a.add_i32();
      a.set_local(curr);
      a.get_local(temp);
      a.set_local(prev);

      a.get_local(i);
      a.const_i32(1);
      a.add_i32();
      a.set_local(i);
      a.br(loopLabel);
    });
  });

  a.get_local(curr);
}).withExport();

const instance = await mod.instantiate();
const fib = instance.instance.exports.fib as Function;

for (let n = 0; n <= 15; n++) {
  console.log(`fib(${n}) = ${fib(n)}`);
}
```

## Memory Operations

Store and load values in linear memory:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('memoryExample');
const mem = mod.defineMemory(1); // 1 page = 64KB
mod.exportMemory(mem, 'memory');

mod.defineFunction('store', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // address
  a.get_local(f.getParameter(1)); // value
  a.store_i32(2, 0);
}).withExport();

mod.defineFunction('load', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // address
  a.load_i32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { store, load } = instance.instance.exports as any;

store(0, 42);
store(4, 100);
console.log(load(0));  // 42
console.log(load(4));  // 100
```

## Table Dispatch (Indirect Calls)

Use a function table for dynamic dispatch:

```typescript
import { ModuleBuilder, ValueType, ElementType } from 'webasmjs';

const mod = new ModuleBuilder('tableDispatch');

const add = mod.defineFunction('add', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
});

const sub = mod.defineFunction('sub', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.sub_i32();
});

const mul = mod.defineFunction('mul', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
});

// Create table and populate it
const table = mod.defineTable(ElementType.AnyFunc, 3);
mod.defineTableSegment(table, [add, sub, mul], 0);

// Dispatcher: calls table[opIndex](a, b)
mod.defineFunction('dispatch', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1)); // first arg
  a.get_local(f.getParameter(2)); // second arg
  a.get_local(f.getParameter(0)); // table index
  a.call_indirect(add.funcTypeBuilder);
}).withExport();

const instance = await mod.instantiate();
const dispatch = instance.instance.exports.dispatch as Function;

console.log(dispatch(0, 10, 3)); // add(10, 3) = 13
console.log(dispatch(1, 10, 3)); // sub(10, 3) = 7
console.log(dispatch(2, 10, 3)); // mul(10, 3) = 30
```

## Importing Host Functions

Call JavaScript functions from WebAssembly:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('imports');

// Declare imports
const printImport = mod.importFunction('env', 'print', null, [ValueType.Int32]);
const getTimeImport = mod.importFunction('env', 'getTime', [ValueType.Int32], []);

mod.defineFunction('run', null, [], (f, a) => {
  a.call(getTimeImport);
  a.call(printImport);

  a.const_i32(42);
  a.call(printImport);
}).withExport();

// Provide the imports at instantiation
const instance = await mod.instantiate({
  env: {
    print: (v: number) => console.log('WASM says:', v),
    getTime: () => Date.now() & 0x7fffffff,
  },
});

(instance.instance.exports.run as Function)();
```

## Global Variables

Mutable globals for state across function calls:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('globals');

const counter = mod.defineGlobal(ValueType.Int32, true, 0);

mod.defineFunction('increment', [ValueType.Int32], [], (f, a) => {
  a.get_global(counter);
  a.const_i32(1);
  a.add_i32();
  a.set_global(counter);
  a.get_global(counter);
}).withExport();

mod.defineFunction('getCount', [ValueType.Int32], [], (f, a) => {
  a.get_global(counter);
}).withExport();

const instance = await mod.instantiate();
const { increment, getCount } = instance.instance.exports as any;

console.log(getCount());  // 0
increment();
increment();
increment();
console.log(getCount());  // 3
```

## Floating-Point Distance

Using f64 operations to compute Euclidean distance:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('floatMath');

mod.defineFunction('distance', [ValueType.Float64],
  [ValueType.Float64, ValueType.Float64, ValueType.Float64, ValueType.Float64], (f, a) => {
  const dx = a.declareLocal(ValueType.Float64, 'dx');
  const dy = a.declareLocal(ValueType.Float64, 'dy');

  // dx = x2 - x1
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.sub_f64();
  a.set_local(dx);

  // dy = y2 - y1
  a.get_local(f.getParameter(3));
  a.get_local(f.getParameter(1));
  a.sub_f64();
  a.set_local(dy);

  // sqrt(dx*dx + dy*dy)
  a.get_local(dx);
  a.get_local(dx);
  a.mul_f64();
  a.get_local(dy);
  a.get_local(dy);
  a.mul_f64();
  a.add_f64();
  a.sqrt_f64();
}).withExport();

const instance = await mod.instantiate();
const distance = instance.instance.exports.distance as Function;

console.log(distance(0, 0, 3, 4)); // 5
```

## Parsing WAT Text

Parse WAT source code into a module:

```typescript
import { parseWat } from 'webasmjs';

const mod = parseWat(`
  (module $math
    (func $add (param i32) (param i32) (result i32)
      local.get 0
      local.get 1
      i32.add
    )
    (func $mul (param i32) (param i32) (result i32)
      local.get 0
      local.get 1
      i32.mul
    )
    (export "add" (func $add))
    (export "mul" (func $mul))
  )
`);

const instance = await mod.instantiate();
const { add, mul } = instance.instance.exports as any;

console.log(add(3, 4));  // 7
console.log(mul(6, 7));  // 42
```

## Data Segments

Pre-populate memory with data:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('dataSegment');
mod.defineMemory(1);

// Store "Hello" at offset 0
const greeting = new TextEncoder().encode('Hello');
mod.defineData(new Uint8Array([...greeting, 0]), 0); // null-terminated

// Read a byte at an address
mod.defineFunction('readByte', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load8_u_i32(0, 0);
}).withExport();

const instance = await mod.instantiate();
const readByte = instance.instance.exports.readByte as Function;

console.log(readByte(0));  // 72 ('H')
console.log(readByte(1));  // 101 ('e')
console.log(readByte(4));  // 111 ('o')
console.log(readByte(5));  // 0 (null terminator)
```

## SIMD Vector Addition

Add two arrays of four floats using 128-bit SIMD instructions:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('simdAdd');
mod.defineMemory(1);

// vec4_add: adds four f32 values starting at [srcA] and [srcB], stores result at [dst]
mod.defineFunction('vec4_add', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  const srcA = f.getParameter(0);
  const srcB = f.getParameter(1);
  const dst  = f.getParameter(2);

  // Push destination address first (store expects [addr, value] on stack)
  a.get_local(dst);
  // Load 128-bit vectors from memory and add
  a.get_local(srcA);
  a.load_v128(2, 0);   // load 4 x f32 from srcA
  a.get_local(srcB);
  a.load_v128(2, 0);   // load 4 x f32 from srcB
  a.add_f32x4();        // SIMD add: 4 floats at once
  // Store result (v128 is on top, addr below)
  a.store_v128(2, 0);
}).withExport();

// Helper to write an f32 at a byte offset
mod.defineFunction('setF32', null,
  [ValueType.Int32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_f32(2, 0);
}).withExport();

// Helper to read an f32 at a byte offset
mod.defineFunction('getF32', [ValueType.Float32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_f32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { vec4_add, setF32, getF32 } = instance.instance.exports as any;

// Write vector A at offset 0:  [1.0, 2.0, 3.0, 4.0]
// Write vector B at offset 16: [10.0, 20.0, 30.0, 40.0]
for (let i = 0; i < 4; i++) {
  setF32(i * 4, i + 1);          // A[i] = i+1
  setF32(16 + i * 4, (i + 1) * 10); // B[i] = (i+1)*10
}

vec4_add(0, 16, 32); // result at offset 32

for (let i = 0; i < 4; i++) {
  console.log(`result[${i}] = ${getF32(32 + i * 4)}`);
  // 11, 22, 33, 44
}
```

## SIMD Dot Product

Compute a dot product of two 4-element float vectors using SIMD multiply and lane extraction:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('simdDot');
mod.defineMemory(1);

// dot4: dot product of two f32x4 vectors in memory
mod.defineFunction('dot4', [ValueType.Float32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const srcA = f.getParameter(0);
  const srcB = f.getParameter(1);

  // Load and multiply element-wise
  a.get_local(srcA);
  a.load_v128(2, 0);
  a.get_local(srcB);
  a.load_v128(2, 0);
  a.mul_f32x4();

  // Extract all 4 lanes and sum them
  const products = a.declareLocal(ValueType.V128, 'products');
  a.set_local(products);

  a.get_local(products);
  a.extract_lane_f32x4(0);
  a.get_local(products);
  a.extract_lane_f32x4(1);
  a.add_f32();
  a.get_local(products);
  a.extract_lane_f32x4(2);
  a.add_f32();
  a.get_local(products);
  a.extract_lane_f32x4(3);
  a.add_f32();
}).withExport();

// setF32 helper
mod.defineFunction('setF32', null,
  [ValueType.Int32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_f32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { dot4, setF32 } = instance.instance.exports as any;

// A = [1, 2, 3, 4], B = [5, 6, 7, 8]
const a = [1, 2, 3, 4];
const b = [5, 6, 7, 8];
for (let i = 0; i < 4; i++) {
  setF32(i * 4, a[i]);
  setF32(16 + i * 4, b[i]);
}

console.log(`dot([1,2,3,4], [5,6,7,8]) = ${dot4(0, 16)}`); // 70
```

## Bulk Memory Operations

Use `memory.fill` and `memory.copy` to manipulate memory regions efficiently:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('bulkMemory');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Fill a region of memory with a byte value
// fill(dest, value, length)
mod.defineFunction('fill', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // dest
  a.get_local(f.getParameter(1)); // value
  a.get_local(f.getParameter(2)); // length
  a.memory_fill(0);
}).withExport();

// Copy a region of memory to another location
// copy(dest, src, length)
mod.defineFunction('copy', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // dest
  a.get_local(f.getParameter(1)); // src
  a.get_local(f.getParameter(2)); // length
  a.memory_copy(0, 0);
}).withExport();

const instance = await mod.instantiate();
const { fill, copy, memory } = instance.instance.exports as any;
const view = new Uint8Array(memory.buffer);

// Fill 8 bytes starting at offset 0 with 0xAA
fill(0, 0xAA, 8);
console.log('After fill:', Array.from(view.slice(0, 8)));
// [170, 170, 170, 170, 170, 170, 170, 170]

// Copy those 8 bytes to offset 16
copy(16, 0, 8);
console.log('After copy:', Array.from(view.slice(16, 24)));
// [170, 170, 170, 170, 170, 170, 170, 170]
```

## Reference Types

Use function references with `ref.func`, `ref.null`, and `ref.is_null`:

```typescript
import { ModuleBuilder, ValueType, ElementType } from 'webasmjs';

const mod = new ModuleBuilder('refTypes');

const double = mod.defineFunction('double', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
});

// Check if a function reference is null
mod.defineFunction('isRefNull', [ValueType.Int32], [], (f, a) => {
  a.ref_null(0x70);    // push a null funcref
  a.ref_is_null();     // returns 1 (true)
}).withExport();

// Check a real function reference
mod.defineFunction('isFuncNull', [ValueType.Int32], [], (f, a) => {
  a.ref_func(double);  // push ref to 'double'
  a.ref_is_null();     // returns 0 (false)
}).withExport();

const instance = await mod.instantiate();
const { isRefNull, isFuncNull } = instance.instance.exports as any;

console.log(`null ref is null: ${isRefNull()}`);   // 1
console.log(`func ref is null: ${isFuncNull()}`);   // 0
```

## Sign Extension and Saturating Truncation

Safe numeric operations from the post-MVP proposals:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('postMVP');

// Sign-extend: treat the low 8 bits of an i32 as a signed byte
mod.defineFunction('extend8', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.extend8_s_i32();
}).withExport();

// Sign-extend: treat the low 16 bits of an i32 as a signed i16
mod.defineFunction('extend16', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.extend16_s_i32();
}).withExport();

// Saturating truncation: f64 → i32 without trapping on overflow
mod.defineFunction('saturate', [ValueType.Int32], [ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.trunc_sat_f64_s_i32();
}).withExport();

const instance = await mod.instantiate();
const { extend8, extend16, saturate } = instance.instance.exports as any;

// 0xFF = 255 unsigned, but -1 as a signed byte
console.log(`extend8(0xFF) = ${extend8(0xFF)}`);       // -1
console.log(`extend8(0x80) = ${extend8(0x80)}`);       // -128
console.log(`extend16(0xFFFF) = ${extend16(0xFFFF)}`); // -1

// Saturating truncation clamps instead of trapping
console.log(`saturate(42.9) = ${saturate(42.9)}`);     // 42
console.log(`saturate(1e20) = ${saturate(1e20)}`);     // 2147483647 (i32 max)
console.log(`saturate(-1e20) = ${saturate(-1e20)}`);   // -2147483648 (i32 min)
console.log(`saturate(NaN) = ${saturate(NaN)}`);       // 0
```

## Custom Sections

Embed arbitrary metadata in a WASM module:

```typescript
import { ModuleBuilder, BinaryReader } from 'webasmjs';

const mod = new ModuleBuilder('customSection');

// Add custom metadata
const encoder = new TextEncoder();
mod.defineCustomSection('author', encoder.encode('webasmjs'));
mod.defineCustomSection('version', encoder.encode('1.0.0'));

mod.defineFunction('noop', null, [], (f, a) => {
  a.nop();
}).withExport();

// Read back custom sections from the binary
const bytes = mod.toBytes();
const reader = new BinaryReader(bytes);
const info = reader.read();

for (const section of info.customSections) {
  const text = new TextDecoder().decode(section.data);
  console.log(`${section.name}: ${text}`);
}
// author: webasmjs
// version: 1.0.0
```
