import { ModuleBuilder, ValueType, BlockType } from '../src'

const moduleBuilder = new ModuleBuilder("factorialExample");
moduleBuilder.defineFunction(
    "factorialRecursive", 
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

moduleBuilder.defineFunction(
    "factorialIterative", 
    [ValueType.Int32], 
    [ValueType.Int32], 
    { export: true },
    (f, a) => {
        const numParam = f.getParameter(0);
        const index = a.declareLocal(ValueType.Int32, "index");
        const result = a.declareLocal(ValueType.Int32, "result");

        a.const_i32(1);
        a.set_local(result);

        a.const_i32(2);
        a.set_local(index);

        a.loop(h => {
            a.block(b => {
                // if (index > numParam) { break; } 
                a.get_local(index);
                a.get_local(numParam);
                a.gt_i32();
                a.br_if(b);

                // result *= index;
                a.get_local(result);
                a.get_local(index);
                a.mul_i32();
                a.set_local(result);

                // index++; continue;
                a.const_i32(1);
                a.get_local(index);
                a.add_i32();
                a.set_local(index)
                a.br(h);    
            })
        });

        a.get_local(result);
    });

const module = moduleBuilder.instantiate();
console.log(`factorialRecursive = ${module.factorialRecursive(3)}`)
console.log(`factorialIterative = ${module.factorialIterative(5)}`)

