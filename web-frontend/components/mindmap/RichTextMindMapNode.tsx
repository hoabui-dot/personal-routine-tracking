'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextMindMapNodeProps {
  data: {
    id: string;
    text: string;
    htmlContent?: string;
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
    onTextChange: (id: string, text: string, html?: string) => void;
  };
  selected: boolean;
}

export const RichTextMindMapNode: React.FC<RichTextMindMapNodeProps> = ({ data, selected }) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromProps = useRef(false);

  // Initialize Tiptap editor
  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration issues in Next.js
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Type something...',
      }),
    ],
    content: data.htmlContent || `<p>${data.text}</p>`,
    editable: isEditing,
    onUpdate: ({ editor }) => {
      if (isUpdatingFromProps.current) return;
      
      const html = editor.getHTML();
      const text = editor.getText();
      data.onTextChange(data.id, text, html);
    },
    editorProps: {
      attributes: {
        class: 'mindmap-editor nodrag nowheel nopan',
        spellcheck: 'false',
      },
      // Prevent all event bubbling to React Flow
      handleDOMEvents: {
        mousedown: (_view, event) => {
          if (isEditing) {
            event.stopPropagation();
          }
          return false;
        },
        mouseup: (_view, event) => {
          if (isEditing) {
            event.stopPropagation();
          }
          return false;
        },
        click: (_view, event) => {
          if (isEditing) {
            event.stopPropagation();
          }
          return false;
        },
        keydown: (_view, event) => {
          if (isEditing) {
            event.stopPropagation();
          }
          return false;
        },
      },
    },
  });

  // Update editor content when data changes (but not during editing)
  useEffect(() => {
    if (editor && !isEditing) {
      isUpdatingFromProps.current = true;
      const currentContent = editor.getHTML();
      const newContent = data.htmlContent || `<p>${data.text}</p>`;
      if (currentContent !== newContent) {
        editor.commands.setContent(newContent);
      }
      isUpdatingFromProps.current = false;
    }
  }, [data.htmlContent, data.text, editor, isEditing]);

  // Update editor editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isEditing) {
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    data.onNodeClick(data.id);
  }, [isEditing, data]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditing(true);
    data.onNodeDoubleClick(data.id);
    setTimeout(() => {
      editor?.commands.focus('end');
    }, 50);
  }, [data, editor]);

  const handleBlur = useCallback(() => {
    // Delay to allow toolbar clicks
    setTimeout(() => {
      if (editorContainerRef.current && !editorContainerRef.current.contains(document.activeElement)) {
        setIsEditing(false);
      }
    }, 150);
  }, []);

  const handleToggleCollapse = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    data.onToggleCollapse(data.id);
  }, [data]);

  // Prevent all event propagation from editor container
  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditing) {
      e.stopPropagation();
    }
  }, [isEditing]);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (isEditing) {
      e.stopPropagation();
    }
  }, [isEditing]);

  const handleContainerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isEditing) {
      e.stopPropagation();
      
      // Only handle Escape to exit
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        editor?.commands.blur();
      }
      // All other shortcuts are handled by Tiptap
    }
  }, [isEditing, editor]);

  // Toolbar button handler that maintains focus
  const handleToolbarAction = useCallback((action: () => void) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      action();
      // Refocus editor after toolbar action
      setTimeout(() => {
        editor?.commands.focus();
      }, 0);
    };
  }, [editor]);

  const { isRoot, isSelected, hasChildren, collapsed, color } = data;

  return (
    <>
      {/* Node Resizer */}
      {selected && (
        <NodeResizer
          color={color}
          isVisible={selected}
          minWidth={isRoot ? 200 : 160}
          minHeight={isRoot ? 60 : 50}
        />
      )}

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
        whileHover={!isEditing ? { scale: 1.02 } : {}}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={isEditing ? 'nodrag nopan' : ''}
        style={{
          position: 'relative',
          padding: isRoot ? '16px 24px' : '12px 20px',
          borderRadius: isRoot ? '16px' : '12px',
          background: isRoot ? color : theme.surface,
          border: isEditing 
            ? `3px solid ${color}` 
            : `2px solid ${isSelected ? color : 'transparent'}`,
          color: isRoot ? '#fff' : theme.text,
          minWidth: isRoot ? '200px' : '160px',
          maxWidth: '400px',
          cursor: isEditing ? 'text' : 'pointer',
          boxShadow: isEditing
            ? `0 8px 32px ${color}60, 0 0 0 4px ${color}20`
            : isSelected
            ? `0 8px 24px ${color}40, 0 0 0 3px ${color}20`
            : '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: isRoot ? '16px' : '14px',
          fontWeight: isRoot ? 600 : 500,
          transition: 'all 0.2s ease',
          userSelect: isEditing ? 'text' : 'none',
        }}
      >
        {/* Rich Text Editor */}
        <div
          ref={editorContainerRef}
          className="nodrag nowheel nopan"
          onMouseDown={handleContainerMouseDown}
          onClick={handleContainerClick}
          onKeyDown={handleContainerKeyDown}
          onBlur={handleBlur}
          style={{
            outline: 'none',
            userSelect: isEditing ? 'text' : 'none',
            cursor: isEditing ? 'text' : 'inherit',
          }}
        >
          <EditorContent
            editor={editor}
            style={{
              outline: 'none',
            }}
          />
        </div>

        {/* Rich Text Toolbar */}
        {isEditing && editor && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="nodrag nowheel nopan"
            style={{
              position: 'absolute',
              top: '-56px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: theme.surface,
              border: `2px solid ${color}`,
              borderRadius: '10px',
              padding: '6px 8px',
              display: 'flex',
              gap: '4px',
              boxShadow: `0 4px 16px ${color}40`,
              zIndex: 1000,
              minWidth: '320px',
              justifyContent: 'center',
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onMouseDown={handleToolbarAction(() => editor.chain().focus().toggleBold().run())}
              className={editor.isActive('bold') ? 'is-active' : ''}
              style={{
                padding: '6px 10px',
                background: editor.isActive('bold') ? color : 'transparent',
                color: editor.isActive('bold') ? '#fff' : theme.text,
                border: `1px solid ${editor.isActive('bold') ? color : theme.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                transition: 'all 0.2s',
              }}
              title="Bold (Ctrl+B)"
            >
              <strong>B</strong>
            </button>
            <button
              onMouseDown={handleToolbarAction(() => editor.chain().focus().toggleItalic().run())}
              className={editor.isActive('italic') ? 'is-active' : ''}
              style={{
                padding: '6px 10px',
                background: editor.isActive('italic') ? color : 'transparent',
                color: editor.isActive('italic') ? '#fff' : theme.text,
                border: `1px solid ${editor.isActive('italic') ? color : theme.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontStyle: 'italic',
                transition: 'all 0.2s',
              }}
              title="Italic (Ctrl+I)"
            >
              <em>I</em>
            </button>
            <button
              onMouseDown={handleToolbarAction(() => editor.chain().focus().toggleStrike().run())}
              className={editor.isActive('strike') ? 'is-active' : ''}
              style={{
                padding: '6px 10px',
                background: editor.isActive('strike') ? color : 'transparent',
                color: editor.isActive('strike') ? '#fff' : theme.text,
                border: `1px solid ${editor.isActive('strike') ? color : theme.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                textDecoration: 'line-through',
                transition: 'all 0.2s',
              }}
              title="Strikethrough (Ctrl+Shift+X)"
            >
              S
            </button>
            <div style={{ width: '1px', background: theme.border, margin: '0 4px' }} />
            <button
              onMouseDown={handleToolbarAction(() => editor.chain().focus().toggleBulletList().run())}
              className={editor.isActive('bulletList') ? 'is-active' : ''}
              style={{
                padding: '6px 10px',
                background: editor.isActive('bulletList') ? color : 'transparent',
                color: editor.isActive('bulletList') ? '#fff' : theme.text,
                border: `1px solid ${editor.isActive('bulletList') ? color : theme.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s',
              }}
              title="Bullet List"
            >
              • List
            </button>
            <button
              onMouseDown={handleToolbarAction(() => editor.chain().focus().toggleOrderedList().run())}
              className={editor.isActive('orderedList') ? 'is-active' : ''}
              style={{
                padding: '6px 10px',
                background: editor.isActive('orderedList') ? color : 'transparent',
                color: editor.isActive('orderedList') ? '#fff' : theme.text,
                border: `1px solid ${editor.isActive('orderedList') ? color : theme.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s',
              }}
              title="Numbered List"
            >
              1. List
            </button>
            <div style={{ width: '1px', background: theme.border, margin: '0 4px' }} />
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(false);
                editor.commands.blur();
              }}
              style={{
                padding: '6px 10px',
                background: 'transparent',
                color: theme.textSecondary,
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
              title="Done (Esc)"
            >
              ✓ Done
            </button>
          </motion.div>
        )}

        {/* Collapse/Expand button */}
        {hasChildren && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.2 }}
            onClick={handleToggleCollapse}
            onMouseDown={(e) => e.stopPropagation()}
            className="nodrag"
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

        {/* Edit hint */}
        {isSelected && !isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              bottom: '-24px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.75)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              backdropFilter: 'blur(4px)',
            }}
          >
            Double-click to edit
          </motion.div>
        )}

        <style jsx global>{`
          .mindmap-editor.ProseMirror {
            outline: none !important;
            min-height: 20px;
            user-select: text !important;
            cursor: text !important;
          }

          .mindmap-editor.ProseMirror * {
            user-select: text !important;
          }

          .mindmap-editor.ProseMirror p {
            margin: 0;
            line-height: 1.5;
          }

          .mindmap-editor.ProseMirror strong {
            font-weight: 700;
          }

          .mindmap-editor.ProseMirror em {
            font-style: italic;
          }

          .mindmap-editor.ProseMirror ul,
          .mindmap-editor.ProseMirror ol {
            padding-left: 1.5em;
            margin: 0.5em 0;
          }

          .mindmap-editor.ProseMirror li {
            margin: 0.25em 0;
          }

          .mindmap-editor.ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: ${theme.textSecondary};
            opacity: 0.5;
            pointer-events: none;
            height: 0;
          }

          /* Critical: Prevent React Flow from capturing events */
          .nodrag {
            pointer-events: all !important;
          }

          .nopan {
            touch-action: auto !important;
          }

          .nowheel {
            touch-action: none;
          }
        `}</style>
      </motion.div>
    </>
  );
};
