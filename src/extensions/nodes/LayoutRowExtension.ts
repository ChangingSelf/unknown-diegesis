import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import LayoutRowView from '@/components/LayoutRowView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    layoutRow: {
      insertLayoutRow: (attrs?: { columns?: number }) => ReturnType;
      addColumnToRow: () => ReturnType;
    };
  }
}

export const LayoutRowExtension = Node.create({
  name: 'layoutRow',

  group: 'block',

  content: 'layoutColumn{1,3}',

  defining: true,

  isolating: true,

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-row-id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { 'data-row-id': attributes.id };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="layout-row"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-type': 'layout-row', class: 'layout-row' }, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      insertLayoutRow:
        attrs =>
        ({ commands }) => {
          const columns = attrs?.columns || 2;
          const columnNodes = Array.from({ length: columns }, () => ({
            type: 'layoutColumn',
            attrs: { width: 100 / columns },
            content: [{ type: 'paragraph' }],
          }));

          return commands.insertContent({
            type: this.name,
            content: columnNodes,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(LayoutRowView);
  },
});

export default LayoutRowExtension;
