<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div :class="['modal', 'share-dialog', { 'share-dialog--sheet': isMobile }]">
        <div class="modal-header">
          <h3>Rezept teilen</h3>
          <button class="btn-icon" @click="$emit('close')"><i class="ti ti-x"></i></button>
        </div>

        <div class="share-dialog-options">
          <button
            v-if="isOwner"
            class="share-dialog-opt"
            @click="$emit('open-rezeptarium-share'); $emit('close')"
          >
            <span class="share-opt-icon"><i class="ti ti-users"></i></span>
            <div>
              <div class="share-opt-label">Im Rezeptarium teilen</div>
              <div class="share-opt-sub">An Freunde oder Follower</div>
            </div>
          </button>

          <button class="share-dialog-opt" :disabled="pdfLoading" @click="handlePdf">
            <span class="share-opt-icon"><i :class="pdfLoading ? 'ti ti-loader-2 spin' : 'ti ti-download'"></i></span>
            <div>
              <div class="share-opt-label">Als PDF herunterladen</div>
              <div class="share-opt-sub">Speichern oder drucken</div>
            </div>
          </button>

          <template v-if="isMobile">
            <button class="share-dialog-opt" @click="handleNativeShare">
              <span class="share-opt-icon"><i class="ti ti-share"></i></span>
              <div>
                <div class="share-opt-label">Teilen via…</div>
                <div class="share-opt-sub">WhatsApp, AirDrop, Mail und mehr</div>
              </div>
            </button>
          </template>

          <template v-else>
            <button class="share-dialog-opt" @click="handleCopyLink">
              <span class="share-opt-icon"><i class="ti ti-link"></i></span>
              <div>
                <div class="share-opt-label">Link kopieren</div>
                <div v-if="isPrivateLink" class="share-opt-sub share-opt-warn">
                  <i class="ti ti-lock"></i> Nur für berechtigte Personen zugänglich
                </div>
                <div v-else class="share-opt-sub share-opt-url">{{ recipeUrl }}</div>
              </div>
            </button>

            <button class="share-dialog-opt" @click="handleMail">
              <span class="share-opt-icon"><i class="ti ti-mail"></i></span>
              <div>
                <div class="share-opt-label">Per Mail senden</div>
                <div class="share-opt-sub">Öffnet deinen Mail-Client</div>
              </div>
            </button>
          </template>
        </div>

        <button v-if="isMobile" class="share-dialog-cancel" @click="$emit('close')">Abbrechen</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { showToast } from '../lib/toast'

const props = defineProps({
  recipe: { type: Object, required: true },
  isOwner: { type: Boolean, default: false },
})
defineEmits(['close', 'open-rezeptarium-share'])

const pdfLoading = ref(false)
const isMobile = ref(window.innerWidth <= 700)

function onResize() { isMobile.value = window.innerWidth <= 700 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const recipeUrl = computed(() => `${window.location.origin}/recipe/${props.recipe.id}`)
const isPrivateLink = computed(() => props.recipe.visibility !== 'public')

async function handlePdf() {
  pdfLoading.value = true
  try {
    const { exportRecipeToPdf } = await import('../lib/pdfExport')
    await exportRecipeToPdf(props.recipe)
  } catch {
    showToast('PDF konnte nicht erstellt werden.', 'error')
  } finally {
    pdfLoading.value = false
  }
}

async function handleNativeShare() {
  const shareData = {
    title: props.recipe.name,
    text: `Schau dir dieses Rezept an: ${props.recipe.name}`,
    url: recipeUrl.value,
  }

  try {
    const { getRecipePdfFile } = await import('../lib/pdfExport')
    const file = await getRecipePdfFile(props.recipe)
    if (navigator.canShare?.({ files: [file] })) shareData.files = [file]
  } catch {
    // PDF attachment is a bonus; fall back to link-only share below.
  }

  try {
    await navigator.share(shareData)
  } catch (e) {
    if (e.name !== 'AbortError') showToast('Teilen nicht möglich.', 'error')
  }
}

async function handleCopyLink() {
  try {
    await navigator.clipboard.writeText(recipeUrl.value)
    showToast('Link kopiert ✓')
  } catch {
    showToast('Kopieren nicht möglich.', 'error')
  }
}

function handleMail() {
  const subject = encodeURIComponent(`Rezept: ${props.recipe.name}`)
  const body = encodeURIComponent(
    `Ich möchte dir dieses Rezept teilen:\n\n${props.recipe.name}\n${recipeUrl.value}`
  )
  window.open(`mailto:?subject=${subject}&body=${body}`)
}
</script>
