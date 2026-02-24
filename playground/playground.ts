import {
  ModuleBuilder,
  PackageBuilder,
  ValueType,
  BlockType,
  ElementType,
  TextModuleWriter,
  BinaryReader,
  parseWat,
} from '../src/index';

import type { WasmTarget, WasmFeature } from '../src/types';

interface ExampleDef {
  label: string;
  group: string;
  description: string;
  target: WasmTarget;
  features: WasmFeature[];
  code: string;
}

const EXAMPLES: Record<string, ExampleDef> = {
  // ─── Basics ───
  'hello-wasm': {
    label: 'Hello WASM',
    group: 'Basics',
    description: 'The simplest possible module — export a function that returns 42.',
    target: 'mvp',
    features: [],
    code: `// Hello WASM — the simplest possible module
const mod = new webasmjs.ModuleBuilder('hello');

mod.defineFunction('answer', [webasmjs.ValueType.Int32], [], (f, a) => {
  a.const_i32(42);
}).withExport();

const instance = await mod.instantiate();
const answer = instance.instance.exports.answer;
log('The answer to everything: ' + answer());`,
  },

  factorial: {
    label: 'Factorial',
    group: 'Basics',
    description: 'Iterative factorial using loop and block for control flow.',
    target: 'mvp',
    features: [],
    code: `// Factorial — iterative with loop and block
const mod = new webasmjs.ModuleBuilder('factorial');

mod.defineFunction('factorial', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const result = a.declareLocal(webasmjs.ValueType.Int32, 'result');
  const i = a.declareLocal(webasmjs.ValueType.Int32, 'i');

  a.const_i32(1);
  a.set_local(result);
  a.const_i32(1);
  a.set_local(i);

  a.loop(webasmjs.BlockType.Void, (loopLabel) => {
    a.block(webasmjs.BlockType.Void, (breakLabel) => {
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
const factorial = instance.instance.exports.factorial;
for (let n = 0; n <= 10; n++) {
  log(n + '! = ' + factorial(n));
}`,
  },

  fibonacci: {
    label: 'Fibonacci',
    group: 'Basics',
    description: 'Iterative Fibonacci with local variables and branching.',
    target: 'mvp',
    features: [],
    code: `// Fibonacci sequence — iterative
const mod = new webasmjs.ModuleBuilder('fibonacci');

mod.defineFunction('fib', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const prev = a.declareLocal(webasmjs.ValueType.Int32, 'prev');
  const curr = a.declareLocal(webasmjs.ValueType.Int32, 'curr');
  const temp = a.declareLocal(webasmjs.ValueType.Int32, 'temp');
  const i = a.declareLocal(webasmjs.ValueType.Int32, 'i');

  a.get_local(n);
  a.const_i32(1);
  a.le_i32();
  a.if(webasmjs.BlockType.Void, () => {
    a.get_local(n);
    a.return();
  });

  a.const_i32(0);
  a.set_local(prev);
  a.const_i32(1);
  a.set_local(curr);
  a.const_i32(2);
  a.set_local(i);

  a.loop(webasmjs.BlockType.Void, (loopLabel) => {
    a.block(webasmjs.BlockType.Void, (breakLabel) => {
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
const fib = instance.instance.exports.fib;
for (let n = 0; n <= 15; n++) {
  log('fib(' + n + ') = ' + fib(n));
}`,
  },

  'if-else': {
    label: 'If/Else',
    group: 'Basics',
    description: 'Absolute value and sign function using typed if/else blocks.',
    target: 'mvp',
    features: [],
    code: `// If/Else — absolute value and sign function
const mod = new webasmjs.ModuleBuilder('ifElse');

// Absolute value using if/else with typed block
mod.defineFunction('abs', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(0);
  a.lt_i32();
  a.if(webasmjs.BlockType.Int32);
    a.const_i32(0);
    a.get_local(f.getParameter(0));
    a.sub_i32();
  a.else();
    a.get_local(f.getParameter(0));
  a.end();
}).withExport();

// Sign function: returns -1, 0, or 1
mod.defineFunction('sign', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(0);
  a.lt_i32();
  a.if(webasmjs.BlockType.Int32);
    a.const_i32(-1);
  a.else();
    a.get_local(f.getParameter(0));
    a.const_i32(0);
    a.gt_i32();
    a.if(webasmjs.BlockType.Int32);
      a.const_i32(1);
    a.else();
      a.const_i32(0);
    a.end();
  a.end();
}).withExport();

const instance = await mod.instantiate();
const { abs, sign } = instance.instance.exports;

log('abs(5) = ' + abs(5));
log('abs(-5) = ' + abs(-5));
log('abs(0) = ' + abs(0));
log('');
log('sign(42) = ' + sign(42));
log('sign(-7) = ' + sign(-7));
log('sign(0) = ' + sign(0));`,
  },

  // ─── Memory ───
  memory: {
    label: 'Memory Basics',
    group: 'Memory',
    description: 'Store and load i32 values in linear memory.',
    target: 'mvp',
    features: [],
    code: `// Memory: store and load values
const mod = new webasmjs.ModuleBuilder('memoryExample');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

mod.defineFunction('store', null, [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0);
}).withExport();

mod.defineFunction('load', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_i32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { store, load } = instance.instance.exports;

store(0, 42);
store(4, 100);
log('Value at address 0: ' + load(0));
log('Value at address 4: ' + load(4));
store(0, load(0) + load(4));
log('Sum stored at 0: ' + load(0));`,
  },

  'byte-array': {
    label: 'Byte Array',
    group: 'Memory',
    description: 'Store and sum individual bytes with load8/store8 instructions.',
    target: 'mvp',
    features: [],
    code: `// Byte array — store and sum individual bytes
const mod = new webasmjs.ModuleBuilder('byteArray');
mod.defineMemory(1);

// Store a byte at offset
mod.defineFunction('setByte', null, [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store8_i32(0, 0);
}).withExport();

// Load a byte from offset
mod.defineFunction('getByte', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load8_i32_u(0, 0);
}).withExport();

// Sum bytes from offset 0 to length-1
mod.defineFunction('sumBytes', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  const len = f.getParameter(0);
  const sum = a.declareLocal(webasmjs.ValueType.Int32, 'sum');
  const i = a.declareLocal(webasmjs.ValueType.Int32, 'i');

  a.const_i32(0);
  a.set_local(sum);
  a.const_i32(0);
  a.set_local(i);

  a.loop(webasmjs.BlockType.Void, (loopLabel) => {
    a.block(webasmjs.BlockType.Void, (breakLabel) => {
      a.get_local(i);
      a.get_local(len);
      a.ge_i32();
      a.br_if(breakLabel);

      a.get_local(sum);
      a.get_local(i);
      a.load8_i32_u(0, 0);
      a.add_i32();
      a.set_local(sum);

      a.get_local(i);
      a.const_i32(1);
      a.add_i32();
      a.set_local(i);
      a.br(loopLabel);
    });
  });

  a.get_local(sum);
}).withExport();

const instance = await mod.instantiate();
const { setByte, getByte, sumBytes } = instance.instance.exports;

// Fill bytes 0..9 with values 10, 20, 30, ...
for (let i = 0; i < 10; i++) {
  setByte(i, (i + 1) * 10);
}

log('Stored bytes:');
for (let i = 0; i < 10; i++) {
  log('  [' + i + '] = ' + getByte(i));
}
log('Sum of 10 bytes: ' + sumBytes(10));`,
  },

  'string-memory': {
    label: 'Strings in Memory',
    group: 'Memory',
    description: 'Store a string via data segment and compute its length.',
    target: 'mvp',
    features: [],
    code: `// Strings in memory — store a string, compute its length
const mod = new webasmjs.ModuleBuilder('stringMem');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Store a data segment with a string at offset 0
const greeting = new TextEncoder().encode('Hello, WebAssembly!');
mod.defineData(new Uint8Array([...greeting, 0]), 0); // null-terminated

// strlen: count bytes until null
mod.defineFunction('strlen', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  const ptr = f.getParameter(0);
  const len = a.declareLocal(webasmjs.ValueType.Int32, 'len');

  a.const_i32(0);
  a.set_local(len);

  a.loop(webasmjs.BlockType.Void, (loopLabel) => {
    a.block(webasmjs.BlockType.Void, (breakLabel) => {
      // Load byte at ptr + len
      a.get_local(ptr);
      a.get_local(len);
      a.add_i32();
      a.load8_i32_u(0, 0);
      a.eqz_i32();
      a.br_if(breakLabel);

      a.get_local(len);
      a.const_i32(1);
      a.add_i32();
      a.set_local(len);
      a.br(loopLabel);
    });
  });

  a.get_local(len);
}).withExport();

const instance = await mod.instantiate();
const { strlen, memory } = instance.instance.exports;

// Read the string from memory
const memView = new Uint8Array(memory.buffer);
const strLen = strlen(0);
const str = new TextDecoder().decode(memView.slice(0, strLen));

log('String in memory: "' + str + '"');
log('Length: ' + strLen);`,
  },

  'data-segments': {
    label: 'Data Segments',
    group: 'Memory',
    description: 'Pre-initialize memory with defineData and read values at runtime.',
    target: 'mvp',
    features: [],
    code: `// Data segments — pre-initialize memory with static data
const mod = new webasmjs.ModuleBuilder('dataSegments');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Pre-fill memory with a lookup table at offset 0
// Powers of 2: [1, 2, 4, 8, 16, 32, 64, 128]
const powers = new Uint8Array(new Int32Array([1, 2, 4, 8, 16, 32, 64, 128]).buffer);
mod.defineData(powers, 0);

// Pre-fill memory with a message at offset 64
const msg = new TextEncoder().encode('Hello from data segment!');
mod.defineData(new Uint8Array([...msg, 0]), 64);

// Read an i32 from the powers table: getPower(index)
mod.defineFunction('getPower', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(4);
  a.mul_i32();
  a.load_i32(2, 0);
}).withExport();

// strlen starting at offset
mod.defineFunction('strlen', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  const ptr = f.getParameter(0);
  const len = a.declareLocal(webasmjs.ValueType.Int32, 'len');
  a.const_i32(0);
  a.set_local(len);
  a.loop(webasmjs.BlockType.Void, (loopLabel) => {
    a.block(webasmjs.BlockType.Void, (breakLabel) => {
      a.get_local(ptr);
      a.get_local(len);
      a.add_i32();
      a.load8_i32_u(0, 0);
      a.eqz_i32();
      a.br_if(breakLabel);
      a.get_local(len);
      a.const_i32(1);
      a.add_i32();
      a.set_local(len);
      a.br(loopLabel);
    });
  });
  a.get_local(len);
}).withExport();

const instance = await mod.instantiate();
const { getPower, strlen, memory } = instance.instance.exports;

log('Powers of 2 from data segment:');
for (let i = 0; i < 8; i++) {
  log('  2^' + i + ' = ' + getPower(i));
}

const view = new Uint8Array(memory.buffer);
const len = strlen(64);
const str = new TextDecoder().decode(view.slice(64, 64 + len));
log('');
log('Message from data segment: "' + str + '"');`,
  },

  'memory-growth': {
    label: 'Memory Growth',
    group: 'Memory',
    description: 'Grow memory at runtime with mem_grow and query size with mem_size.',
    target: 'mvp',
    features: [],
    code: `// Memory growth — dynamically add pages at runtime
const mod = new webasmjs.ModuleBuilder('memGrowth');
const mem = mod.defineMemory(1); // start with 1 page (64KB)
mod.exportMemory(mem, 'memory');

// Return current memory size in pages
mod.defineFunction('pages', [webasmjs.ValueType.Int32], [], (f, a) => {
  a.mem_size(0);
}).withExport();

// Grow memory by N pages, return previous size (or -1 on failure)
mod.defineFunction('grow', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.mem_grow(0);
}).withExport();

// Store an i32 at a byte offset
mod.defineFunction('store', null, [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0);
}).withExport();

// Load an i32 from a byte offset
mod.defineFunction('load', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_i32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { pages, grow, store, load } = instance.instance.exports;

log('Initial size: ' + pages() + ' page(s) = ' + (pages() * 64) + ' KB');

// Grow by 2 pages
const prev = grow(2);
log('grow(2) returned previous size: ' + prev);
log('New size: ' + pages() + ' page(s) = ' + (pages() * 64) + ' KB');

// Write to the new pages (offset > 64KB = beyond original page)
const offset = 65536 + 100; // byte 100 in second page
store(offset, 12345);
log('Stored 12345 at offset ' + offset + ' (in grown memory)');
log('Loaded: ' + load(offset));

// Grow again
grow(1);
log('After another grow(1): ' + pages() + ' pages');`,
  },

  // ─── Globals & State ───
  globals: {
    label: 'Global Counter',
    group: 'Globals',
    description: 'Mutable global variable used as a persistent counter.',
    target: 'mvp',
    features: [],
    code: `// Globals: mutable counter
const mod = new webasmjs.ModuleBuilder('globals');

const counter = mod.defineGlobal(webasmjs.ValueType.Int32, true, 0);

mod.defineFunction('increment', [webasmjs.ValueType.Int32], [], (f, a) => {
  a.get_global(counter);
  a.const_i32(1);
  a.add_i32();
  a.set_global(counter);
  a.get_global(counter);
}).withExport();

mod.defineFunction('getCount', [webasmjs.ValueType.Int32], [], (f, a) => {
  a.get_global(counter);
}).withExport();

const instance = await mod.instantiate();
const { increment, getCount } = instance.instance.exports;

log('Initial: ' + getCount());
increment();
increment();
increment();
log('After 3 increments: ' + getCount());
for (let i = 0; i < 7; i++) increment();
log('After 7 more: ' + getCount());`,
  },

  'start-function': {
    label: 'Start Function',
    group: 'Globals',
    description: 'A function that runs automatically on module instantiation.',
    target: 'mvp',
    features: [],
    code: `// Start function — runs automatically on instantiation
const mod = new webasmjs.ModuleBuilder('startExample');

const initialized = mod.defineGlobal(webasmjs.ValueType.Int32, true, 0);

// This function runs automatically at instantiation
const initFn = mod.defineFunction('init', null, [], (f, a) => {
  a.const_i32(1);
  a.set_global(initialized);
});
mod.setStartFunction(initFn);

// Exported getter
mod.defineFunction('isInitialized', [webasmjs.ValueType.Int32], [], (f, a) => {
  a.get_global(initialized);
}).withExport();

const instance = await mod.instantiate();
const { isInitialized } = instance.instance.exports;
log('isInitialized (should be 1): ' + isInitialized());
log('The start function ran automatically!');`,
  },

  // ─── Functions & Calls ───
  'multi-func': {
    label: 'Function Calls',
    group: 'Functions',
    description: 'Multiple functions calling each other — square, double, compose.',
    target: 'mvp',
    features: [],
    code: `// Multiple functions calling each other
const mod = new webasmjs.ModuleBuilder('multiFn');

// Helper: square
mod.defineFunction('square', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(0));
  a.mul_i32();
}).withExport();

// Helper: double
mod.defineFunction('double', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
}).withExport();

// Composed: 2 * x^2
const squareFn = mod._functions[0];
const doubleFn = mod._functions[1];

mod.defineFunction('doubleSquare', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.call(squareFn);
  a.call(doubleFn);
}).withExport();

const instance = await mod.instantiate();
const { square, double: dbl, doubleSquare } = instance.instance.exports;

for (let x = 1; x <= 5; x++) {
  log('x=' + x + ': square=' + square(x) + ', double=' + dbl(x) + ', 2x²=' + doubleSquare(x));
}`,
  },

  'imports': {
    label: 'Import Functions',
    group: 'Functions',
    description: 'Import host functions so WASM can call JavaScript.',
    target: 'mvp',
    features: [],
    code: `// Importing host functions — WASM calling JavaScript
const mod = new webasmjs.ModuleBuilder('imports');

// Declare an import: env.print takes an i32
const printImport = mod.importFunction('env', 'print', null, [webasmjs.ValueType.Int32]);

// Declare another import: env.getTime returns an i32
const getTimeImport = mod.importFunction('env', 'getTime', [webasmjs.ValueType.Int32], []);

mod.defineFunction('run', null, [], (f, a) => {
  // Call getTime, then print it
  a.call(getTimeImport);
  a.call(printImport);

  // Print some constants
  a.const_i32(100);
  a.call(printImport);
  a.const_i32(200);
  a.call(printImport);
  a.const_i32(300);
  a.call(printImport);
}).withExport();

const logged = [];
const instance = await mod.instantiate({
  env: {
    print: (v) => { logged.push(v); },
    getTime: () => Date.now() & 0x7FFFFFFF,
  },
});

instance.instance.exports.run();

log('Values printed by WASM:');
logged.forEach((v, i) => log('  [' + i + '] ' + v));`,
  },

  'indirect-call': {
    label: 'Indirect Calls (Table)',
    group: 'Functions',
    description: 'Dispatch function calls through a table using call_indirect.',
    target: 'mvp',
    features: [],
    code: `// Indirect calls via function table
const mod = new webasmjs.ModuleBuilder('indirectCall');

const add = mod.defineFunction('add', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
});

const sub = mod.defineFunction('sub', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.sub_i32();
});

const mul = mod.defineFunction('mul', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
});

// Create a table with 3 entries
const table = mod.defineTable(webasmjs.ElementType.AnyFunc, 3);
mod.defineTableSegment(table, [add, sub, mul], 0);

// Dispatcher: call function at table[opIndex](a, b)
mod.defineFunction('dispatch', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1)); // a
  a.get_local(f.getParameter(2)); // b
  a.get_local(f.getParameter(0)); // table index
  a.call_indirect(add.funcTypeBuilder);
}).withExport();

const instance = await mod.instantiate();
const { dispatch } = instance.instance.exports;

const ops = ['add', 'sub', 'mul'];
for (let op = 0; op < 3; op++) {
  log(ops[op] + '(10, 3) = ' + dispatch(op, 10, 3));
}`,
  },

  'multi-module': {
    label: 'Multi-Module',
    group: 'Functions',
    description: 'Use PackageBuilder to link two modules with imports.',
    target: 'mvp',
    features: [],
    code: `// Multi-module — PackageBuilder links modules with dependencies
const pkg = new webasmjs.PackageBuilder();

// Module "math": provides a double function
const mathMod = pkg.defineModule('math');
mathMod.defineFunction('double', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
}).withExport();

mathMod.defineFunction('square', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(0));
  a.mul_i32();
}).withExport();

// Module "main": imports from "math" and composes
const mainMod = pkg.defineModule('main');
const doubleFn = mainMod.importFunction('math', 'double', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32]);
const squareFn = mainMod.importFunction('math', 'square', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32]);

// quadruple(x) = double(double(x))
mainMod.defineFunction('quadruple', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.call(doubleFn);
  a.call(doubleFn);
}).withExport();

// doubleSquare(x) = double(square(x)) = 2 * x^2
mainMod.defineFunction('doubleSquare', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.call(squareFn);
  a.call(doubleFn);
}).withExport();

pkg.addDependency('main', 'math');
const result = await pkg.instantiate();
const { quadruple, doubleSquare } = result.main.exports;

log('PackageBuilder — two linked modules:');
for (let x = 1; x <= 6; x++) {
  log('  x=' + x + ': quadruple=' + quadruple(x) + ', 2x\\u00B2=' + doubleSquare(x));
}`,
  },

  'recursive': {
    label: 'Recursive Function',
    group: 'Functions',
    description: 'Self-recursive power function using a.call(f).',
    target: 'mvp',
    features: [],
    code: `// Recursive function — power(base, exp) calls itself
const mod = new webasmjs.ModuleBuilder('recursion');

mod.defineFunction('power', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  const base = f.getParameter(0);
  const exp = f.getParameter(1);

  // if exp == 0 return 1
  a.get_local(exp);
  a.eqz_i32();
  a.if(webasmjs.BlockType.Void, () => {
    a.const_i32(1);
    a.return();
  });

  // return base * power(base, exp - 1)
  a.get_local(base);
  a.get_local(base);
  a.get_local(exp);
  a.const_i32(1);
  a.sub_i32();
  a.call(f);  // recursive call to self!
  a.mul_i32();
}).withExport();

const instance = await mod.instantiate();
const { power } = instance.instance.exports;

log('Recursive power(base, exp):');
for (let b = 2; b <= 5; b++) {
  const results = [];
  for (let e = 0; e <= 5; e++) results.push(b + '^' + e + '=' + power(b, e));
  log('  ' + results.join(', '));
}`,
  },

  // ─── Control Flow ───
  'br-table': {
    label: 'Branch Table',
    group: 'Control Flow',
    description: 'Switch/case dispatch using the br_table instruction.',
    target: 'mvp',
    features: [],
    code: `// br_table — switch/case dispatch to different blocks
const mod = new webasmjs.ModuleBuilder('brTable');

// dayType(day): 0-4 => "weekday" (return 1), 5-6 => "weekend" (return 2), else => "invalid" (return 0)
mod.defineFunction('dayType', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  const day = f.getParameter(0);
  const result = a.declareLocal(webasmjs.ValueType.Int32, 'result');

  a.block(webasmjs.BlockType.Void, (invalidBlock) => {
    a.block(webasmjs.BlockType.Void, (weekendBlock) => {
      a.block(webasmjs.BlockType.Void, (weekdayBlock) => {
        // br_table: value 0-4 => weekdayBlock, 5-6 => weekendBlock, default => invalidBlock
        a.get_local(day);
        a.br_table(invalidBlock,
          weekdayBlock, weekdayBlock, weekdayBlock, weekdayBlock, weekdayBlock,
          weekendBlock, weekendBlock
        );
      });
      // weekday path
      a.const_i32(1);
      a.set_local(result);
      a.br(invalidBlock); // jump to end
    });
    // weekend path
    a.const_i32(2);
    a.set_local(result);
    a.br(invalidBlock); // jump to end
  });
  // if we fell through to here via default, result is still 0

  a.get_local(result);
}).withExport();

const instance = await mod.instantiate();
const { dayType } = instance.instance.exports;

const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const types = ['invalid', 'weekday', 'weekend'];
for (let d = 0; d < 7; d++) {
  log(names[d] + ' (day ' + d + '): ' + types[dayType(d)]);
}
log('day 7: ' + types[dayType(7)]);
log('day 99: ' + types[dayType(99)]);`,
  },

  'select': {
    label: 'Select (Ternary)',
    group: 'Control Flow',
    description: 'Branchless conditional with select — like a ternary operator.',
    target: 'mvp',
    features: [],
    code: `// select — branchless conditional (ternary operator)
const mod = new webasmjs.ModuleBuilder('selectOp');

// max(a, b) = a > b ? a : b  (using select)
mod.defineFunction('max', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);

  a.get_local(x);     // value if true
  a.get_local(y);     // value if false
  a.get_local(x);
  a.get_local(y);
  a.gt_i32();          // condition: x > y
  a.select();
}).withExport();

// min(a, b) = a < b ? a : b
mod.defineFunction('min', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);

  a.get_local(x);
  a.get_local(y);
  a.get_local(x);
  a.get_local(y);
  a.lt_i32();
  a.select();
}).withExport();

// clamp(val, lo, hi)
mod.defineFunction('clamp', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  const val = f.getParameter(0);
  const lo = f.getParameter(1);
  const hi = f.getParameter(2);
  const tmp = a.declareLocal(webasmjs.ValueType.Int32, 'tmp');

  // tmp = val > hi ? hi : val
  a.get_local(hi);
  a.get_local(val);
  a.get_local(val);
  a.get_local(hi);
  a.gt_i32();
  a.select();
  a.set_local(tmp);

  // result = tmp < lo ? lo : tmp
  a.get_local(lo);
  a.get_local(tmp);
  a.get_local(tmp);
  a.get_local(lo);
  a.lt_i32();
  a.select();
}).withExport();

const instance = await mod.instantiate();
const { max, min, clamp } = instance.instance.exports;

log('max(3, 7) = ' + max(3, 7));
log('max(10, 2) = ' + max(10, 2));
log('min(3, 7) = ' + min(3, 7));
log('min(10, 2) = ' + min(10, 2));
log('');
log('clamp(5, 0, 10) = ' + clamp(5, 0, 10));
log('clamp(-3, 0, 10) = ' + clamp(-3, 0, 10));
log('clamp(15, 0, 10) = ' + clamp(15, 0, 10));
log('clamp(0, 0, 10) = ' + clamp(0, 0, 10));
log('clamp(10, 0, 10) = ' + clamp(10, 0, 10));`,
  },

  'nested-blocks': {
    label: 'Nested Blocks',
    group: 'Control Flow',
    description: 'Multi-level block nesting with early break and continue.',
    target: 'mvp',
    features: [],
    code: `// Nested blocks — multi-level break and continue patterns
const mod = new webasmjs.ModuleBuilder('nestedBlocks');

// Find the first number in [start, start+limit) divisible by both 3 and 5
// Returns -1 if not found
mod.defineFunction('findFizzBuzz', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  const start = f.getParameter(0);
  const limit = f.getParameter(1);
  const i = a.declareLocal(webasmjs.ValueType.Int32, 'i');
  const end = a.declareLocal(webasmjs.ValueType.Int32, 'end');
  const result = a.declareLocal(webasmjs.ValueType.Int32, 'result');

  a.const_i32(-1);
  a.set_local(result);

  // end = start + limit
  a.get_local(start);
  a.get_local(limit);
  a.add_i32();
  a.set_local(end);

  a.get_local(start);
  a.set_local(i);

  // outer block — break here when found
  a.block(webasmjs.BlockType.Void, (found) => {
    a.loop(webasmjs.BlockType.Void, (cont) => {
      // if i >= end, exit loop
      a.block(webasmjs.BlockType.Void, (skip) => {
        a.get_local(i);
        a.get_local(end);
        a.ge_i32();
        a.br_if(found);

        // Check divisible by 3
        a.get_local(i);
        a.const_i32(3);
        a.rem_i32_u();
        a.br_if(skip); // not divisible by 3, skip

        // Check divisible by 5
        a.get_local(i);
        a.const_i32(5);
        a.rem_i32_u();
        a.br_if(skip); // not divisible by 5, skip

        // Found! Save and break to outer
        a.get_local(i);
        a.set_local(result);
        a.br(found);
      });

      // i++
      a.get_local(i);
      a.const_i32(1);
      a.add_i32();
      a.set_local(i);
      a.br(cont);
    });
  });

  a.get_local(result);
}).withExport();

const instance = await mod.instantiate();
const { findFizzBuzz } = instance.instance.exports;

log('Find first FizzBuzz (divisible by 3 and 5):');
log('  findFizzBuzz(1, 100) = ' + findFizzBuzz(1, 100));
log('  findFizzBuzz(16, 10) = ' + findFizzBuzz(16, 10));
log('  findFizzBuzz(31, 50) = ' + findFizzBuzz(31, 50));
log('  findFizzBuzz(1, 5) = ' + findFizzBuzz(1, 5) + '  (not found)');
log('  findFizzBuzz(46, 10) = ' + findFizzBuzz(46, 10));`,
  },

  'drop-and-tee': {
    label: 'Drop & Tee Local',
    group: 'Control Flow',
    description: 'Stack manipulation with drop() and tee_local().',
    target: 'mvp',
    features: [],
    code: `// drop and tee_local — stack manipulation
const mod = new webasmjs.ModuleBuilder('stackOps');

// tee_local: stores to local AND keeps value on stack
// Equivalent to: set_local + get_local, but in one instruction
mod.defineFunction('sumAndCount', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const sum = a.declareLocal(webasmjs.ValueType.Int32, 'sum');
  const i = a.declareLocal(webasmjs.ValueType.Int32, 'i');

  a.const_i32(0);
  a.set_local(sum);
  a.const_i32(1);
  a.set_local(i);

  a.loop(webasmjs.BlockType.Void, (cont) => {
    a.block(webasmjs.BlockType.Void, (brk) => {
      a.get_local(i);
      a.get_local(n);
      a.gt_i32();
      a.br_if(brk);

      // tee_local: store i to sum while keeping it on stack
      a.get_local(sum);
      a.get_local(i);
      a.tee_local(i);  // stores i, but also leaves value on stack
      a.add_i32();
      a.set_local(sum);

      // increment i (which was already tee'd)
      a.get_local(i);
      a.const_i32(1);
      a.add_i32();
      a.set_local(i);
      a.br(cont);
    });
  });

  a.get_local(sum);
}).withExport();

// drop: discard an unwanted return value
mod.defineFunction('callAndDiscard', [webasmjs.ValueType.Int32], [], (f, a) => {
  // Call sumAndCount but ignore its return value
  a.const_i32(10);
  a.call(mod._functions[0]); // calls sumAndCount(10)
  a.drop();                   // discard the result

  // Return a fixed value instead
  a.const_i32(42);
}).withExport();

const instance = await mod.instantiate();
const { sumAndCount, callAndDiscard } = instance.instance.exports;

log('sumAndCount (uses tee_local):');
for (const n of [5, 10, 100]) {
  log('  sum(1..' + n + ') = ' + sumAndCount(n));
}
log('');
log('callAndDiscard (uses drop):');
log('  result = ' + callAndDiscard() + ' (dropped sumAndCount result, returned 42)');`,
  },

  'unreachable-trap': {
    label: 'Unreachable Trap',
    group: 'Control Flow',
    description: 'Use unreachable as an assertion — traps if reached.',
    target: 'mvp',
    features: [],
    code: `// unreachable — intentional trap for defensive programming
const mod = new webasmjs.ModuleBuilder('trapDemo');

// divide(a, b) — traps if b is zero
mod.defineFunction('divide', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);

  // Guard: trap if divisor is zero
  a.get_local(y);
  a.eqz_i32();
  a.if(webasmjs.BlockType.Void, () => {
    a.unreachable();  // trap!
  });

  a.get_local(x);
  a.get_local(y);
  a.div_i32();
}).withExport();

const instance = await mod.instantiate();
const { divide } = instance.instance.exports;

log('divide(10, 2) = ' + divide(10, 2));
log('divide(100, 5) = ' + divide(100, 5));
log('divide(7, 3) = ' + divide(7, 3));
log('');

try {
  divide(10, 0);
  log('Should not reach here!');
} catch (e) {
  log('divide(10, 0) trapped: ' + e.message);
  log('The unreachable instruction prevented division by zero!');
}`,
  },

  // ─── Numeric Types ───
  'float-math': {
    label: 'Float Math',
    group: 'Numeric',
    description: 'Floating-point distance, rounding, and sqrt with f64.',
    target: 'mvp',
    features: [],
    code: `// Floating-point operations — f64 math functions
const mod = new webasmjs.ModuleBuilder('floatMath');

// Distance: sqrt(dx*dx + dy*dy)
mod.defineFunction('distance', [webasmjs.ValueType.Float64],
  [webasmjs.ValueType.Float64, webasmjs.ValueType.Float64,
   webasmjs.ValueType.Float64, webasmjs.ValueType.Float64], (f, a) => {
  const x1 = f.getParameter(0);
  const y1 = f.getParameter(1);
  const x2 = f.getParameter(2);
  const y2 = f.getParameter(3);
  const dx = a.declareLocal(webasmjs.ValueType.Float64, 'dx');
  const dy = a.declareLocal(webasmjs.ValueType.Float64, 'dy');

  // dx = x2 - x1
  a.get_local(x2);
  a.get_local(x1);
  a.sub_f64();
  a.set_local(dx);

  // dy = y2 - y1
  a.get_local(y2);
  a.get_local(y1);
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

// Rounding functions
mod.defineFunction('roundUp', [webasmjs.ValueType.Float64], [webasmjs.ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.ceil_f64();
}).withExport();

mod.defineFunction('roundDown', [webasmjs.ValueType.Float64], [webasmjs.ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.floor_f64();
}).withExport();

const instance = await mod.instantiate();
const { distance, roundUp, roundDown } = instance.instance.exports;

log('distance((0,0), (3,4)) = ' + distance(0, 0, 3, 4));
log('distance((1,1), (4,5)) = ' + distance(1, 1, 4, 5));
log('');
log('roundUp(2.3) = ' + roundUp(2.3));
log('roundUp(2.7) = ' + roundUp(2.7));
log('roundDown(2.3) = ' + roundDown(2.3));
log('roundDown(2.7) = ' + roundDown(2.7));`,
  },

  'i64-bigint': {
    label: 'i64 / BigInt',
    group: 'Numeric',
    description: '64-bit integers with BigInt interop — large factorial.',
    target: 'mvp',
    features: [],
    code: `// 64-bit integers — BigInt interop
const mod = new webasmjs.ModuleBuilder('i64ops');

mod.defineFunction('add64', [webasmjs.ValueType.Int64],
  [webasmjs.ValueType.Int64, webasmjs.ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i64();
}).withExport();

mod.defineFunction('mul64', [webasmjs.ValueType.Int64],
  [webasmjs.ValueType.Int64, webasmjs.ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i64();
}).withExport();

// Factorial with i64 — can handle larger numbers
mod.defineFunction('factorial64', [webasmjs.ValueType.Int64], [webasmjs.ValueType.Int64], (f, a) => {
  const n = f.getParameter(0);
  const result = a.declareLocal(webasmjs.ValueType.Int64, 'result');
  const i = a.declareLocal(webasmjs.ValueType.Int64, 'i');

  a.const_i64(1n);
  a.set_local(result);
  a.const_i64(1n);
  a.set_local(i);

  a.loop(webasmjs.BlockType.Void, (loopLabel) => {
    a.block(webasmjs.BlockType.Void, (breakLabel) => {
      a.get_local(i);
      a.get_local(n);
      a.gt_i64();
      a.br_if(breakLabel);

      a.get_local(result);
      a.get_local(i);
      a.mul_i64();
      a.set_local(result);

      a.get_local(i);
      a.const_i64(1n);
      a.add_i64();
      a.set_local(i);
      a.br(loopLabel);
    });
  });

  a.get_local(result);
}).withExport();

const instance = await mod.instantiate();
const { add64, mul64, factorial64 } = instance.instance.exports;

log('add64(1000000000000n, 2000000000000n) = ' + add64(1000000000000n, 2000000000000n));
log('mul64(123456789n, 987654321n) = ' + mul64(123456789n, 987654321n));
log('');
log('Factorial with i64 (no overflow up to 20!):');
for (let n = 0n; n <= 20n; n++) {
  log('  ' + n + '! = ' + factorial64(n));
}`,
  },

  'type-conversions': {
    label: 'Type Conversions',
    group: 'Numeric',
    description: 'Convert between i32, i64, f32, and f64 types.',
    target: 'mvp',
    features: [],
    code: `// Type conversions between numeric types
const mod = new webasmjs.ModuleBuilder('conversions');

// i32 to f64
mod.defineFunction('i32_to_f64', [webasmjs.ValueType.Float64], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.convert_i32_s_f64();
}).withExport();

// f64 to i32 (truncate)
mod.defineFunction('f64_to_i32', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.trunc_f64_s_i32();
}).withExport();

// i32 to i64 (sign extend)
mod.defineFunction('i32_to_i64', [webasmjs.ValueType.Int64], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.extend_i32_s_i64();
}).withExport();

// i64 to i32 (wrap)
mod.defineFunction('i64_to_i32', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.wrap_i64_i32();
}).withExport();

// f32 to f64 (promote)
mod.defineFunction('f32_to_f64', [webasmjs.ValueType.Float64], [webasmjs.ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.promote_f32_f64();
}).withExport();

const instance = await mod.instantiate();
const { i32_to_f64, f64_to_i32, i32_to_i64, i64_to_i32, f32_to_f64 } = instance.instance.exports;

log('i32(42) → f64: ' + i32_to_f64(42));
log('f64(3.14) → i32: ' + f64_to_i32(3.14));
log('f64(99.9) → i32: ' + f64_to_i32(99.9));
log('i32(42) → i64: ' + i32_to_i64(42));
log('i32(-1) → i64: ' + i32_to_i64(-1));
log('i64(0x1FFFFFFFFn) → i32: ' + i64_to_i32(0x1FFFFFFFFn));
log('f32(3.14) → f64: ' + f32_to_f64(3.140000104904175));`,
  },

  'bitwise-ops': {
    label: 'Bitwise Operations',
    group: 'Numeric',
    description: 'Rotation, leading/trailing zeros, and popcount on i32.',
    target: 'mvp',
    features: [],
    code: `// Bitwise operations — rotl, rotr, clz, ctz, popcnt
const mod = new webasmjs.ModuleBuilder('bitwiseOps');

mod.defineFunction('rotl', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.rotl_i32();
}).withExport();

mod.defineFunction('rotr', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.rotr_i32();
}).withExport();

mod.defineFunction('clz', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.clz_i32();
}).withExport();

mod.defineFunction('ctz', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.ctz_i32();
}).withExport();

mod.defineFunction('popcnt', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.popcnt_i32();
}).withExport();

const instance = await mod.instantiate();
const { rotl, rotr, clz, ctz, popcnt } = instance.instance.exports;

log('=== Rotation ===');
log('rotl(0x80000001, 1) = 0x' + (rotl(0x80000001, 1) >>> 0).toString(16));
log('rotr(0x80000001, 1) = 0x' + (rotr(0x80000001, 1) >>> 0).toString(16));
log('rotl(1, 10) = ' + rotl(1, 10) + '  (1 << 10 = 1024)');

log('');
log('=== Bit Counting ===');
log('clz(1) = ' + clz(1) + '  (31 leading zeros)');
log('clz(256) = ' + clz(256) + '  (23 leading zeros)');
log('clz(0) = ' + clz(0) + '  (all 32 zeros)');
log('ctz(256) = ' + ctz(256) + '  (8 trailing zeros)');
log('ctz(1) = ' + ctz(1) + '  (0 trailing zeros)');
log('popcnt(0xFF) = ' + popcnt(0xFF) + '  (8 bits set)');
log('popcnt(0x55555555) = ' + popcnt(0x55555555) + '  (16 bits set)');
log('popcnt(0) = ' + popcnt(0));`,
  },

  'float-special': {
    label: 'Float Special Ops',
    group: 'Numeric',
    description: 'copysign, nearest, trunc — standalone float operations.',
    target: 'mvp',
    features: [],
    code: `// Special float operations — copysign, nearest, trunc
const mod = new webasmjs.ModuleBuilder('floatSpecial');

// copysign(a, b) — magnitude of a, sign of b
mod.defineFunction('copysign', [webasmjs.ValueType.Float64],
  [webasmjs.ValueType.Float64, webasmjs.ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.copysign_f64();
}).withExport();

// nearest — round to nearest even (banker's rounding)
mod.defineFunction('nearest', [webasmjs.ValueType.Float64],
  [webasmjs.ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.nearest_f64();
}).withExport();

// trunc — round towards zero (remove fractional part)
mod.defineFunction('trunc', [webasmjs.ValueType.Float64],
  [webasmjs.ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.trunc_f64();
}).withExport();

const instance = await mod.instantiate();
const { copysign, nearest, trunc } = instance.instance.exports;

log('=== copysign(magnitude, sign) ===');
log('copysign(5.0, -1.0) = ' + copysign(5.0, -1.0));
log('copysign(-5.0, 1.0) = ' + copysign(-5.0, 1.0));
log('copysign(3.14, -0.0) = ' + copysign(3.14, -0.0));

log('');
log('=== nearest (banker\\u2019s rounding) ===');
log('nearest(0.5) = ' + nearest(0.5) + '  (rounds to even: 0)');
log('nearest(1.5) = ' + nearest(1.5) + '  (rounds to even: 2)');
log('nearest(2.5) = ' + nearest(2.5) + '  (rounds to even: 2)');
log('nearest(3.5) = ' + nearest(3.5) + '  (rounds to even: 4)');
log('nearest(2.3) = ' + nearest(2.3));
log('nearest(-1.7) = ' + nearest(-1.7));

log('');
log('=== trunc (towards zero) ===');
log('trunc(2.9) = ' + trunc(2.9));
log('trunc(-2.9) = ' + trunc(-2.9));
log('trunc(0.1) = ' + trunc(0.1));`,
  },

  'reinterpret': {
    label: 'Reinterpret Casts',
    group: 'Numeric',
    description: 'Reinterpret bits between float and int without conversion.',
    target: 'mvp',
    features: [],
    code: `// Reinterpret — same bits, different type interpretation
const mod = new webasmjs.ModuleBuilder('reinterpret');

// View f32 bits as i32
mod.defineFunction('f32_bits', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.reinterpret_f32_i32();
}).withExport();

// View i32 bits as f32
mod.defineFunction('i32_as_f32', [webasmjs.ValueType.Float32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.reinterpret_i32_f32();
}).withExport();

// View f64 bits as i64
mod.defineFunction('f64_bits', [webasmjs.ValueType.Int64],
  [webasmjs.ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.reinterpret_f64_i64();
}).withExport();

// View i64 bits as f64
mod.defineFunction('i64_as_f64', [webasmjs.ValueType.Float64],
  [webasmjs.ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.reinterpret_i64_f64();
}).withExport();

const instance = await mod.instantiate();
const { f32_bits, i32_as_f32, f64_bits, i64_as_f64 } = instance.instance.exports;

log('=== f32 \\u2194 i32 reinterpret ===');
log('f32_bits(1.0)  = 0x' + (f32_bits(1.0) >>> 0).toString(16).padStart(8, '0') + '  (IEEE 754: 3F800000)');
log('f32_bits(-1.0) = 0x' + (f32_bits(-1.0) >>> 0).toString(16).padStart(8, '0') + '  (BF800000)');
log('f32_bits(0.0)  = 0x' + (f32_bits(0.0) >>> 0).toString(16).padStart(8, '0'));
log('i32_as_f32(0x3F800000) = ' + i32_as_f32(0x3F800000) + '  (1.0)');
log('i32_as_f32(0x40490FDB) = ' + i32_as_f32(0x40490FDB) + '  (~pi)');

log('');
log('=== f64 \\u2194 i64 reinterpret ===');
log('f64_bits(1.0) = 0x' + f64_bits(1.0).toString(16) + '  (3FF0000000000000)');
log('i64_as_f64(0x4009_21FB_5444_2D18n) = ' + i64_as_f64(0x400921FB54442D18n) + '  (pi)');`,
  },

  // ─── Algorithms ───
  'bubble-sort': {
    label: 'Bubble Sort',
    group: 'Algorithms',
    description: 'Sort an array in linear memory with nested loops.',
    target: 'mvp',
    features: [],
    code: `// Bubble sort in WASM memory
const mod = new webasmjs.ModuleBuilder('bubbleSort');
mod.defineMemory(1);

// Store i32 at index (index * 4)
mod.defineFunction('set', null, [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(4);
  a.mul_i32();
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0);
}).withExport();

// Load i32 at index
mod.defineFunction('get', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(4);
  a.mul_i32();
  a.load_i32(2, 0);
}).withExport();

const setFn = mod._functions[0];
const getFn = mod._functions[1];

// Bubble sort(length)
mod.defineFunction('sort', null, [webasmjs.ValueType.Int32], (f, a) => {
  const len = f.getParameter(0);
  const i = a.declareLocal(webasmjs.ValueType.Int32, 'i');
  const j = a.declareLocal(webasmjs.ValueType.Int32, 'j');
  const temp = a.declareLocal(webasmjs.ValueType.Int32, 'temp');
  const swapped = a.declareLocal(webasmjs.ValueType.Int32, 'swapped');

  a.const_i32(0);
  a.set_local(i);

  // Outer loop
  a.loop(webasmjs.BlockType.Void, (outerLoop) => {
    a.block(webasmjs.BlockType.Void, (outerBreak) => {
      a.get_local(i);
      a.get_local(len);
      a.const_i32(1);
      a.sub_i32();
      a.ge_i32();
      a.br_if(outerBreak);

      a.const_i32(0);
      a.set_local(swapped);
      a.const_i32(0);
      a.set_local(j);

      // Inner loop
      a.loop(webasmjs.BlockType.Void, (innerLoop) => {
        a.block(webasmjs.BlockType.Void, (innerBreak) => {
          a.get_local(j);
          a.get_local(len);
          a.const_i32(1);
          a.sub_i32();
          a.get_local(i);
          a.sub_i32();
          a.ge_i32();
          a.br_if(innerBreak);

          // if arr[j] > arr[j+1], swap
          a.get_local(j);
          a.call(getFn);
          a.get_local(j);
          a.const_i32(1);
          a.add_i32();
          a.call(getFn);
          a.gt_i32();
          a.if(webasmjs.BlockType.Void, () => {
            // temp = arr[j]
            a.get_local(j);
            a.call(getFn);
            a.set_local(temp);
            // arr[j] = arr[j+1]
            a.get_local(j);
            a.get_local(j);
            a.const_i32(1);
            a.add_i32();
            a.call(getFn);
            a.call(setFn);
            // arr[j+1] = temp
            a.get_local(j);
            a.const_i32(1);
            a.add_i32();
            a.get_local(temp);
            a.call(setFn);
            a.const_i32(1);
            a.set_local(swapped);
          });

          a.get_local(j);
          a.const_i32(1);
          a.add_i32();
          a.set_local(j);
          a.br(innerLoop);
        });
      });

      // Early exit if no swaps
      a.get_local(swapped);
      a.eqz_i32();
      a.br_if(outerBreak);

      a.get_local(i);
      a.const_i32(1);
      a.add_i32();
      a.set_local(i);
      a.br(outerLoop);
    });
  });
}).withExport();

const instance = await mod.instantiate();
const { set, get, sort } = instance.instance.exports;

const data = [64, 34, 25, 12, 22, 11, 90, 1, 55, 42];
log('Before: ' + data.join(', '));

data.forEach((v, i) => set(i, v));
sort(data.length);

const sorted = [];
for (let i = 0; i < data.length; i++) sorted.push(get(i));
log('After:  ' + sorted.join(', '));`,
  },

  'gcd': {
    label: 'GCD (Euclidean)',
    group: 'Algorithms',
    description: 'Greatest common divisor using the Euclidean algorithm.',
    target: 'mvp',
    features: [],
    code: `// Greatest common divisor — Euclidean algorithm
const mod = new webasmjs.ModuleBuilder('gcd');

mod.defineFunction('gcd', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);
  const temp = a.declareLocal(webasmjs.ValueType.Int32, 'temp');

  a.loop(webasmjs.BlockType.Void, (loopLabel) => {
    a.block(webasmjs.BlockType.Void, (breakLabel) => {
      a.get_local(y);
      a.eqz_i32();
      a.br_if(breakLabel);

      // temp = y
      a.get_local(y);
      a.set_local(temp);
      // y = x % y
      a.get_local(x);
      a.get_local(y);
      a.rem_i32_u();
      a.set_local(y);
      // x = temp
      a.get_local(temp);
      a.set_local(x);

      a.br(loopLabel);
    });
  });

  a.get_local(x);
}).withExport();

const instance = await mod.instantiate();
const { gcd } = instance.instance.exports;

const pairs = [[12, 8], [100, 75], [17, 13], [48, 18], [0, 5], [7, 0], [1071, 462]];
for (const [a, b] of pairs) {
  log('gcd(' + a + ', ' + b + ') = ' + gcd(a, b));
}`,
  },

  'collatz': {
    label: 'Collatz Conjecture',
    group: 'Algorithms',
    description: 'Count steps to reach 1 using the 3n+1 conjecture.',
    target: 'mvp',
    features: [],
    code: `// Collatz conjecture — count steps to reach 1
const mod = new webasmjs.ModuleBuilder('collatz');

mod.defineFunction('collatz', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const steps = a.declareLocal(webasmjs.ValueType.Int32, 'steps');

  a.const_i32(0);
  a.set_local(steps);

  a.loop(webasmjs.BlockType.Void, (loopLabel) => {
    a.block(webasmjs.BlockType.Void, (breakLabel) => {
      a.get_local(n);
      a.const_i32(1);
      a.le_i32();
      a.br_if(breakLabel);

      a.get_local(steps);
      a.const_i32(1);
      a.add_i32();
      a.set_local(steps);

      // if n is odd: n = 3n + 1, else: n = n / 2
      a.get_local(n);
      a.const_i32(1);
      a.and_i32();
      a.if(webasmjs.BlockType.Void);
        // odd: n = 3n + 1
        a.get_local(n);
        a.const_i32(3);
        a.mul_i32();
        a.const_i32(1);
        a.add_i32();
        a.set_local(n);
      a.else();
        // even: n = n / 2
        a.get_local(n);
        a.const_i32(1);
        a.shr_i32_u();
        a.set_local(n);
      a.end();

      a.br(loopLabel);
    });
  });

  a.get_local(steps);
}).withExport();

const instance = await mod.instantiate();
const { collatz } = instance.instance.exports;

for (const n of [1, 2, 3, 6, 7, 9, 27, 97, 871]) {
  log('collatz(' + n + ') = ' + collatz(n) + ' steps');
}`,
  },

  'is-prime': {
    label: 'Primality Test',
    group: 'Algorithms',
    description: 'Trial division to test and list prime numbers.',
    target: 'mvp',
    features: [],
    code: `// Primality test — trial division
const mod = new webasmjs.ModuleBuilder('prime');

mod.defineFunction('isPrime', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const i = a.declareLocal(webasmjs.ValueType.Int32, 'i');

  // n <= 1 → not prime
  a.get_local(n);
  a.const_i32(1);
  a.le_i32();
  a.if(webasmjs.BlockType.Void, () => {
    a.const_i32(0);
    a.return();
  });

  // n <= 3 → prime
  a.get_local(n);
  a.const_i32(3);
  a.le_i32();
  a.if(webasmjs.BlockType.Void, () => {
    a.const_i32(1);
    a.return();
  });

  // divisible by 2 → not prime
  a.get_local(n);
  a.const_i32(2);
  a.rem_i32_u();
  a.eqz_i32();
  a.if(webasmjs.BlockType.Void, () => {
    a.const_i32(0);
    a.return();
  });

  // Trial division from 3 to sqrt(n)
  a.const_i32(3);
  a.set_local(i);

  a.loop(webasmjs.BlockType.Void, (loopLabel) => {
    a.block(webasmjs.BlockType.Void, (breakLabel) => {
      // if i * i > n, break (is prime)
      a.get_local(i);
      a.get_local(i);
      a.mul_i32();
      a.get_local(n);
      a.gt_i32();
      a.br_if(breakLabel);

      // if n % i == 0, not prime
      a.get_local(n);
      a.get_local(i);
      a.rem_i32_u();
      a.eqz_i32();
      a.if(webasmjs.BlockType.Void, () => {
        a.const_i32(0);
        a.return();
      });

      a.get_local(i);
      a.const_i32(2);
      a.add_i32();
      a.set_local(i);
      a.br(loopLabel);
    });
  });

  a.const_i32(1);
}).withExport();

const instance = await mod.instantiate();
const { isPrime } = instance.instance.exports;

log('Prime numbers up to 100:');
const primes = [];
for (let n = 2; n <= 100; n++) {
  if (isPrime(n)) primes.push(n);
}
log(primes.join(', '));
log('');
log('Testing larger numbers:');
for (const n of [997, 1000, 7919, 7920, 104729]) {
  log(n + ' is ' + (isPrime(n) ? 'prime' : 'not prime'));
}`,
  },

  // ─── WAT Parser ───
  'wat-parser': {
    label: 'WAT Parser',
    group: 'WAT',
    description: 'Parse WebAssembly Text format and instantiate the module.',
    target: 'mvp',
    features: [],
    code: `// Parse WAT text and instantiate
const watSource = \`
(module $parsed
  (func $add (param i32) (param i32) (result i32)
    local.get 0
    local.get 1
    i32.add
  )
  (export "add" (func $add))
)
\`;

log('Parsing WAT source...');
const mod = webasmjs.parseWat(watSource);
log('WAT parsed successfully!');
log('');

const instance = await mod.instantiate();
const add = instance.instance.exports.add;
log('add(3, 4) = ' + add(3, 4));
log('add(100, 200) = ' + add(100, 200));
log('add(-5, 10) = ' + add(-5, 10));`,
  },

  'wat-loop': {
    label: 'WAT Loop & Branch',
    group: 'WAT',
    description: 'WAT with loop, block, and branch instructions.',
    target: 'mvp',
    features: [],
    code: `// WAT with loop and branch instructions
const watSource = \`
(module $loops
  (func $sum (param i32) (result i32)
    (local i32) ;; accumulator
    (local i32) ;; counter
    i32.const 0
    local.set 1
    i32.const 1
    local.set 2
    block $break
      loop $continue
        local.get 2
        local.get 0
        i32.gt_s
        br_if $break

        local.get 1
        local.get 2
        i32.add
        local.set 1

        local.get 2
        i32.const 1
        i32.add
        local.set 2
        br $continue
      end
    end
    local.get 1
  )
  (export "sum" (func $sum))
)
\`;

const mod = webasmjs.parseWat(watSource);
const instance = await mod.instantiate();
const sum = instance.instance.exports.sum;

log('Sum from 1 to N:');
for (const n of [0, 1, 5, 10, 50, 100]) {
  log('  sum(' + n + ') = ' + sum(n));
}`,
  },

  'wat-memory': {
    label: 'WAT Memory & Data',
    group: 'WAT',
    description: 'WAT with memory declarations, store/load, and exports.',
    target: 'mvp',
    features: [],
    code: `// WAT with memory, data segments, and imports
const watSource = \`
(module $memTest
  (memory 1)
  (func $store (param i32) (param i32)
    local.get 0
    local.get 1
    i32.store offset=0 align=4
  )
  (func $load (param i32) (result i32)
    local.get 0
    i32.load offset=0 align=4
  )
  (export "store" (func $store))
  (export "load" (func $load))
  (export "mem" (memory 0))
)
\`;

const mod = webasmjs.parseWat(watSource);
const instance = await mod.instantiate();
const { store, load, mem } = instance.instance.exports;

// Store values at various offsets
store(0, 11);
store(4, 22);
store(8, 33);
store(12, 44);

log('Memory contents:');
for (let addr = 0; addr < 16; addr += 4) {
  log('  [' + addr + '] = ' + load(addr));
}

// Also inspect raw memory
const view = new Uint8Array(mem.buffer);
log('');
log('Raw bytes [0..15]: ' + Array.from(view.slice(0, 16)).join(', '));`,
  },

  'wat-global': {
    label: 'WAT Globals & Start',
    group: 'WAT',
    description: 'WAT with mutable globals, start function, and inc/dec.',
    target: 'mvp',
    features: [],
    code: `// WAT with globals, start function, and if/else
const watSource = \`
(module $globalDemo
  (global $counter (mut i32) (i32.const 0))

  (func $init
    i32.const 100
    global.set 0
  )

  (func $inc (result i32)
    global.get 0
    i32.const 1
    i32.add
    global.set 0
    global.get 0
  )

  (func $dec (result i32)
    global.get 0
    i32.const 1
    i32.sub
    global.set 0
    global.get 0
  )

  (func $getCounter (result i32)
    global.get 0
  )

  (start $init)
  (export "inc" (func $inc))
  (export "dec" (func $dec))
  (export "getCounter" (func $getCounter))
)
\`;

const mod = webasmjs.parseWat(watSource);
const instance = await mod.instantiate();
const { inc, dec, getCounter } = instance.instance.exports;

log('Initial (set by start): ' + getCounter());
log('inc() = ' + inc());
log('inc() = ' + inc());
log('inc() = ' + inc());
log('dec() = ' + dec());
log('Final: ' + getCounter());`,
  },

  'wat-imports': {
    label: 'WAT Imports',
    group: 'WAT',
    description: 'WAT with function imports calling JavaScript host functions.',
    target: 'mvp',
    features: [],
    code: `// WAT with imports — call JavaScript from WebAssembly text
const watSource = \`
(module $importDemo
  (import "env" "print" (func $print (param i32)))
  (import "env" "add" (func $add (param i32) (param i32) (result i32)))

  (func $run
    ;; Call host add(3, 4), then print the result
    i32.const 3
    i32.const 4
    call $add
    call $print

    ;; Print some constants
    i32.const 100
    call $print
    i32.const 200
    call $print
  )

  (export "run" (func $run))
)
\`;

const mod = webasmjs.parseWat(watSource);
const results = [];
const instance = await mod.instantiate({
  env: {
    print: (v) => results.push(v),
    add: (a, b) => a + b,
  },
});

instance.instance.exports.run();

log('WAT module called JS imports:');
results.forEach((v, i) => log('  print[' + i + '] = ' + v));
log('');
log('First value is add(3, 4) = 7, then constants 100, 200');`,
  },

  // ─── SIMD ───
  'simd-vec-add': {
    label: 'SIMD Vector Add',
    group: 'SIMD',
    description: 'Add two f32x4 vectors in memory using SIMD.',
    target: '3.0',
    features: ['simd'],
    code: `// SIMD: add two f32x4 vectors in memory
const mod = new webasmjs.ModuleBuilder('simdAdd');
mod.defineMemory(1);

// vec4_add(srcA, srcB, dst) — adds two 4-float vectors
mod.defineFunction('vec4_add', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));  // push dest address first
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.add_f32x4();
  a.store_v128(2, 0);              // store expects [addr, value] on stack
}).withExport();

mod.defineFunction('setF32', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_f32(2, 0);
}).withExport();

mod.defineFunction('getF32', [webasmjs.ValueType.Float32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_f32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { vec4_add, setF32, getF32 } = instance.instance.exports;

// A = [1, 2, 3, 4] at offset 0
// B = [10, 20, 30, 40] at offset 16
for (let i = 0; i < 4; i++) {
  setF32(i * 4, i + 1);
  setF32(16 + i * 4, (i + 1) * 10);
}

vec4_add(0, 16, 32);

log('A = [1, 2, 3, 4]');
log('B = [10, 20, 30, 40]');
log('A + B:');
for (let i = 0; i < 4; i++) {
  log('  [' + i + '] = ' + getF32(32 + i * 4));
}`,
  },

  'simd-dot-product': {
    label: 'SIMD Dot Product',
    group: 'SIMD',
    description: 'Element-wise multiply then sum lanes for dot product.',
    target: '3.0',
    features: ['simd'],
    code: `// SIMD dot product: multiply element-wise then sum lanes
const mod = new webasmjs.ModuleBuilder('simdDot');
mod.defineMemory(1);

mod.defineFunction('dot4', [webasmjs.ValueType.Float32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  const products = a.declareLocal(webasmjs.ValueType.V128, 'products');

  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.mul_f32x4();
  a.set_local(products);

  // Sum all 4 lanes
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

mod.defineFunction('setF32', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_f32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { dot4, setF32 } = instance.instance.exports;

const vecA = [1, 2, 3, 4];
const vecB = [5, 6, 7, 8];

for (let i = 0; i < 4; i++) {
  setF32(i * 4, vecA[i]);
  setF32(16 + i * 4, vecB[i]);
}

log('A = [' + vecA + ']');
log('B = [' + vecB + ']');
log('dot(A, B) = ' + dot4(0, 16));
log('Expected: ' + (1*5 + 2*6 + 3*7 + 4*8));`,
  },

  'simd-splat-scale': {
    label: 'SIMD Splat & Scale',
    group: 'SIMD',
    description: 'Broadcast a scalar to all lanes and multiply a vector.',
    target: '3.0',
    features: ['simd'],
    code: `// SIMD splat: broadcast a scalar to all lanes, then multiply
const mod = new webasmjs.ModuleBuilder('simdScale');
mod.defineMemory(1);

// scale_vec4(src, dst, scalar) — multiply a vector by a scalar
mod.defineFunction('scale_vec4', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(1));  // push dest address first
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(2));
  a.splat_f32x4();          // broadcast scalar to all 4 lanes
  a.mul_f32x4();
  a.store_v128(2, 0);       // store expects [addr, value] on stack
}).withExport();

mod.defineFunction('setF32', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_f32(2, 0);
}).withExport();

mod.defineFunction('getF32', [webasmjs.ValueType.Float32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_f32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { scale_vec4, setF32, getF32 } = instance.instance.exports;

const vec = [2.0, 4.0, 6.0, 8.0];
for (let i = 0; i < 4; i++) setF32(i * 4, vec[i]);

scale_vec4(0, 16, 3.0);

log('Vector: [' + vec + ']');
log('Scalar: 3.0');
log('Scaled:');
for (let i = 0; i < 4; i++) {
  log('  [' + i + '] = ' + getF32(16 + i * 4));
}`,
  },

  // ─── Bulk Memory ───
  'bulk-memory': {
    label: 'Bulk Memory Ops',
    group: 'Bulk Memory',
    description: 'Fill and copy memory regions with bulk operations.',
    target: '2.0',
    features: ['bulk-memory'],
    code: `// Bulk memory: memory.fill and memory.copy
const mod = new webasmjs.ModuleBuilder('bulkMem');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// fill(dest, value, length)
mod.defineFunction('fill', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.get_local(f.getParameter(2));
  a.memory_fill(0);
}).withExport();

// copy(dest, src, length)
mod.defineFunction('copy', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.get_local(f.getParameter(2));
  a.memory_copy(0, 0);
}).withExport();

const instance = await mod.instantiate();
const { fill, copy, memory } = instance.instance.exports;
const view = new Uint8Array(memory.buffer);

// Fill 8 bytes at offset 0 with 0xAA
fill(0, 0xAA, 8);
log('After fill(0, 0xAA, 8):');
log('  bytes[0..7] = [' + Array.from(view.slice(0, 8)).map(b => '0x' + b.toString(16).toUpperCase()).join(', ') + ']');

// Copy those 8 bytes to offset 32
copy(32, 0, 8);
log('');
log('After copy(32, 0, 8):');
log('  bytes[32..39] = [' + Array.from(view.slice(32, 40)).map(b => '0x' + b.toString(16).toUpperCase()).join(', ') + ']');

// Fill a region with incrementing pattern using a loop
fill(64, 0, 16);
for (let i = 0; i < 16; i++) {
  view[64 + i] = i * 3;
}
log('');
log('Manual pattern at [64..79]:');
log('  ' + Array.from(view.slice(64, 80)).join(', '));

// Copy that pattern further
copy(128, 64, 16);
log('Copied to [128..143]:');
log('  ' + Array.from(view.slice(128, 144)).join(', '));`,
  },

  // ─── Post-MVP Features ───
  'sign-extend': {
    label: 'Sign Extension',
    group: 'Post-MVP',
    description: 'Interpret low bits as signed values with extend8/extend16.',
    target: '2.0',
    features: ['sign-extend'],
    code: `// Sign extension: interpret low bits as signed values
const mod = new webasmjs.ModuleBuilder('signExt');

// Treat low 8 bits as a signed byte
mod.defineFunction('extend8', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.extend8_s_i32();
}).withExport();

// Treat low 16 bits as a signed i16
mod.defineFunction('extend16', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.extend16_s_i32();
}).withExport();

const instance = await mod.instantiate();
const { extend8, extend16 } = instance.instance.exports;

log('i32.extend8_s:');
log('  extend8(0x7F) = ' + extend8(0x7F) + '  (127, positive byte)');
log('  extend8(0x80) = ' + extend8(0x80) + '  (128 → -128, sign bit set)');
log('  extend8(0xFF) = ' + extend8(0xFF) + '  (255 → -1)');
log('  extend8(0x100) = ' + extend8(0x100) + '  (256 → 0, wraps to low byte)');
log('');
log('i32.extend16_s:');
log('  extend16(0x7FFF) = ' + extend16(0x7FFF) + '  (32767, positive)');
log('  extend16(0x8000) = ' + extend16(0x8000) + '  (32768 → -32768)');
log('  extend16(0xFFFF) = ' + extend16(0xFFFF) + '  (65535 → -1)');`,
  },

  'sat-trunc': {
    label: 'Saturating Truncation',
    group: 'Post-MVP',
    description: 'Float-to-int conversion that clamps instead of trapping.',
    target: '2.0',
    features: ['sat-trunc'],
    code: `// Saturating truncation: float → int without trapping on overflow
const mod = new webasmjs.ModuleBuilder('satTrunc');

// Normal trunc would trap on overflow; saturating clamps instead
mod.defineFunction('sat_f64_to_i32', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.trunc_sat_f64_s_i32();
}).withExport();

mod.defineFunction('sat_f64_to_u32', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.trunc_sat_f64_u_i32();
}).withExport();

const instance = await mod.instantiate();
const { sat_f64_to_i32, sat_f64_to_u32 } = instance.instance.exports;

log('Saturating f64 → i32 (signed):');
log('  42.9   → ' + sat_f64_to_i32(42.9));
log('  -42.9  → ' + sat_f64_to_i32(-42.9));
log('  1e20   → ' + sat_f64_to_i32(1e20) + '  (clamped to i32 max)');
log('  -1e20  → ' + sat_f64_to_i32(-1e20) + '  (clamped to i32 min)');
log('  NaN    → ' + sat_f64_to_i32(NaN) + '  (NaN → 0)');
log('  Inf    → ' + sat_f64_to_i32(Infinity) + '  (clamped)');
log('');
log('Saturating f64 → u32 (unsigned, shown as signed i32):');
log('  42.9   → ' + sat_f64_to_u32(42.9));
log('  -1.0   → ' + sat_f64_to_u32(-1.0) + '  (negative → 0)');
log('  1e20   → ' + sat_f64_to_u32(1e20) + '  (clamped to u32 max)');`,
  },

  'ref-types': {
    label: 'Reference Types',
    group: 'Post-MVP',
    description: 'Use ref.null, ref.is_null, and ref.func instructions.',
    target: '2.0',
    features: ['reference-types'],
    code: `// Reference types: ref.null, ref.is_null, ref.func
const mod = new webasmjs.ModuleBuilder('refTypes');

const double = mod.defineFunction('double', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
}).withExport();

// Check if a null funcref is null → 1
mod.defineFunction('isRefNull', [webasmjs.ValueType.Int32], [], (f, a) => {
  a.ref_null(0x70);
  a.ref_is_null();
}).withExport();

// Check if a real function ref is null → 0
mod.defineFunction('isFuncNull', [webasmjs.ValueType.Int32], [], (f, a) => {
  a.ref_func(double);
  a.ref_is_null();
}).withExport();

const instance = await mod.instantiate();
const { isRefNull, isFuncNull } = instance.instance.exports;

log('ref.null + ref.is_null:');
log('  null funcref is null: ' + (isRefNull() === 1));
log('  real func ref is null: ' + (isFuncNull() === 1));
log('');
log('double(21) = ' + instance.instance.exports.double(21));`,
  },

  'target-system': {
    label: 'Target System',
    group: 'Post-MVP',
    description: 'Choose WebAssembly targets and feature flags.',
    target: 'mvp',
    features: [],
    code: `// Target system: control which features are available
// Default is 'latest' — all features enabled
const modLatest = new webasmjs.ModuleBuilder('latest');
log('latest features:');
log('  threads: ' + modLatest.hasFeature('threads'));
log('  simd: ' + modLatest.hasFeature('simd'));
log('  exception-handling: ' + modLatest.hasFeature('exception-handling'));
log('  memory64: ' + modLatest.hasFeature('memory64'));
log('  relaxed-simd: ' + modLatest.hasFeature('relaxed-simd'));

log('');

// WebAssembly 2.0 — only widely-deployed features
const mod2 = new webasmjs.ModuleBuilder('compat', { target: '2.0' });
log('2.0 features:');
log('  sign-extend: ' + mod2.hasFeature('sign-extend'));
log('  bulk-memory: ' + mod2.hasFeature('bulk-memory'));
log('  threads: ' + mod2.hasFeature('threads'));
log('  simd: ' + mod2.hasFeature('simd'));

log('');

// MVP with specific features
const modCustom = new webasmjs.ModuleBuilder('custom', {
  target: 'mvp',
  features: ['simd', 'bulk-memory'],
});
log('mvp + simd + bulk-memory:');
log('  simd: ' + modCustom.hasFeature('simd'));
log('  bulk-memory: ' + modCustom.hasFeature('bulk-memory'));
log('  threads: ' + modCustom.hasFeature('threads'));

log('');

// Build a simple module with 2.0 target
mod2.defineFunction('add', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

const instance = await mod2.instantiate();
log('2.0 module works: add(3, 4) = ' + instance.instance.exports.add(3, 4));`,
  },

  'multi-value': {
    label: 'Multi-Value Returns',
    group: 'Post-MVP',
    description: 'Functions returning multiple values at once.',
    target: '2.0',
    features: ['multi-value'],
    code: `// Multi-value: functions can return more than one value
const mod = new webasmjs.ModuleBuilder('multiValue');

// divmod returns both quotient and remainder
mod.defineFunction('divmod', [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  const dividend = f.getParameter(0);
  const divisor = f.getParameter(1);

  // Push quotient
  a.get_local(dividend);
  a.get_local(divisor);
  a.div_s_i32();

  // Push remainder
  a.get_local(dividend);
  a.get_local(divisor);
  a.rem_s_i32();
}).withExport();

const instance = await mod.instantiate();
const divmod = instance.instance.exports.divmod;

log('Multi-value returns (quotient, remainder):');
for (const [a, b] of [[17, 5], [100, 7], [42, 6], [99, 10]]) {
  const result = divmod(a, b);
  log('  ' + a + ' / ' + b + ' = ' + result);
}`,
  },

  'mutable-global-export': {
    label: 'Mutable Global Export',
    group: 'Post-MVP',
    description: 'Export a mutable global, read from JavaScript.',
    target: '2.0',
    features: ['mutable-globals'],
    code: `// Mutable global export: JS can read the global's value
const mod = new webasmjs.ModuleBuilder('mutGlobal');

const counter = mod.defineGlobal(webasmjs.ValueType.Int32, true, 0);
mod.exportGlobal(counter, 'counter');

mod.defineFunction('increment', null, [], (f, a) => {
  a.get_global(counter);
  a.const_i32(1);
  a.add_i32();
  a.set_global(counter);
}).withExport();

mod.defineFunction('add', null, [webasmjs.ValueType.Int32], (f, a) => {
  a.get_global(counter);
  a.get_local(f.getParameter(0));
  a.add_i32();
  a.set_global(counter);
}).withExport();

const instance = await mod.instantiate();
const { increment, add, counter: g } = instance.instance.exports;

log('Initial: ' + g.value);
increment();
increment();
increment();
log('After 3 increments: ' + g.value);
add(10);
log('After add(10): ' + g.value);
add(-5);
log('After add(-5): ' + g.value);`,
  },

  'tail-call': {
    label: 'Tail Calls',
    group: 'Post-MVP',
    description: 'Tail-recursive factorial — no stack overflow.',
    target: '3.0',
    features: ['tail-call'],
    code: `// Tail calls: return_call reuses the current frame
const mod = new webasmjs.ModuleBuilder('tailCall');

// Tail-recursive helper: fact_helper(n, acc)
const helper = mod.defineFunction('fact_helper', [webasmjs.ValueType.Int64],
  [webasmjs.ValueType.Int64, webasmjs.ValueType.Int64], (f, a) => {
  const n = f.getParameter(0);
  const acc = f.getParameter(1);

  // Base case: n <= 1
  a.get_local(n);
  a.const_i64(1n);
  a.le_s_i64();
  a.if(webasmjs.BlockType.Void, () => {
    a.get_local(acc);
    a.return();
  });

  // Tail call: return_call fact_helper(n-1, n*acc)
  a.get_local(n);
  a.const_i64(1n);
  a.sub_i64();
  a.get_local(n);
  a.get_local(acc);
  a.mul_i64();
  a.return_call(helper);
});

// Public entry: factorial(n)
mod.defineFunction('factorial', [webasmjs.ValueType.Int64],
  [webasmjs.ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i64(1n);
  a.call(helper);
}).withExport();

const instance = await mod.instantiate();
const factorial = instance.instance.exports.factorial;

log('Tail-recursive factorial (i64):');
for (let n = 0n; n <= 20n; n++) {
  log('  ' + n + '! = ' + factorial(n));
}
log('');
log('No stack overflow — return_call reuses the frame!');`,
  },

  'shared-memory': {
    label: 'Shared Memory',
    group: 'Post-MVP',
    description: 'Shared memory with atomic load/store/add.',
    target: '3.0',
    features: ['threads'],
    code: `// Shared memory + atomic operations
const mod = new webasmjs.ModuleBuilder('atomics');

// Shared memory requires both initial and maximum
const mem = mod.defineMemory(1, 10, true); // shared=true
mod.exportMemory(mem, 'memory');

// Atomic store
mod.defineFunction('atomicStore', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_store_i32(2, 0);
}).withExport();

// Atomic load
mod.defineFunction('atomicLoad', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.atomic_load_i32(2, 0);
}).withExport();

// Atomic add (returns old value)
mod.defineFunction('atomicAdd', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_add_i32(2, 0);
}).withExport();

// Atomic compare-and-swap
mod.defineFunction('atomicCAS', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // address
  a.get_local(f.getParameter(1)); // expected
  a.get_local(f.getParameter(2)); // replacement
  a.atomic_rmw_cmpxchg_i32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { atomicStore, atomicLoad, atomicAdd, atomicCAS } = instance.instance.exports;

log('=== Atomic Operations ===');
atomicStore(0, 100);
log('atomicStore(0, 100)');
log('atomicLoad(0) = ' + atomicLoad(0));

log('');
const old1 = atomicAdd(0, 5);
log('atomicAdd(0, 5) returned old value: ' + old1);
log('atomicLoad(0) = ' + atomicLoad(0));

const old2 = atomicAdd(0, 10);
log('atomicAdd(0, 10) returned old value: ' + old2);
log('atomicLoad(0) = ' + atomicLoad(0));

log('');
log('=== Compare-and-Swap ===');
const cas1 = atomicCAS(0, 115, 200);
log('atomicCAS(0, 115, 200) = ' + cas1 + ' (matched, swapped)');
log('atomicLoad(0) = ' + atomicLoad(0));

const cas2 = atomicCAS(0, 999, 300);
log('atomicCAS(0, 999, 300) = ' + cas2 + ' (no match, not swapped)');
log('atomicLoad(0) = ' + atomicLoad(0));`,
  },

  'exception-handling': {
    label: 'Exception Handling',
    group: 'Post-MVP',
    description: 'Define tags and throw exceptions from WASM.',
    target: '3.0',
    features: ['exception-handling'],
    code: `// Exception handling: defineTag + throw
const mod = new webasmjs.ModuleBuilder('exceptions', { disableVerification: true });

// Define a tag with an i32 payload (like an error code)
const errorTag = mod.defineTag([webasmjs.ValueType.Int32]);

// Throws when input is negative
mod.defineFunction('checkPositive', null, [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(0);
  a.lt_s_i32();
  a.if(webasmjs.BlockType.Void, () => {
    a.get_local(f.getParameter(0));
    a.throw(errorTag._index);
  });
}).withExport();

// Show the WAT output with tag and throw
const wat = mod.toString();
log('=== WAT Output ===');
log(wat);

// Compile to bytes
const bytes = mod.toBytes();
log('Module compiled: ' + bytes.length + ' bytes');
log('Valid WASM: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'memory64': {
    label: 'Memory64',
    group: 'Post-MVP',
    description: '64-bit addressed memory for very large address spaces.',
    target: '3.0',
    features: ['memory64'],
    code: `// Memory64: 64-bit addressed memory
const mod = new webasmjs.ModuleBuilder('memory64');

// Define a 64-bit addressed memory
const mem = mod.defineMemory(1, 100, false, true); // memory64=true
mod.exportMemory(mem, 'memory');

// Store: address is i64 for memory64
mod.defineFunction('store64', null,
  [webasmjs.ValueType.Int64, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // i64 address
  a.get_local(f.getParameter(1)); // i32 value
  a.store_i32(2, 0);
}).withExport();

// Load: address is i64 for memory64
mod.defineFunction('load64', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0)); // i64 address
  a.load_i32(2, 0);
}).withExport();

