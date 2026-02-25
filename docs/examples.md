# Examples

> For all 112 interactive examples, see the [playground](https://devnamedzed.github.io/webasmjs/).
> The playground includes additional coverage for atomics, memory64, relaxed SIMD, tail calls, imports, and GC struct DSL.
> This page covers the most important patterns in detail.

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
mod.defineElementSegment(table, [add, sub, mul], 0);

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

## Target System

Show how to use targets and feature flags:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

// Default: target 'latest' — all features enabled
const mod1 = new ModuleBuilder('latest');

// Target WebAssembly 2.0 — only widely-deployed features
const mod2 = new ModuleBuilder('compat', { target: '2.0' });

// MVP with specific features added
const mod3 = new ModuleBuilder('custom', {
  target: 'mvp',
  features: ['simd', 'bulk-memory'],
});

// Check if a feature is available
console.log(mod1.hasFeature('threads'));      // true
console.log(mod2.hasFeature('threads'));      // false
console.log(mod3.hasFeature('simd'));         // true
console.log(mod3.hasFeature('threads'));      // false
```

## Multi-Value Returns

Function returning two values:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('multiValue');

// divmod returns both quotient and remainder
mod.defineFunction('divmod', [ValueType.Int32, ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const dividend = f.getParameter(0);
  const divisor = f.getParameter(1);

  // quotient
  a.get_local(dividend);
  a.get_local(divisor);
  a.div_s_i32();

  // remainder
  a.get_local(dividend);
  a.get_local(divisor);
  a.rem_s_i32();
}).withExport();

const instance = await mod.instantiate();
const divmod = instance.instance.exports.divmod as Function;

const [quotient, remainder] = divmod(17, 5);
console.log(`17 / 5 = ${quotient} remainder ${remainder}`); // 17 / 5 = 3 remainder 2
```

## Mutable Global Export

Export a mutable global so JavaScript can read it:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('mutableGlobal');

const counter = mod.defineGlobal(ValueType.Int32, true, 0);
mod.exportGlobal(counter, 'counter');

mod.defineFunction('increment', null, [], (f, a) => {
  a.get_global(counter);
  a.const_i32(1);
  a.add_i32();
  a.set_global(counter);
}).withExport();

const instance = await mod.instantiate();
const { increment, counter: counterGlobal } = instance.instance.exports as any;

console.log(counterGlobal.value);  // 0
increment();
increment();
increment();
console.log(counterGlobal.value);  // 3
```

## Tail Calls

Tail-recursive factorial using `return_call` — no stack overflow for deep recursion:

```typescript
import { ModuleBuilder, ValueType, BlockType } from 'webasmjs';

const mod = new ModuleBuilder('tailCall');

// Helper: tail-recursive accumulator
const factHelper = mod.defineFunction('fact_helper', [ValueType.Int64],
  [ValueType.Int64, ValueType.Int64], (f, a) => {
  const n = f.getParameter(0);
  const acc = f.getParameter(1);

  // if n <= 1, return acc
  a.get_local(n);
  a.const_i64(1n);
  a.le_s_i64();
  a.if(BlockType.Void, () => {
    a.get_local(acc);
    a.return();
  });

  // return_call fact_helper(n - 1, n * acc)
  a.get_local(n);
  a.const_i64(1n);
  a.sub_i64();
  a.get_local(n);
  a.get_local(acc);
  a.mul_i64();
  a.return_call(factHelper);
});

// Public entry point
mod.defineFunction('factorial', [ValueType.Int64], [ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i64(1n);
  a.call(factHelper);
}).withExport();

const instance = await mod.instantiate();
const factorial = instance.instance.exports.factorial as Function;

console.log(factorial(20n));  // 2432902008176640000n
```

## Shared Memory and Atomics

Use shared memory with atomic operations for thread-safe access:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('atomics');

// Shared memory requires both initial and maximum size
const mem = mod.defineMemory(1, 10, true); // shared = true
mod.exportMemory(mem, 'memory');

// Atomic increment: atomically adds 1 to the i32 at the given address
mod.defineFunction('atomicIncrement', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // address
  a.const_i32(1);                  // value to add
  a.atomic_rmw_add_i32(2, 0);     // returns old value
}).withExport();

// Atomic load: read an i32 atomically
mod.defineFunction('atomicLoad', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.atomic_load_i32(2, 0);
}).withExport();

// Atomic store: write an i32 atomically
mod.defineFunction('atomicStore', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // address
  a.get_local(f.getParameter(1)); // value
  a.atomic_store_i32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { atomicIncrement, atomicLoad, atomicStore } = instance.instance.exports as any;

atomicStore(0, 100);
console.log(atomicLoad(0));         // 100
atomicIncrement(0);
atomicIncrement(0);
console.log(atomicLoad(0));         // 102
```

## Exception Handling

Define exception tags and throw exceptions:

```typescript
import { ModuleBuilder, ValueType, BlockType } from 'webasmjs';

const mod = new ModuleBuilder('exceptions');

// Define a tag with an i32 payload (like an error code)
const errorTag = mod.defineTag([ValueType.Int32]);

// Function that throws when input is negative
mod.defineFunction('checkPositive', null, [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(0);
  a.lt_s_i32();
  a.if(BlockType.Void, () => {
    a.get_local(f.getParameter(0));
    a.throw(errorTag._index);
  });
}).withExport();

const bytes = mod.toBytes();
console.log(`Module compiled: ${bytes.length} bytes`);

// WAT output shows the tag and throw instruction
const wat = mod.toString();
console.log(wat);
```

## Memory64

Use 64-bit addressed memory for very large address spaces:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('memory64');

// memory64 flag makes addresses 64-bit
const mem = mod.defineMemory(1, 100, false, true); // memory64 = true
mod.exportMemory(mem, 'memory');

// Store: address is i64
mod.defineFunction('store64', null, [ValueType.Int64, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // i64 address
  a.get_local(f.getParameter(1)); // i32 value
  a.store_i32(2, 0);
}).withExport();

// Load: address is i64
mod.defineFunction('load64', [ValueType.Int32], [ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0)); // i64 address
  a.load_i32(2, 0);
}).withExport();

