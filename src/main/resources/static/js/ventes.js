// ============================================
// PANIER - JavaScript
// ============================================

const API_BASE = 'http://localhost:8080/api';
let isLoggedIn = localStorage.getItem('clientLoggedIn') === 'true';

// ============================================
// RÉCUPÉRER LE CLIENT ID
// ============================================

async function getClientId() {
    // 1. Essayer de récupérer depuis le localStorage
    let clientId = localStorage.getItem('clientId');
    
    if (clientId) {
        console.log('✅ Client ID depuis localStorage:', clientId);
        return parseInt(clientId);
    }
    
    // 2. Chercher par email depuis le localStorage
    const email = localStorage.getItem('clientEmail') || localStorage.getItem('email') || localStorage.getItem('userEmail');
    console.log('🔍 Recherche client par email:', email);
    
    if (email) {
        try {
            const response = await fetch(`${API_BASE}/clients`);
            if (!response.ok) throw new Error('Erreur chargement clients');
            const data = await response.json();
            console.log('📋 Clients disponibles:', data.content);
            
            const client = data.content.find(c => c.email === email);
            if (client) {
                console.log('✅ Client trouvé:', client);
                localStorage.setItem('clientId', client.id);
                return client.id;
            } else {
                console.warn('⚠️ Client non trouvé pour email:', email);
            }
        } catch (error) {
            console.error('❌ Erreur récupération client:', error);
        }
    }
    
    // 3. Si toujours pas de client, créer un client par défaut (ID 1)
    console.warn('⚠️ Utilisation du client par défaut (ID 1)');
    localStorage.setItem('clientId', 1);
    return 1;
}

// ============================================
// AUTHENTIFICATION
// ============================================

function updateNavbar() {
    const userInfo = document.getElementById('userInfo');
    if (!userInfo) return;
    
    if (isLoggedIn) {
        const nom = localStorage.getItem('clientPrenom') || 'Client';
        const initial = nom.charAt(0).toUpperCase();
        userInfo.innerHTML = `
            <div class="user-avatar-small">${initial}</div>
            <span class="user-name-nav">${nom}</span>
            <button class="btn-logout" onclick="logoutClient()">🚪 Déconnexion</button>
        `;
    } else {
        userInfo.innerHTML = `
            <a href="login.html"><button class="btn-login">🔐 Se connecter</button></a>
        `;
    }
}

function logoutClient() {
    localStorage.removeItem('clientId');
    localStorage.removeItem('clientEmail');
    localStorage.removeItem('clientNom');
    localStorage.removeItem('clientPrenom');
    localStorage.removeItem('clientRole');
    localStorage.removeItem('clientLoggedIn');
    window.location.href = 'index.html';
}

// ============================================
// PANIER - GESTION
// ============================================

function updatePanierCount() {
    const panier = JSON.parse(localStorage.getItem('panier')) || [];
    const total = panier.reduce((sum, p) => sum + p.quantite, 0);
    const badge = document.getElementById('panierCount');
    if (badge) badge.textContent = total;
}

