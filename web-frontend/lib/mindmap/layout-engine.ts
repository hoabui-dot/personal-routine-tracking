import { MindMapTree, LayoutNode } from './types';
import { getVisibleNodes } from './tree-operations';

const HORIZONTAL_SPACING = 280;
const VERTICAL_SPACING = 80;
const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;

interface SubtreeSize {
  width: number;
  height: number;
}

// Calculate layout for all visible nodes
export function calculateLayout(tree: MindMapTree): Map<string, LayoutNode> {
  const layout = new Map<string, LayoutNode>();
  const visible = getVisibleNodes(tree);
  
  // Root node at center (use custom position if available)
  const rootNode = tree.nodes[tree.rootId];
  const rootPosition = rootNode?.position || { x: 0, y: 0 };
  layout.set(tree.rootId, {
    id: tree.rootId,
    x: rootPosition.x,
    y: rootPosition.y,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  });

  const root = tree.nodes[tree.rootId];
  if (!root) return layout;

  // Separate children by direction
  const leftChildren = root.children.filter(
    id => visible.has(id) && tree.nodes[id]?.direction === 'left'
  );
  const rightChildren = root.children.filter(
    id => visible.has(id) && tree.nodes[id]?.direction === 'right'
  );

  // Layout left side
  layoutBranch(tree, leftChildren, -HORIZONTAL_SPACING, 0, 'left', layout, visible);
  
  // Layout right side
  layoutBranch(tree, rightChildren, HORIZONTAL_SPACING, 0, 'right', layout, visible);

  return layout;
}

// Layout a branch (recursive)
function layoutBranch(
  tree: MindMapTree,
  nodeIds: string[],
  x: number,
  parentY: number,
  direction: 'left' | 'right',
  layout: Map<string, LayoutNode>,
  visible: Set<string>
): number {
  if (nodeIds.length === 0) return 0;

  // Calculate total height needed for all siblings
  const subtreeSizes = nodeIds.map(id => calculateSubtreeSize(tree, id, visible));
  const totalHeight = subtreeSizes.reduce((sum, size) => sum + size.height, 0) +
    (nodeIds.length - 1) * VERTICAL_SPACING;

  let currentY = parentY - totalHeight / 2;

  nodeIds.forEach((nodeId, index) => {
    const node = tree.nodes[nodeId];
    if (!node) return;

    const subtreeHeight = subtreeSizes[index].height;
    const nodeY = currentY + subtreeHeight / 2;

    // Use custom position if available, otherwise use calculated position
    const position = node.position || { x, y: nodeY };
    layout.set(nodeId, {
      id: nodeId,
      x: position.x,
      y: position.y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });

    // Layout children if not collapsed
    if (!node.collapsed && node.children.length > 0) {
      const visibleChildren = node.children.filter(id => visible.has(id));
      const childX = direction === 'left' 
        ? x - HORIZONTAL_SPACING 
        : x + HORIZONTAL_SPACING;
      
      layoutBranch(tree, visibleChildren, childX, nodeY, direction, layout, visible);
    }

    currentY += subtreeHeight + VERTICAL_SPACING;
  });

  return totalHeight;
}

// Calculate the size of a subtree
function calculateSubtreeSize(
  tree: MindMapTree,
  nodeId: string,
  visible: Set<string>
): SubtreeSize {
  const node = tree.nodes[nodeId];
  if (!node || !visible.has(nodeId)) {
    return { width: 0, height: 0 };
  }

  // If collapsed or no children, just return node size
  if (node.collapsed || node.children.length === 0) {
    return { width: NODE_WIDTH, height: NODE_HEIGHT };
  }

  // Calculate children sizes
  const visibleChildren = node.children.filter(id => visible.has(id));
  const childSizes = visibleChildren.map(id => calculateSubtreeSize(tree, id, visible));
  
  const totalChildHeight = childSizes.reduce((sum, size) => sum + size.height, 0) +
    (visibleChildren.length - 1) * VERTICAL_SPACING;

  return {
    width: NODE_WIDTH + HORIZONTAL_SPACING,
    height: Math.max(NODE_HEIGHT, totalChildHeight),
  };
}

// Get depth-based color
export function getDepthColor(depth: number, baseColor?: string): string {
  if (baseColor) return baseColor;
  
  const colors = [
    '#8b5cf6', // purple - root
    '#3b82f6', // blue - level 1
    '#10b981', // green - level 2
    '#f59e0b', // amber - level 3
    '#ef4444', // red - level 4
    '#ec4899', // pink - level 5
  ];
  
  return colors[Math.min(depth, colors.length - 1)];
}
