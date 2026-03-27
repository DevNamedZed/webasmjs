export interface DwarfLineEntry {
  address: number;
  file: number;
  line: number;
  column: number;
}

export interface DwarfFileEntry {
  name: string;
  directoryIndex: number;
}

export interface DwarfLineInfo {
  files: DwarfFileEntry[];
  directories: string[];
  lineEntries: DwarfLineEntry[];
}

export interface DwarfParameter {
  name: string;
  wasmLocal: number | null;
  typeName: string | null;
}

export interface DwarfLocalVariable {
  name: string;
  wasmLocal: number | null;
  typeName: string | null;
}

export interface DwarfFunction {
  name: string;
  linkageName: string | null;
  lowPc: number;
  highPc: number;
  declFile: number;
  declLine: number;
  isExternal: boolean;
  parameters: DwarfParameter[];
  variables: DwarfLocalVariable[];
}

export interface DwarfCompilationUnit {
  name: string;
  producer: string;
  language: number;
  compDir: string;
  functions: DwarfFunction[];
}

export interface DwarfTypeInfo {
  tag: 'base' | 'pointer' | 'struct' | 'typedef' | 'const' | 'other';
  name: string | null;
  byteSize: number;
  referencedType: number | null;
}

export interface DwarfDebugInfo {
  lineInfo: DwarfLineInfo | null;
  sourceFiles: string[];
  compilationUnits: DwarfCompilationUnit[];
  functions: DwarfFunction[];
  types: Map<number, DwarfTypeInfo>;
}

export function parseDwarfDebugInfo(customSections: { name: string; data: Uint8Array }[]): DwarfDebugInfo {
  const debugLineSection = customSections.find(section => section.name === '.debug_line');
  const debugStrSection = customSections.find(section => section.name === '.debug_str');
  const debugLineStrSection = customSections.find(section => section.name === '.debug_line_str');
  const debugInfoSection = customSections.find(section => section.name === '.debug_info');
  const debugAbbrevSection = customSections.find(section => section.name === '.debug_abbrev');

  let lineInfo: DwarfLineInfo | null = null;
  if (debugLineSection) {
    lineInfo = parseDebugLine(debugLineSection.data, debugStrSection?.data, debugLineStrSection?.data);
  }

  const sourceFiles: string[] = [];
  if (lineInfo) {
    for (const fileEntry of lineInfo.files) {
      let path = fileEntry.name;
      if (fileEntry.directoryIndex > 0 && fileEntry.directoryIndex <= lineInfo.directories.length) {
        const directory = lineInfo.directories[fileEntry.directoryIndex - 1];
        if (directory && !path.startsWith('/')) {
          path = directory + '/' + path;
        }
      }
      sourceFiles.push(path);
    }
  }

  let compilationUnits: DwarfCompilationUnit[] = [];
  let allFunctions: DwarfFunction[] = [];
  let allTypes = new Map<number, DwarfTypeInfo>();
  if (debugInfoSection && debugAbbrevSection) {
    try {
      const parseResult = parseDebugInfo(
        debugInfoSection.data,
        debugAbbrevSection.data,
        debugStrSection?.data,
        debugLineStrSection?.data,
      );
      compilationUnits = parseResult.units;
      allTypes = parseResult.types;
      for (const compilationUnit of compilationUnits) {
        allFunctions = allFunctions.concat(compilationUnit.functions);
      }
    } catch (parseError) {
      // DWARF parsing can fail on edge cases; degrade gracefully
    }
  }

  return { lineInfo, sourceFiles, compilationUnits, functions: allFunctions, types: allTypes };
}

export function getLineEntriesForAddressRange(lineInfo: DwarfLineInfo, startAddress: number, endAddress: number): DwarfLineEntry[] {
  return lineInfo.lineEntries.filter(
    entry => entry.address >= startAddress && entry.address < endAddress
  );
}

