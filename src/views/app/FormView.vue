<template>
  <div class="view active">
    <button class="back-link" @click="router.push('/')"><i class="ti ti-arrow-left"></i>abbrechen</button>
    <div class="form-eyebrow">{{ isEdit ? 'Eintrag bearbeiten' : 'neuer Eintrag' }}</div>
    <h2 class="form-title">{{ isEdit ? (form.name || '…') : 'Rezept hinzufügen' }}</h2>

    <div class="upload-area" v-if="!coverPreview" @click="coverInput?.click()">
      <i class="ti ti-photo-plus"></i><span>Titelbild hochladen</span>
    </div>
    <img v-else :src="coverPreview" class="cover-preview" alt="Vorschau" @click="coverInput?.click()">
    <input ref="coverInput" type="file" accept="image/*" style="display:none" @change="onCoverChange">

    <form @submit.prevent="save" novalidate>
      <div class="form-row-3">
        <div class="form-group" style="grid-column:1/3">
          <label class="form-label" for="f-name">Name des Rezepts</label>
          <input class="form-input" type="text" id="f-name" v-model="form.name" placeholder="z.B. Grossmutters Apfelkuchen" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="f-cat">Kapitel</label>
          <select class="form-input" id="f-cat" v-model="form.category">
            <option>Frühstück</option>
            <option>Hauptgericht</option>
            <option>Dessert</option>
            <option>Backen</option>
            <option>Snack</option>
            <option>Sonstiges</option>
          </select>
        </div>
      </div>

      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">Saison</label>
          <SeasonPicker v-model="form.seasons" />
        </div>
        <TagInput v-model="form.tags" :all-tags="store.allTags" />
      </div>

      <div class="form-row-3">
        <div class="form-group">
          <label class="form-label" for="f-prep">Vorbereitung (Min.)</label>
          <input class="form-input" type="number" id="f-prep" v-model="form.prep_time" placeholder="20" min="0">
        </div>
        <div class="form-group">
          <label class="form-label" for="f-cook">Kochzeit (Min.)</label>
          <input class="form-input" type="number" id="f-cook" v-model="form.cook_time" placeholder="45" min="0">
        </div>
        <div class="form-group">
          <label class="form-label" for="f-port">Portionen</label>
          <input class="form-input" type="number" id="f-port" v-model="form.servings" placeholder="4" min="1">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="f-ing">Zutaten</label>
        <p class="form-hint">Eine Zutat pro Zeile · Abschnitt mit <code>--- Name ---</code></p>
        <textarea
          class="form-textarea" id="f-ing" rows="7" v-model="form.ingredients"
          placeholder="250g Mehl&#10;125g Butter, weich&#10;2 Eier&#10;--- Für den Belag ---&#10;4 Äpfel&#10;2 TL Zimt"
        ></textarea>
      </div>

      <div class="form-group">
        <label class="form-label" for="f-inst">Zubereitung</label>
        <p class="form-hint">Schritte, Bilder mit <code>![](bild-name)</code> einfügen</p>
        <div class="inst-toolbar">
          <button type="button" class="inst-tool-btn" @click="instImgInput?.click()">
            <i class="ti ti-photo-plus"></i>Bild einfügen
          </button>
          <input ref="instImgInput" type="file" accept="image/*" style="display:none" @change="onInstImg">
        </div>
        <textarea
          ref="instTextarea" class="form-textarea" id="f-inst" rows="8" v-model="form.instructions"
          placeholder="Butter und Zucker cremig rühren.&#10;Eier einzeln unterrühren..."
        ></textarea>
      </div>

      <div class="form-group">
        <label class="form-label" for="f-notes">Tipps & Notizen</label>
        <textarea class="form-textarea" id="f-notes" rows="3" v-model="form.notes" placeholder="Varianten, Quelle, Erinnerungen…"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Sichtbarkeit</label>
        <VisibilityPicker v-model="form.visibility" />
      </div>

      <div class="form-actions">
        <button type="button" class="btn-cancel" @click="router.push('/')">Abbrechen</button>
        <button type="submit" class="btn-save" :disabled="saving">
          <i class="ti ti-book-plus"></i>
          <span>{{ saving ? 'Wird gespeichert…' : (isEdit ? 'Speichern' : 'Eintragen') }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecipeStore } from '../../stores/recipes'
