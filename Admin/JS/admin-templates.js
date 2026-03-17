// ========== GESTION DES TEMPLATES DE SYSTÈMES DE POINTS (VERSION ORIGINALE) ========== 

// Charger les templates depuis localStorage
function loadTemplates() {
    const saved = localStorage.getItem('z7_points_templates');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Erreur chargement templates:', e);
            return [];
        }
    }
    return [];
}

// Sauvegarder les templates
function saveTemplates(templates) {
    try {
        localStorage.setItem('z7_points_templates', JSON.stringify(templates));
        console.log('✅ Templates sauvegardés');
    } catch (e) {
        console.error('❌ Erreur sauvegarde templates:', e);
    }
}

let pointsTemplates = loadTemplates();

// Afficher la liste des templates
function renderTemplatesList() {
    const container = document.getElementById('templates-list');
    if (!container) return;
    
    if (pointsTemplates.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#888;padding:40px;">Aucun template créé. Cliquez sur "Créer un template" pour commencer.</p>';
        return;
    }
    
    container.innerHTML = pointsTemplates.map((template, index) => `
        <div class="template-card">
            <h4>${template.name}</h4>
            <div class="template-info" style="color:#aaa;font-size:12px;margin:10px 0;">
                <div>💀 ${template.pointsPerKill} pts/kill (max: ${template.maxKills})</div>
                <div>🏆 ${Object.keys(template.placements || {}).length} placements configurés</div>
            </div>
            <div class="template-actions">
                <button class="btn-secondary" onclick="editTemplate(${index})">✏️ Modifier</button>
                <button class="btn-secondary" onclick="duplicateTemplate(${index})">📋 Dupliquer</button>
                <button class="btn-secondary btn-danger" onclick="deleteTemplate(${index})">🗑️ Supprimer</button>
            </div>
        </div>
    `).join('');
}

// Ouvrir le formulaire de création
function openTemplateForm(editIndex = null) {
    const formContainer = document.getElementById('template-form-container');
    formContainer.style.display = 'block';
    
    if (editIndex !== null) {
        const template = pointsTemplates[editIndex];
        document.getElementById('template-name').value = template.name;
        document.getElementById('template-kills').value = template.pointsPerKill;
        document.getElementById('template-max-kills').value = template.maxKills;
        
        // Charger les placements
const placementsContainer = document.getElementById('template-placements');
placementsContainer.innerHTML = '';

// ✅ VÉRIFIER que placements existe
if (template.placements && Object.keys(template.placements).length > 0) {
    Object.entries(template.placements).forEach(([key, value]) => {
        const topNum = key.replace('top', '');
        addTemplatePlacement(topNum, value);
    });
} else {
    // Si pas de placements, en créer par défaut
    [30,27,25,23,21,19,17,15,13,11].forEach((pts, i) => {
        addTemplatePlacement(i + 1, pts);
    });
}
        
        document.getElementById('save-template-btn').onclick = () => saveTemplate(editIndex);
    } else {
        document.getElementById('template-name').value = '';
        document.getElementById('template-kills').value = '20';
        document.getElementById('template-max-kills').value = '7';
        
        // Placements par défaut
        const placementsContainer = document.getElementById('template-placements');
        placementsContainer.innerHTML = '';
        [30,27,25,23,21,19,17,15,13,11].forEach((pts, i) => {
            addTemplatePlacement(i + 1, pts);
        });
        
        document.getElementById('save-template-btn').onclick = () => saveTemplate(null);
    }
    
    formContainer.scrollIntoView({ behavior: 'smooth' });
}

function closeTemplateForm() {
    document.getElementById('template-form-container').style.display = 'none';
}

// Ajouter un placement dans le formulaire
function addTemplatePlacement(topNum = null, points = 0) {
    const container = document.getElementById('template-placements');
    const currentPlacements = container.querySelectorAll('.placement-item');
    const nextTop = topNum || currentPlacements.length + 1;
    
    const div = document.createElement('div');
    div.className = 'placement-item';
    div.innerHTML = `
        <span style="color:#fff;font-weight:700;">Top ${nextTop}</span>
        <input type="number" class="template-placement-input" data-top="${nextTop}" value="${points}" min="0" placeholder="Points">
        <button class="btn-remove" onclick="this.parentElement.remove()">🗑️</button>
    `;
    container.appendChild(div);
}

// Sauvegarder le template
function saveTemplate(editIndex) {
    const name = document.getElementById('template-name').value.trim();
    const pointsPerKill = parseInt(document.getElementById('template-kills').value) || 0;
    const maxKills = parseInt(document.getElementById('template-max-kills').value) || 0;
    
    if (!name) {
        alert('❌ Le nom du template est obligatoire');
        return;
    }
    
    const placements = {};
    document.querySelectorAll('.template-placement-input').forEach(input => {
        const top = input.dataset.top;
        const points = parseInt(input.value) || 0;
        placements[`top${top}`] = points;
    });
    
    const template = { name, pointsPerKill, maxKills, placements };
    
    if (editIndex !== null) {
        pointsTemplates[editIndex] = template;
    } else {
        pointsTemplates.push(template);
    }
    
    saveTemplates(pointsTemplates);
    closeTemplateForm();
    renderTemplatesList();
    alert('✅ Template sauvegardé !');
}

// Modifier un template
function editTemplate(index) {
    openTemplateForm(index);
}

// Dupliquer un template
function duplicateTemplate(index) {
    const template = { ...pointsTemplates[index] };
    template.name = template.name + ' (Copie)';
    pointsTemplates.push(template);
    saveTemplates(pointsTemplates);
    renderTemplatesList();
    alert('✅ Template dupliqué !');
}

// Supprimer un template
function deleteTemplate(index) {
    if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer ce template ?')) {
        pointsTemplates.splice(index, 1);
        saveTemplates(pointsTemplates);
        renderTemplatesList();
        alert('✅ Template supprimé !');
    }
}

// Charger un template dans une étape
function loadTemplateIntoStage(templateIndex) {
    const template = pointsTemplates[templateIndex];
    if (!template) {
        console.error('❌ Template introuvable');
        return;
    }
    
    const currentStage = window.currentEditingStage || 1;
    
    console.log('📋 Template:', template);
    
    document.getElementById(`stage-${currentStage}-killpoints`).value = template.pointsPerKill;
    document.getElementById(`stage-${currentStage}-maxkills`).value = template.maxKills;
    
    // ✅ VÉRIFIER que placements existe
    if (!template.placements) {
        alert('❌ Ce template n\'a pas de points de placement');
        return;
    }
    
    const placementsContainer = document.getElementById(`stage-${currentStage}-placements`);
    placementsContainer.innerHTML = '';
    
    Object.entries(template.placements).forEach(([key, points]) => {
        const topNum = key.replace('top', '');
        const div = document.createElement('div');
        div.className = 'placement-item';
        div.innerHTML = `
            <span style="color:#fff;font-weight:700;">Top ${topNum}</span>
            <input type="number" class="stage-${currentStage}-placement" data-top="${topNum}" value="${points}" min="0">
            <button class="btn-remove" onclick="this.parentElement.remove()">🗑️</button>
        `;
        placementsContainer.appendChild(div);
    });
    
    alert(`✅ Template "${template.name}" chargé !`);
}

console.log('📋 Templates chargés:', pointsTemplates.length);