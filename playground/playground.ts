import {
  ModuleBuilder,
  PackageBuilder,
  ValueType,
  BlockType,
  ElementType,
  TextModuleWriter,
  BinaryReader,
  parseWat,
  RefType,
  HeapType,
  StructTypeBuilder,
  ArrayTypeBuilder,
  RecGroupBuilder,
  refType,
  refNullType,
  OpCodes,
  mut,
} from '../src/index';

import type { WasmTarget, WasmFeature } from '../src/types';
import { EXAMPLES } from './examples';
import type { ExampleDef } from './examples';

// ─── UI helpers ───

const GROUP_ICONS: Record<string, string> = {
  Basics: '\u{1F44B}',
  Memory: '\u{1F4BE}',
  Globals: '\u{1F30D}',
  Functions: '\u{1F517}',
  'Control Flow': '\u{1F500}',
  Numeric: '\u{1F522}',
  Algorithms: '\u{2699}',
  SIMD: '\u{26A1}',
  'Bulk Memory': '\u{1F4E6}',
  'Post-MVP': '\u{1F680}',
  WAT: '\u{1F4DD}',
  Debug: '\u{1F50D}',
  GC: '\u{267B}',
  Imports: '\u{1F4E5}',
};

// ─── Target ordering for filter comparison ───
const TARGET_ORDER: Record<WasmTarget, number> = {
  mvp: 0,
  '2.0': 1,
  '3.0': 2,
  latest: 3,
};

function getEditor(): HTMLTextAreaElement {
  return document.getElementById('editor') as HTMLTextAreaElement;
}

function appendOutput(el: HTMLElement, text: string, className?: string): void {
  const line = document.createElement('div');
  line.textContent = text;
  if (className) line.className = className;
  el.appendChild(line);
}

let currentExampleKey = 'hello-wasm';
let currentLanguage: 'js' | 'ts' = 'js';

function getImportHeader(imports: string[]): string {
  if (!imports || imports.length === 0) return '';
  const symbolList = imports.join(', ');
  if (currentLanguage === 'ts') {
    return `import { ${symbolList} } from 'webasmjs';\n\n`;
  } else {
    return `const { ${symbolList} } = require('webasmjs');\n\n`;
  }
}

function loadExample(name: string): void {
  const example = EXAMPLES[name];
  if (example) {
    currentExampleKey = name;
    const header = getImportHeader(example.imports);
    getEditor().value = header + example.code;
    document.getElementById('watBody')!.textContent = '';
    document.getElementById('outputBody')!.textContent = '';
    const label = document.getElementById('currentExample');
    if (label) label.textContent = example.label;
  }
}

// ─── Download helper ───

