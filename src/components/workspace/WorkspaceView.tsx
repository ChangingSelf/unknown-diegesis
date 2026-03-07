import React, { useState } from 'react';
import { Workspace } from '@/types/workspace';
import { ChapterList } from './ChapterList';
import { MaterialPanel } from './MaterialPanel';

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

const SidebarIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
    />
  </svg>
);

const ChapterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const MaterialIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    />
  </svg>
);

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
  const [sidebarWidth] = useState(260);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chapters' | 'materials'>('chapters');
  const [showRightPanel] = useState(false);

  return (
    <div className="flex h-screen bg-paper-50">
      {/* 左侧边栏 - 章节和素材 */}
      <div
        className={`bg-white border-r border-paper-200 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'w-12' : ''
        }`}
        style={{ width: isSidebarCollapsed ? 48 : sidebarWidth }}
      >
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-paper-200 min-h-[52px]">
          {!isSidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-charcoal-800 truncate">{workspace.name}</h2>
              <p className="text-xs text-charcoal-500">{workspace.chapters.length} 章节</p>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 hover:bg-paper-100 rounded-md text-charcoal-500 hover:text-charcoal-700 transition-colors"
            title={isSidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            <SidebarIcon collapsed={isSidebarCollapsed} />
          </button>
        </div>

        {!isSidebarCollapsed && (
          <>
            {/* Tab 切换 - VS Code 风格图标 */}
            <div className="flex border-b border-paper-200">
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'chapters'
                    ? 'text-gold-600 border-b-2 border-gold-500 bg-gold-50/50'
                    : 'text-charcoal-500 hover:text-charcoal-700 hover:bg-paper-50'
                }`}
                onClick={() => setActiveTab('chapters')}
              >
                <ChapterIcon />
                <span>章节</span>
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'materials'
                    ? 'text-gold-600 border-b-2 border-gold-500 bg-gold-50/50'
                    : 'text-charcoal-500 hover:text-charcoal-700 hover:bg-paper-50'
                }`}
                onClick={() => setActiveTab('materials')}
              >
                <MaterialIcon />
                <span>素材</span>
              </button>
            </div>

            {/* Tab 内容 */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'chapters' ? (
                <ChapterList
                  chapters={workspace.chapters}
                  currentChapterId={currentChapterId}
                  onSelect={onChapterSelect}
                  onCreate={onChapterCreate}
                  onDelete={onChapterDelete}
                  onReorder={onChapterReorder}
                />
              ) : (
                <MaterialPanel
                  materials={workspace.materials}
                  currentMaterialId={currentMaterialId}
                  onSelect={onMaterialSelect}
                  onCreate={onMaterialCreate}
                  onDelete={onMaterialDelete}
                />
              )}
            </div>

            {/* 底部统计信息 */}
            <div className="px-4 py-2 border-t border-paper-200 bg-paper-50/50">
              <div className="flex items-center justify-between text-xs text-charcoal-500">
                <span>{workspace.project.statistics.wordCount.toLocaleString()} 字</span>
                <span>{workspace.materials.length} 素材</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 中间编辑区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">{children}</div>
      </div>

      {/* 右侧工具栏（预留） */}
      {showRightPanel && (
        <div className="w-64 bg-white border-l border-paper-200 flex flex-col">
          <div className="px-4 py-3 border-b border-paper-200">
            <h3 className="text-sm font-semibold text-charcoal-800">工具</h3>
          </div>
          <div className="flex-1 p-4 text-sm text-charcoal-500">
            <p className="text-center text-charcoal-400 mt-8">工具栏功能开发中...</p>
          </div>
        </div>
      )}
    </div>
  );
};
