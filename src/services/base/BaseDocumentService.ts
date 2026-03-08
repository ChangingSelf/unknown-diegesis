import { DocumentMeta, DocumentData } from '@/types/document';
import { Block, LayoutRow } from '@/types/block';
import { IndexManager } from '@/utils/IndexManager';
import { generateDocumentFileName } from '@/utils/FileNaming';
import { DOCUMENT_SCHEMA_VERSION } from '@/constants/versions';

export abstract class BaseDocumentService<TMeta extends DocumentMeta = DocumentMeta> {
  protected indexManager: IndexManager;

  constructor() {
    this.indexManager = new IndexManager();
  }

  protected abstract getTypeDir(): string;
  protected abstract getIndexType(): 'story' | 'materials';

  protected getFilePrefix(): string {
    return '';
  }

  protected generateFileName(): string {
    return generateDocumentFileName();
  }

  async getAll(workspacePath: string): Promise<TMeta[]> {
    const api = window.electronAPI;
    if (!api?.workspaceReadDir || !api?.workspaceReadFile) {
      return [];
    }

    const documents: TMeta[] = [];
    const typeDir = this.getTypeDir();

    try {
      const dirPath = `${workspacePath}/${typeDir}`;
      const result = await api.workspaceReadDir(dirPath);

      if (result?.success && result?.files) {
        const udFiles = result.files.filter((f: string) => f.endsWith('.ud'));

        for (const file of udFiles) {
          const filePath = `${dirPath}/${file}`;
          const fileResult = await api.workspaceReadFile(filePath);

          if (fileResult?.success && fileResult?.content) {
            try {
              const data = JSON.parse(fileResult.content);
              if (data?.meta) {
                documents.push({
                  ...data.meta,
                  path: `${typeDir}/${file}`,
                } as TMeta);
              }
            } catch {
              // Skip invalid files
            }
          }
        }
      }
    } catch (error) {
      console.error(`Failed to get documents from ${typeDir}:`, error);
    }

    return documents;
  }

  async getById(workspacePath: string, id: string): Promise<DocumentData<TMeta> | null> {
    const api = window.electronAPI;
    if (!api?.workspaceReadFile) {
      return null;
    }

    const index =
      this.getIndexType() === 'story'
        ? await this.indexManager.loadStoryIndex(workspacePath)
        : await this.indexManager.loadMaterialsIndex(workspacePath);

    const meta = index.documents[id] as TMeta | undefined;
    if (!meta?.path) {
      return null;
    }

    try {
      const filePath = `${workspacePath}/${meta.path}`;
      const result = await api.workspaceReadFile(filePath);

      if (result?.success && result?.content) {
        const data = JSON.parse(result.content);
        return {
          schemaVersion: data.schemaVersion ?? this.parseLegacyVersion(data.version),
          type: data.type,
          meta: {
            ...data.meta,
            path: meta.path,
          } as TMeta,
          blocks: data.blocks || [],
          layoutRows: data.layoutRows || [],
        };
      }
    } catch (error) {
      console.error(`Failed to load document ${id}:`, error);
    }

    return null;
  }

  async create(
    workspacePath: string,
    data: {
      title: string;
      blocks?: Block[];
      layoutRows?: LayoutRow[];
    } & Partial<TMeta>
  ): Promise<TMeta | null> {
    const api = window.electronAPI;
    if (!api?.workspaceWriteFile) {
      return null;
    }

    try {
      const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      const fileName = this.generateFileName();
      const typeDir = this.getTypeDir();
      const filePath = `${workspacePath}/${typeDir}/${fileName}`;

      const now = new Date().toISOString();
      const meta: TMeta = {
        ...data,
        id,
        category: this.getIndexType() === 'story' ? 'story' : 'material',
        order: data.order ?? 0,
        wordCount: data.wordCount ?? 0,
        created: now,
        modified: now,
        path: `${typeDir}/${fileName}`,
      } as TMeta;

      const documentData: DocumentData<TMeta> = {
        schemaVersion: DOCUMENT_SCHEMA_VERSION,
        type:
          this.getIndexType() === 'story'
            ? 'story'
            : ((data as { materialType?: string }).materialType as
                | 'story'
                | import('@/types/document').MaterialType),
        meta,
        blocks: data.blocks || [],
        layoutRows: data.layoutRows || [],
      };

      const content = JSON.stringify(documentData, null, 2);
      const result = await api.workspaceWriteFile(filePath, content);

      if (result?.success) {
        if (this.getIndexType() === 'story') {
          await this.indexManager.updateStoryDocument(workspacePath, meta as DocumentMeta);
        } else {
          await this.indexManager.updateMaterialsDocument(workspacePath, meta as DocumentMeta);
        }
        return meta;
      }

      return null;
    } catch (error) {
      console.error('Failed to create document:', error);
      return null;
    }
  }

  private parseLegacyVersion(version: string | undefined): number {
    if (!version) return 1;
    const match = version.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  async save(
    workspacePath: string,
    _id: string,
    data: {
      meta: TMeta;
      blocks: Block[];
      layoutRows: LayoutRow[];
    }
  ): Promise<boolean> {
    const api = window.electronAPI;
    if (!api?.workspaceWriteFile) {
      return false;
    }

    try {
      const filePath = `${workspacePath}/${data.meta.path}`;

      const documentData: DocumentData<TMeta> = {
        schemaVersion: DOCUMENT_SCHEMA_VERSION,
        type:
          this.getIndexType() === 'story'
            ? 'story'
            : ((data.meta as unknown as { materialType?: string }).materialType as
                | 'story'
                | import('@/types/document').MaterialType),
        meta: {
          ...data.meta,
          modified: new Date().toISOString(),
        },
        blocks: data.blocks,
        layoutRows: data.layoutRows,
      };

      const content = JSON.stringify(documentData, null, 2);
      const result = await api.workspaceWriteFile(filePath, content);

      if (result?.success) {
        if (this.getIndexType() === 'story') {
          await this.indexManager.updateStoryDocument(
            workspacePath,
            documentData.meta as DocumentMeta
          );
        } else {
          await this.indexManager.updateMaterialsDocument(
            workspacePath,
            documentData.meta as DocumentMeta
          );
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to save document:', error);
      return false;
    }
  }

  async delete(workspacePath: string, id: string): Promise<boolean> {
    const api = window.electronAPI;
    if (!api?.workspaceDelete) {
      return false;
    }

    try {
      const index =
        this.getIndexType() === 'story'
          ? await this.indexManager.loadStoryIndex(workspacePath)
          : await this.indexManager.loadMaterialsIndex(workspacePath);

      const meta = index.documents[id];
      if (!meta?.path) {
        return false;
      }

      const filePath = `${workspacePath}/${meta.path}`;
      const result = await api.workspaceDelete(filePath);

      if (result?.success) {
        if (this.getIndexType() === 'story') {
          await this.indexManager.removeStoryDocument(workspacePath, id);
        } else {
          await this.indexManager.removeMaterialsDocument(workspacePath, id);
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to delete document:', error);
      return false;
    }
  }

  async updateMeta(
    workspacePath: string,
    id: string,
    metaUpdates: Partial<TMeta>
  ): Promise<boolean> {
    const document = await this.getById(workspacePath, id);
    if (!document) return false;

    return this.save(workspacePath, id, {
      meta: { ...document.meta, ...metaUpdates } as TMeta,
      blocks: document.blocks,
      layoutRows: document.layoutRows,
    });
  }
}
