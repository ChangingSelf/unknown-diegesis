import React from 'react';
// Local TopBar implementation with three view modes.

export type ViewMode = 'welcome' | 'workspace' | 'single-file';

export interface TopBarProps {
  viewMode: ViewMode;
  title?: string; // 文件名或工作区名
  isModified: boolean;
  saveStatus: 'saving' | 'saved' | 'error' | 'modified' | 'idle';
  lastSavedTime?: Date | null;
  // 回调
  onSave?: () => void;
  onOpen?: () => void;
  onNew?: () => void;
  onCloseWorkspace?: () => void;
}

// Local SaveStatusIndicator - minimal, self-contained to avoid external deps
const SaveStatusIndicator: React.FC<{
  status: TopBarProps['saveStatus'];
  isModified?: boolean;
  lastSavedTime?: Date | null;
}> = ({ status, isModified, lastSavedTime }) => {
  const renderIcon = () => {
    switch (status) {
      case 'saving':
        return (
          <span
            className="inline-flex items-center justify-center w-4 h-4 mr-1"
            aria-label="saving"
          >
            <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
          </span>
        );
      case 'saved':
        return (
          <span className="mr-1" aria-label="saved">
            ✔
          </span>
        );
      case 'error':
        return (
          <span className="mr-1" aria-label="error">
            !
          </span>
        );
      case 'modified':
        return (
          <span className="mr-1" aria-label="modified">
            •
          </span>
        );
      default:
        return null;
    }
  };
  const timeText = lastSavedTime ? ` at ${lastSavedTime.toLocaleTimeString()}` : '';
  let label = '';
  switch (status) {
    case 'saving':
      label = 'Saving...';
      break;
    case 'saved':
      label = 'Saved';
      if (timeText) label += timeText;
      break;
    case 'error':
      label = 'Save error';
      break;
    case 'modified':
      label = isModified ? 'Modified' : 'Idle';
      break;
    default:
      label = 'Idle';
  }
  return (
    <span
      className="flex items-center text-sm text-charcoal bg-paper border border-gray-200 rounded px-2 py-1 select-none"
      aria-label="save-status"
    >
      {renderIcon()}
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
};

export const TopBar: React.FC<TopBarProps> = ({
  viewMode,
  title,
  isModified,
  saveStatus,
  lastSavedTime,
  onSave,
  onOpen,
  onNew,
  onCloseWorkspace,
}) => {
  // Center title: show current file or workspace name when provided
  const centerTitle =
    title ??
    (viewMode === 'welcome' ? 'Welcome' : viewMode === 'workspace' ? 'Workspace' : 'Untitled');

  // Actions per mode
  const renderActions = () => {
    if (viewMode === 'welcome') {
      return (
        <>
          {onNew && (
            <button className="btn btn-secondary" onClick={onNew} aria-label="new">
              New
            </button>
          )}
          {onOpen && (
            <button className="btn btn-secondary" onClick={onOpen} aria-label="open">
              Open
            </button>
          )}
        </>
      );
    }

    // For workspace mode, provide common actions plus Save on the right side
    if (viewMode === 'workspace') {
      return (
        <>
          {onSave && (
            <button className="btn btn-primary" onClick={onSave} aria-label="save">
              Save
            </button>
          )}
          {onNew && (
            <button className="btn btn-secondary" onClick={onNew} aria-label="new-file">
              New
            </button>
          )}
          {onOpen && (
            <button className="btn btn-secondary" onClick={onOpen} aria-label="open-file">
              Open
            </button>
          )}
          {onCloseWorkspace && (
            <button
              className="btn btn-secondary"
              onClick={onCloseWorkspace}
              aria-label="close-workspace"
            >
              Close Workspace
            </button>
          )}
        </>
      );
    }

    // single-file mode
    if (viewMode === 'single-file') {
      return (
        <>
          {onNew && (
            <button className="btn btn-secondary" onClick={onNew} aria-label="new-file">
              New
            </button>
          )}
          {onCloseWorkspace && (
            <button
              className="btn btn-secondary"
              onClick={onCloseWorkspace}
              aria-label="close-file"
            >
              Close
            </button>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <header className="w-full h-12 bg-paper border-b border-gray-200 flex items-center px-4">
      {/* Left: Logo / Title */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded bg-white/20 text-charcoal"
          aria-label="logo"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3l9 4-9 4-9-4 9-4z" />
            <path d="M3 11l9 4 9-4" />
            <path d="M12 15l0 6" />
          </svg>
        </span>
        <span className="text-lg font-semibold text-charcoal select-none">未知叙事</span>
      </div>

      {/* Center: current title / file or workspace name */}
      <div className="flex-1 text-center text-sm text-charcoal select-none mx-4">{centerTitle}</div>

      {/* Right: save status + actions */}
      <div className="flex items-center gap-2">
        <SaveStatusIndicator
          status={saveStatus}
          isModified={isModified}
          lastSavedTime={lastSavedTime ?? null}
        />
        {renderActions()}
      </div>
    </header>
  );
};

export default TopBar;
