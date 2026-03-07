import { Block, BlockType, Document, LayoutRow, LayoutColumn } from '../types/block';
import { TiptapContent, createEmptyDocument, createDocumentFromText } from '../types/tiptap';

export class BlockManager {
  private blocks: Block[] = [];
  private document: Document | null = null;
  private layoutRows: LayoutRow[] = [];

  constructor(initialBlocks: Block[] = [], layoutRows: LayoutRow[] = []) {
    this.blocks = initialBlocks;
    this.layoutRows = layoutRows;
    if (this.layoutRows.length === 0 && this.blocks.length > 0) {
      this.initializeDefaultLayout();
    }
  }

  getBlocks(): Block[] {
    return [...this.blocks];
  }

  getBlock(id: string): Block | undefined {
    return this.blocks.find(block => block.id === id);
  }

  addBlock(type: BlockType, content: TiptapContent = null): Block {
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

  deleteBlock(id: string): boolean {
    const index = this.blocks.findIndex(block => block.id === id);
    if (index === -1) return false;
    this.blocks.splice(index, 1);
    return true;
  }

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

  getDocument(): Document | null {
    return this.document;
  }

  private generateId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static fromMarkdown(markdown: string): BlockManager {
    const lines = markdown.split('\n');
    const blocks: Block[] = [];
    let currentContent = '';
    let currentType: BlockType = 'paragraph';

    for (const line of lines) {
      if (line.startsWith('#')) {
        if (currentContent) {
          blocks.push({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: currentType,
            content: createDocumentFromText(currentContent.trim()),
            metadata: { created: new Date(), modified: new Date() },
          });
          currentContent = '';
        }
        currentType = 'heading';
        currentContent = line;
      } else if (line.startsWith('>')) {
        if (currentContent && currentType !== 'quote') {
          blocks.push({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: currentType,
            content: createDocumentFromText(currentContent.trim()),
            metadata: { created: new Date(), modified: new Date() },
          });
          currentContent = '';
        }
        currentType = 'quote';
        currentContent += (currentContent ? '\n' : '') + line;
      } else if (line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line)) {
        if (currentContent && currentType !== 'bulletList' && currentType !== 'orderedList') {
          blocks.push({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: currentType,
            content: createDocumentFromText(currentContent.trim()),
            metadata: { created: new Date(), modified: new Date() },
          });
          currentContent = '';
        }
        currentType = line.startsWith('-') || line.startsWith('*') ? 'bulletList' : 'orderedList';
        currentContent += (currentContent ? '\n' : '') + line;
      } else if (line.trim() === '---' || line.trim() === '***') {
        if (currentContent) {
          blocks.push({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: currentType,
            content: createDocumentFromText(currentContent.trim()),
            metadata: { created: new Date(), modified: new Date() },
          });
          currentContent = '';
        }
        blocks.push({
          id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'horizontalRule',
          content: createEmptyDocument(),
          metadata: { created: new Date(), modified: new Date() },
        });
        currentType = 'paragraph';
      } else {
        if (currentContent && currentType !== 'paragraph') {
          blocks.push({
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: currentType,
            content: createDocumentFromText(currentContent.trim()),
            metadata: { created: new Date(), modified: new Date() },
          });
          currentContent = '';
        }
        currentType = 'paragraph';
        currentContent += (currentContent ? '\n' : '') + line;
      }
    }

    if (currentContent) {
      blocks.push({
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: currentType,
        content: createDocumentFromText(currentContent.trim()),
        metadata: { created: new Date(), modified: new Date() },
      });
    }

    return new BlockManager(blocks);
  }

  toMarkdown(): string {
    return this.blocks
      .map(block => {
        if (!block.content) return '';
        return this.jsonToPlainText(block.content);
      })
      .join('\n\n');
  }

  private jsonToPlainText(json: TiptapContent): string {
    if (!json || !json.content) return '';
    const extractText = (node: unknown): string => {
      const n = node as { type?: string; text?: string; content?: unknown[] };
      if (n.type === 'text') return n.text || '';
      if (n.content) return n.content.map(extractText).join('');
      return '';
    };
    return json.content.map(extractText).join('\n');
  }

