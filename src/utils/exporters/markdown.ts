import path from 'path';
import fs from 'fs';
import type { Block } from '@/types/block';
import type { ImageBlockContent, ImageSource } from '@/types/image';

export function blockToMarkdown(block: Block): string {
  if (block.type === 'image' && block.imageContent) {
    const content: ImageBlockContent = block.imageContent;
    const alt: string = content.caption ?? '';
    const source: ImageSource = content.source ?? { type: 'local', path: '' };

    let url = '';
    if (source.type === 'remote') {
      url = source.path;
    } else {
      url = source.path;
    }
    return `![${alt}](${url})`;
  }

  if (block.type === 'layoutRow' && (block as { columns?: unknown[] }).columns) {
    const row = block as { columns?: { blockIds: string[] }[] };
    const parts: string[] = [];
    if (row.columns) {
      for (const col of row.columns) {
        for (const blockId of col.blockIds) {
          parts.push(`[Block: ${blockId}]`);
        }
      }
    }
    return parts.join('\n\n');
  }

  if (block.type === 'heading' && (block as { attrs?: { level?: number } }).attrs?.level) {
    const level = (block as { attrs?: { level?: number } }).attrs?.level ?? 1;
    const headingChar = '#'.repeat(Math.max(1, Math.min(6, level)));
    return `${headingChar} Heading`;
  }

  return 'Content';
}

export interface ExportOptions {
  workspacePath: string;
  outputPath: string;
  copyAssets?: boolean;
}

export async function exportToMarkdown(
  blocks: Block[],
  options: ExportOptions
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const { workspacePath, outputPath, copyAssets } = options;

    const md = blocks.map(block => blockToMarkdown(block)).join('\n\n');

    const finalPath = outputPath.endsWith('.md') ? outputPath : path.join(outputPath, 'export.md');
    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(finalPath, md, 'utf-8');

    if (copyAssets) {
      const srcAssets = path.join(workspacePath, 'assets');
      if (fs.existsSync(srcAssets)) {
        const destAssets = path.join(path.dirname(finalPath), 'assets');
        copyDirRecursive(srcAssets, destAssets);
      }
    }

    return { success: true, filePath: finalPath };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message };
  }
}

function copyDirRecursive(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export default exportToMarkdown;
