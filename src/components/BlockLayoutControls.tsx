import React from 'react';

interface BlockLayoutControlsProps {
  onCreateSibling: () => void;
}

export const BlockLayoutControls: React.FC<BlockLayoutControlsProps> = ({
  onCreateSibling,
}) => {
  return (
    <div className="block-layout-controls flex gap-1 mt-1 opacity-0 hover:opacity-100 transition-opacity">
      <button
        onClick={onCreateSibling}
        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors"
        title="添加并列块"
      >
        + 并列块
      </button>
    </div>
  );
};
