import { Project, ProjectStatistics, ProjectSettings } from '../types/project';
import { ChapterMeta } from '../types/chapter';

/**
 * 项目元数据服务
 * 负责项目配置文件的读写
 */
export class ProjectService {
  private static readonly PROJECT_FILE = 'project.json';
  private static readonly DEFAULT_STATISTICS: ProjectStatistics = {
    wordCount: 0,
    chapterCount: 0,
    characterCount: 0,
  };
  private static readonly DEFAULT_SETTINGS: ProjectSettings = {
    autoSave: true,
    autoSaveInterval: 3000,
    defaultBlockType: 'paragraph',
  };

  /**
   * 获取项目文件路径
   */
  getProjectPath(workspacePath: string): string {
    // 使用简单字符串拼接，兼容浏览器环境
    const separator = workspacePath.includes('/') ? '/' : '\\';
    return `${workspacePath}${separator}${ProjectService.PROJECT_FILE}`;
  }

  /**
   * 加载项目元数据
   */
  async loadProject(workspacePath: string): Promise<Project> {
    const projectPath = this.getProjectPath(workspacePath);
    try {
      // 尝试通过 IPC 读取文件内容（若 IPC 暴露了读取方法）
      const electronApi = typeof window !== 'undefined' ? window.electronAPI : null;
      const readFile: ((path: string) => Promise<string | null>) | undefined = (
        electronApi as Record<string, unknown>
      )?.readFile as ((path: string) => Promise<string | null>) | undefined;
      if (typeof readFile === 'function') {
        const content = await readFile(projectPath);
        if (typeof content === 'string') {
          const parsed = JSON.parse(content) as Partial<Project>;
          return {
            ...this.createDefaultProject('未命名项目'),
            ...parsed,
          } as Project;
        }
      }
      // 回退：尝试打开文件并解析返回内容
      const openFn: (() => Promise<string | object | null>) | undefined = electronApi?.fileOpen as
        | (() => Promise<string | object | null>)
        | undefined;
      if (typeof openFn === 'function') {
        const result = await openFn();
        if (typeof result === 'string') {
          const parsed = JSON.parse(result) as Partial<Project>;
          return { ...this.createDefaultProject('未命名项目'), ...parsed } as Project;
        } else if (result && typeof result === 'object') {
          return {
            ...this.createDefaultProject('未命名项目'),
            ...(result as Record<string, unknown>),
          } as Project;
        }
      }
      // 最终兜底
      return this.createDefaultProject('未命名项目');
    } catch (error) {
      console.error('Failed to load project:', error);
      return this.createDefaultProject('未命名项目');
    }
  }

  /**
   * 保存项目元数据
   */
  async saveProject(workspacePath: string, project: Project): Promise<boolean> {
    const projectPath = this.getProjectPath(workspacePath);
    try {
      const content = JSON.stringify(project, null, 2);
      const electronApi = typeof window !== 'undefined' ? window.electronAPI : null;
      const writeFile: ((path: string, data: string) => Promise<boolean>) | undefined = (
        electronApi as Record<string, unknown>
      )?.writeFile as ((path: string, data: string) => Promise<boolean>) | undefined;
      if (typeof writeFile === 'function') {
        const ok = await writeFile(projectPath, content);
        return !!ok;
      }
      const fileSave: ((path: string, data: string) => Promise<boolean>) | undefined = (
        electronApi as Record<string, unknown>
      )?.fileSave as ((path: string, data: string) => Promise<boolean>) | undefined;
      if (typeof fileSave === 'function') {
        const ok = await fileSave(projectPath, content);
        return !!ok;
      }
      console.warn('ProjectService.saveProject requires workspace IPC extension');
      return false;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  }

  /**
   * 创建新项目
   */
  async createProject(workspacePath: string, title: string, author?: string): Promise<Project> {
    const project = this.createDefaultProject(title, author);
    // 尝试保存新创建的项目文件
    try {
      await this.saveProject(workspacePath, project);
    } catch {
      // 忽略保存失败，返回默认对象
    }
    return project;
  }

  /**
   * 更新统计信息
   */
  updateStatistics(project: Project, chapters: ChapterMeta[]): Project {
    const wordCount = chapters.reduce((sum, ch) => sum + (ch.wordCount ?? 0), 0);
    const characterCount = chapters.length;
    const chapterCount = chapters.length;
    return {
      ...project,
      statistics: {
        ...project.statistics,
        wordCount,
        chapterCount,
        characterCount,
      },
      modified: new Date().toISOString(),
    };
  }

  /**
   * 创建默认项目
   */
  private createDefaultProject(title: string, author?: string): Project {
    const now = new Date().toISOString();
    return {
      version: '1.0',
      title,
      author: author || '',
      created: now,
      modified: now,
      statistics: { ...ProjectService.DEFAULT_STATISTICS },
      settings: { ...ProjectService.DEFAULT_SETTINGS },
    } as Project;
  }
}
