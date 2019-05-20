# webasmjs 

Inspired by the Java ASM and .Net Reflection Emit libraries, this library allows for WebAssembly to be generated and executed at runtime.

## Example
Work in progress

```
    const moduleBuilder = new ModuleBuilder("testModule");
    const func1 = moduleBuilder.defineFunction("func1", [ValueType.Int32], []);
    const func2 = moduleBuilder.defineFunction("func2", [ValueType.Int32], []);
    func1.createAssemblyEmitter(
        asm => {
            asm.const_i32(1);
        });
    func2.createAssemblyEmitter(
        asm => {
            asm.const_i32(2);
        });        

    const testFunction = moduleBuilder.defineFunction(
        "testFunc", 
        [ValueType.Int32], 
        [ValueType.Int32], 
        { export: true })
    const parameterX = testFunction.getParameter(0)
        .withName("x");
    const funcType = moduleBuilder.defineFuncType([ValueType.Int32], []);
    const table = moduleBuilder.defineTable(ElementType.AnyFunc, 2, 2);
    table.defineTableSegment([func1, func2], 0);

    testFunction.createAssemblyEmitter(
        asm => {
            const funcAddress = asm.declareLocal(
                ValueType.Int32,
                "x");
            asm.const_i32(0);
            asm.set_local(funcAddress);

            asm.get_local(parameterX);
            asm.const_i32(0);
            asm.ne_i32();
            asm.if(BlockType.Void, label1 => {
                asm.const_i32(1);
                asm.set_local(funcAddress);    
            })

            asm.get_local(funcAddress);
            asm.call_indirect(funcType);
        });
        
    const module = await moduleBuilder.instantiate();

```

