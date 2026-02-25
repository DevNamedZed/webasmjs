import { ModuleInfo, FuncTypeInfo, StructTypeInfo, ArrayTypeInfo, TypeInfo, GlobalInfo, FunctionInfo, DataInfo, ElementInfo } from './BinaryReader';
import InstructionDecoder, { DecodedInstruction } from './InstructionDecoder';
import OpCodes from './OpCodes';

const valueTypeNames: Record<number, string> = {
  0x7f: 'i32',
  0x7e: 'i64',
  0x7d: 'f32',
  0x7c: 'f64',
  0x7b: 'v128',
  0x70: 'funcref',
  0x6f: 'externref',
  0x6e: 'anyref',
  0x6d: 'eqref',
  0x6c: 'i31ref',
  0x6b: 'structref',
  0x6a: 'arrayref',
  0x71: 'nullref',
  0x73: 'nullfuncref',
  0x72: 'nullexternref',
};

const blockTypeNames: Record<number, string> = {
  ...valueTypeNames,
  0x40: '',  // void
};

// Signed int7 keys for InstructionDecoder output (readVarInt7 returns signed)
const signedBlockTypeNames: Record<number, string> = {
  [-1]: 'i32',
  [-2]: 'i64',
  [-3]: 'f32',
  [-4]: 'f64',
  [-5]: 'v128',
  [-16]: 'funcref',
  [-17]: 'externref',
  [-64]: '',  // void (0x40)
};

const heapTypeNames: Record<number, string> = {
  0x70: 'func',  // -16
  0x6f: 'extern', // -17
  0x6e: 'any',    // -18
  0x6d: 'eq',     // -19
  0x6c: 'i31',    // -20
  0x6b: 'struct', // -21
  0x6a: 'array',  // -22
  0x71: 'none',   // -15
  0x73: 'nofunc', // -13
  0x72: 'noextern', // -14
  // Signed keys (from readVarInt32 in InstructionDecoder)
  [-16]: 'func',
  [-17]: 'extern',
  [-18]: 'any',
  [-19]: 'eq',
  [-20]: 'i31',
  [-21]: 'struct',
  [-22]: 'array',
  [-15]: 'none',
  [-13]: 'nofunc',
  [-14]: 'noextern',
};

// Signed int7 value → type name (BinaryReader stores globals/locals as signed)
const signedToTypeName: Record<number, string> = {
  [-1]: 'i32',
  [-2]: 'i64',
  [-3]: 'f32',
  [-4]: 'f64',
  [-5]: 'v128',
  [-16]: 'funcref',
  [-17]: 'externref',
  [-18]: 'anyref',
  [-19]: 'eqref',
  [-20]: 'i31ref',
  [-21]: 'structref',
  [-22]: 'arrayref',
  [-15]: 'nullref',
  [-13]: 'nullfuncref',
  [-14]: 'nullexternref',
};

function getValueTypeName(vtNum: number | { name: string }): string {
  if (typeof vtNum === 'object' && 'name' in vtNum) return vtNum.name;
  // Handle signed int7 encoding from BinaryReader
  if (vtNum < 0 && signedToTypeName[vtNum]) {
    return signedToTypeName[vtNum];
  }
  // Handle unsigned byte encoding
  if (valueTypeNames[vtNum]) return valueTypeNames[vtNum];
  return `type_${vtNum}`;
}

function getHeapTypeName(ht: number): string {
  // Heap type: negative = abstract type, positive = concrete type index
  if (ht >= 0) return `${ht}`;
  return heapTypeNames[ht] || `${ht}`;
}

export default class Disassembler {
  private module: ModuleInfo;
  private indent: number;
  private lines: string[];
  private importedFuncCount: number;
  private importedGlobalCount: number;
  private importedMemoryCount: number;
  private importedTableCount: number;

  constructor(module: ModuleInfo) {
    this.module = module;
    this.indent = 0;
    this.lines = [];
    this.importedFuncCount = module.imports.filter(i => i.kind === 0).length;
    this.importedGlobalCount = module.imports.filter(i => i.kind === 3).length;
    this.importedMemoryCount = module.imports.filter(i => i.kind === 2).length;
    this.importedTableCount = module.imports.filter(i => i.kind === 1).length;
  }

  disassemble(): string {
    const mod = this.module;
    const moduleName = mod.nameSection?.moduleName;
    this.lines = [];

    this.line(`(module${moduleName ? ' $' + moduleName : ''}`);
    this.indent++;

    this.writeTypes();
    this.writeImports();
    this.writeFunctions();
    this.writeTables();
    this.writeMemories();
    this.writeGlobals();
    this.writeExports();
    this.writeStart();
    this.writeElements();
    this.writeData();

    this.indent--;
    this.line(')');

    return this.lines.join('\n');
  }

