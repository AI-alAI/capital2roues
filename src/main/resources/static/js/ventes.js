// ============================================
// VENTES - JavaScript (Complete + PDF Backend)
// ============================================

const API_BASE = '/api';

// État
let lignesVente = [];
let clients = [];
let produits = [];
let venteIdToConfirm = null;
let venteIdToDetail = null;

// Pagination / historique
let currentPage = 0;
let pageSize = 10;
let totalPages = 0;
let totalItems = 0;
let currentSort = { field: 'id', direction: 'desc' };

// ===== AUTHENTIFICATION =====
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = '/pages/login.html';
}

const userEmailEl = document.getElementById('userEmail');
if (userEmailEl) userEmailEl.textContent = localStorage.getItem('email') || 'Admin';

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('email');
    window.location.href = '/pages/login.html';
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
    return Number(price || 0).toLocaleString('fr-FR') + ' DH';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function getStatusClass(status) {
    return (status || '').toLowerCase();
}

// ===== ALERT =====
function showAlert(message, type) {
    const alert = document.getElementById('alert');
    if (!alert) return;
    alert.textContent = message;
    alert.className = `alert ${type}`;
    alert.style.display = 'block';
    setTimeout(() => { alert.style.display = 'none'; }, 5000);
}

// ============================================
// CHARGER CLIENTS + PRODUITS
// ============================================

async function loadClientsAndProduits() {
    try {
        const [clientsData, produitsData] = await Promise.all([
            apiFetch(`${API_BASE}/clients?size=1000`),
            apiFetch(`${API_BASE}/produits?size=1000`)
        ]);

        clients = clientsData.content || [];
        produits = produitsData.content || [];

        const clientSelect = document.getElementById('clientSelect');
        clientSelect.innerHTML = '<option value="">-- Sélectionner un client --</option>' +
            clients.map(c => `<option value="${c.id}">${c.nom} ${c.prenom} (${c.email || c.telephone || ''})</option>`).join('');

        const produitSelect = document.getElementById('produitSelect');
        produitSelect.innerHTML = '<option value="">-- Sélectionner un produit --</option>' +
            produits.map(p => `<option value="${p.id}" data-prix="${p.prixVente}" data-stock="${p.quantiteStock}">${p.nom} — ${formatPrice(p.prixVente)} (Stock: ${p.quantiteStock})</option>`).join('');

    } catch (error) {
        console.error('❌ Erreur chargement clients/produits:', error);
        showAlert('❌ ' + error.message, 'error');
    }
}

// ============================================
// AJOUTER UNE LIGNE
// ============================================

function ajouterLigne() {
    const produitSelect = document.getElementById('produitSelect');
    const quantiteInput = document.getElementById('quantiteInput');

    const produitId = parseInt(produitSelect.value);
    const quantite = parseInt(quantiteInput.value) || 1;

    if (!produitId) {
        showAlert('❌ Veuillez sélectionner un produit', 'error');
        return;
    }

    if (quantite < 1) {
        showAlert('❌ Quantité invalide', 'error');
        return;
    }

    const produit = produits.find(p => p.id === produitId);
    if (!produit) {
        showAlert('❌ Produit introuvable', 'error');
        return;
    }

    if (quantite > produit.quantiteStock) {
        showAlert(`❌ Stock insuffisant (disponible: ${produit.quantiteStock})`, 'error');
        return;
    }

    const existante = lignesVente.find(l => l.produitId === produitId);
    if (existante) {
        existante.quantite += quantite;
    } else {
        lignesVente.push({
            produitId: produit.id,
            produitNom: produit.nom,
            prixUnitaire: produit.prixVente,
            quantite: quantite
        });
    }

    afficherLignes();
    calculerTotal();

    produitSelect.value = '';
    quantiteInput.value = 1;
    document.getElementById('stockInfo').innerHTML = 'Stock disponible: <span class="available">0</span>';
}

function supprimerLigne(index) {
    lignesVente.splice(index, 1);
    afficherLignes();
    calculerTotal();
}

