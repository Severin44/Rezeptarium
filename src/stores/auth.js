import { defineStore } from 'pinia'
import { getSession, getProfile, getAllProfiles } from '../lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userId: null,
    profile: null,
    profiles: [],
    loaded: false,
  }),

  getters: {
    isAdmin: (s) => !!s.profile?.is_admin,
    username: (s) => s.profile?.username || '',
    usernameById: (s) => (id) => s.profiles.find(p => p.id === id)?.username || '',
  },

  actions: {
    async load() {
      const session = await getSession()
      this.userId = session?.user?.id || null
      try {
        this.profile = this.userId ? await getProfile(this.userId) : null
      } catch (e) {
        console.error('Profil konnte nicht geladen werden:', e)
        this.profile = null
      }
      this.loaded = true
      if (this.isAdmin) await this.loadProfiles()
    },
    async loadProfiles() {
      this.profiles = await getAllProfiles()
    },
    reset() {
      this.userId = null
      this.profile = null
      this.profiles = []
      this.loaded = false
    },
  },
})
