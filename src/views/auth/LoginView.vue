<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-deco" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 56 64" fill="none">
          <ellipse cx="28" cy="20" rx="11" ry="10" fill="white" stroke="#3d3628" stroke-width="1.2"/>
          <ellipse cx="21" cy="14" rx="5" ry="9" fill="white" stroke="#3d3628" stroke-width="1.2"/>
          <ellipse cx="22" cy="11" rx="4.5" ry="8" fill="#d4b8a0"/>
          <ellipse cx="24" cy="26" rx="7" ry="4" fill="white" stroke="#3d3628" stroke-width="1"/>
          <circle cx="24" cy="19" r="1.5" fill="#3d3628"/>
          <circle cx="32" cy="19" r="1.5" fill="#3d3628"/>
          <ellipse cx="28" cy="25" rx="2" ry="1.2" fill="#e8a090"/>
          <line x1="24" y1="24" x2="18" y2="23" stroke="#3d3628" stroke-width=".7"/>
          <line x1="24" y1="25" x2="18" y2="25" stroke="#3d3628" stroke-width=".7"/>
          <line x1="32" y1="24" x2="38" y2="23" stroke="#3d3628" stroke-width=".7"/>
          <line x1="32" y1="25" x2="38" y2="25" stroke="#3d3628" stroke-width=".7"/>
          <ellipse cx="28" cy="42" rx="10" ry="8" fill="white" stroke="#3d3628" stroke-width="1.1"/>
          <path d="M18 42 Q14 48 16 56" stroke="#3d3628" stroke-width="1.2" fill="none"/>
          <path d="M38 42 Q42 48 40 56" stroke="#3d3628" stroke-width="1.2" fill="none"/>
          <rect x="23" y="34" width="10" height="6" rx="2.5" fill="#e8c4a0" stroke="#3d3628" stroke-width=".9"/>
        </svg>
      </div>
      <div class="login-title"><em>Rezeptarium</em></div>
      <div class="login-subtitle">eine kleine Schatzkammer</div>
      <div class="app-divider"><span>❧</span></div>

      <div v-if="error" class="login-error">{{ error }}</div>

      <div class="form-group">
        <label class="form-label" for="login-email">E-Mail</label>
        <input class="form-input" type="email" id="login-email" v-model="email" placeholder="fabienne@beispiel.ch">
      </div>
      <div class="form-group">
        <label class="form-label" for="login-password">Passwort</label>
        <input class="form-input" type="password" id="login-password" v-model="password" placeholder="••••••••" @keydown.enter="login">
      </div>
      <button class="btn-save" style="width:100%;justify-content:center;margin-top:8px" :disabled="loading" @click="login">
        <i class="ti ti-door-enter"></i>
        <span>{{ loading ? 'Wird geladen…' : 'Eintreten' }}</span>
      </button>

      <button class="btn-cancel" style="width:100%;display:flex;justify-content:center;margin-top:8px" type="button" @click="router.push('/register')">
        <i class="ti ti-user-plus"></i>
        <span>Konto erstellen</span>
      </button>

      <p class="login-footer-links">
        <router-link to="/forgot-password">Passwort vergessen?</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signIn } from '../../lib/supabase'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function login() {
  error.value = ''
  loading.value = true
  try {
    await signIn(email.value.trim(), password.value)
    router.push('/')
  } catch (e) {
    error.value = 'E-Mail oder Passwort falsch.'
  } finally {
    loading.value = false
  }
}
</script>
