import { app, BrowserWindow, shell, ipcMain, dialog, protocol, net } from 'electron';
import { join, dirname } from 'path';
import { pathToFileURL } from 'url';
import { readFile, writeFile, stat, mkdir, readdir, rm, rename, copyFile } from 'fs/promises';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { WORKSPACE_SCHEMA_VERSION, INDEX_SCHEMA_VERSION } from '../src/constants/versions';

// Global variable to store the current workspace path
declare global {
  var currentWorkspacePath: string | null;
}

const isDev = process.env.NODE_ENV === 'development';

// Register workspace protocol scheme BEFORE app.whenReady()
// This is required by Electron for custom protocols to work properly
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'workspace',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

function normalizePath(path: string): string {
  return path.replace(/\//g, '\\');
}

function registerWorkspaceProtocol() {
  protocol.handle('workspace', request => {
    const url = request.url;
    console.log('[workspace://] request.url:', url);

    let relativePath = url.slice('workspace://'.length);

    // Decode URL encoding (e.g., %20 -> space, %2F -> /)
    try {
      relativePath = decodeURIComponent(relativePath);
    } catch (e) {
      console.warn('[workspace://] decodeURIComponent failed:', e);
    }

    console.log('[workspace://] relativePath:', relativePath);

    const workspacePath = global.currentWorkspacePath;
    console.log('[workspace://] workspacePath:', workspacePath);

    if (!workspacePath) {
      console.error('[workspace://] No workspace path set! Cannot resolve:', url);
      return new Response(null, { status: 404 });
    }

    const absolutePath = join(workspacePath, relativePath);
    console.log('[workspace://] absolutePath:', absolutePath);

    // Use pathToFileURL to properly encode Windows paths (handles drive letters, colons, etc.)
    const fileUrl = pathToFileURL(absolutePath).href;
    console.log('[workspace://] fileUrl:', fileUrl);
    return net.fetch(fileUrl);
  });
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

      global.currentWorkspacePath = result.filePaths[0];
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

      global.currentWorkspacePath = path;
      return { success: true };
    } catch (error) {
      console.error('Error creating workspace:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('workspace:syncPath', async (_, { path }: { path: string }) => {
    global.currentWorkspacePath = path;
    return { success: true };
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
    async (
      _,
      { filePath, content, isBase64 }: { filePath: string; content: string; isBase64?: boolean }
    ) => {
      try {
        const normalizedPath = normalizePath(filePath);
        const parentDir = join(normalizedPath, '..');

        if (!existsSync(parentDir)) {
          await mkdir(parentDir, { recursive: true });
        }

        // 如果 content 是 Base64 编码，先解码为二进制
        let writeContent: Buffer | string = content;
        if (isBase64) {
          writeContent = Buffer.from(content, 'base64');
        }

        await writeFile(normalizedPath, writeContent);
        return { success: true };
      } catch (error) {
        console.error('Error writing file:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
  );

  // image:save
  ipcMain.handle(
    'image:save',
    async (
      _,
      {
        workspacePath,
        base64Data,
        originalName,
      }: { workspacePath: string; base64Data: string; originalName: string }
    ) => {
      try {
        // 1. Generate UUID filename with original extension
        let ext = '';
        const dotIdx = originalName.lastIndexOf('.');
        if (dotIdx !== -1) {
          ext = originalName.substring(dotIdx);
        }
        const filename = randomUUID() + ext;

        // 2. Build full path: workspacePath/assets/images/illustrations/filename
        const targetDir = join(workspacePath, 'assets', 'images', 'illustrations');
        const fullPath = join(targetDir, filename);
        const normalizedPath = normalizePath(fullPath);

        // 3. Ensure directory exists
        const parentDir = join(normalizedPath, '..');
        if (!existsSync(parentDir)) {
          await mkdir(parentDir, { recursive: true });
        }

        // 4. Strip data URL prefix if present
        let data = base64Data;
        if (data.startsWith('data:')) {
          const comma = data.indexOf(',');
          if (comma !== -1) {
            data = data.substring(comma + 1);
          }
        }

        // 5. Decode base64 and write file
        const buffer = Buffer.from(data, 'base64');
        await writeFile(normalizedPath, buffer);

        // 6. Return relative path
        const relativePath = `./assets/images/illustrations/${filename}`;
        return { success: true, relativePath };
      } catch (error) {
        console.error('Error saving image:', error);
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

  // 导出 Markdown 并复制图片资源
  ipcMain.handle(
    'file:exportMarkdownWithAssets',
    async (
      _,
      {
        content,
        images,
      }: { content: string; images: Array<{ originalPath: string; fileName: string }> }
    ) => {
      try {
        const result = await dialog.showSaveDialog({
          filters: [{ name: 'Markdown', extensions: ['md'] }],
        });

        if (result.canceled || !result.filePath) {
          return { success: false, error: 'User canceled' };
        }

        const exportDir = dirname(result.filePath);
        const assetsDir = join(exportDir, 'assets');

        // 创建 assets 目录
        if (!existsSync(assetsDir)) {
          mkdirSync(assetsDir, { recursive: true });
        }

        // 复制图片文件
        for (const image of images) {
          const sourcePath = image.originalPath;
          const destPath = join(assetsDir, image.fileName);

          if (existsSync(sourcePath)) {
            copyFileSync(sourcePath, destPath);
          }
        }

        // 写入 Markdown 文件
        await writeFile(result.filePath, content, 'utf-8');

        return {
          success: true,
          path: result.filePath,
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

  // 导出 Word 文档
  ipcMain.handle(
    'file:exportWord',
    async (_, { document, title }: { document: unknown; title?: string }) => {
      console.log('[ExportWord] Starting export, title:', title);
      try {
        const result = await dialog.showSaveDialog({
          filters: [{ name: 'Word 文档', extensions: ['docx'] }],
          defaultPath: `${title || 'document'}.docx`,
        });

        console.log('[ExportWord] Dialog result:', result);

        if (result.canceled || !result.filePath) {
          return { success: false, error: 'User canceled' };
        }

        console.log('[ExportWord] Converting document...');
        const doc = convertTiptapToDocx(document as TiptapDocument);
        console.log('[ExportWord] Generating buffer...');
        const buffer = await Packer.toBuffer(doc);
        console.log('[ExportWord] Writing file...');
        await writeFile(result.filePath, buffer);
        console.log('[ExportWord] Done!');

        return {
          success: true,
          path: result.filePath,
        };
      } catch (error) {
        console.error('[ExportWord] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

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

  ipcMain.handle(
    'dialog:showError',
    async (_, { title, message }: { title: string; message: string }) => {
      await dialog.showMessageBox({
        type: 'error',
        title,
        message,
        buttons: ['确定'],
      });
      return { success: true };
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
  registerWorkspaceProtocol();

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

function convertColorToHex(color: string): string | undefined {
  if (!color) return undefined;

  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color.substring(1);
  }

  const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  const colorNames: Record<string, string> = {
    black: '000000',
    white: 'FFFFFF',
    red: 'FF0000',
    green: '008000',
    blue: '0000FF',
    yellow: 'FFFF00',
    cyan: '00FFFF',
    magenta: 'FF00FF',
    gray: '808080',
    grey: '808080',
    orange: 'FFA500',
    purple: '800080',
    pink: 'FFC0CB',
    brown: 'A52A2A',
    navy: '000080',
    teal: '008080',
    olive: '808000',
    maroon: '800000',
    silver: 'C0C0C0',
    lime: '00FF00',
    aqua: '00FFFF',
    fuchsia: 'FF00FF',
    indigo: '4B0082',
    gold: 'FFD700',
    violet: 'EE82EE',
    skyblue: '87CEEB',
    coral: 'FF7F50',
    tomato: 'FF6347',
    salmon: 'FA8072',
    peachpuff: 'FFDAB9',
    wheat: 'F5DEB3',
    tan: 'D2B48C',
    chocolate: 'D2691E',
    crimson: 'DC143C',
    deeppink: 'FF1493',
    hotpink: 'FF69B4',
    lavender: 'E6E6FA',
    plum: 'DDA0DD',
    orchid: 'DA70D6',
    violet2: 'EE82EE',
    cornflowerblue: '6495ED',
    dodgerblue: '1E90FF',
    steelblue: '4682B4',
    royalblue: '4169E1',
    midnightblue: '191970',
    darkslateblue: '483D8B',
    slateblue: '6A5ACD',
    mediumslateblue: '7B68EE',
    mediumpurple: '9370DB',
    mediumorchid: 'BA55D3',
    mediumvioletred: 'C71585',
    deepskyblue: '00BFFF',
    lightskyblue: '87CEFA',
    lightblue: 'ADD8E6',
    lightcyan: 'E0FFFF',
    paleturquoise: 'AFEEEE',
    turquoise: '40E0D0',
    mediumturquoise: '48D1CC',
    darkturquoise: '00CED1',
    cadetblue: '5F9EA0',
    darkcyan: '008B8B',
    darkmagenta: '8B008B',
    darkred: '8B0000',
    darkgreen: '006400',
    darkblue: '00008B',
    darkorange: 'FF8C00',
    darkviolet: '9400D3',
    palevioletred: 'DB7093',
    sandybrown: 'F4A460',
    rosybrown: 'BC8F8F',
    mediumaquamarine: '66CDAA',
    darkseagreen: '8FBC8F',
    lightseagreen: '20B2AA',
    darkgray: 'A9A9A9',
    darkgrey: 'A9A9A9',
    lightgray: 'D3D3D3',
    lightgrey: 'D3D3D3',
    gainsboro: 'DCDCEC',
    whitesmoke: 'F5F5F5',
    mintcream: 'F5FFFA',
    ghostwhite: 'F8F8FF',
    lavenderblush: 'FFF0F5',
    mistyrose: 'FFE4E1',
    antiquewhite: 'FAEBD7',
    linen: 'FAF0E6',
    oldlace: 'FDF5E6',
    floralwhite: 'FFFAF0',
    ivory: 'FFFFF0',
    honeydew: 'F0FFF0',
    azure: 'F0FFFF',
    orangered: 'FF4500',
    firebrick: 'B22222',
    limegreen: '32CD32',
    seagreen: '2E8B57',
    burlywood: 'DEB887',
    sienna: 'A0522D',
  };

  const lowerColor = color.toLowerCase();
  if (colorNames[lowerColor]) {
    return colorNames[lowerColor];
  }

  return undefined;
}

// 类型定义
interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

interface TiptapDocument {
  type: string;
  content?: TiptapNode[];
}

// 转换函数
function convertTiptapToDocx(document: TiptapDocument): Document {
  if (!document.content || document.content.length === 0) {
    return new Document({
      sections: [
        {
          properties: {},
          children: [new Paragraph({})],
        },
      ],
    });
  }

  const children: Paragraph[] = [];

  for (const node of document.content) {
    const paragraphs = convertNodeToParagraphs(node);
    children.push(...paragraphs);
  }

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

function convertNodeToParagraphs(node: TiptapNode): Paragraph[] {
  switch (node.type) {
    case 'blockWrapper':
      return convertBlockWrapperToParagraphs(node);
    case 'diceBlock':
      return convertDiceBlockToParagraphs(node);
    case 'imageBlock':
      return convertImageBlockToParagraphs(node);
    case 'layoutRow':
      return convertLayoutRowToParagraphs(node);
    case 'paragraph':
      return convertParagraphToParagraphs(node);
    case 'heading':
      return convertHeadingToParagraphs(node);
    case 'blockquote':
      return convertBlockquoteToParagraphs(node);
    case 'bulletList':
    case 'orderedList':
      return convertListToParagraphs(node);
    case 'horizontalRule':
      return [new Paragraph({ children: [new TextRun({ text: '' })] })];
    default:
      return convertGenericNodeToParagraphs(node);
  }
}

function convertBlockWrapperToParagraphs(node: TiptapNode): Paragraph[] {
  if (!node.content || node.content.length === 0) {
    return [];
  }
  const paragraphs: Paragraph[] = [];
  for (const child of node.content) {
    const childParagraphs = convertNodeToParagraphs(child);
    paragraphs.push(...childParagraphs);
  }
  return paragraphs;
}

function convertDiceBlockToParagraphs(node: TiptapNode): Paragraph[] {
  const attrs = node.attrs || {};
  const formula = String(attrs.formula || '1d20');
  const result = attrs.result;
  let text = `【${formula}`;
  if (result !== null && result !== undefined) {
    text += `=${result}`;
  }
  text += '】';
  return [new Paragraph({ children: [new TextRun({ text, bold: true })] })];
}

function convertImageBlockToParagraphs(node: TiptapNode): Paragraph[] {
  const attrs = node.attrs || {};
  const src = String(attrs.src || '');
  const alt = attrs.alt ? String(attrs.alt) : '';
  if (!src) {
    return [];
  }
  const fileName = src.split(/[/\\]/).pop() || 'image';
  return [
    new Paragraph({
      children: [new TextRun({ text: `[图片: ${alt || fileName}]`, italics: true })],
      alignment: AlignmentType.CENTER,
    }),
  ];
}

function convertLayoutRowToParagraphs(node: TiptapNode): Paragraph[] {
  if (!node.content || node.content.length === 0) {
    return [];
  }
  const columns = node.content.filter(col => col.type === 'layoutColumn');
  if (columns.length <= 1) {
    const firstColumn = columns[0];
    if (firstColumn?.content) {
      const paragraphs: Paragraph[] = [];
      for (const block of firstColumn.content) {
        paragraphs.push(...convertNodeToParagraphs(block));
      }
      return paragraphs;
    }
    return [];
  }
  const paragraphs: Paragraph[] = [];
  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    if (column?.content) {
      paragraphs.push(
        new Paragraph({ children: [new TextRun({ text: `【列 ${i + 1}】`, bold: true })] })
      );
      for (const block of column.content) {
        paragraphs.push(...convertNodeToParagraphs(block));
      }
    }
  }
  return paragraphs;
}

function convertParagraphToParagraphs(node: TiptapNode): Paragraph[] {
  if (!node.content || node.content.length === 0) {
    return [new Paragraph({ children: [new TextRun({ text: '' })] })];
  }
  const textRuns = convertTextContent(node.content);
  return [
    new Paragraph({
      children: textRuns,
      alignment: AlignmentType.LEFT,
    }),
  ];
}

function convertTextContent(nodes: TiptapNode[]): TextRun[] {
  const textRuns: TextRun[] = [];
  for (const node of nodes) {
    if (node.type === 'text' && node.text) {
      const isBold = node.marks?.some(mark => mark.type === 'bold') ?? false;
      const isItalic = node.marks?.some(mark => mark.type === 'italic') ?? false;
      const isStrike = node.marks?.some(mark => mark.type === 'strike') ?? false;
      const colorMark = node.marks?.find(mark => mark.type === 'textStyle');
      const color = colorMark?.attrs?.color as string | undefined;
      const hexColor = color ? convertColorToHex(color) : undefined;

      textRuns.push(
        new TextRun({
          text: node.text,
          bold: isBold,
          italics: isItalic,
          strike: isStrike,
          color: hexColor,
        })
      );
    } else if (node.type === 'hardBreak') {
      textRuns.push(new TextRun({ text: '', break: 1 }));
    } else if (node.content && Array.isArray(node.content)) {
      textRuns.push(...convertTextContent(node.content));
    }
  }
  return textRuns;
}

function convertHeadingToParagraphs(node: TiptapNode): Paragraph[] {
  const level = (node.attrs?.level as number) || 1;
  const text = node.content ? node.content.map(n => (n.text ? n.text : '')).join('') : '';
  if (!text) {
    return [];
  }
  const headingLevelMap: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  };
  return [
    new Paragraph({
      text,
      heading: headingLevelMap[level] || HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 },
    }),
  ];
}

function convertBlockquoteToParagraphs(node: TiptapNode): Paragraph[] {
  if (!node.content || node.content.length === 0) {
    return [];
  }
  const paragraphs: Paragraph[] = [];
  for (const child of node.content) {
    const childParagraphs = convertNodeToParagraphs(child);
    paragraphs.push(...childParagraphs);
  }
  return paragraphs;
}

function convertListToParagraphs(node: TiptapNode): Paragraph[] {
  if (!node.content) {
    return [];
  }
  const isOrdered = node.type === 'orderedList';
  const paragraphs: Paragraph[] = [];
  node.content.forEach((item, index) => {
    if (item.type === 'listItem' && item.content) {
      const prefix = isOrdered ? `${index + 1}.` : '•';
      for (let i = 0; i < item.content.length; i++) {
        const child = item.content[i];
        const childParagraphs = convertNodeToParagraphs(child);
        for (let j = 0; j < childParagraphs.length; j++) {
          const p = childParagraphs[j];
          if (i === 0 && j === 0) {
            paragraphs.push(
              new Paragraph({ children: [new TextRun({ text: `${prefix} `, bold: true })] })
            );
          }
          paragraphs.push(p);
        }
      }
    }
  });
  return paragraphs;
}

function convertGenericNodeToParagraphs(node: TiptapNode): Paragraph[] {
  if (node.content && Array.isArray(node.content)) {
    const paragraphs: Paragraph[] = [];
    for (const child of node.content) {
      paragraphs.push(...convertNodeToParagraphs(child));
    }
    return paragraphs;
  }
  return [];
}
