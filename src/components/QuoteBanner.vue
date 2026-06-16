<template>
  <div class="banner">
    <div class="banner-leaf" aria-hidden="true">
      <img :src="snoopyImg" alt="" class="quote-snoopy-img">
    </div>
    <div class="banner-content">
      <p class="banner-quote" :style="{ opacity }">„{{ quote.text }}"</p>
      <span class="banner-meta" :style="{ opacity }">{{ quote.from_label }}</span>
    </div>
    <button class="quote-refresh" title="Neues Zitat" aria-label="Neues Zitat anzeigen" @click="refresh">
      <i class="ti ti-refresh"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getQuotesForUser } from '../lib/supabase'

const FALLBACK_QUOTE = { text: 'Kochen ist Liebe, die man essen kann.', from_label: 'das Rezeptarium' }

const SNOOPY_IMGS = Array.from({ length: 24 }, (_, i) =>
  `/assets/snoopy_svg/Untitled-1-${String(i + 2).padStart(2, '0')}.svg`
)
function randomSnoopy() {
  return SNOOPY_IMGS[Math.floor(Math.random() * SNOOPY_IMGS.length)]
}

const quotes = ref([])
const quote = ref(FALLBACK_QUOTE)
const snoopyImg = ref(randomSnoopy())
const opacity = ref(1)

function pickRandom() {
  if (!quotes.value.length) { quote.value = FALLBACK_QUOTE; return }
  quote.value = quotes.value[Math.floor(Math.random() * quotes.value.length)]
}

function refresh() {
  opacity.value = 0
  setTimeout(() => {
    pickRandom()
    snoopyImg.value = randomSnoopy()
    opacity.value = 1
  }, 250)
}

onMounted(async () => {
  try {
    quotes.value = await getQuotesForUser()
    pickRandom()
  } catch (e) {
    quote.value = FALLBACK_QUOTE
  }
})
</script>
