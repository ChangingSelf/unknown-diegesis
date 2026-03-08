import React, { useState, useRef } from 'react';
import { Input } from 'antd';
import type { InputRef } from 'antd';
import { Block, LayoutRow, SaveStatus } from '@/types/block';
import { LayoutRowComponent } from './LayoutRow';
import { SaveStatusIndicator } from './SaveStatusIndicator';

interface EditorViewProps {
  blocks: Block[];
  layoutRows: LayoutRow[];
  editingBlockId: string | null;
  draggingBlockId: string | null;
  title?: string;
  saveStatus: SaveStatus;
  lastSavedTime: Date | null;
  onUpdateBlock: (block: Block) => void;
  onCreateSibling: (blockId: string) => void;
  onColumnResize: (rowId: string, columnId: string, newWidth: number) => void;
  onToggleEdit: (blockId: string) => void;
  onCreateNewBlock: (
    blockId: string,
    position: 'before' | 'after' | 'split',
    content?: string
  ) => void;
  onDragBlock: (sourceBlockId: string, targetBlockId: string) => void;
  onSetDraggingBlock: (blockId: string | null) => void;
  emptyMessage?: string;
  onTitleChange?: (newTitle: string) => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  blocks,
  layoutRows,
  editingBlockId,
  draggingBlockId,
  title,
  saveStatus,
  lastSavedTime,
  onUpdateBlock,
  onCreateSibling,
  onColumnResize,
  onToggleEdit,
  onCreateNewBlock,
  onDragBlock,
  onSetDraggingBlock,
  emptyMessage = '没有内容，请打开文件或创建新文档',
  onTitleChange,
}) => {
  const hasContent = layoutRows.length > 0;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const inputRef = useRef<InputRef>(null);

  const handleEmptyAreaClick = () => {
    if (blocks.length === 1 && editingBlockId !== blocks[0].id) {
      onToggleEdit(blocks[0].id);
    }
  };

  const handleTitleClick = () => {
    if (onTitleChange && title) {
      setEditingTitle(title);
      setIsEditingTitle(true);
    }
  };

  const handleTitleBlur = () => {
    const trimmedTitle = editingTitle.trim();
    if (trimmedTitle && onTitleChange) {
      onTitleChange(trimmedTitle);
    }
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setEditingTitle('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          {title &&
            (isEditingTitle ? (
              <Input
                ref={inputRef}
                value={editingTitle}
                onChange={e => setEditingTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={handleTitleKeyDown}
                className="max-w-xs text-lg font-semibold"
                autoFocus
              />
            ) : (
              <h2
                className={`text-lg font-semibold text-gray-800 ${onTitleChange ? 'cursor-pointer hover:text-blue-600' : ''}`}
                onClick={handleTitleClick}
              >
                {title}
              </h2>
            ))}
        </div>
        <SaveStatusIndicator status={saveStatus} lastSavedTime={lastSavedTime} />
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-full cursor-text"
          onClick={handleEmptyAreaClick}
        >
          {hasContent ? (
            layoutRows.map(row => (
              <LayoutRowComponent
                key={row.id}
                row={row}
                blocks={blocks}
                onUpdateBlock={onUpdateBlock}
                onCreateSibling={onCreateSibling}
                onColumnResize={onColumnResize}
                editingBlockId={editingBlockId}
                onToggleEdit={onToggleEdit}
                onCreateNewBlock={onCreateNewBlock}
                onDragBlock={onDragBlock}
                draggingBlockId={draggingBlockId}
                onSetDraggingBlock={onSetDraggingBlock}
              />
            ))
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">{emptyMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