  private line(text: string): void {
    this.lines.push('  '.repeat(this.indent) + text);
  }

  private getFunctionName(index: number): string | null {
    return this.module.nameSection?.functionNames?.get(index) || null;
  }

  private getLocalName(funcIndex: number, localIndex: number): string | null {
    return this.module.nameSection?.localNames?.get(funcIndex)?.get(localIndex) || null;
  }

  private getGlobalName(index: number): string | null {
    return this.module.nameSection?.globalNames?.get(index) || null;
  }

  // Flatten types: rec groups expand into individual types
  private flattenTypes(): TypeInfo[] {
    const flat: TypeInfo[] = [];
    for (const t of this.module.types) {
      if (t.kind === 'rec') {
        for (const inner of t.types) {
          flat.push(inner);
        }
      } else {
        flat.push(t);
      }
    }
    return flat;
  }

  private writeTypes(): void {
    let typeIndex = 0;
    for (const t of this.module.types) {
      if (t.kind === 'rec') {
        this.line(`(type (;${typeIndex};) (rec`);
        this.indent++;
        for (const inner of t.types) {
          this.writeTypeEntry(inner, typeIndex);
          typeIndex++;
        }
        this.indent--;
        this.line('))');
      } else {
        this.writeTypeEntry(t, typeIndex);
        typeIndex++;
      }
    }
  }

  private writeTypeEntry(t: TypeInfo, index: number): void {
    if (t.kind === 'func') {
      const ft = t as FuncTypeInfo;
      const params = ft.parameterTypes.map(p => getValueTypeName(p)).join(' ');
      const results = ft.returnTypes.map(r => getValueTypeName(r)).join(' ');
      let sig = '(func';
      if (params) sig += ` (param ${params})`;
      if (results) sig += ` (result ${results})`;
      sig += ')';
      this.line(`(type (;${index};) ${sig})`);
    } else if (t.kind === 'struct') {
      const st = t as StructTypeInfo;
      const fields = st.fields.map(f => {
        const typeName = getValueTypeName(f.type);
        return f.mutable ? `(field (mut ${typeName}))` : `(field ${typeName})`;
      }).join(' ');
      let prefix = '';
      if (st.superTypes && st.superTypes.length > 0) {
        const final = st.final !== false ? 'sub_final' : 'sub';
        prefix = `(${final} ${st.superTypes.join(' ')} `;
      }
      this.line(`(type (;${index};) ${prefix}(struct ${fields})${prefix ? ')' : ''})`);
    } else if (t.kind === 'array') {
      const at = t as ArrayTypeInfo;
      const elemType = getValueTypeName(at.elementType);
      const elem = at.mutable ? `(mut ${elemType})` : elemType;
      this.line(`(type (;${index};) (array ${elem}))`);
    }
  }

  private writeImports(): void {
    for (const imp of this.module.imports) {
      const mod = JSON.stringify(imp.moduleName);
      const field = JSON.stringify(imp.fieldName);
      switch (imp.kind) {
        case 0: { // func
          const typeIdx = imp.typeIndex!;
          this.line(`(import ${mod} ${field} (func (type ${typeIdx})))`);
          break;
        }
        case 1: { // table
          const tt = imp.tableType!;
          const elemType = valueTypeNames[tt.elementType & 0xff] || 'anyfunc';
          const max = tt.maximum !== null ? ` ${tt.maximum}` : '';
          this.line(`(import ${mod} ${field} (table ${tt.initial}${max} ${elemType}))`);
          break;
        }
        case 2: { // memory
          const mt = imp.memoryType!;
          const mem64 = mt.memory64 ? 'i64 ' : '';
          const max = mt.maximum !== null ? ` ${mt.maximum}` : '';
          const shared = mt.shared ? ' shared' : '';
          this.line(`(import ${mod} ${field} (memory ${mem64}${mt.initial}${max}${shared}))`);
          break;
        }
        case 3: { // global
          const gt = imp.globalType!;
          const vtName = getValueTypeName(gt.valueType);
          const globalType = gt.mutable ? `(mut ${vtName})` : vtName;
          this.line(`(import ${mod} ${field} (global ${globalType}))`);
          break;
        }
        case 4: { // tag
          const tt = imp.tagType!;
          this.line(`(import ${mod} ${field} (tag (type ${tt.typeIndex})))`);
          break;
        }
      }
    }
  }

