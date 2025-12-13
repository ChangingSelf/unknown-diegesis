import { useState, useCallback } from 'react';
import { Block, BlockType } from '../types/block';
import { BlockManager } from '../utils/BlockManager';

export const useBlockManager = (initialContent?: string) => {
  // 初始化块管理器
  const [blockManager] = useState(() => {
    if (initialContent) {
      return BlockManager.fromMarkdown(initialContent);
    }
    return new BlockManager();
  });

  // 块列表状态
  const [blocks, setBlocks] = useState<Block[]>(() => blockManager.getBlocks());

  // 更新块
  const updateBlock = useCallback((updatedBlock: Block) => {
    blockManager.updateBlock(updatedBlock.id, updatedBlock);
    setBlocks([...blockManager.getBlocks()]);
  }, [blockManager]);

  // 添加新块
  const addBlock = useCallback((type: BlockType, content?: string) => {
    const newBlock = blockManager.addBlock(type, content);
    setBlocks([...blockManager.getBlocks()]);
    return newBlock;
  }, [blockManager]);

  // 删除块
  const deleteBlock = useCallback((id: string) => {
    const success = blockManager.deleteBlock(id);
    if (success) {
      setBlocks([...blockManager.getBlocks()]);
    }
    return success;
  }, [blockManager]);

  // 重新排序块
  const reorderBlocks = useCallback((fromIndex: number, toIndex: number) => {
    const success = blockManager.reorderBlocks(fromIndex, toIndex);
    if (success) {
      setBlocks([...blockManager.getBlocks()]);
    }
    return success;
  }, [blockManager]);

  // 获取Markdown内容
  const getMarkdown = useCallback(() => {
    return blockManager.toMarkdown();
  }, [blockManager]);

  // 导出为JSON
  const exportAsJSON = useCallback(() => {
    return JSON.stringify({
      blocks: blockManager.getBlocks(),
      document: blockManager.getDocument(),
    }, null, 2);
  }, [blockManager]);

  // 从JSON导入
  const importFromJSON = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (data.blocks && Array.isArray(data.blocks)) {
        // 清空当前块
        const currentBlocks = [...blockManager.getBlocks()];
        currentBlocks.forEach(block => blockManager.deleteBlock(block.id));
        
        // 添加新块
        data.blocks.forEach((block: Block) => {
          blockManager.addBlock(block.type, block.content);
        });
        
        setBlocks([...blockManager.getBlocks()]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('导入JSON失败:', error);
      return false;
    }
  }, [blockManager]);

  return {
    blocks,
    updateBlock,
    addBlock,
    deleteBlock,
    reorderBlocks,
    getMarkdown,
    exportAsJSON,
    importFromJSON,
    blockManager,
  };
};
