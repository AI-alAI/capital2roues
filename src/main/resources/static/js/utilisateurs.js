// ============================================
// UTILISATEURS - JavaScript
// ============================================

const API_BASE = 'http://localhost:8080/api';
let currentPage = 0;
let pageSize = 10;
let totalPages = 0;
let totalItems = 0;
let deleteId = null;
let detailId = null;
let resetId = null;
let currentSort = { field: 'id', direction: 'desc' };

// ===== AUTHENTIFICATION =====
const currentUserEmail = localStorage.getItem('email') || 'Admin';
const currentUserId = parseInt(localStorage.getItem('userId')) || 1;

if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = '/client/login.html';
}

document.getElementById('userEmail').textContent = currentUserEmail;

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
    window.location.href = '/client/login.html';
}

// ===== API FETCH =====
async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });

    if (response.status === 401) {
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/client/login.html';
        throw new Error('Session expirée');
    }

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Erreur serveur');
    }

    if (response.status === 204) return null;
    return response.json();
}

// ===== FORMATAGE =====
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Hier";
    if (diff < 7) return `Il y a ${diff} jours`;
    return d.toLocaleDateString('fr-FR');
}

// ===== ROLE BADGES =====
function getRoleBadge(role) {
    const classes = {
        'ADMIN': 'admin',
        'VENDEUR': 'vendeur',
        'MAGASINIER': 'magasinier',
        'CLIENT': 'client'
    };
    return `role-badge ${classes[role] || ''}`;
}

// ===== CHARGER LES UTILISATEURS =====
async function loadUsers(page = 0) {
    const loading = document.getElementById('loadingUsers');
    const tableContent = document.getElementById('tableContent');
    const alert = document.getElementById('alert');

    try {
        loading.style.display = 'block';
        tableContent.style.display = 'none';
        alert.style.display = 'none';

        let url = `${API_BASE}/utilisateurs?page=${page}&size=${pageSize}&sort=${currentSort.field},${currentSort.direction}`;
        
        const search = document.getElementById('searchInput').value.trim();
        if (search) url += `&search=${encodeURIComponent(search)}`;
        
        const role = document.getElementById('roleFilter').value;
        if (role) url += `&role=${role}`;
        
        const status = document.getElementById('statusFilter').value;
        if (status) url += `&status=${status}`;

        const data = await apiFetch(url);
        console.log('👤 Utilisateurs:', data);

        totalPages = data.totalPages || 0;
        totalItems = data.totalItems || 0;
        currentPage = data.currentPage || 0;

        displayUsers(data.content || []);
        updateStats(data.content || []);
        updatePagination();

        loading.style.display = 'none';
        tableContent.style.display = 'block';

        document.getElementById('userCount').textContent = `(${totalItems} utilisateurs)`;

    } catch (error) {
        loading.style.display = 'none';
        showAlert('❌ ' + error.message, 'error');
    }
}

