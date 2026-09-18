// ============================================
// CLIENTS - JavaScript (FIXED)
// ============================================

const API_BASE = '/api';   // ✅ Chemin relatif
let currentPage = 0;
let pageSize = 10;
let totalPages = 0;
let totalItems = 0;
let deleteId = null;
let detailId = null;
let currentSort = { field: 'id', direction: 'desc' };
let allVentes = [];

// ===== AUTHENTIFICATION =====
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = '/pages/login.html';   // ✅ Corrigé
}

document.getElementById('userEmail').textContent = localStorage.getItem('email') || 'Admin';

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('email');
    window.location.href = '/pages/login.html';   // ✅ Corrigé
}

// ===== API FETCH =====
async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });

    if (response.status === 401) {
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/pages/login.html';
        throw new Error('Session expirée');
    }

    if (response.status === 204) return null;

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Erreur serveur');
    }

    return response.json();
}

// ===== FORMATAGE =====
function formatPrice(price) {
    return Number(price || 0).toLocaleString('fr-FR') + ' DH';   // ✅ Safe
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('fr-FR');
    } catch (e) {
        return '-';
    }
}

function getCity(adresse) {
    if (!adresse) return '-';
    const parts = adresse.split(',');
    return parts[parts.length - 1].trim() || '-';
}

// ===== CHARGER LES VILLES =====
function extractCities(clients) {
    const cities = new Set();
    clients.forEach(c => {
        const city = getCity(c.adresse);
        if (city !== '-') cities.add(city);
    });
    return Array.from(cities).sort();
}

// ===== CHARGER LES CLIENTS =====
async function loadClients(page = 0) {
    const loading = document.getElementById('loadingClients');
    const tableContent = document.getElementById('tableContent');
    const alert = document.getElementById('alert');

    try {
        loading.style.display = 'block';
        tableContent.style.display = 'none';
        alert.style.display = 'none';

        let url = `${API_BASE}/clients?page=${page}&size=${pageSize}&sort=${currentSort.field},${currentSort.direction}`;

        const search = document.getElementById('searchInput').value.trim();
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const city = document.getElementById('cityFilter').value;
        if (city) url += `&ville=${encodeURIComponent(city)}`;

        const status = document.getElementById('statusFilter').value;
        if (status) url += `&status=${status}`;

        // Charger clients + ventes en parallèle
        const [clientsData, ventesData] = await Promise.all([
            apiFetch(url),
            apiFetch(`${API_BASE}/ventes?size=1000`).catch(() => ({ content: [] }))
        ]);

        allVentes = ventesData.content || ventesData || [];

        totalPages = clientsData.totalPages || 0;
        totalItems = clientsData.totalItems || 0;
        currentPage = clientsData.currentPage || 0;

        displayClients(clientsData.content || []);
        updateStats(clientsData.content || []);
        updateCityFilter(clientsData.content || []);
        updatePagination();

        loading.style.display = 'none';
        tableContent.style.display = 'block';

        document.getElementById('clientCount').textContent = `(${totalItems} clients)`;

    } catch (error) {
        console.error('❌ Erreur loadClients:', error);
        loading.style.display = 'none';
        tableContent.style.display = 'block';
        showAlert('❌ ' + error.message, 'error');
    }
}

