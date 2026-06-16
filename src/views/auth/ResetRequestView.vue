<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-title"><em>Passwort vergessen</em></div>
      <div class="login-subtitle">wir senden dir einen Link zum Zurücksetzen</div>
      <div class="app-divider"><span>❧</span></div>

      <div v-if="error" class="login-error">{{ error }}</div>

      <template v-if="!sent">
        <div class="form-group">
          <label class="form-label" for="reset-email">E-Mail</label>
          <input class="form-input" type="email" id="reset-email" v-model="email" placeholder="fabienne@beispiel.ch" @keydown.enter="request">
        </div>
        <button class="btn-save" style="width:100%;justify-content:center;margin-top:8px" :disabled="loading" @click="request">
          <i class="ti ti-mail"></i>
          <span>{{ loading ? 'Wird gesendet…' : 'Link senden' }}</span>
        </button>
      </template>
      <p v-else class="empty-field" style="text-align:center;margin-bottom:14px">
        Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum Zurücksetzen gesendet.
      </p>

      <p class="login-footer-links">
        <router-link to="/login">zurück zur Anmeldung</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { requestPasswordReset } from '../../lib/supabase'

const email = ref('')
const loading = ref(false)
const error = ref('')
const sent = ref(false)

async function request() {
  error.value = ''
  loading.value = true
  try {
    await requestPasswordReset(email.value.trim())
    sent.value = true
  } catch (e) {
    error.value = e.message || 'Anfrage fehlgeschlagen.'
  } finally {
    loading.value = false
  }
}
</script>