// Show the WAT — note i64 addresses
const wat = mod.toString();
log('=== WAT Output (memory64) ===');
log(wat);

// Compile
const bytes = mod.toBytes();
log('');
log('Module compiled: ' + bytes.length + ' bytes');
log('');
log('Note: memory64 uses i64 addresses instead of i32.');
log('Runtime instantiation requires engine support for memory64.');`,
  },

  // ─── Debug & Inspection ───
  'debug-names': {
    label: 'Debug Name Section',
    group: 'Debug',
    description: 'Inspect function, local, and global names in the binary.',
    target: 'mvp',
    features: [],
    code: `// Inspect the debug name section in the binary
const mod = new webasmjs.ModuleBuilder('debugExample');

const g = mod.defineGlobal(webasmjs.ValueType.Int32, true, 0);
g.withName('counter');

mod.defineFunction('add', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  f.getParameter(0).withName('x');
  f.getParameter(1).withName('y');
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

mod.defineFunction('addThree', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  f.getParameter(0).withName('a');
  f.getParameter(1).withName('b');
  f.getParameter(2).withName('c');
  const temp = a.declareLocal(webasmjs.ValueType.Int32, 'temp');
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
  a.get_local(f.getParameter(2));
  a.add_i32();
}).withExport();

const bytes = mod.toBytes();

