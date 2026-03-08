import React, { useState, useCallback, useMemo } from 'react';
import { Modal, Dropdown, message } from 'antd';
import { CloudUploadOutlined, CopyOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Block } from '@/types/block';
import { ImageBlockContent } from '@/types/image';
import { isRemoteUrl } from '@/utils/imagePath';
import { ImageHostManager } from '@/services/ImageHostManager';

interface ImageBlockProps {
  block: Block;
  onUpdate: (block: Block) => void;
  isEditing: boolean;
  onToggleEdit?: () => void;
  onDelete?: () => void;
  workspacePath?: string;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({
  block,
  onUpdate,
  isEditing,
  onToggleEdit,
  onDelete,
  workspacePath,
}) => {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [captionInput, setCaptionInput] = useState('');
  const [imageHostManager] = useState(() => new ImageHostManager());

  const content: ImageBlockContent = useMemo(
    () =>
      block.imageContent || {
        source: { type: 'local', path: '' },
      },
    [block.imageContent]
  );

  const currentAlignment = content.alignment || 'center';
  const currentWidth = content.width;
  const currentCaption = content.caption || '';

  const getImageUrl = (): string => {
    const { source } = content;

    if (source.type === 'remote' || isRemoteUrl(source.path)) {
      return source.path;
    }

    if (workspacePath && source.path) {
      const fullPath = workspacePath.endsWith('/')
        ? workspacePath + source.path
        : workspacePath + '/' + source.path;
      return `file:///${fullPath.replace(/\\/g, '/')}`;
    }

    return source.path;
  };

  const getAlignmentClass = (): string => {
    const alignmentMap = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    };
    return alignmentMap[currentAlignment];
  };

  const getSourceLabel = (): { icon: string; text: string } => {
    const { source } = content;
    if (source.type === 'remote' || isRemoteUrl(source.path)) {
      return { icon: '🌐', text: '图床' };
    }
    return { icon: '📁', text: '本地' };
  };

  const canToggleSource = (): boolean => {
    return false;
  };

