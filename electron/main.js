const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;

const PORT = process.env.PORT || 3000;
const SERVER_URL = `http://localhost:${PORT}`;
const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

function checkServerReady(url, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      http.get(url, (res) => {
        clearInterval(interval);
        resolve(true);
      }).on('error', () => {
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(interval);
          reject(new Error(`Timed out waiting for server at ${url}`));
        }
      });
    }, 400);
  });
}

function getStandaloneServerPath() {
  const rootDir = app.getAppPath();
  const fs = require('fs');
  const unpackedRoot = rootDir.replace('app.asar', 'app.asar.unpacked');

  const candidates = [
    path.join(unpackedRoot, '.next', 'standalone', 'server.js'),
    path.join(rootDir, '.next', 'standalone', 'server.js'),
    path.join(unpackedRoot, 'server.js'),
    path.join(rootDir, 'server.js'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function startProductionServer() {
  const serverFile = getStandaloneServerPath();

  if (serverFile) {
    console.log(`[Electron] Starting Next.js server: ${serverFile}`);
    serverProcess = spawn(process.execPath, [serverFile], {
      cwd: path.dirname(serverFile),
      env: {
        ...process.env,
        PORT: `${PORT}`,
        NODE_ENV: 'production',
        ELECTRON_RUN_AS_NODE: '1'
      },
      stdio: 'inherit'
    });

    serverProcess.on('error', (err) => {
      console.error('[Electron] Failed to start server process:', err);
    });

    serverProcess.on('exit', (code, signal) => {
      console.log(`[Electron] Server process exited with code ${code}, signal ${signal}`);
    });
  } else {
    console.warn('[Electron] No server.js found to start.');
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 960,
    minHeight: 600,
    title: 'tblinc Media Player',
    backgroundColor: '#0a0e17',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      backgroundThrottling: false, // Keep video streaming smooth in background
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external link clicks in native browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      if (!url.startsWith(SERVER_URL)) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Load app
  mainWindow.loadURL(SERVER_URL).catch((err) => {
    console.error(`[Electron] Failed to load ${SERVER_URL}:`, err.message);
  });
}

// Window controls IPC
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('window-toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// App lifecycle
app.whenReady().then(async () => {
  if (!isDev) {
    // Check if server is already running, if not start it
    try {
      await checkServerReady(SERVER_URL, 1000);
    } catch {
      startProductionServer();
    }
  }

  // Wait for server to respond before opening window
  try {
    await checkServerReady(SERVER_URL, 25000);
  } catch (err) {
    console.warn(`[Electron] Server readiness check timeout, proceeding anyway:`, err.message);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

function cleanup() {
  if (serverProcess) {
    console.log('[Electron] Shutting down internal Next.js server...');
    try {
      serverProcess.kill();
    } catch {}
    serverProcess = null;
  }
}

app.on('before-quit', cleanup);

app.on('window-all-closed', () => {
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
