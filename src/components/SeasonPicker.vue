<template>
  <div class="season-check-group">
    <label v-for="s in SEASONS" :key="s.value" class="season-check">
      <input type="checkbox" :checked="modelValue.includes(s.value)" @change="toggle(s.value)">
      <span>{{ s.emoji }} {{ s.value }}</span>
    </label>
  </div>
</template>

<script setup>
const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue'])

const SEASONS = [
  { value: 'Frühling', emoji: '🌱' },
  { value: 'Sommer', emoji: '☀️' },
  { value: 'Herbst', emoji: '🍂' },
  { value: 'Winter', emoji: '❄️' },
]

function toggle(v) {
  if (props.modelValue.includes(v)) {
    emit('update:modelValue', props.modelValue.filter(x => x !== v))
  } else {
    emit('update:modelValue', [...props.modelValue, v])
  }
}
</script>
