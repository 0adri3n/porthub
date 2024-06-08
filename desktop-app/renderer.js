/*Ce fichier sert d'intermédiaire entre le processus main.js et la page du chat */

const electron = require('electron')
const ipc = electron.ipcRenderer
    /*ipcRenderer est un sytème de communication
entre différents processus d'électron.
Il permet de prendre en main des évenements */

ipc.on("error", function(event, arg) {
    /*Quand il y a une erreur, on l'affiche */
    display_alert("Erreur de connexion", arg);
});

ipc.on("message", function(event, arg, author) {
    /*Quand il y a un nouveau message, on l'affiche */
    show_message(author, arg, 0);
});
ipc.on("msg-error", function(event, arg, author) {
    /*Quand un message n'est pas envoyé, on affiche une erreur */
    show_message(author, arg, 1);
});
ipc.on("disconnect", function(event, name) {
    /*Quand un client se déconnecte, on l'affiche */
    var message = name + " s'est déconnecté.";
    remove_user(name);
    system_msg(message, 0);
});
ipc.on("reconnect", function(event, msg) {
    /*Quand le client se reconnecte au serveur, on l'affiche */
    system_msg(msg, 0);
});
ipc.on("serv_disconnect", function(event, msg) {
    /*Quand le client se déconnecte du serveur, on l'affiche */
    system_msg(msg, 1);
});
ipc.on("new_connect", function(event, name) {
    /*Quand un nouveau client se connecte, on l'affiche */
    msg = name + " s'est connecté !"
    add_user(name);
    system_msg(msg, 0);
});
ipc.on("connect-to-serv", function(event, msg) {
    /*Quand le client se connecte au serveur, on l'affiche */
    system_msg(msg, 0);
});
ipc.on("add_user", function(event, user) {
    /*Quand un nouveau client se connecte, on l'ajoute à la liste des clients connectés */
    add_user(user);
});

/*Création de fonction qui ont vocation d'être appellées dans index.js, pour intéragir
avec l'ipcRenderer */
function send_msg(author, msg) {
    /*Quand le client envoie un message, on le transmet au socket */
    ipc.send("message", msg, author);
};

function set_name(name) {
    /*Quand le client entre un pseudonyme, on l'envoie à main.js pour le stocker */
    ipc.send("name", name);
};

function close_wndw() {
    /*Quand le client appuie sur déconnexion, on envoie un signal a main.js pour fermer la fenêtre*/
    ipc.send("close_window");
};