import { Editor as TiptapEditor } from '@tiptap/react';
import { EditorState } from '@tiptap/pm/state';

/**
 * 文档编辑器状态快照
 */
export interface DocumentState {
  content: object;
  editorState: EditorState;
  scrollPosition?: number;
  timestamp: number;
}

/**
 * 文档状态管理器
 * 负责管理多个文档的编辑器状态（EditorState）
 */
export class DocumentStateManager {
  private states: Map<string, DocumentState> = new Map();
  private listeners: Set<(docId: string, state: DocumentState) => void> = new Set();

  /**
   * 保存文档状态
   * @param docId 文档ID
   * @param editor Tiptap编辑器实例
   */
  saveState(docId: string, editor: TiptapEditor): void {
    const state: DocumentState = {
      content: editor.getJSON(),
      editorState: editor.state,
      scrollPosition: 0,
      timestamp: Date.now(),
    };

    this.states.set(docId, state);
    this.notify(docId, state);
  }

  /**
   * 获取文档状态
   * @param docId 文档ID
   * @returns 文档状态，如果不存在则返回 undefined
   */
  getState(docId: string): DocumentState | undefined {
    return this.states.get(docId);
  }

  /**
   * 检查是否存在文档状态
   * @param docId 文档ID
   * @returns 是否存在
   */
  hasState(docId: string): boolean {
    return this.states.has(docId);
  }

  /**
   * 删除文档状态
   * @param docId 文档ID
   */
  removeState(docId: string): void {
    this.states.delete(docId);
  }

  /**
   * 清理不在列表中的状态
   * @param keepDocIds 要保留的文档ID列表
   */
  cleanup(keepDocIds: string[]): void {
    const keepSet = new Set(keepDocIds);
    const toDelete: string[] = [];

    this.states.forEach((_, docId) => {
      if (!keepSet.has(docId)) {
        toDelete.push(docId);
      }
    });

    toDelete.forEach(docId => this.removeState(docId));
  }

  /**
   * 订阅状态变化
   * @param listener 监听器函数
   * @returns 取消订阅函数
   */
  subscribe(listener: (docId: string, state: DocumentState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知状态变化
   */
  private notify(docId: string, state: DocumentState): void {
    this.listeners.forEach(listener => listener(docId, state));
  }

  /**
   * 获取所有文档ID
   * @returns 文档ID数组
   */
  getAllDocIds(): string[] {
    return Array.from(this.states.keys());
  }

  /**
   * 清空所有状态
   */
  clear(): void {
    this.states.clear();
  }
}
