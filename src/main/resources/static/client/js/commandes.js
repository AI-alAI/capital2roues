// ======================================================
// commandes.js
// Capital 2 Roues
// ======================================================

const API_BASE = '/api';

const LANG_KEY = 'preferredLanguage';

let currentLang =
    localStorage.getItem(LANG_KEY) || 'fr';


// ======================================================
// TRADUCTIONS
// ======================================================

const translations = {

    fr: {

        'nav.home': '🏠 Accueil',
        'nav.catalogue': '📦 Catalogue',
        'nav.cart': '🛒 Panier',
        'nav.orders': '📋 Commandes',
        'nav.profile': '👤 Profil',
        'nav.login': '🔐 Connexion',
        'nav.logout': '🚪 Déconnexion',
        'nav.register': "S'inscrire",

        'commandes.title': '📋 Mes Commandes',
        'commandes.subtitle':
            'Suivez l’état de vos commandes',

        'commandes.empty':
            '📭 Aucune commande',

        'commandes.emptyHint':
            "Vous n'avez pas encore passé de commande",

        'commandes.viewCatalogue':
            '📦 Voir le catalogue',

        'commandes.detail':
            '📄 Voir détail',

        'commandes.delete':
            '🗑️ Supprimer',

        'commandes.client':
            'Client',

        'commandes.products':
            'Produits',

        'commandes.total':
            'Total',

        'commandes.status.PAYEE':
            '✅ Payée',

        'commandes.status.EN_ATTENTE':
            '⏳ En attente',

        'commandes.status.CONFIRMEE':
            '✅ Confirmée',

        'commandes.status.LIVREE':
            '📦 Livrée',

        'commandes.status.ANNULEE':
            '❌ Annulée'
    },


    en: {

        'nav.home': '🏠 Home',
        'nav.catalogue': '📦 Catalogue',
        'nav.cart': '🛒 Cart',
        'nav.orders': '📋 Orders',
        'nav.profile': '👤 Profile',
        'nav.login': '🔐 Login',
        'nav.logout': '🚪 Logout',
        'nav.register': 'Sign up',

        'commandes.title':
            '📋 My Orders',

        'commandes.subtitle':
            'Track your orders status',

        'commandes.empty':
            '📭 No orders',

        'commandes.emptyHint':
            "You haven't placed any orders yet",

        'commandes.viewCatalogue':
            '📦 View catalogue',

        'commandes.detail':
            '📄 View details',

        'commandes.delete':
            '🗑️ Delete',

        'commandes.client':
            'Client',

        'commandes.products':
            'Products',

        'commandes.total':
            'Total',

        'commandes.status.PAYEE':
            '✅ Paid',

        'commandes.status.EN_ATTENTE':
            '⏳ Pending',

        'commandes.status.CONFIRMEE':
            '✅ Confirmed',

        'commandes.status.LIVREE':
            '📦 Delivered',

        'commandes.status.ANNULEE':
            '❌ Cancelled'
    },


    ar: {

        'nav.home': '🏠 الرئيسية',
        'nav.catalogue': '📦 الكتالوج',
        'nav.cart': '🛒 السلة',
        'nav.orders': '📋 الطلبات',
        'nav.profile': '👤 الملف الشخصي',
        'nav.login': '🔐 تسجيل الدخول',
        'nav.logout': '🚪 تسجيل الخروج',
        'nav.register': 'إنشاء حساب',

        'commandes.title':
            '📋 طلباتي',

        'commandes.subtitle':
            'تابع حالة طلباتك',

        'commandes.empty':
            '📭 لا توجد طلبات',

        'commandes.emptyHint':
            'لم تقم بتقديم أي طلب بعد',

        'commandes.viewCatalogue':
            '📦 عرض الكتالوج',

        'commandes.detail':
            '📄 عرض التفاصيل',

        'commandes.delete':
            '🗑️ حذف',

        'commandes.client':
            'العميل',

        'commandes.products':
            'المنتجات',

        'commandes.total':
            'المجموع',

        'commandes.status.PAYEE':
            '✅ مدفوعة',

        'commandes.status.EN_ATTENTE':
            '⏳ قيد الانتظار',

        'commandes.status.CONFIRMEE':
            '✅ مؤكدة',

        'commandes.status.LIVREE':
            '📦 تم التوصيل',

        'commandes.status.ANNULEE':
            '❌ ملغاة'
    }
};


// ======================================================
// TRANSLATION
// ======================================================

