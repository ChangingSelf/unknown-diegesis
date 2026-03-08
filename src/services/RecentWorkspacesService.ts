export interface RecentWorkspace {
  path: string;
  name: string;
  lastOpened: string;
}

const MAX_RECENT = 10;

export class RecentWorkspacesService {
  private recentWorkspaces: RecentWorkspace[] = [];
  private listeners: Set<(workspaces: RecentWorkspace[]) => void> = new Set();
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.loadFromStorage();
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initPromise;
    }
  }

  async addWorkspace(path: string, name: string): Promise<void> {
    await this.ensureInitialized();

    this.recentWorkspaces = this.recentWorkspaces.filter(ws => ws.path !== path);

    this.recentWorkspaces.unshift({
      path,
      name,
      lastOpened: new Date().toISOString(),
    });

    if (this.recentWorkspaces.length > MAX_RECENT) {
      this.recentWorkspaces = this.recentWorkspaces.slice(0, MAX_RECENT);
    }

    await this.saveToStorage();
    this.notify();
  }

  async removeWorkspace(path: string): Promise<void> {
    await this.ensureInitialized();

    this.recentWorkspaces = this.recentWorkspaces.filter(ws => ws.path !== path);
    await this.saveToStorage();
    this.notify();
  }

  async getRecentWorkspaces(): Promise<RecentWorkspace[]> {
    await this.ensureInitialized();
    return [...this.recentWorkspaces];
  }

  getRecentWorkspacesSync(): RecentWorkspace[] {
    return [...this.recentWorkspaces];
  }

  async clearRecentWorkspaces(): Promise<void> {
    await this.ensureInitialized();

    this.recentWorkspaces = [];
    await this.saveToStorage();
    this.notify();
  }

  subscribe(listener: (workspaces: RecentWorkspace[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async loadFromStorage(): Promise<void> {
    const api = window.electronAPI;
    if (!api?.configGetRecentWorkspaces) {
      this.recentWorkspaces = [];
      this.initialized = true;
      return;
    }

    try {
      const result = await api.configGetRecentWorkspaces();
      if (result?.success && Array.isArray(result.data)) {
        this.recentWorkspaces = result.data as RecentWorkspace[];
      }
    } catch (error) {
      console.error('Failed to load recent workspaces from storage:', error);
      this.recentWorkspaces = [];
    }

    this.initialized = true;
  }

  private async saveToStorage(): Promise<void> {
    const api = window.electronAPI;
    if (!api?.configSaveRecentWorkspaces) return;

    try {
      await api.configSaveRecentWorkspaces(this.recentWorkspaces);
    } catch (error) {
      console.error('Failed to save recent workspaces to storage:', error);
    }
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.getRecentWorkspacesSync()));
  }
}
