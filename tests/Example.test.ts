import { BlockType, ModuleBuilder, ValueType } from '../src/index';

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