function afficherLignes() {
    const tbody = document.getElementById('lignesTableBody');

    if (lignesVente.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:20px; color:#b2bec3;">
                    Aucun produit ajouté
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = lignesVente.map((l, i) => {
        const totalLigne = l.prixUnitaire * l.quantite;
        return `
            <tr>
                <td><strong>${l.produitNom}</strong></td>
                <td style="text-align:center;">${l.quantite}</td>
                <td style="text-align:right;">${formatPrice(l.prixUnitaire)}</td>
                <td style="text-align:right; font-weight:600;">${formatPrice(totalLigne)}</td>
                <td style="text-align:center;">
                    <button class="btn-remove" onclick="supprimerLigne(${i})">✕</button>
                </td>
            </tr>`;
    }).join('');
}

function calculerTotal() {
    const sousTotal = lignesVente.reduce((sum, l) => sum + l.prixUnitaire * l.quantite, 0);

    const sousTotalEl = document.getElementById('sousTotal');
    const remiseEl = document.getElementById('remise');
    const totalEl = document.getElementById('venteTotal');

    if (sousTotalEl) sousTotalEl.textContent = formatPrice(sousTotal);
    if (remiseEl) remiseEl.textContent = formatPrice(0);
    if (totalEl) totalEl.textContent = formatPrice(sousTotal);

    return sousTotal;
}

function reinitialiserVente() {
    if (lignesVente.length > 0 && !confirm('Réinitialiser la vente en cours ?')) return;

    lignesVente = [];
    afficherLignes();
    calculerTotal();

    const clientSelect = document.getElementById('clientSelect');
    if (clientSelect) clientSelect.value = '';

    const produitSelect = document.getElementById('produitSelect');
    if (produitSelect) produitSelect.value = '';

    const quantiteInput = document.getElementById('quantiteInput');
    if (quantiteInput) quantiteInput.value = 1;
}

// ============================================
// INFO STOCK
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    const produitSelect = document.getElementById('produitSelect');
    if (produitSelect) {
        produitSelect.addEventListener('change', function () {
            const option = this.options[this.selectedIndex];
            const stock = option.dataset.stock || 0;
            const stockInfo = document.getElementById('stockInfo');
            if (stockInfo) {
                stockInfo.innerHTML = `Stock disponible: <span class="available">${stock}</span>`;
            }
        });
    }
});

// ============================================
// VALIDER LA VENTE (ouvrir modal)
// ============================================