// Compile to bytes (runtime instantiation requires engine support for memory64)
const bytes = mod.toBytes();
console.log(`Module compiled: ${bytes.length} bytes`);

const wat = mod.toString();
console.log(wat); // shows (memory i64 1 100)
```

## Extended Constants

Use arithmetic in global initialization expressions with the extended-const feature:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('extConst', {
  target: 'mvp',
  features: ['extended-const'],
});

// Base offset as an immutable global
const base = mod.defineGlobal(ValueType.Int32, false, 100);

// Computed global: base + 50 (uses i32.add in init expression)
const offset1 = mod.defineGlobal(ValueType.Int32, false, (asm) => {
  asm.get_global(base);
  asm.const_i32(50);
  asm.add_i32();
});

// Computed global: base * 3 (uses i32.mul in init expression)
const scaled = mod.defineGlobal(ValueType.Int32, false, (asm) => {
  asm.get_global(base);
  asm.const_i32(3);
  asm.mul_i32();
});

mod.defineFunction('getBase', [ValueType.Int32], [], (f, a) => {
  a.get_global(base);
}).withExport();

mod.defineFunction('getOffset1', [ValueType.Int32], [], (f, a) => {
  a.get_global(offset1);
}).withExport();

mod.defineFunction('getScaled', [ValueType.Int32], [], (f, a) => {
  a.get_global(scaled);
}).withExport();

const instance = await mod.instantiate();
const { getBase, getOffset1, getScaled } = instance.instance.exports as any;

console.log(getBase());     // 100
console.log(getOffset1());  // 150
console.log(getScaled());   // 300
```

## Multi-Memory

Define and use multiple linear memories in a single module:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('multiMem', {
  target: 'mvp',
  features: ['multi-memory'],
});

const mem0 = mod.defineMemory(1);
mod.exportMemory(mem0, 'mem0');
const mem1 = mod.defineMemory(1);
mod.exportMemory(mem1, 'mem1');

// Store to memory 0
mod.defineFunction('store0', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0, 0); // memIndex=0
}).withExport();

// Load from memory 0
mod.defineFunction('load0', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_i32(2, 0, 0); // memIndex=0
}).withExport();

// Store to memory 1
mod.defineFunction('store1', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0, 1); // memIndex=1
}).withExport();

// Load from memory 1
mod.defineFunction('load1', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_i32(2, 0, 1); // memIndex=1
}).withExport();

