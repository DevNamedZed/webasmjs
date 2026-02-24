import ModuleBuilder from './ModuleBuilder';
import FunctionBuilder from './FunctionBuilder';
import ImportBuilder from './ImportBuilder';
import GlobalBuilder from './GlobalBuilder';
import { ExternalKind, ImmediateType, ValueTypeDescriptor } from './types';
import FuncTypeBuilder from './FuncTypeBuilder';
import StructTypeBuilder from './StructTypeBuilder';
import ArrayTypeBuilder from './ArrayTypeBuilder';
import GlobalType from './GlobalType';
import MemoryType from './MemoryType';
import TableType from './TableType';
import Instruction from './Instruction';
import LabelBuilder from './LabelBuilder';
import FunctionParameterBuilder from './FunctionParameterBuilder';
import LocalBuilder from './LocalBuilder';

export default class TextModuleWriter {
  moduleBuilder: ModuleBuilder;

  constructor(moduleBuilder: ModuleBuilder) {
    this.moduleBuilder = moduleBuilder;
  }

  toString(): string {
    const lines: string[] = [];
    const mod = this.moduleBuilder;

    lines.push(`(module $${mod._name}`);

    this.writeTypes(lines, mod);
    this.writeImports(lines, mod);
    this.writeFunctions(lines, mod);
    this.writeTables(lines, mod);
    this.writeMemories(lines, mod);
    this.writeGlobals(lines, mod);
    this.writeTags(lines, mod);
    this.writeExports(lines, mod);
    this.writeStart(lines, mod);
    this.writeElements(lines, mod);
    this.writeData(lines, mod);

    lines.push(')');
    return lines.join('\n');
  }

  private writeTypes(lines: string[], mod: ModuleBuilder): void {
    mod._types.forEach((type, i) => {
      if (type instanceof FuncTypeBuilder) {
        const params = type.parameterTypes.map((p: ValueTypeDescriptor) => p.name).join(' ');
        const results = type.returnTypes.map((r: ValueTypeDescriptor) => r.name).join(' ');
        let sig = `(func`;
        if (params.length > 0) sig += ` (param ${params})`;
        if (results.length > 0) sig += ` (result ${results})`;
        sig += ')';
        lines.push(`  (type (;${i};) ${sig})`);
      } else if (type instanceof StructTypeBuilder) {
        const fields = type.fields.map((f) => {
          const mut = f.mutable ? `(mut ${f.type.name})` : f.type.name;
          return `(field $${f.name} ${mut})`;
        }).join(' ');
        lines.push(`  (type (;${i};) (struct ${fields}))`);
      } else if (type instanceof ArrayTypeBuilder) {
        const mut = type.mutable ? `(mut ${type.elementType.name})` : type.elementType.name;
        lines.push(`  (type (;${i};) (array ${mut}))`);
      }
    });
  }

  private writeImports(lines: string[], mod: ModuleBuilder): void {
    mod._imports.forEach((imp, i) => {
      let desc = '';
      switch (imp.externalKind) {
        case ExternalKind.Function: {
          const funcType = imp.data as FuncTypeBuilder;
          desc = `(func (;${imp.index};) (type ${funcType.index}))`;
          break;
        }
        case ExternalKind.Table: {
          const tableType = imp.data as TableType;
          const limits = tableType.resizableLimits;
          const max = limits.maximum !== null ? ` ${limits.maximum}` : '';
          desc = `(table (;${imp.index};) ${limits.initial}${max} ${tableType.elementType.name})`;
          break;
        }
        case ExternalKind.Memory: {
          const memType = imp.data as MemoryType;
          const limits = memType.resizableLimits;
          const max = limits.maximum !== null ? ` ${limits.maximum}` : '';
          desc = `(memory (;${imp.index};) ${limits.initial}${max})`;
          break;
        }
        case ExternalKind.Global: {
          const globalType = imp.data as GlobalType;
          const valType = globalType.valueType.name;
          desc = globalType.mutable
            ? `(global (;${imp.index};) (mut ${valType}))`
            : `(global (;${imp.index};) ${valType})`;
          break;
        }
      }
      lines.push(`  (import "${imp.moduleName}" "${imp.fieldName}" ${desc})`);
    });
  }

