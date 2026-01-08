'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface MindMapToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  selectedNodeId: string | null;
  onUndo: () => void;
  onRedo: () => void;
  onAddChild: () => void;
  onAddSibling: () => void;
  onDelete: () => void;
  onResetView: () => void;
  onExport: () => void;
  onImport: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
  onToggleLock: () => void;
  isFullscreen: boolean;
  isLocked: boolean;
}

export const MindMapToolbar: React.FC<MindMapToolbarProps> = ({
  canUndo,
  canRedo,
  selectedNodeId,
  onUndo,
  onRedo,
  onAddChild,
  onAddSibling,
  onDelete,
  onResetView,
  onExport,
  onImport,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
  onToggleLock,
  isFullscreen,
  isLocked,
}) => {
  const { theme } = useTheme();

  const Button = ({
    onClick,
    disabled,
    children,
    title,
    variant = 'default',
  }: {
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
    variant?: 'default' | 'danger';
  }) => (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '8px 16px',
        borderRadius: '8px',
        background: disabled
          ? theme.border
          : variant === 'danger'
          ? '#ef4444'
          : theme.primary,
        color: disabled ? theme.textSecondary : '#fff',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {children}
    </motion.button>
  );

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        gap: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        flexWrap: 'wrap',
        maxWidth: '90vw',
      }}
    >
      {/* History */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <Button onClick={onUndo} disabled={!canUndo} title="Undo (Cmd/Ctrl+Z)">
          ↶
        </Button>
        <Button onClick={onRedo} disabled={!canRedo} title="Redo (Cmd/Ctrl+Shift+Z)">
          ↷
        </Button>
      </div>

      <div style={{ width: '1px', background: theme.border }} />

      {/* Node operations */}
      <Button
        onClick={onAddChild}
        disabled={!selectedNodeId}
        title="Add child (Enter)"
      >
        + Child
      </Button>
      <Button
        onClick={onAddSibling}
        disabled={!selectedNodeId}
        title="Add sibling (Tab)"
      >
        + Sibling
      </Button>
      <Button
        onClick={onDelete}
        disabled={!selectedNodeId}
        title="Delete node (Delete)"
        variant="danger"
      >
        Delete
      </Button>

      <div style={{ width: '1px', background: theme.border }} />

      {/* View */}
      <Button onClick={onResetView} title="Reset view">
        Center
      </Button>
      <Button onClick={onZoomIn} title="Zoom in (+)">
        🔍+
      </Button>
      <Button onClick={onZoomOut} title="Zoom out (-)">
        🔍−
      </Button>
      <Button 
        onClick={onToggleFullscreen} 
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? '⛶' : '⛶'}
      </Button>
      <Button 
        onClick={onToggleLock} 
        title={isLocked ? "Unlock (enable dragging)" : "Lock (disable dragging)"}
      >
        {isLocked ? '🔒' : '🔓'}
      </Button>

      <div style={{ width: '1px', background: theme.border }} />

      {/* Import/Export */}
      <Button onClick={onExport} title="Export as JSON">
        Export
      </Button>
      <Button onClick={onImport} title="Import from JSON">
        Import
      </Button>
    </motion.div>
  );
};
