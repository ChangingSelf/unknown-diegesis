import React, { createContext, useContext, useRef, useCallback, useState } from 'react';
import { Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Blockquote from '@tiptap/extension-blockquote';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { richTextExtensions } from '@/extensions/RichTextExtensions';
import { BlockWrapper } from '@/extensions/nodes/BlockWrapperExtension';
import { DiceBlockExtension } from '@/extensions/nodes/DiceBlockExtension';
import { ImageBlockExtension } from '@/extensions/nodes/ImageBlockExtension';
import { LayoutRowExtension } from '@/extensions/nodes/LayoutRowExtension';
import { LayoutColumnExtension } from '@/extensions/nodes/LayoutColumnExtension';
import { PasteImageExtension } from '@/extensions/nodes/PasteImageExtension';

export interface EditorConfig {
  placeholder?: string;
  editable?: boolean;
  content?: object;
}

export interface EditorSnapshot {
  content: object;
  selection?: {
    from: number;
    to: number;
  };
  scrollPosition?: number;
}

interface EditorContextType {
  editor: TiptapEditor | null;
  isReady: boolean;
  initEditor: (config?: EditorConfig) => void;
  destroyEditor: () => void;
  getSnapshot: () => EditorSnapshot | null;
  restoreFromSnapshot: (snapshot: EditorSnapshot) => void;
  focus: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

const getEditorExtensions = (config: EditorConfig = {}) => {
  return [
    StarterKit.configure({
      heading: false,
      bulletList: false,
      orderedList: false,
      blockquote: false,
      horizontalRule: false,
    }),
    Placeholder.configure({
      placeholder: config.placeholder || '开始输入...',
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Blockquote,
    Heading.configure({
      levels: [1, 2, 3, 4, 5, 6],
    }),
    BulletList,
    OrderedList,
    HorizontalRule,
    ...richTextExtensions,
    BlockWrapper,
    DiceBlockExtension,
    ImageBlockExtension,
    LayoutRowExtension,
    LayoutColumnExtension,
    PasteImageExtension,
  ];
};

interface EditorProviderProps {
  children: React.ReactNode;
  initialConfig?: EditorConfig;
  onContentChange?: (content: object) => void;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({
  children,
  initialConfig,
  onContentChange,
}) => {
  const editorRef = useRef<TiptapEditor | null>(null);
  const [isReady, setIsReady] = useState(false);

  const initEditor = useCallback(
    (config: EditorConfig = {}) => {
      const finalConfig = { ...initialConfig, ...config };

      if (editorRef.current) {
        editorRef.current.destroy();
      }

      const editor = new TiptapEditor({
        extensions: getEditorExtensions(finalConfig),
        content: finalConfig.content || { type: 'doc', content: [] },
        editable: finalConfig.editable !== false,
        onUpdate: ({ editor }) => {
          if (onContentChange) {
            onContentChange(editor.getJSON());
          }
        },
      });

      editorRef.current = editor;
      setIsReady(true);
    },
    [initialConfig, onContentChange]
  );

  const destroyEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.destroy();
      editorRef.current = null;
      setIsReady(false);
    }
  }, []);

  const getSnapshot = useCallback((): EditorSnapshot | null => {
    if (!editorRef.current) return null;

    const editor = editorRef.current;
    return {
      content: editor.getJSON(),
      selection: {
        from: editor.state.selection.from,
        to: editor.state.selection.to,
      },
    };
  }, []);

  const restoreFromSnapshot = useCallback((snapshot: EditorSnapshot) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    editor.commands.setContent(snapshot.content);

    if (snapshot.selection) {
      editor.commands.setTextSelection({
        from: snapshot.selection.from,
        to: snapshot.selection.to,
      });
    }
  }, []);

  const focus = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.commands.focus();
    }
  }, []);

  const value: EditorContextType = {
    editor: editorRef.current,
    isReady,
    initEditor,
    destroyEditor,
    getSnapshot,
    restoreFromSnapshot,
    focus,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};

export const useEditorContext = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within EditorProvider');
  }
  return context;
};

export const useEditorInstance = () => {
  const { editor, isReady } = useEditorContext();
  return { editor, isReady };
};

export default EditorContext;