function chargerPanier() {
    const panier = JSON.parse(localStorage.getItem('panier')) || [];
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
            <div class="panier-item" style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #eee; flex-wrap:wrap; gap:10px;">
                <div style="flex:1; min-width:150px;">
                    <h4 style="margin:0;">${item.nom}</h4>
                    <span style="color:#888; font-size:13px;">${item.prix.toLocaleString('fr-FR')} DH</span>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <button onclick="modifierQuantite(${index}, -1)" style="width:30px; height:30px; border:1px solid #ddd; border-radius:5px; cursor:pointer; background:#fff;">-</button>
                    <span style="font-weight:600; min-width:30px; text-align:center;">${item.quantite}</span>
                    <button onclick="modifierQuantite(${index}, 1)" style="width:30px; height:30px; border:1px solid #ddd; border-radius:5px; cursor:pointer; background:#fff;">+</button>
                </div>
                <div style="font-weight:700; color:#e94560; min-width:100px; text-align:right;">
                    ${totalLigne.toLocaleString('fr-FR')} DH
                </div>
                <button onclick="supprimerDuPanier(${index})" style="background:#e94560; color:#fff; border:none; border-radius:5px; padding:5px 12px; cursor:pointer;">✕</button>
            </div>
        `;
    }).join('');
    
    document.getElementById('panierTotal').textContent = total.toFixed(2);
    updatePanierCount();
}

function modifierQuantite(index, delta) {
    let panier = JSON.parse(localStorage.getItem('panier')) || [];
    if (!panier[index]) return;
    
    panier[index].quantite += delta;
    if (panier[index].quantite < 1) panier[index].quantite = 1;
    localStorage.setItem('panier', JSON.stringify(panier));
    chargerPanier();
}

function supprimerDuPanier(index) {
    let panier = JSON.parse(localStorage.getItem('panier')) || [];
    panier.splice(index, 1);
    localStorage.setItem('panier', JSON.stringify(panier));
    chargerPanier();
}

function viderPanier() {
    if (confirm('Voulez-vous vraiment vider votre panier ?')) {
        localStorage.removeItem('panier');
        chargerPanier();
        updatePanierCount();
    }
}

// ============================================
// VALIDER LA COMMANDE
// ============================================

async function validerPanier() {
    const panier = JSON.parse(localStorage.getItem('panier')) || [];
    
    // Vérifier si le panier est vide
    if (panier.length === 0) {
        alert('Votre panier est vide');
        return;
    }
    
    // Vérifier si l'utilisateur est connecté
    if (!isLoggedIn) {
        if (confirm('Vous devez être connecté pour valider votre commande. Voulez-vous vous connecter ?')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    // Récupérer le client ID
    const clientId = await getClientId();
    console.log('🔍 Client ID utilisé:', clientId);
    
    if (!clientId) {
        alert('❌ Erreur: Client non trouvé. Veuillez vous reconnecter.');
        window.location.href = 'login.html';
        return;
    }
    
    // Calculer le total
    const total = panier.reduce((sum, p) => sum + (p.prix * p.quantite), 0);
    
    // Demander confirmation
    if (!confirm(`Confirmer votre commande ?\n\nTotal: ${total.toFixed(2)} DH`)) {
        return;
    }
    
    try {
        // Préparer les données
        const venteData = {
            clientId: parseInt(clientId),
            utilisateurId: 1, // Admin par défaut
            lignes: panier.map(p => ({
                produitId: p.id,
                quantite: p.quantite
            }))
        };
        
        console.log('📦 Données de la commande:', venteData);
        
        // Envoyer la requête
        const response = await fetch(`${API_BASE}/ventes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(venteData)
        });
        
        // Vérifier la réponse
        if (!response.ok) {
            const error = await response.text();
            console.error('❌ Erreur réponse:', error);
            
            let errorMessage = 'Erreur lors de la commande';
            try {
                const errorJson = JSON.parse(error);
                errorMessage = errorJson.message || errorMessage;
            } catch (e) {
                errorMessage = error || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        // Succès
        const result = await response.json();
        alert(`✅ Commande #${result.id} validée avec succès !\n\nTotal: ${result.total.toFixed(2)} DH`);
        
        // Vider le panier
        localStorage.removeItem('panier');
        chargerPanier();
        updatePanierCount();
        
        // Rediriger vers les commandes
        window.location.href = 'commandes.html';
        
    } catch (error) {
        console.error('❌ Erreur validation commande:', error);
        alert('❌ Erreur: ' + error.message);
    }
}

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🛒 Panier chargé');
    updateNavbar();
    chargerPanier();
    updatePanierCount();
});

// Exporter les fonctions pour les utiliser dans le HTML
window.validerPanier = validerPanier;
window.viderPanier = viderPanier;
window.modifierQuantite = modifierQuantite;
window.supprimerDuPanier = supprimerDuPanier;
window.chargerPanier = chargerPanier;
window.updatePanierCount = updatePanierCount;

console.log('✅ panier.js chargé avec succès');