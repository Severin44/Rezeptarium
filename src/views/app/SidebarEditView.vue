<template>
  <div class="view active">
    <button class="back-link" @click="router.push('/')"><i class="ti ti-arrow-left"></i>zurück</button>
    <div class="form-eyebrow">Anpassen</div>
    <h2 class="form-title">Sidebar konfigurieren</h2>

    <div class="sidebar-edit-wrap">
      <template v-for="section in effectiveSections" :key="section">
        <div v-if="section !== 'custom_filters'" class="sidebar-edit-section">
          <div class="sidebar-edit-section-header">
            <h3>{{ SECTION_LABELS[section] }}</h3>
            <div class="section-order-btns">
              <button class="btn-icon-sm" title="Sektion nach oben" @click="moveSection(section, 'up')">
                <i class="ti ti-arrow-up"></i>
              </button>
              <button class="btn-icon-sm" title="Sektion nach unten" @click="moveSection(section, 'down')">
                <i class="ti ti-arrow-down"></i>
              </button>
            </div>
          </div>

          <div class="sidebar-edit-items">
            <div
              v-for="(item, idx) in editItems[section]" :key="item.key"
              class="sidebar-edit-row"
            >
              <label class="sidebar-edit-label">
                <input type="checkbox" v-model="item.visible">
                <i :class="`ti ti-${item.icon}`"></i>
                <span>{{ item.label }}</span>
              </label>
              <div class="item-order-btns">
                <button class="btn-icon-sm" :disabled="idx === 0" @click="moveItem(section, idx, 'up')">
                  <i class="ti ti-arrow-up"></i>
                </button>
                <button class="btn-icon-sm" :disabled="idx === editItems[section].length - 1" @click="moveItem(section, idx, 'down')">
                  <i class="ti ti-arrow-down"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Eigene Filter (Reihenfolge über Store) -->
      <div class="sidebar-edit-section">
        <div class="sidebar-edit-section-header">
          <h3>Eigene Filter</h3>
          <div class="section-order-btns">
            <button class="btn-icon-sm" @click="moveSection('custom_filters', 'up')"><i class="ti ti-arrow-up"></i></button>
            <button class="btn-icon-sm" @click="moveSection('custom_filters', 'down')"><i class="ti ti-arrow-down"></i></button>
          </div>
        </div>
        <p v-if="!sidebarStore.customFilters.length" class="sidebar-edit-empty">
          Noch keine eigenen Filter erstellt.
        </p>
        <div
          v-for="(cf, idx) in sidebarStore.customFilters" :key="cf.id"
          class="sidebar-edit-row"
        >
          <label class="sidebar-edit-label">
            <i class="ti ti-filter"></i>
            <span>{{ cf.name }}</span>
          </label>
          <div class="item-order-btns">
            <button class="btn-icon-sm" :disabled="idx === 0" @click="sidebarStore.moveCustomFilter(authStore.userId, cf.id, 'up')">
              <i class="ti ti-arrow-up"></i>
            </button>
            <button class="btn-icon-sm" :disabled="idx === sidebarStore.customFilters.length - 1" @click="sidebarStore.moveCustomFilter(authStore.userId, cf.id, 'down')">
              <i class="ti ti-arrow-down"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="sidebar-edit-actions">
        <button class="btn-cancel" @click="resetLayout">Zurücksetzen</button>
        <button class="btn-save" @click="save"><i class="ti ti-check"></i>Fertig</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useSidebarStore, DEFAULT_ITEMS, SECTION_LABELS, SIDEBAR_SECTIONS } from '../../stores/sidebar'

const router = useRouter()
const authStore = useAuthStore()
const sidebarStore = useSidebarStore()

// Local editable copies of each section's items
const editItems = reactive({})
const effectiveSections = reactive([...SIDEBAR_SECTIONS])

function initFromStore() {
  const sections = [...sidebarStore.effectiveSections]
  effectiveSections.splice(0, effectiveSections.length, ...sections)

  for (const section of SIDEBAR_SECTIONS) {
    if (section === 'custom_filters') continue
    editItems[section] = sidebarStore.effectiveItems(section).map(item => ({ ...item }))
  }
}

onMounted(async () => {
  if (!sidebarStore.loaded) await sidebarStore.load(authStore.userId)
  initFromStore()
})

function moveItem(section, idx, dir) {
  const list = editItems[section]
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= list.length) return
  ;[list[idx], list[swapIdx]] = [list[swapIdx], list[idx]]
}

function moveSection(section, dir) {
  const idx = effectiveSections.indexOf(section)
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= effectiveSections.length) return
  ;[effectiveSections[idx], effectiveSections[swapIdx]] = [effectiveSections[swapIdx], effectiveSections[idx]]
}

async function save() {
  for (const section of SIDEBAR_SECTIONS) {
    if (section === 'custom_filters') continue
    await sidebarStore.saveItemsForSection(
      authStore.userId,
      section,
      editItems[section].map((item, i) => ({ key: item.key, visible: item.visible, sort_order: i }))
    )
  }
  await sidebarStore.saveSectionOrder(authStore.userId, [...effectiveSections])
  router.push('/')
}

async function resetLayout() {
  await sidebarStore.reset(authStore.userId)
  initFromStore()
}
</script>