function t(key) {

    return translations[currentLang]?.[key]
        || key;
}


function applyTranslations() {

    document
        .querySelectorAll('[data-i18n]')
        .forEach(element => {

            const key =
                element.getAttribute('data-i18n');

            const translation = t(key);

            if (element.tagName === 'BUTTON') {

                element.innerHTML =
                    translation;

            } else {

                element.textContent =
                    translation;
            }
        });
}


// ======================================================
// LANGUAGE
// ======================================================

function switchLanguage(lang) {

    currentLang = lang;

    localStorage.setItem(
        LANG_KEY,
        lang
    );

    document.body.style.direction =
        lang === 'ar'
            ? 'rtl'
            : 'ltr';

    document.body.style.textAlign =
        lang === 'ar'
            ? 'right'
            : 'left';

    const selector =
        document.getElementById(
            'languageSelector'
        );

    if (selector) {
        selector.value = lang;
    }

    applyTranslations();

    chargerCommandes();
}


// ======================================================
// NAVBAR
// ======================================================

function updateNavbar() {

    const userInfo =
        document.getElementById(
            'userInfo'
        );

    if (!userInfo) return;


    const isLoggedIn =
        localStorage.getItem(
            'clientLoggedIn'
        ) === 'true';


    if (isLoggedIn) {

        const prenom =
            localStorage.getItem(
                'clientPrenom'
            ) || 'Client';

        const nom =
            localStorage.getItem(
                'clientNom'
            ) || '';

        const initial =
            prenom
                .charAt(0)
                .toUpperCase();


        userInfo.innerHTML = `

            <span class="user-avatar-small">
                ${initial}
            </span>

            <span class="user-name-nav">
                ${prenom} ${nom}
            </span>

            <button
                class="btn-logout"
                onclick="logoutClient()"
            >
                🚪 Déconnexion
            </button>

        `;

    } else {

        userInfo.innerHTML = `

            <a href="login.html">
                <button class="btn-login">
                    🔐 Connexion
                </button>
            </a>

            <a href="register.html">
                <button
                    class="btn-login"
                    style="
                        background:#e94560;
                        color:#fff;
                        border-color:#e94560;
                    "
                >
                    S'inscrire
                </button>
            </a>

        `;
    }
}


function logoutClient() {

    localStorage.removeItem('clientId');
    localStorage.removeItem('clientEmail');
    localStorage.removeItem('clientNom');
    localStorage.removeItem('clientPrenom');
    localStorage.removeItem('clientRole');
    localStorage.removeItem('clientLoggedIn');

    window.location.href =
        'index.html';
}


// ======================================================
// PANIER COUNT
// ======================================================

function updatePanierCount() {

    const panier =
        JSON.parse(
            localStorage.getItem('panier')
        ) || [];


    const total =
        panier.reduce(
            (sum, produit) =>
                sum +
                Number(produit.quantite || 0),
            0
        );


    const badge =
        document.getElementById(
            'panierCount'
        );


    if (badge) {

        badge.textContent =
            total;
    }
}


// ======================================================
// FORMAT PRICE
// ======================================================

function formatPrice(price) {

    return Number(price || 0)
        .toLocaleString(
            'fr-FR',
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );
}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(dateString) {

    if (!dateString) {
        return 'Date inconnue';
    }


    const date =
        new Date(dateString);


    if (isNaN(date.getTime())) {

        return dateString;
    }


    return date.toLocaleString(
        currentLang === 'fr'
            ? 'fr-FR'
            : currentLang === 'ar'
                ? 'ar-MA'
                : 'en-US',
        {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }
    );
}


// ======================================================
// STATUS
// ======================================================

function getStatusClass(statut) {

    switch (statut) {

        case 'PAYEE':
            return 'status-confirmee';

        case 'CONFIRMEE':
            return 'status-confirmee';

        case 'LIVREE':
            return 'status-livree';

        case 'ANNULEE':
            return 'status-annulee';

        case 'EN_ATTENTE':
            return 'status-attente';

        default:
            return 'status-attente';
    }
}


function getStatusText(statut) {

    return t(
        `commandes.status.${statut}`
    ) || statut;
}


// ======================================================
// CHARGER COMMANDES
// ======================================================

