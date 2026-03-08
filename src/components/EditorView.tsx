import React from 'react';
import { Block, LayoutRow } from '@/types/block';
import { LayoutRowComponent } from './LayoutRow';

interface EditorViewProps {
  blocks: Block[];
  layoutRows: LayoutRow[];
  editingBlockId: string | null;
  draggingBlockId: string | null;
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
}

export const EditorView: React.FC<EditorViewProps> = ({
  blocks,
  layoutRows,
  editingBlockId,
  draggingBlockId,
  onUpdateBlock,
  onCreateSibling,
  onColumnResize,
  onToggleEdit,
  onCreateNewBlock,
  onDragBlock,
  onSetDraggingBlock,
  emptyMessage = '没有内容，请打开文件或创建新文档',
}) => {
  const hasContent = layoutRows.length > 0;

  const handleEmptyAreaClick = () => {
    if (blocks.length === 1 && editingBlockId !== blocks[0].id) {
      onToggleEdit(blocks[0].id);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-auto p-6">
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-full cursor-text flex-1"
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
  );
};
