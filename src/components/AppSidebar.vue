<template>
  <aside class="sidebar" :class="{ open }">
    <button class="sidebar-close" aria-label="Menü schliessen" @click="$emit('close')">
      <i class="ti ti-x"></i>
    </button>
    <div class="sidebar-header">
      <div class="logo-books" aria-hidden="true">
        <svg width="64" height="44" viewBox="0 0 64 44" fill="none">
          <rect x="2"  y="4"  width="16" height="36" rx="2" fill="#e8d8c4" stroke="#8a6e4e" stroke-width="1"/>
          <rect x="4"  y="6"  width="16" height="36" rx="2" fill="#f5ede0" stroke="#8a6e4e" stroke-width=".8"/>
          <rect x="6"  y="8"  width="16" height="36" rx="2" fill="#fffdf8" stroke="#c4a882" stroke-width=".8"/>
          <rect x="6"  y="8"  width="3"  height="36" rx="1" fill="#c4a882"/>
          <line x1="12" y1="16" x2="19" y2="16" stroke="#c4a882" stroke-width=".7"/>
          <line x1="12" y1="19" x2="19" y2="19" stroke="#c4a882" stroke-width=".7"/>
          <rect x="24" y="2"  width="14" height="40" rx="2" fill="#d4c4a8" stroke="#8a6e4e" stroke-width="1"/>
          <rect x="26" y="4"  width="14" height="40" rx="2" fill="#eef0e0" stroke="#828F47" stroke-width=".8"/>
          <rect x="26" y="4"  width="3"  height="40" rx="1" fill="#828F47" opacity=".6"/>
          <line x1="32" y1="14" x2="37" y2="14" stroke="#828F47" stroke-width=".7" opacity=".5"/>
          <line x1="32" y1="17" x2="37" y2="17" stroke="#828F47" stroke-width=".7" opacity=".5"/>
          <rect x="42" y="6"  width="13" height="36" rx="2" fill="#f0e8d8" stroke="#8a6e4e" stroke-width="1"/>
          <rect x="44" y="8"  width="13" height="36" rx="2" fill="#fffdf8" stroke="#c4a882" stroke-width=".8"/>
          <rect x="44" y="8"  width="3"  height="36" rx="1" fill="#c4907a" opacity=".7"/>
          <path d="M50 4 L52 10 L50 12 L48 10 Z" fill="#828F47" opacity=".8"/>
        </svg>
      </div>
      <div class="app-title"><em>Rezeptarium</em></div>
      <div class="app-divider"><span>❧</span></div>
      <div class="app-subtitle">eine kleine Schatzkammer</div>
      <div class="snoopy-wrap" aria-label="Snoopy">
        <img src="/assets/snoopy_svg/Snoopy_House.svg" alt="Snoopy" class="snoopy-img">
      </div>
    </div>

    <nav class="sidebar-nav">
      <p class="nav-section">Sammlung</p>
      <button
        v-for="item in mainItems" :key="item.key"
        class="nav-item" :class="{ active: isActive(item) }"
        @click="selectMainItem(item)"
      >
        <i :class="`ti ti-${item.icon}`"></i>{{ item.label }}
        <span v-if="item.count !== undefined" class="nav-count">{{ item.count }}</span>
      </button>

      <button
        v-if="authStore.isAdmin" class="nav-item"
        :class="{ active: store.adminMode === 'admin' }"
        @click="selectAdminView"
      >
        <i class="ti ti-shield-check"></i>Admin: Alle Rezepte
      </button>

      <p class="nav-section">Kapitel</p>
      <button
        v-for="cat in categories" :key="cat.filter"
        class="nav-item" :class="{ active: isActive(cat) }"
        @click="select(cat.filter)"
      >
        <i :class="`ti ti-${cat.icon}`"></i>{{ cat.label }}
      </button>

      <p class="nav-section">Entdecken</p>
      <button class="nav-item" :class="{ active: route.name === 'discovery' }" @click="goDiscovery">
        <i class="ti ti-world"></i>Discovery
      </button>

      <template v-if="authStore.isAdmin">
        <p class="nav-section">Verwaltung</p>
        <button class="nav-item" @click="goAdminQuotes">
          <i class="ti ti-quote"></i>Zitate
        </button>
      </template>
    </nav>

    <button class="add-btn" @click="add">
      <i class="ti ti-book-plus"></i>Eintrag hinzufügen
    </button>
    <button class="logout-btn" @click="logout">
      <i class="ti ti-logout"></i>Abmelden
    </button>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRecipeStore } from '../stores/recipes'
import { useAuthStore } from '../stores/auth'
import { signOut } from '../lib/supabase'

defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])

const router = useRouter()
const route = useRoute()
const store = useRecipeStore()
const authStore = useAuthStore()

const mainItems = computed(() => [
  { key: 'all', filter: '', collectionMode: 'all', icon: 'books', label: 'Alle Rezepte' },
  { key: 'mine', filter: '', collectionMode: 'mine', icon: 'user', label: 'Meine Rezepte', count: store.countAll },
  { key: 'saved', filter: '', collectionMode: 'saved', icon: 'bookmark', label: 'Gespeicherte' },
  { key: 'fav', filter: '__fav__', collectionMode: 'mine', icon: 'heart', label: 'Favoriten', count: store.countFav },
])

const categories = [
  { filter: 'Frühstück', icon: 'coffee', label: 'Frühstück' },
  { filter: 'Hauptgericht', icon: 'soup', label: 'Hauptgericht' },
  { filter: 'Dessert', icon: 'ice-cream', label: 'Dessert' },
  { filter: 'Backen', icon: 'bread', label: 'Backen' },
  { filter: 'Snack', icon: 'apple', label: 'Snack' },
  { filter: 'Sonstiges', icon: 'leaf', label: 'Sonstiges' },
]

function isActive(item) {
  if (route.name !== 'grid') return false
  if (store.adminMode === 'admin') return false
  if (item.collectionMode && item.collectionMode !== store.collectionMode) return false
  if (item.filter !== undefined && store.activeFilter !== item.filter) return false
  return true
}

async function selectMainItem(item) {
  store.setFilter(item.filter)
  store.collectionMode = item.collectionMode
  store.adminMode = 'user'
  if (router.currentRoute.value.name !== 'grid') router.push('/')
  await store.load()
  if (window.innerWidth <= 700) emit('close')
}

async function selectAdminView() {
  store.setFilter('')
  store.adminMode = 'admin'
  if (router.currentRoute.value.name !== 'grid') router.push('/')
  await store.load()
  if (window.innerWidth <= 700) emit('close')
}

function select(filter) {
  store.setFilter(filter)
  store.collectionMode = 'mine'
  store.adminMode = 'user'
  if (router.currentRoute.value.name !== 'grid') router.push('/')
  store.load()
  if (window.innerWidth <= 700) emit('close')
}

function add() {
  router.push('/add')
  emit('close')
}

function goDiscovery() {
  router.push('/discovery')
  emit('close')
}

function goAdminQuotes() {
  router.push('/admin/quotes')
  emit('close')
}

async function logout() {
  await signOut()
  router.push('/login')
  emit('close')
}
</script>
