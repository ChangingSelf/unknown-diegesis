import { memo, useCallback } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  DeleteOutlined,
  HolderOutlined,
  FormOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';

type BlockType = 'paragraph' | 'heading' | 'bulletList' | 'orderedList' | 'taskList' | 'blockquote';

const blockTypeOptions: { key: BlockType; label: string; icon: React.ReactNode }[] = [
  { key: 'paragraph', label: '段落', icon: <FormOutlined /> },
  { key: 'heading', label: '标题', icon: <span className="font-bold">H</span> },
  { key: 'bulletList', label: '无序列表', icon: <UnorderedListOutlined /> },
  { key: 'orderedList', label: '有序列表', icon: <OrderedListOutlined /> },
  { key: 'taskList', label: '任务列表', icon: <CheckSquareOutlined /> },
  { key: 'blockquote', label: '引用', icon: <span>"</span> },
];

const BlockWrapperView = memo(({ node, selected, updateAttributes, deleteNode }: NodeViewProps) => {
  const blockType = (node.attrs.blockType as BlockType) || 'paragraph';

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleBlockTypeChange = useCallback(
    (newType: BlockType) => {
      updateAttributes({
        blockType: newType,
        modified: new Date().toISOString(),
      });
    },
    [updateAttributes]
  );

  const handleDelete = useCallback(() => {
    deleteNode();
  }, [deleteNode]);

  const menuItems: MenuProps['items'] = [
    ...blockTypeOptions.map(option => ({
      key: option.key,
      label: option.label,
      icon: option.icon,
      onClick: () => handleBlockTypeChange(option.key),
    })),
    { type: 'divider' as const },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDelete,
    },
  ];

  return (
    <NodeViewWrapper
      className={`block-wrapper group relative ${selected ? 'ring-2 ring-blue-400' : ''}`}
      data-block-id={node.attrs.id}
      data-block-type={blockType}
      onMouseDown={handleMouseDown}
    >
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomLeft">
        <div
          className="block-handle absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5"
          contentEditable={false}
          draggable
          data-drag-handle
          onMouseDown={e => e.stopPropagation()}
        >
          <HolderOutlined className="text-gray-400 text-sm" />
        </div>
      </Dropdown>

      <div className="block-content pl-2">
        <NodeViewContent className="block-content-inner" />
      </div>
    </NodeViewWrapper>
  );
});

BlockWrapperView.displayName = 'BlockWrapperView';

export default BlockWrapperView;
