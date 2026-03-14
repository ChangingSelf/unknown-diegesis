import { memo } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

type BlockType = 'paragraph' | 'heading' | 'bulletList' | 'orderedList' | 'taskList' | 'blockquote';

const BlockWrapperView = memo(({ node, selected }: NodeViewProps) => {
  const blockType = (node.attrs.blockType as BlockType) || 'paragraph';

  return (
    <NodeViewWrapper
      className={`block-wrapper group relative ${selected ? 'block-selected' : ''}`}
      data-block-id={node.attrs.id}
      data-block-type={blockType}
    >
      <div className="block-content pl-2">
        <NodeViewContent className="block-content-inner" />
      </div>
    </NodeViewWrapper>
  );
});

BlockWrapperView.displayName = 'BlockWrapperView';

export default BlockWrapperView;
