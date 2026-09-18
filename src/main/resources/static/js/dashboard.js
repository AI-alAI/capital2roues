// ============================================
// DASHBOARD ADMIN - JavaScript
// ============================================

const API_BASE = '/api';   // ✅ Chemin relatif (même origine)
let ventesChart = null;

// ===== AUTHENTIFICATION =====
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = '/pages/login.html';   // ✅ Corrigé (pages/, pas client/)
}

document.getElementById('userEmail').textContent = localStorage.getItem('email') || 'Admin';

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('email');
    localStorage.removeItem('clientId');
    localStorage.removeItem('clientNom');
    localStorage.removeItem('clientPrenom');
    localStorage.removeItem('clientRole');
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

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Erreur serveur');
    }

    if (response.status === 204) return null;
    return response.json();
}

// ===== FORMATAGE =====
function formatPrice(price) {
    return Number(price || 0).toLocaleString('fr-FR') + ' DH';
}

function getStatusClass(status) {
    return (status || '').toLowerCase();
}

function getStatusIcon(status) {
    const icons = { 'PAYEE': '✅', 'ANNULEE': '❌', 'RETOURNEE': '↩️' };
    return icons[status] || '';
}

// ===== CHARGER LE DASHBOARD =====
async function loadDashboard() {
    const loading = document.getElementById('loading');
    const content = document.getElementById('dashboardContent');
    const alert = document.getElementById('alert');

    try {
        loading.style.display = 'block';
        content.style.display = 'none';
        alert.style.display = 'none';

        // ✅ UN SEUL APPEL
        const stats = await apiFetch(`${API_BASE}/statistiques/dashboard`);
        console.log('📊 Dashboard data:', stats);

        updateKPI(stats);
        updateChart(stats);
        updateTopProducts(stats.topProduits || []);
        updateRecentSales(stats.ventesRecentes || []);
        updateLowStock(stats);
        setupPeriodButtons();

        loading.style.display = 'none';
        content.style.display = 'block';

    } catch (error) {
        loading.style.display = 'none';
        alert.textContent = '❌ Erreur: ' + error.message;
        alert.className = 'alert error';
        alert.style.display = 'block';
        console.error('Erreur dashboard:', error);
    }
}

// ===== 1. KPI =====
function updateKPI(stats) {
    document.getElementById('caTotal').textContent    = formatPrice(stats.chiffreAffairesTotal || 0);
    document.getElementById('nbVentes').textContent   = stats.nombreVentes   || 0;
    document.getElementById('nbProduits').textContent = stats.nombreProduits || 0;
    document.getElementById('stockFaible').textContent= stats.stockFaible    || 0;
    document.getElementById('nbClients').textContent  = stats.nombreClients  || 0;

    const ca = stats.chiffreAffairesTotal || 0;
    document.getElementById('margeBrute').textContent = formatPrice(ca * 0.25);
    document.getElementById('margeChange').textContent = 'Taux: 25%';
    document.getElementById('caChange').textContent = '+12.5% ↑';
}

// ===== 2. GRAPHIQUE =====
function updateChart(stats) {
    const canvas = document.getElementById('ventesChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const ventesParMois = stats.ventesParMois || {};
    const labels = Object.keys(ventesParMois);
    const data = Object.values(ventesParMois);

    if (ventesChart) { ventesChart.destroy(); ventesChart = null; }

    if (labels.length === 0) {
        canvas.parentElement.innerHTML = `
            <div class="empty-state" style="padding: 40px 0;">
                <div class="icon">📈</div>
                <div class="text">Aucune donnée de vente</div>
            </div>`;
        return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(233, 69, 96, 0.2)');
    gradient.addColorStop(1, 'rgba(233, 69, 96, 0.0)');

    ventesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Chiffre d\'affaires',
                data: data,
                borderColor: '#e94560',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#e94560',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => formatPrice(c.parsed.y) } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { callback: (v) => v + ' DH', maxTicksLimit: 8 } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ===== 3. TOP PRODUITS =====
function updateTopProducts(topProduits) {
    const container = document.getElementById('topProductsList');
    if (!container) return;

    if (!topProduits || topProduits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📊</div>
                <div class="text">Aucune vente enregistrée</div>
            </div>`;
        return;
    }

    const maxQ = topProduits[0]?.quantiteVendue || 1;

    container.innerHTML = topProduits.map((p, i) => {
        const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        const pct = (p.quantiteVendue / maxQ) * 100;
        return `
            <div class="top-product-item">
                <div class="rank ${rankClass}">${i + 1}</div>
                <div class="info">
                    <div class="name">${p.nom}</div>
                    <div class="stats">${p.quantiteVendue} vendus · ${formatPrice(p.totalVentes)}</div>
                </div>
                <div class="bar-container"><div class="bar" style="width: ${pct}%;"></div></div>
                <div class="total">${p.quantiteVendue}</div>
            </div>`;
    }).join('');
}

// ===== 4. VENTES RÉCENTES =====
function updateRecentSales(ventesRecentes) {
    const tbody = document.getElementById('recentSalesBody');
    if (!tbody) return;

    if (!ventesRecentes || ventesRecentes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: #b2bec3;">
                    Aucune vente récente
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = ventesRecentes.map(v => `
        <tr>
            <td><strong>#${v.id}</strong></td>
            <td>${v.clientNom} ${v.clientPrenom}</td>
            <td><strong>${formatPrice(v.total)}</strong></td>
            <td><span class="status-badge ${getStatusClass(v.statut)}">${getStatusIcon(v.statut)} ${v.statut}</span></td>
        </tr>`).join('');
}

// ===== 5. ALERTES STOCK =====
function updateLowStock(stats) {
    const container = document.getElementById('lowStockList');
    if (!container) return;

    const nb = stats.stockFaible || 0;

    if (nb === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">✅</div>
                <div class="text">Tous les produits sont bien stockés</div>
            </div>`;
        return;
    }

    if (stats.produitsStockFaible && stats.produitsStockFaible.length > 0) {
        container.innerHTML = stats.produitsStockFaible.map(p => {
            let status, label, dot;
            if (p.quantiteStock === 0) { status = label = 'critical'; dot = 'critical'; label = 'Rupture'; }
            else if (p.quantiteStock <= 2) { status = dot = 'critical'; label = 'Critique'; }
            else { status = dot = 'warning'; label = 'Faible'; }

            return `
                <div class="low-stock-item">
                    <div class="product-info">
                        <div class="name">${p.nom}</div>
                        <div class="ref">${p.reference || ''}</div>
                    </div>
                    <div class="stock-status">
                        <span class="quantity">${p.quantiteStock}</span>
                        <span class="status-dot ${dot}"></span>
                        <span class="status-label ${status}">${label}</span>
                    </div>
                </div>`;
        }).join('');
        return;
    }

    container.innerHTML = `
        <div class="low-stock-item">
            <div class="product-info">
                <div class="name">⚠️ ${nb} produit(s) en stock faible</div>
                <div class="ref">Consultez la page Produits</div>
            </div>
            <div class="stock-status">
                <span class="quantity">${nb}</span>
                <span class="status-dot warning"></span>
                <span class="status-label warning">À surveiller</span>
            </div>
        </div>`;
}

// ===== 6. PÉRIODES =====
function setupPeriodButtons() {
    const buttons = document.querySelectorAll('.chart-period button');
    if (!buttons.length) return;
    buttons.forEach(btn => {
        btn.onclick = function () {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        };
    });
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function () {
    loadDashboard();
});

console.log('✅ Dashboard Admin chargé');