<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const user = ref<any>(null);
const loading = ref(true);
const error = ref("");

const isMyProfile = computed(() => !route.params.id);

// 1. On place la logique d'appel API dans une fonction réutilisable
const fetchProfile = async () => {
  loading.value = true;
  error.value = "";
  
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const userId = route.params.id;

    // L'URL s'adapte automatiquement au back-end (/profile ou /:id)
    const endpoint = userId
      ? `${apiUrl}/api/utilisateur/${userId}`
      : `${apiUrl}/api/utilisateur/profile`;

    const token = localStorage.getItem("token");
    
    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store', 
      headers: token
        ? { Authorization: `Bearer ${token}`, 'Accept': 'application/json' }
        : {},
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`);
    }

    user.value = await response.json();
  } catch (err) {
    console.error("Détail de l'erreur :", err);
    error.value = "Erreur lors du chargement du profil.";
  } finally {
    loading.value = false;
  }
};

// 2. On charge au premier affichage de la page
onMounted(fetchProfile);

// 3. NOUVEAU : On recharge la page si l'ID dans l'URL change
watch(() => route.params.id, fetchProfile);

const initials = computed(() => {
  if (!user.value) return "";
  return `${user.value.prenom?.[0] || ""}${user.value.nom?.[0] || ""}`.toUpperCase();
});
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <p v-if="loading" class="text-center mt-10 text-gray-500 animate-pulse">Chargement...</p>
    <p v-else-if="error" class="text-center mt-10 text-red-600 font-bold">{{ error }}</p>

    <main v-else class="max-w-5xl mx-auto">
      <section class="bg-white rounded-xl overflow-hidden shadow-sm">
        <div class="h-32 bg-blue-600 relative">
          <span v-if="isMyProfile" class="absolute top-4 right-4 bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
            Mon Profil
          </span>
        </div>

        <div class="px-6 pb-6">
          <div class="flex items-end gap-4 -mt-12">
            <div class="w-24 h-24 rounded-full bg-gray-200 border-4 border-white flex items-center justify-center text-3xl font-bold text-gray-600">
              {{ initials }}
            </div>

            <div>
              <h1 class="text-2xl font-bold">
                {{ user.prenom }} {{ user.nom }}
              </h1>
              <p v-if="user.email" class="text-gray-500">{{ user.email }}</p>
            </div>
          </div>

          <div class="flex gap-3 mt-4 text-sm">
            <span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">{{ user.role }}</span>
            <span v-if="user.campus" class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
              {{ user.campus.nom }}
            </span>
          </div>

          <div class="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100 text-center">
            <div>
              <p class="font-bold text-lg text-gray-900">{{ user.stats?.posts || 0 }}</p>
              <p class="text-gray-500 text-sm">Annonces</p>
            </div>
            <div>
              <p class="font-bold text-lg text-gray-900">{{ user.stats?.commentaires || 0 }}</p>
              <p class="text-gray-500 text-sm">Commentaires</p>
            </div>
            <div>
              <p class="font-bold text-lg text-gray-900">{{ user.stats?.likes || 0 }}</p>
              <p class="text-gray-500 text-sm">Likes reçus</p>
            </div>
          </div>
        </div>
      </section>

      <section class="mt-6 bg-white rounded-xl shadow-sm divide-y">
        <h2 class="px-6 py-4 font-bold text-lg">Activités récentes</h2>
        
        <div v-if="!user.posts || user.posts.length === 0" class="p-8 text-center text-gray-500">
          Aucune annonce publiée pour le moment.
        </div>

        <article
          v-for="post in (user.posts || [])"
          :key="post.id"
          class="p-5 hover:bg-gray-50 transition"
        >
          <p class="text-xs font-semibold px-2 py-1 rounded-full inline-block mb-2"
             :class="{'bg-blue-100 text-blue-700': post.type === 'PROJET', 'bg-green-100 text-green-700': post.type === 'BON_PLAN'}">
            {{ post.type }}
          </p>

          <h3 class="text-lg font-bold text-gray-900">
            {{ post.titre }}
          </h3>

          <p class="text-gray-700 mt-2 line-clamp-2">
            {{ post.texte }}
          </p>

          <div class="flex gap-4 mt-3 text-sm font-medium text-gray-500">
            <span class="flex items-center gap-1">❤️ {{ post.likes }}</span>
            <span class="flex items-center gap-1">💬 {{ post.commentaires }}</span>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>