function parseDebugLine(
  data: Uint8Array,
  debugStr: Uint8Array | undefined,
  debugLineStr: Uint8Array | undefined,
): DwarfLineInfo {
  const reader = new DwarfReader(data);
  const allFiles: DwarfFileEntry[] = [];
  const allDirectories: string[] = [];
  const allEntries: DwarfLineEntry[] = [];

  while (reader.offset < data.length) {
    const unitStart = reader.offset;
    const unitLength = reader.readUint32();
    if (unitLength === 0) {
      break;
    }
    const unitEnd = reader.offset + unitLength;
    const version = reader.readUint16();

    if (version === 5) {
      parseDwarf5LineUnit(reader, unitEnd, allFiles, allDirectories, allEntries, debugStr, debugLineStr);
    } else if (version >= 2 && version <= 4) {
      parseDwarf4LineUnit(reader, unitEnd, version, allFiles, allDirectories, allEntries);
    } else {
      reader.offset = unitEnd;
    }
  }

  return { files: allFiles, directories: allDirectories, lineEntries: allEntries };
}

function parseDwarf4LineUnit(
  reader: DwarfReader,
  unitEnd: number,
  version: number,
  files: DwarfFileEntry[],
  directories: string[],
  entries: DwarfLineEntry[],
): void {
  const headerLength = reader.readUint32();
  const headerEnd = reader.offset + headerLength;
  const minimumInstructionLength = reader.readUint8();
  let maximumOpsPerInstruction = 1;
  if (version >= 4) {
    maximumOpsPerInstruction = reader.readUint8();
  }
  const defaultIsStatement = reader.readUint8() !== 0;
  const lineBase = reader.readInt8();
  const lineRange = reader.readUint8();
  const opcodeBase = reader.readUint8();

  const standardOpcodeLengths: number[] = [];
  for (let index = 1; index < opcodeBase; index++) {
    standardOpcodeLengths.push(reader.readULEB128());
  }

  const dirStart = directories.length;
  while (reader.offset < headerEnd) {
    const dirName = reader.readNullTerminatedString();
    if (dirName.length === 0) {
      break;
    }
    directories.push(dirName);
  }

  const fileStart = files.length;
  while (reader.offset < headerEnd) {
    const fileName = reader.readNullTerminatedString();
    if (fileName.length === 0) {
      break;
    }
    const directoryIndex = reader.readULEB128();
    reader.readULEB128();
    reader.readULEB128();
    files.push({ name: fileName, directoryIndex: dirStart + directoryIndex });
  }

  reader.offset = headerEnd;

  executeLineProgram(reader, unitEnd, minimumInstructionLength, maximumOpsPerInstruction,
    defaultIsStatement, lineBase, lineRange, opcodeBase, standardOpcodeLengths, fileStart, entries);
}

function parseDwarf5LineUnit(
  reader: DwarfReader,
  unitEnd: number,
  files: DwarfFileEntry[],
  directories: string[],
  entries: DwarfLineEntry[],
  debugStr: Uint8Array | undefined,
  debugLineStr: Uint8Array | undefined,
): void {
  const addressSize = reader.readUint8();
  const segmentSelectorSize = reader.readUint8();
  const headerLength = reader.readUint32();
  const headerEnd = reader.offset + headerLength;
  const minimumInstructionLength = reader.readUint8();
  const maximumOpsPerInstruction = reader.readUint8();
  const defaultIsStatement = reader.readUint8() !== 0;
  const lineBase = reader.readInt8();
  const lineRange = reader.readUint8();
  const opcodeBase = reader.readUint8();

  const standardOpcodeLengths: number[] = [];
  for (let index = 1; index < opcodeBase; index++) {
    standardOpcodeLengths.push(reader.readULEB128());
  }

  const directoryEntryFormatCount = reader.readUint8();
  const directoryEntryFormat: [number, number][] = [];
  for (let index = 0; index < directoryEntryFormatCount; index++) {
    const contentType = reader.readULEB128();
    const form = reader.readULEB128();
    directoryEntryFormat.push([contentType, form]);
  }

  const dirStart = directories.length;
  const directoryCount = reader.readULEB128();
  for (let index = 0; index < directoryCount; index++) {
    let dirName = '';
    for (const [contentType, form] of directoryEntryFormat) {
      const value = readFormValue(reader, form, debugStr, debugLineStr);
      if (contentType === 1) {
        dirName = value;
      }
    }
    directories.push(dirName);
  }

  const fileEntryFormatCount = reader.readUint8();
  const fileEntryFormat: [number, number][] = [];
  for (let index = 0; index < fileEntryFormatCount; index++) {
    const contentType = reader.readULEB128();
    const form = reader.readULEB128();
    fileEntryFormat.push([contentType, form]);
  }

  const fileStart = files.length;
  const fileCount = reader.readULEB128();
  for (let index = 0; index < fileCount; index++) {
    let fileName = '';
    let directoryIndex = 0;
    for (const [contentType, form] of fileEntryFormat) {
      const value = readFormValue(reader, form, debugStr, debugLineStr);
      if (contentType === 1) {
        fileName = value;
      } else if (contentType === 2) {
        directoryIndex = parseInt(value, 10) || 0;
      }
    }
    files.push({ name: fileName, directoryIndex: dirStart + directoryIndex });
  }

  reader.offset = headerEnd;

  executeLineProgram(reader, unitEnd, minimumInstructionLength, maximumOpsPerInstruction,
    defaultIsStatement, lineBase, lineRange, opcodeBase, standardOpcodeLengths, fileStart, entries);
}

