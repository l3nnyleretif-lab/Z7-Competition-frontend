// ========== AUTHENTIFICATION AVEC BACKEND - VERSION 3.1 ==========

// ✅ Charger le lien Discord depuis l'API
async function loadDiscordLink() {
    try {
        const response = await fetch(`${API_URL}/system-settings`);
        const data = await response.json();

        if (data.success && data.data.discordLink) {
            const discordLink = data.data.discordLink;

            document.querySelectorAll('a[href*="discord"], a[onclick*="Discord"]').forEach(link => {
                link.href = discordLink;
                link.onclick = null;
                link.target = '_blank';
            });

            console.log('✅ Lien Discord chargé:', discordLink);
        }
    } catch (error) {
        console.error('❌ Erreur chargement lien Discord:', error);
    }
}

// ========== SYNCHRONISER LES INFOS UTILISATEUR DEPUIS LE BACKEND ==========
// Appelé au chargement si l'utilisateur est connecté.
// Permet de récupérer automatiquement une clé API qui aurait été liée
// au compte par l'admin pendant que l'utilisateur était déconnecté.
async function refreshUserData() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success && data.data) {
            const user = data.data;

            // Mettre à jour toutes les infos dans localStorage
            localStorage.setItem('userName', user.name || '');
            localStorage.setItem('userEmail', user.email || '');
            localStorage.setItem('hasApiAccess', user.hasApiAccess ? 'true' : 'false');
            localStorage.setItem('isAdmin', user.isAdmin ? 'true' : 'false');
            localStorage.setItem('subscriptionStatus', user.subscriptionStatus || 'inactive');
            localStorage.setItem('subscriptionEndDate', user.subscriptionEndDate || null);
            localStorage.setItem('subscriptionPlan', user.subscriptionPlan || null);
            localStorage.setItem('stripeSubscriptionId', user.stripeSubscriptionId || null);

            // ✅ CLÉ : si le backend a une clé API pour cet user, on la sauvegarde
            if (user.apiKey) {
                localStorage.setItem('apiKey', user.apiKey);
            }

            console.log('✅ Données utilisateur synchronisées depuis le backend');
            console.log('   hasApiAccess:', user.hasApiAccess);
            console.log('   apiKey:', user.apiKey ? '✅ présente' : '❌ absente');

            return user;
        }
    } catch (error) {
        console.error('❌ Erreur refreshUserData:', error);
    }

    return null;
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

        console.log('Réponse loginWithApiKey:', response);

        if (response.success && response.data) {
            const user = response.data;

            if (!user.hasApiAccess) {
                alert('❌ Cette clé API n\'a pas accès au panel admin');
                return;
            }

            localStorage.setItem('token', user.token);
            localStorage.setItem('apiKey', user.apiKey);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userName', user.name);
            localStorage.setItem('userId', user.id);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('hasApiAccess', 'true');
            localStorage.setItem('subscriptionStatus', user.subscriptionStatus || 'inactive');
            localStorage.setItem('subscriptionEndDate', user.subscriptionEndDate || null);
            localStorage.setItem('stripeSubscriptionId', user.stripeSubscriptionId || null);
            localStorage.setItem('subscriptionPlan', user.subscriptionPlan || null);

            alert('✅ Connexion réussie avec clé API !');
            window.location.href = 'Admin/admin.html';
        } else {
            alert('❌ ' + (response.message || 'Clé API invalide'));
        }
    } catch (error) {
        console.error('Erreur lors de la connexion avec clé API:', error);
        alert('❌ Erreur de connexion au serveur. Vérifiez que le backend est lancé.');
    }
}

// ========== DEMANDE DE CLÉ API GRATUITE ==========

function showFreeApiRequestForm() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (!isLoggedIn || isLoggedIn !== 'true') {
        closeStripePlansModal();
        alert('⚠️ Vous devez être connecté pour faire une demande de clé API gratuite.\n\nCréez un compte ou connectez-vous d\'abord.');
        showPage('login');
        setTimeout(() => {
            const loginRight = document.querySelector('.login-section-right');
            if (loginRight) loginRight.scrollIntoView({ behavior: 'smooth' });
        }, 200);
        return;
    }

    closeStripePlansModal();

    // Pré-remplir le nom et l'email
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');

    const nameInput = document.getElementById('request-name');
    const emailInput = document.getElementById('request-email');

    if (nameInput && userName) nameInput.value = userName;
    if (emailInput && userEmail) emailInput.value = userEmail;

    document.getElementById('free-request-form').style.display = 'block';
    document.getElementById('free-request-form').scrollIntoView({ behavior: 'smooth' });
}