  private writeFunctions(lines: string[], mod: ModuleBuilder): void {
    mod._functions.forEach((func) => {
      const typeIdx = func.funcTypeBuilder.index;
      let header = `  (func $${func.name} (;${func._index};) (type ${typeIdx})`;

      if (func.funcTypeBuilder.parameterTypes.length > 0) {
        const params = func.funcTypeBuilder.parameterTypes
          .map((p, i) => {
            const param = func.parameters[i];
            return p.name;
          })
          .join(' ');
        header += ` (param ${params})`;
      }

      if (func.funcTypeBuilder.returnTypes.length > 0) {
        const results = func.funcTypeBuilder.returnTypes.map((r) => r.name).join(' ');
        header += ` (result ${results})`;
      }

      if (!func.functionEmitter) {
        lines.push(header + ')');
        return;
      }

      const emitter = func.functionEmitter;

      // Locals
      if (emitter._locals.length > 0) {
        const locals = emitter._locals.map((l) => {
          if (l.count === 1) return `(local ${l.valueType.name})`;
          return `(local ${l.valueType.name})`.repeat(l.count);
        });
        header += ' ' + locals.join(' ');
      }

      lines.push(header);

      // Instructions
      this.writeInstructions(lines, emitter._instructions, 2);
      lines.push('  )');
    });
  }

  private writeInstructions(lines: string[], instructions: Instruction[], baseIndent: number): void {
    let indent = baseIndent;

    for (const instr of instructions) {
      const mnemonic = instr.opCode.mnemonic;

      // Decrease indent before end/else
      if (mnemonic === 'end' || mnemonic === 'else') {
        indent = Math.max(baseIndent, indent - 1);
      }

      const prefix = '  '.repeat(indent);
      let line = `${prefix}${mnemonic}`;

      // Add immediate operand text
      if (instr.immediate) {
        const immText = this.immediateToText(instr.immediate.type, instr.immediate.values);
        if (immText) {
          line += ` ${immText}`;
        }
      }

      lines.push(line);

      // Increase indent after block/loop/if/else
      if (mnemonic === 'block' || mnemonic === 'loop' || mnemonic === 'if' || mnemonic === 'else') {
        indent++;
      }
    }
  }

  private immediateToText(type: ImmediateType, values: any[]): string {
    switch (type) {
      case ImmediateType.BlockSignature: {
        const blockType = values[0];
        if (blockType && blockType.name !== 'void') {
          return `(result ${blockType.name})`;
        }
        return '';
      }
      case ImmediateType.VarInt32:
      case ImmediateType.VarInt64:
      case ImmediateType.Float32:
      case ImmediateType.Float64:
      case ImmediateType.VarUInt1:
        return String(values[0]);

      case ImmediateType.Local: {
        const local = values[0];
        return String(local.index);
      }
      case ImmediateType.Global: {
        const global = values[0];
        if (global instanceof GlobalBuilder) {
          return String(global._index);
        }
        if (global && typeof global.index === 'number') {
          return String(global.index);
        }
        return '';
      }
      case ImmediateType.Function: {
        const func = values[0];
        if (func instanceof FunctionBuilder) {
          return String(func._index);
        }
        if (func instanceof ImportBuilder) {
          return String(func.index);
        }
        return '';
      }
      case ImmediateType.IndirectFunction: {
        const funcType = values[0];
        return `(type ${funcType.index})`;
      }
      case ImmediateType.RelativeDepth: {
        const label = values[0];
        const depth = values[1];
        if (label instanceof LabelBuilder && label.block) {
          return String(depth - label.block.depth);
        }
        return String(label);
      }
      case ImmediateType.BranchTable: {
        const defaultDepth = values[0];
        const depths = values[1] as number[];
        return depths.join(' ') + ' ' + defaultDepth;
      }
      case ImmediateType.MemoryImmediate: {
        const alignment = values[0];
        const offset = values[1];
        let text = '';
        if (offset !== 0) text += `offset=${offset}`;
        if (alignment !== 0) {
          if (text) text += ' ';
          text += `align=${1 << alignment}`;
        }
        return text;
      }
      case ImmediateType.VarUInt32:
        return String(values[0]);
      case ImmediateType.TypeIndexField:
        return `${values[0]} ${values[1]}`;
      case ImmediateType.TypeIndexIndex:
        return `${values[0]} ${values[1]}`;
      case ImmediateType.HeapType: {
        const ht = values[0];
        if (typeof ht === 'number') return String(ht);
        if (ht && typeof ht.name === 'string') return ht.name;
        if (ht && typeof ht.index === 'number') return String(ht.index);
        return '';
      }
      case ImmediateType.BrOnCast:
        return `${values[0]} ${values[1]} ${values[2]} ${values[3]}`;
      default:
        return '';
    }
  }

  private writeTables(lines: string[], mod: ModuleBuilder): void {
    mod._tables.forEach((table, i) => {
      const limits = table.resizableLimits;
      const max = limits.maximum !== null ? ` ${limits.maximum}` : '';
      lines.push(`  (table (;${table._index};) ${limits.initial}${max} ${table.elementType.name})`);
    });
  }

  private writeMemories(lines: string[], mod: ModuleBuilder): void {
    mod._memories.forEach((mem) => {
      const limits = mem._memoryType.resizableLimits;
      const max = limits.maximum !== null ? ` ${limits.maximum}` : '';
      const shared = mem._memoryType.shared ? ' shared' : '';
      const m64 = mem._memoryType.memory64 ? ' i64' : '';
      lines.push(`  (memory (;${mem._index};)${m64} ${limits.initial}${max}${shared})`);
    });
  }

