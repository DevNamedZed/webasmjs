import { BlockType, ModuleBuilder, ValueType, ElementType } from '../src/index';

test('Example - Factorial', async () => {
  const moduleBuilder = new ModuleBuilder('factorialExample');
  moduleBuilder
    .defineFunction('factorialRecursive', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      const numParam = f.getParameter(0);

      a.get_local(numParam);
      a.const_i32(0);
      a.eq_i32();
      a.if(BlockType.Void, () => {
        a.const_i32(1);
        a.return();
      });

      a.get_local(numParam);
      a.get_local(numParam);
      a.const_i32(1);
      a.sub_i32();
      a.call(f);
      a.mul_i32();
    })
    .withExport();

  moduleBuilder
    .defineFunction('factorialIterative', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      const numParam = f.getParameter(0);
      const index = a.declareLocal(ValueType.Int32, 'index');
      const result = a.declareLocal(ValueType.Int32, 'result');

      a.const_i32(1);
      a.set_local(result);

      a.const_i32(2);
      a.set_local(index);
      a.loop(BlockType.Void, (h) => {
        a.block(BlockType.Void, (b) => {
          a.get_local(index);
          a.get_local(numParam);
          a.gt_i32();
          a.br_if(b);

          a.get_local(result);
          a.get_local(index);
          a.mul_i32();
          a.set_local(result);

          a.const_i32(1);
          a.get_local(index);
          a.add_i32();
          a.set_local(index);
          a.br(h);
        });
      });

      a.get_local(result);
    })
    .withExport();

  const module = await moduleBuilder.instantiate();
  const factRec = module.instance.exports.factorialRecursive as CallableFunction;
  const factIter = module.instance.exports.factorialIterative as CallableFunction;

  expect(factRec(1)).toBe(1);
  expect(factRec(2)).toBe(2);
  expect(factRec(3)).toBe(6);
  expect(factRec(4)).toBe(24);
  expect(factRec(5)).toBe(120);

  expect(factIter(1)).toBe(1);
  expect(factIter(2)).toBe(2);
  expect(factIter(3)).toBe(6);
  expect(factIter(4)).toBe(24);
  expect(factIter(5)).toBe(120);
});

test('Example - Fibonacci', async () => {
  const moduleBuilder = new ModuleBuilder('fibExample');
  moduleBuilder
    .defineFunction('fib', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      const n = f.getParameter(0);
      const prev = a.declareLocal(ValueType.Int32, 'prev');
      const curr = a.declareLocal(ValueType.Int32, 'curr');
      const temp = a.declareLocal(ValueType.Int32, 'temp');
      const i = a.declareLocal(ValueType.Int32, 'i');

      // if (n <= 1) return n
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

          // temp = curr
          a.get_local(curr);
          a.set_local(temp);
          // curr = curr + prev
          a.get_local(curr);
          a.get_local(prev);
          a.add_i32();
          a.set_local(curr);
          // prev = temp
          a.get_local(temp);
          a.set_local(prev);
          // i++
          a.get_local(i);
          a.const_i32(1);
          a.add_i32();
          a.set_local(i);
          a.br(loopLabel);
        });
      });

      a.get_local(curr);
    })
    .withExport();

  const module = await moduleBuilder.instantiate();
  const fib = module.instance.exports.fib as CallableFunction;
  expect(fib(0)).toBe(0);
  expect(fib(1)).toBe(1);
  expect(fib(2)).toBe(1);
  expect(fib(3)).toBe(2);
  expect(fib(4)).toBe(3);
  expect(fib(5)).toBe(5);
  expect(fib(10)).toBe(55);
});

