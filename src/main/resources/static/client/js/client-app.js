// ===== CONFIGURATION =====
const API_BASE = 'http://localhost:8080/api';
const isLoggedIn = localStorage.getItem('clientLoggedIn') === 'true';

// ===== GESTION DE LA NAVBAR =====
function updateNavbar() {
    const userInfo = document.getElementById('userInfo');
    
    if (isLoggedIn) {
        const nom = localStorage.getItem('clientPrenom') || 'Client';
        const prenom = localStorage.getItem('clientNom') || '';
        const initial = nom.charAt(0).toUpperCase();
        
        userInfo.innerHTML = `
            <div class="user-avatar-small">${initial}</div>
            <span class="user-name-nav">${nom} ${prenom}</span>
            <button class="btn-logout" onclick="logoutClient()">🚪 Déconnexion</button>
        `;
    } else {
        userInfo.innerHTML = `
            <a href="login.html"><button class="btn-login">🔐 Se connecter</button></a>
            <a href="register.html"><button class="btn-login" style="background:#e94560;color:#fff;">S'inscrire</button></a>
        `;
    }
}

// ===== DÉCONNEXION =====
function logoutClient() {
    localStorage.removeItem('clientId');
    localStorage.removeItem('clientEmail');
    localStorage.removeItem('clientNom');
    localStorage.removeItem('clientPrenom');
    localStorage.removeItem('clientRole');
    localStorage.removeItem('clientLoggedIn');
    window.location.href = 'index.html';
}

// ===== RÉCUPÉRER LES PRODUITS =====
async function getProducts() {
    try {
        const response = await fetch(`${API_BASE}/produits?size=100`);
        if (!response.ok) throw new Error('Erreur chargement produits');
        const data = await response.json();
        return data.content || [];
    } catch (error) {
        console.error('Erreur:', error);
        return [];
    }
}

// ===== RÉCUPÉRER LES STATISTIQUES =====
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/statistiques/dashboard`);
        if (!response.ok) throw new Error('Erreur chargement stats');
        const data = await response.json();
        
        document.getElementById('nbProduits').textContent = data.nombreProduits || 0;
        document.getElementById('nbClients').textContent = data.nombreClients || 0;
        document.getElementById('nbVentes').textContent = data.nombreVentes || 0;
        document.getElementById('nbMarques').textContent = data.topProduits ? data.topProduits.length : 0;
    } catch (error) {
        console.error('Erreur stats:', error);
    }
}

// ===== CHARGER LES PRODUITS EN VEDETTE =====
async function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    try {
        const products = await getProducts();
        
        if (products.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#888;">Aucun produit disponible</p>';
            return;
        }
        
        const featured = products.slice(0, 4);
        
        container.innerHTML = featured.map(p => `
            <div class="product-card">
                <div class="image">🏍️</div>
                <div class="info">
                    <h3>${p.nom}</h3>
                    <div class="ref">${p.reference}</div>
                    <div class="prix">${p.prixVente.toLocaleString('fr-FR')} DH</div>
                    <div class="stock">Stock: ${p.quantiteStock}</div>
                    <button class="btn-add-cart" onclick="ajouterAuPanier(${p.id}, '${p.nom}', ${p.prixVente})">
                        🛒 Ajouter au panier
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p style="text-align:center;color:#888;">Erreur de chargement</p>';
    }
}

// ===== CHARGER LES PROMOTIONS =====
async function loadPromotions() {
    const container = document.getElementById('promoProducts');
    if (!container) return;
    
    try {
        const products = await getProducts();
        const promos = products.filter(p => p.quantiteStock < 5 && p.quantiteStock > 0);
        
        if (promos.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#888;">🎯 Aucune promotion actuellement</p>';
            return;
        }
        
        container.innerHTML = promos.map(p => `
            <div class="product-card">
                <span class="badge-promo">🔥 Stock limité</span>
                <div class="image">🏍️</div>
                <div class="info">
                    <h3>${p.nom}</h3>
                    <div class="ref">${p.reference}</div>
                    <div class="prix">${p.prixVente.toLocaleString('fr-FR')} DH</div>
                    <div class="stock" style="color:#e94560;">⚠️ Stock: ${p.quantiteStock}</div>
                    <button class="btn-add-cart" onclick="ajouterAuPanier(${p.id}, '${p.nom}', ${p.prixVente})">
                        🛒 Ajouter au panier
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p style="text-align:center;color:#888;">Erreur de chargement</p>';
    }
}

// ===== AJOUTER AU PANIER =====
function ajouterAuPanier(id, nom, prix) {
    if (!isLoggedIn) {
        if (confirm('Vous devez être connecté pour ajouter au panier. Voulez-vous vous connecter ?')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    let panier = JSON.parse(localStorage.getItem('panier')) || [];
    
    const existing = panier.find(p => p.id === id);
    if (existing) {
        existing.quantite++;
    } else {
        panier.push({ id, nom, prix, quantite: 1 });
    }
    
    localStorage.setItem('panier', JSON.stringify(panier));
    updatePanierCount();
    alert(`✅ ${nom} ajouté au panier !`);
}

// ===== METTRE À JOUR LE COMPTEUR DU PANIER =====
function updatePanierCount() {
    const panier = JSON.parse(localStorage.getItem('panier')) || [];
    const total = panier.reduce((sum, p) => sum + p.quantite, 0);
    const badge = document.getElementById('panierCount');
    if (badge) badge.textContent = total;
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    updateNavbar();
    loadStats();
    loadFeaturedProducts();
    loadPromotions();
    updatePanierCount();
});