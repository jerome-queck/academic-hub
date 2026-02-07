import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  showSaveDialog: (options: { defaultPath?: string }) =>
    ipcRenderer.invoke('show-save-dialog', options),

  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),

  saveFile: (filePath: string, data: unknown) =>
    ipcRenderer.invoke('save-file', { filePath, data }),

  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Event listeners
  onExportData: (callback: () => void) => {
    ipcRenderer.on('export-data', callback);
    return () => ipcRenderer.removeListener('export-data', callback);
  },

  onImportData: (callback: () => void) => {
    ipcRenderer.on('import-data', callback);
    return () => ipcRenderer.removeListener('import-data', callback);
  },
});

// Declare types for the exposed API
declare global {
  interface Window {
    electronAPI?: {
      showSaveDialog: (options: { defaultPath?: string }) => Promise<string | null>;
      showOpenDialog: () => Promise<string | null>;
      saveFile: (filePath: string, data: unknown) => Promise<{ success: boolean; error?: string }>;
      readFile: (filePath: string) => Promise<{ success: boolean; data?: unknown; error?: string }>;
      getAppVersion: () => Promise<string>;
      onExportData: (callback: () => void) => () => void;
      onImportData: (callback: () => void) => () => void;
    };
  }
}