  private writeFunctions(): void {
    const flatTypes = this.flattenTypes();

    for (let i = 0; i < this.module.functions.length; i++) {
      const func = this.module.functions[i];
      const globalFuncIndex = this.importedFuncCount + i;
      const name = this.getFunctionName(globalFuncIndex);
      const nameStr = name ? ` $${name}` : '';

      // Get function type
      const funcType = flatTypes[func.typeIndex];
      let sig = `(type ${func.typeIndex})`;
      if (funcType && funcType.kind === 'func') {
        const ft = funcType as FuncTypeInfo;
        if (ft.parameterTypes.length > 0) {
          sig += ' (param ' + ft.parameterTypes.map(p => getValueTypeName(p)).join(' ') + ')';
        }
        if (ft.returnTypes.length > 0) {
          sig += ' (result ' + ft.returnTypes.map(r => getValueTypeName(r)).join(' ') + ')';
        }
      }

      this.line(`(func${nameStr} ${sig}`);
      this.indent++;

      // Locals
      for (const local of func.locals) {
        for (let j = 0; j < local.count; j++) {
          this.line(`(local ${getValueTypeName(local.type)})`);
        }
      }

      // Instructions
      const instructions = func.instructions || InstructionDecoder.decodeInitExpr(func.body);
      this.writeInstructions(instructions, globalFuncIndex);

      this.indent--;
      this.line(')');
    }
  }

  private writeInstructions(instructions: DecodedInstruction[], funcIndex?: number): void {
    for (const instr of instructions) {
      if (instr.opCode === OpCodes.end) {
        // Don't emit trailing end — it's implicit in the closing paren
        continue;
      }
      const formatted = this.formatInstruction(instr);
      this.line(formatted);
    }
  }

  private formatInstruction(instr: DecodedInstruction): string {
    const mnemonic = instr.opCode.mnemonic;
    const imm = instr.immediates;

    if (imm.values.length === 0) return mnemonic;

    switch (imm.type) {
      case 'BlockSignature': {
        const bt = imm.values[0];
        // Check signed keys first (from InstructionDecoder's readVarInt7)
        const btSigned = signedBlockTypeNames[bt];
        if (btSigned !== undefined) {
          if (btSigned === '') return mnemonic; // void
          return `${mnemonic} (result ${btSigned})`;
        }
        // Check unsigned keys
        const btUnsigned = blockTypeNames[bt];
        if (btUnsigned !== undefined) {
          if (btUnsigned === '') return mnemonic; // void
          return `${mnemonic} (result ${btUnsigned})`;
        }
        // Type index (positive or zero)
        if (bt >= 0) return `${mnemonic} (type ${bt})`;
        return mnemonic;
      }
      case 'VarInt32':
      case 'VarInt64':
      case 'VarUInt1':
      case 'VarUInt32':
      case 'RelativeDepth':
      case 'Function':
      case 'Local':
      case 'Global':
      case 'LaneIndex':
        return `${mnemonic} ${imm.values[0]}`;
      case 'Float32':
      case 'Float64': {
        const val = imm.values[0];
        if (Number.isNaN(val)) return `${mnemonic} nan`;
        if (val === Infinity) return `${mnemonic} inf`;
        if (val === -Infinity) return `${mnemonic} -inf`;
        return `${mnemonic} ${val}`;
      }
      case 'MemoryImmediate': {
        const alignment = imm.values[0];
        const offset = imm.values[1];
        const parts: string[] = [mnemonic];
        if (offset !== 0) parts.push(`offset=${offset}`);
        if (alignment !== 0) parts.push(`align=${1 << alignment}`);
        return parts.join(' ');
      }
      case 'IndirectFunction': {
        const typeIdx = imm.values[0];
        const tableIdx = imm.values[1];
        if (tableIdx > 0) return `${mnemonic} ${tableIdx} (type ${typeIdx})`;
        return `${mnemonic} (type ${typeIdx})`;
      }
      case 'BranchTable': {
        const targets = imm.values[0] as number[];
        const defaultTarget = imm.values[1] as number;
        return `${mnemonic} ${targets.join(' ')} ${defaultTarget}`;
      }
      case 'TypeIndexField': {
        const typeIdx = imm.values[0];
        const fieldIdx = imm.values[1];
        return `${mnemonic} ${typeIdx} ${fieldIdx}`;
      }
      case 'TypeIndexIndex': {
        const typeIdx = imm.values[0];
        const idx = imm.values[1];
        return `${mnemonic} ${typeIdx} ${idx}`;
      }
      case 'HeapType': {
        const ht = imm.values[0];
        return `${mnemonic} ${getHeapTypeName(ht)}`;
      }
      case 'BrOnCast': {
        const [flags, depth, ht1, ht2] = imm.values;
        return `${mnemonic} ${depth} ${getHeapTypeName(ht1)} ${getHeapTypeName(ht2)}`;
      }
      case 'V128Const': {
        const bytes = imm.values[0] as Uint8Array;
        return `${mnemonic} i8x16 ${Array.from(bytes).join(' ')}`;
      }
      case 'ShuffleMask': {
        const mask = imm.values[0] as Uint8Array;
        return `${mnemonic} ${Array.from(mask).join(' ')}`;
      }
      default:
        return mnemonic;
    }
  }

