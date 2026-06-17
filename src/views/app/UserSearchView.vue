<template>
  <div class="view active">
    <div class="page-hero">
      <div class="hero-eyebrow">andere finden</div>
      <h1 class="hero-title">🔍 <em>User suchen</em></h1>
      <div class="ornament-rule"><div class="rule-line"></div><div class="rule-diamond"></div><div class="rule-line"></div></div>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <i class="ti ti-search" aria-hidden="true"></i>
        <input type="text" v-model="query" placeholder="Benutzername eingeben…" @input="onSearch">
      </div>
    </div>

    <div class="user-list">
      <div v-if="!query" class="empty-state">
        <p class="empty-sub">Gib einen Benutzernamen ein, um andere zu finden.</p>
      </div>
      <div v-else-if="searched && !results.length" class="empty-state">
        <p class="empty-sub">Keine User mit diesem Namen gefunden.</p>
      </div>

      <div v-for="u in results" :key="u.id" class="user-row">
        <UserAvatar
          :username="u.username" :avatar-url="u.avatar_url" :avatar-color="u.avatar_color"
          size="md" class="clickable" @click="router.push(`/profile/${u.username}`)"
        />
        <div class="user-row-info" @click="router.push(`/profile/${u.username}`)">
          <div class="user-row-name">{{ u.username }}</div>
          <div v-if="u.bio" class="user-row-bio">{{ u.bio }}</div>
        </div>
        <button
          class="btn-follow btn-sm" :class="{ following: u.isFollowing }"
          @click.stop="toggleFollow(u)"
        >
          <i :class="u.isFollowing ? 'ti ti-user-check' : 'ti ti-user-plus'"></i>
          {{ u.isFollowing ? 'Folgt' : 'Folgen' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { searchUsers, getMyFollowingIds, followUser, unfollowUser } from '../../lib/supabase'
import UserAvatar from '../../components/UserAvatar.vue'
import { showToast } from '../../lib/toast'

const router = useRouter()
const authStore = useAuthStore()

const query = ref('')
const results = ref([])
const searched = ref(false)
let debounceTimer = null

async function onSearch() {
  clearTimeout(debounceTimer)
  if (!query.value.trim()) { results.value = []; searched.value = false; return }
  debounceTimer = setTimeout(async () => {
    try {
      const users = await searchUsers(query.value.trim(), authStore.userId)
      const followingIds = await getMyFollowingIds(authStore.userId)
      const followingSet = new Set(followingIds)
      results.value = users.map(u => ({ ...u, isFollowing: followingSet.has(u.id) }))
      searched.value = true
    } catch (e) {
      showToast('Fehler bei der Suche.', 'error')
    }
  }, 300)
}

async function toggleFollow(user) {
  try {
    if (user.isFollowing) {
      await unfollowUser(authStore.userId, user.id)
      user.isFollowing = false
    } else {
      await followUser(authStore.userId, user.id)
      user.isFollowing = true
    }
  } catch (e) {
    showToast('Fehler.', 'error')
  }
}
</script>
