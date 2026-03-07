import { useState, useEffect, useRef, useCallback } from 'react';
import { Layout } from 'antd';
import { BlockManager } from './utils/BlockManager';
import { Block } from './types/block';
import { createEmptyDocument, createDocumentFromText } from './types/tiptap';
import { Workspace } from './types/workspace';
import { WorkspaceManager } from './services/WorkspaceManager';
import { ChapterService, ChapterData } from './services/ChapterService';
import { AutoSaveManager } from './services/AutoSaveManager';
import { FileService } from './services/FileService';
import { RecentWorkspacesService } from './services/RecentWorkspacesService';
import { WelcomeScreen } from './components/WelcomeScreen';
import { TopBar, ViewMode } from './components/TopBar';
import { EditorView } from './components/EditorView';
import { WorkspaceView } from './components/workspace';
import { showConfirm } from './hooks/useConfirm';
import { showPrompt } from './hooks/usePrompt';

const { Header, Content } = Layout;

function App() {
  const workspaceManagerRef = useRef<WorkspaceManager>(new WorkspaceManager());
  const chapterServiceRef = useRef<ChapterService>(new ChapterService());
  const autoSaveManagerRef = useRef<AutoSaveManager>(new AutoSaveManager());
  const fileServiceRef = useRef<FileService>(new FileService());
  const blockManagerRef = useRef<BlockManager>(new BlockManager());
  const recentWorkspacesServiceRef = useRef<RecentWorkspacesService>(new RecentWorkspacesService());

  const [viewMode, setViewMode] = useState<ViewMode>('welcome');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [currentChapterData, setCurrentChapterData] = useState<ChapterData | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [layoutRows, setLayoutRows] = useState(blockManagerRef.current.getLayoutRows());
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [isAltKeyPressed, setIsAltKeyPressed] = useState(false);
  const [fileState, setFileState] = useState(fileServiceRef.current.getState());
  const [recentWorkspaces, setRecentWorkspaces] = useState(
    recentWorkspacesServiceRef.current.getRecentWorkspaces()
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) setIsAltKeyPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey) setIsAltKeyPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = fileServiceRef.current.subscribe(setFileState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = recentWorkspacesServiceRef.current.subscribe(setRecentWorkspaces);
    return unsubscribe;
  }, []);

  const saveCurrentChapter = useCallback(async (): Promise<boolean> => {
    if (!workspace || !currentChapterId || !currentChapterData) return false;

    const success = await chapterServiceRef.current.saveChapter(
      workspace.path,
      currentChapterData.meta.path,
      {
        meta: currentChapterData.meta,
        blocks: blockManagerRef.current.getBlocks(),
        layoutRows: blockManagerRef.current.getLayoutRows(),
      }
    );
    return success;
  }, [workspace, currentChapterId, currentChapterData]);

  useEffect(() => {
    const manager = autoSaveManagerRef.current;
    manager.setSaveCallback(async () => {
      if (viewMode === 'workspace') {
        return await saveCurrentChapter();
      } else if (viewMode === 'single-file' && fileState.currentFilePath) {
        const content = blockManagerRef.current.toMarkdown();
        const result = await fileServiceRef.current.saveFile(content);
        return result.success;
      }
      return false;
    });
    manager.enable();
    return () => manager.destroy();
  }, [viewMode, fileState.currentFilePath, saveCurrentChapter]);

  const handleOpen = async () => {
    const result = await fileServiceRef.current.openFile();
    if (result.success && result.content) {
      blockManagerRef.current = BlockManager.fromMarkdown(result.content);
      setBlocks(blockManagerRef.current.getBlocks());
      setLayoutRows(blockManagerRef.current.getLayoutRows());
      setViewMode('single-file');
    }
  };

  const handleSave = async () => {
    await autoSaveManagerRef.current.saveNow();
  };

  const handleExportMarkdown = async () => {
    const markdown = blockManagerRef.current.toMarkdown();
    await window.electronAPI.fileSaveAs(markdown);
  };

  const handleNew = () => {
    blockManagerRef.current = new BlockManager();
    setBlocks([]);
    setLayoutRows([]);
    fileServiceRef.current.createNewFile();
    setViewMode('single-file');
  };

  const handleUpdateBlock = (block: Block) => {
    blockManagerRef.current.updateBlock(block.id, block);
    setBlocks(blockManagerRef.current.getBlocks());
    if (viewMode === 'single-file') {
      fileServiceRef.current.markAsModified();
    }
    autoSaveManagerRef.current.onContentChange();
  };

  const handleCreateSibling = (blockId: string) => {
    const newBlock = blockManagerRef.current.createSiblingBlock(blockId);
    if (newBlock) {
      setBlocks(blockManagerRef.current.getBlocks());
      setLayoutRows(blockManagerRef.current.getLayoutRows());
      setEditingBlockId(newBlock.id);
      if (viewMode === 'single-file') fileServiceRef.current.markAsModified();
      autoSaveManagerRef.current.onContentChange();
    }
  };

  const handleColumnResize = (rowId: string, columnId: string, newWidth: number) => {
    blockManagerRef.current.resizeColumn(rowId, columnId, newWidth);
    setLayoutRows(blockManagerRef.current.getLayoutRows());
    if (viewMode === 'single-file') fileServiceRef.current.markAsModified();
    autoSaveManagerRef.current.onContentChange();
  };

  const handleToggleEdit = (blockId: string) => {
    setEditingBlockId(editingBlockId === blockId ? null : blockId);
  };

  const handleCreateNewBlock = (
    currentBlockId: string,
    position: 'before' | 'after' | 'split',
    content?: string
  ) => {
    const currentBlock = blockManagerRef.current.getBlock(currentBlockId);
    if (!currentBlock) return;

    const newBlock = blockManagerRef.current.addBlock(
      'paragraph',
      content ? createDocumentFromText(content) : createEmptyDocument()
    );
    const allBlocks = blockManagerRef.current.getBlocks();
    const currentIndex = allBlocks.findIndex(b => b.id === currentBlockId);

    if (currentIndex !== -1) {
      blockManagerRef.current.deleteBlock(newBlock.id);
      if (position === 'before') {
        allBlocks.splice(currentIndex, 0, newBlock);
      } else {
        allBlocks.splice(currentIndex + 1, 0, newBlock);
      }
      blockManagerRef.current = new BlockManager(
        allBlocks,
        blockManagerRef.current.getLayoutRows()
      );
      setBlocks([...blockManagerRef.current.getBlocks()]);
      setLayoutRows([...blockManagerRef.current.getLayoutRows()]);
      setEditingBlockId(newBlock.id);
      if (viewMode === 'single-file') fileServiceRef.current.markAsModified();
      autoSaveManagerRef.current.onContentChange();
    }
  };

  const handleDragBlock = (sourceBlockId: string, targetBlockId: string) => {
    setDraggingBlockId(null);
    if (sourceBlockId === targetBlockId) return;

    const sourceBlock = blockManagerRef.current.getBlock(sourceBlockId);
    const targetBlock = blockManagerRef.current.getBlock(targetBlockId);
    if (!sourceBlock || !targetBlock) return;

    if (isAltKeyPressed) {
      if (targetBlock.layoutRowId && targetBlock.layoutColumnId) {
        blockManagerRef.current.moveBlockToColumn(sourceBlockId, targetBlock.layoutColumnId);
      } else {
        const newBlock = blockManagerRef.current.createSiblingBlock(targetBlockId);
        if (newBlock) {
          blockManagerRef.current.moveBlockToColumn(sourceBlockId, newBlock.layoutColumnId!);
          blockManagerRef.current.deleteBlockFromLayout(newBlock.id);
        }
      }
    } else {
      const allBlocks = blockManagerRef.current.getBlocks();
      const sourceIndex = allBlocks.findIndex(b => b.id === sourceBlockId);
      const targetIndex = allBlocks.findIndex(b => b.id === targetBlockId);
      if (sourceIndex !== -1 && targetIndex !== -1) {
        const [movedBlock] = allBlocks.splice(sourceIndex, 1);
        allBlocks.splice(targetIndex, 0, movedBlock);
        blockManagerRef.current = new BlockManager(
          allBlocks,
          blockManagerRef.current.getLayoutRows()
        );
      }
    }

    setBlocks(blockManagerRef.current.getBlocks());
    setLayoutRows(blockManagerRef.current.getLayoutRows());
    if (viewMode === 'single-file') fileServiceRef.current.markAsModified();
    autoSaveManagerRef.current.onContentChange();
  };

  const handleOpenWorkspace = async () => {
    const ws = await workspaceManagerRef.current.openWorkspace();
    if (ws) {
      recentWorkspacesServiceRef.current.addWorkspace(ws.path, ws.name);
      setWorkspace(ws);
      setViewMode('workspace');
      setCurrentChapterId(null);
      setCurrentChapterData(null);
      setBlocks([]);
      setLayoutRows([]);
    }
  };

  const handleCreateWorkspace = async () => {
    const api = window.electronAPI;
    if (!api?.prompt) {
      console.error('prompt API not available');
      return;
    }

    const selectedPath = await api.prompt('请选择要创建工作区的文件夹：');
    if (!selectedPath) return;

    const name = selectedPath.split(/[/\\]/).pop() || '我的小说';
    const ws = await workspaceManagerRef.current.createWorkspace(name, selectedPath);
    if (ws) {
      recentWorkspacesServiceRef.current.addWorkspace(ws.path, ws.name);
      setWorkspace(ws);
      setViewMode('workspace');
    }
  };

  const handleOpenRecentWorkspace = async (path: string) => {
    const ws = await workspaceManagerRef.current.openWorkspaceFromPath(path);
    if (ws) {
      recentWorkspacesServiceRef.current.addWorkspace(ws.path, ws.name);
      setWorkspace(ws);
      setViewMode('workspace');
      setCurrentChapterId(null);
      setCurrentChapterData(null);
      setBlocks([]);
      setLayoutRows([]);
    }
  };

  const handleRemoveRecentWorkspace = (path: string) => {
    recentWorkspacesServiceRef.current.removeWorkspace(path);
  };

  const handleCloseWorkspace = () => {
    workspaceManagerRef.current.closeWorkspace();
    setWorkspace(null);
    setCurrentChapterId(null);
    setCurrentChapterData(null);
    setBlocks([]);
    setLayoutRows([]);
    setViewMode('welcome');
  };

  const handleChapterSelect = async (chapterId: string) => {
    if (currentChapterId && currentChapterId !== chapterId) {
      await saveCurrentChapter();
    }
    if (!workspace) return;

    const chapter = workspace.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return;

    const data = await chapterServiceRef.current.loadChapter(workspace.path, chapter.path);
    if (data) {
      setCurrentChapterId(chapterId);
      setCurrentChapterData(data);

      if (data.blocks.length === 0) {
        const newBlock = blockManagerRef.current.addBlock('paragraph', createEmptyDocument());
        blockManagerRef.current.addLayoutRow();
        const rows = blockManagerRef.current.getLayoutRows();
        const row = rows[rows.length - 1];
        const column = row.columns[0];
        column.blockIds.push(newBlock.id);
        newBlock.layoutRowId = row.id;
        newBlock.layoutColumnId = column.id;

        setBlocks([...blockManagerRef.current.getBlocks()]);
        setLayoutRows([...blockManagerRef.current.getLayoutRows()]);
        setEditingBlockId(newBlock.id);
      } else {
        blockManagerRef.current = new BlockManager(data.blocks, data.layoutRows);
        setBlocks(data.blocks);
        setLayoutRows(data.layoutRows);
        setEditingBlockId(null);
      }
    }
  };

  const handleChapterCreate = async () => {
    if (!workspace) return;

    const title = await showPrompt({ title: '新建章节', placeholder: '请输入章节标题' });
    const newChapter = await chapterServiceRef.current.createChapter(
      workspace.path,
      title || undefined
    );
    if (newChapter) {
      await workspaceManagerRef.current.refreshWorkspace();
      const updatedWorkspace = workspaceManagerRef.current.getWorkspace();
      if (updatedWorkspace) setWorkspace(updatedWorkspace);
      handleChapterSelect(newChapter.id);
    }
  };

  const handleChapterDelete = async (chapterId: string) => {
    if (!workspace) return;
    const chapter = workspace.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return;

    const confirmed = await showConfirm({ content: '确定删除此章节？' });
    if (!confirmed) return;

    const success = await chapterServiceRef.current.deleteChapter(workspace.path, chapter.path);
    if (success) {
      await workspaceManagerRef.current.refreshWorkspace();
      const updatedWorkspace = workspaceManagerRef.current.getWorkspace();
      if (updatedWorkspace) setWorkspace(updatedWorkspace);
      if (currentChapterId === chapterId) {
        setCurrentChapterId(null);
        setCurrentChapterData(null);
        setBlocks([]);
        setLayoutRows([]);
      }
    }
  };

  const handleChapterReorder = async (chapterIds: string[]) => {
    if (!workspace) return;
    await chapterServiceRef.current.reorderChapters(workspace.path, chapterIds);
    await workspaceManagerRef.current.refreshWorkspace();
    const updatedWorkspace = workspaceManagerRef.current.getWorkspace();
    if (updatedWorkspace) setWorkspace(updatedWorkspace);
  };

  const handleMaterialSelect = (id: string) => console.log('Material:', id);
  const handleMaterialCreate = (type: string) => console.log('Create:', type);
  const handleMaterialDelete = (id: string) => console.log('Delete:', id);

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
            isModified={fileState.isModified}
            saveStatus={fileState.saveStatus}
            lastSavedTime={fileState.lastSavedTime}
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
            onMaterialSelect={handleMaterialSelect}
            onMaterialCreate={handleMaterialCreate}
            onMaterialDelete={handleMaterialDelete}
          >
            <EditorView
              blocks={blocks}
              layoutRows={layoutRows}
              editingBlockId={editingBlockId}
              draggingBlockId={draggingBlockId}
              title={currentChapterData?.meta.title}
              saveStatus={fileState.saveStatus}
              lastSavedTime={fileState.lastSavedTime}
              emptyMessage="选择一个章节开始编辑"
              onUpdateBlock={handleUpdateBlock}
              onCreateSibling={handleCreateSibling}
              onColumnResize={handleColumnResize}
              onToggleEdit={handleToggleEdit}
              onCreateNewBlock={handleCreateNewBlock}
              onDragBlock={handleDragBlock}
              onSetDraggingBlock={setDraggingBlockId}
            />
          </WorkspaceView>
        </Content>
      </Layout>
    );
  }
  return (
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
        <div style={{ height: '100%', background: '#fff', borderRadius: 8 }}>
          <EditorView
            blocks={blocks}
            layoutRows={layoutRows}
            editingBlockId={editingBlockId}
            draggingBlockId={draggingBlockId}
            title={fileServiceRef.current.getFileName()}
            saveStatus={fileState.saveStatus}
            lastSavedTime={fileState.lastSavedTime}
            emptyMessage="没有内容，请打开文件或创建新文档"
            onUpdateBlock={handleUpdateBlock}
            onCreateSibling={handleCreateSibling}
            onColumnResize={handleColumnResize}
            onToggleEdit={handleToggleEdit}
            onCreateNewBlock={handleCreateNewBlock}
            onDragBlock={handleDragBlock}
            onSetDraggingBlock={setDraggingBlockId}
          />
        </div>
      </Content>
    </Layout>
  );
}

export default App;
