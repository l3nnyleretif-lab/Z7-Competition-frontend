// ========== ADMIN DASHBOARD - STATS DEPUIS API + INFOS ABONNEMENT ========== 

async function updateAdminStats() {
    try {
        // Charger MES tournois
        const response = await getMyTournaments();
        
        if (response.success && response.data) {
            const tournaments = response.data;
            const totalTournaments = tournaments.length;
            const activeTournaments = tournaments.filter(t => !t.isFinished).length;
            
            // Mettre à jour les stats
            const statTotal = document.getElementById('stat-total');
            const statActive = document.getElementById('stat-active');
            
            if (statTotal) statTotal.textContent = totalTournaments;
            if (statActive) statActive.textContent = activeTournaments;
            
            console.log('✅ Stats mises à jour:', { totalTournaments, activeTournaments });
        } else {
            console.error('❌ Erreur lors du chargement des stats');
        }
    } catch (error) {
        console.error('❌ Erreur updateAdminStats:', error);
    }
    
    // Charger les infos d'abonnement
    await loadSubscriptionInfo();
}

// ========== CHARGER LES INFOS D'ABONNEMENT ========== 
async function loadSubscriptionInfo() {
    try {
        // Récupérer les infos depuis localStorage (stockées lors de la connexion)
        const subscriptionStatus = localStorage.getItem('subscriptionStatus');
        const subscriptionEndDate = localStorage.getItem('subscriptionEndDate');
        const stripeSubscriptionId = localStorage.getItem('stripeSubscriptionId');
        
        console.log('📊 Infos abonnement:', { subscriptionStatus, subscriptionEndDate, stripeSubscriptionId });
        
        // Éléments DOM
        const statusElement = document.getElementById('subscription-status');
        const endDateElement = document.getElementById('subscription-end-date');
        const daysLeftElement = document.getElementById('subscription-days-left');
        const renewButton = document.getElementById('renew-subscription-btn');
        const manageButton = document.getElementById('manage-subscription-btn');
        const remainingContainer = document.getElementById('subscription-remaining');
        
        if (!statusElement || !endDateElement) {
            console.warn('⚠️ Éléments DOM non trouvés');
            return;
        }
        
        // Vérifier si l'abonnement est illimité
        if (!subscriptionEndDate || subscriptionEndDate === 'null' || subscriptionEndDate === 'undefined') {
            // Abonnement illimité
            statusElement.textContent = '✅ Actif (Illimité)';
            statusElement.style.color = '#4ade80';
            endDateElement.textContent = '♾️ Illimité';
            endDateElement.style.color = '#4ade80';
            if (remainingContainer) remainingContainer.style.display = 'none';
            if (renewButton) renewButton.style.display = 'none';
            if (manageButton) manageButton.style.display = 'none';
            return;
        }
        
        // Calculer les jours restants
        const endDate = new Date(subscriptionEndDate);
        const now = new Date();
        const diffTime = endDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Formater la date d'expiration
        const formattedDate = endDate.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Afficher les infos selon le statut
        if (diffDays > 0) {
            // Actif
            if (subscriptionStatus === 'canceled') {
                statusElement.textContent = '⚠️ Annulé (actif jusqu\'à expiration)';
                statusElement.style.color = '#fbbf24';
            } else {
                statusElement.textContent = '✅ Actif';
                statusElement.style.color = '#4ade80';
            }
            
            endDateElement.textContent = formattedDate;
            endDateElement.style.color = '#33C6FF';
            
            if (daysLeftElement) {
                daysLeftElement.textContent = `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                
                // Couleur selon le temps restant
                if (diffDays <= 7) {
                    daysLeftElement.style.color = '#ff6b35'; // Orange
                } else if (diffDays <= 30) {
                    daysLeftElement.style.color = '#fbbf24'; // Jaune
                } else {
                    daysLeftElement.style.color = '#4ade80'; // Vert
                }
            }
            
            if (remainingContainer) remainingContainer.style.display = 'flex';
            
            // Afficher le bouton "Gérer" si abonnement Stripe (actif OU annulé)
            if (manageButton && stripeSubscriptionId && (subscriptionStatus === 'active' || subscriptionStatus === 'canceled')) {
                manageButton.style.display = 'block';
            } else if (manageButton) {
                manageButton.style.display = 'none';
            }
            
            if (renewButton) renewButton.style.display = 'none';
            
        } else {
            // Expiré
            statusElement.textContent = '❌ Expiré';
            statusElement.style.color = '#ff6b35';
            endDateElement.textContent = formattedDate;
            endDateElement.style.color = '#ff6b35';
            
            if (daysLeftElement) {
                daysLeftElement.textContent = 'Expiré';
                daysLeftElement.style.color = '#ff6b35';
            }
            
            if (renewButton) renewButton.style.display = 'block';
            if (manageButton) manageButton.style.display = 'none';
        }
        
    } catch (error) {
        console.error('❌ Erreur loadSubscriptionInfo:', error);
        
        // Afficher un message d'erreur
        const statusElement = document.getElementById('subscription-status');
        if (statusElement) {
            statusElement.textContent = '⚠️ Erreur de chargement';
            statusElement.style.color = '#ff6b35';
        }
    }
}

// ========== GÉRER L'ABONNEMENT (MODAL) ========== 
function openManageSubscriptionModal() {
    const subscriptionStatus = localStorage.getItem('subscriptionStatus');
    const subscriptionPlan = localStorage.getItem('subscriptionPlan');
    const subscriptionEndDate = localStorage.getItem('subscriptionEndDate');
    
    // Calculer les jours restants
    const endDate = new Date(subscriptionEndDate);
    const now = new Date();
    const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    const formattedDate = endDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    // Déterminer l'autre formule
    const currentPlan = subscriptionPlan || 'monthly';
    const otherPlan = currentPlan === 'monthly' ? 'annual' : 'monthly';
    const currentPlanName = currentPlan === 'monthly' ? 'Mensuel (5€/mois)' : 'Annuel (48€/an)';
    const otherPlanName = otherPlan === 'monthly' ? 'Mensuel (5€/mois)' : 'Annuel (48€/an)';
    
    // Créer le modal
    const modal = document.createElement('div');
    modal.id = 'manage-subscription-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;
    
    const isActive = subscriptionStatus === 'active';
    const isCanceled = subscriptionStatus === 'canceled';
    
    modal.innerHTML = `
        <div style="background:#1a1a1a;border:2px solid #33C6FF;padding:30px;max-width:600px;width:100%;border-radius:8px;max-height:90vh;overflow-y:auto;">
            <h2 style="color:#33C6FF;margin-bottom:20px;text-transform:uppercase;font-size:22px;text-align:center;">
                ⚙️ Gestion de l'abonnement
            </h2>
            
            <!-- Infos actuelles -->
            <div style="background:#000;border:1px solid #33C6FF;padding:20px;margin-bottom:20px;border-radius:6px;">
                <h3 style="color:#33C6FF;font-size:16px;margin-bottom:15px;">📊 Abonnement actuel</h3>
                <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                    <span style="color:#aaa;">Formule :</span>
                    <span style="color:#fff;font-weight:bold;">${currentPlanName}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                    <span style="color:#aaa;">Statut :</span>
                    <span style="color:${isCanceled ? '#fbbf24' : '#4ade80'};font-weight:bold;">
                        ${isCanceled ? '⚠️ Annulé' : '✅ Actif'}
                    </span>
                </div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="color:#aaa;">Expire le :</span>
                    <span style="color:#33C6FF;font-weight:bold;">${formattedDate} (${diffDays} jours)</span>
                </div>
            </div>
            
            ${isCanceled ? `
            <!-- Si annulé : Option de réactivation -->
            <div style="background:rgba(251, 191, 36, 0.1);border:1px solid #fbbf24;padding:20px;margin-bottom:20px;border-radius:6px;">
                <h3 style="color:#fbbf24;font-size:16px;margin-bottom:10px;">⚠️ Abonnement annulé</h3>
                <p style="color:#aaa;font-size:14px;line-height:1.6;margin-bottom:15px;">
                    Votre abonnement ne sera pas renouvelé automatiquement. Votre clé API restera active jusqu'au ${formattedDate}.
                </p>
                <button onclick="reactivateSubscription()" style="width:100%;padding:12px;background:#4ade80;border:none;color:#000;font-weight:bold;cursor:pointer;border-radius:6px;font-size:14px;">
                    🔄 Réactiver le renouvellement automatique
                </button>
            </div>
            ` : `
            <!-- Options si actif -->
            <div style="margin-bottom:20px;">
                <h3 style="color:#33C6FF;font-size:16px;margin-bottom:15px;">💡 Options disponibles</h3>
                
                <!-- Changer de formule -->
                <div style="background:#000;border:1px solid #555;padding:15px;margin-bottom:15px;border-radius:6px;">
                    <h4 style="color:#fff;font-size:14px;margin-bottom:10px;">🔄 Changer de formule</h4>
                    <p style="color:#aaa;font-size:13px;line-height:1.5;margin-bottom:15px;">
                        Passez à la formule <strong style="color:#33C6FF;">${otherPlanName}</strong>. ${otherPlan === 'annual' ? 'La différence sera facturée immédiatement.' : 'Un crédit proportionnel sera appliqué à votre prochain paiement.'}
                    </p>
                    <button onclick="changePlan('${otherPlan}')" style="width:100%;padding:10px;background:transparent;border:1px solid #33C6FF;color:#33C6FF;font-weight:bold;cursor:pointer;border-radius:6px;font-size:13px;">
                        Passer à ${otherPlanName}
                    </button>
                </div>
                
                <!-- Annuler l'abonnement -->
                <div style="background:rgba(255, 107, 53, 0.1);border:1px solid #ff6b35;padding:15px;border-radius:6px;">
                    <h4 style="color:#ff6b35;font-size:14px;margin-bottom:10px;">🛑 Annuler l'abonnement</h4>
                    <p style="color:#aaa;font-size:13px;line-height:1.5;margin-bottom:15px;">
                        Votre clé API restera active jusqu'au ${formattedDate}, mais ne sera pas renouvelée automatiquement.
                    </p>
                    <button onclick="cancelSubscription()" style="width:100%;padding:10px;background:transparent;border:1px solid #ff6b35;color:#ff6b35;font-weight:bold;cursor:pointer;border-radius:6px;font-size:13px;">
                        Annuler mon abonnement
                    </button>
                </div>
            </div>
            `}
            
            <!-- Bouton fermer -->
            <button onclick="closeManageSubscriptionModal()" style="width:100%;padding:12px;background:#555;border:none;color:#fff;font-weight:bold;cursor:pointer;border-radius:6px;font-size:14px;margin-top:10px;">
                Fermer
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Stocker le plan dans localStorage pour un accès facile
    localStorage.setItem('subscriptionPlan', currentPlan);
}

function closeManageSubscriptionModal() {
    const modal = document.getElementById('manage-subscription-modal');
    if (modal) {
        modal.remove();
    }
}

// ========== ANNULER L'ABONNEMENT ========== 
async function cancelSubscription() {
    const confirmed = confirm(
        '⚠️ Êtes-vous sûr de vouloir annuler votre abonnement ?\n\n' +
        '• Votre clé API restera active jusqu\'à la date d\'expiration\n' +
        '• Votre abonnement ne sera pas renouvelé automatiquement\n' +
        '• Vous pourrez réactiver le renouvellement à tout moment'
    );
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_URL}/stripe/cancel-subscription`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Abonnement annulé avec succès.\n\nVotre clé API reste active jusqu\'à la date d\'expiration.');
            
            // Mettre à jour le localStorage
            localStorage.setItem('subscriptionStatus', 'canceled');
            
            // Fermer le modal et recharger les infos
            closeManageSubscriptionModal();
            await loadSubscriptionInfo();
        } else {
            alert('❌ Erreur lors de l\'annulation : ' + (data.message || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('❌ Erreur annulation abonnement:', error);
        alert('❌ Erreur de connexion au serveur');
    }
}

// ========== RÉACTIVER L'ABONNEMENT ========== 
async function reactivateSubscription() {
    const confirmed = confirm(
        '🔄 Voulez-vous réactiver le renouvellement automatique ?\n\n' +
        'Votre abonnement sera renouvelé automatiquement à la date d\'expiration.'
    );
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_URL}/stripe/reactivate-subscription`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Abonnement réactivé avec succès.\n\nVotre abonnement sera renouvelé automatiquement.');
            
            // Mettre à jour le localStorage
            localStorage.setItem('subscriptionStatus', 'active');
            
            // Fermer le modal et recharger les infos
            closeManageSubscriptionModal();
            await loadSubscriptionInfo();
        } else {
            alert('❌ Erreur lors de la réactivation : ' + (data.message || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('❌ Erreur réactivation abonnement:', error);
        alert('❌ Erreur de connexion au serveur');
    }
}

// ========== CHANGER DE FORMULE ========== 
async function changePlan(newPlan) {
    const planName = newPlan === 'monthly' ? 'Mensuel (5€/mois)' : 'Annuel (48€/an)';
    const currentPlan = localStorage.getItem('subscriptionPlan');
    const currentPlanName = currentPlan === 'monthly' ? 'Mensuel' : 'Annuel';
    
    const message = newPlan === 'annual' 
        ? `🔄 Passer à la formule Annuelle ?\n\n• Vous payez actuellement 5€/mois (60€/an)\n• Vous paierez 48€/an (économie de 12€/an)\n• La différence sera facturée immédiatement\n• Le changement prend effet tout de suite`
        : `🔄 Passer à la formule Mensuelle ?\n\n• Vous payez actuellement 48€/an\n• Vous paierez 5€/mois\n• Un crédit proportionnel sera appliqué\n• Le changement prend effet tout de suite`;
    
    const confirmed = confirm(message);
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_URL}/stripe/change-plan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ newPlan })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ ' + data.message);
            
            // Mettre à jour le localStorage
            localStorage.setItem('subscriptionPlan', newPlan);
            if (data.data && data.data.subscriptionEndDate) {
                localStorage.setItem('subscriptionEndDate', data.data.subscriptionEndDate);
            }
            
            // Fermer le modal et recharger les infos
            closeManageSubscriptionModal();
            await loadSubscriptionInfo();
        } else {
            alert('❌ Erreur lors du changement de formule : ' + (data.message || 'Erreur inconnue'));
        }
    } catch (error) {
        console.error('❌ Erreur changement de plan:', error);
        alert('❌ Erreur de connexion au serveur');
    }
}

// ========== INITIALISATION ========== 
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('admin-dashboard')) {
        updateAdminStats();
    }
});