const bytes = mod.toBytes();
console.log(`Module compiled: ${bytes.length} bytes`);
console.log(`Valid: ${WebAssembly.validate(bytes.buffer)}`);
```

## Multi-Table

Define multiple function tables and dispatch through each:

```typescript
import { ModuleBuilder, ValueType, ElementType } from 'webasmjs';

const mod = new ModuleBuilder('multiTable', {
  target: 'mvp',
  features: ['multi-table'],
});

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

// Two tables with different function arrangements
const table0 = mod.defineTable(ElementType.AnyFunc, 3);
mod.defineElementSegment(table0, [add, sub, mul], 0);

const table1 = mod.defineTable(ElementType.AnyFunc, 2);
mod.defineElementSegment(table1, [mul, add], 0);

const bytes = mod.toBytes();
console.log(`Module compiled: ${bytes.length} bytes`);
console.log(`Valid: ${WebAssembly.validate(bytes.buffer)}`);
```

## Relaxed SIMD

Use relaxed SIMD operations for performance-sensitive vector code:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('relaxedSimd');
mod.defineMemory(1);

// relaxed_madd: a * b + c (fused multiply-add)
mod.defineFunction('madd_f32x4', null,
  [ValueType.Int32, ValueType.Int32,
   ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(3)); // dest address
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);  // load A
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);  // load B
  a.get_local(f.getParameter(2));
  a.load_v128(2, 0);  // load C
  a.relaxed_madd_f32x4();  // A * B + C
  a.store_v128(2, 0);
}).withExport();

const bytes = mod.toBytes();
console.log(`Module compiled: ${bytes.length} bytes`);
console.log(`Valid: ${WebAssembly.validate(bytes.buffer)}`);
```

## Atomic Read-Modify-Write Operations

Demonstrate all RMW variants: sub, and, or, xor, exchange on shared memory:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('atomicRMW');
const mem = mod.defineMemory(1, 10, true); // shared
mod.exportMemory(mem, 'memory');

mod.defineFunction('store', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_store_i32(2, 0);
}).withExport();

mod.defineFunction('load', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.atomic_load_i32(2, 0);
}).withExport();

// Each RMW op returns the old value
mod.defineFunction('atomicSub', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_sub_i32(2, 0);
}).withExport();

mod.defineFunction('atomicAnd', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_and_i32(2, 0);
}).withExport();

mod.defineFunction('atomicOr', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_or_i32(2, 0);
}).withExport();

mod.defineFunction('atomicXor', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_xor_i32(2, 0);
}).withExport();

mod.defineFunction('atomicXchg', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_xchg_i32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { store, load, atomicSub, atomicAnd, atomicXchg } = instance.instance.exports as any;

store(0, 100);
console.log(atomicSub(0, 30)); // old: 100, new value at addr 0 is 70
console.log(load(0));           // 70

store(0, 0xFF);
console.log(atomicAnd(0, 0x0F)); // old: 255, new: 15

store(0, 42);
console.log(atomicXchg(0, 99));  // old: 42, new: 99
```

## Atomic Wait, Notify & Fence

Thread synchronization primitives — wait/notify for blocking coordination, fence for memory ordering:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('waitNotify');
const mem = mod.defineMemory(1, 10, true);
mod.exportMemory(mem, 'memory');

// wait32(addr, expected, timeout_ns) -> 0=ok, 1=not-equal, 2=timed-out
mod.defineFunction('wait32', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.get_local(f.getParameter(2));
  a.atomic_wait32(2, 0);
}).withExport();

// notify(addr, count) -> number of waiters woken
mod.defineFunction('notify', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_notify(2, 0);
}).withExport();

// fence — full memory barrier
mod.defineFunction('fence', null, [], (f, a) => {
  a.atomic_fence(0);
}).withExport();

const bytes = mod.toBytes();
console.log(`Module compiled: ${bytes.length} bytes`);
console.log(`Valid: ${WebAssembly.validate(bytes.buffer)}`);

// In a multi-threaded setup:
// Thread A: wait32(addr, 0, -1n)  // block until value != 0
// Thread B: store(addr, 1); notify(addr, 1)  // wake thread A
```

## SIMD Integer Ops

Integer SIMD: i32x4 add, min, lane extract, and splat:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('simdInt');
mod.defineMemory(1);

// Add two i32x4 vectors
mod.defineFunction('add_i32x4', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.add_i32x4();
  a.store_v128(2, 0);
}).withExport();