function readFormValue(
  reader: DwarfReader,
  form: number,
  debugStr: Uint8Array | undefined,
  debugLineStr: Uint8Array | undefined,
): string {
  switch (form) {
    case 0x08: {
      const len = reader.readULEB128();
      const bytes = reader.readBytes(len);
      return new TextDecoder().decode(bytes);
    }
    case 0x0e: {
      const offset = reader.readUint32();
      if (debugStr) {
        return readNullTerminatedStringAt(debugStr, offset);
      }
      return `<str@${offset}>`;
    }
    case 0x1f: {
      const offset = reader.readUint32();
      if (debugLineStr) {
        return readNullTerminatedStringAt(debugLineStr, offset);
      }
      return `<linestr@${offset}>`;
    }
    case 0x0b: {
      return String(reader.readULEB128());
    }
    case 0x05: {
      return String(reader.readUint16());
    }
    case 0x06: {
      return String(reader.readUint32());
    }
    case 0x0f: {
      const offset = reader.readULEB128();
      if (debugStr) {
        return readNullTerminatedStringAt(debugStr, offset);
      }
      return `<strx@${offset}>`;
    }
    default: {
      return `<form_${form}>`;
    }
  }
}

function executeLineProgram(
  reader: DwarfReader,
  unitEnd: number,
  minimumInstructionLength: number,
  maximumOpsPerInstruction: number,
  defaultIsStatement: boolean,
  lineBase: number,
  lineRange: number,
  opcodeBase: number,
  standardOpcodeLengths: number[],
  fileStart: number,
  entries: DwarfLineEntry[],
): void {
  let address = 0;
  let file = 1;
  let line = 1;
  let column = 0;
  let isStatement = defaultIsStatement;
  let opIndex = 0;

  while (reader.offset < unitEnd) {
    const opcode = reader.readUint8();

    if (opcode === 0) {
      const extLength = reader.readULEB128();
      const extEnd = reader.offset + extLength;
      const extOpcode = reader.readUint8();

      switch (extOpcode) {
        case 1:
          entries.push({ address, file: fileStart + file, line, column });
          address = 0;
          file = 1;
          line = 1;
          column = 0;
          isStatement = defaultIsStatement;
          opIndex = 0;
          break;
        case 2:
          address = reader.readUint32();
          opIndex = 0;
          break;
        case 4:
          break;
        default:
          break;
      }
      reader.offset = extEnd;
    } else if (opcode < opcodeBase) {
      switch (opcode) {
        case 1:
          entries.push({ address, file: fileStart + file, line, column });
          break;
        case 2: {
          const advance = reader.readULEB128();
          address += minimumInstructionLength * ((opIndex + advance) / maximumOpsPerInstruction | 0);
          opIndex = (opIndex + advance) % maximumOpsPerInstruction;
          break;
        }
        case 3:
          line += reader.readSLEB128();
          break;
        case 4:
          file = reader.readULEB128();
          break;
        case 5:
          column = reader.readULEB128();
          break;
        case 6:
          isStatement = !isStatement;
          break;
        case 7:
          break;
        case 8:
          address += minimumInstructionLength * ((255 - opcodeBase) / lineRange | 0);
          break;
        case 9: {
          const fixedAdvance = reader.readUint16();
          address += fixedAdvance;
          opIndex = 0;
          break;
        }
        default: {
          for (let argIndex = 0; argIndex < (standardOpcodeLengths[opcode - 1] || 0); argIndex++) {
            reader.readULEB128();
          }
          break;
        }
      }
    } else {
      const adjustedOpcode = opcode - opcodeBase;
      const addressAdvance = minimumInstructionLength * ((opIndex + (adjustedOpcode / lineRange | 0)) / maximumOpsPerInstruction | 0);
      address += addressAdvance;
      opIndex = (opIndex + (adjustedOpcode / lineRange | 0)) % maximumOpsPerInstruction;
      line += lineBase + (adjustedOpcode % lineRange);
      entries.push({ address, file: fileStart + file, line, column });
    }
  }
}