// ===== AFFICHER LES UTILISATEURS =====
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px; color:#b2bec3;">📭 Aucun utilisateur trouvé</td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(u => {
        const isCurrentUser = u.id === currentUserId;
        const status = u.statut || 'active';
        const lastLogin = u.lastLogin ? formatDate(u.lastLogin) : '-';

        return `
            <tr>
                <td><strong>#${u.id}</strong></td>
                <td>
                    <div class="user-name">${u.nom || ''} ${u.prenom || ''}</div>
                    <div class="user-email">${u.email || ''}</div>
                </td>
                <td>${u.email || '-'}</td>
                <td><span class="${getRoleBadge(u.role)}">${u.role || '-'}</span></td>
                <td><span class="status-badge ${status}">${status === 'active' ? '🟢 Actif' : '🔴 Inactif'}</span></td>
                <td>${lastLogin}</td>
                <td class="actions-col">
                    <div class="action-buttons">
                        <button class="btn-action view" onclick="viewUser(${u.id})" title="Voir détails">
                            👁️ <span class="tooltip">Voir détails</span>
                        </button>
                        <button class="btn-action edit" onclick="openEditModal(${u.id})" title="Modifier">
                            ✏️ <span class="tooltip">Modifier</span>
                        </button>
                        <button class="btn-action reset" onclick="openResetModal(${u.id}, '${u.nom} ${u.prenom}')" title="Réinitialiser mot de passe">
                            🔑 <span class="tooltip">Réinitialiser mot de passe</span>
                        </button>
                        <button class="btn-action delete" onclick="openDeleteModal(${u.id}, '${u.nom} ${u.prenom}')" title="Supprimer" ${isCurrentUser ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
                            🗑️ <span class="tooltip">${isCurrentUser ? 'Impossible de supprimer votre propre compte' : 'Supprimer'}</span>
                        </button>
                        ${isCurrentUser ? '<span style="font-size:11px;color:#888;margin-left:4px;">(Vous)</span>' : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== STATISTIQUES =====
function updateStats(users) {
    const total = users.length;
    let active = 0, inactive = 0, admins = 0;

    users.forEach(u => {
        if (u.statut === 'active' || !u.statut) active++;
        else inactive++;
        if (u.role === 'ADMIN') admins++;
    });

    document.getElementById('totalUsers').textContent = total;
    document.getElementById('activeUsers').textContent = active;
    document.getElementById('inactiveUsers').textContent = inactive;
    document.getElementById('adminUsers').textContent = admins;
}

// ===== TRI =====
function sortBy(field) {
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }

    document.querySelectorAll('.data-table th').forEach(th => th.classList.remove('active'));
    const index = { id: 0, nom: 1 }[field];
    if (index !== undefined) {
        document.querySelectorAll('.data-table th')[index]?.classList.add('active');
    }

    loadUsers(currentPage);
}

// ===== PAGINATION =====
function updatePagination() {
    const info = document.getElementById('paginationInfo');
    const buttons = document.getElementById('paginationButtons');

    const start = totalItems > 0 ? currentPage * pageSize + 1 : 0;
    const end = Math.min((currentPage + 1) * pageSize, totalItems);
    info.textContent = totalItems > 0 ? `Affichage ${start}–${end} sur ${totalItems} utilisateurs` : 'Aucun utilisateur';

    if (totalPages <= 1) {
        buttons.innerHTML = '';
        return;
    }

    let html = '';
    const current = currentPage;

    html += `<button onclick="goToPage(${current - 1})" ${current === 0 ? 'disabled' : ''}>‹</button>`;

    const maxVisible = 5;
    let startPage = Math.max(0, current - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(0, endPage - maxVisible + 1);
    }

    if (startPage > 0) {
        html += `<button onclick="goToPage(0)">1</button>`;
        if (startPage > 1) html += `<button disabled>…</button>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button onclick="goToPage(${i})" class="${i === current ? 'active' : ''}">${i + 1}</button>`;
    }

    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) html += `<button disabled>…</button>`;
        html += `<button onclick="goToPage(${totalPages - 1})">${totalPages}</button>`;
    }

    html += `<button onclick="goToPage(${current + 1})" ${current === totalPages - 1 ? 'disabled' : ''}>›</button>`;

    buttons.innerHTML = html;
}

function goToPage(page) {
    if (page < 0 || page >= totalPages) return;
    currentPage = page;
    loadUsers(page);
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSizeSelect').value);
    currentPage = 0;
    loadUsers(0);
}

// ===== FILTRES =====
function applyFilters() {
    currentPage = 0;
    loadUsers(0);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('roleFilter').value = '';
    document.getElementById('statusFilter').value = '';
    currentPage = 0;
    loadUsers(0);
}

// ===== MODAL AJOUT =====
function openAddModal() {
    document.getElementById('modalTitle').textContent = '➕ Ajouter un utilisateur';
    document.getElementById('userForm').reset();
    document.getElementById('editId').value = '';
    document.getElementById('role').value = 'VENDEUR';
    document.getElementById('statut').value = 'active';
    document.getElementById('userModal').classList.add('active');
}

// ===== MODAL EDITION =====
async function openEditModal(id) {
    try {
        const u = await apiFetch(`${API_BASE}/utilisateurs/${id}`);
        
        document.getElementById('modalTitle').textContent = '✏️ Modifier l\'utilisateur';
        document.getElementById('editId').value = u.id;
        document.getElementById('nom').value = u.nom || '';
        document.getElementById('prenom').value = u.prenom || '';
        document.getElementById('email').value = u.email || '';
        document.getElementById('motDePasse').value = '';
        document.getElementById('role').value = u.role || 'VENDEUR';
        document.getElementById('statut').value = u.statut || 'active';
        
        document.getElementById('userModal').classList.add('active');
    } catch (error) {
        showAlert('❌ Erreur: ' + error.message, 'error');
    }
}

// ===== SOUMETTRE FORMULAIRE =====
async function submitUser() {
    const id = document.getElementById('editId').value;
    const data = {
        nom: document.getElementById('nom').value.trim(),
        prenom: document.getElementById('prenom').value.trim(),
        email: document.getElementById('email').value.trim(),
        motDePasse: document.getElementById('motDePasse').value.trim(),
        role: document.getElementById('role').value,
        statut: document.getElementById('statut').value
    };

    if (!data.nom || !data.prenom || !data.email) {
        showAlert('Veuillez remplir les champs obligatoires (*)', 'error');
        return;
    }

    try {
        let url = `${API_BASE}/utilisateurs`;
        let method = 'POST';
        if (id) { url += `/${id}`; method = 'PUT'; }

        await apiFetch(url, { method, body: JSON.stringify(data) });
        
        closeModal();
        showAlert(id ? '✅ Utilisateur modifié avec succès !' : '✅ Utilisateur ajouté avec succès !', 'success');
        loadUsers(currentPage);
    } catch (error) {
        showAlert('❌ Erreur: ' + error.message, 'error');
    }
}

// ===== MODAL DETAIL =====
async function viewUser(id) {
    try {
        const u = await apiFetch(`${API_BASE}/utilisateurs/${id}`);
        detailId = id;
        
        document.getElementById('detailTitle').textContent = `👤 ${u.nom} ${u.prenom}`;

        document.getElementById('detailContent').innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="label">Nom complet</div>
                    <div class="value">${u.nom || '-'} ${u.prenom || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Email</div>
                    <div class="value">${u.email || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Rôle</div>
                    <div class="value"><span class="${getRoleBadge(u.role)}">${u.role || '-'}</span></div>
                </div>
                <div class="detail-item">
                    <div class="label">Statut</div>
                    <div class="value"><span class="status-badge ${u.statut || 'active'}">${(u.statut || 'active') === 'active' ? '🟢 Actif' : '🔴 Inactif'}</span></div>
                </div>
                <div class="detail-item">
                    <div class="label">Date d'inscription</div>
                    <div class="value">${formatDate(u.createdAt)}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Dernière connexion</div>
                    <div class="value">${u.lastLogin ? formatDate(u.lastLogin) : '-'}</div>
                </div>
                <div class="detail-item full-width" style="background:#fff3e0;">
                    <div class="label">🔐 Sécurité</div>
                    <div class="value" style="font-size:14px; font-weight:400;">Mot de passe: •••••••••</div>
                </div>
            </div>
        `;
        document.getElementById('detailModal').classList.add('active');
    } catch (error) {
        showAlert('❌ Erreur: ' + error.message, 'error');
    }
}

