import React from 'react';

interface BlockLayoutControlsProps {
  onCreateSibling: () => void;
}

export const BlockLayoutControls: React.FC<BlockLayoutControlsProps> = ({ onCreateSibling }) => {
  return (
    <div className="block-layout-controls flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <button
        onClick={onCreateSibling}
        className="px-3 py-1.5 text-xs bg-paper-200 hover:bg-ink-100 rounded-md text-charcoal-600 hover:text-ink-700 transition-all duration-200 font-medium border border-transparent hover:border-ink-200"
        title="添加并列块"
      >
        + 并列块
      </button>
    </div>
  );
};
