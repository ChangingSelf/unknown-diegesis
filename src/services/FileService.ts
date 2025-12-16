import { FileState, FileOperationResult, SaveStatus } from '../types/block';

/**
 * 文件服务类
 * 负责文件操作和状态管理
 */
export class FileService {
  private fileState: FileState;
  private listeners: Set<(state: FileState) => void> = new Set();

  constructor() {
    this.fileState = {
      currentFilePath: null,
      isModified: false,
      lastSavedTime: null,
      autoSaveEnabled: true,
      fileFormat: 'udn',
      saveStatus: 'saved',
    };
  }

  /**
   * 获取当前文件状态
   */
  getState(): FileState {
    return { ...this.fileState };
  }

  /**
   * 订阅文件状态变化
   */
  subscribe(listener: (state: FileState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知状态变化
   */
  private notify() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  /**
   * 更新文件状态
   */
  private updateState(updates: Partial<FileState>) {
    this.fileState = { ...this.fileState, ...updates };
    this.notify();
  }

  /**
   * 打开文件
   */
  async openFile(): Promise<FileOperationResult> {
    try {
      if (!window.electronAPI) {
        return { success: false, error: 'Electron API not available' };
      }

      const result = await window.electronAPI.fileOpen();
      
      if (result.success && result.path && result.content) {
        const format = this.detectFileFormat(result.path);
        this.updateState({
          currentFilePath: result.path,
          isModified: false,
          lastSavedTime: new Date(),
          fileFormat: format,
          saveStatus: 'saved',
        });
      }

      return result;
    } catch (error) {
      console.error('Error opening file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 保存文件
   */
  async saveFile(content: string): Promise<FileOperationResult> {
    const { currentFilePath } = this.fileState;

    if (!currentFilePath) {
      // 如果没有当前文件路径，则另存为
      return this.saveFileAs(content);
    }

    try {
      if (!window.electronAPI) {
        return { success: false, error: 'Electron API not available' };
      }

      this.updateState({ saveStatus: 'saving' });

      const result = await window.electronAPI.fileSave(currentFilePath, content);

      if (result.success) {
        this.updateState({
          isModified: false,
          lastSavedTime: new Date(),
          saveStatus: 'saved',
        });
      } else {
        this.updateState({ saveStatus: 'error' });
      }

      return { ...result, path: currentFilePath };
    } catch (error) {
      console.error('Error saving file:', error);
      this.updateState({ saveStatus: 'error' });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 另存为
   */
  async saveFileAs(content: string): Promise<FileOperationResult> {
    try {
      if (!window.electronAPI) {
        return { success: false, error: 'Electron API not available' };
      }

      this.updateState({ saveStatus: 'saving' });

      const result = await window.electronAPI.fileSaveAs(content);

      if (result.success && result.path) {
        const format = this.detectFileFormat(result.path);
        this.updateState({
          currentFilePath: result.path,
          isModified: false,
          lastSavedTime: new Date(),
          fileFormat: format,
          saveStatus: 'saved',
        });
      } else {
        this.updateState({ saveStatus: 'error' });
      }

      return result;
    } catch (error) {
      console.error('Error saving file:', error);
      this.updateState({ saveStatus: 'error' });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 标记文件已修改
   */
  markAsModified() {
    if (!this.fileState.isModified) {
      this.updateState({
        isModified: true,
        saveStatus: 'modified',
      });
    }
  }

  /**
   * 创建新文件
   */
  createNewFile() {
    this.updateState({
      currentFilePath: null,
      isModified: false,
      lastSavedTime: null,
      fileFormat: 'udn',
      saveStatus: 'saved',
    });
  }

  /**
   * 检测文件格式
   */
  private detectFileFormat(filePath: string): 'md' | 'udn' | 'txt' {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (ext === 'md') return 'md';
    if (ext === 'udn') return 'udn';
    return 'txt';
  }

  /**
   * 获取文件名
   */
  getFileName(): string {
    if (!this.fileState.currentFilePath) {
      return 'Untitled';
    }
    return this.fileState.currentFilePath.split(/[\\/]/).pop() || 'Untitled';
  }

  /**
   * 设置自动保存
   */
  setAutoSaveEnabled(enabled: boolean) {
    this.updateState({ autoSaveEnabled: enabled });
  }
}
