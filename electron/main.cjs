const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const devUrl = 'http://localhost:5000';
  const indexFile = path.join(process.cwd(), 'dist', 'index.html');

  // In development load the dev server (when dist doesn't exist).
  if (fs.existsSync(indexFile)) {
    win.loadFile(indexFile);
  } else {
    win.loadURL(devUrl);
  }

  // Optional: open devtools when running the dev server
  if (!fs.existsSync(indexFile)) win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

const { ipcMain, dialog } = require('electron');

ipcMain.handle('print-to-pdf', async (event, title) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { success: false, error: 'No window found' };

  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'Save PDF',
    defaultPath: `${title}.pdf`,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  if (filePath) {
    try {
      const data = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: { top: 1, bottom: 1, left: 1, right: 1 } // Minimal margins, let CSS handle it
      });
      fs.writeFileSync(filePath, data);
      return { success: true, filePath };
    } catch (error) {
      console.error('Failed to print PDF:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, canceled: true };
});
