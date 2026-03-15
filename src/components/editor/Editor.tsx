import { useEffect, forwardRef, useImperativeHandle } from 'react';
import { EditorContent } from '@tiptap/react';
import DragHandle from '@tiptap/extension-drag-handle-react';
import type { Editor as TiptapEditor } from '@tiptap/react';
import { useEditorContext } from './EditorContext';
import { FloatingToolbar } from './FloatingToolbar';
import { DragHandleMenu } from './DragHandleMenu';

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

    const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // If click is inside EditorContent, let TipTap handle it
      const editorContent = (e.currentTarget as HTMLElement).querySelector('.tiptap-content');
      const target = e.target as HTMLElement;
      if (editorContent?.contains(target)) {
        return;
      }
      // Clicked on blank area -> move focus to end
      if (editor?.commands?.focus) {
        editor.commands.focus('end');
      }
    };

    return (
      <div className={`editor-container ${className}`} onClick={handleEditorClick}>
        <FloatingToolbar editor={editor} />
        <DragHandle editor={editor as TiptapEditor}>
          <DragHandleMenu editor={editor as TiptapEditor} />
        </DragHandle>
        <EditorContent editor={editor as TiptapEditor} className="tiptap-content" />
      </div>
    );
  }
);

TiptapEditorComponent.displayName = 'TiptapEditorComponent';

export default TiptapEditorComponent;
