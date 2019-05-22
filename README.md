# webasmjs 

Javascript library used to generate WASM

## Getting started

Install the npm package and follow example and documentation below

```
npm i webasmjs --save
```

## Documentation

### Module
To create a new module import the ModuleBuilder class and instantiate a new instance. The name of the module is required. Optional settings can be passed in through the second parameter.

```
import { BlockType, ElementType, ModuleBuilder, ValueType } from 'webasmjs'
const moduleBuilder = new ModuleBuilder('test', { generateNameSection: true, disableVerification: false });
```

The ModuleBuilder.toBytes is used to create the byte representation of the module, it returns a Uint8Array. This byte array can be passed into the WebAssembly.compile to compile the module.

```
const moduleBytes = moduleBuilder.toBytes();
const module = WebAssembly.instantiate(moduleBytes);
```

The ModuleBuilder.instantiate method creates a new instance of the module. 
```
const moduleBuilder = await new ModuleBuilder('test');
moduleBuilder.defineFunction("func1", [ValueType.Int32], [], (f, a) => a.const_i32(1)).withExport();

const module = await module.instantiate();
module.instance.exports.func1();
```

### Functions
The ModuleBuilder.defineFunction method is used to create a new function. It takes the name of the function, list of return values, and list of ValueTypes that represent the function parameters as arguments. 

A FunctionBuilder is returned that can be used to construct the body and configure the parameters of the function.

```
const moduleBuilder = await new ModuleBuilder('test');
const functionBuilder  = moduleBuilder.defineFunction("func1", [ValueType.Int32], [ValueType.Int32);
const paramX = functionBuilder.getParameter(0)
    .withName("address");
const asm = functionBuilder.createEmitter();

```

The ModuleBuilder.defineFunction method takes an optional callback parameter that can be used to build the function instead of using the return value. The callback takes the FunctionBuilder and a FunctionEmitter as parameters. When the callback is used the FunctionEmitter will automatically add an end as the last instruction.
```
const moduleBuilder = await new ModuleBuilder('test');
moduleBuilder.defineFunction("func1", [ValueType.Int32], [], 
    (f, a) => {
        const x = f.getParameter(0)
            .withName("x");
        a.get_local(x);
        a.const_i32(10);
        a.mul_i32();
    }).withExport();

const module = await module.instantiate();
module.instance.exports.func1();
```

The FunctionBuilder.createEmitter method creates a FunctionEmitter that is used to generate the body of a function. An optional callback function can be passed in, the callback takes the FunctionEmitter as a parameter. When the callback is used the FunctionEmitter will automatically add an end as the last instruction.
```
const moduleBuilder = await new ModuleBuilder('test');
const func1Builder  = moduleBuilder.defineFunction("func1", [ValueType.Int32], []);
const func1 = func1.createEmitter();
func1.const_i32(0);
func1.end();

const func2Builder  = moduleBuilder.defineFunction("func1", [ValueType.Int32], []);
func1.createEmitter(a => a.const_i32(0));

const module = await module.instantiate();
module.instance.exports.func1();
module.instance.exports.func2();
```

##### Function Exports
The ModuleBuilder.exportFunction or FunctionBuilder.withExport methods can be used to export a function. 

```
const moduleBuilder = new ModuleBuilder("testModule");
const func1 = moduleBuilder.defineFunction("func1", [ValueType.Int32], [], 
    (f, a) => { 
        a.const_i32(1)
    });
moduleBuilder.exportFunction(func1);

moduleBuilder.defineFunction("func2", [ValueType.Int32], [], 
    (f, a) => { 
        f.withExport();
        a.const_i32(1)
    });

const module = await moduleBuilder.instantiate();
module.instance.exports.func1();
module.instance.exports.func2();
```

##### Function Import
The ModuleBuilder.importFunction method is used to import a function. The function takes a module name, function name, return types, and parameters types as parameters. It returns an ImportBuilder, which can be used with call instruction.

