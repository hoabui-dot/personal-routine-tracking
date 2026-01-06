import { MindMapTree, MindMapNode, Direction } from './types';

// Create a new empty tree
export function createEmptyTree(): MindMapTree {
  const rootId = '1';
  return {
    rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        text: 'Main Idea',
        children: [],
        color: '#8b5cf6',
      },
    },
  };
}

// Generate unique ID
export function generateId(tree: MindMapTree): string {
  const ids = Object.keys(tree.nodes).map(id => parseInt(id) || 0);
  return String(Math.max(...ids, 0) + 1);
}

// Add child node
export function addChildNode(
  tree: MindMapTree,
  parentId: string,
  text: string = 'New Node'
): MindMapTree {
  const parent = tree.nodes[parentId];
  if (!parent) return tree;

  const newId = generateId(tree);
  
  // Determine direction for new child
  let direction: Direction | undefined;
  if (parentId === tree.rootId) {
    // Alternate children of root between left and right
    const leftCount = parent.children.filter(
      id => tree.nodes[id]?.direction === 'left'
    ).length;
    const rightCount = parent.children.filter(
      id => tree.nodes[id]?.direction === 'right'
    ).length;
    direction = leftCount <= rightCount ? 'left' : 'right';
  } else {
    // Inherit parent's direction
    direction = parent.direction;
  }

  const newNode: MindMapNode = {
    id: newId,
    parentId,
    text,
    children: [],
    direction,
    color: parent.color,
  };

  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [newId]: newNode,
      [parentId]: {
        ...parent,
        children: [...parent.children, newId],
      },
    },
  };
}

// Add sibling node
export function addSiblingNode(
  tree: MindMapTree,
  nodeId: string,
  text: string = 'New Node'
): MindMapTree {
  const node = tree.nodes[nodeId];
  if (!node || !node.parentId) return tree;
  
  return addChildNode(tree, node.parentId, text);
}

// Delete node and its descendants
export function deleteNode(tree: MindMapTree, nodeId: string): MindMapTree {
  const node = tree.nodes[nodeId];
  if (!node || nodeId === tree.rootId) return tree;

  // Collect all descendants
  const toDelete = new Set<string>([nodeId]);
  const collectDescendants = (id: string) => {
    const n = tree.nodes[id];
    if (n) {
      n.children.forEach(childId => {
        toDelete.add(childId);
        collectDescendants(childId);
      });
    }
  };
  collectDescendants(nodeId);

  // Remove from parent's children
  const parent = node.parentId ? tree.nodes[node.parentId] : null;
  const newNodes = { ...tree.nodes };
  
  if (parent) {
    newNodes[parent.id] = {
      ...parent,
      children: parent.children.filter(id => id !== nodeId),
    };
  }

  // Delete all collected nodes
  toDelete.forEach(id => delete newNodes[id]);

  return {
    ...tree,
    nodes: newNodes,
  };
}

// Update node text
export function updateNodeText(
  tree: MindMapTree,
  nodeId: string,
  text: string
): MindMapTree {
  const node = tree.nodes[nodeId];
  if (!node) return tree;

  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [nodeId]: { ...node, text },
    },
  };
}

// Update node position
export function updateNodePosition(
  tree: MindMapTree,
  nodeId: string,
  position: { x: number; y: number }
): MindMapTree {
  const node = tree.nodes[nodeId];
  if (!node) return tree;

  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [nodeId]: { ...node, position },
    },
  };
}

// Toggle collapse state
export function toggleCollapse(tree: MindMapTree, nodeId: string): MindMapTree {
  const node = tree.nodes[nodeId];
  if (!node || node.children.length === 0) return tree;

  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [nodeId]: { ...node, collapsed: !node.collapsed },
    },
  };
}

// Get all visible nodes (respecting collapsed state)
export function getVisibleNodes(tree: MindMapTree): Set<string> {
  const visible = new Set<string>();
  
  const traverse = (nodeId: string) => {
    visible.add(nodeId);
    const node = tree.nodes[nodeId];
    if (node && !node.collapsed) {
      node.children.forEach(childId => traverse(childId));
    }
  };
  
  traverse(tree.rootId);
  return visible;
}

// Get node depth
export function getNodeDepth(tree: MindMapTree, nodeId: string): number {
  let depth = 0;
  let currentId: string | undefined = nodeId;
  
  while (currentId && currentId !== tree.rootId) {
    depth++;
    currentId = tree.nodes[currentId]?.parentId;
  }
  
  return depth;
}

// Navigate to next/previous sibling
export function getAdjacentSibling(
  tree: MindMapTree,
  nodeId: string,
  direction: 'next' | 'prev'
): string | null {
  const node = tree.nodes[nodeId];
  if (!node || !node.parentId) return null;
  
  const parent = tree.nodes[node.parentId];
  if (!parent) return null;
  
  const index = parent.children.indexOf(nodeId);
  if (index === -1) return null;
  
  if (direction === 'next') {
    return parent.children[index + 1] || null;
  } else {
    return parent.children[index - 1] || null;
  }
}

// Export to JSON
export function exportToJSON(tree: MindMapTree): string {
  return JSON.stringify(tree, null, 2);
}

// Import from JSON
export function importFromJSON(json: string): MindMapTree | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed.nodes && parsed.rootId) {
      return parsed as MindMapTree;
    }
    return null;
  } catch {
    return null;
  }
}
