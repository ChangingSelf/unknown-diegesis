import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { Input, Button, Space, Dropdown } from 'antd';
import { PictureOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { ImageMetadataManager } from '@/utils/ImageMetadataManager';

type ImageLayout = 'full' | 'left' | 'right' | 'center';

const metadataManager = new ImageMetadataManager();

const ImageBlockView = memo(({ node, updateAttributes, selected, deleteNode }: NodeViewProps) => {
  const [isEditing, setIsEditing] = useState(!node.attrs.src);
  const [tempSrc, setTempSrc] = useState(node.attrs.src || '');
  const [tempAlt, setTempAlt] = useState(node.attrs.alt || '');
  const [tempCaption, setTempCaption] = useState(node.attrs.caption || '');
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [customWidth, setCustomWidth] = useState<number | null>(node.attrs.width || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resizeStartRef = useRef<{ x: number; width: number } | null>(null);

  const id = node.attrs.id;
  const src = node.attrs.src;
  const alt = node.attrs.alt;
  const layout = (node.attrs.layout as ImageLayout) || 'full';
  const caption = node.attrs.caption;

  useEffect(() => {
    if (src && id) {
      const img = new Image();
      img.onload = () => {
        const size = { width: img.naturalWidth, height: img.naturalHeight };
        setImageSize(size);
        metadataManager.add(id, {
          id,
          width: size.width,
          height: size.height,
          alt,
          caption,
          alignment: layout === 'full' ? 'center' : layout,
        });
      };
      img.src = src;
    }
  }, [src, id, alt, caption, layout]);

  const handleSave = useCallback(() => {
    updateAttributes({
      src: tempSrc,
      alt: tempAlt,
      caption: tempCaption,
    });
    setIsEditing(false);
  }, [tempSrc, tempAlt, tempCaption, updateAttributes]);

  const handleCancel = useCallback(() => {
    setTempSrc(src || '');
    setTempAlt(alt || '');
    setTempCaption(caption || '');
    setIsEditing(false);
  }, [src, alt, caption]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = ev => {
          const dataUrl = ev.target?.result as string;
          updateAttributes({
            src: dataUrl,
          });
          setTempSrc(dataUrl);
        };
        reader.readAsDataURL(file);
      }
    },
    [updateAttributes]
  );

  const handleLayoutChange = useCallback(
    (newLayout: ImageLayout) => {
      updateAttributes({ layout: newLayout });
    },
    [updateAttributes]
  );

  const handleDelete = useCallback(() => {
    deleteNode();
  }, [deleteNode]);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startWidth = customWidth || imageSize?.width || 300;
      resizeStartRef.current = { x: e.clientX, width: startWidth };
      setIsResizing(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizeStartRef.current) return;
        const deltaX = moveEvent.clientX - resizeStartRef.current.x;
        const newWidth = Math.max(100, resizeStartRef.current.width + deltaX);
        setCustomWidth(newWidth);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        if (resizeStartRef.current) {
          updateAttributes({ width: customWidth });
        }
        resizeStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [customWidth, imageSize, updateAttributes]
  );

  const layoutMenuItems: MenuProps['items'] = [
    {
      key: 'full',
      label: '全宽',
      onClick: () => handleLayoutChange('full'),
    },
    {
      key: 'left',
      label: '左对齐',
      onClick: () => handleLayoutChange('left'),
    },
    {
      key: 'center',
      label: '居中',
      onClick: () => handleLayoutChange('center'),
    },
    {
      key: 'right',
      label: '右对齐',
      onClick: () => handleLayoutChange('right'),
    },
    { type: 'divider' },
    {
      key: 'delete',
      label: '删除',
      danger: true,
      icon: <DeleteOutlined />,
      onClick: handleDelete,
    },
  ];

  if (isEditing) {
    return (
      <NodeViewWrapper
        className={`image-block-editing p-4 bg-paper-50 rounded-lg border border-paper-200 ${selected ? 'block-selected' : ''}`}
        data-type="image-block"
      >
        <div className="mb-3">
          <label className="block text-sm font-medium text-charcoal-700 mb-1">图片地址</label>
          <Space.Compact className="w-full">
            <Input
              value={tempSrc}
              onChange={e => setTempSrc(e.target.value)}
              placeholder="输入图片 URL 或选择文件"
              className="flex-1"
            />
            <Button onClick={() => fileInputRef.current?.click()}>选择文件</Button>
          </Space.Compact>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-charcoal-700 mb-1">替代文本</label>
          <Input
            value={tempAlt}
            onChange={e => setTempAlt(e.target.value)}
            placeholder="图片描述（用于无障碍访问）"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-charcoal-700 mb-1">图片说明</label>
          <Input
            value={tempCaption}
            onChange={e => setTempCaption(e.target.value)}
            placeholder="图片说明（可选）"
          />
        </div>

        <div className="flex gap-2">
          <Button type="primary" onClick={handleSave} disabled={!tempSrc}>
            保存
          </Button>
          <Button onClick={handleCancel}>取消</Button>
        </div>
      </NodeViewWrapper>
    );
  }

  const containerClass = `image-block group relative ${layout}`;
  const textAlign =
    layout === 'left' ? 'text-left' : layout === 'right' ? 'text-right' : 'text-center';

  return (
    <NodeViewWrapper
      className={`${containerClass} ${selected ? 'block-selected' : ''}`}
      data-type="image-block"
    >
      <div
        className="image-controls absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        contentEditable={false}
      >
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
            编辑
          </Button>
          <Dropdown menu={{ items: layoutMenuItems }} trigger={['click']}>
            <Button size="small" icon={<PictureOutlined />}>
              布局
            </Button>
          </Dropdown>
        </Space>
      </div>

      <div className={`image-container ${textAlign}`}>
        {src ? (
          <div className={`inline-block relative group ${selected ? 'selected' : ''}`}>
            <img
              src={src}
              alt={alt || ''}
              className={`max-w-full h-auto ${layout === 'center' ? 'mx-auto' : ''} ${isResizing ? 'select-none' : ''}`}
              style={customWidth ? { width: `${customWidth}px` } : undefined}
            />
            {selected && (
              <div
                className="resize-handle"
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  width: 12,
                  height: 12,
                  backgroundColor: '#3b82f6',
                  border: '2px solid white',
                  borderRadius: '2px',
                  cursor: 'nwse-resize',
                  transform: 'translate(50%, 50%)',
                }}
                onMouseDown={handleResizeMouseDown}
                title="拖拽调整宽度"
              />
            )}
          </div>
        ) : (
          <div
            className="w-full h-32 bg-paper-100 rounded flex items-center justify-center text-charcoal-400 cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            <PictureOutlined className="text-3xl mr-2" />
            <span>点击添加图片</span>
          </div>
        )}
      </div>

      {caption && (
        <div
          className="image-caption mt-2 text-center text-sm text-charcoal-500"
          contentEditable={false}
        >
          {caption}
        </div>
      )}

      {imageSize && (
        <div className="text-xs text-charcoal-400 mt-1" contentEditable={false}>
          {imageSize.width} × {imageSize.height} px
        </div>
      )}
    </NodeViewWrapper>
  );
});

ImageBlockView.displayName = 'ImageBlockView';

export default ImageBlockView;
