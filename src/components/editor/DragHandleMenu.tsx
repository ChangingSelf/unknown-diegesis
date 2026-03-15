import React from 'react';
import { Editor as TiptapEditor } from '@tiptap/react';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  DeleteOutlined,
  CopyOutlined,
  ScissorOutlined,
  AlignLeftOutlined,
  UpOutlined,
  DownOutlined,
  HolderOutlined,
} from '@ant-design/icons';

interface DragHandleMenuProps {
  editor: TiptapEditor;
}

export const DragHandleMenu: React.FC<DragHandleMenuProps> = ({ editor }) => {
  const handleDelete = () => {
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).run();
  };

  const handleCopy = async () => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Ignore clipboard errors
    }
  };

  const handleCut = async () => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    try {
      await navigator.clipboard.writeText(text);
      editor.chain().focus().deleteRange({ from, to }).run();
    } catch {
      // Ignore clipboard errors
    }
  };

  const handleConvertToHeading = (level: 1 | 2 | 3) => {
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).setHeading({ level }).run();
  };

  const handleConvertToParagraph = () => {
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).setParagraph().run();
  };

  const handleMoveUp = () => {
    const { from } = editor.state.selection;
    const $pos = editor.state.doc.resolve(from);
    const node = $pos.nodeAfter;
    if (node) {
      const index = $pos.index();
      if (index > 0) {
        const deleteFrom = from;
        const deleteTo = from + node.nodeSize;
        editor.chain().focus().deleteRange({ from: deleteFrom, to: deleteTo }).run();
        const newPos = editor.state.doc.resolve(from - 1);
        editor.chain().focus().insertContentAt(newPos.pos, node).run();
      }
    }
  };

  const handleMoveDown = () => {
    const { from } = editor.state.selection;
    const $pos = editor.state.doc.resolve(from);
    const node = $pos.nodeAfter;
    if (node) {
      const index = $pos.index();
      const parent = $pos.parent;
      if (index < parent.childCount - 1) {
        const deleteFrom = from;
        const deleteTo = from + node.nodeSize;
        const endPos = deleteTo;
        const nextNode = parent.child(index + 1);
        editor.chain().focus().deleteRange({ from: deleteFrom, to: endPos }).run();
        const insertPos = from + nextNode.nodeSize;
        editor.chain().focus().insertContentAt(insertPos, node).run();
      }
    }
  };

  const items: MenuProps['items'] = [
    {
      key: 'delete',
      label: '删除块',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDelete,
    },
    {
      key: 'copy',
      label: '复制块',
      icon: <CopyOutlined />,
      onClick: handleCopy,
    },
    {
      key: 'cut',
      label: '剪切块',
      icon: <ScissorOutlined />,
      onClick: handleCut,
    },
    { type: 'divider' as const },
    {
      key: 'h1',
      label: '转换为标题 1',
      onClick: () => handleConvertToHeading(1),
    },
    {
      key: 'h2',
      label: '转换为标题 2',
      onClick: () => handleConvertToHeading(2),
    },
    {
      key: 'h3',
      label: '转换为标题 3',
      onClick: () => handleConvertToHeading(3),
    },
    {
      key: 'paragraph',
      label: '转换为段落',
      icon: <AlignLeftOutlined />,
      onClick: handleConvertToParagraph,
    },
    { type: 'divider' as const },
    {
      key: 'moveUp',
      label: '上移',
      icon: <UpOutlined />,
      onClick: handleMoveUp,
    },
    {
      key: 'moveDown',
      label: '下移',
      icon: <DownOutlined />,
      onClick: handleMoveDown,
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <span
        style={{
          cursor: 'pointer',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <HolderOutlined />
      </span>
    </Dropdown>
  );
};

export default DragHandleMenu;
