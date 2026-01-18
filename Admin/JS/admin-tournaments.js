// ========== ADMIN TOURNOIS - AFFICHAGE DEPUIS API ========== 

// Variable globale pour stocker les tournois de l'admin
let myTournaments = [];

async function renderAdminTournaments() {
    const list = document.getElementById('tournaments-admin-list');
    if (!list) return;
    
    // Afficher un loader
    list.innerHTML = '<p style="text-align:center;padding:40px;color:#33C6FF;">⏳ Chargement de vos tournois...</p>';
    
    try {
        const response = await getMyTournaments();
        
        if (response.success) {
            myTournaments = response.data || [];
            
            if (myTournaments.length === 0) {
                list.innerHTML = '<p style="text-align:center;color:#888;padding:40px;">Aucun tournoi créé pour le moment. Cliquez sur "Créer un Tournoi" pour commencer.</p>';
                return;
            }
            
            list.innerHTML = myTournaments.map(t => `
                <div class="tournament-admin-item">
                    <div class="tournament-admin-image">
                        <img src="${t.image}" alt="${t.name}">
                    </div>
                    
                    <div class="tournament-admin-info">
                        <h3>${t.name}</h3>
                        <p><span>📅 Dates:</span> ${formatDate(t.startDate)} → ${formatDate(t.endDate)}</p>
                        <p><span>🌍 Région:</span> ${t.region}</p>
                        <p><span>🎮 Type:</span> ${t.gameType} - ${t.mode}</p>
                        <p><span>🏆 Étapes:</span> ${t.stages.length} étape(s)</p>
                        <p><span>💰 Récompense:</span> ${t.reward}</p>
                        <p><span>📊 Statut:</span> ${t.isFinished ? '✅ Terminé' : '⚡ En cours'}</p>
                        ${t.customColor ? `<p><span>🎨 Couleur:</span> <span style="display:inline-block;width:20px;height:20px;background:${t.customColor};vertical-align:middle;border:2px solid #fff;margin-left:5px;"></span> ${t.customColor}</p>` : ''}
                    </div>
                    
                    <div class="tournament-admin-actions">
                        <button class="btn-secondary" onclick="editTournament('${t._id}')">✏️ Modifier</button>
                        <button class="btn-secondary btn-danger" onclick="deleteTournamentAdmin('${t._id}')">🗑️ Supprimer</button>
                    </div>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<p style="text-align:center;color:#dc3545;padding:40px;">❌ Erreur lors du chargement de vos tournois</p>';
        }
    } catch (error) {
        console.error('Erreur renderAdminTournaments:', error);
        list.innerHTML = '<p style="text-align:center;color:#dc3545;padding:40px;">❌ Erreur de connexion au serveur</p>';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ========== TOGGLE FORMULAIRE ========== 
function toggleCreateForm() {
    const form = document.getElementById('create-tournament-form');
    const isHidden = form.style.display === 'none';
    
    if (isHidden) {
        form.style.display = 'block';
        currentEditingTournament = null;
        initTournamentCreator();
        form.scrollIntoView({ behavior: 'smooth' });
    } else {
        form.style.display = 'none';
        form.innerHTML = '';
        currentEditingTournament = null;
    }
}

// ========== MODIFICATION TOURNOI ========== 
function editTournament(id) {
    const tournament = myTournaments.find(t => t._id === id);
    if (!tournament) {
        alert('❌ Tournoi introuvable');
        return;
    }
    
    const form = document.getElementById('create-tournament-form');
    form.style.display = 'block';
    
    currentEditingTournament = tournament;
    initTournamentCreator();
    
    form.scrollIntoView({ behavior: 'smooth' });
}

// ========== SUPPRESSION TOURNOI ========== 
async function deleteTournamentAdmin(id) {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir supprimer ce tournoi ? Cette action est irréversible !')) {
        return;
    }
    
    try {
        const response = await deleteTournament(id);
        
        if (response.success) {
            alert('✅ Tournoi supprimé !');
            await renderAdminTournaments();
            await updateAdminStats();
        } else {
            alert('❌ ' + (response.message || 'Erreur lors de la suppression'));
        }
    } catch (error) {
        console.error('Erreur deleteTournamentAdmin:', error);
        alert('❌ Erreur de connexion au serveur');
    }
}