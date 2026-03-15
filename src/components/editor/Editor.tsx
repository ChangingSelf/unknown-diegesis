import { useEffect, forwardRef, useImperativeHandle } from 'react';
import { EditorContent } from '@tiptap/react';
import type { Editor as TiptapEditor } from '@tiptap/react';
import { useEditorContext } from './EditorContext';
import { FloatingToolbar } from './FloatingToolbar';

export interface TiptapEditorRef {
  focus: () => void;
  getContent: () => object;
  setContent: (content: object) => void;
  getSnapshot: () => { content: object; selection?: { from: number; to: number } } | null;
}

export interface TiptapEditorProps {
  className?: string;
  placeholder?: string;
  onContentChange?: (content: object) => void;
}

export const TiptapEditorComponent = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  ({ className = '', onContentChange }, ref) => {
    const { editor, isReady, getSnapshot, focus } = useEditorContext();

    useImperativeHandle(ref, () => ({
      focus,
      getContent: () => editor?.getJSON() ?? { type: 'doc', content: [] },
      setContent: (content: object) => editor?.commands.setContent(content),
      getSnapshot,
    }));

    useEffect(() => {
      if (!editor || !onContentChange) return;

      const handleUpdate = () => {
        onContentChange(editor.getJSON());
      };
      editor.on('update', handleUpdate);
      return () => {
        editor.off('update', handleUpdate);
      };
    }, [editor, onContentChange]);

    if (!isReady || !editor) {
      return (
        <div className={`editor-loading ${className}`}>
          <div className="animate-pulse">加载编辑器...</div>
        </div>
      );
    }

    return (
      <div className={`editor-container ${className}`}>
        <FloatingToolbar editor={editor}>
          <EditorContent editor={editor as TiptapEditor} className="tiptap-content" />
        </FloatingToolbar>
      </div>
    );
  }
);

TiptapEditorComponent.displayName = 'TiptapEditorComponent';

export default TiptapEditorComponent;
