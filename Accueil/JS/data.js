// ========== GESTION DES DONNÉES - VERSION BACKEND ========== 

// Variable globale pour stocker les tournois (chargés depuis l'API)
let tournaments = [];

// ========== FONCTIONS UTILITAIRES ========== 
function formatDate(dateString) {
    if (!dateString) return 'Date non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateSimple(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
}

// ========== CHARGEMENT DES TOURNOIS DEPUIS L'API ========== 
async function loadTournaments() {
    try {
        const response = await getAllTournaments();
        if (response.success) {
            tournaments = response.data || [];
            console.log('✅ Tournois chargés depuis l\'API:', tournaments.length);
        } else {
            console.error('❌ Erreur lors du chargement des tournois:', response.message);
            tournaments = [];
        }
    } catch (error) {
        console.error('❌ Erreur fatale lors du chargement des tournois:', error);
        tournaments = [];
    }
    return tournaments;
}

// ========== LOG POUR DEBUG ========== 
console.log('📦 Module data.js chargé - Données depuis API Backend');