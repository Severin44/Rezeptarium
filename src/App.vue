<template>
  <div v-if="route.meta.requiresAuth" class="shell">
    <header class="mobile-header">
      <button class="burger-btn" aria-label="Menü öffnen" @click="sidebarOpen = true">
        <i class="ti ti-menu-2"></i>
      </button>
      <span class="mobile-title"><em>Rezeptarium</em></span>
      <button class="mobile-add-btn" aria-label="Rezept hinzufügen" @click="router.push('/add')">
        <i class="ti ti-plus"></i>
      </button>
    </header>

    <div class="sidebar-overlay" :class="{ show: sidebarOpen }" @click="sidebarOpen = false"></div>

    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <main class="main">
      <router-view />
    </main>
  </div>

  <router-view v-else />

  <div id="toast" class="toast" :class="{ show: toastState.show, error: toastState.type === 'error' }">
    {{ toastState.msg }}
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'
import { toastState } from './lib/toast'
import { onAuthStateChange } from './lib/supabase'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)
const authStore = useAuthStore()

watch(() => route.fullPath, () => { sidebarOpen.value = false })

onMounted(() => {
  authStore.load()
  onAuthStateChange((event, session) => {
    if (session) authStore.load()
    else authStore.reset()
  })
})
</script>
