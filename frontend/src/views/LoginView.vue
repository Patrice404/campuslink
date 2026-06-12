<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

// Variables réactives
const email = ref('')
const password = ref('')
const showPassword = ref(false) // Le fameux interrupteur pour l'œil

const handleLogin = () => {
  console.log("Tentative de connexion avec :", email.value, password.value)
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
        <span class="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-md mb-4">
          CampusLink
        </span>
        <h2 class="text-3xl font-bold mb-2">Bienvenue sur le campus</h2>
        <p class="text-gray-200 text-lg leading-relaxed max-w-md">
          La plateforme qui connecte étudiants, projets et opportunités.
        </p>
      </div>
    </div>

    <div class="flex flex-1 items-center justify-center bg-gray-50 p-8">
      
      <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100">

        <div class="text-center mb-2">
          <h1 class="text-3xl font-extrabold text-gray-900">Connexion</h1>
          <p class="mt-2 text-sm text-gray-500">Accédez à votre espace étudiant</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
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
                class="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label for="password" class="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <a href="#" class="text-sm font-medium text-primary hover:underline">Oublié ?</a>
            </div>
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
                class="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
              
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-primary transition-colors"
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

          <button
            type="submit"
            class="w-full py-3 px-4 text-white font-bold bg-primary rounded-lg hover:opacity-90 active:scale-95 transition-all"
          >
            Se connecter
          </button>
        </form>

        <div class="flex items-center gap-3 my-6">
          <hr class="flex-1 border-gray-200" />
          <span class="text-sm text-gray-400 font-medium">ou</span>
          <hr class="flex-1 border-gray-200" />
        </div>

        <button
          type="button"
          class="w-full flex items-center justify-center gap-2 py-3 px-4 font-medium text-gray-700 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-lg transition-all"
        >
          <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
             <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
          </svg>
          Connexion via SSO Campus
        </button>

        <p class="text-center text-sm text-gray-600 mt-6">
          Nouveau sur CampusLink ?
          <RouterLink to="/register" class="font-bold text-primary hover:underline">Créer un compte</RouterLink>
        </p>

      </div>
    </div>

  </div>
</template>