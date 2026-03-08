import React from 'react';
import { EditorProvider } from './editor/EditorContext';
import { TiptapEditorComponent, TiptapEditorRef } from './editor/Editor';
import { StatusBar } from './StatusBar';

interface EditorViewProps {
  initialContent?: object;
  onContentChange?: (content: object) => void;
  placeholder?: string;
  showStatusBar?: boolean;
}

/**
 * EditorView - Main editor component using the new single-editor architecture
 *
 * This component wraps the TiptapEditorComponent with EditorProvider and optional StatusBar.
 * All block management is now handled internally by Tiptap through custom NodeViews.
 */
export const EditorView: React.FC<EditorViewProps> = ({
  initialContent,
  onContentChange,
  placeholder = '开始输入...',
  showStatusBar = true,
}) => {
  const editorRef = React.useRef<TiptapEditorRef>(null);

  return (
    <EditorProvider
      initialConfig={{
        content: initialContent,
        placeholder,
      }}
      onContentChange={onContentChange}
    >
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
