import { MaterialMeta, MaterialType } from '../types/material';
import { Block, LayoutRow } from '../types/block';

export interface MaterialData {
  version: string;
  type: MaterialType;
  meta: MaterialMeta;
  blocks: Block[];
  layoutRows: LayoutRow[];
}

const MATERIAL_TYPE_DIRS: Record<MaterialType, string> = {
  character: 'characters',
  location: 'locations',
  item: 'items',
  timeline: '',
  note: 'notes',
};

export class MaterialService {
  async getMaterials(workspacePath: string, type?: MaterialType): Promise<MaterialMeta[]> {
    const api = window.electronAPI;
    if (!api?.workspaceReadDir) {
      return [];
    }

    const materials: MaterialMeta[] = [];

    if (type) {
      return this.getMaterialsByType(workspacePath, type);
    }

    for (const matType of Object.keys(MATERIAL_TYPE_DIRS) as MaterialType[]) {
      const typeMaterials = await this.getMaterialsByType(workspacePath, matType);
      materials.push(...typeMaterials);
    }

    return materials;
  }

  private async getMaterialsByType(
    workspacePath: string,
    type: MaterialType
  ): Promise<MaterialMeta[]> {
    const api = window.electronAPI;
    const materials: MaterialMeta[] = [];

    const typeDir = MATERIAL_TYPE_DIRS[type];
    if (!typeDir) {
      if (type === 'timeline') {
        const result = await api.workspaceReadFile(`${workspacePath}/workspace/timeline.ud`);
        if (result?.success && result?.content) {
          try {
            const data = JSON.parse(result.content);
            materials.push({
              id: data.meta?.id || 'timeline',
              name: data.meta?.name || '时间线',
              type: 'timeline',
              path: 'workspace/timeline.ud',
              created: data.meta?.created || new Date().toISOString(),
              modified: data.meta?.modified || new Date().toISOString(),
            });
          } catch {
            // Ignore parse errors for timeline file
          }
        }
      }
      return materials;
    }

    try {
      const typePath = `${workspacePath}/workspace/${typeDir}`;
      const result = await api.workspaceReadDir(typePath);

      if (result?.success && result?.files) {
        const udFiles = result.files.filter((f: string) => f.endsWith('.ud'));

        for (const file of udFiles) {
          materials.push({
            id: `material_${type}_${file}`,
            name: file.replace('.ud', ''),
            type,
            path: `workspace/${typeDir}/${file}`,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error(`Failed to get materials for type ${type}:`, error);
    }

    return materials;
  }

  async createMaterial(
    workspacePath: string,
    type: MaterialType,
    name: string
  ): Promise<MaterialMeta | null> {
    const api = window.electronAPI;
    if (!api?.workspaceWriteFile) {
      console.error('workspaceWriteFile API not available');
      return null;
    }

    try {
      const typeDir = MATERIAL_TYPE_DIRS[type];
      let filePath: string;
      let materialPath: string;

      if (type === 'timeline') {
        filePath = `${workspacePath}/workspace/timeline.ud`;
        materialPath = 'workspace/timeline.ud';
      } else {
        const fileName = `${name}.ud`;
        filePath = `${workspacePath}/workspace/${typeDir}/${fileName}`;
        materialPath = `workspace/${typeDir}/${fileName}`;
      }

      const materialData: MaterialData = {
        version: '1.0',
        type,
        meta: {
          id: `material_${Date.now()}`,
          name,
          type,
          path: materialPath,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
        blocks: [],
        layoutRows: [],
      };

      const content = JSON.stringify(materialData, null, 2);
      const result = await api.workspaceWriteFile(filePath, content);

      if (result?.success) {
        return materialData.meta;
      }

      return null;
    } catch (error) {
      console.error('Failed to create material:', error);
      return null;
    }
  }

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
      return result?.success ?? false;
    } catch (error) {
      console.error('Failed to save material:', error);
      return false;
    }
  }
}
