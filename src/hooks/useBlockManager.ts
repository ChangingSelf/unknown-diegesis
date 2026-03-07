import { useState, useCallback } from 'react';
import { Block, BlockType } from '../types/block';
import { TiptapContent } from '../types/tiptap';
import { BlockManager } from '../utils/BlockManager';

export const useBlockManager = (initialContent?: string) => {
  const [blockManager] = useState(() => {
    if (initialContent) {
      return BlockManager.fromMarkdown(initialContent);
    }
    return new BlockManager();
  });

  const [blocks, setBlocks] = useState<Block[]>(() => blockManager.getBlocks());

  const updateBlock = useCallback(
    (updatedBlock: Block) => {
      blockManager.updateBlock(updatedBlock.id, updatedBlock);
      setBlocks([...blockManager.getBlocks()]);
    },
    [blockManager]
  );

  const addBlock = useCallback(
    (type: BlockType, content?: TiptapContent) => {
      const newBlock = blockManager.addBlock(type, content);
      setBlocks([...blockManager.getBlocks()]);
      return newBlock;
    },
    [blockManager]
  );
  const deleteBlock = useCallback(
    (id: string) => {
      const success = blockManager.deleteBlock(id);
      if (success) {
        setBlocks([...blockManager.getBlocks()]);
      }
      return success;
    },
    [blockManager]
  );
  const reorderBlocks = useCallback(
    (fromIndex: number, toIndex: number) => {
      const success = blockManager.reorderBlocks(fromIndex, toIndex);
      if (success) {
        setBlocks([...blockManager.getBlocks()]);
      }
      return success;
    },
    [blockManager]
  );
  const getMarkdown = useCallback(() => {
    return blockManager.toMarkdown();
  }, [blockManager]);
  const exportAsJSON = useCallback(() => {
    return JSON.stringify(
      {
        blocks: blockManager.getBlocks(),
        document: blockManager.getDocument(),
      },
      null,
      2
    );
  }, [blockManager]);
  const importFromJSON = useCallback(
    (json: string) => {
      try {
        const data = JSON.parse(json);
        if (data.blocks && Array.isArray(data.blocks)) {
          const currentBlocks = [...blockManager.getBlocks()];
          currentBlocks.forEach(block => blockManager.deleteBlock(block.id));
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
    },
    [blockManager]
  );

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
