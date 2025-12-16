/**
 * 自动保存管理器
 * 负责管理自动保存的防抖、节流和重试逻辑
 */
export class AutoSaveManager {
  private debounceTimer: NodeJS.Timeout | null = null;
  private periodicTimer: NodeJS.Timeout | null = null;
  private saveCallback: (() => Promise<boolean>) | null = null;
  private enabled: boolean = true;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  // 配置参数
  private debounceDelay: number = 3000; // 3秒防抖
  private periodicInterval: number = 300000; // 5分钟定期保存

  constructor(saveCallback?: () => Promise<boolean>) {
    if (saveCallback) {
      this.saveCallback = saveCallback;
    }
  }

  /**
   * 设置保存回调函数
   */
  setSaveCallback(callback: () => Promise<boolean>) {
    this.saveCallback = callback;
  }

  /**
   * 启用自动保存
   */
  enable() {
    this.enabled = true;
    this.startPeriodicSave();
  }

  /**
   * 禁用自动保存
   */
  disable() {
    this.enabled = false;
    this.stopPeriodicSave();
    this.clearDebounceTimer();
  }

  /**
   * 内容修改时触发（防抖保存）
   */
  onContentChange() {
    if (!this.enabled) return;

    this.clearDebounceTimer();
    
    this.debounceTimer = setTimeout(() => {
      this.executeSave();
    }, this.debounceDelay);
  }

  /**
   * 立即保存
   */
  async saveNow(): Promise<boolean> {
    this.clearDebounceTimer();
    return this.executeSave();
  }

  /**
   * 执行保存
   */
  private async executeSave(): Promise<boolean> {
    if (!this.saveCallback) {
      console.warn('Save callback not set');
      return false;
    }

    try {
      const success = await this.saveCallback();
      
      if (success) {
        this.retryCount = 0;
        return true;
      } else {
        return this.handleSaveFailure();
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      return this.handleSaveFailure();
    }
  }

  /**
   * 处理保存失败
   */
  private async handleSaveFailure(): Promise<boolean> {
    this.retryCount++;

    if (this.retryCount < this.maxRetries) {
      // 等待30秒后重试
      await new Promise(resolve => setTimeout(resolve, 30000));
      return this.executeSave();
    } else {
      console.error('Auto-save failed after max retries');
      this.retryCount = 0;
      return false;
    }
  }

  /**
   * 启动定期保存
   */
  private startPeriodicSave() {
    this.stopPeriodicSave();
    
    this.periodicTimer = setInterval(() => {
      this.executeSave();
    }, this.periodicInterval);
  }

  /**
   * 停止定期保存
   */
  private stopPeriodicSave() {
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
      this.periodicTimer = null;
    }
  }

  /**
   * 清除防抖定时器
   */
  private clearDebounceTimer() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * 设置防抖延迟
   */
  setDebounceDelay(delay: number) {
    this.debounceDelay = delay;
  }

  /**
   * 设置定期保存间隔
   */
  setPeriodicInterval(interval: number) {
    this.periodicInterval = interval;
    if (this.enabled) {
      this.startPeriodicSave();
    }
  }

  /**
   * 清理资源
   */
  destroy() {
    this.disable();
    this.saveCallback = null;
  }
}
