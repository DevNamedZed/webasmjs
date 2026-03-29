import type { TreeNode } from './tree-builder';

export interface TreeContext {
  treeNodes: TreeNode[];
  visibleNodes: TreeNode[];
  selectedNode: TreeNode | null;
  treeContainer: HTMLElement | null;
  breadcrumbBar: HTMLElement | null;
  searchQuery: string;
  renderTree(): void;
  renderDetail(node: TreeNode): void;
  selectNode(node: TreeNode, hashMode?: 'push' | 'replace' | 'none'): void;
}

export function matchesSearch(node: TreeNode, searchQuery: string): boolean {
  if (!searchQuery) {
    return true;
  }
  if (node.label.toLowerCase().includes(searchQuery)) {
    return true;
  }
  if (node.children) {
    return node.children.some(child => matchesSearch(child, searchQuery));
  }
  return false;
}

export function renderTree(context: TreeContext): void {
  if (!context.treeContainer) {
    return;
  }
  context.treeContainer.innerHTML = '';
  context.visibleNodes = [];
  for (const node of context.treeNodes) {
    renderTreeNode(context, context.treeContainer, node, 0);
  }
}

export function renderTreeNode(context: TreeContext, parent: HTMLElement, node: TreeNode, depth: number): void {
  if (!matchesSearch(node, context.searchQuery)) {
    return;
  }

  const row = document.createElement('div');
  row.className = 'tree-row';
  if (context.selectedNode === node) {
    row.classList.add('selected');
  }
  row.style.paddingLeft = `${8 + depth * 16}px`;
  if (node.tooltip) {
    row.title = node.tooltip;
  }

  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = node.expanded || (context.searchQuery.length > 0 && hasChildren);

  if (hasChildren) {
    const chevron = document.createElement('span');
    chevron.className = 'tree-chevron';
    chevron.textContent = isExpanded ? '\u25BE' : '\u25B8';
    chevron.addEventListener('click', (event) => {
      event.stopPropagation();
      node.expanded = !node.expanded;
      context.renderTree();
    });
    row.appendChild(chevron);
  } else {
    const spacer = document.createElement('span');
    spacer.className = 'tree-chevron-spacer';
    row.appendChild(spacer);
  }

  if (node.icon) {
    const iconEl = document.createElement('i');
    iconEl.className = `tree-icon ${node.icon.faClass}`;
    iconEl.style.color = node.icon.color;
    row.appendChild(iconEl);
  }

  const label = document.createElement('span');
  label.className = 'tree-label';
  label.textContent = node.label;
  if (node.heatColor) {
    label.style.color = node.heatColor;
  }
  row.appendChild(label);

  row.addEventListener('click', () => {
    if (hasChildren && !context.searchQuery) {
      node.expanded = !node.expanded;
    }
    context.selectNode(node);
  });

  parent.appendChild(row);
  context.visibleNodes.push(node);

  if (hasChildren && isExpanded) {
    for (const child of node.children!) {
      renderTreeNode(context, parent, child, depth + 1);
    }
  }
}

export function handleTreeKeydown(context: TreeContext, event: KeyboardEvent): void {
  if (!context.visibleNodes.length) {
    return;
  }

  const currentIndex = context.selectedNode ? context.visibleNodes.indexOf(context.selectedNode) : -1;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    const nextIndex = Math.min(currentIndex + 1, context.visibleNodes.length - 1);
    context.selectNode(context.visibleNodes[nextIndex]);
    scrollSelectedIntoView(context);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    const prevIndex = Math.max(currentIndex - 1, 0);
    context.selectNode(context.visibleNodes[prevIndex]);
    scrollSelectedIntoView(context);
  } else if (event.key === 'ArrowRight' && context.selectedNode) {
    event.preventDefault();
    if (context.selectedNode.children && !context.selectedNode.expanded) {
      context.selectedNode.expanded = true;
      context.renderTree();
    }
  } else if (event.key === 'ArrowLeft' && context.selectedNode) {
    event.preventDefault();
    if (context.selectedNode.children && context.selectedNode.expanded) {
      context.selectedNode.expanded = false;
      context.renderTree();
    }
  } else if (event.key === 'Enter' && context.selectedNode) {
    event.preventDefault();
    context.renderDetail(context.selectedNode);
  }
}

