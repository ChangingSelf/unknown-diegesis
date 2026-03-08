import { Extension } from '@tiptap/core';

export interface EnterKeyExtensionOptions {
  onCreateNewBlock?: (position: 'before' | 'after' | 'split', content?: string) => void;
}

export const EnterKeyExtension = Extension.create<EnterKeyExtensionOptions>({
  name: 'enterKeyExtension',

  addOptions() {
    return {
      onCreateNewBlock: undefined,
    };
  },

  addKeyboardShortcuts() {
    return {
      'Shift-Enter': ({ editor }) => {
        return editor.commands.setHardBreak();
      },

      Enter: ({ editor }) => {
        const { onCreateNewBlock } = this.options;

        if (!onCreateNewBlock) {
          return false;
        }

        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        let isInListItem = false;
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'listItem' || node.type.name === 'taskItem') {
            isInListItem = true;
            break;
          }
        }
        if (isInListItem) {
          return false;
        }

        const currentNode = $from.parent;
        const textContent = currentNode.textContent;
        const cursorPos = $from.parentOffset;

        if (cursorPos === 0) {
          onCreateNewBlock('before');
          return true;
        } else if (cursorPos === textContent.length) {
          onCreateNewBlock('after');
          return true;
        } else {
          const contentAfterCursor = textContent.substring(cursorPos);
          onCreateNewBlock('split', contentAfterCursor);
          return true;
        }
      },
    };
  },
});
