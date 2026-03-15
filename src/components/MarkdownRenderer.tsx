import React from 'react';
import { generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Block } from '../types/block';

interface MarkdownRendererProps {
  block: Block;
  onEdit: () => void;
}

const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4, 5, 6],
    },
    bulletList: {},
    orderedList: {},
    blockquote: {},
    horizontalRule: {},
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
];

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ block, onEdit }) => {
  if (block.type === 'dice') {
    return (
      <div
        className="dice-block-view p-4 bg-paper-50 rounded-lg border border-paper-300 cursor-pointer mb-2"
        onClick={onEdit}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-semibold text-charcoal-800">
              {block.diceData?.formula || '1d20'}
            </span>
            <span className="ml-2 text-charcoal-500">=</span>
            <span className="ml-2 text-2xl font-bold text-gold-600">
              {block.diceData?.result ?? '?'}
            </span>
          </div>
          {block.diceData?.result !== undefined && (
            <div className="text-sm text-charcoal-500">
              {new Date(block.diceData.rolledAt || '').toLocaleString('zh-CN')}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!block.content) {
    return (
      <div className="markdown-renderer mb-2 cursor-pointer" onClick={onEdit}>
        <div className="markdown-content text-charcoal-400">点击编辑...</div>
      </div>
    );
  }

  const html = generateHTML(block.content, extensions);
  const isHeading = block.content.content?.some(node => node.type === 'heading');

  return (
    <div
      className={`markdown-renderer ${isHeading ? 'heading-block' : ''} mb-2 cursor-pointer`}
      onClick={onEdit}
    >
      <div className="markdown-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};

export default MarkdownRenderer;
