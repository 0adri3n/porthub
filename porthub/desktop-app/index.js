var send_btn = document.getElementById("send-msg");
/*Bouton envoyer un message */
var message_bar_inner = document.getElementById("inner-message-bar");
/*l'inner est une div qui a pour unique but d'espacer 2 éléments
 on le stock dans une variable car il doit changer de taille pour
 s'adapter à l'animation de l'input pour envoyer un message*/
var message_input = document.getElementById("message-input");
/*input pour envoyer un message*/
var main_content = document.getElementById("main-content");
/*partie centrale de la page qui va acceuillir les messages */
var reload_btn = document.getElementById("reload_btn");
/*Bouton qui appraît près d'un message non envoyé, pour le ré-envoyer */
var alert_div = document.getElementById("alert");
/*La div qui affiche les alertes */
var alert_button = document.getElementById("alert-button");
/*le bouton "OK" situé en dessous de l'alerte pour la faire disparaître */
var deco_btn = document.getElementById("Logout");
/*le bouton de déconnexion */
var liste_users = document.getElementById("online-members");
/*la liste des utilisateurs connectés */
var username = ""
    /*le pseudo du client */
var clicked_input = 0
    /*variable qui contabilise si l'input de message est clqiué.
    cette variable est utile dans la fonction qui réduit la taille de l'inner
    quand la taille de l'input grandit */

function ask_pseudo() {
    /*fonction qui affiche le petit message qui demande d'entrer un pseudo */
    var pseudo_prompt = document.getElementById("pseudo");
    var pseudo_button = document.getElementById("pseudo-button");
    var pseudo_input = document.getElementById("pseudo-input");
    var pseudo_error = document.getElementById("pseudo-error");
    document.getElementById("black-background").classList.remove("hidden");
    /*on rend visible le "voile" qui assombrit l'arrière plan */
    pseudo_prompt.classList.remove("hidden");
    /*on rend visible le popup pour entrer son pseudo */

    function check_input() {
        /*fonction qui regarde si l'inpu est remplis avant de confirmer un pseudo */
        if (pseudo_input.value === "") {
            /* si l'inpu est vide */
            pseudo_error.classList.remove("hidden");
            /*on affiche le message d'érreur */
            pseudo_error.innerHTML = "Veuillez remplir le champ";
        } else {
            /*si l'input n'est pas vide, on défini un pseudo */
            username = pseudo_input.value;
            set_name(username); /*on communque avec l'ipc renderer, voir renderer.js */
            send_msg(username, "[!!set_name]"); /*on communque avec l'ipc renderer, voir renderer.js */
            document.getElementById("black-background").classList.add("hidden");
            pseudo_prompt.classList.add("hidden");
            /*on enlève l'élément qui assombrit l'arrière plan et on cache le popup */
        }
    }
    pseudo_button.addEventListener("click", function(e) {
        e.preventDefault;
        /*quand on appuie sur ok en dessous du popup, on appelle la fonction qui
        vérifie si l'input est rempli. */
        check_input()
    });
    pseudo_input.addEventListener("keypress", function(e) {
        if (e.keyCode === 13) {
            /*si le client appuie sur la touch entrée dans l'input de pseudo, 
            cela agit comme s'il appuyait sur "OK" */
            e.preventDefault();
            check_input();
        }
    });
};

ask_pseudo() /*On demande un pseudonyle à l'aide de cette fonction */

send_btn.addEventListener("mouseover", function(e) {
    e.preventDefault();
    /*agrandit le bouton envoi quand on passe la souris dessus */
    message_bar_inner.classList.replace("inner-message-bar", "inner-reduce-send");
});
send_btn.addEventListener("pointerleave", function(e) {
    e.preventDefault();
    if (message_bar_inner.classList.contains("inner-reduce-send")) {
        /*réduit le bouton envoi quand on enleve la souris  */
        message_bar_inner.classList.replace("inner-reduce-send", "inner-message-bar");
    };
});

message_input.addEventListener("mouseover", function(e) {
    e.preventDefault();
    /*agrandit l'input quand on passe la souris dessus */
    message_bar_inner.classList.replace("inner-message-bar", "inner-reduce-input");
});
message_input.addEventListener("pointerleave", function(e) {
    e.preventDefault();
    if (message_bar_inner.classList.contains("inner-reduce-input") && clicked_input === 0) {
        /*réduit l'input quand on enleve la souris  */
        message_bar_inner.classList.replace("inner-reduce-input", "inner-message-bar");
    };
});
message_input.addEventListener("click", function(e) {
    clicked_input = 1;
    message_input.classList.replace("message-input", "message-input-hover");
    message_bar_inner.classList.replace("inner-message-bar", "inner-reduce-input");
    if (message_input.value === "Entrez votre message") {
        /* enlève "envoyer un message" de l'input quand on veut écrire */
        message_input.value = ""
    };
});
deco_btn.addEventListener("click", function(e) {
    close_wndw(); /*on communique avec l'ipc renderer, voir renderer.js */
});

function display_alert(alert_type, alert_content) {
    /*fonction appellée par l'ipcRenderer pour afficher une alerte */
    document.getElementById("alert-type").innerHTML = alert_type;
    document.getElementById("alert-content").innerHTML = alert_content;
    document.getElementById("black-background").classList.remove("hidden");
    alert_div.classList.remove("hidden");
};

alert_button.addEventListener("click", function(e) {
    /*cache l'alert quand l'utilisateur appuie sur OK */
    document.getElementById("alert-type").innerHTML = "";
    document.getElementById("alert-content").innerHTML = "";
    document.getElementById("black-background").classList.add("hidden");
    alert_div.classList.add("hidden");
});

