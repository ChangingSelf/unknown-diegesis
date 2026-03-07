import React from 'react';

interface FileMenuProps {
  fileName?: string;
  isModified: boolean;
  onOpen?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onNew?: () => void;
  workspaceName?: string;
  onOpenWorkspace?: () => void;
  onCreateWorkspace?: () => void;
  onCloseWorkspace?: () => void;
}

export const FileMenu: React.FC<FileMenuProps> = ({
  fileName,
  isModified,
  onOpen,
  onSave,
  onSaveAs,
  onNew,
  workspaceName,
  onOpenWorkspace,
  onCreateWorkspace,
  onCloseWorkspace,
}) => {
  const isWorkspaceMode = !!workspaceName;

  return (
    <div className="file-menu flex items-center gap-4 px-6 py-3 bg-paper-100 border-b border-paper-300">
      <div className="file-name font-semibold text-charcoal-800 text-base">
        {isWorkspaceMode ? workspaceName : fileName}
        {isModified && <span className="text-gold-500 ml-1">*</span>}
      </div>

      <div className="menu-buttons flex gap-2">
        {isWorkspaceMode ? (
          <>
            <button onClick={onCreateWorkspace} className="btn-secondary">
              新建工作区
            </button>
            <button onClick={onOpenWorkspace} className="btn-secondary">
              打开工作区
            </button>
            <button onClick={onCloseWorkspace} className="btn-secondary">
              关闭工作区
            </button>
            <button onClick={onSave} className="btn-primary" disabled={!isModified}>
              保存章节
            </button>
          </>
        ) : (
          <>
            <button onClick={onNew} className="btn-secondary">
              新建
            </button>
            <button onClick={onOpen} className="btn-secondary">
              打开
            </button>
            <button onClick={onSave} className="btn-primary" disabled={!isModified}>
              保存
            </button>
            <button onClick={onSaveAs} className="btn-secondary">
              另存为
            </button>
          </>
        )}
      </div>
    </div>
  );
};
