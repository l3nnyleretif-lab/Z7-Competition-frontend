// ========== AFFICHAGE DÉTAILS TOURNOI DEPUIS L'API ========== 
let selectedTournament = null;
let selectedStage = null;
let activeTab = 'leaderboard';
let currentLeaderboards = {};

// ========== AFFICHAGE DÉTAILS TOURNOI ========== 
async function viewTournament(id) {
    try {
        const response = await getTournamentById(id);
        
        if (response.success && response.data) {
            selectedTournament = response.data.tournament;
            selectedStage = selectedTournament.stages[0];
            
            // Stocker les leaderboards
            if (response.data.leaderboards) {
                response.data.leaderboards.forEach(lb => {
                    currentLeaderboards[lb.stageId] = lb;
                });
            }
            
            showPage('tournament');
            renderTournamentDetails();
        } else {
            alert('❌ Erreur lors du chargement du tournoi');
            showPage('home');
        }
    } catch (error) {
        console.error('Erreur viewTournament:', error);
        alert('❌ Erreur de connexion au serveur');
        showPage('home');
    }
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}. ${year}`;
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function formatDescription(description) {
    if (!description) return '';
    if (/<[a-z][\s\S]*>/i.test(description)) {
        return description;
    }
    return description.replace(/\n/g, '<br>');
}

function renderTournamentDetails() {
    if (!selectedTournament) return;
    
    // Générer le lien automatique du tournoi
    const tournamentId = selectedTournament._id || selectedTournament.id;
    const tournamentLink = `${window.location.origin}${window.location.pathname}?tournament=${tournamentId}`;
    
    const detailsHTML = `
        <div class="tournament-header-with-twitch">
            <div class="tournament-info-section">
                <div class="tournament-header">
                    <h1 class="tournament-title-wls">${selectedTournament.name}</h1>
                </div>

                <div class="tournament-link-wls">
                    <span>🔗 Lien: </span>
                    <a href="javascript:void(0)" onclick="copyTournamentLink('${tournamentId}')" style="cursor:pointer;" title="Cliquer pour copier le lien">
                        ${tournamentLink}
                    </a>
                </div>

                <div class="tournament-badges-wls">
                    <span class="badge-wls">${selectedTournament.region}</span>
                    <span class="badge-wls">${selectedTournament.gameType}</span>
                    <span class="badge-wls">${selectedTournament.mode}</span>
                </div>

                <div class="tournament-reward-wls">
                    <span class="reward-label">Récompense:</span>
                    <span class="reward-value">${selectedTournament.reward}</span>
                </div>
            </div>

            <div id="twitch-player-container"></div>
        </div>

        <div class="event-details-header">
            <h2>Event details</h2>
        </div>

        <div class="tournament-info-box-wls">
            <div class="info-box-image">
                <img src="${selectedTournament.image}" alt="${selectedTournament.name}">
            </div>
            <div class="info-box-description">
                <div class="description-content">
                    ${formatDescription(selectedTournament.description)}
                </div>
            </div>
        </div>

        <div class="stages-carousel-wls">
            <button class="carousel-btn carousel-prev" onclick="scrollCarousel(-1)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="M15 18l-6-6 6-6"/>
                </svg>
            </button>
            <div class="stages-container" id="stages-container">
                ${selectedTournament.stages.map((stage, index) => `
                    <div class="stage-card-wls ${index === 0 ? 'active' : ''}" onclick="selectStageByIndex(${index})">
                        <div class="stage-name">${stage.name}</div>
                        <div class="stage-date">${formatDateTime(stage.startDate)}</div>
                        <div class="stage-date">${formatTime(stage.startDate)} - ${formatTime(stage.endDate)}</div>
                        <div class="stage-status">Terminé</div>
                    </div>
                `).join('')}
            </div>
            <button class="carousel-btn carousel-next" onclick="scrollCarousel(1)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path d="M9 18l6-6-6-6"/>
                </svg>
            </button>
        </div>

        <div class="tabs-wls">
            <button onclick="showTab('leaderboard')" class="tab-btn-wls ${activeTab === 'leaderboard' ? 'active' : ''}">Leaderboard</button>
            <button onclick="showTab('scoring')" class="tab-btn-wls ${activeTab === 'scoring' ? 'active' : ''}">Scoring</button>
            <button onclick="showTab('prizepool')" class="tab-btn-wls ${activeTab === 'prizepool' ? 'active' : ''}">Prizepool</button>
        </div>

        <div id="tab-content-wls"></div>
    `;
    
    document.getElementById('tournament-details').innerHTML = detailsHTML;
    
    // Charger le player Twitch
    if (selectedTournament.streamerTwitch && typeof twitchPlayer !== 'undefined') {
        twitchPlayer.show(selectedTournament.streamerTwitch);
    } else {
        const container = document.getElementById('twitch-player-container');
        if (container) {
            container.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#fff;text-align:center;padding:20px;">
                    📺 Aucun stream Twitch configuré pour ce tournoi
                </div>
            `;
        }
    }
    
    showTab(activeTab);
}