function downloadFile(filename: string, data: Uint8Array | string, mime: string): void {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── WAT pane: render captured modules ───

interface CapturedModule {
  name: string;
  wat: string;
  bytes: Uint8Array;
}

function renderWatPane(modules: CapturedModule[]): void {
  const watBody = document.getElementById('watBody')!;
  watBody.textContent = '';

  for (const mod of modules) {
    const card = document.createElement('div');
    card.className = 'module-card';

    // Header with name + download buttons
    const header = document.createElement('div');
    header.className = 'module-card-header';

    const name = document.createElement('span');
    name.className = 'module-card-name';
    name.textContent = mod.name;
    header.appendChild(name);

    const actions = document.createElement('span');
    actions.className = 'module-card-actions';

    const watBtn = document.createElement('button');
    watBtn.className = 'download-btn';
    watBtn.textContent = '\u2193 .wat';
    watBtn.addEventListener('click', () => {
      downloadFile(mod.name + '.wat', mod.wat, 'text/plain');
    });
    actions.appendChild(watBtn);

    if (mod.bytes.length > 0) {
      const wasmBtn = document.createElement('button');
      wasmBtn.className = 'download-btn';
      wasmBtn.textContent = '\u2193 .wasm';
      wasmBtn.addEventListener('click', () => {
        downloadFile(mod.name + '.wasm', mod.bytes, 'application/wasm');
      });
      actions.appendChild(wasmBtn);
    }

    header.appendChild(actions);
    card.appendChild(header);

    // WAT text
    const watText = document.createElement('div');
    watText.className = 'module-card-wat';
    if (mod.wat.startsWith('Error:')) {
      watText.classList.add('error');
    }
    watText.textContent = mod.wat;
    card.appendChild(watText);

    watBody.appendChild(card);
  }
}

// ─── Resize handler ───

function initResizeHandler(): void {
  const handle = document.getElementById('resizeHandle')!;
  const main = document.querySelector('.main') as HTMLElement;
  const editorPane = document.querySelector('.editor-pane') as HTMLElement;
  const watPane = document.getElementById('watPane') as HTMLElement;
  let isResizing = false;

  handle.addEventListener('mousedown', (e: MouseEvent) => {
    isResizing = true;
    handle.classList.add('active');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isResizing) return;
    const rect = main.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const leftPct = Math.max(20, Math.min(80, (x / rect.width) * 100));
    editorPane.style.flex = 'none';
    watPane.style.width = (100 - leftPct) + '%';
    editorPane.style.width = leftPct + '%';
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

// ─── Example picker dialog ───

function openExamplePicker(): void {
  const existing = document.getElementById('exampleDialog');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'exampleDialog';
  overlay.className = 'dialog-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'dialog';

  // Header with search + filter dropdown
  const header = document.createElement('div');
  header.className = 'dialog-header';
  header.innerHTML = '<h2>Examples</h2>';

  const searchRow = document.createElement('div');
  searchRow.className = 'dialog-search-row';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search examples...';
  searchInput.className = 'dialog-search';
  searchRow.appendChild(searchInput);

  // Compact filter dropdown
  const filterSelect = document.createElement('select');
  filterSelect.className = 'filter-select';

  // "All" option
  const allOpt = document.createElement('option');
  allOpt.value = '';
  allOpt.textContent = 'All';
  filterSelect.appendChild(allOpt);

  // Target group
  const targetGroup = document.createElement('optgroup');
  targetGroup.label = 'Target';
  for (const t of ['mvp', '2.0', '3.0', 'latest'] as WasmTarget[]) {
    const opt = document.createElement('option');
    opt.value = 'target:' + t;
    opt.textContent = t === 'mvp' ? 'MVP' : t === 'latest' ? 'Latest' : 'Wasm ' + t;
    targetGroup.appendChild(opt);
  }
  filterSelect.appendChild(targetGroup);

  // Feature group — only features actually used by examples
  const usedFeatures = new Set<WasmFeature>();
  for (const example of Object.values(EXAMPLES)) {
    for (const f of example.features) usedFeatures.add(f);
  }
  const featureGroup = document.createElement('optgroup');
  featureGroup.label = 'Feature';
  for (const f of Array.from(usedFeatures).sort()) {
    const opt = document.createElement('option');
    opt.value = 'feature:' + f;
    opt.textContent = f;
    featureGroup.appendChild(opt);
  }
  filterSelect.appendChild(featureGroup);

  searchRow.appendChild(filterSelect);
  header.appendChild(searchRow);
  dialog.appendChild(header);

  // Build grouped grid
  const body = document.createElement('div');
  body.className = 'dialog-body';

  const groups = new Map<string, { key: string; example: ExampleDef }[]>();
  for (const [key, example] of Object.entries(EXAMPLES)) {
    const group = example.group;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push({ key, example });
  }

  const allCards: HTMLElement[] = [];
  const allSections: HTMLElement[] = [];

  for (const [groupName, items] of groups) {
    const section = document.createElement('div');
    section.className = 'dialog-group';
    section.dataset.group = groupName;

    const groupHeader = document.createElement('div');
    groupHeader.className = 'dialog-group-header';
    const icon = GROUP_ICONS[groupName] || '';
    groupHeader.textContent = `${icon}  ${groupName}`;
    section.appendChild(groupHeader);

    const grid = document.createElement('div');
    grid.className = 'dialog-grid';

    for (const item of items) {
      const card = document.createElement('button');
      card.className = 'dialog-card';
      if (item.key === currentExampleKey) card.classList.add('active');
      card.dataset.key = item.key;
      card.dataset.search = `${item.example.label} ${item.example.description} ${groupName}`.toLowerCase();
      card.dataset.target = item.example.target;
      card.dataset.features = item.example.features.join(',');

      const title = document.createElement('div');
      title.className = 'dialog-card-title';
      title.textContent = item.example.label;
      card.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'dialog-card-desc';
      desc.textContent = item.example.description;
      card.appendChild(desc);

      // Metadata badges
      if (item.example.target !== 'mvp' || item.example.features.length > 0) {
        const meta = document.createElement('div');
        meta.className = 'dialog-card-meta';

        if (item.example.target !== 'mvp') {
          const targetBadge = document.createElement('span');
          targetBadge.className = 'card-target';
          targetBadge.textContent = item.example.target;
          meta.appendChild(targetBadge);
        }

        for (const feat of item.example.features) {
          const featBadge = document.createElement('span');
          featBadge.className = 'card-feature';
          featBadge.textContent = feat;
          meta.appendChild(featBadge);
        }

        card.appendChild(meta);
      }

      card.addEventListener('click', () => {
        loadExample(item.key);
        overlay.remove();
      });

      grid.appendChild(card);
      allCards.push(card);
    }

    section.appendChild(grid);
    body.appendChild(section);
    allSections.push(section);
  }

  dialog.appendChild(body);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Filter logic
  function applyFilters(): void {
    const q = searchInput.value.toLowerCase().trim();
    const filterVal = filterSelect.value;

    for (const card of allCards) {
      const searchMatch = !q || card.dataset.search!.includes(q);

      let filterMatch = true;
      if (filterVal.startsWith('target:')) {
        const selectedTarget = filterVal.slice(7) as WasmTarget;
        const cardTarget = card.dataset.target as WasmTarget;
        filterMatch = TARGET_ORDER[cardTarget] <= TARGET_ORDER[selectedTarget];
      } else if (filterVal.startsWith('feature:')) {
        const selectedFeature = filterVal.slice(8);
        const cardFeatures = card.dataset.features ? card.dataset.features.split(',') : [];
        filterMatch = cardFeatures.includes(selectedFeature);
      }

      (card as HTMLElement).style.display = searchMatch && filterMatch ? '' : 'none';
    }
    for (const section of allSections) {
      const visibleCards = section.querySelectorAll('.dialog-card:not([style*="display: none"])');
      (section as HTMLElement).style.display = visibleCards.length > 0 ? '' : 'none';
    }
  }

  searchInput.addEventListener('input', applyFilters);
  filterSelect.addEventListener('change', applyFilters);

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Close on Escape
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
    }
  };
  document.addEventListener('keydown', onKey);

  // Focus search
  setTimeout(() => searchInput.focus(), 50);
}

// All symbols available to playground examples
const ALL_SYMBOLS = [
  'ModuleBuilder', 'PackageBuilder', 'ValueType', 'BlockType', 'ElementType',
  'TextModuleWriter', 'BinaryReader', 'parseWat',
  'RefType', 'HeapType', 'StructTypeBuilder', 'ArrayTypeBuilder',
  'RecGroupBuilder', 'refType', 'refNullType', 'OpCodes', 'mut',
];

// Expose library globally for eval'd code
(window as any).webasmjs = {
  ModuleBuilder,
  PackageBuilder,
  ValueType,
  BlockType,
  ElementType,
  TextModuleWriter,
  BinaryReader,
  parseWat,
  RefType,
  HeapType,
  StructTypeBuilder,
  ArrayTypeBuilder,
  RecGroupBuilder,
  refType,
  refNullType,
  OpCodes,
  mut,
};

async function run(): Promise<void> {
  const outputBody = document.getElementById('outputBody')!;
  const watBody = document.getElementById('watBody')!;
  outputBody.textContent = '';
  watBody.textContent = '';

  let code = getEditor().value;

  // Strip any import/require header that was prepended for display
  code = code.replace(/^(?:import\s+\{[^}]+\}\s+from\s+['"]webasmjs['"];\s*|const\s+\{[^}]+\}\s*=\s*require\(['"]webasmjs['"]\);\s*)\n*/m, '');

  // Expand output pane if collapsed
  document.getElementById('outputPane')!.classList.remove('collapsed');

  // Capture log calls -> output pane
  const log = (msg: any) => {
    appendOutput(outputBody, String(msg));
  };

  // Intercept ModuleBuilder to capture WAT + bytes
  const wasm = (window as any).webasmjs;
  const OrigModuleBuilder = wasm.ModuleBuilder;
  const captured = new WeakSet();
  const capturedModules: CapturedModule[] = [];

  function captureModule(mod: ModuleBuilder): void {
    if (captured.has(mod)) return;
    captured.add(mod);
    const name = (mod as any)._name || 'module';
    try {
      const wat = mod.toString();
      let bytes = new Uint8Array();
      try { bytes = mod.toBytes(); } catch (_) {}
      capturedModules.push({ name, wat, bytes });
    } catch (e: any) {
      capturedModules.push({ name, wat: 'Error: ' + e.message, bytes: new Uint8Array() });
    }
  }

  const patchedClass = class extends OrigModuleBuilder {
    async instantiate(imports?: WebAssembly.Imports) {
      captureModule(this);
      return super.instantiate(imports);
    }
    toBytes(): Uint8Array {
      captureModule(this);
      return super.toBytes();
    }
  };
  wasm.ModuleBuilder = patchedClass;

  // Also wrap parseWat so its returned ModuleBuilder gets captured
  const origParseWat = wasm.parseWat;
  wasm.parseWat = (...args: any[]) => {
    const mod = origParseWat(...args);
    const origInstantiate = mod.instantiate.bind(mod);
    const origToBytes = mod.toBytes.bind(mod);
    mod.instantiate = (imports?: WebAssembly.Imports) => {
      captureModule(mod);
      return origInstantiate(imports);
    };
    mod.toBytes = () => {
      captureModule(mod);
      return origToBytes();
    };
    return mod;
  };

  try {
    const destructure = `const { ${ALL_SYMBOLS.join(', ')} } = webasmjs;`;
    const asyncFn = new Function('log', 'webasmjs', `return (async () => {\n${destructure}\n${code}\n})();`);
    await asyncFn(log, wasm);
    appendOutput(outputBody, '--- Done ---', 'success');
  } catch (e: any) {
    appendOutput(outputBody, 'Error: ' + e.message, 'error');
    if (e.stack) {
      appendOutput(outputBody, e.stack, 'error');
    }
  } finally {
    wasm.ModuleBuilder = OrigModuleBuilder;
    wasm.parseWat = origParseWat;
    // Render all captured modules into WAT pane
    renderWatPane(capturedModules);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('examplesBtn')!.addEventListener('click', openExamplePicker);
  document.getElementById('runBtn')!.addEventListener('click', run);

  // Collapsible panels
  document.getElementById('watToggle')!.addEventListener('click', () => {
    document.getElementById('watPane')!.classList.toggle('collapsed');
  });
  document.getElementById('outputToggle')!.addEventListener('click', () => {
    document.getElementById('outputPane')!.classList.toggle('collapsed');
  });

  // Output clear
  document.getElementById('outputClear')!.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('outputBody')!.textContent = '';
  });

  // Language toggle (JS/TS)
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = (btn as HTMLElement).dataset.lang as 'js' | 'ts';
      if (lang === currentLanguage) return;
      currentLanguage = lang;
      document.querySelectorAll('.lang-btn').forEach((b) => {
        b.classList.toggle('active', (b as HTMLElement).dataset.lang === lang);
      });
      if (currentExampleKey) {
        loadExample(currentExampleKey);
      }
    });
  });

  // Resize handler
  initResizeHandler();

  // Ctrl/Cmd+Enter to run
  getEditor().addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      run();
    }
  });

  // Load default example
  loadExample('hello-wasm');
});
