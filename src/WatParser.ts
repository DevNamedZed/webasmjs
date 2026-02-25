import ModuleBuilder from './ModuleBuilder';
import OpCodes from './OpCodes';
import {
  ValueType,
  ValueTypeDescriptor,
  BlockType,
  BlockTypeDescriptor,
  ElementType,
  ExternalKind,
  HeapType,
  HeapTypeRef,
  OpCodeDef,
  ModuleBuilderOptions,
  refType,
  refNullType,
} from './types';
import FunctionBuilder from './FunctionBuilder';
import FunctionEmitter from './FunctionEmitter';
import GlobalBuilder from './GlobalBuilder';
import ImportBuilder from './ImportBuilder';
import LabelBuilder from './LabelBuilder';
import RecGroupBuilder from './RecGroupBuilder';

// --- Tokenizer ---

enum TokenType {
  LeftParen = 'LeftParen',
  RightParen = 'RightParen',
  String = 'String',
  Number = 'Number',
  Keyword = 'Keyword',
  Id = 'Id',
  EOF = 'EOF',
}

interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  function advance(n: number = 1): void {
    for (let i = 0; i < n; i++) {
      if (source[pos] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
      pos++;
    }
  }

  while (pos < source.length) {
    const ch = source[pos];

    // Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      advance();
      continue;
    }

    // Line comment
    if (ch === ';' && source[pos + 1] === ';') {
      while (pos < source.length && source[pos] !== '\n') advance();
      continue;
    }

    // Block comment (;...;) - skip entirely
    if (ch === '(' && source[pos + 1] === ';') {
      advance(2);
      let depth = 1;
      while (pos < source.length && depth > 0) {
        if (source[pos] === '(' && source[pos + 1] === ';') {
          depth++;
          advance(2);
        } else if (source[pos] === ';' && source[pos + 1] === ')') {
          depth--;
          advance(2);
        } else {
          advance();
        }
      }
      continue;
    }

    const startLine = line;
    const startCol = col;

    if (ch === '(') {
      tokens.push({ type: TokenType.LeftParen, value: '(', line: startLine, col: startCol });
      advance();
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: TokenType.RightParen, value: ')', line: startLine, col: startCol });
      advance();
      continue;
    }

    // String literal
    if (ch === '"') {
      advance();
      let str = '';
      while (pos < source.length && source[pos] !== '"') {
        if (source[pos] === '\\') {
          advance();
          const esc = source[pos];
          if (esc === 'n') str += '\n';
          else if (esc === 't') str += '\t';
          else if (esc === '\\') str += '\\';
          else if (esc === '"') str += '"';
          else if (esc === '\'') str += '\'';
          else {
            // Hex escape \XX
            const hex = source.substring(pos, pos + 2);
            str += String.fromCharCode(parseInt(hex, 16));
            advance();
          }
          advance();
        } else {
          str += source[pos];
          advance();
        }
      }
      advance(); // closing "
      tokens.push({ type: TokenType.String, value: str, line: startLine, col: startCol });
      continue;
    }

    // Id ($name)
    if (ch === '$') {
      let id = '';
      advance();
      while (pos < source.length && !isDelimiter(source[pos])) {
        id += source[pos];
        advance();
      }
      tokens.push({ type: TokenType.Id, value: '$' + id, line: startLine, col: startCol });
      continue;
    }

    // Number or keyword
    let word = '';
    while (pos < source.length && !isDelimiter(source[pos])) {
      word += source[pos];
      advance();
    }

    if (isNumericToken(word)) {
      tokens.push({ type: TokenType.Number, value: word, line: startLine, col: startCol });
    } else {
      tokens.push({ type: TokenType.Keyword, value: word, line: startLine, col: startCol });
    }
  }

  tokens.push({ type: TokenType.EOF, value: '', line, col });
  return tokens;
}

function isDelimiter(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' ||
    ch === '(' || ch === ')' || ch === ';' || ch === '"';
}

function isNumericToken(word: string): boolean {
  if (/^[+-]?\d/.test(word)) return true;
  if (/^[+-]?0x[0-9a-fA-F]/.test(word)) return true;
  if (/^[+-]?inf$/.test(word)) return true;
  if (/^[+-]?nan/.test(word)) return true;
  return false;
}

// --- Parser ---

const valueTypeMap: Record<string, ValueTypeDescriptor> = {
  'i32': ValueType.Int32,
  'i64': ValueType.Int64,
  'f32': ValueType.Float32,
  'f64': ValueType.Float64,
  'v128': ValueType.V128,
  'funcref': ValueType.FuncRef,
  'externref': ValueType.ExternRef,
  'anyref': ValueType.AnyRef,
  'eqref': ValueType.EqRef,
  'i31ref': ValueType.I31Ref,
  'structref': ValueType.StructRef,
  'arrayref': ValueType.ArrayRef,
  'nullref': ValueType.NullRef,
  'nullfuncref': ValueType.NullFuncRef,
  'nullexternref': ValueType.NullExternRef,
};

const blockTypeMap: Record<string, BlockTypeDescriptor> = {
  'i32': BlockType.Int32,
  'i64': BlockType.Int64,
  'f32': BlockType.Float32,
  'f64': BlockType.Float64,
  'v128': BlockType.V128,
  'funcref': BlockType.FuncRef,
  'externref': BlockType.ExternRef,
  'anyref': BlockType.AnyRef,
  'eqref': BlockType.EqRef,
  'i31ref': BlockType.I31Ref,
  'structref': BlockType.StructRef,
  'arrayref': BlockType.ArrayRef,
};

// Build mnemonic → opcode lookup
const mnemonicToOpCode: Map<string, OpCodeDef> = new Map();
for (const [, opCode] of Object.entries(OpCodes)) {
  const op = opCode as OpCodeDef;
  mnemonicToOpCode.set(op.mnemonic, op);
}

