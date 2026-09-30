const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

const isExternalUrl = (value) => /^https?:\/\//i.test(value);

function configuredStartUrl() {
  const argument = process.argv.find((value) => value.startsWith('--url='));
  return argument ? argument.slice('--url='.length) : process.env.WEB2APP_URL;
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    backgroundColor: '#0b1020',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalUrl(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  const startUrl = configuredStartUrl();
  if (isExternalUrl(startUrl)) window.loadURL(startUrl);
  else window.loadFile(path.join(__dirname, '..', 'www', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