function hideFreeRequestForm() {
    document.getElementById('free-request-form').style.display = 'none';
}

async function submitApiRequest(event) {
    event.preventDefault();

    // Vérifier que l'utilisateur est connecté
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userId = localStorage.getItem('userId');

    if (!isLoggedIn || isLoggedIn !== 'true' || !userId) {
        alert('⚠️ Vous devez être connecté pour faire une demande de clé API.\n\nCréez un compte ou connectez-vous d\'abord.');
        hideFreeRequestForm();
        showPage('login');
        setTimeout(() => {
            const loginRight = document.querySelector('.login-section-right');
            if (loginRight) loginRight.scrollIntoView({ behavior: 'smooth' });
        }, 200);
        return;
    }

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
            localStorage.setItem('subscriptionStatus', user.subscriptionStatus || 'inactive');
            localStorage.setItem('subscriptionEndDate', user.subscriptionEndDate || null);
            localStorage.setItem('stripeSubscriptionId', user.stripeSubscriptionId || null);
            localStorage.setItem('subscriptionPlan', user.subscriptionPlan || null);

            if (user.hasApiAccess && user.apiKey) {
                localStorage.setItem('apiKey', user.apiKey);
            }

            alert('✅ Connexion réussie !');

            if (user.hasApiAccess) {
                window.location.href = 'Admin/admin.html';
            } else {
                checkLoginStatus();
                showPage('home');
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
    if (modal) modal.remove();
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
            const user = response.data;

            // ✅ Connexion automatique après inscription
            localStorage.setItem('token', user.token);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userName', name);
            localStorage.setItem('userId', user.id);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('isAdmin', 'false');
            localStorage.setItem('hasApiAccess', 'false');
            localStorage.setItem('subscriptionStatus', 'inactive');

            successDiv.textContent = '✅ Compte créé avec succès ! Connexion en cours...';
            successDiv.style.display = 'block';

            document.getElementById('signup-form').reset();

            // Fermer le modal et mettre à jour l'affichage sans recharger
            setTimeout(() => {
                closeSignupModal();
                checkLoginStatus();
                showPage('home');
            }, 1000);
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

// ========== INITIALISATION : REFRESH + VÉRIF STATUT ==========
document.addEventListener('DOMContentLoaded', async function () {
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        const isLoggedIn = localStorage.getItem('isLoggedIn');

        // ✅ Si connecté, on synchronise les données depuis le backend AVANT d'afficher
        // Cela permet de récupérer automatiquement la clé API si l'admin vient de l'approuver
        if (isLoggedIn === 'true') {
            await refreshUserData();
        }

        checkLoginStatus();
        loadDiscordLink();
    }
});

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const hasApiAccess = localStorage.getItem('hasApiAccess');
    const userName = localStorage.getItem('userName');
    const apiKey = localStorage.getItem('apiKey');

    if (isLoggedIn === 'true') {
        const loginSection = document.querySelector('.login-section-right');
        if (loginSection) {
            if (hasApiAccess === 'true' && apiKey) {
                // Utilisateur avec clé API active
                loginSection.innerHTML = `
                    <div style="text-align:center;padding:20px;">
                        <div style="width:70px;height:70px;background:#33C6FF;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 15px;font-size:32px;">
                            👑
                        </div>
                        <h3 style="color:#33C6FF;font-size:18px;margin-bottom:5px;text-transform:uppercase;">Compte Admin</h3>
                        <p style="color:#fff;font-size:13px;margin-bottom:3px;font-weight:700;">Connecté en tant que :</p>
                        <p style="color:#aaa;font-size:13px;margin-bottom:25px;">${userName || 'ADMIN'}</p>

                        <button onclick="openAccountSettings()" class="btn-login" style="width:100%;margin-bottom:10px;padding:12px;background:#1a1a1a;border:1px solid #33C6FF;color:#33C6FF;font-weight:bold;">
                            ⚙️ Paramètres
                        </button>

                        <button onclick="window.location.href='Admin/admin.html'" class="btn-login" style="width:100%;margin-bottom:10px;padding:14px;background:#33C6FF;color:#000;font-weight:bold;font-size:15px;">
                            🎮 Panel Admin
                        </button>

                        <button onclick="logoutUser()" class="btn-signup" style="width:100%;padding:12px;background:#ff6b35;color:#fff;font-weight:bold;">
                            🚪 Déconnexion
                        </button>
                    </div>
                `;
            } else {
                // Utilisateur connecté sans clé API
                loginSection.innerHTML = `
                    <div style="text-align:center;padding:20px;">
                        <div style="width:70px;height:70px;background:#33C6FF;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 15px;font-size:32px;">
                            👤
                        </div>
                        <h3 style="color:#33C6FF;font-size:18px;margin-bottom:5px;text-transform:uppercase;">Mon Compte</h3>
                        <p style="color:#fff;font-size:13px;margin-bottom:3px;font-weight:700;">Connecté en tant que :</p>
                        <p style="color:#aaa;font-size:13px;margin-bottom:25px;">${userName || 'Utilisateur'}</p>

                        <button onclick="openAccountSettings()" class="btn-login" style="width:100%;margin-bottom:10px;padding:12px;background:#1a1a1a;border:1px solid #33C6FF;color:#33C6FF;font-weight:bold;">
                            ⚙️ Paramètres
                        </button>

                        <button onclick="showPage('home')" class="btn-login" style="width:100%;margin-bottom:10px;padding:14px;background:#33C6FF;color:#000;font-weight:bold;font-size:15px;">
                            🏆 Voir les tournois
                        </button>

                        <button onclick="logoutUser()" class="btn-signup" style="width:100%;padding:12px;background:#ff6b35;color:#fff;font-weight:bold;">
                            🚪 Déconnexion
                        </button>
                    </div>
                `;
            }

            // Pré-remplir le champ clé API si présente
            if (hasApiAccess === 'true' && apiKey && document.getElementById('api-key-input')) {
                document.getElementById('api-key-input').value = apiKey;
            }
        }
    }
}

