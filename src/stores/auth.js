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
    avatarUrl: (s) => s.profile?.avatar_url || null,
    avatarColor: (s) => s.profile?.avatar_color || '#eef0e0',
    bio: (s) => s.profile?.bio || '',
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
      // Usernames sind für alle lesbar (Discovery/Rezeptkarten zeigen den
      // Ersteller-Namen), daher unabhängig von der Admin-Rolle laden.
      if (this.userId) await this.loadProfiles()
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
