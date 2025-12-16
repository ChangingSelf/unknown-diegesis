import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Blockquote from '@tiptap/extension-blockquote';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { Block } from '../types/block';
import MarkdownRenderer from './MarkdownRenderer';
import { EnterKeyExtension } from '../extensions/EnterKeyExtension';

interface BlockEditorProps {
  block: Block;
  onUpdate: (block: Block) => void;
  isEditing?: boolean;
  onToggleEdit?: () => void;
  onCreateNewBlock?: (position: 'before' | 'after' | 'split', content?: string) => void;
  onDragStart?: (blockId: string) => void;
  onDrop?: (targetBlockId: string) => void;
  isDragging?: boolean;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  block,
  onUpdate,
  isEditing = false,
  onToggleEdit,
  onCreateNewBlock,
  onDragStart,
  onDrop,
  isDragging = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 禁用 StarterKit 自带的 hardBreak，我们手动处理 Enter
        hardBreak: false,
      }),
      Placeholder.configure({
        placeholder: '输入内容...',
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
      // 添加自定义键盘扩展
      EnterKeyExtension.configure({
        onCreateNewBlock: (position, content) => {
          if (onCreateNewBlock) {
            // 如果是拆分块，需要更新当前块内容
            if (position === 'split' && content) {
              // 获取光标前的内容
              const currentContent = editor?.getHTML() || '';
              const textContent = editor?.getText() || '';
              const cursorPos = editor?.state.selection.$from.parentOffset || 0;
              const beforeCursor = textContent.substring(0, cursorPos);
              
              // 更新当前块
              onUpdate({
                ...block,
                content: `<p>${beforeCursor}</p>`,
                metadata: {
                  ...block.metadata,
                  modified: new Date(),
                },
              });
            }
            onCreateNewBlock(position, content);
          }
        },
      }),
    ],
    content: block.content,
    editable: isEditing,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      onUpdate({
        ...block,
        content,
        metadata: {
          ...block.metadata,
          modified: new Date(),
        },
      });
    },
  });

  // 当isEditing状态变化时，更新编辑器状态
  React.useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
      // 当进入编辑状态时，聚焦到编辑器并将光标移动到末尾
      if (isEditing) {
        setTimeout(() => {
          editor.commands.focus('end');
        }, 0);
      }
    }
  }, [isEditing, editor]);

  // 当block内容变化时，更新编辑器内容
  React.useEffect(() => {
    if (editor && editor.getHTML() !== block.content) {
      editor.commands.setContent(block.content);
    }
  }, [block.content, editor]);

  const handleBlockClick = () => {
    if (!isEditing && onToggleEdit) {
      onToggleEdit();
    }
  };

  const handleBlur = () => {
    if (isEditing && onToggleEdit) {
      onToggleEdit();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(block.id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDrop) {
      onDrop(block.id);
    }
  };

  // 如果不是编辑状态，显示Markdown渲染结果
  if (!isEditing) {
    return (
      <div 
        className={`relative ${isDragging ? 'opacity-50' : ''}`}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <MarkdownRenderer block={block} onEdit={handleBlockClick} />
      </div>
    );
  }

  // 编辑状态
  return (
    <div 
      className="block-editor editing mb-1"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-start group">
        <div 
          className="drag-handle mr-1 cursor-move text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          draggable
          onDragStart={handleDragStart}
        >
          ⋮⋮
        </div>
        <div className="flex-1">
          <EditorContent 
            editor={editor} 
            onBlur={handleBlur}
            className="tiptap-content cursor-text"
          />
        </div>
      </div>
      <style>{`
        .tiptap-content .ProseMirror {
          outline: none;
          text-align: left;
          line-height: 1.6;
        }
        .tiptap-content .ProseMirror p {
          margin: 0.2em 0;
          line-height: 1.6;
        }
        .tiptap-content .ProseMirror h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.3em 0;
          line-height: 1.2;
        }
        .tiptap-content .ProseMirror h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.3em 0;
          line-height: 1.2;
        }
        .tiptap-content .ProseMirror h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.3em 0;
          line-height: 1.2;
        }
        .tiptap-content .ProseMirror h4 {
          font-size: 1em;
          font-weight: bold;
          margin: 0.3em 0;
          line-height: 1.2;
        }
        .tiptap-content .ProseMirror h5 {
          font-size: 0.83em;
          font-weight: bold;
          margin: 0.3em 0;
          line-height: 1.2;
        }
        .tiptap-content .ProseMirror h6 {
          font-size: 0.75em;
          font-weight: bold;
          margin: 0.3em 0;
          line-height: 1.2;
        }
        .tiptap-content .ProseMirror ul,
        .tiptap-content .ProseMirror ol {
          margin: 0.3em 0;
          padding-left: 2em;
          line-height: 1.6;
        }
        .tiptap-content .ProseMirror li {
          margin: 0.1em 0;
        }
        .tiptap-content .ProseMirror blockquote {
          border-left: 4px solid #ddd;
          padding-left: 1em;
          margin: 0.5em 0;
          color: #666;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

export default BlockEditor;
