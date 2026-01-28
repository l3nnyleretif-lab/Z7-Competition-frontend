// ========== NOUVEAU SYSTÈME DE CRÉATION DE TOURNOIS ========== 

let currentEditingTournament = null;
let creatorStages = [];
let currentEditingStage = 0;

// Initialiser le créateur de tournois
async function initTournamentCreator() {
    const container = document.getElementById('create-tournament-form');
    container.innerHTML = await renderCreatorHTML();
    
    if (currentEditingTournament) {
        creatorStages = JSON.parse(JSON.stringify(currentEditingTournament.stages));
        loadTournamentData();
    } else {
        creatorStages = [{
            id: 1,
            name: 'Étape 1',
            startDate: null,
            endDate: null,
            topQualifiers: 100,
            pointsPerKill: 20,
            maxKillPoints: 7,
            placementPoints: {
                top1: 30, top2: 27, top3: 25, top4: 23, top5: 21,
                top6: 19, top7: 17, top8: 15, top9: 13, top10: 11
            },
            prizePool: [],
            allowMateChange: true
        }];
    }
    
    renderStagesTabs();
    renderStagePanel(0);
    switchCreatorTab('infos');
}

function loadTournamentData() {
    if (!currentEditingTournament) return;
    
    setTimeout(() => {
        document.getElementById('creator-name').value = currentEditingTournament.name;
        document.getElementById('creator-twitch').value = currentEditingTournament.streamerTwitch;
        document.getElementById('creator-reward').value = currentEditingTournament.reward || '';
        
        const descriptionEditor = document.getElementById('creator-description');
        if (descriptionEditor) {
            descriptionEditor.innerHTML = currentEditingTournament.description || '';
        }
        
        document.getElementById('creator-region').value = currentEditingTournament.region;
        document.getElementById('creator-gametype').value = currentEditingTournament.gameType || 'Battle Royale';
        document.getElementById('creator-mode').value = currentEditingTournament.mode;
        document.getElementById('creator-color').value = currentEditingTournament.customColor || '#33C6FF';
        
        updateColorPreview();
        
        window.creatorRegistrationOpen = currentEditingTournament.isOpen;
        document.querySelectorAll('.toggle-option').forEach(opt => opt.classList.remove('active'));
        document.querySelectorAll('.toggle-option')[currentEditingTournament.isOpen ? 0 : 1].classList.add('active');
        
        if (currentEditingTournament.image && currentEditingTournament.image !== '../Image/image-random-tournois.png') {
            window.creatorImageData = currentEditingTournament.image;
            document.getElementById('image-preview-container').innerHTML = `<img src="${currentEditingTournament.image}" alt="Preview">`;
        }
        
        loadStagesDates();
    }, 100);
}

function loadStagesDates() {
    setTimeout(() => {
        creatorStages.forEach((stage, index) => {
            const stageId = index + 1;
            
            const startInput = document.getElementById(`stage-${stageId}-start`);
            const endInput = document.getElementById(`stage-${stageId}-end`);
            
            if (startInput && stage.startDate && stage.startDate !== null) {
                try {
                    const startDate = new Date(stage.startDate);
                    if (!isNaN(startDate.getTime())) {
                        startInput.value = startDate.toISOString().split('T')[0];
                    }
                } catch (e) {
                    console.error('Erreur parsing startDate:', e);
                }
            }
            
            if (endInput && stage.endDate && stage.endDate !== null) {
                try {
                    const endDate = new Date(stage.endDate);
                    if (!isNaN(endDate.getTime())) {
                        endInput.value = endDate.toISOString().split('T')[0];
                    }
                } catch (e) {
                    console.error('Erreur parsing endDate:', e);
                }
            }
        });
    }, 200);
}

