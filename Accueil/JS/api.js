// ========== API CLIENT - COMMUNICATION AVEC LE BACKEND ========== 

const API_URL = 'https://z7-competition-backend.onrender.com/api';

// Récupérer le token depuis localStorage
const getToken = () => localStorage.getItem('token');

// Récupérer la clé API depuis localStorage
const getApiKey = () => localStorage.getItem('apiKey');

// ========== AUTHENTIFICATION ========== 

// Créer un compte
async function registerUser(name, email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur register:', error);
        return { success: false, message: 'Erreur de connexion au serveur' };
    }
}

// Connexion classique
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur login:', error);
        return { success: false, message: 'Erreur de connexion au serveur' };
    }
}

// Connexion avec clé API
async function loginWithApiKey(apiKey) {
    try {
        console.log('🔐 Tentative de connexion avec clé API:', apiKey); // DEBUG
        
        const response = await fetch(`${API_URL}/auth/login-with-api-key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey })
        });
        
        const data = await response.json();
        console.log('📡 Réponse du serveur:', data); // DEBUG
        
        return data;
    } catch (error) {
        console.error('❌ Erreur login API key:', error);
        return { success: false, message: 'Erreur de connexion au serveur. Vérifiez que le backend est lancé sur https://z7-competition-backend.onrender.com' };
    }
}

// Obtenir les infos utilisateur
async function getMe() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur getMe:', error);
        return { success: false, message: 'Erreur de connexion au serveur' };
    }
}

// ========== TOURNOIS ========== 

// Obtenir tous les tournois (public)
async function getAllTournaments(filters = {}) {
    try {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_URL}/tournaments?${params}`);
        return await response.json();
    } catch (error) {
        console.error('Erreur getAllTournaments:', error);
        return { success: false, message: 'Erreur de connexion au serveur', data: [] };
    }
}

// Obtenir un tournoi par ID
async function getTournamentById(id) {
    try {
        const response = await fetch(`${API_URL}/tournaments/${id}`);
        return await response.json();
    } catch (error) {
        console.error('Erreur getTournamentById:', error);
        return { success: false, message: 'Erreur de connexion au serveur' };
    }
}

// Obtenir MES tournois (panel admin personnel)
async function getMyTournaments() {
    try {
        const response = await fetch(`${API_URL}/tournaments/my/list`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur getMyTournaments:', error);
        return { success: false, message: 'Erreur de connexion au serveur', data: [] };
    }
}

// Créer un tournoi
async function createTournament(tournamentData) {
    try {
        const response = await fetch(`${API_URL}/tournaments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(tournamentData)
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur createTournament:', error);
        return { success: false, message: 'Erreur de connexion au serveur' };
    }
}

// Modifier un tournoi
async function updateTournament(id, tournamentData) {
    try {
        const response = await fetch(`${API_URL}/tournaments/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(tournamentData)
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur updateTournament:', error);
        return { success: false, message: 'Erreur de connexion au serveur' };
    }
}

// Supprimer un tournoi
async function deleteTournament(id) {
    try {
        const response = await fetch(`${API_URL}/tournaments/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur deleteTournament:', error);
        return { success: false, message: 'Erreur de connexion au serveur' };
    }
}

// ========== CLASSEMENTS ========== 

// Obtenir le classement d'une étape
async function getLeaderboard(tournamentId, stageId) {
    try {
        const response = await fetch(`${API_URL}/leaderboard/${tournamentId}/${stageId}`);
        return await response.json();
    } catch (error) {
        console.error('Erreur getLeaderboard:', error);
        return { success: false, message: 'Erreur de connexion au serveur', data: { players: [] } };
    }
}

// ========== DEMANDE CLÉ API ========== 

// Soumettre une demande de clé API
async function submitApiKeyRequest(requestData) {
    try {
        const response = await fetch(`${API_URL}/apikeys/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur submitApiKeyRequest:', error);
        return { success: false, message: 'Erreur de connexion au serveur' };
    }
}

// ========== ADMIN (SUPER ADMIN UNIQUEMENT) ========== 

// Obtenir toutes les demandes de clé API
async function getAllApiKeyRequests(status) {
    try {
        const params = status ? `?status=${status}` : '';
        const response = await fetch(`${API_URL}/admin/requests${params}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur getAllApiKeyRequests:', error);
        return { success: false, message: 'Erreur de connexion au serveur', data: [] };
    }
}

// Approuver une demande
async function approveApiKeyRequest(requestId) {
    try {
        const response = await fetch(`${API_URL}/admin/requests/${requestId}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur approveApiKeyRequest:', error);
        return { success: false, message: 'Erreur de connexion au serveur' };
    }
}

// Rejeter une demande
async function rejectApiKeyRequest(requestId, reason) {
    try {
        const response = await fetch(`${API_URL}/admin/requests/${requestId}/reject`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ reason })
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur rejectApiKeyRequest:', error);
        return { success: false, message: 'Erreur de connexion au serveur' };
    }
}

// Obtenir tous les utilisateurs
async function getAllUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur getAllUsers:', error);
        return { success: false, message: 'Erreur de connexion au serveur', data: [] };
    }
}

// Obtenir les stats globales
async function getGlobalStats() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Erreur getGlobalStats:', error);
        return { success: false, message: 'Erreur de connexion au serveur' };
    }
}