function openEditFromDetail() {
    if (detailId) {
        closeDetailModal();
        openEditModal(detailId);
    }
}

// ===== MODAL RESET PASSWORD =====
function openResetModal(id, nom) {
    resetId = id;
    document.getElementById('resetUserName').textContent = nom || 'cet utilisateur';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('resetModal').classList.add('active');
}

async function confirmReset() {
    const password = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (!password || password.length < 6) {
        showAlert('Le mot de passe doit contenir au moins 6 caractères', 'error');
        return;
    }

    if (password !== confirm) {
        showAlert('Les mots de passe ne correspondent pas', 'error');
        return;
    }

    try {
        // Récupérer l'utilisateur pour ne modifier que le mot de passe
        const user = await apiFetch(`${API_BASE}/utilisateurs/${resetId}`);
        user.motDePasse = password;
        
        await apiFetch(`${API_BASE}/utilisateurs/${resetId}`, {
            method: 'PUT',
            body: JSON.stringify(user)
        });

        closeResetModal();
        showAlert('✅ Mot de passe réinitialisé avec succès !', 'success');
    } catch (error) {
        showAlert('❌ Erreur: ' + error.message, 'error');
    }
}

// ===== MODAL SUPPRESSION =====
function openDeleteModal(id, nom) {
    if (id === currentUserId) {
        showAlert('❌ Vous ne pouvez pas supprimer votre propre compte !', 'error');
        return;
    }
    deleteId = id;
    document.getElementById('deleteUserName').textContent = nom || 'cet utilisateur';
    document.getElementById('deleteModal').classList.add('active');
}

async function confirmDelete() {
    if (!deleteId) return;
    try {
        await apiFetch(`${API_BASE}/utilisateurs/${deleteId}`, { method: 'DELETE' });
        closeDeleteModal();
        showAlert('✅ Utilisateur supprimé avec succès !', 'success');
        loadUsers(currentPage);
    } catch (error) {
        showAlert('❌ Erreur: ' + error.message, 'error');
    }
}

// ===== FERMETURE MODALS =====
function closeModal() { document.getElementById('userModal').classList.remove('active'); }
function closeDetailModal() { document.getElementById('detailModal').classList.remove('active'); }
function closeResetModal() { document.getElementById('resetModal').classList.remove('active'); resetId = null; }
function closeDeleteModal() { document.getElementById('deleteModal').classList.remove('active'); deleteId = null; }

// ===== ALERTES =====
function showAlert(message, type) {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert ${type}`;
    alert.style.display = 'block';
    setTimeout(() => { alert.style.display = 'none'; }, 5000);
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    loadUsers(0);

    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') applyFilters();
    });
});