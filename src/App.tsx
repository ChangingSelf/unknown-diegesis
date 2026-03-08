import { useState, useEffect, useRef, useCallback } from 'react';
import { Layout, message } from 'antd';
import { TiptapDocument, createEmptyDocument, createDocumentFromText } from './types/tiptap';
import { Workspace } from './types/workspace';
import { TabState } from './types/tab';
import { WorkspaceManager } from './services/WorkspaceManager';
import { StoryService } from './services/StoryService';
import { DocumentData } from './types/document';
import { AutoSaveManager } from './services/AutoSaveManager';
import { FileService } from './services/FileService';
import { RecentWorkspacesService, RecentWorkspace } from './services/RecentWorkspacesService';
import { TabManager } from './services/TabManager';
import { WelcomeScreen } from './components/WelcomeScreen';
import { TopBar, ViewMode } from './components/TopBar';
import { EditorView } from './components/EditorView';
import { WorkspaceView } from './components/workspace';
import { TabsBar, UnsavedTabsDialog } from './components/tabs';
import { showConfirm } from './hooks/useConfirm';
import { showPrompt } from './hooks/usePrompt';
import { exportMarkdownFromTiptap } from './utils/exporters/markdown';

const { Header, Content } = Layout;

function App() {
  const workspaceManagerRef = useRef<WorkspaceManager>(new WorkspaceManager());
  const storyServiceRef = useRef<StoryService>(new StoryService());
  const autoSaveManagerRef = useRef<AutoSaveManager>(new AutoSaveManager());
  const fileServiceRef = useRef<FileService>(new FileService());
  const recentWorkspacesServiceRef = useRef<RecentWorkspacesService>(new RecentWorkspacesService());
  const tabManagerRef = useRef<TabManager>(new TabManager());

  const [viewMode, setViewMode] = useState<ViewMode>('welcome');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [currentDocumentData, setCurrentDocumentData] = useState<DocumentData | null>(null);
  const [documentContent, setDocumentContent] = useState<TiptapDocument>(createEmptyDocument());
  const [fileState, setFileState] = useState(fileServiceRef.current.getState());
  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspace[]>([]);
  const [tabState, setTabState] = useState<TabState>(tabManagerRef.current.getState());
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingCloseTabs, setPendingCloseTabs] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = fileServiceRef.current.subscribe(setFileState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    recentWorkspacesServiceRef.current.getRecentWorkspaces().then(setRecentWorkspaces);
  }, []);

  useEffect(() => {
    const unsubscribe = recentWorkspacesServiceRef.current.subscribe(setRecentWorkspaces);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = tabManagerRef.current.subscribe(setTabState);
    return unsubscribe;
  }, []);

  const saveCurrentChapter = useCallback(async (): Promise<boolean> => {
    if (!workspace || !currentChapterId || !currentDocumentData) return false;

    const success = await storyServiceRef.current.save(workspace.path, currentChapterId, {
      meta: currentDocumentData.meta,
      content: documentContent,
    });

    if (success) {
      await workspaceManagerRef.current.refreshWorkspace();
      const updatedWorkspace = workspaceManagerRef.current.getWorkspace();
      if (updatedWorkspace) setWorkspace(updatedWorkspace);
    }

    return success;
  }, [workspace, currentChapterId, currentDocumentData, documentContent]);

  useEffect(() => {
    const manager = autoSaveManagerRef.current;
    manager.setSaveCallback(async () => {
      if (viewMode === 'workspace') {
        return await saveCurrentChapter();
      } else if (viewMode === 'single-file' && fileState.currentFilePath) {
        const markdown = exportMarkdownFromTiptap(documentContent);
        const result = await fileServiceRef.current.saveFile(markdown);
        if (result.success) {
          const activeTab = tabManagerRef.current.getActiveTab();
          if (activeTab && activeTab.isModified) {
            tabManagerRef.current.updateTabModified(activeTab.id, false);
          }
        }
        return result.success;
      }
      return false;
    });
    manager.enable();
    return () => manager.destroy();
  }, [viewMode, fileState.currentFilePath, saveCurrentChapter, documentContent]);

  const handleOpen = async () => {
    const result = await fileServiceRef.current.openFile();
    if (result.success && result.content && result.path) {
      const content = createDocumentFromText(result.content);
      setDocumentContent(content);
      setViewMode('single-file');

      const fileName = result.path.split(/[\\/]/).pop() || 'Untitled';
      tabManagerRef.current.openTab('file', result.path, fileName);
    }
  };

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (viewMode === 'workspace') {
      const success = await saveCurrentChapter();
      if (success) {
        const activeTab = tabManagerRef.current.getActiveTab();
        if (activeTab && activeTab.isModified) {
          tabManagerRef.current.updateTabModified(activeTab.id, false);
        }
      }
      return success;
    } else if (viewMode === 'single-file') {
      const markdown = exportMarkdownFromTiptap(documentContent);
      const result = fileState.currentFilePath
        ? await fileServiceRef.current.saveFile(markdown)
        : await fileServiceRef.current.saveFileAs(markdown);
      if (result.success) {
        const activeTab = tabManagerRef.current.getActiveTab();
        if (activeTab && activeTab.isModified) {
          tabManagerRef.current.updateTabModified(activeTab.id, false);
        }
      }
      return result.success;
    }
    return false;
  }, [viewMode, saveCurrentChapter, documentContent, fileState.currentFilePath]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (viewMode === 'workspace' && workspace) {
          handleChapterCreate();
        } else {
          handleNew();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, viewMode, workspace]);

  const handleExportMarkdown = async () => {
    const markdown = exportMarkdownFromTiptap(documentContent);
    await window.electronAPI.fileSaveAs(markdown);
  };

  const handleNew = () => {
    setDocumentContent(createEmptyDocument());
    fileServiceRef.current.createNewFile();
    setViewMode('single-file');

    tabManagerRef.current.openTab('file', 'new', 'Untitled');
  };

  const handleContentChange = (content: object) => {
    setDocumentContent(content as TiptapDocument);
    if (viewMode === 'single-file') {
      fileServiceRef.current.markAsModified();
    }
    autoSaveManagerRef.current.onContentChange();

    const activeTab = tabManagerRef.current.getActiveTab();
    if (activeTab && !activeTab.isModified) {
      tabManagerRef.current.updateTabModified(activeTab.id, true);
    }
  };

  const handleOpenWorkspace = async () => {
    const result = await workspaceManagerRef.current.openWorkspace();
    if (result.error) {
      message.error(result.error);
      return;
    }
    if (result.workspace) {
      recentWorkspacesServiceRef.current.addWorkspace(result.workspace.path, result.workspace.name);
      setWorkspace(result.workspace);
      setViewMode('workspace');
      setCurrentChapterId(null);
      setCurrentDocumentData(null);
      setDocumentContent(createEmptyDocument());
    }
  };

  const handleCreateWorkspace = async () => {
    const api = window.electronAPI;
    if (!api?.prompt) {
      message.error('无法访问文件系统');
      return;
    }

    const selectedPath = await api.prompt('请选择要创建工作区的文件夹：');
    if (!selectedPath) return;

    const name = selectedPath.split(/[/\\]/).pop() || '我的小说';
    const result = await workspaceManagerRef.current.createWorkspace(name, selectedPath);
    if (result.error) {
      message.error(result.error);
      return;
    }
    if (result.workspace) {
      recentWorkspacesServiceRef.current.addWorkspace(result.workspace.path, result.workspace.name);
      setWorkspace(result.workspace);
      setViewMode('workspace');
    }
  };

  const handleOpenRecentWorkspace = async (path: string) => {
    const result = await workspaceManagerRef.current.openWorkspaceFromPath(path);
    if (result.error) {
      message.error(result.error);
      return;
    }
    if (result.workspace) {
      recentWorkspacesServiceRef.current.addWorkspace(result.workspace.path, result.workspace.name);
      setWorkspace(result.workspace);
      setViewMode('workspace');
      setCurrentChapterId(null);
      setCurrentDocumentData(null);
      setDocumentContent(createEmptyDocument());
    }
  };

  const handleRemoveRecentWorkspace = (path: string) => {
    recentWorkspacesServiceRef.current.removeWorkspace(path);
  };

  const handleCloseWorkspace = () => {
    workspaceManagerRef.current.closeWorkspace();
    setWorkspace(null);
    setCurrentChapterId(null);
    setCurrentDocumentData(null);
    setDocumentContent(createEmptyDocument());
    setViewMode('welcome');
  };

  const handleChapterSelect = async (chapterId: string) => {
    if (currentChapterId && currentChapterId !== chapterId) {
      await saveCurrentChapter();
    }
    if (!workspace) return;

    const chapter = workspace.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return;

    const data = await storyServiceRef.current.getById(workspace.path, chapterId);
    if (data) {
      setCurrentChapterId(chapterId);
      setCurrentDocumentData(data);
      setDocumentContent(data.content || createEmptyDocument());

      tabManagerRef.current.openTab('chapter', chapterId, data.meta.title, workspace.path);
    }
  };

  const handleChapterCreate = async () => {
    if (!workspace) return;

    const title = await showPrompt({ title: '新建章节', placeholder: '请输入章节标题' });
    if (title === null) return;

    const newChapter = await storyServiceRef.current.create(workspace.path, {
      title: title || '新章节',
    });
    if (newChapter) {
      await workspaceManagerRef.current.refreshWorkspace();
      const updatedWorkspace = workspaceManagerRef.current.getWorkspace();
      if (updatedWorkspace) setWorkspace(updatedWorkspace);
      handleChapterSelect(newChapter.id);
    }
  };

  const handleChapterDelete = async (chapterId: string) => {
    if (!workspace) return;

    const confirmed = await showConfirm({ content: '确定删除此章节？' });
    if (!confirmed) return;

    const success = await storyServiceRef.current.delete(workspace.path, chapterId);
    if (success) {
      await workspaceManagerRef.current.refreshWorkspace();
      const updatedWorkspace = workspaceManagerRef.current.getWorkspace();
      if (updatedWorkspace) setWorkspace(updatedWorkspace);
      if (currentChapterId === chapterId) {
        setCurrentChapterId(null);
        setCurrentDocumentData(null);
        setDocumentContent(createEmptyDocument());
      }
    }
  };

  const handleChapterReorder = async (chapterIds: string[]) => {
    if (!workspace) return;
    await storyServiceRef.current.reorderDocuments(workspace.path, '', chapterIds);
    await workspaceManagerRef.current.refreshWorkspace();
    const updatedWorkspace = workspaceManagerRef.current.getWorkspace();
    if (updatedWorkspace) setWorkspace(updatedWorkspace);
  };

  const handleChapterRename = async (chapterId: string, newTitle: string) => {
    if (!workspace) return;
    await storyServiceRef.current.updateMeta(workspace.path, chapterId, { title: newTitle });
    await workspaceManagerRef.current.refreshWorkspace();
    const updatedWorkspace = workspaceManagerRef.current.getWorkspace();
    if (updatedWorkspace) setWorkspace(updatedWorkspace);

    if (currentChapterId === chapterId && currentDocumentData) {
      setCurrentDocumentData({
        ...currentDocumentData,
        meta: { ...currentDocumentData.meta, title: newTitle },
      });
    }

    const tab = tabState.tabs.find(t => t.resourceId === chapterId);
    if (tab) {
      tabManagerRef.current.updateTabTitle(tab.id, newTitle);
    }
  };

  const handleMaterialSelect = (id: string) => console.log('Material:', id);
  const handleMaterialCreate = (type: string) => console.log('Create:', type);
  const handleMaterialDelete = (id: string) => console.log('Delete:', id);

  const handleTabClose = async (tabId: string) => {
    const tab = tabManagerRef.current.getTab(tabId);
    if (!tab) return;

    if (tab.isModified) {
      const confirmed = await showConfirm({
        content: `标签页 "${tab.title}" 有未保存的更改，确定要关闭吗？`,
      });
      if (!confirmed) return;
    }

    tabManagerRef.current.closeTab(tabId);

    if (tabState.tabs.length === 1) {
      setCurrentChapterId(null);
      setCurrentDocumentData(null);
      setDocumentContent(createEmptyDocument());
    }
  };

  const handleTabActivate = async (tabId: string) => {
    const tab = tabManagerRef.current.getTab(tabId);
    if (!tab) return;

    if (tab.type === 'chapter' && tab.workspacePath) {
      if (!workspace || workspace.path !== tab.workspacePath) {
        const result = await workspaceManagerRef.current.openWorkspaceFromPath(tab.workspacePath);
        if (result.workspace) {
          setWorkspace(result.workspace);
          setViewMode('workspace');
        }
      }
      await handleChapterSelect(tab.resourceId);
    } else if (tab.type === 'file') {
      if (viewMode !== 'single-file') {
        setViewMode('single-file');
      }
      if (tab.resourceId !== 'new' && tab.resourceId !== fileState.currentFilePath) {
        const result = await window.electronAPI.fileOpenWithPath(tab.resourceId);
        if (result.success && result.content) {
          const content = createDocumentFromText(result.content);
          setDocumentContent(content);
        }
      }
    }

    tabManagerRef.current.activateTab(tabId);
  };

  const handleTabReorder = (sourceId: string, targetId: string) => {
    tabManagerRef.current.reorderTabs(sourceId, targetId);
  };

  const handleCloseOthers = async (tabId: string) => {
    const otherTabs = tabState.tabs.filter(t => t.id !== tabId && t.isModified);
    if (otherTabs.length > 0) {
      setPendingCloseTabs(otherTabs.map(t => t.id));
      setShowUnsavedDialog(true);
      return;
    }

    tabManagerRef.current.closeOtherTabs(tabId);
  };

  const handleCloseRight = (tabId: string) => {
    tabManagerRef.current.closeRightTabs(tabId);
  };

  const handleCloseAll = async () => {
    const unsavedTabs = tabState.tabs.filter(t => t.isModified);
    if (unsavedTabs.length > 0) {
      setPendingCloseTabs(unsavedTabs.map(t => t.id));
      setShowUnsavedDialog(true);
      return;
    }

    tabManagerRef.current.closeAllTabs();
    setCurrentChapterId(null);
    setCurrentDocumentData(null);
    setDocumentContent(createEmptyDocument());
  };

  const handleTogglePin = (tabId: string) => {
    tabManagerRef.current.togglePin(tabId);
  };

  const handleSaveTab = async (tabId: string) => {
    const success = await handleSave();
    if (success) {
      tabManagerRef.current.updateTabModified(tabId, false);
    }
  };

  const handleDiscardTabChanges = (tabId: string) => {
    tabManagerRef.current.updateTabModified(tabId, false);
  };

  if (viewMode === 'welcome') {
    return (
      <WelcomeScreen
        onCreateWorkspace={handleCreateWorkspace}
        onOpenWorkspace={handleOpenWorkspace}
        onNewDocument={handleNew}
        onOpenDocument={handleOpen}
        recentWorkspaces={recentWorkspaces}
        onOpenRecentWorkspace={handleOpenRecentWorkspace}
        onRemoveRecentWorkspace={handleRemoveRecentWorkspace}
      />
    );
  }

  if (viewMode === 'workspace' && workspace) {
    return (
      <>
        <Layout style={{ height: '100vh', background: '#f5f5f5' }}>
          <Header
            style={{
              height: 56,
              padding: '0 16px',
              background: '#fff',
              lineHeight: '40px',
              margin: 8,
              marginBottom: 0,
              borderRadius: 8,
            }}
          >
            <TopBar
              viewMode="workspace"
              title={workspace.project.title}
              isModified={
                tabState.tabs.find(t => t.id === tabState.activeTabId)?.isModified ?? false
              }
              saveStatus={
                tabState.tabs.find(t => t.id === tabState.activeTabId)?.isModified
                  ? 'modified'
                  : 'saved'
              }
              lastSavedTime={null}
              onSave={handleSave}
              onExportMarkdown={handleExportMarkdown}
              onCloseWorkspace={handleCloseWorkspace}
            />
          </Header>
          <Content style={{ padding: 8, flex: 1, overflow: 'hidden' }}>
            <WorkspaceView
              workspace={workspace}
              currentChapterId={currentChapterId}
              currentMaterialId={null}
              onChapterSelect={handleChapterSelect}
              onChapterCreate={handleChapterCreate}
              onChapterDelete={handleChapterDelete}
              onChapterReorder={handleChapterReorder}
              onChapterRename={handleChapterRename}
              onMaterialSelect={handleMaterialSelect}
              onMaterialCreate={handleMaterialCreate}
              onMaterialDelete={handleMaterialDelete}
              tabState={tabState}
              onTabActivate={handleTabActivate}
              onTabClose={handleTabClose}
              onTabReorder={handleTabReorder}
              onCloseOthers={handleCloseOthers}
              onCloseRight={handleCloseRight}
              onCloseAll={handleCloseAll}
              onTogglePin={handleTogglePin}
            >
              <EditorView
                initialContent={documentContent}
                onContentChange={handleContentChange}
                placeholder="选择一个章节开始编辑"
              />
            </WorkspaceView>
          </Content>
        </Layout>
        <UnsavedTabsDialog
          visible={showUnsavedDialog}
          tabs={tabState.tabs.filter(t => pendingCloseTabs.includes(t.id))}
          onSave={handleSaveTab}
          onDiscard={handleDiscardTabChanges}
          onCancel={() => {
            setShowUnsavedDialog(false);
            setPendingCloseTabs([]);
          }}
        />
      </>
    );
  }
  return (
    <>
      <Layout style={{ height: '100vh', background: '#f5f5f5' }}>
        <Header
          style={{
            height: 56,
            padding: '0 16px',
            background: '#fff',
            lineHeight: '40px',
            margin: 8,
            marginBottom: 0,
            borderRadius: 8,
          }}
        >
          <TopBar
            viewMode="single-file"
            title={fileServiceRef.current.getFileName()}
            isModified={fileState.isModified}
            saveStatus={fileState.saveStatus}
            lastSavedTime={fileState.lastSavedTime}
            onNew={handleNew}
            onOpen={handleOpen}
            onSave={handleSave}
            onExportMarkdown={handleExportMarkdown}
          />
        </Header>
        <Content style={{ padding: 8, flex: 1, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              background: '#fff',
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <TabsBar
              tabs={tabState.tabs}
              activeTabId={tabState.activeTabId}
              onTabActivate={handleTabActivate}
              onTabClose={handleTabClose}
              onTabReorder={handleTabReorder}
              onCloseOthers={handleCloseOthers}
              onCloseRight={handleCloseRight}
              onCloseAll={handleCloseAll}
              onTogglePin={handleTogglePin}
            />
            <div style={{ flex: 1, overflow: 'auto' }}>
              <EditorView
                initialContent={documentContent}
                onContentChange={handleContentChange}
                placeholder="没有内容，请打开文件或创建新文档"
              />
            </div>
          </div>
        </Content>
      </Layout>
      <UnsavedTabsDialog
        visible={showUnsavedDialog}
        tabs={tabState.tabs.filter(t => pendingCloseTabs.includes(t.id))}
        onSave={handleSaveTab}
        onDiscard={handleDiscardTabChanges}
        onCancel={() => {
          setShowUnsavedDialog(false);
          setPendingCloseTabs([]);
        }}
      />
    </>
  );
}

export default App;
