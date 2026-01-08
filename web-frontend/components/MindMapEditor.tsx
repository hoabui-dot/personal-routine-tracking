'use client';

import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeTypes,
  EdgeTypes,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import { useTheme } from '../contexts/ThemeContext';
import { RichTextMindMapNode } from './mindmap/RichTextMindMapNode';
import { AdjustableEdge } from './mindmap/AdjustableEdge';
import { MindMapToolbar } from './mindmap/MindMapToolbar';
import { MindMapTree } from '@/lib/mindmap/types';
import {
  createEmptyTree,
  addChildNode,
  addSiblingNode,
  deleteNode,
  updateNodeText,
  updateNodePosition,
  toggleCollapse,
  exportToJSON,
  importFromJSON,
  getAdjacentSibling,
} from '@/lib/mindmap/tree-operations';
import { treeToFlow } from '@/lib/mindmap/flow-converter';
import { HistoryManager } from '@/lib/mindmap/history';

interface MindMapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

// Parse initial content
function parseInitialContent(content: string): MindMapTree {
  if (!content || content === '<p></p>') {
    return createEmptyTree();
  }

  try {
    const parsed = JSON.parse(content);
    
    // Check if it's the new format with edgeCustomizations (legacy)
    if (parsed.tree) {
      const imported = importFromJSON(JSON.stringify(parsed.tree));
      return imported || createEmptyTree();
    }
    
    // Old format - just the tree
    const imported = importFromJSON(content);
    return imported || createEmptyTree();
  } catch {
    return createEmptyTree();
  }
}

