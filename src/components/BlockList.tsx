import React, { useState } from 'react';
import { Block } from '../types/block';
import BlockEditor from './BlockEditor';

interface BlockListProps {
  blocks: Block[];
  onUpdateBlock: (block: Block) => void;
  onAddBlock: (type: Block['type']) => void;
  onReorderBlocks: (fromIndex: number, toIndex: number) => void;
}

export const BlockList: React.FC<BlockListProps> = ({
  blocks,
  onUpdateBlock,
  onAddBlock,
  onReorderBlocks,
}) => {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleToggleEdit = (blockId: string) => {
    setEditingBlockId(editingBlockId === blockId ? null : blockId);
  };

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // 防止Firefox的默认行为
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();

    if (draggedBlockId === null) {
      return;
    }

    const draggedIndex = blocks.findIndex(block => block.id === draggedBlockId);

    if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
      onReorderBlocks(draggedIndex, targetIndex);
    }

    setDraggedBlockId(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedBlockId(null);
    setDragOverIndex(null);
  };

  const handleAddBlock = (type: Block['type']) => {
    onAddBlock(type);
  };

  return (
    <div className="block-list">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          draggable={editingBlockId === block.id}
          onDragStart={e => handleDragStart(e, block.id)}
          onDragOver={e => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`relative ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
        >
          {dragOverIndex === index && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-ink-500 z-10 rounded-full shadow-sm"></div>
          )}

          <BlockEditor
            block={block}
            onUpdate={onUpdateBlock}
            isEditing={editingBlockId === block.id}
            onToggleEdit={() => handleToggleEdit(block.id)}
          />
        </div>
      ))}

      <div className="add-block-buttons mt-6 flex flex-wrap gap-2">
        <button onClick={() => handleAddBlock('paragraph')} className="btn-primary">
          + 段落
        </button>
        <button onClick={() => handleAddBlock('heading')} className="btn-secondary">
          + 标题
        </button>
        <button onClick={() => handleAddBlock('quote')} className="btn-secondary">
          + 引用
        </button>
        <button onClick={() => handleAddBlock('bulletList')} className="btn-secondary">
          + 无序列表
        </button>
        <button onClick={() => handleAddBlock('orderedList')} className="btn-secondary">
          + 有序列表
        </button>
        <button onClick={() => handleAddBlock('taskList')} className="btn-secondary">
          + 任务列表
        </button>
        <button onClick={() => handleAddBlock('horizontalRule')} className="btn-secondary">
          + 分割线
        </button>
      </div>
    </div>
  );
};

export default BlockList;