```
const exportModuleBuilder = new ModuleBuilder("testModule");
exportModuleBuilder.defineFunction("zero", [ValueType.Int32], [], (f, a) => a.const_i32(0))
    .withExport();

const importModuleBuilder = new ModuleBuilder("other");
const functionImport = importModuleBuilder.importFunction("testModule", "zero", [ValueType.Int32], []);
importModuleBuilder.defineFunction("testFunc", [ValueType.Int32], [], (f, a) => {
    a.call(functionImport);
}).withExport()
    
const exportModule = await exportModuleBuilder.instantiate();
const importModule = await importModuleBuilder.instantiate({
    testModule: {
        zero: exportModule.instance.exports.zero
    }
});

const zero = importModule.instance.exports.testFunc();

```

### Globals

A global is a variable that is accessible throughout the module using the get_global and set_global opcodes. A module must either import or declare any global that it will use.

The ModuleBuilder.defineGlobal method is used to define a new global variable. This method takes the ValueType that represents the type stored in the global, flag used to indicate if the global is mutable, and an initial value for the global.

```
const moduleBuilder = new ModuleBuilder("testModule");
const globalX = moduleBuilder.defineGlobal(ValueType.Int32, false, 10);
const func1 = moduleBuilder.defineFunction("testFunc", [ValueType.Int32], [ValueType.Int32]);
const parameter = func1.getParameter(0);
func1.createEmitter(
    asm => {
        asm.get_global(globalX);
        asm.get_local(parameter)
        asm.mul_i32();
    });
```
 
##### Global Export
The ModuleBuilder.exportGlobal or GlobalBuilder.withExport methods can be used to export a global, a name must be provided. A mutable export cannot be exported.

```
const moduleBuilder = new ModuleBuilder("testModule");

const global1 = moduleBuilder.defineGlobal(ValueType.Int32, false, 555)
const export = moduleBuilder.exportGlobal('global1');

moduleBuilder.defineGlobal(ValueType.Int32, false, 124)
    .withExport('global2');

const module = await moduleBuilder.instantiate();
const global1 = module.instance.exports.global1;
const global2 = module.instance.exports.global2;
```

##### Global Import

The ModuleBuilder.importGlobal method can be used to import a global variable that is defined in another module.

```
const moduleBuilder = new ModuleBuilder("testModule");
const globalX = moduleBuilder.importGlobal("sourceModule", "someValue", ValueType.Int32, false);
moduleBuilder.defineFunction("func1", [ValueType.Int32], [], (f, a) =>{
    a.get_global(globalX);
}).withExport();

const module = await moduleBuilder.instantiate({
    sourceModule: {
        someValue: 123
    }
});

```

### Memory
Memory requirements can be declared using the ModubleBuilder.defineMemory method. The method takes an initial size and a maximum size, the sizes are in 64Kb pages.

```
const moduleBuilder = new ModuleBuilder("testModule");
moduleBuilder.defineFunction("writeMemory", [], [ValueType.Int32, ValueType.Int32], (f, a) =>{
        a.get_local(0);
        a.get_local(1);
        a.store8_i32(0, 0);
    })
    .withExport();
moduleBuilder.defineFunction("readMemory", [ValueType.Int32], [ValueType.Int32], (f, a) =>{
        a.get_local(0);
        a.load8_i32(0, 0);
    })
    .withExport();
moduleBuilder.defineMemory(1, 1);
``` 

##### Memory Export
The ModuleBuilder.exportMemory or MemoryBuilder.withMemory method can be used to export memory. 
``` 
const moduleBuilder = new ModuleBuilder("testModule");
moduleBuilder.defineFunction("writeMemory", [], [ValueType.Int32, ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.get_local(1);
    a.store8_i32(0, 0);
}).withExport();
moduleBuilder.defineMemory(1, 1).withExport('mem');

const module = await moduleBuilder.instantiate();
const writeMemory = module.instance.exports.writeMemory;
const mem = new Uint8Array(module.instance.exports.mem.buffer);
``` 
##### Memory Import
The ModuleBuilder.importMemory method can be used to import  memory that is defined in another module.
``` 
const moduleBuilder = new ModuleBuilder("testModule");
moduleBuilder.defineFunction("readMemory", [ValueType.Int32], [ValueType.Int32], (f, a) => {
    a.get_local(0);
    a.load8_i32(0, 0);
}).withExport();
moduleBuilder.importMemory('importModule', 'mem', 1, 1);

const module = await moduleBuilder.instantiate({
    importModule: {
        mem: new WebAssembly.Memory({ initial: 1, maximum: 1 })
    }
});
``` 