// DWARF tags
const DW_TAG_formal_parameter = 0x05;
const DW_TAG_pointer_type = 0x0f;
const DW_TAG_compile_unit = 0x11;
const DW_TAG_structure_type = 0x13;
const DW_TAG_typedef = 0x16;
const DW_TAG_base_type = 0x24;
const DW_TAG_const_type = 0x26;
const DW_TAG_subprogram = 0x2e;
const DW_TAG_variable = 0x34;

// DWARF attributes
const DW_AT_location = 0x02;
const DW_AT_name = 0x03;
const DW_AT_byte_size = 0x0b;
const DW_AT_low_pc = 0x11;
const DW_AT_high_pc = 0x12;
const DW_AT_language = 0x13;
const DW_AT_comp_dir = 0x1b;
const DW_AT_producer = 0x25;
const DW_AT_decl_file = 0x3a;
const DW_AT_decl_line = 0x3b;
const DW_AT_external = 0x3f;
const DW_AT_type = 0x49;
const DW_AT_linkage_name = 0x6e;

// DWARF forms
const DW_FORM_addr = 0x01;
const DW_FORM_block2 = 0x03;
const DW_FORM_block4 = 0x04;
const DW_FORM_data2 = 0x05;
const DW_FORM_data4 = 0x06;
const DW_FORM_data8 = 0x07;
const DW_FORM_string = 0x08;
const DW_FORM_block = 0x09;
const DW_FORM_block1 = 0x0a;
const DW_FORM_data1 = 0x0b;
const DW_FORM_flag = 0x0c;
const DW_FORM_sdata = 0x0d;
const DW_FORM_strp = 0x0e;
const DW_FORM_udata = 0x0f;
const DW_FORM_ref_addr = 0x10;
const DW_FORM_ref1 = 0x11;
const DW_FORM_ref2 = 0x12;
const DW_FORM_ref4 = 0x13;
const DW_FORM_ref8 = 0x14;
const DW_FORM_ref_udata = 0x15;
const DW_FORM_indirect = 0x16;
const DW_FORM_sec_offset = 0x17;
const DW_FORM_exprloc = 0x18;
const DW_FORM_flag_present = 0x19;
const DW_FORM_strx = 0x1a;
const DW_FORM_addrx = 0x1b;
const DW_FORM_ref_sup4 = 0x1c;
const DW_FORM_strp_sup = 0x1d;
const DW_FORM_data16 = 0x1e;
const DW_FORM_line_strp = 0x1f;
const DW_FORM_ref_sig8 = 0x20;
const DW_FORM_implicit_const = 0x21;
const DW_FORM_loclistx = 0x22;
const DW_FORM_rnglistx = 0x23;
const DW_FORM_ref_sup8 = 0x24;
const DW_FORM_strx1 = 0x25;
const DW_FORM_strx2 = 0x26;
const DW_FORM_strx3 = 0x27;
const DW_FORM_strx4 = 0x28;
const DW_FORM_addrx1 = 0x29;
const DW_FORM_addrx2 = 0x2a;
const DW_FORM_addrx3 = 0x2b;
const DW_FORM_addrx4 = 0x2c;

interface AbbrevAttribute {
  attribute: number;
  form: number;
  implicitConst: number;
}

interface AbbrevEntry {
  tag: number;
  hasChildren: boolean;
  attributes: AbbrevAttribute[];
}

