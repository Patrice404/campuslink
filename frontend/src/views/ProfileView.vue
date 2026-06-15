<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const user = ref<any>(null);
const loading = ref(true);
const error = ref("");

const isMyProfile = computed(() => !route.params.id);

onMounted(async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const userId = route.params.id;

    const endpoint = userId
      ? `${apiUrl}/api/users/${userId}/profile`
      : `${apiUrl}/api/profil`;

    const token = localStorage.getItem("token");

    const response = await fetch(endpoint, {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    });

    if (!response.ok) {
      throw new Error("Impossible de charger le profil");
    }

    user.value = await response.json();
  } catch (err) {
    error.value = "Erreur lors du chargement du profil.";
  } finally {
    loading.value = false;
  }
});

const initials = computed(() => {
  if (!user.value) return "";
  return `${user.value.prenom?.[0] || ""}${user.value.nom?.[0] || ""}`;
});
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <p v-if="loading">Chargement...</p>
    <p v-else-if="error">{{ error }}</p>

    <main v-else class="max-w-5xl mx-auto">
      <section class="bg-white rounded-xl overflow-hidden shadow-sm">
        <div class="h-32 bg-blue-600"></div>

        <div class="px-6 pb-6">
          <div class="flex items-end gap-4 -mt-12">
            <div class="w-24 h-24 rounded-full bg-gray-200 border-4 border-white flex items-center justify-center text-3xl font-bold">
              {{ initials }}
            </div>

            <div>
              <h1 class="text-2xl font-bold">
                {{ user.prenom }} {{ user.nom }}
              </h1>
              <p class="text-gray-500">{{ user.email }}</p>
            </div>
          </div>

          <div class="flex gap-3 mt-4 text-sm">
            <span class="bg-gray-100 px-3 py-1 rounded-full">{{ user.role }}</span>
            <span class="bg-gray-100 px-3 py-1 rounded-full">
              {{ user.campus?.nom }}
            </span>
          </div>

          <div class="grid grid-cols-3 gap-4 mt-6 text-center">
            <div>
              <p class="font-bold">{{ user.stats.posts }}</p>
              <p class="text-gray-500 text-sm">Posts</p>
            </div>
            <div>
              <p class="font-bold">{{ user.stats.commentaires }}</p>
              <p class="text-gray-500 text-sm">Commentaires</p>
            </div>
            <div>
              <p class="font-bold">{{ user.stats.likes }}</p>
              <p class="text-gray-500 text-sm">Likes</p>
            </div>
          </div>
        </div>
      </section>

      <section class="mt-6 bg-white rounded-xl shadow-sm divide-y">
        <article
          v-for="post in user.posts"
          :key="post.id"
          class="p-5 hover:bg-gray-50"
        >
          <p class="text-xs text-blue-600 font-semibold">{{ post.type }}</p>

          <h2 class="text-lg font-bold mt-1">
            {{ post.titre }}
          </h2>

          <p class="text-gray-700 mt-2">
            {{ post.texte }}
          </p>

          <div class="flex gap-4 mt-3 text-sm text-gray-500">
            <span>{{ post.likes }} likes</span>
            <span>{{ post.commentaires }} commentaires</span>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>