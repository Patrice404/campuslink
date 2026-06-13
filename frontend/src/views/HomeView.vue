<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { User } from '@campuslink/shared'

const users = ref<User[]>([])

const fetchUsers = async () => {
  try {
    const response = await fetch('/api/users')
    if (!response.ok) throw new Error('Erreur lors de la récupération')
    
    users.value = await response.json()
  } catch (error) {
    console.error('Erreur:', error)
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div>
    <h1>🏠 Accueil</h1>
    <h2>Liste des Étudiants :</h2>
    
    <ul v-if="users.length > 0">
      <li v-for="user in users" :key="user.id">
        <strong>{{ user.name }}</strong> - {{ user.email }}
      </li>
    </ul>
    <p v-else>Chargement...</p>
  </div>
</template>