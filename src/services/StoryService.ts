import { DocumentMeta } from '@/types/document';
import { BaseDocumentService } from './base/BaseDocumentService';
import { STORY_DIR } from '@/constants/paths';

/**
 * 故事文档服务
 * 负责故事文档的 CRUD 操作和文件夹管理
 */
export class StoryService extends BaseDocumentService<DocumentMeta> {
  protected getTypeDir(): string {
    return STORY_DIR;
  }

  protected getIndexType(): 'story' | 'materials' {
    return 'story';
  }

  protected getFilePrefix(): string {
    return '';
  }

  /**
   * 获取指定文件夹中的文档列表
   * @param workspacePath - 工作区路径
   * @param folder - 文件夹路径（可选，空字符串表示根文件夹）
   * @returns 文档元数据列表，按 order 排序
   */
  async getByFolder(workspacePath: string, folder?: string): Promise<DocumentMeta[]> {
    const documents = await this.getAll(workspacePath);
    const folderKey = folder ?? '';

    return documents.filter(doc => doc.folder === folderKey).sort((a, b) => a.order - b.order);
  }

  /**
   * 将文档移动到指定文件夹
   * @param workspacePath - 工作区路径
   * @param id - 文档 ID
   * @param folder - 目标文件夹路径（空字符串表示根文件夹）
   * @returns 操作是否成功
   */
  async moveToFolder(workspacePath: string, id: string, folder: string): Promise<boolean> {
    const document = await this.getById(workspacePath, id);
    if (!document) return false;

    return await this.updateMeta(workspacePath, id, { folder });
  }

  /**
   * 重新排序指定文件夹中的文档
   * @param workspacePath - 工作区路径
   * @param folder - 文件夹路径（空字符串表示根文件夹）
   * @param ids - 文档 ID 列表，按新顺序排列
   * @returns 操作是否成功
   */
  async reorderDocuments(workspacePath: string, folder: string, ids: string[]): Promise<boolean> {
    try {
      const documents = await this.getByFolder(workspacePath, folder);
      const idToDocument = new Map(documents.map(doc => [doc.id, doc]));

      for (let i = 0; i < ids.length; i++) {
        const document = idToDocument.get(ids[i]);
        if (document && document.order !== i) {
          const updated = await this.updateMeta(workspacePath, ids[i], { order: i });
          if (!updated) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to reorder documents:', error);
      return false;
    }
  }
}