// ===== AFFICHER LES CLIENTS =====
function displayClients(clients) {
    const tbody = document.getElementById('clientsTableBody');

    if (!clients || clients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px; color:#b2bec3;">📭 Aucun client trouvé</td></tr>`;
        return;
    }

    tbody.innerHTML = clients.map(c => {
        const clientOrders = getClientOrders(c.id);
        const total = clientOrders.reduce((sum, v) => sum + (v.total || 0), 0);
        const city = getCity(c.adresse);
        const fullName = `${c.nom || ''} ${c.prenom || ''}`.trim();

        return `
            <tr>
                <td><strong>#${c.id}</strong></td>
                <td>
                    <div class="client-name">${fullName || '-'}</div>
                    <div class="client-email">${c.email || ''}</div>
                </td>
                <td>${c.telephone || '-'}</td>
                <td>${c.email || '-'}</td>
                <td>${city}</td>
                <td>${formatDate(c.createdAt)}</td>
                <td style="text-align:center;">
                    <span style="background:#e3f2fd; color:#1976d2; padding:4px 12px; border-radius:20px; font-weight:600; font-size:13px;">
                        ${clientOrders.length}
                    </span>
                </td>
                <td style="text-align:right; font-weight:600; color:#e94560;">${formatPrice(total)}</td>
                <td class="actions-col">
                    <div class="action-buttons">
                        <button class="btn-action view" onclick="viewClient(${c.id})">
                            👁️ <span class="tooltip">Voir détails</span>
                        </button>
                        <button class="btn-action edit" onclick="openEditModal(${c.id})">
                            ✏️ <span class="tooltip">Modifier</span>
                        </button>
                        <button class="btn-action delete" onclick="openDeleteModal(${c.id}, '${fullName.replace(/'/g, "\\'")}')">
                            🗑️ <span class="tooltip">Supprimer</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== STATISTIQUES =====
function updateStats(clients) {
    const total = clients.length;
    let active = 0;
    let purchased = 0;
    let totalRevenue = 0;

    clients.forEach(c => {
        const orders = getClientOrders(c.id);
        if (orders.length > 0) {
            purchased++;
            totalRevenue += orders.reduce((sum, v) => sum + (v.total || 0), 0);
        }
        const lastOrder = orders.sort((a, b) => new Date(b.dateVente) - new Date(a.dateVente))[0];
        if (lastOrder && lastOrder.dateVente) {
            const daysSince = (Date.now() - new Date(lastOrder.dateVente)) / (1000 * 60 * 60 * 24);
            if (daysSince < 30) active++;
        }
    });

    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('totalClients', total);
    el('activeClients', active);
    el('purchasedClients', purchased);
    el('clientRevenue', formatPrice(totalRevenue));
}

// ===== FILTRE VILLES =====
function updateCityFilter(clients) {
    const cities = extractCities(clients);
    const select = document.getElementById('cityFilter');
    if (!select) return;
    const currentValue = select.value;

    select.innerHTML = '<option value="">Toutes</option>';
    cities.forEach(city => {
        select.innerHTML += `<option value="${city}">${city}</option>`;
    });
    select.value = currentValue;
}

// ===== COMMANDES PAR CLIENT =====
function getClientOrders(clientId) {
    return allVentes.filter(v => v.clientId === clientId);
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
    const index = { id: 0, nom: 1, createdAt: 5 }[field];
    if (index !== undefined) {
        document.querySelectorAll('.data-table th')[index]?.classList.add('active');
    }

    loadClients(currentPage);
}

// ===== PAGINATION =====
function updatePagination() {
    const info = document.getElementById('paginationInfo');
    const buttons = document.getElementById('paginationButtons');
    if (!info || !buttons) return;

    const start = totalItems > 0 ? currentPage * pageSize + 1 : 0;
    const end = Math.min((currentPage + 1) * pageSize, totalItems);
    info.textContent = totalItems > 0 ? `Affichage ${start}–${end} sur ${totalItems} clients` : 'Aucun client';

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
    loadClients(page);
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSizeSelect').value);
    currentPage = 0;
    loadClients(0);
}

// ===== FILTRES =====
function applyFilters() {
    currentPage = 0;
    loadClients(0);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('cityFilter').value = '';
    document.getElementById('statusFilter').value = '';
    currentPage = 0;
    loadClients(0);
}

// ===== MODAL AJOUT =====
function openAddModal() {
    document.getElementById('modalTitle').textContent = '➕ Ajouter un client';
    document.getElementById('clientForm').reset();
    document.getElementById('editId').value = '';
    document.getElementById('clientModal').classList.add('active');
}

// ===== MODAL EDITION =====
async function openEditModal(id) {
    try {
        const c = await apiFetch(`${API_BASE}/clients/${id}`);

        document.getElementById('modalTitle').textContent = '✏️ Modifier le client';
        document.getElementById('editId').value = c.id;
        document.getElementById('nom').value = c.nom || '';
        document.getElementById('prenom').value = c.prenom || '';
        document.getElementById('telephone').value = c.telephone || '';
        document.getElementById('email').value = c.email || '';
        document.getElementById('adresse').value = c.adresse || '';

        document.getElementById('clientModal').classList.add('active');
    } catch (error) {
        showAlert('❌ Erreur: ' + error.message, 'error');
    }
}

// ===== SOUMETTRE FORMULAIRE =====
async function submitClient() {
    const id = document.getElementById('editId').value;
    const data = {
        nom: document.getElementById('nom').value.trim(),
        prenom: document.getElementById('prenom').value.trim(),
        telephone: document.getElementById('telephone').value.trim(),
        email: document.getElementById('email').value.trim(),
        adresse: document.getElementById('adresse').value.trim()
    };

    if (!data.nom || !data.prenom) {
        showAlert('Veuillez remplir les champs obligatoires (*)', 'error');
        return;
    }

    try {
        let url = `${API_BASE}/clients`;
        let method = 'POST';
        if (id) { url += `/${id}`; method = 'PUT'; }

        await apiFetch(url, { method, body: JSON.stringify(data) });

        closeModal();
        showAlert(id ? '✅ Client modifié avec succès !' : '✅ Client ajouté avec succès !', 'success');
        loadClients(currentPage);
    } catch (error) {
        showAlert('❌ Erreur: ' + error.message, 'error');
    }
}

// ===== MODAL DETAIL =====
async function viewClient(id) {
    try {
        const c = await apiFetch(`${API_BASE}/clients/${id}`);
        detailId = id;

        const orders = getClientOrders(id);
        const total = orders.reduce((sum, v) => sum + (v.total || 0), 0);
        const lastOrder = orders.slice().sort((a, b) => new Date(b.dateVente) - new Date(a.dateVente))[0];

        document.getElementById('detailTitle').textContent = `👤 ${c.nom || ''} ${c.prenom || ''}`;

        let ordersHtml = '';
        if (orders.length === 0) {
            ordersHtml = '<p style="color:#888; text-align:center; padding:20px;">Aucune commande</p>';
        } else {
            ordersHtml = `
                <table>
                    <thead><tr><th>#</th><th>Total</th><th>Date</th><th>Statut</th></tr></thead>
                    <tbody>
                        ${orders.slice().sort((a,b) => new Date(b.dateVente) - new Date(a.dateVente)).map(v => `
                            <tr>
                                <td><strong>#${v.id}</strong></td>
                                <td style="font-weight:600; color:#e94560;">${formatPrice(v.total)}</td>
                                <td>${formatDate(v.dateVente)}</td>
                                <td><span class="status-badge ${(v.statut || '').toLowerCase()}">${v.statut || '-'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        document.getElementById('detailContent').innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="label">Nom complet</div>
                    <div class="value">${c.nom || '-'} ${c.prenom || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Téléphone</div>
                    <div class="value">${c.telephone || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Email</div>
                    <div class="value">${c.email || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Adresse</div>
                    <div class="value">${c.adresse || '-'}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Date d'inscription</div>
                    <div class="value">${formatDate(c.createdAt)}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Nombre de commandes</div>
                    <div class="value">${orders.length}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Total achats</div>
                    <div class="value" style="color:#e94560; font-size:20px;">${formatPrice(total)}</div>
                </div>
                <div class="detail-item">
                    <div class="label">Dernière commande</div>
                    <div class="value">${lastOrder ? formatDate(lastOrder.dateVente) : '-'}</div>
                </div>
                <div class="detail-item full-width">
                    <div class="label">📋 Dernières commandes</div>
                    <div class="detail-orders">${ordersHtml}</div>
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

// ===== MODAL SUPPRESSION =====
function openDeleteModal(id, nom) {
    deleteId = id;
    document.getElementById('deleteClientName').textContent = nom || 'ce client';
    document.getElementById('deleteModal').classList.add('active');
}

async function confirmDelete() {
    if (!deleteId) return;
    try {
        await apiFetch(`${API_BASE}/clients/${deleteId}`, { method: 'DELETE' });
        closeDeleteModal();
        showAlert('✅ Client supprimé avec succès !', 'success');
        loadClients(currentPage);
    } catch (error) {
        showAlert('❌ Erreur: ' + error.message, 'error');
    }
}

// ===== FERMETURE MODALS =====
function closeModal() { document.getElementById('clientModal').classList.remove('active'); }
function closeDetailModal() { document.getElementById('detailModal').classList.remove('active'); }
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
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Initialisation clients...');
    loadClients(0);

    document.getElementById('searchInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') applyFilters();
    });
});

console.log('✅ clients.js chargé');