log('Binary size: ' + bytes.length + ' bytes');
log('');

// Read back the name section
const reader = new webasmjs.BinaryReader(bytes);
const info = reader.read();
const ns = info.nameSection;

if (ns) {
  log('Module name: ' + ns.moduleName);
  log('');

  if (ns.functionNames) {
    log('Function names:');
    ns.functionNames.forEach((name, idx) => {
      log('  [' + idx + '] ' + name);
    });
  }

  if (ns.localNames) {
    log('');
    log('Local/parameter names:');
    ns.localNames.forEach((locals, funcIdx) => {
      const funcName = ns.functionNames?.get(funcIdx) || 'func' + funcIdx;
      log('  ' + funcName + ':');
      locals.forEach((name, localIdx) => {
        log('    [' + localIdx + '] ' + name);
      });
    });
  }

  if (ns.globalNames) {
    log('');
    log('Global names:');
    ns.globalNames.forEach((name, idx) => {
      log('  [' + idx + '] ' + name);
    });
  }
} else {
  log('No name section found!');
}`,
  },

  'binary-inspect': {
    label: 'Binary Inspector',
    group: 'Debug',
    description: 'Read back the binary structure — types, functions, exports.',
    target: 'mvp',
    features: [],
    code: `// Inspect the binary structure of a WASM module
