import React, { useEffect } from 'react';
import { EditorProvider, useEditorContext, EditorContextType } from './editor/EditorContext';
import { TiptapEditorComponent, TiptapEditorRef } from './editor/Editor';
import { StatusBar } from './StatusBar';

interface EditorViewProps {
  initialContent?: object;
  onContentChange?: (content: object) => void;
  placeholder?: string;
  showStatusBar?: boolean;
  onContextReady?: (context: EditorContextType) => void;
  workspacePath?: string;
}

/**
 * EditorView - Main editor component using the new single-editor architecture
 *
 * This component wraps the TiptapEditorComponent with EditorProvider and optional StatusBar.
 * All block management is now handled internally by Tiptap through custom NodeViews.
 */

/**
 * Internal component that handles keyboard shortcuts for undo/redo
 * This prevents Ctrl+Z/Ctrl+Y from being captured by other elements (like browser or tabs)
 */
const EditorKeyboardHandler: React.FC = () => {
  const { undo, redo } = useEditorContext();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z / Cmd+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      // Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z: Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return null;
};

export const EditorView: React.FC<EditorViewProps> = ({
  initialContent,
  onContentChange,
  placeholder = '开始输入...',
  showStatusBar = true,
  onContextReady,
}) => {
  const editorRef = React.useRef<TiptapEditorRef>(null);

  return (
    <EditorProvider
      initialConfig={{
        content: initialContent,
        placeholder,
      }}
      onContentChange={onContentChange}
      onContextReady={onContextReady}
    >
      <EditorKeyboardHandler />
      <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-full">
            <TiptapEditorComponent
              ref={editorRef}
              className="prose prose-slate max-w-none min-h-[200px]"
              placeholder={placeholder}
            />
          </div>
        </div>
        {showStatusBar && <StatusBar />}
      </div>
    </EditorProvider>
  );
};
