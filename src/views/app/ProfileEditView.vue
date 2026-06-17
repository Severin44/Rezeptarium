<template>
  <div class="view active">
    <button class="back-link" @click="router.push(`/profile/${authStore.username}`)">
      <i class="ti ti-arrow-left"></i>zurück zum Profil
    </button>
    <div class="form-eyebrow">eigenes Profil</div>
    <h2 class="form-title">Profil bearbeiten</h2>

    <form @submit.prevent="save" class="profile-edit-form">
      <div class="avatar-edit-section">
        <UserAvatar :username="authStore.username" :avatar-url="avatarPreview" :avatar-color="form.avatar_color" size="xl" />
        <div class="avatar-edit-controls">
          <button type="button" class="btn-follow" @click="avatarInput?.click()">
            <i class="ti ti-photo-plus"></i>Bild hochladen
          </button>
          <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="onAvatarChange">
          <div class="color-picker-label">oder Farbe wählen:</div>
          <div class="avatar-colors">
            <button
              v-for="c in PALETTE" :key="c" type="button"
              class="color-swatch" :class="{ active: form.avatar_color === c }"
              :style="{ background: c }" :title="c"
              @click="form.avatar_color = c; avatarPreview = ''; avatarFile = null"
            ></button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="p-username">Benutzername</label>
        <input class="form-input" id="p-username" v-model="form.username" placeholder="dein Username" maxlength="30">
      </div>

      <div class="form-group">
        <label class="form-label" for="p-bio">Bio <span class="form-hint-inline">{{ form.bio.length }}/160</span></label>
        <textarea class="form-textarea" id="p-bio" rows="3" v-model="form.bio" maxlength="160"
          placeholder="Erzähl etwas über dich und deine Küche…"></textarea>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-cancel" @click="router.push(`/profile/${authStore.username}`)">Abbrechen</button>
        <button type="submit" class="btn-save" :disabled="saving">
          <i class="ti ti-check"></i>{{ saving ? 'Wird gespeichert…' : 'Speichern' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { updateProfile, uploadAvatar } from '../../lib/supabase'
import UserAvatar from '../../components/UserAvatar.vue'
import { showToast } from '../../lib/toast'

const router = useRouter()
const authStore = useAuthStore()

const PALETTE = ['#eef0e0', '#f5ede0', '#faede8', '#e8f0e8', '#f0ebe0', '#e4ecf0']

const avatarInput = ref(null)
const avatarFile = ref(null)
const avatarPreview = ref('')
const saving = ref(false)

const form = reactive({ username: '', bio: '', avatar_color: '#eef0e0' })

onMounted(async () => {
  if (!authStore.loaded) await authStore.load()
  const p = authStore.profile
  form.username = p?.username || ''
  form.bio = p?.bio || ''
  form.avatar_color = p?.avatar_color || '#eef0e0'
  avatarPreview.value = p?.avatar_url || ''
})

function onAvatarChange(e) {
  const file = e.target.files[0]
  if (!file) return
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

async function save() {
  if (!form.username.trim()) { showToast('Benutzername darf nicht leer sein.', 'error'); return }
  saving.value = true
  try {
    let avatarUrl = authStore.profile?.avatar_url || null
    if (avatarFile.value) {
      avatarUrl = await uploadAvatar(avatarFile.value, authStore.userId)
    } else if (!avatarPreview.value) {
      avatarUrl = null
    }
    await updateProfile(authStore.userId, {
      username: form.username.trim(),
      bio: form.bio.trim() || null,
      avatar_color: form.avatar_color,
      avatar_url: avatarUrl,
    })
    await authStore.load()
    showToast('Profil gespeichert.')
    router.push(`/profile/${form.username.trim()}`)
  } catch (e) {
    showToast('Fehler beim Speichern.', 'error')
  } finally {
    saving.value = false
  }
}
</script>
