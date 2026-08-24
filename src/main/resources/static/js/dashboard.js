// ============================================
// DASHBOARD ADMIN - JavaScript
// ============================================

const API_BASE = 'http://localhost:8080/api';
let ventesChart = null;
let currentPeriod = 7;

// ===== AUTHENTIFICATION =====
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = '/client/login.html';
}

document.getElementById('userEmail').textContent = localStorage.getItem('email') || 'Admin';

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('email');
    localStorage.removeItem('clientId');
    localStorage.removeItem('clientNom');
    localStorage.removeItem('clientPrenom');
    localStorage.removeItem('clientRole');
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
function formatPrice(price) {
    return price.toLocaleString('fr-FR') + ' DH';
}

function getStatusClass(status) {
    return status.toLowerCase();
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

        // Charger toutes les données
        const [stats, ventes, produits] = await Promise.all([
            apiFetch(`${API_BASE}/statistiques/dashboard`),
            apiFetch(`${API_BASE}/ventes?size=50`),
            apiFetch(`${API_BASE}/produits?size=100`)
        ]);

        console.log('📊 Dashboard data:', { stats, ventes, produits });

        // ===== 1. Mettre à jour les KPI =====
        updateKPI(stats, produits);

        // ===== 2. Mettre à jour le graphique =====
        updateChart(ventes.content || []);

        // ===== 3. Mettre à jour les top produits =====
        updateTopProducts(ventes.content || []);

        // ===== 4. Mettre à jour les ventes récentes =====
        updateRecentSales(ventes.content || []);

        // ===== 5. Mettre à jour les alertes stock =====
        updateLowStock(produits.content || []);

        // ===== 6. Configurer les périodes du graphique =====
        setupPeriodButtons();

        // Afficher le contenu
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

// ===== 1. MISE À JOUR DES KPI =====
function updateKPI(stats, produits) {
    // CA Total
    document.getElementById('caTotal').textContent = formatPrice(stats.chiffreAffairesTotal || 0);

    // Ventes totales
    document.getElementById('nbVentes').textContent = stats.nombreVentes || 0;

    // Produits
    document.getElementById('nbProduits').textContent = stats.nombreProduits || 0;

    // Stock faible
    document.getElementById('stockFaible').textContent = stats.stockFaible || 0;

    // Clients
    document.getElementById('nbClients').textContent = stats.nombreClients || 0;

    // Marge brute (calcul approximatif)
    const ca = stats.chiffreAffairesTotal || 0;
    const marge = ca * 0.25; // 25% de marge estimée
    document.getElementById('margeBrute').textContent = formatPrice(marge);
    document.getElementById('margeChange').textContent = `Taux: 25%`;

    // Variation CA (simulée)
    document.getElementById('caChange').textContent = '+12.5% ↑';
}

// ===== 2. MISE À JOUR DU GRAPHIQUE =====
function updateChart(ventes) {
    const ctx = document.getElementById('ventesChart').getContext('2d');

    // Grouper les ventes par jour
    const ventesParJour = {};
    ventes.forEach(v => {
        const date = new Date(v.dateVente);
        const key = date.toISOString().split('T')[0];
        ventesParJour[key] = (ventesParJour[key] || 0) + v.total;
    });

    // Trier par date
    const sortedDates = Object.keys(ventesParJour).sort();
    const lastDays = sortedDates.slice(-currentPeriod);
    const values = lastDays.map(d => ventesParJour[d]);

    // Si pas assez de données, ajouter des jours vides
    if (lastDays.length < currentPeriod) {
        const today = new Date();
        const labels = [];
        const data = [];
        for (let i = currentPeriod - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            labels.push(key);
            data.push(ventesParJour[key] || 0);
        }

        // Si on a des données, utiliser les dates existantes
        if (lastDays.length > 0) {
            createChart(lastDays, values);
        } else {
            createChart(labels, data);
        }
    } else {
        createChart(lastDays, values);
    }
}

function createChart(labels, data) {
    const ctx = document.getElementById('ventesChart').getContext('2d');

    if (ventesChart) {
        ventesChart.destroy();
    }

    // Si pas de données, afficher un message
    if (data.every(v => v === 0)) {
        ctx.canvas.parentElement.innerHTML = `
            <div class="empty-state" style="padding: 40px 0;">
                <div class="icon">📈</div>
                <div class="text">Aucune donnée de vente pour cette période</div>
            </div>
        `;
        return;
    }

    const colors = ['#e94560', '#ff6b81', '#ff8a9b'];
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(233, 69, 96, 0.2)');
    gradient.addColorStop(1, 'rgba(233, 69, 96, 0.0)');

    ventesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(d => {
                const date = new Date(d);
                return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            }),
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
                pointRadius: 4,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatPrice(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' DH';
                        },
                        maxTicksLimit: 8
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// ===== 3. TOP PRODUITS =====
function updateTopProducts(ventes) {
    const container = document.getElementById('topProductsList');

    // Calculer les ventes par produit
    const produitVentes = {};
    ventes.forEach(v => {
        if (v.lignes) {
            v.lignes.forEach(l => {
                const id = l.produitId;
                if (!produitVentes[id]) {
                    produitVentes[id] = { nom: l.produitNom, quantite: 0, total: 0 };
                }
                produitVentes[id].quantite += l.quantite;
                produitVentes[id].total += l.totalLigne;
            });
        }
    });

    const top = Object.values(produitVentes)
        .sort((a, b) => b.quantite - a.quantite)
        .slice(0, 5);

    if (top.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📊</div>
                <div class="text">Aucune vente enregistrée</div>
            </div>
        `;
        return;
    }

    const maxQuantite = top[0]?.quantite || 1;

    container.innerHTML = top.map((p, index) => {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        const percentage = (p.quantite / maxQuantite) * 100;

        return `
            <div class="top-product-item">
                <div class="rank ${rankClass}">${index + 1}</div>
                <div class="info">
                    <div class="name">${p.nom}</div>
                    <div class="stats">${p.quantite} vendus · ${formatPrice(p.total)}</div>
                </div>
                <div class="bar-container">
                    <div class="bar" style="width: ${percentage}%;"></div>
                </div>
                <div class="total">${p.quantite}</div>
            </div>
        `;
    }).join('');
}

// ===== 4. VENTES RÉCENTES =====
function updateRecentSales(ventes) {
    const tbody = document.getElementById('recentSalesBody');

    const recentes = ventes.slice(-10).reverse();

    if (recentes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: #b2bec3;">
                    Aucune vente récente
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = recentes.map(v => `
        <tr>
            <td><strong>#${v.id}</strong></td>
            <td>${v.clientNom} ${v.clientPrenom}</td>
            <td><strong>${formatPrice(v.total)}</strong></td>
            <td>
                <span class="status-badge ${getStatusClass(v.statut)}">
                    ${getStatusIcon(v.statut)} ${v.statut}
                </span>
            </td>
        </tr>
    `).join('');
}

// ===== 5. ALERTES STOCK =====
function updateLowStock(produits) {
    const container = document.getElementById('lowStockList');

    // Filtrer les produits avec stock faible (< 5)
    const lowStock = produits.filter(p => p.quantiteStock < 5 && p.quantiteStock > 0);
    const outOfStock = produits.filter(p => p.quantiteStock === 0);

    const alerts = [...outOfStock, ...lowStock];

    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">✅</div>
                <div class="text">Tous les produits sont bien stockés</div>
            </div>
        `;
        return;
    }

    container.innerHTML = alerts.map(p => {
        let status, statusLabel, dotClass;
        if (p.quantiteStock === 0) {
            status = 'critical';
            statusLabel = 'Rupture';
            dotClass = 'critical';
        } else if (p.quantiteStock <= 2) {
            status = 'critical';
            statusLabel = 'Critique';
            dotClass = 'critical';
        } else {
            status = 'warning';
            statusLabel = 'Faible';
            dotClass = 'warning';
        }

        return `
            <div class="low-stock-item">
                <div class="product-info">
                    <div class="name">${p.nom}</div>
                    <div class="ref">${p.reference}</div>
                </div>
                <div class="stock-status">
                    <span class="quantity">${p.quantiteStock}</span>
                    <span class="status-dot ${dotClass}"></span>
                    <span class="status-label ${status}">${statusLabel}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ===== 6. PÉRIODES DU GRAPHIQUE =====
function setupPeriodButtons() {
    const buttons = document.querySelectorAll('.chart-period button');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentPeriod = parseInt(this.dataset.period);
            loadDashboard();
        });
    });
}

// ===== 7. RAFRAÎCHISSEMENT AUTOMATIQUE =====
let refreshInterval;

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(loadDashboard, 60000); // 60 secondes
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    startAutoRefresh();

    // Arrêter le rafraîchissement quand la page n'est pas visible
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            clearInterval(refreshInterval);
        } else {
            startAutoRefresh();
        }
    });
});

console.log('✅ Dashboard Admin chargé');