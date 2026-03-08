import type { Block } from '@/types/block';

interface ExportableBlock {
  type: string;
  src?: string;
  text?: string;
}

// Simple Word exporter for image blocks (text-based)
export function exportWordFromBlocks(blocks: Block[] | ExportableBlock[]): string {
  return blocks
    .map(b => {
      const eb = b as ExportableBlock;
      if (b.type === 'image') return `[Image: ${eb.src}]`;
      if (b.type === 'heading') return `Heading: ${eb.text ?? ''}`;
      if (b.type === 'paragraph') return eb.text ?? '';
      return '';
    })
    .join('\n\n');
}
