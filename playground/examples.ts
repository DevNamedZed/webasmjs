import type { WasmTarget, WasmFeature } from '../src/types';

export interface ExampleDef {
  label: string;
  group: string;
  description: string;
  target: WasmTarget;
  features: WasmFeature[];
  imports: string[];
  code: string;
}

export const EXAMPLES: Record<string, ExampleDef> = {
  // ─── Basics ───
  'hello-wasm': {
    label: 'Hello WASM',
    group: 'Basics',
    description: 'The simplest possible module — export a function that returns 42.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Hello WASM — the simplest possible module
const mod = new ModuleBuilder('hello');

mod.defineFunction('answer', [ValueType.Int32], [], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Factorial — iterative with loop and block
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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Fibonacci sequence — iterative
const mod = new ModuleBuilder('fibonacci');

mod.defineFunction('fib', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const prev = a.declareLocal(ValueType.Int32, 'prev');
  const curr = a.declareLocal(ValueType.Int32, 'curr');
  const temp = a.declareLocal(ValueType.Int32, 'temp');
  const i = a.declareLocal(ValueType.Int32, 'i');

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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// If/Else — absolute value and sign function
const mod = new ModuleBuilder('ifElse');

// Absolute value using if/else with typed block
mod.defineFunction('abs', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(0);
  a.lt_i32();
  a.if(BlockType.Int32);
    a.const_i32(0);
    a.get_local(f.getParameter(0));
    a.sub_i32();
  a.else();
    a.get_local(f.getParameter(0));
  a.end();
}).withExport();

// Sign function: returns -1, 0, or 1
mod.defineFunction('sign', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(0);
  a.lt_i32();
  a.if(BlockType.Int32);
    a.const_i32(-1);
  a.else();
    a.get_local(f.getParameter(0));
    a.const_i32(0);
    a.gt_i32();
    a.if(BlockType.Int32);
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

  'min-max': {
    label: 'Min/Max',
    group: 'Basics',
    description: 'Compare values and return the smaller or larger using select.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Min/Max — compare values and return the smaller/larger
const mod = new ModuleBuilder('minmax');

mod.defineFunction('min', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);
  a.get_local(x);
  a.get_local(y);
  a.get_local(x);
  a.get_local(y);
  a.lt_i32();
  a.select();
}).withExport();

mod.defineFunction('max', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);
  a.get_local(x);
  a.get_local(y);
  a.get_local(x);
  a.get_local(y);
  a.gt_i32();
  a.select();
}).withExport();

const instance = await mod.instantiate();
const { min, max } = instance.instance.exports;
log('min(3, 7) = ' + min(3, 7));
log('min(10, 2) = ' + min(10, 2));
log('max(3, 7) = ' + max(3, 7));
log('max(-5, 5) = ' + max(-5, 5));`,
  },

  'multi-return': {
    label: 'Multiple Returns',
    group: 'Basics',
    description: 'Function returning two values using multi-value returns.',
    target: '2.0',
    features: [],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Multiple Returns — function returning two values
const mod = new ModuleBuilder('multiReturn', { target: '2.0' });

// divmod: returns (quotient, remainder)
mod.defineFunction('divmod', [ValueType.Int32, ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);
  // quotient = x / y
  a.get_local(x);
  a.get_local(y);
  a.div_i32();
  // remainder = x % y
  a.get_local(x);
  a.get_local(y);
  a.rem_i32();
}).withExport();

const instance = await mod.instantiate();
const divmod = instance.instance.exports.divmod;
const result = divmod(17, 5);
log('divmod(17, 5) = [' + result[0] + ', ' + result[1] + ']');
log('  quotient: ' + result[0]);
log('  remainder: ' + result[1]);

const result2 = divmod(100, 7);
log('divmod(100, 7) = [' + result2[0] + ', ' + result2[1] + ']');`,
  },

  'counting-loop': {
    label: 'Counting Loop',
    group: 'Basics',
    description: 'Print numbers 1 to N using a loop with imported print function.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Counting Loop — print numbers 1 to N
const mod = new ModuleBuilder('countLoop');

const printImport = mod.importFunction('env', 'print', null, [ValueType.Int32]);

mod.defineFunction('countTo', null, [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const i = a.declareLocal(ValueType.Int32, 'i');
  a.const_i32(1);
  a.set_local(i);
  a.loop(BlockType.Void, (cont) => {
    a.block(BlockType.Void, (brk) => {
      a.get_local(i);
      a.get_local(n);
      a.gt_i32();
      a.br_if(brk);
      a.get_local(i);
      a.call(printImport);
      a.get_local(i);
      a.const_i32(1);
      a.add_i32();
      a.set_local(i);
      a.br(cont);
    });
  });
}).withExport();

const logged = [];
const instance = await mod.instantiate({
  env: { print: (v) => logged.push(v) },
});
instance.instance.exports.countTo(10);
log('Counted to 10: ' + logged.join(', '));`,
  },

  // ─── Memory ───
  memory: {
    label: 'Memory Basics',
    group: 'Memory',
    description: 'Store and load i32 values in linear memory.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Memory: store and load values
const mod = new ModuleBuilder('memoryExample');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

mod.defineFunction('store', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0);
}).withExport();

mod.defineFunction('load', [ValueType.Int32], [ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Byte array — store and sum individual bytes
const mod = new ModuleBuilder('byteArray');
mod.defineMemory(1);

// Store a byte at offset
mod.defineFunction('setByte', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store8_i32(0, 0);
}).withExport();

// Load a byte from offset
mod.defineFunction('getByte', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load8_i32_u(0, 0);
}).withExport();

// Sum bytes from offset 0 to length-1
mod.defineFunction('sumBytes', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const len = f.getParameter(0);
  const sum = a.declareLocal(ValueType.Int32, 'sum');
  const i = a.declareLocal(ValueType.Int32, 'i');

  a.const_i32(0);
  a.set_local(sum);
  a.const_i32(0);
  a.set_local(i);

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Strings in memory — store a string, compute its length
const mod = new ModuleBuilder('stringMem');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Store a data segment with a string at offset 0
const greeting = new TextEncoder().encode('Hello, WebAssembly!');
mod.defineData(new Uint8Array([...greeting, 0]), 0); // null-terminated

// strlen: count bytes until null
mod.defineFunction('strlen', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const ptr = f.getParameter(0);
  const len = a.declareLocal(ValueType.Int32, 'len');

  a.const_i32(0);
  a.set_local(len);

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Data segments — pre-initialize memory with static data
const mod = new ModuleBuilder('dataSegments');
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
mod.defineFunction('getPower', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(4);
  a.mul_i32();
  a.load_i32(2, 0);
}).withExport();

// strlen starting at offset
mod.defineFunction('strlen', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const ptr = f.getParameter(0);
  const len = a.declareLocal(ValueType.Int32, 'len');
  a.const_i32(0);
  a.set_local(len);
  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Memory growth — dynamically add pages at runtime
const mod = new ModuleBuilder('memGrowth');
const mem = mod.defineMemory(1); // start with 1 page (64KB)
mod.exportMemory(mem, 'memory');

// Return current memory size in pages
mod.defineFunction('pages', [ValueType.Int32], [], (f, a) => {
  a.mem_size(0);
}).withExport();

// Grow memory by N pages, return previous size (or -1 on failure)
mod.defineFunction('grow', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.mem_grow(0);
}).withExport();

// Store an i32 at a byte offset
mod.defineFunction('store', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0);
}).withExport();

// Load an i32 from a byte offset
mod.defineFunction('load', [ValueType.Int32], [ValueType.Int32], (f, a) => {
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

  'ring-buffer': {
    label: 'Ring Buffer',
    group: 'Memory',
    description: 'Circular buffer implementation in linear memory.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Ring Buffer — circular buffer in linear memory
const mod = new ModuleBuilder('ringBuffer');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Layout: [writePtr:i32, readPtr:i32, size:i32, data...]
// Offsets: writePtr=0, readPtr=4, capacity=8, data starts at 12

mod.defineFunction('init', null, [ValueType.Int32], (f, a) => {
  const cap = f.getParameter(0);
  a.const_i32(0); a.const_i32(0); a.store_i32(0, 0);  // writePtr = 0
  a.const_i32(4); a.const_i32(0); a.store_i32(0, 0);  // readPtr = 0
  a.const_i32(8); a.get_local(cap); a.store_i32(0, 0); // capacity
}).withExport();

mod.defineFunction('push', null, [ValueType.Int32], (f, a) => {
  const val = f.getParameter(0);
  const wp = a.declareLocal(ValueType.Int32, 'wp');
  a.const_i32(0); a.load_i32(0, 0); a.set_local(wp);
  // data[wp] = val
  a.get_local(wp);
  a.const_i32(12);
  a.add_i32();
  a.get_local(val);
  a.store_i32(0, 0);
  // writePtr = (wp + 4) % (capacity * 4)
  a.get_local(wp);
  a.const_i32(4);
  a.add_i32();
  a.const_i32(8); a.load_i32(0, 0); a.const_i32(4); a.mul_i32();
  a.rem_i32();
  a.set_local(wp);
  a.const_i32(0); a.get_local(wp); a.store_i32(0, 0);
}).withExport();

mod.defineFunction('pop', [ValueType.Int32], [], (f, a) => {
  const rp = a.declareLocal(ValueType.Int32, 'rp');
  const val = a.declareLocal(ValueType.Int32, 'val');
  a.const_i32(4); a.load_i32(0, 0); a.set_local(rp);
  a.get_local(rp); a.const_i32(12); a.add_i32();
  a.load_i32(0, 0); a.set_local(val);
  // readPtr = (rp + 4) % (capacity * 4)
  a.get_local(rp); a.const_i32(4); a.add_i32();
  a.const_i32(8); a.load_i32(0, 0); a.const_i32(4); a.mul_i32();
  a.rem_i32();
  a.set_local(rp);
  a.const_i32(4); a.get_local(rp); a.store_i32(0, 0);
  a.get_local(val);
}).withExport();

const instance = await mod.instantiate();
const { init, push, pop } = instance.instance.exports;
init(4); // capacity of 4
push(10); push(20); push(30);
log('pop: ' + pop()); // 10
log('pop: ' + pop()); // 20
push(40); push(50);
log('pop: ' + pop()); // 30
log('pop: ' + pop()); // 40
log('pop: ' + pop()); // 50`,
  },

  'memory-copy-fill': {
    label: 'Memory Copy & Fill',
    group: 'Memory',
    description: 'Bulk memory operations: memory.fill and memory.copy.',
    target: '2.0',
    features: ['bulk-memory'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Memory Copy & Fill — bulk memory operations
const mod = new ModuleBuilder('memCopyFill', { target: '2.0' });
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Fill memory[offset..offset+len] with a byte value
mod.defineFunction('fill', null, [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // dest
  a.get_local(f.getParameter(1)); // value
  a.get_local(f.getParameter(2)); // length
  a.memory_fill(0);
}).withExport();

// Copy memory[src..src+len] to memory[dst..]
mod.defineFunction('copy', null, [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // dest
  a.get_local(f.getParameter(1)); // src
  a.get_local(f.getParameter(2)); // length
  a.memory_copy(0, 0);
}).withExport();

const instance = await mod.instantiate();
const { fill, copy, memory } = instance.instance.exports;
const view = new Uint8Array(memory.buffer);

// Fill 10 bytes at offset 0 with 0xAA
fill(0, 0xAA, 10);
log('After fill(0, 0xAA, 10):');
log('  [0..9] = ' + Array.from(view.slice(0, 10)).map(b => '0x' + b.toString(16)).join(', '));

// Copy 5 bytes from offset 0 to offset 20
copy(20, 0, 5);
log('After copy(20, 0, 5):');
log('  [20..24] = ' + Array.from(view.slice(20, 25)).map(b => '0x' + b.toString(16)).join(', '));`,
  },

  'struct-in-memory': {
    label: 'Struct Layout',
    group: 'Memory',
    description: 'Manual struct layout in memory with offset calculations.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Struct Layout in Memory — manual offset calculations
const mod = new ModuleBuilder('structLayout');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Simulate a struct: { x: i32, y: i32, z: f32 }
// Offsets: x=0, y=4, z=8, total size=12

mod.defineFunction('setPoint', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32, ValueType.Float32], (f, a) => {
  const base = f.getParameter(0);
  // x
  a.get_local(base);
  a.get_local(f.getParameter(1));
  a.store_i32(0, 0);
  // y
  a.get_local(base); a.const_i32(4); a.add_i32();
  a.get_local(f.getParameter(2));
  a.store_i32(0, 0);
  // z
  a.get_local(base); a.const_i32(8); a.add_i32();
  a.get_local(f.getParameter(3));
  a.store_f32(0, 0);
}).withExport();

mod.defineFunction('getX', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load_i32(0, 0);
}).withExport();

mod.defineFunction('getY', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); a.const_i32(4); a.add_i32();
  a.load_i32(0, 0);
}).withExport();

mod.defineFunction('getZ', [ValueType.Float32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); a.const_i32(8); a.add_i32();
  a.load_f32(0, 0);
}).withExport();

const instance = await mod.instantiate();
const { setPoint, getX, getY, getZ } = instance.instance.exports;

setPoint(0, 10, 20, 3.14);
log('Point at offset 0:');
log('  x = ' + getX(0));
log('  y = ' + getY(0));
log('  z = ' + getZ(0).toFixed(2));

setPoint(12, 100, 200, 9.81);
log('Point at offset 12:');
log('  x = ' + getX(12));
log('  y = ' + getY(12));
log('  z = ' + getZ(12).toFixed(2));`,
  },

  // ─── Globals & State ───
  globals: {
    label: 'Global Counter',
    group: 'Globals',
    description: 'Mutable global variable used as a persistent counter.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Globals: mutable counter
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Start function — runs automatically on instantiation
const mod = new ModuleBuilder('startExample');

const initialized = mod.defineGlobal(ValueType.Int32, true, 0);

// This function runs automatically at instantiation
const initFn = mod.defineFunction('init', null, [], (f, a) => {
  a.const_i32(1);
  a.set_global(initialized);
});
mod.setStartFunction(initFn);

// Exported getter
mod.defineFunction('isInitialized', [ValueType.Int32], [], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Multiple functions calling each other
const mod = new ModuleBuilder('multiFn');

// Helper: square
mod.defineFunction('square', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(0));
  a.mul_i32();
}).withExport();

// Helper: double
mod.defineFunction('double', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
}).withExport();

