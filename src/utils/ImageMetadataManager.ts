import path from 'path';
import { promises as fs } from 'fs';

// Type for Electron API
interface ElectronAPI {
  readFile?: (path: string) => Promise<string>;
  writeFile?: (path: string, content: string) => Promise<boolean>;
}

export interface ImageMetadata {
  id: string;
  path: string;
  category: 'character' | 'scene' | 'illustration';
  width?: number;
  height?: number;
  usedBy: string[]; // IDs of documents/blocks using this image
  created: string;
  modified: string;
}

export class ImageMetadataStore {
  private static getFilePath(workspacePath: string): string {
    // Metadata stored at: {workspace}/.metadata/images.json
    return path.join(workspacePath, '.metadata', 'images.json');
  }

  // Load all metadata from JSON, returning an object keyed by image id
  async load(workspacePath: string): Promise<Record<string, ImageMetadata>> {
    const filePath = ImageMetadataStore.getFilePath(workspacePath);
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      // If file doesn't exist, return empty map
      let exists = true;
      try {
        await fs.access(filePath);
      } catch {
        exists = false;
      }
      if (!exists) return {};
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as Record<string, ImageMetadata>;
      return data || {};
    } catch {
      const api = (globalThis as { window?: { electronAPI?: ElectronAPI } }).window?.electronAPI;
      if (api && typeof api.readFile === 'function') {
        try {
          const text = await api.readFile(filePath);
          if (typeof text === 'string' && text.length > 0) {
            const parsed = JSON.parse(text) as Record<string, ImageMetadata>;
            return parsed || {};
          }
        } catch {
          // ignore and fall through
        }
      }
      return {};
    }
  }

  // Save metadata map to JSON
  async save(workspacePath: string, metadata: Record<string, ImageMetadata>): Promise<boolean> {
    const filePath = ImageMetadataStore.getFilePath(workspacePath);
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      const json = JSON.stringify(metadata, null, 2);
      await fs.writeFile(filePath, json, 'utf-8');
      return true;
    } catch {
      const api = (globalThis as { window?: { electronAPI?: ElectronAPI } }).window?.electronAPI;
      if (api && typeof api.writeFile === 'function') {
        try {
          await api.writeFile(filePath, JSON.stringify(metadata, null, 2));
          return true;
        } catch {
          // ignore
        }
      }
      return false;
    }
  }

  async addImage(workspacePath: string, image: ImageMetadata): Promise<boolean> {
    const data = await this.load(workspacePath);
    data[image.id] = image;
    return this.save(workspacePath, data);
  }

  async removeImage(workspacePath: string, imageId: string): Promise<boolean> {
    const data = await this.load(workspacePath);
    if (!(imageId in data)) return false;
    delete data[imageId];
    return this.save(workspacePath, data);
  }

  async updateUsedBy(workspacePath: string, imageId: string, usedBy: string[]): Promise<boolean> {
    const data = await this.load(workspacePath);
    const img = data[imageId];
    if (!img) return false;
    img.usedBy = usedBy;
    img.modified = new Date().toISOString();
    data[imageId] = img;
    return this.save(workspacePath, data);
  }

  async getById(workspacePath: string, imageId: string): Promise<ImageMetadata | null> {
    const data = await this.load(workspacePath);
    return data[imageId] ?? null;
  }

  async getByPath(workspacePath: string, p: string): Promise<ImageMetadata | null> {
    const data = await this.load(workspacePath);
    for (const id of Object.keys(data)) {
      if (data[id].path === p) return data[id];
    }
    return null;
  }
}
