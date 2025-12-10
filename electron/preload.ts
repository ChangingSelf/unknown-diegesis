import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any API methods you want to expose to the renderer process
  // For example:
  // getVersion: () => ipcRenderer.invoke('get-version'),
  // saveFile: (data: string) => ipcRenderer.invoke('save-file', data),
})

// Type declarations for the exposed API
declare global {
  interface Window {
    electronAPI: {
      // Define the types for your exposed methods here
      // getVersion: () => Promise<string>;
      // saveFile: (data: string) => Promise<boolean>;
    }
  }
}