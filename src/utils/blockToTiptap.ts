import type { Block, LayoutRow, LayoutColumn } from '@/types/block';
import type { TiptapDocument, TiptapNode } from '@/types/tiptap';

const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function convertBlocksToDocument(blocks: Block[], layoutRows: LayoutRow[]): TiptapDocument {
  const content: TiptapNode[] = [];
  const processedBlockIds = new Set<string>();

  const layoutRowMap = new Map<string, LayoutRow>();
  layoutRows.forEach(row => layoutRowMap.set(row.id, row));

  const blockMap = new Map<string, Block>();
  blocks.forEach(block => blockMap.set(block.id, block));

  layoutRows.forEach(row => {
    const isSingleBlockSingleColumn =
      row.columns.length === 1 && row.columns[0].blockIds.length <= 1;

    if (isSingleBlockSingleColumn) {
      const column = row.columns[0];
      const blockId = column.blockIds[0];
      const block = blockMap.get(blockId);
      if (block) {
        content.push(convertBlockToNode(block, processedBlockIds));
      }
    } else {
      content.push(convertLayoutRowToNode(row, blockMap, processedBlockIds));
    }
  });

  blocks.forEach(block => {
    if (!processedBlockIds.has(block.id)) {
      content.push(convertBlockToNode(block, processedBlockIds));
    }
  });

  return { type: 'doc', content };
}

function convertBlockToNode(block: Block, processedIds: Set<string>): TiptapNode {
  processedIds.add(block.id);

  if (block.type === 'dice') {
    return {
      type: 'diceBlock',
      attrs: {
        id: block.id,
        formula: block.diceData?.formula || '1d20',
        result: block.diceData?.result ?? null,
        rolledAt: block.diceData?.rolledAt ?? null,
      },
    };
  }

  if (block.type === 'image') {
    return {
      type: 'imageBlock',
      attrs: {
        id: block.id,
        src: block.imageContent?.src || '',
        alt: block.imageContent?.alt || '',
        caption: block.imageContent?.caption,
        layout: block.imageContent?.layout || 'full',
      },
    };
  }

  return {
    type: 'blockWrapper',
    attrs: {
      id: block.id,
      blockType: block.type,
      created: block.metadata?.created?.toISOString() ?? new Date().toISOString(),
      modified: block.metadata?.modified?.toISOString() ?? new Date().toISOString(),
      references: block.references || [],
      referencedBy: block.referencedBy || [],
    },
    content: block.content?.content || [{ type: 'paragraph' }],
  };
}

function convertLayoutRowToNode(
  row: LayoutRow,
  blockMap: Map<string, Block>,
  processedIds: Set<string>
): TiptapNode {
  return {
    type: 'layoutRow',
    attrs: {
      id: row.id,
    },
    content: row.columns.map(column => ({
      type: 'layoutColumn',
      attrs: {
        id: column.id,
        width: column.width,
      },
      content: column.blockIds
        .map(blockId => {
          const block = blockMap.get(blockId);
          if (!block) return null;
          return convertBlockToNode(block, processedIds);
        })
        .filter((node): node is TiptapNode => node !== null),
    })),
  };
}

export function convertDocumentToBlocks(doc: TiptapDocument): {
  blocks: Block[];
  layoutRows: LayoutRow[];
} {
  const blocks: Block[] = [];
  const layoutRows: LayoutRow[] = [];

  if (!doc.content) {
    return { blocks, layoutRows };
  }

  doc.content.forEach(node => {
    if (node.type === 'layoutRow') {
      const result = convertNodeToLayoutRow(node);
      layoutRows.push(result.row);
      blocks.push(...result.blocks);
    } else {
      const block = convertNodeToBlock(node);
      if (block) {
        blocks.push(block);
      }
    }
  });

  return { blocks, layoutRows };
}

function convertNodeToBlock(node: TiptapNode): Block | null {
  const attrs = node.attrs || {};

  if (node.type === 'diceBlock') {
    return {
      id: String(attrs.id || generateId()),
      type: 'dice',
      content: { type: 'doc', content: [] },
      diceData: {
        formula: String(attrs.formula || '1d20'),
        result: attrs.result as number | undefined,
        rolledAt: attrs.rolledAt as string | undefined,
      },
      metadata: {
        created: new Date(),
        modified: new Date(),
      },
    };
  }

  if (node.type === 'imageBlock') {
    return {
      id: String(attrs.id || generateId()),
      type: 'image',
      content: { type: 'doc', content: [] },
      imageContent: {
        id: String(attrs.id || generateId()),
        src: String(attrs.src || ''),
        alt: attrs.alt as string | undefined,
        caption: attrs.caption as string | undefined,
        layout: (attrs.layout as 'full' | 'left' | 'right' | 'center') || 'full',
      },
      metadata: {
        created: new Date(),
        modified: new Date(),
      },
    };
  }

  if (node.type === 'blockWrapper') {
    return {
      id: String(attrs.id || generateId()),
      type: (attrs.blockType as Block['type']) || 'paragraph',
      content: {
        type: 'doc',
        content: (node.content as TiptapNode[]) || [{ type: 'paragraph' }],
      },
      references: (attrs.references as string[]) || [],
      referencedBy: (attrs.referencedBy as string[]) || [],
      metadata: {
        created: attrs.created ? new Date(attrs.created as string) : new Date(),
        modified: attrs.modified ? new Date(attrs.modified as string) : new Date(),
      },
    };
  }

  return {
    id: generateId(),
    type: 'paragraph',
    content: {
      type: 'doc',
      content: node.content || [{ type: 'paragraph' }],
    },
    metadata: {
      created: new Date(),
      modified: new Date(),
    },
  };
}

function convertNodeToLayoutRow(node: TiptapNode): { row: LayoutRow; blocks: Block[] } {
  const blocks: Block[] = [];
  const columns: LayoutColumn[] = [];

  const rowId = (node.attrs?.id as string) || generateId();

  (node.content || []).forEach((columnNode: TiptapNode) => {
    if (columnNode.type !== 'layoutColumn') return;

    const columnId = (columnNode.attrs?.id as string) || generateId();
    const width = (columnNode.attrs?.width as number) || 50;
    const columnBlockIds: string[] = [];

    (columnNode.content || []).forEach((blockNode: TiptapNode) => {
      const block = convertNodeToBlock(blockNode);
      if (block) {
        block.layoutRowId = rowId;
        block.layoutColumnId = columnId;
        columnBlockIds.push(block.id);
        blocks.push(block);
      }
    });

    columns.push({
      id: columnId,
      width,
      blockIds: columnBlockIds,
    });
  });

  return {
    row: {
      id: rowId,
      type: 'row',
      columns,
    },
    blocks,
  };
}

export function validateConversion(
  original: { blocks: Block[]; layoutRows: LayoutRow[] },
  doc: TiptapDocument
): boolean {
  const restored = convertDocumentToBlocks(doc);

  if (restored.blocks.length !== original.blocks.length) {
    console.warn('Block count mismatch:', original.blocks.length, '->', restored.blocks.length);
    return false;
  }

  if (restored.layoutRows.length !== original.layoutRows.length) {
    console.warn(
      'LayoutRow count mismatch:',
      original.layoutRows.length,
      '->',
      restored.layoutRows.length
    );
    return false;
  }

  return true;
}
