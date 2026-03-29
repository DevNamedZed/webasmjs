import BinaryReader, {
  ModuleInfo,
} from '../src/BinaryReader';
import Disassembler from '../src/Disassembler';
import { parseDwarfDebugInfo } from '../src/DwarfParser';
import type { DwarfDebugInfo } from '../src/DwarfParser';
import { createNameResolver } from './WasmDecompiler';
import type { NameResolver } from './WasmDecompiler';
import { parseSourceMap } from '../src/SourceMapParser';
import type { ParsedSourceMap } from '../src/SourceMapParser';
import {
  buildDwarfFunctionMap,
  buildFieldResolver as buildFieldResolverHelper,
  buildDwarfParameterTypeMap as buildDwarfParamTypeMap,
  buildDwarfLocalNameMap as buildDwarfLocalNames,
  findDwarfFunction as findDwarfFunc,
  getNameSource as getNameSourceHelper,
} from './explorer/dwarf-helpers';
import {
  buildByteRanges,
} from './explorer/ui-helpers';
import {
  formatFileSize as uiFormatFileSize,
  renderInteractiveBytes as uiRenderInteractiveBytes,
} from './explorer/ui-helpers';
import type { ExplorerContext } from './explorer/ui-helpers';
import type { DetailContext } from './explorer/detail-renderers';
import {
  renderModuleDetail as detailRenderModule,
  renderSectionSummary as detailRenderSectionSummary,
  renderImportDetail as detailRenderImport,
  renderExportDetail as detailRenderExport,
} from './explorer/detail-renderers';
import {
  renderFunctionDetail as detailRenderFunction,
} from './explorer/function-renderer';
import {
  renderTypeDetail as detailRenderType,
  renderTableDetail as sectionRenderTable,
  renderMemoryDetail as sectionRenderMemory,
  renderGlobalDetail as sectionRenderGlobal,
  renderStartDetail as sectionRenderStart,
  renderElementDetail as sectionRenderElement,
  renderDataDetail as sectionRenderData,
  renderTagDetail as sectionRenderTag,
  renderCustomSectionDetail as sectionRenderCustomSection,
  renderNameSectionDetail as sectionRenderNameSection,
} from './explorer/section-renderers';
import {
  extractStrings as analysisExtractStrings,
  renderDataSegmentsSummary as analysisRenderDataSegmentsSummary,
  renderStringsView as analysisRenderStringsView,
  renderDebugInfo as analysisRenderDebugInfo,
  searchWat as analysisSearchWat,
} from './explorer/analysis-views';
import {
  renderFeatureDetection as analysisRenderFeatureDetection,
  renderModuleInterface as analysisRenderModuleInterface,
} from './explorer/analysis-features';
import {
  renderSizeAnalysisSummary as metricsRenderSizeAnalysisSummary,
  renderSizeSections as metricsRenderSizeSections,
  renderSizeFunctions as metricsRenderSizeFunctions,
  renderSizeData as metricsRenderSizeData,
  renderProducers as metricsRenderProducers,
  renderInstructionStats as metricsRenderInstructionStats,
} from './explorer/analysis-metrics';
import {
  renderFunctionComplexity as metricsRenderFunctionComplexity,
  renderDeadCode as metricsRenderDeadCode,
} from './explorer/analysis-code';
import type {
  ByteRangeSection,
  ByteRangeMap,
} from './explorer/ui-helpers';
import type { TreeNode } from './explorer/tree-builder';
import type { ExtractedString } from './explorer/analysis-views';
import type { CallGraphData } from './explorer/call-graph';
import type { TreeContext } from './explorer/tree-navigation';
import {
  renderTree as treeRenderTree,
  handleTreeKeydown as treeHandleTreeKeydown,
  selectNode as treeSelectNode,
  navigateToItem as treeNavigateToItem,
  navigateToHashItem as treeNavigateToHashItem,
  restoreFromHash as treeRestoreFromHash,
} from './explorer/tree-navigation';
import {
  buildTree as treeBuildTree,
} from './explorer/tree-builder';

import { buildCallGraph } from './explorer/call-graph';

