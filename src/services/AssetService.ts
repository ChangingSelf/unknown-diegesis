import { AssetMeta, AssetType } from '@/types/document';
import {
  AssetUploadParams,
  AssetDeleteResult,
  ASSET_SUBDIRS as ASSET_SUBDIRS_FROM_TYPES,
  IMAGE_SUBDIRS,
  type AssetCategory,
} from '@/types/asset';
import { ASSETS_DIR } from '@/constants/paths';
import { IndexManager } from '@/utils/IndexManager';

/**
 * 资源服务类
 * 负责媒体资源的管理和操作
 */
export class AssetService {
  private indexManager: IndexManager;
  private api = window.electronAPI;

  constructor() {
    this.indexManager = new IndexManager();
  }

  /**
   * 上传资源到工作区
   */
  async uploadAsset(
    workspacePath: string,
    params: Omit<AssetUploadParams, 'workspacePath'>
  ): Promise<AssetMeta | null> {
    if (!this.api?.workspaceWriteFile || !this.api?.workspaceMkdir) {
      console.error('Required workspace APIs not available');
      return null;
    }

    const { fileData, fileName, mimeType, assetType, category } = params;

    try {
      // 生成资源 ID
      const assetId = this.generateAssetId();
      const timestamp = new Date().toISOString();

      // 计算目标路径
      const relativePath = this.calculateAssetPath(assetType, fileName, category);
      const fullPath = `${workspacePath}/${relativePath}`;
      const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));

      // 创建目录
      await this.api.workspaceMkdir(dirPath);

      // 将文件数据写入磁盘
      let fileContent: string;
      if (fileData instanceof ArrayBuffer) {
        // 将 ArrayBuffer 转换为 Base64
        const uint8Array = new Uint8Array(fileData);
        const binaryString = Array.from(uint8Array)
          .map(byte => String.fromCharCode(byte))
          .join('');
        fileContent = btoa(binaryString);
      } else {
        fileContent = fileData;
      }

      const writeResult = await this.api.workspaceWriteFile(fullPath, fileContent);
      if (!writeResult?.success) {
        console.error('Failed to write asset file');
        return null;
      }

      // 获取文件大小
      const fileSize = this.getFileSize(fileData);

      // 提取图片尺寸（仅图片类型）
      const dimensions = assetType === 'image' ? await this.extractImageDimensions(fileData) : null;

      // 创建资源元数据
      const assetMeta: AssetMeta = {
        id: assetId,
        type: assetType,
        path: relativePath,
        name: fileName,
        size: fileSize,
        mimeType,
        width: dimensions?.width,
        height: dimensions?.height,
        created: timestamp,
        modified: timestamp,
        usedBy: [],
      };

      // 更新资源索引
      await this.updateAssetIndex(workspacePath, assetId, assetMeta);

