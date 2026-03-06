import { useState, useEffect, useRef } from 'react';
import { BlockManager } from './utils/BlockManager';
import { Block } from './types/block';
import { FileService } from './services/FileService';
import { AutoSaveManager } from './services/AutoSaveManager';
import { FileMenu } from './components/FileMenu';
import { SaveStatusIndicator } from './components/SaveStatusIndicator';
import { LayoutRowComponent } from './components/LayoutRow';

function App() {
  // 初始化服务
  const fileServiceRef = useRef<FileService>(new FileService());
  const autoSaveManagerRef = useRef<AutoSaveManager>(new AutoSaveManager());
  const blockManagerRef = useRef<BlockManager>(new BlockManager());

  // 状态
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [layoutRows, setLayoutRows] = useState(blockManagerRef.current.getLayoutRows());
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [fileState, setFileState] = useState(fileServiceRef.current.getState());
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [isAltKeyPressed, setIsAltKeyPressed] = useState(false);

  // 初始化示例内容
  useEffect(() => {
    const initialContent = `# 未知叙事编辑器

这是一个支持文件操作、键盘交互和并列布局的块编辑器。

## 主要功能

- **文件操作**：支持打开、保存、另存为
- **自动保存**：3秒防抖自动保存
- **键盘交互**：Enter 创建新块，Shift+Enter 软换行
- **并列布局**：支持最多 3 列并列

## 使用方法

1. 点击任意块进入编辑状态
2. 使用 Enter 键创建新段落块
3. 使用 Shift+Enter 在块内换行
4. 拖动块进行排序，按住 Alt 键拖动创建并列布局

感谢使用！`;

    blockManagerRef.current = BlockManager.fromMarkdown(initialContent);
    setBlocks(blockManagerRef.current.getBlocks());
    setLayoutRows(blockManagerRef.current.getLayoutRows());
  }, []);

  // 监听 Alt 键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        setIsAltKeyPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey) {
        setIsAltKeyPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 订阅文件状态变化
  useEffect(() => {
    const unsubscribe = fileServiceRef.current.subscribe(setFileState);
    return unsubscribe;
  }, []);

  // 设置自动保存回调
  useEffect(() => {
    autoSaveManagerRef.current.setSaveCallback(async () => {
      if (!fileState.currentFilePath) return false;

      const content =
        fileState.fileFormat === 'udn'
          ? blockManagerRef.current.toUDN()
          : blockManagerRef.current.toMarkdown();

      const result = await fileServiceRef.current.saveFile(content);
      return result.success;
    });

    autoSaveManagerRef.current.enable();

    return () => {
      autoSaveManagerRef.current.destroy();
    };
  }, [fileState.currentFilePath, fileState.fileFormat]);

  // 文件操作
  const handleOpen = async () => {
    const result = await fileServiceRef.current.openFile();
    if (result.success && result.content) {
      // 根据文件格式解析
      if (result.path?.endsWith('.udn')) {
        blockManagerRef.current = BlockManager.fromUDN(result.content);
      } else {
        blockManagerRef.current = BlockManager.fromMarkdown(result.content);
      }
      setBlocks(blockManagerRef.current.getBlocks());
      setLayoutRows(blockManagerRef.current.getLayoutRows());
    }
  };

  const handleSave = async () => {
    await autoSaveManagerRef.current.saveNow();
  };

  const handleSaveAs = async () => {
    const content =
      fileState.fileFormat === 'udn'
        ? blockManagerRef.current.toUDN()
        : blockManagerRef.current.toMarkdown();

    await fileServiceRef.current.saveFileAs(content);
  };

  const handleNew = () => {
    blockManagerRef.current = new BlockManager();
    setBlocks([]);
    setLayoutRows([]);
    fileServiceRef.current.createNewFile();
  };

  // 块操作
  const handleUpdateBlock = (block: Block) => {
    blockManagerRef.current.updateBlock(block.id, block);
    setBlocks(blockManagerRef.current.getBlocks());
    fileServiceRef.current.markAsModified();
    autoSaveManagerRef.current.onContentChange();
  };

  const handleCreateSibling = (blockId: string) => {
    const newBlock = blockManagerRef.current.createSiblingBlock(blockId);
    if (newBlock) {
      setBlocks(blockManagerRef.current.getBlocks());
      setLayoutRows(blockManagerRef.current.getLayoutRows());
      setEditingBlockId(newBlock.id);
      fileServiceRef.current.markAsModified();
      autoSaveManagerRef.current.onContentChange();
    }
  };

  const handleColumnResize = (rowId: string, columnId: string, newWidth: number) => {
    blockManagerRef.current.resizeColumn(rowId, columnId, newWidth);
    setLayoutRows(blockManagerRef.current.getLayoutRows());
    fileServiceRef.current.markAsModified();
    autoSaveManagerRef.current.onContentChange();
  };

  const handleToggleEdit = (blockId: string) => {
    setEditingBlockId(editingBlockId === blockId ? null : blockId);
  };

  // 处理创建新块（通过 Enter 键）
  const handleCreateNewBlock = (
    currentBlockId: string,
    position: 'before' | 'after' | 'split',
    content?: string
  ) => {
    const currentBlock = blockManagerRef.current.getBlock(currentBlockId);
    if (!currentBlock) return;

    // 创建新块
    const newBlock = blockManagerRef.current.addBlock(
      'paragraph',
      content ? `<p>${content}</p>` : ''
    );

    // 根据位置插入新块
    const blocks = blockManagerRef.current.getBlocks();
    const currentIndex = blocks.findIndex(b => b.id === currentBlockId);

    if (currentIndex !== -1) {
      // 移除新添加的块
      blockManagerRef.current.deleteBlock(newBlock.id);

      // 根据位置重新插入
      if (position === 'before') {
        blocks.splice(currentIndex, 0, newBlock);
      } else {
        blocks.splice(currentIndex + 1, 0, newBlock);
      }

      // 更新 BlockManager
      blockManagerRef.current = new BlockManager(blocks, blockManagerRef.current.getLayoutRows());

      // 如果当前块有布局信息，需要更新布局
      if (currentBlock.layoutRowId && currentBlock.layoutColumnId) {
        const layoutRows = blockManagerRef.current.getLayoutRows();
        const row = layoutRows.find(r => r.id === currentBlock.layoutRowId);
        if (row) {
          const column = row.columns.find(c => c.id === currentBlock.layoutColumnId);
          if (column) {
            const blockIndex = column.blockIds.indexOf(currentBlockId);
            if (blockIndex !== -1) {
              if (position === 'before') {
                column.blockIds.splice(blockIndex, 0, newBlock.id);
              } else {
                column.blockIds.splice(blockIndex + 1, 0, newBlock.id);
              }

              // 设置新块的布局信息
              newBlock.layoutRowId = currentBlock.layoutRowId;
              newBlock.layoutColumnId = currentBlock.layoutColumnId;
            }
          }
        }
      }

      setBlocks([...blockManagerRef.current.getBlocks()]);
      setLayoutRows([...blockManagerRef.current.getLayoutRows()]);
      setEditingBlockId(newBlock.id);
      fileServiceRef.current.markAsModified();
      autoSaveManagerRef.current.onContentChange();
    }
  };

  // 处理拖动：根据 Alt 键决定是创建并列块还是排序
  const handleDragBlock = (sourceBlockId: string, targetBlockId: string) => {
    setDraggingBlockId(null);

    if (sourceBlockId === targetBlockId) return;

    const sourceBlock = blockManagerRef.current.getBlock(sourceBlockId);
    const targetBlock = blockManagerRef.current.getBlock(targetBlockId);

    if (!sourceBlock || !targetBlock) return;

    // 如果按下 Alt 键，创建并列布局
    if (isAltKeyPressed) {
      // 如果目标块已经在并列布局中，将源块移动到同一行
      if (targetBlock.layoutRowId && targetBlock.layoutColumnId) {
        blockManagerRef.current.moveBlockToColumn(sourceBlockId, targetBlock.layoutColumnId);
      } else {
        // 否则创建新的并列布局
        const newBlock = blockManagerRef.current.createSiblingBlock(targetBlockId);
        if (newBlock) {
          // 将源块移动到新列
          blockManagerRef.current.moveBlockToColumn(sourceBlockId, newBlock.layoutColumnId!);
          // 删除刚创建的空块
          blockManagerRef.current.deleteBlockFromLayout(newBlock.id);
        }
      }
    } else {
      // 普通拖动，进行块排序
      const allBlocks = blockManagerRef.current.getBlocks();
      const sourceIndex = allBlocks.findIndex(b => b.id === sourceBlockId);
      const targetIndex = allBlocks.findIndex(b => b.id === targetBlockId);

      if (sourceIndex !== -1 && targetIndex !== -1) {
        // 移除源块
        const [movedBlock] = allBlocks.splice(sourceIndex, 1);
        // 插入到目标位置
        allBlocks.splice(targetIndex, 0, movedBlock);

        // 更新 BlockManager
        blockManagerRef.current = new BlockManager(
          allBlocks,
          blockManagerRef.current.getLayoutRows()
        );
      }
    }

    setBlocks(blockManagerRef.current.getBlocks());
    setLayoutRows(blockManagerRef.current.getLayoutRows());
    fileServiceRef.current.markAsModified();
    autoSaveManagerRef.current.onContentChange();
  };

  return (
    <div className="min-h-screen bg-paper-50 bg-paper-texture">
      {/* 文件菜单 */}
      <FileMenu
        fileName={fileServiceRef.current.getFileName()}
        isModified={fileState.isModified}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onNew={handleNew}
      />

      <header className="bg-white shadow-paper border-b border-paper-300">
        <div className="px-8 py-5 flex justify-between items-center">
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-charcoal-900 font-display">
              未知叙事
              <span className="text-lg font-normal text-charcoal-500 ml-2">小说块编辑器</span>
            </h1>
            <p className="text-sm text-charcoal-500 mt-1.5 font-ui">
              基于 Markdown + 块编辑 + 双链的桌面端编辑器
            </p>
          </div>

          {/* 保存状态指示器 */}
          <SaveStatusIndicator
            status={fileState.saveStatus}
            lastSavedTime={fileState.lastSavedTime}
          />
        </div>
      </header>

      <main className="container mx-auto px-8 py-10">
        <div className="bg-white rounded-2xl shadow-paper border border-paper-300 p-8 animate-slide-up">
          {/* 布局行列表 */}
          {layoutRows.length > 0 ? (
            layoutRows.map(row => (
              <LayoutRowComponent
                key={row.id}
                row={row}
                blocks={blocks}
                onUpdateBlock={handleUpdateBlock}
                onCreateSibling={handleCreateSibling}
                onColumnResize={handleColumnResize}
                editingBlockId={editingBlockId}
                onToggleEdit={handleToggleEdit}
                onCreateNewBlock={handleCreateNewBlock}
                onDragBlock={handleDragBlock}
                draggingBlockId={draggingBlockId}
                onSetDraggingBlock={setDraggingBlockId}
              />
            ))
          ) : (
            <div className="text-center py-16 text-charcoal-400">
              <p className="text-lg">没有内容，请打开文件或创建新文档</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