// Copier le lien du tournoi dans le presse-papier
function copyTournamentLink(tournamentId) {
    const link = `${window.location.origin}${window.location.pathname}?tournament=${tournamentId}`;
    
    navigator.clipboard.writeText(link).then(() => {
        const linkElement = event.target;
        const originalText = linkElement.textContent;
        const originalColor = linkElement.style.color;
        
        linkElement.textContent = '✅ Lien copié !';
        linkElement.style.color = '#28a745';
        
        setTimeout(() => {
            linkElement.textContent = originalText;
            linkElement.style.color = originalColor || '#33C6FF';
        }, 2000);
    }).catch(err => {
        console.error('Erreur lors de la copie:', err);
        alert('❌ Impossible de copier le lien. Veuillez le copier manuellement.');
    });
}

function selectStageByIndex(index) {
    selectedStage = selectedTournament.stages[index];
    
    document.querySelectorAll('.stage-card-wls').forEach(card => card.classList.remove('active'));
    const stageCards = document.querySelectorAll('.stage-card-wls');
    if (stageCards[index]) {
        stageCards[index].classList.add('active');
    }
    
    showTab(activeTab);
}

function scrollCarousel(direction) {
    const container = document.getElementById('stages-container');
    const scrollAmount = 280;
    container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

function showTab(tab) {
    activeTab = tab;
    
    document.querySelectorAll('.tab-btn-wls').forEach(btn => btn.classList.remove('active'));
    const activeButton = document.querySelector(`[onclick="showTab('${tab}')"]`);
    if (activeButton) activeButton.classList.add('active');
    
    const content = document.getElementById('tab-content-wls');
    
    if (tab === 'leaderboard') {
        renderLeaderboardTab(content);
    } else if (tab === 'scoring') {
        renderScoringTab(content);
    } else if (tab === 'prizepool') {
        renderPrizepoolTab(content);
    }
}

function searchPlayer() {
    const searchTerm = document.getElementById('player-search-input').value.toLowerCase();
    const rows = document.querySelectorAll('.leaderboard-table-wls tbody tr');
    
    rows.forEach(row => {
        const playerName = row.querySelector('.team-cell').textContent.toLowerCase();
        if (playerName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function getPlayerQualificationStatus(rank, topQualifiers) {
    const safeThreshold = Math.floor(topQualifiers * 0.75);
    const safeCutoff = safeThreshold === 0 ? 1 : safeThreshold;
    
    if (rank <= safeCutoff) {
        return 'safe-qualified';
    } else if (rank <= topQualifiers) {
        return 'danger-qualified';
    } else {
        return 'not-qualified';
    }
}

function renderLeaderboardTab(content) {
    const stageIndex = selectedTournament.stages.findIndex(s => s.name === selectedStage.name);
    const stageId = stageIndex + 1;
    
    const leaderboard = currentLeaderboards[stageId];
    const players = leaderboard ? leaderboard.players : [];
    
    const sorted = [...players].sort((a, b) => b.points - a.points);
    
    content.innerHTML = `
        <div class="leaderboard-wls">
            <div class="search-bar-wls">
                <input 
                    type="text" 
                    id="player-search-input" 
                    placeholder="🔍 Rechercher un joueur..." 
                    oninput="searchPlayer()"
                >
            </div>
            
            <table class="leaderboard-table-wls">
                <thead>
                    <tr>
                        <th>Rang</th>
                        <th>Équipe</th>
                        <th>Parties</th>
                        <th>Victoires</th>
                        <th>Kills</th>
                        <th>K/D</th>
                        <th>Points</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.length > 0 ? sorted.map((p, i) => {
                        const rank = i + 1;
                        const qualStatus = getPlayerQualificationStatus(rank, selectedStage.topQualifiers);
                        const isQualified = rank <= selectedStage.topQualifiers;
                        const kd = p.games > 0 ? (p.kills / p.games).toFixed(2) : '0.00';
                        
                        let badge = '';
                        if (isQualified) {
                            badge = '<span class="qualified-badge">✓</span>';
                        } else {
                            badge = '<span class="not-qualified-badge">✗</span>';
                        }
                        
                        return `
                            <tr class="${qualStatus}-row">
                                <td class="rank-cell">${rank}</td>
                                <td class="team-cell">
                                    ${badge}
                                    ${p.name}
                                </td>
                                <td>${p.games}</td>
                                <td>${p.wins}</td>
                                <td>${p.kills}</td>
                                <td>${kd}</td>
                                <td class="points-cell">${p.points}</td>
                            </tr>
                        `;
                    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:40px;color:#888;">Aucun joueur pour le moment</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

function renderScoringTab(content) {
    content.innerHTML = `
        <div class="scoring-wls">
            <div class="scoring-mode-toggle">
                <button class="toggle-btn active" data-mode="echelon" onclick="toggleScoringMode('echelon')">
                    Par Échelon
                </button>
                <button class="toggle-btn" data-mode="cumulative" onclick="toggleScoringMode('cumulative')">
                    Cumulatif
                </button>
            </div>

            <div class="scoring-section">
                <div class="scoring-header">
                    <div>
                        <span class="scoring-title">💀 Éliminations</span>
                        <span class="scoring-info">Max: ${selectedStage.maxKillPoints} Kill</span>
                    </div>
                    <div class="scoring-value">+${selectedStage.pointsPerKill} points</div>
                </div>
            </div>
            
            <div class="scoring-section">
                <div class="placement-grid" id="placement-grid">
                    ${renderPlacementPoints('echelon')}
                </div>
            </div>
        </div>
    `;
}

function renderPlacementPoints(mode) {
    const placementPoints = selectedStage.placementPoints;
    
    let entries = [];
    if (placementPoints instanceof Map) {
        entries = Array.from(placementPoints.entries());
    } else {
        entries = Object.entries(placementPoints);
    }
    
    const sortedPlacements = entries.sort((a, b) => {
        const numA = parseInt(a[0].replace('top', ''));
        const numB = parseInt(b[0].replace('top', ''));
        return numB - numA;
    });
    
    if (mode === 'echelon') {
        return sortedPlacements.reverse().map(([key, points]) => {
            const topNum = key.replace('top', '');
            return `
                <div class="placement-item">
                    <div class="placement-rank">Top ${topNum}</div>
                    <div class="placement-points">+${points} points</div>
                </div>
            `;
        }).join('');
    } else {
        let cumulative = 0;
        const cumulativeArray = sortedPlacements.map(([key, points]) => {
            cumulative += points;
            const topNum = key.replace('top', '');
            return { topNum, cumulative };
        });
        
        return cumulativeArray.reverse().map(item => {
            return `
                <div class="placement-item">
                    <div class="placement-rank">Top ${item.topNum}</div>
                    <div class="placement-points placement-cumulative">${item.cumulative} points</div>
                </div>
            `;
        }).join('');
    }
}

function toggleScoringMode(mode) {
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });
    
    const grid = document.getElementById('placement-grid');
    grid.innerHTML = renderPlacementPoints(mode);
}

function renderPrizepoolTab(content) {
    const prizes = selectedStage.prizePool || [];
    
    content.innerHTML = `
        <div class="prizepool-wls">
            <div class="prizepool-disclaimer">
                ⚠️ Les récompenses sont sous réserve de validation et peuvent être modifiées.
            </div>
            <div class="prizepool-list">
                ${prizes.length > 0 ? prizes.map(prize => `
                    <div class="prize-item">
                        <div class="prize-position">${prize.position}</div>
                        <div class="prize-reward">${prize.reward}</div>
                    </div>
                `).join('') : '<p style="text-align:center;padding:40px;color:#888;">Aucune récompense définie</p>'}
            </div>
        </div>
    `;
}