<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
// On ajoute useRouter pour pouvoir rediriger l'utilisateur après la suppression de son compte
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from '../stores/authStore';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

const user = ref<any>(null);
const loading = ref(true);
const error = ref("");

// ✨ Modification : On vérifie la présence de l'UUID pour savoir si c'est notre profil
const isMyProfile = computed(() => !route.params.uuid);

// --- ÉTATS POUR LA MODIFICATION CLASSIQUE ---
const isEditing = ref(false);
const editForm = ref({ nom: "", prenom: "", bio: "" });
const selectedFile = ref<File | null>(null);

const openEditModal = () => {
  if (!isMyProfile.value) return;
  editForm.value.nom = user.value.nom;
  editForm.value.prenom = user.value.prenom;
  editForm.value.bio = user.value.bio || "";
  isEditing.value = true;
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
  }
};

const handleUpdateProfile = async () => {
  if (!isMyProfile.value) return;
  try {
    const token = authStore.token;
    const formData = new FormData();
    formData.append("nom", editForm.value.nom);
    formData.append("prenom", editForm.value.prenom);
    formData.append("bio", editForm.value.bio);
    
    if (selectedFile.value) {
      formData.append("photo", selectedFile.value); 
    }

    const response = await fetch(`${apiUrl}/api/utilisateurs/profile`, {
      method: 'PUT',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });

    if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);

    await fetchProfile();
    isEditing.value = false;
    selectedFile.value = null;
  } catch (err) {
    console.error("Erreur lors de la mise à jour :", err);
    alert("Impossible de mettre à jour le profil.");
  }
};

// --- SAUVEGARDE AUTOMATIQUE DES PRÉFÉRENCES (JSON) ---
const handleUpdatePreferences = async () => {
  try {
    const token = authStore.token;
    const response = await fetch(`${apiUrl}/api/utilisateurs/profile`, {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ centresInteret: user.value.centresInteret })
    });

    if (!response.ok) throw new Error();
  } catch (err) {
    console.error(err);
    alert("Erreur lors de la mise à jour de vos préférences.");
  }
};

// --- TOGGLE BLOCAGE DE L'UTILISATEUR EXTERNE ---
const handleToggleBlock = async () => {
  try {
    const token = authStore.token;
    // ✨ Modification : Appel de la route avec l'UUID
    const response = await fetch(`${apiUrl}/api/utilisateurs/profile/block/${route.params.uuid}`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });

    if (!response.ok) throw new Error();
    const data = await response.json();
    
    user.value.estBloque = data.bloque;
  } catch (err) {
    console.error(err);
    alert("Impossible de modifier le statut de blocage.");
  }
};

// --- SUPPRESSION DU COMPTE (RGPD) ---
const handleDeleteAccount = async () => {
  const confirmation = confirm("⚠️ ATTENTION : Êtes-vous absolument sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible et supprimera l'intégralité de vos publications.");
  if (!confirmation) return;

  try {
    const token = authStore.token;
    const response = await fetch(`${apiUrl}/api/utilisateurs/profile`, {
      method: 'DELETE',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });

    if (!response.ok) throw new Error();

    authStore.token = null;
    localStorage.clear();
    alert("Votre compte a été supprimé avec succès.");
    router.push("/login"); 
  } catch (err) {
    console.error(err);
    alert("Erreur lors de la suppression de votre compte.");
  }
};

