// ============================================
// PRODUITS - JavaScript (Version Finale - FIXED)
// ============================================

const API_BASE = '/api';   // ✅ Chemin relatif — marche partout
let currentPage = 0;
let pageSize = 10;
let totalPages = 0;
let totalItems = 0;
let currentFilters = {};
let deleteId = null;
let detailId = null;
let currentSort = { field: 'id', direction: 'desc' };

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
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
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
    return Number(price || 0).toLocaleString('fr-FR') + ' DH';
}

function getStockStatus(quantite) {
    if (quantite === 0) return { class: 'out', label: 'Rupture', dot: 'out' };
    if (quantite <= 2) return { class: 'critical', label: 'Critique', dot: 'critical' };
    if (quantite <= 5) return { class: 'warning', label: 'Faible', dot: 'warning' };
    return { class: 'normal', label: 'Normal', dot: 'normal' };
}

// ===== CHARGER LES CATÉGORIES =====
async function loadCategories() {
    try {
        const categories = await apiFetch(`${API_BASE}/categories`);
        const select = document.getElementById('categoryFilter');
        const modalSelect = document.getElementById('categorieId');
        const options = categories.map(c => `<option value="${c.id}">${c.nom}</option>`).join('');
        select.innerHTML = `<option value="">Toutes</option>${options}`;
        modalSelect.innerHTML = `<option value="">Sélectionner</option>${options}`;
    } catch (error) {
        console.warn('⚠️ Catégories non chargées:', error.message);
        // Ne bloque PAS le reste si les catégories échouent
    }
}

// ===== CHARGER LES PRODUITS =====
async function loadProducts(page = 0) {
    const loading = document.getElementById('loadingProducts');
    const tableContent = document.getElementById('tableContent');
    const alert = document.getElementById('alert');

    try {
        loading.style.display = 'block';
        tableContent.style.display = 'none';
        alert.style.display = 'none';

        let url = `${API_BASE}/produits?page=${page}&size=${pageSize}&sort=${currentSort.field},${currentSort.direction}`;

        const search = document.getElementById('searchInput').value.trim();
        if (search) url += `&keyword=${encodeURIComponent(search)}`;

        const category = document.getElementById('categoryFilter').value;
        if (category) url += `&categorieId=${category}`;

        const stockFilter = document.getElementById('stockFilter').value;
        if (stockFilter === 'normal') url += `&stockMin=6`;
        else if (stockFilter === 'warning') url += `&stockMin=1&stockMax=5`;
        else if (stockFilter === 'critical') url += `&stockMin=0&stockMax=0`;

        const prixMin = document.getElementById('prixMin').value;
        if (prixMin) url += `&prixMin=${prixMin}`;

        const prixMax = document.getElementById('prixMax').value;
        if (prixMax) url += `&prixMax=${prixMax}`;

        console.log('📡 Fetching:', url);
        const data = await apiFetch(url);
        console.log('📦 Data reçue:', data);

        totalPages = data.totalPages || 0;
        totalItems = data.totalItems || 0;
        currentPage = data.currentPage || 0;

        displayProducts(data.content || []);
        updateStockSummary(data.content || []);
        updatePagination();

        loading.style.display = 'none';
        tableContent.style.display = 'block';

        document.getElementById('productCount').textContent = `(${totalItems} produits)`;

    } catch (error) {
        console.error('❌ Erreur loadProducts:', error);
        loading.style.display = 'none';
        tableContent.style.display = 'block';
        showAlert('❌ ' + error.message, 'error');
    }
}

