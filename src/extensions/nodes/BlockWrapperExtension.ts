import { Node, mergeAttributes } from '@tiptap/core';
import { TextSelection, NodeSelection } from '@tiptap/pm/state';
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
    'paragraph | heading | bulletList | orderedList | taskList | blockquote | horizontalRule',

  defining: true,

  isolating: true,

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

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state, dispatch } = this.editor.view;
        const { selection } = state;
        const { $from } = selection;

        const blockWrapperNode = $from.node($from.depth - 1);
        if (blockWrapperNode?.type.name !== this.name) {
          return false;
        }

        const blockWrapperPos = $from.before($from.depth - 1);
        const currentParagraph = $from.parent;
        const parentContent = currentParagraph.content;
        const splitPos = $from.parentOffset;

        const blockWrapperIndex = $from.index($from.depth - 2);
        if (blockWrapperIndex === 0 && splitPos === 0) {
          return false;
        }

        const leftFragment = parentContent.cut(0, splitPos);
        const rightFragment = parentContent.cut(splitPos);

        const now = new Date().toISOString();
        const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const paragraphBefore = state.schema.nodes.paragraph.create(undefined, leftFragment);
        const paragraphAfter = state.schema.nodes.paragraph.create(undefined, rightFragment);

        const blockWrapperBefore = state.schema.nodes.blockWrapper.create(
          { id: generateId(), blockType: 'paragraph', created: now, modified: now },
          [paragraphBefore]
        );
        const blockWrapperAfter = state.schema.nodes.blockWrapper.create(
          { id: generateId(), blockType: 'paragraph', created: now, modified: now },
          [paragraphAfter]
        );

        const tr = state.tr;
        tr.delete(blockWrapperPos, blockWrapperPos + blockWrapperNode.nodeSize);
        tr.insert(blockWrapperPos, blockWrapperBefore);
        const afterPos = blockWrapperPos + blockWrapperBefore.nodeSize;
        tr.insert(afterPos, blockWrapperAfter);

        const newCursorPos = afterPos + 2;
        tr.setSelection(TextSelection.near(tr.doc.resolve(newCursorPos)));
        dispatch(tr);
        return true;
      },

      Backspace: () => {
        const { editor } = this;
        const { state, dispatch } = editor.view;
        const { selection } = state;

        if (selection instanceof NodeSelection && selection.node.type.name === this.name) {
          const nodePos = selection.from;
          if (nodePos <= 0) {
            return false;
          }

          const $before = state.doc.resolve(nodePos - 1);
          const nodeBefore = $before.nodeBefore;
          if (!nodeBefore) {
            return false;
          }

          const prevBlockEnd = nodePos - 1;
          const tr = state.tr.delete(nodePos, nodePos + selection.node.nodeSize);
          const newPos = Math.min(prevBlockEnd, tr.doc.content.size - 1);
          tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)));
          dispatch(tr);
          return true;
        }

        const { $from } = selection;

        if (!selection.empty || $from.parentOffset > 0) {
          return false;
        }

        let blockWrapperDepth = -1;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === this.name) {
            blockWrapperDepth = d;
            break;
          }
        }

        if (blockWrapperDepth === -1) {
          return false;
        }

        const blockWrapperIndex = $from.index(blockWrapperDepth - 1);
        if (blockWrapperIndex === 0) {
          return false;
        }

        const parent = $from.parent;
        const blockWrapperPos = $from.before(blockWrapperDepth);
        const blockWrapperNode = $from.node(blockWrapperDepth);
        const parentNode = $from.node(blockWrapperDepth - 1);
        const prevBlockWrapperIndex = blockWrapperIndex - 1;

        let prevBlockWrapperPos = 1;
        for (let i = 0; i < prevBlockWrapperIndex; i++) {
          prevBlockWrapperPos += parentNode.child(i).nodeSize;
        }

        const prevBlockWrapperNode = parentNode.child(prevBlockWrapperIndex);

        let prevParagraphEndPos = prevBlockWrapperPos + 1;
        for (let i = 0; i < prevBlockWrapperNode.childCount; i++) {
          const child = prevBlockWrapperNode.child(i);
          if (child.type.name === 'paragraph' || child.type.name === 'heading') {
            prevParagraphEndPos = prevBlockWrapperPos + 1 + child.content.size;
            break;
          }
          prevParagraphEndPos += child.nodeSize;
        }

        const tr = state.tr;

        if (prevParagraphEndPos < blockWrapperPos) {
          tr.delete(prevParagraphEndPos, blockWrapperPos);
        }

        tr.insert(prevParagraphEndPos, parent.content);

        const newPosAfterInsert = prevParagraphEndPos + parent.content.size;
        tr.delete(newPosAfterInsert, newPosAfterInsert + blockWrapperNode.nodeSize);

        tr.setSelection(TextSelection.near(tr.doc.resolve(prevParagraphEndPos)));
        dispatch(tr);
        return true;
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlockWrapperView);
  },
});

export default BlockWrapper;
