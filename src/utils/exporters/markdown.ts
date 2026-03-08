import type { TiptapDocument, TiptapNode } from '@/types/tiptap';

function nodeToMarkdown(node: TiptapNode): string {
  if (!node.content || node.content.length === 0) {
    return '';
  }

  return node.content
    .map(child => {
      if (child.type === 'text') {
        return child.text || '';
      }

      if (child.type === 'paragraph') {
        const text = child.content ? child.content.map(nodeToMarkdown).join('') : '';
        return text + '\n\n';
      }

      if (child.type === 'heading') {
        const level = (child.attrs?.level as number) || 1;
        const text = child.content ? child.content.map(nodeToMarkdown).join('') : '';
        return `${'#'.repeat(level)} ${text}\n\n`;
      }

      if (child.type === 'image') {
        const src = child.attrs?.src || '';
        const alt = child.attrs?.alt || '';
        return `![${alt}](${src})\n\n`;
      }

      if (child.type === 'hardBreak') {
        return '\n';
      }

      if (child.content && Array.isArray(child.content)) {
        return child.content.map(nodeToMarkdown).join('');
      }

      return '';
    })
    .join('');
}

export function exportMarkdownFromTiptap(document: TiptapDocument): string {
  return nodeToMarkdown(document).trim();
}
