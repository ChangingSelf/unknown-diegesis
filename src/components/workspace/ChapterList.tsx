import React, { useState } from 'react';
import { ChapterMeta } from '@/types/chapter';

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
        return '📝';
      case 'revising':
        return '✏️';
      case 'final':
        return '✅';
      default:
        return '📝';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-paper-200">
        <button
          onClick={onCreate}
          className="w-full px-3 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + 新建章节
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chapters.length === 0 ? (
          <div className="p-4 text-center text-charcoal-400 text-sm">
            暂无章节，点击上方按钮创建
          </div>
        ) : (
          <div className="py-2">
            {chapters.map(chapter => (
              <div
                key={chapter.id}
                draggable
                onDragStart={e => handleDragStart(e, chapter.id)}
                onDragOver={e => handleDragOver(e, chapter.id)}
                onDragEnd={handleDragEnd}
                onDrop={e => handleDrop(e, chapter.id)}
                onClick={() => onSelect(chapter.id)}
                className={`group flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors ${
                  currentChapterId === chapter.id
                    ? 'bg-gold-50 border-r-2 border-gold-500'
                    : 'hover:bg-paper-50'
                } ${dragOverId === chapter.id ? 'border-t-2 border-gold-400' : ''}`}
              >
                <span className="text-xs text-charcoal-400 w-8">
                  {String(chapter.number).padStart(2, '0')}
                </span>
                <span className="text-lg">{getStatusIcon(chapter.status)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-charcoal-800 truncate">
                    {chapter.title}
                  </div>
                  <div className="text-xs text-charcoal-400">
                    {chapter.wordCount.toLocaleString()} 字
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (confirm('确定删除此章节？')) {
                      onDelete(chapter.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-500 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
