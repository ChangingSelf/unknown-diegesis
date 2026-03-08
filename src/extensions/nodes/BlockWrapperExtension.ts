import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import BlockWrapperView from '@/components/BlockWrapperView';

export interface BlockWrapperOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockWrapper: {
      insertBlockWrapper: (attrs?: { blockType?: string }) => ReturnType;
      updateBlockType: (blockType: string) => ReturnType;
    };
  }
}

export const BlockWrapper = Node.create<BlockWrapperOptions>({
  name: 'blockWrapper',

  priority: 1000,

  group: 'block',

  content:
    '(paragraph | heading | bulletList | orderedList | taskList | blockquote | horizontalRule)+',

  defining: true,

  isolating: false,

  draggable: true,

  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-block-id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { 'data-block-id': attributes.id };
        },
      },
      blockType: {
        default: 'paragraph',
        parseHTML: element => element.getAttribute('data-block-type') || 'paragraph',
        renderHTML: attributes => {
          return { 'data-block-type': attributes.blockType };
        },
      },
      created: {
        default: null,
        parseHTML: element => element.getAttribute('data-created'),
        renderHTML: attributes => {
          if (!attributes.created) return {};
          return { 'data-created': attributes.created };
        },
      },
      modified: {
        default: null,
        parseHTML: element => element.getAttribute('data-modified'),
        renderHTML: attributes => {
          if (!attributes.modified) return {};
          return { 'data-modified': attributes.modified };
        },
      },
      references: {
        default: [],
        parseHTML: element => {
          const refs = element.getAttribute('data-references');
          return refs ? JSON.parse(refs) : [];
        },
        renderHTML: attributes => {
          if (!attributes.references || attributes.references.length === 0) return {};
          return { 'data-references': JSON.stringify(attributes.references) };
        },
      },
      referencedBy: {
        default: [],
        parseHTML: element => {
          const refs = element.getAttribute('data-referenced-by');
          return refs ? JSON.parse(refs) : [];
        },
        renderHTML: attributes => {
          if (!attributes.referencedBy || attributes.referencedBy.length === 0) return {};
          return { 'data-referenced-by': JSON.stringify(attributes.referencedBy) };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-block-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-type': 'block-wrapper' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ];
  },

  addCommands() {
    return {
      insertBlockWrapper:
        attrs =>
        ({ commands }) => {
          const now = new Date().toISOString();
          return commands.insertContent({
            type: this.name,
            attrs: {
              blockType: attrs?.blockType || 'paragraph',
              created: now,
              modified: now,
            },
            content: [{ type: 'paragraph' }],
          });
        },
      updateBlockType:
        blockType =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, {
            blockType,
            modified: new Date().toISOString(),
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlockWrapperView);
  },
});

export default BlockWrapper;
