# Getting Started

## Installation

```bash
npm install webasmjs
```

## Your First Module

Create a WebAssembly module that adds two numbers:

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

async function main() {
  const mod = new ModuleBuilder('myFirstModule');

  // Define an exported function: add(a: i32, b: i32) -> i32
  mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(f.getParameter(0));
    a.get_local(f.getParameter(1));
    a.add_i32();
  }).withExport();

  // Compile and instantiate
  const result = await mod.instantiate();
  const add = result.instance.exports.add as Function;

  console.log(add(10, 20)); // 30
}

main();
```

## Understanding the Builder Pattern

webasmjs uses a fluent builder API. The flow is:

1. **Create a `ModuleBuilder`** — this is the top-level container
2. **Define functions** — use `defineFunction` with a callback that receives a `FunctionBuilder` and `FunctionEmitter`
3. **Emit instructions** — the `FunctionEmitter` (the `a` parameter) exposes methods for every WASM instruction
4. **Export what you need** — call `.withExport()` on functions, or use `mod.exportMemory()`, etc.
5. **Instantiate** — call `mod.instantiate(imports?)` to compile and create a WASM instance

## The defineFunction Callback

The callback receives two arguments:

- **`f` (FunctionBuilder)** — access parameters, declare locals, configure exports
- **`a` (FunctionEmitter)** — emit WASM instructions

```typescript
mod.defineFunction('myFunc', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  // f = FunctionBuilder: f.getParameter(0), f.withExport(), etc.
  // a = FunctionEmitter: a.const_i32(42), a.add_i32(), etc.

  const param = f.getParameter(0);
  const local = a.declareLocal(ValueType.Int32, 'temp');

  a.get_local(param);
  a.const_i32(10);
  a.add_i32();
  a.set_local(local);
  a.get_local(local);
});
```

The `end` instruction is automatically added when using the callback form.

## Value Types

| Type | Constant | Description |
|------|----------|-------------|
| `i32` | `ValueType.Int32` | 32-bit integer |
| `i64` | `ValueType.Int64` | 64-bit integer (uses BigInt in JS) |
| `f32` | `ValueType.Float32` | 32-bit float |
| `f64` | `ValueType.Float64` | 64-bit float |
| `v128` | `ValueType.V128` | 128-bit SIMD vector |

## Control Flow

Use block, loop, and if/else with callbacks for structured control flow:

```typescript
mod.defineFunction('abs', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(0);
  a.lt_s_i32();
  a.if(BlockType.Int32);
    a.const_i32(0);
    a.get_local(f.getParameter(0));
    a.sub_i32();
  a.else();
    a.get_local(f.getParameter(0));
  a.end();
}).withExport();
```

Or use the callback form for loops:

```typescript
a.loop(BlockType.Void, (loopLabel) => {
  a.block(BlockType.Void, (breakLabel) => {
    // ... loop body
    a.br_if(breakLabel); // break
    a.br(loopLabel);     // continue
  });
});
```

## Target System

webasmjs supports WebAssembly feature proposals through a target system. Each target enables a set of features automatically:

```typescript
// Default: 'latest' — all standardized features enabled
const mod = new ModuleBuilder('myModule');

// Target a specific version for compatibility
const mod2 = new ModuleBuilder('compat', { target: '2.0' });

// MVP with specific features added
const mod3 = new ModuleBuilder('custom', {
  target: 'mvp',
  features: ['simd', 'bulk-memory'],
});
```

| Target | Features Included |
|--------|-------------------|
| `mvp` | None — WebAssembly 1.0 only |
| `2.0` | sign-extend, sat-trunc, bulk-memory, reference-types, multi-value, mutable-globals |
| `3.0` | All of 2.0 + simd, tail-call, exception-handling, threads, multi-memory, multi-table, memory64, extended-const |
| `latest` | All of 3.0 + relaxed-simd, gc |

## WAT Output

Every module can be converted to WAT text format for debugging:

```typescript
const wat = mod.toString();
console.log(wat);
```

## Next Steps

- [API Reference](api.md) — complete documentation of all builders and emitters
- [Examples](examples.md) — annotated examples covering common patterns
- [Playground](https://devnamedzed.github.io/webasmjs/) — try webasmjs in the browser