// --- CHARGEMENT DU PROFIL ---
const fetchProfile = async () => {
  loading.value = true;
  error.value = "";
  try {
    // ✨ Modification : Lecture de l'UUID depuis les paramètres de la route
    const userUuid = route.params.uuid;
    const endpoint = userUuid
      ? `${apiUrl}/api/utilisateurs/profile/${userUuid}`
      : `${apiUrl}/api/utilisateurs/profile`;

    const token = authStore.token; 
    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store', 
      headers: { 
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Accept': 'application/json' 
      },
    });

    if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);

    user.value = await response.json();
    
    if (isMyProfile.value && !user.value.centresInteret) {
      user.value.centresInteret = [];
    }
  } catch (err) {
    console.error("Détail de l'erreur :", err);
    error.value = "Erreur lors du chargement du profil.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchProfile);
// ✨ Modification : Surveillance de l'UUID pour recharger la vue en cas de navigation directe
watch(() => route.params.uuid, fetchProfile);

const initials = computed(() => {
  if (!user.value) return "";
  return `${user.value.prenom?.[0] || ""}${user.value.nom?.[0] || ""}`.toUpperCase();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
    
    <div class="max-w-4xl mx-auto mb-5">
      <router-link to="/home" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-100 transition duration-200 group">
        <svg class="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        Retour à l'accueil
      </router-link>
    </div>
    
    <div v-if="loading" class="flex flex-col items-center justify-center mt-20 space-y-4">
      <div class="w-12 h-12 border-4 border-slate-200 rounded-full animate-spin" style="border-top-color: #6366F1;"></div>
      <p class="text-slate-500 font-medium animate-pulse">Chargement du profil...</p>
    </div>
    
    <div v-else-if="error" class="max-w-2xl mx-auto mt-10 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
      <p class="text-red-700 font-bold flex items-center gap-2">
        {{ error }}
      </p>
    </div>

    <main v-else class="max-w-4xl mx-auto space-y-6">
      
      <section class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        <div class="h-40 relative" style="background: linear-gradient(135deg, #6366F1 0%, #4f46e5 100%);">
          <button v-if="isMyProfile" @click="openEditModal" class="absolute top-4 right-4 bg-white/20 hover:bg-white/30 transition text-white px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-md flex items-center gap-2 shadow-sm">
            Modifier mon profil
          </button>

          <button 
            v-else 
            @click="handleToggleBlock" 
            class="absolute top-4 right-4 transition px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-md flex items-center gap-2 shadow-sm text-white"
            :class="user.estBloque ? 'bg-red-600 hover:bg-red-700' : 'bg-black/30 hover:bg-black/50'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
            </svg>
            {{ user.estBloque ? 'Utilisateur bloqué' : 'Bloquer l\'utilisateur' }}
          </button>
        </div>

        <div class="px-6 sm:px-10 pb-8">
          <div class="flex flex-col sm:flex-row sm:items-start gap-6 -mt-16 relative z-10">
            <div class="w-32 h-32 rounded-full border-4 border-white shadow-md flex-shrink-0 bg-white overflow-hidden">
              <img v-if="user.photoProfil" :src="`${apiUrl}/uploads/${user.photoProfil}`" alt="Avatar" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-500">
                {{ initials }}
              </div>
            </div>

            <div class="flex-1 pt-16 sm:pt-20">
              <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
                {{ user.prenom }} {{ user.nom }}
              </h1>
              <p v-if="user.email" class="text-slate-500 font-medium mt-1 flex items-center gap-1.5 text-sm">
                {{ user.email }}
              </p>

              <div v-if="user.bio" class="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed border-l-4" style="border-l-color: #6366F1;">
                <p class="font-semibold text-xs uppercase tracking-wider text-slate-400 mb-1">À propos</p>
                {{ user.bio }}
              </div>

              <div v-if="isMyProfile" class="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p class="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Mes préférences de contenu </p>
                <div class="flex flex-wrap gap-2.5 mt-2">
                  <label 
                    v-for="genre in ['PROJET', 'EXERCICE', 'BON_PLAN', 'ENTRAIDE', 'MATIERE']" 
                    :key="genre"
                    class="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-100 transition text-xs font-semibold text-slate-700"
                  >
                    <input 
                      type="checkbox" 
                      :value="genre" 
                      v-model="user.centresInteret" 
                      @change="handleUpdatePreferences"
                      class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300" 
                    />
                    {{ genre.replace('_', ' ') }}
                  </label>
                </div>
              </div>

            </div>
          </div>

          <div class="flex flex-wrap gap-3 mt-6">
            <span class="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-sm font-semibold border border-slate-200">
              {{ user.role }}
            </span>
            <span v-if="user.campus" class="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-semibold border border-indigo-100">
              {{ user.campus.nom }}
            </span>
          </div>

          <div class="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100">
            <div class="bg-slate-50 rounded-xl p-4 text-center border border-slate-100 cursor-default">
              <p class="text-3xl font-black" style="color: #6366F1;">{{ user.stats?.posts || 0 }}</p>
              <p class="text-slate-500 text-sm font-medium mt-1">Annonces</p>
            </div>
            <div class="bg-slate-50 rounded-xl p-4 text-center border border-slate-100 cursor-default">
              <p class="text-3xl font-black" style="color: #6366F1;">{{ user.stats?.commentaires || 0 }}</p>
              <p class="text-slate-500 text-sm font-medium mt-1">Commentaires</p>
            </div>
            <div class="bg-slate-50 rounded-xl p-4 text-center border border-slate-100 cursor-default">
              <p class="text-3xl font-black" style="color: #6366F1;">{{ user.stats?.likes || 0 }}</p>
              <p class="text-slate-500 text-sm font-medium mt-1">Likes reçus</p>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 class="font-bold text-lg text-slate-800">Activités récentes</h2>
        </div>
        <div v-if="!user.posts || user.posts.length === 0" class="p-12 text-center flex flex-col items-center">
          <p class="text-slate-500 text-lg font-medium">Aucune annonce publiée pour le moment.</p>
        </div>
        <div class="divide-y divide-slate-100">
          <article v-for="post in (user.posts || [])" :key="post.id" class="p-6 hover:bg-slate-50 transition group">
            <h3 class="text-xl font-bold text-slate-900" onmouseover="this.style.color='#6366F1'" onmouseout="this.style.color=''">
              {{ post.titre || 'Annonce sans titre' }}
            </h3>
            <p class="text-slate-600 mt-2 text-sm">{{ post.texte }}</p>
          </article>
        </div>
      </section>

      <section v-if="isMyProfile" class="bg-red-50 rounded-2xl p-6 border border-red-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-12">
        <div>
          <h3 class="text-red-800 font-bold text-lg">Avertissement</h3>
          <p class="text-red-600 text-sm mt-1">La suppression de votre compte effacera de manière irréversible toutes vos données de la plateforme.</p>
        </div>
        <button @click="handleDeleteAccount" class="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-sm whitespace-nowrap">
          Supprimer mon compte
        </button>
      </section>
    </main>

    <div v-if="isEditing && isMyProfile" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div class="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 class="font-bold text-lg text-slate-800">Modifier mon profil</h2>
          <button @click="isEditing = false" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition">✕</button>
        </div>
        <form @submit.prevent="handleUpdateProfile" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Prénom</label>
              <input v-model="editForm.prenom" type="text" required class="w-full bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 text-sm outline-none" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Nom</label>
              <input v-model="editForm.nom" type="text" required class="w-full bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 text-sm outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">À propos (Bio)</label>
            <textarea v-model="editForm.bio" rows="3" class="w-full bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 text-sm outline-none resize-none"></textarea>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Photo de profil</label>
            <input type="file" accept="image/*" @change="handleFileChange" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
          </div>
          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button type="button" @click="isEditing = false" class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Annuler</button>
            <button type="submit" class="px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-sm" style="background-color: #6366F1;">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>