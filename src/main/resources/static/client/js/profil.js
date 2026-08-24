// ============================================
// PROFIL CLIENT - JavaScript (localStorage)
// ============================================

const isLoggedIn = localStorage.getItem('clientLoggedIn') === 'true';
const currentClientId = localStorage.getItem('clientId');

// Vérifier l'authentification
if (!isLoggedIn || !currentClientId) {
    window.location.href = 'login.html';
}

// ============================================
// DONNÉES UTILISATEUR (localStorage)
// ============================================

function getClientData() {
    return {
        id: localStorage.getItem('clientId') || '',
        nom: localStorage.getItem('clientNom') || '',
        prenom: localStorage.getItem('clientPrenom') || '',
        email: localStorage.getItem('clientEmail') || '',
        telephone: localStorage.getItem('clientTelephone') || '',
        adresse: localStorage.getItem('clientAdresse') || '',
        role: localStorage.getItem('clientRole') || 'CLIENT'
    };
}

function saveClientData(data) {
    if (data.nom) localStorage.setItem('clientNom', data.nom);
    if (data.prenom) localStorage.setItem('clientPrenom', data.prenom);
    if (data.email) localStorage.setItem('clientEmail', data.email);
    if (data.telephone) localStorage.setItem('clientTelephone', data.telephone);
    if (data.adresse) localStorage.setItem('clientAdresse', data.adresse);
}

// ============================================
// NAVBAR
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
// PANIER
// ============================================

function updatePanierCount() {
    const panier = JSON.parse(localStorage.getItem('panier')) || [];
    const total = panier.reduce((sum, p) => sum + p.quantite, 0);
    const badge = document.getElementById('panierCount');
    if (badge) badge.textContent = total;
}

// ============================================
// ALERTE
// ============================================

function showAlert(message, type) {
    const alert = document.getElementById('alert');
    if (!alert) return;
    alert.textContent = message;
    alert.className = `alert-client ${type}`;
    alert.style.display = 'block';
    setTimeout(() => { alert.style.display = 'none'; }, 5000);
}

// ============================================
// FORMAT PRIX
// ============================================

