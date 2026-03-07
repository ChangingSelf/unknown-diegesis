import React, { useState } from 'react';
import { Button, Space } from 'antd';
import {
  PlusOutlined,
  FontSizeOutlined,
  MessageOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  CheckSquareOutlined,
  MinusOutlined,
} from '@ant-design/icons';
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

      <Space wrap className="mt-6">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddBlock('paragraph')}>
          段落
        </Button>
        <Button icon={<FontSizeOutlined />} onClick={() => handleAddBlock('heading')}>
          标题
        </Button>
        <Button icon={<MessageOutlined />} onClick={() => handleAddBlock('quote')}>
          引用
        </Button>
        <Button icon={<UnorderedListOutlined />} onClick={() => handleAddBlock('bulletList')}>
          无序列表
        </Button>
        <Button icon={<OrderedListOutlined />} onClick={() => handleAddBlock('orderedList')}>
          有序列表
        </Button>
        <Button icon={<CheckSquareOutlined />} onClick={() => handleAddBlock('taskList')}>
          任务列表
        </Button>
        <Button icon={<MinusOutlined />} onClick={() => handleAddBlock('horizontalRule')}>
          分割线
        </Button>
      </Space>
    </div>
  );
};

export default BlockList;
