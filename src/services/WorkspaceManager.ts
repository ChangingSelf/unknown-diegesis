import { Workspace } from '../types/workspace';
import { Project } from '../types/project';
import { ChapterMeta } from '../types/chapter';
import { MaterialMeta } from '../types/material';
import { ProjectService } from './ProjectService';

/**
 * 工作区管理器
 * 负责工作区的打开、创建、关闭和状态管理
 */
export class WorkspaceManager {
  private workspace: Workspace | null = null;
  private listeners: Set<(workspace: Workspace | null) => void> = new Set();
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  /**
   * 打开工作区（弹出选择对话框）
   */
  async openWorkspace(): Promise<Workspace | null> {
    const api = window.electronAPI;
    if (!api?.workspaceOpen) {
      console.error('workspaceOpen API not available');
      return null;
    }

    const result = await api.workspaceOpen();
    if (!result?.success || !result?.path) {
      return null;
    }

    return this.openWorkspaceFromPath(result.path);
  }

  /**
   * 从指定路径打开工作区
   */
  async openWorkspaceFromPath(path: string): Promise<Workspace | null> {
    if (!(await this.isValidWorkspace(path))) {
      console.error('Invalid workspace:', path);
      return null;
    }

    try {
      const project: Project = await this.projectService.loadProject(path);
      const { chapters, materials } = await this.scanWorkspace(path);

      this.workspace = {
        path,
        name: project.title,
        project,
        chapters,
        materials,
      };

      this.notify();
      return this.workspace;
    } catch (error) {
      console.error('Failed to open workspace:', error);
      return null;
    }
  }

  /**
   * 创建新工作区
   */
  async createWorkspace(name: string, basePath?: string): Promise<Workspace | null> {
    const api = window.electronAPI;
    if (!api?.workspaceCreate) {
      console.error('workspaceCreate API not available');
      return null;
    }

    const path = basePath ?? '';
    const result = await api.workspaceCreate(path, name);

    if (!result?.success) {
      console.error('Failed to create workspace:', result?.error);
      return null;
    }

    // Open the newly created workspace
    return this.openWorkspaceFromPath(path || name);
  }

  /**
   * 获取当前工作区
   */
  getWorkspace(): Workspace | null {
    return this.workspace;
  }

  /**
   * 订阅工作区变化
   */
  subscribe(listener: (workspace: Workspace | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知状态变化
   */
  private notify(): void {
    this.listeners.forEach(listener => listener(this.workspace));
  }

  /**
   * 刷新工作区（重新扫描文件）
   */
  async refreshWorkspace(): Promise<void> {
    if (!this.workspace) return;

    const { chapters, materials } = await this.scanWorkspace(this.workspace.path);
    this.workspace = {
      ...this.workspace,
      chapters,
      materials,
    };

    this.notify();
  }

  /**
   * 关闭工作区
   */
  closeWorkspace(): void {
    this.workspace = null;
    this.notify();
  }

  /**
   * 检测是否为有效工作区
   */
  private async isValidWorkspace(path: string): Promise<boolean> {
    const api = window.electronAPI;
    if (!api?.workspaceReadDir) {
      return false;
    }

    try {
      const result = await api.workspaceReadDir(path);
      if (!result?.success || !result?.files) {
        return false;
      }

      // 一个简单的有效性判断：目录中包含 project.json
      return result.files.includes('project.json');
    } catch {
      return false;
    }
  }

  /**
   * 扫描工作区内容
   */
  private async scanWorkspace(path: string): Promise<{
    chapters: ChapterMeta[];
    materials: MaterialMeta[];
  }> {
    const chapters: ChapterMeta[] = [];
    const materials: MaterialMeta[] = [];
    const api = window.electronAPI;
    if (!api?.workspaceReadDir) {
      return { chapters, materials };
    }

    try {
      const chaptersPath = `${path}/chapters`;
      const chaptersResult = await api.workspaceReadDir(chaptersPath);

      if (chaptersResult?.success && chaptersResult?.files) {
        const udFiles = chaptersResult.files.filter((f: string) => f.endsWith('.ud'));
        for (let i = 0; i < udFiles.length; i++) {
          const file = udFiles[i];
          chapters.push({
            id: `chapter_${i}`,
            number: i + 1,
            title: file.replace('.ud', ''),
            path: `chapters/${file}`,
            status: 'draft',
            wordCount: 0,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
          } as ChapterMeta);
        }
      }
    } catch (error) {
      console.error('Failed to scan chapters:', error);
    }

    try {
      const workspacePath = `${path}/workspace`;
      const workspaceResult = await api.workspaceReadDir(workspacePath);

      if (workspaceResult?.success && workspaceResult?.files) {
        for (const typeDir of ['characters', 'locations', 'items', 'notes']) {
          try {
            const typePath = `${workspacePath}/${typeDir}`;
            const typeResult = await api.workspaceReadDir(typePath);

            if (typeResult?.success && typeResult?.files) {
              const typeFiles = typeResult.files.filter((f: string) => f.endsWith('.ud'));
              const materialTypeMap: Record<string, string> = {
                characters: 'character',
                locations: 'location',
                items: 'item',
                notes: 'note',
              };
              for (const file of typeFiles) {
                materials.push({
                  id: `material_${materials.length}`,
                  name: file.replace('.ud', ''),
                  type: materialTypeMap[typeDir] as 'character' | 'location' | 'item' | 'note',
                  path: `workspace/${typeDir}/${file}`,
                  created: new Date().toISOString(),
                  modified: new Date().toISOString(),
                } as MaterialMeta);
              }
            }
          } catch {
            // 目录可能不存在，跳过
          }
        }
      }
    } catch (error) {
      console.error('Failed to scan materials:', error);
    }

    return { chapters, materials };
  }
}
