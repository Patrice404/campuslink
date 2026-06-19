<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import BaseButton from '../components/BaseButton.vue'
import { useAuthStore } from '../stores/authStore'

// --- Types ---
interface Departement {
  id: number
  nom: string
}

interface Formation {
  id: number
  nom: string
  niveau: string
}

const authStore = useAuthStore()
const router = useRouter()

// Redirection vers la sélection de campus si aucun campus n'est sélectionné
if (!authStore.selectedCampusId) {
  router.push('/')
}

// --- Variables réactives pour les champs ---
const role = ref('ETUDIANT')
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const showPassword = ref(false)
const showConfirmPassword = ref(false)

// --- Nouvelles variables pour la hiérarchie académique ---
const departements = ref<Departement[]>([])
const formations = ref<Formation[]>([])
const selectedDepartement = ref<number | ''>('')
const selectedFormation = ref<number | ''>('')

// Gestion de l'état d'envoi et des erreurs
const isLoading = ref(false)
const errorMessage = ref('')
const isVerifying = ref(false)
const verificationCode = ref('')

// --- Fonctions de récupération (API) ---

const fetchDepartements = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campus/${authStore.selectedCampusId}/departements`)
    if (!response.ok) throw new Error("Erreur de chargement des départements")
    departements.value = await response.json()
  } catch (err) {
    console.error(err)
    errorMessage.value = "Impossible de charger les départements. Veuillez réessayer."
  }
}

const fetchFormations = async (departementId: number) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/departements/${departementId}/formations`)
    if (!response.ok) throw new Error("Erreur de chargement des formations")
    formations.value = await response.json()
  } catch (err) {
    console.error(err)
    errorMessage.value = "Impossible de charger les formations."
  }
}

// --- Cycle de vie et Réactivité ---

// 1. Au chargement de la page, on récupère les départements du campus sélectionné
onMounted(() => {
  if (authStore.selectedCampusId) {
    fetchDepartements()
  }
})

// 2. Dès que l'utilisateur choisit un département, on met à jour la liste des formations
watch(selectedDepartement, (newVal) => {
  selectedFormation.value = '' // Réinitialise la formation si le département change
  formations.value = [] // Vide la liste précédente
  
  if (newVal !== '') {
    fetchFormations(newVal as number)
  }
})

// --- Soumission du formulaire ---

const handleRegister = async () => {
  errorMessage.value = ''

  if (password.value.length < 8) {
    errorMessage.value = "Le mot de passe doit contenir au moins 8 caractères."
    return
  }
  
  // 1. Validation locale
  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Les mots de passe ne correspondent pas."
    return
  }
  
  if (!selectedFormation.value) {
    errorMessage.value = "Veuillez sélectionner une formation."
    return
  }
  
  isLoading.value = true
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nom: lastName.value,
        prenom: firstName.value,
        email: email.value,
        motDePasse: password.value,
        role: role.value,
        id_formation: selectedFormation.value // Remplace id_campus par id_formation
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erreur lors de l'envoi du code")
    }
    
    isVerifying.value = true // Ouverture de la modale
  } catch (err: any) {
    errorMessage.value = err.message || "Erreur lors de la préparation de l'inscription."
  } finally {
    isLoading.value = false
  }
}

