import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Gestion du campus
    selectedCampusId: null as number | null,
    // Gestion de l'utilisateur
    user: null as any | null,
    token: null as string | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    // Actions Campus
    setCampusId(id: number) {
      this.selectedCampusId = id
    },
    clearCampusId() {
      this.selectedCampusId = null
    },

    // Actions Authentification
    setUser(userData: any) {
      this.user = userData
    },
    setToken(token: string) {
      this.token = token
    },

    // Pratique : centralise la mise à jour après une connexion réussie
    login(token: string, user?: any) {
      this.token = token
      if (user) this.user = user
    },

    logout() {
      this.user = null
      this.token = null
      this.selectedCampusId = null
    }
  },

  // Persistance automatique dans localStorage (clé par défaut : "auth")
  // -> token, user et selectedCampusId survivent au rafraîchissement de page.
  persist: true,
})