import { Extension } from '@tiptap/core';

/**
 * 自定义 Enter 键扩展
 * 支持 Enter 创建新块，Shift+Enter 插入软换行
 */
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
      // Shift+Enter: 插入软换行
      'Shift-Enter': ({ editor }) => {
        return editor.commands.setHardBreak();
      },

      // Enter: 创建新块
      'Enter': ({ editor }) => {
        const { onCreateNewBlock } = this.options;
        
        if (!onCreateNewBlock) {
          // 如果没有提供回调，使用默认行为
          return false;
        }

        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // 获取当前节点的内容
        const currentNode = $from.parent;
        const textContent = currentNode.textContent;
        const cursorPos = $from.parentOffset;

        // 判断光标位置
        if (cursorPos === 0) {
          // 光标在块首，在当前块前插入新块
          onCreateNewBlock('before');
          return true;
        } else if (cursorPos === textContent.length) {
          // 光标在块尾，在当前块后插入新块
          onCreateNewBlock('after');
          return true;
        } else {
          // 光标在块中间，拆分块
          const contentAfterCursor = textContent.substring(cursorPos);
          onCreateNewBlock('split', contentAfterCursor);
          return true;
        }
      },
    };
  },
});
