import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import LayoutColumnView from '@/components/LayoutColumnView';

export const LayoutColumnExtension = Node.create({
  name: 'layoutColumn',

  group: 'layoutColumn',

  content: '(blockWrapper | diceBlock | imageBlock)+',

  defining: true,

  isolating: true,

  draggable: false,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-column-id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { 'data-column-id': attributes.id };
        },
      },
      width: {
        default: 50,
        parseHTML: element => {
          const width = element.getAttribute('data-width');
          return width ? parseFloat(width) : 50;
        },
        renderHTML: attributes => {
          return { 'data-width': String(attributes.width) };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="layout-column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes({ 'data-type': 'layout-column', class: 'layout-column' }, HTMLAttributes),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LayoutColumnView);
  },
});

export default LayoutColumnExtension;
