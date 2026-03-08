import React, { useState, useRef } from 'react';
import { Button, List, Typography, Tag, Tooltip, Input, Dropdown } from 'antd';
import type { InputRef } from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import { DocumentMeta } from '@/types/document';

const { Text } = Typography;

interface ChapterListProps {
  chapters: DocumentMeta[];
  currentChapterId: string | null;
  onSelect: (chapterId: string) => void;
  onCreate: () => void;
  onDelete: (chapterId: string) => void;
  onReorder: (chapterIds: string[]) => void;
  onRename: (chapterId: string, newTitle: string) => void;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  revising: { color: 'processing', label: '修改中' },
  final: { color: 'success', label: '定稿' },
};

export const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  currentChapterId,
  onSelect,
  onCreate,
  onDelete,
  onReorder,
  onRename,
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [contextMenuChapter, setContextMenuChapter] = useState<DocumentMeta | null>(null);
  const inputRef = useRef<InputRef>(null);

  const handleContextMenu = (e: React.MouseEvent, chapter: DocumentMeta) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuChapter(chapter);
  };

  const handleContextMenuRename = () => {
    if (contextMenuChapter) {
      setEditingId(contextMenuChapter.id);
      setEditingTitle(contextMenuChapter.title);
      setContextMenuChapter(null);
    }
  };

  const contextMenuItems: MenuProps['items'] = contextMenuChapter
    ? [
        {
          key: 'rename',
          label: (
            <span className="flex items-center gap-2">
              <EditOutlined />
              重命名
            </span>
          ),
          onClick: handleContextMenuRename,
        },
        {
          type: 'divider',
        },
        {
          key: 'delete',
          label: '删除章节',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => {
            onDelete(contextMenuChapter.id);
            setContextMenuChapter(null);
          },
        },
      ]
    : [];

  const handleDragStart = (e: React.DragEvent, chapterId: string) => {
    setDraggedId(chapterId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, chapterId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== chapterId) {
      setDragOverId(chapterId);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const currentIndex = chapters.findIndex(ch => ch.id === draggedId);
    const targetIndex = chapters.findIndex(ch => ch.id === targetId);

    if (currentIndex !== -1 && targetIndex !== -1) {
      const newOrder = [...chapters];
      const [removed] = newOrder.splice(currentIndex, 1);
      newOrder.splice(targetIndex, 0, removed);
      onReorder(newOrder.map(ch => ch.id));
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleStartEdit = (e: React.MouseEvent, chapter: DocumentMeta) => {
    e.stopPropagation();
    setEditingId(chapter.id);
    setEditingTitle(chapter.title);
  };

  const handleEditBlur = (chapterId: string) => {
    const trimmedTitle = editingTitle.trim();
    if (trimmedTitle) {
      onRename(chapterId, trimmedTitle);
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, chapterId: string) => {
    if (e.key === 'Enter') {
      handleEditBlur(chapterId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingTitle('');
    }
  };

  const getStatusTag = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    const icon = status === 'final' ? <CheckCircleOutlined /> : <EditOutlined />;
    return (
      <Tag color={config.color} icon={icon} className="!m-0 !text-xs">
        {config.label}
      </Tag>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-100">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} block>
          新建章节
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <EditOutlined className="text-3xl mb-2" />
            <Text type="secondary">暂无章节</Text>
            <Text type="secondary" className="text-xs">
              点击上方按钮创建
            </Text>
          </div>
        ) : (
          <List
            dataSource={chapters}
            renderItem={chapter => {
              const isSelected = currentChapterId === chapter.id;
              const isDragOver = dragOverId === chapter.id;

              return (
                <Dropdown
                  key={chapter.id}
                  menu={{ items: contextMenuItems }}
                  trigger={['contextMenu']}
                  onOpenChange={open => {
                    if (open) {
                      setContextMenuChapter(chapter);
                    }
                  }}
                >
                  <List.Item
                    draggable
                    onDragStart={e => handleDragStart(e, chapter.id)}
                    onDragOver={e => handleDragOver(e, chapter.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={e => handleDrop(e, chapter.id)}
                    onContextMenu={e => handleContextMenu(e, chapter)}
                    onClick={() => {
                      if (editingId !== chapter.id) {
                        onSelect(chapter.id);
                      }
                    }}
                    className={`
                      cursor-pointer transition-all duration-200 !px-3 !py-2
                      ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50 border-l-2 border-l-transparent'}
                      ${isDragOver ? 'border-t-2 border-t-blue-400 bg-blue-50/50' : ''}
                    `}
                    actions={[
                      <Tooltip key="delete" title="删除章节">
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={e => {
                            e.stopPropagation();
                            onDelete(chapter.id);
                          }}
                          className="opacity-0 group-hover:opacity-100"
                        />
                      </Tooltip>,
                    ]}
                  >
                    <div className="flex items-center gap-2 w-full group">
                      <HolderOutlined className="text-gray-300 cursor-grab" />
                      <Text type="secondary" className="w-6 text-xs font-mono">
                        {String(chapter.number).padStart(2, '0')}
                      </Text>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {editingId === chapter.id ? (
                            <Input
                              ref={inputRef}
                              value={editingTitle}
                              onChange={e => setEditingTitle(e.target.value)}
                              onBlur={() => handleEditBlur(chapter.id)}
                              onKeyDown={e => handleEditKeyDown(e, chapter.id)}
                              onClick={e => e.stopPropagation()}
                              size="small"
                              className="flex-1"
                              autoFocus
                            />
                          ) : (
                            <Text
                              strong={isSelected}
                              className={`truncate cursor-text ${isSelected ? '!text-blue-600' : '!text-gray-800'}`}
                              onClick={e => handleStartEdit(e, chapter)}
                            >
                              {chapter.title}
                            </Text>
                          )}
                          {getStatusTag(chapter.status ?? 'draft')}
                        </div>
                        <Text type="secondary" className="text-xs">
                          {chapter.wordCount.toLocaleString()} 字
                        </Text>
                      </div>
                    </div>
                  </List.Item>
                </Dropdown>
              );
            }}
          />
        )}
      </div>
    </div>
  );
};
