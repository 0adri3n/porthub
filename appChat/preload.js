const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getPort: () => ipcRenderer.sendSync('get-port'),
    getUsername: () => ipcRenderer.sendSync('get-username'),
  checkCredentials: async (token, username) => {
    return await ipcRenderer.invoke('check-credentials', token, username);
  },
  loadSecondPage: () => {
    ipcRenderer.send('load-second-page');
  },
  writeyaml: async (new_ip) => {
    return await ipcRenderer.invoke('write-yaml', new_ip);
  },
}
);
