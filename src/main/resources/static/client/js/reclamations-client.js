// ============================================
// RECLAMATIONS CLIENT - JavaScript (localStorage)
// ============================================

const clientId = localStorage.getItem('clientId');
const isLoggedIn = localStorage.getItem('clientLoggedIn') === 'true';

// ===== VÉRIFICATION AUTH =====
if (!isLoggedIn || !clientId) {
    window.location.href = 'login.html';
}

// ============================================
// NAVBAR
// ============================================
function updateNavbar() {
    const userInfo = document.getElementById('userInfo');
    const prenom = localStorage.getItem('clientPrenom') || 'Client';
    const nom = localStorage.getItem('clientNom') || '';
    const initial = prenom.charAt(0).toUpperCase();
    userInfo.innerHTML = `
        <div class="user-avatar-small">${initial}</div>
        <span class="user-name-nav">${prenom} ${nom}</span>
        <button class="btn-logout" onclick="logoutClient()">🚪 Déconnexion</button>
    `;
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
// GESTION DES RÉCLAMATIONS (localStorage)
// ============================================

function getReclamations() {
    try {
        return JSON.parse(localStorage.getItem('reclamations')) || [];
    } catch (e) {
        return [];
    }
}

function saveReclamations(reclamations) {
    localStorage.setItem('reclamations', JSON.stringify(reclamations));
}

// ============================================
// CHARGER LES COMMANDES DU CLIENT (localStorage)
// ============================================
function loadClientOrders() {
    const select = document.getElementById('venteId');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Aucune --</option>';
    
    try {
        const commandes = JSON.parse(localStorage.getItem('commandes')) || [];
        const clientCommandes = commandes.filter(c => c.clientId == clientId);
        
        clientCommandes.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            const date = c.date || 'Date inconnue';
            option.textContent = `#${c.id} - ${date} - ${formatPrice(c.total)} DH`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur chargement commandes:', error);
    }
}

// ============================================
// CHARGER LES RÉCLAMATIONS DU CLIENT
// ============================================
function loadClientReclamations() {
    try {
        const reclamations = getReclamations();
        const clientReclamations = reclamations.filter(r => r.clientId == clientId);
        displayReclamations(clientReclamations);
        updateStats(clientReclamations);
    } catch (error) {
        showAlert('❌ Erreur: ' + error.message, 'error');
    }
}

// ============================================
// AFFICHER LES RÉCLAMATIONS
// ============================================
function displayReclamations(reclamations) {
    const container = document.getElementById('reclamationsList');

    if (!reclamations || reclamations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <h3>Aucune réclamation</h3>
                <p>Vous n'avez pas encore envoyé de réclamation</p>
            </div>
        `;
        return;
    }

    container.innerHTML = reclamations.map((r, index) => {
        const statusLabel = {
            'EN_ATTENTE': '⏳ En attente',
            'EN_COURS': '🔄 En cours',
            'RESOLUE': '✅ Résolue',
            'FERMEE': '📌 Fermée'
        }[r.statut] || r.statut || 'EN_ATTENTE';

        const priorityClass = {
            'BASSE': 'basse',
            'MOYENNE': 'moyenne',
            'HAUTE': 'haute',
            'URGENTE': 'urgente'
        }[r.priorite] || 'moyenne';

        const statusColor = r.statut === 'RESOLUE' ? '#4CAF50' : 
                           r.statut === 'EN_COURS' ? '#2196F3' : '#FF9800';

        return `
            <div class="reclamation-item" style="border-left-color: ${statusColor};">
                <div class="header">
                    <span class="id">#${r.id || index + 1}</span>
                    <span class="date">${r.date || new Date().toLocaleString('fr-FR')}</span>
                </div>
                <div class="sujet">${escapeHTML(r.sujet)}</div>
                <div class="description">${escapeHTML(r.description)}</div>
                <div class="footer">
                    <div class="badges">
                        <span class="badge-status ${getStatusClass(r.statut)}">${statusLabel}</span>
                        <span class="badge-priority ${priorityClass}">${r.priorite || 'MOYENNE'}</span>
                        <span style="font-size:13px; color:#888;">${r.type || 'AUTRE'}</span>
                    </div>
                    <button class="btn-action" onclick="viewReclamation(${index})" style="background:#e3f2fd; color:#1976D2; border:none; padding:5px 15px; border-radius:5px; cursor:pointer;">👁️ Voir détail</button>
                </div>
                ${r.reponse ? `
                <div class="reponse">
                    <div class="label">📩 Réponse</div>
                    <div class="text">${escapeHTML(r.reponse)}</div>
                    ${r.satisfaction ? `<div style="margin-top:4px; font-size:13px; color:#888;">⭐ Satisfaction: ${'⭐'.repeat(r.satisfaction)} (${r.satisfaction}/5)</div>` : ''}
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function getStatusClass(statut) {
    if (!statut) return 'en_attente';
    return statut.toLowerCase();
}

// ============================================
// STATISTIQUES
// ============================================
function updateStats(reclamations) {
    const total = reclamations.length;
    const enCours = reclamations.filter(r => r.statut === 'EN_ATTENTE' || r.statut === 'EN_COURS').length;
    const resolues = reclamations.filter(r => r.statut === 'RESOLUE' || r.statut === 'FERMEE').length;

    document.getElementById('totalReclamations').textContent = total;
    document.getElementById('enCours').textContent = enCours;
    document.getElementById('resolues').textContent = resolues;
}

// ============================================
// CRÉER UNE RÉCLAMATION
// ============================================
document.getElementById('reclamationForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const sujet = document.getElementById('sujet').value.trim();
    const type = document.getElementById('type').value;
    const description = document.getElementById('description').value.trim();
    const venteId = document.getElementById('venteId').value;

    if (!sujet || !description) {
        showAlert('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    // Créer la réclamation
    const reclamation = {
        id: Date.now(),
        clientId: parseInt(clientId),
        sujet: sujet,
        type: type,
        description: description,
        venteId: venteId || null,
        statut: 'EN_ATTENTE',
        priorite: 'MOYENNE',
        date: new Date().toLocaleString('fr-FR'),
        dateCreation: new Date().toISOString(),
        reponse: null,
        satisfaction: null
    };

    // Sauvegarder
    const reclamations = getReclamations();
    reclamations.push(reclamation);
    saveReclamations(reclamations);

    showAlert('✅ Réclamation envoyée avec succès !', 'success');
    document.getElementById('reclamationForm').reset();
    loadClientReclamations();
    loadClientOrders();
});

// ============================================
// VOIR DÉTAIL
// ============================================
function viewReclamation(index) {
    const reclamations = getReclamations();
    const clientReclamations = reclamations.filter(r => r.clientId == clientId);
    const r = clientReclamations[index];
    
    if (!r) {
        showAlert('Réclamation non trouvée', 'error');
        return;
    }

    const statusLabel = {
        'EN_ATTENTE': '⏳ En attente',
        'EN_COURS': '🔄 En cours',
        'RESOLUE': '✅ Résolue',
        'FERMEE': '📌 Fermée'
    }[r.statut] || r.statut;

    document.getElementById('detailTitle').textContent = `📄 Réclamation #${r.id || index + 1}`;
    document.getElementById('detailContent').innerHTML = `
        <div style="margin-bottom:15px;">
            <p><strong>Sujet:</strong> ${escapeHTML(r.sujet)}</p>
            <p><strong>Type:</strong> ${r.type || 'AUTRE'}</p>
            <p><strong>Statut:</strong> <span class="badge-status ${getStatusClass(r.statut)}">${statusLabel}</span></p>
            <p><strong>Priorité:</strong> ${r.priorite || 'MOYENNE'}</p>
            <p><strong>Date:</strong> ${r.date || 'Date inconnue'}</p>
            ${r.venteId ? `<p><strong>Commande associée:</strong> #${r.venteId}</p>` : ''}
        </div>
        <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:15px;">
            <strong>Description:</strong>
            <p style="margin-top:5px;">${escapeHTML(r.description)}</p>
        </div>
        ${r.reponse ? `
        <div style="background:#e8f5e9; padding:15px; border-radius:8px;">
            <strong style="color:#4CAF50;">📩 Réponse:</strong>
            <p style="margin-top:5px;">${escapeHTML(r.reponse)}</p>
            ${r.satisfaction ? `<p style="margin-top:5px; color:#888;">⭐ Satisfaction: ${'⭐'.repeat(r.satisfaction)} (${r.satisfaction}/5)</p>` : ''}
        </div>
        ` : '<div style="color:#888; text-align:center; padding:10px;">⏳ En attente de réponse</div>'}
    `;
    document.getElementById('detailModal').classList.add('active');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
}

// ============================================
// SUPPRIMER UNE RÉCLAMATION (optionnel)
// ============================================
function supprimerReclamation(index) {
    if (!confirm('Voulez-vous vraiment supprimer cette réclamation ?')) return;
    
    let reclamations = getReclamations();
    const clientReclamations = reclamations.filter(r => r.clientId == clientId);
    const r = clientReclamations[index];
    
    reclamations = reclamations.filter(item => item.id !== r.id);
    saveReclamations(reclamations);
    loadClientReclamations();
    showAlert('✅ Réclamation supprimée', 'success');
}

// ============================================
// ALERTES
// ============================================
function showAlert(message, type) {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert ${type}`;
    alert.style.display = 'block';
    setTimeout(() => { alert.style.display = 'none'; }, 5000);
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
    updatePanierCount();
    loadClientOrders();
    loadClientReclamations();
});

// Exposer les fonctions globalement
window.logoutClient = logoutClient;
window.viewReclamation = viewReclamation;
window.closeDetailModal = closeDetailModal;
window.supprimerReclamation = supprimerReclamation;