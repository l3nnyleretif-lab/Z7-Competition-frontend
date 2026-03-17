// ========== REPLAY CLIENT ========== 
let surveillanceActive = false;

function updateReplayTournamentSelect() {
    const select = document.getElementById('replay-tournament');
    select.innerHTML = '<option value="">Sélectionner un tournoi</option>' + 
        tournaments.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

function toggleSurveillance() {
    surveillanceActive = !surveillanceActive;
    const btn = document.getElementById('surveillance-btn');
    const status = document.getElementById('surveillance-status');
    
    if (surveillanceActive) {
        btn.textContent = '⏸ Arrêter la surveillance';
        btn.className = 'btn-danger';
        status.innerHTML = '<p style="color:#28a745;margin-top:20px;padding:15px;background:#4a4a4a;border-radius:4px;">🟢 Surveillance active...<br><span style="font-size:14px;color:#aaa;">Le client surveille le dossier replays.</span></p>';
        status.style.display = 'block';
    } else {
        btn.textContent = '▶ Démarrer la surveillance';
        btn.className = 'btn-success';
        status.style.display = 'none';
    }
}