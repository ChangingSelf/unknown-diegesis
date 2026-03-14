export {};

declare global {
  interface Window {
    electronAPI: {
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
      fileSave: (
        path: string,
        content: string
      ) => Promise<{
        success: boolean;
        error?: string;
      }>;
      fileSave: (
        path: string,
        content: string
      ) => Promise<{
        success: boolean;
        error?: string;
      }>;
      fileSaveAs: (content: string) => Promise<{
        success: boolean;
        path?: string;
        error?: string;
      }>;
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
      fileStat: (path: string) => Promise<{
        success: boolean;
        mtime?: string;
        size?: number;
        error?: string;
      }>;
      workspaceOpen: () => Promise<{
        success: boolean;
        path?: string;
        error?: string;
      }>;
      workspaceCreate: (
        path: string,
        name: string
      ) => Promise<{
        success: boolean;
        error?: string;
      }>;
      workspaceReadDir: (path: string) => Promise<{
        success: boolean;
        files?: string[];
        error?: string;
      }>;
      workspaceMkdir: (path: string) => Promise<{
        success: boolean;
        error?: string;
      }>;
      workspaceDelete: (path: string) => Promise<{
        success: boolean;
        error?: string;
      }>;
      workspaceMove: (
        oldPath: string,
        newPath: string
      ) => Promise<{
        success: boolean;
        error?: string;
      }>;
      workspaceCopyFile: (
        source: string,
        destination: string
      ) => Promise<{
        success: boolean;
        path?: string;
        error?: string;
      }>;
      workspaceReadFile: (filePath: string) => Promise<{
        success: boolean;
        content?: string;
        error?: string;
      }>;
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
