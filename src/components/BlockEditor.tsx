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
import DragHandle from '@tiptap/extension-drag-handle';
import { Block } from '../types/block';
import MarkdownRenderer from './MarkdownRenderer';

interface BlockEditorProps {
  block: Block;
  onUpdate: (block: Block) => void;
  isEditing?: boolean;
  onToggleEdit?: () => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  block,
  onUpdate,
  isEditing = false,
  onToggleEdit
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
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
      DragHandle.configure({
        // 移除不存在的dragHandleWidth配置
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

  // 如果不是编辑状态，显示Markdown渲染结果
  if (!isEditing) {
    return <MarkdownRenderer block={block} onEdit={handleBlockClick} />;
  }

  // 编辑状态
  return (
    <div className="block-editor editing border border-gray-200 rounded-md p-3 mb-3 hover:border-gray-300 transition-colors">
      <div className="flex items-start">
        <div className="drag-handle mr-2 cursor-move text-gray-400 hover:text-gray-600">
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
    </div>
  );
};

export default BlockEditor;
