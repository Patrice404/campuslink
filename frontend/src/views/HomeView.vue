<script setup lang="ts">
import { ref } from 'vue'
import SidebarNav from '../components/SidebarNav.vue'
import TopNav from '../components/TopNav.vue'
import CreatePostModal from '../components/CreatePostModal.vue' 

const isMobileMenuOpen = ref(false)
const isCreateModalOpen = ref(false) 
</script>

<template>
  <div class="flex min-h-screen bg-gray-50">
    
    <SidebarNav 
      :is-open="isMobileMenuOpen" 
      @close="isMobileMenuOpen = false" 
    />

    <main class="flex-1 flex flex-col min-w-0">
      
      <TopNav 
        @open-menu="isMobileMenuOpen = true" 
        @open-create-modal="isCreateModalOpen = true" 
      />

      <div class="flex-1 p-6 overflow-y-auto">
        <div class="max-w-3xl mx-auto space-y-6">
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p class="text-gray-500 text-center">Les publications apparaîtront ici...</p>
          </div>
        </div>
      </div>

    </main>

    <CreatePostModal 
      :is-open="isCreateModalOpen" 
      @close="isCreateModalOpen = false" 
    />
  </div>
</template>