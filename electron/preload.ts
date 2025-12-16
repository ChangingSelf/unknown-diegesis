import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作 API
  fileOpen: () => ipcRenderer.invoke('file:open'),
  fileSave: (path: string, content: string) => ipcRenderer.invoke('file:save', { path, content }),
  fileSaveAs: (content: string) => ipcRenderer.invoke('file:saveAs', { content }),
  fileExists: (path: string) => ipcRenderer.invoke('file:exists', { path }),
  fileStat: (path: string) => ipcRenderer.invoke('file:stat', { path }),
})

// Type declarations for the exposed API
declare global {
  interface Window {
    electronAPI: {
      fileOpen: () => Promise<{ success: boolean; path?: string; content?: string; error?: string }>;
      fileSave: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
      fileSaveAs: (content: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      fileExists: (path: string) => Promise<{ exists: boolean }>;
      fileStat: (path: string) => Promise<{ success: boolean; mtime?: string; size?: number; error?: string }>;
    }
  }
}