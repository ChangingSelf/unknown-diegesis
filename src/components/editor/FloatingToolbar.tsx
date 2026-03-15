import React from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Editor as TiptapEditor } from '@tiptap/react';
import { Button, Space, Dropdown, ConfigProvider, Card } from 'antd';
import type { MenuProps } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  HighlightOutlined,
  OrderedListOutlined,
  CodeOutlined,
  LinkOutlined,
  FontSizeOutlined,
  DownOutlined,
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

  const headingItems: MenuProps['items'] = [
    {
      key: 'h1',
      label: (
        <span className={isActive('heading', { level: 1 }) ? 'font-bold text-primary' : ''}>
          标题 1
        </span>
      ),
      onClick: () => handleHeading(1),
    },
    {
      key: 'h2',
      label: (
        <span className={isActive('heading', { level: 2 }) ? 'font-bold text-primary' : ''}>
          标题 2
        </span>
      ),
      onClick: () => handleHeading(2),
    },
    {
      key: 'h3',
      label: (
        <span className={isActive('heading', { level: 3 }) ? 'font-bold text-primary' : ''}>
          标题 3
        </span>
      ),
      onClick: () => handleHeading(3),
    },
  ];

  const isHeadingActive =
    isActive('heading', { level: 1 }) ||
    isActive('heading', { level: 2 }) ||
    isActive('heading', { level: 3 });

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <BubbleMenu
        editor={editor}
        shouldShow={({ state }) => {
          const { from, to } = state.selection;
          return from !== to;
        }}
        options={{
          offset: 8,
          placement: 'top',
        }}
        className="floating-toolbar"
      >
        <Card size="small" styles={{ body: { padding: '4px 8px' } }}>
          <Space size={2}>
            <Space size={2}>
              <Button
                type={isActive('bold') ? 'primary' : 'text'}
                size="small"
                icon={<BoldOutlined />}
                onClick={handleBold}
                className="w-8 h-8"
              />
              <Button
                type={isActive('italic') ? 'primary' : 'text'}
                size="small"
                icon={<ItalicOutlined />}
                onClick={handleItalic}
                className="w-8 h-8"
              />
              <Button
                type={isActive('strike') ? 'primary' : 'text'}
                size="small"
                icon={<StrikethroughOutlined />}
                onClick={handleStrike}
                className="w-8 h-8"
              />
              <Button
                type={isActive('highlight') ? 'primary' : 'text'}
                size="small"
                icon={<HighlightOutlined />}
                onClick={handleHighlight}
                className="w-8 h-8"
              />
            </Space>

            <div className="w-px h-6 bg-gray-200" />

            <Dropdown menu={{ items: headingItems }} trigger={['click']} placement="bottom">
              <Button
                type={isHeadingActive ? 'primary' : 'text'}
                size="small"
                icon={<FontSizeOutlined />}
                className="min-w-16"
              >
                {isActive('heading', { level: 1 })
                  ? 'H1'
                  : isActive('heading', { level: 2 })
                    ? 'H2'
                    : isActive('heading', { level: 3 })
                      ? 'H3'
                      : '标题'}
                <DownOutlined className="text-xs ml-1" />
              </Button>
            </Dropdown>

            <div className="w-px h-6 bg-gray-200" />

            <Space size={2}>
              <Button
                type={isActive('blockquote') ? 'primary' : 'text'}
                size="small"
                icon={<OrderedListOutlined />}
                onClick={handleBlockquote}
                className="w-8 h-8"
              />
              <Button
                type={isActive('code') ? 'primary' : 'text'}
                size="small"
                icon={<CodeOutlined />}
                onClick={handleCode}
                className="w-8 h-8"
              />
              <Button
                type={isActive('link') ? 'primary' : 'text'}
                size="small"
                icon={<LinkOutlined />}
                onClick={handleLink}
                className="w-8 h-8"
              />
            </Space>

            {children}
          </Space>
        </Card>
      </BubbleMenu>
    </ConfigProvider>
  );
};

export default FloatingToolbar;
