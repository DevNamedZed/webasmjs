// ---- AST Types ----

export type Expr =
  | { kind: 'number'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'ident'; name: string }
  | { kind: 'binary'; op: string; left: Expr; right: Expr }
  | { kind: 'unary'; op: string; expr: Expr }
  | { kind: 'index'; list: Expr; index: Expr }
  | { kind: 'field'; object: Expr; field: string }
  | { kind: 'call'; name: string; args: Expr[] }
  | { kind: 'len'; expr: Expr }
  | { kind: 'list'; elements: Expr[] }
  | { kind: 'object'; fields: { name: string; value: Expr }[] };

export type Stmt =
  | { kind: 'assign'; name: string; value: Expr }
  | { kind: 'print'; expr: Expr }
  | { kind: 'if'; cond: Expr; then: Stmt[]; else_?: Stmt[] }
  | { kind: 'while'; cond: Expr; body: Stmt[] }
  | { kind: 'for'; varName: string; iter: Expr; body: Stmt[] }
  | { kind: 'return'; expr: Expr }
  | { kind: 'funcdef'; name: string; params: string[]; body: Stmt[] };

// ---- Compiler Types ----

export type VarType = 'int' | 'list' | { kind: 'object'; fields: string[] };

export interface FuncInfo {
  params: string[];
  body: Stmt[];
  paramTypes: VarType[];
}

export interface TypeEnv {
  vars: Map<string, VarType>;
  objectShapes: Map<string, string[]>;
  funcs: Map<string, FuncInfo>;
  strings: string[];
  hasStrings: boolean;
}

export interface CompileResult {
  wat: string;
  bytes: Uint8Array;
  valid: boolean;
  run: (print: (value: number) => void, printStr: (str: string) => void) => Promise<void>;
}

// ---- Program Types ----

export interface Program {
  name: string;
  description: string;
  source: string;
}
