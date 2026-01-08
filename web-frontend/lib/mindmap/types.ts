// Core data model for mind map
export interface MindMapNode {
  id: string;
  parentId?: string;
  text: string;
  htmlContent?: string; // Rich text HTML content
  children: string[];
  collapsed?: boolean;
  direction?: 'left' | 'right';
  color?: string;
  position?: { x: number; y: number }; // Custom position (overrides auto-layout)
}

export interface MindMapTree {
  nodes: Record<string, MindMapNode>;
  rootId: string;
}

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HistoryState {
  tree: MindMapTree;
  timestamp: number;
}

export type Direction = 'left' | 'right';
