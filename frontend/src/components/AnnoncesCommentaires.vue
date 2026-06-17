<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'

const props = defineProps<{
  annonceId: any
  annonceType: string
}>()

const emit = defineEmits(['comment-added'])
const authStore = useAuthStore()
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const commentaires = ref<any[]>([])
const nouveauCommentaire = ref('')
const isLoading = ref(false)
const isSubmitting = ref(false)

// État des réponses
const replyingTo = ref<string | null>(null)
const reponseTexte = ref('')
const isSubmittingReply = ref(false)

// Convertit le type visuel en enum Prisma
const typePrisma = () => {
  const map: Record<string, string> = {
    AnnonceExercice: 'EXERCICE', AnnonceBonPlan: 'BON_PLAN',
    AnnonceTutorat: 'TUTORAT', AnnonceProjet: 'PROJET',
  }
  return map[props.annonceType] || props.annonceType
}

// Garantit la présence d'un objet `auteur` exploitable
const formaterAuteur = (c: any) => ({
  ...c,
  auteur: c.utilisateur || c.auteur || {
    prenom: authStore.user?.prenom || 'Utilisateur',
    nom: authStore.user?.nom || 'Inconnu',
  },
})

// Formate un commentaire racine + ses réponses
const formaterCommentaire = (com: any) => ({
  ...formaterAuteur(com),
  reponses: Array.isArray(com.reponses) ? com.reponses.map(formaterAuteur) : [],
})

// 1. Récupération : GET /api/annonces/:id/commentaires
const fetchCommentaires = async () => {
  isLoading.value = true
  try {
    const response = await fetch(
      `${apiUrl}/api/annonces/${String(props.annonceId)}/commentaires?type=${typePrisma()}`,
      { headers: { ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}) } }
    )
    if (response.ok) {
      const rawData = await response.json()
      commentaires.value = Array.isArray(rawData) ? rawData.map(formaterCommentaire) : []
    }
  } catch (error) {
    console.error('Erreur chargement commentaires:', error)
  } finally {
    isLoading.value = false
  }
}

// 2. Envoi d'un commentaire racine : POST /api/commentaires
const ajouterCommentaire = async () => {
  if (!nouveauCommentaire.value.trim() || isSubmitting.value) return
  isSubmitting.value = true
  try {
    const response = await fetch(`${apiUrl}/api/commentaires`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authStore.token}` },
      body: JSON.stringify({
        texte: nouveauCommentaire.value.trim(),
        id_annonce: String(props.annonceId),
        type: typePrisma(),
      }),
    })
    if (response.ok) {
      const raw = await response.json()
      commentaires.value.unshift(formaterCommentaire(raw))
      nouveauCommentaire.value = ''
      emit('comment-added')
    } else {
      const errData = await response.json()
      alert(errData.message || "Erreur lors de l'envoi du commentaire.")
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire:", error)
  } finally {
    isSubmitting.value = false
  }
}

// 3. Ouvrir / fermer le champ de réponse d'un commentaire
const ouvrirReponse = (comId: string) => {
  replyingTo.value = replyingTo.value === comId ? null : comId
  reponseTexte.value = ''
}

// 4. Envoi d'une réponse : POST /api/commentaires avec id_parent
const envoyerReponse = async (com: any) => {
  if (!reponseTexte.value.trim() || isSubmittingReply.value) return
  isSubmittingReply.value = true
  try {
    const response = await fetch(`${apiUrl}/api/commentaires`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authStore.token}` },
      body: JSON.stringify({
        texte: reponseTexte.value.trim(),
        id_annonce: String(props.annonceId),
        type: typePrisma(),
        id_parent: String(com.id),
      }),
    })
    if (response.ok) {
      const raw = await response.json()
      if (!Array.isArray(com.reponses)) com.reponses = []
      com.reponses.push(formaterAuteur(raw))
      reponseTexte.value = ''
      replyingTo.value = null
    } else {
      const errData = await response.json()
      alert(errData.message || "Erreur lors de l'envoi de la réponse.")
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout de la réponse:", error)
  } finally {
    isSubmittingReply.value = false
  }
}

onMounted(() => {
  fetchCommentaires()
})
</script>

<template>
  <div class="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4">
    <div v-if="isLoading" class="text-center py-2 text-xs text-gray-400">
      Chargement des commentaires...
    </div>

    <div v-else-if="commentaires.length === 0" class="text-xs text-gray-400 italic">
      Aucun commentaire pour le moment. Soyez le premier à réagir !
    </div>

    <div v-else class="space-y-3 max-h-72 overflow-y-auto pr-2">
      <div v-for="com in commentaires" :key="com.id" class="space-y-2">
        <!-- Commentaire racine -->
        <div class="flex gap-3 text-sm">
          <div class="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-600 shrink-0">
            {{ com.auteur?.prenom?.[0] || '' }}{{ com.auteur?.nom?.[0] || '' }}
          </div>
          <div class="flex-1">
            <div class="bg-gray-100 rounded-xl px-3 py-2">
              <p class="font-bold text-gray-900 text-xs">
                {{ com.auteur?.prenom || 'Utilisateur' }} {{ com.auteur?.nom || '' }}
              </p>
              <p class="text-gray-700 mt-0.5 whitespace-pre-line text-xs">{{ com.texte }}</p>
            </div>
            <button
              @click="ouvrirReponse(com.id)"
              class="text-[11px] font-semibold text-gray-500 hover:text-blue-600 mt-1 ml-1 cursor-pointer"
            >
              Répondre
            </button>

            <!-- Réponses -->
            <div v-if="com.reponses && com.reponses.length" class="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
              <div v-for="rep in com.reponses" :key="rep.id" class="flex gap-2 text-sm">
                <div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center font-bold text-[10px] text-gray-600 shrink-0">
                  {{ rep.auteur?.prenom?.[0] || '' }}{{ rep.auteur?.nom?.[0] || '' }}
                </div>
                <div class="bg-white border border-gray-100 rounded-xl px-3 py-1.5 flex-1">
                  <p class="font-bold text-gray-900 text-[11px]">
                    {{ rep.auteur?.prenom || 'Utilisateur' }} {{ rep.auteur?.nom || '' }}
                  </p>
                  <p class="text-gray-700 mt-0.5 whitespace-pre-line text-[11px]">{{ rep.texte }}</p>
                </div>
              </div>
            </div>

            <!-- Champ de réponse -->
            <form
              v-if="replyingTo === com.id"
              @submit.prevent="envoyerReponse(com)"
              class="flex gap-2 mt-2 pl-4"
            >
              <input
                v-model="reponseTexte"
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
    </div>

    <form @submit.prevent="ajouterCommentaire" class="flex gap-2 mt-2">
      <input
        v-model="nouveauCommentaire"
        type="text"
        placeholder="Écrire un commentaire..."
        class="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        required
      />
      <button
        type="submit"
        :disabled="isSubmitting || !nouveauCommentaire.trim()"
        class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50 cursor-pointer"
      >
        {{ isSubmitting ? '...' : 'Envoyer' }}
      </button>
    </form>
  </div>
</template>
