import { Workspace } from '../types/workspace';
import { DocumentMeta, MaterialType } from '../types/document';
import { WorkspaceService, WorkspaceConfig } from './WorkspaceService';
import { STORY_DIR, MATERIALS_DIR } from '../constants/paths';
import { Project } from '../types/project';

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
  private workspaceService: WorkspaceService;

  constructor() {
    this.workspaceService = new WorkspaceService();
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
      const config = await this.workspaceService.loadWorkspace(path);
      if (!config) {
        return { workspace: null, error: '无法加载工作区配置' };
      }

      const project = this.convertConfigToProject(config);
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
   * 将 WorkspaceConfig 转换为 Project 格式
   * 保持与现有代码的兼容性
   */
  private convertConfigToProject(config: WorkspaceConfig): Project {
    return {
      schemaVersion: config.schemaVersion ?? 1,
      title: config.title,
      author: config.author || '',
      genre: config.genre,
      description: config.description,
      created: config.created,
      modified: config.modified,
      statistics: {
        wordCount: config.wordCount || 0,
        chapterCount: config.chapterCount || 0,
        characterCount: 0,
      },
      settings: config.settings || {
        autoSave: true,
        autoSaveInterval: 3000,
        defaultBlockType: 'paragraph',
      },
    } as Project;
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

      if (!result.files.includes('workspace.json')) {
        return { valid: false, error: '无效的工作区：缺少 workspace.json 文件' };
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
    chapters: DocumentMeta[];
    materials: DocumentMeta[];
  }> {
    const chapters: DocumentMeta[] = [];
    const materials: DocumentMeta[] = [];
    const api = window.electronAPI;
    if (!api?.workspaceReadDir || !api?.workspaceReadFile) {
      return { chapters, materials };
    }

    await this.scanStory(path, chapters);
    await this.scanMaterials(path, materials);

    return { chapters, materials };
  }

  private async scanStory(path: string, chapters: DocumentMeta[]): Promise<void> {
    const api = window.electronAPI;
    try {
      const storyPath = `${path}/${STORY_DIR}`;
      const storyResult = await api.workspaceReadDir(storyPath);

      if (storyResult?.success && storyResult?.files) {
        const storyFiles = storyResult.files.filter(
          (f: string) => f.endsWith('.ud') || /^\d{8}_\d{6}_[a-f0-9]{12}\.ud$/.test(f)
        );

        for (const file of storyFiles) {
          const filePath = `${STORY_DIR}/${file}`;
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
              // Skip invalid files
            }
          }
        }

        chapters.sort((a, b) => {
          const aOrder = a.order ?? a.number ?? 0;
          const bOrder = b.order ?? b.number ?? 0;
          return aOrder - bOrder;
        });
      }
    } catch (error) {
      console.error('Failed to scan story:', error);
    }
  }

  private async scanMaterials(path: string, materials: DocumentMeta[]): Promise<void> {
    const api = window.electronAPI;
    try {
      const materialsPath = `${path}/${MATERIALS_DIR}`;
      const materialsResult = await api.workspaceReadDir(materialsPath);

      if (materialsResult?.success && materialsResult?.files) {
        const subdirs = ['characters', 'locations', 'items', 'worldviews', 'outlines', 'notes'];

        for (const subdir of subdirs) {
          try {
            const subdirPath = `${materialsPath}/${subdir}`;
            const subdirResult = await api.workspaceReadDir(subdirPath);

            if (subdirResult?.success && subdirResult?.files) {
              const udFiles = subdirResult.files.filter((f: string) => f.endsWith('.ud'));
              const materialTypeMap: Record<string, MaterialType> = {
                characters: 'character',
                locations: 'location',
                items: 'item',
                worldviews: 'worldview',
                outlines: 'outline',
                notes: 'note',
              };
              for (const file of udFiles) {
                materials.push({
                  id: `material_${materials.length}_${file.replace('.ud', '')}`,
                  title: file.replace('.ud', ''),
                  category: 'material',
                  materialType: materialTypeMap[subdir],
                  path: `${MATERIALS_DIR}/${subdir}/${file}`,
                  order: materials.length,
                  wordCount: 0,
                  created: new Date().toISOString(),
                  modified: new Date().toISOString(),
                });
              }
            }
          } catch {
            // Skip invalid subdirectories
          }
        }
      }
    } catch (error) {
      console.error('Failed to scan materials:', error);
    }
  }
}
