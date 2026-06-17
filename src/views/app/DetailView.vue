<template>
  <div class="view active">
    <button class="back-link" @click="router.push('/')"><i class="ti ti-arrow-left"></i>zurück zur Sammlung</button>

    <template v-if="recipe">
      <div class="detail-cover" :style="coverStyle">{{ coverContent }}</div>

      <div class="detail-header">
        <div>
          <div class="detail-eyebrow">
            {{ recipe.category || '' }} · aus der Sammlung
            <template v-if="!isOwner && authStore.usernameById(recipe.user_id)">
              von <UserChip :username="authStore.usernameById(recipe.user_id)" :user-id="recipe.user_id" />
            </template>
          </div>
          <h2 class="detail-title">{{ recipe.name }}</h2>
        </div>
        <div class="detail-actions">
          <button
            v-if="isOwner" class="btn-fav" :class="{ active: recipe.is_favorite }"
            :title="recipe.is_favorite ? 'Aus Favoriten entfernen' : 'Als Favorit markieren'"
            @click="toggleFav"
          >
            <i class="ti ti-heart"></i>{{ recipe.is_favorite ? 'Favorit' : 'Favorisieren' }}
          </button>
          <button
            v-if="isOwner" class="btn-icon" title="Mit jemandem teilen" @click="shareModalOpen = true"
          ><i class="ti ti-share"></i></button>
          <button v-if="isOwner" class="btn-icon" title="Bearbeiten" @click="router.push(`/edit/${recipe.id}`)"><i class="ti ti-edit"></i></button>
          <button v-if="isOwner" class="btn-icon danger" title="Löschen" @click="remove"><i class="ti ti-trash"></i></button>
          <button v-if="sharedWithMe" class="btn-icon danger" title="Ablehnen – aus geteilten entfernen" @click="declineShare"><i class="ti ti-x"></i></button>
        </div>
      </div>

      <div v-if="sharedWithMe && sharedByUsername" class="shared-by-hint">
        <i class="ti ti-share"></i> Geteilt von <UserChip :username="sharedByUsername" />
      </div>

      <div class="detail-chips">
        <span v-if="totalPrep" class="chip"><i class="ti ti-clock"></i>{{ totalPrep }}</span>
        <span v-if="totalCook" class="chip"><i class="ti ti-flame"></i>{{ totalCook }}</span>
        <span v-if="recipe.servings" class="chip"><i class="ti ti-users"></i>{{ recipe.servings }} Portionen</span>
        <span v-for="s in recipe.seasons || []" :key="s" class="chip chip-season">{{ seasonEmoji(s) }} {{ s }}</span>
        <span class="chip chip-vis">
          <i :class="visIcon"></i>{{ visLabel }}
        </span>
      </div>
      <div v-if="recipe.tags && recipe.tags.length" class="detail-tags">
        <span v-for="t in recipe.tags" :key="t" class="detail-tag">{{ t }}</span>
      </div>

      <div v-if="showSocial" class="detail-social">
        <button
          class="social-like-btn" :class="{ liked, 'non-interactive': !canInteract }"
          :title="canInteract ? (liked ? 'Aus Favoriten entfernen' : 'Zu meinen Favoriten hinzufügen') : ''"
          :disabled="!canInteract"
          @click="canInteract && toggleLike()"
        >
          <i :class="liked ? 'ti ti-heart-filled' : 'ti ti-heart'"></i>
          <span v-if="showCounts">{{ likeCount }}</span>
        </button>
        <div class="social-rating">
          <button
            v-for="n in 5" :key="n"
            class="rating-star" :class="{ filled: n <= (hoverScore || myScore), 'non-interactive': !canInteract }"
            :disabled="!canInteract"
            @click="canInteract && rate(n)"
            @mouseenter="canInteract && (hoverScore = n)"
            @mouseleave="canInteract && (hoverScore = 0)"
          ><i class="ti ti-star-filled"></i></button>
          <span class="social-rating-avg" v-if="showCounts && ratingCount">{{ avgRating.toFixed(1) }} ({{ ratingCount }})</span>
        </div>
        <button v-if="!isOwner" class="btn-cancel save-btn" :class="{ active: isSaved }" @click="toggleSave">
          <i :class="isSaved ? 'ti ti-bookmark-filled' : 'ti ti-bookmark'"></i>
          {{ isSaved ? 'Gespeichert' : 'In meine Sammlung' }}
        </button>
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

    <!-- Delete Confirm Modal -->
    <div v-if="deleteModalOpen" class="modal-overlay" @click.self="deleteModalOpen = false">
      <div class="modal confirm-modal">
        <div class="confirm-modal-body">
          <i class="ti ti-trash confirm-modal-icon"></i>
          <h3 class="confirm-modal-title">Rezept löschen?</h3>
          <p class="confirm-modal-text">„{{ recipe?.name }}" wird unwiderruflich gelöscht.</p>
        </div>
        <div class="confirm-modal-actions">
          <button class="btn-cancel" @click="deleteModalOpen = false">Abbrechen</button>
          <button class="btn-danger" @click="confirmDelete"><i class="ti ti-trash"></i>Löschen</button>
        </div>
      </div>
    </div>

    <!-- Share Modal -->
    <div v-if="shareModalOpen" class="modal-overlay" @click.self="shareModalOpen = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Rezept teilen</h3>
          <button class="btn-icon" @click="shareModalOpen = false"><i class="ti ti-x"></i></button>
        </div>
        <div class="modal-body">
          <div class="search-box" style="margin-bottom:12px">
            <i class="ti ti-search"></i>
            <input type="text" v-model="shareSearch" placeholder="Person suchen…">
          </div>
          <div v-if="!shareContacts.length" class="empty-state" style="padding:20px">
            <p class="empty-sub">Keine Follower/Following vorhanden.</p>
          </div>
          <div v-else class="share-contact-list">
            <div
              v-for="u in filteredShareContacts" :key="u.id"
              class="share-contact" :class="{ shared: sharedWith.has(u.id) }"
              @click="sendShare(u)"
            >
              <UserAvatar :username="u.username" :avatar-url="u.avatar_url" :avatar-color="u.avatar_color" size="sm" />
              <span class="share-contact-name">{{ u.username }}</span>
              <i v-if="sharedWith.has(u.id)" class="ti ti-check share-check"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getRecipeById,
  getLikesForRecipeIds, likeRecipe, unlikeRecipe,
  getRatingsForRecipeIds, rateRecipe,
  getSavedRecipeIds, saveRecipe, unsaveRecipe,
  shareRecipe, getShareableFollowers, isSharedWithUser, removeShare, markShareSeen,
} from '../../lib/supabase'
import { renderIngredients, renderInstructions } from '../../lib/parser'
import { useRecipeStore } from '../../stores/recipes'
import { useAuthStore } from '../../stores/auth'
import { showToast } from '../../lib/toast'
import UserAvatar from '../../components/UserAvatar.vue'
import UserChip from '../../components/UserChip.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const store = useRecipeStore()
const recipe = ref(null)

