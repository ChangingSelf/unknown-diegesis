export interface RecentWorkspace {
  path: string;
  name: string;
  lastOpened: string;
}

const STORAGE_KEY = 'unknown-diegesis-recent-workspaces';
const MAX_RECENT = 10;

export class RecentWorkspacesService {
  private recentWorkspaces: RecentWorkspace[] = [];
  private listeners: Set<(workspaces: RecentWorkspace[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  addWorkspace(path: string, name: string): void {
    this.recentWorkspaces = this.recentWorkspaces.filter(ws => ws.path !== path);

    this.recentWorkspaces.unshift({
      path,
      name,
      lastOpened: new Date().toISOString(),
    });

    if (this.recentWorkspaces.length > MAX_RECENT) {
      this.recentWorkspaces = this.recentWorkspaces.slice(0, MAX_RECENT);
    }

    this.saveToStorage();
    this.notify();
  }

  removeWorkspace(path: string): void {
    this.recentWorkspaces = this.recentWorkspaces.filter(ws => ws.path !== path);
    this.saveToStorage();
    this.notify();
  }

  getRecentWorkspaces(): RecentWorkspace[] {
    return [...this.recentWorkspaces];
  }

  clearRecentWorkspaces(): void {
    this.recentWorkspaces = [];
    this.saveToStorage();
    this.notify();
  }

  subscribe(listener: (workspaces: RecentWorkspace[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.recentWorkspaces = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load recent workspaces from storage:', error);
      this.recentWorkspaces = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.recentWorkspaces));
    } catch (error) {
      console.error('Failed to save recent workspaces to storage:', error);
    }
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.getRecentWorkspaces()));
  }
}
