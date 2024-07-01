document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed"); // Vérifiez si l'événement DOMContentLoaded est déclenché

    // Affichage du pop-up de confirmation d'âge
    const ageConfirmation = document.getElementById('age-confirmation');
    const acceptAgeButton = document.getElementById('accept-age');
    const declineAgeButton = document.getElementById('decline-age');

    if (!localStorage.getItem('ageConfirmed')) {
        console.log("No age confirmation found, displaying pop-up"); // Vérifiez si le pop-up doit s'afficher
        ageConfirmation.style.display = 'flex';
    }

    acceptAgeButton.addEventListener('click', () => {
        console.log("Age confirmed"); // Vérifiez si le bouton de confirmation d'âge est cliqué
        localStorage.setItem('ageConfirmed', 'true');
        ageConfirmation.style.display = 'none';
        document.body.classList.remove('blurred'); // Enlever l'effet de flou
    });

    declineAgeButton.addEventListener('click', () => {
        console.log("Age not confirmed, redirecting..."); // Vérifiez si le bouton de refus d'âge est cliqué
        alert("Vous devez avoir 18 ans ou plus pour accéder à ce site.");
        window.location.href = "https://www.google.com"; // Redirige vers Google
    });
});
