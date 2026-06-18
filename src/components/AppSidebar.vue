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
      <template v-for="section in sidebarStore.effectiveSections" :key="section">
        <!-- Sammlung -->
        <template v-if="section === 'sammlung' && sidebarStore.visibleItems('sammlung').length">
          <p class="nav-section">Sammlung</p>
          <button
            v-for="item in sidebarStore.visibleItems('sammlung')" :key="item.key"
            class="nav-item" :class="{ active: isMainActive(item) }"
            @click="selectMainItem(item)"
          >
            <i :class="`ti ti-${item.icon}`"></i>{{ item.label }}
            <span v-if="item.key === 'mine'" class="nav-count">{{ store.countMine }}</span>
          </button>

          <button
            v-if="authStore.isAdmin" class="nav-item"
            :class="{ active: store.adminMode === 'admin' }"
            @click="selectAdminView"
          >
            <i class="ti ti-shield-check"></i>Admin: Alle Rezepte
          </button>
        </template>

        <!-- Kapitel -->
        <template v-if="section === 'kapitel' && sidebarStore.visibleItems('kapitel').length">
          <p class="nav-section">Kapitel</p>
          <button
            v-for="item in sidebarStore.visibleItems('kapitel')" :key="item.key"
            class="nav-item" :class="{ active: isCategoryActive(item) }"
            @click="selectCategory(item.key.replace('category:', ''))"
          >
            <i :class="`ti ti-${item.icon}`"></i>{{ item.label }}
          </button>
        </template>

        <!-- Social -->
        <template v-if="section === 'social' && sidebarStore.visibleItems('social').length">
          <p class="nav-section">Social</p>
          <template v-for="item in sidebarStore.visibleItems('social')" :key="item.key">
            <button v-if="item.key === 'discovery'" class="nav-item" :class="{ active: route.name === 'discovery' }" @click="go('/discovery')">
              <i class="ti ti-world"></i>Discovery
            </button>
            <button v-else-if="item.key === 'following'" class="nav-item" :class="{ active: route.name === 'following' }" @click="go('/following')">
              <i class="ti ti-rss"></i>Following
            </button>
            <button v-else-if="item.key === 'friends'" class="nav-item" :class="{ active: route.name === 'friends' }" @click="go('/friends')">
              <i class="ti ti-users-group"></i>Freunde
            </button>
            <button v-else-if="item.key === 'users'" class="nav-item" :class="{ active: route.name === 'users' }" @click="go('/users')">
              <i class="ti ti-search"></i>User suchen
            </button>
            <button v-else-if="item.key === 'shared'" class="nav-item" :class="{ active: store.collectionMode === 'shared' && route.name === 'grid' }" @click="selectShared">
              <i class="ti ti-share"></i>Mit mir geteilt
              <span v-if="store.unseenShares" class="nav-badge">{{ store.unseenShares }}</span>
            </button>
          </template>
        </template>

        <!-- Eigene Filter -->
        <template v-if="section === 'custom_filters'">
          <div class="nav-section-row">
            <p class="nav-section">Eigene Filter</p>
          </div>
          <button
            v-for="cf in sidebarStore.customFilters" :key="cf.id"
            class="nav-item custom-filter-row" :class="{ active: isCustomFilterActive(cf) }"
            @click="applyCustomFilter(cf)"
            @contextmenu.prevent="openCustomFilterMenu(cf, $event)"
          >
            <i class="ti ti-filter"></i>
            <span class="custom-filter-name">{{ cf.name }}</span>
            <button class="custom-filter-menu-btn" @click.stop="openCustomFilterMenu(cf, $event)">
              <i class="ti ti-dots-vertical"></i>
            </button>
          </button>
          <button class="nav-item nav-item-add" @click="openCustomFilterModal(null)">
            <i class="ti ti-plus"></i>Neuer Filter-Tab
          </button>
        </template>
      </template>

      <template v-if="authStore.isAdmin">
        <p class="nav-section">Verwaltung</p>
        <button class="nav-item" @click="goAdminQuotes">
          <i class="ti ti-quote"></i>Zitate
        </button>
      </template>
    </nav>

    <button v-if="showAddBtn" class="add-btn" @click="add">
      <i class="ti ti-book-plus"></i>Neues Rezept
    </button>
    <button class="logout-btn" @click="goSidebarEdit">
      <i class="ti ti-settings"></i>Sidebar anpassen
    </button>
    <button class="logout-btn" @click="goProfile">
      <i class="ti ti-user-circle"></i>Mein Profil
    </button>
    <button class="logout-btn" @click="logout">
      <i class="ti ti-logout"></i>Abmelden
    </button>
  </aside>

  <!-- Custom Filter Kontextmenü -->
  <div v-if="menuFilter" class="ctx-menu" :style="menuStyle" @click.stop>
    <button @click="openCustomFilterModal(menuFilter)"><i class="ti ti-pencil"></i>Bearbeiten</button>
    <button @click="moveFilter('up')"><i class="ti ti-arrow-up"></i>Nach oben</button>
    <button @click="moveFilter('down')"><i class="ti ti-arrow-down"></i>Nach unten</button>
    <button class="ctx-danger" @click="removeFilter"><i class="ti ti-trash"></i>Löschen</button>
  </div>
  <div v-if="menuFilter" class="ctx-backdrop" @click="closeMenu"></div>

  <!-- Custom Filter Modal -->
  <div v-if="filterModalOpen" class="modal-overlay" @click.self="filterModalOpen = false">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ editingFilter ? 'Filter bearbeiten' : 'Neuer Filter-Tab' }}</h3>
        <button class="btn-icon" @click="filterModalOpen = false"><i class="ti ti-x"></i></button>
      </div>
      <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">
        <div class="form-group" style="margin:0">
          <label class="form-label">Name</label>
          <input class="form-input" v-model="filterForm.name" placeholder="z.B. Schnelle Wochentags-Rezepte">
        </div>

        <div class="form-group" style="margin:0">
          <label class="form-label">Kategorien</label>
          <div class="custom-filter-checks">
            <label v-for="cat in CATEGORIES" :key="cat" class="filter-opt">
              <input type="checkbox" :value="cat" v-model="filterForm.categories"> {{ cat }}
            </label>
          </div>
        </div>

        <div class="form-group" style="margin:0">
          <label class="form-label">Saison</label>
          <div class="custom-filter-checks">
            <label v-for="s in SEASONS" :key="s.value" class="filter-opt">
              <input type="checkbox" :value="s.value" v-model="filterForm.seasons"> {{ s.emoji }} {{ s.value }}
            </label>
          </div>
        </div>

        <div class="form-group" style="margin:0">
          <label class="form-label">Tags</label>
          <div class="modal-tag-group">
            <p v-if="!store.allTags.length" class="filter-empty">Noch keine Tags vorhanden.</p>
            <button
              v-for="t in store.allTags" :key="t" type="button"
              class="modal-tag-pill" :class="{ active: filterForm.tags.includes(t) }"
              @click="toggleFilterTag(t)"
            >{{ t }}</button>
          </div>
        </div>

        <label class="filter-opt">
          <input type="checkbox" v-model="filterForm.favorites_only"> Nur Favoriten
        </label>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" @click="filterModalOpen = false">Abbrechen</button>
        <button class="btn-save" @click="saveCustomFilter" :disabled="!filterForm.name.trim()">
          <i class="ti ti-check"></i>{{ editingFilter ? 'Speichern' : 'Erstellen' }}
        </button>
      </div>
    </div>
  </div>

  <!-- "Als Tab speichern" Toast-Link (erscheint wenn aktive Filter vorhanden) -->
  <div v-if="showSaveFilterHint && !filterModalOpen" class="save-filter-hint" @click="saveCurrentAsFilter">
    <i class="ti ti-filter-plus"></i> Filterkombination als Tab speichern
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRecipeStore } from '../stores/recipes'
import { useAuthStore } from '../stores/auth'
import { useSidebarStore } from '../stores/sidebar'
import { signOut } from '../lib/supabase'

defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])

const router = useRouter()
const route = useRoute()
const store = useRecipeStore()
const authStore = useAuthStore()
const sidebarStore = useSidebarStore()

const CATEGORIES = ['Frühstück', 'Hauptgericht', 'Dessert', 'Backen', 'Snack', 'Sonstiges']
const SEASONS = [
  { value: 'Frühling', emoji: '🌱' },
  { value: 'Sommer', emoji: '☀️' },
  { value: 'Herbst', emoji: '🍂' },
  { value: 'Winter', emoji: '❄️' },
]

const NO_ADD_VIEWS = ['favorites', 'saved', 'shared']
const NO_ADD_ROUTES = ['discovery', 'following', 'friends', 'users', 'profile', 'profile-edit']

const showAddBtn = computed(() => {
  if (NO_ADD_ROUTES.includes(route.name)) return false
  if (route.name === 'grid' && NO_ADD_VIEWS.includes(store.collectionMode)) return false
  return true
})

onMounted(async () => {
  if (authStore.userId && !sidebarStore.loaded) {
    await sidebarStore.load(authStore.userId)
  }
})
watch(() => authStore.userId, async (id) => {
  if (id && !sidebarStore.loaded) await sidebarStore.load(id)
})

// ── Navigation helpers ────────────────────────

function isMainActive(item) {
  if (route.name !== 'grid') return false
  if (store.adminMode === 'admin') return false
  return store.collectionMode === item.key
}

function isCategoryActive(item) {
  if (route.name !== 'grid') return false
  if (store.adminMode === 'admin') return false
  const cat = item.key.replace('category:', '')
  return store.activeCategories.length === 1 && store.activeCategories[0] === cat
}

