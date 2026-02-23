import { parseWat, ModuleBuilder, ValueType, TextModuleWriter, BinaryReader } from '../src/index';

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
