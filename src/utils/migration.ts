import type { Block, LayoutRow } from '@/types/block';
import type { TiptapDocument } from '@/types/tiptap';
import { convertBlocksToDocument, convertDocumentToBlocks } from './blockToTiptap';

export interface MigrationResult {
  success: boolean;
  document?: TiptapDocument;
  error?: string;
  warnings: string[];
  stats: {
    blocksMigrated: number;
    layoutRowsMigrated: number;
    diceBlocksMigrated: number;
    imageBlocksMigrated: number;
  };
}

export interface RollbackResult {
  success: boolean;
  blocks?: Block[];
  layoutRows?: LayoutRow[];
  error?: string;
}

export function migrateToNewEditor(blocks: Block[], layoutRows: LayoutRow[]): MigrationResult {
  const warnings: string[] = [];
  const stats = {
    blocksMigrated: 0,
    layoutRowsMigrated: 0,
    diceBlocksMigrated: 0,
    imageBlocksMigrated: 0,
  };

  try {
    if (!Array.isArray(blocks)) {
      return {
        success: false,
        error: 'Invalid blocks array',
        warnings,
        stats,
      };
    }

    if (!Array.isArray(layoutRows)) {
      layoutRows = [];
    }

    stats.blocksMigrated = blocks.length;
    stats.layoutRowsMigrated = layoutRows.length;

    blocks.forEach(block => {
      if (block.type === 'dice') {
        stats.diceBlocksMigrated++;
      }
      if (block.type === 'image') {
        stats.imageBlocksMigrated++;
      }
      if (!block.id) {
        warnings.push(`Block missing ID, generated new one`);
      }
      if (!block.type) {
        warnings.push(`Block ${block.id} missing type, defaulting to paragraph`);
      }
    });

    layoutRows.forEach(row => {
      if (row.columns.length > 3) {
        warnings.push(`LayoutRow ${row.id} has more than 3 columns, may not render correctly`);
      }
    });

    const document = convertBlocksToDocument(blocks, layoutRows);

    return {
      success: true,
      document,
      warnings,
      stats,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown migration error',
      warnings,
      stats,
    };
  }
}

export function rollbackToOldEditor(doc: TiptapDocument): RollbackResult {
  try {
    if (!doc || doc.type !== 'doc') {
      return {
        success: false,
        error: 'Invalid document format',
      };
    }

    const { blocks, layoutRows } = convertDocumentToBlocks(doc);

    return {
      success: true,
      blocks,
      layoutRows,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown rollback error',
    };
  }
}

export function verifyMigration(
  originalBlocks: Block[],
  originalLayoutRows: LayoutRow[],
  migratedDoc: TiptapDocument
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const restored = rollbackToOldEditor(migratedDoc);
  if (!restored.success || !restored.blocks) {
    return {
      valid: false,
      errors: [`Rollback failed: ${restored.error}`],
    };
  }

  if (restored.blocks.length !== originalBlocks.length) {
    errors.push(
      `Block count mismatch: original ${originalBlocks.length}, restored ${restored.blocks.length}`
    );
  }

  if (restored.layoutRows?.length !== originalLayoutRows.length) {
    errors.push(
      `LayoutRow count mismatch: original ${originalLayoutRows.length}, restored ${restored.layoutRows?.length}`
    );
  }

  const originalBlockIds = new Set(originalBlocks.map(b => b.id));
  const restoredBlockIds = new Set(restored.blocks.map(b => b.id));

  originalBlockIds.forEach(id => {
    if (!restoredBlockIds.has(id)) {
      errors.push(`Block ${id} lost during migration`);
    }
  });

  restored.blocks.forEach(restoredBlock => {
    const originalBlock = originalBlocks.find(b => b.id === restoredBlock.id);
    if (!originalBlock) {
      errors.push(`Block ${restoredBlock.id} appeared after migration`);
      return;
    }

    if (originalBlock.type !== restoredBlock.type) {
      errors.push(
        `Block ${restoredBlock.id} type changed: ${originalBlock.type} -> ${restoredBlock.type}`
      );
    }

    if (originalBlock.type === 'dice' && restoredBlock.type === 'dice') {
      if (originalBlock.diceData?.formula !== restoredBlock.diceData?.formula) {
        errors.push(`Block ${restoredBlock.id} dice formula changed`);
      }
    }

    if (originalBlock.type === 'image' && restoredBlock.type === 'image') {
      if (originalBlock.imageContent?.src !== restoredBlock.imageContent?.src) {
        errors.push(`Block ${restoredBlock.id} image src changed`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function createMigrationBackup(blocks: Block[], layoutRows: LayoutRow[]): string {
  return JSON.stringify({
    version: 1,
    timestamp: new Date().toISOString(),
    data: { blocks, layoutRows },
  });
}

export function restoreFromBackup(
  backupJson: string
): { blocks: Block[]; layoutRows: LayoutRow[] } | null {
  try {
    const backup = JSON.parse(backupJson);
    if (backup.version !== 1) {
      console.error('Unsupported backup version');
      return null;
    }
    return backup.data;
  } catch (error) {
    console.error('Failed to restore backup:', error);
    return null;
  }
}
