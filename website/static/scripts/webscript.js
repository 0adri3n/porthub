document.addEventListener('DOMContentLoaded', function() {
    initializeLogoutButton();
    fetchUsers();
    fetchConfigs();
    initializeEditUserModal(); // Initialiser le modal pour l'édition des utilisateurs
    initializeEditConfigModal(); // Initialiser le modal pour l'édition des configurations
    showUsersTable(); // Par défaut, afficher le tableau des utilisateurs et le champ de recherche associé.
});

function initializeLogoutButton() {
    const logoutButton = document.querySelector('#logoutButton');

    if (logoutButton) {
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault();
            document.cookie = "access_token_cookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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

    for (let i = 1; i < rows.length; i++) {
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
    fetch(`/user/${username}`, {
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
        const user = data.user;
        document.getElementById('editUsername').value = user.username;
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editCredit').value = user.credit;
        document.getElementById('editUserModal').style.display = 'block';
    })
    .catch(error => {
        console.error('Error:', error);
    });
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
        alert(data.message);
        fetchUsers();
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function initializeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    const span = document.getElementsByClassName('close')[0];
    const form = document.getElementById('editUserForm');

    span.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    form.onsubmit = function(event) {
        event.preventDefault();

        const username = document.getElementById('editUsername').value;
        const email = document.getElementById('editEmail').value;
        const credit = document.getElementById('editCredit').value;

        const data = {
            email: email,
            credit: credit
        };

        fetch(`/user/${username}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getCookie('access_token_cookie')}`
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
            modal.style.display = 'none';
            fetchUsers();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
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
        console.log(data); // Optional: Log data to console for debugging
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
            <td>${config.port}</td>
            <td>${config.users_count}</td>
            <td>${config.creation_date}</td>
            <td><button class="btnEdit" onclick="editConfig('${config.port}')">Modifier</button></td>
            <td><button class="btnEdit" onclick="deleteConfig('${config.port}')">Supprimer</button></td>
        `;
        row.dataset.username = config.username;  // Ajouter un attribut dataset pour stocker le nom d'utilisateur
        tableBody.appendChild(row);
    });
}


function editConfig(port, current_user) {
    fetch(`/config/${port}`, {
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
        const config = data.config;
        document.getElementById('editConfigName').value = config.username;
        document.getElementById('editPort').value = config.port;
        document.getElementById('editUserCount').value = config.users_count;
        document.getElementById('editCreationDate').value = config.creation_date;
        document.getElementById('editConfigModal').style.display = 'block';
    })
    .catch(error => {
        console.error('Error:', error);
    });
}



function initializeEditConfigModal() {
    const modal = document.getElementById('editConfigModal');
    const span = modal.querySelector('.close');
    const form = document.getElementById('editConfigForm');

    span.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    form.onsubmit = async function(event) {
        event.preventDefault();
    
        const userCount = document.getElementById('editUserCount').value;
        const port = document.getElementById('editPort').value;
    
        if (userCount < 2) {
            alert("Le nombre d'utilisateurs doit être au moins 2.");
            return;
        }
        const data = {
            users_count: userCount
        };
    
 // Fonction à implémenter pour récupérer le jeton CSRF
    
        try {
            const response = await fetch(`/config/${port}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('access_token_cookie')}`,
                },
                body: JSON.stringify(data)
            });
    
            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Request failed with status ${response.status}: ${errorMessage}`);
            }
    
            const responseData = await response.json();
            alert(responseData.message);
            modal.style.display = 'none';
            fetchConfigs(); // Actualiser la liste des configurations après modification
        } catch (error) {
            console.error('Error:', error);
            alert(`Une erreur est survenue lors de la mise à jour de la configuration: ${error.message}`);
        }
    }
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

function showUsersTable() {
    document.getElementById('userTable').style.display = 'table';
    document.getElementById('configTable').style.display = 'none';
    document.getElementById('searchInputUser').style.display = 'block';
    document.getElementById('searchInputConfig').style.display = 'none';
    document.getElementById('toggleUserButton').classList.add('active');
    document.getElementById('toggleConfigButton').classList.remove('active');
}

function showConfigsTable() {
    document.getElementById('userTable').style.display = 'none';
    document.getElementById('configTable').style.display = 'table';
    document.getElementById('searchInputUser').style.display = 'none';
    document.getElementById('searchInputConfig').style.display = 'block';
    document.getElementById('toggleUserButton').classList.remove('active');
    document.getElementById('toggleConfigButton').classList.add('active');
}


function filterConfigs() {
    const input = document.getElementById('searchInputConfig');
    const filter = input.value.toUpperCase();
    const table = document.getElementById('configTable');
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
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
    fetchUsers();
});
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
            <td>${user.is_admin ? 'Oui' : 'Non'}</td>
            <td><button class="btnEdit" onclick="editUser('${user.username}')">Modifier</button></td>
            <td><button  class="btnEdit" onclick="deleteUser('${user.username}')">Supprimer</button></td>
        `;
        tableBody.appendChild(row);
    });
}

function filterUsers() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toUpperCase();
    const table = document.getElementById('userTable');
    const rows = table.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const usernameColumn = rows[i].getElementsByTagName('td')[0];
        if (usernameColumn) {
            const usernameText = usernameColumn.textContent || usernameColumn.innerText;
            if (usernameText.toUpperCase().indexOf(filter) > -1) {
                rows[i].style.display = '';
            } else {
                rows[i].style.display = 'none';
            }
        }
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
