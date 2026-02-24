# webasmjs

[![CI](https://github.com/DevNamedZed/webasmjs/actions/workflows/ci.yml/badge.svg)](https://github.com/DevNamedZed/webasmjs/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

TypeScript library for programmatically generating WebAssembly modules. Build WASM bytecode using a fluent builder API — define functions, memory, tables, globals, imports, and exports, then compile and instantiate at runtime.

[Playground](https://devnamedzed.github.io/webasmjs/) | [API Reference](docs/api.md) | [Getting Started](docs/getting-started.md) | [Examples](docs/examples.md)

## Features

- Fluent builder pattern for constructing WASM modules
- **531 instructions** — arithmetic, control flow, memory, tables, globals, SIMD, atomics, exception handling
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
- Binary reader for inspecting compiled modules
- Compile-time verification (control flow + operand stack)
- Data-driven — opcodes generated from `generator/opcodes.json`
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

Try webasmjs in the browser with the [interactive playground](https://devnamedzed.github.io/webasmjs/). It includes 40+ examples covering arithmetic, control flow, memory, tables, imports, floating point, i64/BigInt, SIMD, algorithms, WAT parsing, and post-MVP features.

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
npm run test:cover

# Regenerate opcode definitions from spec
npm run generate
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes and add tests
4. Run `npm test` to verify
5. Commit and push
6. Open a pull request

## License

[MIT](LICENSE)
