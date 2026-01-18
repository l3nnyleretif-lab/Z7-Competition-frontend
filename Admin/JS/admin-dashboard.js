// ========== ADMIN DASHBOARD - STATS DEPUIS API ========== 

async function updateAdminStats() {
    try {
        // Charger MES tournois
        const response = await getMyTournaments();
        
        if (response.success && response.data) {
            const tournaments = response.data;
            const totalTournaments = tournaments.length;
            const activeTournaments = tournaments.filter(t => !t.isFinished).length;
            
            // Mettre à jour les stats
            const statTotal = document.getElementById('stat-total');
            const statActive = document.getElementById('stat-active');
            
            if (statTotal) statTotal.textContent = totalTournaments;
            if (statActive) statActive.textContent = activeTournaments;
            
            console.log('✅ Stats mises à jour:', { totalTournaments, activeTournaments });
        } else {
            console.error('❌ Erreur lors du chargement des stats');
        }
    } catch (error) {
        console.error('❌ Erreur updateAdminStats:', error);
    }
}

// ========== INITIALISATION ========== 
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('admin-dashboard')) {
        updateAdminStats();
    }
});