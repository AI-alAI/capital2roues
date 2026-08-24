// ============================================
// panier.js - Logique du panier Capital 2 Roues
// ============================================

let isLoggedIn = localStorage.getItem('clientLoggedIn') === 'true';

// ============================================
// AUTHENTIFICATION
// ============================================

function updateNavbar() {
    const userInfo = document.getElementById('userInfo');
    if (isLoggedIn) {
        const prenom = localStorage.getItem('clientPrenom') || 'Client';
        const nom = localStorage.getItem('clientNom') || '';
        const initial = prenom.charAt(0).toUpperCase();
        userInfo.innerHTML = `
            <div class="user-avatar-small">${initial}</div>
            <span class="user-name-nav">${prenom} ${nom}</span>
            <button class="btn-logout" onclick="logoutClient()" data-i18n="nav.logout">🚪 Déconnexion</button>
        `;
    } else {
        userInfo.innerHTML = `
            <a href="login.html"><button class="btn-login" data-i18n="nav.login">🔐 Se connecter</button></a>
            <a href="register.html"><button class="btn-login" style="background:#e94560;color:#fff;border-color:#e94560;" data-i18n="nav.register">S'inscrire</button></a>
        `;
    }
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }
}

function logoutClient() {
    localStorage.removeItem('clientId');
    localStorage.removeItem('clientEmail');
    localStorage.removeItem('clientNom');
    localStorage.removeItem('clientPrenom');
    localStorage.removeItem('clientRole');
    localStorage.removeItem('clientLoggedIn');
    localStorage.removeItem('clientTelephone');
    localStorage.removeItem('clientAdresse');
    window.location.href = 'index.html';
}

// ============================================
// PANIER - GESTION DES DONNÉES
// ============================================

function getPanier() {
    try {
        return JSON.parse(localStorage.getItem('panier')) || [];
    } catch (e) {
        return [];
    }
}

function savePanier(panier) {
    localStorage.setItem('panier', JSON.stringify(panier));
    updatePanierCount();
    if (typeof chargerPanier === 'function') {
        chargerPanier();
    }
}

function updatePanierCount() {
    const panier = getPanier();
    const total = panier.reduce((sum, p) => sum + p.quantite, 0);
    const badge = document.getElementById('panierCount');
    if (badge) badge.textContent = total;
}

function getTotalPanier() {
    const panier = getPanier();
    return panier.reduce((sum, p) => sum + (p.prix * p.quantite), 0);
}

// ============================================
// PANIER - AFFICHAGE
// ============================================

function chargerPanier() {
    const panier = getPanier();
    const contenu = document.getElementById('panierContenu');
    const vide = document.getElementById('panierVide');

    if (!contenu || !vide) return;

    if (panier.length === 0) {
        contenu.style.display = 'none';
        vide.style.display = 'block';
        updatePanierCount();
        return;
    }

    contenu.style.display = 'block';
    vide.style.display = 'none';

    const container = document.getElementById('panierItems');
    if (!container) return;

    let total = 0;

    container.innerHTML = panier.map((item, index) => {
        const totalLigne = item.prix * item.quantite;
        total += totalLigne;
        return `
            <div class="panier-item">
                <div class="item-info">
                    <h4>🏍️ ${escapeHTML(item.nom)}</h4>
                    <span class="item-price">${formatPrice(item.prix)} DH</span>
                    <span style="display:block;font-size:12px;color:#999;">Réf: ${item.reference || 'N/A'}</span>
                </div>
                <div class="item-actions">
                    <button onclick="modifierQuantite(${index}, -1)" title="Diminuer">−</button>
                    <span class="qty">${item.quantite}</span>
                    <button onclick="modifierQuantite(${index}, 1)" title="Augmenter">+</button>
                </div>
                <div class="item-total">
                    ${formatPrice(totalLigne)} DH
                </div>
                <button class="btn-remove" onclick="supprimerDuPanier(${index})" title="Supprimer">✕</button>
            </div>
        `;
    }).join('');

    const totalEl = document.getElementById('panierTotal');
    if (totalEl) totalEl.textContent = total.toFixed(2);
    
    updatePanierCount();

    // Réappliquer les traductions
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }
}

// ============================================
// PANIER - MODIFICATIONS
// ============================================

function modifierQuantite(index, delta) {
    let panier = getPanier();
    if (index >= 0 && index < panier.length) {
        panier[index].quantite += delta;
        if (panier[index].quantite < 1) panier[index].quantite = 1;
        savePanier(panier);
    }
}

function supprimerDuPanier(index) {
    let panier = getPanier();
    if (index >= 0 && index < panier.length) {
        if (confirm(`Supprimer "${panier[index].nom}" du panier ?`)) {
            panier.splice(index, 1);
            savePanier(panier);
        }
    }
}

