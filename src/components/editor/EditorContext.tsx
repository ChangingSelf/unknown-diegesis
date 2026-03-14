import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
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
import { DocExtension } from '@/extensions/nodes/DocExtension';
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
  setContent: (content: object) => void;
  getSnapshot: () => EditorSnapshot | null;
  restoreFromSnapshot: (snapshot: EditorSnapshot) => void;
  focus: () => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

const getEditorExtensions = (config: EditorConfig = {}) => {
  return [
    DocExtension,
    StarterKit.configure({
      heading: false,
      bulletList: false,
      orderedList: false,
      blockquote: false,
      horizontalRule: false,
      document: false,
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
  const onContentChangeRef = useRef(onContentChange);
  const [editor, setEditor] = useState<TiptapEditor | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  useEffect(() => {
    const config = initialConfig || {};

    // Defer editor creation to avoid flushSync warning during React rendering lifecycle
    const timerId = setTimeout(() => {
      const newEditor = new TiptapEditor({
        extensions: getEditorExtensions(config),
        content: config.content || { type: 'doc', content: [] },
        editable: config.editable !== false,
        onUpdate: ({ editor }) => {
          if (onContentChangeRef.current) {
            onContentChangeRef.current(editor.getJSON());
          }
        },
      });

      editorRef.current = newEditor;
      setEditor(newEditor);
      setIsReady(true);

      requestAnimationFrame(() => {
        newEditor.commands.focus('end');
      });
    }, 0);

    return () => {
      clearTimeout(timerId);
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
        setEditor(null);
        setIsReady(false);
      }
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current || !initialConfig?.content) return;
    const currentContent = JSON.stringify(editorRef.current.getJSON());
    const newContent = JSON.stringify(initialConfig.content);
    if (currentContent !== newContent) {
      editorRef.current.commands.setContent(initialConfig.content);
      requestAnimationFrame(() => {
        editorRef.current?.commands.focus('end');
      });
    }
  }, [initialConfig?.content]);

  const setContent = useCallback((content: object) => {
    if (editorRef.current) {
      editorRef.current.commands.setContent(content);
    }
  }, []);

  const getSnapshot = useCallback((): EditorSnapshot | null => {
    if (!editorRef.current) return null;

    const ed = editorRef.current;
    return {
      content: ed.getJSON(),
      selection: {
        from: ed.state.selection.from,
        to: ed.state.selection.to,
      },
    };
  }, []);

  const restoreFromSnapshot = useCallback((snapshot: EditorSnapshot) => {
    if (!editorRef.current) return;

    const ed = editorRef.current;
    ed.commands.setContent(snapshot.content);

    if (snapshot.selection) {
      ed.commands.setTextSelection({
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
    editor,
    isReady,
    setContent,
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
