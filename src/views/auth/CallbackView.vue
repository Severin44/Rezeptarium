<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-title"><em>Rezeptarium</em></div>
      <div class="login-subtitle">{{ message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSession } from '../../lib/supabase'

const router = useRouter()
const message = ref('einen Moment, du wirst angemeldet…')

onMounted(async () => {
  const session = await getSession()
  router.replace(session ? '/' : '/login')
})
</script>
