import { Node, Edge, MarkerType } from 'reactflow';
import { MindMapTree } from './types';
import { calculateLayout, getDepthColor } from './layout-engine';
import { getVisibleNodes, getNodeDepth } from './tree-operations';
import { calculateEdgeAnchors, NodeBounds } from './anchor-solver';

export interface FlowData {
  nodes: Node[];
  edges: Edge[];
}

interface EdgeCustomization {
  [edgeId: string]: {
    controlPointOffset: { x: number; y: number };
  };
}

// Convert tree to React Flow nodes and edges
export function treeToFlow(
  tree: MindMapTree,
  selectedNodeId: string | null,
  onNodeClick: (id: string) => void,
  onNodeDoubleClick: (id: string) => void,
  onToggleCollapse: (id: string) => void,
  onTextChange: (id: string, text: string) => void,
  edgeCustomizations: EdgeCustomization = {},
  onEdgeControlPointChange?: (edgeId: string, offset: { x: number; y: number }) => void,
  onEdgeDragStart?: () => void,
  onEdgeDragEnd?: () => void
): FlowData {
  const layout = calculateLayout(tree);
  const visible = getVisibleNodes(tree);
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Create nodes
  visible.forEach(nodeId => {
    const node = tree.nodes[nodeId];
    const layoutNode = layout.get(nodeId);
    
    if (!node || !layoutNode) return;

    const depth = getNodeDepth(tree, nodeId);
    const isRoot = nodeId === tree.rootId;
    const isSelected = nodeId === selectedNodeId;
    const hasChildren = node.children.length > 0;

    nodes.push({
      id: nodeId,
      type: 'mindMapNode',
      position: { x: layoutNode.x, y: layoutNode.y },
      data: {
        id: nodeId,
        text: node.text,
        isRoot,
        isSelected,
        hasChildren,
        collapsed: node.collapsed || false,
        depth,
        color: getDepthColor(depth, node.color),
        direction: node.direction,
        onNodeClick,
        onNodeDoubleClick,
        onToggleCollapse,
        onTextChange,
      },
    });
  });

  // Create edges with dynamic anchors
  visible.forEach(nodeId => {
    const node = tree.nodes[nodeId];
    if (!node || !node.parentId || !visible.has(node.parentId)) return;

    const depth = getNodeDepth(tree, nodeId);
    const color = getDepthColor(depth, node.color);
    const edgeId = `e-${node.parentId}-${nodeId}`;

    // Get node bounds for anchor calculation
    const sourceLayout = layout.get(node.parentId);
    const targetLayout = layout.get(nodeId);
    
    if (!sourceLayout || !targetLayout) return;

    const sourceBounds: NodeBounds = {
      x: sourceLayout.x,
      y: sourceLayout.y,
      width: sourceLayout.width,
      height: sourceLayout.height,
    };

    const targetBounds: NodeBounds = {
      x: targetLayout.x,
      y: targetLayout.y,
      width: targetLayout.width,
      height: targetLayout.height,
    };

    // Calculate dynamic anchor points
    const anchors = calculateEdgeAnchors(sourceBounds, targetBounds);

    edges.push({
      id: edgeId,
      source: node.parentId,
      target: nodeId,
      type: 'adjustable',
      animated: false,
      style: {
        stroke: color,
        strokeWidth: 2,
        opacity: 0.6,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: color,
      },
      data: {
        controlPointOffset: edgeCustomizations[edgeId]?.controlPointOffset || { x: 0, y: 0 },
        onControlPointChange: onEdgeControlPointChange,
        onDragStart: onEdgeDragStart,
        onDragEnd: onEdgeDragEnd,
        // Pass node bounds and calculated anchors
        sourceBounds,
        targetBounds,
        sourceAnchor: anchors.source,
        targetAnchor: anchors.target,
      },
    });
  });

  return { nodes, edges };
}
