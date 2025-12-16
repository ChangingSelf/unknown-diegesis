import React from 'react';
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
          <span className="flex items-center gap-2 text-blue-600">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            保存中...
          </span>
        );
      
      case 'saved':
        return (
          <span className="text-green-600">
            ✓ 所有更改已保存
            {lastSavedTime && (
              <span className="text-gray-500 text-xs ml-2">
                {formatTime(lastSavedTime)}
              </span>
            )}
          </span>
        );
      
      case 'error':
        return <span className="text-red-600">✗ 保存失败</span>;
      
      case 'modified':
        return <span className="text-yellow-600">● 未保存</span>;
      
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

  return (
    <div className="save-status-indicator px-4 py-2 text-sm">
      {getStatusDisplay()}
    </div>
  );
};
