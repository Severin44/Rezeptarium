import { createRouter, createWebHistory } from 'vue-router'
import { getSession, getProfile } from '../lib/supabase'

import LoginView from '../views/auth/LoginView.vue'
import RegisterView from '../views/auth/RegisterView.vue'
import VerifyEmailView from '../views/auth/VerifyEmailView.vue'
import CallbackView from '../views/auth/CallbackView.vue'
import ResetRequestView from '../views/auth/ResetRequestView.vue'
import ResetPasswordView from '../views/auth/ResetPasswordView.vue'

import GridView from '../views/app/GridView.vue'
import DetailView from '../views/app/DetailView.vue'
import FormView from '../views/app/FormView.vue'
import DiscoveryView from '../views/app/DiscoveryView.vue'
import QuotesAdminView from '../views/admin/QuotesAdminView.vue'
import ProfileView from '../views/app/ProfileView.vue'
import ProfileEditView from '../views/app/ProfileEditView.vue'
import FollowingView from '../views/app/FollowingView.vue'
import FriendsView from '../views/app/FriendsView.vue'
import UserSearchView from '../views/app/UserSearchView.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { public: true } },
  { path: '/verify-email', name: 'verify-email', component: VerifyEmailView, meta: { public: true } },
  { path: '/auth/callback', name: 'auth-callback', component: CallbackView, meta: { public: true } },
  { path: '/forgot-password', name: 'forgot-password', component: ResetRequestView, meta: { public: true } },
  { path: '/reset-password', name: 'reset-password', component: ResetPasswordView, meta: { public: true } },

  { path: '/', name: 'grid', component: GridView, meta: { requiresAuth: true } },
  { path: '/recipe/:id', name: 'detail', component: DetailView, meta: { requiresAuth: true } },
  { path: '/add', name: 'add', component: FormView, meta: { requiresAuth: true } },
  { path: '/edit/:id', name: 'edit', component: FormView, meta: { requiresAuth: true } },
  { path: '/discovery', name: 'discovery', component: DiscoveryView, meta: { requiresAuth: true } },
  { path: '/following', name: 'following', component: FollowingView, meta: { requiresAuth: true } },
  { path: '/friends', name: 'friends', component: FriendsView, meta: { requiresAuth: true } },
  { path: '/users', name: 'users', component: UserSearchView, meta: { requiresAuth: true } },
  { path: '/profile/edit', name: 'profile-edit', component: ProfileEditView, meta: { requiresAuth: true } },
  { path: '/profile/:username', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/admin/quotes', name: 'admin-quotes', component: QuotesAdminView, meta: { requiresAuth: true, requiresAdmin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const session = await getSession()
  if (to.meta.requiresAuth && !session) return { name: 'login' }
  if (session && (to.name === 'login' || to.name === 'register')) return { name: 'grid' }
  if (to.meta.requiresAdmin) {
    const profile = await getProfile(session.user.id)
    if (!profile?.is_admin) return { name: 'grid' }
  }
  return true
})

export default router
