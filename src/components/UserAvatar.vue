<template>
  <div class="user-avatar" :style="style" :class="sizeClass" @click="$emit('click')">
    <img v-if="avatarUrl" :src="avatarUrl" :alt="username" class="avatar-img">
    <span v-else class="avatar-letter">{{ letter }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  username: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  avatarColor: { type: String, default: '#eef0e0' },
  size: { type: String, default: 'md' }, // sm | md | lg | xl
})
defineEmits(['click'])

const letter = computed(() => (props.username?.[0] || '?').toUpperCase())
const sizeClass = computed(() => `avatar-${props.size}`)
const style = computed(() => ({
  '--avatar-color': props.avatarColor,
}))
</script>
