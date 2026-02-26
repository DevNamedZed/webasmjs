import { ValueType, BlockType, refNullType } from 'webasmjs';
import type { StructTypeBuilder, ArrayTypeBuilder } from 'webasmjs';
import type { Expr, Stmt, VarType } from '../types';
import { shapeKey, inferExprType } from './analyzer';

export interface EmitContext {
  printImport: unknown;
  printStrImport: unknown | null;
  stringOffsets: Map<string, { offset: number; length: number }>;
  intArray: ArrayTypeBuilder;
  structTypes: Map<string, { typeBuilder: StructTypeBuilder; fields: string[] }>;
  funcBuilders: Map<string, unknown>;
}

export type LocalEnv = Map<string, { local: unknown; type: VarType }>;

export function emitStmt(stmt: Stmt, asm: any, locals: LocalEnv, ctx: EmitContext): void {
  switch (stmt.kind) {
    case 'assign': {
      let info = locals.get(stmt.name);
      if (!info) {
        info = declareLocalForType(asm, stmt.name, inferExprType(stmt.value), ctx);
        locals.set(stmt.name, info);
      }
      emitExpr(stmt.value, asm, locals, ctx);
      asm.set_local(info.local);
      break;
    }

    case 'print':
      if (stmt.expr.kind === 'string') {
        const info = ctx.stringOffsets.get(stmt.expr.value)!;
        asm.const_i32(info.offset);
        asm.const_i32(info.length);
        asm.call(ctx.printStrImport);
      } else {
        emitExpr(stmt.expr, asm, locals, ctx);
        asm.call(ctx.printImport);
      }
      break;

    case 'if':
      emitExpr(stmt.cond, asm, locals, ctx);
      asm.if(BlockType.Void);
      for (const s of stmt.then) emitStmt(s, asm, locals, ctx);
      if (stmt.else_) {
        asm.else();
        for (const s of stmt.else_) emitStmt(s, asm, locals, ctx);
      }
      asm.end();
      break;

    case 'while': {
      const blockLabel = asm.block(BlockType.Void);
      const loopLabel = asm.loop(BlockType.Void);
      emitExpr(stmt.cond, asm, locals, ctx);
      asm.eqz_i32();
      asm.br_if(blockLabel);
      for (const s of stmt.body) emitStmt(s, asm, locals, ctx);
      asm.br(loopLabel);
      asm.end();
      asm.end();
      break;
    }

    case 'for': {
      const iterLocal = asm.declareLocal(refNullType(ctx.intArray.index), `__iter_${stmt.varName}`);
      const idxLocal = asm.declareLocal(ValueType.Int32, `__idx_${stmt.varName}`);

      if (!locals.has(stmt.varName)) {
        locals.set(stmt.varName, { local: asm.declareLocal(ValueType.Int32, stmt.varName), type: 'int' });
      }
      const varInfo = locals.get(stmt.varName)!;

      emitExpr(stmt.iter, asm, locals, ctx);
      asm.set_local(iterLocal);

      asm.const_i32(0);
      asm.set_local(idxLocal);

      const blockLabel = asm.block(BlockType.Void);
      const loopLabel = asm.loop(BlockType.Void);

      asm.get_local(idxLocal);
      asm.get_local(iterLocal);
      asm.array_len();
      asm.ge_i32_u();
      asm.br_if(blockLabel);

      asm.get_local(iterLocal);
      asm.get_local(idxLocal);
      asm.array_get(ctx.intArray.index);
      asm.set_local(varInfo.local);

      for (const s of stmt.body) emitStmt(s, asm, locals, ctx);

      asm.get_local(idxLocal);
      asm.const_i32(1);
      asm.add_i32();
      asm.set_local(idxLocal);

      asm.br(loopLabel);
      asm.end();
      asm.end();
      break;
    }

    case 'return':
      emitExpr(stmt.expr, asm, locals, ctx);
      asm.return();
      break;

    case 'funcdef':
      break;
  }
}

