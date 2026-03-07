import React, { useState } from 'react';
import { Layout, Tabs, Typography, Statistic, Row, Col, Button } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { Workspace } from '@/types/workspace';
import { ChapterList } from './ChapterList';
import { MaterialPanel } from './MaterialPanel';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

interface WorkspaceViewProps {
  workspace: Workspace;
  currentChapterId: string | null;
  currentMaterialId: string | null;
  children: React.ReactNode;
  onChapterSelect: (chapterId: string) => void;
  onChapterCreate: () => void;
  onChapterDelete: (chapterId: string) => void;
  onChapterReorder: (chapterIds: string[]) => void;
  onMaterialSelect: (materialId: string) => void;
  onMaterialCreate: (type: string) => void;
  onMaterialDelete: (materialId: string) => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  workspace,
  currentChapterId,
  currentMaterialId,
  children,
  onChapterSelect,
  onChapterCreate,
  onChapterDelete,
  onChapterReorder,
  onMaterialSelect,
  onMaterialCreate,
  onMaterialDelete,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chapters' | 'materials'>('chapters');

  const tabItems = [
    {
      key: 'chapters',
      label: (
        <span>
          <FileTextOutlined />
          章节
        </span>
      ),
      children: (
        <ChapterList
          chapters={workspace.chapters}
          currentChapterId={currentChapterId}
          onSelect={onChapterSelect}
          onCreate={onChapterCreate}
          onDelete={onChapterDelete}
          onReorder={onChapterReorder}
        />
      ),
    },
    {
      key: 'materials',
      label: (
        <span>
          <AppstoreOutlined />
          素材
        </span>
      ),
      children: (
        <MaterialPanel
          materials={workspace.materials}
          currentMaterialId={currentMaterialId}
          onSelect={onMaterialSelect}
          onCreate={onMaterialCreate}
          onDelete={onMaterialDelete}
        />
      ),
    },
  ];

  return (
    <Layout style={{ height: '100%', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      <Sider
        width={280}
        collapsedWidth={48}
        collapsed={collapsed}
        trigger={null}
        style={{ background: '#fff' }}
        theme="light"
      >
        {/* 侧边栏头部 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            height: 56,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <Title
                level={5}
                style={{
                  margin: 0,
                  color: '#262626',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {workspace.name}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {workspace.chapters.length} 章节
              </Text>
            </div>
          )}
          <Button
            type="text"
            size="small"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? '展开侧边栏' : '折叠侧边栏'}
          />
        </div>

        {!collapsed && (
          <>
            {/* Tab 内容 */}
            <div style={{ height: 'calc(100% - 120px)', overflow: 'hidden' }}>
              <Tabs
                activeKey={activeTab}
                onChange={key => setActiveTab(key as 'chapters' | 'materials')}
                items={tabItems}
                style={{ height: '100%' }}
                size="small"
              />
            </div>

            {/* 底部统计信息 */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #f0f0f0',
                background: '#fafafa',
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        总字数
                      </Text>
                    }
                    value={workspace.project.statistics.wordCount}
                    valueStyle={{ fontSize: 14, color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        素材数
                      </Text>
                    }
                    value={workspace.materials.length}
                    valueStyle={{ fontSize: 14, color: '#52c41a' }}
                  />
                </Col>
              </Row>
            </div>
          </>
        )}
      </Sider>

      {/* 中间编辑区 */}
      <Content
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#fff',
          marginLeft: 8,
          borderRadius: 8,
        }}
      >
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </Content>
    </Layout>
  );
};
