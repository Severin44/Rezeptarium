<template>
  <div class="view active">
    <div class="page-hero">
      <div class="hero-eyebrow">meine Schatzkammer</div>
      <h1 class="hero-title">Das <em>Rezeptarium</em></h1>
      <div class="ornament-rule"><div class="rule-line"></div><div class="rule-diamond"></div><div class="rule-line"></div></div>
    </div>

    <QuoteBanner />

    <div class="toolbar">
      <div class="search-box">
        <i class="ti ti-search" aria-hidden="true"></i>
        <input type="text" v-model="search" placeholder="Im Rezeptarium suchen…">
      </div>

      <div class="filter-drop desktop-only">
        <button class="filter-btn" type="button" @click.stop="toggleSeasonPanel">
          <i class="ti ti-sun" aria-hidden="true"></i>
          <span>{{ seasonLabel }}</span>
          <i class="ti ti-chevron-down" aria-hidden="true"></i>
        </button>
        <div class="filter-panel" v-if="seasonPanelOpen" @click.stop>
          <label v-for="s in SEASONS" :key="s.value" class="filter-opt">
            <input type="checkbox" :checked="store.activeSeasons.includes(s.value)" @change="toggleDesktopSeason(s.value)">
            {{ s.emoji }} {{ s.value }}
          </label>
        </div>
      </div>

      <div class="filter-drop desktop-only">
        <button class="filter-btn" type="button" @click.stop="toggleTagPanel">
          <i class="ti ti-tag" aria-hidden="true"></i>
          <span>{{ tagLabel }}</span>
          <i class="ti ti-chevron-down" aria-hidden="true"></i>
        </button>
        <div class="filter-panel" v-if="tagPanelOpen" @click.stop>
          <p v-if="!store.allTags.length" class="filter-empty">Noch keine Tags vorhanden.</p>
          <label v-for="t in store.allTags" :key="t" class="filter-opt">
            <input type="checkbox" :checked="store.activeTags.includes(t)" @change="toggleDesktopTag(t)"> {{ t }}
          </label>
        </div>
      </div>

      <select class="sort-select desktop-only" v-model="sort">
        <option value="newest">Neueste zuerst</option>
        <option value="az">A – Z</option>
        <option value="time">Schnellste zuerst</option>
      </select>

      <button class="filter-btn mobile-only" type="button" @click="openFilterModal">
        <i class="ti ti-adjustments-horizontal" aria-hidden="true"></i>
        <span>{{ filterModalLabel }}</span>
      </button>

      <button class="add-btn-inline desktop-only" @click="router.push('/add')">
        <i class="ti ti-book-plus"></i>Eintrag
      </button>
    </div>

    <!-- Filter-Modal (Mobile) -->
    <div class="filter-modal-overlay" v-if="filterModalOpen" @click="closeFilterModal"></div>
    <div class="filter-modal" v-if="filterModalOpen">
      <div class="filter-modal-header">
        <span class="filter-modal-title">Filter &amp; Sortierung</span>
        <button class="filter-modal-close" type="button" @click="closeFilterModal"><i class="ti ti-x"></i></button>
      </div>

      <div class="filter-modal-section">
        <p class="filter-modal-label">Saison</p>
        <div class="modal-season-group">
          <label v-for="s in SEASONS" :key="s.value" class="season-check">
            <input type="checkbox" v-model="modalSeasons" :value="s.value">
            <span>{{ s.emoji }} {{ s.value }}</span>
          </label>
        </div>
      </div>

      <div class="filter-modal-section">
        <p class="filter-modal-label">Tags</p>
        <div class="modal-tag-group">
          <p v-if="!store.allTags.length" class="filter-empty">Noch keine Tags vorhanden.</p>
          <button
            v-for="t in store.allTags" :key="t" type="button"
            class="modal-tag-pill" :class="{ active: modalTags.includes(t) }"
            @click="toggleModalTag(t)"
          >{{ t }}</button>
        </div>
      </div>

      <div class="filter-modal-section">
        <p class="filter-modal-label">Sortierung</p>
        <div class="modal-sort-group">
          <label class="modal-sort-opt"><input type="radio" value="newest" v-model="modalSort"> Neueste zuerst</label>
          <label class="modal-sort-opt"><input type="radio" value="az" v-model="modalSort"> A – Z</label>
          <label class="modal-sort-opt"><input type="radio" value="time" v-model="modalSort"> Schnellste zuerst</label>
        </div>
      </div>

      <div class="filter-modal-footer">
        <button class="btn-cancel" type="button" @click="resetFilterModal">Zurücksetzen</button>
        <button class="btn-save" type="button" @click="applyFilterModal"><i class="ti ti-check"></i>Anwenden</button>
      </div>
    </div>

    <div class="recipe-grid">
      <RecipeCard
        v-for="r in store.filteredList" :key="r.id" :recipe="r"
        @click="router.push(`/recipe/${r.id}`)"
      />
      <div v-if="!store.filteredList.length" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style="margin-bottom:12px">
          <rect x="4" y="6" width="28" height="36" rx="3" fill="#f5ede0" stroke="#c4a882" stroke-width="1.2"/>
          <rect x="6" y="8" width="28" height="36" rx="3" fill="#fffdf8" stroke="#c4a882" stroke-width="1"/>
          <rect x="6" y="8" width="5"  height="36" rx="2" fill="#c4a882" opacity=".4"/>
          <line x1="16" y1="18" x2="30" y2="18" stroke="#c4a882" stroke-width="1"/>
          <line x1="16" y1="22" x2="30" y2="22" stroke="#c4a882" stroke-width="1"/>
          <line x1="16" y1="26" x2="24" y2="26" stroke="#c4a882" stroke-width="1"/>
        </svg>
        <p class="empty-title">Noch keine Einträge</p>
        <p class="empty-sub">Füge dein erstes Rezept hinzu.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecipeStore } from '../../stores/recipes'