function formatPrice(price) {
    return Number(price || 0).toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

// ============================================
// CHARGER LE PROFIL (depuis localStorage)
// ============================================

function loadProfile() {
    const loading = document.getElementById('loading');
    const content = document.getElementById('profileContent');
    
    try {
        const data = getClientData();
        
        // Vérifier si les données existent
        if (!data.nom || !data.prenom) {
            // Données par défaut si manquantes
            const defaultData = {
                nom: 'Client',
                prenom: 'Test',
                email: 'client@test.com',
                telephone: '0612345678',
                adresse: 'Casablanca, Maroc'
            };
            saveClientData(defaultData);
            Object.assign(data, defaultData);
        }
        
        // Afficher les informations
        document.getElementById('fullName').textContent = `${data.prenom} ${data.nom}`;
        document.getElementById('userEmailDisplay').textContent = data.email;
        document.getElementById('avatarLetter').textContent = data.prenom.charAt(0).toUpperCase();
        document.getElementById('userRoleBadge').textContent = data.role || 'CLIENT';
        
        document.getElementById('displayNom').textContent = data.nom || '-';
        document.getElementById('displayPrenom').textContent = data.prenom || '-';
        document.getElementById('displayEmail').textContent = data.email || '-';
        document.getElementById('displayTelephone').textContent = data.telephone || '-';
        document.getElementById('displayAdresse').textContent = data.adresse || '-';
        
        // Remplir les champs d'édition
        document.getElementById('editNom').value = data.nom || '';
        document.getElementById('editPrenom').value = data.prenom || '';
        document.getElementById('editEmail').value = data.email || '';
        document.getElementById('editTelephone').value = data.telephone || '';
        document.getElementById('editAdresse').value = data.adresse || '';
        
        // Charger les statistiques
        loadStats();
        
        // Afficher le contenu
        loading.style.display = 'none';
        content.style.display = 'block';
        
        if (typeof applyTranslations === 'function') {
            applyTranslations();
        }
        
    } catch (error) {
        console.error('Erreur chargement profil:', error);
        loading.innerHTML = `
            <p style="color:#e94560;">
                ❌ Erreur: ${error.message}
                <br><br>
                <button onclick="loadProfile()" style="padding:10px 20px;background:#e94560;color:#fff;border:none;border-radius:6px;cursor:pointer;">🔄 Réessayer</button>
            </p>
        `;
    }
}

// ============================================
// CHARGER LES STATISTIQUES (depuis localStorage)
// ============================================

function loadStats() {
    try {
        const commandes = JSON.parse(localStorage.getItem('commandes')) || [];
        const clientCommandes = commandes.filter(c => c.clientId == currentClientId);
        
        const total = clientCommandes.reduce((sum, c) => sum + (c.total || 0), 0);
        const moyenne = clientCommandes.length > 0 ? total / clientCommandes.length : 0;
        
        document.getElementById('statCommandes').textContent = clientCommandes.length;
        document.getElementById('statTotal').textContent = formatPrice(total);
        document.getElementById('statMoyenne').textContent = formatPrice(moyenne);
        
        // Dernières commandes
        const container = document.getElementById('dernieresCommandes');
        if (clientCommandes.length === 0) {
            container.innerHTML = `
                <p style="color:#888; text-align:center; padding:20px;" data-i18n="profil.noOrders">
                    Aucune commande récente
                </p>
            `;
        } else {
            const recentes = clientCommandes.slice(-3).reverse();
            container.innerHTML = recentes.map(c => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;">
                    <div>
                        <strong>#${c.id}</strong>
                        <span style="color:#888; font-size:13px; margin-left:10px;">${c.date || 'Date inconnue'}</span>
                    </div>
                    <div>
                        <span style="font-weight:bold; color:#e94560;">${formatPrice(c.total)} DH</span>
                        <span style="margin-left:10px; display:inline-block; padding:2px 10px; border-radius:12px; font-size:11px; font-weight:600; background:#d4edda; color:#155724;">
                            ${c.statut || 'En attente'}
                        </span>
                    </div>
                </div>
            `).join('');
        }
        
        if (typeof applyTranslations === 'function') {
            applyTranslations();
        }
        
    } catch (error) {
        console.error('Erreur stats:', error);
    }
}

// ============================================
// MODE ÉDITION
// ============================================

function toggleEditMode(show) {
    document.getElementById('viewMode').style.display = show ? 'none' : 'block';
    document.getElementById('editMode').style.display = show ? 'block' : 'none';
}

// ============================================
// SAUVEGARDER LE PROFIL (localStorage)
// ============================================

function saveProfile() {
    const nom = document.getElementById('editNom').value.trim();
    const prenom = document.getElementById('editPrenom').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const telephone = document.getElementById('editTelephone').value.trim();
    const adresse = document.getElementById('editAdresse').value.trim();
    
    if (!nom || !prenom || !email) {
        showAlert(
            typeof t === 'function' ? t('profil.required') : 'Veuillez remplir les champs obligatoires (*)',
            'error'
        );
        return;
    }
    
    // Sauvegarder dans localStorage
    const clientData = {
        nom: nom,
        prenom: prenom,
        email: email,
        telephone: telephone || '',
        adresse: adresse || ''
    };
    saveClientData(clientData);
    
    // Mettre à jour l'affichage
    document.getElementById('displayNom').textContent = nom;
    document.getElementById('displayPrenom').textContent = prenom;
    document.getElementById('displayEmail').textContent = email;
    document.getElementById('displayTelephone').textContent = telephone || '-';
    document.getElementById('displayAdresse').textContent = adresse || '-';
    document.getElementById('fullName').textContent = `${prenom} ${nom}`;
    document.getElementById('userEmailDisplay').textContent = email;
    document.getElementById('avatarLetter').textContent = prenom.charAt(0).toUpperCase();
    
    toggleEditMode(false);
    
    showAlert(
        typeof t === 'function' ? t('profil.success') : '✅ Profil mis à jour avec succès !',
        'success'
    );
}

// ============================================
// CHANGER LE MOT DE PASSE (simulé)
// ============================================

function changerMotDePasse() {
    const passwordMsg = typeof t === 'function' ? t('profil.passwordPrompt') : 'Entrez votre nouveau mot de passe (minimum 6 caractères):';
    const confirmMsg = typeof t === 'function' ? t('profil.passwordConfirm') : 'Confirmez votre nouveau mot de passe:';
    const minMsg = typeof t === 'function' ? t('profil.passwordMin') : 'Le mot de passe doit contenir au moins 6 caractères';
    const matchMsg = typeof t === 'function' ? t('profil.passwordMatch') : 'Les mots de passe ne correspondent pas';
    const successMsg = typeof t === 'function' ? t('profil.passwordSuccess') : '✅ Mot de passe modifié avec succès !';
    
    const newPassword = prompt(passwordMsg);
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
        showAlert(minMsg, 'error');
        return;
    }
    
    const confirmPassword = prompt(confirmMsg);
    if (newPassword !== confirmPassword) {
        showAlert(matchMsg, 'error');
        return;
    }
    
    showAlert(successMsg, 'success');
}

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    updateNavbar();
    updatePanierCount();
    loadProfile();
});

// Exposer les fonctions globalement
window.logoutClient = logoutClient;
window.toggleEditMode = toggleEditMode;
window.saveProfile = saveProfile;
window.changerMotDePasse = changerMotDePasse;
window.loadProfile = loadProfile;