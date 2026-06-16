<template>
  <div class="recipe-card" :class="{ fav: recipe.is_favorite }" @click="$emit('click')">
    <div class="card-img" :style="imgStyle">
      <span v-if="!recipe.cover_image_url" class="card-emoji">{{ catEmoji(recipe.category) }}</span>
      <span class="cat-badge">{{ recipe.category || '' }}</span>
      <span v-if="recipe.is_favorite" class="fav-badge"><i class="ti ti-heart"></i></span>
    </div>
    <div class="card-body">
      <div class="card-name">{{ recipe.name }}</div>
      <div class="card-meta">
        <span v-if="recipe.prep_time" class="meta-item"><i class="ti ti-clock"></i>{{ recipe.prep_time }} Min.</span>
        <span v-if="recipe.cook_time" class="meta-item"><i class="ti ti-flame"></i>{{ recipe.cook_time }} Min.</span>
        <span v-if="recipe.servings" class="meta-item"><i class="ti ti-users"></i>{{ recipe.servings }}</span>
      </div>
      <div v-if="recipe.tags && recipe.tags.length" class="card-tags">
        <span v-for="t in recipe.tags.slice(0, 3)" :key="t" class="card-tag">{{ t }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ recipe: { type: Object, required: true } })
defineEmits(['click'])

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
function catEmoji(cat) { return CAT_EMOJI[cat] || '🍽️' }

const imgStyle = computed(() => props.recipe.cover_image_url
  ? { backgroundImage: `url('${props.recipe.cover_image_url}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
  : { background: CAT_COLORS[props.recipe.category] || '#f5ede0' })
</script>
