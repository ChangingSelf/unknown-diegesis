export type TabType = 'chapter' | 'file';

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  resourceId: string;
  isModified: boolean;
  isPinned: boolean;
  workspacePath?: string;
  createdAt: Date;
  lastAccessedAt: Date;
}

export interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
}

export interface TabOperationResult {
  success: boolean;
  error?: string;
  tab?: Tab;
}

export type TabContextMenuAction =
  | 'close'
  | 'closeOthers'
  | 'closeRight'
  | 'closeAll'
  | 'pin'
  | 'unpin';
