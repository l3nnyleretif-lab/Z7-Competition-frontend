// ========== LECTEUR TWITCH POUR PAGE TOURNOI ========== 
// frontend/Accueil/js/twitch-player.js

console.log('🔥🔥🔥 FICHIER TWITCH-PLAYER.JS CHARGÉ ! 🔥🔥🔥');

class TwitchPlayer {
    constructor() {
        this.player = null;
        this.container = null;
        this.channel = null;
        this.embedScriptLoaded = false;
    }

    // Charger le script Twitch Embed si pas encore chargé
    loadTwitchEmbedScript() {
        return new Promise((resolve, reject) => {
            // Si déjà chargé, résoudre immédiatement
            if (this.embedScriptLoaded || window.Twitch) {
                this.embedScriptLoaded = true;
                resolve();
                return;
            }

            // Créer et injecter le script
            const script = document.createElement('script');
            script.src = 'https://embed.twitch.tv/embed/v1.js';
            script.onload = () => {
                console.log('✅ Script Twitch Embed chargé');
                this.embedScriptLoaded = true;
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Erreur chargement script Twitch');
                reject(new Error('Impossible de charger le script Twitch'));
            };
            
            document.head.appendChild(script);
        });
    }

    // Extraire le nom de la chaîne depuis l'URL Twitch
    extractChannelName(url) {
        // Format: https://twitch.tv/nom_chaine ou https://www.twitch.tv/nom_chaine
        const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
        return match ? match[1] : null;
    }

    // Créer et afficher le player
    async show(twitchUrl, containerId = 'twitch-player-container') {
        console.log('🎥 TwitchPlayer.show() appelé avec:', twitchUrl);
        
        // Extraire le nom de la chaîne
        this.channel = this.extractChannelName(twitchUrl);
        
        if (!this.channel) {
            console.error('❌ URL Twitch invalide:', twitchUrl);
            return;
        }
        
        console.log('✅ Nom de la chaîne extrait:', this.channel);

        // Trouver le container
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('❌ Container Twitch introuvable:', containerId);
            return;
        }
        
        console.log('✅ Container trouvé:', container);

        // Vider le container
        container.innerHTML = '';

        try {
            // Charger le script Twitch si nécessaire
            console.log('⏳ Chargement du script Twitch Embed...');
            await this.loadTwitchEmbedScript();

            // Créer le wrapper pour l'iframe
            const wrapper = document.createElement('div');
            wrapper.className = 'twitch-embed-wrapper';
            wrapper.id = 'twitch-embed-' + Date.now();
            container.appendChild(wrapper);

            // Créer le player avec l'API Twitch Embed
            console.log('🎬 Création du player Twitch...');
            this.player = new Twitch.Embed(wrapper.id, {
                width: '100%',
                height: '100%',
                channel: this.channel,
                layout: 'video',
                autoplay: false,
                muted: false,
                parent: [window.location.hostname, 'localhost', '127.0.0.1']
            });

            // Après création, ajouter les attributs de sécurité à l'iframe
            setTimeout(() => {
                const iframe = wrapper.querySelector('iframe');
                if (iframe) {
                    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope');
                    iframe.setAttribute('allowfullscreen', 'true');
                    console.log('✅ Attributs de sécurité ajoutés à l\'iframe');
                }
            }, 500);

            this.container = container;
            console.log('✅ Player Twitch créé avec succès !');

        } catch (error) {
            console.error('❌ Erreur lors de la création du player:', error);
            container.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#fff;text-align:center;padding:20px;flex-direction:column;gap:10px;background:#000;">
                    <div style="font-size:48px;">⚠️</div>
                    <div style="font-size:16px;margin-bottom:10px;">Impossible de charger le stream Twitch</div>
                    <div style="font-size:14px;color:#aaa;margin-bottom:15px;">La chaîne est peut-être hors ligne</div>
                    <a href="${twitchUrl}" target="_blank" style="color:#9147ff;text-decoration:underline;font-size:14px;">
                        Ouvrir sur Twitch →
                    </a>
                </div>
            `;
        }
    }

    // Cacher le player
    hide() {
        if (this.player) {
            // Détruire le player Twitch
            try {
                // L'API Twitch n'a pas de méthode destroy, on vide juste le container
                if (this.container) {
                    this.container.innerHTML = '';
                }
                this.player = null;
                console.log('🔇 Player Twitch caché');
            } catch (error) {
                console.error('Erreur lors de la fermeture du player:', error);
            }
        }
    }
}

// Instance globale
const twitchPlayer = new TwitchPlayer();
console.log('✅ TwitchPlayer créé et disponible globalement');