// ========== ADMIN TOURNOIS - AFFICHAGE DEPUIS API AVEC FILTRES ========== 

// Variable globale pour stocker les tournois de l'admin
let myTournaments = [];
let currentTournamentFilter = 'active'; // 'active' ou 'finished'

// ========== VÉRIFIER SI UN TOURNOI EST TERMINÉ ========== 
function isTournamentFinished(tournament) {
    // Si le tournoi est marqué comme terminé, il l'est
    if (tournament.isFinished) {
        return true;
    }
    
    // Vérifier si la date de fin est dépassée
    if (tournament.endDate) {
        const endDate = new Date(tournament.endDate);
        const now = new Date();
        
        // Si la date de fin est dans le passé, le tournoi est terminé
        if (endDate < now) {
            return true;
        }
    }
    
    return false;
}

// ========== FILTRER LES TOURNOIS ========== 
function filterTournaments(filter) {
    currentTournamentFilter = filter;
    
    // Mettre à jour les boutons
    document.querySelectorAll('.tournaments-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="filterTournaments('${filter}')"]`).classList.add('active');
    
    // Afficher les tournois filtrés
    renderFilteredTournaments();
}

// ========== AFFICHER LES TOURNOIS FILTRÉS ========== 
function renderFilteredTournaments() {
    const list = document.getElementById('tournaments-admin-list');
    if (!list) return;
    
    let filteredTournaments = [];
    
    if (currentTournamentFilter === 'active') {
        // Tournois actifs (pas terminés)
        filteredTournaments = myTournaments.filter(t => !isTournamentFinished(t));
    } else {
        // Tournois terminés
        filteredTournaments = myTournaments.filter(t => isTournamentFinished(t));
    }
    
    if (filteredTournaments.length === 0) {
        const message = currentTournamentFilter === 'active' 
            ? 'Aucun tournoi actif pour le moment.' 
            : 'Aucun tournoi dans l\'historique.';
        list.innerHTML = `<p style="text-align:center;color:#888;padding:40px;grid-column: 1 / -1;">${message}</p>`;
        return;
    }
    
    list.innerHTML = filteredTournaments.map(t => `
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
                <p><span>📊 Statut:</span> ${isTournamentFinished(t) ? '✅ Terminé' : '⚡ En cours'}</p>
                ${t.customColor ? `<p><span>🎨 Couleur:</span> <span style="display:inline-block;width:20px;height:20px;background:${t.customColor};vertical-align:middle;border:2px solid #fff;margin-left:5px;"></span> ${t.customColor}</p>` : ''}
            </div>
            
            <div class="tournament-admin-actions">
                <button class="btn-secondary" onclick="editTournament('${t._id}')">✏️ Modifier</button>
                <button class="btn-secondary btn-danger" onclick="deleteTournamentAdmin('${t._id}')">🗑️ Supprimer</button>
            </div>
        </div>
    `).join('');
}

// ========== AFFICHER LES TOURNOIS AVEC BOUTONS DE FILTRE ========== 
async function renderAdminTournaments() {
    const list = document.getElementById('tournaments-admin-list');
    if (!list) return;
    
    // Afficher un loader
    list.innerHTML = '<p style="text-align:center;padding:40px;color:#33C6FF;grid-column: 1 / -1;">⏳ Chargement de vos tournois...</p>';
    
    try {
        const response = await getMyTournaments();
        
        if (response.success) {
            myTournaments = response.data || [];
            
            // Compter les tournois actifs et terminés
            const activeTournaments = myTournaments.filter(t => !isTournamentFinished(t));
            const finishedTournaments = myTournaments.filter(t => isTournamentFinished(t));
            
            // Créer la barre de filtres si elle n'existe pas déjà
            let filterBar = document.querySelector('.tournaments-filter-bar');
            if (!filterBar) {
                filterBar = document.createElement('div');
                filterBar.className = 'tournaments-filter-bar';
                filterBar.innerHTML = `
                    <button class="tournaments-filter-btn active" onclick="filterTournaments('active')">
                        🏆 Tournois Actifs
                        <span class="badge-count">${activeTournaments.length}</span>
                    </button>
                    <button class="tournaments-filter-btn" onclick="filterTournaments('finished')">
                        📜 Historique
                        <span class="badge-count">${finishedTournaments.length}</span>
                    </button>
                `;
                list.parentElement.insertBefore(filterBar, list);
            } else {
                // Mettre à jour les compteurs
                filterBar.innerHTML = `
                    <button class="tournaments-filter-btn ${currentTournamentFilter === 'active' ? 'active' : ''}" onclick="filterTournaments('active')">
                        🏆 Tournois Actifs
                        <span class="badge-count">${activeTournaments.length}</span>
                    </button>
                    <button class="tournaments-filter-btn ${currentTournamentFilter === 'finished' ? 'active' : ''}" onclick="filterTournaments('finished')">
                        📜 Historique
                        <span class="badge-count">${finishedTournaments.length}</span>
                    </button>
                `;
            }
            
            if (myTournaments.length === 0) {
                list.innerHTML = '<p style="text-align:center;color:#888;padding:40px;grid-column: 1 / -1;">Aucun tournoi créé pour le moment. Cliquez sur "Créer un Tournoi" pour commencer.</p>';
                return;
            }
            
            // Afficher les tournois selon le filtre actuel
            renderFilteredTournaments();
        } else {
            list.innerHTML = '<p style="text-align:center;color:#dc3545;padding:40px;grid-column: 1 / -1;">❌ Erreur lors du chargement de vos tournois</p>';
        }
    } catch (error) {
        console.error('Erreur renderAdminTournaments:', error);
        list.innerHTML = '<p style="text-align:center;color:#dc3545;padding:40px;grid-column: 1 / -1;">❌ Erreur de connexion au serveur</p>';
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