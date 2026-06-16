<template>
  <div class="view active">
    <div class="page-hero">
      <div class="hero-eyebrow">die Sammlung aller</div>
      <h1 class="hero-title">🌍 <em>Discovery</em></h1>
      <div class="ornament-rule"><div class="rule-line"></div><div class="rule-diamond"></div><div class="rule-line"></div></div>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <i class="ti ti-search" aria-hidden="true"></i>
        <input type="text" v-model="search" placeholder="Öffentliche Rezepte durchsuchen…">
      </div>

      <select class="sort-select desktop-only" v-model="category">
        <option value="">Alle Kapitel</option>
        <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
      </select>

      <div class="filter-drop desktop-only">
        <button class="filter-btn" type="button" @click.stop="seasonPanelOpen = !seasonPanelOpen; tagPanelOpen = false">
          <i class="ti ti-sun" aria-hidden="true"></i>
          <span>{{ activeSeasons.length ? activeSeasons.join(', ') : 'Saison' }}</span>
          <i class="ti ti-chevron-down" aria-hidden="true"></i>
        </button>
        <div class="filter-panel" v-if="seasonPanelOpen" @click.stop>
          <label v-for="s in SEASONS" :key="s.value" class="filter-opt">
            <input type="checkbox" v-model="activeSeasons" :value="s.value"> {{ s.emoji }} {{ s.value }}
          </label>
        </div>
      </div>

      <div class="filter-drop desktop-only">
        <button class="filter-btn" type="button" @click.stop="tagPanelOpen = !tagPanelOpen; seasonPanelOpen = false">
          <i class="ti ti-tag" aria-hidden="true"></i>
          <span>{{ activeTags.length ? `Tags (${activeTags.length})` : 'Tags' }}</span>
          <i class="ti ti-chevron-down" aria-hidden="true"></i>
        </button>
        <div class="filter-panel" v-if="tagPanelOpen" @click.stop>
          <p v-if="!allTags.length" class="filter-empty">Noch keine Tags vorhanden.</p>
          <label v-for="t in allTags" :key="t" class="filter-opt">
            <input type="checkbox" v-model="activeTags" :value="t"> {{ t }}
          </label>
        </div>
      </div>

      <select class="sort-select desktop-only" v-model="sort">
        <option value="newest">Neueste zuerst</option>
        <option value="popular">Beliebteste</option>
        <option value="rating">Beste Bewertung</option>
      </select>
    </div>

    <div class="recipe-grid">
      <RecipeCard
        v-for="r in filteredSorted" :key="r.id" :recipe="r"
        :creator-name="authStore.usernameById(r.user_id)"
        show-like
        :liked="likedIds.has(r.id)"
        :like-count="likeCounts.get(r.id) || 0"
        :avg-rating="ratingAvgs.get(r.id) || 0"
        @click="router.push(`/recipe/${r.id}`)"
        @toggle-like="toggleLike(r)"
      />
      <div v-if="loaded && !filteredSorted.length" class="empty-state">
        <p class="empty-title">Noch keine öffentlichen Rezepte</p>
        <p class="empty-sub">Teile dein erstes Rezept im Formular, um es hier zu sehen.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { getDiscoveryRecipes, getLikesForRecipeIds, getRatingsForRecipeIds, likeRecipe, unlikeRecipe } from '../../lib/supabase'
import RecipeCard from '../../components/RecipeCard.vue'
import { showToast } from '../../lib/toast'

const router = useRouter()
const authStore = useAuthStore()

const CATEGORIES = ['Frühstück', 'Hauptgericht', 'Dessert', 'Backen', 'Snack', 'Sonstiges']
const SEASONS = [
  { value: 'Frühling', emoji: '🌱' },
  { value: 'Sommer', emoji: '☀️' },
  { value: 'Herbst', emoji: '🍂' },
  { value: 'Winter', emoji: '❄️' },
]

const recipes = ref([])
const loaded = ref(false)
const search = ref('')
const category = ref('')
const activeSeasons = ref([])
const activeTags = ref([])
const sort = ref('newest')
const seasonPanelOpen = ref(false)
const tagPanelOpen = ref(false)

const likeCounts = ref(new Map())
const likedIds = ref(new Set())
const ratingAvgs = ref(new Map())

const allTags = computed(() => [...new Set(recipes.value.flatMap(r => r.tags || []))].sort())

const filteredSorted = computed(() => {
  let list = [...recipes.value]

  if (category.value) list = list.filter(r => r.category === category.value)
  if (activeSeasons.value.length) list = list.filter(r => activeSeasons.value.some(s => (r.seasons || []).includes(s)))
  if (activeTags.value.length) list = list.filter(r => activeTags.value.every(t => (r.tags || []).includes(t)))
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.ingredients?.toLowerCase().includes(q) ||
      (r.tags || []).some(t => t.toLowerCase().includes(q))
    )
  }

  if (sort.value === 'popular') {
    list.sort((a, b) => (likeCounts.value.get(b.id) || 0) - (likeCounts.value.get(a.id) || 0))
  } else if (sort.value === 'rating') {
    list.sort((a, b) => (ratingAvgs.value.get(b.id) || 0) - (ratingAvgs.value.get(a.id) || 0))
  } else {
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }
  return list
})

async function load() {
  recipes.value = await getDiscoveryRecipes(authStore.userId)
  const ids = recipes.value.map(r => r.id)

  const likes = await getLikesForRecipeIds(ids)
  const counts = new Map()
  const liked = new Set()
  for (const l of likes) {
    counts.set(l.recipe_id, (counts.get(l.recipe_id) || 0) + 1)
    if (l.user_id === authStore.userId) liked.add(l.recipe_id)
  }
  likeCounts.value = counts
  likedIds.value = liked

  const ratings = await getRatingsForRecipeIds(ids)
  const sums = new Map()
  const tally = new Map()
  for (const r of ratings) {
    sums.set(r.recipe_id, (sums.get(r.recipe_id) || 0) + r.score)
    tally.set(r.recipe_id, (tally.get(r.recipe_id) || 0) + 1)
  }
  const avgs = new Map()
  for (const [id, sum] of sums) avgs.set(id, sum / tally.get(id))
  ratingAvgs.value = avgs

  loaded.value = true
}

async function toggleLike(recipe) {
  try {
    if (likedIds.value.has(recipe.id)) {
      await unlikeRecipe(recipe.id, authStore.userId)
      likedIds.value.delete(recipe.id)
      likeCounts.value.set(recipe.id, (likeCounts.value.get(recipe.id) || 1) - 1)
    } else {
      await likeRecipe(recipe.id, authStore.userId)
      likedIds.value.add(recipe.id)
      likeCounts.value.set(recipe.id, (likeCounts.value.get(recipe.id) || 0) + 1)
    }
    likedIds.value = new Set(likedIds.value)
    likeCounts.value = new Map(likeCounts.value)
  } catch (e) {
    showToast('Fehler beim Liken.', 'error')
  }
}

function closePanels() { seasonPanelOpen.value = false; tagPanelOpen.value = false }
onMounted(() => {
  document.addEventListener('click', closePanels)
  if (!authStore.loaded) authStore.load()
  load()
})
onUnmounted(() => document.removeEventListener('click', closePanels))
</script>
