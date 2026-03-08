import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import DiceBlockView from '@/components/DiceBlockView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    diceBlock: {
      insertDiceBlock: (attrs?: { formula?: string }) => ReturnType;
    };
  }
}

export const DiceBlockExtension = Node.create({
  name: 'diceBlock',

  group: 'block',

  atom: true,

  draggable: true,

  selectable: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-dice-id'),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { 'data-dice-id': attributes.id };
        },
      },
      formula: {
        default: '1d20',
        parseHTML: element => element.getAttribute('data-formula') || '1d20',
        renderHTML: attributes => {
          return { 'data-formula': attributes.formula };
        },
      },
      result: {
        default: null,
        parseHTML: element => {
          const result = element.getAttribute('data-result');
          return result ? parseInt(result, 10) : null;
        },
        renderHTML: attributes => {
          if (attributes.result === null || attributes.result === undefined) return {};
          return { 'data-result': String(attributes.result) };
        },
      },
      rolledAt: {
        default: null,
        parseHTML: element => element.getAttribute('data-rolled-at'),
        renderHTML: attributes => {
          if (!attributes.rolledAt) return {};
          return { 'data-rolled-at': attributes.rolledAt };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="dice-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'dice-block' }, HTMLAttributes)];
  },

  addCommands() {
    return {
      insertDiceBlock:
        attrs =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              formula: attrs?.formula || '1d20',
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(DiceBlockView);
  },
});

export default DiceBlockExtension;
