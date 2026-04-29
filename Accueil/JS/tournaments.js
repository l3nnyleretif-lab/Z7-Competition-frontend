// ========== AFFICHAGE TOURNOIS DEPUIS L'API ========== 

// ========== FILTRES ========== 
function applyFilters() {
    renderTournamentsHome();
}

function getFilteredTournaments() {
    const regionFilter = document.getElementById('filter-region').value;
    const modeFilter = document.getElementById('filter-mode').value;
    
    return tournaments.filter(t => {
        const matchRegion = !regionFilter || t.region === regionFilter;
        const matchMode = !modeFilter || t.mode === modeFilter;
        return matchRegion && matchMode;
    });
}

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

// ========== VÉRIFIER SI UN TOURNOI EST ACTIF ========== 
function isTournamentActive(tournament) {
    // Un tournoi est actif si :
    // 1. Il n'est pas terminé (ni marqué comme fini, ni date de fin dépassée)
    // 2. Sa date de début est passée (ou il n'a pas de date de début)
    
    if (isTournamentFinished(tournament)) {
        return false;
    }
    
    if (tournament.startDate) {
        const startDate = new Date(tournament.startDate);
        const now = new Date();
        
        // Le tournoi est actif si la date de début est passée
        return startDate <= now;
    }
    
    // Si pas de date de début, considérer comme actif
    return true;
}

// ========== VÉRIFIER SI UN TOURNOI EST À VENIR ========== 
function isTournamentUpcoming(tournament) {
    // Un tournoi est à venir si :
    // 1. Il n'est pas terminé
    // 2. Sa date de début n'est pas encore passée
    
    if (isTournamentFinished(tournament)) {
        return false;
    }
    
    if (tournament.startDate) {
        const startDate = new Date(tournament.startDate);
        const now = new Date();
        
        // Le tournoi est à venir si la date de début n'est pas encore passée
        return startDate > now;
    }
    
    // Si pas de date de début, ne pas considérer comme à venir
    return false;
}

// ========== AFFICHAGE TOURNOIS ========== 
function renderTournamentsHome() {
    const filtered = getFilteredTournaments();
    
    // Séparer les tournois selon leur statut réel (basé sur les dates)
    const upcoming = filtered.filter(t => isTournamentUpcoming(t));
    const active = filtered.filter(t => isTournamentActive(t));
    const finished = filtered.filter(t => isTournamentFinished(t));
    
    // Grouper par mois
    const upcomingByMonth = groupTournamentsByMonth(upcoming);
    const activeByMonth = groupTournamentsByMonth(active);
    const finishedByMonth = groupTournamentsByMonth(finished);
    
    // Afficher "Bientôt" (upcoming)
    const upcomingContainer = document.getElementById('upcoming-tournaments');
    if (upcoming.length === 0 && active.length === 0) {
        upcomingContainer.innerHTML = '<p style="text-align:center;color:#888;padding:40px;">Aucun tournoi à venir pour le moment</p>';
    } else {
        // Combiner "à venir" et "actifs" dans la section "Bientôt"
        const combinedUpcoming = [...upcoming, ...active];
        const combinedByMonth = groupTournamentsByMonth(combinedUpcoming);
        upcomingContainer.innerHTML = renderMonthGroups(combinedByMonth, false);
    }
    
    // Afficher "Terminé"
    const finishedContainer = document.getElementById('finished-tournaments');
    finishedContainer.innerHTML = renderMonthGroups(finishedByMonth, true);
}

function groupTournamentsByMonth(tournamentsList) {
    const grouped = {};
    
    tournamentsList.forEach(t => {
        const date = new Date(t.startDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
        
        if (!grouped[monthKey]) {
            grouped[monthKey] = {
                name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                tournaments: []
            };
        }
        
        grouped[monthKey].tournaments.push(t);
    });
    
    const sortedKeys = Object.keys(grouped).sort();
    const result = {};
    sortedKeys.forEach(key => {
        result[key] = grouped[key];
    });
    
    return result;
}

function renderMonthGroups(monthGroups, isFinished) {
    if (Object.keys(monthGroups).length === 0) {
        return `<p style="text-align:center;color:#888;padding:40px;">Aucun tournoi ${isFinished ? 'terminé' : 'à venir'} pour le moment</p>`;
    }
    
    let html = '';
    
    for (const [monthKey, monthData] of Object.entries(monthGroups)) {
        html += `
            <div class="month-group ${isFinished ? 'finished' : ''}">
                <h3 class="month-title">${monthData.name}</h3>
                <div class="tournaments-grid">
                    ${monthData.tournaments.map(t => renderTournamentCard(t, isFinished)).join('')}
                </div>
            </div>
        `;
    }
    
    return html;
}

function renderTournamentCard(tournament, isFinished) {
    const cardColor = tournament.customColor || '#33C6FF';
    // Utiliser _id de MongoDB au lieu de id
    const tournamentId = tournament._id || tournament.id;
    
    return `
        <div class="tournament-card ${isFinished ? 'finished' : ''}" onclick="viewTournament('${tournamentId}')">
            <img src="${tournament.image}" alt="${tournament.name}">
            <div class="tournament-card-content" style="--tournament-color: ${cardColor};">
                <h3>${tournament.name}</h3>
                <div class="tournament-date">${formatDateSimple(tournament.startDate)}</div>
                <div class="tournament-badges">
                    <span class="tournament-badge" style="background: ${cardColor};">${tournament.mode}</span>
                    <span class="tournament-badge" style="background: ${cardColor};">${tournament.region}</span>
                </div>
            </div>
        </div>
    `;
}