'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface MindMapNodeProps {
  data: {
    id: string;
    text: string;
    isRoot: boolean;
    isSelected: boolean;
    hasChildren: boolean;
    collapsed: boolean;
    depth: number;
    color: string;
    direction?: 'left' | 'right';
    onNodeClick: (id: string) => void;
    onNodeDoubleClick: (id: string) => void;
    onToggleCollapse: (id: string) => void;
    onTextChange: (id: string, text: string) => void;
  };
}

export const MindMapNode: React.FC<MindMapNodeProps> = ({ data }) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.text);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(data.text);
  }, [data.text]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      // Auto-resize
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      data.onNodeClick(data.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    data.onNodeDoubleClick(data.id);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const trimmed = text.trim();
    if (trimmed && trimmed !== data.text) {
      data.onTextChange(data.id, trimmed);
    } else {
      setText(data.text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setText(data.text);
      setIsEditing(false);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    // Shift+Enter allows new lines
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    data.onToggleCollapse(data.id);
  };

  const { isRoot, isSelected, hasChildren, collapsed, color } = data;

  return (
    <>
      {/* Connection handles */}
      {isRoot ? (
        <>
          <Handle type="source" position={Position.Left} style={{ opacity: 0 }} />
          <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
        </>
      ) : (
        <>
          <Handle
            type="target"
            position={data.direction === 'left' ? Position.Right : Position.Left}
            style={{ opacity: 0 }}
          />
          <Handle
            type="source"
            position={data.direction === 'left' ? Position.Left : Position.Right}
            style={{ opacity: 0 }}
          />
        </>
      )}

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
        whileHover={{ scale: 1.05 }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={{
          position: 'relative',
          padding: isRoot ? '16px 24px' : '12px 20px',
          borderRadius: isRoot ? '16px' : '12px',
          background: isRoot ? color : theme.surface,
          border: `2px solid ${isSelected ? color : 'transparent'}`,
          color: isRoot ? '#fff' : theme.text,
          minWidth: isRoot ? '200px' : '160px',
          maxWidth: '300px',
          cursor: 'pointer',
          boxShadow: isSelected
            ? `0 8px 24px ${color}40, 0 0 0 3px ${color}20`
            : '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: isRoot ? '18px' : '15px',
          fontWeight: isRoot ? 600 : 500,
          transition: 'box-shadow 0.2s ease',
        }}
      >
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={text}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: isRoot ? '#fff' : theme.text,
            width: '100%',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            resize: 'none',
            overflow: 'hidden',
            lineHeight: '1.5',
          }}
        />
      ) : (
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {text}
        </div>
      )}

      {/* Collapse/Expand button */}
      {hasChildren && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.2 }}
          onClick={handleToggleCollapse}
          style={{
            position: 'absolute',
            right: data.direction === 'left' ? 'auto' : '-12px',
            left: data.direction === 'left' ? '-12px' : 'auto',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: color,
            color: '#fff',
            border: `2px solid ${theme.background}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '+' : '−'}
        </motion.button>
      )}

      {/* Depth indicator */}
      {!isRoot && (
        <div
          style={{
            position: 'absolute',
            left: data.direction === 'left' ? 'auto' : '8px',
            right: data.direction === 'left' ? '8px' : 'auto',
            top: '8px',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: color,
            opacity: 0.5,
          }}
        />
      )}
    </motion.div>
    </>
  );
};