const mod = new webasmjs.ModuleBuilder('inspect');
mod.defineMemory(1);

const counter = mod.defineGlobal(webasmjs.ValueType.Int32, true, 0);

mod.defineFunction('add', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

mod.defineFunction('noop', null, [], (f, a) => {
  a.nop();
}).withExport();

const bytes = mod.toBytes();

log('=== Binary Analysis ===');
log('Total size: ' + bytes.length + ' bytes');
log('');

// Read with BinaryReader
const reader = new webasmjs.BinaryReader(bytes);
const info = reader.read();

log('WASM version: ' + info.version);
log('Types: ' + info.types.length);
info.types.forEach((t, i) => {
  const params = t.parameterTypes.map(p => p.name).join(', ');
  const results = t.returnTypes.map(r => r.name).join(', ');
  log('  [' + i + '] (' + params + ') -> (' + results + ')');
});

log('Functions: ' + info.functions.length);
info.functions.forEach((f, i) => {
  log('  [' + i + '] type=' + f.typeIndex + ', locals=' + f.locals.length + ', body=' + f.body.length + ' bytes');
});

log('Memories: ' + info.memories.length);
info.memories.forEach((m, i) => {
  log('  [' + i + '] initial=' + m.initial + ' pages (' + (m.initial * 64) + ' KB)');
});

log('Globals: ' + info.globals.length);
info.globals.forEach((g, i) => {
  log('  [' + i + '] mutable=' + g.mutable);
});

log('Exports: ' + info.exports.length);
info.exports.forEach((e) => {
  const kinds = ['function', 'table', 'memory', 'global'];
  log('  "' + e.name + '" -> ' + (kinds[e.kind] || 'unknown') + '[' + e.index + ']');
});

log('');
log('Valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'wat-roundtrip': {
    label: 'WAT Roundtrip',
    group: 'Debug',
    description: 'Build a module, emit WAT, parse it back, and verify.',
    target: 'mvp',
    features: [],
    code: `// Build a module programmatically, inspect WAT, parse it back
const mod = new webasmjs.ModuleBuilder('roundtrip');

mod.defineFunction('multiply', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
}).withExport();

mod.defineFunction('negate', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  a.const_i32(0);
  a.get_local(f.getParameter(0));
  a.sub_i32();
}).withExport();

// Get WAT text
const watText = mod.toString();
log('=== Generated WAT ===');
log(watText);

// Parse it back
log('');
log('=== Parsing WAT back... ===');
const mod2 = webasmjs.parseWat(watText);

// Instantiate and test
const instance = await mod2.instantiate();
const { multiply, negate } = instance.instance.exports;

log('multiply(6, 7) = ' + multiply(6, 7));
log('multiply(100, -3) = ' + multiply(100, -3));
log('negate(42) = ' + negate(42));
log('negate(-10) = ' + negate(-10));
log('');
log('Roundtrip successful!');`,
  },

  'custom-section': {
    label: 'Custom Section',
    group: 'Debug',
    description: 'Add custom metadata to a module and read it back.',
    target: 'mvp',
    features: [],
    code: `// Custom section — embed arbitrary metadata in the binary
const mod = new webasmjs.ModuleBuilder('customSec');

mod.defineFunction('nop', null, [], (f, a) => {
  a.nop();
}).withExport();

// Add custom sections with metadata
const version = new TextEncoder().encode('1.0.0');
mod.defineCustomSection('version', new Uint8Array(version));

const author = new TextEncoder().encode('webasmjs playground');
mod.defineCustomSection('author', new Uint8Array(author));

const bytes = mod.toBytes();
log('Module size: ' + bytes.length + ' bytes');

// Read it back with BinaryReader
const reader = new webasmjs.BinaryReader(bytes);
const info = reader.read();

log('');
log('Custom sections found:');
if (info.customSections) {
  for (const sec of info.customSections) {
    const text = new TextDecoder().decode(sec.data);
    log('  "' + sec.name + '" = "' + text + '" (' + sec.data.length + ' bytes)');
  }
} else {
  log('  (none found — BinaryReader may not expose custom sections)');
}

log('');
log('The binary is still valid WASM:');
log('  WebAssembly.validate() = ' + WebAssembly.validate(bytes.buffer));`,
  },

  'extended-const': {
    label: 'Extended Constants',
    group: 'Post-MVP',
    description: 'Arithmetic in global init expressions with extended-const.',
    target: '3.0',
    features: ['extended-const'],
    code: `// Extended constants: arithmetic in global initializers
const mod = new webasmjs.ModuleBuilder('extConst', {
  target: 'mvp',
  features: ['extended-const'],
});

// Base offset as an immutable global
const base = mod.defineGlobal(webasmjs.ValueType.Int32, false, 100);

// Computed global: base + 50 (uses i32.add in init expression)
const offset1 = mod.defineGlobal(webasmjs.ValueType.Int32, false, (asm) => {
  asm.get_global(base);
  asm.const_i32(50);
  asm.add_i32();
});

// Computed global: base * 3 (uses i32.mul in init expression)
const scaled = mod.defineGlobal(webasmjs.ValueType.Int32, false, (asm) => {
  asm.get_global(base);
  asm.const_i32(3);
  asm.mul_i32();
});

// Computed global: base * 2 + 7
const combined = mod.defineGlobal(webasmjs.ValueType.Int32, false, (asm) => {
  asm.get_global(base);
  asm.const_i32(2);
  asm.mul_i32();
  asm.const_i32(7);
  asm.add_i32();
});

mod.defineFunction('getBase', [webasmjs.ValueType.Int32], [], (f, a) => {
  a.get_global(base);
}).withExport();

mod.defineFunction('getOffset1', [webasmjs.ValueType.Int32], [], (f, a) => {
  a.get_global(offset1);
}).withExport();

mod.defineFunction('getScaled', [webasmjs.ValueType.Int32], [], (f, a) => {
  a.get_global(scaled);
}).withExport();

mod.defineFunction('getCombined', [webasmjs.ValueType.Int32], [], (f, a) => {
  a.get_global(combined);
}).withExport();

const instance = await mod.instantiate();
const { getBase, getOffset1, getScaled, getCombined } = instance.instance.exports;

log('Extended-const: arithmetic in global init expressions');
log('base = ' + getBase());
log('base + 50 = ' + getOffset1());
log('base * 3 = ' + getScaled());
log('base * 2 + 7 = ' + getCombined());`,
  },

  'multi-memory': {
    label: 'Multi-Memory',
    group: 'Post-MVP',
    description: 'Define and use multiple linear memories in one module.',
    target: '3.0',
    features: ['multi-memory'],
    code: `// Multi-memory: two separate linear memories
const mod = new webasmjs.ModuleBuilder('multiMem', {
  target: 'mvp',
  features: ['multi-memory'],
});

const mem0 = mod.defineMemory(1);
mod.exportMemory(mem0, 'mem0');
const mem1 = mod.defineMemory(1);
mod.exportMemory(mem1, 'mem1');

// Store to memory 0
mod.defineFunction('store0', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0, 0); // memIndex=0
}).withExport();

// Load from memory 0
mod.defineFunction('load0', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_i32(2, 0, 0); // memIndex=0
}).withExport();

// Store to memory 1
mod.defineFunction('store1', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0, 1); // memIndex=1
}).withExport();

// Load from memory 1
mod.defineFunction('load1', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_i32(2, 0, 1); // memIndex=1
}).withExport();

// Show WAT with two memories
const wat = mod.toString();
log('=== WAT Output ===');
log(wat);

const bytes = mod.toBytes();
log('Module compiled: ' + bytes.length + ' bytes');
log('Valid WASM: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'multi-table': {
    label: 'Multi-Table',
    group: 'Post-MVP',
    description: 'Define multiple function tables and dispatch through each.',
    target: '3.0',
    features: ['multi-table'],
    code: `// Multi-table: two function tables for different dispatch
const mod = new webasmjs.ModuleBuilder('multiTable', {
  target: 'mvp',
  features: ['multi-table'],
});

const add = mod.defineFunction('add', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
});

const sub = mod.defineFunction('sub', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.sub_i32();
});

