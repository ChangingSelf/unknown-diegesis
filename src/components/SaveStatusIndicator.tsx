import React from 'react';
import { LoadingOutlined, CheckOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { SaveStatus } from '../types/block';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSavedTime: Date | null;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  lastSavedTime,
}) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'saving':
        return (
          <span className="flex items-center gap-2 text-ink-600 font-medium">
            <LoadingOutlined spin className="text-base" />
            保存中...
          </span>
        );

      case 'saved':
        return (
          <span className="flex items-center gap-2 text-success-600 font-medium">
            <CheckOutlined className="text-base" />
            <span>所有更改已保存</span>
            {lastSavedTime && (
              <span className="text-charcoal-400 text-sm ml-1">{formatTime(lastSavedTime)}</span>
            )}
          </span>
        );

      case 'error':
        return (
          <span className="flex items-center gap-2 text-danger-600 font-medium">
            <CloseCircleOutlined className="text-base" />
            保存失败
          </span>
        );

      case 'modified':
        return (
          <span className="flex items-center gap-2 text-warning-600 font-medium">
            <span className="w-2 h-2 bg-warning-500 rounded-full"></span>
            未保存
          </span>
        );

      default:
        return null;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;

    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return <div className="save-status-indicator px-4 py-2 text-sm">{getStatusDisplay()}</div>;
};
