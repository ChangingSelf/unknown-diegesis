import { DocumentMeta, MaterialType } from '@/types/document';
import {
  STORY_DIR,
  MATERIALS_DIR,
  INDEX_DIR,
  INDEX_FILES,
  MATERIAL_SUBDIRS,
} from '@/constants/paths';
import { INDEX_SCHEMA_VERSION } from '@/constants/versions';

export interface StoryIndex {
  schemaVersion: number;
  lastUpdated: string;
  documents: Record<string, DocumentMeta>;
  byFolder: Record<string, string[]>;
}

export interface MaterialsIndex {
  schemaVersion: number;
  lastUpdated: string;
  documents: Record<string, DocumentMeta>;
  byType: Record<MaterialType, string[]>;
}

export interface AssetsIndex {
  schemaVersion: number;
  lastUpdated: string;
  assets: Record<string, import('@/types/document').AssetMeta>;
}

export type IndexType = 'story' | 'materials' | 'assets';

function createEmptyStoryIndex(): StoryIndex {
  return {
    schemaVersion: INDEX_SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
    documents: {},
    byFolder: {},
  };
}

function createEmptyMaterialsIndex(): MaterialsIndex {
  return {
    schemaVersion: INDEX_SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
    documents: {},
    byType: {
      character: [],
      location: [],
      item: [],
      worldview: [],
      outline: [],
      timeline: [],
      note: [],
    },
  };
}

function createEmptyAssetsIndex(): AssetsIndex {
  return {
    schemaVersion: INDEX_SCHEMA_VERSION,
    lastUpdated: new Date().toISOString(),
    assets: {},
  };
}

export class IndexManager {
  private api = window.electronAPI;

  async loadStoryIndex(workspacePath: string): Promise<StoryIndex> {
    return this.loadIndex<StoryIndex>(workspacePath, 'story', createEmptyStoryIndex);
  }

  async loadMaterialsIndex(workspacePath: string): Promise<MaterialsIndex> {
    return this.loadIndex<MaterialsIndex>(workspacePath, 'materials', createEmptyMaterialsIndex);
  }

  async loadAssetsIndex(workspacePath: string): Promise<AssetsIndex> {
    return this.loadIndex<AssetsIndex>(workspacePath, 'assets', createEmptyAssetsIndex);
  }

  private async loadIndex<T>(
    workspacePath: string,
    type: IndexType,
    createEmpty: () => T
  ): Promise<T> {
    if (!this.api?.workspaceReadFile) {
      return createEmpty();
    }

    try {
      const indexPath = `${workspacePath}/${INDEX_DIR}/${INDEX_FILES[type]}`;
      const result = await this.api.workspaceReadFile(indexPath);

      if (result?.success && result?.content) {
        return JSON.parse(result.content) as T;
      }
    } catch (error) {
      console.error(`Failed to load ${type} index:`, error);
    }

    return createEmpty();
  }

  async saveStoryIndex(workspacePath: string, index: StoryIndex): Promise<boolean> {
    index.lastUpdated = new Date().toISOString();
    return this.saveIndex(workspacePath, 'story', index);
  }

  async saveMaterialsIndex(workspacePath: string, index: MaterialsIndex): Promise<boolean> {
    index.lastUpdated = new Date().toISOString();
    return this.saveIndex(workspacePath, 'materials', index);
  }

  async saveAssetsIndex(workspacePath: string, index: AssetsIndex): Promise<boolean> {
    index.lastUpdated = new Date().toISOString();
    return this.saveIndex(workspacePath, 'assets', index);
  }

  private async saveIndex(
    workspacePath: string,
    type: IndexType,
    index: unknown
  ): Promise<boolean> {
    if (!this.api?.workspaceWriteFile) {
      return false;
    }

    try {
      const indexPath = `${workspacePath}/${INDEX_DIR}/${INDEX_FILES[type]}`;
      const content = JSON.stringify(index, null, 2);
      const result = await this.api.workspaceWriteFile(indexPath, content);
      return result?.success ?? false;
    } catch (error) {
      console.error(`Failed to save ${type} index:`, error);
      return false;
    }
  }

  async updateStoryDocument(
    workspacePath: string,
    meta: DocumentMeta,
    previousFolder?: string
  ): Promise<boolean> {
    const index = await this.loadStoryIndex(workspacePath);

    if (previousFolder && previousFolder !== meta.folder) {
      const folderList = index.byFolder[previousFolder];
      if (folderList) {
        const idx = folderList.indexOf(meta.id);
        if (idx > -1) {
          folderList.splice(idx, 1);
          if (folderList.length === 0) {
            delete index.byFolder[previousFolder];
          }
        }
      }
    }

    index.documents[meta.id] = meta;

    const folder = meta.folder || '';
    if (!index.byFolder[folder]) {
      index.byFolder[folder] = [];
    }
    if (!index.byFolder[folder].includes(meta.id)) {
      index.byFolder[folder].push(meta.id);
    }

    return this.saveStoryIndex(workspacePath, index);
  }

