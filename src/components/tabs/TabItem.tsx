import React, { useState, useRef } from 'react';
import { Tab } from '@/types';

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export const TabItem: React.FC<TabItemProps> = ({
  tab,
  isActive,
  onActivate,
  onClose,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver(e);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      setIsDragOver(true);
    }
    onDragOver(e);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    onDrop(e);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onActivate}
      onContextMenu={onContextMenu}
      className={`
        flex items-center gap-2 px-3 h-9 min-w-[120px] max-w-[200px]
        border border-gray-200 rounded-t-md cursor-pointer
        transition-colors duration-200 select-none
        ${isActive ? 'bg-white border-b-white -mb-px z-10' : 'bg-gray-50 hover:bg-gray-100'}
        ${isDragOver ? 'bg-blue-50 border-blue-300' : ''}
        ${tab.isPinned ? 'pr-2' : ''}
      `}
    >
      {tab.isPinned && <span className="text-blue-500 text-xs">📌</span>}

      <span className="flex-1 truncate text-sm text-gray-700">{tab.title}</span>

      {tab.isModified && <span className="text-blue-500 text-lg leading-none">●</span>}

      <button
        onClick={handleClose}
        className={`
          flex items-center justify-center w-5 h-5 rounded
          text-gray-400 hover:text-gray-600 hover:bg-gray-200
          transition-colors
          ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
        aria-label="关闭标签页"
      >
        ✕
      </button>
    </div>
  );
};
