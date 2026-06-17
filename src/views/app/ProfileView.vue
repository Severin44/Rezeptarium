<template>
  <div class="view active">
    <button class="back-link" @click="router.back()"><i class="ti ti-arrow-left"></i>zurück</button>

    <div v-if="profile" class="profile-page">
      <div class="profile-header">
        <UserAvatar :username="profile.username" :avatar-url="profile.avatar_url" :avatar-color="profile.avatar_color" size="xl" />
        <div class="profile-info">
          <h2 class="profile-username">{{ profile.username }}</h2>
          <p v-if="profile.bio" class="profile-bio">{{ profile.bio }}</p>
          <div class="profile-stats">
            <span><strong>{{ recipeCount }}</strong> Rezepte</span>
            <span><strong>{{ followerCount }}</strong> Follower</span>
            <span><strong>{{ followingCount }}</strong> Folgt</span>
          </div>
        </div>
      </div>

      <div class="profile-actions">
        <template v-if="isOwnProfile">
          <button class="btn-follow" @click="router.push('/profile/edit')"><i class="ti ti-edit"></i>Profil bearbeiten</button>
        </template>
        <template v-else>
          <button class="btn-follow" :class="{ following: iFollow }" @click="toggleFollow">
            <i :class="iFollow ? 'ti ti-user-check' : 'ti ti-user-plus'"></i>
            {{ iFollow ? 'Entfolgen' : 'Folgen' }}
          </button>
        </template>
      </div>

      <div class="profile-tabs">
        <button class="tab-btn" :class="{ active: tab === 'public' }" @click="tab = 'public'">
          <i class="ti ti-world"></i>Öffentlich
        </button>
        <button v-if="canSeeFriends" class="tab-btn" :class="{ active: tab === 'friends' }" @click="tab = 'friends'">
          <i class="ti ti-users"></i>Für Freunde
        </button>
      </div>

      <div class="recipe-grid">
        <RecipeCard
          v-for="r in recipes" :key="r.id" :recipe="r"
          :show-like="r.visibility === 'public'"
          :liked="likedIds.has(r.id)"
          :like-count="likeCounts.get(r.id) || 0"
          :avg-rating="ratingAvgs.get(r.id) || 0"
          @click="router.push(`/recipe/${r.id}`)"
          @toggle-like="toggleLike(r)"
        />
        <div v-if="loaded && !recipes.length" class="empty-state">
          <p class="empty-title">Keine Rezepte hier</p>
          <p class="empty-sub">{{ tab === 'friends' ? 'Noch keine Freundes-Rezepte geteilt.' : 'Noch keine öffentlichen Rezepte.' }}</p>
        </div>
      </div>
    </div>

    <div v-else-if="notFound" class="empty-state">
      <p class="empty-title">Profil nicht gefunden</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import {
  getProfileByUsername, getProfileRecipes,
  getFollowerCount, getFollowingCount, isFollowing, followUser, unfollowUser, areFriends,
  getLikesForRecipeIds, getRatingsForRecipeIds, likeRecipe, unlikeRecipe,
} from '../../lib/supabase'
import RecipeCard from '../../components/RecipeCard.vue'
import UserAvatar from '../../components/UserAvatar.vue'
import { showToast } from '../../lib/toast'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const profile = ref(null)
const notFound = ref(false)
const tab = ref('public')
const recipes = ref([])
const loaded = ref(false)
const recipeCount = ref(0)
const followerCount = ref(0)
const followingCount = ref(0)
const iFollow = ref(false)
const canSeeFriends = ref(false)

const likeCounts = ref(new Map())
const likedIds = ref(new Set())
const ratingAvgs = ref(new Map())

const isOwnProfile = computed(() => profile.value?.id === authStore.userId)

async function loadProfile() {
  notFound.value = false
  loaded.value = false
  recipes.value = []
  try {
    profile.value = await getProfileByUsername(route.params.username)
    if (!profile.value) { notFound.value = true; return }

    const [fc, fgc, following] = await Promise.all([
      getFollowerCount(profile.value.id),
      getFollowingCount(profile.value.id),
      isOwnProfile.value ? Promise.resolve(false) : isFollowing(authStore.userId, profile.value.id),
    ])
    followerCount.value = fc
    followingCount.value = fgc
    iFollow.value = following

    canSeeFriends.value = isOwnProfile.value || await areFriends(authStore.userId, profile.value.id)

    await loadRecipes()
  } catch (e) {
    showToast('Profil konnte nicht geladen werden.', 'error')
  }
}

async function loadRecipes() {
  loaded.value = false
  recipes.value = await getProfileRecipes(profile.value.id, tab.value)
  recipeCount.value = recipes.value.length

  const ids = recipes.value.map(r => r.id)
  if (ids.length) {
    const [likes, ratings] = await Promise.all([
      getLikesForRecipeIds(ids),
      getRatingsForRecipeIds(ids),
    ])
    const counts = new Map()
    const liked = new Set()
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

async function toggleFollow() {
  try {
    if (iFollow.value) {
      await unfollowUser(authStore.userId, profile.value.id)
      iFollow.value = false
      followerCount.value--
    } else {
      await followUser(authStore.userId, profile.value.id)
      iFollow.value = true
      followerCount.value++
    }
    canSeeFriends.value = isOwnProfile.value || await areFriends(authStore.userId, profile.value.id)
  } catch (e) {
    showToast('Fehler.', 'error')
  }
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

watch(() => route.params.username, loadProfile)
watch(tab, loadRecipes)
onMounted(loadProfile)
</script>
