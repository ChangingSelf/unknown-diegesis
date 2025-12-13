import { Block, BlockType, Document } from '../types/block';

export class BlockManager {
  private blocks: Block[] = [];
  private document: Document | null = null;

  constructor(initialBlocks: Block[] = []) {
    this.blocks = initialBlocks;
  }

  // 获取所有块
  getBlocks(): Block[] {
    return [...this.blocks];
  }

  // 根据ID获取块
  getBlock(id: string): Block | undefined {
    return this.blocks.find(block => block.id === id);
  }

  // 添加新块
  addBlock(type: BlockType, content: string = ''): Block {
    const newBlock: Block = {
      id: this.generateId(),
      type,
      content,
      references: [],
      referencedBy: [],
      metadata: {
        created: new Date(),
        modified: new Date(),
      },
    };

    this.blocks.push(newBlock);
    return newBlock;
  }

  // 更新块
  updateBlock(id: string, updates: Partial<Block>): Block | null {
    const index = this.blocks.findIndex(block => block.id === id);
    if (index === -1) return null;

    this.blocks[index] = {
      ...this.blocks[index],
      ...updates,
      metadata: {
        ...this.blocks[index].metadata,
        ...updates.metadata,
        modified: new Date(),
      },
    };

    return this.blocks[index];
  }

  // 删除块
  deleteBlock(id: string): boolean {
    const index = this.blocks.findIndex(block => block.id === id);
    if (index === -1) return false;

    this.blocks.splice(index, 1);
    return true;
  }

  // 重新排序块
  reorderBlocks(fromIndex: number, toIndex: number): boolean {
    if (fromIndex < 0 || fromIndex >= this.blocks.length || 
        toIndex < 0 || toIndex >= this.blocks.length) {
      return false;
    }

    const [movedBlock] = this.blocks.splice(fromIndex, 1);
    this.blocks.splice(toIndex, 0, movedBlock);
    return true;
  }

  // 创建文档
  createDocument(title: string): Document {
    this.document = {
      id: this.generateId(),
      title,
      blocks: [...this.blocks],
      created: new Date(),
      modified: new Date(),
    };
    return this.document;
  }

  // 获取当前文档
  getDocument(): Document | null {
    return this.document;
  }

  // 生成唯一ID
  private generateId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 从Markdown内容创建块
  static fromMarkdown(markdown: string): BlockManager {
    const lines = markdown.split('\n');
    const blocks: Block[] = [];
    let currentContent = '';
    let currentType: BlockType = 'paragraph';

    for (const line of lines) {
      // 检测标题
      if (line.startsWith('#')) {
        if (currentContent) {
          blocks.push({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: currentType,
            content: currentContent.trim(),
            metadata: {
              created: new Date(),
              modified: new Date(),
            },
          });
          currentContent = '';
        }
        currentType = 'heading';
        currentContent = line;
      }
      // 检测引用
      else if (line.startsWith('>')) {
        if (currentContent && currentType !== 'quote') {
          blocks.push({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: currentType,
            content: currentContent.trim(),
            metadata: {
              created: new Date(),
              modified: new Date(),
            },
          });
          currentContent = '';
        }
        currentType = 'quote';
        currentContent += (currentContent ? '\n' : '') + line;
      }
      // 检测列表项
      else if (line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line)) {
        if (currentContent && currentType !== 'bulletList' && currentType !== 'orderedList') {
          blocks.push({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: currentType,
            content: currentContent.trim(),
            metadata: {
              created: new Date(),
              modified: new Date(),
            },
          });
          currentContent = '';
        }
        currentType = line.startsWith('-') || line.startsWith('*') ? 'bulletList' : 'orderedList';
        currentContent += (currentContent ? '\n' : '') + line;
      }
      // 检测分割线
      else if (line.trim() === '---' || line.trim() === '***') {
        if (currentContent) {
          blocks.push({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: currentType,
            content: currentContent.trim(),
            metadata: {
              created: new Date(),
              modified: new Date(),
            },
          });
          currentContent = '';
        }
        blocks.push({
          id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'horizontalRule',
          content: '---',
          metadata: {
            created: new Date(),
            modified: new Date(),
          },
        });
        currentType = 'paragraph';
      }
      // 普通段落
      else {
        if (currentContent && currentType !== 'paragraph') {
          blocks.push({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: currentType,
            content: currentContent.trim(),
            metadata: {
              created: new Date(),
              modified: new Date(),
            },
          });
          currentContent = '';
        }
        currentType = 'paragraph';
        currentContent += (currentContent ? '\n' : '') + line;
      }
    }

    // 添加最后一个块
    if (currentContent) {
      blocks.push({
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: currentType,
        content: currentContent.trim(),
        metadata: {
          created: new Date(),
          modified: new Date(),
        },
      });
    }

    return new BlockManager(blocks);
  }

  // 转换为Markdown
  toMarkdown(): string {
    return this.blocks.map(block => block.content).join('\n\n');
  }
}
