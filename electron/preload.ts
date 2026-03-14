import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作 API
  fileOpen: () => ipcRenderer.invoke('file:open'),
  fileOpenWithPath: (path: string) => ipcRenderer.invoke('file:openWithPath', { path }),
  fileSave: (path: string, content: string) => ipcRenderer.invoke('file:save', { path, content }),
  fileSaveAs: (content: string) => ipcRenderer.invoke('file:saveAs', { content }),
  fileExportMarkdownWithAssets: (
    content: string,
    images: Array<{ originalPath: string; fileName: string }>
  ) => ipcRenderer.invoke('file:exportMarkdownWithAssets', { content, images }),
  fileExists: (path: string) => ipcRenderer.invoke('file:exists', { path }),
  fileStat: (path: string) => ipcRenderer.invoke('file:stat', { path }),

  // 工作区操作 API
  workspaceOpen: () => ipcRenderer.invoke('workspace:open'),
  workspaceCreate: (path: string, name: string) =>
    ipcRenderer.invoke('workspace:create', { path, name }),
  workspaceReadDir: (path: string) => ipcRenderer.invoke('workspace:readDir', { path }),
  workspaceMkdir: (path: string) => ipcRenderer.invoke('workspace:mkdir', { path }),
  workspaceDelete: (path: string) => ipcRenderer.invoke('workspace:delete', { path }),
  workspaceMove: (oldPath: string, newPath: string) =>
    ipcRenderer.invoke('workspace:move', { oldPath, newPath }),
  workspaceCopyFile: (source: string, destination: string) =>
    ipcRenderer.invoke('workspace:copyFile', { source, destination }),
  workspaceReadFile: (filePath: string) => ipcRenderer.invoke('workspace:readFile', { filePath }),
  workspaceWriteFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('workspace:writeFile', { filePath, content }),
  prompt: (message: string, defaultValue?: string) =>
    ipcRenderer.invoke('prompt', { message, defaultValue }),

  // 配置存储 API
  configGetRecentWorkspaces: () => ipcRenderer.invoke('config:getRecentWorkspaces'),
  configSaveRecentWorkspaces: (workspaces: unknown[]) =>
    ipcRenderer.invoke('config:saveRecentWorkspaces', workspaces),
});

// Type declarations for the exposed API
declare global {
  interface Window {
    electronAPI: {
      // 文件操作
      fileOpen: () => Promise<{
        success: boolean;
        path?: string;
        content?: string;
        error?: string;
      }>;
      fileOpenWithPath: (path: string) => Promise<{
        success: boolean;
        path?: string;
        content?: string;
        error?: string;
      }>;
      fileSave: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
      fileSaveAs: (content: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      fileExportMarkdownWithAssets: (
        content: string,
        images: Array<{ originalPath: string; fileName: string }>
      ) => Promise<{
        success: boolean;
        path?: string;
        assetsDir?: string;
        error?: string;
      }>;
      fileExists: (path: string) => Promise<{ exists: boolean }>;
      fileStat: (
        path: string
      ) => Promise<{ success: boolean; mtime?: string; size?: number; error?: string }>;
      // 工作区操作
      workspaceOpen: () => Promise<{ success: boolean; path?: string; error?: string }>;
      workspaceCreate: (
        path: string,
        name: string
      ) => Promise<{ success: boolean; error?: string }>;
      workspaceReadDir: (
        path: string
      ) => Promise<{ success: boolean; files?: string[]; error?: string }>;
      workspaceMkdir: (path: string) => Promise<{ success: boolean; error?: string }>;
      workspaceDelete: (path: string) => Promise<{ success: boolean; error?: string }>;
      workspaceMove: (
        oldPath: string,
        newPath: string
      ) => Promise<{ success: boolean; error?: string }>;
      workspaceCopyFile: (
        source: string,
        destination: string
      ) => Promise<{ success: boolean; path?: string; error?: string }>;
      workspaceReadFile: (
        filePath: string
      ) => Promise<{ success: boolean; content?: string; error?: string }>;
      workspaceWriteFile: (
        filePath: string,
        content: string
      ) => Promise<{
        success: boolean;
        error?: string;
      }>;
      prompt: (message: string, defaultValue?: string) => Promise<string | null>;
      configGetRecentWorkspaces: () => Promise<{
        success: boolean;
        data?: unknown[];
        error?: string;
      }>;
      configSaveRecentWorkspaces: (workspaces: unknown[]) => Promise<{
        success: boolean;
        error?: string;
      }>;
    };
  }
}
