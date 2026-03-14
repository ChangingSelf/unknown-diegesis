import React, { useState } from 'react';
import { Layout, Tabs, Typography, Statistic, Row, Col, Button, Empty } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  FileAddOutlined,
} from '@ant-design/icons';
import { Workspace } from '@/types/workspace';
import { TabState } from '@/types/tab';
import { ChapterList } from './ChapterList';
import { MaterialPanel } from './MaterialPanel';
import { TabsBar } from '../tabs';

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
  onChapterRename: (chapterId: string, newTitle: string) => void;
  onMaterialSelect: (materialId: string) => void;
  onMaterialCreate: (type: string) => void;
  onMaterialDelete: (materialId: string) => void;
  tabState: TabState;
  onTabActivate: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabReorder: (sourceId: string, targetId: string) => void;
  onCloseOthers: (tabId: string) => void;
  onCloseRight: (tabId: string) => void;
  onCloseAll: () => void;
  onTogglePin: (tabId: string) => void;
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
  onChapterRename,
  onMaterialSelect,
  onMaterialCreate,
  onMaterialDelete,
  tabState,
  onTabActivate,
  onTabClose,
  onTabReorder,
  onCloseOthers,
  onCloseRight,
  onCloseAll,
  onTogglePin,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chapters' | 'materials'>('chapters');

  const siderTabItems = [
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
          onRename={onChapterRename}
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
            <div style={{ height: 'calc(100% - 120px)', overflow: 'hidden' }}>
              <Tabs
                activeKey={activeTab}
                onChange={key => setActiveTab(key as 'chapters' | 'materials')}
                items={siderTabItems}
                style={{ height: '100%' }}
                size="small"
              />
            </div>

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
                    styles={{ content: { fontSize: 14, color: '#1890ff' } }}
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
                    styles={{ content: { fontSize: 14, color: '#52c41a' } }}
                  />
                </Col>
              </Row>
            </div>
          </>
        )}
      </Sider>

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
        <TabsBar
          tabs={tabState.tabs}
          activeTabId={tabState.activeTabId}
          onTabActivate={onTabActivate}
          onTabClose={onTabClose}
          onTabReorder={onTabReorder}
          onCloseOthers={onCloseOthers}
          onCloseRight={onCloseRight}
          onCloseAll={onCloseAll}
          onTogglePin={onTogglePin}
        />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {currentChapterId ? (
            children
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fafafa',
              }}
            >
              <Empty
                image={<FileAddOutlined style={{ fontSize: 64, color: '#bfbfbf' }} />}
                description={
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      选择一个章节开始编辑
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      按{' '}
                      <kbd style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>
                        Ctrl
                      </kbd>{' '}
                      +{' '}
                      <kbd style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>
                        N
                      </kbd>{' '}
                      新建章节
                    </Text>
                  </div>
                }
              />
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
};
