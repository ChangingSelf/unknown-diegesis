export interface AssetMeta {
  name: string;
  path: string;
  type: 'image' | 'document';
  size: number;
  modified: string;
}

function joinPath(...parts: string[]): string {
  return parts.filter(Boolean).join('/');
}

function relativePath(base: string, target: string): string {
  const baseParts = base.replace(/\\/g, '/').split('/').filter(Boolean);
  const targetParts = target.replace(/\\/g, '/').split('/').filter(Boolean);

  let commonLength = 0;
  const minLength = Math.min(baseParts.length, targetParts.length);

  for (let i = 0; i < minLength; i++) {
    if (baseParts[i] === targetParts[i]) {
      commonLength++;
    } else {
      break;
    }
  }

  const upCount = baseParts.length - commonLength;
  const upPath = upCount > 0 ? Array(upCount).fill('..').join('/') : '';
  const downPath = targetParts.slice(commonLength).join('/');

  return upPath ? joinPath(upPath, downPath) : downPath;
}

function resolvePath(...parts: string[]): string {
  const absoluteParts: string[] = [];

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('/') || part.match(/^[a-zA-Z]:/)) {
      absoluteParts.length = 0;
    }

    absoluteParts.push(...part.replace(/\\/g, '/').split('/').filter(Boolean));
  }

  return '/' + absoluteParts.join('/');
}

function getBasename(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

function getExtname(path: string): string {
  const name = getBasename(path);
  const lastDot = name.lastIndexOf('.');
  return lastDot > 0 ? name.substring(lastDot) : '';
}

export class AssetService {
  private readonly IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
  private readonly DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];

  async getAssets(workspacePath: string, type?: 'image' | 'document'): Promise<AssetMeta[]> {
    const api = window.electronAPI;
    if (!api?.workspaceReadDir) {
      console.error('workspaceReadDir API not available');
      return [];
    }

    const assetDir = joinPath(workspacePath, 'assets', type || '');
    const result = await api.workspaceReadDir(assetDir);

    if (!result?.success || !result.files) {
      return [];
    }

    const assets: AssetMeta[] = [];

    for (const file of result.files) {
      const filePath = joinPath(assetDir, file);
      const ext = getExtname(file).toLowerCase();

      if (!this.isValidExtension(ext, type)) {
        continue;
      }

      try {
        const stats = await this.getFileStats(filePath);
        if (stats) {
          assets.push({
            name: file,
            path: relativePath(workspacePath, filePath),
            type: this.getFileType(ext),
            size: stats.size,
            modified: stats.modified,
          });
        }
      } catch (error) {
        console.error(`Failed to get stats for ${file}:`, error);
      }
    }

    return assets.sort((a, b) => b.modified.localeCompare(a.modified));
  }

  async importAsset(
    workspacePath: string,
    sourcePath: string,
    type: 'image' | 'document'
  ): Promise<AssetMeta> {
    const api = window.electronAPI;

    if (!api?.workspaceReadDir || !api?.workspaceCopyFile) {
      throw new Error('Required APIs not available');
    }

    const fileName = getBasename(sourcePath);
    const ext = getExtname(fileName).toLowerCase();

    if (!this.isValidExtension(ext, type)) {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    const destDir = joinPath(workspacePath, 'assets', type);
    let destPath = joinPath(destDir, fileName);

    await api.workspaceMkdir(destDir);

    const result = await api.workspaceReadDir(destDir);
    if (result?.success && result.files?.includes(fileName)) {
      const counter = this.getDuplicateCounter(result.files, fileName);
      const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
      const newFileName = `${nameWithoutExt}_${counter}${ext}`;
      destPath = joinPath(destDir, newFileName);
    }

    const copyResult = await api.workspaceCopyFile(sourcePath, destPath);
    if (!copyResult?.success) {
      throw new Error(`Failed to copy file: ${sourcePath}`);
    }

    const stats = await this.getFileStats(destPath);
    if (!stats) {
      throw new Error('Failed to get stats for imported file');
    }

    return {
      name: getBasename(destPath),
      path: relativePath(workspacePath, destPath),
      type,
      size: stats.size,
      modified: stats.modified,
    };
  }

  async deleteAsset(workspacePath: string, assetPath: string): Promise<boolean> {
    const api = window.electronAPI;
    if (!api?.workspaceDelete) {
      console.error('workspaceDelete API not available');
      return false;
    }

    const fullPath = resolvePath(workspacePath, assetPath);

    try {
      const result = await api.workspaceDelete(fullPath);
      return result?.success ?? false;
    } catch (error) {
      console.error(`Failed to delete asset: ${assetPath}`, error);
      return false;
    }
  }

  getRelativePath(workspacePath: string, assetPath: string): string {
    return relativePath(workspacePath, resolvePath(workspacePath, assetPath));
  }

  getAbsolutePath(workspacePath: string, relativePath: string): string {
    return resolvePath(workspacePath, relativePath);
  }

  private isValidExtension(ext: string, type?: 'image' | 'document'): boolean {
    if (type === 'image') {
      return this.IMAGE_EXTENSIONS.includes(ext);
    }
    if (type === 'document') {
      return this.DOCUMENT_EXTENSIONS.includes(ext);
    }
    return this.IMAGE_EXTENSIONS.includes(ext) || this.DOCUMENT_EXTENSIONS.includes(ext);
  }

  private getFileType(ext: string): 'image' | 'document' {
    if (this.IMAGE_EXTENSIONS.includes(ext)) {
      return 'image';
    }
    return 'document';
  }

  private getDuplicateCounter(files: string[], fileName: string): number {
    const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
    const ext = getExtname(fileName);

    let counter = 1;
    while (files.includes(`${baseName}_${counter}${ext}`)) {
      counter++;
    }

    return counter;
  }

  private async getFileStats(filePath: string): Promise<{ size: number; modified: string } | null> {
    const api = window.electronAPI;
    if (!api?.fileStat) {
      return null;
    }

    const result = await api.fileStat(filePath);
    if (!result?.success || result.mtime === undefined || result.size === undefined) {
      return null;
    }

    return {
      size: result.size,
      modified: result.mtime,
    };
  }
}
