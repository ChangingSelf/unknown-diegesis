import { DocumentMeta, MaterialType } from '@/types/document';
import { Block, LayoutRow } from '@/types/block';
import { BaseDocumentService } from '@/services/base/BaseDocumentService';
import { generateDocumentFileName } from '@/utils/FileNaming';

export interface MaterialData {
  version: string;
  type: MaterialType;
  meta: DocumentMeta;
  blocks: Block[];
  layoutRows: LayoutRow[];
}

/**
 * MaterialService for managing materials in workspace
 * Extends BaseDocumentService to use common document operations
 */
export class MaterialService extends BaseDocumentService<DocumentMeta> {
  /**
   * Returns materials directory
   */
  protected getTypeDir(): string {
    return 'materials';
  }

  /**
   * Returns materials index type
   */
  protected getIndexType(): 'materials' {
    return 'materials';
  }

  /**
   * Generates a filename with material type prefix
   */
  protected generateFileName(type?: MaterialType): string {
    return generateDocumentFileName(type);
  }

  /**
   * Gets materials by type using the index
   */
  async getByType(workspacePath: string, type: MaterialType): Promise<DocumentMeta[]> {
    const index = await this.indexManager.loadMaterialsIndex(workspacePath);

    if (type === 'timeline') {
      const timelineId = Object.keys(index.documents).find(
        id => index.documents[id].materialType === 'timeline'
      );
      if (timelineId) {
        return [index.documents[timelineId]];
      }
      return [];
    }

    const typeIds = index.byType[type] || [];
    return typeIds.map(id => index.documents[id]).filter(Boolean);
  }

  /**
   * Creates a new material
   */
  async createMaterial(
    workspacePath: string,
    type: MaterialType,
    title: string
  ): Promise<DocumentMeta | null> {
    if (type === 'timeline') {
      return this.createTimeline(workspacePath, title);
    }

    return this.create(workspacePath, {
      title,
      materialType: type,
    });
  }

  /**
   * Creates a timeline material in workspace root
   */
  private async createTimeline(workspacePath: string, title: string): Promise<DocumentMeta | null> {
    const api = window.electronAPI;
    if (!api?.workspaceWriteFile) {
      console.error('workspaceWriteFile API not available');
      return null;
    }

    try {
      const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      const fileName = `timeline.ud`;
      const filePath = `${workspacePath}/workspace/${fileName}`;

      const now = new Date().toISOString();
      const meta: DocumentMeta = {
        id,
        title,
        category: 'material',
        materialType: 'timeline',
        order: 0,
        wordCount: 0,
        created: now,
        modified: now,
        path: `workspace/${fileName}`,
      };

      const timelineData: MaterialData = {
        version: '1.0',
        type: 'timeline',
        meta,
        blocks: [],
        layoutRows: [],
      };

      const content = JSON.stringify(timelineData, null, 2);
      const result = await api.workspaceWriteFile(filePath, content);

      if (result?.success) {
        await this.indexManager.updateMaterialsDocument(workspacePath, meta);
        return meta;
      }

      return null;
    } catch (error) {
      console.error('Failed to create timeline:', error);
      return null;
    }
  }

  /**
   * Deletes a material by path
   */
  async deleteMaterial(workspacePath: string, materialPath: string): Promise<boolean> {
    const api = window.electronAPI;
    if (!api?.workspaceDelete) {
      console.error('workspaceDelete API not available');
      return false;
    }

    try {
      const fullPath = `${workspacePath}/${materialPath}`;
      const result = await api.workspaceDelete(fullPath);
      return result?.success ?? false;
    } catch (error) {
      console.error('Failed to delete material:', error);
      return false;
    }
  }

  /**
   * Loads a material by path
   */
  async loadMaterial(workspacePath: string, materialPath: string): Promise<MaterialData | null> {
    const api = window.electronAPI;
    if (!api?.workspaceReadFile) {
      console.error('workspaceReadFile API not available');
      return null;
    }

    try {
      const fullPath = `${workspacePath}/${materialPath}`;
      const result = await api.workspaceReadFile(fullPath);

      if (result?.success && result?.content) {
        const data = JSON.parse(result.content);
        return {
          version: data.version || '1.0',
          type: data.type,
          meta: data.meta,
          blocks: data.blocks || [],
          layoutRows: data.layoutRows || [],
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to load material:', error);
      return null;
    }
  }

  /**
   * Saves a material by path
   */
  async saveMaterial(
    workspacePath: string,
    materialPath: string,
    data: Omit<MaterialData, 'version'>
  ): Promise<boolean> {
    const api = window.electronAPI;
    if (!api?.workspaceWriteFile) {
      console.error('workspaceWriteFile API not available');
      return false;
    }

    try {
      const fullPath = `${workspacePath}/${materialPath}`;
      const materialData: MaterialData = {
        version: '1.0',
        ...data,
        meta: {
          ...data.meta,
          modified: new Date().toISOString(),
        },
      };

      const content = JSON.stringify(materialData, null, 2);
      const result = await api.workspaceWriteFile(fullPath, content);

      if (result?.success) {
        const meta = materialData.meta;
        if (meta.id) {
          await this.indexManager.updateMaterialsDocument(workspacePath, meta);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to save material:', error);
      return false;
    }
  }
}
