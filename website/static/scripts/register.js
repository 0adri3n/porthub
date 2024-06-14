document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.querySelector('.loginForm');
    const usernameInput = document.querySelector('input[name="username"]');
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]');
    const errorMessage = document.querySelector('.error-message');
    let usernameExists = false;
    let emailExists = false;

    // Écouter le changement dans le champ de nom d'utilisateur
    usernameInput.addEventListener('input', function() {
        const username = usernameInput.value.trim();
        if (username.length === 0) {
            errorMessage.textContent = '';
            return;
        }
        checkUsernameExists(username);
    });

    // Écouter le changement dans le champ d'e-mail
    emailInput.addEventListener('input', function() {
        const email = emailInput.value.trim();
        if (email.length === 0) {
            errorMessage.textContent = '';
            return;
        }
        checkEmailExists(email);
    });

    // Fonction pour vérifier si un nom d'utilisateur existe déjà
    function checkUsernameExists(username) {
        fetch(`/user/${username}`)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Network response was not ok');
                }
            })
            .then(data => {
                usernameExists = true;
                usernameInput.setCustomValidity('Username already exists. Please choose another username.');
                errorMessage.textContent = 'Username already exists.';
            })
            .catch(error => {
                usernameExists = false;
                usernameInput.setCustomValidity('');
                errorMessage.textContent = '';
            });
    }

    // Fonction pour vérifier si un e-mail existe déjà
    function checkEmailExists(email) {
        fetch(`/email/${email}`)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Network response was not ok');
                }
            })
            .then(data => {
                emailExists = true;
                emailInput.setCustomValidity('Email address already exists. Please use another email.');
                errorMessage.textContent = 'Email address already exists.';
            })
            .catch(error => {
                emailExists = false;
                emailInput.setCustomValidity('');
                errorMessage.textContent = '';
            });
    }

    // Écouter la soumission du formulaire d'inscription
    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!validateEmail(email)) {
            errorMessage.textContent = 'Use a valid Email';
            return;
        }

        if (!validatePassword(password)) {
            errorMessage.textContent = 'Password of 8 char minimum.';
            return;
        }

        if (password !== confirmPassword) {
            errorMessage.textContent = "Password Doesn't match.";
            return;
        }

        if (usernameExists) {
            usernameInput.reportValidity();
            return;
        }

        if (emailExists) {
            emailInput.reportValidity();
            return;
        }

        // Si tout est valide, soumettre le formulaire
        this.submit();
    });

    // Fonction pour valider l'adresse e-mail
    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Fonction pour valider le mot de passe
    function validatePassword(password) {
        return password.length >= 8;
    }
});
