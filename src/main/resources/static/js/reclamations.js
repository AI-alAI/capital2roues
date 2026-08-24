// ============================================
// RECLAMATIONS - JavaScript (Admin)
// ============================================

const API_BASE = 'http://localhost:8080/api';
let currentPage = 0;
let pageSize = 10;
let totalPages = 0;
let totalItems = 0;
let detailId = null;
let processId = null;

// ===== AUTHENTIFICATION =====
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = '/client/login.html';
}

document.getElementById('userEmail').textContent = localStorage.getItem('email') || 'Admin';

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('email');
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

    return response.json();
}

// ===== PRIORITY CLASS =====
function getPriorityClass(priorite) {
    const classes = { 'BASSE': 'basse', 'MOYENNE': 'moyenne', 'HAUTE': 'haute', 'URGENTE': 'urgente' };
    return classes[priorite] || '';
}

function getStatusClass(statut) {
    return statut ? statut.toLowerCase() : '';
}

function getStatusLabel(statut) {
    const labels = { 'EN_ATTENTE': '⏳ En attente', 'EN_COURS': '🔄 En cours', 'RESOLUE': '✅ Résolue', 'FERMEE': '📌 Fermée' };
    return labels[statut] || statut;
}

// ===== CHARGER LES STATS =====
async function loadStats() {
    try {
        const stats = await apiFetch(`${API_BASE}/reclamations/stats`);
        document.getElementById('totalReclamations').textContent = stats.total || 0;
        document.getElementById('enAttente').textContent = stats.enAttente || 0;
        document.getElementById('enCours').textContent = stats.enCours || 0;
        document.getElementById('resolues').textContent = stats.resolues || 0;
    } catch (error) {
        console.error('Erreur stats:', error);
    }
}

// ===== CHARGER LES RÉCLAMATIONS =====
async function loadReclamations(page = 0) {
    try {
        let url = `${API_BASE}/reclamations?page=${page}&size=${pageSize}`;
        
        const search = document.getElementById('searchInput').value.trim();
        if (search) url += `&search=${encodeURIComponent(search)}`;
        
        const status = document.getElementById('statusFilter').value;
        if (status) url += `&statut=${status}`;
        
        const priority = document.getElementById('priorityFilter').value;
        if (priority) url += `&priorite=${priority}`;

        const data = await apiFetch(url);
        console.log('📋 Réclamations:', data);

        totalPages = data.totalPages || 0;
        totalItems = data.totalItems || 0;
        currentPage = data.currentPage || 0;

        displayReclamations(data.content || []);
        updatePagination();

        document.getElementById('reclamationCount').textContent = `(${totalItems} réclamations)`;

    } catch (error) {
        showAlert('❌ ' + error.message, 'error');
    }
}