const mul = mod.defineFunction('mul', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
});

// Table 0: math operations
const table0 = mod.defineTable(webasmjs.ElementType.AnyFunc, 3);
mod.defineTableSegment(table0, [add, sub, mul], 0);

// Table 1: just add and mul (different arrangement)
const table1 = mod.defineTable(webasmjs.ElementType.AnyFunc, 2);
mod.defineTableSegment(table1, [mul, add], 0);

// Show WAT with two tables
const wat = mod.toString();
log('=== WAT Output (multi-table) ===');
log(wat);

const bytes = mod.toBytes();
log('Module compiled: ' + bytes.length + ' bytes');
log('Valid WASM: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'relaxed-simd': {
    label: 'Relaxed SIMD',
    group: 'Post-MVP',
    description: 'Relaxed SIMD operations for performance-sensitive code.',
    target: 'latest',
    features: ['relaxed-simd'],
    code: `// Relaxed SIMD: relaxed_madd for fused multiply-add
const mod = new webasmjs.ModuleBuilder('relaxedSimd');
mod.defineMemory(1);

// relaxed_madd: a * b + c (fused multiply-add, may use FMA instruction)
mod.defineFunction('madd_f32x4', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32,
   webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
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

mod.defineFunction('setF32', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_f32(2, 0);
}).withExport();

mod.defineFunction('getF32', [webasmjs.ValueType.Float32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_f32(2, 0);
}).withExport();

// Show WAT
const wat = mod.toString();
log('=== WAT Output (relaxed SIMD) ===');
log(wat);

const bytes = mod.toBytes();
log('Module compiled: ' + bytes.length + ' bytes');
log('Valid WASM: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'atomic-rmw': {
    label: 'Atomic RMW Ops',
    group: 'Post-MVP',
    description: 'Atomic read-modify-write: sub, and, or, xor, exchange.',
    target: '3.0',
    features: ['threads'],
    code: `// Atomic read-modify-write operations
const mod = new webasmjs.ModuleBuilder('atomicRMW');

// Shared memory for atomics
const mem = mod.defineMemory(1, 10, true);
mod.exportMemory(mem, 'memory');

// Atomic store
mod.defineFunction('store', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_store_i32(2, 0);
}).withExport();

