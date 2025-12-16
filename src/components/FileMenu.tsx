import React from 'react';
import { SaveStatus } from '../types/block';

interface FileMenuProps {
  fileName: string;
  isModified: boolean;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onNew: () => void;
}

export const FileMenu: React.FC<FileMenuProps> = ({
  fileName,
  isModified,
  onOpen,
  onSave,
  onSaveAs,
  onNew,
}) => {
  return (
    <div className="file-menu flex items-center gap-4 px-4 py-2 bg-gray-100 border-b border-gray-200">
      <div className="file-name font-medium text-gray-700">
        {fileName}{isModified && ' *'}
      </div>
      
      <div className="menu-buttons flex gap-2">
        <button
          onClick={onNew}
          className="px-3 py-1 text-sm bg-white hover:bg-gray-50 border border-gray-300 rounded transition-colors"
        >
          新建
        </button>
        <button
          onClick={onOpen}
          className="px-3 py-1 text-sm bg-white hover:bg-gray-50 border border-gray-300 rounded transition-colors"
        >
          打开
        </button>
        <button
          onClick={onSave}
          className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          disabled={!isModified}
        >
          保存
        </button>
        <button
          onClick={onSaveAs}
          className="px-3 py-1 text-sm bg-white hover:bg-gray-50 border border-gray-300 rounded transition-colors"
        >
          另存为
        </button>
      </div>
    </div>
  );
};
