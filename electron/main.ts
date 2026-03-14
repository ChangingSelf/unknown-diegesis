import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { readFile, writeFile, stat, mkdir, readdir, rm, rename, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { WORKSPACE_SCHEMA_VERSION, INDEX_SCHEMA_VERSION } from '../src/constants/versions';

const isDev = process.env.NODE_ENV === 'development';

function normalizePath(path: string): string {
  return path.replace(/\//g, '\\');
}

// 注册文件操作 IPC handlers
function registerFileHandlers() {
  // 打开文件
  ipcMain.handle('file:open', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: '支持的文件', extensions: ['md', 'udn', 'txt', 'json'] },
          { name: 'Markdown', extensions: ['md'] },
          { name: '未知叙事文档', extensions: ['udn'] },
          { name: '纯文本', extensions: ['txt'] },
          { name: 'JSON', extensions: ['json'] },
          { name: '所有文件', extensions: ['*'] },
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: 'User canceled' };
      }

      const filePath = result.filePaths[0];
      const content = await readFile(filePath, 'utf-8');

      return {
        success: true,
        path: filePath,
        content,
      };
    } catch (error) {
      console.error('Error opening file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  ipcMain.handle('file:openWithPath', async (_, { path }: { path: string }) => {
    try {
      const content = await readFile(path, 'utf-8');
      return {
        success: true,
        path,
        content,
      };
    } catch (error) {
      console.error('Error opening file with path:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // === 工作区相关 IPC handlers ===

  // 打开工作区（选择文件夹）
  ipcMain.handle('workspace:open', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: '选择工作区文件夹',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: 'User canceled' };
      }

      return { success: true, path: result.filePaths[0] };
    } catch (error) {
      console.error('Error opening workspace:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // 创建工作区目录结构
  ipcMain.handle('workspace:create', async (_, { path, name }: { path: string; name: string }) => {
    try {
      // 新目录结构 v2.0
      const dirs = [
        path,
        join(path, 'story'),
        join(path, 'materials'),
        join(path, 'materials', 'characters'),
        join(path, 'materials', 'locations'),
        join(path, 'materials', 'items'),
        join(path, 'materials', 'worldviews'),
        join(path, 'materials', 'outlines'),
        join(path, 'materials', 'notes'),
        join(path, 'assets'),
        join(path, 'assets', 'images'),
        join(path, 'assets', 'images', 'characters'),
        join(path, 'assets', 'images', 'scenes'),
        join(path, 'assets', 'images', 'illustrations'),
        join(path, 'assets', 'documents'),
        join(path, 'assets', 'audio'),
        join(path, 'assets', 'video'),
        join(path, '.index'),
      ];

      for (const dir of dirs) {
        await mkdir(dir, { recursive: true });
      }

      const now = new Date().toISOString();
      const id = randomUUID().replace(/-/g, '').slice(0, 12);

      // 创建 workspace.json (新格式)
      const workspace = {
        schemaVersion: WORKSPACE_SCHEMA_VERSION,
        id,
        title: name,
        author: '',
        genre: '',
        description: '',
        wordCount: 0,
        chapterCount: 0,
        created: now,
        modified: now,
        settings: {
          autoSave: true,
          autoSaveInterval: 3000,
          defaultBlockType: 'paragraph',
        },
      };

      await writeFile(join(path, 'workspace.json'), JSON.stringify(workspace, null, 2));

      // 创建索引文件
      const storyIndex = {
        schemaVersion: INDEX_SCHEMA_VERSION,
        lastUpdated: now,
        documents: {},
        byFolder: {},
      };

      const materialsIndex = {
        schemaVersion: INDEX_SCHEMA_VERSION,
        lastUpdated: now,
        documents: {},
        byType: {
          character: [],
          location: [],
          item: [],
          worldview: [],
          outline: [],
          timeline: [],
          note: [],
        },
      };

      const assetsIndex = {
        schemaVersion: INDEX_SCHEMA_VERSION,
        lastUpdated: now,
        assets: {},
      };

      await writeFile(join(path, '.index', 'story.json'), JSON.stringify(storyIndex, null, 2));
      await writeFile(
        join(path, '.index', 'materials.json'),
        JSON.stringify(materialsIndex, null, 2)
      );
      await writeFile(join(path, '.index', 'assets.json'), JSON.stringify(assetsIndex, null, 2));

      return { success: true };
    } catch (error) {
      console.error('Error creating workspace:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // 读取目录内容
  ipcMain.handle('workspace:readDir', async (_, { path }: { path: string }) => {
    try {
      const files = await readdir(normalizePath(path));
      return { success: true, files };
    } catch (error) {
      console.error('Error reading directory:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // 创建目录
  ipcMain.handle('workspace:mkdir', async (_, { path }: { path: string }) => {
    try {
      await mkdir(normalizePath(path), { recursive: true });
      return { success: true };
    } catch (error) {
      console.error('Error creating directory:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // 删除文件/目录
  ipcMain.handle('workspace:delete', async (_, { path }: { path: string }) => {
    try {
      const normalizedPath = normalizePath(path);
      const stats = await stat(normalizedPath);
      if (stats.isDirectory()) {
        await rm(normalizedPath, { recursive: true, force: true });
      } else {
        await rm(normalizedPath);
      }
      return { success: true };
    } catch (error) {
      console.error('Error deleting:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // 移动/重命名
  ipcMain.handle(
    'workspace:move',
    async (_, { oldPath, newPath }: { oldPath: string; newPath: string }) => {
      try {
        await rename(normalizePath(oldPath), normalizePath(newPath));
        return { success: true };
      } catch (error) {
        console.error('Error moving:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  );

  // 复制文件
  ipcMain.handle(
    'workspace:copyFile',
    async (_, { source, destination }: { source: string; destination: string }) => {
      try {
        await copyFile(normalizePath(source), normalizePath(destination));
        return { success: true, path: destination };
      } catch (error) {
        console.error('Error copying file:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  );

  // 读取文件内容
  ipcMain.handle('workspace:readFile', async (_, { filePath }: { filePath: string }) => {
    try {
      const content = await readFile(normalizePath(filePath), 'utf-8');
      return { success: true, content };
    } catch (error) {
      console.error('Error reading file:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // 写入文件内容
  ipcMain.handle(
    'workspace:writeFile',
    async (_, { filePath, content }: { filePath: string; content: string }) => {
      try {
        const normalizedPath = normalizePath(filePath);
        const parentDir = join(normalizedPath, '..');

        if (!existsSync(parentDir)) {
          await mkdir(parentDir, { recursive: true });
        }

        await writeFile(normalizedPath, content, 'utf-8');
        return { success: true };
      } catch (error) {
        console.error('Error writing file:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  );

  // 保存文件
  ipcMain.handle('file:save', async (_, { path, content }: { path: string; content: string }) => {
    try {
      // 验证路径安全性
      if (!path || path.includes('..')) {
        return { success: false, error: 'Invalid path' };
      }

      await writeFile(path, content, 'utf-8');

      return { success: true };
    } catch (error) {
      console.error('Error saving file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // 另存为
  ipcMain.handle('file:saveAs', async (_, { content }: { content: string }) => {
    try {
      const result = await dialog.showSaveDialog({
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: '未知叙事文档', extensions: ['udn'] },
          { name: '纯文本', extensions: ['txt'] },
          { name: 'JSON', extensions: ['json'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'User canceled' };
      }

      await writeFile(result.filePath, content, 'utf-8');

      return {
        success: true,
        path: result.filePath,
      };
    } catch (error) {
      console.error('Error saving file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // 带附件的 Markdown 导出
  ipcMain.handle(
    'file:exportMarkdownWithAssets',
    async (
      _,
      {
        content,
        images,
      }: {
        content: string;
        images: Array<{ originalPath: string; fileName: string }>;
      }
    ) => {
      try {
        const result = await dialog.showSaveDialog({
          filters: [{ name: 'Markdown', extensions: ['md'] }],
          defaultPath: 'document.md',
        });

        if (result.canceled || !result.filePath) {
          return { success: false, error: 'User canceled' };
        }

        const markdownPath = result.filePath;
        const assetsDir = join(markdownPath.replace(/\.md$/i, '') + '_assets');

        await mkdir(assetsDir, { recursive: true });

        for (const img of images) {
          const destPath = join(assetsDir, img.fileName);
          await copyFile(img.originalPath, destPath);
        }

        await writeFile(markdownPath, content, 'utf-8');

        return {
          success: true,
          path: markdownPath,
          assetsDir,
        };
      } catch (error) {
        console.error('Error exporting markdown with assets:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // 检查文件是否存在
  ipcMain.handle('file:exists', async (_, { path }: { path: string }) => {
    try {
      return { exists: existsSync(path) };
    } catch (error) {
      return { exists: false };
    }
  });

  // 获取文件信息
  ipcMain.handle('file:stat', async (_, { path }: { path: string }) => {
    try {
      const stats = await stat(path);
      return {
        success: true,
        mtime: stats.mtime.toISOString(),
        size: stats.size,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Prompt 对话框 - 选择文件夹
  ipcMain.handle(
    'prompt',
    async (
      _event,
      { message, defaultValue: _defaultValue }: { message: string; defaultValue?: string }
    ) => {
      try {
        const result = await dialog.showOpenDialog({
          title: message,
          properties: ['openDirectory', 'createDirectory'],
          buttonLabel: '选择',
        });

        if (result.canceled || result.filePaths.length === 0) {
          return null;
        }

        return result.filePaths[0];
      } catch (error) {
        console.error('Error in prompt:', error);
        return null;
      }
    }
  );

  // 配置存储 IPC handlers
  const userDataPath = app.getPath('userData');
  const configPath = join(userDataPath, 'config');
  const recentWorkspacesPath = join(configPath, 'recent-workspaces.json');

  ipcMain.handle('config:getRecentWorkspaces', async () => {
    try {
      if (!existsSync(recentWorkspacesPath)) {
        return { success: true, data: [] };
      }
      const content = await readFile(recentWorkspacesPath, 'utf-8');
      return { success: true, data: JSON.parse(content) };
    } catch (error) {
      console.error('Error reading recent workspaces:', error);
      return { success: true, data: [] };
    }
  });

  ipcMain.handle('config:saveRecentWorkspaces', async (_, workspaces: unknown[]) => {
    try {
      if (!existsSync(configPath)) {
        await mkdir(configPath, { recursive: true });
      }
      await writeFile(recentWorkspacesPath, JSON.stringify(workspaces, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      console.error('Error saving recent workspaces:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
}

function createWindow(): void {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready-to-show
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    // Dereference the window object
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // 注册文件操作 IPC handlers
  registerFileHandlers();

  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, app and menu bar stay active until user quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: prevent new window creation
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    // Instead of creating a new window, open in external browser
    shell.openExternal(url);
    return { action: 'deny' };
  });
});
