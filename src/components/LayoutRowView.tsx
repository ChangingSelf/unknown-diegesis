import { memo, useCallback } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Button, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const LayoutRowView = memo(({ node, selected, deleteNode, editor }: NodeViewProps) => {
  const columnCount = node.childCount;

  const handleAddColumn = useCallback(() => {
    if (columnCount >= 3) return;

    const pos = editor.state.doc.resolve(editor.state.selection.from);
    const rowPos = pos.before(3);

    editor
      .chain()
      .focus()
      .insertContentAt(
        { from: rowPos + node.nodeSize - 1, to: rowPos + node.nodeSize - 1 },
        {
          type: 'layoutColumn',
          attrs: { width: 100 / (columnCount + 1) },
          content: [{ type: 'paragraph' }],
        }
      )
      .run();
  }, [columnCount, editor, node.nodeSize]);

  const handleDeleteRow = useCallback(() => {
    deleteNode();
  }, [deleteNode]);

  const handleRebalanceWidths = useCallback(() => {
    const equalWidth = 100 / columnCount;
    editor.state.doc.descendants((descNode, pos) => {
      if (descNode.type.name === 'layoutColumn') {
        editor.commands.command(({ tr }) => {
          tr.setNodeMarkup(pos, undefined, { ...descNode.attrs, width: equalWidth });
          return true;
        });
      }
    });
  }, [columnCount, editor]);

  return (
    <NodeViewWrapper
      className={`layout-row group relative mb-6 ${selected ? 'ring-2 ring-blue-400' : ''}`}
      data-type="layout-row"
    >
      <div
        className="layout-controls absolute right-0 top-0 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10"
        contentEditable={false}
      >
        <Space>
          {columnCount < 3 && (
            <Button size="small" icon={<PlusOutlined />} onClick={handleAddColumn}>
              添加列
            </Button>
          )}
          <Button size="small" onClick={handleRebalanceWidths}>
            均分宽度
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={handleDeleteRow}>
            删除行
          </Button>
        </Space>
      </div>

      <div className="layout-columns flex gap-3">
        <NodeViewContent className="layout-content flex gap-3 flex-1" />
      </div>
    </NodeViewWrapper>
  );
});

LayoutRowView.displayName = 'LayoutRowView';

export default LayoutRowView;