      return assetMeta;
    } catch (error) {
      console.error('Failed to upload asset:', error);
      return null;
    }
  }

  /**
   * 获取所有资源列表，可选按类型过滤
   */
  async getAssets(workspacePath: string, type?: AssetType): Promise<AssetMeta[]> {
    const index = await this.indexManager.loadAssetsIndex(workspacePath);
    const assets = Object.values(index.assets);

    if (type) {
      return assets.filter(asset => asset.type === type);
    }

    return assets;
  }

  /**
   * 根据 ID 获取单个资源
   */
  async getAssetById(workspacePath: string, id: string): Promise<AssetMeta | null> {
    const index = await this.indexManager.loadAssetsIndex(workspacePath);
    return index.assets[id] || null;
  }

  /**
   * 删除资源
   * 如果资源正在使用，返回引用列表而不是删除
   */
  async deleteAsset(workspacePath: string, assetId: string): Promise<AssetDeleteResult> {
    const index = await this.indexManager.loadAssetsIndex(workspacePath);
    const asset = index.assets[assetId];

    if (!asset) {
      return {
        success: false,
        error: 'Asset not found',
      };
    }

    // 检查是否正在使用
    if (asset.usedBy.length > 0) {
      return {
        success: false,
        usedBy: asset.usedBy,
      };
    }

    // 删除文件
    if (!this.api?.workspaceDelete) {
      return {
        success: false,
        error: 'workspaceDelete API not available',
      };
    }

    try {
      const fullPath = `${workspacePath}/${asset.path}`;
      const deleteResult = await this.api.workspaceDelete(fullPath);

      if (!deleteResult?.success) {
        return {
          success: false,
          error: 'Failed to delete asset file',
        };
      }

      // 从索引中移除
      delete index.assets[assetId];
      await this.indexManager.saveAssetsIndex(workspacePath, index);

      return { success: true };
    } catch (error) {
      console.error('Failed to delete asset:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 获取未被任何文档引用的资源列表
   */
  async getUnusedAssets(workspacePath: string): Promise<AssetMeta[]> {
    const index = await this.indexManager.loadAssetsIndex(workspacePath);
    return Object.values(index.assets).filter(asset => asset.usedBy.length === 0);
  }

  /**
   * 添加文档引用
   */
  async addReference(workspacePath: string, assetId: string, documentId: string): Promise<boolean> {
    const index = await this.indexManager.loadAssetsIndex(workspacePath);
    const asset = index.assets[assetId];

    if (!asset) {
      return false;
    }

    // 避免重复添加
    if (!asset.usedBy.includes(documentId)) {
      asset.usedBy.push(documentId);
      await this.indexManager.saveAssetsIndex(workspacePath, index);
    }

    return true;
  }

  /**
   * 移除文档引用
   */
  async removeReference(
    workspacePath: string,
    assetId: string,
    documentId: string
  ): Promise<boolean> {
    const index = await this.indexManager.loadAssetsIndex(workspacePath);
    const asset = index.assets[assetId];

    if (!asset) {
      return false;
    }

    const indexToRemove = asset.usedBy.indexOf(documentId);
    if (indexToRemove > -1) {
      asset.usedBy.splice(indexToRemove, 1);
      await this.indexManager.saveAssetsIndex(workspacePath, index);
    }

    return true;
  }

  /**
   * 计算资源相对路径
   */
  private calculateAssetPath(
    assetType: AssetType,
    fileName: string,
    category?: AssetCategory
  ): string {
    const subdir = ASSET_SUBDIRS_FROM_TYPES[assetType];

    if (assetType === 'image' && category) {
      const imageSubdir = IMAGE_SUBDIRS[category];
      return `${ASSETS_DIR}/${subdir}/${imageSubdir}/${fileName}`;
    }

    return `${ASSETS_DIR}/${subdir}/${fileName}`;
  }

  /**
   * 更新资源索引
   */
  private async updateAssetIndex(
    workspacePath: string,
    assetId: string,
    assetMeta: AssetMeta
  ): Promise<boolean> {
    try {
      const index = await this.indexManager.loadAssetsIndex(workspacePath);
      index.assets[assetId] = assetMeta;
      return await this.indexManager.saveAssetsIndex(workspacePath, index);
    } catch (error) {
      console.error('Failed to update asset index:', error);
      return false;
    }
  }

  /**
   * 生成唯一资源 ID
   */
  private generateAssetId(): string {
    return `asset_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 获取文件大小
   */
  private getFileSize(fileData: string | ArrayBuffer): number {
    if (fileData instanceof ArrayBuffer) {
      return fileData.byteLength;
    }
    return fileData.length;
  }

  /**
   * 提取图片尺寸
   * 注意：这是一个简化实现，实际应用中可能需要使用专业的图片处理库
   */
  private async extractImageDimensions(
    fileData: string | ArrayBuffer
  ): Promise<{ width: number; height: number } | null> {
    // 如果是 Base64 字符串，转换为 ArrayBuffer
    let arrayBuffer: ArrayBuffer;
    if (typeof fileData === 'string') {
      try {
        const binaryString = atob(fileData);
        arrayBuffer = new ArrayBuffer(binaryString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }
      } catch {
        return null;
      }
    } else {
      arrayBuffer = fileData;
    }

    const uint8Array = new Uint8Array(arrayBuffer);

    // 检查 JPEG
    if (uint8Array[0] === 0xff && uint8Array[1] === 0xd8) {
      return this.extractJpegDimensions(uint8Array);
    }

    // 检查 PNG
    if (
      uint8Array[0] === 0x89 &&
      uint8Array[1] === 0x50 &&
      uint8Array[2] === 0x4e &&
      uint8Array[3] === 0x47
    ) {
      return this.extractPngDimensions(uint8Array);
    }

    // 检查 GIF
    if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46) {
      return this.extractGifDimensions(uint8Array);
    }

    // 其他格式暂不支持
    return null;
  }

  /**
   * 提取 JPEG 图片尺寸
   */
  private extractJpegDimensions(data: Uint8Array): { width: number; height: number } | null {
    let i = 2;
    while (i < data.length) {
      if (data[i] !== 0xff) return null;
      const marker = data[i + 1];
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        const height = (data[i + 5] << 8) | data[i + 6];
        const width = (data[i + 7] << 8) | data[i + 8];
        return { width, height };
      }
      i += 2 + ((data[i + 2] << 8) | data[i + 3]);
    }
    return null;
  }

  /**
   * 提取 PNG 图片尺寸
   */
  private extractPngDimensions(data: Uint8Array): { width: number; height: number } | null {
    if (data.length < 24) return null;
    const width = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19];
    const height = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23];
    return { width, height };
  }

  /**
   * 提取 GIF 图片尺寸
   */
  private extractGifDimensions(data: Uint8Array): { width: number; height: number } | null {
    if (data.length < 10) return null;
    const width = (data[7] << 8) | data[6];
    const height = (data[9] << 8) | data[8];
    return { width, height };
  }
}
