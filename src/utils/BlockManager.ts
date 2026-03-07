import { Block, BlockType, Document, LayoutRow, LayoutColumn } from '../types/block';

export class BlockManager {
  private blocks: Block[] = [];
  private document: Document | null = null;
  private layoutRows: LayoutRow[] = []; // 布局行列表

  constructor(initialBlocks: Block[] = [], layoutRows: LayoutRow[] = []) {
    this.blocks = initialBlocks;
    this.layoutRows = layoutRows;

    // 如果没有布局，为每个块创建默认单列布局
    if (this.layoutRows.length === 0 && this.blocks.length > 0) {
      this.initializeDefaultLayout();
    }
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
    if (
      fromIndex < 0 ||
      fromIndex >= this.blocks.length ||
      toIndex < 0 ||
      toIndex >= this.blocks.length
    ) {
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
    return this.blocks.map(block => this.stripHtmlTags(block.content)).join('\n\n');
  }

  // 去除 HTML 标签，保留纯文本
  private stripHtmlTags(html: string): string {
    if (!html) return '';

    // 处理换行标签
    let text = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n');

    // 处理列表项
    text = text.replace(/<li[^>]*>/gi, '- ');

    // 移除所有其他 HTML 标签
    text = text.replace(/<[^>]+>/g, '');

    // 解码 HTML 实体
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // 清理多余空白
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    return text;
  }

  // ========== 布局管理方法 ==========

  // 初始化默认布局（每个块一行）
  private initializeDefaultLayout() {
    this.layoutRows = this.blocks.map(block => ({
      id: this.generateId(),
      type: 'row' as const,
      columns: [
        {
          id: this.generateId(),
          width: 100,
          blockIds: [block.id],
        },
      ],
    }));

    // 更新块的布局引用
    this.blocks.forEach((block, index) => {
      block.layoutRowId = this.layoutRows[index].id;
      block.layoutColumnId = this.layoutRows[index].columns[0].id;
    });
  }

  // 获取所有布局行
  getLayoutRows(): LayoutRow[] {
    return [...this.layoutRows];
  }

  // 添加布局行
  addLayoutRow(): LayoutRow {
    const newRow: LayoutRow = {
      id: this.generateId(),
      type: 'row',
      columns: [
        {
          id: this.generateId(),
          width: 100,
          blockIds: [],
        },
      ],
    };

    this.layoutRows.push(newRow);
    return newRow;
  }

  // 在块旁边创建并列块
  createSiblingBlock(blockId: string, type: BlockType = 'paragraph'): Block | null {
    const block = this.getBlock(blockId);
    if (!block || !block.layoutRowId) return null;

    const row = this.layoutRows.find(r => r.id === block.layoutRowId);
    if (!row) return null;

    // 检查是否已达最大列数
    if (row.columns.length >= 3) {
      console.warn('已达最大列数 3');
      return null;
    }

    // 创建新块
    const newBlock = this.addBlock(type);

    // 添加新列
    const newColumn: LayoutColumn = {
      id: this.generateId(),
      width: 100 / (row.columns.length + 1),
      blockIds: [newBlock.id],
    };

    // 调整现有列的宽度
    row.columns.forEach(col => {
      col.width = 100 / (row.columns.length + 1);
    });

    row.columns.push(newColumn);

    // 更新新块的布局引用
    newBlock.layoutRowId = row.id;
    newBlock.layoutColumnId = newColumn.id;

    return newBlock;
  }

  // 移除列（当列为空时）
  removeEmptyColumn(rowId: string, columnId: string): boolean {
    const row = this.layoutRows.find(r => r.id === rowId);
    if (!row) return false;

    const columnIndex = row.columns.findIndex(c => c.id === columnId);
    if (columnIndex === -1) return false;

    const column = row.columns[columnIndex];

    // 只能移除空列
    if (column.blockIds.length > 0) return false;

    // 移除列
    row.columns.splice(columnIndex, 1);

    // 如果只剩一列，设置宽度为 100%
    if (row.columns.length === 1) {
      row.columns[0].width = 100;
    } else {
      // 重新分配宽度
      const equalWidth = 100 / row.columns.length;
      row.columns.forEach(col => {
        col.width = equalWidth;
      });
    }

    return true;
  }

  // 调整列宽
  resizeColumn(rowId: string, columnId: string, newWidth: number): boolean {
    const row = this.layoutRows.find(r => r.id === rowId);
    if (!row) return false;

    const column = row.columns.find(c => c.id === columnId);
    if (!column) return false;

    // 验证宽度范围
    if (newWidth < 20 || newWidth > 80) return false;

    const oldWidth = column.width;
    const diff = newWidth - oldWidth;

    // 找到相邻列调整
    const columnIndex = row.columns.findIndex(c => c.id === columnId);
    const nextColumn = row.columns[columnIndex + 1];

    if (nextColumn) {
      const nextNewWidth = nextColumn.width - diff;
      if (nextNewWidth < 20 || nextNewWidth > 80) return false;

      column.width = newWidth;
      nextColumn.width = nextNewWidth;
      return true;
    }

    return false;
  }

  // 将块移动到另一列
  moveBlockToColumn(blockId: string, targetColumnId: string): boolean {
    const block = this.getBlock(blockId);
    if (!block || !block.layoutRowId || !block.layoutColumnId) return false;

    const row = this.layoutRows.find(r => r.id === block.layoutRowId);
    if (!row) return false;

    const sourceColumn = row.columns.find(c => c.id === block.layoutColumnId);
    const targetColumn = row.columns.find(c => c.id === targetColumnId);

    if (!sourceColumn || !targetColumn) return false;

    // 从源列移除
    const blockIndex = sourceColumn.blockIds.indexOf(blockId);
    if (blockIndex !== -1) {
      sourceColumn.blockIds.splice(blockIndex, 1);
    }

    // 添加到目标列
    targetColumn.blockIds.push(blockId);

    // 更新块的列引用
    block.layoutColumnId = targetColumnId;

    // 如果源列为空，尝试移除
    if (sourceColumn.blockIds.length === 0) {
      this.removeEmptyColumn(row.id, sourceColumn.id);
    }

    return true;
  }

  // 从布局中删除块（同时从 blocks 中删除）
  deleteBlockFromLayout(blockId: string): boolean {
    const block = this.getBlock(blockId);
    if (!block) return false;

    // 从列中移除
    if (block.layoutRowId && block.layoutColumnId) {
      const row = this.layoutRows.find(r => r.id === block.layoutRowId);
      if (row) {
        const column = row.columns.find(c => c.id === block.layoutColumnId);
        if (column) {
          const blockIndex = column.blockIds.indexOf(blockId);
          if (blockIndex !== -1) {
            column.blockIds.splice(blockIndex, 1);
          }

          // 如果列为空，尝试移除
          if (column.blockIds.length === 0) {
            this.removeEmptyColumn(row.id, column.id);
          }
        }

        // 如果行为空，移除行
        if (row.columns.length === 0 || row.columns.every(c => c.blockIds.length === 0)) {
          const rowIndex = this.layoutRows.findIndex(r => r.id === row.id);
          if (rowIndex !== -1) {
            this.layoutRows.splice(rowIndex, 1);
          }
        }
      }
    }

    // 从 blocks 中删除
    return this.deleteBlock(blockId);
  }

  // 序列化为 UD 格式（新格式，包含版本和元数据）
  toUD(meta?: { title?: string; type?: string }): string {
    return JSON.stringify(
      {
        version: '1.0',
        type: meta?.type || 'chapter',
        meta: {
          id: this.document?.id || this.generateId(),
          title: meta?.title || this.document?.title || '未命名',
          number: 1,
          status: 'draft',
          wordCount: this.blocks.reduce((sum, block) => sum + this.countWords(block.content), 0),
          created: this.document?.created?.toISOString() || new Date().toISOString(),
          modified: new Date().toISOString(),
        },
        blocks: this.blocks,
        layoutRows: this.layoutRows,
      },
      null,
      2
    );
  }

  // 从 UD 格式加载（支持新旧格式）
  static fromUD(ud: string): BlockManager {
    try {
      const data = JSON.parse(ud);

      // 新格式（version 1.0）
      if (data.version === '1.0') {
        const manager = new BlockManager(data.blocks || [], data.layoutRows || []);
        if (data.meta) {
          manager.document = {
            id: data.meta.id,
            title: data.meta.title,
            blocks: data.blocks || [],
            created: new Date(data.meta.created),
            modified: new Date(data.meta.modified),
          };
        }
        return manager;
      }

      // 旧格式（直接包含 blocks/layoutRows/document）
      return BlockManager.fromUDN(ud);
    } catch (error) {
      console.error('Failed to parse UD:', error);
      return new BlockManager();
    }
  }

  // 统计字数
  private countWords(content: string): number {
    if (!content) return 0;
    const text = this.stripHtmlTags(content);
    // 中文字符按字符计数，英文按单词计数
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  }

  // 序列化为 UDN 格式（旧格式，保留向后兼容）
  toUDN(): string {
    return this.toUD();
  }

  // 从 UDN 格式加载（旧格式，保留向后兼容）
  static fromUDN(udn: string): BlockManager {
    try {
      const data = JSON.parse(udn);
      const manager = new BlockManager(data.blocks || [], data.layoutRows || []);
      if (data.document) {
        manager.document = data.document;
      }
      return manager;
    } catch (error) {
      console.error('Failed to parse UDN:', error);
      return new BlockManager();
    }
  }
}
