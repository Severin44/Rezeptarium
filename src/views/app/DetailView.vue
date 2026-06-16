<template>
  <div class="view active">
    <button class="back-link" @click="router.push('/')"><i class="ti ti-arrow-left"></i>zurück zur Sammlung</button>

    <template v-if="recipe">
      <div class="detail-cover" :style="coverStyle">{{ coverContent }}</div>

      <div class="detail-header">
        <div>
          <div class="detail-eyebrow">{{ recipe.category || '' }} · aus der Sammlung</div>
          <h2 class="detail-title">{{ recipe.name }}</h2>
        </div>
        <div class="detail-actions">
          <button
            class="btn-fav" :class="{ active: recipe.is_favorite }"
            :title="recipe.is_favorite ? 'Aus Favoriten entfernen' : 'Als Favorit markieren'"
            @click="toggleFav"
          >
            <i class="ti ti-heart"></i>{{ recipe.is_favorite ? 'Favorit' : 'Favorisieren' }}
          </button>
          <button class="btn-icon" title="Bearbeiten" @click="router.push(`/edit/${recipe.id}`)"><i class="ti ti-edit"></i></button>
          <button class="btn-icon danger" title="Löschen" @click="remove"><i class="ti ti-trash"></i></button>
        </div>
      </div>

      <div class="detail-chips">
        <span v-if="totalPrep" class="chip"><i class="ti ti-clock"></i>{{ totalPrep }}</span>
        <span v-if="totalCook" class="chip"><i class="ti ti-flame"></i>{{ totalCook }}</span>
        <span v-if="recipe.servings" class="chip"><i class="ti ti-users"></i>{{ recipe.servings }} Portionen</span>
        <span v-for="s in recipe.seasons || []" :key="s" class="chip chip-season">{{ seasonEmoji(s) }} {{ s }}</span>
      </div>
      <div v-if="recipe.tags && recipe.tags.length" class="detail-tags">
        <span v-for="t in recipe.tags" :key="t" class="detail-tag">{{ t }}</span>
      </div>

      <div class="ornament-rule"><div class="rule-line"></div><div class="rule-diamond"></div><div class="rule-line"></div></div>

      <section class="detail-section">
        <h3 class="sec-title">Zutaten</h3>
        <div class="ing-list" v-html="renderIngredients(recipe.ingredients)"></div>
      </section>

      <section class="detail-section">
        <h3 class="sec-title">Zubereitung</h3>
        <div class="inst-content" v-html="renderInstructions(recipe.instructions, {})"></div>
      </section>

      <section v-if="recipe.notes" class="detail-section">
        <h3 class="sec-title">Tipps & Notizen</h3>
        <p class="notes-text">{{ recipe.notes }}</p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRecipeById } from '../../lib/supabase'
import { renderIngredients, renderInstructions } from '../../lib/parser'
import { useRecipeStore } from '../../stores/recipes'
import { showToast } from '../../lib/toast'

const route = useRoute()
const router = useRouter()
const store = useRecipeStore()
const recipe = ref(null)

const CAT_COLORS = {
  'Frühstück':    '#f5ede0',
  'Hauptgericht': '#eef2e4',
  'Dessert':      '#f0ebe0',
  'Backen':       '#faeee8',
  'Snack':        '#e8f0e8',
  'Sonstiges':    '#f0ece4',
}
const CAT_EMOJI = {
  'Frühstück':    '☕',
  'Hauptgericht': '🍝',
  'Dessert':      '🥧',
  'Backen':       '🥐',
  'Snack':        '🍎',
  'Sonstiges':    '🌿',
}
function seasonEmoji(s) { return { 'Frühling': '🌱', 'Sommer': '☀️', 'Herbst': '🍂', 'Winter': '❄️' }[s] || '' }

const coverStyle = computed(() => recipe.value?.cover_image_url
  ? { backgroundImage: `url('${recipe.value.cover_image_url}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
  : { background: CAT_COLORS[recipe.value?.category] || '#f5ede0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px' })
const coverContent = computed(() => recipe.value?.cover_image_url ? '' : (CAT_EMOJI[recipe.value?.category] || '🍽️'))
const totalPrep = computed(() => recipe.value?.prep_time ? `${recipe.value.prep_time} Min. Vorbereitung` : '')
const totalCook = computed(() => recipe.value?.cook_time ? `${recipe.value.cook_time} Min. ${recipe.value.category === 'Backen' ? 'Backen' : 'Kochen'}` : '')

async function load() {
  try {
    recipe.value = await getRecipeById(route.params.id)
  } catch (e) {
    showToast('Rezept konnte nicht geladen werden.', 'error')
  }
}
onMounted(load)
watch(() => route.params.id, (id) => { if (id) load() })

async function toggleFav() {
  await store.toggleFavorite(recipe.value.id, recipe.value.is_favorite)
  await load()
}
async function remove() {
  if (!confirm(`„${recipe.value.name}" wirklich löschen?`)) return
  try {
    await store.remove(recipe.value.id)
    showToast('Rezept gelöscht.')
    router.push('/')
  } catch (e) {
    showToast('Fehler beim Löschen.', 'error')
  }
}
</script>
