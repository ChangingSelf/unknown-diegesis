import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
import { Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { CharacterCount } from '@tiptap/extensions';
import { richTextExtensions } from '@/extensions/RichTextExtensions';
import GlobalBlockAttributes from '@/extensions/GlobalBlockAttributes';
import { DiceBlockExtension } from '@/extensions/nodes/DiceBlockExtension';
import { ImageBlockExtension } from '@/extensions/nodes/ImageBlockExtension';
import { LayoutRowExtension } from '@/extensions/nodes/LayoutRowExtension';
import { LayoutColumnExtension } from '@/extensions/nodes/LayoutColumnExtension';
import { PasteImageExtension } from '@/extensions/nodes/PasteImageExtension';
import DragHandle from '@tiptap/extension-drag-handle-react';
import { DocumentStateManager } from '@/services/DocumentStateManager';
// Helper to create an empty document content (one empty paragraph)
const createEmptyContent = (): { type: 'doc'; content: { type: 'paragraph' }[] } => ({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});

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
  undo: () => void;
  redo: () => void;
  stateManager: DocumentStateManager;
  saveCurrentState: (docId: string) => void;
  restoreState: (docId: string) => boolean;
  hasState: (docId: string) => boolean;
}

export type { EditorContextType };

const EditorContext = createContext<EditorContextType | null>(null);

const getEditorExtensions = (config: EditorConfig = {}) => {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      undoRedo: {
        newGroupDelay: 0,
      },
    }),
    Placeholder.configure({
      placeholder: config.placeholder || '开始输入...',
    }),
    CharacterCount.configure({
      wordCounter: text => {
        const chinese = text.match(/[\u4e00-\u9fa5]/g) || [];
        const english = text.match(/[a-zA-Z]+/g) || [];
        const numbers = text.match(/\d+/g) || [];
        return chinese.length + english.length + numbers.length;
      },
    }),
    ...richTextExtensions,
    GlobalBlockAttributes,
    DiceBlockExtension,
    ImageBlockExtension,
    LayoutRowExtension,
    LayoutColumnExtension,
    PasteImageExtension,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DragHandle as any,
  ];
};

interface EditorProviderProps {
  children: React.ReactNode;
  initialConfig?: EditorConfig;
  onContentChange?: (content: object) => void;
  onContextReady?: (context: EditorContextType) => void;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({
  children,
  initialConfig,
  onContentChange,
  onContextReady,
}) => {
  const editorRef = useRef<TiptapEditor | null>(null);
  const onContentChangeRef = useRef(onContentChange);
  const onContextReadyRef = useRef(onContextReady);
  const stateManagerRef = useRef<DocumentStateManager>(new DocumentStateManager());
  const [editor, setEditor] = useState<TiptapEditor | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  useEffect(() => {
    onContextReadyRef.current = onContextReady;
  }, [onContextReady]);

  useEffect(() => {
    const config = initialConfig || {};

    // Defer editor creation to avoid flushSync warning during React rendering lifecycle
    const timerId = setTimeout(() => {
      const newEditor = new TiptapEditor({
        extensions: getEditorExtensions(config),
        content: config.content ?? createEmptyContent(),
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

  const undo = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.chain().focus().undo().run();
    }
  }, []);

  const redo = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.chain().focus().redo().run();
    }
  }, []);

  const saveCurrentState = useCallback((docId: string) => {
    if (editorRef.current) {
      stateManagerRef.current.saveState(docId, editorRef.current);
    }
  }, []);

  const restoreState = useCallback((docId: string): boolean => {
    if (!editorRef.current) return false;

    const state = stateManagerRef.current.getState(docId);
    if (!state) return false;

    editorRef.current.view.updateState(state.editorState);
    return true;
  }, []);

  const hasState = useCallback((docId: string): boolean => {
    return stateManagerRef.current.hasState(docId);
  }, []);

  const value: EditorContextType = {
    editor,
    isReady,
    setContent,
    getSnapshot,
    restoreFromSnapshot,
    focus,
    undo,
    redo,
    stateManager: stateManagerRef.current,
    saveCurrentState,
    restoreState,
    hasState,
  };

  useEffect(() => {
    if (isReady && onContextReadyRef.current) {
      onContextReadyRef.current(value);
    }
  }, [isReady, value]);

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
