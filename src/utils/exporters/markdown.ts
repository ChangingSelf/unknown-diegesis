import type { Block } from '@/types/block';

interface ExportableBlock {
  type: string;
  alt?: string;
  src?: string;
  text?: string;
}

// Simple Markdown exporter for image blocks
export function exportMarkdownFromBlocks(blocks: Block[] | ExportableBlock[]): string {
  return blocks
    .map(b => {
      if (b.type === 'image') {
        const alt = (b as ExportableBlock).alt ?? '';
        return `![${alt}](${(b as ExportableBlock).src})`;
      }
      if (b.type === 'heading') {
        return `# ${(b as ExportableBlock).text ?? ''}`;
      }
      if (b.type === 'paragraph') {
        return (b as ExportableBlock).text ?? '';
      }
      return '';
    })
    .join('\n\n');
}