async function renderCreatorHTML() {
    let gameTypes = [];
    let gameModes = [];
    
    try {
        const response = await fetch('https://z7-competition-backend.onrender.com/api/System-settings');
        const data = await response.json();
        
        if (data.success) {
            gameTypes = data.data.gameTypes;
            gameModes = data.data.gameModes;
        }
    } catch (error) {
        console.error('Erreur chargement paramètres:', error);
        gameTypes = [{ id: 'battle-royale', name: 'Battle Royale' }];
        gameModes = [{ id: 'solo', name: 'Solo' }];
    }
    
    return `
        <div class="tournament-creator">
            <div class="creator-tabs">
                <button class="creator-tab active" onclick="switchCreatorTab('infos')">📋 Informations Générales</button>
                <button class="creator-tab" onclick="switchCreatorTab('params')">⚙️ Paramètres du Jeu</button>
                <button class="creator-tab" onclick="switchCreatorTab('stages')">🏆 Configuration des Étapes</button>
                <button class="creator-tab" onclick="switchCreatorTab('visual')">🎨 Personnalisation</button>
            </div>
            
            <div class="creator-content">
                <div id="tab-infos" class="tab-panel active">
                    <div class="form-group">
                        <label class="required">Nom du tournoi</label>
                        <input type="text" id="creator-name" placeholder="Ex: Winter Cup Championship">
                    </div>
                    <div class="form-group">
                        <label class="required">Lien Twitch du créateur</label>
                        <input type="text" id="creator-twitch" placeholder="https://twitch.tv/votre_chaine">
                    </div>
                    <div class="form-group">
                        <label class="required">Récompense globale</label>
                        <input type="text" id="creator-reward" placeholder="Ex: 5.000€ Prize Pool">
                    </div>
                    <div class="form-group">
                        <label class="required">Description complète</label>
                        <div class="description-toolbar">
                            <button type="button" onclick="formatDescription('bold')" title="Gras"><strong>B</strong></button>
                            <button type="button" onclick="formatDescription('italic')" title="Italique"><em>I</em></button>
                            <button type="button" onclick="formatDescription('underline')" title="Souligné"><u>U</u></button>
                            <button type="button" onclick="insertDescriptionTitle()" title="Titre"><strong>H</strong></button>
                            <button type="button" onclick="formatDescription('insertUnorderedList')" title="Liste à puces">☰</button>
                            <button type="button" onclick="formatDescription('insertOrderedList')" title="Liste numérotée">#</button>
                        </div>
                        <div id="creator-description" class="description-editor-full" contenteditable="true" placeholder="Écrivez votre description ici..."></div>
                    </div>
                </div>
                
                <div id="tab-params" class="tab-panel">
                    <div class="form-group">
                        <label class="required">Région</label>
                        <select id="creator-region">
                            <option value="Europe">Europe</option>
                            <option value="NA East">NA East</option>
                            <option value="NA West">NA West</option>
                            <option value="Middle East">Middle East</option>
                            <option value="Asia">Asia</option>
                            <option value="OCE">OCE</option>
                            <option value="Brazil">Brazil</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="required">Type de jeu</label>
                        <select id="creator-gametype">
                            ${gameTypes.map(type => `<option value="${type.name}">${type.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="required">Mode de jeu</label>
                        <select id="creator-mode">
                            ${gameModes.map(mode => `<option value="${mode.name}">${mode.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="required">Statut d'inscription</label>
                        <div class="toggle-group">
                            <button class="toggle-option active" onclick="setRegistrationStatus(true)">Ouvert à tous</button>
                            <button class="toggle-option" onclick="setRegistrationStatus(false)">Sur inscription</button>
                        </div>
                    </div>
                </div>
                
                <div id="tab-stages" class="tab-panel">
                    <div class="stages-manager">
                        <div class="stage-actions">
                            <button class="btn-primary" onclick="addNewStage()">➕ Ajouter une Manche</button>
                            <button class="btn-secondary" onclick="duplicateCurrentStage()">📋 Dupliquer cette Manche</button>
                            <button class="btn-secondary btn-danger" onclick="deleteCurrentStage()" style="margin-left:auto;">🗑️ Supprimer cette Manche</button>
                        </div>
                        <div class="stage-tabs" id="stages-tabs"></div>
                        <div id="stages-panels"></div>
                    </div>
                </div>
                
                <div id="tab-visual" class="tab-panel">
                    <div class="visual-grid">
                        <div class="form-group">
                            <label class="required">Image du tournoi</label>
                            <div class="image-upload-zone" onclick="document.getElementById('creator-image').click()">
                                <p style="color:#aaa;font-size:14px;">📁 Cliquez pour choisir une image</p>
                                <p style="color:#666;font-size:12px;">Format recommandé: 1080x1550px</p>
                            </div>
                            <input type="file" id="creator-image" accept="image/*" style="display:none;" onchange="previewImage(this)">
                            <div id="image-preview-container" class="image-preview"></div>
                        </div>
                        <div class="form-group">
                            <label class="required">Couleur du tournoi</label>
                            <input type="color" id="creator-color" value="#33C6FF" onchange="updateColorPreview()" style="width:100%;height:60px;cursor:pointer;">
                            <div id="color-preview" class="color-preview" style="background:#33C6FF;margin-top:15px;"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="creator-actions">
                <button class="btn-preview" onclick="previewTournament()">👁️ Prévisualiser</button>
                <button class="btn-secondary" onclick="cancelCreation()">❌ Annuler</button>
                <button class="btn-primary" onclick="saveTournamentFromCreator()">✅ ${currentEditingTournament ? 'Mettre à jour' : 'Publier'} le tournoi</button>
            </div>
        </div>
    `;
}

function switchCreatorTab(tabId) {
    document.querySelectorAll('.creator-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    
    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    }
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

function formatDescription(command) {
    document.execCommand(command, false, null);
}

function insertDescriptionTitle() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString() || 'Titre';
        const h3 = document.createElement('h3');
        h3.style.cssText = 'font-size:20px;font-weight:900;color:#33C6FF;margin:20px 0 10px 0;text-transform:uppercase;';
        h3.textContent = selectedText;
        range.deleteContents();
        range.insertNode(h3);
        const newRange = document.createRange();
        newRange.setStartAfter(h3);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
}

function setRegistrationStatus(isOpen) {
    document.querySelectorAll('.toggle-option').forEach(opt => opt.classList.remove('active'));
    event.target.classList.add('active');
    window.creatorRegistrationOpen = isOpen;
}

function previewImage(input) {
    const preview = document.getElementById('image-preview-container');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            window.creatorImageData = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function updateColorPreview() {
    const color = document.getElementById('creator-color').value;
    document.getElementById('color-preview').style.background = color;
}

function saveCurrentStageData() {
    const index = currentEditingStage;
    const stageId = index + 1;
    
    const nameInput = document.getElementById(`stage-${stageId}-name`);
    if (nameInput) {
        creatorStages[index].name = nameInput.value;
    }
    
    const startInput = document.getElementById(`stage-${stageId}-start`);
    const endInput = document.getElementById(`stage-${stageId}-end`);
    if (startInput) creatorStages[index].startDate = startInput.value || null;
    if (endInput) creatorStages[index].endDate = endInput.value || null;
    
    const qualifiersInput = document.getElementById(`stage-${stageId}-qualifiers`);
    if (qualifiersInput) creatorStages[index].topQualifiers = parseInt(qualifiersInput.value) || 100;
    
    const allowMateChangeInput = document.getElementById(`stage-${stageId}-allowmatechange`);
    if (allowMateChangeInput) creatorStages[index].allowMateChange = allowMateChangeInput.value === 'true';
    
    const killPointsInput = document.getElementById(`stage-${stageId}-killpoints`);
    const maxKillsInput = document.getElementById(`stage-${stageId}-maxkills`);
    if (killPointsInput) creatorStages[index].pointsPerKill = parseInt(killPointsInput.value) || 20;
    if (maxKillsInput) creatorStages[index].maxKillPoints = parseInt(maxKillsInput.value) || 7;
    
    const placementPoints = {};
    document.querySelectorAll(`.stage-${stageId}-placement`).forEach(input => {
        const top = parseInt(input.dataset.top);
        const points = parseInt(input.value) || 0;
        placementPoints[`top${top}`] = points;
    });
    creatorStages[index].placementPoints = placementPoints;
    
    const prizePool = [];
    const positions = document.querySelectorAll(`.stage-${stageId}-prize-position`);
    const rewards = document.querySelectorAll(`.stage-${stageId}-prize-reward`);
    positions.forEach((posInput, i) => {
        const position = posInput.value.trim();
        const reward = rewards[i].value.trim();
        if (position && reward) {
            prizePool.push({ position, reward });
        }
    });
    creatorStages[index].prizePool = prizePool;
}

function renderStagesTabs() {
    const container = document.getElementById('stages-tabs');
    container.innerHTML = creatorStages.map((stage, index) => `
        <button class="stage-tab ${index === currentEditingStage ? 'active' : ''}" onclick="switchStage(${index})">
            ${stage.name}
        </button>
    `).join('');
}

function switchStage(index) {
    saveCurrentStageData();
    
    currentEditingStage = index;
    window.currentEditingStage = index + 1;
    renderStagesTabs();
    renderStagePanel(index);
    if (currentEditingTournament) {
        loadStagesDates();
    }
}

function renderStagePanel(index) {
    const stage = creatorStages[index];
    const container = document.getElementById('stages-panels');
    
    container.innerHTML = `
        <div class="stage-panel active">
            <div class="form-group">
                <label class="required">Nom de l'étape</label>
                <input type="text" id="stage-${index + 1}-name" value="${stage.name}" placeholder="Ex: Qualif 1, Finale">
            </div>
            
            <div class="date-grid">
                <div class="form-group">
                    <label class="required">Date de début</label>
                    <input type="date" id="stage-${index + 1}-start" value="${stage.startDate || ''}">
                </div>
                <div class="form-group">
                    <label class="required">Date de fin</label>
                    <input type="date" id="stage-${index + 1}-end" value="${stage.endDate || ''}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="required">Nombre de qualifiés</label>
                <input type="number" id="stage-${index + 1}-qualifiers" value="${stage.topQualifiers}" min="1">
            </div>
            
            <div class="form-group">
                <label class="required">Changement de mate autorisé ?</label>
                <select id="stage-${index + 1}-allowmatechange">
                    <option value="true" ${stage.allowMateChange !== false ? 'selected' : ''}>Oui - Les joueurs peuvent changer de mate</option>
                    <option value="false" ${stage.allowMateChange === false ? 'selected' : ''}>Non - Mate verrouillé (premier mate uniquement)</option>
                </select>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:30px;">
                <div class="points-system">
                    <h4>💀 Système de Points</h4>
                    
                    <div class="form-group" style="margin-bottom:20px;">
                        <label>Charger un template</label>
                        <select onchange="if(this.value !== '') loadTemplateIntoStage(this.value)">
                            <option value="">-- Choisir un template --</option>
                            ${pointsTemplates.map((t, i) => `<option value="${i}">${t.name}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="points-grid">
                        <div class="form-group">
                            <label>Points par kill</label>
                            <input type="number" id="stage-${index + 1}-killpoints" value="${stage.pointsPerKill}" min="0">
                        </div>
                        <div class="form-group">
                            <label>Max kills</label>
                            <input type="number" id="stage-${index + 1}-maxkills" value="${stage.maxKillPoints}" min="0">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Points de placement</label>
                        <div id="stage-${index + 1}-placements" class="placement-list">
                            ${Object.entries(stage.placementPoints).map(([key, pts]) => {
                                const topNum = key.toString().replace('top', '');
                                return `
                                    <div class="placement-item">
                                        <span style="color:#fff;font-weight:700;">Top ${topNum}</span>
                                        <input type="number" class="stage-${index + 1}-placement" data-top="${topNum}" value="${pts}" min="0">
                                        <button class="btn-remove" onclick="this.parentElement.remove()">🗑️</button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <button class="btn-secondary" onclick="addStagePlacement(${index + 1})" style="margin-top:10px;">+ Ajouter un placement</button>
                    </div>
                </div>
                
                <div class="prize-pool-section">
                    <h4>💰 Prize Pool</h4>
                    <div id="stage-${index + 1}-prizes" class="prize-list">
                        ${stage.prizePool.map((prize, i) => `
                            <div class="prize-item-form">
                                <input type="text" class="stage-${index + 1}-prize-position" placeholder="Ex: Top 1" value="${prize.position}">
                                <input type="text" class="stage-${index + 1}-prize-reward" placeholder="Ex: 1000€" value="${prize.reward}">
                                <button class="btn-remove" onclick="this.parentElement.remove()">🗑️</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn-secondary" onclick="addStagePrize(${index + 1})" style="margin-top:10px;">+ Ajouter une récompense</button>
                </div>
            </div>
        </div>
    `;
}

function addStagePlacement(stageId) {
    const container = document.getElementById(`stage-${stageId}-placements`);
    const currentPlacements = container.querySelectorAll('.placement-item');
    const nextTop = currentPlacements.length + 1;
    
    const div = document.createElement('div');
    div.className = 'placement-item';
    div.innerHTML = `
        <span style="color:#fff;font-weight:700;">Top ${nextTop}</span>
        <input type="number" class="stage-${stageId}-placement" data-top="${nextTop}" value="0" min="0">
        <button class="btn-remove" onclick="this.parentElement.remove()">🗑️</button>
    `;
    container.appendChild(div);
}

function addStagePrize(stageId) {
    const container = document.getElementById(`stage-${stageId}-prizes`);
    const div = document.createElement('div');
    div.className = 'prize-item-form';
    div.innerHTML = `
        <input type="text" class="stage-${stageId}-prize-position" placeholder="Ex: Top 2">
        <input type="text" class="stage-${stageId}-prize-reward" placeholder="Ex: 500€">
        <button class="btn-remove" onclick="this.parentElement.remove()">🗑️</button>
    `;
    container.appendChild(div);
}

// ✅ FONCTION CORRIGÉE AVEC LES BONS NOMS DE PROPRIÉTÉS
function loadTemplateIntoStage(templateIndex) {
    const stageId = window.currentEditingStage || 1;
    const template = pointsTemplates[parseInt(templateIndex)];
    
    console.log('🔍 Template Index:', templateIndex);
    console.log('🔍 Template:', template);
    
    if (!template) {
        console.error('❌ Template not found:', templateIndex);
        alert('❌ Template introuvable !');
        return;
    }
    
    // ✅ UTILISER template.placements (pas template.placementPoints)
    if (!template.placements) {
        console.error('❌ Template has no placements:', template);
        alert('❌ Template invalide : pas de points de placement !');
        return;
    }
    
    console.log('🔍 Placements:', template.placements);
    
    // ✅ CHARGER template.pointsPerKill et template.maxKills
    const killPointsInput = document.getElementById(`stage-${stageId}-killpoints`);
    const maxKillsInput = document.getElementById(`stage-${stageId}-maxkills`);
    
    if (killPointsInput) killPointsInput.value = template.pointsPerKill;
    if (maxKillsInput) maxKillsInput.value = template.maxKills;
    
    const placementsContainer = document.getElementById(`stage-${stageId}-placements`);
    if (!placementsContainer) {
        console.error('❌ Placements container not found');
        alert('❌ Erreur lors du chargement du template');
        return;
    }
    
    placementsContainer.innerHTML = '';
    
    // ✅ UTILISER template.placements (pas template.placementPoints)
    Object.entries(template.placements).forEach(([key, points]) => {
        const topNum = key.toString().replace('top', '');
        
        const div = document.createElement('div');
        div.className = 'placement-item';
        div.innerHTML = `
            <span style="color:#fff;font-weight:700;">Top ${topNum}</span>
            <input type="number" class="stage-${stageId}-placement" data-top="${topNum}" value="${points}" min="0">
            <button class="btn-remove" onclick="this.parentElement.remove()">🗑️</button>
        `;
        placementsContainer.appendChild(div);
    });
    
    console.log('✅ Template loaded successfully!');
    alert('✅ Template chargé avec succès !');
}

function addNewStage() {
    saveCurrentStageData();
    
    const newId = creatorStages.length + 1;
    creatorStages.push({
        id: newId,
        name: `Étape ${newId}`,
        startDate: null,
        endDate: null,
        topQualifiers: 100,
        pointsPerKill: 20,
        maxKillPoints: 7,
        placementPoints: {
            top1: 30, top2: 27, top3: 25, top4: 23, top5: 21,
            top6: 19, top7: 17, top8: 15, top9: 13, top10: 11
        },
        prizePool: [],
        allowMateChange: true
    });
    currentEditingStage = creatorStages.length - 1;
    window.currentEditingStage = creatorStages.length;
    renderStagesTabs();
    renderStagePanel(currentEditingStage);
    alert('✅ Nouvelle étape ajoutée !');
}

function duplicateCurrentStage() {
    saveCurrentStageData();
    
    const currentStage = JSON.parse(JSON.stringify(creatorStages[currentEditingStage]));
    currentStage.id = creatorStages.length + 1;
    currentStage.name = currentStage.name + ' (Copie)';
    currentStage.startDate = null;
    currentStage.endDate = null;
    creatorStages.push(currentStage);
    currentEditingStage = creatorStages.length - 1;
    window.currentEditingStage = creatorStages.length;
    renderStagesTabs();
    renderStagePanel(currentEditingStage);
    alert('✅ Étape dupliquée !');
}

function deleteCurrentStage() {
    if (creatorStages.length === 1) {
        alert('❌ Vous devez avoir au moins une étape !');
        return;
    }
    
    if (confirm('⚠️ Supprimer cette étape ?')) {
        creatorStages.splice(currentEditingStage, 1);
        if (currentEditingStage >= creatorStages.length) {
            currentEditingStage = creatorStages.length - 1;
        }
        window.currentEditingStage = currentEditingStage + 1;
        renderStagesTabs();
        renderStagePanel(currentEditingStage);
        alert('✅ Étape supprimée !');
    }
}

async function saveTournamentFromCreator() {
    saveCurrentStageData();
    
    const name = document.getElementById('creator-name').value.trim();
    const twitch = document.getElementById('creator-twitch').value.trim();
    const descriptionEditor = document.getElementById('creator-description');
    const description = descriptionEditor ? descriptionEditor.innerHTML : '';
    const reward = document.getElementById('creator-reward').value.trim();
    const region = document.getElementById('creator-region').value;
    const gameType = document.getElementById('creator-gametype').value;
    const mode = document.getElementById('creator-mode').value;
    const color = document.getElementById('creator-color').value;
    const imageUrl = window.creatorImageData || '../Image/image-random-tournois.png';
    const isOpen = window.creatorRegistrationOpen !== false;
    
    if (!name || !twitch || !reward) {
        alert('❌ Veuillez remplir tous les champs obligatoires');
        switchCreatorTab('infos');
        return;
    }
    
    if (creatorStages.length === 0) {
        alert('❌ Veuillez créer au moins une étape');
        switchCreatorTab('stages');
        return;
    }
    
    const stages = creatorStages.map(stage => ({
        name: stage.name,
        startDate: stage.startDate || null,
        endDate: stage.endDate || null,
        topQualifiers: stage.topQualifiers,
        pointsPerKill: stage.pointsPerKill,
        maxKillPoints: stage.maxKillPoints,
        placementPoints: stage.placementPoints,
        prizePool: stage.prizePool,
        allowMateChange: stage.allowMateChange
    }));
    
    const validStartDates = stages.map(s => s.startDate).filter(d => d !== null);
    const validEndDates = stages.map(s => s.endDate).filter(d => d !== null);
    
    const tournamentData = {
        name,
        image: imageUrl,
        streamerTwitch: twitch,
        description,
        reward,
        startDate: validStartDates.length > 0 ? validStartDates.sort()[0] : null,
        endDate: validEndDates.length > 0 ? validEndDates.sort().reverse()[0] : null,
        isOpen,
        region,
        gameType,
        mode,
        isFinished: false,
        customColor: color,
        stages
    };
    
    try {
        let response;
        
        if (currentEditingTournament) {
            const tournamentId = currentEditingTournament._id || currentEditingTournament.id;
            response = await updateTournament(tournamentId, tournamentData);
        } else {
            response = await createTournament(tournamentData);
        }
        
        if (response.success) {
            alert('🎉 ' + response.message);
            currentEditingTournament = null;
            toggleCreateForm();
            await renderAdminTournaments();
            await updateAdminStats();
        } else {
            alert('❌ ' + (response.message || 'Erreur lors de la sauvegarde'));
        }
    } catch (error) {
        console.error('Erreur saveTournamentFromCreator:', error);
        alert('❌ Erreur de connexion au serveur');
    }
}

function cancelCreation() {
    if (confirm('⚠️ Annuler ? Les modifications seront perdues.')) {
        currentEditingTournament = null;
        toggleCreateForm();
    }
}

function previewTournament() {
    saveCurrentStageData();
    
    const name = document.getElementById('creator-name').value.trim();
    const descriptionEditor = document.getElementById('creator-description');
    const description = descriptionEditor ? descriptionEditor.innerHTML : '';
    const reward = document.getElementById('creator-reward').value.trim();
    const region = document.getElementById('creator-region').value;
    const gameType = document.getElementById('creator-gametype').value;
    const mode = document.getElementById('creator-mode').value;
    const color = document.getElementById('creator-color').value;
    const imageUrl = window.creatorImageData || '../Image/image-random-tournois.png';
    
    if (!name) {
        alert('❌ Veuillez au moins renseigner le nom du tournoi');
        return;
    }
    
    const previewLink = `${window.location.origin}/index.html?tournament=preview`;
    
    const modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:10000;overflow-y:auto;padding:20px;`;
    
    modal.innerHTML = `
        <div style="max-width:1200px;margin:0 auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;">
                <h2 style="color:#33C6FF;font-size:28px;text-transform:uppercase;">👁️ Prévisualisation</h2>
                <button onclick="closePreviewModal()" style="padding:12px 25px;background:#dc3545;border:none;color:#fff;font-size:14px;font-weight:900;cursor:pointer;text-transform:uppercase;">✕ Fermer</button>
            </div>
            
            <div style="background:#000;border:1px solid ${color};padding:30px;margin-bottom:30px;">
                <h1 style="font-size:32px;font-weight:900;color:#fff;margin-bottom:20px;">${name}</h1>
                <div style="margin-bottom:15px;">
                    <span style="color:#fff;">🔗 Lien (généré automatiquement): </span>
                    <span style="color:${color};font-size:12px;font-family:monospace;">${previewLink}</span>
                </div>
                <div style="display:flex;gap:12px;margin-bottom:15px;flex-wrap:wrap;">
                    <span style="padding:6px 16px;background:#fff;color:#000;font-size:11px;font-weight:700;text-transform:uppercase;">${region}</span>
                    <span style="padding:6px 16px;background:#fff;color:#000;font-size:11px;font-weight:700;text-transform:uppercase;">${gameType}</span>
                    <span style="padding:6px 16px;background:#fff;color:#000;font-size:11px;font-weight:700;text-transform:uppercase;">${mode}</span>
                </div>
                <div><span style="color:#fff;">Récompense: </span><span style="color:#fff;font-weight:900;font-size:18px;">${reward || 'Non renseignée'}</span></div>
            </div>
            
            <div style="display:grid;grid-template-columns:250px 1fr;gap:20px;background:#000;border:1px solid #fff;padding:20px;margin-bottom:30px;">
                <div><img src="${imageUrl}" alt="${name}" style="width:100%;height:360px;object-fit:cover;"></div>
                <div style="color:#fff;line-height:1.8;font-size:14px;overflow-y:auto;max-height:360px;">${description || '<p style="color:#888;font-style:italic;">Aucune description</p>'}</div>
            </div>
            
            <div style="background:#000;border:1px solid #fff;padding:20px;">
                <h3 style="color:${color};font-size:20px;margin-bottom:20px;text-transform:uppercase;">📅 Étapes du tournoi</h3>
                <div style="display:flex;gap:15px;flex-wrap:wrap;">
                    ${creatorStages.map(stage => `
                        <div style="background:#1a1a1a;border:1px solid ${color};padding:15px;min-width:200px;">
                            <div style="font-size:16px;font-weight:900;color:#fff;margin-bottom:8px;">${stage.name}</div>
                            <div style="font-size:12px;color:#aaa;">${stage.startDate ? new Date(stage.startDate).toLocaleDateString('fr-FR') : 'Date non définie'}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="text-align:center;margin-top:30px;padding:20px;background:rgba(51,198,255,0.1);border:1px solid ${color};">
                <p style="color:#fff;font-size:14px;">ℹ️ Ceci est une prévisualisation. Les données ne sont pas encore sauvegardées.</p>
                <p style="color:#aaa;font-size:12px;margin-top:10px;">Le lien du tournoi sera généré automatiquement après la publication.</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closePreviewModal() {
    const modal = document.getElementById('preview-modal');
    if (modal) modal.remove();
}
