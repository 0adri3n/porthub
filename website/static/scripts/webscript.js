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