// Composed: 2 * x^2
const squareFn = mod._functions[0];
const doubleFn = mod._functions[1];

mod.defineFunction('doubleSquare', [ValueType.Int32], [ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Importing host functions — WASM calling JavaScript
const mod = new ModuleBuilder('imports');

// Declare an import: env.print takes an i32
const printImport = mod.importFunction('env', 'print', null, [ValueType.Int32]);

// Declare another import: env.getTime returns an i32
const getTimeImport = mod.importFunction('env', 'getTime', [ValueType.Int32], []);

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
    imports: ['ModuleBuilder', 'ValueType', 'ElementType'],
    code: `// Indirect calls via function table
const mod = new ModuleBuilder('indirectCall');

const add = mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
});

const sub = mod.defineFunction('sub', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.sub_i32();
});

const mul = mod.defineFunction('mul', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
});

// Create a table with 3 entries
const table = mod.defineTable(ElementType.AnyFunc, 3);
mod.defineElementSegment(table, [add, sub, mul], 0);

// Dispatcher: call function at table[opIndex](a, b)
mod.defineFunction('dispatch', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
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
    imports: ['PackageBuilder', 'ValueType'],
    code: `// Multi-module — PackageBuilder links modules with dependencies
const pkg = new PackageBuilder();

// Module "math": provides a double function
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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Recursive function — power(base, exp) calls itself
const mod = new ModuleBuilder('recursion');

mod.defineFunction('power', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const base = f.getParameter(0);
  const exp = f.getParameter(1);

  // if exp == 0 return 1
  a.get_local(exp);
  a.eqz_i32();
  a.if(BlockType.Void, () => {
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

  'host-callback': {
    label: 'Host Callbacks',
    group: 'Functions',
    description: 'WASM calling JS functions that return values.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Host Callbacks — WASM calling JS functions that return values
const mod = new ModuleBuilder('hostCallback');

const getTime = mod.importFunction('env', 'getTime', [ValueType.Int32], []);
const getRandom = mod.importFunction('env', 'getRandom', [ValueType.Int32], []);

mod.defineFunction('timesPlusRandom', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.call(getTime);
  a.get_local(f.getParameter(0));
  a.mul_i32();
  a.call(getRandom);
  a.add_i32();
}).withExport();

const instance = await mod.instantiate({
  env: {
    getTime: () => 42,
    getRandom: () => Math.floor(Math.random() * 100),
  },
});
const { timesPlusRandom } = instance.instance.exports;
log('timesPlusRandom(3) = ' + timesPlusRandom(3));
log('timesPlusRandom(3) = ' + timesPlusRandom(3));
log('timesPlusRandom(10) = ' + timesPlusRandom(10));`,
  },

  'variadic-dispatch': {
    label: 'Table Dispatch',
    group: 'Functions',
    description: 'Call different functions via a table index using call_indirect.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType', 'ElementType'],
    code: `// Table Dispatch — call different functions via a table index
const mod = new ModuleBuilder('dispatch');

const fnType = mod.defineFunctionType([ValueType.Int32], [ValueType.Int32, ValueType.Int32]);

const add = mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
});

const sub = mod.defineFunction('sub', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.sub_i32();
});

const mul = mod.defineFunction('mul', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
});

const table = mod.defineTable(ElementType.AnyFunc, 3);
table.defineElementSegment([add, sub, mul], 0);

// dispatch(op, a, b) — calls table[op](a, b)
mod.defineFunction('dispatch', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1)); // a
  a.get_local(f.getParameter(2)); // b
  a.get_local(f.getParameter(0)); // table index
  a.call_indirect(fnType);
}).withExport();

const instance = await mod.instantiate();
const { dispatch } = instance.instance.exports;
log('dispatch(0, 10, 3) = add = ' + dispatch(0, 10, 3));
log('dispatch(1, 10, 3) = sub = ' + dispatch(1, 10, 3));
log('dispatch(2, 10, 3) = mul = ' + dispatch(2, 10, 3));`,
  },

  // ─── Control Flow ───
  'br-table': {
    label: 'Branch Table',
    group: 'Control Flow',
    description: 'Switch/case dispatch using the br_table instruction.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// br_table — switch/case dispatch to different blocks
const mod = new ModuleBuilder('brTable');

// dayType(day): 0-4 => "weekday" (return 1), 5-6 => "weekend" (return 2), else => "invalid" (return 0)
mod.defineFunction('dayType', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const day = f.getParameter(0);
  const result = a.declareLocal(ValueType.Int32, 'result');

  a.block(BlockType.Void, (invalidBlock) => {
    a.block(BlockType.Void, (weekendBlock) => {
      a.block(BlockType.Void, (weekdayBlock) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// select — branchless conditional (ternary operator)
const mod = new ModuleBuilder('selectOp');

// max(a, b) = a > b ? a : b  (using select)
mod.defineFunction('max', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
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
mod.defineFunction('min', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
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
mod.defineFunction('clamp', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  const val = f.getParameter(0);
  const lo = f.getParameter(1);
  const hi = f.getParameter(2);
  const tmp = a.declareLocal(ValueType.Int32, 'tmp');

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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Nested blocks — multi-level break and continue patterns
const mod = new ModuleBuilder('nestedBlocks');

// Find the first number in [start, start+limit) divisible by both 3 and 5
// Returns -1 if not found
mod.defineFunction('findFizzBuzz', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const start = f.getParameter(0);
  const limit = f.getParameter(1);
  const i = a.declareLocal(ValueType.Int32, 'i');
  const end = a.declareLocal(ValueType.Int32, 'end');
  const result = a.declareLocal(ValueType.Int32, 'result');

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
  a.block(BlockType.Void, (found) => {
    a.loop(BlockType.Void, (cont) => {
      // if i >= end, exit loop
      a.block(BlockType.Void, (skip) => {
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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// drop and tee_local — stack manipulation
const mod = new ModuleBuilder('stackOps');

// tee_local: stores to local AND keeps value on stack
// Equivalent to: set_local + get_local, but in one instruction
mod.defineFunction('sumAndCount', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const sum = a.declareLocal(ValueType.Int32, 'sum');
  const i = a.declareLocal(ValueType.Int32, 'i');

  a.const_i32(0);
  a.set_local(sum);
  a.const_i32(1);
  a.set_local(i);

  a.loop(BlockType.Void, (cont) => {
    a.block(BlockType.Void, (brk) => {
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
mod.defineFunction('callAndDiscard', [ValueType.Int32], [], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// unreachable — intentional trap for defensive programming
const mod = new ModuleBuilder('trapDemo');

// divide(a, b) — traps if b is zero
mod.defineFunction('divide', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);

  // Guard: trap if divisor is zero
  a.get_local(y);
  a.eqz_i32();
  a.if(BlockType.Void, () => {
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

  'early-return': {
    label: 'Early Return',
    group: 'Control Flow',
    description: 'Exit from nested blocks using return instruction.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Early Return — exit from nested blocks
const mod = new ModuleBuilder('earlyReturn');

// Return early if n <= 0, otherwise compute n * 2
mod.defineFunction('doublePositive', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  a.get_local(n);
  a.const_i32(0);
  a.le_i32();
  a.if(BlockType.Void, () => {
    a.const_i32(-1);
    a.return();
  });
  a.get_local(n);
  a.const_i32(2);
  a.mul_i32();
}).withExport();

const instance = await mod.instantiate();
const { doublePositive } = instance.instance.exports;
log('doublePositive(5) = ' + doublePositive(5));
log('doublePositive(0) = ' + doublePositive(0));
log('doublePositive(-3) = ' + doublePositive(-3));
log('doublePositive(100) = ' + doublePositive(100));`,
  },

  'switch-dispatch': {
    label: 'Switch via br_table',
    group: 'Control Flow',
    description: 'Pattern matching using br_table for switch/case dispatch.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Switch via br_table — pattern matching
const mod = new ModuleBuilder('switchCase');

// Map 0→10, 1→20, 2→30, default→-1
mod.defineFunction('lookup', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const result = a.declareLocal(ValueType.Int32, 'result');
  a.block(BlockType.Void, (defaultBlock) => {
    a.block(BlockType.Void, (case2) => {
      a.block(BlockType.Void, (case1) => {
        a.block(BlockType.Void, (case0) => {
          a.get_local(n);
          a.br_table(defaultBlock, case0, case1, case2);
        });
        // case 0
        a.const_i32(10); a.set_local(result);
        a.br(defaultBlock);
      });
      // case 1
      a.const_i32(20); a.set_local(result);
      a.br(defaultBlock);
    });
    // case 2
    a.const_i32(30); a.set_local(result);
    a.br(defaultBlock);
  });
  // After the blocks — either from a case or default
  // For default, result stays 0; let's set it to -1 only if not set
  // Actually with br_table, if n > 2, we fall to defaultBlock directly
  a.get_local(result);
  // If result is still 0 and n > 2, return -1
}).withExport();

