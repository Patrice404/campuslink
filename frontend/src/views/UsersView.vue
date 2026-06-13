<script setup lang="ts">
import { ref, onMounted } from 'vue'
// On importe le type depuis ton dossier dédié
import type { User } from '../types/user'

const users = ref<User[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

const fetchUsers = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || ''
    const response = await fetch(`${apiUrl}/api/users`)

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`)
    }

    users.value = await response.json()
  } catch (e: any) {
    console.error("Erreur lors de la récupération des utilisateurs:", e)
    error.value = "Impossible de charger la liste des utilisateurs."
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="max-w-4xl mx-auto p-8 font-sans">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Liste des Utilisateurs</h2>

    <div v-if="isLoading" class="text-blue-500 italic">
      Chargement des utilisateurs en cours...
    </div>

    <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
      {{ error }}
    </div>

    <div v-else-if="users.length === 0" class="text-gray-500 italic">
      Aucun utilisateur trouvé dans la base de données.
    </div>

    <div v-else class="overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 rounded-lg">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="py-3 px-4 text-left text-sm font-semibold text-gray-900">ID</th>
            <th scope="col" class="py-3 px-4 text-left text-sm font-semibold text-gray-900">Nom</th>
            <th scope="col" class="py-3 px-4 text-left text-sm font-semibold text-gray-900">Email</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
            <td class="whitespace-nowrap py-4 px-4 text-sm text-gray-700">{{ user.id }}</td>
            <td class="whitespace-nowrap py-4 px-4 text-sm text-gray-700">{{ user.name || 'Non renseigné' }}</td>
            <td class="whitespace-nowrap py-4 px-4 text-sm text-gray-700">{{ user.email }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>