  private writeTables(): void {
    for (let i = 0; i < this.module.tables.length; i++) {
      const t = this.module.tables[i];
      const elemType = valueTypeNames[t.elementType & 0xff] || 'anyfunc';
      const max = t.maximum !== null ? ` ${t.maximum}` : '';
      this.line(`(table (;${this.importedTableCount + i};) ${t.initial}${max} ${elemType})`);
    }
  }

  private writeMemories(): void {
    for (let i = 0; i < this.module.memories.length; i++) {
      const m = this.module.memories[i];
      const mem64 = m.memory64 ? 'i64 ' : '';
      const max = m.maximum !== null ? ` ${m.maximum}` : '';
      const shared = m.shared ? ' shared' : '';
      this.line(`(memory (;${this.importedMemoryCount + i};) ${mem64}${m.initial}${max}${shared})`);
    }
  }

  private writeGlobals(): void {
    for (let i = 0; i < this.module.globals.length; i++) {
      const g = this.module.globals[i];
      const globalIdx = this.importedGlobalCount + i;
      const name = this.getGlobalName(globalIdx);
      const nameStr = name ? ` $${name}` : '';
      const vtName = getValueTypeName(g.valueType);
      const globalType = g.mutable ? `(mut ${vtName})` : vtName;
      const initInstrs = g.initInstructions || InstructionDecoder.decodeInitExpr(g.initExpr);
      const initStr = initInstrs
        .filter(ins => ins.opCode !== OpCodes.end)
        .map(ins => this.formatInstruction(ins))
        .join(' ');
      this.line(`(global${nameStr} (;${globalIdx};) ${globalType} (${initStr}))`);
    }
  }

  private writeExports(): void {
    const kindNames = ['func', 'table', 'memory', 'global', 'tag'];
    for (const exp of this.module.exports) {
      const kind = kindNames[exp.kind] || `kind_${exp.kind}`;
      this.line(`(export ${JSON.stringify(exp.name)} (${kind} ${exp.index}))`);
    }
  }

  private writeStart(): void {
    if (this.module.start !== null) {
      this.line(`(start ${this.module.start})`);
    }
  }

  private writeElements(): void {
    for (const elem of this.module.elements) {
      if (elem.passive) {
        const indices = elem.functionIndices.join(' ');
        this.line(`(elem func ${indices})`);
      } else {
        const offsetInstrs = elem.offsetInstructions || InstructionDecoder.decodeInitExpr(elem.offsetExpr);
        const offsetStr = offsetInstrs
          .filter(ins => ins.opCode !== OpCodes.end)
          .map(ins => this.formatInstruction(ins))
          .join(' ');
        const indices = elem.functionIndices.join(' ');
        this.line(`(elem (${offsetStr}) func ${indices})`);
      }
    }
  }

  private writeData(): void {
    for (const data of this.module.data) {
      if (data.passive) {
        const str = this.escapeDataString(data.data);
        this.line(`(data ${str})`);
      } else {
        const offsetInstrs = data.offsetInstructions || InstructionDecoder.decodeInitExpr(data.offsetExpr);
        const offsetStr = offsetInstrs
          .filter(ins => ins.opCode !== OpCodes.end)
          .map(ins => this.formatInstruction(ins))
          .join(' ');
        const str = this.escapeDataString(data.data);
        this.line(`(data (${offsetStr}) ${str})`);
      }
    }
  }

  private escapeDataString(data: Uint8Array): string {
    let result = '"';
    for (const b of data) {
      if (b >= 0x20 && b < 0x7f && b !== 0x22 && b !== 0x5c) {
        result += String.fromCharCode(b);
      } else {
        result += '\\' + b.toString(16).padStart(2, '0');
      }
    }
    result += '"';
    return result;
  }
}
