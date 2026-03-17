// ========== NAVIGATION ENTRE PAGES ========== 
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    
    if (pageId === 'home') {
        renderTournamentsHome();
    }
    
    // Cacher le player Twitch si on quitte la page tournoi
    if (pageId !== 'tournament' && typeof twitchPlayer !== 'undefined') {
        twitchPlayer.hide();
    }
}

// ========== UTILITAIRE FORMATAGE DATE ========== 
function formatDateSimple(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} - ${hours}:${minutes}`;
}

// ========== INITIALISATION AVEC CHARGEMENT ASYNC ========== 
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation de l\'application...');
    
    // Afficher un loader pendant le chargement
    const upcomingContainer = document.getElementById('upcoming-tournaments');
    const finishedContainer = document.getElementById('finished-tournaments');
    
    if (upcomingContainer) {
        upcomingContainer.innerHTML = '<p style="text-align:center;padding:40px;color:#33C6FF;">⏳ Chargement des tournois...</p>';
    }
    if (finishedContainer) {
        finishedContainer.innerHTML = '';
    }
    
    // Charger les tournois depuis l'API
    await loadTournaments();
    
    // Afficher les tournois
    if (upcomingContainer) {
        renderTournamentsHome();
    }
    
    console.log('✅ Application initialisée');
});