<template>
  <div class="view active">
    <button class="back-link" @click="router.push('/')"><i class="ti ti-arrow-left"></i>zurück zur Sammlung</button>

    <div class="form-eyebrow">Verwaltung</div>
    <h2 class="form-title">Zitate</h2>

    <form @submit.prevent="save" class="quote-admin-form">
      <div class="form-group">
        <label class="form-label" for="q-text">Zitat-Text</label>
        <textarea class="form-textarea" id="q-text" rows="3" v-model="form.text" placeholder="Kochen ist Liebe, die man essen kann." required></textarea>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label" for="q-from">Absender</label>
          <input class="form-input" type="text" id="q-from" v-model="form.from_label" placeholder="ein kleiner Gruss von Sevi 🐶">
        </div>
        <div class="form-group">
          <label class="form-label">Für User (optional, mehrere möglich)</label>
          <div class="quote-user-picker">
            <label v-for="p in authStore.profiles" :key="p.id" class="season-check">
              <input type="checkbox" v-model="form.for_user_ids" :value="p.id">
              <span>{{ p.username }}</span>
            </label>
          </div>
          <p class="form-hint">Keine Auswahl = Zitat ist für alle sichtbar.</p>
        </div>
      </div>
      <div class="form-actions">
        <button v-if="editingId" type="button" class="btn-cancel" @click="resetForm">Abbrechen</button>
        <button type="submit" class="btn-save" :disabled="saving">
          <i class="ti ti-check"></i>
          <span>{{ saving ? 'Wird gespeichert…' : (editingId ? 'Speichern' : 'Zitat hinzufügen') }}</span>
        </button>
      </div>
    </form>

    <div class="ornament-rule"><div class="rule-line"></div><div class="rule-diamond"></div><div class="rule-line"></div></div>

    <div class="quote-admin-list">
      <div v-for="q in quotes" :key="q.id" class="quote-admin-item">
        <div class="quote-admin-text">„{{ q.text }}"</div>
        <div class="quote-admin-meta">
          <span v-if="q.from_label">{{ q.from_label }}</span>
          <span class="chip">{{ targetLabel(q) }}</span>
        </div>
        <div class="quote-admin-actions">
          <button class="btn-icon" title="Bearbeiten" @click="edit(q)"><i class="ti ti-edit"></i></button>
          <button class="btn-icon danger" title="Löschen" @click="remove(q)"><i class="ti ti-trash"></i></button>
        </div>
      </div>
      <p v-if="!quotes.length" class="empty-field">Noch keine Zitate vorhanden.</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllQuotes, insertQuote, updateQuote, deleteQuote } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth'
import { showToast } from '../../lib/toast'

const router = useRouter()
const authStore = useAuthStore()
const quotes = ref([])
const saving = ref(false)
const editingId = ref(null)

const form = reactive({ text: '', from_label: '', for_user_ids: [] })

function resetForm() {
  editingId.value = null
  form.text = ''
  form.from_label = ''
  form.for_user_ids = []
}

function targetLabel(q) {
  if (!q.for_user_ids || !q.for_user_ids.length) return 'Alle'
  return q.for_user_ids.map(id => authStore.usernameById(id) || 'Unbekannt').join(', ')
}

async function load() {
  quotes.value = await getAllQuotes()
}

function edit(q) {
  editingId.value = q.id
  form.text = q.text
  form.from_label = q.from_label || ''
  form.for_user_ids = [...(q.for_user_ids || [])]
}

async function remove(q) {
  if (!confirm('Dieses Zitat wirklich löschen?')) return
  try {
    await deleteQuote(q.id)
    showToast('Zitat gelöscht.')
    await load()
  } catch (e) {
    showToast('Fehler beim Löschen.', 'error')
  }
}

async function save() {
  if (!form.text.trim()) { showToast('Bitte einen Text eingeben.', 'error'); return }
  saving.value = true
  try {
    const payload = {
      text: form.text.trim(),
      from_label: form.from_label.trim() || null,
      for_user_ids: form.for_user_ids.length ? [...form.for_user_ids] : null,
    }
    if (editingId.value) {
      await updateQuote(editingId.value, payload)
      showToast('Zitat aktualisiert.')
    } else {
      await insertQuote(payload)
      showToast('Zitat hinzugefügt.')
    }
    resetForm()
    await load()
  } catch (e) {
    showToast('Fehler beim Speichern.', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!authStore.profiles.length) await authStore.loadProfiles()
  await load()
})
</script>