async function chargerCommandes() {

    const container =
        document.getElementById(
            'commandesContent'
        );


    if (!container) return;


    // --------------------------------------------------
    // Vérifier connexion
    // --------------------------------------------------

    const isLoggedIn =
        localStorage.getItem(
            'clientLoggedIn'
        ) === 'true';


    if (!isLoggedIn) {

        container.innerHTML = `

            <div class="aucune-commande">

                <div class="icon">
                    🔐
                </div>

                <h2>
                    Connectez-vous pour voir
                    vos commandes
                </h2>

                <p>
                    Vous devez être connecté
                    pour accéder à vos commandes
                </p>

                <a
                    href="login.html"
                    class="btn-catalogue"
                >
                    🔐 Se connecter
                </a>

            </div>

        `;

        return;
    }


    // --------------------------------------------------
    // Récupérer client ID
    // --------------------------------------------------

    const clientId =
        localStorage.getItem(
            'clientId'
        );


    if (!clientId) {

        container.innerHTML = `

            <div class="aucune-commande">

                <div class="icon">
                    ⚠️
                </div>

                <h2>
                    Client introuvable
                </h2>

                <p>
                    Impossible de récupérer
                    votre identifiant client.
                </p>

            </div>

        `;

        return;
    }


    // --------------------------------------------------
    // Loading
    // --------------------------------------------------

    container.innerHTML = `

        <div class="aucune-commande">

            <div class="icon">
                ⏳
            </div>

            <h2>
                Chargement...
            </h2>

        </div>

    `;


    try {

        console.log(
            '📡 Chargement commandes...'
        );

        console.log(
            '👤 Client ID:',
            clientId
        );


        // ------------------------------------------------
        // Appel API
        // ------------------------------------------------

        const response =
            await fetch(
                `${API_BASE}/ventes?size=100`
            );


        console.log(
            'HTTP:',
            response.status
        );


        if (!response.ok) {

            throw new Error(
                `Erreur HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        console.log(
            '📦 Données API:',
            data
        );


        // ------------------------------------------------
        // Récupérer content
        // ------------------------------------------------

        let commandes =
            Array.isArray(data)
                ? data
                : data.content || [];


        // ------------------------------------------------
        // Filtrer par client
        // ------------------------------------------------

        commandes =
            commandes.filter(
                commande =>
                    Number(
                        commande.clientId
                    ) === Number(clientId)
            );


        console.log(
            '📋 Commandes du client:',
            commandes
        );


        // ------------------------------------------------
        // Aucune commande
        // ------------------------------------------------

        if (commandes.length === 0) {

            container.innerHTML = `

                <div class="aucune-commande">

                    <div class="icon">
                        📭
                    </div>

                    <h2>
                        ${t('commandes.empty')}
                    </h2>

                    <p>
                        ${t('commandes.emptyHint')}
                    </p>

                    <a
                        href="catalogue.html"
                        class="btn-catalogue"
                    >
                        ${t('commandes.viewCatalogue')}
                    </a>

                </div>

            `;

            return;
        }


        // ------------------------------------------------
        // Trier par date
        // ------------------------------------------------

        commandes.sort(
            (a, b) =>
                new Date(b.dateVente)
                -
                new Date(a.dateVente)
        );


        // ------------------------------------------------
        // Générer HTML
        // ------------------------------------------------

        let html = '';


        commandes.forEach(
            commande => {

                const statut =
                    commande.statut
                    || 'EN_ATTENTE';


                const statusClass =
                    getStatusClass(
                        statut
                    );


                const statusText =
                    getStatusText(
                        statut
                    );


                const lignes =
                    commande.lignes
                    || [];


                const totalArticles =
                    lignes.reduce(
                        (sum, ligne) =>
                            sum +
                            Number(
                                ligne.quantite || 0
                            ),
                        0
                    );


                html += `

                    <div
                        class="commande-card"
                    >

                        <!-- HEADER -->

                        <div
                            class="commande-header"
                        >

                            <div>

                                <span
                                    class="commande-id"
                                >
                                    #${commande.id}
                                </span>

                                <span
                                    class="commande-date"
                                >
                                    📅
                                    ${formatDate(
                                        commande.dateVente
                                    )}
                                </span>

                            </div>


                            <span
                                class="status-badge
                                ${statusClass}"
                            >
                                ${statusText}
                            </span>


                            <span
                                class="commande-total"
                            >
                                ${formatPrice(
                                    commande.total
                                )}
                                DH
                            </span>

                        </div>


                        <!-- BODY -->

                        <div
                            class="commande-body"
                        >

                            <div
                                class="commande-produits"
                            >

                                ${
                                    lignes.length > 0

                                    ?

                                    lignes.map(
                                        ligne => `

                                            <div
                                                class="
                                                commande-produit
                                                "
                                            >

                                                <span
                                                    class="
                                                    produit-nom
                                                    "
                                                >
                                                    🏍️
                                                    ${ligne.produitNom}
                                                </span>


                                                <span
                                                    class="
                                                    produit-quantite
                                                    "
                                                >
                                                    x
                                                    ${ligne.quantite}
                                                </span>


                                                <span
                                                    class="
                                                    produit-prix
                                                    "
                                                >
                                                    ${formatPrice(
                                                        ligne.totalLigne
                                                    )}
                                                    DH
                                                </span>

                                            </div>

                                        `
                                    ).join('')

                                    :

                                    `
                                    <p
                                        style="
                                        color:#636e72;
                                        "
                                    >
                                        Aucun article
                                    </p>
                                    `
                                }

                            </div>


                            <!-- TOTAL ARTICLES -->

                            <div
                                style="
                                display:flex;
                                justify-content:
                                space-between;
                                font-size:14px;
                                color:#636e72;
                                margin-top:5px;
                                "
                            >

                                <span>
                                    ${totalArticles}
                                    article(s)
                                </span>

                            </div>


                            <!-- FOOTER -->

                            <div
                                class="commande-footer"
                            >

                                <button
                                    class="
                                    btn-detail
                                    "
                                    onclick="
                                    voirDetailCommande(
                                        ${commande.id}
                                    )
                                    "
                                >
                                    📄 Voir détail
                                </button>

                            </div>

                        </div>

                    </div>

                `;
            }
        );


        container.innerHTML =
            html;


    } catch (error) {

        console.error(
            '❌ Erreur commandes:',
            error
        );


        container.innerHTML = `

            <div class="aucune-commande">

                <div class="icon">
                    ❌
                </div>

                <h2>
                    Erreur de chargement
                </h2>

                <p>
                    ${error.message}
                </p>

                <button
                    class="btn-catalogue"
                    onclick="chargerCommandes()"
                >
                    🔄 Réessayer
                </button>

            </div>

        `;
    }
}


// ======================================================
// DETAIL COMMANDE
// ======================================================

async function voirDetailCommande(id) {

    try {

        const response =
            await fetch(
                `${API_BASE}/ventes/${id}`
            );


        if (!response.ok) {

            throw new Error(
                `Erreur HTTP ${response.status}`
            );
        }


        const commande =
            await response.json();


        const lignes =
            commande.lignes || [];


        let articles =
            lignes.length > 0

            ?

            lignes.map(
                ligne =>
                    `• ${ligne.produitNom}`
                    + ` × ${ligne.quantite}`
                    + ` = ${formatPrice(
                        ligne.totalLigne
                    )} DH`
            ).join('\n')

            :

            'Aucun article';


        alert(

            `📋 Commande #${commande.id}\n\n`

            + `👤 Client : `
            + `${commande.clientPrenom || ''} `
            + `${commande.clientNom || ''}\n\n`

            + `📅 Date : `
            + `${formatDate(
                commande.dateVente
            )}\n\n`

            + `📦 Statut : `
            + `${commande.statut}\n\n`

            + `🛒 Articles :\n`
            + `${articles}\n\n`

            + `💰 Total : `
            + `${formatPrice(
                commande.total
            )} DH`

        );


    } catch (error) {

        console.error(
            error
        );

        alert(
            '❌ Impossible de charger le détail.'
        );
    }
}


// ======================================================
// INITIALISATION
// ======================================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

        console.log(
            '🚀 commandes.js chargé'
        );


        const selector =
            document.getElementById(
                'languageSelector'
            );


        if (selector) {

            selector.value =
                currentLang;


            selector.addEventListener(
                'change',
                function () {

                    switchLanguage(
                        this.value
                    );

                }
            );
        }


        if (currentLang === 'ar') {

            document.body.style.direction =
                'rtl';

            document.body.style.textAlign =
                'right';
        }


        updateNavbar();

        updatePanierCount();

        applyTranslations();

        chargerCommandes();
    }
);


// ======================================================
// GLOBAL
// ======================================================

window.switchLanguage =
    switchLanguage;

window.logoutClient =
    logoutClient;

window.chargerCommandes =
    chargerCommandes;

window.voirDetailCommande =
    voirDetailCommande;