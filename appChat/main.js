const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const url = require("url");
const WebSocket = require("ws");
const axios = require("axios");
const yaml = require("yaml");
const fs = require("fs");
const https = require("https");


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
    autoHideMenuBar: false,
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

    let serverIp


    const configFile = fs.readFileSync(path.join(__dirname, 'config.yaml'), 'utf8');
    const config = yaml.parse(configFile);
    serverIp = config.server.ip;

    
    const response = await axios.get("https://" + serverIp + ":5000/token/" + token, {
      // Ignorer les erreurs de certificat non approuvé (auto-signé)
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
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

ipcMain.handle("write-yaml", async (event, new_ip) => {
  const fs = require('fs');
  const jsyaml = require('js-yaml');

  const dataToWrite = {
    server: {
      ip: new_ip,
    }
  };


  const filePath = 'config.yaml';
  const yamlText = jsyaml.dump(dataToWrite);

  // Écrire dans le fichier
  fs.writeFile(filePath, yamlText, (err) => {
    if (err) {
      return false;
    } else {
      console.log("carré")
      return true;
    }
  });

  
});


ipcMain.handle("encrypt-message", async (event,Message)=>{
  const crypto = require('crypto');
  const fs = require('fs');

  // Lire la clé publique et privée
  const publicKey = fs.readFileSync('encryption/public_key.pem', 'utf8');
  // Chiffrer le message
  const encryptedMessage = crypto.publicEncrypt(publicKey, Buffer.from(Message));
  console.log("Encrypted message:", encryptedMessage.toString('base64'));
  return encryptedMessage;
});

ipcMain.handle("decrypt-message", async (event,Message)=>{
  const crypto = require('crypto');
  const fs = require('fs');

  // Lire la clé privée
  const privateKey = fs.readFileSync('encryption/private_key.pem', 'utf8');

  // DeChiffrer le message
  const decryptedMessage = crypto.privateDecrypt(privateKey, Message);
  console.log(decryptedMessage.toString());
  return decryptedMessage;
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