// Atomic load
mod.defineFunction('load', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.atomic_load_i32(2, 0);
}).withExport();

// Atomic sub (returns old value)
mod.defineFunction('atomicSub', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_sub_i32(2, 0);
}).withExport();

// Atomic AND (returns old value)
mod.defineFunction('atomicAnd', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_and_i32(2, 0);
}).withExport();

// Atomic OR (returns old value)
mod.defineFunction('atomicOr', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_or_i32(2, 0);
}).withExport();

// Atomic XOR (returns old value)
mod.defineFunction('atomicXor', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_xor_i32(2, 0);
}).withExport();

// Atomic exchange (returns old value, stores new)
mod.defineFunction('atomicXchg', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_xchg_i32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { store, load, atomicSub, atomicAnd, atomicOr, atomicXor, atomicXchg } = instance.instance.exports;

log('=== Atomic Read-Modify-Write ===');
log('All RMW ops return the OLD value before modification.');
log('');

// Sub
store(0, 100);
const oldSub = atomicSub(0, 30);
log('atomicSub(100, 30): old=' + oldSub + ', new=' + load(0));

// AND
store(0, 0xFF);
const oldAnd = atomicAnd(0, 0x0F);
log('atomicAnd(0xFF, 0x0F): old=0x' + (oldAnd >>> 0).toString(16) + ', new=0x' + (load(0) >>> 0).toString(16));

// OR
store(0, 0xF0);
const oldOr = atomicOr(0, 0x0F);
log('atomicOr(0xF0, 0x0F): old=0x' + (oldOr >>> 0).toString(16) + ', new=0x' + (load(0) >>> 0).toString(16));

// XOR
store(0, 0xFF);
const oldXor = atomicXor(0, 0xAA);
log('atomicXor(0xFF, 0xAA): old=0x' + (oldXor >>> 0).toString(16) + ', new=0x' + (load(0) >>> 0).toString(16));

// Exchange
store(0, 42);
const oldXchg = atomicXchg(0, 99);
log('atomicXchg(42, 99): old=' + oldXchg + ', new=' + load(0));`,
  },

  'atomic-wait-notify': {
    label: 'Wait & Notify',
    group: 'Post-MVP',
    description: 'Atomic wait/notify primitives and memory fence.',
    target: '3.0',
    features: ['threads'],
    code: `// Atomic wait, notify, and fence — thread synchronization primitives
const mod = new webasmjs.ModuleBuilder('waitNotify', { disableVerification: true });

const mem = mod.defineMemory(1, 10, true);
mod.exportMemory(mem, 'memory');

// atomic.wait32(addr, expected, timeout) -> 0=ok, 1=not-equal, 2=timed-out
mod.defineFunction('wait32', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0)); // address
  a.get_local(f.getParameter(1)); // expected value
  a.get_local(f.getParameter(2)); // timeout in ns (-1 = infinite)
  a.atomic_wait32(2, 0);
}).withExport();

// atomic.notify(addr, count) -> number of waiters woken
mod.defineFunction('notify', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // address
  a.get_local(f.getParameter(1)); // count of waiters to wake
  a.atomic_notify(2, 0);
}).withExport();

// atomic.fence — full memory barrier
mod.defineFunction('fence', null, [], (f, a) => {
  a.atomic_fence(0);
}).withExport();

// Atomic store for setup
mod.defineFunction('store', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_store_i32(2, 0);
}).withExport();

// Show the WAT output
const wat = mod.toString();
log('=== WAT Output (wait/notify/fence) ===');
log(wat);

// Compile and validate
const bytes = mod.toBytes();
log('Module compiled: ' + bytes.length + ' bytes');
log('Valid WASM: ' + WebAssembly.validate(bytes.buffer));
log('');
log('Note: atomic.wait blocks the calling thread until notified.');
log('In a multi-threaded setup:');
log('  Thread A: wait32(addr, 0, -1n)  // sleep until value changes');
log('  Thread B: store(addr, 1); notify(addr, 1)  // wake thread A');
log('  fence() ensures memory operations are visible across threads.');`,
  },

  // ─── Additional SIMD ───
  'simd-integer': {
    label: 'SIMD Integer Ops',
    group: 'SIMD',
    description: 'Integer SIMD: i32x4 add, sub, mul, comparisons, and lane ops.',
    target: '3.0',
    features: ['simd'],
    code: `// Integer SIMD: i32x4 arithmetic, comparisons, lane extract/replace
const mod = new webasmjs.ModuleBuilder('simdInt');
mod.defineMemory(1);

// Add two i32x4 vectors
mod.defineFunction('add_i32x4', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
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
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.min_s_i32x4();
  a.store_v128(2, 0);
}).withExport();

// Extract a single lane
mod.defineFunction('extract', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  // Load vector, extract lane based on index using a br_table
  // For simplicity, extract lane 0 from the vector at the address
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.extract_lane_i32x4(0);
}).withExport();

// Splat a scalar to all 4 lanes
mod.defineFunction('splat_i32x4', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // dest
  a.get_local(f.getParameter(1)); // scalar
  a.splat_i32x4();
  a.store_v128(2, 0);
}).withExport();

mod.defineFunction('setI32', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0);
}).withExport();

mod.defineFunction('getI32', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_i32(2, 0);
}).withExport();

const instance = await mod.instantiate();
const { add_i32x4, min_s_i32x4, extract, splat_i32x4, setI32, getI32 } = instance.instance.exports;

// A = [10, 20, 30, 40], B = [5, 25, 15, 45]
const a = [10, 20, 30, 40], b = [5, 25, 15, 45];
for (let i = 0; i < 4; i++) { setI32(i * 4, a[i]); setI32(16 + i * 4, b[i]); }

add_i32x4(0, 16, 32);
log('A = [' + a + ']');
log('B = [' + b + ']');
log('A + B = [' + [getI32(32), getI32(36), getI32(40), getI32(44)] + ']');

min_s_i32x4(0, 16, 48);
log('min(A, B) = [' + [getI32(48), getI32(52), getI32(56), getI32(60)] + ']');

log('');
log('extract lane 0 of A: ' + extract(0, 0));