  private writeGlobals(lines: string[], mod: ModuleBuilder): void {
    mod._globals.forEach((g) => {
      const valType = g.globalType.valueType.name;
      const typeStr = g.globalType.mutable ? `(mut ${valType})` : valType;

      let initExpr = '';
      if (g._initExpressionEmitter) {
        const instrs = g._initExpressionEmitter._instructions;
        // Init expression is typically one const instruction + end
        for (const instr of instrs) {
          if (instr.opCode.mnemonic === 'end') continue;
          initExpr = instr.opCode.mnemonic;
          if (instr.immediate) {
            const immText = this.immediateToText(instr.immediate.type, instr.immediate.values);
            if (immText) initExpr += ` ${immText}`;
          }
        }
      }

      lines.push(`  (global (;${g._index};) ${typeStr} (${initExpr}))`);
    });
  }

  private writeTags(lines: string[], mod: ModuleBuilder): void {
    mod._tags.forEach((tag, i) => {
      const params = tag._funcType.parameterTypes.map((p) => p.name).join(' ');
      let sig = '';
      if (params.length > 0) sig = ` (param ${params})`;
      lines.push(`  (tag (;${i};) (type ${tag._funcType.index})${sig})`);
    });
  }

  private writeExports(lines: string[], mod: ModuleBuilder): void {
    mod._exports.forEach((exp) => {
      let kindName = '';
      let index = exp.data._index;
      switch (exp.externalKind) {
        case ExternalKind.Function:
          kindName = 'func';
          break;
        case ExternalKind.Table:
          kindName = 'table';
          break;
        case ExternalKind.Memory:
          kindName = 'memory';
          break;
        case ExternalKind.Global:
          kindName = 'global';
          break;
      }
      lines.push(`  (export "${exp.name}" (${kindName} ${index}))`);
    });
  }

  private writeStart(lines: string[], mod: ModuleBuilder): void {
    if (mod._startFunction) {
      lines.push(`  (start ${mod._startFunction._index})`);
    }
  }

  private writeElements(lines: string[], mod: ModuleBuilder): void {
    mod._elements.forEach((elem, i) => {
      const funcIndices = elem._functions
        .map((f) => {
          if (f instanceof FunctionBuilder) return f._index;
          if (f instanceof ImportBuilder) return f.index;
          return 0;
        })
        .join(' ');

      if (elem._passive) {
        lines.push(`  (elem (;${i};) func ${funcIndices})`);
        return;
      }

      let offsetExpr = '';
      if (elem._initExpressionEmitter) {
        const instrs = elem._initExpressionEmitter._instructions;
        for (const instr of instrs) {
          if (instr.opCode.mnemonic === 'end') continue;
          offsetExpr = instr.opCode.mnemonic;
          if (instr.immediate) {
            const immText = this.immediateToText(instr.immediate.type, instr.immediate.values);
            if (immText) offsetExpr += ` ${immText}`;
          }
        }
      }

      const tableIndex = elem._table ? elem._table._index : 0;
      if (tableIndex !== 0) {
        lines.push(`  (elem (;${i};) (table ${tableIndex}) (${offsetExpr}) func ${funcIndices})`);
      } else {
        lines.push(`  (elem (;${i};) (${offsetExpr}) func ${funcIndices})`);
      }
    });
  }

  private writeData(lines: string[], mod: ModuleBuilder): void {
    mod._data.forEach((seg, i) => {
      const dataStr = this.bytesToWatString(seg._data);

      if (seg._passive) {
        lines.push(`  (data (;${i};) "${dataStr}")`);
        return;
      }

      let offsetExpr = '';
      if (seg._initExpressionEmitter) {
        const instrs = seg._initExpressionEmitter._instructions;
        for (const instr of instrs) {
          if (instr.opCode.mnemonic === 'end') continue;
          offsetExpr = instr.opCode.mnemonic;
          if (instr.immediate) {
            const immText = this.immediateToText(instr.immediate.type, instr.immediate.values);
            if (immText) offsetExpr += ` ${immText}`;
          }
        }
      }

      if (seg._memoryIndex !== 0) {
        lines.push(`  (data (;${i};) (memory ${seg._memoryIndex}) (${offsetExpr}) "${dataStr}")`);
      } else {
        lines.push(`  (data (;${i};) (${offsetExpr}) "${dataStr}")`);
      }
    });
  }

  private bytesToWatString(data: Uint8Array): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      if (byte >= 0x20 && byte < 0x7f && byte !== 0x22 && byte !== 0x5c) {
        result += String.fromCharCode(byte);
      } else {
        result += '\\' + byte.toString(16).padStart(2, '0');
      }
    }
    return result;
  }
}
