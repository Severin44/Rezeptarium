<template>
  <div class="visibility-picker">
    <label class="vis-option" v-for="opt in options" :key="opt.value">
      <input type="radio" :value="opt.value" :checked="modelValue === opt.value" @change="$emit('update:modelValue', opt.value)">
      <span class="vis-radio"></span>
      <span class="vis-label">
        <i :class="`ti ti-${opt.icon}`"></i>
        <strong>{{ opt.label }}</strong>
        <span class="vis-desc">{{ opt.desc }}</span>
      </span>
    </label>
  </div>
</template>

<script setup>
defineProps({ modelValue: { type: String, default: 'private' } })
defineEmits(['update:modelValue'])

const options = [
  { value: 'private',  icon: 'lock',        label: 'Nur ich (privat)',  desc: 'Nur du kannst dieses Rezept sehen.' },
  { value: 'friends',  icon: 'users',        label: 'Nur Freunde',       desc: 'Sichtbar für gegenseitige Follower.' },
  { value: 'public',   icon: 'world',        label: 'Alle (öffentlich)', desc: 'Erscheint in Discovery für alle.' },
]
</script>