function viderPanier() {
    if (confirm('Voulez-vous vraiment vider votre panier ?')) {
        savePanier([]);
    }
}

// ============================================
// PANIER - AJOUTER PRODUIT (depuis catalogue)
// ============================================

function ajouterAuPanier(id, nom, prix, reference) {
    if (!isLoggedIn) {
        if (confirm('Vous devez être connecté pour ajouter au panier. Voulez-vous vous connecter ?')) {
            window.location.href = 'login.html';
        }
        return;
    }

    let panier = getPanier();
    const existing = panier.find(p => p.id === id);
    if (existing) {
        existing.quantite++;
    } else {
        panier.push({
            id: id,
            nom: nom,
            prix: prix,
            reference: reference || '',
            quantite: 1
        });
    }
    savePanier(panier);

    // Feedback visuel pour le bouton
    const btn = window.event?.target;
    if (btn) {
        btn.textContent = '✅ Ajouté !';
        btn.classList.add('added');
        setTimeout(() => {
            btn.textContent = '🛒 Ajouter au panier';
            btn.classList.remove('added');
        }, 1500);
    }
}

// ============================================
// COMMANDE - VALIDATION (sans API)
// ============================================

function validerPanier() {
    const panier = getPanier();
    if (panier.length === 0) {
        alert('Votre panier est vide.');
        return;
    }

    if (!isLoggedIn) {
        if (confirm('Vous devez être connecté pour valider votre commande. Voulez-vous vous connecter ?')) {
            window.location.href = 'login.html';
        }
        return;
    }

    const clientId = localStorage.getItem('clientId');
    const clientNom = localStorage.getItem('clientNom') || 'Client';
    const clientPrenom = localStorage.getItem('clientPrenom') || '';
    const total = getTotalPanier();

    // Afficher le récapitulatif
    let recap = `📝 Récapitulatif de votre commande\n`;
    recap += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    panier.forEach((p, i) => {
        recap += `${i+1}. ${p.nom}\n`;
        recap += `   Quantité: ${p.quantite} × ${formatPrice(p.prix)} DH = ${formatPrice(p.prix * p.quantite)} DH\n\n`;
    });
    recap += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    recap += `💰 TOTAL : ${formatPrice(total)} DH\n\n`;
    recap += `👤 Client : ${clientPrenom} ${clientNom}\n`;
    recap += `📅 Date : ${new Date().toLocaleString('fr-FR')}\n\n`;
    recap += `Confirmez-vous cette commande ?`;

    if (!confirm(recap)) return;

    try {
        // Créer la commande dans localStorage
        const nouvelleCommande = {
            id: Date.now(),
            date: new Date().toLocaleString('fr-FR'),
            articles: panier.map(p => ({
                id: p.id,
                nom: p.nom,
                prix: p.prix,
                quantite: p.quantite
            })),
            total: total,
            statut: 'En attente',
            clientId: parseInt(clientId),
            clientNom: clientNom,
            clientPrenom: clientPrenom
        };

        // Sauvegarder dans localStorage
        const commandes = JSON.parse(localStorage.getItem('commandes')) || [];
        commandes.push(nouvelleCommande);
        localStorage.setItem('commandes', JSON.stringify(commandes));

        // Vider le panier
        savePanier([]);

        // Message de succès
        alert(
            `✅ COMMANDE VALIDÉE AVEC SUCCÈS !\n\n` +
            `📋 #${nouvelleCommande.id}\n` +
            `💰 Total : ${formatPrice(total)} DH\n` +
            `📅 Date : ${nouvelleCommande.date}\n` +
            `📦 Statut : En attente\n\n` +
            `Vous serez redirigé vers vos commandes.`
        );

        // Rediriger vers les commandes
        window.location.href = 'commandes.html';

    } catch (error) {
        console.error('Erreur validation:', error);
        alert('❌ Erreur lors de la validation de la commande: ' + error.message);
    }
}

// ============================================
// UTILITAIRES
// ============================================

function formatPrice(price) {
    return Number(price || 0).toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function escapeHTML(value) {
    if (!value) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    updateNavbar();
    chargerPanier();
    updatePanierCount();
});

// Exposer les fonctions globalement
window.updateNavbar = updateNavbar;
window.logoutClient = logoutClient;
window.getPanier = getPanier;
window.savePanier = savePanier;
window.updatePanierCount = updatePanierCount;
window.chargerPanier = chargerPanier;
window.modifierQuantite = modifierQuantite;
window.supprimerDuPanier = supprimerDuPanier;
window.viderPanier = viderPanier;
window.ajouterAuPanier = ajouterAuPanier;
window.validerPanier = validerPanier;
window.formatPrice = formatPrice;