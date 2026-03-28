# webasmjs

[![CI](https://github.com/DevNamedZed/webasmjs/actions/workflows/ci.yml/badge.svg)](https://github.com/DevNamedZed/webasmjs/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

TypeScript library for building and analyzing WebAssembly modules. Generate WASM bytecode with a fluent builder API, or point it at any `.wasm` binary to disassemble, inspect, and decompile it.

[Playground](https://devnamedzed.github.io/webasmjs/) | [API Reference](docs/api.md) | [Getting Started](docs/getting-started.md) | [Examples](docs/examples.md)

## Features

### Module Builder

- Fluent builder pattern for constructing WASM modules
- **562 instructions** — arithmetic, control flow, memory, tables, globals, SIMD, atomics, GC, exception handling
- **Target system** — `mvp`, `2.0`, `3.0`, `latest` with automatic feature gating
- i32, i64, f32, f64, v128 value types with BigInt support for i64
- **128-bit SIMD** — 236 vector instructions + 20 relaxed SIMD
- **Threads & atomics** — shared memory, 67 atomic operations
- **Exception handling** — tags, throw, try/catch/rethrow
- **Memory64** — 64-bit addressed memory
- Tail calls, multi-value returns, bulk memory, reference types
- Function imports/exports with host interop
- Memory and table management with import/export
- WAT text format output and parsing
- Compile-time verification (control flow + operand stack)
- Data-driven — opcodes generated from `generator/opcodes.json`

### Binary Analysis

- **Binary reader** — parses all WASM sections: types, imports, functions, tables, memories, globals, exports, elements, data segments, tags, custom sections. Supports GC types (structs, arrays, recursive groups), SIMD, threads, memory64, and reference types.
- **Disassembler** — generates WAT text format from binary, per-function or full-module
- **Instruction decoder** — decodes all opcodes including prefixed families (GC, SIMD, bulk memory, threads) with offset and length tracking
- **DWARF parser** — reads `.debug_info`, `.debug_abbrev`, `.debug_line`, `.debug_str` sections. Extracts function names, parameter/local variable names with WASM local indices, type information (structs, pointers, base types), struct field names, global variable addresses, and source file/line mappings. Supports DWARF 4 and 5.
- **Source map parser** — V3 format with VLQ decoding, maps WASM byte offsets back to source files, lines, and columns
- **Name demangling** — C++ (Itanium ABI) and Rust (v0 + legacy) symbol demangling

### Decompiler

Converts WASM functions into structured C-like pseudocode. The pipeline: decode instructions → build a control flow graph → convert to SSA → run optimization passes → compute dominance (Cooper-Harvey-Kennedy) → recover high-level control flow → lower to expression trees → emit output.

- **Control flow recovery** — if/else, while, do-while, for loops, switch/case from `br_table`, early returns, break/continue. Natural loop detection via dominance and post-dominance analysis.
- **SSA optimization** — constant folding, copy propagation, dead code elimination, double negation elimination, comparison inversion, common subexpression elimination, phi simplification. Iterates until convergence.
- **Stack frame removal** — detects the `__stack_pointer - N` shadow-stack pattern from LLVM/Emscripten, removes prologue/epilogue, cleans up all `__stack_pointer` references from output.
- **Memory patterns** — variables with 2+ distinct constant offsets become struct field access (`ptr->field_0`). Expressions like `base + (index << 2)` become array indexing (`base[index]`). With DWARF info, fields get their real names.
- **Type inference** — maps WASM types to C types, recognizes sub-word loads as casts (`load8_s` → `(byte)`, `load16_u` → `(ushort)`), integrates DWARF type information when present.
- **Variable naming** — context-aware names from definition site (loads, calls, loop counters) and use site (addresses → `ptr`, comparisons → `cond`). 326 known functions (C stdlib, POSIX, WASI, Emscripten, Rust, Go, AssemblyScript) provide parameter and return value names.
- **String literals** — resolves constant addresses against data segments and inlines the string content.
- **Expression formatting** — operator precedence, parenthesization, strength reduction display (`x << 2` → `x * 4`), unsigned comparison casts, ternary operators from `select`.

Tested against real-world binaries — Quake (944 functions), Doom (769 functions), ioquake3, all decompiled successfully.

### General

- Zero production dependencies

## Install

```bash
npm install webasmjs
```

## Quick Start

```typescript
import { ModuleBuilder, ValueType } from 'webasmjs';

const mod = new ModuleBuilder('example');

mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

const instance = await mod.instantiate();
const add = instance.instance.exports.add as Function;
console.log(add(3, 4)); // 7
```

## API Overview

### ModuleBuilder

The entry point for building a module. Create an instance, define functions/memory/tables/globals, then compile.

```typescript
const mod = new ModuleBuilder('myModule', {
  target: 'latest',              // 'mvp' | '2.0' | '3.0' | 'latest'
  features: [],                  // additional features beyond target
  generateNameSection: true,
  disableVerification: false,
});

// Compile to bytes
const bytes = mod.toBytes();

// Or instantiate directly
const instance = await mod.instantiate(imports);
```

### Defining Functions

```typescript
// Using the callback pattern (recommended)
mod.defineFunction('factorial', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const result = a.declareLocal(ValueType.Int32, 'result');

  a.const_i32(1);
  a.set_local(result);

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
      a.get_local(n);
      a.const_i32(1);
      a.le_i32();
      a.br_if(breakLabel);

      a.get_local(result);
      a.get_local(n);
      a.mul_i32();
      a.set_local(result);

      a.get_local(n);
      a.const_i32(1);
      a.sub_i32();
      a.set_local(n);
      a.br(loopLabel);
    });
  });

  a.get_local(result);
}).withExport();
```

### Imports and Exports

```typescript
// Import a function from the host
const printImport = mod.importFunction('env', 'print', null, [ValueType.Int32]);

// Use it in a function body
mod.defineFunction('run', null, [], (f, a) => {
  a.const_i32(42);
  a.call(printImport);
}).withExport();

// Provide imports at instantiation
const instance = await mod.instantiate({
  env: { print: (v: number) => console.log(v) },
});
```

### Memory

```typescript
const mem = mod.defineMemory(1, 4);       // 1 page initial, 4 max (64KB per page)
mod.exportMemory(mem, 'memory');

// Shared memory (for threads/atomics — requires maximum size)
const shared = mod.defineMemory(1, 10, true); // shared = true

// 64-bit addressed memory
const mem64 = mod.defineMemory(1, 100, false, true); // memory64 = true

// Import memory
mod.importMemory('env', 'mem', 1, 4);
```

### WAT Text Format

```typescript
// Generate WAT from a builder
const wat = mod.toString();

// Parse WAT text into a ModuleBuilder
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
```

See the [API Reference](docs/api.md) for complete documentation.

## Playground

Try webasmjs in the browser with the [interactive playground](https://devnamedzed.github.io/webasmjs/). 100+ builder examples covering arithmetic, control flow, memory, tables, imports, floating point, i64/BigInt, SIMD, GC types, algorithms, WAT parsing, and post-MVP features.

Drop any `.wasm` file into the explorer to inspect it. The explorer provides:
- Module structure — types, imports, functions, tables, memories, globals, exports, data segments
- WAT disassembly and decompiled C-like output per function, with syntax highlighting
- Hex view with instruction-colored bytes
- Size analysis per section and per function
- String extraction from data segments
- Feature detection (which WASM proposals the binary uses)
- Call graph, cyclomatic complexity, and dead code analysis
- DWARF and source map integration for symbol recovery

To run the playground locally:

```bash
npm run playground
```

## Development

```bash
# Install dependencies
npm install

# Build library + playground
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Regenerate opcode definitions from spec
npm run generate
```

## License

[MIT](LICENSE)
