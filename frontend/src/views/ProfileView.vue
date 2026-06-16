<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from '../stores/authStore';

const route = useRoute();
const authStore = useAuthStore();

// 1. ON DÉCLARE L'API URL ICI (Globale, accessible par le template et les fonctions)
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

const user = ref<any>(null);
const loading = ref(true);
const error = ref("");

const isMyProfile = computed(() => !route.params.id);

// États pour la modification
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
      // Correspond exactement au upload.single('photo') du backend
      formData.append("photo", selectedFile.value); 
    }

    const response = await fetch(`${apiUrl}/api/utilisateur/profile`, {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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

const fetchProfile = async () => {
  loading.value = true;
  error.value = "";
  
  try {
    const userId = route.params.id;
    const endpoint = userId
      ? `${apiUrl}/api/utilisateurs/profile/${userId}`
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
  } catch (err) {
    console.error("Détail de l'erreur :", err);
    error.value = "Erreur lors du chargement du profil.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchProfile);
watch(() => route.params.id, fetchProfile);

const initials = computed(() => {
  if (!user.value) return "";
  return `${user.value.prenom?.[0] || ""}${user.value.nom?.[0] || ""}`.toUpperCase();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
    
    <!-- États de chargement et d'erreur -->
    <div v-if="loading" class="flex flex-col items-center justify-center mt-20 space-y-4">
      <div class="w-12 h-12 border-4 border-slate-200 rounded-full animate-spin" style="border-top-color: #6366F1;"></div>
      <p class="text-slate-500 font-medium animate-pulse">Chargement du profil...</p>
    </div>
    
    <div v-else-if="error" class="max-w-2xl mx-auto mt-10 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
      <p class="text-red-700 font-bold flex items-center gap-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
        {{ error }}
      </p>
    </div>

    <!-- Profil principal -->
    <main v-else class="max-w-4xl mx-auto space-y-6">
      
      <!-- En-tête du profil -->
      <section class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        <!-- Bannière (Cover) -->
        <div class="h-40 relative" style="background: linear-gradient(135deg, #6366F1 0%, #4f46e5 100%);">
          <!-- SÉCURITÉ : Ce bouton n'apparaît QUE pour le propriétaire du profil -->
          <button 
            v-if="isMyProfile" 
            @click="openEditModal"
            class="absolute top-4 right-4 bg-white/20 hover:bg-white/30 transition text-white px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-md flex items-center gap-2 shadow-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            Modifier mon profil
          </button>
        </div>

        <div class="px-6 sm:px-10 pb-8">
          <div class="flex flex-col sm:flex-row sm:items-end gap-6 -mt-16 relative z-10">
            <!-- Avatar -->
            <div class="w-32 h-32 rounded-full border-4 border-white shadow-md flex-shrink-0 bg-white overflow-hidden">
              <img v-if="user.photoProfil" :src="`${apiUrl}/uploads/${user.photoProfil}`" alt="Avatar" class="w-full h-full object-cover" />
            
              <div v-else class="w-full h-full bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-500">
                {{ initials }}
              </div>
            </div>

            <!-- Infos de base & Biographie -->
            <div class="flex-1 pt-16 sm:pt-20">
              <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
                {{ user.prenom }} {{ user.nom }}
              </h1>
              
              <p v-if="user.email" class="text-slate-500 font-medium mt-1 flex items-center gap-1.5 text-sm">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                {{ user.email }}
              </p>

              <!-- Biographie -->
              <div v-if="user.bio" class="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed border-l-4" style="border-l-color: #6366F1;">
                <p class="font-semibold text-xs uppercase tracking-wider text-slate-400 mb-1">À propos</p>
                {{ user.bio }}
              </div>
            </div>
          </div>

          <!-- Badges -->
          <div class="flex flex-wrap gap-3 mt-6">
            <span class="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-sm font-semibold border border-slate-200">
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              {{ user.role }}
            </span>
            <span v-if="user.campus" class="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-semibold border border-indigo-100">
              <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              {{ user.campus.nom }}
            </span>
          </div>

          <!-- Statistiques -->
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

      <!-- Section Activités -->
      <section class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 class="font-bold text-lg text-slate-800">Activités récentes</h2>
        </div>
        
        <div v-if="!user.posts || user.posts.length === 0" class="p-12 text-center flex flex-col items-center">
          <p class="text-slate-500 text-lg font-medium">Aucune annonce publiée pour le moment.</p>
        </div>

        <div class="divide-y divide-slate-100">
          <article v-for="post in (user.posts || [])" :key="post.id" class="p-6 hover:bg-slate-50 transition group">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700">
                {{ post.type }}
              </span>
            </div>
            <h3 class="text-xl font-bold text-slate-900 transition duration-200" onmouseover="this.style.color='#6366F1'" onmouseout="this.style.color=''">
              {{ post.titre || 'Annonce sans titre' }}
            </h3>
            <p class="text-slate-600 mt-2 text-sm">{{ post.texte }}</p>
          </article>
        </div>
      </section>
    </main>

    <!-- NOUVEAU : MODAL DE MODIFICATION DU PROFIL (Double barrière de sécurité) -->
    <div v-if="isEditing && isMyProfile" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div class="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden transform transition-all scale-100">
        
        <!-- Header du Modal -->
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 class="font-bold text-lg text-slate-800">Modifier mon profil</h2>
          <button @click="isEditing = false" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition">
            ✕
          </button>
        </div>

        <!-- Formulaire -->
        <form @submit.prevent="handleUpdateProfile" class="p-6 space-y-4">
          
          <!-- Prénom & Nom -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Prénom</label>
              <input v-model="editForm.prenom" type="text" required class="w-full bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition" style="border-color: #cbd5e1; focus-border-color: #6366F1;" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Nom</label>
              <input v-model="editForm.nom" type="text" required class="w-full bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition" />
            </div>
          </div>

          <!-- Biographie -->
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">À propos (Bio)</label>
            <textarea v-model="editForm.bio" rows="3" placeholder="Parle-nous un peu de toi..." class="w-full bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"></textarea>
          </div>

          <!-- Photo de profil -->
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Photo de profil</label>
            <input type="file" accept="image/*" @change="handleFileChange" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
          </div>

          <!-- Actions du formulaire -->
          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button type="button" @click="isEditing = false" class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
              Annuler
            </button>
            <button type="submit" class="px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition duration-150" style="background-color: #6366F1;">
              Enregistrer
            </button>
          </div>

        </form>
      </div>
    </div>

  </div>
</template>