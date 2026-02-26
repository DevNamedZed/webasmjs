import type { Expr, Stmt } from '../types';
import { tokenize, KEYWORDS } from './tokenizer';
import type { Token } from './tokenizer';

class Parser {
  private tokens: Token[];
  private pos: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  private peek(): Token { return this.tokens[this.pos]; }
  private advance(): Token { return this.tokens[this.pos++]; }

  private expect(type: string, value?: string): Token {
    const tok = this.advance();
    if (tok.type !== type || (value !== undefined && tok.value !== value)) {
      throw new Error(`Expected ${value ? `'${value}'` : type} but got '${tok.value}' at line ${tok.line}`);
    }
    return tok;
  }

  private match(type: string, value?: string): boolean {
    const tok = this.peek();
    if (tok.type === type && (value === undefined || tok.value === value)) {
      this.pos++;
      return true;
    }
    return false;
  }

  private skipNewlines(): void {
    while (this.peek().type === 'newline') this.pos++;
  }

  private expectNewline(): void {
    const tok = this.peek();
    if (tok.type === 'newline' || tok.type === 'eof') {
      if (tok.type === 'newline') this.pos++;
    } else {
      throw new Error(`Expected newline but got '${tok.value}' at line ${tok.line}`);
    }
  }

  // ---- Statements ----

  parseProgram(): Stmt[] {
    const stmts: Stmt[] = [];
    this.skipNewlines();
    while (this.peek().type !== 'eof') {
      stmts.push(this.parseStatement());
      this.skipNewlines();
    }
    return stmts;
  }

  private parseStatement(): Stmt {
    const tok = this.peek();

    if (tok.type === 'ident') {
      switch (tok.value) {
        case 'print': return this.parsePrint();
        case 'if': return this.parseIf();
        case 'while': return this.parseWhile();
        case 'for': return this.parseFor();
        case 'def': return this.parseFuncDef();
        case 'return': return this.parseReturn();
      }
    }
    return this.parseAssignment();
  }

  private parsePrint(): Stmt {
    this.expect('ident', 'print');
    const expr = this.parseExpr();
    this.expectNewline();
    return { kind: 'print', expr };
  }

  private parseAssignment(): Stmt {
    const name = this.expect('ident').value;
    this.expect('op', '=');
    const value = this.parseExpr();
    this.expectNewline();
    return { kind: 'assign', name, value };
  }

  private parseIf(): Stmt {
    this.expect('ident', 'if');
    const cond = this.parseExpr();
    this.expect('punct', ':');
    this.expectNewline();
    this.skipNewlines();
    const then = this.parseBlock();
    let else_: Stmt[] | undefined;
    if (this.peek().type === 'ident' && this.peek().value === 'else') {
      this.advance();
      this.expect('punct', ':');
      this.expectNewline();
      this.skipNewlines();
      else_ = this.parseBlock();
    }
    this.expect('ident', 'end');
    this.expectNewline();
    return { kind: 'if', cond, then, else_ };
  }

  private parseWhile(): Stmt {
    this.expect('ident', 'while');
    const cond = this.parseExpr();
    this.expect('punct', ':');
    this.expectNewline();
    this.skipNewlines();
    const body = this.parseBlock();
    this.expect('ident', 'end');
    this.expectNewline();
    return { kind: 'while', cond, body };
  }

  private parseFor(): Stmt {
    this.expect('ident', 'for');
    const varName = this.expect('ident').value;
    this.expect('ident', 'in');
    const iter = this.parseExpr();
    this.expect('punct', ':');
    this.expectNewline();
    this.skipNewlines();
    const body = this.parseBlock();
    this.expect('ident', 'end');
    this.expectNewline();
    return { kind: 'for', varName, iter, body };
  }

  private parseFuncDef(): Stmt {
    this.expect('ident', 'def');
    const name = this.expect('ident').value;
    this.expect('punct', '(');
    const params: string[] = [];
    if (!(this.peek().type === 'punct' && this.peek().value === ')')) {
      params.push(this.expect('ident').value);
      while (this.match('punct', ',')) {
        params.push(this.expect('ident').value);
      }
    }
    this.expect('punct', ')');
    this.expect('punct', ':');
    this.expectNewline();
    this.skipNewlines();
    const body = this.parseBlock();
    this.expect('ident', 'end');
    this.expectNewline();
    return { kind: 'funcdef', name, params, body };
  }

  private parseReturn(): Stmt {
    this.expect('ident', 'return');
    const expr = this.parseExpr();
    this.expectNewline();
    return { kind: 'return', expr };
  }

  private parseBlock(): Stmt[] {
    const stmts: Stmt[] = [];
    while (
      this.peek().type !== 'eof' &&
      !(this.peek().type === 'ident' && (this.peek().value === 'end' || this.peek().value === 'else'))
    ) {
      stmts.push(this.parseStatement());
      this.skipNewlines();
    }
    return stmts;
  }