function parseAbbrevTable(data: Uint8Array, tableOffset: number): Map<number, AbbrevEntry> {
  const reader = new DwarfReader(data);
  reader.offset = tableOffset;
  const table = new Map<number, AbbrevEntry>();

  while (reader.offset < data.length) {
    const code = reader.readULEB128();
    if (code === 0) {
      break;
    }
    const tag = reader.readULEB128();
    const hasChildren = reader.readUint8() !== 0;
    const attributes: AbbrevAttribute[] = [];

    while (true) {
      const attribute = reader.readULEB128();
      const form = reader.readULEB128();
      if (attribute === 0 && form === 0) {
        break;
      }
      let implicitConst = 0;
      if (form === DW_FORM_implicit_const) {
        implicitConst = reader.readSLEB128();
      }
      attributes.push({ attribute, form, implicitConst });
    }

    table.set(code, { tag, hasChildren, attributes });
  }

  return table;
}

function skipFormValue(reader: DwarfReader, form: number, addressSize: number): void {
  switch (form) {
    case DW_FORM_addr: reader.offset += addressSize; break;
    case DW_FORM_data1: case DW_FORM_ref1: case DW_FORM_flag: reader.offset += 1; break;
    case DW_FORM_data2: case DW_FORM_ref2: reader.offset += 2; break;
    case DW_FORM_data4: case DW_FORM_ref4: case DW_FORM_strp: case DW_FORM_sec_offset:
    case DW_FORM_ref_addr: case DW_FORM_line_strp: case DW_FORM_strp_sup: case DW_FORM_ref_sup4:
      reader.offset += 4; break;
    case DW_FORM_data8: case DW_FORM_ref8: case DW_FORM_ref_sig8: case DW_FORM_ref_sup8:
      reader.offset += 8; break;
    case DW_FORM_data16: reader.offset += 16; break;
    case DW_FORM_sdata: reader.readSLEB128(); break;
    case DW_FORM_udata: case DW_FORM_ref_udata: case DW_FORM_strx: case DW_FORM_addrx:
    case DW_FORM_loclistx: case DW_FORM_rnglistx:
      reader.readULEB128(); break;
    case DW_FORM_string: reader.readNullTerminatedString(); break;
    case DW_FORM_block1: { const len = reader.readUint8(); reader.offset += len; break; }
    case DW_FORM_block2: { const len = reader.readUint16(); reader.offset += len; break; }
    case DW_FORM_block4: { const len = reader.readUint32(); reader.offset += len; break; }
    case DW_FORM_block: case DW_FORM_exprloc: { const len = reader.readULEB128(); reader.offset += len; break; }
    case DW_FORM_flag_present: break;
    case DW_FORM_implicit_const: break;
    case DW_FORM_strx1: case DW_FORM_addrx1: reader.offset += 1; break;
    case DW_FORM_strx2: case DW_FORM_addrx2: reader.offset += 2; break;
    case DW_FORM_strx3: case DW_FORM_addrx3: reader.offset += 3; break;
    case DW_FORM_strx4: case DW_FORM_addrx4: reader.offset += 4; break;
    case DW_FORM_indirect: {
      const actualForm = reader.readULEB128();
      skipFormValue(reader, actualForm, addressSize);
      break;
    }
    default:
      throw new Error(`Unknown DWARF form: 0x${form.toString(16)}`);
  }
}