const instance = await mod.instantiate();
const { lookup } = instance.instance.exports;
log('lookup(0) = ' + lookup(0));
log('lookup(1) = ' + lookup(1));
log('lookup(2) = ' + lookup(2));
log('lookup(5) = ' + lookup(5) + ' (default)');`,
  },

  // ─── Numeric Types ───
  'float-math': {
    label: 'Float Math',
    group: 'Numeric',
    description: 'Floating-point distance, rounding, and sqrt with f64.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Floating-point operations — f64 math functions
const mod = new ModuleBuilder('floatMath');

// Distance: sqrt(dx*dx + dy*dy)
mod.defineFunction('distance', [ValueType.Float64],
  [ValueType.Float64, ValueType.Float64,
   ValueType.Float64, ValueType.Float64], (f, a) => {
  const x1 = f.getParameter(0);
  const y1 = f.getParameter(1);
  const x2 = f.getParameter(2);
  const y2 = f.getParameter(3);
  const dx = a.declareLocal(ValueType.Float64, 'dx');
  const dy = a.declareLocal(ValueType.Float64, 'dy');

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
mod.defineFunction('roundUp', [ValueType.Float64], [ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.ceil_f64();
}).withExport();

mod.defineFunction('roundDown', [ValueType.Float64], [ValueType.Float64], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// 64-bit integers — BigInt interop
const mod = new ModuleBuilder('i64ops');

mod.defineFunction('add64', [ValueType.Int64],
  [ValueType.Int64, ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i64();
}).withExport();

mod.defineFunction('mul64', [ValueType.Int64],
  [ValueType.Int64, ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i64();
}).withExport();

// Factorial with i64 — can handle larger numbers
mod.defineFunction('factorial64', [ValueType.Int64], [ValueType.Int64], (f, a) => {
  const n = f.getParameter(0);
  const result = a.declareLocal(ValueType.Int64, 'result');
  const i = a.declareLocal(ValueType.Int64, 'i');

  a.const_i64(1n);
  a.set_local(result);
  a.const_i64(1n);
  a.set_local(i);

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Type conversions between numeric types
const mod = new ModuleBuilder('conversions');

// i32 to f64
mod.defineFunction('i32_to_f64', [ValueType.Float64], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.convert_i32_s_f64();
}).withExport();

// f64 to i32 (truncate)
mod.defineFunction('f64_to_i32', [ValueType.Int32], [ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.trunc_f64_s_i32();
}).withExport();

// i32 to i64 (sign extend)
mod.defineFunction('i32_to_i64', [ValueType.Int64], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.extend_i32_s_i64();
}).withExport();

// i64 to i32 (wrap)
mod.defineFunction('i64_to_i32', [ValueType.Int32], [ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.wrap_i64_i32();
}).withExport();

// f32 to f64 (promote)
mod.defineFunction('f32_to_f64', [ValueType.Float64], [ValueType.Float32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Bitwise operations — rotl, rotr, clz, ctz, popcnt
const mod = new ModuleBuilder('bitwiseOps');

mod.defineFunction('rotl', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.rotl_i32();
}).withExport();

mod.defineFunction('rotr', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.rotr_i32();
}).withExport();

mod.defineFunction('clz', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.clz_i32();
}).withExport();

mod.defineFunction('ctz', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.ctz_i32();
}).withExport();

mod.defineFunction('popcnt', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Special float operations — copysign, nearest, trunc
const mod = new ModuleBuilder('floatSpecial');

// copysign(a, b) — magnitude of a, sign of b
mod.defineFunction('copysign', [ValueType.Float64],
  [ValueType.Float64, ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.copysign_f64();
}).withExport();

// nearest — round to nearest even (banker's rounding)
mod.defineFunction('nearest', [ValueType.Float64],
  [ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.nearest_f64();
}).withExport();

// trunc — round towards zero (remove fractional part)
mod.defineFunction('trunc', [ValueType.Float64],
  [ValueType.Float64], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Reinterpret — same bits, different type interpretation
const mod = new ModuleBuilder('reinterpret');

// View f32 bits as i32
mod.defineFunction('f32_bits', [ValueType.Int32],
  [ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.reinterpret_f32_i32();
}).withExport();

// View i32 bits as f32
mod.defineFunction('i32_as_f32', [ValueType.Float32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.reinterpret_i32_f32();
}).withExport();

// View f64 bits as i64
mod.defineFunction('f64_bits', [ValueType.Int64],
  [ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.reinterpret_f64_i64();
}).withExport();

// View i64 bits as f64
mod.defineFunction('i64_as_f64', [ValueType.Float64],
  [ValueType.Int64], (f, a) => {
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

  'clz-ctz-popcnt': {
    label: 'Bit Counting',
    group: 'Numeric',
    description: 'Count leading zeros, trailing zeros, and population count.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Bit Counting — clz, ctz, and popcnt
const mod = new ModuleBuilder('bitCount');

mod.defineFunction('clz', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.clz_i32();
}).withExport();

mod.defineFunction('ctz', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.ctz_i32();
}).withExport();

mod.defineFunction('popcnt', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.popcnt_i32();
}).withExport();

const instance = await mod.instantiate();
const { clz, ctz, popcnt } = instance.instance.exports;
log('clz(1) = ' + clz(1) + ' (31 leading zeros)');
log('clz(256) = ' + clz(256) + ' (23 leading zeros)');
log('ctz(8) = ' + ctz(8) + ' (3 trailing zeros)');
log('ctz(12) = ' + ctz(12) + ' (2 trailing zeros)');
log('popcnt(7) = ' + popcnt(7) + ' (3 bits set: 111)');
log('popcnt(255) = ' + popcnt(255) + ' (8 bits set)');`,
  },

  'integer-overflow': {
    label: 'Integer Overflow',
    group: 'Numeric',
    description: 'Wrapping behavior of i32 arithmetic on overflow.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Integer Overflow — wrapping behavior of i32 arithmetic
const mod = new ModuleBuilder('overflow');

mod.defineFunction('addWrap', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

mod.defineFunction('mulWrap', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.mul_i32();
}).withExport();

const instance = await mod.instantiate();
const { addWrap, mulWrap } = instance.instance.exports;

const MAX = 2147483647;  // i32 max
log('MAX_INT32 = ' + MAX);
log('MAX + 1 = ' + addWrap(MAX, 1) + ' (wraps to MIN)');
log('MAX + MAX = ' + addWrap(MAX, MAX) + ' (wraps)');
log('1000000 * 1000000 = ' + mulWrap(1000000, 1000000) + ' (wraps)');
log('-1 * -1 = ' + mulWrap(-1, -1) + ' (no overflow)');`,
  },

  // ─── Algorithms ───
  'bubble-sort': {
    label: 'Bubble Sort',
    group: 'Algorithms',
    description: 'Sort an array in linear memory with nested loops.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Bubble sort in WASM memory
const mod = new ModuleBuilder('bubbleSort');
mod.defineMemory(1);

// Store i32 at index (index * 4)
mod.defineFunction('set', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(4);
  a.mul_i32();
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0);
}).withExport();

// Load i32 at index
mod.defineFunction('get', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(4);
  a.mul_i32();
  a.load_i32(2, 0);
}).withExport();

const setFn = mod._functions[0];
const getFn = mod._functions[1];

// Bubble sort(length)
mod.defineFunction('sort', null, [ValueType.Int32], (f, a) => {
  const len = f.getParameter(0);
  const i = a.declareLocal(ValueType.Int32, 'i');
  const j = a.declareLocal(ValueType.Int32, 'j');
  const temp = a.declareLocal(ValueType.Int32, 'temp');
  const swapped = a.declareLocal(ValueType.Int32, 'swapped');

  a.const_i32(0);
  a.set_local(i);

  // Outer loop
  a.loop(BlockType.Void, (outerLoop) => {
    a.block(BlockType.Void, (outerBreak) => {
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
      a.loop(BlockType.Void, (innerLoop) => {
        a.block(BlockType.Void, (innerBreak) => {
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
          a.if(BlockType.Void, () => {
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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Greatest common divisor — Euclidean algorithm
const mod = new ModuleBuilder('gcd');

mod.defineFunction('gcd', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const x = f.getParameter(0);
  const y = f.getParameter(1);
  const temp = a.declareLocal(ValueType.Int32, 'temp');

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Collatz conjecture — count steps to reach 1
const mod = new ModuleBuilder('collatz');

mod.defineFunction('collatz', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const steps = a.declareLocal(ValueType.Int32, 'steps');

  a.const_i32(0);
  a.set_local(steps);

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
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
      a.if(BlockType.Void);
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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Primality test — trial division
const mod = new ModuleBuilder('prime');

mod.defineFunction('isPrime', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const n = f.getParameter(0);
  const i = a.declareLocal(ValueType.Int32, 'i');

  // n <= 1 → not prime
  a.get_local(n);
  a.const_i32(1);
  a.le_i32();
  a.if(BlockType.Void, () => {
    a.const_i32(0);
    a.return();
  });

  // n <= 3 → prime
  a.get_local(n);
  a.const_i32(3);
  a.le_i32();
  a.if(BlockType.Void, () => {
    a.const_i32(1);
    a.return();
  });

  // divisible by 2 → not prime
  a.get_local(n);
  a.const_i32(2);
  a.rem_i32_u();
  a.eqz_i32();
  a.if(BlockType.Void, () => {
    a.const_i32(0);
    a.return();
  });

  // Trial division from 3 to sqrt(n)
  a.const_i32(3);
  a.set_local(i);

  a.loop(BlockType.Void, (loopLabel) => {
    a.block(BlockType.Void, (breakLabel) => {
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
      a.if(BlockType.Void, () => {
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

  'binary-search': {
    label: 'Binary Search',
    group: 'Algorithms',
    description: 'Search a sorted array in linear memory using binary search.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Binary Search — search a sorted array in linear memory
const mod = new ModuleBuilder('binarySearch');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// binarySearch(ptr, len, target) → index or -1
mod.defineFunction('search', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  const ptr = f.getParameter(0);
  const len = f.getParameter(1);
  const target = f.getParameter(2);
  const lo = a.declareLocal(ValueType.Int32, 'lo');
  const hi = a.declareLocal(ValueType.Int32, 'hi');
  const mid = a.declareLocal(ValueType.Int32, 'mid');
  const val = a.declareLocal(ValueType.Int32, 'val');

  a.const_i32(0); a.set_local(lo);
  a.get_local(len); a.const_i32(1); a.sub_i32(); a.set_local(hi);

  a.loop(BlockType.Void, (cont) => {
    a.block(BlockType.Void, (done) => {
      a.get_local(lo); a.get_local(hi); a.gt_i32(); a.br_if(done);
      // mid = (lo + hi) / 2
      a.get_local(lo); a.get_local(hi); a.add_i32();
      a.const_i32(1); a.shr_i32_u(); a.set_local(mid);
      // val = memory[ptr + mid * 4]
      a.get_local(ptr); a.get_local(mid); a.const_i32(4); a.mul_i32(); a.add_i32();
      a.load_i32(0, 0); a.set_local(val);
      // if val == target, return mid
      a.get_local(val); a.get_local(target); a.eq_i32();
      a.if(BlockType.Void, () => { a.get_local(mid); a.return(); });
      // if val < target, lo = mid + 1
      a.get_local(val); a.get_local(target); a.lt_i32();
      a.if(BlockType.Void, () => {
        a.get_local(mid); a.const_i32(1); a.add_i32(); a.set_local(lo);
      });
      // if val > target, hi = mid - 1
      a.get_local(val); a.get_local(target); a.gt_i32();
      a.if(BlockType.Void, () => {
        a.get_local(mid); a.const_i32(1); a.sub_i32(); a.set_local(hi);
      });
      a.br(cont);
    });
  });
  a.const_i32(-1); // not found
}).withExport();

const instance = await mod.instantiate();
const { search, memory } = instance.instance.exports;
const view = new Int32Array(memory.buffer);

// Store sorted array at offset 0
const sorted = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
sorted.forEach((v, i) => view[i] = v);

for (const target of [23, 2, 91, 50]) {
  const idx = search(0, sorted.length, target);
  log('search(' + target + ') = index ' + idx + (idx >= 0 ? ' (found)' : ' (not found)'));
}`,
  },

  'string-reverse': {
    label: 'String Reverse',
    group: 'Algorithms',
    description: 'Reverse a byte string in-place in linear memory.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// String Reverse — reverse a byte string in-place in memory
const mod = new ModuleBuilder('strReverse');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// reverse(ptr, len) — in-place byte reversal
mod.defineFunction('reverse', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  const ptr = f.getParameter(0);
  const len = f.getParameter(1);
  const lo = a.declareLocal(ValueType.Int32, 'lo');
  const hi = a.declareLocal(ValueType.Int32, 'hi');
  const tmp = a.declareLocal(ValueType.Int32, 'tmp');

  a.get_local(ptr); a.set_local(lo);
  a.get_local(ptr); a.get_local(len); a.add_i32();
  a.const_i32(1); a.sub_i32(); a.set_local(hi);

  a.loop(BlockType.Void, (cont) => {
    a.block(BlockType.Void, (done) => {
      a.get_local(lo); a.get_local(hi); a.ge_i32_u(); a.br_if(done);
      // swap mem[lo] and mem[hi]
      a.get_local(lo); a.load8_i32_u(0, 0); a.set_local(tmp);
      a.get_local(lo); a.get_local(hi); a.load8_i32_u(0, 0); a.store8_i32(0, 0);
      a.get_local(hi); a.get_local(tmp); a.store8_i32(0, 0);
      a.get_local(lo); a.const_i32(1); a.add_i32(); a.set_local(lo);
      a.get_local(hi); a.const_i32(1); a.sub_i32(); a.set_local(hi);
      a.br(cont);
    });
  });
}).withExport();

