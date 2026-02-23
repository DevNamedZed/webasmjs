import { BlockType, ElementType, ModuleBuilder, ValueType } from '../src/index';

test('Call Function', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  const incFunction = moduleBuilder
    .defineFunction('inc', [ValueType.Int32], [ValueType.Int32])
    .withExport();
  const testFunction = moduleBuilder
    .defineFunction('testFunc', [ValueType.Int32], [ValueType.Int32])
    .withExport();

  incFunction.createEmitter((asm) => {
    asm.get_local(0);
    asm.const_i32(1);
    asm.add_i32();
  });
  testFunction.createEmitter((asm) => {
    asm.get_local(0);
    asm.call(incFunction);
  });

  const module = await moduleBuilder.instantiate();
  const fn = module.instance.exports.testFunc as CallableFunction;
  expect(fn(5)).toBe(6);
  expect(fn(12345)).toBe(12346);
});

test('Call Indirect Function', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  const func1 = moduleBuilder.defineFunction('func1', [ValueType.Int32], []);
  const func2 = moduleBuilder.defineFunction('func2', [ValueType.Int32], []);
  func1.createEmitter((asm) => {
    asm.const_i32(1);
  });
  func2.createEmitter((asm) => {
    asm.const_i32(2);
  });

  const testFunction = moduleBuilder
    .defineFunction('testFunc', [ValueType.Int32], [ValueType.Int32])
    .withExport();
  const parameterX = testFunction.getParameter(0);
  const funcType = moduleBuilder.defineFuncType([ValueType.Int32], []);
  const table = moduleBuilder.defineTable(ElementType.AnyFunc, 2, 2);
  table.defineTableSegment([func1, func2], 0);

  testFunction.createEmitter((asm) => {
    const funcAddress = asm.declareLocal(ValueType.Int32, 'x');
    asm.const_i32(0);
    asm.set_local(funcAddress);

    asm.get_local(parameterX);
    asm.const_i32(0);
    asm.ne_i32();
    asm.if(BlockType.Void, () => {
      asm.const_i32(1);
      asm.set_local(funcAddress);
    });

    asm.get_local(funcAddress);
    asm.call_indirect(funcType);
  });

  const module = await moduleBuilder.instantiate();
  const fn = module.instance.exports.testFunc as CallableFunction;
  expect(fn(0)).toBe(1);
  expect(fn(2)).toBe(2);
  expect(fn(3)).toBe(2);
});

test('Table - Export', async () => {
  const moduleBuilder = new ModuleBuilder('testModule');
  const func1 = moduleBuilder.defineFunction('func1', [ValueType.Int32], [], (f, a) => a.const_i32(1));
  const func4 = moduleBuilder.defineFunction('func4', [ValueType.Int32], [], (f, a) => a.const_i32(200));

  moduleBuilder
    .defineTable(ElementType.AnyFunc, 2, 2)
    .withExport('table1')
    .defineTableSegment([func1, func4], 0);

  const testFunction = moduleBuilder
    .defineFunction('testFunc', [ValueType.Int32], [ValueType.Int32])
    .withExport();
  testFunction.createEmitter((asm) => {
    asm.get_local(0);
    asm.call_indirect(moduleBuilder.defineFuncType([ValueType.Int32], []));
  });

  const module = await moduleBuilder.instantiate();
  const tbl = module.instance.exports.table1 as WebAssembly.Table;
  expect(tbl.get(0)!()).toBe(1);
  expect(tbl.get(1)!()).toBe(200);
});

test('Table - Import from JS API', async () => {
  const exportModuleBuilder = new ModuleBuilder('exportModule');
  exportModuleBuilder
    .defineFunction('func1', [ValueType.Int32], [], (f, a) => a.const_i32(10))
    .withExport();
  exportModuleBuilder
    .defineFunction('func2', [ValueType.Int32], [], (f, a) => a.const_i32(20))
    .withExport();
  const exportModule = await exportModuleBuilder.instantiate();

  const table = new WebAssembly.Table({
    initial: 2,
    maximum: 2,
    element: ElementType.AnyFunc.name as 'anyfunc',
  });
  table.set(0, exportModule.instance.exports.func1 as any);
  table.set(1, exportModule.instance.exports.func2 as any);

  const moduleBuilder = new ModuleBuilder('testModule');
  moduleBuilder.importTable('tableImport', 't1', ElementType.AnyFunc, 2, 2);
  moduleBuilder
    .defineFunction('testFunc', [ValueType.Int32], [ValueType.Int32], (f, a) => {
      a.get_local(0);
      a.call_indirect(moduleBuilder.defineFuncType([ValueType.Int32], []));
    })
    .withExport();

  const module = await moduleBuilder.instantiate({ tableImport: { t1: table } });
  const fn = module.instance.exports.testFunc as CallableFunction;
  expect(fn(0)).toBe(10);
  expect(fn(1)).toBe(20);
});
