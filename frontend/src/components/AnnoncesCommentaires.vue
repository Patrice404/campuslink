<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const props = defineProps<{
  annonceId: any
  annonceType: string
}>()

const emit = defineEmits(['comment-added'])
const authStore = useAuthStore()
const router = useRouter()
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const commentaires = ref<any[]>([])
const nouveauCommentaire = ref('')
const isLoading = ref(false)
const isSubmitting = ref(false)

// Message de modération affiché en bandeau (même style que AnnonceFeedLayout), remplace le popup navigateur
const moderationMessage = ref('')

// Confirmation de suppression in-app (remplace le confirm() navigateur)
const commentToDelete = ref<string | null>(null)
const isDeleting = ref(false)

// Construit l'URL d'une photo de profil : URL absolue (Azure) telle quelle, sinon préfixe l'API, sinon avatar par défaut.
const photoUrl = (auteur: any): string => {
  const p = auteur?.photoProfil
  if (!p) return 'https://www.gravatar.com/avatar/?d=mp'
  return p.startsWith('http') ? p : `${apiUrl}${p}`
}

// États des réponses, de la modification et de la soumission de mise à jour
const replyingTo = ref<string | null>(null)
const reponseTexte = ref('')
const isSubmittingReply = ref(false)

const editingCommentId = ref<string | null>(null)
const texteEdition = ref('')
const isSubmittingEdit = ref(false)

// --- SYSTÈME DE SUGGESTIONS DE MENTIONS ---
const suggestions = ref<any[]>([])
const showSuggestions = ref(false)
const inputTarget = ref<'racine' | 'reponse' | 'edition'>('racine')

const gererFrappeMention = async (texte: string, cible: 'racine' | 'reponse' | 'edition') => {
  inputTarget.value = cible
  const match = texte.match(/@([a-zA-Z0-9]*)$/)
  if (match) {
    const query = match[1]
    try {
      const token = authStore.token
      const response = await fetch(`${apiUrl}/api/utilisateurs/recherche-mentions?q=${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      if (response.ok) {
        suggestions.value = await response.json()
        showSuggestions.value = suggestions.value.length > 0
      }
    } catch (err) {
      console.error("Erreur suggestions:", err)
    }
  } else {
    showSuggestions.value = false
    suggestions.value = []
  }
}

const injecterMention = (user: any) => {
  if (inputTarget.value === 'racine') {
    nouveauCommentaire.value = nouveauCommentaire.value.replace(/@[a-zA-Z0-9]*$/, `@${user.username} `)
  } else if (inputTarget.value === 'reponse') {
    reponseTexte.value = reponseTexte.value.replace(/@[a-zA-Z0-9]*$/, `@${user.username} `)
  } else if (inputTarget.value === 'edition') {
    texteEdition.value = texteEdition.value.replace(/@[a-zA-Z0-9]*$/, `@${user.username} `)
  }
  showSuggestions.value = false
  suggestions.value = []
}

const typePrisma = () => {
  const map: Record<string, string> = {
    AnnonceExercice: 'EXERCICE', AnnonceBonPlan: 'BON_PLAN',
    AnnonceTutorat: 'TUTORAT', AnnonceProjet: 'PROJET',
  }
  return map[props.annonceType] || props.annonceType
}

const formaterAuteur = (c: any) => ({
  ...c,
  auteur: c.utilisateur || c.auteur || {
    id: c.id_utilisateur?.toString() || '',
    prenom: authStore.user?.prenom || 'Utilisateur',
    nom: authStore.user?.nom || 'Inconnu',
  },
})

const formaterCommentaire = (com: any) => ({
  ...formaterAuteur(com),
  reponses: (com.reponses || []).map(formaterAuteur)
})

const chargerCommentaires = async () => {
  isLoading.value = true
  try {
    const response = await fetch(`${apiUrl}/api/annonces/${props.annonceId}/commentaires?type=${typePrisma()}`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (response.ok) {
      const raw = await response.json()
      commentaires.value = raw.map(formaterCommentaire)
    }
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

const ajouterCommentaire = async () => {
  if (!nouveauCommentaire.value.trim() || isSubmitting.value) return
  isSubmitting.value = true
  try {
    const response = await fetch(`${apiUrl}/api/commentaires`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        texte: nouveauCommentaire.value,
        type: typePrisma(),
        id_annonce: props.annonceId
      })
    })
    if (response.ok) {
      nouveauCommentaire.value = ''
      await chargerCommentaires()
      emit('comment-added')
      router.go(0)
    } else {
      const err = await response.json().catch(() => ({}))
      moderationMessage.value = err.message || "Votre commentaire n'a pas pu être publié."
    }
  } catch (err) {
    console.error(err)
  } finally {
    isSubmitting.value = false
  }
}

const ajouterReponse = async (parentCommentId: string) => {
  if (!reponseTexte.value.trim() || isSubmittingReply.value) return
  isSubmittingReply.value = true
  try {
    const response = await fetch(`${apiUrl}/api/commentaires`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        texte: reponseTexte.value,
        type: typePrisma(),
        id_annonce: props.annonceId,
        id_parent: parentCommentId
      })
    })
    if (response.ok) {
      reponseTexte.value = ''
      replyingTo.value = null
      await chargerCommentaires()
      router.go(0)
    } else {
      const err = await response.json().catch(() => ({}))
      moderationMessage.value = err.message || "Votre réponse n'a pas pu être publiée."
    }
  } catch (err) {
    console.error(err)
  } finally {
    isSubmittingReply.value = false
  }
}

// ⚡️ FONCTION DE MODIFICATION (PUT)
const modifierCommentaire = async (id: string) => {
  if (!texteEdition.value.trim() || isSubmittingEdit.value) return
  isSubmittingEdit.value = true
  try {
    const response = await fetch(`${apiUrl}/api/commentaires/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({ texte: texteEdition.value })
    })
    if (response.ok) {
      editingCommentId.value = null
      texteEdition.value = ''
      await chargerCommentaires()
    }
  } catch (err) {
    console.error(err)
  } finally {
    isSubmittingEdit.value = false
  }
}