  const updateImageContent = useCallback(
    (updates: Partial<ImageBlockContent>) => {
      onUpdate({
        ...block,
        imageContent: {
          ...content,
          ...updates,
        },
      });
    },
    [block, content, onUpdate]
  );

  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    updateImageContent({ alignment });
  };

  const handleWidthChange = (width: number | undefined) => {
    updateImageContent({ width });
  };

  const handleWidthPreset = (preset: string) => {
    const presetMap: Record<string, number | undefined> = {
      '25%': 200,
      '50%': 400,
      '75%': 600,
      '100%': undefined,
    };
    handleWidthChange(presetMap[preset]);
  };

  const handleCaptionChange = (caption: string) => {
    updateImageContent({ caption: caption || undefined });
  };

  const handleSourceToggle = () => {
    console.log('Toggle source not implemented yet');
  };

  const handleUploadToImageHost = async () => {
    const hosts = imageHostManager.getAllHosts();
    if (hosts.length === 0) {
      message.warning('请先配置图床');
      return;
    }

    const { source } = content;
    if (source.type === 'remote') {
      message.info('该图片已上传到图床');
      return;
    }

    const firstHost = hosts[0];
    const result = await imageHostManager.uploadImage(source.path, firstHost.id);

    if (result.success && result.remoteUrl) {
      updateImageContent({
        source: { type: 'remote', path: result.remoteUrl },
      });
      message.success('上传成功');
    } else {
      message.error(result.error || '上传失败');
    }
  };

  const handleCopyImageUrl = () => {
    navigator.clipboard.writeText(imageUrl);
    message.success('图片链接已复制');
  };

  const contextMenuItems: MenuProps['items'] = [
    {
      key: 'upload',
      label: '上传到图床',
      icon: <CloudUploadOutlined />,
      onClick: handleUploadToImageHost,
      disabled: content.source.type === 'remote',
    },
    {
      key: 'copy',
      label: '复制图片链接',
      icon: <CopyOutlined />,
      onClick: handleCopyImageUrl,
    },
  ];

  const imageUrl = getImageUrl();
  const sourceLabel = getSourceLabel();

  const renderEditMode = () => (
    <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-xs text-charcoal-500 mr-1">对齐:</span>
          <button
            className={`px-3 py-1.5 text-sm rounded transition-all ${
              currentAlignment === 'left'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-charcoal-600 hover:bg-gray-200'
            }`}
            onClick={() => handleAlignmentChange('left')}
            title="左对齐"
          >
            <span className="inline-block w-4 text-center">&lt;</span>
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded transition-all ${
              currentAlignment === 'center'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-charcoal-600 hover:bg-gray-200'
            }`}
            onClick={() => handleAlignmentChange('center')}
            title="居中"
          >
            <span className="inline-block w-4 text-center">○</span>
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded transition-all ${
              currentAlignment === 'right'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-charcoal-600 hover:bg-gray-200'
            }`}
            onClick={() => handleAlignmentChange('right')}
            title="右对齐"
          >
            <span className="inline-block w-4 text-center">&gt;</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-charcoal-500">宽度:</span>
          <input
            type="number"
            className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="自动"
            value={currentWidth || ''}
            onChange={e => {
              const value = e.target.value;
              if (value === '') {
                handleWidthChange(undefined);
              } else {
                const numValue = parseInt(value, 10);
                if (!isNaN(numValue) && numValue > 0) {
                  handleWidthChange(numValue);
                }
              }
            }}
            min="1"
          />
          <span className="text-xs text-charcoal-400">px</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            className={`px-2 py-1 text-xs rounded transition-all ${
              currentWidth === 200
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-charcoal-600 hover:bg-gray-200'
            }`}
            onClick={() => handleWidthPreset('25%')}
          >
            25%
          </button>
          <button
            className={`px-2 py-1 text-xs rounded transition-all ${
              currentWidth === 400
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-charcoal-600 hover:bg-gray-200'
            }`}
            onClick={() => handleWidthPreset('50%')}
          >
            50%
          </button>
          <button
            className={`px-2 py-1 text-xs rounded transition-all ${
              currentWidth === 600
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-charcoal-600 hover:bg-gray-200'
            }`}
            onClick={() => handleWidthPreset('75%')}
          >
            75%
          </button>
          <button
            className={`px-2 py-1 text-xs rounded transition-all ${
              !currentWidth
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-charcoal-600 hover:bg-gray-200'
            }`}
            onClick={() => handleWidthPreset('100%')}
          >
            100%
          </button>
        </div>
      </div>

      <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        <div className={`flex ${getAlignmentClass()} p-2`}>
          <div
            className="relative inline-block max-w-full"
            style={{ width: currentWidth ? `${currentWidth}px` : 'auto' }}
          >
            <img
              src={imageUrl}
              alt={currentCaption || '图片'}
              className="max-w-full h-auto rounded"
              onError={e => {
                console.error('图片加载失败:', imageUrl);
                const target = e.target as HTMLImageElement;
                target.style.backgroundColor = '#f0f0f0';
                target.style.minHeight = '150px';
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-charcoal-500 whitespace-nowrap">说明:</span>
        <input
          type="text"
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="添加图片说明..."
          value={captionInput || currentCaption}
          onChange={e => {
            setCaptionInput(e.target.value);
          }}
          onBlur={() => {
            handleCaptionChange(captionInput);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              handleCaptionChange(captionInput);
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        {canToggleSource() && (
          <button
            className="px-3 py-1.5 text-sm bg-gray-100 text-charcoal-600 rounded hover:bg-gray-200 transition-colors"
            onClick={handleSourceToggle}
          >
            切换图片来源
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {onToggleEdit && (
            <button
              className="px-3 py-1.5 text-sm bg-gray-100 text-charcoal-600 rounded hover:bg-gray-200 transition-colors"
              onClick={onToggleEdit}
            >
              完成
            </button>
          )}
          {onDelete && (
            <button
              className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              onClick={onDelete}
            >
              删除图片
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderViewMode = () => (
    <>
      <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
        <div
          className={`flex ${getAlignmentClass()} relative group`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className="relative inline-block max-w-full"
            style={{ width: currentWidth ? `${currentWidth}px` : 'auto' }}
          >
            <img
              src={imageUrl}
              alt={currentCaption || '图片'}
              className="max-w-full h-auto rounded-lg shadow-sm cursor-pointer"
              onClick={() => setIsPreviewVisible(true)}
              onError={e => {
                console.error('图片加载失败:', imageUrl);
                const target = e.target as HTMLImageElement;
                target.style.backgroundColor = '#f0f0f0';
                target.style.minHeight = '200px';
              }}
            />

            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-charcoal-600 flex items-center gap-1">
              <span>{sourceLabel.icon}</span>
              <span>{sourceLabel.text}</span>
            </div>

            {isHovered && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg transition-opacity">
                <button
                  className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-charcoal-700 hover:bg-white transition-colors text-sm font-medium"
                  onClick={() => setIsPreviewVisible(true)}
                >
                  🔍 预览大图
                </button>
              </div>
            )}
          </div>
        </div>
      </Dropdown>

      {currentCaption && (
        <div className="mt-2 text-center text-sm text-charcoal-500 italic">{currentCaption}</div>
      )}
    </>
  );

  return (
    <div className="image-block">
      {isEditing ? renderEditMode() : renderViewMode()}

      <Modal
        open={isPreviewVisible}
        footer={null}
        onCancel={() => setIsPreviewVisible(false)}
        width="90%"
        style={{ top: 20 }}
        centered
      >
        <div className="flex flex-col items-center">
          <img
            src={imageUrl}
            alt={currentCaption || '图片预览'}
            className="max-w-full max-h-[80vh] object-contain"
          />
          {currentCaption && (
            <div className="mt-4 text-center text-charcoal-600">{currentCaption}</div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ImageBlock;
