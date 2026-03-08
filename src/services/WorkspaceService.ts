import { ProjectSettings } from '../types/project';
import { WorkspaceMeta } from '@/types/document';

export const WORKSPACE_FILE = 'workspace.json';
export const WORKSPACE_VERSION = '2.0';

export interface WorkspaceConfig extends WorkspaceMeta {
  settings?: ProjectSettings;
}

export class WorkspaceService {
  private static readonly DEFAULT_SETTINGS: ProjectSettings = {
    autoSave: true,
    autoSaveInterval: 3000,
    defaultBlockType: 'paragraph',
  };

  getWorkspacePath(workspacePath: string): string {
    const separator = workspacePath.includes('/') ? '/' : '\\';
    return `${workspacePath}${separator}${WORKSPACE_FILE}`;
  }

  async loadWorkspace(workspacePath: string): Promise<WorkspaceConfig | null> {
    const api = window.electronAPI;
    if (!api?.workspaceReadFile) return null;

    try {
      const filePath = this.getWorkspacePath(workspacePath);
      const result = await api.workspaceReadFile(filePath);

      if (result?.success && result?.content) {
        const data = JSON.parse(result.content);
        return {
          ...data,
          settings: data.settings || WorkspaceService.DEFAULT_SETTINGS,
        };
      }
    } catch {
      // File doesn't exist or parse error
    }

    return null;
  }

  async saveWorkspace(workspacePath: string, config: WorkspaceConfig): Promise<boolean> {
    const api = window.electronAPI;
    if (!api?.workspaceWriteFile) {
      console.warn('WorkspaceService.saveWorkspace requires workspaceWriteFile');
      return false;
    }

    try {
      const filePath = this.getWorkspacePath(workspacePath);
      const content = JSON.stringify(config, null, 2);
      const result = await api.workspaceWriteFile(filePath, content);
      return result?.success ?? false;
    } catch (error) {
      console.error('Failed to save workspace:', error);
      return false;
    }
  }

  createDefaultWorkspace(title: string, author?: string): WorkspaceConfig {
    const now = new Date().toISOString();
    return {
      version: WORKSPACE_VERSION,
      id: crypto.randomUUID().replace(/-/g, '').slice(0, 12),
      title,
      author: author || '',
      wordCount: 0,
      chapterCount: 0,
      created: now,
      modified: now,
      settings: WorkspaceService.DEFAULT_SETTINGS,
    };
  }
}
