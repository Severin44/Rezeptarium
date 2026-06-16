<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-title"><em>Neues Passwort</em></div>
      <div class="login-subtitle">setze dein neues Passwort</div>
      <div class="app-divider"><span>❧</span></div>

      <div v-if="error" class="login-error">{{ error }}</div>

      <div class="form-group">
        <label class="form-label" for="new-password">Neues Passwort</label>
        <input class="form-input" type="password" id="new-password" v-model="password" placeholder="••••••••" @keydown.enter="save">
      </div>
      <button class="btn-save" style="width:100%;justify-content:center;margin-top:8px" :disabled="loading" @click="save">
        <i class="ti ti-check"></i>
        <span>{{ loading ? 'Wird gespeichert…' : 'Passwort speichern' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { updatePassword } from '../../lib/supabase'

const router = useRouter()
const password = ref('')
const loading = ref(false)
const error = ref('')

async function save() {
  error.value = ''
  loading.value = true
  try {
    await updatePassword(password.value)
    router.push('/login')
  } catch (e) {
    error.value = e.message || 'Passwort konnte nicht gespeichert werden.'
  } finally {
    loading.value = false
  }
}
</script>
