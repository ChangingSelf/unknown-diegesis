import { ImageHostConfig, ImageHostLink } from '@/types/image';

/**
 * 图床上传结果
 */
export interface UploadResult {
  success: boolean;
  remoteUrl?: string;
  error?: string;
}

/**
 * 上传进度信息
 */
export interface UploadProgress {
  localPath: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

/**
 * 图床管理器状态
 */
export interface ImageHostManagerState {
  hosts: ImageHostConfig[];
  links: ImageHostLink[];
  uploadProgress: Map<string, UploadProgress>;
}

/**
 * 图床管理服务
 * 负责图床配置管理和图片上传（预留接口）
 */
export class ImageHostManager {
  private state: ImageHostManagerState;
  private listeners: Set<(state: ImageHostManagerState) => void> = new Set();
  private storageKey = 'image-host-manager-state';

  constructor() {
    this.state = {
      hosts: [],
      links: [],
      uploadProgress: new Map(),
    };
    this.loadFromStorage();
  }

  /**
   * 获取当前状态
   */
  getState(): ImageHostManagerState {
    return {
      ...this.state,
      uploadProgress: new Map(this.state.uploadProgress),
    };
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: (state: ImageHostManagerState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      const data = {
        hosts: this.state.hosts,
        links: this.state.links,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save image host manager state:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.state.hosts = parsed.hosts || [];
        this.state.links = parsed.links || [];
      }
    } catch (error) {
      console.error('Failed to load image host manager state:', error);
    }
  }

  /**
   * 添加图床配置
   */
  addHost(host: ImageHostConfig): void {
    this.state.hosts.push(host);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * 更新图床配置
   */
  updateHost(id: string, updates: Partial<ImageHostConfig>): boolean {
    const index = this.state.hosts.findIndex(h => h.id === id);
    if (index === -1) return false;

    this.state.hosts[index] = { ...this.state.hosts[index], ...updates };
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  /**
   * 删除图床配置
   */
  removeHost(id: string): boolean {
    const index = this.state.hosts.findIndex(h => h.id === id);
    if (index === -1) return false;

    this.state.hosts.splice(index, 1);
    // 同时删除该图床的所有链接
    this.state.links = this.state.links.filter(link => link.hostId !== id);
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  /**
   * 获取图床配置
   */
  getHost(id: string): ImageHostConfig | undefined {
    return this.state.hosts.find(h => h.id === id);
  }

  /**
   * 获取所有图床配置
   */
  getAllHosts(): ImageHostConfig[] {
    return [...this.state.hosts];
  }

  /**
   * 上传图片到图床（预留接口）
   * @param localPath 本地图片路径
   * @param hostId 图床 ID
   * @returns 上传结果
   */
  async uploadImage(localPath: string, hostId: string): Promise<UploadResult> {
    const host = this.getHost(hostId);
    if (!host) {
      return { success: false, error: '图床配置不存在' };
    }

    // 模拟上传进度
    this.updateUploadProgress(localPath, {
      localPath,
      progress: 0,
      status: 'uploading',
    });

    // TODO: 实现具体的图床 API 对接
    // 这里只是模拟上传过程
    return new Promise(resolve => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        this.updateUploadProgress(localPath, {
          localPath,
          progress,
          status: 'uploading',
        });

        if (progress >= 100) {
          clearInterval(interval);

          // 模拟上传成功
          const remoteUrl = `https://example.com/images/${Date.now()}.png`;
          const link: ImageHostLink = {
            localPath,
            remoteUrl,
            hostId,
            uploadedAt: new Date().toISOString(),
          };

          this.state.links.push(link);
          this.updateUploadProgress(localPath, {
            localPath,
            progress: 100,
            status: 'success',
          });
          this.saveToStorage();
          this.notifyListeners();

          resolve({ success: true, remoteUrl });
        }
      }, 200);

      // 模拟上传失败的情况（可选）
      // setTimeout(() => {
      //   clearInterval(interval);
      //   this.updateUploadProgress(localPath, {
      //     localPath,
      //     progress: 0,
      //     status: 'error',
      //     error: '上传失败',
      //   });
      //   resolve({ success: false, error: '上传失败' });
      // }, 1000);
    });
  }

  /**
   * 更新上传进度
   */
  private updateUploadProgress(localPath: string, progress: UploadProgress): void {
    this.state.uploadProgress.set(localPath, progress);
    this.notifyListeners();
  }

  /**
   * 获取上传进度
   */
  getUploadProgress(localPath: string): UploadProgress | undefined {
    return this.state.uploadProgress.get(localPath);
  }

  /**
   * 清除上传进度
   */
  clearUploadProgress(localPath: string): void {
    this.state.uploadProgress.delete(localPath);
    this.notifyListeners();
  }

  /**
   * 获取所有已上传链接
   */
  getAllLinks(): ImageHostLink[] {
    return [...this.state.links];
  }

  /**
   * 根据本地路径查找链接
   */
  getLinkByLocalPath(localPath: string): ImageHostLink | undefined {
    return this.state.links.find(link => link.localPath === localPath);
  }

  /**
   * 删除链接
   */
  removeLink(localPath: string): boolean {
    const index = this.state.links.findIndex(link => link.localPath === localPath);
    if (index === -1) return false;

    this.state.links.splice(index, 1);
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  /**
   * 生成唯一 ID
   */
  static generateId(): string {
    return `host_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