const CAT_COLORS = {
  'Frühstück':    '#f5ede0', 'Hauptgericht': '#eef2e4', 'Dessert':  '#f0ebe0',
  'Backen':       '#faeee8', 'Snack':        '#e8f0e8', 'Sonstiges':'#f0ece4',
}
const CAT_EMOJI = {
  'Frühstück': '☕', 'Hauptgericht': '🍝', 'Dessert': '🥧',
  'Backen': '🥐', 'Snack': '🍎', 'Sonstiges': '🌿',
}
function seasonEmoji(s) { return { 'Frühling': '🌱', 'Sommer': '☀️', 'Herbst': '🍂', 'Winter': '❄️' }[s] || '' }

const coverStyle = computed(() => recipe.value?.cover_image_url
  ? { backgroundImage: `url('${recipe.value.cover_image_url}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
  : { background: CAT_COLORS[recipe.value?.category] || '#f5ede0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px' })
const coverContent = computed(() => recipe.value?.cover_image_url ? '' : (CAT_EMOJI[recipe.value?.category] || '🍽️'))
const totalPrep = computed(() => recipe.value?.prep_time ? `${recipe.value.prep_time} Min. Vorbereitung` : '')
const totalCook = computed(() => recipe.value?.cook_time ? `${recipe.value.cook_time} Min. ${recipe.value.category === 'Backen' ? 'Backen' : 'Kochen'}` : '')
const isOwner = computed(() => recipe.value?.user_id === authStore.userId)
const showCounts = computed(() => recipe.value?.visibility !== 'private')
const showSocial = computed(() => showCounts.value || sharedWithMe.value)
const canInteract = computed(() => !isOwner.value)

const visLabel = computed(() => ({ private: 'Privat', friends: 'Freunde', public: 'Öffentlich' }[recipe.value?.visibility] || '')  )
const visIcon  = computed(() => ({ private: 'ti ti-lock', friends: 'ti ti-users', public: 'ti ti-world' }[recipe.value?.visibility] || 'ti ti-lock'))

const liked = ref(false)
const likeCount = ref(0)
const myScore = ref(0)
const hoverScore = ref(0)
const avgRating = ref(0)
const ratingCount = ref(0)
const isSaved = ref(false)
const sharedWithMe = ref(false)
const sharedByUsername = ref('')

const shareModalOpen = ref(false)
const deleteModalOpen = ref(false)
const shareSearch = ref('')
const shareContacts = ref([])
const sharedWith = ref(new Set())

const filteredShareContacts = computed(() => {
  if (!shareSearch.value) return shareContacts.value
  const q = shareSearch.value.toLowerCase()
  return shareContacts.value.filter(u => u.username.toLowerCase().includes(q))
})

async function loadSocial() {
  if (!isOwner.value) {
    const share = await isSharedWithUser(recipe.value.id, authStore.userId)
    sharedWithMe.value = !!share
    if (share) {
      markShareSeen(recipe.value.id, authStore.userId)
      const inStore = store.all.find(r => r.id === recipe.value.id)
      if (inStore) inStore._share_seen = true
      sharedByUsername.value = authStore.usernameById(share.shared_by) || ''
    }
  }
  if (recipe.value?.visibility === 'private' && !isOwner.value && !sharedWithMe.value) return
  const id = recipe.value.id

  const likes = await getLikesForRecipeIds([id])
  likeCount.value = likes.length
  liked.value = likes.some(l => l.user_id === authStore.userId)

  const ratings = await getRatingsForRecipeIds([id])
  ratingCount.value = ratings.length
  avgRating.value = ratings.length ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length : 0
  myScore.value = ratings.find(r => r.user_id === authStore.userId)?.score || 0

  if (!isOwner.value) {
    const savedIds = await getSavedRecipeIds(authStore.userId)
    isSaved.value = savedIds.includes(id)
  }
}

async function load() {
  try {
    recipe.value = await getRecipeById(route.params.id)
    await loadSocial()
  } catch (e) {
    showToast('Rezept konnte nicht geladen werden.', 'error')
  }
}
onMounted(load)
watch(() => route.params.id, (id) => { if (id) load() })

watch(shareModalOpen, async (open) => {
  if (open && isOwner.value) {
    const friendsOnly = recipe.value?.visibility === 'private'
    shareContacts.value = await getShareableFollowers(authStore.userId, { friendsOnly })
  }
})

async function toggleFav() {
  await store.toggleFavorite(recipe.value.id, recipe.value.is_favorite)
  await load()
}

async function toggleLike() {
  try {
    if (liked.value) {
      await unlikeRecipe(recipe.value.id, authStore.userId)
      liked.value = false
      likeCount.value--
      showToast('Like entfernt.')
    } else {
      await likeRecipe(recipe.value.id, authStore.userId)
      liked.value = true
      likeCount.value++
      if (!isSaved.value) {
        await saveRecipe(recipe.value.id, authStore.userId)
        if (sharedWithMe.value) {
          await removeShare(recipe.value.id, authStore.userId)
          sharedWithMe.value = false
        }
        isSaved.value = true
      }
      showToast('Geliked & in Sammlung gespeichert ❤️')
    }
  } catch (e) {
    showToast('Fehler beim Liken.', 'error')
  }
}

async function rate(score) {
  try {
    await rateRecipe(recipe.value.id, authStore.userId, score)
    showToast('Bewertung gespeichert.')
    await loadSocial()
  } catch (e) {
    showToast('Fehler beim Bewerten.', 'error')
  }
}

async function toggleSave() {
  try {
    if (isSaved.value) {
      await unsaveRecipe(recipe.value.id, authStore.userId)
      isSaved.value = false
      if (liked.value) {
        await unlikeRecipe(recipe.value.id, authStore.userId)
        liked.value = false
        likeCount.value--
      }
      showToast('Aus Sammlung entfernt.')
    } else {
      await saveRecipe(recipe.value.id, authStore.userId)
      if (sharedWithMe.value) {
        await removeShare(recipe.value.id, authStore.userId)
        sharedWithMe.value = false
        store.all = store.all.filter(r => r.id !== recipe.value.id)
      }
      isSaved.value = true
      showToast('In Sammlung gespeichert.')
    }
  } catch (e) {
    showToast('Fehler beim Speichern.', 'error')
  }
}

async function sendShare(user) {
  if (sharedWith.value.has(user.id)) return
  try {
    await shareRecipe(recipe.value.id, authStore.userId, user.id)
    sharedWith.value = new Set([...sharedWith.value, user.id])
    showToast(`Rezept mit ${user.username} geteilt.`)
  } catch (e) {
    showToast('Fehler beim Teilen.', 'error')
  }
}

async function declineShare() {
  try {
    await removeShare(recipe.value.id, authStore.userId)
    showToast('Rezept entfernt.')
    router.push('/')
  } catch (e) {
    showToast('Fehler beim Entfernen.', 'error')
  }
}

function remove() {
  deleteModalOpen.value = true
}

async function confirmDelete() {
  deleteModalOpen.value = false
  try {
    await store.remove(recipe.value.id)
    showToast('Rezept gelöscht.')
    router.push('/')
  } catch (e) {
    showToast('Fehler beim Löschen.', 'error')
  }
}
</script>
