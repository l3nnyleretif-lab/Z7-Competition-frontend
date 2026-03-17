// ========== AUTHENTIFICATION ADMIN - CORRIGÉ ========== 

function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const hasApiAccess = localStorage.getItem('hasApiAccess');
    const token = localStorage.getItem('token');
    const apiKey = localStorage.getItem('apiKey');
    
    console.log('🔍 Vérification auth:', { isLoggedIn, hasApiAccess, hasToken: !!token, hasApiKey: !!apiKey }); // DEBUG
    
    // Vérifier que l'utilisateur est connecté ET qu'il a une clé API
    if (!isLoggedIn || isLoggedIn !== 'true' || !hasApiAccess || hasApiAccess !== 'true' || !token || !apiKey) {
        console.error('❌ Accès refusé - Redirection vers index.html');
        alert('⚠️ Accès refusé ! Vous devez posséder une clé API pour accéder au panel admin.');
        window.location.href = '../index.html';
        return false;
    }
    
    console.log('✅ Authentification OK');
    return true;
}

function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        // Nettoyer TOUTES les données de session
        localStorage.clear();
        
        alert('✅ Déconnexion réussie !');
        window.location.href = '../index.html';
    }
}

// Vérifier l'authentification au chargement de la page admin
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin.html')) {
        checkAuth();
    }
});