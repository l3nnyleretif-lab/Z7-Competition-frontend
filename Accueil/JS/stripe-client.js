// ========== GESTION PAIEMENTS STRIPE CÔTÉ CLIENT ========== 

// Clé publique Stripe (mode TEST)
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SudQa5DPvK4E4MqiaZUdE4dpqZsxjqGwDgP9HQDBOIRQJ1vQQ4wtYw8bDWv9eKz877Mx2sRqNdugxTAFFCfQcLB006aX4xG8v';

// ========== OUVRIR LE POP-UP DES FORFAITS ========== 
function openStripePlansModal() {
    // Vérifier si l'utilisateur est connecté
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
        alert('⚠️ Vous devez d\'abord créer un compte pour souscrire à un forfait !');
        showSignup(); // Ouvrir le formulaire d'inscription
        return;
    }
    
    // Afficher le modal
    const modal = document.getElementById('stripe-plans-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// ========== FERMER LE POP-UP ========== 
function closeStripePlansModal() {
    const modal = document.getElementById('stripe-plans-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Fermer en cliquant sur l'overlay
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('stripe-plans-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeStripePlansModal();
            }
        });
    }
});

// ========== CRÉER UNE SESSION DE PAIEMENT STRIPE ========== 
async function createStripeCheckout(plan) {
    try {
        // Vérifier que l'utilisateur est connecté
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert('⚠️ Vous devez être connecté pour souscrire à un forfait');
            return;
        }
        
        // Désactiver le bouton pendant le chargement
        const button = event.target;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = '⏳ Chargement...';
        
        // Appeler l'API backend pour créer une session Stripe
        const response = await fetch(`${API_URL}/stripe/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ plan }) // 'monthly' ou 'annual'
        });
        
        const data = await response.json();
        
        if (data.success && data.url) {
            // Rediriger vers la page de paiement Stripe
            window.location.href = data.url;
        } else {
            alert('❌ ' + (data.message || 'Erreur lors de la création de la session de paiement'));
            button.disabled = false;
            button.textContent = originalText;
        }
        
    } catch (error) {
        console.error('❌ Erreur createStripeCheckout:', error);
        alert('❌ Erreur de connexion au serveur');
        button.disabled = false;
        button.textContent = originalText;
    }
}

// ========== AFFICHER LE FORMULAIRE DE DEMANDE GRATUITE ========== 
function showFreeApiRequestForm() {
    closeStripePlansModal();
    
    // Scroller vers le formulaire de demande
    const form = document.getElementById('api-request-form');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ========== GÉRER LES REDIRECTIONS APRÈS PAIEMENT ========== 
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si on revient d'un paiement Stripe
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
        // Paiement réussi
        showPaymentSuccessMessage();
        
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'canceled') {
        // Paiement annulé
        showPaymentCanceledMessage();
        
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

// ========== AFFICHER LE MESSAGE DE SUCCÈS AVEC POLLING ========== 
function showPaymentSuccessMessage() {
    // Afficher un modal de chargement
    showLoadingModal();
    
    // Attendre que la clé API soit générée (polling)
    checkApiKeyGeneration();
}

// Modal de chargement
function showLoadingModal() {
    const modal = document.createElement('div');
    modal.id = 'payment-loading-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10001;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background:#1a1a1a;border:2px solid #33C6FF;padding:40px;max-width:500px;width:100%;text-align:center;border-radius:8px;">
            <div style="font-size:64px;margin-bottom:20px;">⏳</div>
            <h2 style="color:#33C6FF;font-size:28px;margin-bottom:15px;text-transform:uppercase;">Traitement en cours...</h2>
            <p style="color:#fff;font-size:16px;line-height:1.6;margin-bottom:20px;">
                Votre paiement a été accepté !<br>
                Génération de votre clé API en cours...
            </p>
            <div style="width:100%;height:4px;background:#333;border-radius:2px;overflow:hidden;margin-top:20px;">
                <div style="width:0%;height:100%;background:#33C6FF;animation:progress 3s ease-in-out infinite;"></div>
            </div>
            <style>
                @keyframes progress {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    100% { width: 100%; }
                }
            </style>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Vérifier si la clé API a été générée
async function checkApiKeyGeneration(attempt = 0) {
    const maxAttempts = 20; // 20 tentatives max (20 secondes)
    
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('❌ Pas de token');
            showErrorModal();
            return;
        }
        
        // Appeler l'API pour récupérer les infos utilisateur
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.apiKey) {
            // Clé API générée ! Mettre à jour localStorage
            localStorage.setItem('apiKey', data.data.apiKey);
            localStorage.setItem('subscriptionStatus', data.data.subscriptionStatus || 'active');
            localStorage.setItem('subscriptionEndDate', data.data.subscriptionEndDate || null);
            localStorage.setItem('subscriptionPlan', data.data.subscriptionPlan || null);
            localStorage.setItem('stripeSubscriptionId', data.data.stripeSubscriptionId || null);
            localStorage.setItem('hasApiAccess', 'true');
            
            // Fermer le modal de chargement
            const loadingModal = document.getElementById('payment-loading-modal');
            if (loadingModal) loadingModal.remove();
            
            // Afficher le modal de succès avec la clé
            showSuccessModalWithKey(data.data.apiKey);
        } else {
            // Clé pas encore générée, réessayer
            if (attempt < maxAttempts) {
                setTimeout(() => {
                    checkApiKeyGeneration(attempt + 1);
                }, 1000); // Réessayer après 1 seconde
            } else {
                // Timeout : afficher un message d'erreur
                showTimeoutModal();
            }
        }
    } catch (error) {
        console.error('❌ Erreur checkApiKeyGeneration:', error);
        if (attempt < maxAttempts) {
            setTimeout(() => {
                checkApiKeyGeneration(attempt + 1);
            }, 1000);
        } else {
            showErrorModal();
        }
    }
}

// Modal de succès avec la clé API
function showSuccessModalWithKey(apiKey) {
    const modal = document.createElement('div');
    modal.id = 'payment-success-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10001;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background:#1a1a1a;border:2px solid #28a745;padding:40px;max-width:600px;width:100%;text-align:center;position:relative;border-radius:8px;">
            <!-- Bouton fermer -->
            <button onclick="document.getElementById('payment-success-modal').remove();location.reload();" style="position:absolute;top:15px;right:15px;background:transparent;border:none;color:#fff;font-size:32px;cursor:pointer;line-height:1;padding:5px 10px;transition:color 0.2s;" onmouseover="this.style.color='#28a745'" onmouseout="this.style.color='#fff'">
                ×
            </button>
            
            <div style="font-size:64px;margin-bottom:20px;">🎉</div>
            <h2 style="color:#28a745;font-size:28px;margin-bottom:15px;text-transform:uppercase;">Paiement réussi !</h2>
            <p style="color:#fff;font-size:16px;line-height:1.6;margin-bottom:25px;">
                Votre abonnement a été activé avec succès !<br>
                Voici votre clé API pour accéder au panneau streamer :
            </p>
            
            <!-- Bloc clé API -->
            <div style="background:#000;border:2px solid #28a745;padding:20px;margin-bottom:25px;border-radius:6px;">
                <p style="color:#aaa;font-size:13px;margin-bottom:10px;text-transform:uppercase;font-weight:bold;">🔑 Votre clé API</p>
                <div style="background:#1a1a1a;padding:15px;border:1px solid #28a745;border-radius:4px;margin-bottom:15px;font-family:monospace;color:#28a745;font-size:16px;word-break:break-all;">
                    ${apiKey}
                </div>
                <button onclick="copyApiKey('${apiKey}')" style="padding:12px 30px;background:#28a745;border:none;color:#fff;font-size:14px;font-weight:bold;cursor:pointer;border-radius:6px;transition:background 0.2s;" onmouseover="this.style.background='#20803a'" onmouseout="this.style.background='#28a745'">
                    📋 Copier la clé
                </button>
            </div>
            
            <p style="color:#fbbf24;font-size:14px;margin-bottom:20px;line-height:1.6;">
                ⚠️ <strong>Conservez cette clé précieusement !</strong><br>
                Vous en aurez besoin pour accéder au panneau streamer.
            </p>
            
            <p style="color:#aaa;font-size:13px;margin-bottom:25px;">
                Un email de confirmation a également été envoyé à votre adresse.<br>
                (Vérifiez vos spams si vous ne le voyez pas)
            </p>
            
            <button onclick="document.getElementById('payment-success-modal').remove();window.location.href='Admin/admin.html';" style="padding:15px 40px;background:#33C6FF;border:none;color:#000;font-size:16px;font-weight:900;cursor:pointer;text-transform:uppercase;border-radius:6px;margin-right:10px;transition:background 0.2s;" onmouseover="this.style.background='#2ab0e8'" onmouseout="this.style.background='#33C6FF'">
                Accéder au panneau
            </button>
            
            <button onclick="document.getElementById('payment-success-modal').remove();location.reload();" style="padding:15px 40px;background:#555;border:none;color:#fff;font-size:16px;font-weight:900;cursor:pointer;text-transform:uppercase;border-radius:6px;transition:background 0.2s;" onmouseover="this.style.background='#666'" onmouseout="this.style.background='#555'">
                Fermer
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Fonction pour copier la clé API
function copyApiKey(apiKey) {
    // Utiliser l'élément qui a déclenché l'événement
    const button = window.event ? window.event.target : null;
    
    navigator.clipboard.writeText(apiKey).then(() => {
        if (button) {
            const originalText = button.innerHTML;
            button.innerHTML = '✅ Copié !';
            button.style.background = '#20803a';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '#28a745';
            }, 2000);
        } else {
            alert('✅ Clé API copiée dans le presse-papier !');
        }
    }).catch(err => {
        console.error('Erreur copie:', err);
        alert('❌ Erreur lors de la copie. Copiez manuellement la clé.');
    });
}

// Modal d'erreur
function showErrorModal() {
    const loadingModal = document.getElementById('payment-loading-modal');
    if (loadingModal) loadingModal.remove();
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10001;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background:#1a1a1a;border:2px solid #FF6B35;padding:40px;max-width:500px;width:100%;text-align:center;border-radius:8px;">
            <div style="font-size:64px;margin-bottom:20px;">⚠️</div>
            <h2 style="color:#FF6B35;font-size:28px;margin-bottom:15px;text-transform:uppercase;">Erreur technique</h2>
            <p style="color:#fff;font-size:16px;line-height:1.6;margin-bottom:25px;">
                Une erreur est survenue lors de la génération de votre clé API.<br>
                Veuillez contacter le support.
            </p>
            <button onclick="this.parentElement.parentElement.remove();location.reload();" style="padding:15px 40px;background:#33C6FF;border:none;color:#000;font-size:16px;font-weight:900;cursor:pointer;text-transform:uppercase;border-radius:6px;">
                Fermer
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Modal de timeout
function showTimeoutModal() {
    const loadingModal = document.getElementById('payment-loading-modal');
    if (loadingModal) loadingModal.remove();
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10001;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background:#1a1a1a;border:2px solid #fbbf24;padding:40px;max-width:500px;width:100%;text-align:center;border-radius:8px;">
            <div style="font-size:64px;margin-bottom:20px;">⏰</div>
            <h2 style="color:#fbbf24;font-size:28px;margin-bottom:15px;text-transform:uppercase;">Génération en cours...</h2>
            <p style="color:#fff;font-size:16px;line-height:1.6;margin-bottom:25px;">
                La génération de votre clé API prend plus de temps que prévu.<br>
                Vous recevrez un email avec votre clé dans quelques minutes.
            </p>
            <button onclick="this.parentElement.parentElement.remove();location.reload();" style="padding:15px 40px;background:#33C6FF;border:none;color:#000;font-size:16px;font-weight:900;cursor:pointer;text-transform:uppercase;border-radius:6px;">
                Compris
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Modal paiement annulé
function showPaymentCanceledMessage() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10001;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background:#1a1a1a;border:2px solid #FF6B35;padding:40px;max-width:500px;width:100%;text-align:center;border-radius:8px;">
            <div style="font-size:64px;margin-bottom:20px;">⚠️</div>
            <h2 style="color:#FF6B35;font-size:28px;margin-bottom:15px;text-transform:uppercase;">Paiement annulé</h2>
            <p style="color:#fff;font-size:16px;line-height:1.6;margin-bottom:25px;">
                Votre paiement a été annulé.<br>
                Aucun montant n'a été débité.
            </p>
            <button onclick="this.parentElement.parentElement.remove();" style="padding:15px 40px;background:#33C6FF;border:none;color:#000;font-size:16px;font-weight:900;cursor:pointer;text-transform:uppercase;border-radius:6px;">
                Retour
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

console.log('💳 Module Stripe chargé');