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

// ========== AFFICHAGE TOURNOIS ========== 
function renderTournamentsHome() {
    const filtered = getFilteredTournaments();
    
    const upcoming = filtered.filter(t => !t.isFinished);
    const finished = filtered.filter(t => t.isFinished);
    
    const upcomingByMonth = groupTournamentsByMonth(upcoming);
    const finishedByMonth = groupTournamentsByMonth(finished);
    
    const upcomingContainer = document.getElementById('upcoming-tournaments');
    upcomingContainer.innerHTML = renderMonthGroups(upcomingByMonth, false);
    
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