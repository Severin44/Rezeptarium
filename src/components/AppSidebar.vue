<template>
  <aside class="sidebar" :class="{ open, 'sidebar-edit-active': editMode }">
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

      <!-- ── EDIT MODE ─────────────────────────── -->
      <template v-if="editMode">
        <p class="nav-section edit-mode-hint"><i class="ti ti-drag-drop"></i>Ziehen zum Sortieren</p>

        <Draggable
          v-model="editSections"
          item-key="self"
          :item-key-fn="s => s"
          handle=".section-drag-handle"
          animation="180"
          @end="onSectionDragEnd"
        >
          <template #item="{ element: section }">
            <div class="edit-section-block" v-if="section !== 'custom_filters' || sidebarStore.customFilters.length">

              <!-- Section header with drag handle -->
              <div class="nav-section edit-section-header">
                <i class="ti ti-grip-vertical section-drag-handle"></i>
                {{ SECTION_LABELS[section] }}
              </div>

              <!-- Draggable visible items -->
              <Draggable
                v-model="editVisible[section]"
                :item-key="i => i.key"
                :group="section"
                handle=".item-drag-handle"
                animation="150"
                @end="onItemDragEnd(section)"
              >
                <template #item="{ element: item }">
                  <div class="nav-item edit-nav-item">
                    <i class="ti ti-grip-vertical item-drag-handle"></i>
                    <i :class="`ti ti-${item.icon}`"></i>
                    <span class="edit-item-label">{{ item.label }}</span>
                    <button class="vis-toggle vis-hide" title="Ausblenden" @click="hideItem(section, item)">
                      <i class="ti ti-minus"></i>
                    </button>
                  </div>
                </template>
              </Draggable>

              <!-- Hidden items (grayed, at bottom, not draggable) -->
              <div
                v-for="item in editHidden[section]" :key="item.key"
                class="nav-item edit-nav-item edit-item-hidden"
              >
                <i class="ti ti-grip-vertical" style="opacity:.2"></i>
                <i :class="`ti ti-${item.icon}`"></i>
                <span class="edit-item-label">{{ item.label }}</span>
                <button class="vis-toggle vis-show" title="Einblenden" @click="showItem(section, item)">
                  <i class="ti ti-plus"></i>
                </button>
              </div>

            </div>
          </template>
        </Draggable>

        <!-- Admin always fixed -->
        <template v-if="authStore.isAdmin">
          <p class="nav-section">Verwaltung</p>
          <div class="nav-item edit-nav-item edit-item-fixed">
            <i class="ti ti-lock" style="opacity:.3;font-size:11px"></i>
            <i class="ti ti-shield-check"></i>Admin: Alle Rezepte
          </div>
        </template>
      </template>

      <!-- ── NORMAL MODE ───────────────────────── -->
      <template v-else>
        <template v-for="section in sidebarStore.effectiveSections" :key="section">

          <!-- Sammlung -->
          <template v-if="section === 'sammlung' && sidebarStore.visibleItems('sammlung').length">
            <p class="nav-section">Sammlung</p>
            <div v-for="item in sidebarStore.visibleItems('sammlung')" :key="item.key" class="nav-item-wrap">
              <button class="nav-item" :class="{ active: isMainActive(item) }" @click="selectMainItem(item)">
                <i :class="`ti ti-${item.icon}`"></i>{{ item.label }}
                <span v-if="item.key === 'mine'" class="nav-count">{{ store.countMine }}</span>
              </button>
              <button class="nav-opts-btn" @click.stop="openItemMenu(item, 'sammlung', $event)">
                <i class="ti ti-dots-vertical"></i>
              </button>
            </div>
            <button v-if="authStore.isAdmin" class="nav-item" :class="{ active: store.adminMode === 'admin' }" @click="selectAdminView">
              <i class="ti ti-shield-check"></i>Admin: Alle Rezepte
            </button>
          </template>

          <!-- Kapitel -->
          <template v-if="section === 'kapitel' && sidebarStore.visibleItems('kapitel').length">
            <p class="nav-section">Kapitel</p>
            <div v-for="item in sidebarStore.visibleItems('kapitel')" :key="item.key" class="nav-item-wrap">
              <button class="nav-item" :class="{ active: isCategoryActive(item) }" @click="selectCategory(item.key.replace('category:', ''))">
                <i :class="`ti ti-${item.icon}`"></i>{{ item.label }}
              </button>
              <button class="nav-opts-btn" @click.stop="openItemMenu(item, 'kapitel', $event)">
                <i class="ti ti-dots-vertical"></i>
              </button>
            </div>
          </template>

          <!-- Social -->
          <template v-if="section === 'social' && sidebarStore.visibleItems('social').length">
            <p class="nav-section">Social</p>
            <div v-for="item in sidebarStore.visibleItems('social')" :key="item.key" class="nav-item-wrap">
              <button class="nav-item"
                :class="{ active: isSocialActive(item.key) }"
                @click="selectSocial(item.key)"
              >
                <i :class="`ti ti-${item.icon}`"></i>{{ item.label }}
                <span v-if="item.key === 'shared' && store.unseenShares" class="nav-badge">{{ store.unseenShares }}</span>
              </button>
              <button class="nav-opts-btn" @click.stop="openItemMenu(item, 'social', $event)">
                <i class="ti ti-dots-vertical"></i>
              </button>
            </div>
          </template>

          <!-- Eigene Filter -->
          <template v-if="section === 'custom_filters' && sidebarStore.customFilters.length">
            <p class="nav-section">Eigene Filter</p>
            <div v-for="cf in sidebarStore.customFilters" :key="cf.id" class="nav-item-wrap">
              <button class="nav-item custom-filter-row" :class="{ active: isCustomFilterActive(cf) }"
                @click="applyCustomFilter(cf)"
                @contextmenu.prevent="openItemMenu({ key: `custom:${cf.id}`, _cf: cf }, 'custom_filters', $event)"
              >
                <i class="ti ti-filter"></i>
                <span class="custom-filter-name">{{ cf.name }}</span>
              </button>
              <button class="nav-opts-btn" @click.stop="openItemMenu({ key: `custom:${cf.id}`, _cf: cf }, 'custom_filters', $event)">
                <i class="ti ti-dots-vertical"></i>
              </button>
            </div>
          </template>

        </template>

        <!-- Eigene Filter "+" immer sichtbar -->
        <template v-if="!sidebarStore.effectiveSections.includes('custom_filters') || !sidebarStore.customFilters.length">
          <p class="nav-section">Eigene Filter</p>
        </template>
        <button class="nav-item nav-item-add" @click="openCustomFilterModal(null)">
          <i class="ti ti-plus"></i>Neuer Filter-Tab
        </button>

        <template v-if="authStore.isAdmin">
          <p class="nav-section">Verwaltung</p>
          <button class="nav-item" @click="goAdminQuotes">
            <i class="ti ti-quote"></i>Zitate
          </button>
        </template>
      </template>
    </nav>

    <button v-if="showAddBtn" class="add-btn" @click="add">
      <i class="ti ti-book-plus"></i>Neues Rezept
    </button>
    <button v-if="editMode" class="logout-btn edit-done-btn" @click="exitEditMode">
      <i class="ti ti-check"></i>Fertig
    </button>
    <template v-else>
      <button class="logout-btn" @click="enterEditMode">
        <i class="ti ti-settings"></i>Sidebar anpassen
      </button>
      <button class="logout-btn" @click="goProfile">
        <i class="ti ti-user-circle"></i>Mein Profil
      </button>
      <button class="logout-btn" @click="logout">
        <i class="ti ti-logout"></i>Abmelden
      </button>
    </template>
  </aside>

  <!-- Unified Kontextmenü -->
  <div v-if="activeMenu" class="ctx-menu" :style="activeMenuStyle" @click.stop>
    <template v-if="activeMenu.type === 'custom'">
      <button @click="openCustomFilterModal(activeMenu.cf)"><i class="ti ti-pencil"></i>Bearbeiten</button>
      <button @click="menuMoveFilter('up')"><i class="ti ti-arrow-up"></i>Nach oben</button>
      <button @click="menuMoveFilter('down')"><i class="ti ti-arrow-down"></i>Nach unten</button>
    </template>
    <button @click="menuHideItem"><i class="ti ti-eye-off"></i>Ausblenden</button>
    <template v-if="activeMenu.type === 'custom'">
      <button class="ctx-danger" @click="menuRemoveFilter"><i class="ti ti-trash"></i>Löschen</button>
    </template>
  </div>
  <div v-if="activeMenu" class="ctx-backdrop" @click="closeMenu"></div>

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

  <!-- "Als Tab speichern" Hint -->
  <div v-if="showSaveFilterHint && !filterModalOpen && !editMode" class="save-filter-hint" @click="saveCurrentAsFilter">
    <i class="ti ti-filter-plus"></i> Filterkombination als Tab speichern
  </div>

  <!-- "Filter aktualisieren" Hint -->
  <div v-if="showUpdateFilterHint && !filterModalOpen && !editMode" class="save-filter-hint save-filter-update" @click="updateActiveFilter">
    <i class="ti ti-filter-edit"></i> Filter aktualisieren
  </div>

  <!-- Delete Confirm Modal -->
  <div v-if="deleteConfirmOpen" class="modal-overlay" @click.self="cancelDeleteFilter">
    <div class="modal" style="max-width:340px">
      <div class="modal-header">
        <h3>Filter löschen</h3>
        <button class="btn-icon" @click="cancelDeleteFilter"><i class="ti ti-x"></i></button>
      </div>
      <div class="modal-body">
        <p>„{{ filterToDelete?.name }}" wirklich löschen?</p>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" @click="cancelDeleteFilter">Abbrechen</button>
        <button class="btn-save btn-danger" @click="confirmDeleteFilter">
          <i class="ti ti-trash"></i>Löschen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Draggable from 'vuedraggable'