splat_i32x4(64, 7);
log('splat(7) = [' + [getI32(64), getI32(68), getI32(72), getI32(76)] + ']');`,
  },

  'simd-shuffle': {
    label: 'SIMD Shuffle & Swizzle',
    group: 'SIMD',
    description: 'Rearrange vector lanes with shuffle and swizzle.',
    target: '3.0',
    features: ['simd'],
    code: `// SIMD shuffle & swizzle: rearrange bytes across vectors
const mod = new webasmjs.ModuleBuilder('simdShuffle');
mod.defineMemory(1);

// shuffle: pick 16 bytes from two source vectors by index
// Indices 0-15 = first vector, 16-31 = second vector
mod.defineFunction('interleave', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2)); // dest
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0); // vector A
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0); // vector B
  // Interleave first 4 bytes: A[0], B[0], A[1], B[1], A[2], B[2], A[3], B[3], ...
  a.shuffle_i8x16(new Uint8Array([0, 16, 1, 17, 2, 18, 3, 19, 4, 20, 5, 21, 6, 22, 7, 23]));
  a.store_v128(2, 0);
}).withExport();

// Reverse bytes within a vector using shuffle
mod.defineFunction('reverse', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1)); // dest
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0); // same vector for both operands
  a.shuffle_i8x16(new Uint8Array([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]));
  a.store_v128(2, 0);
}).withExport();

// swizzle: rearrange bytes using a dynamic index vector
mod.defineFunction('swizzle', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2)); // dest
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0); // data
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0); // indices
  a.swizzle_i8x16();
  a.store_v128(2, 0);
}).withExport();

mod.defineFunction('setByte', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store8_i32(0, 0);
}).withExport();

mod.defineFunction('getByte', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load8_i32_u(0, 0);
}).withExport();

const instance = await mod.instantiate();
const { interleave, reverse, swizzle, setByte, getByte } = instance.instance.exports;

// Set up: A = [0,1,2,...,15], B = [16,17,...,31]
for (let i = 0; i < 16; i++) { setByte(i, i); setByte(16 + i, 16 + i); }

interleave(0, 16, 32);
const interleaved = [];
for (let i = 0; i < 16; i++) interleaved.push(getByte(32 + i));
log('A = [0,1,2,...,15]');
log('B = [16,17,...,31]');
log('interleave(A, B) = [' + interleaved.join(', ') + ']');

log('');
reverse(0, 48);
const reversed = [];
for (let i = 0; i < 16; i++) reversed.push(getByte(48 + i));
log('reverse(A) = [' + reversed.join(', ') + ']');

log('');
// swizzle: use indices [3,2,1,0, 7,6,5,4, 11,10,9,8, 15,14,13,12] to reverse each group of 4
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 4; j++) setByte(64 + i * 4 + j, i * 4 + (3 - j));
}
swizzle(0, 64, 80);
const swizzled = [];
for (let i = 0; i < 16; i++) swizzled.push(getByte(80 + i));
log('swizzle(A, reverse-within-groups) = [' + swizzled.join(', ') + ']');`,
  },

  'simd-widen-narrow': {
    label: 'SIMD Widen & Narrow',
    group: 'SIMD',
    description: 'Convert between vector widths — narrow i16x8 to i8x16, extend i8x16 to i16x8.',
    target: '3.0',
    features: ['simd'],
    code: `// SIMD widening and narrowing: convert between lane sizes
const mod = new webasmjs.ModuleBuilder('simdWidenNarrow');
mod.defineMemory(1);

// Narrow two i16x8 vectors into one i8x16 (saturating, unsigned)
mod.defineFunction('narrow_u', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
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
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.extend_low_i8x16_s_i16x8();
  a.store_v128(2, 0);
}).withExport();

mod.defineFunction('setByte', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store8_i32(0, 0);
}).withExport();

mod.defineFunction('getByte', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load8_i32_u(0, 0);
}).withExport();

mod.defineFunction('setI16', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store16_i32(1, 0);
}).withExport();

mod.defineFunction('getI16', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load16_i32_s(1, 0);
}).withExport();

const instance = await mod.instantiate();
const { narrow_u, extend_low_s, setByte, getByte, setI16, getI16 } = instance.instance.exports;

// Narrowing: two i16x8 → one i8x16 (values clamped to 0-255)
// A = [10, 200, 300, 50, 0, 255, 1000, 128] at offset 0
const i16a = [10, 200, 300, 50, 0, 255, 1000, 128];
for (let i = 0; i < 8; i++) setI16(i * 2, i16a[i]);
// B = [1, 2, 3, 4, 5, 6, 7, 8]
for (let i = 0; i < 8; i++) setI16(16 + i * 2, i + 1);

narrow_u(0, 16, 32);
const narrowed = [];
for (let i = 0; i < 16; i++) narrowed.push(getByte(32 + i));
log('=== Narrowing (i16x8 → i8x16, unsigned saturating) ===');
log('A (i16) = [' + i16a + ']');
log('B (i16) = [1,2,3,4,5,6,7,8]');
log('narrow_u = [' + narrowed.join(', ') + ']');
log('(300→255, 1000→255 clamped)');

// Widening: i8x16 low half → i16x8 (signed extend)
log('');
log('=== Widening (i8x16 → i16x8, signed) ===');
const bytes = [5, 200, 127, 128, 0, 255, 1, 100]; // 200=0xC8→-56 signed, 128→-128, 255→-1
for (let i = 0; i < 8; i++) setByte(48 + i, bytes[i]);
extend_low_s(48, 64);
const widened = [];
for (let i = 0; i < 8; i++) widened.push(getI16(64 + i * 2));
log('input bytes = [' + bytes + ']');
log('extend_low_s = [' + widened.join(', ') + ']');
log('(200→-56, 128→-128, 255→-1 sign-extended)');`,
  },

  'simd-saturating': {
    label: 'SIMD Saturating Math',
    group: 'SIMD',
    description: 'Saturating add/sub that clamp instead of wrapping.',
    target: '3.0',
    features: ['simd'],
    code: `// SIMD saturating arithmetic: clamp on overflow instead of wrap
const mod = new webasmjs.ModuleBuilder('simdSat');
mod.defineMemory(1);

// Saturating unsigned add on i8x16
mod.defineFunction('add_sat_u', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
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
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
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
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.add_i8x16();
  a.store_v128(2, 0);
}).withExport();

mod.defineFunction('setByte', null,
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store8_i32(0, 0);
}).withExport();

mod.defineFunction('getByte', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load8_i32_u(0, 0);
}).withExport();

const instance = await mod.instantiate();
const { add_sat_u, sub_sat_u, add_wrap, setByte, getByte } = instance.instance.exports;

// A = [200, 100, 255, 0, 128, 50, 250, 10, ...]
const a = [200, 100, 255, 0, 128, 50, 250, 10];
// B = [100, 200, 10, 5, 128, 250, 50, 0]
const b = [100, 200, 10, 5, 128, 250, 50, 0];
for (let i = 0; i < 8; i++) { setByte(i, a[i]); setByte(16 + i, b[i]); }
for (let i = 8; i < 16; i++) { setByte(i, 0); setByte(16 + i, 0); }

add_sat_u(0, 16, 32);
add_wrap(0, 16, 48);

const satResult = [], wrapResult = [];
for (let i = 0; i < 8; i++) { satResult.push(getByte(32 + i)); wrapResult.push(getByte(48 + i)); }

log('A = [' + a.join(', ') + ']');
log('B = [' + b.join(', ') + ']');
log('');
log('add_sat_u = [' + satResult.join(', ') + ']  (clamped to 255)');
log('add_wrap  = [' + wrapResult.join(', ') + ']  (wraps around)');

log('');
sub_sat_u(0, 16, 64);
const subResult = [];
for (let i = 0; i < 8; i++) subResult.push(getByte(64 + i));
log('sub_sat_u = [' + subResult.join(', ') + ']  (clamped to 0)');`,
  },

  // ─── Additional Bulk Memory ───
  'passive-data': {
    label: 'Passive Data Segments',
    group: 'Bulk Memory',
    description: 'Lazy-init memory with passive segments and memory.init.',
    target: '2.0',
    features: ['bulk-memory'],
    code: `// Passive data segments: lazy initialization with memory.init
const mod = new webasmjs.ModuleBuilder('passiveData');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Passive segment: not placed in memory until memory.init is called
const greeting = new TextEncoder().encode('Hello, WebAssembly!');
const dataSegment = mod.defineData(new Uint8Array([...greeting]));
// dataSegment is passive because no offset was given

// Copy passive data into memory: init(destOffset)
mod.defineFunction('init', null, [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // destination offset
  a.const_i32(0);                  // source offset in data segment
  a.const_i32(${greeting.length});                // length
  a.memory_init(dataSegment._index, 0);
}).withExport();

// Drop data segment (free it after init)
mod.defineFunction('drop', null, [], (f, a) => {
  a.data_drop(dataSegment._index);
}).withExport();

// strlen
mod.defineFunction('strlen', [webasmjs.ValueType.Int32], [webasmjs.ValueType.Int32], (f, a) => {
  const ptr = f.getParameter(0);
  const len = a.declareLocal(webasmjs.ValueType.Int32, 'len');
  a.const_i32(0);
  a.set_local(len);
  a.loop(webasmjs.BlockType.Void, (cont) => {
    a.block(webasmjs.BlockType.Void, (brk) => {
      a.get_local(ptr);
      a.get_local(len);
      a.add_i32();
      a.load8_i32_u(0, 0);
      a.eqz_i32();
      a.br_if(brk);
      a.get_local(len);
      a.const_i32(1);
      a.add_i32();
      a.set_local(len);
      a.br(cont);
    });
  });
  a.get_local(len);
}).withExport();

const instance = await mod.instantiate();
const { init, drop: dataDrop, strlen, memory } = instance.instance.exports;
const view = new Uint8Array(memory.buffer);

// Memory starts empty (passive segment not yet loaded)
log('Before init: byte[0] = ' + view[0] + ' (empty)');

// Load passive data to offset 0
init(0);
const len = strlen(0);
const str = new TextDecoder().decode(view.slice(0, len));
log('After init(0): "' + str + '" (length=' + len + ')');

// Load the same data at a different offset
init(100);
const str2 = new TextDecoder().decode(view.slice(100, 100 + len));
log('After init(100): "' + str2 + '"');

// Drop the data segment (can no longer init)
dataDrop();
log('');
log('Data segment dropped — passive data freed.');
try {
  init(200);
  log('Should not reach here');
} catch (e) {
  log('init after drop: trapped as expected');
}`,
  },

  'bulk-table-ops': {
    label: 'Bulk Table Operations',
    group: 'Bulk Memory',
    description: 'table.copy and table.fill for bulk table manipulation.',
    target: '2.0',
    features: ['bulk-memory'],
    code: `// Bulk table operations: table.fill and table.copy
const mod = new webasmjs.ModuleBuilder('bulkTable');

const add = mod.defineFunction('add', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

const mul = mod.defineFunction('mul', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
}).withExport();

// Table with space for 8 entries
const table = mod.defineTable(webasmjs.ElementType.AnyFunc, 8);
mod.defineTableSegment(table, [add, mul], 0);

// table.fill(start, ref, count) — fill slots 2-5 with the add function
mod.defineFunction('fillWithAdd', null, [], (f, a) => {
  a.const_i32(2);      // start index
  a.ref_func(add);     // function ref
  a.const_i32(4);      // count
  a.table_fill(0);
}).withExport();

// table.copy(dest, src, count) — copy slots 0-1 to slots 6-7
mod.defineFunction('copySlots', null, [], (f, a) => {
  a.const_i32(6);      // dest
  a.const_i32(0);      // src
  a.const_i32(2);      // count
  a.table_copy(0, 0);
}).withExport();

// table.size
mod.defineFunction('tableSize', [webasmjs.ValueType.Int32], [], (f, a) => {
  a.table_size(0);
}).withExport();

// Dispatch through table
mod.defineFunction('dispatch', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1));
  a.get_local(f.getParameter(2));
  a.get_local(f.getParameter(0));
  a.call_indirect(add.funcTypeBuilder);
}).withExport();

const instance = await mod.instantiate();
const { fillWithAdd, copySlots, tableSize, dispatch } = instance.instance.exports;

log('Table size: ' + tableSize());
log('');

// Initial: [add, mul, ?, ?, ?, ?, ?, ?]
log('Initial: slot 0 (add): dispatch(0, 3, 4) = ' + dispatch(0, 3, 4));
log('Initial: slot 1 (mul): dispatch(1, 3, 4) = ' + dispatch(1, 3, 4));

// Fill slots 2-5 with add
fillWithAdd();
log('');
log('After table.fill(2, add, 4):');
log('  slot 2: dispatch(2, 10, 20) = ' + dispatch(2, 10, 20) + ' (add)');
log('  slot 3: dispatch(3, 10, 20) = ' + dispatch(3, 10, 20) + ' (add)');

// Copy slots 0-1 to 6-7
copySlots();
log('');
log('After table.copy(6, 0, 2):');
log('  slot 6: dispatch(6, 5, 6) = ' + dispatch(6, 5, 6) + ' (add, copied from 0)');
log('  slot 7: dispatch(7, 5, 6) = ' + dispatch(7, 5, 6) + ' (mul, copied from 1)');`,
  },

  // ─── Additional Post-MVP ───
  'table-ops': {
    label: 'Table Get/Set/Grow',
    group: 'Post-MVP',
    description: 'Dynamic table manipulation with table.get, table.set, table.grow.',
    target: '2.0',
    features: ['reference-types'],
    code: `// Dynamic table operations: get, set, grow
const mod = new webasmjs.ModuleBuilder('tableOps');

const double = mod.defineFunction('double', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
}).withExport();

const triple = mod.defineFunction('triple', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(3);
  a.mul_i32();
}).withExport();

const negate = mod.defineFunction('negate', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.const_i32(0);
  a.get_local(f.getParameter(0));
  a.sub_i32();
}).withExport();

// Start with table of size 2
const table = mod.defineTable(webasmjs.ElementType.AnyFunc, 2);
mod.defineTableSegment(table, [double, triple], 0);

// table.set: place a function ref at an index
mod.defineFunction('setSlot', null, [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.ref_func(negate);
  a.table_set(0);
}).withExport();

// table.grow: add N slots (returns old size, or -1 on failure)
mod.defineFunction('growTable', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.ref_null(0x70); // fill new slots with null
  a.get_local(f.getParameter(0));
  a.table_grow(0);
}).withExport();

// table.size
mod.defineFunction('size', [webasmjs.ValueType.Int32], [], (f, a) => {
  a.table_size(0);
}).withExport();

// Check if a slot is null
mod.defineFunction('isNull', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.table_get(0);
  a.ref_is_null();
}).withExport();

// Call through table
mod.defineFunction('call', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1));
  a.get_local(f.getParameter(0));
  a.call_indirect(double.funcTypeBuilder);
}).withExport();

const instance = await mod.instantiate();
const fn = instance.instance.exports;

log('Initial size: ' + fn.size());
log('slot 0 (double): call(0, 5) = ' + fn.call(0, 5));
log('slot 1 (triple): call(1, 5) = ' + fn.call(1, 5));

// Grow table by 3 slots
const oldSize = fn.growTable(3);
log('');
log('growTable(3) returned old size: ' + oldSize);
log('New size: ' + fn.size());
log('slot 2 is null: ' + (fn.isNull(2) === 1));

// Set slot 2 to negate
fn.setSlot(2);
log('');
log('After setSlot(2, negate):');
log('slot 2 is null: ' + (fn.isNull(2) === 1));
log('slot 2 (negate): call(2, 5) = ' + fn.call(2, 5));`,
  },

  'try-catch': {
    label: 'Try/Catch',
    group: 'Post-MVP',
    description: 'Full try/catch exception handling with multiple tags.',
    target: '3.0',
    features: ['exception-handling'],
    code: `// Full try/catch exception handling
const mod = new webasmjs.ModuleBuilder('tryCatch', { disableVerification: true });

