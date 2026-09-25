const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { spawn, fork } = require('child_process');

let mainWindow = null;
let serverProcess = null;

const PORT = parseInt(process.env.PORT, 10) || 2026;
const HOST = '127.0.0.1';
const SERVER_URL = `http://${HOST}:${PORT}`;
const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

function checkServerReady(url, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const req = http.get(url, (res) => {
        clearInterval(interval);
        resolve(true);
      });
      req.on('error', () => {
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(interval);
          reject(new Error(`Timed out waiting for server at ${url}`));
        }
      });
      req.setTimeout(1000, () => {
        req.destroy();
      });
    }, 500);
  });
}

function getStandaloneServerPath() {
  const rootDir = app.getAppPath();
  const unpackedRoot = rootDir.replace('app.asar', 'app.asar.unpacked');

  const candidates = [
    path.join(unpackedRoot, '.next', 'standalone', 'server.js'),
    path.join(rootDir, '.next', 'standalone', 'server.js'),
    path.join(unpackedRoot, 'server.js'),
    path.join(rootDir, 'server.js'),
    path.join(process.resourcesPath || '', 'app.asar.unpacked', '.next', 'standalone', 'server.js'),
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'server.js'),
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
  const logDir = app.getPath('userData');
  const logFile = path.join(logDir, 'server.log');

  if (!serverFile) {
    const msg = `Could not locate Next.js standalone server.js.\nApp path: ${app.getAppPath()}\nResources: ${process.resourcesPath}`;
    console.error(msg);
    try {
      fs.writeFileSync(logFile, msg, 'utf8');
    } catch {}
    return;
  }

  console.log(`[Electron] Starting Next.js server from: ${serverFile}`);

  const env = {
    ...process.env,
    PORT: `${PORT}`,
    HOSTNAME: HOST,
    NODE_ENV: 'production',
    ELECTRON_RUN_AS_NODE: '1'
  };

  try {
    serverProcess = spawn(process.execPath, [serverFile], {
      cwd: path.dirname(serverFile),
      env: env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    const outStream = fs.createWriteStream(logFile, { flags: 'a' });

    if (serverProcess.stdout) {
      serverProcess.stdout.pipe(outStream);
    }
    if (serverProcess.stderr) {
      serverProcess.stderr.pipe(outStream);
    }

    serverProcess.on('error', (err) => {
      console.error('[Electron] Server spawn error:', err);
      try {
        fs.appendFileSync(logFile, `\nSpawn Error: ${err.stack || err.message}\n`);
      } catch {}
    });

    serverProcess.on('exit', (code, signal) => {
      console.log(`[Electron] Server exited (code: ${code}, signal: ${signal})`);
      try {
        fs.appendFileSync(logFile, `\nServer Exited: code=${code}, signal=${signal}\n`);
      } catch {}
    });
  } catch (err) {
    console.error('[Electron] Failed to start server process:', err);
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
      backgroundThrottling: false,
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external link clicks
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      if (!url.startsWith(SERVER_URL) && !url.includes(`127.0.0.1:${PORT}`) && !url.includes(`localhost:${PORT}`)) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    }
    return { action: 'allow' };
  });

  // Handle load failures with auto-retry
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.warn(`[Electron] Page failed to load (${errorCode}: ${errorDescription}), retrying in 1s...`);
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(SERVER_URL).catch(() => {});
      }
    }, 1000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Initial load
  mainWindow.loadURL(SERVER_URL).catch((err) => {
    console.warn(`[Electron] Initial loadURL caught:`, err.message);
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
    try {
      await checkServerReady(SERVER_URL, 800);
    } catch {
      startProductionServer();
    }
  }

  // Attempt to wait for server
  try {
    await checkServerReady(SERVER_URL, 15000);
  } catch (err) {
    console.warn(`[Electron] Waiting for server:`, err.message);
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