import { useRecipeStore } from '../stores/recipes'
import { useAuthStore } from '../stores/auth'
import { useSidebarStore, SECTION_LABELS, SIDEBAR_SECTIONS } from '../stores/sidebar'
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

const showAddBtn = computed(() => !editMode.value)

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
  const eq = (a, b) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])
  return (
    eq(store.activeCategories, cf.categories || []) &&
    eq(store.activeSeasons, cf.seasons || []) &&
    eq(store.activeTags, cf.tags || [])
  )
}

async function selectMainItem(item) {
  activeCustomFilterId.value = null
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
  activeCustomFilterId.value = null
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
  activeCustomFilterId.value = cf.id
  store.setCategories(cf.categories || [])
  store.setSeasons(cf.seasons || [])
  store.setTags(cf.tags || [])
  store.setFilter(cf.favorites_only ? '__fav__' : '')
  store.collectionMode = 'all'
  store.adminMode = 'user'
  if (router.currentRoute.value.name !== 'grid') router.push('/')
  store.load()
  if (window.innerWidth <= 700) emit('close')
}

// Social items unified handler
const SOCIAL_ROUTES = {
  discovery: '/discovery', following: '/following', friends: '/friends', users: '/users',
}
function isSocialActive(key) {
  if (key === 'shared') return store.collectionMode === 'shared' && route.name === 'grid'
  return route.name === key
}
function selectSocial(key) {
  activeCustomFilterId.value = null
  if (key === 'shared') { selectShared(); return }
  go(SOCIAL_ROUTES[key])
}

