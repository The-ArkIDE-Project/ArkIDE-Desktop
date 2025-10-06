const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile('source/index.html');
  
mainWindow.on('close', (e) => {
  e.preventDefault();
  
  dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Close', 'Cancel'],
    defaultId: 1,
    title: 'Close Ark IDE?',
    message: 'Are you sure you want to close?',
    detail: 'Make sure you saved your work.'
  }).then((response) => {
    if (response.response === 0) {
      mainWindow.destroy();
    }
  });
});
  
  // inject window title
mainWindow.webContents.on('did-finish-load', () => {
  mainWindow.webContents.insertCSS(`
    .electron-titlebar {
      position: fixed;
      top: 0;
      right: 150px;  
      height: 32px;
      display: flex;
      z-index: 999999;
      -webkit-app-region: no-drag;
    }
    

    .electron-drag-overlay {
      position: fixed;
      top: 0;
      right: 188px; /* 138px + 50px offset */
      left: 50%; /* Start from middle of screen */
      height: 45px; /* Cover the entire blue bar height */
      z-index: 999998;
      -webkit-app-region: drag;
      background: transparent;
    }
    
    .electron-titlebar button {
      width: 46px;
      height: 32px;
      border: none;
      background: transparent;
      color: #fff;
      cursor: pointer;
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 10px;
      transition: background 0.1s;
    }
    
    .electron-titlebar button:hover {
      background: rgba(255,255,255,0.1);
    }
    
    .electron-titlebar button.close:hover {
      background: #e81123;
    }
  `);
  
  mainWindow.webContents.executeJavaScript(`
    (function() {
      // Create draggable overlay (right half only)
      const dragOverlay = document.createElement('div');
      dragOverlay.className = 'electron-drag-overlay';
      document.body.appendChild(dragOverlay);
      
      // Create window controls
      const titlebar = document.createElement('div');
      titlebar.className = 'electron-titlebar';
      titlebar.innerHTML = \`
        <button onclick="window.electronAPI.minimizeWindow()" title="Minimize">
          <span>─</span>
        </button>
        <button onclick="window.electronAPI.maximizeWindow()" title="Maximize">
          <span>□</span>
        </button>
        <button class="close" onclick="window.electronAPI.closeWindow()" title="Close">
          <span>✕</span>
        </button>
      \`;
      document.body.appendChild(titlebar);
    })();
  `);
});
}

// Window control handlers
ipcMain.on('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

// Update close handler
ipcMain.on('window-close', () => {
  mainWindow.close(); // Use close() instead of destroy() to trigger the handler
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});