  private countWords(content: TiptapContent): number {
    const text = this.jsonToPlainText(content);
    if (!text) return 0;
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  }

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
    this.blocks.forEach((block, index) => {
      block.layoutRowId = this.layoutRows[index].id;
      block.layoutColumnId = this.layoutRows[index].columns[0].id;
    });
  }

  getLayoutRows(): LayoutRow[] {
    return [...this.layoutRows];
  }

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

  createSiblingBlock(blockId: string, type: BlockType = 'paragraph'): Block | null {
    const block = this.getBlock(blockId);
    if (!block || !block.layoutRowId) return null;
    const row = this.layoutRows.find(r => r.id === block.layoutRowId);
    if (!row) return null;
    if (row.columns.length >= 3) {
      console.warn('已达最大列数 3');
      return null;
    }
    const newBlock = this.addBlock(type);
    const newColumn: LayoutColumn = {
      id: this.generateId(),
      width: 100 / (row.columns.length + 1),
      blockIds: [newBlock.id],
    };
    row.columns.forEach(col => {
      col.width = 100 / (row.columns.length + 1);
    });
    row.columns.push(newColumn);
    newBlock.layoutRowId = row.id;
    newBlock.layoutColumnId = newColumn.id;
    return newBlock;
  }

  removeEmptyColumn(rowId: string, columnId: string): boolean {
    const row = this.layoutRows.find(r => r.id === rowId);
    if (!row) return false;
    const columnIndex = row.columns.findIndex(c => c.id === columnId);
    if (columnIndex === -1) return false;
    const column = row.columns[columnIndex];
    if (column.blockIds.length > 0) return false;
    row.columns.splice(columnIndex, 1);
    if (row.columns.length === 1) {
      row.columns[0].width = 100;
    } else {
      const equalWidth = 100 / row.columns.length;
      row.columns.forEach(col => {
        col.width = equalWidth;
      });
    }
    return true;
  }

  resizeColumn(rowId: string, columnId: string, newWidth: number): boolean {
    const row = this.layoutRows.find(r => r.id === rowId);
    if (!row) return false;
    const column = row.columns.find(c => c.id === columnId);
    if (!column) return false;
    if (newWidth < 20 || newWidth > 80) return false;
    const oldWidth = column.width;
    const diff = newWidth - oldWidth;
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

  moveBlockToColumn(blockId: string, targetColumnId: string): boolean {
    const block = this.getBlock(blockId);
    if (!block || !block.layoutRowId || !block.layoutColumnId) return false;
    const row = this.layoutRows.find(r => r.id === block.layoutRowId);
    if (!row) return false;
    const sourceColumn = row.columns.find(c => c.id === block.layoutColumnId);
    const targetColumn = row.columns.find(c => c.id === targetColumnId);
    if (!sourceColumn || !targetColumn) return false;
    const blockIndex = sourceColumn.blockIds.indexOf(blockId);
    if (blockIndex !== -1) {
      sourceColumn.blockIds.splice(blockIndex, 1);
    }
    targetColumn.blockIds.push(blockId);
    block.layoutColumnId = targetColumnId;
    if (sourceColumn.blockIds.length === 0) {
      this.removeEmptyColumn(row.id, sourceColumn.id);
    }
    return true;
  }

  deleteBlockFromLayout(blockId: string): boolean {
    const block = this.getBlock(blockId);
    if (!block) return false;
    if (block.layoutRowId && block.layoutColumnId) {
      const row = this.layoutRows.find(r => r.id === block.layoutRowId);
      if (row) {
        const column = row.columns.find(c => c.id === block.layoutColumnId);
        if (column) {
          const blockIndex = column.blockIds.indexOf(blockId);
          if (blockIndex !== -1) {
            column.blockIds.splice(blockIndex, 1);
          }
          if (column.blockIds.length === 0) {
            this.removeEmptyColumn(row.id, column.id);
          }
        }
        if (row.columns.length === 0 || row.columns.every(c => c.blockIds.length === 0)) {
          const rowIndex = this.layoutRows.findIndex(r => r.id === row.id);
          if (rowIndex !== -1) {
            this.layoutRows.splice(rowIndex, 1);
          }
        }
      }
    }
    return this.deleteBlock(blockId);
  }

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

  static fromUD(ud: string): BlockManager {
    try {
      const data = JSON.parse(ud);
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
      return BlockManager.fromUDN(ud);
    } catch (error) {
      console.error('Failed to parse UD:', error);
      return new BlockManager();
    }
  }

  toUDN(): string {
    return this.toUD();
  }

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
