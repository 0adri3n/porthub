const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const WebSocket = require('ws');

let win;
let ws;
let port;
let pseudo;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'joinchat.html'),
    protocol: 'file',
    slashes: true,
  }));

  win.on('closed', () => {
    win = null;
  });
}

// Handling credential check through WebSocket
ipcMain.handle('check-credentials', async (event, token, username) => {

  const decoded = atob(token);
  const jsonObject = JSON.parse(decoded);
  port = jsonObject.port;
  pseudo = username;
  console.log(username);
  ws = new WebSocket('ws://localhost:'+port);
  console.log(port); 

  return true;
});

// Load second page on valid credentials
ipcMain.on('load-second-page', (event, data) => {
  if (win) {
    const filePath = path.join(__dirname, `client.html`);
    win.loadURL(url.format({
      pathname: filePath,
      protocol: 'file',
      slashes: true,
    }));
  }
});


ipcMain.on('get-port', (event) => {
  event.returnValue = port;
});

ipcMain.on('get-username', (event) => {
  event.returnValue = pseudo;
});



app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
