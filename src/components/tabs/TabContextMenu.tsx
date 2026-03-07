import React from 'react';
import { Menu } from 'antd';
import { Tab } from '@/types';

interface TabContextMenuProps {
  tab: Tab;
  position: { x: number; y: number };
  onClose: () => void;
  onCloseOthers: () => void;
  onCloseRight: () => void;
  onCloseAll: () => void;
  onTogglePin: () => void;
  onCloseMenu: () => void;
}

export const TabContextMenu: React.FC<TabContextMenuProps> = ({
  tab,
  position,
  onClose,
  onCloseOthers,
  onCloseRight,
  onCloseAll,
  onTogglePin,
  onCloseMenu,
}) => {
  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'close':
        onClose();
        break;
      case 'closeOthers':
        onCloseOthers();
        break;
      case 'closeRight':
        onCloseRight();
        break;
      case 'closeAll':
        onCloseAll();
        break;
      case 'togglePin':
        onTogglePin();
        break;
    }
    onCloseMenu();
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
      onClick={e => e.stopPropagation()}
    >
      <Menu
        onClick={({ key }) => handleMenuClick(key)}
        style={{ minWidth: 150 }}
        items={[
          {
            key: 'togglePin',
            label: tab.isPinned ? '取消固定' : '固定标签页',
          },
          { type: 'divider' },
          {
            key: 'close',
            label: '关闭',
          },
          {
            key: 'closeOthers',
            label: '关闭其他',
          },
          {
            key: 'closeRight',
            label: '关闭右侧所有',
          },
          {
            key: 'closeAll',
            label: '关闭所有',
          },
        ]}
      />
    </div>
  );
};