import { getRecipeById, uploadImage } from '../../lib/supabase'
import { showToast } from '../../lib/toast'
import SeasonPicker from '../../components/SeasonPicker.vue'
import TagInput from '../../components/TagInput.vue'
import VisibilityPicker from '../../components/VisibilityPicker.vue'

const route = useRoute()
const router = useRouter()
const store = useRecipeStore()

const isEdit = computed(() => !!route.params.id)
const coverPreview = ref('')
const coverFile = ref(null)
const coverInput = ref(null)
const instImgInput = ref(null)
const instTextarea = ref(null)
const saving = ref(false)

const form = reactive({
  name: '', category: 'Sonstiges', prep_time: '', cook_time: '', servings: '',
  ingredients: '', instructions: '', notes: '', seasons: [], tags: [], visibility: 'private',
})

async function loadForEdit() {
  if (!isEdit.value) return
  const r = await getRecipeById(route.params.id)
  form.name = r.name || ''
  form.category = r.category || 'Sonstiges'
  form.prep_time = r.prep_time || ''
  form.cook_time = r.cook_time || ''
  form.servings = r.servings || ''
  form.ingredients = r.ingredients || ''
  form.instructions = r.instructions || ''
  form.notes = r.notes || ''
  form.seasons = [...(r.seasons || [])]
  form.tags = [...(r.tags || [])]
  form.visibility = r.visibility || (r.is_public ? 'public' : 'private')
  coverPreview.value = r.cover_image_url || ''
}
onMounted(loadForEdit)

function onCoverChange(e) {
  const file = e.target.files[0]
  if (!file) return
  coverFile.value = file
  coverPreview.value = URL.createObjectURL(file)
}

async function onInstImg(e) {
  const file = e.target.files[0]
  if (!file) return
  const ta = instTextarea.value
  const placeholder = `img-${Date.now()}`
  const tag = `\n![](${placeholder})\n`
  const pos = ta.selectionStart
  form.instructions = form.instructions.slice(0, pos) + tag + form.instructions.slice(pos)
  showToast('Bild wird hochgeladen…')
  try {
    const path = `instructions/${Date.now()}-${file.name.replace(/\s/g, '_')}`
    const url = await uploadImage(file, path)
    form.instructions = form.instructions.replace(`![](${placeholder})`, `![](${url})`)
    showToast('Bild eingefügt.')
  } catch (err) {
    form.instructions = form.instructions.replace(`![](${placeholder})`, '')
    showToast('Bild-Upload fehlgeschlagen.', 'error')
  }
  e.target.value = ''
}

async function save() {
  if (!form.name.trim()) { showToast('Bitte einen Namen eingeben.', 'error'); return }
  saving.value = true
  try {
    let coverUrl = isEdit.value ? coverPreview.value : null
    if (coverFile.value) {
      const path = `covers/${Date.now()}-${coverFile.value.name.replace(/\s/g, '_')}`
      coverUrl = await uploadImage(coverFile.value, path)
    }
    const payload = {
      name: form.name.trim(),
      category: form.category,
      prep_time: parseInt(form.prep_time) || null,
      cook_time: parseInt(form.cook_time) || null,
      servings: parseInt(form.servings) || null,
      ingredients: form.ingredients.trim() || null,
      instructions: form.instructions.trim() || null,
      notes: form.notes.trim() || null,
      cover_image_url: coverUrl,
      seasons: [...form.seasons],
      tags: [...form.tags],
      visibility: form.visibility,
      is_public: form.visibility === 'public',
    }
    if (isEdit.value) {
      await store.edit(route.params.id, payload)
      showToast('Rezept aktualisiert.')
    } else {
      await store.add(payload)
      showToast('Rezept eingetragen.')
    }
    router.push('/')
  } catch (err) {
    showToast('Fehler beim Speichern.', 'error')
  } finally {
    saving.value = false
  }
}
</script>
