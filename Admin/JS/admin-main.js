// ========== NAVIGATION ADMIN - CORRIGÉ ========== 

function showAdminSection(sectionId) {
    // Cacher toutes les sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`admin-${sectionId}`).classList.add('active');
    
    // Mettre à jour les boutons de navigation
    document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
    const activeButton = document.querySelector(`[onclick="showAdminSection('${sectionId}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Charger les données selon la section
    if (sectionId === 'tournaments') renderAdminTournaments();
    if (sectionId === 'dashboard') updateAdminStats();
    if (sectionId === 'templates') renderTemplatesList();
}

// ========== TÉLÉCHARGEMENT DU CLIENT ========== 
function downloadClient() {
    // Rediriger directement vers le téléchargement
    window.location.href = 'https://github.com/l3nnyleretif-lab/Z7-tournament-client/releases/download/v1.0.0/Z7.Competition.Uploader.Setup.1.0.0.exe';
}

// ========== COPIER LA CLÉ API ========== 
function copyApiKey() {
    const apiKeyInput = document.getElementById('api-key-display');
    if (apiKeyInput) {
        apiKeyInput.select();
        apiKeyInput.setSelectionRange(0, 99999); // Pour mobile
        
        try {
            document.execCommand('copy');
            alert('✅ Clé API copiée !');
        } catch (err) {
            // Fallback pour les navigateurs modernes
            navigator.clipboard.writeText(apiKeyInput.value).then(() => {
                alert('✅ Clé API copiée !');
            }).catch(() => {
                alert('❌ Impossible de copier la clé API');
            });
        }
    }
}

// ========== AFFICHER LA CLÉ API ========== 
function displayApiKey() {
    const apiKey = localStorage.getItem('apiKey');
    const apiKeyDisplay = document.getElementById('api-key-display');
    
    console.log('🔑 Affichage clé API:', apiKey); // DEBUG
    
    if (apiKeyDisplay && apiKey) {
        apiKeyDisplay.value = apiKey;
    } else if (apiKeyDisplay) {
        apiKeyDisplay.value = 'Aucune clé API trouvée';
    }
}

// ========== INITIALISATION ========== 
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation du panel admin...'); // DEBUG
    
    // Vérifier l'authentification
    if (!checkAuth()) {
        return; // Arrêter si pas authentifié
    }
    
    // Afficher la clé API
    displayApiKey();
    
    // Charger le dashboard par défaut
    await updateAdminStats();
    
    // Charger la liste des tournois (même si pas visible)
    await renderAdminTournaments();
    
    console.log('✅ Panel admin initialisé');
});