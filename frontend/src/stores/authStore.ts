import { defineStore } from 'pinia'

// 1. Définition stricte du type Utilisateur
// Note: Les BigInt du backend (id, id_formation) doivent être convertis 
// en string (ou number) par ton backend avant d'être envoyés au frontend !
export interface AuthUser {
  id: string; 
  email: string;
  nom: string;
  prenom: string;
  role: 'ETUDIANT' | 'PROFESSEUR' | 'ADMIN';
  id_formation?: string | null;
  photoProfil : string | null;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    selectedCampusId: null as string | null,
    user: null as AuthUser | null, 
    token: null as string | null,
  }),

  getters: {
    // Vérifie si l'utilisateur a un token
    isAuthenticated: (state) => !!state.token,
    
    // Raccourcis pratiques pour gérer l'affichage ou les routes front
    isProfesseur: (state) => state.user?.role === 'PROFESSEUR',
    isEtudiant: (state) => state.user?.role === 'ETUDIANT',
    
    // Récupère le nom complet proprement
    fullName: (state) => {
      if (!state.user) return '';
      return `${state.user.prenom} ${state.user.nom}`;
    }
  },

  actions: {
    setCampusId(id: Number | string) {
      this.selectedCampusId = id.toString()
    },
    clearCampusId() {
      this.selectedCampusId = null
    },

    // Stocke uniquement les informations vitales de l'utilisateur
    setUser(userData: AuthUser) {
      this.user = {
        id: userData.id,
        email: userData.email,
        nom: userData.nom,
        prenom: userData.prenom,
        role: userData.role,
        id_formation: userData.id_formation,
        photoProfil: userData.photoProfil
      }
    },

    setToken(token: string) {
      this.token = token
    },

    login(token: string, user: AuthUser) {
      this.setToken(token)
      this.setUser(user)
    },

    logout() {
      this.user = null
      this.token = null
      this.selectedCampusId = null
      // Forcer le nettoyage du localStorage ici par précaution
      localStorage.removeItem('auth')
    }
  },

  persist: {
    storage: localStorage,
    paths: ['token', 'user', 'selectedCampusId'],
  },
})