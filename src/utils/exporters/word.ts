import type { TiptapDocument, TiptapNode } from '@/types/tiptap';

function nodeToText(node: TiptapNode): string {
  if (!node.content || node.content.length === 0) {
    return '';
  }

  return node.content
    .map(child => {
      if (child.type === 'text') {
        return child.text || '';
      }

      if (child.type === 'paragraph') {
        const text = child.content ? child.content.map(nodeToText).join('') : '';
        return text + '\n\n';
      }

      if (child.type === 'heading') {
        const text = child.content ? child.content.map(nodeToText).join('') : '';
        return `Heading: ${text}\n\n`;
      }

      if (child.type === 'image') {
        const src = child.attrs?.src || '';
        return `[Image: ${src}]\n\n`;
      }

      if (child.type === 'hardBreak') {
        return '\n';
      }

      if (child.content && Array.isArray(child.content)) {
        return child.content.map(nodeToText).join('');
      }

      return '';
    })
    .join('');
}

export function exportWordFromTiptap(document: TiptapDocument): string {
  return nodeToText(document).trim();
}
