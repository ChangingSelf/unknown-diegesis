export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapTextNode {
  type: 'text';
  text: string;
  marks?: TiptapMark[];
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

export interface TiptapDocument {
  type: 'doc';
  content: TiptapNode[];
}

export type TiptapContent = TiptapDocument | null;

const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function createEmptyDocument(): TiptapDocument {
  const now = new Date().toISOString();
  return {
    type: 'doc',
    content: [
      {
        type: 'blockWrapper',
        attrs: {
          id: generateId(),
          blockType: 'paragraph',
          created: now,
          modified: now,
        },
        content: [{ type: 'paragraph' }],
      },
    ],
  };
}

export function createDocumentFromText(text: string): TiptapDocument {
  const now = new Date().toISOString();
  return {
    type: 'doc',
    content: [
      {
        type: 'blockWrapper',
        attrs: {
          id: generateId(),
          blockType: 'paragraph',
          created: now,
          modified: now,
        },
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text }],
          },
        ],
      },
    ],
  };
}