// ⚡️ SUPPRESSION (DELETE) — confirmation via modale in-app
const demanderSuppression = (id: string) => {
  commentToDelete.value = id
}

const confirmerSuppression = async () => {
  if (!commentToDelete.value || isDeleting.value) return
  isDeleting.value = true
  try {
    const response = await fetch(`${apiUrl}/api/commentaires/${commentToDelete.value}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    })
    if (response.ok) {
      commentToDelete.value = null
      await chargerCommentaires()
      router.go(0)
    }
  } catch (err) {
    console.error(err)
  } finally {
    isDeleting.value = false
  }
}

// Ouvre l'éditeur pré-rempli
const activerEdition = (com: any) => {
  editingCommentId.value = com.id
  texteEdition.value = com.texte
  replyingTo.value = null
}

onMounted(() => {
  chargerCommentaires()
  window.addEventListener('click', () => { showSuggestions.value = false })
})
</script>

<template>
  <div class="px-6 pt-4 pb-6 border-t border-gray-100 relative">
    <!-- Bandeau de modération (même style que AnnonceFeedLayout) -->
    <div v-if="moderationMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-3 flex items-start justify-between gap-3">
      <span>{{ moderationMessage }}</span>
      <button @click="moderationMessage = ''" class="text-red-400 hover:text-red-600 shrink-0 cursor-pointer font-bold leading-none">✕</button>
    </div>

    <div v-if="isLoading" class="text-center py-4 text-xs text-gray-400 animate-pulse">
      Chargement des commentaires...
    </div>

    <div v-else class="space-y-4 max-h-96 overflow-y-auto pr-1">
      <div v-for="com in commentaires" :key="com.id" class="text-sm">
        <div class="flex items-start gap-2.5">
          <component
            :is="com.auteur.uuid ? 'router-link' : 'span'"
            :to="com.auteur.uuid ? `/profil/${com.auteur.uuid}` : undefined"
            class="shrink-0"
          >
            <img
              :src="photoUrl(com.auteur)"
              class="w-7 h-7 rounded-full object-cover shrink-0 bg-gray-55 hover:ring-2 hover:ring-blue-200 transition"
            />
          </component>
          <div class="flex-1 bg-gray-50 rounded-xl p-2.5 relative">
            <div class="flex justify-between items-baseline mb-0.5">
              <component
                :is="com.auteur.uuid ? 'router-link' : 'span'"
                :to="com.auteur.uuid ? `/profil/${com.auteur.uuid}` : undefined"
                class="font-semibold text-gray-900 text-xs hover:text-blue-600 hover:underline transition"
              >{{ com.auteur.prenom }} {{ com.auteur.nom }}</component>
              <span class="text-[10px] text-gray-400">Récemment</span>
            </div>

            <div v-if="editingCommentId === com.id">
              <form @submit.prevent="modifierCommentaire(com.id)" class="flex flex-col gap-1.5 mt-1" @click.stop>
                <input
                  v-model="texteEdition"
                  @input="gererFrappeMention(texteEdition, 'edition')"
                  type="text"
                  class="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
                <div class="flex gap-2 justify-end">
                  <button type="button" @click="editingCommentId = null" class="text-[10px] text-gray-500 hover:underline cursor-pointer">Annuler</button>
                  <button type="submit" :disabled="isSubmittingEdit" class="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">Enregistrer</button>
                </div>
              </form>
            </div>
            <p v-else class="text-gray-700 text-xs leading-relaxed whitespace-pre-line">{{ com.texte }}</p>
            
            <div v-if="editingCommentId !== com.id" class="flex gap-3 mt-1">
              <button
                @click="replyingTo = replyingTo === com.id ? null : com.id; editingCommentId = null; reponseTexte = ''"
                class="text-[10px] text-blue-600 font-medium hover:underline block cursor-pointer"
              >
                Répondre
              </button>
              
              <template v-if="com.id_utilisateur?.toString() === authStore.user?.id?.toString() || com.auteur.id === authStore.user?.id?.toString()">
                <button @click="activerEdition(com)" class="text-[10px] text-gray-500 font-medium hover:underline block cursor-pointer">
                  Modifier
                </button>
                <button @click="demanderSuppression(com.id)" class="text-[10px] text-red-500 font-medium hover:underline block cursor-pointer">
                  Supprimer
                </button>
              </template>
            </div>
          </div>
        </div>

        <div v-if="com.reponses && com.reponses.length > 0" class="ml-9 mt-2 space-y-3 border-l-2 border-gray-100 pl-3">
          <div v-for="rep in com.reponses" :key="rep.id" class="flex items-start gap-2.5 text-xs">
            <component
              :is="rep.auteur.uuid ? 'router-link' : 'span'"
              :to="rep.auteur.uuid ? `/profil/${rep.auteur.uuid}` : undefined"
              class="shrink-0"
            >
              <img
                :src="photoUrl(rep.auteur)"
                class="w-6 h-6 rounded-full object-cover shrink-0 bg-gray-55 hover:ring-2 hover:ring-blue-200 transition"
              />
            </component>
            <div class="flex-1 bg-gray-50/70 rounded-xl p-2.5">
              <div class="flex justify-between items-baseline mb-0.5">
                <component
                  :is="rep.auteur.uuid ? 'router-link' : 'span'"
                  :to="rep.auteur.uuid ? `/profil/${rep.auteur.uuid}` : undefined"
                  class="font-semibold text-gray-900 text-[11px] hover:text-blue-600 hover:underline transition"
                >{{ rep.auteur.prenom }} {{ rep.auteur.nom }}</component>
                <span class="text-[9px] text-gray-400">Récemment</span>
              </div>

              <div v-if="editingCommentId === rep.id">
                <form @submit.prevent="modifierCommentaire(rep.id)" class="flex flex-col gap-1.5 mt-1" @click.stop>
                  <input
                    v-model="texteEdition"
                    @input="gererFrappeMention(texteEdition, 'edition')"
                    type="text"
                    class="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                  <div class="flex gap-2 justify-end">
                    <button type="button" @click="editingCommentId = null" class="text-[10px] text-gray-500 hover:underline cursor-pointer">Annuler</button>
                    <button type="submit" :disabled="isSubmittingEdit" class="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">Enregistrer</button>
                  </div>
                </form>
              </div>
              <p v-else class="text-gray-700 leading-relaxed whitespace-pre-line">{{ rep.texte }}</p>
              
              <div v-if="editingCommentId !== rep.id && (rep.id_utilisateur?.toString() === authStore.user?.id?.toString() || rep.auteur.id === authStore.user?.id?.toString())" class="flex gap-3 mt-1">
                <button @click="activerEdition(rep)" class="text-[9px] text-gray-500 font-medium hover:underline block cursor-pointer">
                  Modifier
                </button>
                <button @click="demanderSuppression(rep.id)" class="text-[9px] text-red-500 font-medium hover:underline block cursor-pointer">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="replyingTo === com.id" class="ml-9 mt-2 relative">
          <form @submit.prevent="ajouterReponse(com.id)" class="flex gap-2" @click.stop>
            <input
              v-model="reponseTexte"
              @input="gererFrappeMention(reponseTexte, 'reponse')"
              type="text"
              placeholder="Écrire une réponse..."
              class="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
            <button
              type="submit"
              :disabled="isSubmittingReply || !reponseTexte.trim()"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition disabled:opacity-50 cursor-pointer"
            >
              {{ isSubmittingReply ? '...' : 'Répondre' }}
            </button>
          </form>
        </div>
      </div>
    </div>

    <div 
      v-if="showSuggestions" 
      class="absolute left-0 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 w-60 z-50 overflow-hidden divide-y divide-gray-50"
      :class="inputTarget === 'racine' ? 'bottom-12' : ''"
      @click.stop
    >
      <div 
        v-for="user in suggestions" 
        :key="user.id"
        @click="injecterMention(user)"
        class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50 transition duration-100"
      >
        <img
          :src="photoUrl(user)"
          class="w-6 h-6 rounded-full object-cover shrink-0 bg-gray-100"
        />
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold text-gray-800 truncate">{{ user.prenom }} {{ user.nom }}</p>
          <p class="text-[10px] text-blue-600 font-medium truncate">@{{ user.username }}</p>
        </div>
      </div>
    </div>

    <form @submit.prevent="ajouterCommentaire" class="flex gap-2 mt-3 relative" @click.stop>
      <input
        v-model="nouveauCommentaire"
        @input="gererFrappeMention(nouveauCommentaire, 'racine')"
        type="text"
        placeholder="Écrire un commentaire..."
        class="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        required
      />
      <button
        type="submit"
        :disabled="isSubmitting || !nouveauCommentaire.trim()"
        class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-lg text-sm transition disabled:opacity-50 cursor-pointer"
      >
        {{ isSubmitting ? '...' : 'Envoyer' }}
      </button>
    </form>

    <!-- Confirmation de suppression in-app (même style qu'AnnonceCard) -->
    <div v-if="commentToDelete" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="commentToDelete = null"></div>

      <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 relative z-10 animate-in fade-in zoom-in-95 duration-150">
        <h3 class="text-base font-bold text-slate-900 mb-1">Supprimer le commentaire ?</h3>
        <p class="text-slate-500 text-sm mb-6 leading-relaxed">
          Cette action est irréversible. Le commentaire sera définitivement retiré.
        </p>

        <div class="flex gap-3 justify-end">
          <button
            @click="commentToDelete = null"
            class="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition cursor-pointer"
          >
            Annuler
          </button>
          <button
            @click="confirmerSuppression"
            :disabled="isDeleting"
            class="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm shadow-red-200 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {{ isDeleting ? 'Suppression...' : 'Confirmer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>