// Element-wise min (signed)
mod.defineFunction('min_s_i32x4', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.min_s_i32x4();
  a.store_v128(2, 0);
}).withExport();

// Extract lane 0
mod.defineFunction('extract', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.extract_lane_i32x4(0);
}).withExport();

// Splat a scalar to all 4 lanes
mod.defineFunction('splat_i32x4', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // dest
  a.get_local(f.getParameter(1)); // scalar
  a.splat_i32x4();
  a.store_v128(2, 0);
}).withExport();
```

## SIMD Shuffle & Swizzle

Rearrange vector lanes with shuffle (static indices) and swizzle (dynamic indices):

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('simdShuffle');
mod.defineMemory(1);

// shuffle: pick 16 bytes from two source vectors by index
// Indices 0-15 = first vector, 16-31 = second vector
mod.defineFunction('interleave', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2)); // dest
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0); // vector A
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0); // vector B
  a.shuffle_i8x16(new Uint8Array([0, 16, 1, 17, 2, 18, 3, 19, 4, 20, 5, 21, 6, 22, 7, 23]));
  a.store_v128(2, 0);
}).withExport();

// Reverse bytes within a vector
mod.defineFunction('reverse', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1)); // dest
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.shuffle_i8x16(new Uint8Array([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]));
  a.store_v128(2, 0);
}).withExport();

// swizzle: rearrange bytes using a dynamic index vector
mod.defineFunction('swizzle', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2)); // dest
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0); // data
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0); // indices
  a.swizzle_i8x16();
  a.store_v128(2, 0);
}).withExport();
```

## SIMD Widen & Narrow

Convert between vector widths — narrow i16x8 to i8x16, extend i8x16 to i16x8:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('simdWidenNarrow');
mod.defineMemory(1);

// Narrow two i16x8 vectors into one i8x16 (saturating, unsigned)
mod.defineFunction('narrow_u', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.narrow_i16x8_u_i8x16();
  a.store_v128(2, 0);
}).withExport();

// Extend low half of i8x16 to i16x8 (signed)
mod.defineFunction('extend_low_s', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.extend_low_i8x16_s_i16x8();
  a.store_v128(2, 0);
}).withExport();
```

## SIMD Saturating Math

Saturating add/sub that clamp on overflow instead of wrapping:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('simdSat');
mod.defineMemory(1);

// Saturating unsigned add on i8x16
mod.defineFunction('add_sat_u', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.add_sat_u_i8x16();
  a.store_v128(2, 0);
}).withExport();

// Saturating unsigned sub on i8x16
mod.defineFunction('sub_sat_u', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.sub_sat_u_i8x16();
  a.store_v128(2, 0);
}).withExport();

// Regular (wrapping) add for comparison
mod.defineFunction('add_wrap', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.add_i8x16();
  a.store_v128(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { add_sat_u, sub_sat_u, add_wrap, setByte, getByte } = instance.instance.exports;

// A = [200, 100, 255, 0, 128, 50, 250, 10]
// B = [100, 200, 10, 5, 128, 250, 50, 0]
// add_sat_u: 200+100=255(clamped), 100+200=255, 255+10=255, ...
// add_wrap:  200+100=44(wrapped),   100+200=44, ...
```

## Passive Data Segments

Lazy-init memory with passive data segments and memory.init:

```typescript
import { ModuleBuilder, ValueType, BlockType } from 'webasmjs';

const mod = new ModuleBuilder('passiveData');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Passive segment: not placed in memory until memory.init is called
const greeting = new TextEncoder().encode('Hello, WebAssembly!');
const dataSegment = mod.defineData(new Uint8Array([...greeting]));

// Copy passive data into memory
mod.defineFunction('init', null, [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // destination offset
  a.const_i32(0);                  // source offset in data segment
  a.const_i32(19);                 // length
  a.memory_init(dataSegment._index, 0);
}).withExport();

// Drop data segment (free it after init)
mod.defineFunction('drop', null, [], (f, a) => {
  a.data_drop(dataSegment._index);
}).withExport();

const instance = await mod.instantiate();
const { init, drop: dataDrop, memory } = instance.instance.exports;
const view = new Uint8Array(memory.buffer);

// Memory starts empty (passive segment not yet loaded)
console.log('Before init:', view[0]); // 0

init(0); // Load passive data at offset 0
console.log('After init:', new TextDecoder().decode(view.slice(0, 19)));

dataDrop(); // Free the data segment
```

