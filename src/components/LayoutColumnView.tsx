import { memo, useCallback, useRef, useState } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

const LayoutColumnView = memo(({ node, updateAttributes }: NodeViewProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(node.attrs.width || 50);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = node.attrs.width || 50;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startXRef.current;
        const containerWidth = (e.target as HTMLElement).parentElement?.offsetWidth || 800;
        const deltaPercent = (deltaX / containerWidth) * 100;
        const newWidth = Math.max(20, Math.min(80, startWidthRef.current + deltaPercent));
        updateAttributes({ width: Math.round(newWidth * 10) / 10 });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [node.attrs.width, updateAttributes]
  );

  const width = node.attrs.width || 50;

  return (
    <NodeViewWrapper
      className="layout-column relative"
      data-type="layout-column"
      style={{ width: `${width}%`, flexShrink: 0 }}
    >
      <div className="column-content min-h-[50px]">
        <NodeViewContent className="column-inner" />
      </div>

      <div
        className={`column-resize-handle absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-gray-300 hover:bg-blue-500 transition-colors ${isResizing ? 'bg-blue-600' : ''}`}
        onMouseDown={handleMouseDown}
        contentEditable={false}
      />
    </NodeViewWrapper>
  );
});

LayoutColumnView.displayName = 'LayoutColumnView';

export default LayoutColumnView;