function readAttrValue(
  reader: DwarfReader,
  form: number,
  addressSize: number,
  debugStr: Uint8Array | undefined,
  debugLineStr: Uint8Array | undefined,
  implicitConst: number,
): string | number | boolean | null {
  switch (form) {
    case DW_FORM_addr: {
      if (addressSize === 4) { return reader.readUint32(); }
      const low = reader.readUint32();
      const high = reader.readUint32();
      return low + high * 0x100000000;
    }
    case DW_FORM_data1: return reader.readUint8();
    case DW_FORM_data2: return reader.readUint16();
    case DW_FORM_data4: return reader.readUint32();
    case DW_FORM_data8: {
      const low = reader.readUint32();
      const high = reader.readUint32();
      return low + high * 0x100000000;
    }
    case DW_FORM_sdata: return reader.readSLEB128();
    case DW_FORM_udata: return reader.readULEB128();
    case DW_FORM_string: return reader.readNullTerminatedString();
    case DW_FORM_strp: {
      const offset = reader.readUint32();
      if (debugStr) { return readNullTerminatedStringAt(debugStr, offset); }
      return null;
    }
    case DW_FORM_line_strp: {
      const offset = reader.readUint32();
      if (debugLineStr) { return readNullTerminatedStringAt(debugLineStr, offset); }
      return null;
    }
    case DW_FORM_flag: return reader.readUint8() !== 0;
    case DW_FORM_flag_present: return true;
    case DW_FORM_sec_offset: return reader.readUint32();
    case DW_FORM_ref1: return reader.readUint8();
    case DW_FORM_ref2: return reader.readUint16();
    case DW_FORM_ref4: return reader.readUint32();
    case DW_FORM_ref_udata: return reader.readULEB128();
    case DW_FORM_ref_addr: return reader.readUint32();
    case DW_FORM_implicit_const: return implicitConst;
    case DW_FORM_strx: case DW_FORM_addrx: case DW_FORM_loclistx: case DW_FORM_rnglistx:
      return reader.readULEB128();
    case DW_FORM_strx1: case DW_FORM_addrx1: return reader.readUint8();
    case DW_FORM_strx2: case DW_FORM_addrx2: return reader.readUint16();
    case DW_FORM_strx4: case DW_FORM_addrx4: return reader.readUint32();
    case DW_FORM_exprloc: case DW_FORM_block: {
      const len = reader.readULEB128();
      const blockStart = reader.offset;
      const wasmLocal = parseLocationBlock(reader.data, blockStart, len);
      reader.offset = blockStart + len;
      return wasmLocal;
    }
    case DW_FORM_block1: {
      const len = reader.readUint8();
      const blockStart = reader.offset;
      const wasmLocal = parseLocationBlock(reader.data, blockStart, len);
      reader.offset = blockStart + len;
      return wasmLocal;
    }
    case DW_FORM_block2: { const len = reader.readUint16(); reader.offset += len; return null; }
    case DW_FORM_block4: { const len = reader.readUint32(); reader.offset += len; return null; }
    case DW_FORM_ref_sig8: case DW_FORM_ref8: { reader.offset += 8; return null; }
    case DW_FORM_data16: { reader.offset += 16; return null; }
    case DW_FORM_strx3: case DW_FORM_addrx3: {
      const byte0 = reader.readUint8();
      const byte1 = reader.readUint8();
      const byte2 = reader.readUint8();
      return byte0 | (byte1 << 8) | (byte2 << 16);
    }
    case DW_FORM_indirect: {
      const actualForm = reader.readULEB128();
      return readAttrValue(reader, actualForm, addressSize, debugStr, debugLineStr, 0);
    }
    default:
      skipFormValue(reader, form, addressSize);
      return null;
  }
}

