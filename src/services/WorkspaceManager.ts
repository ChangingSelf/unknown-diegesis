import { Workspace } from '../types/workspace';
import { Project } from '../types/project';
import { ChapterMeta } from '../types/chapter';
import { MaterialMeta } from '../types/material';
import { ProjectService } from './ProjectService';

export interface WorkspaceResult {
  workspace: Workspace | null;
  error?: string;
}

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
  async openWorkspace(): Promise<WorkspaceResult> {
    const api = window.electronAPI;
    if (!api?.workspaceOpen) {
      return { workspace: null, error: '无法访问文件系统' };
    }

    const result = await api.workspaceOpen();
    if (!result?.success || !result?.path) {
      return { workspace: null };
    }

    return this.openWorkspaceFromPath(result.path);
  }

  /**
   * 从指定路径打开工作区
   */
  async openWorkspaceFromPath(path: string): Promise<WorkspaceResult> {
    const validation = await this.validateWorkspace(path);
    if (!validation.valid) {
      return { workspace: null, error: validation.error };
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
      return { workspace: this.workspace };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      return { workspace: null, error: `打开工作区失败：${errorMessage}` };
    }
  }

  /**
   * 创建新工作区
   */
  async createWorkspace(name: string, basePath?: string): Promise<WorkspaceResult> {
    const api = window.electronAPI;
    if (!api?.workspaceCreate) {
      return { workspace: null, error: '无法访问文件系统' };
    }

    const path = basePath ?? '';
    const result = await api.workspaceCreate(path, name);

    if (!result?.success) {
      return { workspace: null, error: result?.error || '创建工作区失败' };
    }

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
   * 验证工作区有效性
   */
  private async validateWorkspace(path: string): Promise<{ valid: boolean; error?: string }> {
    const api = window.electronAPI;
    if (!api?.workspaceReadDir) {
      return { valid: false, error: '无法访问文件系统' };
    }

    try {
      const result = await api.workspaceReadDir(path);
      if (!result?.success) {
        return { valid: false, error: '文件夹不存在或无法访问' };
      }
      if (!result?.files) {
        return { valid: false, error: '文件夹为空' };
      }

      if (!result.files.includes('project.json')) {
        return { valid: false, error: '无效的工作区：缺少 project.json 文件' };
      }

      return { valid: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : '未知错误';
      return { valid: false, error: `验证工作区失败：${message}` };
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
    if (!api?.workspaceReadDir || !api?.workspaceReadFile) {
      return { chapters, materials };
    }

    try {
      const chaptersPath = `${path}/chapters`;
      const chaptersResult = await api.workspaceReadDir(chaptersPath);

      if (chaptersResult?.success && chaptersResult?.files) {
        const uuidFiles = chaptersResult.files.filter((f: string) => /^[a-f0-9]{12}\.ud$/.test(f));

        for (const file of uuidFiles) {
          const filePath = `chapters/${file}`;
          const fileResult = await api.workspaceReadFile(`${path}/${filePath}`);

          if (fileResult?.success && fileResult?.content) {
            try {
              const data = JSON.parse(fileResult.content);
              if (data?.meta) {
                chapters.push({
                  ...data.meta,
                  path: filePath,
                });
              }
            } catch {
              // 忽略解析失败的文件
            }
          }
        }

        chapters.sort((a, b) => a.number - b.number);
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
