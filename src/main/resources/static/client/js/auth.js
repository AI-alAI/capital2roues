// auth.js - Service d'authentification pour la partie client

const API_BASE = 'http://localhost:8080/api';

/**
 * Connexion de l'utilisateur
 * @param {string} email - Email de l'utilisateur
 * @param {string} motDePasse - Mot de passe
 * @returns {Promise} - Promesse avec les données de l'utilisateur
 */
export async function login(email, motDePasse) {
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                motDePasse: motDePasse
            })
        });

        // Si la réponse n'est pas OK
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur de connexion');
        }

        // Récupérer les données
        const data = await response.json();
        
        // Stocker les informations dans localStorage
        if (data.success && data.user) {
            localStorage.setItem('clientId', data.user.id);
            localStorage.setItem('clientEmail', data.user.email);
            localStorage.setItem('clientNom', data.user.nom);
            localStorage.setItem('clientPrenom', data.user.prenom);
            localStorage.setItem('clientRole', data.user.role);
            localStorage.setItem('clientLoggedIn', 'true');
            localStorage.setItem('clientTelephone', data.user.telephone || '');
            localStorage.setItem('clientAdresse', data.user.adresse || '');
        }

        return data;

    } catch (error) {
        throw new Error(error.message || 'Erreur de connexion au serveur');
    }
}

/**
 * Inscription d'un nouvel utilisateur
 * @param {Object} userData - Données de l'utilisateur
 * @returns {Promise} - Promesse avec les données du compte créé
 */
export async function register(userData) {
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nom: userData.nom,
                prenom: userData.prenom,
                email: userData.email,
                telephone: userData.telephone || '',
                adresse: userData.adresse || '',
                password: userData.password,
                confirmPassword: userData.confirmPassword
            })
        });

        // Si la réponse n'est pas OK
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de l\'inscription');
        }

        const data = await response.json();
        return data;

    } catch (error) {
        throw new Error(error.message || 'Erreur de connexion au serveur');
    }
}

/**
 * Vérifier si un email existe déjà
 * @param {string} email - Email à vérifier
 * @returns {Promise<boolean>} - True si l'email existe
 */
export async function checkEmailExists(email) {
    try {
        const response = await fetch(`${API_BASE}/check-email?email=${encodeURIComponent(email)}`);
        
        if (!response.ok) {
            throw new Error('Erreur lors de la vérification');
        }

        const data = await response.json();
        return data.exists;

    } catch (error) {
        console.error('Erreur checkEmail:', error);
        return false;
    }
}

/**
 * Déconnexion de l'utilisateur
 */
export function logout() {
    localStorage.removeItem('clientId');
    localStorage.removeItem('clientEmail');
    localStorage.removeItem('clientNom');
    localStorage.removeItem('clientPrenom');
    localStorage.removeItem('clientRole');
    localStorage.removeItem('clientLoggedIn');
    localStorage.removeItem('clientTelephone');
    localStorage.removeItem('clientAdresse');
    
    // Rediriger vers la page de connexion
    window.location.href = 'login.html';
}

/**
 * Vérifier si l'utilisateur est connecté
 * @returns {boolean} - True si connecté
 */
export function isLoggedIn() {
    return localStorage.getItem('clientLoggedIn') === 'true';
}

/**
 * Récupérer les informations de l'utilisateur connecté
 * @returns {Object} - Données de l'utilisateur
 */
export function getCurrentUser() {
    return {
        id: localStorage.getItem('clientId'),
        email: localStorage.getItem('clientEmail'),
        nom: localStorage.getItem('clientNom'),
        prenom: localStorage.getItem('clientPrenom'),
        role: localStorage.getItem('clientRole'),
        telephone: localStorage.getItem('clientTelephone'),
        adresse: localStorage.getItem('clientAdresse'),
        isLoggedIn: isLoggedIn()
    };
}

/**
 * Rediriger vers la page de connexion si non connecté
 */
export function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/**
 * Vérifier si l'utilisateur a le rôle requis
 * @param {string} requiredRole - Rôle requis (ex: 'CLIENT')
 * @returns {boolean} - True si l'utilisateur a le rôle
 */
export function hasRole(requiredRole) {
    const role = localStorage.getItem('clientRole');
    return role === requiredRole;
}