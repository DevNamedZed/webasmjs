import InstructionDecoder from '../../src/InstructionDecoder';
import type { DetailContext } from './detail-renderers';
import {
  appendHeading,
  appendSubheading,
  createInfoTable,
  addInfoRow,
} from './ui-helpers';
import {
  EXPORT_KIND_NAMES,
  formatFuncType,
  flattenTypes,
} from './wasm-types';

export function renderFeatureDetection(context: DetailContext): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const importedFuncCount = context.getImportedCount(0);

  appendHeading(detail, 'Features & Target');

  const featureOpcodes = new Map<string, string[]>();
  const featureFunctions = new Map<string, Set<number>>();

  for (let funcIndex = 0; funcIndex < moduleInfo.functions.length; funcIndex++) {
    const func = moduleInfo.functions[funcIndex];
    const instructions = func.instructions || InstructionDecoder.decodeFunctionBody(func.body);
    const globalIndex = importedFuncCount + funcIndex;

    for (const instruction of instructions) {
      const feature = instruction.opCode.feature;
      if (feature) {
        if (!featureOpcodes.has(feature)) {
          featureOpcodes.set(feature, []);
        }
        const opcodes = featureOpcodes.get(feature)!;
        if (!opcodes.includes(instruction.opCode.mnemonic)) {
          opcodes.push(instruction.opCode.mnemonic);
        }
        if (!featureFunctions.has(feature)) {
          featureFunctions.set(feature, new Set());
        }
        featureFunctions.get(feature)!.add(globalIndex);
      }
    }
  }

  const structuralChecks: { name: string; detected: boolean; detail: string }[] = [
    { name: 'multi-value', detected: moduleInfo.types.some(t => t.kind === 'func' && t.returnTypes.length > 1), detail: 'Functions with multiple return values' },
    { name: 'gc', detected: moduleInfo.types.some(t => t.kind === 'struct' || t.kind === 'array' || t.kind === 'rec'), detail: 'Struct/array/rec types' },
    { name: 'shared-memory', detected: moduleInfo.memories.some(m => m.shared) || moduleInfo.imports.some(i => i.memoryType?.shared), detail: 'Shared linear memory' },
    { name: 'memory64', detected: moduleInfo.memories.some(m => m.memory64) || moduleInfo.imports.some(i => i.memoryType?.memory64), detail: '64-bit memory addressing' },
    { name: 'exception-handling', detected: moduleInfo.tags.length > 0 || moduleInfo.imports.some(i => i.kind === 4), detail: 'Tags for exception handling' },
  ];

  const targetFeatures = new Map<string, string>();
  const targetFeaturesSection = moduleInfo.customSections.find(section => section.name === 'target_features');
  if (targetFeaturesSection) {
    try {
      const data = targetFeaturesSection.data;
      let offset = 0;
      const readULEB = (): number => { let r = 0, s = 0, b: number; do { b = data[offset++]; r |= (b & 0x7f) << s; s += 7; } while (b & 0x80); return r >>> 0; };
      const readStr = (): string => { const len = readULEB(); const str = context.textDecoder.decode(data.slice(offset, offset + len)); offset += len; return str; };
      const prefixLabels: Record<number, string> = { 0x2b: 'used', 0x2d: 'disallowed', 0x3d: 'required' };
      const count = readULEB();
      for (let idx = 0; idx < count; idx++) {
        const prefix = data[offset++];
        const name = readStr();
        targetFeatures.set(name, prefixLabels[prefix] || 'unknown');
      }
    } catch {
      // ignore parse failures
    }
  }

  const allFeatureNames = new Set<string>();
  for (const name of featureOpcodes.keys()) { allFeatureNames.add(name); }
  for (const check of structuralChecks) { if (check.detected) { allFeatureNames.add(check.name); } }
  for (const name of targetFeatures.keys()) { allFeatureNames.add(name); }

  const postMvpFeatures = new Set<string>();
  for (const name of allFeatureNames) { postMvpFeatures.add(name); }
  for (const name of targetFeatures.keys()) { postMvpFeatures.add(name); }

  let specLevel = 'MVP (1.0)';
  const hasGcFeatures = postMvpFeatures.has('gc') || postMvpFeatures.has('function-references') || postMvpFeatures.has('reference-types');
  const hasThreads = postMvpFeatures.has('atomics') || postMvpFeatures.has('shared-memory');
  const hasSIMD = postMvpFeatures.has('simd128') || postMvpFeatures.has('simd') || postMvpFeatures.has('relaxed-simd');
  const hasExceptions = postMvpFeatures.has('exception-handling');

  if (hasGcFeatures) {
    specLevel = 'Wasm 3.0 (GC)';
  } else if (hasThreads || hasSIMD || hasExceptions) {
    specLevel = 'Wasm 2.0+';
  } else if (postMvpFeatures.size > 0) {
    specLevel = 'Wasm 2.0';
  }

  const summaryTable = createInfoTable();
  addInfoRow(summaryTable, 'Spec level', specLevel);
  addInfoRow(summaryTable, 'Detected features', String(featureOpcodes.size));
  addInfoRow(summaryTable, 'Structural features', String(structuralChecks.filter(check => check.detected).length));
  if (targetFeatures.size > 0) {
    addInfoRow(summaryTable, 'Target features', String(targetFeatures.size));
  }
  detail.appendChild(summaryTable);

  if (allFeatureNames.size === 0) {
    return;
  }

  appendSubheading(detail, 'Detected Features');

  const grid = document.createElement('div');
  grid.className = 'feature-grid';

  for (const featureName of Array.from(allFeatureNames).sort()) {
    const card = document.createElement('div');
    card.className = 'feature-card';

    const header = document.createElement('div');
    header.className = 'feature-card-header';

    const nameEl = document.createElement('span');
    nameEl.className = 'feature-card-name';
    nameEl.textContent = featureName;
    header.appendChild(nameEl);

    const targetStatus = targetFeatures.get(featureName);
    if (targetStatus) {
      const badge = document.createElement('span');
      badge.className = 'feature-badge feature-badge-' + targetStatus;
      badge.textContent = targetStatus;
      header.appendChild(badge);
    }

    card.appendChild(header);

    const opcodes = featureOpcodes.get(featureName);
    const funcSet = featureFunctions.get(featureName);
    const structCheck = structuralChecks.find(check => check.name === featureName && check.detected);

    if (funcSet && funcSet.size > 0) {
      const stat = document.createElement('a');
      stat.className = 'feature-card-stat feature-card-expand';
      stat.href = '#';
      stat.textContent = `${funcSet.size} function${funcSet.size > 1 ? 's' : ''}`;

      const funcListContainer = document.createElement('div');
      funcListContainer.className = 'feature-card-funclist';
      funcListContainer.style.display = 'none';

      const sortedFuncIndices = Array.from(funcSet).sort((indexA, indexB) => indexA - indexB);
      const maxShow = 15;
      for (let displayIdx = 0; displayIdx < Math.min(sortedFuncIndices.length, maxShow); displayIdx++) {
        const globalIdx = sortedFuncIndices[displayIdx];
        const localIdx = globalIdx - importedFuncCount;
        const displayName = context.getFunctionName(globalIdx) || `func_${globalIdx}`;
        const funcLink = document.createElement('a');
        funcLink.className = 'callgraph-node';
        funcLink.textContent = displayName;
        funcLink.href = '#';
        funcLink.addEventListener('click', (clickEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          if (localIdx >= 0) {
            context.navigateToItem('function', localIdx);
          }
        });
        funcListContainer.appendChild(funcLink);
      }
      if (sortedFuncIndices.length > maxShow) {
        const moreLabel = document.createElement('span');
        moreLabel.className = 'callgraph-more';
        moreLabel.textContent = `+${sortedFuncIndices.length - maxShow} more`;
        funcListContainer.appendChild(moreLabel);
      }

      stat.addEventListener('click', (clickEvent) => {
        clickEvent.preventDefault();
        const isVisible = funcListContainer.style.display !== 'none';
        funcListContainer.style.display = isVisible ? 'none' : 'flex';
      });

      card.appendChild(stat);
      card.appendChild(funcListContainer);
    }

    if (opcodes && opcodes.length > 0) {
      const opcodeList = document.createElement('div');
      opcodeList.className = 'feature-card-opcodes';
      opcodeList.textContent = opcodes.slice(0, 8).join(', ') + (opcodes.length > 8 ? ` (+${opcodes.length - 8} more)` : '');
      card.appendChild(opcodeList);
    }

    if (structCheck) {
      const structNote = document.createElement('div');
      structNote.className = 'feature-card-stat';
      structNote.textContent = structCheck.detail;
      card.appendChild(structNote);
    }

    grid.appendChild(card);
  }

  detail.appendChild(grid);
}

