import React from 'react';
import { Card, Typography, List } from 'antd';
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
      description: '创建一个新的工作区来组织笔记、模板与文档',
      icon: PlusOutlined,
      onClick: onCreateWorkspace,
    },
    {
      id: 'open-workspace',
      title: '打开工作区',
      description: '从已有列表中打开一个现有的工作区',
      icon: FolderOutlined,
      onClick: onOpenWorkspace,
    },
    {
      id: 'new-document',
      title: '新建文档',
      description: '创建一个新的独立文档进行编辑',
      icon: FileAddOutlined,
      onClick: onNewDocument,
    },
    {
      id: 'open-document',
      title: '打开文档',
      description: '打开一个已存在的文档进行编辑',
      icon: FileTextOutlined,
      onClick: onOpenDocument,
    },
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 grid grid-cols-6 grid-rows-[0.5fr_0.8fr_1fr_1fr_1.5fr_0.5fr] gap-0">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>

      <div className="col-span-6 flex items-end justify-center pb-6">
        <div className="text-center">
          <Title level={1} className="!mb-2 !text-slate-800">
            未知叙事
          </Title>
          <Text type="secondary">小说块编辑器</Text>
        </div>
      </div>

      <div></div>
      <div></div>
      <div className="flex items-center justify-center pr-4">
        <Card
          hoverable
          onClick={actionBlocks[0].onClick}
          className="w-full h-full min-h-[220px] !rounded-xl !border-2 !border-slate-200 hover:!border-blue-400 transition-all duration-300"
          styles={{
            body: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '28px 20px',
              height: '100%',
            },
          }}
        >
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shadow-inner mb-3">
            <PlusOutlined className="!text-3xl !text-slate-600" />
          </div>
          <Title level={5} className="!m-0 !mb-1 !text-slate-800">
            {actionBlocks[0].title}
          </Title>
          <Text type="secondary" className="text-center leading-relaxed text-xs whitespace-nowrap">
            {actionBlocks[0].description}
          </Text>
        </Card>
      </div>

      <div className="flex items-center justify-center pl-4">
        <Card
          hoverable
          onClick={actionBlocks[1].onClick}
          className="w-full h-full min-h-[220px] !rounded-xl !border-2 !border-slate-200 hover:!border-blue-400 transition-all duration-300"
          styles={{
            body: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '28px 20px',
              height: '100%',
            },
          }}
        >
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shadow-inner mb-3">
            <FolderOutlined className="!text-3xl !text-slate-600" />
          </div>
          <Title level={5} className="!m-0 !mb-1 !text-slate-800">
            {actionBlocks[1].title}
          </Title>
          <Text type="secondary" className="text-center leading-relaxed text-xs whitespace-nowrap">
            {actionBlocks[1].description}
          </Text>
        </Card>
      </div>

      <div></div>
      <div></div>

      <div></div>
      <div></div>
      <div className="flex items-start justify-center pr-4 pt-4">
        <Card
          hoverable
          onClick={actionBlocks[2].onClick}
          className="w-full h-full min-h-[220px] !rounded-xl !border-2 !border-slate-200 hover:!border-blue-400 transition-all duration-300"
          styles={{
            body: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '28px 20px',
              height: '100%',
            },
          }}
        >
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shadow-inner mb-3">
            <FileAddOutlined className="!text-3xl !text-slate-600" />
          </div>
          <Title level={5} className="!m-0 !mb-1 !text-slate-800">
            {actionBlocks[2].title}
          </Title>
          <Text type="secondary" className="text-center leading-relaxed text-xs whitespace-nowrap">
            {actionBlocks[2].description}
          </Text>
        </Card>
      </div>

      <div className="flex items-start justify-center pl-4 pt-4">
        <Card
          hoverable
          onClick={actionBlocks[3].onClick}
          className="w-full h-full min-h-[220px] !rounded-xl !border-2 !border-slate-200 hover:!border-blue-400 transition-all duration-300"
          styles={{
            body: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '28px 20px',
              height: '100%',
            },
          }}
        >
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shadow-inner mb-3">
            <FileTextOutlined className="!text-3xl !text-slate-600" />
          </div>
          <Title level={5} className="!m-0 !mb-1 !text-slate-800">
            {actionBlocks[3].title}
          </Title>
          <Text type="secondary" className="text-center leading-relaxed text-xs whitespace-nowrap">
            {actionBlocks[3].description}
          </Text>
        </Card>
      </div>

      <div></div>
      <div></div>

      <div className="col-span-6 px-16">
        {recentWorkspaces.length > 0 && (
          <Card
            className="!rounded-xl !border-2 !border-slate-200"
            title={
              <Title level={5} className="!m-0 !text-slate-700">
                最近的工作区
              </Title>
            }
          >
            <List
              dataSource={recentWorkspaces}
              renderItem={workspace => (
                <List.Item
                  onClick={() => onOpenRecentWorkspace(workspace.path)}
                  className="!px-4 !rounded-xl hover:!bg-slate-50 transition-colors group cursor-pointer"
                  actions={[
                    <div
                      key="remove"
                      onClick={e => {
                        e.stopPropagation();
                        onRemoveRecentWorkspace(workspace.path);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer p-2 rounded-lg hover:bg-red-50"
                    >
                      <CloseOutlined className="text-sm" />
                    </div>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Text strong className="!text-slate-800">
                        {workspace.name}
                      </Text>
                    }
                    description={
                      <Text type="secondary" className="!text-sm">
                        {formatDate(workspace.lastOpened)}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </div>

      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

export default WelcomeScreen;