## Bulk Table Operations

table.fill and table.copy for bulk table manipulation:

```typescript
import { ModuleBuilder, ValueType, ElementType } from 'webasmjs';

const mod = new ModuleBuilder('bulkTable');

const add = mod.defineFunction('add', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

const mul = mod.defineFunction('mul', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
}).withExport();

const table = mod.defineTable(ElementType.AnyFunc, 8);
mod.defineElementSegment(table, [add, mul], 0);

// table.fill(start, ref, count)
mod.defineFunction('fillWithAdd', null, [], (f, a) => {
  a.const_i32(2);
  a.ref_func(add);
  a.const_i32(4);
  a.table_fill(0);
}).withExport();

// table.copy(dest, src, count)
mod.defineFunction('copySlots', null, [], (f, a) => {
  a.const_i32(6);
  a.const_i32(0);
  a.const_i32(2);
  a.table_copy(0, 0);
}).withExport();
```

## Table Get/Set/Grow

Dynamic table manipulation with table.get, table.set, and table.grow:

```typescript
import { ModuleBuilder, ValueType, ElementType } from 'webasmjs';

const mod = new ModuleBuilder('tableOps');

const double = mod.defineFunction('double', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
}).withExport();

const table = mod.defineTable(ElementType.AnyFunc, 2);
mod.defineElementSegment(table, [double], 0);

// table.set: place a function ref at an index
mod.defineFunction('setSlot', null, [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.ref_func(double);
  a.table_set(0);
}).withExport();

// table.grow: add N slots (returns old size, or -1 on failure)
mod.defineFunction('growTable', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.ref_null(0x70); // fill new slots with null
  a.get_local(f.getParameter(0));
  a.table_grow(0);
}).withExport();

// table.size
mod.defineFunction('size', [ValueType.Int32], [], (f, a) => {
  a.table_size(0);
}).withExport();

// Check if a slot is null
mod.defineFunction('isNull', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.table_get(0);
  a.ref_is_null();
}).withExport();
```

## Try/Catch Exception Handling

Full try/catch exception handling with multiple tags:

```typescript
import { ModuleBuilder, ValueType, BlockType } from 'webasmjs';

const mod = new ModuleBuilder('tryCatch');

// Define two exception tags with different payloads
const errorTag = mod.defineTag([ValueType.Int32]);     // error code
const overflowTag = mod.defineTag([ValueType.Int32]);  // overflow value

// Function that may throw
mod.defineFunction('checkedAdd', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);
  const result = a.declareLocal(ValueType.Int32, 'result');

  a.get_local(x);
  a.get_local(y);
  a.add_i32();
  a.set_local(result);

  // Check for "overflow" (result > 1000)
  a.get_local(result);
  a.const_i32(1000);
  a.gt_i32();
  a.if(BlockType.Void, () => {
    a.get_local(result);
    a.throw(overflowTag._index);
  });

  a.get_local(result);
}).withExport();

const bytes = mod.toBytes();
console.log(`Module compiled: ${bytes.length} bytes`);
console.log(`Valid: ${WebAssembly.validate(bytes.buffer)}`);
```

## f32 Math

Single-precision float operations — min, max, abs, neg, sqrt, and f32 vs f64 precision:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('f32math');

mod.defineFunction('min', [ValueType.Float32],
  [ValueType.Float32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.min_f32();
}).withExport();

mod.defineFunction('max', [ValueType.Float32],
  [ValueType.Float32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.max_f32();
}).withExport();

mod.defineFunction('abs', [ValueType.Float32],
  [ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.abs_f32();
}).withExport();

mod.defineFunction('sqrt', [ValueType.Float32],
  [ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.sqrt_f32();
}).withExport();

// Compare f32 vs f64 precision
mod.defineFunction('addF32', [ValueType.Float32],
  [ValueType.Float32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_f32();
}).withExport();

mod.defineFunction('addF64', [ValueType.Float64],
  [ValueType.Float64, ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_f64();
}).withExport();

const instance = await mod.instantiate();
const { min, max, abs, sqrt, addF32, addF64 } = instance.instance.exports;

