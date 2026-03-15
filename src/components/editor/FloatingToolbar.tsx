import React from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Editor as TiptapEditor } from '@tiptap/react';
import { Button, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  HighlightOutlined,
  OrderedListOutlined,
  CodeOutlined,
  LinkOutlined,
} from '@ant-design/icons';

interface FloatingToolbarProps {
  editor: TiptapEditor;
  children?: React.ReactNode;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ editor, children }) => {
  if (!editor) {
    return null;
  }

  const handleBold = () => {
    editor.chain().focus().toggleBold().run();
  };

  const handleItalic = () => {
    editor.chain().focus().toggleItalic().run();
  };

  const handleStrike = () => {
    editor.chain().focus().toggleStrike().run();
  };

  const handleHighlight = () => {
    editor.chain().focus().toggleHighlight().run();
  };

  const handleHeading = (level: 1 | 2 | 3) => {
    editor.chain().focus().toggleHeading({ level }).run();
  };

  const handleBlockquote = () => {
    editor.chain().focus().toggleBlockquote().run();
  };

  const handleCode = () => {
    editor.chain().focus().toggleCode().run();
  };

  const handleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const isActive = (type: string, attrs?: Record<string, unknown>) => {
    return editor.isActive(type, attrs);
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ state }) => {
        const { from, to } = state.selection;
        return from !== to;
      }}
      className="flex items-center gap-1 px-2 py-1.5 bg-white rounded-lg shadow-lg border border-gray-200"
    >
      <Tooltip title="加粗 (Ctrl+B)">
        <Button
          type="text"
          size="small"
          icon={<BoldOutlined />}
          onClick={handleBold}
          className={isActive('bold') ? 'bg-gray-200' : ''}
        />
      </Tooltip>

      <Tooltip title="斜体 (Ctrl+I)">
        <Button
          type="text"
          size="small"
          icon={<ItalicOutlined />}
          onClick={handleItalic}
          className={isActive('italic') ? 'bg-gray-200' : ''}
        />
      </Tooltip>

      <Tooltip title="删除线 (Ctrl+Shift+X)">
        <Button
          type="text"
          size="small"
          icon={<StrikethroughOutlined />}
          onClick={handleStrike}
          className={isActive('strike') ? 'bg-gray-200' : ''}
        />
      </Tooltip>

      <Tooltip title="高亮 (Ctrl+Shift+H)">
        <Button
          type="text"
          size="small"
          icon={<HighlightOutlined />}
          onClick={handleHighlight}
          className={isActive('highlight') ? 'bg-gray-200' : ''}
        />
      </Tooltip>

      <div className="w-px h-4 bg-gray-300 mx-1" />

      <Tooltip title="标题1 (Ctrl+Alt+1)">
        <Button
          type="text"
          size="small"
          onClick={() => handleHeading(1)}
          className={isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
        >
          H1
        </Button>
      </Tooltip>

      <Tooltip title="标题2 (Ctrl+Alt+2)">
        <Button
          type="text"
          size="small"
          onClick={() => handleHeading(2)}
          className={isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
        >
          H2
        </Button>
      </Tooltip>

      <Tooltip title="标题3 (Ctrl+Alt+3)">
        <Button
          type="text"
          size="small"
          onClick={() => handleHeading(3)}
          className={isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}
        >
          H3
        </Button>
      </Tooltip>

      <div className="w-px h-4 bg-gray-300 mx-1" />

      <Tooltip title="引用 (Ctrl+Shift+B)">
        <Button
          type="text"
          size="small"
          icon={<OrderedListOutlined />}
          onClick={handleBlockquote}
          className={isActive('blockquote') ? 'bg-gray-200' : ''}
        />
      </Tooltip>

      <Tooltip title="代码 (Ctrl+E)">
        <Button
          type="text"
          size="small"
          icon={<CodeOutlined />}
          onClick={handleCode}
          className={isActive('code') ? 'bg-gray-200' : ''}
        />
      </Tooltip>

      <Tooltip title="链接 (Ctrl+K)">
        <Button
          type="text"
          size="small"
          icon={<LinkOutlined />}
          onClick={handleLink}
          className={isActive('link') ? 'bg-gray-200' : ''}
        />
      </Tooltip>

      {children}
    </BubbleMenu>
  );
};

export default FloatingToolbar;
