<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'

const props = defineProps<{
  annonceId: number
}>()

const emit = defineEmits(['comment-added'])
const authStore = useAuthStore()

const commentaires = ref<any[]>([])
const nouveauCommentaire = ref('')
const isLoading = ref(false)
const isSubmitting = ref(false)

// Charger les commentaires de cette annonce
const fetchCommentaires = async () => {
  isLoading.value = true
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/annonces/${props.annonceId}/commentaires`, {
      headers: {
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {})
      }
    })
    if (response.ok) {
      commentaires.value = await response.json()
    }
  } catch (error) {
    console.error('Erreur chargement commentaires:', error)
  } finally {
    isLoading.value = false
  }
}

// Soumettre un nouveau commentaire
const ajouterCommentaire = async () => {
  if (!nouveauCommentaire.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/annonces/${props.annonceId}/commentaires`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {})
      },
      body: JSON.stringify({ texte: nouveauCommentaire.value })
    })

    if (response.ok) {
      const commentaireCree = await response.json()
      commentaires.value.push(commentaireCree)
      nouveauCommentaire.value = ''
      emit('comment-added')
    }
  } catch (error) {
    console.error('Erreur publication commentaire:', error)
  } finally {
    isSubmitting.value = false
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
    
    <div v-else class="space-y-3 max-h-60 overflow-y-auto pr-2">
      <div v-for="com in commentaires" :key="com.id" class="flex gap-3 text-sm">
        <div class="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-600 shrink-0">
          {{ com.auteur.prenom[0] }}{{ com.auteur.nom[0] }}
        </div>
        <div class="bg-gray-100 rounded-xl px-3 py-2 flex-1">
          <p class="font-bold text-gray-900 text-xs">{{ com.auteur.prenom }} {{ com.auteur.nom }}</p>
          <p class="text-gray-700 mt-0.5 whitespace-pre-line text-xs">{{ com.texte }}</p>
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
        :disabled="isSubmitting"
        class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50"
      >
        {{ isSubmitting ? '...' : 'Envoyer' }}
      </button>
    </form>
  </div>
</template>