console.log('min(3.14, 2.71) =', min(3.14, 2.71));
console.log('max(3.14, 2.71) =', max(3.14, 2.71));
console.log('abs(-42.5) =', abs(-42.5));
console.log('sqrt(9.0) =', sqrt(9.0));
console.log('f32: 0.1 + 0.2 =', addF32(0.1, 0.2));
console.log('f64: 0.1 + 0.2 =', addF64(0.1, 0.2));
```

## GC Struct Types

Define GC struct types with mutable fields, create instances, and read/write fields:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('gcStruct', {
  target: 'latest',
});

// Define a struct type with two mutable i32 fields
const Point = mod.defineStructType([
  { name: 'x', type: ValueType.Int32, mutable: true },
  { name: 'y', type: ValueType.Int32, mutable: true },
]);

// Create a Point and read the x field
mod.defineFunction('getX', [ValueType.Int32], [], (f, a) => {
  a.const_i32(10); // x = 10
  a.const_i32(20); // y = 20
  a.struct_new(Point.index);
  a.struct_get(Point.index, Point.getFieldIndex('x'));
}).withExport();

// Create a Point and read the y field
mod.defineFunction('getY', [ValueType.Int32], [], (f, a) => {
  a.const_i32(10);
  a.const_i32(20);
  a.struct_new(Point.index);
  a.struct_get(Point.index, Point.getFieldIndex('y'));
}).withExport();

// Create a counter, set it, and read it back
const Counter = mod.defineStructType([
  { name: 'count', type: ValueType.Int32, mutable: true },
]);

mod.defineFunction('setAndGet', [ValueType.Int32], [], (f, a) => {
  a.const_i32(0);
  a.struct_new(Counter.index);
  const ref = a.declareLocal(ValueType.AnyRef, 'ref');
  a.set_local(ref);

  // Set count = 42
  a.get_local(ref);
  a.const_i32(42);
  a.struct_set(Counter.index, Counter.getFieldIndex('count'));

  // Read count back
  a.get_local(ref);
  a.struct_get(Counter.index, Counter.getFieldIndex('count'));
}).withExport();

const bytes = mod.toBytes();
console.log(`Valid: ${WebAssembly.validate(bytes.buffer)}`);
```

## GC Struct Default Values

Zero-initialize a struct with `struct.new_default`:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('gcDefault', {
  target: 'latest',
});

const Vec3 = mod.defineStructType([
  { name: 'x', type: ValueType.Float32, mutable: true },
  { name: 'y', type: ValueType.Float32, mutable: true },
  { name: 'z', type: ValueType.Float32, mutable: true },
]);

// struct.new_default creates a struct with all fields zeroed
mod.defineFunction('defaultX', [ValueType.Float32], [], (f, a) => {
  a.struct_new_default(Vec3.index);
  a.struct_get(Vec3.index, Vec3.getFieldIndex('x')); // returns 0.0
}).withExport();

const bytes = mod.toBytes();
console.log(`Valid: ${WebAssembly.validate(bytes.buffer)}`);
```

## GC Array Types

Define GC array types — create, read, write, and get length:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('gcArray', {
  target: 'latest',
});

// Define a mutable array of i32
const IntArray = mod.defineArrayType(ValueType.Int32, true);

// Create an array of 5 elements, all initialized to 0
mod.defineFunction('createArray', null, [], (f, a) => {
  a.const_i32(0);  // default value
  a.const_i32(5);  // length
  a.array_new(IntArray.index);
  a.drop();
}).withExport();

// Get array length
mod.defineFunction('getLen', [ValueType.Int32], [], (f, a) => {
  a.const_i32(0);
  a.const_i32(10);
  a.array_new(IntArray.index);
  a.array_len();
}).withExport();

// Set and get an element
mod.defineFunction('setAndGet', [ValueType.Int32], [], (f, a) => {
  // Create array of length 3
  a.const_i32(0);
  a.const_i32(3);
  a.array_new(IntArray.index);
  const arr = a.declareLocal(ValueType.AnyRef, 'arr');
  a.set_local(arr);

  // Set index 1 to 99
  a.get_local(arr);
  a.const_i32(1);  // index
  a.const_i32(99); // value
  a.array_set(IntArray.index);

  // Get index 1
  a.get_local(arr);
  a.const_i32(1);
  a.array_get(IntArray.index);
}).withExport();

const bytes = mod.toBytes();
console.log(`Valid: ${WebAssembly.validate(bytes.buffer)}`);
```