  async removeStoryDocument(workspacePath: string, id: string): Promise<boolean> {
    const index = await this.loadStoryIndex(workspacePath);
    const meta = index.documents[id];

    if (!meta) return false;

    const folder = meta.folder || '';
    const folderList = index.byFolder[folder];
    if (folderList) {
      const idx = folderList.indexOf(id);
      if (idx > -1) {
        folderList.splice(idx, 1);
        if (folderList.length === 0) {
          delete index.byFolder[folder];
        }
      }
    }

    delete index.documents[id];
    return this.saveStoryIndex(workspacePath, index);
  }

  async updateMaterialsDocument(workspacePath: string, meta: DocumentMeta): Promise<boolean> {
    const index = await this.loadMaterialsIndex(workspacePath);

    index.documents[meta.id] = meta;

    if (meta.materialType) {
      for (const type of Object.keys(index.byType) as MaterialType[]) {
        const typeList = index.byType[type];
        const idx = typeList.indexOf(meta.id);
        if (idx > -1) {
          typeList.splice(idx, 1);
        }
      }

      if (!index.byType[meta.materialType]) {
        index.byType[meta.materialType] = [];
      }
      if (!index.byType[meta.materialType].includes(meta.id)) {
        index.byType[meta.materialType].push(meta.id);
      }
    }

    return this.saveMaterialsIndex(workspacePath, index);
  }

  async removeMaterialsDocument(workspacePath: string, id: string): Promise<boolean> {
    const index = await this.loadMaterialsIndex(workspacePath);
    const meta = index.documents[id];

    if (!meta) return false;

    if (meta.materialType) {
      const typeList = index.byType[meta.materialType];
      if (typeList) {
        const idx = typeList.indexOf(id);
        if (idx > -1) {
          typeList.splice(idx, 1);
        }
      }
    }

    delete index.documents[id];
    return this.saveMaterialsIndex(workspacePath, index);
  }

  async initializeIndexes(workspacePath: string): Promise<boolean> {
    if (!this.api?.workspaceWriteFile) {
      return false;
    }

    try {
      const indexDir = `${workspacePath}/${INDEX_DIR}`;
      await this.api.workspaceMkdir?.(indexDir);

      await this.saveStoryIndex(workspacePath, createEmptyStoryIndex());
      await this.saveMaterialsIndex(workspacePath, createEmptyMaterialsIndex());
      await this.saveAssetsIndex(workspacePath, createEmptyAssetsIndex());

      return true;
    } catch (error) {
      console.error('Failed to initialize indexes:', error);
      return false;
    }
  }

  async rebuildStoryIndex(workspacePath: string): Promise<StoryIndex> {
    const index = createEmptyStoryIndex();

    if (!this.api?.workspaceReadDir || !this.api?.workspaceReadFile) {
      return index;
    }

    try {
      const storyPath = `${workspacePath}/${STORY_DIR}`;
      const result = await this.api.workspaceReadDir(storyPath);

      if (result?.success && result?.files) {
        const udFiles = result.files.filter((f: string) => f.endsWith('.ud'));

        for (const file of udFiles) {
          const filePath = `${storyPath}/${file}`;
          const fileResult = await this.api.workspaceReadFile(filePath);

          if (fileResult?.success && fileResult?.content) {
            try {
              const data = JSON.parse(fileResult.content);
              if (data?.meta) {
                const meta = data.meta as DocumentMeta;
                meta.path = `${STORY_DIR}/${file}`;
                index.documents[meta.id] = meta;

                const folder = meta.folder || '';
                if (!index.byFolder[folder]) {
                  index.byFolder[folder] = [];
                }
                index.byFolder[folder].push(meta.id);
              }
            } catch {
              // Skip invalid files
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to rebuild story index:', error);
    }

    await this.saveStoryIndex(workspacePath, index);
    return index;
  }

  async rebuildMaterialsIndex(workspacePath: string): Promise<MaterialsIndex> {
    const index = createEmptyMaterialsIndex();

    if (!this.api?.workspaceReadDir || !this.api?.workspaceReadFile) {
      return index;
    }

    try {
      for (const subdir of Object.values(MATERIAL_SUBDIRS)) {
        const typePath = `${workspacePath}/${MATERIALS_DIR}/${subdir}`;
        const result = await this.api.workspaceReadDir(typePath);

        if (result?.success && result?.files) {
          const udFiles = result.files.filter((f: string) => f.endsWith('.ud'));

          for (const file of udFiles) {
            const filePath = `${typePath}/${file}`;
            const fileResult = await this.api.workspaceReadFile(filePath);

            if (fileResult?.success && fileResult?.content) {
              try {
                const data = JSON.parse(fileResult.content);
                if (data?.meta) {
                  const meta = data.meta as DocumentMeta;
                  meta.path = `${MATERIALS_DIR}/${subdir}/${file}`;
                  index.documents[meta.id] = meta;

                  if (meta.materialType && index.byType[meta.materialType]) {
                    index.byType[meta.materialType].push(meta.id);
                  }
                }
              } catch {
                // Skip invalid files
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to rebuild materials index:', error);
    }

    await this.saveMaterialsIndex(workspacePath, index);
    return index;
  }
}
