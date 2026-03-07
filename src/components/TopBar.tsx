import React from 'react';
import { Button, Space, Tag, Typography } from 'antd';
import {
  SaveOutlined,
  ExportOutlined,
  FileAddOutlined,
  FolderOpenOutlined,
  CloseOutlined,
  CheckOutlined,
  LoadingOutlined,
  ExclamationOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

export type ViewMode = 'welcome' | 'workspace' | 'single-file';

export interface TopBarProps {
  viewMode: ViewMode;
  title?: string;
  isModified: boolean;
  saveStatus: 'saving' | 'saved' | 'error' | 'modified' | 'idle';
  lastSavedTime?: Date | null;
  onSave?: () => void;
  onOpen?: () => void;
  onNew?: () => void;
  onCloseWorkspace?: () => void;
  onExportMarkdown?: () => void;
}

const SaveStatusIndicator: React.FC<{
  status: TopBarProps['saveStatus'];
  isModified?: boolean;
  lastSavedTime?: Date | null;
}> = ({ status, isModified, lastSavedTime }) => {
  const getIcon = () => {
    switch (status) {
      case 'saving':
        return <LoadingOutlined spin />;
      case 'saved':
        return <CheckOutlined />;
      case 'error':
        return <ExclamationOutlined />;
      case 'modified':
        return <span>•</span>;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (status) {
      case 'saving':
        return 'processing';
      case 'saved':
        return 'success';
      case 'error':
        return 'error';
      case 'modified':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getText = () => {
    const timeText = lastSavedTime ? ` ${lastSavedTime.toLocaleTimeString()}` : '';
    switch (status) {
      case 'saving':
        return '保存中...';
      case 'saved':
        return `已保存${timeText}`;
      case 'error':
        return '保存失败';
      case 'modified':
        return isModified ? '已修改' : '空闲';
      default:
        return '空闲';
    }
  };

  return (
    <Tag icon={getIcon()} color={getColor()}>
      {getText()}
    </Tag>
  );
};

export const TopBar: React.FC<TopBarProps> = ({
  viewMode,
  title,
  isModified,
  saveStatus,
  lastSavedTime,
  onSave,
  onOpen,
  onNew,
  onCloseWorkspace,
  onExportMarkdown,
}) => {
  const centerTitle =
    title ??
    (viewMode === 'welcome' ? 'Welcome' : viewMode === 'workspace' ? 'Workspace' : 'Untitled');

  const renderActions = () => {
    if (viewMode === 'welcome') {
      return (
        <>
          {onNew && (
            <Button icon={<FileAddOutlined />} onClick={onNew}>
              新建
            </Button>
          )}
          {onOpen && (
            <Button icon={<FolderOpenOutlined />} onClick={onOpen}>
              打开
            </Button>
          )}
        </>
      );
    }

    if (viewMode === 'workspace') {
      return (
        <>
          {onSave && (
            <Button type="primary" icon={<SaveOutlined />} onClick={onSave}>
              保存
            </Button>
          )}
          {onExportMarkdown && (
            <Button icon={<ExportOutlined />} onClick={onExportMarkdown}>
              导出 MD
            </Button>
          )}
          {onNew && (
            <Button icon={<FileAddOutlined />} onClick={onNew}>
              新建
            </Button>
          )}
          {onOpen && (
            <Button icon={<FolderOpenOutlined />} onClick={onOpen}>
              打开
            </Button>
          )}
          {onCloseWorkspace && (
            <Button icon={<CloseOutlined />} onClick={onCloseWorkspace}>
              关闭工作区
            </Button>
          )}
        </>
      );
    }

    if (viewMode === 'single-file') {
      return (
        <>
          {onSave && (
            <Button type="primary" icon={<SaveOutlined />} onClick={onSave}>
              保存
            </Button>
          )}
          {onExportMarkdown && (
            <Button icon={<ExportOutlined />} onClick={onExportMarkdown}>
              导出 MD
            </Button>
          )}
          {onNew && (
            <Button icon={<FileAddOutlined />} onClick={onNew}>
              新建
            </Button>
          )}
          {onCloseWorkspace && (
            <Button icon={<CloseOutlined />} onClick={onCloseWorkspace}>
              关闭
            </Button>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <header
      style={{
        width: '100%',
        height: 40,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#262626', userSelect: 'none' }}>
          未知叙事
        </span>
      </div>

      <div style={{ flex: 1, textAlign: 'center', margin: '0 16px' }}>
        <Text style={{ userSelect: 'none' }}>{centerTitle}</Text>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <SaveStatusIndicator
          status={saveStatus}
          isModified={isModified}
          lastSavedTime={lastSavedTime ?? null}
        />
        <Space>{renderActions()}</Space>
      </div>
    </header>
  );
};

export default TopBar;
