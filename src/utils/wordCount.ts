import { TiptapDocument, TiptapNode } from '@/types/tiptap';

function extractTextFromNode(node: TiptapNode): string {
  let text = '';
  if (node.text) {
    text += node.text;
  }
  if (node.content && Array.isArray(node.content)) {
    for (const child of node.content) {
      text += extractTextFromNode(child);
    }
  }
  return text;
}

export function extractTextFromDocument(doc: TiptapDocument | null | undefined): string {
  if (!doc || !doc.content) {
    return '';
  }
  let text = '';
  for (const node of doc.content) {
    text += extractTextFromNode(node);
  }
  return text;
}

export function countWords(text: string): number {
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  const numbers = text.match(/\d+/g) || [];
  return chineseChars.length + englishWords.length + numbers.length;
}

export function countDocumentWords(doc: TiptapDocument | null | undefined): number {
  const text = extractTextFromDocument(doc);
  return countWords(text);
}
