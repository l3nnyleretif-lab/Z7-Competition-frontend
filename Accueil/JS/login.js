// ========== AUTHENTIFICATION AVEC BACKEND - CORRIGÉ ========== 

// ✅ NOUVEAU : Charger le lien Discord depuis l'API
async function loadDiscordLink() {
    try {
        const response = await fetch(`${API_URL}/system-settings`);
        const data = await response.json();
        
        if (data.success && data.data.discordLink) {
            const discordLink = data.data.discordLink;
            
            // Mettre à jour tous les liens Discord sur la page
            document.querySelectorAll('a[href*="discord"], a[onclick*="Discord"]').forEach(link => {
                link.href = discordLink;
                link.onclick = null; // Retirer l'alert
                link.target = '_blank'; // Ouvrir dans nouvel onglet
            });
            
            console.log('✅ Lien Discord chargé:', discordLink);
        }
    } catch (error) {
        console.error('❌ Erreur chargement lien Discord:', error);
        // En cas d'erreur, garder le comportement par défaut
    }
}

// ========== ACCÈS AVEC CLÉ API ========== 
async function accessWithApiKey() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    
    if (!apiKey) {
        alert('❌ Veuillez entrer votre clé API');
        return;
    }
    
    try {
        const response = await loginWithApiKey(apiKey);
        
        console.log('Réponse loginWithApiKey:', response); // DEBUG
        
        if (response.success && response.data) {
            const user = response.data;
            
            console.log('User data:', user); // DEBUG
            
            // Vérifier que l'utilisateur a bien accès API
            if (!user.hasApiAccess) {
                alert('❌ Cette clé API n\'a pas accès au panel admin');
                return;
            }
            
            // Sauvegarder TOUTES les infos nécessaires
            localStorage.setItem('token', user.token);
            localStorage.setItem('apiKey', user.apiKey);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userName', user.name);
            localStorage.setItem('userId', user.id);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('hasApiAccess', 'true');
            
            console.log('✅ Données sauvegardées dans localStorage'); // DEBUG
            
            alert('✅ Connexion réussie avec clé API !');
            window.location.href = 'Admin/admin.html';
        } else {
            console.error('Erreur:', response); // DEBUG
            alert('❌ ' + (response.message || 'Clé API invalide'));
        }
    } catch (error) {
        console.error('Erreur lors de la connexion avec clé API:', error);
        alert('❌ Erreur de connexion au serveur. Vérifiez que le backend est lancé.');
    }
}

// ========== DEMANDE DE CLÉ API ========== 
async function submitApiRequest(event) {
    event.preventDefault();
    
    const requestData = {
        name: document.getElementById('request-name').value.trim(),
        email: document.getElementById('request-email').value.trim(),
        tiktok: document.getElementById('request-tiktok').value.trim(),
        twitch: document.getElementById('request-twitch').value.trim(),
        tournaments: parseInt(document.getElementById('request-tournaments').value),
        phone: document.getElementById('request-phone').value.trim(),
        message: document.getElementById('request-message').value.trim()
    };
    
    if (!requestData.name || !requestData.email || !requestData.tournaments || !requestData.phone) {
        alert('❌ Veuillez remplir tous les champs obligatoires (marqués *)');
        return;
    }
    
    try {
        const response = await submitApiKeyRequest(requestData);
        
        if (response.success) {
            const successDiv = document.getElementById('request-success');
            successDiv.textContent = '✅ ' + response.message;
            successDiv.style.display = 'block';
            
            document.getElementById('api-request-form').reset();
            
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
        } else {
            alert('❌ ' + (response.message || 'Erreur lors de l\'envoi de la demande'));
        }
    } catch (error) {
        console.error('Erreur lors de la soumission de la demande:', error);
        alert('❌ Erreur de connexion au serveur');
    }
}

// ========== CONNEXION CLASSIQUE ========== 
async function classicLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorDiv = document.getElementById('login-error');
    
    if (!email || !password) {
        showLoginError(errorDiv, 'Veuillez remplir tous les champs');
        return;
    }
    
    try {
        const response = await loginUser(email, password);
        
        if (response.success && response.data) {
            const user = response.data;
            
            localStorage.setItem('token', user.token);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userName', user.name);
            localStorage.setItem('userId', user.id);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('isAdmin', user.hasApiAccess ? 'true' : 'false');
            localStorage.setItem('hasApiAccess', user.hasApiAccess ? 'true' : 'false');
            
            if (user.hasApiAccess && user.apiKey) {
                localStorage.setItem('apiKey', user.apiKey);
            }
            
            alert('✅ Connexion réussie !');
            
            if (user.hasApiAccess) {
                window.location.href = 'Admin/admin.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            showLoginError(errorDiv, response.message || 'Email ou mot de passe incorrect');
        }
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        showLoginError(errorDiv, 'Erreur de connexion au serveur');
    }
}

function showLoginError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

