import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useTheme } from '../contexts/ThemeContext';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({ content, onChange, placeholder = 'Start writing...' }) => {
  const { theme } = useTheme();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: theme.surface,
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '12px',
        borderBottom: `1px solid ${theme.border}`,
        flexWrap: 'wrap',
        background: theme.background,
      }}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={{
            padding: '6px 12px',
            background: editor.isActive('bold') ? theme.primary : theme.surface,
            color: editor.isActive('bold') ? '#fff' : theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={{
            padding: '6px 12px',
            background: editor.isActive('italic') ? theme.primary : theme.surface,
            color: editor.isActive('italic') ? '#fff' : theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontStyle: 'italic',
          }}
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          style={{
            padding: '6px 12px',
            background: editor.isActive('strike') ? theme.primary : theme.surface,
            color: editor.isActive('strike') ? '#fff' : theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            textDecoration: 'line-through',
          }}
        >
          S
        </button>
        <div style={{ width: '1px', background: theme.border, margin: '0 4px' }} />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          style={{
            padding: '6px 12px',
            background: editor.isActive('heading', { level: 1 }) ? theme.primary : theme.surface,
            color: editor.isActive('heading', { level: 1 }) ? '#fff' : theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={{
            padding: '6px 12px',
            background: editor.isActive('heading', { level: 2 }) ? theme.primary : theme.surface,
            color: editor.isActive('heading', { level: 2 }) ? '#fff' : theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          style={{
            padding: '6px 12px',
            background: editor.isActive('heading', { level: 3 }) ? theme.primary : theme.surface,
            color: editor.isActive('heading', { level: 3 }) ? '#fff' : theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          H3
        </button>
        <div style={{ width: '1px', background: theme.border, margin: '0 4px' }} />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={{
            padding: '6px 12px',
            background: editor.isActive('bulletList') ? theme.primary : theme.surface,
            color: editor.isActive('bulletList') ? '#fff' : theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={{
            padding: '6px 12px',
            background: editor.isActive('orderedList') ? theme.primary : theme.surface,
            color: editor.isActive('orderedList') ? '#fff' : theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          1. List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          style={{
            padding: '6px 12px',
            background: editor.isActive('taskList') ? theme.primary : theme.surface,
            color: editor.isActive('taskList') ? '#fff' : theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          ☑ Task
        </button>
        <div style={{ width: '1px', background: theme.border, margin: '0 4px' }} />
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          style={{
            padding: '6px 12px',
            background: editor.isActive('blockquote') ? theme.primary : theme.surface,
            color: editor.isActive('blockquote') ? '#fff' : theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          " Quote
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          style={{
            padding: '6px 12px',
            background: editor.isActive('codeBlock') ? theme.primary : theme.surface,
            color: editor.isActive('codeBlock') ? '#fff' : theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
        >
          {'</>'}
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        style={{ 
          flex: 1, 
          overflow: 'auto',
          padding: '20px',
        }} 
      />

      <style jsx global>{`
        .ProseMirror {
          outline: none;
          min-height: 100%;
          color: ${theme.text};
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: ${theme.textSecondary};
          pointer-events: none;
          height: 0;
        }

        .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.5em 0;
        }

        .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
        }

        .ProseMirror h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 0.5em 0;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }

        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5em;
        }

        .ProseMirror ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          margin-top: 0.2em;
        }

        .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
        }

        .ProseMirror blockquote {
          border-left: 3px solid ${theme.primary};
          padding-left: 1em;
          margin: 1em 0;
          color: ${theme.textSecondary};
        }

        .ProseMirror pre {
          background: ${theme.background};
          border: 1px solid ${theme.border};
          border-radius: 6px;
          padding: 1em;
          overflow-x: auto;
          font-family: monospace;
        }

        .ProseMirror code {
          background: ${theme.background};
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: monospace;
        }

        .ProseMirror a {
          color: ${theme.primary};
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};
