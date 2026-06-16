<template>
  <div class="form-group" style="position:relative">
    <label class="form-label">Tags</label>
    <div class="tag-field" @click="focusInput">
      <div class="tag-pills-wrap">
        <span v-for="t in modelValue" :key="t" class="form-tag-pill">
          {{ t }}<button type="button" class="form-tag-x" @click.stop="remove(t)">×</button>
        </span>
      </div>
      <input
        ref="inputEl" class="tag-text-input" type="text" v-model="query"
        placeholder="Tag eingeben + Enter…" autocomplete="off"
        @keydown="onKeydown" @blur="onBlur"
      >
    </div>
    <div class="tag-suggest-box" v-if="suggestions.length && query.trim()">
      <div v-for="t in suggestions" :key="t" class="tag-suggest-item" @mousedown.prevent="pick(t)">
        {{ t }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  allTags: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const query = ref('')
const inputEl = ref(null)

function focusInput() { inputEl.value?.focus() }

const suggestions = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return props.allTags.filter(t => t.toLowerCase().includes(q) && !props.modelValue.includes(t))
})

function add(tag) {
  if (tag && !props.modelValue.includes(tag)) emit('update:modelValue', [...props.modelValue, tag])
}
function remove(tag) {
  emit('update:modelValue', props.modelValue.filter(t => t !== tag))
}
function pick(tag) {
  add(tag)
  query.value = ''
}
function onKeydown(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    const val = query.value.trim().replace(/,$/, '')
    if (val) add(val)
    query.value = ''
  } else if (e.key === 'Backspace' && !query.value && props.modelValue.length) {
    emit('update:modelValue', props.modelValue.slice(0, -1))
  }
}
function onBlur() {
  setTimeout(() => { query.value = '' }, 150)
}
</script>