// Main editor component
const MindMapEditorInner: React.FC<MindMapEditorProps> = ({ content, onChange }) => {
  const { theme } = useTheme();
  const { fitView } = useReactFlow();
  
  // Initialize tree and history
  const initialTree = useMemo(() => parseInitialContent(content), [content]);
  const [tree, setTree] = useState<MindMapTree>(initialTree);
  const historyRef = useRef<HistoryManager>(new HistoryManager(tree));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [, forceUpdate] = useState(0);

  // Auto-select root node on mount
  useEffect(() => {
    if (!selectedNodeId && tree.rootId) {
      setSelectedNodeId(tree.rootId);
    }
  }, [tree.rootId, selectedNodeId]);

  // Save to parent component
  const saveTree = useCallback(
    (newTree: MindMapTree) => {
      onChange(exportToJSON(newTree));
    },
    [onChange]
  );

  // Update tree with history
  const updateTree = useCallback(
    (newTree: MindMapTree) => {
      setTree(newTree);
      historyRef.current.push(newTree);
      saveTree(newTree);
    },
    [saveTree]
  );

  // Node operations
  const handleAddChild = useCallback(() => {
    if (!selectedNodeId) return;
    const newTree = addChildNode(tree, selectedNodeId);
    updateTree(newTree);
  }, [tree, selectedNodeId, updateTree]);

  const handleAddSibling = useCallback(() => {
    if (!selectedNodeId) return;
    const newTree = addSiblingNode(tree, selectedNodeId);
    updateTree(newTree);
  }, [tree, selectedNodeId, updateTree]);

  const handleDelete = useCallback(() => {
    if (!selectedNodeId) return;
    const newTree = deleteNode(tree, selectedNodeId);
    updateTree(newTree);
    setSelectedNodeId(null);
  }, [tree, selectedNodeId, updateTree]);

  const handleTextChange = useCallback(
    (nodeId: string, text: string, html?: string) => {
      const newTree = updateNodeText(tree, nodeId, text, html);
      updateTree(newTree);
    },
    [tree, updateTree]
  );

  const handleToggleCollapse = useCallback(
    (nodeId: string) => {
      const newTree = toggleCollapse(tree, nodeId);
      updateTree(newTree);
    },
    [tree, updateTree]
  );

  // Handle node drag
  const handleNodeDragStop = useCallback(
    (_: any, node: any) => {
      const newTree = updateNodePosition(tree, node.id, node.position);
      updateTree(newTree);
    },
    [tree, updateTree]
  );

  // History operations
  const handleUndo = useCallback(() => {
    const prevTree = historyRef.current.undo();
    if (prevTree) {
      setTree(prevTree);
      saveTree(prevTree);
      forceUpdate(n => n + 1);
    }
  }, [saveTree]);

  const handleRedo = useCallback(() => {
    const nextTree = historyRef.current.redo();
    if (nextTree) {
      setTree(nextTree);
      saveTree(nextTree);
      forceUpdate(n => n + 1);
    }
  }, [saveTree]);

  // Import/Export
  const handleExport = useCallback(() => {
    const json = exportToJSON(tree);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [tree]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        const imported = importFromJSON(json);
        if (imported) {
          setTree(imported);
          historyRef.current.clear(imported);
          saveTree(imported);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [saveTree]);

  // Node selection
  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    // Select node on double click (for editing)
    setSelectedNodeId(nodeId);
  }, []);

  const handlePaneClick = useCallback(() => {
    // Don't deselect - keep root selected
    if (!selectedNodeId) {
      setSelectedNodeId(tree.rootId);
    }
  }, [selectedNodeId, tree.rootId]);

  // Reset view
  const handleResetView = useCallback(() => {
    fitView({ duration: 300, padding: 0.2 });
  }, [fitView]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const currentZoom = reactFlowInstance?.getZoom() || 1;
    reactFlowInstance?.zoomTo(Math.min(currentZoom * 1.2, 2));
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    const currentZoom = reactFlowInstance?.getZoom() || 1;
    reactFlowInstance?.zoomTo(Math.max(currentZoom / 1.2, 0.1));
  }, [reactFlowInstance]);

  // Fullscreen toggle
  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error('Error exiting fullscreen:', err);
      });
    }
  }, []);

  // Lock toggle (disable/enable node dragging)
  const handleToggleLock = useCallback(() => {
    setIsLocked(prev => !prev);
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.classList.contains('ProseMirror');

      // Undo/Redo (works even when editing)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      // Zoom shortcuts (works even when editing)
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        handleZoomIn();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        handleZoomOut();
        return;
      }

      // Fullscreen shortcut
      if (e.key === 'F11' || ((e.metaKey || e.ctrlKey) && e.key === 'f')) {
        e.preventDefault();
        handleToggleFullscreen();
        return;
      }

      // Don't handle other shortcuts when editing
      if (isEditing) return;

      if (!selectedNodeId) return;

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
        return;
      }

      // Add child
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddChild();
        return;
      }

      // Add sibling
      if (e.key === 'Tab') {
        e.preventDefault();
        handleAddSibling();
        return;
      }

      // Navigate
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = getAdjacentSibling(tree, selectedNodeId, 'prev');
        if (prev) setSelectedNodeId(prev);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = getAdjacentSibling(tree, selectedNodeId, 'next');
        if (next) setSelectedNodeId(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedNodeId,
    tree,
    handleAddChild,
    handleAddSibling,
    handleDelete,
    handleUndo,
    handleRedo,
    handleZoomIn,
    handleZoomOut,
    handleToggleFullscreen,
  ]);

  // Convert tree to React Flow format
  const { nodes: flowNodes, edges: flowEdges } = useMemo(
    () =>
      treeToFlow(
        tree,
        selectedNodeId,
        handleNodeClick,
        handleNodeDoubleClick,
        handleToggleCollapse,
        handleTextChange
      ),
    [tree, selectedNodeId, handleNodeClick, handleNodeDoubleClick, handleToggleCollapse, handleTextChange]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  const nodeTypes: NodeTypes = useMemo(() => ({ mindMapNode: RichTextMindMapNode }), []);
  const edgeTypes: EdgeTypes = useMemo(() => ({ adjustable: AdjustableEdge }), []);

  // Update nodes when tree changes
  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MindMapToolbar
        canUndo={historyRef.current.canUndo()}
        canRedo={historyRef.current.canRedo()}
        selectedNodeId={selectedNodeId}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAddChild={handleAddChild}
        onAddSibling={handleAddSibling}
        onDelete={handleDelete}
        onResetView={handleResetView}
        onExport={handleExport}
        onImport={handleImport}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleLock={handleToggleLock}
        isFullscreen={isFullscreen}
        isLocked={isLocked}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => handleNodeClick(node.id)}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={handlePaneClick}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        style={{ background: theme.background }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={!isLocked}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Controls
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
          }}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={theme.border}
        />
      </ReactFlow>
    </div>
  );
};

// Wrapper with ReactFlowProvider
export const MindMapEditor: React.FC<MindMapEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <MindMapEditorInner {...props} />
    </ReactFlowProvider>
  );
};
