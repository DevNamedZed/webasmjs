import type { ModuleInfo, TypeInfo, FuncTypeInfo } from '../../src/BinaryReader';
import {
  EXPORT_KIND_NAMES,
  getValueTypeName,
  formatFuncType,
  flattenTypes,
} from './wasm-types';

export interface TreeNode {
  label: string;
  section: string;
  index: number;
  children?: TreeNode[];
  expanded?: boolean;
  tooltip?: string;
  icon?: TreeIcon;
  heatColor?: string;
}

export interface TreeIcon {
  faClass: string;
  color: string;
}

export const TREE_ICONS: Record<string, TreeIcon> = {
  'module': { faClass: 'fa-solid fa-cube', color: '#cba6f7' },
  'types': { faClass: 'fa-solid fa-shapes', color: '#89b4fa' },
  'imports': { faClass: 'fa-solid fa-arrow-right-to-bracket', color: '#94e2d5' },
  'functions': { faClass: 'fa-solid fa-code', color: '#a6e3a1' },
  'tables': { faClass: 'fa-solid fa-table-cells', color: '#f9e2af' },
  'memories': { faClass: 'fa-solid fa-memory', color: '#fab387' },
  'globals': { faClass: 'fa-solid fa-globe', color: '#74c7ec' },
  'exports': { faClass: 'fa-solid fa-arrow-right-from-bracket', color: '#89dceb' },
  'elements': { faClass: 'fa-solid fa-list-ol', color: '#f2cdcd' },
  'data-segments': { faClass: 'fa-solid fa-database', color: '#eba0ac' },
  'tags': { faClass: 'fa-solid fa-tag', color: '#f38ba8' },
  'custom-sections': { faClass: 'fa-solid fa-puzzle-piece', color: '#6c7086' },
  'name-section': { faClass: 'fa-solid fa-font', color: '#b4befe' },
  'size-analysis': { faClass: 'fa-solid fa-chart-pie', color: '#89b4fa' },
  'instruction-stats': { faClass: 'fa-solid fa-hashtag', color: '#cba6f7' },
  'debug-info': { faClass: 'fa-solid fa-bug', color: '#f38ba8' },
  'strings': { faClass: 'fa-solid fa-quote-left', color: '#a6e3a1' },
  'feature-detection': { faClass: 'fa-solid fa-microchip', color: '#94e2d5' },
  'module-interface': { faClass: 'fa-solid fa-plug', color: '#89dceb' },
  'function-complexity': { faClass: 'fa-solid fa-chart-line', color: '#fab387' },
  'dead-code': { faClass: 'fa-solid fa-skull', color: '#585b70' },
  'producers': { faClass: 'fa-solid fa-industry', color: '#6c7086' },
};

export interface BuildTreeDependencies {
  moduleInfo: ModuleInfo;
  fileName: string;
  getImportedCount: (kind: number) => number;
  getFunctionName: (globalIndex: number) => string | null;
}

export function formatTypeLabel(typeEntry: TypeInfo): string {
  if (typeEntry.kind === 'func') {
    return `func ${formatFuncType(typeEntry)}`;
  }
  if (typeEntry.kind === 'struct') {
    return `struct (${typeEntry.fields.length} fields)`;
  }
  if (typeEntry.kind === 'array') {
    const mutStr = typeEntry.mutable ? 'mut ' : '';
    return `array (${mutStr}${getValueTypeName(typeEntry.elementType)})`;
  }
  return typeEntry.kind;
}

