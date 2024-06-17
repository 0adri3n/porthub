document.addEventListener('DOMContentLoaded', function() {
    initializeLogoutButton();
    fetchUsers();
});

function initializeLogoutButton() {
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
}

function fetchUsers() {
    fetch('/users', {
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
        populateUserTable(data.users);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function populateUserTable(users) {
    const tableBody = document.querySelector('#userTable tbody');
    tableBody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.credit}</td>
            <td>${user.is_admin ? 'Yes' : 'No'}</td>
            <td><button class="btnEdit" onclick="editUser('${user.username}')">Modifier</button></td>
            <td><button class="btnEdit" onclick="deleteUser('${user.username}')">Supprimer</button></td>
        `;
        tableBody.appendChild(row);
    });
}

function filterUsers() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toUpperCase();
    const table = document.getElementById('userTable');
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) { // Start from 1 to skip the table header
        const cells = rows[i].getElementsByTagName('td');
        let found = false;
        for (let j = 0; j < cells.length; j++) {
            const cell = cells[j];
            if (cell) {
                const cellText = cell.textContent || cell.innerText;
                if (cellText.toUpperCase().indexOf(filter) > -1) {
                    found = true;
                    break;
                }
            }
        }
        rows[i].style.display = found ? '' : 'none';
    }
}

function editUser(username) {
    // Redirection vers la page de modification de l'utilisateur spécifié
    window.location.href = `/user/${username}`;
}

function deleteUser(username) {
    fetch(`/user/${username}`, {
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
        fetchUsers(); // Actualiser la liste des utilisateurs après suppression
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

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
        fetchUsers(); // Actualiser la liste des utilisateurs après suppression
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