### Table

Tables can be created using the ModuleBuilder.defineTable method. The method takes a elementType, size, and maximum size. The only valid value for elementType is ElementType.AnyFunc.

The values in a table must be initialized. The ModuleBuilder.defineTableSegment or TableBuilder.defineSegment methods can be used to create an ElementSegmentBuilder. These methods take any array of FunctionBuilders and an offset value. 

```
const moduleBuilder = new ModuleBuilder("testModule");
const func1 = moduleBuilder.defineFunction("func1", [ValueType.Int32], [], (f, a) => a.const_i32(1));
const func2 = moduleBuilder.defineFunction("func2", [ValueType.Int32], [], (f, a) => a.const_i32(2));
const funcType = moduleBuilder.defineFuncType([ValueType.Int32], []);
const testFunction = moduleBuilder
    .defineFunction("testFunc", [ValueType.Int32], [], (f, a) => {
        const address = f.getParameter(0)
            .withName("address");
        
        asm.get_local(address);
        asm.call_indirect(funcType);
    }).withExport();

const table = moduleBuilder.defineTable(ElementType.AnyFunc, 1, 1);
table.defineTableSegment([func1, func2], 0);

const module = await moduleBuilder.instantiate();
module.instance.exports.testFunc(0)
module.instance.exports.testFunc(0)
```

##### Table Export

The ModuleBuilder.exportTable or TableBuilder.withExport methods can be used to export a table. 
```
const exportModuleBuilder = new ModuleBuilder("exportModule");
exportModuleBuilder.defineFunction("func1", [ValueType.Int32], [], 
    (f, a) => a.const_i32(10)).withExport();
exportModuleBuilder.defineFunction("func2", [ValueType.Int32], [], 
    (f, a) => a.const_i32(20)).withExport();        
const exportModule = await exportModuleBuilder.instantiate();
```
##### Table Import

The ModuleBuilder.importTable method is used to import a table that is defined in another module. The name, element type, initial size, and optional maximum size.

```
const table = new WebAssembly.Table({ initial: 2, maximum: 2, element: ElementType.AnyFunc.name });
table.set(0, exportModule.instance.exports.func1)
table.set(1, exportModule.instance.exports.func2)

const moduleBuilder = new ModuleBuilder("testModule");
moduleBuilder.importTable('tableImport', 't1', ElementType.AnyFunc, 2, 2)
moduleBuilder.defineFunction(
    "testFunc",
    [ValueType.Int32],
    [ValueType.Int32], 
    (f, a) => {
        const address = f.getParameter(0)
            .withName("address");
        a.get_local(address);
        a.call_indirect(moduleBuilder.defineFuncType([ValueType.Int32], []));
    })
    .withExport()

const module = await moduleBuilder.instantiate({
    tableImport: {
        t1: table
    }
});
```

### Data
A data section allows for user data to be mapped into a modules memory.

```
const moduleBuilder = new ModuleBuilder("testModule");
moduleBuilder.defineFunction("testFunc", [ValueType.Int32], [], (f, a) => {
        a.const_i32(0);
        a.load8_i32_u(0, 0);
    })
    .withExport();
moduleBuilder.defineData(new Uint8Array([55]), 0);
moduleBuilder.defineMemory(1, 1);
```
### Custom Sections
A custom section allows for any arbitrary data to stored along with the module. The ModuleBuilder.defineCustomSection can be used to define using the ModuleBuilder.defineCustomSection method.

#### Name Section
A name custom section will automatically be generated, to disable set the  disableNameGenerate to false when instansiating the ModuleBuilder.



### Emit

The FunctionEmitter and InitExpressionEmitter are used to generate function bodies by emitting WASM instructions. These classes expose a different method that map to the various WASM opcode. 




