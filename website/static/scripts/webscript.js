document.addEventListener('DOMContentLoaded', function() {
    initializeLogoutButton();
    fetchUsers();
    initializeEditUserModal();
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

document.addEventListener('DOMContentLoaded', function() {
    initializeLogoutButton();
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
            <td><button class="btnEdit" onclick="editConfig('${config.port}')">Supprimer</button></td>
        `;
        tableBody.appendChild(row);
    });
}