import React, { useState, useEffect } from 'react';
import { Tab } from '@/types';
import { TabItem } from './TabItem';
import { TabContextMenu } from './TabContextMenu';

interface TabsBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabActivate: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabReorder: (sourceId: string, targetId: string) => void;
  onCloseOthers: (tabId: string) => void;
  onCloseRight: (tabId: string) => void;
  onCloseAll: () => void;
  onTogglePin: (tabId: string) => void;
}

export const TabsBar: React.FC<TabsBarProps> = ({
  tabs,
  activeTabId,
  onTabActivate,
  onTabClose,
  onTabReorder,
  onCloseOthers,
  onCloseRight,
  onCloseAll,
  onTogglePin,
}) => {
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    tab: Tab;
    position: { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleDragStart = (tabId: string) => (e: React.DragEvent) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTabId && draggedTabId !== targetId) {
      onTabReorder(draggedTabId, targetId);
    }
    setDraggedTabId(null);
  };

  const handleContextMenu = (tab: Tab) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      tab,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-end gap-1 px-2 bg-gray-100 border-b border-gray-200">
        {tabs.map(tab => (
          <div key={tab.id} className="group">
            <TabItem
              tab={tab}
              isActive={tab.id === activeTabId}
              onActivate={() => onTabActivate(tab.id)}
              onClose={() => onTabClose(tab.id)}
              onContextMenu={handleContextMenu(tab)}
              onDragStart={handleDragStart(tab.id)}
              onDragOver={handleDragOver}
              onDrop={handleDrop(tab.id)}
            />
          </div>
        ))}
      </div>

      {contextMenu && (
        <TabContextMenu
          tab={contextMenu.tab}
          position={contextMenu.position}
          onClose={() => onTabClose(contextMenu.tab.id)}
          onCloseOthers={() => onCloseOthers(contextMenu.tab.id)}
          onCloseRight={() => onCloseRight(contextMenu.tab.id)}
          onCloseAll={onCloseAll}
          onTogglePin={() => onTogglePin(contextMenu.tab.id)}
          onCloseMenu={() => setContextMenu(null)}
        />
      )}
    </>
  );
};