function parseDebugInfo(
  debugInfoData: Uint8Array,
  debugAbbrevData: Uint8Array,
  debugStr: Uint8Array | undefined,
  debugLineStr: Uint8Array | undefined,
): { units: DwarfCompilationUnit[]; types: Map<number, DwarfTypeInfo> } {
  const reader = new DwarfReader(debugInfoData);
  const compilationUnits: DwarfCompilationUnit[] = [];
  const typeMap = new Map<number, DwarfTypeInfo>();

  while (reader.offset < debugInfoData.length) {
    const unitStart = reader.offset;
    const unitLength = reader.readUint32();
    if (unitLength === 0 || unitLength === 0xffffffff) {
      break;
    }
    const unitEnd = reader.offset + unitLength;
    const version = reader.readUint16();

    let addressSize: number;
    let abbrevOffset: number;

    if (version === 5) {
      const unitType = reader.readUint8();
      addressSize = reader.readUint8();
      abbrevOffset = reader.readUint32();
    } else {
      abbrevOffset = reader.readUint32();
      addressSize = reader.readUint8();
    }

    const abbrevTable = parseAbbrevTable(debugAbbrevData, abbrevOffset);

    let unitName = '';
    let unitProducer = '';
    let unitLanguage = 0;
    let unitCompDir = '';
    const unitFunctions: DwarfFunction[] = [];
    let depth = 0;
    let currentFunction: DwarfFunction | null = null;
    let functionDepth = -1;

    while (reader.offset < unitEnd) {
      const dieOffset = reader.offset;
      const abbrevCode = reader.readULEB128();
      if (abbrevCode === 0) {
        depth--;
        if (currentFunction && depth <= functionDepth) {
          currentFunction = null;
          functionDepth = -1;
        }
        continue;
      }

      const abbrev = abbrevTable.get(abbrevCode);
      if (!abbrev) {
        break;
      }

      const attrs = new Map<number, string | number | boolean | null>();
      for (const attrDef of abbrev.attributes) {
        const value = readAttrValue(reader, attrDef.form, addressSize, debugStr, debugLineStr, attrDef.implicitConst);
        attrs.set(attrDef.attribute, value);
      }

      if (abbrev.tag === DW_TAG_compile_unit) {
        const nameVal = attrs.get(DW_AT_name);
        if (typeof nameVal === 'string') { unitName = nameVal; }
        const producerVal = attrs.get(DW_AT_producer);
        if (typeof producerVal === 'string') { unitProducer = producerVal; }
        const langVal = attrs.get(DW_AT_language);
        if (typeof langVal === 'number') { unitLanguage = langVal; }
        const compDirVal = attrs.get(DW_AT_comp_dir);
        if (typeof compDirVal === 'string') { unitCompDir = compDirVal; }
      }

      if (abbrev.tag === DW_TAG_subprogram) {
        const funcName = attrs.get(DW_AT_name);
        const linkageName = attrs.get(DW_AT_linkage_name);
        const lowPc = attrs.get(DW_AT_low_pc);
        const highPc = attrs.get(DW_AT_high_pc);
        const declFile = attrs.get(DW_AT_decl_file);
        const declLine = attrs.get(DW_AT_decl_line);
        const isExternal = attrs.get(DW_AT_external);

        if (typeof funcName === 'string' || typeof linkageName === 'string') {
          let resolvedHighPc = typeof highPc === 'number' ? highPc : 0;
          const resolvedLowPc = typeof lowPc === 'number' ? lowPc : 0;
          if (resolvedHighPc > 0 && resolvedHighPc < resolvedLowPc) {
            resolvedHighPc = resolvedLowPc + resolvedHighPc;
          }

          const func: DwarfFunction = {
            name: typeof funcName === 'string' ? funcName : (typeof linkageName === 'string' ? linkageName : ''),
            linkageName: typeof linkageName === 'string' ? linkageName : null,
            lowPc: resolvedLowPc,
            highPc: resolvedHighPc,
            declFile: typeof declFile === 'number' ? declFile : 0,
            declLine: typeof declLine === 'number' ? declLine : 0,
            isExternal: isExternal === true,
            parameters: [],
            variables: [],
          };
          unitFunctions.push(func);
          currentFunction = func;
          functionDepth = depth;
        }
      }

      // Parse parameters and local variables that are children of the current function
      if (currentFunction && depth > functionDepth) {
        if (abbrev.tag === DW_TAG_formal_parameter) {
          const paramName = attrs.get(DW_AT_name);
          const location = attrs.get(DW_AT_location);
          if (typeof paramName === 'string') {
            currentFunction.parameters.push({
              name: paramName,
              wasmLocal: extractWasmLocal(location ?? null),
              typeName: null,
            });
          }
        }

        if (abbrev.tag === DW_TAG_variable) {
          const varName = attrs.get(DW_AT_name);
          const location = attrs.get(DW_AT_location);
          if (typeof varName === 'string') {
            currentFunction.variables.push({
              name: varName,
              wasmLocal: extractWasmLocal(location ?? null),
              typeName: null,
            });
          }
        }
      }

      // Collect type DIEs for the type map
      const typeTagMap: Record<number, DwarfTypeInfo['tag']> = {
        [DW_TAG_base_type]: 'base',
        [DW_TAG_pointer_type]: 'pointer',
        [DW_TAG_structure_type]: 'struct',
        [DW_TAG_typedef]: 'typedef',
        [DW_TAG_const_type]: 'const',
      };
      const typeTag = typeTagMap[abbrev.tag];
      if (typeTag) {
        const typeName = attrs.get(DW_AT_name);
        const byteSize = attrs.get(DW_AT_byte_size);
        const typeRef = attrs.get(DW_AT_type);
        typeMap.set(dieOffset, {
          tag: typeTag,
          name: typeof typeName === 'string' ? typeName : null,
          byteSize: typeof byteSize === 'number' ? byteSize : 0,
          referencedType: typeof typeRef === 'number' ? typeRef : null,
        });
      }

      // Track function scope — when we leave the function's children, clear currentFunction
      if (abbrev.hasChildren) {
        depth++;
      }
    }

    compilationUnits.push({
      name: unitName,
      producer: unitProducer,
      language: unitLanguage,
      compDir: unitCompDir,
      functions: unitFunctions,
    });

    reader.offset = unitEnd;
  }

  return { units: compilationUnits, types: typeMap };
}

