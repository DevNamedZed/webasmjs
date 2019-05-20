# webasmjs 

Inspired by the Java ASM and .Net Reflection Emit libraries, this library allows for WebAssembly to be generated and executed at runtime.

## Example

```
    const moduleBuilder = new ModuleBuilder("factorialExample");
    moduleBuilder.defineFunction(
        "factorial", 
        [ValueType.Int32], 
        [ValueType.Int32], 
        { export: true },
        (f, a) => {
            const numParam = f.getParameter(0);
    
            // if (num === 0) { return 1; }
            a.get_local(numParam);
            a.const_i32(0);
            a.eq_i32();
            a.if(BlockType.Void, () => { 
                a.const_i32(1); 
                a.return();
            });
    
            // return num * factorialRecursive( num - 1 );
            a.get_local(numParam);
            a.get_local(numParam);
            a.const_i32(1);
            a.sub_i32();
            a.call(f);
            a.mul_i32();        
        });
```

Blocks