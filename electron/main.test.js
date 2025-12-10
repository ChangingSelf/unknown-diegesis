const { app, BrowserWindow } = require('electron')

console.log('Testing Electron...')
console.log('app:', app)
console.log('BrowserWindow:', BrowserWindow)

app.whenReady().then(() => {
  console.log('Electron app is ready')

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  console.log('Window created successfully')

  // 加载一个简单的 HTML 页面
  mainWindow.loadFile('index.html')

  console.log('HTML loaded')

  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    console.log('Window closed')
  })
})

app.on('window-all-closed', () => {
  console.log('All windows closed')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})