// ============================================
// Système de traduction i18n (FR/EN/AR)
// ============================================

const i18n = {
    currentLang: 'fr',
    translations: {},
    rtlLanguages: ['ar'],
    
    // Initialiser
    async init() {
        const savedLang = localStorage.getItem('preferredLanguage');
        this.currentLang = savedLang || 'fr';
        
        await this.loadTranslations();
        this.applyTranslations();
        this.updateLanguageSelector();
        this.applyDirection();
    },
    
    // Charger les traductions
    async loadTranslations() {
        try {
            const response = await fetch(`/client/js/translations/${this.currentLang}.json`);
            if (!response.ok) throw new Error('Translation file not found');
            this.translations = await response.json();
            console.log('✅ Traductions chargées:', this.currentLang);
        } catch (error) {
            console.error('❌ Erreur chargement traductions:', error);
            // Fallback: utiliser les traductions françaises
            const fallbackResponse = await fetch('/client/js/translations/fr.json');
            this.translations = await fallbackResponse.json();
        }
    },
    
    // Traduire une clé
    t(key) {
        const keys = key.split('.');
        let value = this.translations;
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                console.warn(`⚠️ Traduction manquante: ${key}`);
                return key;
            }
        }
        return value || key;
    },
    
    // Changer la langue
    async changeLanguage(lang) {
        if (lang === this.currentLang) return;
        
        this.currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);
        
        await this.loadTranslations();
        this.applyTranslations();
        this.updateLanguageSelector();
        this.applyDirection();
        
        // Déclencher un événement pour recharger les données
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
        
        // Recharger les produits si on est sur catalogue
        if (typeof loadProducts === 'function') {
            loadProducts();
        }
    },
    
    // Appliquer les traductions à la page
    applyTranslations() {
        // Traduire les éléments avec data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            if (el.tagName === 'INPUT' && el.type !== 'submit') {
                el.placeholder = translation;
            } else if (el.tagName === 'INPUT' && el.type === 'submit') {
                el.value = translation;
            } else if (el.tagName === 'BUTTON' && el.type === 'submit') {
                el.textContent = translation;
            } else {
                el.textContent = translation;
            }
        });
        
        // Traduire les placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
        });
        
        // Traduire les titres
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = this.t(el.getAttribute('data-i18n-title'));
        });
        
        // Traduire les valeurs
        document.querySelectorAll('[data-i18n-value]').forEach(el => {
            el.value = this.t(el.getAttribute('data-i18n-value'));
        });
    },
    
    // Appliquer la direction (RTL pour Arabe)
    applyDirection() {
        const isRTL = this.rtlLanguages.includes(this.currentLang);
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = this.currentLang;
        
        // Ajouter/retirer la classe RTL
        document.body.classList.toggle('rtl', isRTL);
        
        // Ajuster les marges pour RTL
        if (isRTL) {
            document.body.style.textAlign = 'right';
        } else {
            document.body.style.textAlign = '';
        }
    },
    
    // Mettre à jour le sélecteur de langue
    updateLanguageSelector() {
        const selector = document.getElementById('languageSelector');
        if (selector) {
            selector.value = this.currentLang;
        }
        
        const langBtn = document.getElementById('langBtn');
        if (langBtn) {
            const flags = { fr: '🇫🇷', en: '🇬🇧', ar: '🇸🇦' };
            langBtn.textContent = flags[this.currentLang] || '🌐';
        }
    },
    
    // Récupérer la langue courante
    getLang() {
        return this.currentLang;
    }
};

// Exposer pour utilisation globale
window.i18n = i18n;

// Charger automatiquement au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
});

// Fonction globale pour changer la langue
window.changeLanguage = function(lang) {
    i18n.changeLanguage(lang);
};

// Fonction globale pour traduire
window.t = function(key) {
    return i18n.t(key);
};