function add() { router.push('/add'); emit('close') }
function go(path) { router.push(path); emit('close') }
function goProfile() { if (authStore.username) router.push(`/profile/${authStore.username}`); emit('close') }
function goAdminQuotes() { router.push('/admin/quotes'); emit('close') }
async function logout() { await signOut(); router.push('/login'); emit('close') }

// ── Custom Filter tracking ────────────────────
const activeCustomFilterId = ref(null)
const deleteConfirmOpen = ref(false)
const filterToDelete = ref(null)

const activeCustomFilter = computed(() =>
  activeCustomFilterId.value
    ? sidebarStore.customFilters.find(f => f.id === activeCustomFilterId.value) ?? null
    : null
)

const filtersMatchActiveCf = computed(() => {
  const cf = activeCustomFilter.value
  if (!cf) return true
  const eq = (a, b) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])
  return (
    eq(store.activeCategories, cf.categories || []) &&
    eq(store.activeSeasons, cf.seasons || []) &&
    eq(store.activeTags, cf.tags || [])
  )
})

const KAPITEL_CATS = ['Frühstück', 'Hauptgericht', 'Dessert', 'Backen', 'Snack', 'Sonstiges']
const hasExtraFilters = computed(() => {
  const { activeCategories: cats, activeSeasons: seasons, activeTags: tags } = store
  if (!cats.length && !seasons.length && !tags.length) return false
  // Single default kapitel category with no extra seasons/tags → not "extra"
  if (cats.length === 1 && KAPITEL_CATS.includes(cats[0]) && !seasons.length && !tags.length) return false
  return true
})

