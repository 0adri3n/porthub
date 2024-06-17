document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.querySelector('#logoutButton');

    if (logoutButton) {
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault();
            // Supprimer le cookie en utilisant JavaScript
            document.cookie = "access_token_cookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            // Rediriger vers la page de connexion
            window.location.href = '/login';
        });
    }
});
document.addEventListener("DOMContentLoaded", function() {
    fetchConfigs();
});

function fetchConfigs() {
    fetch('/configs', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getCookie('access_token_cookie')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
        populateConfigTable(data.configs);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function populateConfigTable(configs) {
    const tableBody = document.querySelector('#configTable tbody');
    tableBody.innerHTML = '';

    configs.forEach(config => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${config.username}</td>
            <td>${config.creation_date}</td>
            <td>${config.passwd}</td>
            <td>${config.port}</td>
            <td>${config.users_count}</td>
            <td><button  class="btnEdit" onclick="deleteConfig('${config.port}')">Supprimer</button></td>
        `;
        tableBody.appendChild(row);
    });
}

function deleteConfig(port) {
    fetch(`/config/${port}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getCookie('access_token_cookie')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message); // Afficher un message de succès ou d'erreur
        fetchConfigs(); // Actualiser la liste des utilisateurs après suppression
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}