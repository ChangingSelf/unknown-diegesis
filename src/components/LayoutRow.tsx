import React from 'react';
import { LayoutRow as LayoutRowType, LayoutColumn, Block } from '../types/block';
import { BlockEditor } from './BlockEditor';
import { ColumnDivider } from './ColumnDivider';
import { BlockLayoutControls } from './BlockLayoutControls';

interface LayoutRowProps {
  row: LayoutRowType;
  blocks: Block[];
  onUpdateBlock: (block: Block) => void;
  onCreateSibling: (blockId: string) => void;
  onColumnResize: (rowId: string, columnId: string, newWidth: number) => void;
  onMoveBlock: (blockId: string, targetColumnId: string) => void;
  editingBlockId: string | null;
  onToggleEdit: (blockId: string) => void;
  onCreateNewBlock?: (blockId: string, position: 'before' | 'after' | 'split', content?: string) => void;
  onDragBlock?: (sourceBlockId: string, targetBlockId: string) => void;
  draggingBlockId: string | null;
  onSetDraggingBlock?: (blockId: string | null) => void;
}

export const LayoutRowComponent: React.FC<LayoutRowProps> = ({
  row,
  blocks,
  onUpdateBlock,
  onCreateSibling,
  onColumnResize,
  onMoveBlock,
  editingBlockId,
  onToggleEdit,
  onCreateNewBlock,
  onDragBlock,
  draggingBlockId,
  onSetDraggingBlock,
}) => {
  // 获取列中的块
  const getBlocksInColumn = (column: LayoutColumn): Block[] => {
    return column.blockIds
      .map(id => blocks.find(b => b.id === id))
      .filter((b): b is Block => b !== undefined);
  };

  return (
    <div className="layout-row mb-4">
      <div className="flex gap-2">
        {row.columns.map((column, columnIndex) => (
          <React.Fragment key={column.id}>
            {/* 列 */}
            <div
              className="layout-column"
              style={{ width: `${column.width}%` }}
            >
              {getBlocksInColumn(column).map(block => (
                <div key={block.id} className="mb-2">
                  <BlockEditor
                    block={block}
                    onUpdate={onUpdateBlock}
                    isEditing={editingBlockId === block.id}
                    onToggleEdit={() => onToggleEdit(block.id)}
                    onCreateNewBlock={(position, content) => {
                      if (onCreateNewBlock) {
                        onCreateNewBlock(block.id, position, content);
                      }
                    }}
                    onDragStart={(blockId) => {
                      if (onSetDraggingBlock) {
                        onSetDraggingBlock(blockId);
                      }
                    }}
                    onDrop={(targetBlockId) => {
                      if (onDragBlock && draggingBlockId) {
                        onDragBlock(draggingBlockId, targetBlockId);
                      }
                    }}
                    isDragging={draggingBlockId === block.id}
                  />
                  
                  {/* 块布局控制按钮 */}
                  {row.columns.length < 3 && (
                    <BlockLayoutControls
                      onCreateSibling={() => onCreateSibling(block.id)}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* 列分隔线 */}
            {columnIndex < row.columns.length - 1 && (
              <ColumnDivider
                onResize={(delta) => {
                  const newWidth = column.width + delta;
                  onColumnResize(row.id, column.id, newWidth);
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
