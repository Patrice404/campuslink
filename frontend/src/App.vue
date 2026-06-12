<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue' // 1. On importe la brique Lego

const route = useRoute()
</script>

<template>
  <Navbar v-if="!route.meta.hideNavbar" />

  <main>
    <RouterView />
  </main>
</template>