class WatParserImpl {
  tokens: Token[];
  pos: number;
  moduleBuilder!: ModuleBuilder;
  funcNames: Map<string, number> = new Map();
  globalNames: Map<string, number> = new Map();
  typeNames: Map<string, number> = new Map();
  tagNames: Map<string, number> = new Map();
  localNames: Map<string, number> = new Map();
  funcList: (FunctionBuilder | ImportBuilder)[] = [];
  labelStack: { name: string; label: LabelBuilder }[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  // --- Token navigation ---

  peek(): Token {
    return this.tokens[this.pos];
  }

  advance(): Token {
    return this.tokens[this.pos++];
  }

  expect(type: TokenType, value?: string): Token {
    const tok = this.advance();
    if (tok.type !== type) {
      throw this.error(`Expected ${type}${value ? ` '${value}'` : ''} but got ${tok.type} '${tok.value}'`, tok);
    }
    if (value !== undefined && tok.value !== value) {
      throw this.error(`Expected '${value}' but got '${tok.value}'`, tok);
    }
    return tok;
  }

  expectKeyword(value: string): Token {
    return this.expect(TokenType.Keyword, value);
  }

  isKeyword(value: string): boolean {
    const tok = this.peek();
    return tok.type === TokenType.Keyword && tok.value === value;
  }

  isLeftParen(): boolean {
    return this.peek().type === TokenType.LeftParen;
  }

  isRightParen(): boolean {
    return this.peek().type === TokenType.RightParen;
  }

  // Skip optional inline comment like (;0;)
  skipInlineComment(): void {
    while (this.isLeftParen() && this.tokens[this.pos + 1]?.type === TokenType.Keyword &&
           this.tokens[this.pos + 1]?.value.startsWith(';')) {
      // This is a (;N;) comment — tokenizer should have removed it, but skip manually
      this.advance(); // (
      while (!this.isRightParen()) this.advance();
      this.advance(); // )
    }
  }

  error(message: string, tok?: Token): Error {
    const t = tok || this.peek();
    return new Error(`WAT parse error at ${t.line}:${t.col}: ${message}`);
  }

  // --- Parsing ---

  parse(options?: ModuleBuilderOptions): ModuleBuilder {
    this.expect(TokenType.LeftParen);
    this.expectKeyword('module');

    let name = 'module';
    if (this.peek().type === TokenType.Id) {
      name = this.advance().value.substring(1); // strip $
    }

    this.moduleBuilder = new ModuleBuilder(name, options);

    // First pass: parse all sections
    while (!this.isRightParen()) {
      this.expect(TokenType.LeftParen);
      const section = this.advance();

      switch (section.value) {
        case 'type':
          this.parseType();
          break;
        case 'import':
          this.parseImport();
          break;
        case 'func':
          this.parseFunc();
          break;
        case 'table':
          this.parseTable();
          break;
        case 'memory':
          this.parseMemory();
          break;
        case 'global':
          this.parseGlobal();
          break;
        case 'export':
          this.parseExport();
          break;
        case 'start':
          this.parseStart();
          break;
        case 'elem':
          this.parseElem();
          break;
        case 'data':
          this.parseData();
          break;
        case 'tag':
          this.parseTag();
          break;
        case 'rec':
          this.parseRecGroup();
          break;
        default:
          // Skip unknown section
          this.skipSExpr();
          break;
      }
    }

    this.expect(TokenType.RightParen); // closing module paren
    return this.moduleBuilder;
  }

  // Skip remainder of current S-expression (we've already consumed opening keyword)
  skipSExpr(): void {
    let depth = 0;
    while (true) {
      const tok = this.peek();
      if (tok.type === TokenType.EOF) break;
      if (tok.type === TokenType.LeftParen) {
        depth++;
        this.advance();
      } else if (tok.type === TokenType.RightParen) {
        if (depth === 0) {
          this.advance();
          return;
        }
        depth--;
        this.advance();
      } else {
        this.advance();
      }
    }
  }

  // --- Type section ---

  parseType(recGroup?: RecGroupBuilder): void {
    // (type $name (func (param i32 i32) (result i32)))
    // (type (;0;) (struct (field $x (mut i32))))
    // (type (;0;) (array (mut i32)))
    // (type $child (sub $parent (struct (field i32))))
    // (type $sealed (sub final (struct (field i32))))
    // We already consumed: ( type
    let typeName: string | null = null;
    if (this.peek().type === TokenType.Id) {
      typeName = this.advance().value;
    }
    this.skipInlineComment();
    this.expect(TokenType.LeftParen);

    // Handle sub/sub_final wrapper
    let isFinal = true;
    const superTypeIndices: { index: number }[] = [];
    let kw = this.peek().value;
    let hasSubWrapper = false;

    if (kw === 'sub' || kw === 'sub_final') {
      this.advance();
      hasSubWrapper = true;
      isFinal = kw === 'sub_final';
      if (kw === 'sub' && this.isKeyword('final')) {
        this.advance();
        isFinal = true;
      }
      // Parse super type references (before the inner type definition paren)
      while (this.peek().type === TokenType.Id || this.peek().type === TokenType.Number) {
        if (this.peek().type === TokenType.Id) {
          const id = this.advance().value;
          const resolved = this.typeNames.get(id);
          if (resolved === undefined) throw this.error(`Unknown type: ${id}`);
          superTypeIndices.push({ index: resolved });
        } else {
          superTypeIndices.push({ index: this.parseNumber() });
        }
      }
      // Now expect the inner type definition
      this.expect(TokenType.LeftParen);
      kw = this.peek().value;
    }

    const subOptions = hasSubWrapper ? { superTypes: superTypeIndices, final: isFinal } : undefined;

    if (kw === 'func') {
      this.advance();
      const params: ValueTypeDescriptor[] = [];
      const results: ValueTypeDescriptor[] = [];

      while (this.isLeftParen()) {
        this.expect(TokenType.LeftParen);
        const innerKw = this.advance().value;
        if (innerKw === 'param') {
          while (!this.isRightParen()) {
            if (this.peek().type === TokenType.Id) this.advance();
            else params.push(this.parseValueType());
          }
        } else if (innerKw === 'result') {
          while (!this.isRightParen()) {
            results.push(this.parseValueType());
          }
        }
        this.expect(TokenType.RightParen);
      }

      this.expect(TokenType.RightParen); // closing func
      if (hasSubWrapper) this.expect(TokenType.RightParen); // closing sub
      this.expect(TokenType.RightParen); // closing type

      let typeIndex: number;
      if (recGroup) {
        typeIndex = recGroup.addFuncType(results, params).index;
      } else {
        typeIndex = this.moduleBuilder.defineFunctionType(results.length > 0 ? results : null, params).index;
      }
      if (typeName) {
        this.typeNames.set(typeName, typeIndex);
      }
    } else if (kw === 'struct') {
      this.advance();
      const fields: { name: string; type: ValueTypeDescriptor; mutable: boolean }[] = [];

      while (this.isLeftParen()) {
        this.expect(TokenType.LeftParen);
        this.expectKeyword('field');
        let fieldName = `f${fields.length}`;
        if (this.peek().type === TokenType.Id) {
          fieldName = this.advance().value.replace(/^\$/, '');
        }
        let mutable = false;
        let fieldType: ValueTypeDescriptor;
        if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'mut') {
          this.expect(TokenType.LeftParen);
          this.expectKeyword('mut');
          fieldType = this.parseValueType();
          mutable = true;
          this.expect(TokenType.RightParen);
        } else {
          fieldType = this.parseValueType();
        }
        fields.push({ name: fieldName, type: fieldType, mutable });
        this.expect(TokenType.RightParen);
      }

      this.expect(TokenType.RightParen); // closing struct
      if (hasSubWrapper) this.expect(TokenType.RightParen); // closing sub
      this.expect(TokenType.RightParen); // closing type

      let typeIndex: number;
      if (recGroup) {
        typeIndex = recGroup.addStructType(fields, subOptions).index;
      } else {
        typeIndex = this.moduleBuilder.defineStructType(fields, subOptions).index;
      }
      if (typeName) {
        this.typeNames.set(typeName, typeIndex);
      }
    } else if (kw === 'array') {
      this.advance();
      let mutable = false;
      let elementType: ValueTypeDescriptor;
      if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'mut') {
        this.expect(TokenType.LeftParen);
        this.expectKeyword('mut');
        elementType = this.parseValueType();
        mutable = true;
        this.expect(TokenType.RightParen);
      } else {
        elementType = this.parseValueType();
      }

      this.expect(TokenType.RightParen); // closing array
      if (hasSubWrapper) this.expect(TokenType.RightParen); // closing sub
      this.expect(TokenType.RightParen); // closing type

      let typeIndex: number;
      if (recGroup) {
        typeIndex = recGroup.addArrayType(elementType, mutable, subOptions).index;
      } else {
        typeIndex = this.moduleBuilder.defineArrayType(elementType, mutable, subOptions).index;
      }
      if (typeName) {
        this.typeNames.set(typeName, typeIndex);
      }
    } else {
      throw this.error(`Expected 'func', 'struct', or 'array' in type definition, got '${kw}'`);
    }
  }

  parseRecGroup(): void {
    // (rec (type $name ...) (type $name2 ...) ...)
    // We already consumed: ( rec

    // First pass: pre-register type names so forward/mutual references work
    const savedPos = this.pos;
    const baseIndex = this.moduleBuilder._types.length;
    let groupIndex = 0;
    while (this.isLeftParen()) {
      this.advance(); // consume (
      this.advance(); // consume 'type'
      if (this.peek().type === TokenType.Id) {
        this.typeNames.set(this.advance().value, baseIndex + groupIndex);
      }
      this.skipSExpr(); // skip the rest of this type definition
      groupIndex++;
    }
    this.pos = savedPos;

    // Second pass: actually parse types into the rec group
    this.moduleBuilder.defineRecGroup((recGroup) => {
      while (this.isLeftParen()) {
        this.expect(TokenType.LeftParen);
        this.expectKeyword('type');
        this.parseType(recGroup);
      }
    });
    this.expect(TokenType.RightParen); // closing rec
  }

  // --- Import section ---

  parseImport(): void {
    // (import "module" "name" (func (;0;) (type 0)))
    const moduleName = this.expect(TokenType.String).value;
    const fieldName = this.expect(TokenType.String).value;

    this.expect(TokenType.LeftParen);
    const kind = this.advance().value;

    if (kind === 'func') {
      this.parseImportFunc(moduleName, fieldName);
    } else if (kind === 'table') {
      this.parseImportTable(moduleName, fieldName);
    } else if (kind === 'memory') {
      this.parseImportMemory(moduleName, fieldName);
    } else if (kind === 'global') {
      this.parseImportGlobal(moduleName, fieldName);
    } else {
      throw this.error(`Unknown import kind: ${kind}`);
    }
  }

  parseImportFunc(moduleName: string, fieldName: string): void {
    // (func $name (type 0))
    // OR: (func $name (param i32) (result i32))
    let importFuncName: string | null = null;
    if (this.peek().type === TokenType.Id) {
      importFuncName = this.advance().value;
    }
    this.skipInlineComment();

    let funcReturnTypes: ValueTypeDescriptor[] | null = null;
    let funcParamTypes: ValueTypeDescriptor[] = [];

    if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'type') {
      this.expect(TokenType.LeftParen);
      this.expectKeyword('type');
      const typeIndex = this.parseNumber();
      this.expect(TokenType.RightParen);
      const typeEntry = this.moduleBuilder._types[typeIndex];
      if (!('returnTypes' in typeEntry)) {
        throw new Error(`Type index ${typeIndex} is not a function type.`);
      }
      const funcType = typeEntry as import('./FuncTypeBuilder').default;
      funcReturnTypes = funcType.returnTypes.length > 0 ? funcType.returnTypes : null;
      funcParamTypes = funcType.parameterTypes;
    } else {
      // Parse inline (param ...) (result ...)
      const params: ValueTypeDescriptor[] = [];
      const results: ValueTypeDescriptor[] = [];
      while (this.isLeftParen()) {
        this.expect(TokenType.LeftParen);
        const kw = this.peek().value;
        if (kw === 'param') {
          this.advance();
          while (!this.isRightParen()) {
            if (this.peek().type === TokenType.Id) this.advance();
            else params.push(this.parseValueType());
          }
          this.expect(TokenType.RightParen);
        } else if (kw === 'result') {
          this.advance();
          while (!this.isRightParen()) {
            results.push(this.parseValueType());
          }
          this.expect(TokenType.RightParen);
        } else {
          break;
        }
      }
      funcReturnTypes = results.length > 0 ? results : null;
      funcParamTypes = params;
    }

    this.expect(TokenType.RightParen); // closing func
    this.expect(TokenType.RightParen); // closing import

    const imp = this.moduleBuilder.importFunction(moduleName, fieldName,
      funcReturnTypes, funcParamTypes
    );
    if (importFuncName) {
      this.funcNames.set(importFuncName, imp.index);
    }
    this.funcList.push(imp);
  }

  parseImportTable(moduleName: string, fieldName: string): void {
    // (table (;0;) 1 10 anyfunc)
    const initial = this.parseNumber();
    let maximum: number | null = null;
    let elemType = 'anyfunc';

    if (this.peek().type === TokenType.Number) {
      maximum = this.parseNumber();
    }
    if (this.peek().type === TokenType.Keyword) {
      elemType = this.advance().value;
    }

    this.expect(TokenType.RightParen); // closing table
    this.expect(TokenType.RightParen); // closing import

    this.moduleBuilder.importTable(moduleName, fieldName, ElementType.AnyFunc, initial, maximum);
  }

  parseImportMemory(moduleName: string, fieldName: string): void {
    // (memory (;0;) 1 2)
    // (memory (;0;) i64 1 10)         — memory64
    // (memory (;0;) 1 10 shared)      — shared memory
    let memory64 = false;
    if (this.isKeyword('i64')) {
      this.advance();
      memory64 = true;
    }
    const initial = this.parseNumber();
    let maximum: number | null = null;
    if (this.peek().type === TokenType.Number) {
      maximum = this.parseNumber();
    }
    let shared = false;
    if (this.isKeyword('shared')) {
      this.advance();
      shared = true;
    }
    this.expect(TokenType.RightParen); // closing memory
    this.expect(TokenType.RightParen); // closing import

    this.moduleBuilder.importMemory(moduleName, fieldName, initial, maximum, shared, memory64);
  }

  parseImportGlobal(moduleName: string, fieldName: string): void {
    // (global (;0;) i32) or (global (;0;) (mut i32))
    let mutable = false;
    let valueType: ValueTypeDescriptor;

    if (this.isLeftParen()) {
      this.expect(TokenType.LeftParen);
      this.expectKeyword('mut');
      valueType = this.parseValueType();
      mutable = true;
      this.expect(TokenType.RightParen);
    } else {
      valueType = this.parseValueType();
    }

    this.expect(TokenType.RightParen); // closing global
    this.expect(TokenType.RightParen); // closing import

    this.moduleBuilder.importGlobal(moduleName, fieldName, valueType, mutable);
  }

  // --- Function section ---

  parseFunc(): void {
    // (func $name (;1;) (type 0) (param i32) (result i32) (local i32) ...)
    // (func (export "name") (param i32) (result i32) ...)
    // (func (import "mod" "name") (param i32) (result i32))
    let name: string | null = null;
    if (this.peek().type === TokenType.Id) {
      name = this.advance().value.substring(1);
    }

    this.skipInlineComment();

    // Parse inline exports: (export "name") ...
    const inlineExports = this.parseInlineExports();

    // Parse inline import: (import "mod" "name")
    const inlineImport = this.parseInlineImport();

    // Check if there's an explicit (type N)
    let hasExplicitType = false;
    let typeIndex = -1;
    if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'type') {
      this.expect(TokenType.LeftParen);
      this.expectKeyword('type');
      if (this.peek().type === TokenType.Id) {
        const id = this.advance().value;
        const resolved = this.typeNames.get(id);
        if (resolved === undefined) throw this.error(`Unknown type: ${id}`);
        typeIndex = resolved;
      } else {
        typeIndex = this.parseNumber();
      }
      this.expect(TokenType.RightParen);
      hasExplicitType = true;
    }

    const params: ValueTypeDescriptor[] = [];
    const paramNames: (string | null)[] = [];
    const results: ValueTypeDescriptor[] = [];

    // Parse optional (param ...) and (result ...)
    while (this.isLeftParen() && !this.isInstruction()) {
      const savedPos = this.pos;
      this.expect(TokenType.LeftParen);
      const kw = this.peek().value;

      if (kw === 'param') {
        this.advance();
        while (!this.isRightParen()) {
          if (this.peek().type === TokenType.Id) {
            const pName = this.advance().value.substring(1); // strip $
            params.push(this.parseValueType());
            paramNames.push(pName);
          } else {
            params.push(this.parseValueType());
            paramNames.push(null);
          }
        }
        this.expect(TokenType.RightParen);
      } else if (kw === 'result') {
        this.advance();
        while (!this.isRightParen()) {
          results.push(this.parseValueType());
        }
        this.expect(TokenType.RightParen);
      } else if (kw === 'local') {
        // Will be handled in instruction parsing
        this.pos = savedPos;
        break;
      } else {
        this.pos = savedPos;
        break;
      }
    }

    let funcReturnTypes: ValueTypeDescriptor[] | null;
    let funcParamTypes: ValueTypeDescriptor[];

    if (hasExplicitType) {
      const typeEntry = this.moduleBuilder._types[typeIndex];
      if (!('returnTypes' in typeEntry)) {
        throw new Error(`Type index ${typeIndex} is not a function type.`);
      }
      const funcType = typeEntry as import('./FuncTypeBuilder').default;
      funcReturnTypes = funcType.returnTypes.length > 0 ? funcType.returnTypes : null;
      funcParamTypes = funcType.parameterTypes;
    } else {
      funcReturnTypes = results.length > 0 ? results : null;
      funcParamTypes = params;
    }

    // Handle inline import: produce an import instead of a function definition
    if (inlineImport) {
      const imp = this.moduleBuilder.importFunction(
        inlineImport.moduleName, inlineImport.fieldName,
        funcReturnTypes, funcParamTypes
      );
      if (name) {
        this.funcNames.set('$' + name, imp.index);
      }
      this.funcList.push(imp);
      // Apply inline exports to the import
      for (const exportName of inlineExports) {
        this.moduleBuilder.exportFunction(imp as unknown as FunctionBuilder, exportName);
      }
      this.expect(TokenType.RightParen); // closing func
      return;
    }

    const funcBuilder = this.moduleBuilder.defineFunction(
      name || `func_${this.moduleBuilder._functions.length - 1 + this.moduleBuilder._importsIndexSpace.function}`,
      funcReturnTypes,
      funcParamTypes
    );

    // Apply parameter names and populate localNames
    this.localNames = new Map();
    if (!hasExplicitType) {
      paramNames.forEach((pName, i) => {
        if (pName !== null && i < funcBuilder.parameters.length) {
          funcBuilder.parameters[i].withName(pName);
          this.localNames.set('$' + pName, i);
        }
      });
    }

    if (name) {
      this.funcNames.set('$' + name, funcBuilder._index);
    }
    this.funcList.push(funcBuilder);

    // Apply inline exports
    for (const exportName of inlineExports) {
      this.moduleBuilder.exportFunction(funcBuilder, exportName);
    }

    // Check if there are locals or instructions
    if (this.isRightParen()) {
      this.expect(TokenType.RightParen);
      return;
    }

    // Parse body
    this.labelStack = [];
    funcBuilder.createEmitter((asm) => {
      this.parseFuncBody(asm, funcBuilder);
    });

    this.expect(TokenType.RightParen); // closing func
  }

  parseFuncBody(asm: FunctionEmitter, func: FunctionBuilder): void {
    // Parse locals first
    const paramCount = func.parameters.length;
    let localIndex = paramCount;
    while (this.isLeftParen()) {
      const savedPos = this.pos;
      this.expect(TokenType.LeftParen);
      if (this.isKeyword('local')) {
        this.advance();
        while (!this.isRightParen()) {
          if (this.peek().type === TokenType.Id) {
            const localName = this.advance().value.substring(1); // strip $
            const vt = this.parseValueType();
            asm.declareLocal(vt, localName);
            this.localNames.set('$' + localName, localIndex);
            localIndex++;
          } else {
            const vt = this.parseValueType();
            asm.declareLocal(vt);
            localIndex++;
          }
        }
        this.expect(TokenType.RightParen);
      } else {
        this.pos = savedPos;
        break;
      }
    }

    // Parse instructions until closing )
    while (!this.isRightParen()) {
      this.parseInstruction(asm, func);
    }
  }

  parseInstruction(asm: FunctionEmitter, func: FunctionBuilder): void {
    // Folded s-expression form: (instr ...)
    if (this.isLeftParen()) {
      this.parseFoldedInstruction(asm, func);
      return;
    }

    const tok = this.advance();
    const mnemonic = tok.value;

    // Special handling for block/loop/if/try which have block signatures
    if (mnemonic === 'block' || mnemonic === 'loop' || mnemonic === 'if' || mnemonic === 'try') {
      // Check for optional $label
      let labelName: string | null = null;
      if (this.peek().type === TokenType.Id) {
        labelName = this.advance().value;
      }
      const blockType = this.parseBlockType();
      const label = asm.emit(mnemonicToOpCode.get(mnemonic)!, blockType);
      if (labelName && label) {
        this.labelStack.push({ name: labelName, label });
      }
      return;
    }

    // Handle 'end' — pop label stack
    if (mnemonic === 'end') {
      asm.emit(mnemonicToOpCode.get(mnemonic)!);
      if (this.labelStack.length > 0) {
        // Check if the most recent label matches current depth
        const cfStack = asm.controlFlowStack;
        // After 'end' pops, check if the popped label was named
        const top = this.labelStack[this.labelStack.length - 1];
        // If the label's block depth matches, pop it
        if (top.label.block && !cfStack.includes(top.label)) {
          this.labelStack.pop();
        }
      }
      return;
    }

    // Handle 'delegate' — pops try block (acts like end for try)
    if (mnemonic === 'delegate') {
      const depth = this.parseNumber();
      asm.emit(mnemonicToOpCode.get(mnemonic)!, depth);
      // Pop named label if present (delegate closes the try block)
      if (this.labelStack.length > 0) {
        const cfStack = asm.controlFlowStack;
        const top = this.labelStack[this.labelStack.length - 1];
        if (top.label.block && !cfStack.includes(top.label)) {
          this.labelStack.pop();
        }
      }
      return;
    }

    const opCode = mnemonicToOpCode.get(mnemonic);
    if (!opCode) {
      throw this.error(`Unknown instruction: ${mnemonic}`, tok);
    }

    // Special handling for throw/catch which reference tags
    if (mnemonic === 'throw' || mnemonic === 'catch') {
      asm.emit(opCode, this.resolveTag());
      return;
    }

    // Parse immediates based on opcode definition
    if (!opCode.immediate) {
      asm.emit(opCode);
      return;
    }

    switch (opCode.immediate) {
      case 'VarInt32':
        asm.emit(opCode, this.parseNumber());
        break;
      case 'VarInt64':
        asm.emit(opCode, this.parseI64Value());
        break;
      case 'Float32':
        asm.emit(opCode, this.parseFloat());
        break;
      case 'Float64':
        asm.emit(opCode, this.parseFloat());
        break;
      case 'VarUInt1':
        asm.emit(opCode, this.parseNumber());
        break;
      case 'VarUInt32':
        asm.emit(opCode, this.parseNumber());
        break;
      case 'Local':
        asm.emit(opCode, this.resolveLocal());
        break;
      case 'Global':
        asm.emit(opCode, this.resolveGlobal());
        break;
      case 'Function':
        asm.emit(opCode, this.resolveFunction());
        break;
      case 'IndirectFunction': {
        // Optional table index: call_indirect N (type M) or call_indirect (type M)
        let tableIndex: number | undefined;
        if (this.peek().type === TokenType.Number) {
          tableIndex = this.parseNumber();
        }
        // (type N) or (type $name)
        this.expect(TokenType.LeftParen);
        this.expectKeyword('type');
        let typeIdx: number;
        if (this.peek().type === TokenType.Id) {
          const id = this.advance().value;
          typeIdx = this.typeNames.get(id)!;
          if (typeIdx === undefined) throw this.error(`Unknown type: ${id}`);
        } else {
          typeIdx = this.parseNumber();
        }
        this.expect(TokenType.RightParen);
        asm.emit(opCode, this.moduleBuilder._types[typeIdx], tableIndex);
        break;
      }
      case 'RelativeDepth':
        asm.emit(opCode, this.resolveBranchTarget(asm));
        break;
      case 'BranchTable': {
        // default_target target1 target2 ...
        // Last one is default
        const targets: number[] = [];
        while (this.peek().type === TokenType.Number) {
          targets.push(this.parseNumber());
        }
        if (targets.length < 1) throw this.error('br_table requires at least a default target');
        const defaultTarget = targets.pop()!;
        // This is tricky with our label system; for now use raw depth values
        // by looking up labels on the control flow stack
        const defaultLabel = this.getLabelAtDepth(asm, defaultTarget);
        const labels = targets.map((t) => this.getLabelAtDepth(asm, t));
        asm.emit(opCode, defaultLabel, labels);
        break;
      }
      case 'MemoryImmediate': {
        let alignment = 0;
        let offset = 0;
        // Parse offset=N align=N
        while (this.peek().type === TokenType.Keyword && (
          this.peek().value.startsWith('offset=') || this.peek().value.startsWith('align=')
        )) {
          const kv = this.advance().value;
          const [key, val] = kv.split('=');
          if (key === 'offset') offset = parseInt(val, 10);
          else if (key === 'align') {
            const alignVal = parseInt(val, 10);
            alignment = Math.log2(alignVal);
          }
        }
        asm.emit(opCode, alignment, offset);
        break;
      }
      case 'BlockSignature': {
        // Already handled above for block/loop/if
        let blockType: BlockTypeDescriptor = BlockType.Void;
        if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'result') {
          this.expect(TokenType.LeftParen);
          this.expectKeyword('result');
          const vt = this.parseValueType();
          blockType = blockTypeMap[vt.name] || BlockType.Void;
          this.expect(TokenType.RightParen);
        }
        asm.emit(opCode, blockType);
        break;
      }
      case 'V128Const': {
        // v128.const i8x16 0 1 2 ... or hex format
        // For simplicity, parse 16 bytes
        const bytes = new Uint8Array(16);
        // Skip the lane type keyword (i8x16, i16x8, etc.)
        if (this.peek().type === TokenType.Keyword) this.advance();
        for (let i = 0; i < 16; i++) {
          bytes[i] = this.parseNumber() & 0xff;
        }
        asm.emit(opCode, bytes);
        break;
      }
      case 'LaneIndex':
        asm.emit(opCode, this.parseNumber());
        break;
      case 'ShuffleMask': {
        const mask = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
          mask[i] = this.parseNumber();
        }
        asm.emit(opCode, mask);
        break;
      }
      case 'TypeIndexField': {
        // struct.get $typeIndex $fieldIndex
        const typeIndex = this.parseNumber();
        const fieldIndex = this.parseNumber();
        asm.emit(opCode, typeIndex, fieldIndex);
        break;
      }
      case 'TypeIndexIndex': {
        // array.new_fixed $typeIndex $count
        const typeIndex = this.parseNumber();
        const index = this.parseNumber();
        asm.emit(opCode, typeIndex, index);
        break;
      }
      case 'HeapType':
        asm.emit(opCode, this.parseHeapType());
        break;
      case 'BrOnCast': {
        // br_on_cast $label $heapType1 $heapType2
        const label = this.resolveBranchTarget(asm);
        const ht1 = this.parseHeapType();
        const ht2 = this.parseHeapType();
        asm.emit(opCode, label, ht1, ht2);
        break;
      }
      default:
        asm.emit(opCode);
        break;
    }
  }

  parseFoldedInstruction(asm: FunctionEmitter, func: FunctionBuilder): void {
    this.expect(TokenType.LeftParen);
    const tok = this.advance();
    const mnemonic = tok.value;

    // Folded block: (block $label? (result type)? instr* )
    if (mnemonic === 'block' || mnemonic === 'loop') {
      let labelName: string | null = null;
      if (this.peek().type === TokenType.Id) {
        labelName = this.advance().value;
      }
      const blockType = this.parseBlockType();
      const label = asm.emit(mnemonicToOpCode.get(mnemonic)!, blockType);
      if (labelName && label) {
        this.labelStack.push({ name: labelName, label });
      }
      // Parse body instructions until closing )
      while (!this.isRightParen()) {
        this.parseInstruction(asm, func);
      }
      asm.emit(mnemonicToOpCode.get('end')!);
      if (this.labelStack.length > 0) {
        const cfStack = asm.controlFlowStack;
        const top = this.labelStack[this.labelStack.length - 1];
        if (top.label.block && !cfStack.includes(top.label)) {
          this.labelStack.pop();
        }
      }
      this.expect(TokenType.RightParen);
      return;
    }

    // Folded if: (if $label? (result type)? <condition> (then instr*) (else instr*)? )
    if (mnemonic === 'if') {
      let labelName: string | null = null;
      if (this.peek().type === TokenType.Id) {
        labelName = this.advance().value;
      }
      const blockType = this.parseBlockType();
      // Parse condition operands (folded expressions before (then ...))
      while (this.isLeftParen() && this.tokens[this.pos + 1]?.value !== 'then') {
        this.parseFoldedInstruction(asm, func);
      }
      const label = asm.emit(mnemonicToOpCode.get('if')!, blockType);
      if (labelName && label) {
        this.labelStack.push({ name: labelName, label });
      }
      // Parse (then ...)
      if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'then') {
        this.expect(TokenType.LeftParen);
        this.advance(); // consume 'then'
        while (!this.isRightParen()) {
          this.parseInstruction(asm, func);
        }
        this.expect(TokenType.RightParen);
      }
      // Parse optional (else ...)
      if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'else') {
        asm.emit(mnemonicToOpCode.get('else')!);
        this.expect(TokenType.LeftParen);
        this.advance(); // consume 'else'
        while (!this.isRightParen()) {
          this.parseInstruction(asm, func);
        }
        this.expect(TokenType.RightParen);
      }
      asm.emit(mnemonicToOpCode.get('end')!);
      if (this.labelStack.length > 0) {
        const cfStack = asm.controlFlowStack;
        const top = this.labelStack[this.labelStack.length - 1];
        if (top.label.block && !cfStack.includes(top.label)) {
          this.labelStack.pop();
        }
      }
      this.expect(TokenType.RightParen);
      return;
    }

    // Folded try: (try $label? (result type)? (do instr*) (catch $tag instr*)* (catch_all instr*)? )
    if (mnemonic === 'try') {
      let labelName: string | null = null;
      if (this.peek().type === TokenType.Id) {
        labelName = this.advance().value;
      }
      const blockType = this.parseBlockType();
      const label = asm.emit(mnemonicToOpCode.get('try')!, blockType);
      if (labelName && label) {
        this.labelStack.push({ name: labelName, label });
      }

      // Parse (do instr*)
      if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'do') {
        this.expect(TokenType.LeftParen);
        this.advance(); // consume 'do'
        while (!this.isRightParen()) {
          this.parseInstruction(asm, func);
        }
        this.expect(TokenType.RightParen);
      }

      // Parse (catch $tag instr*)*
      while (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'catch') {
        this.expect(TokenType.LeftParen);
        this.advance(); // consume 'catch'
        const tagIdx = this.resolveTag();
        asm.emit(mnemonicToOpCode.get('catch')!, tagIdx);
        while (!this.isRightParen()) {
          this.parseInstruction(asm, func);
        }
        this.expect(TokenType.RightParen);
      }

      // Parse optional (catch_all instr*)
      if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'catch_all') {
        this.expect(TokenType.LeftParen);
        this.advance(); // consume 'catch_all'
        asm.emit(mnemonicToOpCode.get('catch_all')!);
        while (!this.isRightParen()) {
          this.parseInstruction(asm, func);
        }
        this.expect(TokenType.RightParen);
      }

      asm.emit(mnemonicToOpCode.get('end')!);
      if (this.labelStack.length > 0) {
        const cfStack = asm.controlFlowStack;
        const top = this.labelStack[this.labelStack.length - 1];
        if (top.label.block && !cfStack.includes(top.label)) {
          this.labelStack.pop();
        }
      }
      this.expect(TokenType.RightParen);
      return;
    }

    // General folded instruction: (instr immediate* operand* )
    // Immediates are non-paren tokens after the mnemonic, operands are nested (...)
    const opCode = mnemonicToOpCode.get(mnemonic);
    if (!opCode) {
      throw this.error(`Unknown instruction: ${mnemonic}`, tok);
    }

    // Collect immediates first (before any nested expressions)
    const emitArgs: any[] = [];
    this.parseFoldedImmediates(opCode, mnemonic, asm, emitArgs);

    // Parse nested operand expressions
    while (this.isLeftParen()) {
      this.parseFoldedInstruction(asm, func);
    }

    // Emit the instruction
    asm.emit(opCode, ...emitArgs);
    this.expect(TokenType.RightParen);
  }

  private parseBlockType(): BlockTypeDescriptor | number {
    let blockType: BlockTypeDescriptor | number = BlockType.Void;

    // Check for (type $idx) first
    if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'type') {
      this.expect(TokenType.LeftParen);
      this.expectKeyword('type');
      if (this.peek().type === TokenType.Id) {
        const id = this.advance().value;
        const resolved = this.typeNames.get(id);
        if (resolved === undefined) throw this.error(`Unknown type: ${id}`);
        blockType = resolved;
      } else {
        blockType = this.parseNumber();
      }
      this.expect(TokenType.RightParen);
      return blockType;
    }

    // Parse multi-value: (param ...)* (result ...)*
    const blockParams: ValueTypeDescriptor[] = [];
    const blockResults: ValueTypeDescriptor[] = [];

    while (this.isLeftParen() && (this.tokens[this.pos + 1]?.value === 'param' || this.tokens[this.pos + 1]?.value === 'result')) {
      const savedPos = this.pos;
      this.expect(TokenType.LeftParen);
      const kw = this.peek().value;
      if (kw === 'param') {
        this.advance();
        while (!this.isRightParen()) {
          if (this.peek().type === TokenType.Id) this.advance(); // skip $name
          else blockParams.push(this.parseValueType());
        }
        this.expect(TokenType.RightParen);
      } else if (kw === 'result') {
        this.advance();
        while (!this.isRightParen()) {
          blockResults.push(this.parseValueType());
        }
        this.expect(TokenType.RightParen);
      } else {
        this.pos = savedPos;
        break;
      }
    }

    if (blockParams.length === 0 && blockResults.length === 0) {
      return BlockType.Void;
    }
    if (blockParams.length === 0 && blockResults.length === 1) {
      return blockTypeMap[blockResults[0].name] || BlockType.Void;
    }

    // Multi-value: define a function type and return its index
    const funcType = this.moduleBuilder.defineFunctionType(
      blockResults.length > 0 ? blockResults : null,
      blockParams
    );
    return funcType.index;
  }

  private parseFoldedImmediates(opCode: any, mnemonic: string, asm: FunctionEmitter, emitArgs: any[]): void {
    if (mnemonic === 'throw' || mnemonic === 'catch') {
      emitArgs.push(this.resolveTag());
      return;
    }

    if (!opCode.immediate) return;

    switch (opCode.immediate) {
      case 'VarInt32':
        emitArgs.push(this.parseNumber());
        break;
      case 'VarInt64':
        emitArgs.push(this.parseI64Value());
        break;
      case 'Float32':
      case 'Float64':
        emitArgs.push(this.parseFloat());
        break;
      case 'VarUInt1':
      case 'VarUInt32':
        emitArgs.push(this.parseNumber());
        break;
      case 'Local':
        emitArgs.push(this.resolveLocal());
        break;
      case 'Global':
        emitArgs.push(this.resolveGlobal());
        break;
      case 'Function':
        emitArgs.push(this.resolveFunction());
        break;
      case 'RelativeDepth':
        emitArgs.push(this.resolveBranchTarget(asm));
        break;
      case 'MemoryImmediate': {
        let alignment = 0;
        let offset = 0;
        while (this.peek().type === TokenType.Keyword && (
          this.peek().value.startsWith('offset=') || this.peek().value.startsWith('align=')
        )) {
          const kv = this.advance().value;
          const [key, val] = kv.split('=');
          if (key === 'offset') offset = parseInt(val, 10);
          else if (key === 'align') alignment = Math.log2(parseInt(val, 10));
        }
        emitArgs.push(alignment, offset);
        break;
      }
      case 'TypeIndexField':
        emitArgs.push(this.parseNumber(), this.parseNumber());
        break;
      case 'TypeIndexIndex':
        emitArgs.push(this.parseNumber(), this.parseNumber());
        break;
      case 'LaneIndex':
        emitArgs.push(this.parseNumber());
        break;
      case 'HeapType':
        emitArgs.push(this.parseHeapType());
        break;
      case 'BrOnCast': {
        const label = this.resolveBranchTarget(asm);
        const ht1 = this.parseHeapType();
        const ht2 = this.parseHeapType();
        emitArgs.push(label, ht1, ht2);
        break;
      }
      case 'IndirectFunction': {
        let tableIndex: number | undefined;
        if (this.peek().type === TokenType.Number) {
          tableIndex = this.parseNumber();
        }
        this.expect(TokenType.LeftParen);
        this.expectKeyword('type');
        let typeIdx: number;
        if (this.peek().type === TokenType.Id) {
          const id = this.advance().value;
          typeIdx = this.typeNames.get(id)!;
          if (typeIdx === undefined) throw this.error(`Unknown type: ${id}`);
        } else {
          typeIdx = this.parseNumber();
        }
        this.expect(TokenType.RightParen);
        emitArgs.push(this.moduleBuilder._types[typeIdx], tableIndex);
        break;
      }
      case 'BranchTable': {
        const targets: number[] = [];
        while (this.peek().type === TokenType.Number) {
          targets.push(this.parseNumber());
        }
        if (targets.length < 1) throw this.error('br_table requires at least a default target');
        const defaultTarget = targets.pop()!;
        const defaultLabel = this.getLabelAtDepth(asm, defaultTarget);
        const labels = targets.map((t) => this.getLabelAtDepth(asm, t));
        emitArgs.push(defaultLabel, labels);
        break;
      }
      case 'ShuffleMask': {
        const mask = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
          mask[i] = this.parseNumber();
        }
        emitArgs.push(mask);
        break;
      }
      case 'V128Const': {
        const bytes = new Uint8Array(16);
        if (this.peek().type === TokenType.Keyword) this.advance();
        for (let i = 0; i < 16; i++) {
          bytes[i] = this.parseNumber() & 0xff;
        }
        emitArgs.push(bytes);
        break;
      }
      case 'BlockSignature': {
        // Block type in folded context — should not normally reach here
        // but handle for completeness
        let bt: BlockTypeDescriptor = BlockType.Void;
        if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'result') {
          this.expect(TokenType.LeftParen);
          this.expectKeyword('result');
          const vt = this.parseValueType();
          bt = blockTypeMap[vt.name] || BlockType.Void;
          this.expect(TokenType.RightParen);
        }
        emitArgs.push(bt);
        break;
      }
      default:
        // No immediates to parse
        break;
    }
  }

  parseHeapType(): HeapTypeRef {
    const heapTypeKeywords: Record<string, HeapTypeRef> = {
      func: HeapType.Func,
      extern: HeapType.Extern,
      any: HeapType.Any,
      eq: HeapType.Eq,
      i31: HeapType.I31,
      struct: HeapType.Struct,
      array: HeapType.Array,
      none: HeapType.None,
      nofunc: HeapType.NoFunc,
      noextern: HeapType.NoExtern,
    };

    // Abstract heap type keyword: func, extern, any, eq, i31, struct, array, none, nofunc, noextern
    if (this.peek().type === TokenType.Keyword && heapTypeKeywords[this.peek().value] !== undefined) {
      return heapTypeKeywords[this.advance().value];
    }

    // Numeric type index
    if (this.peek().type === TokenType.Number) {
      return this.parseNumber();
    }

    throw this.error(`Expected heap type but found '${this.peek().value}'`);
  }

  getLabelAtDepth(asm: FunctionEmitter, relativeDepth: number): LabelBuilder {
    const stack = asm.controlFlowStack;
    const targetIndex = stack.length - 1 - relativeDepth;
    if (targetIndex < 0 || targetIndex >= stack.length) {
      throw this.error(`Invalid branch depth: ${relativeDepth}`);
    }
    return stack[targetIndex];
  }

  resolveBranchTarget(asm: FunctionEmitter): LabelBuilder {
    if (this.peek().type === TokenType.Id) {
      const id = this.advance().value;
      // Search label stack for matching name (search from top = most recent)
      for (let i = this.labelStack.length - 1; i >= 0; i--) {
        if (this.labelStack[i].name === id) {
          return this.labelStack[i].label;
        }
      }
      throw this.error(`Unknown label: ${id}`);
    }
    const depth = this.parseNumber();
    return this.getLabelAtDepth(asm, depth);
  }

  resolveFunction(): FunctionBuilder | ImportBuilder {
    if (this.peek().type === TokenType.Id) {
      const id = this.advance().value;
      const index = this.funcNames.get(id);
      if (index === undefined) throw this.error(`Unknown function: ${id}`);
      return this.funcList[index];
    }
    const index = this.parseNumber();
    return this.funcList[index];
  }

  resolveGlobal(): GlobalBuilder | ImportBuilder {
    let index: number;
    if (this.peek().type === TokenType.Id) {
      const id = this.advance().value;
      const resolved = this.globalNames.get(id);
      if (resolved === undefined) throw this.error(`Unknown global: ${id}`);
      index = resolved;
    } else {
      index = this.parseNumber();
    }
    const importedGlobals = this.moduleBuilder._imports.filter(
      (x) => x.externalKind === ExternalKind.Global
    );
    if (index < importedGlobals.length) {
      return importedGlobals[index];
    }
    return this.moduleBuilder._globals[index - importedGlobals.length];
  }

  resolveGlobalIndex(): number {
    if (this.peek().type === TokenType.Id) {
      const id = this.advance().value;
      const resolved = this.globalNames.get(id);
      if (resolved === undefined) throw this.error(`Unknown global: ${id}`);
      return resolved;
    }
    return this.parseNumber();
  }

  // --- Table section ---

  parseTable(): void {
    // (table $name? (export "name")* (import "mod" "name")? initial maximum? elemtype)
    let tableName: string | null = null;
    if (this.peek().type === TokenType.Id) {
      tableName = this.advance().value;
    }
    this.skipInlineComment();

    const inlineExports = this.parseInlineExports();
    const inlineImport = this.parseInlineImport();

    const initial = this.parseNumber();
    let maximum: number | null = null;

    if (this.peek().type === TokenType.Number) {
      maximum = this.parseNumber();
    }

    // element type
    if (this.peek().type === TokenType.Keyword) {
      this.advance(); // anyfunc or funcref
    }

    this.expect(TokenType.RightParen);

    if (inlineImport) {
      this.moduleBuilder.importTable(inlineImport.moduleName, inlineImport.fieldName, ElementType.AnyFunc, initial, maximum);
    } else {
      this.moduleBuilder.defineTable(ElementType.AnyFunc, initial, maximum);
    }

    const tableBuilder = this.moduleBuilder._tables[this.moduleBuilder._tables.length - 1];
    for (const exportName of inlineExports) {
      if (tableBuilder) {
        this.moduleBuilder.exportTable(tableBuilder, exportName);
      }
    }
  }

  // --- Memory section ---

  parseMemory(): void {
    // (memory $name? (export "name")* (import "mod" "name")? i64? initial maximum? shared?)
    let memName: string | null = null;
    if (this.peek().type === TokenType.Id) {
      memName = this.advance().value;
    }
    this.skipInlineComment();

    const inlineExports = this.parseInlineExports();
    const inlineImport = this.parseInlineImport();

    let memory64 = false;
    if (this.isKeyword('i64')) {
      this.advance();
      memory64 = true;
    }
    const initial = this.parseNumber();
    let maximum: number | null = null;
    if (this.peek().type === TokenType.Number) {
      maximum = this.parseNumber();
    }
    let shared = false;
    if (this.isKeyword('shared')) {
      this.advance();
      shared = true;
    }
    this.expect(TokenType.RightParen);

    if (inlineImport) {
      this.moduleBuilder.importMemory(inlineImport.moduleName, inlineImport.fieldName, initial, maximum, shared, memory64);
    } else {
      this.moduleBuilder.defineMemory(initial, maximum, shared, memory64);
    }

    const memBuilder = this.moduleBuilder._memories[this.moduleBuilder._memories.length - 1];
    for (const exportName of inlineExports) {
      if (memBuilder) {
        this.moduleBuilder.exportMemory(memBuilder, exportName);
      }
    }
  }

  // --- Global section ---

  parseGlobal(): void {
    // (global $name (export "name")* (import "mod" "name")? type init)
    let globalName: string | null = null;
    if (this.peek().type === TokenType.Id) {
      globalName = this.advance().value;
    }
    this.skipInlineComment();

    const inlineExports = this.parseInlineExports();
    const inlineImport = this.parseInlineImport();

    let mutable = false;
    let valueType: ValueTypeDescriptor;

    if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'mut') {
      this.expect(TokenType.LeftParen);
      this.expectKeyword('mut');
      valueType = this.parseValueType();
      mutable = true;
      this.expect(TokenType.RightParen);
    } else {
      valueType = this.parseValueType();
    }

    if (inlineImport) {
      const imp = this.moduleBuilder.importGlobal(inlineImport.moduleName, inlineImport.fieldName, valueType, mutable);
      for (const exportName of inlineExports) {
        this.moduleBuilder.exportGlobal(imp as unknown as GlobalBuilder, exportName);
      }
      this.expect(TokenType.RightParen); // closing global
      return;
    }

    // Parse init expression (instr)
    this.expect(TokenType.LeftParen);
    const initInstr = this.advance().value;
    let initValue: number | bigint = 0;

    if (initInstr === 'i32.const') {
      initValue = this.parseNumber();
    } else if (initInstr === 'i64.const') {
      initValue = this.parseI64Value();
    } else if (initInstr === 'f32.const') {
      initValue = this.parseFloat();
    } else if (initInstr === 'f64.const') {
      initValue = this.parseFloat();
    } else if (initInstr === 'ref.null') {
      // ref.null heap_type — init value 0 is fine for null reference
      this.parseHeapType();
      initValue = 0;
    } else if (initInstr === 'global.get') {
      // global.get $index — for imported global init expressions
      initValue = this.resolveGlobalIndex();
    }

    this.expect(TokenType.RightParen); // closing init expr
    this.expect(TokenType.RightParen); // closing global

    const globalBuilder = this.moduleBuilder.defineGlobal(valueType, mutable, initValue as number);
    if (globalName) {
      globalBuilder.withName(globalName.substring(1)); // strip $
      this.globalNames.set(globalName, globalBuilder._index);
    }

    for (const exportName of inlineExports) {
      this.moduleBuilder.exportGlobal(globalBuilder, exportName);
    }
  }

  // --- Export section ---

  parseExportIndex(): number {
    if (this.peek().type === TokenType.Id) {
      return -1; // handled by caller
    }
    return this.parseNumber();
  }

  parseExport(): void {
    // (export "name" (func 0))
    // (export "name" (func $name))
    const name = this.expect(TokenType.String).value;
    this.expect(TokenType.LeftParen);
    const kind = this.advance().value;

    switch (kind) {
      case 'func': {
        let funcIndex: number;
        if (this.peek().type === TokenType.Id) {
          const id = this.advance().value;
          funcIndex = this.funcNames.get(id)!;
          if (funcIndex === undefined) throw this.error(`Unknown function: ${id}`);
        } else {
          funcIndex = this.parseNumber();
        }
        this.expect(TokenType.RightParen); // closing kind
        this.expect(TokenType.RightParen); // closing export
        const func = this.funcList[funcIndex];
        if (func instanceof ImportBuilder) {
          throw this.error('Cannot export an imported function directly');
        }
        this.moduleBuilder.exportFunction(func as FunctionBuilder, name);
        break;
      }
      case 'table': {
        const index = this.parseNumber();
        this.expect(TokenType.RightParen);
        this.expect(TokenType.RightParen);
        this.moduleBuilder.exportTable(this.moduleBuilder._tables[index], name);
        break;
      }
      case 'memory': {
        const index = this.parseNumber();
        this.expect(TokenType.RightParen);
        this.expect(TokenType.RightParen);
        this.moduleBuilder.exportMemory(this.moduleBuilder._memories[index], name);
        break;
      }
      case 'global': {
        let index: number;
        if (this.peek().type === TokenType.Id) {
          const id = this.advance().value;
          index = this.globalNames.get(id)!;
          if (index === undefined) throw this.error(`Unknown global: ${id}`);
        } else {
          index = this.parseNumber();
        }
        this.expect(TokenType.RightParen);
        this.expect(TokenType.RightParen);
        const importedGlobals = this.moduleBuilder._imports.filter(
          (x) => x.externalKind === ExternalKind.Global
        );
        if (index < importedGlobals.length) {
          throw this.error('Cannot export an imported global directly');
        }
        this.moduleBuilder.exportGlobal(
          this.moduleBuilder._globals[index - importedGlobals.length], name
        );
        break;
      }
      default: {
        this.parseNumber();
        this.expect(TokenType.RightParen);
        this.expect(TokenType.RightParen);
      }
    }
  }

  // --- Start section ---

  parseStart(): void {
    // (start 0) or (start $name)
    let index: number;
    if (this.peek().type === TokenType.Id) {
      const id = this.advance().value;
      index = this.funcNames.get(id)!;
      if (index === undefined) throw this.error(`Unknown function: ${id}`);
    } else {
      index = this.parseNumber();
    }
    this.expect(TokenType.RightParen);
    const func = this.funcList[index];
    if (func instanceof FunctionBuilder) {
      this.moduleBuilder.setStartFunction(func);
    }
  }

  // --- Element section ---

  parseElem(): void {
    // Active: (elem (i32.const 0) func 0 1 2)
    // Passive: (elem func 0 1 2)
    const isPassive = this.isKeyword('func') || this.isKeyword('funcref');

    if (!isPassive) {
      // Parse offset expression
      this.expect(TokenType.LeftParen);
      const offsetInstr = this.advance().value;
      let offset = 0;
      if (offsetInstr === 'i32.const') {
        offset = this.parseNumber();
      } else if (offsetInstr === 'i64.const') {
        offset = this.parseNumber();
      } else if (offsetInstr === 'global.get') {
        offset = this.resolveGlobalIndex();
      }
      this.expect(TokenType.RightParen);

      // "func" keyword
      if (this.isKeyword('func')) {
        this.advance();
      }

      // Parse function indices or $name references
      const elements: (FunctionBuilder | ImportBuilder)[] = [];
      while (this.peek().type === TokenType.Number || this.peek().type === TokenType.Id) {
        if (this.peek().type === TokenType.Id) {
          const id = this.advance().value;
          const idx = this.funcNames.get(id);
          if (idx === undefined) throw this.error(`Unknown function: ${id}`);
          elements.push(this.funcList[idx]);
        } else {
          const idx = this.parseNumber();
          elements.push(this.funcList[idx]);
        }
      }

      this.expect(TokenType.RightParen);

      const table = this.moduleBuilder._tables[0];
      this.moduleBuilder.defineElementSegment(table, elements, offset);
    } else {
      // Passive element segment
      this.advance(); // consume 'func' or 'funcref'

      const elements: (FunctionBuilder | ImportBuilder)[] = [];
      while (this.peek().type === TokenType.Number || this.peek().type === TokenType.Id) {
        if (this.peek().type === TokenType.Id) {
          const id = this.advance().value;
          const idx = this.funcNames.get(id);
          if (idx === undefined) throw this.error(`Unknown function: ${id}`);
          elements.push(this.funcList[idx]);
        } else {
          const idx = this.parseNumber();
          elements.push(this.funcList[idx]);
        }
      }

      this.expect(TokenType.RightParen);

      this.moduleBuilder.definePassiveElementSegment(elements);
    }
  }

  // --- Data section ---

  parseData(): void {
    // Active: (data (i32.const 0) "hello\00world")
    // Passive: (data "hello\00world")
    if (this.peek().type === TokenType.String) {
      // Passive data segment — no offset expression
      const dataStr = this.expect(TokenType.String).value;
      const bytes = new Uint8Array(dataStr.length);
      for (let i = 0; i < dataStr.length; i++) {
        bytes[i] = dataStr.charCodeAt(i);
      }
      this.expect(TokenType.RightParen);
      this.moduleBuilder.defineData(bytes).passive();
      return;
    }

    this.expect(TokenType.LeftParen);
    const offsetInstr = this.advance().value;
    let offset: number | bigint = 0;
    if (offsetInstr === 'i32.const') {
      offset = this.parseNumber();
    } else if (offsetInstr === 'i64.const') {
      offset = this.parseNumber(); // data offset as number
    } else if (offsetInstr === 'global.get') {
      offset = this.resolveGlobalIndex();
    }
    this.expect(TokenType.RightParen);

    const dataStr = this.expect(TokenType.String).value;
    const bytes = new Uint8Array(dataStr.length);
    for (let i = 0; i < dataStr.length; i++) {
      bytes[i] = dataStr.charCodeAt(i);
    }

    this.expect(TokenType.RightParen);

    this.moduleBuilder.defineData(bytes, Number(offset));
  }

  parseTag(): void {
    // (tag (;0;) (type 0) (param i32))
    // (tag $myTag (type 0))
    // (tag (param i32 f64))
    let tagName: string | null = null;
    if (this.peek().type === TokenType.Id) {
      tagName = this.advance().value;
    }
    this.skipInlineComment();

    const params: ValueTypeDescriptor[] = [];

    // Parse (type N) if present — skip it, we build from params
    if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'type') {
      this.expect(TokenType.LeftParen);
      this.advance(); // 'type'
      this.parseNumber(); // skip type index
      this.expect(TokenType.RightParen);
    }

    // Parse (param ...) if present
    if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'param') {
      this.expect(TokenType.LeftParen);
      this.advance(); // 'param'
      while (!this.isRightParen()) {
        params.push(this.parseValueType());
      }
      this.expect(TokenType.RightParen);
    }

    this.expect(TokenType.RightParen);

    const tag = this.moduleBuilder.defineTag(params);
    if (tagName) {
      this.tagNames.set(tagName, tag._index);
    }
  }

  resolveTag(): number {
    if (this.peek().type === TokenType.Id) {
      const id = this.advance().value;
      const idx = this.tagNames.get(id);
      if (idx === undefined) throw this.error(`Unknown tag: ${id}`);
      return idx;
    }
    return this.parseNumber();
  }

  parseInlineExports(): string[] {
    const exports: string[] = [];
    while (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'export') {
      this.expect(TokenType.LeftParen);
      this.expectKeyword('export');
      exports.push(this.expect(TokenType.String).value);
      this.expect(TokenType.RightParen);
    }
    return exports;
  }

  parseInlineImport(): { moduleName: string; fieldName: string } | null {
    if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'import') {
      this.expect(TokenType.LeftParen);
      this.expectKeyword('import');
      const moduleName = this.expect(TokenType.String).value;
      const fieldName = this.expect(TokenType.String).value;
      this.expect(TokenType.RightParen);
      return { moduleName, fieldName };
    }
    return null;
  }

  resolveLocal(): number {
    if (this.peek().type === TokenType.Id) {
      const id = this.advance().value;
      const idx = this.localNames.get(id);
      if (idx === undefined) throw this.error(`Unknown local: ${id}`);
      return idx;
    }
    return this.parseNumber();
  }

  // --- Helpers ---

  parseValueType(): ValueTypeDescriptor {
    // Check for (ref ...) or (ref null ...) concrete reference types
    if (this.isLeftParen() && this.tokens[this.pos + 1]?.value === 'ref') {
      this.expect(TokenType.LeftParen);
      this.advance(); // consume 'ref'
      let nullable = false;
      if (this.isKeyword('null')) {
        this.advance();
        nullable = true;
      }
      let typeIndex: number;
      if (this.peek().type === TokenType.Id) {
        const id = this.advance().value;
        const resolved = this.typeNames.get(id);
        if (resolved === undefined) throw this.error(`Unknown type: ${id}`);
        typeIndex = resolved;
      } else {
        typeIndex = this.parseNumber();
      }
      this.expect(TokenType.RightParen);
      return nullable ? refNullType(typeIndex) : refType(typeIndex);
    }

    const tok = this.advance();
    const vt = valueTypeMap[tok.value];
    if (!vt) throw this.error(`Unknown value type: ${tok.value}`, tok);
    return vt;
  }

  parseNumber(): number {
    const tok = this.advance();
    if (tok.value.startsWith('0x') || tok.value.startsWith('-0x') || tok.value.startsWith('+0x')) {
      return parseInt(tok.value.replace(/_/g, ''), 16);
    }
    return parseInt(tok.value.replace(/_/g, ''), 10);
  }

  parseFloat(): number {
    const tok = this.advance();
    const val = tok.value.replace(/_/g, '');
    if (val === 'inf' || val === '+inf') return Infinity;
    if (val === '-inf') return -Infinity;
    if (val.includes('nan')) return NaN;
    if (val.startsWith('0x') || val.startsWith('-0x') || val.startsWith('+0x')) {
      return this.parseHexFloat(val);
    }
    return parseFloat(val);
  }

  parseHexFloat(val: string): number {
    // Hex float format: 0xHH.HHpEE
    const negative = val.startsWith('-');
    const clean = val.replace(/^[+-]?0x/, '');
    const parts = clean.split('p');
    const mantissa = parts[0];
    const exponent = parts.length > 1 ? parseInt(parts[1], 10) : 0;

    let result: number;
    if (mantissa.includes('.')) {
      const [intPart, fracPart] = mantissa.split('.');
      result = parseInt(intPart || '0', 16) +
        parseInt(fracPart || '0', 16) / Math.pow(16, (fracPart || '').length);
    } else {
      result = parseInt(mantissa, 16);
    }

    result *= Math.pow(2, exponent);
    return negative ? -result : result;
  }

  parseI64Value(): number | bigint {
    const tok = this.advance();
    const val = tok.value.replace(/_/g, '');
    try {
      return BigInt(val);
    } catch {
      return parseInt(val, 10);
    }
  }

  isInstruction(): boolean {
    // Check if the next s-expr is an instruction (local or something else)
    if (!this.isLeftParen()) return false;
    const nextTok = this.tokens[this.pos + 1];
    if (!nextTok) return false;
    return nextTok.value !== 'param' && nextTok.value !== 'result' && nextTok.value !== 'type';
  }
}

/**
 * Parse a WAT (WebAssembly Text Format) string into a ModuleBuilder.
 */
export function parseWat(source: string, options?: ModuleBuilderOptions): ModuleBuilder {
  const tokens = tokenize(source);
  const parser = new WatParserImpl(tokens);
  return parser.parse(options);
}
