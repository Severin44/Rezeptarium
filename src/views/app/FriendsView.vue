<template>
  <div class="view active">
    <div class="page-hero">
      <div class="hero-eyebrow">Rezepte von</div>
      <h1 class="hero-title">🤝 <em>Freunde</em></h1>
      <div class="ornament-rule"><div class="rule-line"></div><div class="rule-diamond"></div><div class="rule-line"></div></div>
    </div>

    <div v-if="loaded && !recipes.length" class="empty-state">
      <p class="empty-title">Noch keine gegenseitigen Follows</p>
      <p class="empty-sub">Folge jemandem zurück (oder warte, bis jemand dir zurückfolgt), um hier Freundes-Rezepte zu sehen.</p>
      <button class="btn-save" style="margin-top:16px" @click="router.push('/users')">
        <i class="ti ti-search"></i>User suchen
      </button>
    </div>

    <template v-else>
      <div class="toolbar">
        <div class="search-box">
          <i class="ti ti-search" aria-hidden="true"></i>
          <input type="text" v-model="search" placeholder="Freundes-Rezepte durchsuchen…">
        </div>
        <select class="sort-select desktop-only" v-model="sort">
          <option value="newest">Neueste zuerst</option>
          <option value="popular">Beliebteste</option>
        </select>
      </div>

      <div class="recipe-grid">
        <RecipeCard
          v-for="r in filteredSorted" :key="r.id" :recipe="r"
          :creator-name="authStore.usernameById(r.user_id)"
          :show-like="r.visibility !== 'private'"
          :liked="likedIds.has(r.id)"
          :like-count="likeCounts.get(r.id) || 0"
          :avg-rating="ratingAvgs.get(r.id) || 0"
          @click="router.push(`/recipe/${r.id}`)"
          @toggle-like="toggleLike(r)"
        />
        <div v-if="loaded && !filteredSorted.length && search" class="empty-state">
          <p class="empty-title">Keine Treffer</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { getFriendsFeed, getLikesForRecipeIds, getRatingsForRecipeIds, likeRecipe, unlikeRecipe } from '../../lib/supabase'
import RecipeCard from '../../components/RecipeCard.vue'
import { showToast } from '../../lib/toast'

const router = useRouter()
const authStore = useAuthStore()

const recipes = ref([])
const loaded = ref(false)
const search = ref('')
const sort = ref('newest')
const likeCounts = ref(new Map())
const likedIds = ref(new Set())
const ratingAvgs = ref(new Map())

const filteredSorted = computed(() => {
  let list = [...recipes.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(r => r.name?.toLowerCase().includes(q) || (r.tags || []).some(t => t.toLowerCase().includes(q)))
  }
  if (sort.value === 'popular') list.sort((a, b) => (likeCounts.value.get(b.id) || 0) - (likeCounts.value.get(a.id) || 0))
  else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return list
})

async function load() {
  if (!authStore.loaded) await authStore.load()
  recipes.value = await getFriendsFeed(authStore.userId)
  const ids = recipes.value.map(r => r.id)
  if (ids.length) {
    const [likes, ratings] = await Promise.all([getLikesForRecipeIds(ids), getRatingsForRecipeIds(ids)])
    const counts = new Map(), liked = new Set()
    for (const l of likes) {
      counts.set(l.recipe_id, (counts.get(l.recipe_id) || 0) + 1)
      if (l.user_id === authStore.userId) liked.add(l.recipe_id)
    }
    likeCounts.value = counts
    likedIds.value = liked
    const sums = new Map(), tally = new Map()
    for (const r of ratings) {
      sums.set(r.recipe_id, (sums.get(r.recipe_id) || 0) + r.score)
      tally.set(r.recipe_id, (tally.get(r.recipe_id) || 0) + 1)
    }
    const avgs = new Map()
    for (const [id, sum] of sums) avgs.set(id, sum / tally.get(id))
    ratingAvgs.value = avgs
  }
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
  } catch (e) { showToast('Fehler beim Liken.', 'error') }
}

onMounted(load)
</script>