export default class Explorer {
  private container: HTMLElement;
  private moduleInfo: ModuleInfo | null = null;
  private byteRanges: ByteRangeMap | null = null;
  private rawBytes: Uint8Array | null = null;
  private fileName: string = '';
  private selectedNode: TreeNode | null = null;
  private treeContainer: HTMLElement | null = null;
  private detailContainer: HTMLElement | null = null;
  private breadcrumbBar: HTMLElement | null = null;
  private treeNodes: TreeNode[] = [];
  private disassembler: Disassembler | null = null;
  private cachedFullWat: string | null = null;
  private callGraph: CallGraphData | null = null;
  private cachedStrings: ExtractedString[] | null = null;
  private dwarfInfo: DwarfDebugInfo | null | undefined = undefined;
  private dwarfFunctionMap: Map<number, string> | null = null;
  private nameResolver: NameResolver | null = null;
  private searchQuery: string = '';
  private importedCounts: Record<number, number> = {};
  private readonly textDecoder = new TextDecoder();
  private visibleNodes: TreeNode[] = [];
  private searchInput: HTMLInputElement | null = null;
  private parsedSourceMap: ParsedSourceMap | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderDropZone();
  }

  loadSourceMap(json: string): void {
    this.parsedSourceMap = parseSourceMap(json);
  }

  private computeImportCounts(): void {
    if (!this.moduleInfo) {
      return;
    }
    this.importedCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const importEntry of this.moduleInfo.imports) {
      if (importEntry.kind in this.importedCounts) {
        this.importedCounts[importEntry.kind]++;
      }
    }
  }

  private getImportedCount(kind: number): number {
    return this.importedCounts[kind] || 0;
  }

  private getFunctionName(globalIndex: number): string | null {
    let name: string | null = null;
    if (this.moduleInfo?.nameSection?.functionNames?.has(globalIndex)) {
      name = this.moduleInfo.nameSection.functionNames.get(globalIndex)!;
    } else {
      const dwarfMap = this.getDwarfFunctionMap();
      if (dwarfMap) {
        name = dwarfMap.get(globalIndex) || null;
      }
    }
    if (name && name.startsWith('$')) {
      name = name.slice(1);
    }
    return name;
  }

  private getTreeContext(): TreeContext {
    const explorer = this;
    return {
      get treeNodes() { return explorer.treeNodes; },
      set treeNodes(value) { explorer.treeNodes = value; },
      get visibleNodes() { return explorer.visibleNodes; },
      set visibleNodes(value) { explorer.visibleNodes = value; },
      get selectedNode() { return explorer.selectedNode; },
      set selectedNode(value) { explorer.selectedNode = value; },
      get treeContainer() { return explorer.treeContainer; },
      get breadcrumbBar() { return explorer.breadcrumbBar; },
      get searchQuery() { return explorer.searchQuery; },
      renderTree: () => this.renderTree(),
      renderDetail: (node: TreeNode) => this.renderDetail(node),
      selectNode: (node: TreeNode, hashMode?: 'push' | 'replace' | 'none') => this.selectNode(node, hashMode),
    };
  }

  private getUiContext(): ExplorerContext {
    return {
      navigateToItem: (section, index) => this.navigateToItem(section, index),
      getFunctionName: (globalIndex) => this.getFunctionName(globalIndex),
      getImportedCount: (kind) => this.getImportedCount(kind),
      byteRanges: this.byteRanges,
      rawBytes: this.rawBytes,
      moduleInfo: this.moduleInfo,
    };
  }

  private getDetailContext(): DetailContext {
    return {
      navigateToItem: (section, index) => this.navigateToItem(section, index),
      getFunctionName: (globalIndex) => this.getFunctionName(globalIndex),
      getImportedCount: (kind) => this.getImportedCount(kind),
      byteRanges: this.byteRanges,
      rawBytes: this.rawBytes,
      moduleInfo: this.moduleInfo!,
      detailContainer: this.detailContainer!,
      disassembler: this.disassembler,
      nameResolver: this.nameResolver,
      parsedSourceMap: this.parsedSourceMap,
      cachedFullWat: this.cachedFullWat,
      fileName: this.fileName,
      textDecoder: this.textDecoder,
      getDwarfInfo: () => this.getDwarfInfo(),
      buildFieldResolver: (funcGlobalIndex) => buildFieldResolverHelper(funcGlobalIndex, this.getDwarfInfo(), this.getDwarfFunctionMap()),
      findDwarfFunction: (localFuncIndex) => {
        const dwarfData = this.getDwarfInfo();
        if (!dwarfData || dwarfData.functions.length === 0 || !this.byteRanges) { return null; }
        return findDwarfFunc(localFuncIndex, dwarfData, this.byteRanges, this.rawBytes);
      },
      getCallGraph: () => this.getCallGraph(),
      getNameSource: (globalFuncIndex) => getNameSourceHelper(globalFuncIndex, this.moduleInfo, this.getDwarfFunctionMap()),
      findTopLevelTypeIndex: (flatTypeIndex) => this.findTopLevelTypeIndex(flatTypeIndex),
      getExportTargetSection: (kind) => this.getExportTargetSection(kind),
      getExportTargetItemIndex: (kind, globalIndex) => this.getExportTargetItemIndex(kind, globalIndex),
      setCachedFullWat: (wat) => { this.cachedFullWat = wat; },
      renderInteractiveBytes: (parent, funcIndex) => uiRenderInteractiveBytes(this.getUiContext(), parent, funcIndex),
    };
  }

  private getDwarfFunctionMap(): Map<number, string> | null {
    if (this.dwarfFunctionMap !== null) {
      return this.dwarfFunctionMap;
    }

    const dwarfData = this.getDwarfInfo();
    if (!dwarfData || dwarfData.functions.length === 0 || !this.moduleInfo || !this.byteRanges) {
      return null;
    }

    this.dwarfFunctionMap = buildDwarfFunctionMap(
      dwarfData,
      this.moduleInfo,
      this.byteRanges,
      this.rawBytes,
      this.getImportedCount(0),
    );

    return this.dwarfFunctionMap;
  }

  private buildDwarfParameterTypeMap(): Map<number, Map<number, string>> | null {
    const dwarfData = this.getDwarfInfo();
    if (!dwarfData || dwarfData.functions.length === 0) { return null; }
    const dwarfFuncMap = this.getDwarfFunctionMap();
    if (!dwarfFuncMap || dwarfFuncMap.size === 0) { return null; }
    return buildDwarfParamTypeMap(dwarfData, dwarfFuncMap);
  }

  private buildDwarfLocalNameMap(): Map<number, Map<number, string>> | null {
    const dwarfData = this.getDwarfInfo();
    if (!dwarfData || dwarfData.functions.length === 0) { return null; }
    const dwarfFuncMap = this.getDwarfFunctionMap();
    if (!dwarfFuncMap || dwarfFuncMap.size === 0) { return null; }
    return buildDwarfLocalNames(dwarfData, dwarfFuncMap);
  }

  private getCallGraph(): CallGraphData {
    if (!this.callGraph && this.moduleInfo) {
      this.callGraph = buildCallGraph(this.moduleInfo);
    }
    return this.callGraph!;
  }

  private getDwarfInfo(): DwarfDebugInfo | null {
    if (this.dwarfInfo === undefined) {
      if (this.moduleInfo) {
        this.dwarfInfo = parseDwarfDebugInfo(this.moduleInfo.customSections);
      } else {
        return null;
      }
    }
    return this.dwarfInfo;
  }

  private detectSourceMappingUrl(): void {
    if (!this.moduleInfo) {
      return;
    }

    const sourceMappingSection = this.moduleInfo.customSections.find(
      section => section.name === 'sourceMappingURL'
    );
    if (!sourceMappingSection) {
      return;
    }

    const decoder = this.textDecoder;
    const sourceMapUrl = decoder.decode(sourceMappingSection.data);

    if (sourceMapUrl.startsWith('data:application/json;base64,')) {
      const base64Data = sourceMapUrl.slice('data:application/json;base64,'.length);
      const jsonString = atob(base64Data);
      this.parsedSourceMap = parseSourceMap(jsonString);
    }
  }

  private renderDropZone(): void {
    this.container.innerHTML = '';
    const dropZone = document.createElement('div');
    dropZone.className = 'explorer-drop-zone';

    const icon = document.createElement('div');
    icon.className = 'drop-zone-icon';
    icon.textContent = '\u{1F4C2}';
    dropZone.appendChild(icon);

    const message = document.createElement('div');
    message.className = 'drop-zone-message';
    message.textContent = 'Drop a .wasm file here or click to open';
    dropZone.appendChild(message);

    const hint = document.createElement('div');
    hint.className = 'drop-zone-hint';
    hint.textContent = 'Supports any valid WebAssembly binary';
    dropZone.appendChild(hint);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.wasm';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        this.loadFile(fileInput.files[0]);
      }
    });

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropZone.classList.remove('drag-over');
      if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        this.loadFile(event.dataTransfer.files[0]);
      }
    });

    this.container.appendChild(dropZone);
    this.container.appendChild(fileInput);
  }

  loadBytes(name: string, bytes: Uint8Array): void {
    this.fileName = name;
    this.rawBytes = bytes;
    this.loadModuleFromBytes();
  }

  private async loadFile(file: File): Promise<void> {
    this.fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    this.rawBytes = new Uint8Array(arrayBuffer);
    this.loadModuleFromBytes();
  }

  private loadModuleFromBytes(): void {
    try {
      const reader = new BinaryReader(this.rawBytes!);
      this.moduleInfo = reader.read();
      this.byteRanges = buildByteRanges(this.rawBytes);
      this.disassembler = new Disassembler(this.moduleInfo);
      this.computeImportCounts();
      this.cachedFullWat = null;
      this.callGraph = null;
      this.cachedStrings = null;
      this.dwarfFunctionMap = null;
      const hasDebugSections = this.moduleInfo.customSections.some(
        section => section.name === '.debug_info'
      );
      if (hasDebugSections) {
        this.dwarfInfo = parseDwarfDebugInfo(this.moduleInfo.customSections);
      } else {
        this.dwarfInfo = null;
      }
      const dwarfMap = this.getDwarfFunctionMap();
      const dwarfLocalNames = this.buildDwarfLocalNameMap();
      const dwarfParamTypes = this.buildDwarfParameterTypeMap();
      this.nameResolver = createNameResolver(
        this.moduleInfo,
        dwarfMap ? (globalIndex: number) => dwarfMap.get(globalIndex) || null : undefined,
        dwarfLocalNames ? (funcGlobalIndex: number, localIndex: number) => {
          const funcLocals = dwarfLocalNames.get(funcGlobalIndex);
          return funcLocals?.get(localIndex) || null;
        } : undefined,
        dwarfParamTypes ? (funcGlobalIndex: number, paramIndex: number) => {
          const funcParams = dwarfParamTypes.get(funcGlobalIndex);
          return funcParams?.get(paramIndex) || null;
        } : undefined,
      );

      // Add global variable address resolution from DWARF
      const dwarfGlobalVars = this.dwarfInfo?.globalVariables;
      if (dwarfGlobalVars && dwarfGlobalVars.length > 0) {
        const globalAddrMap = new Map<number, string>();
        for (const globalVar of dwarfGlobalVars) {
          globalAddrMap.set(globalVar.address, globalVar.name);
        }
        this.nameResolver.resolveGlobalAddress = (address: number): string | null => {
          return globalAddrMap.get(address) || null;
        };
      }
      this.parsedSourceMap = null;
      this.detectSourceMappingUrl();
      this.renderExplorer();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.container.innerHTML = '';
      const errorDisplay = document.createElement('div');
      errorDisplay.className = 'explorer-error';
      errorDisplay.textContent = `Failed to parse ${this.fileName}: ${errorMessage}`;

      const retryButton = document.createElement('button');
      retryButton.className = 'explorer-retry-btn';
      retryButton.textContent = 'Load another file';
      retryButton.addEventListener('click', () => this.renderDropZone());

      this.container.appendChild(errorDisplay);
      this.container.appendChild(retryButton);
    }
  }

  private renderExplorer(): void {
    this.container.innerHTML = '';

    const toolbar = document.createElement('div');
    toolbar.className = 'explorer-toolbar';

    const fileLabel = document.createElement('span');
    fileLabel.className = 'explorer-file-label';
    fileLabel.textContent = this.fileName;
    toolbar.appendChild(fileLabel);

    if (this.rawBytes) {
      const sizeLabel = document.createElement('span');
      sizeLabel.className = 'explorer-size-label';
      sizeLabel.textContent = this.formatFileSize(this.rawBytes.length);
      toolbar.appendChild(sizeLabel);
    }

    const loadButton = document.createElement('button');
    loadButton.className = 'explorer-load-btn';
    loadButton.textContent = 'Open file';
    loadButton.addEventListener('click', () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.wasm';
      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files.length > 0) {
          this.loadFile(fileInput.files[0]);
        }
      });
      fileInput.click();
    });
    toolbar.appendChild(loadButton);

    // Source map loading is handled automatically via sourceMappingURL custom section

    const watSearchInput = document.createElement('input');
    watSearchInput.type = 'text';
    watSearchInput.placeholder = 'Search WAT...';
    watSearchInput.className = 'explorer-wat-search';
    watSearchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.searchWat(watSearchInput.value);
      }
    });
    toolbar.appendChild(watSearchInput);

    this.container.appendChild(toolbar);

    const splitView = document.createElement('div');
    splitView.className = 'explorer-split';

    const treePane = document.createElement('div');
    treePane.className = 'explorer-tree-pane';

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Filter tree...';
    this.searchInput.className = 'explorer-tree-search';
    this.searchInput.addEventListener('input', () => {
      this.searchQuery = this.searchInput!.value.toLowerCase().trim();
      this.renderTree();
    });
    this.searchInput.addEventListener('keydown', (event) => this.handleTreeKeydown(event));
    treePane.appendChild(this.searchInput);

    this.treeContainer = document.createElement('div');
    this.treeContainer.className = 'explorer-tree';
    this.treeContainer.tabIndex = 0;
    this.treeContainer.addEventListener('keydown', (event) => this.handleTreeKeydown(event));
    treePane.appendChild(this.treeContainer);

    const detailPane = document.createElement('div');
    detailPane.className = 'explorer-detail-pane';

    this.breadcrumbBar = document.createElement('div');
    this.breadcrumbBar.className = 'explorer-breadcrumbs';
    detailPane.appendChild(this.breadcrumbBar);

    this.detailContainer = document.createElement('div');
    this.detailContainer.className = 'explorer-detail';
    detailPane.appendChild(this.detailContainer);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'explorer-resize-handle';
    this.initExplorerResize(resizeHandle, treePane, splitView);

    splitView.appendChild(treePane);
    splitView.appendChild(resizeHandle);
    splitView.appendChild(detailPane);
    this.container.appendChild(splitView);

    this.buildTree();
    this.renderTree();

    // Always start at root when loading a new file — clear stale hash
    history.replaceState(null, '', '#explorer');
    this.selectNode(this.treeNodes[0], 'none');

    this.container.addEventListener('dragover', (event) => {
      event.preventDefault();
    });
    this.container.addEventListener('drop', (event) => {
      event.preventDefault();
      if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        this.loadFile(event.dataTransfer.files[0]);
      }
    });
  }

  private formatFileSize(bytes: number): string {
    return uiFormatFileSize(bytes);
  }

  private buildTree(): void {
    if (!this.moduleInfo) {
      return;
    }
    this.treeNodes = treeBuildTree({
      moduleInfo: this.moduleInfo,
      fileName: this.fileName,
      getImportedCount: (kind) => this.getImportedCount(kind),
      getFunctionName: (globalIndex) => this.getFunctionName(globalIndex),
    });
  }

  private renderTree(): void {
    treeRenderTree(this.getTreeContext());
  }

  private handleTreeKeydown(event: KeyboardEvent): void {
    treeHandleTreeKeydown(this.getTreeContext(), event);
  }

  private initExplorerResize(handle: HTMLElement, treePane: HTMLElement, splitView: HTMLElement): void {
    let isResizing = false;

    handle.addEventListener('mousedown', (event: MouseEvent) => {
      isResizing = true;
      handle.classList.add('active');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      event.preventDefault();
    });

    document.addEventListener('mousemove', (event: MouseEvent) => {
      if (!isResizing) {
        return;
      }
      const rect = splitView.getBoundingClientRect();
      const position = event.clientX - rect.left;
      const percentage = Math.max(15, Math.min(60, (position / rect.width) * 100));
      treePane.style.width = percentage + '%';
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        handle.classList.remove('active');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  private selectNode(node: TreeNode, hashMode: 'push' | 'replace' | 'none' = 'push'): void {
    treeSelectNode(this.getTreeContext(), node, hashMode);
  }

  navigateToItem(section: string, index: number): void {
    treeNavigateToItem(this.getTreeContext(), section, index);
  }

  navigateToHashItem(section: string, index: number): void {
    treeNavigateToHashItem(this.getTreeContext(), section, index);
  }

  private restoreFromHash(): boolean {
    return treeRestoreFromHash(this.getTreeContext());
  }

  private getExportTargetSection(kind: number): string | null {
    const sectionMap: Record<number, string> = {
      0: 'function',
      1: 'table',
      2: 'memory',
      3: 'global',
      4: 'tag',
    };
    return sectionMap[kind] || null;
  }

  private getExportTargetItemIndex(kind: number, globalIndex: number): number {
    return globalIndex - this.getImportedCount(kind);
  }

  private findTopLevelTypeIndex(flatTypeIndex: number): number {
    if (!this.moduleInfo) {
      return -1;
    }
    let flatCounter = 0;
    for (let topIndex = 0; topIndex < this.moduleInfo.types.length; topIndex++) {
      const typeEntry = this.moduleInfo.types[topIndex];
      if (typeEntry.kind === 'rec') {
        if (flatTypeIndex >= flatCounter && flatTypeIndex < flatCounter + typeEntry.types.length) {
          return topIndex;
        }
        flatCounter += typeEntry.types.length;
      } else {
        if (flatCounter === flatTypeIndex) {
          return topIndex;
        }
        flatCounter++;
      }
    }
    return -1;
  }

  private renderDetail(node: TreeNode): void {
    if (!this.detailContainer || !this.moduleInfo) {
      return;
    }
    this.detailContainer.innerHTML = '';
    const ctx = this.getDetailContext();

    switch (node.section) {
      case 'module':
        detailRenderModule(ctx);
        break;
      case 'types':
      case 'imports':
      case 'functions':
      case 'tables':
      case 'memories':
      case 'globals':
      case 'exports':
      case 'elements':
      case 'data-segments':
        analysisRenderDataSegmentsSummary(ctx);
        break;
      case 'data-segments-unused':
      case 'tags':
      case 'custom-sections':
        detailRenderSectionSummary(ctx, node);
        break;
      case 'type':
        detailRenderType(ctx, node.index);
        break;
      case 'import':
        detailRenderImport(ctx, node.index);
        break;
      case 'function':
        detailRenderFunction(ctx, node.index);
        break;
      case 'table':
        sectionRenderTable(ctx, node.index);
        break;
      case 'memory':
        sectionRenderMemory(ctx, node.index);
        break;
      case 'global':
        sectionRenderGlobal(ctx, node.index);
        break;
      case 'export':
        detailRenderExport(ctx, node.index);
        break;
      case 'start':
        sectionRenderStart(ctx);
        break;
      case 'element':
        sectionRenderElement(ctx, node.index);
        break;
      case 'data':
        sectionRenderData(ctx, node.index);
        break;
      case 'tag':
        sectionRenderTag(ctx, node.index);
        break;
      case 'custom':
        sectionRenderCustomSection(ctx, node.index);
        break;
      case 'name-section':
        sectionRenderNameSection(ctx);
        break;
      case 'size-analysis':
        metricsRenderSizeAnalysisSummary(ctx);
        break;
      case 'size-sections':
        metricsRenderSizeSections(ctx);
        break;
      case 'size-functions':
        metricsRenderSizeFunctions(ctx);
        break;
      case 'size-data':
        metricsRenderSizeData(ctx);
        break;
      case 'strings':
        this.renderStringsView();
        break;
      case 'instruction-stats':
        metricsRenderInstructionStats(ctx);
        break;
      case 'debug-info':
        analysisRenderDebugInfo(ctx);
        break;
      case 'feature-detection':
        analysisRenderFeatureDetection(ctx);
        break;
      case 'module-interface':
        analysisRenderModuleInterface(ctx);
        break;
      case 'function-complexity':
        metricsRenderFunctionComplexity(ctx);
        break;
      case 'dead-code':
        metricsRenderDeadCode(ctx);
        break;
      case 'producers':
        metricsRenderProducers(ctx);
        break;
    }
  }

  private renderStringsView(): void {
    if (!this.moduleInfo) {
      return;
    }
    if (!this.cachedStrings) {
      this.cachedStrings = analysisExtractStrings(this.moduleInfo);
    }
    analysisRenderStringsView(this.cachedStrings, this.getDetailContext());
  }

  private searchWat(query: string): void {
    if (!this.moduleInfo || !this.disassembler || !this.detailContainer || !query.trim()) {
      return;
    }
    analysisSearchWat(query, this.getDetailContext());
  }
}
