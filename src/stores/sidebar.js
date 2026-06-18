import { defineStore } from 'pinia'
import {
  getCustomFilters, createCustomFilter, updateCustomFilter, deleteCustomFilter, reorderCustomFilters,
  getSidebarLayout, upsertSidebarItems, resetSidebarLayout,
  getSidebarSectionOrder, saveSidebarSectionOrder,
} from '../lib/supabase'

export const SIDEBAR_SECTIONS = ['sammlung', 'kapitel', 'social', 'custom_filters']

export const DEFAULT_ITEMS = {
  sammlung: [
    { key: 'all',       label: 'Alle Rezepte',   icon: 'books' },
    { key: 'mine',      label: 'Meine Rezepte',  icon: 'user' },
    { key: 'saved',     label: 'Gespeicherte',   icon: 'bookmark' },
    { key: 'favorites', label: 'Favoriten',       icon: 'heart' },
  ],
  kapitel: [
    { key: 'category:Frühstück',    label: 'Frühstück',    icon: 'coffee' },
    { key: 'category:Hauptgericht', label: 'Hauptgericht', icon: 'soup' },
    { key: 'category:Dessert',      label: 'Dessert',       icon: 'ice-cream' },
    { key: 'category:Backen',       label: 'Backen',        icon: 'bread' },
    { key: 'category:Snack',        label: 'Snack',         icon: 'apple' },
    { key: 'category:Sonstiges',    label: 'Sonstiges',     icon: 'leaf' },
  ],
  social: [
    { key: 'discovery', label: 'Discovery',      icon: 'world' },
    { key: 'following', label: 'Following',      icon: 'rss' },
    { key: 'friends',   label: 'Freunde',        icon: 'users-group' },
    { key: 'users',     label: 'User suchen',    icon: 'search' },
    { key: 'shared',    label: 'Mit mir geteilt', icon: 'share' },
  ],
  custom_filters: [],
}

export const SECTION_LABELS = {
  sammlung:       'Sammlung',
  kapitel:        'Kapitel',
  social:         'Social',
  custom_filters: 'Eigene Filter',
}

function mergeWithDefaults(defaults, layoutRows) {
  const overrideMap = Object.fromEntries(layoutRows.map(r => [r.item_key, r]))
  return defaults
    .map(item => {
      const o = overrideMap[item.key]
      return { ...item, visible: o ? o.visible : true, sort_order: o ? o.sort_order : 9999 }
    })
    .sort((a, b) => a.sort_order - b.sort_order)
}

export const useSidebarStore = defineStore('sidebar', {
  state: () => ({
    customFilters: [],
    layoutRows: [],      // raw DB rows from sidebar_layout
    sectionOrder: [],    // ['sammlung', 'kapitel', 'social', 'custom_filters']
    loaded: false,
  }),

  getters: {
    effectiveSections: (s) => {
      if (!s.sectionOrder.length) return SIDEBAR_SECTIONS
      const ordered = [...s.sectionOrder].sort((a, b) => a.sort_order - b.sort_order).map(r => r.section)
      // ensure all sections present
      const missing = SIDEBAR_SECTIONS.filter(sec => !ordered.includes(sec))
      return [...ordered, ...missing]
    },

    effectiveItems: (s) => (section) => {
      if (section === 'custom_filters') {
        return s.customFilters.map((f, i) => ({
          key: `custom:${f.id}`, label: f.name, icon: 'filter',
          customFilter: f, visible: true, sort_order: f.sort_order ?? i,
        }))
      }
      const defaults = DEFAULT_ITEMS[section] || []
      const rows = s.layoutRows.filter(r => r.section === section)
      return mergeWithDefaults(defaults, rows)
    },

    visibleItems: (s) => (section) => {
      const store = useSidebarStore()
      return store.effectiveItems(section).filter(item => item.visible)
    },
  },

  actions: {
    async load(userId) {
      if (!userId) return
      const [filters, layout, sectionOrd] = await Promise.all([
        getCustomFilters(userId),
        getSidebarLayout(userId),
        getSidebarSectionOrder(userId),
      ])
      this.customFilters = filters
      this.layoutRows = layout
      this.sectionOrder = sectionOrd
      this.loaded = true
    },

    async saveItemsForSection(userId, section, items) {
      // items = array of { key, visible, sort_order }
      const rows = items.map((item, i) => ({
        user_id: userId,
        item_key: item.key,
        section,
        visible: item.visible,
        sort_order: i,
      }))
      await upsertSidebarItems(rows)
      await this.load(userId)
    },

    async saveSectionOrder(userId, sections) {
      await saveSidebarSectionOrder(userId, sections)
      this.sectionOrder = sections.map((section, i) => ({ section, sort_order: i }))
    },

    async reset(userId) {
      await resetSidebarLayout(userId)
      await this.load(userId)
    },

    // ── Custom Filters ────────────────────────

    async addCustomFilter(userId, fields) {
      const next = await createCustomFilter(userId, { ...fields, sort_order: this.customFilters.length })
      this.customFilters.push(next)
      return next
    },

    async editCustomFilter(id, fields) {
      const updated = await updateCustomFilter(id, fields)
      const idx = this.customFilters.findIndex(f => f.id === id)
      if (idx !== -1) this.customFilters[idx] = updated
    },

    async removeCustomFilter(id) {
      await deleteCustomFilter(id)
      this.customFilters = this.customFilters.filter(f => f.id !== id)
    },

    async moveCustomFilter(userId, id, direction) {
      const list = [...this.customFilters]
      const idx = list.findIndex(f => f.id === id)
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= list.length) return
      ;[list[idx], list[swapIdx]] = [list[swapIdx], list[idx]]
      await reorderCustomFilters(list.map((f, i) => ({ id: f.id, sort_order: i })))
      this.customFilters = list.map((f, i) => ({ ...f, sort_order: i }))
    },
  },
})