// ========== MODAL PARAMÈTRES DU COMPTE ==========
function openAccountSettings() {
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    const apiKey = localStorage.getItem('apiKey');
    const hasApiAccess = localStorage.getItem('hasApiAccess');
    const subscriptionStatus = localStorage.getItem('subscriptionStatus');
    const subscriptionPlan = localStorage.getItem('subscriptionPlan');
    const subscriptionEndDate = localStorage.getItem('subscriptionEndDate');

    const modal = document.createElement('div');
    modal.id = 'account-settings-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        overflow-y: auto;
    `;

    modal.innerHTML = `
        <div style="background:#1a1a1a;border:2px solid #33C6FF;padding:30px;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;border-radius:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;">
                <h2 style="color:#33C6FF;margin:0;text-transform:uppercase;font-size:24px;">⚙️ Paramètres du Compte</h2>
                <button onclick="closeAccountSettings()" style="background:transparent;border:none;color:#fff;font-size:28px;cursor:pointer;padding:0;line-height:1;">×</button>
            </div>

            <!-- INFORMATIONS PERSONNELLES -->
            <div style="margin-bottom:25px;padding:20px;background:#0a0a0a;border:1px solid #33C6FF;border-radius:8px;">
                <h3 style="color:#33C6FF;font-size:16px;margin-bottom:15px;text-transform:uppercase;">👤 Informations Personnelles</h3>
                <div style="margin-bottom:15px;">
                    <label style="display:block;color:#aaa;font-size:11px;margin-bottom:5px;text-transform:uppercase;">Nom / Pseudo</label>
                    <p style="color:#fff;font-size:14px;margin:0;font-weight:bold;">${userName || 'Non disponible'}</p>
                </div>
                <div style="margin-bottom:15px;">
                    <label style="display:block;color:#aaa;font-size:11px;margin-bottom:5px;text-transform:uppercase;">Email</label>
                    <p style="color:#fff;font-size:14px;margin:0;font-family:monospace;word-break:break-all;">${userEmail || 'Non disponible'}</p>
                </div>
                <button onclick="alert('Fonctionnalité à venir !')" style="width:100%;padding:10px;background:#1a1a1a;border:1px solid #33C6FF;color:#33C6FF;border-radius:6px;cursor:pointer;font-weight:bold;">
                    ✏️ Modifier mes informations
                </button>
            </div>

            <!-- SÉCURITÉ -->
            <div style="margin-bottom:25px;padding:20px;background:#0a0a0a;border:1px solid #33C6FF;border-radius:8px;">
                <h3 style="color:#33C6FF;font-size:16px;margin-bottom:15px;text-transform:uppercase;">🔒 Sécurité</h3>
                <div style="margin-bottom:15px;">
                    <label style="display:block;color:#aaa;font-size:11px;margin-bottom:5px;text-transform:uppercase;">Mot de passe</label>
                    <p style="color:#fff;font-size:14px;margin:0;">••••••••</p>
                </div>
                <button onclick="alert('Fonctionnalité à venir !')" style="width:100%;padding:10px;background:#1a1a1a;border:1px solid #33C6FF;color:#33C6FF;border-radius:6px;cursor:pointer;font-weight:bold;">
                    🔑 Changer le mot de passe
                </button>
            </div>

            <!-- CLÉ API -->
            ${hasApiAccess === 'true' && apiKey ? `
            <div style="margin-bottom:25px;padding:20px;background:#0a0a0a;border:1px solid #33C6FF;border-radius:8px;">
                <h3 style="color:#33C6FF;font-size:16px;margin-bottom:15px;text-transform:uppercase;">🔑 Clé API Streamer</h3>
                <div style="margin-bottom:15px;">
                    <label style="display:block;color:#aaa;font-size:11px;margin-bottom:5px;text-transform:uppercase;">Statut</label>
                    <p style="color:#28a745;font-size:14px;margin:0;font-weight:bold;">✅ Active</p>
                </div>
                <div style="margin-bottom:15px;">
                    <label style="display:block;color:#aaa;font-size:11px;margin-bottom:5px;text-transform:uppercase;">Clé</label>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <input type="password" id="settings-api-key-display" value="${apiKey}" readonly style="flex:1;padding:10px;background:#000;border:1px solid #33C6FF;color:#33C6FF;font-family:monospace;border-radius:4px;">
                        <button onclick="toggleApiKeyVisibilitySettings()" style="padding:10px 15px;background:#1a1a1a;border:1px solid #33C6FF;color:#fff;cursor:pointer;border-radius:4px;">
                            👁️
                        </button>
                    </div>
                </div>
                <button onclick="copyApiKeyFromSettings()" style="width:100%;padding:10px;background:#33C6FF;border:none;color:#000;border-radius:6px;cursor:pointer;font-weight:bold;">
                    📋 Copier la clé
                </button>
            </div>
            ` : `
            <div style="margin-bottom:25px;padding:20px;background:#0a0a0a;border:1px solid #ff6b35;border-radius:8px;">
                <h3 style="color:#ff6b35;font-size:16px;margin-bottom:15px;text-transform:uppercase;">🔑 Clé API Streamer</h3>
                <div style="margin-bottom:15px;">
                    <label style="display:block;color:#aaa;font-size:11px;margin-bottom:5px;text-transform:uppercase;">Statut</label>
                    <p style="color:#ff6b35;font-size:14px;margin:0;font-weight:bold;">❌ Aucune clé active</p>
                </div>
                <p style="color:#aaa;font-size:13px;margin-bottom:15px;">
                    Vous avez reçu une clé API ? Entrez-la ici pour l'activer sur votre compte :
                </p>
                <div style="margin-bottom:15px;">
                    <input type="text" id="manual-api-key-input" placeholder="Ex: abc123def456-PSEUDO-STREAMER" style="width:100%;padding:12px;background:#000;border:1px solid #33C6FF;color:#fff;border-radius:6px;font-family:monospace;font-size:13px;">
                </div>
                <button onclick="activateManualApiKey()" style="width:100%;padding:12px;background:#28a745;border:none;color:#fff;border-radius:6px;cursor:pointer;font-weight:bold;margin-bottom:15px;">
                    ✅ Activer ma clé
                </button>
                <div style="text-align:center;margin:20px 0;color:#666;font-size:12px;text-transform:uppercase;">
                    ─────── OU ───────
                </div>
                <p style="color:#aaa;font-size:13px;margin-bottom:15px;">Souscrire à un abonnement ou demander une clé gratuite :</p>
                <div style="display:flex;gap:10px;">
                    <button onclick="closeAccountSettings(); openStripePlansModal();" style="flex:1;padding:10px;background:#33C6FF;border:none;color:#000;border-radius:6px;cursor:pointer;font-weight:bold;">
                        💳 Souscrire
                    </button>
                    <button onclick="closeAccountSettings(); showFreeApiRequestForm();" style="flex:1;padding:10px;background:#1a1a1a;border:1px solid #33C6FF;color:#33C6FF;border-radius:6px;cursor:pointer;font-weight:bold;">
                        📝 Demander
                    </button>
                </div>
            </div>
            `}

            <!-- ABONNEMENT -->
            ${subscriptionStatus === 'active' ? `
            <div style="margin-bottom:25px;padding:20px;background:#0a0a0a;border:1px solid #33C6FF;border-radius:8px;">
                <h3 style="color:#33C6FF;font-size:16px;margin-bottom:15px;text-transform:uppercase;">💳 Abonnement</h3>
                <div style="margin-bottom:15px;">
                    <label style="display:block;color:#aaa;font-size:11px;margin-bottom:5px;text-transform:uppercase;">Plan actuel</label>
                    <p style="color:#fff;font-size:14px;margin:0;font-weight:bold;">
                        ${subscriptionPlan === 'monthly' ? 'Mensuel (5€/mois)' : subscriptionPlan === 'annual' ? 'Annuel (48€/an)' : 'Non défini'}
                    </p>
                </div>
                <div style="margin-bottom:15px;">
                    <label style="display:block;color:#aaa;font-size:11px;margin-bottom:5px;text-transform:uppercase;">Date d'expiration</label>
                    <p style="color:#fff;font-size:14px;margin:0;">
                        ${subscriptionEndDate && subscriptionEndDate !== 'null'
                            ? new Date(subscriptionEndDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                            : '♾️ Illimité'}
                    </p>
                </div>
                <button onclick="closeAccountSettings();" style="width:100%;padding:10px;background:#33C6FF;border:none;color:#000;border-radius:6px;cursor:pointer;font-weight:bold;">
                    ⚙️ Gérer mon abonnement
                </button>
            </div>
            ` : ''}

            <!-- BOUTON FERMER -->
            <button onclick="closeAccountSettings()" style="width:100%;padding:14px;background:#ff6b35;border:none;color:#fff;border-radius:6px;cursor:pointer;font-weight:bold;font-size:15px;margin-top:10px;">
                ❌ Fermer
            </button>
        </div>
    `;

    document.body.appendChild(modal);
}

function closeAccountSettings() {
    const modal = document.getElementById('account-settings-modal');
    if (modal) modal.remove();
}

function toggleApiKeyVisibilitySettings() {
    const input = document.getElementById('settings-api-key-display');
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

function copyApiKeyFromSettings() {
    const apiKey = localStorage.getItem('apiKey');
    if (navigator.clipboard && apiKey) {
        navigator.clipboard.writeText(apiKey).then(() => {
            alert('✅ Clé API copiée dans le presse-papier !');
        }).catch(() => {
            alert('❌ Erreur lors de la copie');
        });
    }
}

// ========== ACTIVER UNE CLÉ API MANUELLEMENT ==========
async function activateManualApiKey() {
    const apiKeyInput = document.getElementById('manual-api-key-input');
    const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';

    if (!apiKey) {
        alert('❌ Veuillez entrer une clé API');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/link-api-key`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ apiKey })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('apiKey', data.data.apiKey || apiKey);
            localStorage.setItem('hasApiAccess', 'true');
            localStorage.setItem('isAdmin', data.data.isAdmin ? 'true' : 'false');
            localStorage.setItem('subscriptionStatus', data.data.subscriptionStatus || 'active');
            localStorage.setItem('subscriptionEndDate', data.data.subscriptionEndDate || null);

            alert('✅ Clé API activée avec succès !\n\nVous allez être redirigé vers le panel admin.');

            closeAccountSettings();
            window.location.href = 'Admin/admin.html';
        } else {
            alert('❌ ' + (data.message || 'Clé API invalide ou déjà utilisée'));
        }
    } catch (error) {
        console.error('Erreur lors de l\'activation de la clé:', error);
        alert('❌ Erreur de connexion au serveur');
    }
}

// ========== DÉCONNEXION ==========
function logoutUser() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        localStorage.clear();
        alert('✅ Déconnexion réussie !');
        location.reload();
    }
}