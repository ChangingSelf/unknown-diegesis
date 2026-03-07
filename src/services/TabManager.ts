import { Tab, TabState, TabType } from '../types';

function generateId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class TabManager {
  private state: TabState;
  private listeners: Set<(state: TabState) => void> = new Set();

  constructor() {
    this.state = {
      tabs: [],
      activeTabId: null,
    };
  }

  getState(): TabState {
    return { ...this.state, tabs: [...this.state.tabs] };
  }

  subscribe(listener: (state: TabState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  private updateState(updates: Partial<TabState>) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  openTab(type: TabType, resourceId: string, title: string, workspacePath?: string): Tab {
    const existingTab = this.state.tabs.find(
      tab => tab.resourceId === resourceId && tab.workspacePath === workspacePath
    );

    if (existingTab) {
      this.activateTab(existingTab.id);
      return existingTab;
    }

    const newTab: Tab = {
      id: generateId(),
      type,
      title,
      resourceId,
      isModified: false,
      isPinned: false,
      workspacePath,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };

    const tabs = [...this.state.tabs, newTab];
    this.updateState({ tabs, activeTabId: newTab.id });

    return newTab;
  }

  closeTab(tabId: string): boolean {
    const tabIndex = this.state.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return false;

    const tabs = this.state.tabs.filter(tab => tab.id !== tabId);

    let activeTabId = this.state.activeTabId;
    if (activeTabId === tabId) {
      if (tabs.length > 0) {
        const newIndex = Math.min(tabIndex, tabs.length - 1);
        activeTabId = tabs[newIndex].id;
      } else {
        activeTabId = null;
      }
    }

    this.updateState({ tabs, activeTabId });
    return true;
  }

  closeOtherTabs(tabId: string): boolean {
    const tab = this.state.tabs.find(t => t.id === tabId);
    if (!tab) return false;

    const tabs = this.state.tabs.filter(t => t.id === tabId || t.isPinned);

    this.updateState({ tabs, activeTabId: tabId });
    return true;
  }

  closeRightTabs(tabId: string): boolean {
    const tabIndex = this.state.tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return false;

    const tabs = this.state.tabs.slice(0, tabIndex + 1);

    let activeTabId = this.state.activeTabId;
    if (activeTabId && !tabs.find(t => t.id === activeTabId)) {
      activeTabId = tabId;
    }

    this.updateState({ tabs, activeTabId });
    return true;
  }

  closeAllTabs(): boolean {
    const tabs = this.state.tabs.filter(t => t.isPinned);
    this.updateState({ tabs, activeTabId: tabs.length > 0 ? tabs[0].id : null });
    return true;
  }

  activateTab(tabId: string): boolean {
    const tab = this.state.tabs.find(t => t.id === tabId);
    if (!tab) return false;

    tab.lastAccessedAt = new Date();
    this.updateState({ activeTabId: tabId });
    return true;
  }

  togglePin(tabId: string): boolean {
    const tab = this.state.tabs.find(t => t.id === tabId);
    if (!tab) return false;

    tab.isPinned = !tab.isPinned;

    const tabs = this.sortTabs([...this.state.tabs]);
    this.updateState({ tabs });

    return true;
  }

  reorderTabs(sourceId: string, targetId: string): boolean {
    const sourceIndex = this.state.tabs.findIndex(t => t.id === sourceId);
    const targetIndex = this.state.tabs.findIndex(t => t.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return false;

    const tabs = [...this.state.tabs];
    const [movedTab] = tabs.splice(sourceIndex, 1);
    tabs.splice(targetIndex, 0, movedTab);

    this.updateState({ tabs });
    return true;
  }

  updateTabModified(tabId: string, isModified: boolean): boolean {
    const tab = this.state.tabs.find(t => t.id === tabId);
    if (!tab) return false;

    tab.isModified = isModified;
    this.notify();
    return true;
  }

  updateTabTitle(tabId: string, title: string): boolean {
    const tab = this.state.tabs.find(t => t.id === tabId);
    if (!tab) return false;

    tab.title = title;
    this.notify();
    return true;
  }

  getActiveTab(): Tab | null {
    if (!this.state.activeTabId) return null;
    return this.state.tabs.find(t => t.id === this.state.activeTabId) || null;
  }

  getTab(tabId: string): Tab | null {
    return this.state.tabs.find(t => t.id === tabId) || null;
  }

  hasUnsavedTabs(): boolean {
    return this.state.tabs.some(tab => tab.isModified);
  }

  getUnsavedTabs(): Tab[] {
    return this.state.tabs.filter(tab => tab.isModified);
  }

  private sortTabs(tabs: Tab[]): Tab[] {
    const pinned = tabs.filter(t => t.isPinned);
    const unpinned = tabs.filter(t => !t.isPinned);
    return [...pinned, ...unpinned];
  }
}