/**
 * Parses a DWARF location expression block looking for DW_OP_WASM_location (0xED).
 * WASM location encoding: 0xED <type> <index_uleb128>
 * Type 0 = local, Type 1 = global, Type 2 = operand stack.
 * Returns the WASM local index as a negative-encoded number (-1 - localIdx)
 * to distinguish from regular number values, or null if not a WASM location.
 */
function parseLocationBlock(data: Uint8Array, offset: number, length: number): number | null {
  if (length < 2) {
    return null;
  }
  const opCode = data[offset];
  // DW_OP_WASM_location = 0xED
  if (opCode === 0xED) {
    const locationType = data[offset + 1];
    // Decode ULEB128 index
    let index = 0;
    let shift = 0;
    let position = offset + 2;
    while (position < offset + length) {
      const byte = data[position++];
      index |= (byte & 0x7f) << shift;
      shift += 7;
      if ((byte & 0x80) === 0) {
        break;
      }
    }
    // Encode as: -(1 + index) for locals, -(10000 + index) for globals
    if (locationType === 0) {
      return -(1 + index);
    }
    if (locationType === 1) {
      return -(10000 + index);
    }
  }
  return null;
}

/**
 * Extracts a WASM local index from a location attribute value.
 * The value is encoded as -(1 + localIndex) by parseLocationBlock.
 */
function extractWasmLocal(locationValue: string | number | boolean | null): number | null {
  if (typeof locationValue === 'number' && locationValue < 0 && locationValue > -10000) {
    return -(locationValue + 1);
  }
  return null;
}

function readNullTerminatedStringAt(data: Uint8Array, offset: number): string {
  let end = offset;
  while (end < data.length && data[end] !== 0) {
    end++;
  }
  return new TextDecoder().decode(data.slice(offset, end));
}

class DwarfReader {
  data: Uint8Array;
  offset: number;

  constructor(data: Uint8Array) {
    this.data = data;
    this.offset = 0;
  }

  readUint8(): number {
    return this.data[this.offset++];
  }

  readInt8(): number {
    const value = this.data[this.offset++];
    return value > 127 ? value - 256 : value;
  }

  readUint16(): number {
    const value = this.data[this.offset] | (this.data[this.offset + 1] << 8);
    this.offset += 2;
    return value;
  }

  readUint32(): number {
    const value = this.data[this.offset] | (this.data[this.offset + 1] << 8) |
      (this.data[this.offset + 2] << 16) | (this.data[this.offset + 3] << 24);
    this.offset += 4;
    return value >>> 0;
  }

  readULEB128(): number {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      if (this.offset >= this.data.length) {
        break;
      }
      byte = this.data[this.offset++];
      result |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte & 0x80);
    return result >>> 0;
  }

  readSLEB128(): number {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = this.data[this.offset++];
      result |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte & 0x80);
    if (shift < 32 && (byte & 0x40)) {
      result |= -(1 << shift);
    }
    return result;
  }

  readNullTerminatedString(): string {
    const start = this.offset;
    while (this.offset < this.data.length && this.data[this.offset] !== 0) {
      this.offset++;
    }
    const str = new TextDecoder().decode(this.data.slice(start, this.offset));
    if (this.offset < this.data.length) {
      this.offset++;
    }
    return str;
  }

  readBytes(length: number): Uint8Array {
    const bytes = this.data.slice(this.offset, this.offset + length);
    this.offset += length;
    return bytes;
  }
}