function isCustomFilterActive(cf) {
  if (route.name !== 'grid') return false
  // Active if all filter arrays match
  const eq = (a, b) => a.length === b.length && a.every(v => b.includes(v))
  return (
    eq(store.activeCategories, cf.categories || []) &&
    eq(store.activeSeasons, cf.seasons || []) &&
    eq(store.activeTags, cf.tags || [])
  )
}

async function selectMainItem(item) {
  store.setCategories([])
  store.setFilter('')
  store.collectionMode = item.key
  store.adminMode = 'user'
  if (router.currentRoute.value.name !== 'grid') router.push('/')
  await store.load()
  if (window.innerWidth <= 700) emit('close')
}

async function selectAdminView() {
  store.setFilter('')
  store.setCategories([])
  store.adminMode = 'admin'
  if (router.currentRoute.value.name !== 'grid') router.push('/')
  await store.load()
  if (window.innerWidth <= 700) emit('close')
}

function selectCategory(cat) {
  store.setCategories([cat])
  store.setFilter('')
  store.collectionMode = 'all'
  store.adminMode = 'user'
  if (router.currentRoute.value.name !== 'grid') router.push('/')
  store.load()
  if (window.innerWidth <= 700) emit('close')
}

async function selectShared() {
  store.setCategories([])
  store.setFilter('')
  store.collectionMode = 'shared'
  store.adminMode = 'user'
  if (router.currentRoute.value.name !== 'grid') router.push('/')
  await store.load()
  if (window.innerWidth <= 700) emit('close')
}

function applyCustomFilter(cf) {
  store.setCategories(cf.categories || [])
  store.setSeasons(cf.seasons || [])
  store.setTags(cf.tags || [])
  if (cf.favorites_only) store.setFilter('__fav__')
  else store.setFilter('')
  store.collectionMode = 'all'
  store.adminMode = 'user'
  if (router.currentRoute.value.name !== 'grid') router.push('/')
  store.load()
  if (window.innerWidth <= 700) emit('close')
}

function add() { router.push('/add'); emit('close') }
function go(path) { router.push(path); emit('close') }
function goProfile() { if (authStore.username) router.push(`/profile/${authStore.username}`); emit('close') }
function goSidebarEdit() { router.push('/sidebar/edit'); emit('close') }
function goAdminQuotes() { router.push('/admin/quotes'); emit('close') }
async function logout() { await signOut(); router.push('/login'); emit('close') }

// ── Custom Filter Modal ───────────────────────

const filterModalOpen = ref(false)
const editingFilter = ref(null)
const filterForm = reactive({ name: '', categories: [], seasons: [], tags: [], favorites_only: false })

function openCustomFilterModal(cf) {
  closeMenu()
  editingFilter.value = cf
  filterForm.name = cf?.name || ''
  filterForm.categories = [...(cf?.categories || [])]
  filterForm.seasons = [...(cf?.seasons || [])]
  filterForm.tags = [...(cf?.tags || [])]
  filterForm.favorites_only = cf?.favorites_only || false
  filterModalOpen.value = true
}

function toggleFilterTag(t) {
  const idx = filterForm.tags.indexOf(t)
  if (idx === -1) filterForm.tags.push(t)
  else filterForm.tags.splice(idx, 1)
}

async function saveCustomFilter() {
  if (!filterForm.name.trim()) return
  const fields = {
    name: filterForm.name.trim(),
    categories: [...filterForm.categories],
    seasons: [...filterForm.seasons],
    tags: [...filterForm.tags],
    favorites_only: filterForm.favorites_only,
  }
  if (editingFilter.value) {
    await sidebarStore.editCustomFilter(editingFilter.value.id, fields)
  } else {
    await sidebarStore.addCustomFilter(authStore.userId, fields)
  }
  filterModalOpen.value = false
}

// "Als Tab speichern" wenn aktive Filter vorhanden
const showSaveFilterHint = computed(() => {
  return route.name === 'grid' &&
    (store.activeCategories.length || store.activeSeasons.length || store.activeTags.length)
})

function saveCurrentAsFilter() {
  openCustomFilterModal(null)
  filterForm.categories = [...store.activeCategories]
  filterForm.seasons = [...store.activeSeasons]
  filterForm.tags = [...store.activeTags]
}

// ── Custom Filter Kontextmenü ─────────────────

const menuFilter = ref(null)
const menuStyle = ref({})

function openCustomFilterMenu(cf, e) {
  menuFilter.value = cf
  menuStyle.value = { top: `${e.clientY}px`, left: `${e.clientX}px` }
}
function closeMenu() { menuFilter.value = null }
async function removeFilter() {
  if (!menuFilter.value) return
  await sidebarStore.removeCustomFilter(menuFilter.value.id)
  closeMenu()
}
async function moveFilter(dir) {
  if (!menuFilter.value) return
  await sidebarStore.moveCustomFilter(authStore.userId, menuFilter.value.id, dir)
  closeMenu()
}
</script>