## GC Fixed-Size Arrays

Create arrays from inline values with `array.new_fixed`:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('gcFixed', {
  target: 'latest',
});

const IntArray = mod.defineArrayType(ValueType.Int32, false);

// Create a fixed array [10, 20, 30] and sum it
mod.defineFunction('sumFixed', [ValueType.Int32], [], (f, a) => {
  // Push values, then array.new_fixed(typeIndex, count)
  a.const_i32(10);
  a.const_i32(20);
  a.const_i32(30);
  a.array_new_fixed(IntArray.index, 3);

  const arr = a.declareLocal(ValueType.AnyRef, 'arr');
  a.set_local(arr);

  // Sum: arr[0] + arr[1] + arr[2]
  a.get_local(arr);
  a.const_i32(0);
  a.array_get(IntArray.index);

  a.get_local(arr);
  a.const_i32(1);
  a.array_get(IntArray.index);
  a.add_i32();

  a.get_local(arr);
  a.const_i32(2);
  a.array_get(IntArray.index);
  a.add_i32();
}).withExport();

const bytes = mod.toBytes();
console.log(`Valid: ${WebAssembly.validate(bytes.buffer)}`);
```

## GC i31 References

Pack/unpack small integers as `i31ref` — useful for unboxed values in GC type hierarchies:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('gcI31', {
  target: 'latest',
});

// Pack i32 → i31ref → unpack signed
mod.defineFunction('roundtrip_s', [ValueType.Int32], [], (f, a) => {
  a.const_i32(42);
  a.ref_i31();      // box: i32 → i31ref
  a.i31_get_s();    // unbox signed: i31ref → i32
}).withExport();

// Pack i32 → i31ref → unpack unsigned
mod.defineFunction('roundtrip_u', [ValueType.Int32], [], (f, a) => {
  a.const_i32(-1);   // negative value
  a.ref_i31();
  a.i31_get_u();     // unbox unsigned
}).withExport();

// Negative number roundtrip (signed)
mod.defineFunction('negative_s', [ValueType.Int32], [], (f, a) => {
  a.const_i32(-100);
  a.ref_i31();
  a.i31_get_s();    // returns -100
}).withExport();

const bytes = mod.toBytes();
console.log(`Valid: ${WebAssembly.validate(bytes.buffer)}`);
```

## GC Recursive Types

Define mutually-recursive types using `defineRecGroup` — a rec group allows types to reference each other via forward references:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('gcRec', {
  target: 'latest',
});

// Define a recursive group
const recGroup = mod.defineRecGroup((builder) => {
  // Type 0: ListNode { value: i32, next: ref null ListNode }
  const listNodeRef = builder.refNull(0); // forward ref to type 0 (self)
  builder.addStructType([
    { name: 'value', type: ValueType.Int32, mutable: false },
    { name: 'next', type: listNodeRef, mutable: true },
  ]);

  // Type 1: array of ListNode refs
  builder.addArrayType(builder.refNull(0), true);
});

console.log('Recursive group with', recGroup._types.length, 'types');
console.log('WAT:', mod.toString());

const bytes = mod.toBytes();
console.log(`Valid: ${WebAssembly.validate(bytes.buffer)}`);
```

## GC Struct Subtyping

Extend a base struct type with `superTypes` to create a type hierarchy:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('gcSubtype', {
  target: 'latest',
});

// Base type: Shape { area: f32 }
const Shape = mod.defineStructType([
  { name: 'area', type: ValueType.Float32, mutable: false },
]);

// Subtype: Circle extends Shape, adds radius
const Circle = mod.defineStructType([
  { name: 'area', type: ValueType.Float32, mutable: false },
  { name: 'radius', type: ValueType.Float32, mutable: false },
], { superTypes: [Shape], final: false });

// Final subtype: FilledCircle extends Circle, adds color
const FilledCircle = mod.defineStructType([
  { name: 'area', type: ValueType.Float32, mutable: false },
  { name: 'radius', type: ValueType.Float32, mutable: false },
  { name: 'color', type: ValueType.Int32, mutable: false },
], { superTypes: [Circle], final: true });

console.log('Shape index:', Shape.index);
console.log('Circle index:', Circle.index);
console.log('FilledCircle index:', FilledCircle.index);

const bytes = mod.toBytes();
console.log(`Valid: ${WebAssembly.validate(bytes.buffer)}`);
```

