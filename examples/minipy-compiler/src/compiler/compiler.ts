import { ModuleBuilder, ValueType, BlockType, refNullType } from 'webasmjs';
import type { StructTypeBuilder } from 'webasmjs';
import type { Stmt, VarType, CompileResult } from '../types';
import { analyzeTypes, shapeKey } from './analyzer';
import { emitStmt } from './emitter';
import type { EmitContext, LocalEnv } from './emitter';

export function compile(stmts: Stmt[], name: string = 'minipy'): CompileResult {
  const env = analyzeTypes(stmts);

  // ---- Module setup ----
  const mod = new ModuleBuilder(name, { target: 'latest', disableVerification: true });

  // Imports
  const printImport = mod.importFunction('env', 'print', null, [ValueType.Int32]);
  const printStrImport = env.hasStrings
    ? mod.importFunction('env', 'print_str', null, [ValueType.Int32, ValueType.Int32])
    : null;

  // Linear memory for strings
  const memory = env.hasStrings ? mod.defineMemory(1) : null;
  if (memory) mod.exportMemory(memory, 'memory');

  // String data segments
  const stringOffsets = new Map<string, { offset: number; length: number }>();
  let dataOffset = 0;
  for (const str of env.strings) {
    const encoded = new TextEncoder().encode(str);
    mod.defineData(encoded, dataOffset);
    stringOffsets.set(str, { offset: dataOffset, length: encoded.length });
    dataOffset += encoded.length;
  }

  // GC types
  const intArray = mod.defineArrayType(ValueType.Int32, false);
  const structTypes = new Map<string, { typeBuilder: StructTypeBuilder; fields: string[] }>();
  for (const [key, fields] of env.objectShapes) {
    const typeBuilder = mod.defineStructType(
      fields.map(fieldName => ({ name: fieldName, type: ValueType.Int32, mutable: false }))
    );
    structTypes.set(key, { typeBuilder, fields });
  }

  // Shared context for emitters
  const funcBuilders = new Map<string, unknown>();
  const ctx: EmitContext = {
    printImport, printStrImport, stringOffsets, intArray, structTypes, funcBuilders,
  };

  // ---- User-defined functions ----
  for (const [funcName, funcInfo] of env.funcs) {
    const fb = mod.defineFunction(
      funcName,
      [ValueType.Int32],
      funcInfo.paramTypes.map(varTypeToValueType),
      (_f, asm) => {
        const locals: LocalEnv = new Map();
        for (let i = 0; i < funcInfo.params.length; i++) {
          locals.set(funcInfo.params[i], { local: _f.parameters[i], type: funcInfo.paramTypes[i] });
        }
        for (const stmt of funcInfo.body) {
          emitStmt(stmt, asm, locals, ctx);
        }
        asm.const_i32(0);
      }
    );
    funcBuilders.set(funcName, fb);
  }

  // ---- Main function ----
  mod.defineFunction('main', null, [], (_f, asm) => {
    const locals: LocalEnv = new Map();

    for (const [varName, varType] of env.vars) {
      locals.set(varName, {
        local: asm.declareLocal(varTypeToValueType(varType), varName),
        type: varType,
      });
    }

    for (const stmt of stmts) {
      if (stmt.kind !== 'funcdef') {
        emitStmt(stmt, asm, locals, ctx);
      }
    }
  }).withExport();

  // ---- Output ----
  const wat = mod.toString();
  const bytes = mod.toBytes();
  const valid = WebAssembly.validate(bytes.buffer as ArrayBuffer);

  return {
    wat,
    bytes,
    valid,
    async run(print: (value: number) => void, printStr: (str: string) => void) {
      const imports: Record<string, Record<string, unknown>> = {
        env: {
          print,
          ...(printStrImport ? {
            print_str: (offset: number, len: number) => {
              const mem = result.instance.exports.memory as WebAssembly.Memory;
              const str = new TextDecoder().decode(new Uint8Array(mem.buffer, offset, len));
              printStr(str);
            },
          } : {}),
        },
      };
      const result = await WebAssembly.instantiate(bytes.buffer as ArrayBuffer, imports);
      (result.instance.exports.main as Function)();
    },
  };

  function varTypeToValueType(vt: VarType): any {
    if (vt === 'int') return ValueType.Int32;
    if (vt === 'list') return refNullType(intArray.index);
    if (typeof vt === 'object' && vt.kind === 'object') {
      const key = shapeKey(vt.fields);
      return refNullType(structTypes.get(key)!.typeBuilder.index);
    }
    return ValueType.Int32;
  }
}
