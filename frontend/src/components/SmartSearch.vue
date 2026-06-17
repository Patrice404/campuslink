<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'

const emit = defineEmits<{ (e: 'search', params: Record<string, string>): void }>()
const authStore = useAuthStore()
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const text = ref('')
const showSuggestions = ref(false)
const activeIndex = ref(0)
const matieres = ref<string[]>([])
const inputEl = ref<HTMLInputElement | null>(null)

// Définition des tags disponibles (façon Discord)
const TAGS = [
  { tag: 'type:', desc: "Type d'annonce (exercice, bonplan…)" },
  { tag: 'matiere:', desc: 'Filtrer par matière' },
  { tag: 'annee:', desc: 'Niveau (L1, L2, M1…)' },
  { tag: 'auteur:', desc: 'Par la personne qui a publié' },
  { tag: 'has:', desc: 'Annonces avec image ou lien' },
  { tag: 'date:', desc: 'Publié ce jour précis (AAAA-MM-JJ)' },
  { tag: 'apres:', desc: 'Publié après (AAAA-MM-JJ)' },
  { tag: 'avant:', desc: 'Publié avant (AAAA-MM-JJ)' },
]
const VALUES: Record<string, string[]> = {
  type: ['exercice', 'bonplan', 'tutorat', 'projet'],
  annee: ['L1', 'L2', 'L3', 'M1', 'M2'],
  has: ['image', 'lien'],
}
const KNOWN = ['type', 'matiere', 'annee', 'auteur', 'has', 'date', 'avant', 'apres']

onMounted(async () => {
  try {
    const r = await fetch(`${apiUrl}/api/matieres`, {
      headers: authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {},
    })
    if (r.ok) {
      const d = await r.json()
      matieres.value = d.map((m: any) => m.titre)
    }
  } catch {
    /* pas grave : l'autocomplete matière sera juste vide */
  }
})

// Le "token" en cours de frappe = dernier mot
const currentToken = computed(() => {
  const parts = text.value.split(' ')
  return parts[parts.length - 1]
})

// Suggestions dynamiques selon ce qu'on tape
const suggestions = computed(() => {
  const tok = currentToken.value
  const colon = tok.indexOf(':')

  // Pas encore de ":" → on propose les tags qui commencent par ce qu'on tape.
  // Rien tapé → pas de menu (évite d'afficher les 7 filtres et d'encombrer).
  if (colon === -1) {
    const f = tok.toLowerCase()
    if (!f) return []
    return TAGS.filter((t) => t.tag.startsWith(f)).map((t) => ({
      label: t.tag,
      desc: t.desc,
      insert: t.tag,
      isValue: false,
    }))
  }

  // Après "tag:" → on propose les valeurs
  const tag = tok.slice(0, colon).toLowerCase()
  const val = tok.slice(colon + 1).toLowerCase()
  const pool = tag === 'matiere' ? matieres.value : VALUES[tag] || []
  return pool
    .filter((v) => v.toLowerCase().includes(val))
    .slice(0, 8)
    .map((v) => ({ label: v, desc: '', insert: `${tag}:${v} `, isValue: true }))
})

watch(suggestions, () => {
  activeIndex.value = 0
})

// Parse le texte en paramètres pour l'API
function parse(): Record<string, string> {
  const params: Record<string, string> = {}
  const free: string[] = []
  for (const tok of text.value.trim().split(/\s+/).filter(Boolean)) {
    const i = tok.indexOf(':')
    if (i > 0) {
      const k = tok.slice(0, i).toLowerCase()
      const v = tok.slice(i + 1)
      if (KNOWN.includes(k) && v) {
        params[k] = v
        continue
      }
    }
    free.push(tok)
  }
  if (free.length) params.q = free.join(' ')
  return params
}

let debounce: ReturnType<typeof setTimeout> | undefined
watch(text, () => {
  clearTimeout(debounce)
  debounce = setTimeout(() => emit('search', parse()), 350)
})

function applySuggestion(s: { insert: string }) {
  const parts = text.value.split(' ')
  parts[parts.length - 1] = s.insert
  text.value = parts.join(' ')
  inputEl.value?.focus()
}

// Petit délai au blur pour laisser le clic sur une suggestion s'exécuter
function onBlur() {
  setTimeout(() => (showSuggestions.value = false), 150)
}

function onKeydown(e: KeyboardEvent) {
  const list = suggestions.value
  if (showSuggestions.value && list.length) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      activeIndex.value = (activeIndex.value + 1) % list.length
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      activeIndex.value = (activeIndex.value - 1 + list.length) % list.length
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      applySuggestion(list[activeIndex.value])
      return
    }
    if (e.key === 'Escape') {
      showSuggestions.value = false
      return
    }
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    showSuggestions.value = false
    clearTimeout(debounce)
    emit('search', parse())
  }
}
</script>

<template>
  <div class="relative">
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
        </svg>
      </div>
      <input
        ref="inputEl"
        v-model="text"
        type="text"
        autocomplete="off"
        class="w-full bg-gray-50 rounded-lg pl-10 pr-4 py-3 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition outline-none"
        placeholder="Rechercher…  ex: type:tutorat matiere:algo annee:L1"
        @focus="showSuggestions = true"
        @input="showSuggestions = true"
        @blur="onBlur"
        @keydown="onKeydown"
      />
    </div>

    <!-- Menu d'aide dynamique -->
    <div
      v-if="showSuggestions && suggestions.length"
      class="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
    >
      <p class="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {{ currentToken.includes(':') ? 'Valeurs' : 'Filtres' }}
      </p>
      <button
        v-for="(s, i) in suggestions"
        :key="s.label"
        type="button"
        class="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm transition"
        :class="i === activeIndex ? 'bg-blue-50' : 'hover:bg-gray-50'"
        @mousedown.prevent="applySuggestion(s)"
        @mouseenter="activeIndex = i"
      >
        <span class="font-semibold text-gray-800">{{ s.label }}</span>
        <span class="text-xs text-gray-400 truncate">{{ s.desc }}</span>
      </button>
      <p class="px-3 py-1.5 text-[10px] text-gray-400 border-t border-gray-50">
        Tab pour compléter · Entrée pour rechercher
      </p>
    </div>
  </div>
</template>