describe('Integration', () => {
  test('Fibonacci iterative', async () => {
    const mod = new ModuleBuilder('test', { disableVerification: true });

    const fib = mod.defineFunction(
      'fib',
      [ValueType.Int32],
      [ValueType.Int32]
    );
    const asm = fib.createEmitter();
    const n = fib.getParameter(0);
    const prev = asm.declareLocal(ValueType.Int32, 'prev');
    const curr = asm.declareLocal(ValueType.Int32, 'curr');
    const temp = asm.declareLocal(ValueType.Int32, 'temp');
    const i = asm.declareLocal(ValueType.Int32, 'i');

    // if n <= 1, return n; else compute iteratively
    asm.get_local(n);
    asm.const_i32(1);
    asm.le_i32();
    asm.if(BlockType.Int32);
    asm.get_local(n);
    asm.else();

    // prev = 0, curr = 1
    asm.const_i32(0);
    asm.set_local(prev);
    asm.const_i32(1);
    asm.set_local(curr);
    asm.const_i32(2);
    asm.set_local(i);

    // loop
    asm.block(BlockType.Void, (brk) => {
      asm.loop(BlockType.Void, (cont) => {
        // if i > n, break
        asm.get_local(i);
        asm.get_local(n);
        asm.gt_i32();
        asm.br_if(brk);

        // temp = curr
        asm.get_local(curr);
        asm.set_local(temp);
        // curr = prev + curr
        asm.get_local(prev);
        asm.get_local(curr);
        asm.add_i32();
        asm.set_local(curr);
        // prev = temp
        asm.get_local(temp);
        asm.set_local(prev);
        // i++
        asm.get_local(i);
        asm.const_i32(1);
        asm.add_i32();
        asm.set_local(i);

        asm.br(cont);
      });
    });

    asm.get_local(curr);
    asm.end(); // end else
    asm.end(); // end function

    fib.withExport();

    const instance = await mod.instantiate();
    const exports = instance.instance.exports as any;
    expect(exports.fib(0)).toBe(0);
    expect(exports.fib(1)).toBe(1);
    expect(exports.fib(2)).toBe(1);
    expect(exports.fib(3)).toBe(2);
    expect(exports.fib(4)).toBe(3);
    expect(exports.fib(5)).toBe(5);
    expect(exports.fib(6)).toBe(8);
    expect(exports.fib(7)).toBe(13);
    expect(exports.fib(10)).toBe(55);
    expect(exports.fib(20)).toBe(6765);
  });

  test('Mutual recursion - is_even / is_odd', async () => {
    const mod = new ModuleBuilder('test', { disableVerification: true });

    // Define both functions first (forward declarations)
    const isEven = mod.defineFunction(
      'is_even',
      [ValueType.Int32],
      [ValueType.Int32]
    );
    const isOdd = mod.defineFunction(
      'is_odd',
      [ValueType.Int32],
      [ValueType.Int32]
    );

    // is_even(n) = n == 0 ? 1 : is_odd(n - 1)
    {
      const a = isEven.createEmitter();
      const n = isEven.getParameter(0);
      a.get_local(n);
      a.eqz_i32();
      a.if(BlockType.Int32);
      a.const_i32(1); // true
      a.else();
      a.get_local(n);
      a.const_i32(1);
      a.sub_i32();
      a.call(isOdd);
      a.end(); // end if/else
      a.end(); // end function
    }

    // is_odd(n) = n == 0 ? 0 : is_even(n - 1)
    {
      const a = isOdd.createEmitter();
      const n = isOdd.getParameter(0);
      a.get_local(n);
      a.eqz_i32();
      a.if(BlockType.Int32);
      a.const_i32(0); // false
      a.else();
      a.get_local(n);
      a.const_i32(1);
      a.sub_i32();
      a.call(isEven);
      a.end(); // end if/else
      a.end(); // end function
    }

    isEven.withExport();
    isOdd.withExport();

    const instance = await mod.instantiate();
    const exports = instance.instance.exports as any;

    expect(exports.is_even(0)).toBe(1);
    expect(exports.is_even(1)).toBe(0);
    expect(exports.is_even(2)).toBe(1);
    expect(exports.is_even(3)).toBe(0);
    expect(exports.is_even(10)).toBe(1);

    expect(exports.is_odd(0)).toBe(0);
    expect(exports.is_odd(1)).toBe(1);
    expect(exports.is_odd(2)).toBe(0);
    expect(exports.is_odd(3)).toBe(1);
    expect(exports.is_odd(7)).toBe(1);
  });

  test('Table dispatch - indirect call through table', async () => {
    const mod = new ModuleBuilder('test');

    // Three different functions that return distinct values
    const add10 = mod.defineFunction('add10', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(0);
      a.const_i32(10);
      a.add_i32();
    });
    const mul2 = mod.defineFunction('mul2', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(0);
      a.const_i32(2);
      a.mul_i32();
    });
    const sub5 = mod.defineFunction('sub5', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(0);
      a.const_i32(5);
      a.sub_i32();
    });

    const table = mod.defineTable(ElementType.AnyFunc, 3, 3);
    table.defineTableSegment([add10, mul2, sub5], 0);

    const funcType = mod.defineFuncType([ValueType.Int32], [ValueType.Int32]);

    // dispatch(tableIndex, arg) -> result
    mod.defineFunction(
      'dispatch',
      [ValueType.Int32],
      [ValueType.Int32, ValueType.Int32],
      (f, a) => {
        // Push the argument (second param) for the indirect call
        a.get_local(f.getParameter(1));
        // Push the table index (first param)
        a.get_local(f.getParameter(0));
        a.call_indirect(funcType);
      }
    ).withExport();

    const instance = await mod.instantiate();
    const exports = instance.instance.exports as any;

    // dispatch(0, 5) -> add10(5) = 15
    expect(exports.dispatch(0, 5)).toBe(15);
    // dispatch(1, 5) -> mul2(5) = 10
    expect(exports.dispatch(1, 5)).toBe(10);
    // dispatch(2, 5) -> sub5(5) = 0
    expect(exports.dispatch(2, 5)).toBe(0);
    // dispatch(0, 100) -> add10(100) = 110
    expect(exports.dispatch(0, 100)).toBe(110);
    // dispatch(1, 7) -> mul2(7) = 14
    expect(exports.dispatch(1, 7)).toBe(14);
  });
});