// Define two exception tags with different payloads
const errorTag = mod.defineTag([webasmjs.ValueType.Int32]);     // error code
const overflowTag = mod.defineTag([webasmjs.ValueType.Int32]);  // overflow value

// Function that may throw
mod.defineFunction('checkedAdd', [webasmjs.ValueType.Int32],
  [webasmjs.ValueType.Int32, webasmjs.ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);
  const result = a.declareLocal(webasmjs.ValueType.Int32, 'result');

  a.get_local(x);
  a.get_local(y);
  a.add_i32();
  a.set_local(result);

  // Check for "overflow" (result > 1000 for demo purposes)
  a.get_local(result);
  a.const_i32(1000);
  a.gt_i32();
  a.if(webasmjs.BlockType.Void, () => {
    a.get_local(result);
    a.throw(overflowTag._index);
  });

  // Check for negative input
  a.get_local(x);
  a.const_i32(0);
  a.lt_s_i32();
  a.if(webasmjs.BlockType.Void, () => {
    a.const_i32(-1);
    a.throw(errorTag._index);
  });

  a.get_local(result);
}).withExport();

// Show the WAT with tags, throw, try/catch
const wat = mod.toString();
log('=== WAT Output (try/catch) ===');
log(wat);

const bytes = mod.toBytes();
log('Module compiled: ' + bytes.length + ' bytes');
log('Valid WASM: ' + WebAssembly.validate(bytes.buffer));
log('');
log('This module defines:');
log('  - errorTag: thrown when input is negative');
log('  - overflowTag: thrown when result > 1000');
log('  - checkedAdd: adds two numbers with validation');`,
  },

  'f32-math': {
    label: 'f32 Math',
    group: 'Numeric',
    description: 'Single-precision float ops — f32 min, max, abs, neg, sqrt.',
    target: 'mvp',
    features: [],
    code: `// f32 math — single-precision float operations
const mod = new webasmjs.ModuleBuilder('f32math');

mod.defineFunction('min', [webasmjs.ValueType.Float32],
  [webasmjs.ValueType.Float32, webasmjs.ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.min_f32();
}).withExport();

mod.defineFunction('max', [webasmjs.ValueType.Float32],
  [webasmjs.ValueType.Float32, webasmjs.ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.max_f32();
}).withExport();

mod.defineFunction('abs', [webasmjs.ValueType.Float32],
  [webasmjs.ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.abs_f32();
}).withExport();

mod.defineFunction('neg', [webasmjs.ValueType.Float32],
  [webasmjs.ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.neg_f32();
}).withExport();

mod.defineFunction('sqrt', [webasmjs.ValueType.Float32],
  [webasmjs.ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.sqrt_f32();
}).withExport();

// Compare: f32 arithmetic vs f64 for precision
mod.defineFunction('addF32', [webasmjs.ValueType.Float32],
  [webasmjs.ValueType.Float32, webasmjs.ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_f32();
}).withExport();

mod.defineFunction('addF64', [webasmjs.ValueType.Float64],
  [webasmjs.ValueType.Float64, webasmjs.ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_f64();
}).withExport();

const instance = await mod.instantiate();
const { min, max, abs, neg, sqrt, addF32, addF64 } = instance.instance.exports;

log('=== f32 Operations ===');
log('min(3.14, 2.71) = ' + min(3.14, 2.71));
log('max(3.14, 2.71) = ' + max(3.14, 2.71));
log('abs(-42.5) = ' + abs(-42.5));
log('neg(3.14) = ' + neg(3.14));
log('sqrt(2.0) = ' + sqrt(2.0));
log('sqrt(9.0) = ' + sqrt(9.0));

log('');
log('=== f32 vs f64 Precision ===');
log('f32: 0.1 + 0.2 = ' + addF32(0.1, 0.2));
log('f64: 0.1 + 0.2 = ' + addF64(0.1, 0.2));
log('f32 uses 4 bytes, f64 uses 8 bytes per value.');`,
  },
};

// ─── UI helpers ───

const GROUP_ICONS: Record<string, string> = {
  Basics: '\u{1F44B}',
  Memory: '\u{1F4BE}',
  Globals: '\u{1F30D}',
  Functions: '\u{1F517}',
  'Control Flow': '\u{1F500}',
  Numeric: '\u{1F522}',
  Algorithms: '\u{2699}',
  SIMD: '\u{26A1}',
  'Bulk Memory': '\u{1F4E6}',
  'Post-MVP': '\u{1F680}',
  WAT: '\u{1F4DD}',
  Debug: '\u{1F50D}',
};

// ─── Target ordering for filter comparison ───
const TARGET_ORDER: Record<WasmTarget, number> = {
  mvp: 0,
  '2.0': 1,
  '3.0': 2,
  latest: 3,
};

function getEditor(): HTMLTextAreaElement {
  return document.getElementById('editor') as HTMLTextAreaElement;
}

function getWatOutput(): HTMLElement {
  return document.getElementById('watOutput') as HTMLElement;
}

function getRunOutput(): HTMLElement {
  return document.getElementById('runOutput') as HTMLElement;
}

function getConsoleOutput(): HTMLElement {
  return document.getElementById('consoleOutput') as HTMLElement;
}

function clearOutput(el: HTMLElement): void {
  el.textContent = '';
}

function appendOutput(el: HTMLElement, text: string, className?: string): void {
  const line = document.createElement('div');
  line.textContent = text;
  if (className) line.className = className;
  el.appendChild(line);
}

let currentExampleKey = 'hello-wasm';

function loadExample(name: string): void {
  const example = EXAMPLES[name];
  if (example) {
    currentExampleKey = name;
    getEditor().value = example.code;
    clearOutput(getWatOutput());
    clearOutput(getRunOutput());
    clearOutput(getConsoleOutput());
    const label = document.getElementById('currentExample');
    if (label) label.textContent = example.label;
  }
}

// ─── Tab switching ───

function switchTab(tabName: 'wat' | 'output'): void {
  const tabs = document.querySelectorAll('.tab-bar .tab');
  const panels = document.querySelectorAll('.tab-panel');
  tabs.forEach((tab) => {
    tab.classList.toggle('active', (tab as HTMLElement).dataset.tab === tabName);
  });
  panels.forEach((panel) => {
    const isTarget = panel.id === (tabName === 'wat' ? 'watOutput' : 'runOutput');
    panel.classList.toggle('active', isTarget);
  });
}

// ─── Console drawer ───

function toggleConsole(): void {
  const drawer = document.getElementById('consoleDrawer')!;
  drawer.classList.toggle('open');
}

function clearConsole(): void {
  getConsoleOutput().textContent = '';
  updateConsoleBadge();
}

let consoleMessageCount = 0;

function updateConsoleBadge(): void {
  const badge = document.getElementById('consoleBadge')!;
  consoleMessageCount = getConsoleOutput().childElementCount;
  badge.textContent = String(consoleMessageCount);
  badge.classList.toggle('has-messages', consoleMessageCount > 0);
}

// ─── Resize handler ───

function initResizeHandler(): void {
  const handle = document.getElementById('resizeHandle')!;
  const main = document.querySelector('.main') as HTMLElement;
  const editorPane = document.querySelector('.editor-pane') as HTMLElement;
  const outputPane = document.querySelector('.output-pane') as HTMLElement;
  let isResizing = false;

  handle.addEventListener('mousedown', (e: MouseEvent) => {
    isResizing = true;
    handle.classList.add('active');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isResizing) return;
    const rect = main.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const totalWidth = rect.width - 4; // handle width
    const leftPct = Math.max(20, Math.min(80, (x / rect.width) * 100));
    editorPane.style.flex = 'none';
    outputPane.style.flex = 'none';
    editorPane.style.width = leftPct + '%';
    outputPane.style.width = (100 - leftPct) + '%';
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      handle.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}

// ─── Example picker dialog ───

function openExamplePicker(): void {
  const existing = document.getElementById('exampleDialog');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'exampleDialog';
  overlay.className = 'dialog-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'dialog';

  // Header with search + filter dropdown
  const header = document.createElement('div');
  header.className = 'dialog-header';
  header.innerHTML = '<h2>Examples</h2>';

  const searchRow = document.createElement('div');
  searchRow.className = 'dialog-search-row';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search examples...';
  searchInput.className = 'dialog-search';
  searchRow.appendChild(searchInput);

  // Compact filter dropdown
  const filterSelect = document.createElement('select');
  filterSelect.className = 'filter-select';

  // "All" option
  const allOpt = document.createElement('option');
  allOpt.value = '';
  allOpt.textContent = 'All';
  filterSelect.appendChild(allOpt);

  // Target group
  const targetGroup = document.createElement('optgroup');
  targetGroup.label = 'Target';
  for (const t of ['mvp', '2.0', '3.0', 'latest'] as WasmTarget[]) {
    const opt = document.createElement('option');
    opt.value = 'target:' + t;
    opt.textContent = t === 'mvp' ? 'MVP' : t === 'latest' ? 'Latest' : 'Wasm ' + t;
    targetGroup.appendChild(opt);
  }
  filterSelect.appendChild(targetGroup);

  // Feature group — only features actually used by examples
  const usedFeatures = new Set<WasmFeature>();
  for (const example of Object.values(EXAMPLES)) {
    for (const f of example.features) usedFeatures.add(f);
  }
  const featureGroup = document.createElement('optgroup');
  featureGroup.label = 'Feature';
  for (const f of Array.from(usedFeatures).sort()) {
    const opt = document.createElement('option');
    opt.value = 'feature:' + f;
    opt.textContent = f;
    featureGroup.appendChild(opt);
  }
  filterSelect.appendChild(featureGroup);

  searchRow.appendChild(filterSelect);
  header.appendChild(searchRow);
  dialog.appendChild(header);

  // Build grouped grid
  const body = document.createElement('div');
  body.className = 'dialog-body';

  const groups = new Map<string, { key: string; example: ExampleDef }[]>();
  for (const [key, example] of Object.entries(EXAMPLES)) {
    const group = example.group;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push({ key, example });
  }

  const allCards: HTMLElement[] = [];
  const allSections: HTMLElement[] = [];

  for (const [groupName, items] of groups) {
    const section = document.createElement('div');
    section.className = 'dialog-group';
    section.dataset.group = groupName;

    const groupHeader = document.createElement('div');
    groupHeader.className = 'dialog-group-header';
    const icon = GROUP_ICONS[groupName] || '';
    groupHeader.textContent = `${icon}  ${groupName}`;
    section.appendChild(groupHeader);

    const grid = document.createElement('div');
    grid.className = 'dialog-grid';

    for (const item of items) {
      const card = document.createElement('button');
      card.className = 'dialog-card';
      if (item.key === currentExampleKey) card.classList.add('active');
      card.dataset.key = item.key;
      card.dataset.search = `${item.example.label} ${item.example.description} ${groupName}`.toLowerCase();
      card.dataset.target = item.example.target;
      card.dataset.features = item.example.features.join(',');

      const title = document.createElement('div');
      title.className = 'dialog-card-title';
      title.textContent = item.example.label;
      card.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'dialog-card-desc';
      desc.textContent = item.example.description;
      card.appendChild(desc);

      // Metadata badges
      if (item.example.target !== 'mvp' || item.example.features.length > 0) {
        const meta = document.createElement('div');
        meta.className = 'dialog-card-meta';

        if (item.example.target !== 'mvp') {
          const targetBadge = document.createElement('span');
          targetBadge.className = 'card-target';
          targetBadge.textContent = item.example.target;
          meta.appendChild(targetBadge);
        }

        for (const feat of item.example.features) {
          const featBadge = document.createElement('span');
          featBadge.className = 'card-feature';
          featBadge.textContent = feat;
          meta.appendChild(featBadge);
        }

        card.appendChild(meta);
      }

      card.addEventListener('click', () => {
        loadExample(item.key);
        overlay.remove();
      });

      grid.appendChild(card);
      allCards.push(card);
    }

    section.appendChild(grid);
    body.appendChild(section);
    allSections.push(section);
  }

  dialog.appendChild(body);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Filter logic
  function applyFilters(): void {
    const q = searchInput.value.toLowerCase().trim();
    const filterVal = filterSelect.value;

    for (const card of allCards) {
      const searchMatch = !q || card.dataset.search!.includes(q);

      let filterMatch = true;
      if (filterVal.startsWith('target:')) {
        const selectedTarget = filterVal.slice(7) as WasmTarget;
        const cardTarget = card.dataset.target as WasmTarget;
        filterMatch = TARGET_ORDER[cardTarget] <= TARGET_ORDER[selectedTarget];
      } else if (filterVal.startsWith('feature:')) {
        const selectedFeature = filterVal.slice(8);
        const cardFeatures = card.dataset.features ? card.dataset.features.split(',') : [];
        filterMatch = cardFeatures.includes(selectedFeature);
      }

      (card as HTMLElement).style.display = searchMatch && filterMatch ? '' : 'none';
    }
    for (const section of allSections) {
      const visibleCards = section.querySelectorAll('.dialog-card:not([style*="display: none"])');
      (section as HTMLElement).style.display = visibleCards.length > 0 ? '' : 'none';
    }
  }

  searchInput.addEventListener('input', applyFilters);
  filterSelect.addEventListener('change', applyFilters);

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Close on Escape
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    }
  };
  document.addEventListener('keydown', onKey);

  // Focus search
  setTimeout(() => searchInput.focus(), 50);
}

// Expose library globally for eval'd code
(window as any).webasmjs = {
  ModuleBuilder,
  PackageBuilder,
  ValueType,
  BlockType,
  ElementType,
  TextModuleWriter,
  BinaryReader,
  parseWat,
};

async function run(): Promise<void> {
  const watEl = getWatOutput();
  const runEl = getRunOutput();
  const consoleEl = getConsoleOutput();
  clearOutput(watEl);
  clearOutput(runEl);
  clearOutput(consoleEl);

  const code = getEditor().value;

  // Open console drawer and switch to WAT tab
  const drawer = document.getElementById('consoleDrawer')!;
  drawer.classList.add('open');

  // Capture log calls -> console drawer
  const log = (msg: any) => {
    appendOutput(consoleEl, String(msg));
    updateConsoleBadge();
  };

  // Intercept ModuleBuilder to capture WAT before instantiate
  const OrigModuleBuilder = ModuleBuilder;
  const patchedClass = class extends OrigModuleBuilder {
    async instantiate(imports?: WebAssembly.Imports) {
      try {
        const wat = this.toString();
        appendOutput(watEl, wat);
      } catch (e: any) {
        appendOutput(watEl, 'Error generating WAT: ' + e.message, 'error');
      }
      return super.instantiate(imports);
    }
  };
  (window as any).webasmjs.ModuleBuilder = patchedClass;

  try {
    const asyncFn = new Function('log', 'webasmjs', `return (async () => {\n${code}\n})();`);
    await asyncFn(log, (window as any).webasmjs);
    appendOutput(runEl, '\n--- Done ---');
  } catch (e: any) {
    appendOutput(runEl, 'Error: ' + e.message, 'error');
    if (e.stack) {
      appendOutput(runEl, e.stack, 'error');
    }
  } finally {
    (window as any).webasmjs.ModuleBuilder = OrigModuleBuilder;
    updateConsoleBadge();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('examplesBtn')!.addEventListener('click', openExamplePicker);
  document.getElementById('runBtn')!.addEventListener('click', run);

  // Tab switching
  document.querySelectorAll('.tab-bar .tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      switchTab((tab as HTMLElement).dataset.tab as 'wat' | 'output');
    });
  });

  // Console drawer toggle and clear
  document.getElementById('consoleToggle')!.addEventListener('click', toggleConsole);
  document.getElementById('consoleClear')!.addEventListener('click', (e) => {
    e.stopPropagation();
    clearConsole();
  });

  // Resize handler
  initResizeHandler();

  // Ctrl/Cmd+Enter to run
  getEditor().addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      run();
    }
  });

  // Load default example
  loadExample('hello-wasm');
});
