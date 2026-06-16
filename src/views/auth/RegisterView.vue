<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-title"><em>Rezeptarium</em></div>
      <div class="login-subtitle">ein neues Konto erstellen</div>
      <div class="app-divider"><span>❧</span></div>

      <div v-if="error" class="login-error">{{ error }}</div>

      <div class="form-group">
        <label class="form-label" for="reg-email">E-Mail</label>
        <input class="form-input" type="email" id="reg-email" v-model="email" placeholder="fabienne@beispiel.ch">
      </div>
      <div class="form-group">
        <label class="form-label" for="reg-password">Passwort</label>
        <input class="form-input" type="password" id="reg-password" v-model="password" placeholder="••••••••" @keydown.enter="register">
      </div>
      <button class="btn-save" style="width:100%;justify-content:center;margin-top:8px" :disabled="loading" @click="register">
        <i class="ti ti-user-plus"></i>
        <span>{{ loading ? 'Wird erstellt…' : 'Konto erstellen' }}</span>
      </button>

      <p class="login-footer-links">
        <router-link to="/login">Schon ein Konto? Anmelden</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signUp } from '../../lib/supabase'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function register() {
  error.value = ''
  loading.value = true
  try {
    await signUp(email.value.trim(), password.value)
    router.push('/verify-email')
  } catch (e) {
    error.value = e.message || 'Konto konnte nicht erstellt werden.'
  } finally {
    loading.value = false
  }
}
</script>