export function buildTree(dependencies: BuildTreeDependencies): TreeNode[] {
  const { moduleInfo, fileName, getImportedCount, getFunctionName } = dependencies;
  const moduleNode = moduleInfo;

  const root: TreeNode = {
    label: fileName,
    section: 'module',
    index: -1,
    icon: TREE_ICONS['module'],
    expanded: true,
    children: [],
  };

  if (moduleNode.types.length > 0) {
    const typesNode: TreeNode = {
      label: `Types (${moduleNode.types.length})`,
      section: 'types',
      index: -1,
      icon: TREE_ICONS['types'],
      expanded: false,
      children: [],
    };
    let flatIndex = 0;
    for (let typeIndex = 0; typeIndex < moduleNode.types.length; typeIndex++) {
      const typeEntry = moduleNode.types[typeIndex];
      if (typeEntry.kind === 'rec') {
        const recNode: TreeNode = {
          label: `type ${flatIndex}: rec (${typeEntry.types.length} types)`,
          section: 'type',
          index: typeIndex,
          children: [],
        };
        for (let innerIndex = 0; innerIndex < typeEntry.types.length; innerIndex++) {
          recNode.children!.push({
            label: `type ${flatIndex}: ${formatTypeLabel(typeEntry.types[innerIndex])}`,
            section: 'type',
            index: typeIndex,
          });
          flatIndex++;
        }
        typesNode.children!.push(recNode);
      } else {
        typesNode.children!.push({
          label: `type ${flatIndex}: ${formatTypeLabel(typeEntry)}`,
          section: 'type',
          index: typeIndex,
        });
        flatIndex++;
      }
    }
    root.children!.push(typesNode);
  }

  if (moduleNode.imports.length > 0) {
    const importsNode: TreeNode = {
      label: `Imports (${moduleNode.imports.length})`,
      section: 'imports',
      index: -1,
      icon: TREE_ICONS['imports'],
      expanded: false,
      children: moduleNode.imports.map((importEntry, importIndex) => {
        let importTip = `${importEntry.moduleName}.${importEntry.fieldName}`;
        if (importEntry.typeIndex !== undefined) {
          importTip += `\ntype ${importEntry.typeIndex}`;
        }
        if (importEntry.memoryType) {
          importTip += `\npages: ${importEntry.memoryType.initial}..${importEntry.memoryType.maximum ?? ''}`;
        }
        return {
          label: `"${importEntry.moduleName}"."${importEntry.fieldName}" (${EXPORT_KIND_NAMES[importEntry.kind] || 'unknown'})`,
          section: 'import',
          index: importIndex,
          tooltip: importTip,
        };
      }),
    };
    root.children!.push(importsNode);
  }

  if (moduleNode.functions.length > 0) {
    const importedFuncCount = getImportedCount(0);
    const allFlatTypes = flattenTypes(moduleNode);
    const maxBodySize = moduleNode.functions.reduce((max, func) => Math.max(max, func.body.length), 1);
    const functionsNode: TreeNode = {
      label: `Functions (${moduleNode.functions.length})`,
      section: 'functions',
      index: -1,
      icon: TREE_ICONS['functions'],
      expanded: false,
      children: moduleNode.functions.map((funcEntry, funcIndex) => {
        const globalIndex = importedFuncCount + funcIndex;
        const funcName = getFunctionName(globalIndex);
        let tipSignature = '';
        if (funcEntry.typeIndex < allFlatTypes.length && allFlatTypes[funcEntry.typeIndex].kind === 'func') {
          tipSignature = formatFuncType(allFlatTypes[funcEntry.typeIndex] as FuncTypeInfo);
        }
        const totalLocals = funcEntry.locals.reduce((sum, local) => sum + local.count, 0);
        const label = funcName ? funcName : `func_${globalIndex}`;
        const sizeRatio = funcEntry.body.length / maxBodySize;
        let heatColor: string | undefined;
        if (sizeRatio > 0.7) {
          heatColor = '#f38ba8';
        } else if (sizeRatio > 0.4) {
          heatColor = '#fab387';
        } else if (sizeRatio > 0.15) {
          heatColor = '#f9e2af';
        }
        return {
          label,
          section: 'function' as const,
          index: funcIndex,
          tooltip: `func ${globalIndex}\n${tipSignature}\n${funcEntry.body.length} bytes, ${totalLocals} locals`,
          heatColor,
        };
      }).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
    };
    root.children!.push(functionsNode);
  }

  if (moduleNode.tables.length > 0) {
    const importedTableCount = getImportedCount(1);
    const tablesNode: TreeNode = {
      label: `Tables (${moduleNode.tables.length})`,
      section: 'tables',
      index: -1,
      icon: TREE_ICONS['tables'],
      expanded: false,
      children: moduleNode.tables.map((tableEntry, tableIndex) => ({
        label: `table ${importedTableCount + tableIndex}: ${getValueTypeName(tableEntry.elementType)} (${tableEntry.initial}..${tableEntry.maximum ?? ''})`,
        section: 'table',
        index: tableIndex,
      })),
    };
    root.children!.push(tablesNode);
  }

  if (moduleNode.memories.length > 0) {
    const importedMemCount = getImportedCount(2);
    const memoriesNode: TreeNode = {
      label: `Memories (${moduleNode.memories.length})`,
      section: 'memories',
      index: -1,
      icon: TREE_ICONS['memories'],
      expanded: false,
      children: moduleNode.memories.map((memoryEntry, memIndex) => {
        const flags: string[] = [];
        if (memoryEntry.shared) { flags.push('shared'); }
        if (memoryEntry.memory64) { flags.push('memory64'); }
        const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
        return {
          label: `memory ${importedMemCount + memIndex}: ${memoryEntry.initial}..${memoryEntry.maximum ?? ''}${flagStr}`,
          section: 'memory',
          index: memIndex,
        };
      }),
    };
    root.children!.push(memoriesNode);
  }

  if (moduleNode.globals.length > 0) {
    const importedGlobalCount = getImportedCount(3);
    const globalsNode: TreeNode = {
      label: `Globals (${moduleNode.globals.length})`,
      section: 'globals',
      index: -1,
      icon: TREE_ICONS['globals'],
      expanded: false,
      children: moduleNode.globals.map((globalEntry, globalIndex) => {
        const globalIdx = importedGlobalCount + globalIndex;
        const globalName = moduleNode.nameSection?.globalNames?.get(globalIdx);
        const mutStr = globalEntry.mutable ? 'mut ' : '';
        const globalLabel = globalName || `global_${globalIdx}`;
        return {
          label: `${globalLabel}: ${mutStr}${getValueTypeName(globalEntry.valueType)}`,
          section: 'global',
          index: globalIndex,
        };
      }),
    };
    root.children!.push(globalsNode);
  }

  if (moduleNode.exports.length > 0) {
    const exportsNode: TreeNode = {
      label: `Exports (${moduleNode.exports.length})`,
      section: 'exports',
      index: -1,
      icon: TREE_ICONS['exports'],
      expanded: false,
      children: moduleNode.exports.map((exportEntry, exportIndex) => ({
        label: `"${exportEntry.name}" -> ${EXPORT_KIND_NAMES[exportEntry.kind] || 'unknown'} ${exportEntry.index}`,
        section: 'export',
        index: exportIndex,
        tooltip: `${EXPORT_KIND_NAMES[exportEntry.kind] || 'unknown'} index ${exportEntry.index}`,
      })),
    };
    root.children!.push(exportsNode);
  }

  if (moduleNode.start !== null) {
    root.children!.push({
      label: `Start (func ${moduleNode.start})`,
      section: 'start',
      index: moduleNode.start,
    });
  }

  if (moduleNode.elements.length > 0) {
    const elementsNode: TreeNode = {
      label: `Elements (${moduleNode.elements.length})`,
      section: 'elements',
      index: -1,
      icon: TREE_ICONS['elements'],
      expanded: false,
      children: moduleNode.elements.map((elementEntry, elemIndex) => {
        const passiveLabel = elementEntry.passive ? 'passive' : `table ${elementEntry.tableIndex}`;
        return {
          label: `elem ${elemIndex}: ${passiveLabel} (${elementEntry.functionIndices.length} entries)`,
          section: 'element',
          index: elemIndex,
        };
      }),
    };
    root.children!.push(elementsNode);
  }

  if (moduleNode.data.length > 0) {
    const dataNode: TreeNode = {
      label: `Data (${moduleNode.data.length})`,
      section: 'data-segments',
      index: -1,
      icon: TREE_ICONS['data-segments'],
      expanded: false,
      children: moduleNode.data.map((dataEntry, dataIndex) => {
        const passiveLabel = dataEntry.passive ? 'passive' : `memory ${dataEntry.memoryIndex}`;
        return {
          label: `data ${dataIndex}: ${passiveLabel} (${dataEntry.data.length} bytes)`,
          section: 'data',
          index: dataIndex,
        };
      }),
    };
    root.children!.push(dataNode);
  }

  if (moduleNode.tags.length > 0) {
    const tagsNode: TreeNode = {
      label: `Tags (${moduleNode.tags.length})`,
      section: 'tags',
      index: -1,
      icon: TREE_ICONS['tags'],
      expanded: false,
      children: moduleNode.tags.map((tagEntry, tagIndex) => ({
        label: `tag ${tagIndex}: type ${tagEntry.typeIndex}`,
        section: 'tag',
        index: tagIndex,
      })),
    };
    root.children!.push(tagsNode);
  }

  if (moduleNode.customSections.length > 0) {
    const customNode: TreeNode = {
      label: `Custom Sections (${moduleNode.customSections.length})`,
      section: 'custom-sections',
      index: -1,
      icon: TREE_ICONS['custom-sections'],
      expanded: false,
      children: moduleNode.customSections.map((customEntry, customIndex) => ({
        label: `"${customEntry.name}" (${customEntry.data.length} bytes)`,
        section: 'custom',
        index: customIndex,
      })),
    };
    root.children!.push(customNode);
  }

  if (moduleNode.nameSection) {
    root.children!.push({
      label: 'Name Section',
      section: 'name-section',
      index: -1,
      icon: TREE_ICONS['name-section'],
    });
  }

  {
    const sizeChildren: TreeNode[] = [
      { label: 'Section Breakdown', section: 'size-sections', index: -1 },
    ];
    if (moduleNode.functions.length > 0) {
      sizeChildren.push({ label: 'Function Sizes', section: 'size-functions', index: -1 });
    }
    if (moduleNode.data.length > 0) {
      sizeChildren.push({ label: 'Data Segment Sizes', section: 'size-data', index: -1 });
    }
    root.children!.push({
      label: 'Size Analysis',
      section: 'size-analysis',
      index: -1,
      icon: TREE_ICONS['size-analysis'],
      children: sizeChildren,
    });
  }

  root.children!.push({
    label: 'Instruction Statistics',
    section: 'instruction-stats',
    index: -1,
    icon: TREE_ICONS['instruction-stats'],
  });

  const hasDebugSections = moduleNode.customSections.some(
    section => section.name.startsWith('.debug_')
  );
  if (hasDebugSections) {
    root.children!.push({
      label: 'Debug Info',
      section: 'debug-info',
      index: -1,
      icon: TREE_ICONS['debug-info'],
    });
  }

  if (moduleNode.data.length > 0) {
    root.children!.push({
      label: 'Strings',
      section: 'strings',
      index: -1,
      icon: TREE_ICONS['strings'],
    });
  }

  root.children!.push({
    label: 'Features',
    section: 'feature-detection',
    index: -1,
    icon: TREE_ICONS['feature-detection'],
  });

  root.children!.push({
    label: 'Module Interface',
    section: 'module-interface',
    index: -1,
    icon: TREE_ICONS['module-interface'],
  });

  root.children!.push({
    label: 'Function Complexity',
    section: 'function-complexity',
    index: -1,
    icon: TREE_ICONS['function-complexity'],
  });

  root.children!.push({
    label: 'Dead Code',
    section: 'dead-code',
    index: -1,
    icon: TREE_ICONS['dead-code'],
  });

  const hasProducers = moduleNode.customSections.some(section => section.name === 'producers');
  if (hasProducers) {
    root.children!.push({
      label: 'Producers',
      section: 'producers',
      index: -1,
      icon: TREE_ICONS['producers'],
    });
  }

  return [root];
}