// ========== INSCRIPTION ========== 
function showSignup() {
    const modal = document.createElement('div');
    modal.id = 'signup-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background:#1a1a1a;border:1px solid #33C6FF;padding:30px;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;">
            <h2 style="color:#33C6FF;margin-bottom:20px;text-transform:uppercase;font-size:22px;">Créer un compte</h2>
            
            <div id="signup-error" style="display:none;background:rgba(220,53,69,0.2);border:1px solid #dc3545;padding:10px;margin-bottom:15px;color:#dc3545;font-size:13px;"></div>
            <div id="signup-success" style="display:none;background:rgba(40,167,69,0.2);border:1px solid #28a745;padding:10px;margin-bottom:15px;color:#28a745;font-size:13px;"></div>
            
            <form id="signup-form" onsubmit="submitSignup(event)">
                <div style="margin-bottom:15px;">
                    <label style="display:block;margin-bottom:6px;color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;">Nom / Pseudo *</label>
                    <input type="text" id="signup-name" required style="width:100%;padding:10px;background:#000;border:1px solid #fff;color:#fff;" placeholder="Ex. BlitzMaster">
                </div>
                
                <div style="margin-bottom:15px;">
                    <label style="display:block;margin-bottom:6px;color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;">Email *</label>
                    <input type="email" id="signup-email" required style="width:100%;padding:10px;background:#000;border:1px solid #fff;color:#fff;" placeholder="votre@email.com">
                </div>
                
                <div style="margin-bottom:15px;">
                    <label style="display:block;margin-bottom:6px;color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;">Mot de passe *</label>
                    <input type="password" id="signup-password" required style="width:100%;padding:10px;background:#000;border:1px solid #fff;color:#fff;" placeholder="Minimum 8 caractères">
                </div>
                
                <div style="margin-bottom:15px;">
                    <label style="display:block;margin-bottom:6px;color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;">Confirmer mot de passe *</label>
                    <input type="password" id="signup-password-confirm" required style="width:100%;padding:10px;background:#000;border:1px solid #fff;color:#fff;" placeholder="Confirmez votre mot de passe">
                </div>
                
                <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
                    <button type="submit" style="flex:1;padding:12px;background:#33C6FF;border:none;color:#000;font-size:13px;font-weight:900;cursor:pointer;text-transform:uppercase;">
                        Créer mon compte
                    </button>
                    <button type="button" onclick="closeSignupModal()" style="flex:1;padding:12px;background:#555;border:none;color:#fff;font-size:13px;font-weight:900;cursor:pointer;text-transform:uppercase;">
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeSignupModal() {
    const modal = document.getElementById('signup-modal');
    if (modal) {
        modal.remove();
    }
}

async function submitSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-password-confirm').value;
    
    const errorDiv = document.getElementById('signup-error');
    const successDiv = document.getElementById('signup-success');
    
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    if (!name || !email || !password || !confirmPassword) {
        errorDiv.textContent = '❌ Veuillez remplir tous les champs';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password.length < 8) {
        errorDiv.textContent = '❌ Le mot de passe doit contenir au moins 8 caractères';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password !== confirmPassword) {
        errorDiv.textContent = '❌ Les mots de passe ne correspondent pas';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        const response = await registerUser(name, email, password);
        
        if (response.success && response.data) {
            successDiv.textContent = '✅ Compte créé avec succès ! Vous pouvez maintenant vous connecter.';
            successDiv.style.display = 'block';
            
            document.getElementById('signup-form').reset();
            
            setTimeout(() => {
                closeSignupModal();
            }, 2000);
        } else {
            errorDiv.textContent = '❌ ' + (response.message || 'Erreur lors de la création du compte');
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Erreur lors de la création du compte:', error);
        errorDiv.textContent = '❌ Erreur de connexion au serveur';
        errorDiv.style.display = 'block';
    }
}

// ========== VÉRIFIER SI DÉJÀ CONNECTÉ ========== 
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        checkLoginStatus();
        loadDiscordLink(); // ✅ CHARGER LE LIEN DISCORD
    }
});

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const isAdmin = localStorage.getItem('isAdmin');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    const apiKey = localStorage.getItem('apiKey');
    
    if (isLoggedIn === 'true') {
        const loginSection = document.querySelector('.login-section-right');
        if (loginSection) {
            if (isAdmin === 'true' && apiKey) {
                loginSection.innerHTML = `
                    <div style="text-align:center;padding:15px;">
                        <div style="width:60px;height:60px;background:#33C6FF;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 15px;font-size:28px;">
                            👑
                        </div>
                        <h3 style="color:#33C6FF;font-size:16px;margin-bottom:8px;text-transform:uppercase;">Compte Admin</h3>
                        <p style="color:#fff;font-size:12px;margin-bottom:3px;font-weight:700;">Connecté en tant que:</p>
                        <p style="color:#aaa;font-size:12px;margin-bottom:15px;">${userName || 'Admin'}</p>
                        
                        <button onclick="window.location.href='Admin/admin.html'" class="btn-login" style="margin-bottom:8px;padding:10px;">
                            🎮 Panel Admin
                        </button>
                        
                        <button onclick="logoutUser()" class="btn-signup" style="padding:10px;">
                            🚪 Déconnexion
                        </button>
                    </div>
                `;
            } else {
                loginSection.innerHTML = `
                    <div style="text-align:center;padding:15px;">
                        <div style="width:60px;height:60px;background:#33C6FF;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 15px;font-size:28px;">
                            👤
                        </div>
                        <h3 style="color:#33C6FF;font-size:16px;margin-bottom:8px;text-transform:uppercase;">Mon Compte</h3>
                        <p style="color:#fff;font-size:12px;margin-bottom:3px;font-weight:700;">Connecté en tant que:</p>
                        <p style="color:#aaa;font-size:11px;margin-bottom:3px;">${userName || 'Utilisateur'}</p>
                        <p style="color:#666;font-size:10px;margin-bottom:15px;">${userEmail || ''}</p>
                        
                        <button onclick="showPage('home')" class="btn-login" style="margin-bottom:8px;padding:10px;">
                            🏆 Voir les tournois
                        </button>
                        
                        <button onclick="logoutUser()" class="btn-signup" style="padding:10px;">
                            🚪 Déconnexion
                        </button>
                    </div>
                `;
            }
            
            if (isAdmin === 'true' && apiKey && document.getElementById('api-key-input')) {
                document.getElementById('api-key-input').value = apiKey;
            }
        }
    }
}

function logoutUser() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        localStorage.clear();
        alert('✅ Déconnexion réussie !');
        location.reload();
    }
}