function show_message(author, message, error) {
    /*fonction appellée par l'ipcRenderer pour afficher un message */
    /*il s'agit d'une succession de création d'éléments */
    var div_msg = document.createElement("div");
    if (error === 0) {
        div_msg.classList.add("classic-msg");
    } else {
        div_msg.classList.add("classic-msg-error");
    }
    var div_msg_header = document.createElement("div");
    div_msg.appendChild(div_msg_header);
    div_msg_header.classList.add("message-header");
    var author_p = document.createElement("p");
    author_p.classList.add("author");
    author_p.innerHTML = author;
    div_msg_header.appendChild(author_p);
    var date = new Date();
    var date_p = document.createElement("p");
    date_p.classList.add("date");
    if (String(date.getDate()).length < 2) {
        var jour = "0" + date.getDate();
    } else {
        var jour = date.getDate();
    }
    if (String(date.getMonth()).length < 2) {
        var mois = "0" + date.getMonth();
    } else {
        var mois = date.getMonth();
    }
    var annee = date.getFullYear();
    if (String(date.getHours()).length < 2) {
        var heures = "0" + date.getHours();
    } else {
        var heures = date.getHours();
    }
    if (String(date.getMinutes()).length < 2) {
        var minutes = "0" + date.getMinutes();
    } else {
        var minutes = date.getMinutes();
    }
    date_p.innerHTML = jour + "/" + mois + "/" + annee + " à " + heures + "h" + minutes;
    div_msg_header.appendChild(date_p);
    var div_message_content = document.createElement("div");
    div_message_content.classList.add("message-content");
    div_msg.appendChild(div_message_content);
    var message_p = document.createElement("p");
    message_p.classList.add("message");
    message_p.innerHTML = message;
    div_message_content.appendChild(message_p);
    if (error === 1) {
        var error_p = document.createElement("p");
        error_p.innerHTML = "/!\\ Message non envoyé ...";
        error_p.classList.add("err-message");
        div_message_content.appendChild(error_p);
    }
    main_content.appendChild(div_msg);
    if (error === 1) {
        var reload_ico = document.createElement("p");
        reload_ico.classList.add("msg-reload");
        reload_ico.setAttribute("id", "reload_btn");
        reload_ico.addEventListener("click", function(e) {
            author = this.parentElement.childNodes[0].childNodes[0].innerText;
            message = this.parentElement.childNodes[1].childNodes[0].innerText;
            this.parentElement.remove();
            send_msg(author, message);
        });
        div_msg.appendChild(reload_ico);
    }
    div_msg.scrollIntoView();
    /*on scroll au niveau du message  */
}

function system_msg(message, error) {
    /*fonction appellée par l'ipcRenderer pour afficher un message du systeme */
    var div_msg = document.createElement("div");
    if (error === 0) {
        div_msg.classList.add("system-msg");
    } else {
        div_msg.classList.add("system-msg-error");
    }
    var message_p = document.createElement("p");
    message_p.innerHTML = message;
    div_msg.appendChild(message_p);
    main_content.appendChild(div_msg);
    div_msg.scrollIntoView();
};

function add_user(name) {
    /*fonction appellée par l'ipcRenderer pour ajouter un utilisateur à la liste des connectés */
    var li_list = document.createElement("li");
    var connected_user = document.createElement("div");
    connected_user.classList.add("users-list");
    connected_user.innerHTML = name;
    li_list.appendChild(connected_user);
    liste_users.appendChild(li_list);
};

function remove_user(name) {
    /*fonction appellée par l'ipcRenderer pour retirer un utilisateur à la liste des connectés */
    for (var elements = 0; elements < liste_users.children.length; elements++) {
        if (liste_users.children[elements].children[0].innerHTML == name) {
            liste_users.children[elements].remove();
        };
    };
};

send_btn.addEventListener("click", function(e) {
    e.preventDefault();
    /*quand l'utilisatuer appuie sur envoyer */
    var message = message_input.value;
    if (message === "") {
        console.log("Error empty input");
        return false
    } else {
        message_input.value = "";
        send_msg(username, message); /*on communique avec l'ipc renderer, voir renderer.js */
        message_input.classList.replace("message-input-hover", "message-input");
        message_bar_inner.classList.replace("inner-reduce-input", "inner-message-bar");
        clicked_input = 0
    };
});

message_input.addEventListener("keypress", function(e) {
    if (e.keyCode === 13) {
        /*quand l'utilisateur appuie sur la touche entrée dans l'input*/
        e.preventDefault();
        var message = message_input.value;
        if (message === "") {
            console.log("Error empty input");
            return false
        } else {
            message_input.value = "";
            send_msg(username, message);
            message_input.classList.replace("message-input-hover", "message-input");
            message_bar_inner.classList.replace("inner-reduce-input", "inner-message-bar");
            clicked_input = 0
        };
    };
});


var dark_theme = document.getElementById("dark_theme");

dark_theme.addEventListener("click", function(e) {
    /*change l'apparence des éléments de la page */
    document.getElementsByClassName("message-bar")[0].style.backgroundColor = "black";
    document.getElementsByClassName("main-content")[0].style.backgroundColor = "black";
    document.documentElement.style.backgroundColor = "black";
});

var white_theme = document.getElementById("white_theme");

white_theme.addEventListener("click", function(e) {
    /*change l'apparence des éléments de la page */
    document.getElementsByClassName("main-content")[0].style.backgroundColor = "rgb(206, 206, 206)";
    document.documentElement.style.backgroundColor = "rgb(206, 206, 206)";
});