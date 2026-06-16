<template>
  <div class="banner">
    <div class="banner-leaf" aria-hidden="true">
      <img :src="snoopyImg" alt="" class="quote-snoopy-img">
    </div>
    <div class="banner-content">
      <p class="banner-quote" :style="{ opacity }">„{{ quote.text }}"</p>
      <span class="banner-meta" :style="{ opacity }">{{ quote.from }}</span>
    </div>
    <button class="quote-refresh" title="Neues Zitat" aria-label="Neues Zitat anzeigen" @click="refresh">
      <i class="ti ti-refresh"></i>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getRandomQuote } from '../lib/quotes'

const SNOOPY_IMGS = Array.from({ length: 24 }, (_, i) =>
  `/assets/snoopy_svg/Untitled-1-${String(i + 2).padStart(2, '0')}.svg`
)
function randomSnoopy() {
  return SNOOPY_IMGS[Math.floor(Math.random() * SNOOPY_IMGS.length)]
}

const quote = ref(getRandomQuote())
const snoopyImg = ref(randomSnoopy())
const opacity = ref(1)

function refresh() {
  opacity.value = 0
  setTimeout(() => {
    quote.value = getRandomQuote()
    snoopyImg.value = randomSnoopy()
    opacity.value = 1
  }, 250)
}
</script>