// ===== AFFICHER LES PRODUITS =====
function displayProducts(products) {
    const tbody = document.getElementById('productsTableBody');

    if (!products || products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:40px; color:#b2bec3;">📭 Aucun produit trouvé</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map(p => {
        const status = getStockStatus(p.quantiteStock);
        const margin = (p.prixVente || 0) - (p.prixAchat || 0);
        const marginClass = margin > 0 ? 'margin-positive' : 'margin-negative';

        return `
            <tr>
                <td><strong>#${p.id}</strong></td>
                <td>
                    <div class="product-name">${p.nom || '-'}</div>
                    <div class="product-ref">${p.reference || '-'}</div>
                </td>
                <td>${p.reference || '-'}</td>
                <td>${p.categorieNom || '-'}</td>
                <td style="text-align:right;">${formatPrice(p.prixAchat || 0)}</td>
                <td style="text-align:right; font-weight:600;">${formatPrice(p.prixVente || 0)}</td>
                <td style="text-align:right;" class="${marginClass}">${formatPrice(margin)}</td>
                <td style="text-align:center;">
                    <div class="stock-status">
                        <span class="stock-dot ${status.dot}"></span>
                        <span class="stock-text ${status.class}">${p.quantiteStock || 0}</span>
                    </div>
                </td>
                <td style="text-align:center;">
                    <span class="stock-text ${status.class}">${status.label}</span>
                </td>
                <td class="actions-col">
                    <div class="action-buttons">
                        <button class="btn-action view" onclick="viewProduct(${p.id})">
                            👁️ <span class="tooltip">Voir détails</span>
                        </button>
                        <button class="btn-action edit" onclick="openEditModal(${p.id})">
                            ✏️ <span class="tooltip">Modifier</span>
                        </button>
                        <button class="btn-action stock-mvt" onclick="viewStockMovements(${p.id})">
                            📦 <span class="tooltip">Mouvements</span>
                        </button>
                        <button class="btn-action delete" onclick="openDeleteModal(${p.id}, '${(p.nom || '').replace(/'/g, "\\'")}')">
                            🗑️ <span class="tooltip">Supprimer</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== RÉSUMÉ STOCK =====
function updateStockSummary(products) {
    let total = products.length;
    let normal = 0, warning = 0, critical = 0;

    products.forEach(p => {
        const status = getStockStatus(p.quantiteStock);
        if (status.class === 'normal') normal++;
        else if (status.class === 'warning') warning++;
        else critical++;
    });

    document.getElementById('totalProducts').textContent = total;
    document.getElementById('normalStock').textContent = normal;
    document.getElementById('warningStock').textContent = warning;
    document.getElementById('criticalStock').textContent = critical;
}

// ===== TRI =====
function sortBy(field) {
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }

    document.querySelectorAll('#productsTable th').forEach(th => th.classList.remove('active'));
    const index = { id: 0, nom: 1, reference: 2, prixAchat: 4, prixVente: 5, quantiteStock: 7 }[field];
    if (index !== undefined) {
        document.querySelectorAll('#productsTable th')[index]?.classList.add('active');
    }

    loadProducts(currentPage);
}

// ===== PAGINATION =====
function updatePagination() {
    const info = document.getElementById('paginationInfo');
    const buttons = document.getElementById('paginationButtons');

    const start = totalItems > 0 ? currentPage * pageSize + 1 : 0;
    const end = Math.min((currentPage + 1) * pageSize, totalItems);
    info.textContent = totalItems > 0 ? `Affichage ${start}–${end} sur ${totalItems} produits` : 'Aucun produit';

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
    loadProducts(page);
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSizeSelect').value);
    currentPage = 0;
    loadProducts(0);
}

// ===== FILTRES =====
function applyFilters() {
    currentPage = 0;
    loadProducts(0);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('stockFilter').value = '';
    document.getElementById('prixMin').value = '';
    document.getElementById('prixMax').value = '';
    currentPage = 0;
    loadProducts(0);
}

// ===== MODAL AJOUT =====
function openAddModal() {
    document.getElementById('modalTitle').textContent = '➕ Ajouter un produit';
    document.getElementById('productForm').reset();
    document.getElementById('editId').value = '';
    document.getElementById('quantiteStock').value = 0;
    document.getElementById('productModal').classList.add('active');
}

// ===== MODAL EDITION =====
async function openEditModal(id) {
    try {
        const p = await apiFetch(`${API_BASE}/produits/${id}`);

        document.getElementById('modalTitle').textContent = '✏️ Modifier le produit';
        document.getElementById('editId').value = p.id;
        document.getElementById('nom').value = p.nom || '';
        document.getElementById('reference').value = p.reference || '';
        document.getElementById('vin').value = p.vin || '';
        document.getElementById('annee').value = p.annee || '';
        document.getElementById('couleur').value = p.couleur || '';
        document.getElementById('cylindree').value = p.cylindree || '';
        document.getElementById('prixAchat').value = p.prixAchat || '';
        document.getElementById('prixVente').value = p.prixVente || '';
        document.getElementById('quantiteStock').value = p.quantiteStock || 0;
        document.getElementById('garantie').value = p.garantie || '';
        document.getElementById('categorieId').value = p.categorieId || '';

        document.getElementById('productModal').classList.add('active');
    } catch (error) {
        showAlert('❌ Erreur: ' + error.message, 'error');
    }
}

// ===== SOUMETTRE FORMULAIRE =====
async function submitProduct() {
    const id = document.getElementById('editId').value;
    const data = {
        nom: document.getElementById('nom').value.trim(),
        reference: document.getElementById('reference').value.trim(),
        vin: document.getElementById('vin').value.trim() || null,
        annee: parseInt(document.getElementById('annee').value) || null,
        couleur: document.getElementById('couleur').value.trim() || null,
        cylindree: parseInt(document.getElementById('cylindree').value) || null,
        prixAchat: parseFloat(document.getElementById('prixAchat').value),
        prixVente: parseFloat(document.getElementById('prixVente').value),
        quantiteStock: parseInt(document.getElementById('quantiteStock').value) || 0,
        garantie: document.getElementById('garantie').value.trim() || null,
        categorieId: parseInt(document.getElementById('categorieId').value) || null
    };

    if (!data.nom || !data.reference || !data.prixAchat || !data.prixVente) {
        showAlert('Veuillez remplir tous les champs obligatoires (*)', 'error');
        return;
    }

    try {
        let url = `${API_BASE}/produits`;
        let method = 'POST';
        if (id) { url += `/${id}`; method = 'PUT'; }

        await apiFetch(url, { method, body: JSON.stringify(data) });

        closeModal();
        showAlert(id ? '✅ Produit modifié avec succès !' : '✅ Produit ajouté avec succès !', 'success');
        loadProducts(currentPage);
    } catch (error) {
        showAlert('❌ Erreur: ' + error.message, 'error');
    }
}

// ===== MODAL DETAIL =====
async function viewProduct(id) {
    try {
        const p = await apiFetch(`${API_BASE}/produits/${id}`);
        detailId = id;

        const status = getStockStatus(p.quantiteStock);
        const margin = (p.prixVente || 0) - (p.prixAchat || 0);

        document.getElementById('detailTitle').textContent = `🏍️ ${p.nom || 'Produit'}`;
        document.getElementById('detailContent').innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div><strong>Référence:</strong> ${p.reference || '-'}</div>
                <div><strong>Catégorie:</strong> ${p.categorieNom || '-'}</div>
                <div><strong>Année:</strong> ${p.annee || '-'}</div>
                <div><strong>Couleur:</strong> ${p.couleur || '-'}</div>
                <div><strong>Garantie:</strong> ${p.garantie || '-'}</div>
                <div><strong>VIN:</strong> ${p.vin || '-'}</div>
                <div><strong>Stock:</strong> <span class="stock-text ${status.class}">${p.quantiteStock} unités</span></div>
                <div><strong>Prix achat:</strong> ${formatPrice(p.prixAchat)}</div>
                <div><strong>Prix vente:</strong> ${formatPrice(p.prixVente)}</div>
                <div><strong>Marge:</strong> ${formatPrice(margin)}</div>
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

// ===== SUPPRESSION =====
function openDeleteModal(id, nom) {
    deleteId = id;
    document.getElementById('deleteProductName').textContent = nom || 'ce produit';
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    deleteId = null;
}

async function confirmDelete() {
    if (!deleteId) return;

    try {
        await apiFetch(`${API_BASE}/produits/${deleteId}`, { method: 'DELETE' });
        const id = deleteId;
        closeDeleteModal();
        showAlert(`✅ Produit #${id} supprimé avec succès !`, 'success');
        loadProducts(currentPage);
    } catch (error) {
        showAlert('❌ Erreur: ' + error.message, 'error');
        closeDeleteModal();
    }
}

// ===== FERMETURE MODALS =====
function closeModal() {
    document.getElementById('productModal').classList.remove('active');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
}

// ===== ALERTES =====
function showAlert(message, type) {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert ${type}`;
    alert.style.display = 'block';
    setTimeout(() => { alert.style.display = 'none'; }, 5000);
}

// ===== EXPORT EXCEL =====
function exportExcel() {
    window.open(`${API_BASE}/produits/export/excel`, '_blank');
}

// ===== STOCK MOVEMENTS =====
function viewStockMovements(id) {
    showAlert('📦 Mouvements de stock - Fonctionnalité en développement', 'success');
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Initialisation produits...');
    loadCategories();      // Ne bloque pas si échoue
    loadProducts(0);

    document.getElementById('searchInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') applyFilters();
    });
});

console.log('✅ produits.js chargé');