const showUpdateFilterHint = computed(() =>
  route.name === 'grid' && !!activeCustomFilterId.value && !filtersMatchActiveCf.value
)

// ── Edit Mode (inline drag & drop) ───────────

const editMode = ref(false)
const editSections = ref([])   // ordered section keys
const editVisible = reactive({}) // { section: [item, ...] }  — visible, draggable
const editHidden = reactive({})  // { section: [item, ...] }  — hidden, shown grayed at bottom

function enterEditMode() {
  editSections.value = [...sidebarStore.effectiveSections]
  for (const section of SIDEBAR_SECTIONS) {
    const items = sidebarStore.effectiveItems(section)
    editVisible[section] = items.filter(i => i.visible).map(i => ({ ...i }))
    editHidden[section] = items.filter(i => !i.visible).map(i => ({ ...i }))
  }
  editMode.value = true
}

function exitEditMode() {
  editMode.value = false
}

async function onItemDragEnd(section) {
  const allItems = [
    ...editVisible[section].map((item, i) => ({ key: item.key, visible: true, sort_order: i })),
    ...editHidden[section].map((item, i) => ({ key: item.key, visible: false, sort_order: editVisible[section].length + i })),
  ]
  await sidebarStore.saveItemsForSection(authStore.userId, section, allItems)
}

async function onSectionDragEnd() {
  await sidebarStore.saveSectionOrder(authStore.userId, [...editSections.value])
}

function hideItem(section, item) {
  editVisible[section] = editVisible[section].filter(i => i.key !== item.key)
  editHidden[section].push({ ...item, visible: false })
  onItemDragEnd(section)
}

function showItem(section, item) {
  editHidden[section] = editHidden[section].filter(i => i.key !== item.key)
  editVisible[section].push({ ...item, visible: true })
  onItemDragEnd(section)
}

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

const showSaveFilterHint = computed(() =>
  route.name === 'grid' && !activeCustomFilterId.value && hasExtraFilters.value
)

function saveCurrentAsFilter() {
  openCustomFilterModal(null)
  filterForm.categories = [...store.activeCategories]
  filterForm.seasons = [...store.activeSeasons]
  filterForm.tags = [...store.activeTags]
}

// ── Unified Kontextmenü ───────────────────────
// activeMenu = { type: 'regular'|'custom', item, section, cf? }

const activeMenu = ref(null)
const activeMenuStyle = ref({})

function openItemMenu(item, section, e) {
  const isCustom = section === 'custom_filters'
  activeMenu.value = {
    type: isCustom ? 'custom' : 'regular',
    item,
    section,
    cf: isCustom ? item._cf : null,
  }
  // Position: keep menu on screen
  const x = Math.min(e.clientX, window.innerWidth - 170)
  const y = Math.min(e.clientY, window.innerHeight - 150)
  activeMenuStyle.value = { top: `${y}px`, left: `${x}px` }
}

function closeMenu() { activeMenu.value = null }

async function menuHideItem() {
  const { item, section } = activeMenu.value
  await sidebarStore.hideItem(authStore.userId, section, item.key)
  closeMenu()
}

function menuRemoveFilter() {
  const { cf } = activeMenu.value
  if (!cf) return
  filterToDelete.value = cf
  deleteConfirmOpen.value = true
  closeMenu()
}

async function confirmDeleteFilter() {
  await sidebarStore.removeCustomFilter(filterToDelete.value.id)
  if (activeCustomFilterId.value === filterToDelete.value.id) activeCustomFilterId.value = null
  deleteConfirmOpen.value = false
  filterToDelete.value = null
}

function cancelDeleteFilter() {
  deleteConfirmOpen.value = false
  filterToDelete.value = null
}

async function updateActiveFilter() {
  const cf = activeCustomFilter.value
  if (!cf) return
  await sidebarStore.editCustomFilter(cf.id, {
    name: cf.name,
    categories: [...store.activeCategories],
    seasons: [...store.activeSeasons],
    tags: [...store.activeTags],
    favorites_only: store.activeFilter === '__fav__',
  })
  activeCustomFilterId.value = null
}

async function menuMoveFilter(dir) {
  const { cf } = activeMenu.value
  if (!cf) return
  await sidebarStore.moveCustomFilter(authStore.userId, cf.id, dir)
  closeMenu()
}
</script>
