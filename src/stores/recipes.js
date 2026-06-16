import { defineStore } from 'pinia'
import {
  getAllRecipes,
  insertRecipe,
  updateRecipe,
  deleteRecipe,
  toggleFavorite as toggleFavoriteApi,
} from '../lib/supabase'
import { useAuthStore } from './auth'

export const useRecipeStore = defineStore('recipes', {
  state: () => ({
    all: [],
    loaded: false,
    activeFilter: '',
    searchQuery: '',
    activeSeasons: [],
    activeTags: [],
    sortOrder: 'newest',
    viewMode: 'mine', // 'mine' | 'all' — nur für Admins relevant
    filterUserId: '', // Admin: auf bestimmten User filtern
  }),

  getters: {
    countAll: (s) => s.all.length,
    countFav: (s) => s.all.filter(r => r.is_favorite).length,
    allTags: (s) => [...new Set(s.all.flatMap(r => r.tags || []))].sort(),

    filteredList(s) {
      let list = [...s.all]

      if (s.activeFilter === '__fav__') {
        list = list.filter(r => r.is_favorite)
      } else if (s.activeFilter) {
        list = list.filter(r => r.category === s.activeFilter)
      }

      if (s.activeSeasons.length) {
        list = list.filter(r => s.activeSeasons.some(se => (r.seasons || []).includes(se)))
      }

      if (s.activeTags.length) {
        list = list.filter(r => s.activeTags.every(t => (r.tags || []).includes(t)))
      }

      if (s.searchQuery) {
        const q = s.searchQuery.toLowerCase()
        list = list.filter(r =>
          r.name?.toLowerCase().includes(q) ||
          r.ingredients?.toLowerCase().includes(q) ||
          (r.tags || []).some(t => t.toLowerCase().includes(q))
        )
      }

      if (s.sortOrder === 'az') {
        list.sort((a, b) => a.name.localeCompare(b.name, 'de'))
      } else if (s.sortOrder === 'time') {
        list.sort((a, b) => ((a.prep_time || 0) + (a.cook_time || 0)) - ((b.prep_time || 0) + (b.cook_time || 0)))
      } else {
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }

      return list
    },
  },

  actions: {
    async load() {
      const auth = useAuthStore()
      // Admin: "Nur meine" oder Filter auf einen bestimmten User anwenden.
      // RLS liefert Nicht-Admins ohnehin nur die eigenen Rezepte.
      let userId = ''
      if (auth.isAdmin) {
        userId = this.filterUserId || (this.viewMode === 'mine' ? auth.userId : '')
      }
      this.all = await getAllRecipes(userId ? { userId } : {})
      this.loaded = true
    },
    async add(payload) {
      const auth = useAuthStore()
      await insertRecipe({ ...payload, user_id: auth.userId })
      await this.load()
    },
    async edit(id, payload) {
      await updateRecipe(id, payload)
      await this.load()
    },
    async remove(id) {
      await deleteRecipe(id)
      await this.load()
    },
    async toggleFavorite(id, current) {
      await toggleFavoriteApi(id, current)
      await this.load()
    },
    setFilter(f) { this.activeFilter = f },
    setSearch(q) { this.searchQuery = q },
    setSeasons(arr) { this.activeSeasons = arr },
    setTags(arr) { this.activeTags = arr },
    setSort(v) { this.sortOrder = v },
    async setViewMode(mode) {
      this.viewMode = mode
      this.filterUserId = ''
      await this.load()
    },
    async setFilterUserId(id) {
      this.filterUserId = id
      await this.load()
    },
  },
})