## GC Runtime Type Checks

Use `ref.test` and `ref.cast` to check and narrow reference types at runtime:

```typescript
import { ModuleBuilder, ValueType, HeapType } from 'webasmjs';

const mod = new ModuleBuilder('gcCast', {
  target: 'latest',
});

// Test if a null anyref is an i31 (returns 0)
mod.defineFunction('testNull', [ValueType.Int32], [], (f, a) => {
  a.ref_null(0x6e);          // null anyref
  a.ref_test(HeapType.I31);  // is it an i31? → 0
}).withExport();

// Test if an i31ref is an i31 (returns 1)
mod.defineFunction('testI31', [ValueType.Int32], [], (f, a) => {
  a.const_i32(42);
  a.ref_i31();               // create i31ref
  a.ref_test(HeapType.I31);  // is it an i31? → 1
}).withExport();

// Cast: narrow anyref to i31ref (traps if wrong type)
mod.defineFunction('castI31', null, [], (f, a) => {
  a.const_i32(7);
  a.ref_i31();
  a.ref_cast(HeapType.I31);  // succeeds
  a.drop();
}).withExport();

const bytes = mod.toBytes();
console.log(`Valid: ${WebAssembly.validate(bytes.buffer)}`);
```

## Multi-Module with PackageBuilder

Use `PackageBuilder` to link multiple WebAssembly modules with imports:

```typescript
import { PackageBuilder, ValueType } from 'webasmjs';

const pkg = new PackageBuilder();

// Module "math": provides utility functions
const mathMod = pkg.defineModule('math');
mathMod.defineFunction('double', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
}).withExport();

mathMod.defineFunction('square', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(0));
  a.mul_i32();
}).withExport();

// Module "main": imports from "math" and composes
const mainMod = pkg.defineModule('main');
const doubleFn = mainMod.importFunction('math', 'double', [ValueType.Int32], [ValueType.Int32]);
const squareFn = mainMod.importFunction('math', 'square', [ValueType.Int32], [ValueType.Int32]);

// quadruple(x) = double(double(x))
mainMod.defineFunction('quadruple', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.call(doubleFn);
  a.call(doubleFn);
}).withExport();

// doubleSquare(x) = double(square(x)) = 2 * x^2
mainMod.defineFunction('doubleSquare', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.call(squareFn);
  a.call(doubleFn);
}).withExport();

pkg.addDependency('main', 'math');
const result = await pkg.instantiate();
const { quadruple, doubleSquare } = result.main.exports as any;

console.log('quadruple(3) =', quadruple(3));       // 12
console.log('doubleSquare(5) =', doubleSquare(5));  // 50
```

## Debug Name Section

Attach debug names to functions, parameters, locals, and globals — then inspect them with `BinaryReader`:

```typescript
import { ModuleBuilder, ValueType, BinaryReader } from 'webasmjs';

const mod = new ModuleBuilder('debugExample');

const g = mod.defineGlobal(ValueType.Int32, true, 0);
g.withName('counter');

mod.defineFunction('add', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  f.getParameter(0).withName('x');
  f.getParameter(1).withName('y');
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

mod.defineFunction('addThree', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  f.getParameter(0).withName('a');
  f.getParameter(1).withName('b');
  f.getParameter(2).withName('c');
  const temp = a.declareLocal(ValueType.Int32, 'temp');
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
  a.get_local(f.getParameter(2));
  a.add_i32();
}).withExport();

// Read back the name section
const bytes = mod.toBytes();
const reader = new BinaryReader(bytes);
const info = reader.read();
const ns = info.nameSection;

if (ns) {
  console.log('Module:', ns.moduleName);
  ns.functionNames?.forEach((name, idx) => console.log(`  func[${idx}] = ${name}`));
  ns.localNames?.forEach((locals, funcIdx) => {
    const funcName = ns.functionNames?.get(funcIdx) || `func${funcIdx}`;
    locals.forEach((name, localIdx) => console.log(`  ${funcName}[${localIdx}] = ${name}`));
  });
  ns.globalNames?.forEach((name, idx) => console.log(`  global[${idx}] = ${name}`));
}
```