import QuoteBanner from '../../components/QuoteBanner.vue'
import RecipeCard from '../../components/RecipeCard.vue'

const router = useRouter()
const store = useRecipeStore()

const SEASONS = [
  { value: 'Frühling', emoji: '🌱' },
  { value: 'Sommer', emoji: '☀️' },
  { value: 'Herbst', emoji: '🍂' },
  { value: 'Winter', emoji: '❄️' },
]

const search = computed({ get: () => store.searchQuery, set: v => store.setSearch(v.toLowerCase()) })
const sort = computed({ get: () => store.sortOrder, set: v => store.setSort(v) })

const seasonLabel = computed(() => store.activeSeasons.length ? store.activeSeasons.join(', ') : 'Saison')
const tagLabel = computed(() => store.activeTags.length ? `Tags (${store.activeTags.length})` : 'Tags')
const filterModalLabel = computed(() => {
  const total = store.activeSeasons.length + store.activeTags.length
  return total ? `Filter (${total})` : 'Filter'
})

// ── Desktop-Dropdowns ──
const seasonPanelOpen = ref(false)
const tagPanelOpen = ref(false)
function toggleSeasonPanel() { tagPanelOpen.value = false; seasonPanelOpen.value = !seasonPanelOpen.value }
function toggleTagPanel() { seasonPanelOpen.value = false; tagPanelOpen.value = !tagPanelOpen.value }
function closeAllPanels() { seasonPanelOpen.value = false; tagPanelOpen.value = false }
function toggleDesktopSeason(v) {
  const set = new Set(store.activeSeasons)
  set.has(v) ? set.delete(v) : set.add(v)
  store.setSeasons([...set])
}
function toggleDesktopTag(t) {
  const set = new Set(store.activeTags)
  set.has(t) ? set.delete(t) : set.add(t)
  store.setTags([...set])
}
onMounted(() => document.addEventListener('click', closeAllPanels))
onUnmounted(() => document.removeEventListener('click', closeAllPanels))

// ── Mobile Filter-Modal ──
const filterModalOpen = ref(false)
const modalSeasons = ref([])
const modalTags = ref([])
const modalSort = ref('newest')

function openFilterModal() {
  modalSeasons.value = [...store.activeSeasons]
  modalTags.value = [...store.activeTags]
  modalSort.value = store.sortOrder
  filterModalOpen.value = true
  document.body.style.overflow = 'hidden'
}
function closeFilterModal() {
  filterModalOpen.value = false
  document.body.style.overflow = ''
}
function toggleModalTag(t) {
  modalTags.value = modalTags.value.includes(t) ? modalTags.value.filter(x => x !== t) : [...modalTags.value, t]
}
function applyFilterModal() {
  store.setSeasons([...modalSeasons.value])
  store.setTags([...modalTags.value])
  store.setSort(modalSort.value)
  closeFilterModal()
}
function resetFilterModal() {
  modalSeasons.value = []
  modalTags.value = []
  modalSort.value = 'newest'
}

onMounted(() => { if (!store.loaded) store.load() })
</script>