const handleVerifyAndRegister = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-and-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        code: verificationCode.value
      })
    })

    if (!response.ok) throw new Error("Code invalide ou expiré")
    
    router.push('/login')
  } catch (err) {
    errorMessage.value = "Le code est incorrect ou a expiré."
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen">

    <div class="relative hidden md:block flex-1 overflow-hidden bg-gray-900">
      <img
        src="../assets/img/login-image.jpg"
        alt="Campus"
        class="w-full h-full object-cover opacity-90"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      <div class="absolute bottom-10 left-10 right-10 text-white">
        <span class="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-secondary/20 border border-secondary/30 backdrop-blur-md mb-4">
          CampusLink
        </span>
        <h2 class="text-3xl font-bold mb-2">Rejoignez l'aventure</h2>
        <p class="text-gray-200 text-lg leading-relaxed max-w-md">
          Créez votre compte pour commencer à collaborer sur vos projets étudiants.
        </p>
      </div>
    </div>

    <div class="flex flex-1 items-center justify-center bg-gray-50 p-8 overflow-y-auto">
      
      <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100 my-8">

        <div class="text-center mb-2">
          <h1 class="text-3xl font-extrabold text-gray-900">Inscription</h1>
          <p class="mt-2 text-sm text-gray-500">Rejoignez la communauté étudiante</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-4">

          <div class="bg-gray-100 p-1 rounded-lg flex gap-1 mb-2">
            <button
              type="button"
              @click="role = 'ETUDIANT'"
              :class="[
                'flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200',
                role === 'ETUDIANT' ? 'bg-white text-secondary shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'
              ]"
            >
              Je suis Étudiant
            </button>
            <button
              type="button"
              @click="role = 'PROFESSEUR'"
              :class="[
                'flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200',
                role === 'PROFESSEUR' ? 'bg-white text-secondary shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'
              ]"
            >
              Je suis Professeur
            </button>
          </div>

          <div class="flex gap-4">
            <div class="flex-1">
              <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </span>
                <input
                  id="firstName"
                  v-model="firstName"
                  type="text"
                  required
                  placeholder="Jean"
                  class="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all"
                />
              </div>
            </div>

            <div class="flex-1">
              <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </span>
                <input
                  id="lastName"
                  v-model="lastName"
                  type="text"
                  required
                  placeholder="Dupont"
                  class="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div class="flex gap-4">
            <div class="flex-1">
              <label for="departement" class="block text-sm font-medium text-gray-700 mb-1">Département</label>
              <div class="relative">
                <select
                  id="departement"
                  v-model="selectedDepartement"
                  required
                  class="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white appearance-none"
                >
                  <option value="" disabled>Sélectionner...</option>
                  <option v-for="dep in departements" :key="dep.id" :value="dep.id">
                    {{ dep.nom }}
                  </option>
                </select>
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                  </svg>
                </span>
              </div>
            </div>

            <div class="flex-1">
              <label for="formation" class="block text-sm font-medium text-gray-700 mb-1">Formation</label>
              <div class="relative">
                <select
                  id="formation"
                  v-model="selectedFormation"
                  required
                  :disabled="!selectedDepartement"
                  class="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white appearance-none disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="" disabled>Sélectionner...</option>
                  <option v-for="form in formations" :key="form.id" :value="form.id">
                    {{ form.nom }} ({{ form.niveau }})
                  </option>
                </select>
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </span>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                placeholder="etudiant@campus.fr"
                class="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </span>
              
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all"
              />
              
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-secondary transition-colors"
              >
                <svg v-if="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </span>
              
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all"
                :class="{'border-red-500 focus:ring-red-500 focus:border-red-500': password && confirmPassword && password !== confirmPassword}"
              />
              
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-secondary transition-colors"
              >
                <svg v-if="!showConfirmPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
            </div>
            <p v-if="password && confirmPassword && password !== confirmPassword" class="text-xs text-red-500 mt-1">
              Les mots de passe ne correspondent pas.
            </p>
          </div>

          <div v-if="errorMessage" class="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
            {{ errorMessage }}
          </div>

          <BaseButton 
            type="submit" 
            variant="primary" 
            :disabled="isLoading || !selectedFormation" 
            :class="{ 'opacity-50 cursor-not-allowed': isLoading || !selectedFormation }"
          >
            <span v-if="isLoading">Création du compte...</span>
            <span v-else>S'inscrire</span>
          </BaseButton>
        </form>

        <p class="text-center text-sm text-gray-600 mt-6">
          Déjà un compte ?
          <RouterLink to="/login" class="font-bold text-secondary hover:underline">Se connecter</RouterLink>
        </p>

      </div>
    </div>

    <div v-if="isVerifying" class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div class="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
        <h2 class="text-xl font-bold mb-4 text-gray-900">Vérification par email</h2>
        <p class="text-sm text-gray-600 mb-4">Un code a été envoyé à <span class="font-semibold">{{ email }}</span>.</p>
        
        <input 
          v-model="verificationCode" 
          placeholder="Entrez le code à 6 chiffres" 
          class="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition-all text-center tracking-widest font-mono text-lg"
        />
        
        <div v-if="errorMessage && isVerifying" class="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
          {{ errorMessage }}
        </div>

        <BaseButton @click="handleVerifyAndRegister" :disabled="isLoading || !verificationCode">
          <span v-if="isLoading">Validation...</span>
          <span v-else>Valider</span>
        </BaseButton>
      </div>
    </div>
  </div>
</template>