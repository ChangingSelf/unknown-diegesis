import React, { useState, useRef } from 'react';
import { Tabs, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { PushpinOutlined, CloseOutlined } from '@ant-design/icons';
import { Tab } from '@/types';

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
  const dragCounterRef = useRef(0);

  const handleDragStart = (tabId: string) => (e: React.DragEvent) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabId);
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
    dragCounterRef.current = 0;
  };

  const renderTabLabel = (tab: Tab) => {
    const contextMenuItems: MenuProps['items'] = [
      {
        key: 'togglePin',
        label: tab.isPinned ? '取消固定' : '固定标签页',
        icon: <PushpinOutlined />,
        onClick: () => onTogglePin(tab.id),
      },
      { type: 'divider' },
      {
        key: 'close',
        label: '关闭',
        onClick: () => onTabClose(tab.id),
      },
      {
        key: 'closeOthers',
        label: '关闭其他',
        onClick: () => onCloseOthers(tab.id),
      },
      {
        key: 'closeRight',
        label: '关闭右侧所有',
        onClick: () => onCloseRight(tab.id),
      },
      {
        key: 'closeAll',
        label: '关闭所有',
        onClick: () => onCloseAll(),
      },
    ];

    return (
      <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
        <div
          draggable
          onDragStart={handleDragStart(tab.id)}
          onDragOver={handleDragOver}
          onDrop={handleDrop(tab.id)}
          className="flex items-center gap-1.5 h-full px-1"
        >
          {tab.isPinned && <PushpinOutlined style={{ fontSize: 10, color: '#1890ff' }} />}
          <span className="truncate max-w-[120px]">{tab.title}</span>
          {tab.isModified && (
            <span style={{ color: '#1890ff', fontSize: 8, marginLeft: 2 }}>●</span>
          )}
        </div>
      </Dropdown>
    );
  };

  if (tabs.length === 0) {
    return null;
  }

  const tabItems = tabs.map(tab => ({
    key: tab.id,
    label: renderTabLabel(tab),
    closable: !tab.isPinned,
    closeIcon: (
      <CloseOutlined
        style={{ fontSize: 10 }}
        onClick={e => {
          e.stopPropagation();
          onTabClose(tab.id);
        }}
      />
    ),
  }));

  return (
    <div className="bg-white border-b border-gray-200" style={{ margin: '0 8px' }}>
      <Tabs
        type="editable-card"
        activeKey={activeTabId || undefined}
        items={tabItems}
        onChange={key => onTabActivate(key)}
        onEdit={(targetKey, action) => {
          if (action === 'remove' && typeof targetKey === 'string') {
            onTabClose(targetKey);
          }
        }}
        hideAdd
        size="small"
        tabBarStyle={{
          marginBottom: 0,
          paddingLeft: 8,
          paddingRight: 8,
        }}
      />
    </div>
  );
};