export function emitExpr(expr: Expr, asm: any, locals: LocalEnv, ctx: EmitContext): void {
  switch (expr.kind) {
    case 'number':
      asm.const_i32(expr.value);
      break;

    case 'string': {
      const info = ctx.stringOffsets.get(expr.value)!;
      asm.const_i32(info.offset);
      break;
    }

    case 'ident': {
      const info = locals.get(expr.name);
      if (!info) throw new Error(`Undefined variable: ${expr.name}`);
      asm.get_local(info.local);
      break;
    }

    case 'unary':
      if (expr.op === '-') {
        asm.const_i32(0);
        emitExpr(expr.expr, asm, locals, ctx);
        asm.sub_i32();
      } else if (expr.op === 'not') {
        emitExpr(expr.expr, asm, locals, ctx);
        asm.eqz_i32();
      }
      break;

    case 'binary':
      if (expr.op === 'and') {
        emitExpr(expr.left, asm, locals, ctx);
        asm.if(BlockType.Int32);
        emitExpr(expr.right, asm, locals, ctx);
        asm.else();
        asm.const_i32(0);
        asm.end();
      } else if (expr.op === 'or') {
        emitExpr(expr.left, asm, locals, ctx);
        asm.if(BlockType.Int32);
        asm.const_i32(1);
        asm.else();
        emitExpr(expr.right, asm, locals, ctx);
        asm.end();
      } else {
        emitExpr(expr.left, asm, locals, ctx);
        emitExpr(expr.right, asm, locals, ctx);
        emitBinaryOp(asm, expr.op);
      }
      break;

    case 'list':
      for (const el of expr.elements) emitExpr(el, asm, locals, ctx);
      asm.array_new_fixed(ctx.intArray.index, expr.elements.length);
      break;

    case 'index':
      emitExpr(expr.list, asm, locals, ctx);
      emitExpr(expr.index, asm, locals, ctx);
      asm.array_get(ctx.intArray.index);
      break;

    case 'len':
      emitExpr(expr.expr, asm, locals, ctx);
      asm.array_len();
      break;

    case 'object': {
      const key = shapeKey(expr.fields.map(f => f.name));
      const structInfo = ctx.structTypes.get(key)!;
      for (const field of expr.fields) emitExpr(field.value, asm, locals, ctx);
      asm.struct_new(structInfo.typeBuilder.index);
      break;
    }

    case 'field': {
      emitExpr(expr.object, asm, locals, ctx);
      const objType = resolveExprType(expr.object, locals);
      if (typeof objType !== 'object' || objType.kind !== 'object') {
        throw new Error(`Cannot access field '${expr.field}' on non-object`);
      }
      const key = shapeKey(objType.fields);
      const structInfo = ctx.structTypes.get(key)!;
      const fieldIndex = structInfo.fields.indexOf(expr.field);
      if (fieldIndex < 0) throw new Error(`Unknown field: ${expr.field}`);
      asm.struct_get(structInfo.typeBuilder.index, fieldIndex);
      break;
    }

    case 'call': {
      const fb = ctx.funcBuilders.get(expr.name);
      if (!fb) throw new Error(`Undefined function: ${expr.name}`);
      for (const arg of expr.args) emitExpr(arg, asm, locals, ctx);
      asm.call(fb);
      break;
    }
  }
}

function emitBinaryOp(asm: any, op: string): void {
  switch (op) {
    case '+': asm.add_i32(); break;
    case '-': asm.sub_i32(); break;
    case '*': asm.mul_i32(); break;
    case '/': asm.div_i32(); break;
    case '%': asm.rem_i32(); break;
    case '>': asm.gt_i32(); break;
    case '<': asm.lt_i32(); break;
    case '>=': asm.ge_i32(); break;
    case '<=': asm.le_i32(); break;
    case '==': asm.eq_i32(); break;
    case '!=': asm.ne_i32(); break;
    default: throw new Error(`Unknown operator: ${op}`);
  }
}

function resolveExprType(expr: Expr, locals: LocalEnv): VarType {
  switch (expr.kind) {
    case 'ident': return locals.get(expr.name)?.type ?? 'int';
    case 'list': return 'list';
    case 'object': return { kind: 'object', fields: expr.fields.map(f => f.name) };
    default: return 'int';
  }
}

function declareLocalForType(
  asm: any,
  name: string,
  type: VarType,
  ctx: EmitContext,
): { local: unknown; type: VarType } {
  if (type === 'int') {
    return { local: asm.declareLocal(ValueType.Int32, name), type };
  }
  if (type === 'list') {
    return { local: asm.declareLocal(refNullType(ctx.intArray.index), name), type };
  }
  const key = shapeKey(type.fields);
  const structInfo = ctx.structTypes.get(key)!;
  return { local: asm.declareLocal(refNullType(structInfo.typeBuilder.index), name), type };
}
