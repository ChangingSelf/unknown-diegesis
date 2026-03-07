import React from 'react';
import { Button, Card, Typography } from 'antd';
import { PlusOutlined, FolderOutlined, FileAddOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export interface WelcomeScreenProps {
  onCreateWorkspace: () => void;
  onOpenWorkspace: () => void;
  onNewDocument: () => void;
  onOpenDocument: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateWorkspace,
  onOpenWorkspace,
  onNewDocument,
  onOpenDocument,
}) => {
  const items = [
    {
      id: 'create-workspace',
      title: '新建工作区',
      description: '创建一个新的工作区来组织笔记、模板与文档。',
      buttonLabel: '新建工作区',
      onClick: onCreateWorkspace,
      Icon: PlusOutlined,
    },
    {
      id: 'open-workspace',
      title: '打开工作区',
      description: '从已有列表中打开一个现有的工作区。',
      buttonLabel: '打开工作区',
      onClick: onOpenWorkspace,
      Icon: FolderOutlined,
    },
    {
      id: 'new-document',
      title: '新建文档',
      description: '在当前工作区内创建一个新的文档。',
      buttonLabel: '新建文档',
      onClick: onNewDocument,
      Icon: FileAddOutlined,
    },
    {
      id: 'open-document',
      title: '打开文档',
      description: '打开一个已存在的文档进行编辑。',
      buttonLabel: '打开文档',
      onClick: onOpenDocument,
      Icon: FileTextOutlined,
    },
  ];

  return (
    <section className="px-6 py-8 bg-paper-50 min-h-screen">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map(item => (
          <Card
            key={item.id}
            hoverable
            className="flex flex-col"
            styles={{ body: { display: 'flex', flexDirection: 'column', flex: 1 } }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <item.Icon className="text-lg" />
              </div>
              <Title level={4} className="m-0">
                {item.title}
              </Title>
            </div>
            <Text type="secondary" className="flex-1">
              {item.description}
            </Text>
            <div className="mt-4">
              <Button type="primary" onClick={item.onClick}>
                {item.buttonLabel}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default WelcomeScreen;
