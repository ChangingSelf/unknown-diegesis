import React, { useState, useRef, useEffect } from 'react';

interface ColumnDividerProps {
  onResize: (delta: number) => void;
}

export const ColumnDivider: React.FC<ColumnDividerProps> = ({ onResize }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number>(0);
  const currentDeltaRef = useRef<number>(0);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      const deltaPercent = (deltaX / window.innerWidth) * 100;

      // 限制在合理范围内
      const clampedDelta = Math.max(-30, Math.min(30, deltaPercent));
      currentDeltaRef.current = clampedDelta;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (currentDeltaRef.current !== 0) {
        onResize(currentDeltaRef.current);
        currentDeltaRef.current = 0;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onResize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
  };

  return (
    <div
      className={`column-divider w-1.5 cursor-col-resize bg-paper-300 hover:bg-ink-400 transition-all duration-200 ${
        isDragging ? 'bg-ink-500 w-2' : ''
      }`}
      onMouseDown={handleMouseDown}
      style={{ minHeight: '100px' }}
    >
      <div className="h-full w-full" />
    </div>
  );
};
