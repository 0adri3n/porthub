const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const url = require("url");
const WebSocket = require("ws");
const axios = require("axios");

let win;
let ws;
let port;
let pseudo;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, "assets/icon.png"),
    autoHideMenuBar: true,
  });

  win.loadURL(
    url.format({
      pathname: path.join(__dirname, "joinchat.html"),
      protocol: "file",
      slashes: true,
    })
  );

  win.on("closed", () => {
    win = null;
  });
}

ipcMain.handle("check-credentials", async (event, token, username) => {
  try {
    const response = await axios.get("http://127.0.0.1:5000/token/" + token);
    console.log(response.data.exists);

    if (response.data.exists === true) {
      console.log("OK");
      const decoded = atob(token);
      const jsonObject = JSON.parse(decoded);
      port = jsonObject.port;
      pseudo = username;
      console.log(username);

      //   ws = new WebSocket('ws://10.101.0.131:' + port);
      console.log(port);

      return true;
    } else {
      console.log("false finalement");
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
});

// Handling credential check through WebSocket
// ipcMain.handle('check-credentials', async (event, token, username) => {
//     axios.get('http://127.0.0.1:5000/token/'+token)
//       .then(response => {
//         console.log(response.data.exists);
//         if (response.data.exists === true){
//           console.log('OK')
//           const decoded = atob(token);
//           const jsonObject = JSON.parse(decoded);
//           port = jsonObject.port;
//           pseudo = username;
//           console.log(username);
//           ws = new WebSocket('ws://localhost:'+port);
//           console.log(port);
//           return true;
//         }
//         else{
//           console.log("false finalement")
//           return false;
//         }
//       })
//       .catch(error => {
//         console.log(error)
//         return false;
//       });

// });

// Load second page on valid credentials
ipcMain.on("load-second-page", (event, data) => {
  if (win) {
    const filePath = path.join(__dirname, `client.html`);
    win.loadURL(
      url.format({
        pathname: filePath,
        protocol: "file",
        slashes: true,
      })
    );
  }
});

ipcMain.on("get-port", (event) => {
  event.returnValue = port;
});

ipcMain.on("get-username", (event) => {
  event.returnValue = pseudo;
});

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