function validerVente() {
    if (lignesVente.length === 0) {
        showAlert('❌ Ajoutez au moins un produit', 'error');
        return;
    }

    const clientId = parseInt(document.getElementById('clientSelect').value);
    if (!clientId) {
        showAlert('❌ Sélectionnez un client', 'error');
        return;
    }

    const client = clients.find(c => c.id === clientId);
    const total = calculerTotal();
    const paiement = document.getElementById('paiementSelect').value;

    document.getElementById('confirmClient').textContent = `${client.nom} ${client.prenom}`;
    document.getElementById('confirmProduits').textContent =
        lignesVente.map(l => `${l.produitNom} ×${l.quantite}`).join(', ');
    document.getElementById('confirmPaiement').textContent = paiement;
    document.getElementById('confirmTotal').textContent = formatPrice(total);

    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

// ============================================
// CONFIRMER LA VENTE
// ============================================

async function confirmVente() {
    const clientId = parseInt(document.getElementById('clientSelect').value);

    if (!clientId) {
        showAlert('❌ Client manquant', 'error');
        return;
    }

    const venteData = {
        clientId: clientId,
        utilisateurId: 1,
        lignes: lignesVente.map(l => ({
            produitId: l.produitId,
            quantite: l.quantite
        }))
    };

    try {
        const result = await apiFetch(`${API_BASE}/ventes`, {
            method: 'POST',
            body: JSON.stringify(venteData)
        });

        closeConfirmModal();
        showAlert(`✅ Vente #${result.id} validée avec succès ! Total: ${formatPrice(result.total)}`, 'success');

        lignesVente = [];
        afficherLignes();
        calculerTotal();
        document.getElementById('clientSelect').value = '';

        loadHistorique(0);
        loadClientsAndProduits();

    } catch (error) {
        showAlert('❌ ' + error.message, 'error');
    }
}

// ============================================
// HISTORIQUE DES VENTES
// ============================================

async function loadHistorique(page = 0) {
    const loading = document.getElementById('loadingSales');
    const content = document.getElementById('historyContent');

    try {
        loading.style.display = 'block';
        content.style.display = 'none';

        let url = `${API_BASE}/ventes?page=${page}&size=${pageSize}&sort=${currentSort.field},${currentSort.direction}`;

        const search = document.getElementById('searchVente')?.value.trim();
        if (search) url += `&keyword=${encodeURIComponent(search)}`;

        const dateDebut = document.getElementById('dateDebut')?.value;
        if (dateDebut) url += `&dateDebut=${dateDebut}`;

        const dateFin = document.getElementById('dateFin')?.value;
        if (dateFin) url += `&dateFin=${dateFin}`;

        const status = document.getElementById('statusFilter')?.value;
        if (status) url += `&statut=${status}`;

        const data = await apiFetch(url);

        totalPages = data.totalPages || 0;
        totalItems = data.totalItems || 0;
        currentPage = data.currentPage || 0;

        afficherHistorique(data.content || []);
        updatePagination();

        loading.style.display = 'none';
        content.style.display = 'block';

    } catch (error) {
        console.error('❌ Erreur historique:', error);
        loading.style.display = 'none';
        content.style.display = 'block';
        showAlert('❌ ' + error.message, 'error');
    }
}

function afficherHistorique(ventes) {
    const tbody = document.getElementById('ventesTableBody');

    if (!ventes || ventes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#b2bec3;">📭 Aucune vente trouvée</td></tr>`;
        return;
    }

    tbody.innerHTML = ventes.map(v => {
        const id = parseInt(v.id, 10);

        return `
        <tr>
            <td><strong>#${id}</strong></td>
            <td>${v.clientNom || ''} ${v.clientPrenom || ''}</td>
            <td>${v.utilisateurNom || 'Admin'}</td>
            <td style="text-align:right; font-weight:600;">${formatPrice(v.total)}</td>
            <td>${v.modePaiement || '-'}</td>
            <td>${formatDate(v.dateVente)}</td>
            <td style="text-align:center;">
                <span class="status-badge ${getStatusClass(v.statut)}">${v.statut || '-'}</span>
            </td>
            <td style="text-align:center;">
                <div class="action-buttons" style="justify-content:center;">
                    <button class="btn-action view" onclick="voirDetailVente(${id})" title="Voir détails">👁️</button>
                    <button class="btn-action" onclick="ouvrirFacture(${id})" title="Télécharger la facture PDF"
                            style="background:#fff3e0; color:#FF9800;">📄</button>
                    <button class="btn-action delete" onclick="annulerVente(${id})" title="Annuler">✕</button>
                </div>
            </td>
        </tr>
    `}).join('');
}

function updatePagination() {
    const info = document.getElementById('paginationInfo');
    const buttons = document.getElementById('paginationButtons');
    if (!info || !buttons) return;

    const start = totalItems > 0 ? currentPage * pageSize + 1 : 0;
    const end = Math.min((currentPage + 1) * pageSize, totalItems);
    info.textContent = totalItems > 0 ? `Affichage ${start}–${end} sur ${totalItems} ventes` : 'Aucune vente';

    if (totalPages <= 1) {
        buttons.innerHTML = '';
        return;
    }

    let html = `<button onclick="goToPage(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>‹</button>`;

    for (let i = 0; i < totalPages; i++) {
        html += `<button onclick="goToPage(${i})" class="${i === currentPage ? 'active' : ''}">${i + 1}</button>`;
    }

    html += `<button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages - 1 ? 'disabled' : ''}>›</button>`;
    buttons.innerHTML = html;
}

function goToPage(page) {
    if (page < 0 || page >= totalPages) return;
    loadHistorique(page);
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSizeSelect').value);
    loadHistorique(0);
}

function rafraichirVentes() {
    loadHistorique(currentPage);
    loadClientsAndProduits();
}

function applyHistoryFilters() { loadHistorique(0); }

function resetHistoryFilters() {
    ['searchVente', 'dateDebut', 'dateFin', 'statusFilter', 'vendeurFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    loadHistorique(0);
}

// ============================================
// DETAIL VENTE (modal)
// ============================================

async function voirDetailVente(id) {
    try {
        const v = await apiFetch(`${API_BASE}/ventes/${id}`);
        venteIdToDetail = id;

        document.getElementById('detailVenteId').textContent = v.id;

        const lignesHtml = (v.lignes || []).map(l => `
            <tr>
                <td>${l.produitNom || l.produit?.nom || '-'}</td>
                <td style="text-align:center;">${l.quantite}</td>
                <td style="text-align:right;">${formatPrice(l.prixUnitaire)}</td>
                <td style="text-align:right; font-weight:600;">${formatPrice(l.totalLigne || (l.quantite * l.prixUnitaire))}</td>
            </tr>
        `).join('');

        document.getElementById('detailContent').innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
                <div><strong>Client:</strong> ${v.clientNom || ''} ${v.clientPrenom || ''}</div>
                <div><strong>Vendeur:</strong> ${v.utilisateurNom || 'Admin'}</div>
                <div><strong>Date:</strong> ${formatDate(v.dateVente)}</div>
                <div><strong>Paiement:</strong> ${v.modePaiement || '-'}</div>
                <div><strong>Statut:</strong> <span class="status-badge ${getStatusClass(v.statut)}">${v.statut}</span></div>
                <div><strong>Total:</strong> <span style="color:#e94560; font-weight:700;">${formatPrice(v.total)}</span></div>
            </div>
            <h4 style="margin:16px 0 8px;">Produits</h4>
            <table class="lignes-table">
                <thead><tr><th>Produit</th><th style="text-align:center;">Qté</th><th style="text-align:right;">Prix</th><th style="text-align:right;">Total</th></tr></thead>
                <tbody>${lignesHtml}</tbody>
            </table>
        `;

        document.getElementById('detailModal').classList.add('active');
    } catch (error) {
        showAlert('❌ ' + error.message, 'error');
    }
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
}

// ============================================
// FACTURE PDF — Utilise le backend
// ============================================

function ouvrirFacture(id) {
    const venteId = parseInt(id, 10);

    if (!venteId || isNaN(venteId) || venteId <= 0) {
        console.error('❌ ID invalide:', id);
        showAlert('❌ ID de vente invalide', 'error');
        return;
    }

    console.log(`📄 Téléchargement de la facture PDF #${venteId}`);

    // ✅ Utilise votre endpoint backend qui génère un vrai PDF
    window.open(`${API_BASE}/ventes/${venteId}/pdf`, '_blank');
}

function downloadPDFDetail() {
    if (!venteIdToDetail) {
        showAlert('❌ Aucune vente sélectionnée', 'error');
        return;
    }

    console.log(`📄 Téléchargement de la facture PDF #${venteIdToDetail}`);
    window.open(`${API_BASE}/ventes/${venteIdToDetail}/pdf`, '_blank');
}

// ============================================
// ANNULER VENTE
// ============================================

async function annulerVente(id) {
    if (!confirm(`Annuler la vente #${id} ?`)) return;

    try {
        await apiFetch(`${API_BASE}/ventes/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ statut: 'ANNULEE' })
        });
        showAlert(`✅ Vente #${id} annulée`, 'success');
        loadHistorique(currentPage);
    } catch (error) {
        showAlert('❌ ' + error.message, 'error');
    }
}

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Initialisation ventes...');
    loadClientsAndProduits();
    loadHistorique(0);

    const searchEl = document.getElementById('searchVente');
    if (searchEl) {
        searchEl.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') applyHistoryFilters();
        });
    }
});

console.log('✅ ventes.js chargé');