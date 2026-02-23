import {
  ModuleBuilder,
  ValueType,
  BlockType,
  ElementType,
  TextModuleWriter,
  BinaryReader,
  parseWat,
} from '../src/index';

const EXAMPLES: Record<string, { label: string; group: string; code: string }> = {
  // ─── Basics ───
  'hello-wasm': {
    label: 'Hello WASM',
    group: 'Basics',
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

  // ─── Globals & State ───
  globals: {
    label: 'Global Counter',
    group: 'Globals',
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

  // ─── Numeric Types ───
  'float-math': {
    label: 'Float Math',
    group: 'Numeric',
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

  // ─── Algorithms ───
  'bubble-sort': {
    label: 'Bubble Sort',
    group: 'Algorithms',
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

  // ─── SIMD ───
  'simd-vec-add': {
    label: 'SIMD Vector Add',
    group: 'SIMD',
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

  // ─── Debug & Inspection ───
  'debug-names': {
    label: 'Debug Name Section',
    group: 'Debug',
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
};

// ─── UI helpers ───

const GROUP_ICONS: Record<string, string> = {
  Basics: '\u{1F44B}',
  Memory: '\u{1F4BE}',
  Globals: '\u{1F30D}',
  Functions: '\u{1F517}',
  Numeric: '\u{1F522}',
  Algorithms: '\u{2699}',
  SIMD: '\u{26A1}',
  'Bulk Memory': '\u{1F4E6}',
  'Post-MVP': '\u{1F680}',
  WAT: '\u{1F4DD}',
  Debug: '\u{1F50D}',
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
    const label = document.getElementById('currentExample');
    if (label) label.textContent = example.label;
  }
}

// ─── Example picker dialog ───

function openExamplePicker(): void {
  // Prevent duplicates
  const existing = document.getElementById('exampleDialog');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'exampleDialog';
  overlay.className = 'dialog-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'dialog';

  // Header with search
  const header = document.createElement('div');
  header.className = 'dialog-header';
  header.innerHTML = '<h2>Examples</h2>';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search examples...';
  searchInput.className = 'dialog-search';
  header.appendChild(searchInput);
  dialog.appendChild(header);

  // Build grouped grid
  const body = document.createElement('div');
  body.className = 'dialog-body';

  const groups = new Map<string, { key: string; label: string; desc: string }[]>();
  for (const [key, example] of Object.entries(EXAMPLES)) {
    const group = example.group;
    if (!groups.has(group)) groups.set(group, []);
    // Extract first line of code as description
    const firstComment = example.code.split('\n')[0].replace(/^\/\/\s*/, '');
    groups.get(group)!.push({ key, label: example.label, desc: firstComment });
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
      card.dataset.search = `${item.label} ${item.desc} ${groupName}`.toLowerCase();

      const title = document.createElement('div');
      title.className = 'dialog-card-title';
      title.textContent = item.label;
      card.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'dialog-card-desc';
      desc.textContent = item.desc;
      card.appendChild(desc);

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

  // Search filtering
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    for (const card of allCards) {
      const match = !q || card.dataset.search!.includes(q);
      (card as HTMLElement).style.display = match ? '' : 'none';
    }
    // Hide groups with no visible cards
    for (const section of allSections) {
      const visibleCards = section.querySelectorAll('.dialog-card:not([style*="display: none"])');
      (section as HTMLElement).style.display = visibleCards.length > 0 ? '' : 'none';
    }
  });

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
  clearOutput(watEl);
  clearOutput(runEl);

  const code = getEditor().value;

  // Capture log calls
  const log = (msg: any) => {
    appendOutput(runEl, String(msg));
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
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('examplesBtn')!.addEventListener('click', openExamplePicker);
  document.getElementById('runBtn')!.addEventListener('click', run);

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