export function renderModuleInterface(context: DetailContext): void {
  const detail = context.detailContainer;
  const moduleInfo = context.moduleInfo;
  const flatTypes = flattenTypes(moduleInfo);

  appendHeading(detail, 'Module Interface');

  const summaryTable = createInfoTable();
  addInfoRow(summaryTable, 'Imports', String(moduleInfo.imports.length));
  addInfoRow(summaryTable, 'Exports', String(moduleInfo.exports.length));
  detail.appendChild(summaryTable);

  const columnsContainer = document.createElement('div');
  columnsContainer.className = 'func-detail-columns';
  columnsContainer.style.alignItems = 'start';

  const leftCol = document.createElement('div');
  const rightCol = document.createElement('div');

  const importsHeading = document.createElement('h3');
  importsHeading.className = 'detail-subheading';
  importsHeading.style.padding = '0';
  importsHeading.textContent = `Imports (${moduleInfo.imports.length})`;
  leftCol.appendChild(importsHeading);

  if (moduleInfo.imports.length > 0) {
    const importTable = createInfoTable();
    const sortedImports = moduleInfo.imports.map((entry, index) => ({ entry, index }));
    sortedImports.sort((a, b) => a.entry.fieldName.localeCompare(b.entry.fieldName));
    for (const { entry: importEntry, index: importIndex } of sortedImports) {
      const kindName = EXPORT_KIND_NAMES[importEntry.kind] || 'unknown';
      let signature = '';
      if (importEntry.kind === 0 && importEntry.typeIndex !== undefined && importEntry.typeIndex < flatTypes.length) {
        const typeEntry = flatTypes[importEntry.typeIndex];
        if (typeEntry.kind === 'func') {
          signature = ' ' + formatFuncType(typeEntry);
        }
      }

      const row = document.createElement('div');
      row.className = 'detail-info-row';

      const nameLink = document.createElement('a');
      nameLink.className = 'detail-info-link module-interface-name';
      nameLink.textContent = importEntry.fieldName;
      nameLink.title = `${importEntry.moduleName}.${importEntry.fieldName}`;
      nameLink.href = '#';
      nameLink.addEventListener('click', (event) => {
        event.preventDefault();
        context.navigateToItem('import', importIndex);
      });
      row.appendChild(nameLink);

      if (importEntry.kind === 0 && importEntry.typeIndex !== undefined && signature) {
        const topLevelTypeIdx = context.findTopLevelTypeIndex(importEntry.typeIndex);
        const sigLink = document.createElement('a');
        sigLink.className = 'detail-info-link';
        sigLink.style.flex = '1';
        sigLink.textContent = `${kindName}${signature}`;
        sigLink.href = '#';
        sigLink.addEventListener('click', (event) => {
          event.preventDefault();
          context.navigateToItem('type', topLevelTypeIdx);
        });
        row.appendChild(sigLink);
      } else {
        const valueElement = document.createElement('span');
        valueElement.className = 'detail-info-value';
        valueElement.textContent = `${kindName}${signature}`;
        row.appendChild(valueElement);
      }

      importTable.appendChild(row);
    }
    leftCol.appendChild(importTable);
  }

  const exportsHeading = document.createElement('h3');
  exportsHeading.className = 'detail-subheading';
  exportsHeading.style.padding = '0';
  exportsHeading.textContent = `Exports (${moduleInfo.exports.length})`;
  rightCol.appendChild(exportsHeading);

  if (moduleInfo.exports.length > 0) {
    const exportTable = createInfoTable();
    const sortedExports = moduleInfo.exports.map((entry, index) => ({ entry, index }));
    sortedExports.sort((a, b) => a.entry.name.localeCompare(b.entry.name));
    for (const { entry: exportEntry, index: exportIndex } of sortedExports) {
      const kindName = EXPORT_KIND_NAMES[exportEntry.kind] || 'unknown';
      let signature = '';
      const targetSection = context.getExportTargetSection(exportEntry.kind);
      const targetItemIndex = context.getExportTargetItemIndex(exportEntry.kind, exportEntry.index);

      if (exportEntry.kind === 0) {
        const importedFuncCount = context.getImportedCount(0);
        const localFuncIndex = exportEntry.index - importedFuncCount;
        if (localFuncIndex >= 0 && localFuncIndex < moduleInfo.functions.length) {
          const funcEntry = moduleInfo.functions[localFuncIndex];
          if (funcEntry.typeIndex < flatTypes.length) {
            const typeEntry = flatTypes[funcEntry.typeIndex];
            if (typeEntry.kind === 'func') {
              signature = ' ' + formatFuncType(typeEntry);
            }
          }
        }
      }

      const row = document.createElement('div');
      row.className = 'detail-info-row';

      const navSection = (targetSection && targetItemIndex >= 0) ? targetSection : 'export';
      const navIndex = (targetSection && targetItemIndex >= 0) ? targetItemIndex : exportIndex;

      const nameLink = document.createElement('a');
      nameLink.className = 'detail-info-link module-interface-name';
      nameLink.textContent = exportEntry.name;
      nameLink.title = exportEntry.name;
      nameLink.href = '#';
      nameLink.addEventListener('click', (event) => {
        event.preventDefault();
        context.navigateToItem(navSection, navIndex);
      });
      row.appendChild(nameLink);

      if (exportEntry.kind === 0 && signature) {
        const importedFuncCount = context.getImportedCount(0);
        const localFuncIndex = exportEntry.index - importedFuncCount;
        if (localFuncIndex >= 0 && localFuncIndex < moduleInfo.functions.length) {
          const funcEntry = moduleInfo.functions[localFuncIndex];
          const topLevelTypeIdx = context.findTopLevelTypeIndex(funcEntry.typeIndex);
          const sigLink = document.createElement('a');
          sigLink.className = 'detail-info-link';
          sigLink.style.flex = '1';
          sigLink.textContent = `${kindName}${signature}`;
          sigLink.href = '#';
          sigLink.addEventListener('click', (event) => {
            event.preventDefault();
            context.navigateToItem('type', topLevelTypeIdx);
          });
          row.appendChild(sigLink);
        } else {
          const valueElement = document.createElement('span');
          valueElement.className = 'detail-info-value';
          valueElement.textContent = `${kindName}${signature}`;
          row.appendChild(valueElement);
        }
      } else {
        const valueElement = document.createElement('span');
        valueElement.className = 'detail-info-value';
        valueElement.textContent = `${kindName}${signature}`;
        row.appendChild(valueElement);
      }

      exportTable.appendChild(row);
    }
    rightCol.appendChild(exportTable);
  }

  columnsContainer.appendChild(leftCol);
  columnsContainer.appendChild(rightCol);
  detail.appendChild(columnsContainer);
}