// ===== AFFICHER LES RÉCLAMATIONS =====
function displayReclamations(reclamations) {
    const tbody = document.getElementById('reclamationsTableBody');

    if (!reclamations || reclamations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px; color:#b2bec3;">📭 Aucune réclamation</td></tr>`;
        return;
    }

    tbody.innerHTML = reclamations.map(r => `
        <tr>
            <td><strong>#${r.id}</strong></td>
            <td>${r.clientNom || ''} ${r.clientPrenom || ''}</td>
            <td>
                <strong>${r.sujet || '-'}</strong>
                <div style="font-size:12px; color:#888;">${r.type || '-'}</div>
            </td>
            <td>${r.type || '-'}</td>
            <td style="text-align:center;">
                <span class="priority-badge ${getPriorityClass(r.priorite)}">${r.priorite || '-'}</span>
            </td>
            <td style="text-align:center;">
                <span class="status-badge-reclamation ${getStatusClass(r.statut)}">${getStatusLabel(r.statut)}</span>
            </td>
            <td style="text-align:center;">
                <div class="action-buttons" style="justify-content:center;">
                    <button class="btn-action view" onclick="viewReclamation(${r.id})" title="Voir détails">👁️</button>
                    <button class="btn-action process" onclick="openProcessModal(${r.id})" title="Traiter">✅</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== PAGINATION =====
function updatePagination() {
    const info = document.getElementById('paginationInfo');
    const buttons = document.getElementById('paginationButtons');

    const start = totalItems > 0 ? currentPage * pageSize + 1 : 0;
    const end = Math.min((currentPage + 1) * pageSize, totalItems);
    info.textContent = totalItems > 0 ? `Affichage ${start}–${end} sur ${totalItems} réclamations` : 'Aucune réclamation';

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
    loadReclamations(page);
}

// ===== FILTRES =====
function applyFilters() {
    currentPage = 0;
    loadReclamations(0);
    loadStats();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('priorityFilter').value = '';
    currentPage = 0;
    loadReclamations(0);
    loadStats();
}

// ===== MODAL DETAIL =====
async function viewReclamation(id) {
    try {
        const r = await apiFetch(`${API_BASE}/reclamations/${id}`);
        detailId = id;
        
        document.getElementById('detailTitle').textContent = `📄 Réclamation #${r.id}`;
        document.getElementById('detailContent').innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="label">Client</div>
                    <div class="value">${r.clientNom || ''} ${r.clientPrenom || ''}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Vente associée</div>
                    <div class="value">${r.venteId ? '#' + r.venteId : 'Non associée'}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Sujet</div>
                    <div class="value">${r.sujet || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Type</div>
                    <div class="value">${r.type || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Priorité</div>
                    <div class="value"><span class="priority-badge ${getPriorityClass(r.priorite)}">${r.priorite || '-'}</span></div>
                </div>
                <div class="detail-item">
                    <div class="label">Statut</div>
                    <div class="value"><span class="status-badge-reclamation ${getStatusClass(r.statut)}">${getStatusLabel(r.statut)}</span></div>
                </div>
                <div class="detail-item">
                    <div class="label">Date de création</div>
                    <div class="value">${new Date(r.dateCreation).toLocaleString('fr-FR')}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Date de traitement</div>
                    <div class="value">${r.dateTraitement ? new Date(r.dateTraitement).toLocaleString('fr-FR') : 'Non traitée'}</div>
                </div>
                <div class="detail-item full-width">
                    <div class="label">Description</div>
                    <div class="value" style="font-weight:400; background:#fff; padding:8px; border-radius:4px;">${r.description || '-'}</div>
                </div>
                ${r.reponse ? `
                <div class="detail-item full-width" style="background:#e8f5e9;">
                    <div class="label">Réponse</div>
                    <div class="value" style="font-weight:400; background:#fff; padding:8px; border-radius:4px;">${r.reponse}</div>
                </div>
                ` : ''}
                ${r.traiteParNom ? `
                <div class="detail-item full-width">
                    <div class="label">Traité par</div>
                    <div class="value">${r.traiteParNom}</div>
                </div>
                ` : ''}
                ${r.satisfaction ? `
                <div class="detail-item full-width">
                    <div class="label">Satisfaction</div>
                    <div class="value">${'⭐'.repeat(r.satisfaction)} (${r.satisfaction}/5)</div>
                </div>
                ` : ''}
            </div>
        `;
        document.getElementById('detailModal').classList.add('active');
    } catch (error) {
        showAlert('❌ Erreur: ' + error.message, 'error');
    }
}

function openProcessFromDetail() {
    if (detailId) {
        closeDetailModal();
        openProcessModal(detailId);
    }
}

// ===== MODAL TRAITEMENT =====
function openProcessModal(id) {
    processId = id;
    document.getElementById('reponseInput').value = '';
    document.getElementById('statutInput').value = 'EN_COURS';
    document.getElementById('satisfactionInput').value = '';
    document.getElementById('processModal').classList.add('active');
}

async function submitTraitement() {
    const reponse = document.getElementById('reponseInput').value.trim();
    const statut = document.getElementById('statutInput').value;
    const satisfaction = document.getElementById('satisfactionInput').value;

    if (!reponse) {
        showAlert('Veuillez saisir une réponse', 'error');
        return;
    }

    try {
        const data = {
            reponse: reponse,
            statut: statut,
            satisfaction: satisfaction ? parseInt(satisfaction) : null
        };

        await apiFetch(`${API_BASE}/reclamations/${processId}/traiter`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        closeProcessModal();
        showAlert('✅ Réclamation traitée avec succès !', 'success');
        loadReclamations(currentPage);
        loadStats();
    } catch (error) {
        showAlert('❌ Erreur: ' + error.message, 'error');
    }
}

// ===== FERMETURE MODALS =====
function closeDetailModal() { document.getElementById('detailModal').classList.remove('active'); }
function closeProcessModal() { document.getElementById('processModal').classList.remove('active'); processId = null; }

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
    loadStats();
    loadReclamations(0);

    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') applyFilters();
    });
});