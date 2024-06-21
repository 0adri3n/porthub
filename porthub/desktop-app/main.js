// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron');
const Electron = require("electron");
const path = require('path');
const net = require("net");
const ipc = Electron.ipcMain;
var attempt = 0;
var client = new net.Socket();
var connected = false;
let mainWindow;
let message;
var decoder = new TextDecoder();
var client_name = "";
var name_set = false;


/**************************************************************************************/
/*                             Qu'est ce que ipc Main ?                               */
/**************************************************************************************/
/*     Dans electron pour discuter entre 2 processus différent on utilise des Ipc     */
/*                       Ipc = Inter process communication                            */
/*                Ce sont un mélange de socket et d'event listenner                   */
/*          Ainsi quand j'utilise mainWindow.webContents.send("mon canal")            */
/* J'appelle par le biai d'ipc, une fonction qui sera définie dans un autre processus */
/* Un peu d'aide ici : https://codaholic.sillo.org/2017/12/07/electron-le-module-ipc/ */
/*       Ou sur teams ou discord si vous voulez une explication de vive voix          */
/*       De la documentation : https://www.electronjs.org/docs/api/ipc-main           */
/*   Encore de la documentation : https://www.electronjs.org/docs/api/ipc-renderer    */
/* ---------------------------------------------------------------------------------- */
/*     J'ai essayé de faire de mon mieux pour commenter mon code mais je comprends    */
/*     qu'il peut être très dur à comprendre de l'extérieur, je me ferai un plaisir   */
/*                               de vous l'expliquer !                                */
/**************************************************************************************/


function connect_to_serv() {
    /*Fonction qui lance la connection au serveur*/
    client.connect(5550, "127.0.0.1");
    client.on("error", function(error) {
        /*Lors d'une erreur on rettente de se connecter toutes les 5 secondes*/
        connected = false
        client.end();
        if (attempt < 1) {
            /*On fait apparaitre sur la fenêtre du chat le message suivant*/
            mainWindow.webContents.send("serv_disconnect", "Impossible de se connecter au serveur.");
        };
        console.log("error : " + error.message);
        setTimeout(function() {
            attempt += 1;
            console.log("Attempt n :" + attempt)
            client.connect(5550, "127.0.0.1")
        }, 5000); /*Cette fonction permet d'attendre 5 secondes avant d'éxécuter le code qui la compose*/
    });
    client.on("ready", function() {
        /*l'état on ready signifie que le client est connecté et prêt à recevoir des messages*/
        connected = true
        if (client_name.length >= 1 && name_set == false) {
            /*Si le pseudo du client est défini et qu'il y eu des tentatives de reconnexion, on renvoit le pseudo au serveur*/
            client.write('[name]"' + client_name + '"[/name]' + "[!!set_name]");
        };
        if (attempt > 0) {
            /*Si il y a eu des tentatives de reconxion, on informe l'utilisateur qu'il est reconnecté*/
            mainWindow.webContents.send("reconnect", "Vous êtes reconnecté au serveur !");
        } else {
            /*Si il n'y a pas eu d'incidents, on informe l'utilisateurs qu'il est connecté*/
            setTimeout(function() {
                    mainWindow.webContents.send("connect-to-serv", "Vous êtes connecté au serveur !");
                }, 2500)
                /*Ici on patiente 2.5 secondes avant d'envoyer des informations à la page principale (le chat)
                le processus main.js et donc cette fonction sont exécutés avant la chargement des éléments sur la page
                il est donc impératif de patienter sous peine de ne pas afficher le message */
        };
    });
    client.on("data", function(data) {
        message = decoder.decode(data); /*On décode le message, équivalent a message.decode("utf-8") en python */
        if (message.slice(0, 14) == "[!!disconnect]") {
            /*si le messqge commence par le code serveur [!!disconnect] qui indique une 
            déconnexion */
            var nom_dc = message.slice(15, message.length); /*on récupère le pseudo du déconnecté */
            mainWindow.webContents.send("disconnect", nom_dc); /*On envoi un evenement de déconnexion à la page */
        } else if (message.slice(0, 11) == "[!!connect]") {
            /*si le messqge commence par le code serveur [!!connect] qui indique une 
            nouvelle connexion */
            var nom_co = message.slice(11, message.length); /*on récupère le pseudo du nouveau connecté */
            mainWindow.webContents.send("new_connect", nom_co); /*On envoi un evenement de connexion à la page */
        } else if (message.slice(0, 15) == "[!!client_list]") {
            /*Lors d'une connexion au serveur, ce dernier envoie automatiquement la liste des clients connectés
            symbolisée par le code serveur [!!client_list]*/
            var liste = message.slice(15, message.length).split("|");
            /*On enleve le code [!!client_list] et on récupère les pseudos séparés par un | */
            for (var user = 0; user < liste.length; user++) {
                mainWindow.webContents.send("add_user", liste[user]);
                /*pour chaque pseudo dans la liste des connectés, on envoie un évenement d'ajout d'utilisateur
                dans la listed des membres connectés */
            };
        } else {
            var author = ""
            for (var i = 0; i < message.length - 7; i++) {
                if (message.slice(7 + i, 7 + i + 1) == '"') {
                    break;
                }
                author += message.slice(7 + i, 7 + i + 1);
                /*On récupère le pseudo de l'auteur du message, comprit entre les 2 balises
                [name]" et "[/name] */
            }
            message = message.slice(15 + author.length);
            /*on récupère le message dans les données qui ont été envoyés par le serveur */
            mainWindow.webContents.send("message", message, author);
            /*On communique le tout à la page*/
        }
    });
};



ipc.on("message", function(event, arg, author) {
    /*Quand l'utilisateur envoie un message */
    if (connected == true) {
        client.write('[name]"' + author + '"[/name]' + arg);
        /*on balise le message avec le code serveur avant de l'envoyer */
        if (arg == "[!!set_name]") {
            name_set = true;
            /*La balise [!!set_name] est envoyé au serveur dès que le client est connecté pour lui associer un pseudo */
        };
    } else {
        /*Si le client n'est aps connecté au serveur */
        if (arg != "[!!set_name]") {
            /*Si l'argument du message n'est une balise de définition de pseudo */
            event.sender.send("error", "Impossible d'envoyer votre message, veuillez verifier votre connexion à internet.")
            event.sender.send("msg-error", arg, author);
            /*On envoie un message d'erreur à la page */
        };
    }
});
ipc.on("name", function(event, name) {
    /*fonction appellée quand l'utilisateur à défini un pseudo. il sera stocké ici */
    client_name = name;
});
ipc.on("close_window", function(event) {
    /*fonction appellée quand l'utilisateur appuie sur "deconnexion", cela ferme la fenêtre*/
    mainWindow.close();
});

/*fonction qui créé et défini la fenêtre */
function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    })
    mainWindow.on("close", function() {
        client.write("[!!disconnect] " + client_name);
        client.destroy();
        console.log("fenetre fermée, fermeture du socket.");
    });


    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)
    // Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function() {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.disableHardwareAcceleration();
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

connect_to_serv();
/*on appelle la fonction pour se connecter au serveur  */