import { ChapterMeta } from '../types/chapter';
import { Block, LayoutRow } from '../types/block';

/**
 * 章节数据（从 .ud 文件加载）
 */
export interface ChapterData {
  version: string;
  type: 'chapter';
  meta: ChapterMeta;
  blocks: Block[];
  layoutRows: LayoutRow[];
}

/**
 * 章节管理服务
 * 负责章节的 CRUD 操作
 */
export class ChapterService {
  /**
   * 获取章节列表
   */
  async getChapters(workspacePath: string): Promise<ChapterMeta[]> {
    const api = window.electronAPI;
    if (!api?.workspaceReadDir || !api?.workspaceReadFile) {
      return [];
    }

    const chapters: ChapterMeta[] = [];

    try {
      const chaptersPath = `${workspacePath}/chapters`;
      const result = await api.workspaceReadDir(chaptersPath);

      if (result?.success && result?.files) {
        const uuidFiles = result.files.filter((f: string) => /^[a-f0-9]{12}\.ud$/.test(f));

        for (const file of uuidFiles) {
          const filePath = `chapters/${file}`;
          const fileResult = await api.workspaceReadFile(`${workspacePath}/${filePath}`);

          if (fileResult?.success && fileResult?.content) {
            try {
              const data = JSON.parse(fileResult.content);
              if (data?.meta) {
                chapters.push({
                  ...data.meta,
                  path: filePath,
                });
                continue;
              }
            } catch {
              // 忽略解析失败的文件
            }
          }
        }

        chapters.sort((a, b) => a.number - b.number);
      }
    } catch (error) {
      console.error('Failed to get chapters:', error);
    }

    return chapters;
  }

  /**
   * 创建新章节
   */
  async createChapter(workspacePath: string, title?: string): Promise<ChapterMeta | null> {
    const api = window.electronAPI;
    if (!api?.workspaceWriteFile) {
      console.error('workspaceWriteFile API not available');
      return null;
    }

    try {
      const chapters = await this.getChapters(workspacePath);
      const nextNumber = this.getNextChapterNumber(chapters);
      const uuid = this.generateUUID();
      const fileName = `${uuid}.ud`;
      const filePath = `${workspacePath}/chapters/${fileName}`;

      const chapterData: ChapterData = {
        version: '1.0',
        type: 'chapter',
        meta: {
          id: uuid,
          number: nextNumber,
          title: title || `第${nextNumber}章`,
          path: `chapters/${fileName}`,
          status: 'draft',
          wordCount: 0,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
        blocks: [],
        layoutRows: [],
      };

      const content = JSON.stringify(chapterData, null, 2);
      const result = await api.workspaceWriteFile(filePath, content);

      if (result?.success) {
        return chapterData.meta;
      }

      return null;
    } catch (error) {
      console.error('Failed to create chapter:', error);
      return null;
    }
  }

  /**
   * 删除章节
   */
  async deleteChapter(workspacePath: string, chapterPath: string): Promise<boolean> {
    const api = window.electronAPI;
    if (!api?.workspaceDelete) {
      console.error('workspaceDelete API not available');
      return false;
    }

    try {
      const fullPath = `${workspacePath}/${chapterPath}`;
      const result = await api.workspaceDelete(fullPath);
      return result?.success ?? false;
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      return false;
    }
  }

  /**
   * 加载章节内容
   */
  async loadChapter(workspacePath: string, chapterPath: string): Promise<ChapterData | null> {
    const api = window.electronAPI;
    if (!api?.workspaceReadFile) {
      console.error('workspaceReadFile API not available');
      return null;
    }

    try {
      const fullPath = `${workspacePath}/${chapterPath}`;
      const result = await api.workspaceReadFile(fullPath);

      if (result?.success && result?.content) {
        const data = JSON.parse(result.content);
        return {
          version: data.version || '1.0',
          type: 'chapter',
          meta: data.meta,
          blocks: data.blocks || [],
          layoutRows: data.layoutRows || [],
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to load chapter:', error);
      return null;
    }
  }

  /**
   * 保存章节
   */
  async saveChapter(
    workspacePath: string,
    chapterPath: string,
    data: Omit<ChapterData, 'version' | 'type'>
  ): Promise<boolean> {
    const api = window.electronAPI;
    if (!api?.workspaceWriteFile) {
      console.error('workspaceWriteFile API not available');
      return false;
    }

    try {
      const fullPath = `${workspacePath}/${chapterPath}`;
      const chapterData: ChapterData = {
        version: '1.0',
        type: 'chapter',
        ...data,
        meta: {
          ...data.meta,
          modified: new Date().toISOString(),
        },
      };

      const content = JSON.stringify(chapterData, null, 2);
      const result = await api.workspaceWriteFile(fullPath, content);
      return result?.success ?? false;
    } catch (error) {
      console.error('Failed to save chapter:', error);
      return false;
    }
  }

  /**
   * 更新章节元数据
   */
  async updateChapterMeta(
    workspacePath: string,
    chapterPath: string,
    meta: Partial<ChapterMeta>
  ): Promise<boolean> {
    const chapter = await this.loadChapter(workspacePath, chapterPath);
    if (!chapter) return false;

    return this.saveChapter(workspacePath, chapterPath, {
      meta: { ...chapter.meta, ...meta },
      blocks: chapter.blocks,
      layoutRows: chapter.layoutRows,
    });
  }

  /**
   * 重排序章节
   */
  async reorderChapters(workspacePath: string, chapterIds: string[]): Promise<boolean> {
    try {
      const chapters = await this.getChapters(workspacePath);
      const idToChapter = new Map(chapters.map(ch => [ch.id, ch]));

      for (let i = 0; i < chapterIds.length; i++) {
        const chapter = idToChapter.get(chapterIds[i]);
        if (chapter) {
          const newNumber = i + 1;
          if (chapter.number !== newNumber) {
            await this.updateChapterMeta(workspacePath, chapter.path, { number: newNumber });
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to reorder chapters:', error);
      return false;
    }
  }

  /**
   * 生成下一个章节编号
   */
  private getNextChapterNumber(chapters: ChapterMeta[]): number {
    if (chapters.length === 0) return 1;
    const maxNumber = Math.max(...chapters.map(ch => ch.number));
    return maxNumber + 1;
  }

  /**
   * 生成12位UUID
   */
  private generateUUID(): string {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  }
}
