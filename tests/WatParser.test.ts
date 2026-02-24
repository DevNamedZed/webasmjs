import { parseWat, ModuleBuilder, ValueType, TextModuleWriter, BinaryReader, ExternalKind } from '../src/index';

test('WAT Parser - simple add function', async () => {
  const wat = `
    (module $test
      (func $add (param i32) (param i32) (result i32)
        local.get 0
        local.get 1
        i32.add
      )
      (export "add" (func $add))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const add = instance.instance.exports.add as CallableFunction;
  expect(add(3, 4)).toBe(7);
  expect(add(100, 200)).toBe(300);
});

test('WAT Parser - constants', async () => {
  const wat = `
    (module $test
      (func $getConst (result i32)
        i32.const 42
      )
      (export "getConst" (func $getConst))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const getConst = instance.instance.exports.getConst as CallableFunction;
  expect(getConst()).toBe(42);
});

test('WAT Parser - locals', async () => {
  const wat = `
    (module $test
      (func $swap (param i32) (param i32) (result i32)
        (local i32)
        local.get 0
        local.set 2
        local.get 1
      )
      (export "swap" (func $swap))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const swap = instance.instance.exports.swap as CallableFunction;
  expect(swap(10, 20)).toBe(20);
});

test('WAT Parser - if/else block', async () => {
  const wat = `
    (module $test
      (func $abs (param i32) (result i32)
        local.get 0
        i32.const 0
        i32.lt_s
        if (result i32)
          i32.const 0
          local.get 0
          i32.sub
        else
          local.get 0
        end
      )
      (export "abs" (func $abs))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const abs = instance.instance.exports.abs as CallableFunction;
  expect(abs(5)).toBe(5);
  expect(abs(-5)).toBe(5);
  expect(abs(0)).toBe(0);
});

test('WAT Parser - loop with br_if', async () => {
  const wat = `
    (module $test
      (func $sum (param i32) (result i32)
        (local i32)
        (local i32)
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
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const sum = instance.instance.exports.sum as CallableFunction;
  expect(sum(0)).toBe(0);
  expect(sum(1)).toBe(1);
  expect(sum(5)).toBe(15);
  expect(sum(10)).toBe(55);
});

test('WAT Parser - memory and data', async () => {
  const wat = `
    (module $test
      (memory 1)
      (func $load (param i32) (result i32)
        local.get 0
        i32.load offset=0 align=4
      )
      (func $store (param i32) (param i32)
        local.get 0
        local.get 1
        i32.store offset=0 align=4
      )
      (export "load" (func $load))
      (export "store" (func $store))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const load = instance.instance.exports.load as CallableFunction;
  const store = instance.instance.exports.store as CallableFunction;
  store(0, 42);
  expect(load(0)).toBe(42);
});

test('WAT Parser - global', async () => {
  const wat = `
    (module $test
      (global $g (mut i32) (i32.const 0))
      (func $inc (result i32)
        global.get 0
        i32.const 1
        i32.add
        global.set 0
        global.get 0
      )
      (export "inc" (func $inc))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const inc = instance.instance.exports.inc as CallableFunction;
  expect(inc()).toBe(1);
  expect(inc()).toBe(2);
  expect(inc()).toBe(3);
});

test('WAT Parser - import function', async () => {
  const wat = `
    (module $test
      (import "env" "log" (func $log (param i32)))
      (func $main
        i32.const 42
        call $log
      )
      (export "main" (func $main))
    )
  `;

  let logged = 0;
  const mod = parseWat(wat);
  const instance = await mod.instantiate({
    env: { log: (v: number) => { logged = v; } },
  });
  const main = instance.instance.exports.main as CallableFunction;
  main();
  expect(logged).toBe(42);
});

test('WAT Parser - multiple functions calling each other', async () => {
  const wat = `
    (module $test
      (func $double (param i32) (result i32)
        local.get 0
        i32.const 2
        i32.mul
      )
      (func $quadruple (param i32) (result i32)
        local.get 0
        call $double
        call $double
      )
      (export "quadruple" (func $quadruple))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const quadruple = instance.instance.exports.quadruple as CallableFunction;
  expect(quadruple(5)).toBe(20);
  expect(quadruple(10)).toBe(40);
});

test('WAT Parser - table and element segment', async () => {
  const wat = `
    (module $test
      (type $int_to_int (func (param i32) (result i32)))
      (func $add1 (param i32) (result i32)
        local.get 0
        i32.const 1
        i32.add
      )
      (func $mul2 (param i32) (result i32)
        local.get 0
        i32.const 2
        i32.mul
      )
      (table 2 funcref)
      (elem (i32.const 0) func $add1 $mul2)
      (func $dispatch (param i32) (param i32) (result i32)
        local.get 1
        local.get 0
        call_indirect (type $int_to_int)
      )
      (export "dispatch" (func $dispatch))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const dispatch = instance.instance.exports.dispatch as CallableFunction;
  expect(dispatch(0, 10)).toBe(11);  // add1(10)
  expect(dispatch(1, 10)).toBe(20);  // mul2(10)
});

test('WAT Parser - empty module', async () => {
  const wat = `(module $empty)`;
  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  const valid = WebAssembly.validate(bytes.buffer as ArrayBuffer);
  expect(valid).toBe(true);
});

test('WAT Parser - comments are ignored', async () => {
  const wat = `
    (module $test
      ;; This is a line comment
      (func $f (result i32)
        (; This is a block comment ;)
        i32.const 99
      )
      (export "f" (func $f))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const f = instance.instance.exports.f as CallableFunction;
  expect(f()).toBe(99);
});

test('WAT Parser - export memory', async () => {
  const wat = `
    (module $test
      (memory 1)
      (export "mem" (memory 0))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  expect(instance.instance.exports.mem).toBeInstanceOf(WebAssembly.Memory);
});

test('WAT Parser - start function', async () => {
  const wat = `
    (module $test
      (global $g (mut i32) (i32.const 0))
      (func $init
        i32.const 42
        global.set 0
      )
      (func $getG (result i32)
        global.get 0
      )
      (start $init)
      (export "getG" (func $getG))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const getG = instance.instance.exports.getG as CallableFunction;
  expect(getG()).toBe(42);
});

test('WAT Parser - select opcode', async () => {
  const wat = `
    (module $test
      (func $sel (param i32) (result i32)
        i32.const 10
        i32.const 20
        local.get 0
        select
      )
      (export "sel" (func $sel))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const sel = instance.instance.exports.sel as CallableFunction;
  expect(sel(1)).toBe(10);
  expect(sel(0)).toBe(20);
});

test('WAT Parser - missing closing paren throws', () => {
  const wat = `(module $test (func $f (result i32) i32.const 42`;
  expect(() => parseWat(wat)).toThrow();
});

test('WAT Parser - unknown instruction throws', () => {
  const wat = `(module $test (func $f totally_bogus_instruction) (export "f" (func $f)))`;
  expect(() => parseWat(wat)).toThrow(/Unknown instruction/);
});

test('WAT Parser - undefined function reference throws', () => {
  const wat = `(module $test (export "f" (func $nonexistent)))`;
  expect(() => parseWat(wat)).toThrow();
});

test('WAT Parser - invalid value type throws', () => {
  const wat = `(module $test (func $f (param foobar)))`;
  expect(() => parseWat(wat)).toThrow(/Unknown value type/);
});

test('WAT Parser - param names preserved in name section', async () => {
  const wat = `
    (module $test
      (func $myFunc (param $x i32) (param $y i32) (result i32)
        local.get 0
        local.get 1
        i32.add
      )
      (export "myFunc" (func $myFunc))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  const reader = new BinaryReader(bytes);
  const info = reader.read();

  // Verify param names in the name section
  expect(info.nameSection).toBeDefined();
  expect(info.nameSection!.localNames).toBeDefined();
  const funcLocalNames = info.nameSection!.localNames!.get(0);
  expect(funcLocalNames).toBeDefined();
  expect(funcLocalNames!.get(0)).toBe('x');
  expect(funcLocalNames!.get(1)).toBe('y');

  // Also verify the function works correctly
  const instance = await mod.instantiate();
  const myFunc = instance.instance.exports.myFunc as CallableFunction;
  expect(myFunc(3, 4)).toBe(7);
});

test('WAT Parser - block comments are ignored', () => {
  const wat = `
    (module $test
      (; This is a block comment ;)
      (func $f (result i32)
        i32.const 77
      )
      (export "f" (func $f))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
});

test('WAT Parser - nested block comments are handled', () => {
  const wat = `
    (module $test
      (; outer (; inner ;) still outer ;)
      (func $f (result i32)
        i32.const 55
      )
      (export "f" (func $f))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
});

test('WAT Parser - block comment with nested block comment produces correct value', async () => {
  const wat = `
    (module $test
      (; a (; deeply ;) nested comment ;)
      (func $f (result i32)
        i32.const 123
      )
      (export "f" (func $f))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const f = instance.instance.exports.f as CallableFunction;
  expect(f()).toBe(123);
});

test('WAT Parser - import table', () => {
  const wat = `
    (module $test
      (import "env" "tbl" (table 1 10 anyfunc))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  // Verify the import was registered
  const tableImports = mod._imports.filter(
    (imp) => imp.externalKind === ExternalKind.Table
  );
  expect(tableImports.length).toBe(1);
  expect(tableImports[0].moduleName).toBe('env');
  expect(tableImports[0].fieldName).toBe('tbl');
});

test('WAT Parser - import table with no maximum', () => {
  const wat = `
    (module $test
      (import "env" "tbl" (table 1 funcref))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
});

test('WAT Parser - import memory with min and max', () => {
  const wat = `
    (module $test
      (import "env" "mem" (memory 1 2))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const memImports = mod._imports.filter(
    (imp) => imp.externalKind === ExternalKind.Memory
  );
  expect(memImports.length).toBe(1);
  expect(memImports[0].moduleName).toBe('env');
  expect(memImports[0].fieldName).toBe('mem');
});

test('WAT Parser - import memory with min only', () => {
  const wat = `
    (module $test
      (import "env" "mem" (memory 1))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
});

test('WAT Parser - import immutable global', () => {
  const wat = `
    (module $test
      (import "env" "g" (global i32))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const globalImports = mod._imports.filter(
    (imp) => imp.externalKind === ExternalKind.Global
  );
  expect(globalImports.length).toBe(1);
  expect(globalImports[0].moduleName).toBe('env');
  expect(globalImports[0].fieldName).toBe('g');
});

test('WAT Parser - import mutable global', () => {
  const wat = `
    (module $test
      (import "env" "g" (global (mut i32)))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const globalImports = mod._imports.filter(
    (imp) => imp.externalKind === ExternalKind.Global
  );
  expect(globalImports.length).toBe(1);
});

test('WAT Parser - import mutable global can be used by function', async () => {
  const wat = `
    (module $test
      (import "env" "g" (global (mut i32)))
      (func $read (result i32)
        global.get 0
      )
      (export "read" (func $read))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const g = new WebAssembly.Global({ value: 'i32', mutable: true }, 99);
  const instance = await mod.instantiate({ env: { g } });
  const read = instance.instance.exports.read as CallableFunction;
  expect(read()).toBe(99);
});

test('WAT Parser - export table', () => {
  const wat = `
    (module $test
      (table 2 funcref)
      (export "tbl" (table 0))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const tableExports = mod._exports.filter(
    (exp) => exp.externalKind === ExternalKind.Table
  );
  expect(tableExports.length).toBe(1);
  expect(tableExports[0].name).toBe('tbl');
});

test('WAT Parser - export table is accessible at runtime', async () => {
  const wat = `
    (module $test
      (table 4 funcref)
      (export "tbl" (table 0))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  expect(instance.instance.exports.tbl).toBeInstanceOf(WebAssembly.Table);
});

test('WAT Parser - export immutable global', () => {
  const wat = `
    (module $test
      (global i32 (i32.const 42))
      (export "g" (global 0))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const globalExports = mod._exports.filter(
    (exp) => exp.externalKind === ExternalKind.Global
  );
  expect(globalExports.length).toBe(1);
  expect(globalExports[0].name).toBe('g');
});

test('WAT Parser - export immutable global is accessible at runtime', async () => {
  const wat = `
    (module $test
      (global i32 (i32.const 42))
      (export "g" (global 0))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const g = instance.instance.exports.g as WebAssembly.Global;
  expect(g.value).toBe(42);
});

test('WAT Parser - export named global by $name', async () => {
  const wat = `
    (module $test
      (global $myGlobal i32 (i32.const 7))
      (export "g" (global $myGlobal))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const g = instance.instance.exports.g as WebAssembly.Global;
  expect(g.value).toBe(7);
});

test('WAT Parser - mutable global with get and set', async () => {
  const wat = `
    (module $test
      (global (mut i32) (i32.const 0))
      (func $inc (result i32)
        global.get 0
        i32.const 10
        i32.add
        global.set 0
        global.get 0
      )
      (export "inc" (func $inc))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const instance = await mod.instantiate();
  const inc = instance.instance.exports.inc as CallableFunction;
  expect(inc()).toBe(10);
  expect(inc()).toBe(20);
  expect(inc()).toBe(30);
});

test('WAT Parser - mutable global with $name', async () => {
  const wat = `
    (module $test
      (global $counter (mut i32) (i32.const 100))
      (func $get (result i32)
        global.get $counter
      )
      (export "get" (func $get))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const get = instance.instance.exports.get as CallableFunction;
  expect(get()).toBe(100);
});

test('WAT Parser - f64 immutable global', async () => {
  const wat = `
    (module $test
      (global f64 (f64.const 3.14))
      (export "pi" (global 0))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const instance = await mod.instantiate();
  const pi = instance.instance.exports.pi as WebAssembly.Global;
  expect(pi.value).toBeCloseTo(3.14, 10);
});

test('WAT Parser - f64 global read from function', async () => {
  const wat = `
    (module $test
      (global $pi f64 (f64.const 3.14159))
      (func $getPi (result f64)
        global.get $pi
      )
      (export "getPi" (func $getPi))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const getPi = instance.instance.exports.getPi as CallableFunction;
  expect(getPi()).toBeCloseTo(3.14159, 5);
});

test('WAT Parser - br_table with numeric depth targets', async () => {
  const wat = `
    (module $test
      (func $switch (param i32) (result i32)
        (local i32)
        block $case2
          block $case1
            block $case0
              local.get 0
              br_table 0 1 2
            end
            i32.const 100
            local.set 1
            br $case2
          end
          i32.const 200
          local.set 1
          br $case2
        end
        local.get 1
      )
      (export "switch" (func $switch))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const instance = await mod.instantiate();
  const sw = instance.instance.exports.switch as CallableFunction;
  // br_table 0 1 2: targets=[0,1], default=2
  // index 0 -> br 0 (case0 end), sets 100
  expect(sw(0)).toBe(100);
  // index 1 -> br 1 (case1 end), sets 200
  expect(sw(1)).toBe(200);
  // index 2+ -> br 2 (case2 end), local stays 0
  expect(sw(2)).toBe(0);
});

test('WAT Parser - f32 hex float literal', async () => {
  const wat = `
    (module $test
      (func $getVal (result f32)
        f32.const 0x1.8p+1
      )
      (export "getVal" (func $getVal))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const instance = await mod.instantiate();
  const getVal = instance.instance.exports.getVal as CallableFunction;
  // 0x1.8 = 1.5, p+1 means * 2^1 = 3.0
  expect(getVal()).toBeCloseTo(3.0, 5);
});

test('WAT Parser - f64 hex float literal', async () => {
  const wat = `
    (module $test
      (func $getVal (result f64)
        f64.const 0x1.0p+4
      )
      (export "getVal" (func $getVal))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const getVal = instance.instance.exports.getVal as CallableFunction;
  // 0x1.0 = 1.0, p+4 means * 2^4 = 16.0
  expect(getVal()).toBeCloseTo(16.0, 10);
});

test('WAT Parser - negative hex float literal', async () => {
  const wat = `
    (module $test
      (func $getVal (result f64)
        f64.const -0x1.4p+3
      )
      (export "getVal" (func $getVal))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const getVal = instance.instance.exports.getVal as CallableFunction;
  // 0x1.4 = 1.25, p+3 means * 2^3 = 10.0, negative = -10.0
  expect(getVal()).toBeCloseTo(-10.0, 10);
});

test('WAT Parser - named type used with call_indirect', async () => {
  const wat = `
    (module $test
      (type $sig (func (param i32) (result i32)))
      (func $double (param i32) (result i32)
        local.get 0
        i32.const 2
        i32.mul
      )
      (table 1 funcref)
      (elem (i32.const 0) func $double)
      (func $callIt (param i32) (result i32)
        local.get 0
        i32.const 0
        call_indirect (type $sig)
      )
      (export "callIt" (func $callIt))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const instance = await mod.instantiate();
  const callIt = instance.instance.exports.callIt as CallableFunction;
  expect(callIt(7)).toBe(14);
  expect(callIt(100)).toBe(200);
});

test('WAT Parser - named type defines type section entry', () => {
  const wat = `
    (module $test
      (type $sig (func (param i32) (result i32)))
    )
  `;

  const mod = parseWat(wat);
  expect(mod._types.length).toBeGreaterThanOrEqual(1);
  expect((mod._types[0] as any).parameterTypes).toEqual([ValueType.Int32]);
  expect((mod._types[0] as any).returnTypes).toEqual([ValueType.Int32]);
});

test('WAT Parser - multiple named types', () => {
  const wat = `
    (module $test
      (type $void_void (func))
      (type $i32_i32 (func (param i32) (result i32)))
      (type $two_params (func (param i32) (param i32) (result i32)))
    )
  `;

  const mod = parseWat(wat);
  expect(mod._types.length).toBe(3);
  expect((mod._types[0] as any).parameterTypes).toEqual([]);
  expect((mod._types[0] as any).returnTypes).toEqual([]);
  expect((mod._types[1] as any).parameterTypes).toEqual([ValueType.Int32]);
  expect((mod._types[1] as any).returnTypes).toEqual([ValueType.Int32]);
  expect((mod._types[2] as any).parameterTypes).toEqual([ValueType.Int32, ValueType.Int32]);
  expect((mod._types[2] as any).returnTypes).toEqual([ValueType.Int32]);
});

test('WAT Parser - memory with initial and maximum', () => {
  const wat = `
    (module $test
      (memory 1 10)
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  expect(mod._memories.length).toBe(1);
});

test('WAT Parser - memory with max can be instantiated', async () => {
  const wat = `
    (module $test
      (memory 1 10)
      (export "mem" (memory 0))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const mem = instance.instance.exports.mem as WebAssembly.Memory;
  expect(mem).toBeInstanceOf(WebAssembly.Memory);
  expect(mem.buffer.byteLength).toBe(65536); // 1 page = 64KB
});

test('WAT Parser - data segment with escape sequences', async () => {
  const wat = `
    (module $test
      (memory 1)
      (data (i32.const 0) "hello\\00\\n\\t")
      (func $load (param i32) (result i32)
        local.get 0
        i32.load8_u
      )
      (export "load" (func $load))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const instance = await mod.instantiate();
  const load = instance.instance.exports.load as CallableFunction;

  // 'h' = 104, 'e' = 101, 'l' = 108, 'l' = 108, 'o' = 111
  expect(load(0)).toBe(104); // h
  expect(load(1)).toBe(101); // e
  expect(load(2)).toBe(108); // l
  expect(load(3)).toBe(108); // l
  expect(load(4)).toBe(111); // o
  expect(load(5)).toBe(0);   // \00
  expect(load(6)).toBe(10);  // \n
  expect(load(7)).toBe(9);   // \t
});

test('WAT Parser - data segment with hex escape bytes', async () => {
  const wat = `
    (module $test
      (memory 1)
      (data (i32.const 0) "\\41\\42\\43")
      (func $load (param i32) (result i32)
        local.get 0
        i32.load8_u
      )
      (export "load" (func $load))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const load = instance.instance.exports.load as CallableFunction;

  // \41 = 'A' (65), \42 = 'B' (66), \43 = 'C' (67)
  expect(load(0)).toBe(65);
  expect(load(1)).toBe(66);
  expect(load(2)).toBe(67);
});

test('WAT Parser - multiple data segments', async () => {
  const wat = `
    (module $test
      (memory 1)
      (data (i32.const 0) "abc")
      (data (i32.const 100) "xyz")
      (func $load (param i32) (result i32)
        local.get 0
        i32.load8_u
      )
      (export "load" (func $load))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  // Verify two data segments were created
  expect(mod._data.length).toBe(2);

  const instance = await mod.instantiate();
  const load = instance.instance.exports.load as CallableFunction;

  // First segment at offset 0
  expect(load(0)).toBe(97);   // 'a'
  expect(load(1)).toBe(98);   // 'b'
  expect(load(2)).toBe(99);   // 'c'

  // Second segment at offset 100
  expect(load(100)).toBe(120); // 'x'
  expect(load(101)).toBe(121); // 'y'
  expect(load(102)).toBe(122); // 'z'
});

test('WAT Parser - multiple data segments with different offsets', async () => {
  const wat = `
    (module $test
      (memory 1)
      (data (i32.const 0) "first")
      (data (i32.const 10) "second")
      (data (i32.const 20) "third")
      (func $load (param i32) (result i32)
        local.get 0
        i32.load8_u
      )
      (export "load" (func $load))
    )
  `;

  const mod = parseWat(wat);
  expect(mod._data.length).toBe(3);

  const instance = await mod.instantiate();
  const load = instance.instance.exports.load as CallableFunction;

  // "first" at offset 0
  expect(load(0)).toBe(102);  // 'f'
  // "second" at offset 10
  expect(load(10)).toBe(115); // 's'
  // "third" at offset 20
  expect(load(20)).toBe(116); // 't'
});

test('WAT Parser - i64 immutable global', () => {
  const wat = `
    (module $test
      (global i64 (i64.const 42))
      (export "g" (global 0))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  expect(mod._globals.length).toBe(1);
  expect(mod._globals[0].valueType).toBe(ValueType.Int64);
});

test('WAT Parser - i64 global read from function', async () => {
  const wat = `
    (module $test
      (global i64 (i64.const 42))
      (func $getG (result i64)
        global.get 0
      )
      (export "getG" (func $getG))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const getG = instance.instance.exports.getG as CallableFunction;
  expect(getG()).toBe(42n);
});

test('WAT Parser - i64 mutable global', async () => {
  const wat = `
    (module $test
      (global (mut i64) (i64.const 0))
      (func $setAndGet (param i64) (result i64)
        local.get 0
        global.set 0
        global.get 0
      )
      (export "setAndGet" (func $setAndGet))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const instance = await mod.instantiate();
  const setAndGet = instance.instance.exports.setAndGet as CallableFunction;
  expect(setAndGet(99n)).toBe(99n);
});

test('WAT Parser - unknown section is skipped without error', () => {
  const wat = `
    (module $test
      (custom "this is a custom section that should be skipped")
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
});

test('WAT Parser - unknown section among valid sections', async () => {
  const wat = `
    (module $test
      (custom "metadata" "some value")
      (func $f (result i32)
        i32.const 42
      )
      (export "f" (func $f))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const instance = await mod.instantiate();
  const f = instance.instance.exports.f as CallableFunction;
  expect(f()).toBe(42);
});

test('WAT Parser - multiple unknown sections are skipped', () => {
  const wat = `
    (module $test
      (custom "one")
      (custom "two" (nested "thing"))
      (custom "three")
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
});

test('WAT Parser - f32 global', async () => {
  const wat = `
    (module $test
      (global f32 (f32.const 2.5))
      (export "g" (global 0))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const instance = await mod.instantiate();
  const g = instance.instance.exports.g as WebAssembly.Global;
  expect(g.value).toBeCloseTo(2.5, 5);
});

test('WAT Parser - import global f64 immutable', () => {
  const wat = `
    (module $test
      (import "env" "pi" (global f64))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  const globalImports = mod._imports.filter(
    (imp) => imp.externalKind === ExternalKind.Global
  );
  expect(globalImports.length).toBe(1);
});

test('WAT Parser - import global mutable i64', () => {
  const wat = `
    (module $test
      (import "env" "counter" (global (mut i64)))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
});

test('WAT Parser - combined imports of different kinds', () => {
  const wat = `
    (module $test
      (import "env" "log" (func $log (param i32)))
      (import "env" "mem" (memory 1 4))
      (import "env" "tbl" (table 1 anyfunc))
      (import "env" "g" (global i32))
      (import "env" "mg" (global (mut i32)))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  expect(mod._imports.length).toBe(5);
  expect(mod._imports.filter((i) => i.externalKind === ExternalKind.Function).length).toBe(1);
  expect(mod._imports.filter((i) => i.externalKind === ExternalKind.Memory).length).toBe(1);
  expect(mod._imports.filter((i) => i.externalKind === ExternalKind.Table).length).toBe(1);
  expect(mod._imports.filter((i) => i.externalKind === ExternalKind.Global).length).toBe(2);
});

test('WAT Parser - block comment inside a function body', async () => {
  const wat = `
    (module $test
      (func $f (result i32)
        (; This comment is inside the function body ;)
        i32.const 1
        i32.const 2
        (; Another block comment ;)
        i32.add
      )
      (export "f" (func $f))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const f = instance.instance.exports.f as CallableFunction;
  expect(f()).toBe(3);
});

test('WAT Parser - multiple globals of different types', async () => {
  const wat = `
    (module $test
      (global $gi i32 (i32.const 10))
      (global $gl i64 (i64.const 20))
      (global $gf f32 (f32.const 1.5))
      (global $gd f64 (f64.const 2.5))
      (func $getI32 (result i32)
        global.get $gi
      )
      (func $getI64 (result i64)
        global.get $gl
      )
      (func $getF32 (result f32)
        global.get $gf
      )
      (func $getF64 (result f64)
        global.get $gd
      )
      (export "getI32" (func $getI32))
      (export "getI64" (func $getI64))
      (export "getF32" (func $getF32))
      (export "getF64" (func $getF64))
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);

  expect(mod._globals.length).toBe(4);
  expect(mod._globals[0].valueType).toBe(ValueType.Int32);
  expect(mod._globals[1].valueType).toBe(ValueType.Int64);
  expect(mod._globals[2].valueType).toBe(ValueType.Float32);
  expect(mod._globals[3].valueType).toBe(ValueType.Float64);

  const instance = await mod.instantiate();
  const getI32 = instance.instance.exports.getI32 as CallableFunction;
  const getI64 = instance.instance.exports.getI64 as CallableFunction;
  const getF32 = instance.instance.exports.getF32 as CallableFunction;
  const getF64 = instance.instance.exports.getF64 as CallableFunction;

  expect(getI32()).toBe(10);
  expect(getI64()).toBe(20n);
  expect(getF32()).toBeCloseTo(1.5, 5);
  expect(getF64()).toBeCloseTo(2.5, 10);
});

test('WAT Parser - named type with func using type index', async () => {
  const wat = `
    (module $test
      (type $binop (func (param i32) (param i32) (result i32)))
      (func $add (type 0)
        local.get 0
        local.get 1
        i32.add
      )
      (export "add" (func $add))
    )
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const add = instance.instance.exports.add as CallableFunction;
  expect(add(3, 4)).toBe(7);
});

test('WAT Parser - data segment with empty string', () => {
  const wat = `
    (module $test
      (memory 1)
      (data (i32.const 0) "")
    )
  `;

  const mod = parseWat(wat);
  const bytes = mod.toBytes();
  expect(WebAssembly.validate(bytes.buffer as ArrayBuffer)).toBe(true);
});

test('WAT Parser - memory with max and exported with store/load', async () => {
  const wat = `
    (module $test
      (memory 2 8)
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
  `;

  const mod = parseWat(wat);
  const instance = await mod.instantiate();
  const store = instance.instance.exports.store as CallableFunction;
  const load = instance.instance.exports.load as CallableFunction;
  const mem = instance.instance.exports.mem as WebAssembly.Memory;

  // 2 pages = 128KB
  expect(mem.buffer.byteLength).toBe(131072);

  store(0, 12345);
  expect(load(0)).toBe(12345);
});