  // ---- Expressions (precedence: or < and < not < compare < add/sub < mul/div/mod < unary < atom) ----

  private parseExpr(): Expr {
    return this.parseOr();
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.peek().type === 'ident' && this.peek().value === 'or') {
      this.advance();
      left = { kind: 'binary', op: 'or', left, right: this.parseAnd() };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseNot();
    while (this.peek().type === 'ident' && this.peek().value === 'and') {
      this.advance();
      left = { kind: 'binary', op: 'and', left, right: this.parseNot() };
    }
    return left;
  }

  private parseNot(): Expr {
    if (this.peek().type === 'ident' && this.peek().value === 'not') {
      this.advance();
      return { kind: 'unary', op: 'not', expr: this.parseNot() };
    }
    return this.parseCompare();
  }

  private parseCompare(): Expr {
    let left = this.parseAddSub();
    const tok = this.peek();
    if (tok.type === 'op' && ['>', '<', '==', '!=', '>=', '<='].includes(tok.value)) {
      this.advance();
      left = { kind: 'binary', op: tok.value, left, right: this.parseAddSub() };
    }
    return left;
  }

  private parseAddSub(): Expr {
    let left = this.parseMulDivMod();
    while (this.peek().type === 'op' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.advance().value;
      left = { kind: 'binary', op, left, right: this.parseMulDivMod() };
    }
    return left;
  }

  private parseMulDivMod(): Expr {
    let left = this.parseUnary();
    while (this.peek().type === 'op' && (this.peek().value === '*' || this.peek().value === '/' || this.peek().value === '%')) {
      const op = this.advance().value;
      left = { kind: 'binary', op, left, right: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.peek().type === 'op' && this.peek().value === '-') {
      this.advance();
      return { kind: 'unary', op: '-', expr: this.parseUnary() };
    }
    return this.parseAtom();
  }

  private parseAtom(): Expr {
    const tok = this.peek();

    if (tok.type === 'number') {
      this.advance();
      return { kind: 'number', value: parseInt(tok.value, 10) };
    }

    if (tok.type === 'string') {
      this.advance();
      return { kind: 'string', value: tok.value };
    }

    if (tok.type === 'punct' && tok.value === '(') {
      this.advance();
      const expr = this.parseExpr();
      this.expect('punct', ')');
      return expr;
    }

    if (tok.type === 'punct' && tok.value === '[') {
      this.advance();
      const elements: Expr[] = [];
      if (!(this.peek().type === 'punct' && this.peek().value === ']')) {
        elements.push(this.parseExpr());
        while (this.match('punct', ',')) elements.push(this.parseExpr());
      }
      this.expect('punct', ']');
      return { kind: 'list', elements };
    }

    if (tok.type === 'punct' && tok.value === '{') {
      this.advance();
      const fields: { name: string; value: Expr }[] = [];
      if (!(this.peek().type === 'punct' && this.peek().value === '}')) {
        fields.push(this.parseObjectField());
        while (this.match('punct', ',')) fields.push(this.parseObjectField());
      }
      this.expect('punct', '}');
      return { kind: 'object', fields };
    }

    if (tok.type === 'ident' && tok.value === 'len') {
      this.advance();
      this.expect('punct', '(');
      const expr = this.parseExpr();
      this.expect('punct', ')');
      return { kind: 'len', expr };
    }

    if (tok.type === 'ident' && !KEYWORDS.has(tok.value)) {
      this.advance();

      // Function call
      if (this.peek().type === 'punct' && this.peek().value === '(') {
        this.advance();
        const args: Expr[] = [];
        if (!(this.peek().type === 'punct' && this.peek().value === ')')) {
          args.push(this.parseExpr());
          while (this.match('punct', ',')) args.push(this.parseExpr());
        }
        this.expect('punct', ')');
        return { kind: 'call', name: tok.value, args };
      }

      // Variable with optional chained access
      let expr: Expr = { kind: 'ident', name: tok.value };
      while (true) {
        if (this.peek().type === 'punct' && this.peek().value === '[') {
          this.advance();
          const index = this.parseExpr();
          this.expect('punct', ']');
          expr = { kind: 'index', list: expr, index };
        } else if (this.peek().type === 'punct' && this.peek().value === '.') {
          this.advance();
          expr = { kind: 'field', object: expr, field: this.expect('ident').value };
        } else {
          break;
        }
      }
      return expr;
    }

    throw new Error(`Unexpected token '${tok.value}' at line ${tok.line}`);
  }

  private parseObjectField(): { name: string; value: Expr } {
    const name = this.expect('ident').value;
    this.expect('punct', ':');
    return { name, value: this.parseExpr() };
  }
}

export function parse(source: string): Stmt[] {
  const tokens = tokenize(source);
  return new Parser(tokens).parseProgram();
}
