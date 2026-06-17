<template>
  <span class="user-chip" @click.stop="router.push(`/profile/${username}`)" @mouseenter="onHover" @mouseleave="hideTooltip">
    <slot>{{ username }}</slot>
    <Teleport to="body">
      <div
        v-if="tooltipVisible && profile"
        class="profile-tooltip"
        :style="tooltipStyle"
        @mouseenter="cancelHide"
        @mouseleave="hideTooltip"
      >
        <UserAvatar :username="username" :avatar-url="profile.avatar_url" :avatar-color="profile.avatar_color" size="md" />
        <div class="profile-tooltip-info">
          <div class="profile-tooltip-name">{{ username }}</div>
          <div v-if="profile.bio" class="profile-tooltip-bio">{{ profile.bio.slice(0, 80) }}{{ profile.bio.length > 80 ? '…' : '' }}</div>
          <div class="profile-tooltip-count">
            <i class="ti ti-bookmark"></i>
            {{ savedCount }} Rezept{{ savedCount !== 1 ? 'e' : '' }} in deiner Sammlung
          </div>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getProfileByUsername, getSavedCountByUser } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import UserAvatar from './UserAvatar.vue'

const props = defineProps({
  username: { type: String, required: true },
  userId: { type: String, default: '' },
})

const router = useRouter()
const authStore = useAuthStore()

const tooltipVisible = ref(false)
const tooltipStyle = ref({})
const profile = ref(null)
const savedCount = ref(0)
let hideTimer = null
let loaded = false

async function onHover(e) {
  cancelHide()
  const rect = e.currentTarget.getBoundingClientRect()
  tooltipStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
    zIndex: 500,
  }
  tooltipVisible.value = true
  if (!loaded) {
    loaded = true
    try {
      profile.value = await getProfileByUsername(props.username)
      savedCount.value = profile.value
        ? await getSavedCountByUser(authStore.userId, profile.value.id)
        : 0
    } catch {}
  }
}

function hideTooltip() {
  hideTimer = setTimeout(() => { tooltipVisible.value = false }, 200)
}

function cancelHide() {
  clearTimeout(hideTimer)
}
</script>
