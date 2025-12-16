import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readFile, writeFile, stat } from 'fs/promises'
import { existsSync } from 'fs'

const isDev = process.env.NODE_ENV === 'development'

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
          { name: '所有文件', extensions: ['*'] }
        ]
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: 'User canceled' }
      }

      const filePath = result.filePaths[0]
      const content = await readFile(filePath, 'utf-8')
      
      return {
        success: true,
        path: filePath,
        content
      }
    } catch (error) {
      console.error('Error opening file:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // 保存文件
  ipcMain.handle('file:save', async (_, { path, content }: { path: string; content: string }) => {
    try {
      // 验证路径安全性
      if (!path || path.includes('..')) {
        return { success: false, error: 'Invalid path' }
      }

      await writeFile(path, content, 'utf-8')
      
      return { success: true }
    } catch (error) {
      console.error('Error saving file:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // 另存为
  ipcMain.handle('file:saveAs', async (_, { content }: { content: string }) => {
    try {
      const result = await dialog.showSaveDialog({
        filters: [
          { name: 'Markdown', extensions: ['md'] },
          { name: '未知叙事文档', extensions: ['udn'] },
          { name: '纯文本', extensions: ['txt'] },
          { name: 'JSON', extensions: ['json'] }
        ]
      })

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'User canceled' }
      }

      await writeFile(result.filePath, content, 'utf-8')
      
      return {
        success: true,
        path: result.filePath
      }
    } catch (error) {
      console.error('Error saving file:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // 检查文件是否存在
  ipcMain.handle('file:exists', async (_, { path }: { path: string }) => {
    try {
      return { exists: existsSync(path) }
    } catch (error) {
      return { exists: false }
    }
  })

  // 获取文件信息
  ipcMain.handle('file:stat', async (_, { path }: { path: string }) => {
    try {
      const stats = await stat(path)
      return {
        success: true,
        mtime: stats.mtime.toISOString(),
        size: stats.size
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
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
      preload: join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready-to-show
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    // Dereference the window object
  })
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // 注册文件操作 IPC handlers
  registerFileHandlers()
  
  createWindow()

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, app and menu bar stay active until user quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Security: prevent new window creation
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    // Instead of creating a new window, open in external browser
    shell.openExternal(url)
    return { action: 'deny' }
  })
})