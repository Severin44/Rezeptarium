import { defineStore } from 'pinia'
import {
  getAllRecipes,
  getOwnAndSavedRecipes,
  getOwnRecipeCount,
  getRecipesByIds,
  getSavedRecipeIds,
  getSharedWithMe,
  getUnseenSharesCount,
  markSharesAsSeen,
  getFavoriteRecipes,
  insertRecipe,
  updateRecipe,
  deleteRecipe,
  toggleFavorite as toggleFavoriteApi,
} from '../lib/supabase'
import { useAuthStore } from './auth'

export const useRecipeStore = defineStore('recipes', {
  state: () => ({
    all: [],
    mineCount: 0,
    unseenShares: 0,
    loaded: false,
    activeFilter: '',
    searchQuery: '',
    activeSeasons: [],
    activeTags: [],
    sortOrder: 'newest',
    collectionMode: 'all', // 'all' | 'mine' | 'saved' | 'shared' | 'favorites'
    adminMode: 'user', // 'user' | 'admin'
    filterUserId: '',
  }),

  getters: {
    countAll: (s) => s.all.length,
    countMine: (s) => s.mineCount,
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

      // Admin View: wirklich alles (ggf. auf einen bestimmten User gefiltert).
      // Bypasst die normale Sammlung-Logik komplett — nur für Admins erreichbar.
      if (auth.isAdmin && this.adminMode === 'admin') {
        this.all = await getAllRecipes(this.filterUserId ? { userId: this.filterUserId } : {})
        this.loaded = true
        return
      }

      // User View (für alle, auch Admins solange adminMode 'user' ist):
      // genau das, was jeder normale User sehen würde.
      if (this.collectionMode === 'saved') {
        const ids = await getSavedRecipeIds(auth.userId)
        this.all = await getRecipesByIds(ids)
        this.mineCount = await getOwnRecipeCount(auth.userId)
      } else if (this.collectionMode === 'mine') {
        this.all = await getAllRecipes({ userId: auth.userId })
        this.mineCount = this.all.length
      } else if (this.collectionMode === 'shared') {
        this.all = await getSharedWithMe(auth.userId)
        this.mineCount = await getOwnRecipeCount(auth.userId)
        this.unseenShares = this.all.filter(r => !r._share_seen).length
      } else if (this.collectionMode === 'favorites') {
        this.all = await getFavoriteRecipes(auth.userId)
        this.mineCount = await getOwnRecipeCount(auth.userId)
      } else {
        this.all = await getOwnAndSavedRecipes(auth.userId)
        this.mineCount = this.all.filter(r => r.user_id === auth.userId).length
      }
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
    async setCollectionMode(mode) {
      this.collectionMode = mode
      await this.load()
    },
    async setAdminMode(mode) {
      this.adminMode = mode
      this.filterUserId = ''
      await this.load()
    },
    async setFilterUserId(id) {
      this.filterUserId = id
      await this.load()
    },
    async refreshUnseenShares() {
      const auth = useAuthStore()
      if (auth.userId) this.unseenShares = await getUnseenSharesCount(auth.userId)
    },
  },
})