export function scrollSelectedIntoView(context: TreeContext): void {
  if (!context.treeContainer) {
    return;
  }
  const selectedRow = context.treeContainer.querySelector('.tree-row.selected');
  if (selectedRow) {
    selectedRow.scrollIntoView({ block: 'nearest' });
  }
}

export function selectNode(context: TreeContext, node: TreeNode, hashMode: 'push' | 'replace' | 'none' = 'push'): void {
  context.selectedNode = node;
  context.renderTree();
  renderBreadcrumbs(context, node);
  context.renderDetail(node);
  if (hashMode !== 'none') {
    updateHash(node, hashMode === 'push');
  }
}

export function navigateToItem(context: TreeContext, section: string, index: number): void {
  const node = findNode(context.treeNodes, section, index);
  if (node) {
    expandParents(context.treeNodes, node);
    selectNode(context, node, 'push');
  }
}

export function navigateToHashItem(context: TreeContext, section: string, index: number): void {
  const node = findNode(context.treeNodes, section, index);
  if (node) {
    expandParents(context.treeNodes, node);
    selectNode(context, node, 'none');
  }
}

export function renderBreadcrumbs(context: TreeContext, node: TreeNode): void {
  if (!context.breadcrumbBar) {
    return;
  }
  const path = findPathToNode(context.treeNodes, node);
  if (path.length === 0) {
    return;
  }

  const breadcrumbBar = context.breadcrumbBar;
  breadcrumbBar.innerHTML = '';

  for (let pathIndex = 0; pathIndex < path.length; pathIndex++) {
    const pathNode = path[pathIndex];
    if (pathIndex > 0) {
      const separator = document.createElement('span');
      separator.className = 'breadcrumb-separator';
      separator.textContent = ' > ';
      breadcrumbBar.appendChild(separator);
    }

    if (pathIndex < path.length - 1) {
      const link = document.createElement('a');
      link.className = 'breadcrumb-link';
      link.textContent = pathNode.label;
      link.href = '#';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        selectNode(context, pathNode);
      });
      breadcrumbBar.appendChild(link);
    } else {
      const current = document.createElement('span');
      current.className = 'breadcrumb-current';
      current.textContent = pathNode.label;
      breadcrumbBar.appendChild(current);
    }
  }
}

export function findPathToNode(nodes: TreeNode[], target: TreeNode): TreeNode[] {
  for (const node of nodes) {
    if (node === target) {
      return [node];
    }
    if (node.children) {
      const childPath = findPathToNode(node.children, target);
      if (childPath.length > 0) {
        return [node, ...childPath];
      }
    }
  }
  return [];
}

export function restoreFromHash(context: TreeContext): boolean {
  const hash = location.hash.replace(/^#/, '');
  const parts = hash.split('/');
  if (parts.length >= 3 && parts[0] === 'explorer') {
    const section = parts[1];
    const index = parseInt(parts[2], 10);
    if (!isNaN(index)) {
      const node = findNode(context.treeNodes, section, index);
      if (node) {
        expandParents(context.treeNodes, node);
        selectNode(context, node, 'none');
        return true;
      }
    }
  }
  return false;
}

export function updateHash(node: TreeNode, push: boolean = true): void {
  const hash = node.section === 'module' ? '#explorer' : `#explorer/${node.section}/${node.index}`;
  if (push) {
    history.pushState(null, '', hash);
  } else {
    history.replaceState(null, '', hash);
  }
}

export function findNode(nodes: TreeNode[], section: string, index: number): TreeNode | null {
  for (const node of nodes) {
    if (node.section === section && node.index === index) {
      return node;
    }
    if (node.children) {
      const found = findNode(node.children, section, index);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function expandParents(nodes: TreeNode[], target: TreeNode): boolean {
  for (const node of nodes) {
    if (node === target) {
      return true;
    }
    if (node.children) {
      if (expandParents(node.children, target)) {
        node.expanded = true;
        return true;
      }
    }
  }
  return false;
}