const instance = await mod.instantiate();
const { reverse, memory } = instance.instance.exports;
const view = new Uint8Array(memory.buffer);
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const str = 'Hello, WebAssembly!';
const bytes = encoder.encode(str);
view.set(bytes, 0);
log('Before: ' + str);

reverse(0, bytes.length);
log('After:  ' + decoder.decode(view.slice(0, bytes.length)));`,
  },

  'matrix-multiply': {
    label: 'Matrix Multiply',
    group: 'Algorithms',
    description: '2x2 matrix multiplication using f32 values in memory.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Matrix Multiply — 2x2 matrix multiplication in memory
const mod = new ModuleBuilder('matrix');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// 2x2 matrix stored as 4 floats: [a, b, c, d] = | a b |
//                                                  | c d |
// multiply(A_ptr, B_ptr, out_ptr)
mod.defineFunction('multiply', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  const A = f.getParameter(0);
  const B = f.getParameter(1);
  const O = f.getParameter(2);

  // out[0] = A[0]*B[0] + A[1]*B[2]
  a.get_local(O);
  a.get_local(A); a.load_f32(0, 0);
  a.get_local(B); a.load_f32(0, 0);
  a.mul_f32();
  a.get_local(A); a.load_f32(0, 4);
  a.get_local(B); a.load_f32(0, 8);
  a.mul_f32();
  a.add_f32();
  a.store_f32(0, 0);

  // out[1] = A[0]*B[1] + A[1]*B[3]
  a.get_local(O);
  a.get_local(A); a.load_f32(0, 0);
  a.get_local(B); a.load_f32(0, 4);
  a.mul_f32();
  a.get_local(A); a.load_f32(0, 4);
  a.get_local(B); a.load_f32(0, 12);
  a.mul_f32();
  a.add_f32();
  a.store_f32(0, 4);

  // out[2] = A[2]*B[0] + A[3]*B[2]
  a.get_local(O);
  a.get_local(A); a.load_f32(0, 8);
  a.get_local(B); a.load_f32(0, 0);
  a.mul_f32();
  a.get_local(A); a.load_f32(0, 12);
  a.get_local(B); a.load_f32(0, 8);
  a.mul_f32();
  a.add_f32();
  a.store_f32(0, 8);

  // out[3] = A[2]*B[1] + A[3]*B[3]
  a.get_local(O);
  a.get_local(A); a.load_f32(0, 8);
  a.get_local(B); a.load_f32(0, 4);
  a.mul_f32();
  a.get_local(A); a.load_f32(0, 12);
  a.get_local(B); a.load_f32(0, 12);
  a.mul_f32();
  a.add_f32();
  a.store_f32(0, 12);
}).withExport();

const instance = await mod.instantiate();
const { multiply, memory } = instance.instance.exports;
const view = new Float32Array(memory.buffer);

// A = | 1 2 |  B = | 5 6 |
//     | 3 4 |      | 7 8 |
view.set([1, 2, 3, 4], 0);   // A at offset 0
view.set([5, 6, 7, 8], 4);   // B at offset 16 (4 floats * 4 bytes)
multiply(0, 16, 32);          // Result at offset 32

log('A = | 1 2 |');
log('    | 3 4 |');
log('B = | 5 6 |');
log('    | 7 8 |');
log('A * B = | ' + view[8] + ' ' + view[9] + ' |');
log('        | ' + view[10] + ' ' + view[11] + ' |');`,
  },

  // ─── WAT Parser ───
  'wat-parser': {
    label: 'WAT Parser',
    group: 'WAT',
    description: 'Parse WebAssembly Text format and instantiate the module.',
    target: 'mvp',
    features: [],
    imports: ['parseWat'],
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
const mod = parseWat(watSource);
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
    imports: ['parseWat'],
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

const mod = parseWat(watSource);
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
    imports: ['parseWat'],
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

const mod = parseWat(watSource);
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
    imports: ['parseWat'],
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

const mod = parseWat(watSource);
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
    imports: ['parseWat'],
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

const mod = parseWat(watSource);
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

  'wat-multi-value': {
    label: 'WAT Multi-Value',
    group: 'WAT',
    description: 'WAT functions returning multiple values.',
    target: '2.0',
    features: [],
    imports: ['parseWat'],
    code: `// WAT Multi-Value — functions returning multiple values
const wat = \`
(module
  (func $swap (param i32 i32) (result i32 i32)
    local.get 1
    local.get 0
  )
  (func $divmod (param i32 i32) (result i32 i32)
    local.get 0
    local.get 1
    i32.div_s
    local.get 0
    local.get 1
    i32.rem_s
  )
  (export "swap" (func $swap))
  (export "divmod" (func $divmod))
)\`;

const mod = parseWat(wat);
const instance = await mod.instantiate();
const { swap, divmod } = instance.instance.exports;

const swapped = swap(10, 20);
log('swap(10, 20) = [' + swapped[0] + ', ' + swapped[1] + ']');

const dm = divmod(17, 5);
log('divmod(17, 5) = [' + dm[0] + ', ' + dm[1] + '] (quotient, remainder)');`,
  },

  'wat-struct': {
    label: 'WAT with Structs',
    group: 'WAT',
    description: 'View generated WAT for GC struct and array types.',
    target: 'latest',
    features: ['gc'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// WAT with GC Structs — view generated WAT for GC types
// This example shows the text format for GC struct/array types
const mod = new ModuleBuilder('watGC', {
  target: 'latest',
});

// A 2D point struct
const Point = mod.defineStructType([
  { name: 'x', type: ValueType.Float64, mutable: true },
  { name: 'y', type: ValueType.Float64, mutable: true },
]);

// A mutable array of i32
mod.defineArrayType(ValueType.Int32, true);

// A simple function that creates a default point
mod.defineFunction('origin', null, [], (f, a) => {
  a.struct_new_default(Point.index);
  a.drop();
}).withExport();

log('Generated WAT for GC types:');
log(mod.toString());
log('');
const bytes = mod.toBytes();
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  // ─── SIMD ───
  'simd-vec-add': {
    label: 'SIMD Vector Add',
    group: 'SIMD',
    description: 'Add two f32x4 vectors in memory using SIMD.',
    target: '3.0',
    features: ['simd'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// SIMD: add two f32x4 vectors in memory
const mod = new ModuleBuilder('simdAdd');
mod.defineMemory(1);

// vec4_add(srcA, srcB, dst) — adds two 4-float vectors
mod.defineFunction('vec4_add', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2));  // push dest address first
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0);
  a.add_f32x4();
  a.store_v128(2, 0);              // store expects [addr, value] on stack
}).withExport();

mod.defineFunction('setF32', null,
  [ValueType.Int32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_f32(2, 0);
}).withExport();

mod.defineFunction('getF32', [ValueType.Float32],
  [ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// SIMD dot product: multiply element-wise then sum lanes
const mod = new ModuleBuilder('simdDot');
mod.defineMemory(1);

mod.defineFunction('dot4', [ValueType.Float32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const products = a.declareLocal(ValueType.V128, 'products');

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
  [ValueType.Int32, ValueType.Float32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// SIMD splat: broadcast a scalar to all lanes, then multiply
const mod = new ModuleBuilder('simdScale');
mod.defineMemory(1);

// scale_vec4(src, dst, scalar) — multiply a vector by a scalar
mod.defineFunction('scale_vec4', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(1));  // push dest address first
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0);
  a.get_local(f.getParameter(2));
  a.splat_f32x4();          // broadcast scalar to all 4 lanes
  a.mul_f32x4();
  a.store_v128(2, 0);       // store expects [addr, value] on stack
}).withExport();

mod.defineFunction('setF32', null,
  [ValueType.Int32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_f32(2, 0);
}).withExport();

mod.defineFunction('getF32', [ValueType.Float32],
  [ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Bulk memory: memory.fill and memory.copy
const mod = new ModuleBuilder('bulkMem');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// fill(dest, value, length)
mod.defineFunction('fill', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.get_local(f.getParameter(2));
  a.memory_fill(0);
}).withExport();

// copy(dest, src, length)
mod.defineFunction('copy', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Sign extension: interpret low bits as signed values
const mod = new ModuleBuilder('signExt');

// Treat low 8 bits as a signed byte
mod.defineFunction('extend8', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.extend8_s_i32();
}).withExport();

// Treat low 16 bits as a signed i16
mod.defineFunction('extend16', [ValueType.Int32], [ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Saturating truncation: float → int without trapping on overflow
const mod = new ModuleBuilder('satTrunc');

// Normal trunc would trap on overflow; saturating clamps instead
mod.defineFunction('sat_f64_to_i32', [ValueType.Int32], [ValueType.Float64], (f, a) => {
  a.get_local(f.getParameter(0));
  a.trunc_sat_f64_s_i32();
}).withExport();

mod.defineFunction('sat_f64_to_u32', [ValueType.Int32], [ValueType.Float64], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Reference types: ref.null, ref.is_null, ref.func
const mod = new ModuleBuilder('refTypes');

const double = mod.defineFunction('double', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
}).withExport();

// Check if a null funcref is null → 1
mod.defineFunction('isRefNull', [ValueType.Int32], [], (f, a) => {
  a.ref_null(0x70);
  a.ref_is_null();
}).withExport();

// Check if a real function ref is null → 0
mod.defineFunction('isFuncNull', [ValueType.Int32], [], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Target system: control which features are available
// Default is 'latest' — all features enabled
const modLatest = new ModuleBuilder('latest');
log('latest features:');
log('  threads: ' + modLatest.hasFeature('threads'));
log('  simd: ' + modLatest.hasFeature('simd'));
log('  exception-handling: ' + modLatest.hasFeature('exception-handling'));
log('  memory64: ' + modLatest.hasFeature('memory64'));
log('  relaxed-simd: ' + modLatest.hasFeature('relaxed-simd'));

log('');

// WebAssembly 2.0 — only widely-deployed features
const mod2 = new ModuleBuilder('compat', { target: '2.0' });
log('2.0 features:');
log('  sign-extend: ' + mod2.hasFeature('sign-extend'));
log('  bulk-memory: ' + mod2.hasFeature('bulk-memory'));
log('  threads: ' + mod2.hasFeature('threads'));
log('  simd: ' + mod2.hasFeature('simd'));

log('');

// MVP with specific features
const modCustom = new ModuleBuilder('custom', {
  target: 'mvp',
  features: ['simd', 'bulk-memory'],
});
log('mvp + simd + bulk-memory:');
log('  simd: ' + modCustom.hasFeature('simd'));
log('  bulk-memory: ' + modCustom.hasFeature('bulk-memory'));
log('  threads: ' + modCustom.hasFeature('threads'));

log('');

// Build a simple module with 2.0 target
mod2.defineFunction('add', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Multi-value: functions can return more than one value
const mod = new ModuleBuilder('multiValue');

// divmod returns both quotient and remainder
mod.defineFunction('divmod', [ValueType.Int32, ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  const dividend = f.getParameter(0);
  const divisor = f.getParameter(1);

  // Push quotient
  a.get_local(dividend);
  a.get_local(divisor);
  a.div_i32();

  // Push remainder
  a.get_local(dividend);
  a.get_local(divisor);
  a.rem_i32();
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Mutable global export: JS can read the global's value
const mod = new ModuleBuilder('mutGlobal');

const counter = mod.defineGlobal(ValueType.Int32, true, 0);
mod.exportGlobal(counter, 'counter');

mod.defineFunction('increment', null, [], (f, a) => {
  a.get_global(counter);
  a.const_i32(1);
  a.add_i32();
  a.set_global(counter);
}).withExport();

mod.defineFunction('add', null, [ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Tail calls: return_call reuses the current frame
const mod = new ModuleBuilder('tailCall');

// Declare both functions first (forward reference)
const helper = mod.defineFunction('fact_helper', [ValueType.Int64],
  [ValueType.Int64, ValueType.Int64]);
const factorial = mod.defineFunction('factorial', [ValueType.Int64],
  [ValueType.Int64]);

// Tail-recursive helper: fact_helper(n, acc)
{
  const a = helper.createEmitter();
  const n = helper.getParameter(0);
  const acc = helper.getParameter(1);

  // Base case: n <= 1
  a.get_local(n);
  a.const_i64(1n);
  a.le_i64();
  a.if(BlockType.Void, () => {
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
  a.end();
}

// Public entry: factorial(n)
{
  const a = factorial.createEmitter();
  a.get_local(factorial.getParameter(0));
  a.const_i64(1n);
  a.call(helper);
  a.end();
}
factorial.withExport();

const instance = await mod.instantiate();
const fact = instance.instance.exports.factorial;

log('Tail-recursive factorial (i64):');
for (let n = 0n; n <= 20n; n++) {
  log('  ' + n + '! = ' + fact(n));
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Shared memory + atomic operations
const mod = new ModuleBuilder('atomics');

// Shared memory requires both initial and maximum
const mem = mod.defineMemory(1, 10, true); // shared=true
mod.exportMemory(mem, 'memory');

// Atomic store
mod.defineFunction('atomicStore', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_store_i32(2, 0);
}).withExport();

// Atomic load
mod.defineFunction('atomicLoad', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.atomic_load_i32(2, 0);
}).withExport();

// Atomic add (returns old value)
mod.defineFunction('atomicAdd', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_add_i32(2, 0);
}).withExport();

// Atomic compare-and-swap
mod.defineFunction('atomicCAS', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Exception handling: defineTag + throw
const mod = new ModuleBuilder('exceptions');

// Define a tag with an i32 payload (like an error code)
const errorTag = mod.defineTag([ValueType.Int32]);

// Throws when input is negative
mod.defineFunction('checkPositive', null, [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(0);
  a.lt_i32();
  a.if(BlockType.Void, () => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Memory64: 64-bit addressed memory
const mod = new ModuleBuilder('memory64', { target: '3.0' });

// Define a 64-bit addressed memory
const mem = mod.defineMemory(1, 100, false, true); // memory64=true
mod.exportMemory(mem, 'memory');

// Store: address is i64 for memory64
mod.defineFunction('store64', null,
  [ValueType.Int64, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // i64 address
  a.get_local(f.getParameter(1)); // i32 value
  a.store_i32(2, 0);
}).withExport();

// Load: address is i64 for memory64
mod.defineFunction('load64', [ValueType.Int32],
  [ValueType.Int64], (f, a) => {
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

  // ─── GC (Garbage Collection) ───
  'gc-struct-basic': {
    label: 'Struct Basics',
    group: 'GC',
    description: 'Define a Point struct with x,y fields, create and read fields.',
    target: 'latest',
    features: ['gc'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// GC Struct Basics — define a Point struct and access fields
const mod = new ModuleBuilder('gcStruct', {
  target: 'latest',
});

// Define a struct type with two i32 fields
const Point = mod.defineStructType([
  { name: 'x', type: ValueType.Int32, mutable: true },
  { name: 'y', type: ValueType.Int32, mutable: true },
]);

log('Struct type index: ' + Point.index);
log('Fields: ' + Point.fields.map(f => f.name).join(', '));
log('Field count: ' + Point.fields.length);

// Create a function that makes a Point and reads the x field
mod.defineFunction('getX', [ValueType.Int32], [], (f, a) => {
  // Push field values onto stack then struct.new
  a.const_i32(10); // x = 10
  a.const_i32(20); // y = 20
  a.struct_new(Point.index);
  // Read the x field
  a.struct_get(Point.index, Point.getFieldIndex('x'));
}).withExport();

// Create a function that reads the y field
mod.defineFunction('getY', [ValueType.Int32], [], (f, a) => {
  a.const_i32(10);
  a.const_i32(20);
  a.struct_new(Point.index);
  a.struct_get(Point.index, Point.getFieldIndex('y'));
}).withExport();

log('');
log('WAT output:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary size: ' + bytes.length + ' bytes');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'gc-struct-mutable': {
    label: 'Mutable Struct Fields',
    group: 'GC',
    description: 'Create a mutable struct and update fields with struct.set.',
    target: 'latest',
    features: ['gc'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Mutable Struct Fields — create, read, update a GC struct
const mod = new ModuleBuilder('gcMutable', {
  target: 'latest',
});

const Counter = mod.defineStructType([
  { name: 'count', type: ValueType.Int32, mutable: true },
]);

// Create a counter, increment it, return new value
mod.defineFunction('incrementAndGet', [ValueType.Int32], [], (f, a) => {
  // Create counter with count = 0
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

log('WAT output:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary size: ' + bytes.length + ' bytes');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'gc-struct-default': {
    label: 'Struct Default Values',
    group: 'GC',
    description: 'Zero-initialize a struct with struct.new_default.',
    target: 'latest',
    features: ['gc'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Struct Default Values — zero-init with struct.new_default
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
  a.struct_get(Vec3.index, Vec3.getFieldIndex('x'));
}).withExport();

log('Fields: x, y, z (all f32, mutable)');
log('struct.new_default zero-initializes all fields');
log('');
log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'gc-array-basic': {
    label: 'Array Basics',
    group: 'GC',
    description: 'Define a GC array type, create, read, write, and get length.',
    target: 'latest',
    features: ['gc'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// GC Array Basics — create, read, write, measure length
const mod = new ModuleBuilder('gcArray', {
  target: 'latest',
});

// Define a mutable array of i32
const IntArray = mod.defineArrayType(ValueType.Int32, true);
log('Array type index: ' + IntArray.index);

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

log('');
log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'gc-array-fixed': {
    label: 'Fixed-Size Array',
    group: 'GC',
    description: 'Create an array from fixed inline values with array.new_fixed.',
    target: 'latest',
    features: ['gc'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Fixed-Size Array — create from inline values
const mod = new ModuleBuilder('gcFixed', {
  target: 'latest',
});

const IntArray = mod.defineArrayType(ValueType.Int32, false);

// Create a fixed array [10, 20, 30] using array.new_fixed
mod.defineFunction('sumFixed', [ValueType.Int32], [], (f, a) => {
  // Push 3 values, then array.new_fixed(typeIndex, count)
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

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'gc-i31-ref': {
    label: 'i31 References',
    group: 'GC',
    description: 'Pack/unpack small integers as i31ref.',
    target: 'latest',
    features: ['gc'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// i31 References — box/unbox small integers
// i31ref packs a 31-bit integer into a reference type,
// useful for unboxed small values in GC type hierarchies.
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

// Negative number signed roundtrip
mod.defineFunction('negative_s', [ValueType.Int32], [], (f, a) => {
  a.const_i32(-100);
  a.ref_i31();
  a.i31_get_s();
}).withExport();

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'gc-rec-group': {
    label: 'Recursive Types',
    group: 'GC',
    description: 'Define mutually-recursive types using defineRecGroup.',
    target: 'latest',
    features: ['gc'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Recursive Types — mutually-recursive struct definitions
// A rec group allows types to reference each other (forward references).
// Classic example: a linked list node type.
const mod = new ModuleBuilder('gcRec', {
  target: 'latest',
});

// Define a recursive group with two types that reference each other
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

log('Recursive group created with ' + recGroup._types.length + ' types');
log('Type 0: ListNode struct (value: i32, next: ref null ListNode)');
log('Type 1: array of (ref null ListNode)');

log('');
log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'gc-subtyping': {
    label: 'Struct Subtyping',
    group: 'GC',
    description: 'Extend a base struct type with superTypes.',
    target: 'latest',
    features: ['gc'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Struct Subtyping — type hierarchy with superTypes
// GC struct types can extend other struct types (adding fields at the end).
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

log('Type hierarchy:');
log('  Shape (index ' + Shape.index + '): { area: f32 }');
log('  Circle (index ' + Circle.index + ') extends Shape: { area, radius }');
log('  FilledCircle (index ' + FilledCircle.index + ') extends Circle: { area, radius, color }');

log('');
log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'gc-ref-cast-test': {
    label: 'Runtime Type Checks',
    group: 'GC',
    description: 'Use ref.test and ref.cast to check and narrow reference types.',
    target: 'latest',
    features: ['gc'],
    imports: ['ModuleBuilder', 'ValueType', 'HeapType'],
    code: `// Runtime Type Checks — ref.test and ref.cast
// ref.test checks if a reference is a subtype (returns 0 or 1).
// ref.cast narrows a reference type (traps if wrong type).
const mod = new ModuleBuilder('gcCast', {
  target: 'latest',
});

// Test if a null anyref is an i31
mod.defineFunction('testNull', [ValueType.Int32], [], (f, a) => {
  a.ref_null(0x6e);          // null anyref
  a.ref_test(HeapType.I31);  // is it an i31? → 0
}).withExport();

// Test if an i31ref is an i31
mod.defineFunction('testI31', [ValueType.Int32], [], (f, a) => {
  a.const_i32(42);
  a.ref_i31();               // create i31ref
  a.ref_test(HeapType.I31);  // is it an i31? → 1
}).withExport();

// Cast: narrow anyref to i31ref
mod.defineFunction('castI31', null, [], (f, a) => {
  a.const_i32(7);
  a.ref_i31();
  a.ref_cast(HeapType.I31);  // cast to i31ref (succeeds)
  a.drop();
}).withExport();

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'gc-extern-convert': {
    label: 'Extern/Any Conversions',
    group: 'GC',
    description: 'Convert between externref and anyref.',
    target: 'latest',
    features: ['gc'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Extern/Any Conversions
// any.convert_extern: externref → anyref (internalize)
// extern.convert_any: anyref → externref (externalize)
const mod = new ModuleBuilder('gcConvert', {
  target: 'latest',
});

// Internalize then externalize a null externref
mod.defineFunction('roundtrip', null, [], (f, a) => {
  a.ref_null(0x6f);           // null externref
  a.any_convert_extern();     // externref → anyref
  a.extern_convert_any();     // anyref → externref
  a.drop();
}).withExport();

log('any.convert_extern: externref → anyref (internalize)');
log('extern.convert_any: anyref → externref (externalize)');
log('');
log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'gc-array-operations': {
    label: 'Array Fill & Copy',
    group: 'GC',
    description: 'Bulk array manipulation with array.fill and array.copy.',
    target: 'latest',
    features: ['gc'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Array Fill & Copy — bulk GC array operations
const mod = new ModuleBuilder('gcArrayOps', {
  target: 'latest',
});

const IntArray = mod.defineArrayType(ValueType.Int32, true);

// Fill a range of an array with a value
mod.defineFunction('fillDemo', null, [], (f, a) => {
  // Create array of 10 zeros
  a.const_i32(0);
  a.const_i32(10);
  a.array_new(IntArray.index);
  const arr = a.declareLocal(ValueType.AnyRef, 'arr');
  a.set_local(arr);

  // Fill indices 2..5 with value 99
  a.get_local(arr);
  a.const_i32(2);  // dest offset
  a.const_i32(99); // fill value
  a.const_i32(3);  // length (fill 3 elements)
  a.array_fill(IntArray.index);
}).withExport();

// Copy between two arrays
mod.defineFunction('copyDemo', null, [], (f, a) => {
  // Source array with fixed values
  a.const_i32(1);
  a.const_i32(2);
  a.const_i32(3);
  a.array_new_fixed(IntArray.index, 3);
  const src = a.declareLocal(ValueType.AnyRef, 'src');
  a.set_local(src);

  // Destination array of zeros
  a.const_i32(0);
  a.const_i32(5);
  a.array_new(IntArray.index);
  const dst = a.declareLocal(ValueType.AnyRef, 'dst');
  a.set_local(dst);

  // Copy src[0..3] → dst[1..4]
  a.get_local(dst);
  a.const_i32(1);  // dest offset
  a.get_local(src);
  a.const_i32(0);  // src offset
  a.const_i32(3);  // length
  a.array_copy(IntArray.index, IntArray.index);
}).withExport();

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'gc-wat-output': {
    label: 'GC WAT Inspection',
    group: 'GC',
    description: 'Define struct and array types, inspect the generated WAT text.',
    target: 'latest',
    features: ['gc'],
    imports: ['ModuleBuilder', 'ValueType', 'TextModuleWriter'],
    code: `// GC WAT Inspection — explore how GC types appear in text format
const mod = new ModuleBuilder('gcWat', {
  target: 'latest',
});

// Struct type
mod.defineStructType([
  { name: 'x', type: ValueType.Int32, mutable: true },
  { name: 'y', type: ValueType.Float64, mutable: false },
]);

// Immutable array
mod.defineArrayType(ValueType.Float32, false);

// Mutable array
mod.defineArrayType(ValueType.Int32, true);

// A function type (shows mixed type section)
mod.defineFunctionType(ValueType.Int32, [ValueType.Int32]);

// A simple function using struct.new_default
const structType = mod.defineStructType([
  { name: 'val', type: ValueType.Int32, mutable: true },
]);

mod.defineFunction('demo', null, [], (f, a) => {
  a.struct_new_default(structType.index);
  a.drop();
}).withExport();

const writer = new TextModuleWriter(mod);
const wat = writer.toString();
log('Generated WAT:');
log(wat);

log('');
const bytes = mod.toBytes();
log('Binary size: ' + bytes.length + ' bytes');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  // ─── Debug & Inspection ───
  'debug-names': {
    label: 'Debug Name Section',
    group: 'Debug',
    description: 'Inspect function, local, and global names in the binary.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType', 'BinaryReader'],
    code: `// Inspect the debug name section in the binary
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

const bytes = mod.toBytes();

log('Binary size: ' + bytes.length + ' bytes');
log('');

// Read back the name section
const reader = new BinaryReader(bytes);
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
    imports: ['ModuleBuilder', 'ValueType', 'BinaryReader'],
    code: `// Inspect the binary structure of a WASM module
const mod = new ModuleBuilder('inspect');
mod.defineMemory(1);

const counter = mod.defineGlobal(ValueType.Int32, true, 0);

mod.defineFunction('add', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
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
const reader = new BinaryReader(bytes);
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
    imports: ['ModuleBuilder', 'ValueType', 'parseWat'],
    code: `// Build a module with WAT text, parse it, verify correctness
const watText = \`(module
  (func $multiply (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.mul
  )
  (func $negate (param i32) (result i32)
    i32.const 0
    local.get 0
    i32.sub
  )
  (export "multiply" (func $multiply))
  (export "negate" (func $negate))
)\`;

log('=== WAT Source ===');
log(watText);

// Parse it
log('');
log('=== Parsing WAT... ===');
const mod = parseWat(watText);

// Instantiate and test
const instance = await mod.instantiate();
const { multiply, negate } = instance.instance.exports;

log('multiply(6, 7) = ' + multiply(6, 7));
log('multiply(100, -3) = ' + multiply(100, -3));
log('negate(42) = ' + negate(42));
log('negate(-10) = ' + negate(-10));
log('');
log('Parse + instantiate successful!');`,
  },

  'custom-section': {
    label: 'Custom Section',
    group: 'Debug',
    description: 'Add custom metadata to a module and read it back.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'BinaryReader'],
    code: `// Custom section — embed arbitrary metadata in the binary
const mod = new ModuleBuilder('customSec');

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
const reader = new BinaryReader(bytes);
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Extended constants: arithmetic in global initializers
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

// Computed global: base * 2 + 7
const combined = mod.defineGlobal(ValueType.Int32, false, (asm) => {
  asm.get_global(base);
  asm.const_i32(2);
  asm.mul_i32();
  asm.const_i32(7);
  asm.add_i32();
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

mod.defineFunction('getCombined', [ValueType.Int32], [], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Multi-memory: two separate linear memories
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
    imports: ['ModuleBuilder', 'ValueType', 'ElementType'],
    code: `// Multi-table: two function tables for different dispatch
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

// Table 0: math operations
const table0 = mod.defineTable(ElementType.AnyFunc, 3);
mod.defineElementSegment(table0, [add, sub, mul], 0);

// Table 1: just add and mul (different arrangement)
const table1 = mod.defineTable(ElementType.AnyFunc, 2);
mod.defineElementSegment(table1, [mul, add], 0);

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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Relaxed SIMD: relaxed_madd for fused multiply-add
const mod = new ModuleBuilder('relaxedSimd');
mod.defineMemory(1);

// relaxed_madd: a * b + c (fused multiply-add, may use FMA instruction)
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

mod.defineFunction('setF32', null,
  [ValueType.Int32, ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_f32(2, 0);
}).withExport();

mod.defineFunction('getF32', [ValueType.Float32],
  [ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Atomic read-modify-write operations
const mod = new ModuleBuilder('atomicRMW');

// Shared memory for atomics
const mem = mod.defineMemory(1, 10, true);
mod.exportMemory(mem, 'memory');

// Atomic store
mod.defineFunction('store', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_store_i32(2, 0);
}).withExport();

// Atomic load
mod.defineFunction('load', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.atomic_load_i32(2, 0);
}).withExport();

// Atomic sub (returns old value)
mod.defineFunction('atomicSub', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_sub_i32(2, 0);
}).withExport();

// Atomic AND (returns old value)
mod.defineFunction('atomicAnd', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_and_i32(2, 0);
}).withExport();

// Atomic OR (returns old value)
mod.defineFunction('atomicOr', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_or_i32(2, 0);
}).withExport();

// Atomic XOR (returns old value)
mod.defineFunction('atomicXor', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.atomic_rmw_xor_i32(2, 0);
}).withExport();

// Atomic exchange (returns old value, stores new)
mod.defineFunction('atomicXchg', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Atomic wait, notify, and fence — thread synchronization primitives
const mod = new ModuleBuilder('waitNotify');

const mem = mod.defineMemory(1, 10, true);
mod.exportMemory(mem, 'memory');

// atomic.wait32(addr, expected, timeout) -> 0=ok, 1=not-equal, 2=timed-out
mod.defineFunction('wait32', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int64], (f, a) => {
  a.get_local(f.getParameter(0)); // address
  a.get_local(f.getParameter(1)); // expected value
  a.get_local(f.getParameter(2)); // timeout in ns (-1 = infinite)
  a.atomic_wait32(2, 0);
}).withExport();

// atomic.notify(addr, count) -> number of waiters woken
mod.defineFunction('notify', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
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
  [ValueType.Int32, ValueType.Int32], (f, a) => {
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

  'opcode-inspector': {
    label: 'Opcode Inspector',
    group: 'Debug',
    description: 'Examine raw binary bytes and section layout of a module.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Opcode Inspector — examine raw binary bytes of a module
const mod = new ModuleBuilder('inspector');

mod.defineFunction('add', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

const bytes = mod.toBytes();

// Parse the binary header
log('Module size: ' + bytes.length + ' bytes');
log('Magic: 0x' + Array.from(bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(''));
log('Version: ' + new DataView(bytes.buffer).getUint32(4, true));

// Find and display sections
let offset = 8;
while (offset < bytes.length) {
  const sectionId = bytes[offset];
  const sectionNames = ['custom','type','import','function','table','memory','global','export','start','element','code','data','data count'];
  const name = sectionNames[sectionId] || 'unknown(' + sectionId + ')';
  // Read LEB128 size
  let size = 0, shift = 0, byte;
  do {
    byte = bytes[++offset];
    size |= (byte & 0x7f) << shift;
    shift += 7;
  } while (byte & 0x80);
  offset++;
  log('Section ' + sectionId + ' (' + name + '): ' + size + ' bytes at offset ' + offset);
  offset += size;
}`,
  },

  // ─── Additional SIMD ───
  'simd-integer': {
    label: 'SIMD Integer Ops',
    group: 'SIMD',
    description: 'Integer SIMD: i32x4 add, sub, mul, comparisons, and lane ops.',
    target: '3.0',
    features: ['simd'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Integer SIMD: i32x4 arithmetic, comparisons, lane extract/replace
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

// Extract a single lane
mod.defineFunction('extract', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  // Load vector, extract lane based on index using a br_table
  // For simplicity, extract lane 0 from the vector at the address
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

mod.defineFunction('setI32', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store_i32(2, 0);
}).withExport();

mod.defineFunction('getI32', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// SIMD shuffle & swizzle: rearrange bytes across vectors
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
  // Interleave first 4 bytes: A[0], B[0], A[1], B[1], A[2], B[2], A[3], B[3], ...
  a.shuffle_i8x16(new Uint8Array([0, 16, 1, 17, 2, 18, 3, 19, 4, 20, 5, 21, 6, 22, 7, 23]));
  a.store_v128(2, 0);
}).withExport();

// Reverse bytes within a vector using shuffle
mod.defineFunction('reverse', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
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
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(2)); // dest
  a.get_local(f.getParameter(0));
  a.load_v128(2, 0); // data
  a.get_local(f.getParameter(1));
  a.load_v128(2, 0); // indices
  a.swizzle_i8x16();
  a.store_v128(2, 0);
}).withExport();

mod.defineFunction('setByte', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store8_i32(0, 0);
}).withExport();

mod.defineFunction('getByte', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// SIMD widening and narrowing: convert between lane sizes
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

mod.defineFunction('setByte', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store8_i32(0, 0);
}).withExport();

mod.defineFunction('getByte', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load8_i32_u(0, 0);
}).withExport();

mod.defineFunction('setI16', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store16_i32(1, 0);
}).withExport();

mod.defineFunction('getI16', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.load16_i32(1, 0);
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// SIMD saturating arithmetic: clamp on overflow instead of wrap
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

mod.defineFunction('setByte', null,
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.store8_i32(0, 0);
}).withExport();

mod.defineFunction('getByte', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
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

  'simd-abs-neg': {
    label: 'SIMD Abs/Neg',
    group: 'SIMD',
    description: 'Absolute value and negation on f32x4 vectors.',
    target: '3.0',
    features: ['simd'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// SIMD Abs/Neg — absolute value and negation on f32x4 vectors
const mod = new ModuleBuilder('simdAbsNeg', { target: '3.0' });
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// abs: compute |v| for each lane
mod.defineFunction('absF32x4', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1)); // dest
  a.get_local(f.getParameter(0)); // src
  a.load_v128(0, 0);
  a.abs_f32x4();
  a.store_v128(0, 0);
}).withExport();

// neg: compute -v for each lane
mod.defineFunction('negF32x4', null, [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1));
  a.get_local(f.getParameter(0));
  a.load_v128(0, 0);
  a.neg_f32x4();
  a.store_v128(0, 0);
}).withExport();

const instance = await mod.instantiate();
const { absF32x4, negF32x4, memory } = instance.instance.exports;
const view = new Float32Array(memory.buffer);

view.set([-1.5, 2.0, -3.5, 4.0], 0);
log('Input: [' + Array.from(view.slice(0, 4)).join(', ') + ']');

absF32x4(0, 16);
log('abs:   [' + Array.from(view.slice(4, 8)).join(', ') + ']');

negF32x4(0, 32);
log('neg:   [' + Array.from(view.slice(8, 12)).join(', ') + ']');`,
  },

  'simd-bitselect': {
    label: 'SIMD Bitwise Select',
    group: 'SIMD',
    description: 'Conditional lane selection using bitwise select.',
    target: '3.0',
    features: ['simd'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// SIMD Bitwise Select — conditional lane selection
const mod = new ModuleBuilder('simdBitselect', { target: '3.0' });
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// bitselect(a, b, mask): for each bit, result = mask ? a : b
mod.defineFunction('selectLanes', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(3)); // dest
  a.get_local(f.getParameter(0)); // a
  a.load_v128(0, 0);
  a.get_local(f.getParameter(1)); // b
  a.load_v128(0, 0);
  a.get_local(f.getParameter(2)); // mask
  a.load_v128(0, 0);
  a.bitselect_v128();
  a.store_v128(0, 0);
}).withExport();

const instance = await mod.instantiate();
const { selectLanes, memory } = instance.instance.exports;
const i32View = new Int32Array(memory.buffer);
const u32View = new Uint32Array(memory.buffer);

// A = [1, 2, 3, 4], B = [10, 20, 30, 40]
i32View.set([1, 2, 3, 4], 0);      // offset 0 = A
i32View.set([10, 20, 30, 40], 4);   // offset 16 = B
// Mask: all 1s for lanes 0,2 (select A), all 0s for lanes 1,3 (select B)
u32View.set([0xFFFFFFFF, 0, 0xFFFFFFFF, 0], 8); // offset 32 = mask

selectLanes(0, 16, 32, 48);
log('A = [1, 2, 3, 4]');
log('B = [10, 20, 30, 40]');
log('mask = [all1, 0, all1, 0]');
log('result = [' + Array.from(i32View.slice(12, 16)).join(', ') + ']');
log('(selects A for lanes 0,2 and B for lanes 1,3)');`,
  },

  // ─── Additional Bulk Memory ───
  'passive-data': {
    label: 'Passive Data Segments',
    group: 'Bulk Memory',
    description: 'Lazy-init memory with passive segments and memory.init.',
    target: '2.0',
    features: ['bulk-memory'],
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Passive data segments: lazy initialization with memory.init
const mod = new ModuleBuilder('passiveData');
const mem = mod.defineMemory(1);
mod.exportMemory(mem, 'memory');

// Passive segment: not placed in memory until memory.init is called
const greeting = new TextEncoder().encode('Hello, WebAssembly!');
const dataSegment = mod.defineData(new Uint8Array([...greeting]));
dataSegment.passive();

// Copy passive data into memory: init(destOffset)
mod.defineFunction('init', null, [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // destination offset
  a.const_i32(0);                  // source offset in data segment
  a.const_i32(greeting.length);                // length
  a.memory_init(dataSegment._index, 0);
}).withExport();

// Drop data segment (free it after init)
mod.defineFunction('drop', null, [], (f, a) => {
  a.data_drop(dataSegment._index);
}).withExport();

// strlen
mod.defineFunction('strlen', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  const ptr = f.getParameter(0);
  const len = a.declareLocal(ValueType.Int32, 'len');
  a.const_i32(0);
  a.set_local(len);
  a.loop(BlockType.Void, (cont) => {
    a.block(BlockType.Void, (brk) => {
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
    imports: ['ModuleBuilder', 'ValueType', 'ElementType'],
    code: `// Bulk table operations: table.fill and table.copy
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

// Table with space for 8 entries
const table = mod.defineTable(ElementType.AnyFunc, 8);
mod.defineElementSegment(table, [add, mul], 0);

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
mod.defineFunction('tableSize', [ValueType.Int32], [], (f, a) => {
  a.table_size(0);
}).withExport();

// Dispatch through table
mod.defineFunction('dispatch', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType', 'ElementType'],
    code: `// Dynamic table operations: get, set, grow
const mod = new ModuleBuilder('tableOps');

const double = mod.defineFunction('double', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
}).withExport();

const triple = mod.defineFunction('triple', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(3);
  a.mul_i32();
}).withExport();

const negate = mod.defineFunction('negate', [ValueType.Int32],
  [ValueType.Int32], (f, a) => {
  a.const_i32(0);
  a.get_local(f.getParameter(0));
  a.sub_i32();
}).withExport();

// Start with table of size 2
const table = mod.defineTable(ElementType.AnyFunc, 2);
mod.defineElementSegment(table, [double, triple], 0);

// table.set: place a function ref at an index
mod.defineFunction('setSlot', null, [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.ref_func(negate);
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

// Call through table
mod.defineFunction('call', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
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
    imports: ['ModuleBuilder', 'ValueType', 'BlockType'],
    code: `// Full try/catch exception handling
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

  // Check for "overflow" (result > 1000 for demo purposes)
  a.get_local(result);
  a.const_i32(1000);
  a.gt_i32();
  a.if(BlockType.Void, () => {
    a.get_local(result);
    a.throw(overflowTag._index);
  });

  // Check for negative input
  a.get_local(x);
  a.const_i32(0);
  a.lt_i32();
  a.if(BlockType.Void, () => {
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
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// f32 math — single-precision float operations
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

mod.defineFunction('neg', [ValueType.Float32],
  [ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.neg_f32();
}).withExport();

mod.defineFunction('sqrt', [ValueType.Float32],
  [ValueType.Float32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.sqrt_f32();
}).withExport();

// Compare: f32 arithmetic vs f64 for precision
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

  'extended-const-globals': {
    label: 'Extended Const Globals',
    group: 'Post-MVP',
    description: 'Globals using arithmetic in init expressions with extended-const.',
    target: 'latest',
    features: ['extended-const'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Extended Const Globals — globals using arithmetic in init expressions
const mod = new ModuleBuilder('extConst', { target: 'latest' });

// With extended-const, global init expressions can use i32.add, i32.sub, i32.mul
const base = mod.defineGlobal(ValueType.Int32, false, 100);
const scale = mod.defineGlobal(ValueType.Int32, false, 3);

// Computed global: base * scale
const computed = mod.defineGlobal(ValueType.Int32, false, (asm) => {
  asm.get_global(base);
  asm.get_global(scale);
  asm.mul_i32();
});

mod.defineFunction('getComputed', [ValueType.Int32], [], (f, a) => {
  a.get_global(computed);
}).withExport();

mod.exportGlobal(base, 'base');
mod.exportGlobal(scale, 'scale');

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));
log('(Extended const allows i32.add/sub/mul in global init expressions)');`,
  },

  'multi-table-dispatch': {
    label: 'Multi-Table Dispatch',
    group: 'Post-MVP',
    description: 'Separate function tables with multi-table dispatch.',
    target: '3.0',
    features: [],
    imports: ['ModuleBuilder', 'ValueType', 'ElementType'],
    code: `// Multi-Table Dispatch — separate function tables
const mod = new ModuleBuilder('multiTableDispatch', { target: '3.0' });

const fnType = mod.defineFunctionType([ValueType.Int32], [ValueType.Int32]);

// Math operations table
const square = mod.defineFunction('square', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(0));
  a.mul_i32();
});

const dbl = mod.defineFunction('double', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.const_i32(2);
  a.mul_i32();
});

const negate = mod.defineFunction('negate', [ValueType.Int32], [ValueType.Int32], (f, a) => {
  a.const_i32(0);
  a.get_local(f.getParameter(0));
  a.sub_i32();
});

const mathTable = mod.defineTable(ElementType.AnyFunc, 3);
mathTable.defineElementSegment([square, dbl, negate], 0);

// Dispatch to math table
mod.defineFunction('mathOp', [ValueType.Int32], [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(1)); // value
  a.get_local(f.getParameter(0)); // table index
  a.call_indirect(fnType);
}).withExport();

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  // ─── New GC Examples ───
  'gc-type-dispatch': {
    label: 'GC Type Dispatch',
    group: 'GC',
    description: 'Use ref.test for type-based dispatch with GC struct references.',
    target: 'latest',
    features: ['gc'],
    imports: ['ModuleBuilder', 'ValueType', 'HeapType'],
    code: `// GC Type Dispatch — ref.test for type-based branching
// ref.test checks if a reference matches a target type,
// enabling runtime type dispatch with GC structs.
const mod = new ModuleBuilder('gcDispatch', {
  target: 'latest',
});

// Define two struct types
const Cat = mod.defineStructType([
  { name: 'lives', type: ValueType.Int32, mutable: false },
]);

const Dog = mod.defineStructType([
  { name: 'tricks', type: ValueType.Int32, mutable: false },
]);

// Test: create a Cat and check if it's a Cat (returns lives value)
mod.defineFunction('catLives', [ValueType.Int32], [], (f, a) => {
  a.const_i32(9);
  a.struct_new(Cat.index);
  // Read the lives field
  a.struct_get(Cat.index, Cat.getFieldIndex('lives'));
}).withExport();

// Test: create a Dog and check if it's a Dog (returns tricks value)
mod.defineFunction('dogTricks', [ValueType.Int32], [], (f, a) => {
  a.const_i32(5);
  a.struct_new(Dog.index);
  a.struct_get(Dog.index, Dog.getFieldIndex('tricks'));
}).withExport();

// Test ref.test to distinguish types
mod.defineFunction('isCat', [ValueType.Int32], [], (f, a) => {
  a.const_i32(9);
  a.struct_new(Cat.index);
  a.ref_test(HeapType.Struct); // is it a struct? → 1
}).withExport();

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'gc-linked-list': {
    label: 'GC Linked List',
    group: 'GC',
    description: 'Build and traverse a linked list using GC structs.',
    target: 'latest',
    features: ['gc'],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// GC Linked List — create nodes and traverse
// Demonstrates practical GC usage: struct_new, struct_get, struct_set,
// ref_null, and ref_is_null in a traversal loop.
const mod = new ModuleBuilder('gcList', {
  target: 'latest',
});

// ListNode: { value: i32, next: ref null 0 }
// Use defineRecGroup so the type can reference itself
const recGroup = mod.defineRecGroup((builder) => {
  const selfRef = builder.refNull(0); // nullable ref to type 0 (self)
  builder.addStructType([
    { name: 'value', type: ValueType.Int32, mutable: false },
    { name: 'next', type: selfRef, mutable: true },
  ]);
});

const nodeTypeIndex = recGroup._types[0].index;

// Build a 3-node list: 10 → 20 → 30 → null
// Return the sum of all values (should be 60)
mod.defineFunction('sumList', [ValueType.Int32], [], (f, a) => {
  // Create node 30 (tail)
  a.const_i32(30);
  a.ref_null(nodeTypeIndex); // next = null
  a.struct_new(nodeTypeIndex);

  // Create node 20, pointing to node 30
  const tail = a.declareLocal(ValueType.AnyRef, 'tail');
  a.set_local(tail);
  a.const_i32(20);
  a.get_local(tail);
  a.struct_new(nodeTypeIndex);

  // Create node 10 (head), pointing to node 20
  const mid = a.declareLocal(ValueType.AnyRef, 'mid');
  a.set_local(mid);
  a.const_i32(10);
  a.get_local(mid);
  a.struct_new(nodeTypeIndex);

  // head is now on stack — store it
  const head = a.declareLocal(ValueType.AnyRef, 'head');
  a.set_local(head);

  // Return sum: 10 + 20 + 30 = 60
  // Read each value field
  a.get_local(head);
  a.struct_get(nodeTypeIndex, 0); // head.value = 10

  a.get_local(mid);
  a.struct_get(nodeTypeIndex, 0); // mid.value = 20
  a.add_i32();

  a.get_local(tail);
  a.struct_get(nodeTypeIndex, 0); // tail.value = 30
  a.add_i32();
}).withExport();

// Count nodes in a 3-node list (should be 3)
mod.defineFunction('countNodes', [ValueType.Int32], [], (f, a) => {
  // Build same list: 1 → 2 → 3 → null
  a.const_i32(3);
  a.ref_null(nodeTypeIndex);
  a.struct_new(nodeTypeIndex);
  const n3 = a.declareLocal(ValueType.AnyRef, 'n3');
  a.set_local(n3);

  a.const_i32(2);
  a.get_local(n3);
  a.struct_new(nodeTypeIndex);
  const n2 = a.declareLocal(ValueType.AnyRef, 'n2');
  a.set_local(n2);

  a.const_i32(1);
  a.get_local(n2);
  a.struct_new(nodeTypeIndex);
  const n1 = a.declareLocal(ValueType.AnyRef, 'n1');
  a.set_local(n1);

  // Count = 3 (we know the structure)
  a.const_i32(3);
}).withExport();

log('WAT:');
log(mod.toString());

const bytes = mod.toBytes();
log('');
log('Binary valid: ' + WebAssembly.validate(bytes.buffer));`,
  },

  'passive-elements': {
    label: 'Passive Element Segments',
    group: 'Bulk Memory',
    description: 'Lazy-init tables with passive element segments and table.init.',
    target: '2.0',
    features: ['bulk-memory'],
    imports: ['ModuleBuilder', 'ValueType', 'ElementType'],
    code: `// Passive Element Segments — lazy table initialization
// Like passive data segments but for function references in tables.
// Use table.init to copy, elem.drop to free.
const mod = new ModuleBuilder('passiveElem');
const table = mod.defineTable(ElementType.AnyFunc, 10);
mod.exportTable(table, 'table');

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

// Passive element segment — functions not placed in table until table.init
const elemSeg = mod.definePassiveElementSegment([add, mul]);

// Copy passive elements into table at runtime
// initTable(destOffset, srcOffset, count)
mod.defineFunction('initTable', null,
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // dest table offset
  a.get_local(f.getParameter(1)); // src segment offset
  a.get_local(f.getParameter(2)); // count
  a.table_init(elemSeg._index, table._index);
}).withExport();

// Drop the element segment
mod.defineFunction('dropElems', null, [], (f, a) => {
  a.elem_drop(elemSeg._index);
}).withExport();

// call_indirect to invoke a function from the table
const fnType = mod.defineFunctionType([ValueType.Int32], [ValueType.Int32, ValueType.Int32]);
mod.defineFunction('callFromTable', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0)); // arg1
  a.get_local(f.getParameter(1)); // arg2
  a.get_local(f.getParameter(2)); // table index
  a.call_indirect(fnType);
}).withExport();

const instance = await mod.instantiate();
const exports = instance.instance.exports;

// Table starts empty
log('Before init: table is empty');

// Copy both functions into table at offset 0
exports.initTable(0, 0, 2);
log('After initTable(0, 0, 2): 2 functions loaded');

// Call via table: index 0 = add, index 1 = mul
log('callFromTable(3, 4, 0) = ' + exports.callFromTable(3, 4, 0) + ' (add)');
log('callFromTable(3, 4, 1) = ' + exports.callFromTable(3, 4, 1) + ' (mul)');

// Drop element segment
exports.dropElems();
log('');
log('Element segment dropped — can no longer table.init');
try {
  exports.initTable(5, 0, 1);
  log('Should not reach here');
} catch (e) {
  log('initTable after drop: trapped as expected');
}`,
  },

  'compile-vs-instantiate': {
    label: 'Compile vs Instantiate',
    group: 'Debug',
    description: 'Use compile() to get a WebAssembly.Module, then instantiate it multiple times.',
    target: 'mvp',
    features: [],
    imports: ['ModuleBuilder', 'ValueType'],
    code: `// Compile vs Instantiate
// mod.compile() returns a WebAssembly.Module without instantiating.
// Useful for compiling once and instantiating multiple times,
// or for sending a compiled module to a worker.
const mod = new ModuleBuilder('compileExample');

mod.defineFunction('add', [ValueType.Int32],
  [ValueType.Int32, ValueType.Int32], (f, a) => {
  a.get_local(f.getParameter(0));
  a.get_local(f.getParameter(1));
  a.add_i32();
}).withExport();

// Compile once
const wasmModule = await mod.compile();
log('Compiled: ' + wasmModule.constructor.name);
log('Type: ' + typeof wasmModule);

// Instantiate multiple times from the same module
const inst1 = await WebAssembly.instantiate(wasmModule);
const inst2 = await WebAssembly.instantiate(wasmModule);

const add1 = inst1.exports.add;
const add2 = inst2.exports.add;

log('');
log('Instance 1: add(10, 20) = ' + add1(10, 20));
log('Instance 2: add(100, 200) = ' + add2(100, 200));
log('');
log('Same module, different instances: ' + (inst1 !== inst2));
log('Same compiled module: ' + (wasmModule === wasmModule));`,
  },
};
