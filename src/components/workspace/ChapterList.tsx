import React, { useState } from 'react';
import { Button, List, Typography, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';
import { ChapterMeta } from '@/types/chapter';

const { Text } = Typography;

interface ChapterListProps {
  chapters: ChapterMeta[];
  currentChapterId: string | null;
  onSelect: (chapterId: string) => void;
  onCreate: () => void;
  onDelete: (chapterId: string) => void;
  onReorder: (chapterIds: string[]) => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  currentChapterId,
  onSelect,
  onCreate,
  onDelete,
  onReorder,
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <EditOutlined />;
      case 'revising':
        return <EditOutlined />;
      case 'final':
        return <CheckOutlined />;
      default:
        return <EditOutlined />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200">
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} block>
          新建章节
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chapters.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">暂无章节，点击上方按钮创建</div>
        ) : (
          <List
            dataSource={chapters}
            renderItem={chapter => (
              <List.Item
                draggable
                onDragStart={e => handleDragStart(e, chapter.id)}
                onDragOver={e => handleDragOver(e, chapter.id)}
                onDragEnd={handleDragEnd}
                onDrop={e => handleDrop(e, chapter.id)}
                onClick={() => onSelect(chapter.id)}
                className={`cursor-pointer transition-colors ${
                  currentChapterId === chapter.id
                    ? 'bg-blue-50 border-r-2 border-blue-500'
                    : 'hover:bg-gray-50'
                } ${dragOverId === chapter.id ? 'border-t-2 border-blue-400' : ''}`}
                actions={[
                  <Popconfirm
                    key="delete"
                    title="确定删除此章节？"
                    description="删除后无法恢复"
                    onConfirm={e => {
                      e?.stopPropagation();
                      onDelete(chapter.id);
                    }}
                    onCancel={e => e?.stopPropagation()}
                    okText="删除"
                    cancelText="取消"
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={e => e.stopPropagation()}
                    />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div className="flex items-center gap-2">
                      <Text type="secondary" className="w-6 text-xs">
                        {String(chapter.number).padStart(2, '0')}
                      </Text>
                      {getStatusIcon(chapter.status)}
                    </div>
                  }
                  title={chapter.title}
                  description={`${chapter.wordCount.toLocaleString()} 字`}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};
