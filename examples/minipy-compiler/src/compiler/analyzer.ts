import type { Expr, Stmt, VarType, FuncInfo, TypeEnv } from '../types';

export function shapeKey(fields: string[]): string {
  return fields.join(',');
}

export function inferExprType(expr: Expr): VarType {
  switch (expr.kind) {
    case 'number': case 'binary': case 'unary': case 'len':
    case 'index': case 'field': case 'call': case 'string':
      return 'int';
    case 'list': return 'list';
    case 'object': return { kind: 'object', fields: expr.fields.map(f => f.name) };
    case 'ident': return 'int';
  }
}

export function analyzeTypes(stmts: Stmt[]): TypeEnv {
  const vars = new Map<string, VarType>();
  const objectShapes = new Map<string, string[]>();
  const funcs = new Map<string, FuncInfo>();
  const stringSet = new Set<string>();
  const strings: string[] = [];

  function walkExpr(expr: Expr): void {
    switch (expr.kind) {
      case 'string':
        if (!stringSet.has(expr.value)) {
          stringSet.add(expr.value);
          strings.push(expr.value);
        }
        break;
      case 'binary': walkExpr(expr.left); walkExpr(expr.right); break;
      case 'unary': walkExpr(expr.expr); break;
      case 'index': walkExpr(expr.list); walkExpr(expr.index); break;
      case 'field': walkExpr(expr.object); break;
      case 'call': expr.args.forEach(walkExpr); break;
      case 'len': walkExpr(expr.expr); break;
      case 'list': expr.elements.forEach(walkExpr); break;
      case 'object': expr.fields.forEach(f => walkExpr(f.value)); break;
    }
  }

  function walkStmts(stmts: Stmt[]): void {
    for (const stmt of stmts) {
      switch (stmt.kind) {
        case 'assign':
          walkExpr(stmt.value);
          if (!vars.has(stmt.name)) {
            const type = inferExprType(stmt.value);
            vars.set(stmt.name, type);
            if (typeof type === 'object' && type.kind === 'object') {
              const key = shapeKey(type.fields);
              if (!objectShapes.has(key)) objectShapes.set(key, type.fields);
            }
          }
          break;
        case 'print': walkExpr(stmt.expr); break;
        case 'return': walkExpr(stmt.expr); break;
        case 'if':
          walkExpr(stmt.cond);
          walkStmts(stmt.then);
          if (stmt.else_) walkStmts(stmt.else_);
          break;
        case 'while':
          walkExpr(stmt.cond);
          walkStmts(stmt.body);
          break;
        case 'for':
          walkExpr(stmt.iter);
          walkStmts(stmt.body);
          break;
        case 'funcdef':
          funcs.set(stmt.name, { params: stmt.params, body: stmt.body, paramTypes: [] });
          walkStmts(stmt.body);
          break;
      }
    }
  }

  walkStmts(stmts);
  inferParamTypes(stmts, funcs, vars);

  return { vars, objectShapes, funcs, strings, hasStrings: strings.length > 0 };
}

function inferParamTypes(
  stmts: Stmt[],
  funcs: Map<string, FuncInfo>,
  vars: Map<string, VarType>,
): void {
  function walkExpr(expr: Expr): void {
    switch (expr.kind) {
      case 'call': {
        const fi = funcs.get(expr.name);
        if (fi && fi.paramTypes.length === 0) {
          fi.paramTypes = expr.args.map(arg => {
            if (arg.kind === 'ident') return vars.get(arg.name) ?? 'int';
            return inferExprType(arg);
          });
        }
        expr.args.forEach(walkExpr);
        break;
      }
      case 'binary': walkExpr(expr.left); walkExpr(expr.right); break;
      case 'unary': walkExpr(expr.expr); break;
      case 'index': walkExpr(expr.list); walkExpr(expr.index); break;
      case 'field': walkExpr(expr.object); break;
      case 'len': walkExpr(expr.expr); break;
      case 'list': expr.elements.forEach(walkExpr); break;
      case 'object': expr.fields.forEach(f => walkExpr(f.value)); break;
    }
  }

  function walkStmts(stmts: Stmt[]): void {
    for (const stmt of stmts) {
      switch (stmt.kind) {
        case 'assign': walkExpr(stmt.value); break;
        case 'print': walkExpr(stmt.expr); break;
        case 'return': walkExpr(stmt.expr); break;
        case 'if':
          walkExpr(stmt.cond);
          walkStmts(stmt.then);
          if (stmt.else_) walkStmts(stmt.else_);
          break;
        case 'while':
          walkExpr(stmt.cond);
          walkStmts(stmt.body);
          break;
        case 'for':
          walkExpr(stmt.iter);
          walkStmts(stmt.body);
          break;
        case 'funcdef':
          walkStmts(stmt.body);
          break;
      }
    }
  }

  walkStmts(stmts);

  for (const fi of funcs.values()) {
    if (fi.paramTypes.length === 0) {
      fi.paramTypes = fi.params.map(() => 'int' as VarType);
    }
  }
}
