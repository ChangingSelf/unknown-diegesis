import React from 'react';
import { Card, Typography, Modal } from 'antd';
import {
  PlusOutlined,
  FolderOutlined,
  FileAddOutlined,
  FileTextOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { RecentWorkspace } from '../services/RecentWorkspacesService';

const { Title, Text } = Typography;

export interface WelcomeScreenProps {
  onCreateWorkspace: () => void;
  onOpenWorkspace: () => void;
  onNewDocument: () => void;
  onOpenDocument: () => void;
  recentWorkspaces: RecentWorkspace[];
  onOpenRecentWorkspace: (path: string) => void;
  onRemoveRecentWorkspace: (path: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateWorkspace,
  onOpenWorkspace,
  onNewDocument,
  onOpenDocument,
  recentWorkspaces,
  onOpenRecentWorkspace,
  onRemoveRecentWorkspace,
}) => {
  const actionBlocks = [
    {
      id: 'create-workspace',
      title: '新建工作区',
      description: '创建一个新的工作区',
      icon: PlusOutlined,
      onClick: onCreateWorkspace,
    },
    {
      id: 'open-workspace',
      title: '打开工作区',
      description: '打开现有工作区',
      icon: FolderOutlined,
      onClick: onOpenWorkspace,
    },
    {
      id: 'new-document',
      title: '新建文档',
      description: '创建独立文档',
      icon: FileAddOutlined,
      onClick: onNewDocument,
    },
    {
      id: 'open-document',
      title: '打开文档',
      description: '打开已有文档',
      icon: FileTextOutlined,
      onClick: onOpenDocument,
    },
  ];

  const handleRemoveWorkspace = (e: React.MouseEvent, workspace: RecentWorkspace) => {
    e.stopPropagation();
    Modal.confirm({
      title: '确认删除',
      content: `确定要从最近列表中移除"${workspace.name}"吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        onRemoveRecentWorkspace(workspace.path);
      },
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center pt-[12vh]">
      <div className="text-center mb-10">
        <Title level={1} className="!mb-2 !text-slate-800">
          未知叙事
        </Title>
        <Text type="secondary">小说块编辑器</Text>
      </div>

      <div className="flex gap-[10px] w-full max-w-[800px] px-8">
        {actionBlocks.map(block => {
          const IconComponent = block.icon;
          return (
            <Card
              key={block.id}
              hoverable
              onClick={block.onClick}
              className="flex-1 min-h-[180px] !rounded-xl !border-2 !border-slate-200 hover:!border-blue-400 transition-all duration-300"
              styles={{
                body: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px 16px',
                  height: '100%',
                },
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shadow-inner mb-2">
                <IconComponent className="!text-2xl !text-slate-600" />
              </div>
              <Title level={5} className="!m-0 !mb-1 !text-slate-800">
                {block.title}
              </Title>
              <Text type="secondary" className="text-xs whitespace-nowrap">
                {block.description}
              </Text>
            </Card>
          );
        })}
      </div>

      {recentWorkspaces.length > 0 && (
        <div className="w-full max-w-[800px] px-8 mt-[10px]">
          <Card
            className="!rounded-xl !border-2 !border-slate-200"
            styles={{
              body: { padding: '12px 16px' },
              header: { padding: '12px 16px', marginBottom: 0 },
            }}
            title={
              <Title level={5} className="!m-0 !text-slate-700">
                最近的工作区
              </Title>
            }
          >
            <div className="flex flex-col">
              {recentWorkspaces.map(workspace => (
                <div
                  key={workspace.path}
                  onClick={() => onOpenRecentWorkspace(workspace.path)}
                  className="group cursor-pointer flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <Text strong className="!text-slate-800 block truncate">
                      {workspace.name}
                    </Text>
                    <Text
                      type="secondary"
                      className="!text-xs block truncate"
                      title={workspace.path}
                    >
                      {workspace.path}
                    </Text>
                  </div>
                  <div className="flex items-center flex-shrink-0 gap-2">
                    <Text type="secondary" className="!text-xs">
                      {formatDate(workspace.lastOpened)}
                    </Text>
                    <div
                      onClick={e => handleRemoveWorkspace(e, workspace)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer p-1 rounded hover:bg-red-50"
                    >
                      <CloseOutlined className="text-xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;
