import React from 'react';
import { Button, Space, Typography } from 'antd';
import {
  FolderAddOutlined,
  FolderOpenOutlined,
  CloseOutlined,
  SaveOutlined,
  FileAddOutlined,
  ExportOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface FileMenuProps {
  fileName?: string;
  isModified: boolean;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onNew?: () => void;
  workspaceName?: string;
  onOpenWorkspace?: () => void;
  onCreateWorkspace?: () => void;
  onCloseWorkspace?: () => void;
}

export const FileMenu: React.FC<FileMenuProps> = ({
  fileName,
  isModified,
  onOpen,
  onSave,
  onSaveAs,
  onNew,
  workspaceName,
  onOpenWorkspace,
  onCreateWorkspace,
  onCloseWorkspace,
}) => {
  const isWorkspaceMode = !!workspaceName;

  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
      <div className="font-semibold text-base">
        <Text strong>{isWorkspaceMode ? workspaceName : fileName}</Text>
        {isModified && <Text type="warning"> *</Text>}
      </div>

      <Space>
        {isWorkspaceMode ? (
          <>
            <Button icon={<FolderAddOutlined />} onClick={onCreateWorkspace}>
              新建工作区
            </Button>
            <Button icon={<FolderOpenOutlined />} onClick={onOpenWorkspace}>
              打开工作区
            </Button>
            <Button icon={<CloseOutlined />} onClick={onCloseWorkspace}>
              关闭工作区
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={onSave} disabled={!isModified}>
              保存章节
            </Button>
          </>
        ) : (
          <>
            <Button icon={<FileAddOutlined />} onClick={onNew}>
              新建
            </Button>
            <Button icon={<FolderOpenOutlined />} onClick={onOpen}>
              打开
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={onSave} disabled={!isModified}>
              保存
            </Button>
            <Button icon={<ExportOutlined />} onClick={onSaveAs}>
              另存为
            </Button>
          </>
        )}
      </Space>
    </div>
  );
};
