// ─────────────────────────────────────────────
//  Datenbank-Schicht (Supabase)
// ─────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xlvwngiaaprnewndxnjd.supabase.co/'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdnduZ2lhYXBybmV3bmR4bmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mzg5NzAsImV4cCI6MjA5NzExNDk3MH0.EQM0P0DufhkhTs4rUevROs4-yiz1MexTA7CPNE6PWPA'

export const STORAGE_BUCKET = 'recipe-images'
export const db = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Auth ─────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUp(email, password, username) {
  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: { username },
    },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await db.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data } = await db.auth.getSession()
  return data.session
}

export function onAuthStateChange(cb) {
  return db.auth.onAuthStateChange((event, session) => cb(event, session))
}

export async function requestPasswordReset(email) {
  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export async function updatePassword(password) {
  const { error } = await db.auth.updateUser({ password })
  if (error) throw error
}

// ── Profile ──────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getAllProfiles() {
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .order('username', { ascending: true })
  if (error) throw error
  return data
}

export async function getProfileByUsername(username) {
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateProfile(userId, fields) {
  const { data, error } = await db
    .from('profiles')
    .update(fields)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const AVATAR_BUCKET = 'avatars'

export async function uploadAvatar(file, userId) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  const { data, error } = await db.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true })
  if (error) throw error
  const { data: url } = db.storage.from(AVATAR_BUCKET).getPublicUrl(data.path)
  return url.publicUrl
}

export async function searchUsers(query, currentUserId) {
  const { data, error } = await db
    .from('profiles')
    .select('id, username, avatar_url, avatar_color, bio')
    .ilike('username', `%${query}%`)
    .neq('id', currentUserId)
    .limit(20)
  if (error) throw error
  return data
}

// ── Follows ──────────────────────────────────

export async function getFollowerCount(userId) {
  const { count, error } = await db
    .from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId)
  if (error) throw error
  return count || 0
}

export async function getFollowingCount(userId) {
  const { count, error } = await db
    .from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
  if (error) throw error
  return count || 0
}

export async function isFollowing(followerId, followingId) {
  const { data, error } = await db
    .from('follows').select('id').eq('follower_id', followerId).eq('following_id', followingId).maybeSingle()
  if (error) throw error
  return !!data
}

export async function areFriends(userA, userB) {
  const { data, error } = await db.rpc('are_friends', { user_a: userA, user_b: userB })
  if (error) throw error
  return !!data
}

export async function followUser(followerId, followingId) {
  const { error } = await db.from('follows').insert({ follower_id: followerId, following_id: followingId })
  if (error) throw error
}

export async function unfollowUser(followerId, followingId) {
  const { error } = await db.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId)
  if (error) throw error
}

export async function getMyFollowingIds(userId) {
  const { data, error } = await db.from('follows').select('following_id').eq('follower_id', userId)
  if (error) throw error
  return data.map(r => r.following_id)
}

export async function getMyFollowerIds(userId) {
  const { data, error } = await db.from('follows').select('follower_id').eq('following_id', userId)
  if (error) throw error
  return data.map(r => r.follower_id)
}

// ── Profilseiten-Rezepte ──────────────────────

export async function getProfileRecipes(profileUserId, visibility) {
  const { data, error } = await db
    .from('recipes')
    .select('*')
    .eq('user_id', profileUserId)
    .eq('visibility', visibility)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ── Following-Feed & Friends ──────────────────

export async function getFollowingFeed(userId) {
  const followingIds = await getMyFollowingIds(userId)
  if (!followingIds.length) return []
  const { data, error } = await db
    .from('recipes')
    .select('*')
    .in('user_id', followingIds)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getFriendsFeed(userId) {
  const followingIds = await getMyFollowingIds(userId)
  const followerIds = await getMyFollowerIds(userId)
  const followingSet = new Set(followingIds)
  const friendIds = followerIds.filter(id => followingSet.has(id))
  if (!friendIds.length) return []
  const { data, error } = await db
    .from('recipes')
    .select('*')
    .in('user_id', friendIds)
    .in('visibility', ['friends', 'public'])
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ── Direktes Teilen ───────────────────────────

export async function shareRecipe(recipeId, sharedBy, sharedWith) {
  const { error } = await db.from('recipe_shares').insert({ recipe_id: recipeId, shared_by: sharedBy, shared_with: sharedWith })
  if (error) throw error
}

export async function getSharedWithMe(userId) {
  const { data: shares, error: e1 } = await db
    .from('recipe_shares').select('recipe_id, shared_by, created_at, seen').eq('shared_with', userId)
  if (e1) throw e1
  if (!shares.length) return []
  const ids = shares.map(s => s.recipe_id)
  const { data: recipes, error: e2 } = await db.from('recipes').select('*').in('id', ids)
  if (e2) throw e2
  const seenMap = Object.fromEntries(shares.map(s => [s.recipe_id, s.seen]))
  return recipes.map(r => ({ ...r, _share_seen: seenMap[r.id] ?? true }))
}

export async function markShareSeen(recipeId, userId) {
  await db.from('recipe_shares').update({ seen: true }).eq('recipe_id', recipeId).eq('shared_with', userId)
}

export async function getUnseenSharesCount(userId) {
  const { count, error } = await db
    .from('recipe_shares').select('*', { count: 'exact', head: true }).eq('shared_with', userId).eq('seen', false)
  if (error) throw error
  return count || 0
}

export async function markSharesAsSeen(userId) {
  await db.from('recipe_shares').update({ seen: true }).eq('shared_with', userId).eq('seen', false)
}

export async function getShareableFollowers(userId, { friendsOnly = false } = {}) {
  const followerIds = await getMyFollowerIds(userId)
  const followingIds = await getMyFollowingIds(userId)
  let ids
  if (friendsOnly) {
    const followingSet = new Set(followingIds)
    ids = followerIds.filter(id => followingSet.has(id))
  } else {
    ids = [...new Set([...followerIds, ...followingIds])]
  }
  if (!ids.length) return []
  const { data, error } = await db
    .from('profiles').select('id, username, avatar_url, avatar_color').in('id', ids)
  if (error) throw error
  return data
}

export async function removeShare(recipeId, userId) {
  const { error } = await db
    .from('recipe_shares').delete().eq('recipe_id', recipeId).eq('shared_with', userId)
  if (error) throw error
}

export async function getSavedCountByUser(myUserId, profileUserId) {
  const savedIds = await getSavedRecipeIds(myUserId)
  if (!savedIds.length) return 0
  const { count, error } = await db
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profileUserId)
    .in('id', savedIds)
  if (error) throw error
  return count || 0
}

export async function isSharedWithUser(recipeId, userId) {
  const { data, error } = await db
    .from('recipe_shares').select('id, shared_by').eq('recipe_id', recipeId).eq('shared_with', userId).maybeSingle()
  if (error) throw error
  return data || null
}

// ── Favoriten (eigene + geliked-e fremde) ─────

export async function getFavoriteRecipes(userId) {
  const [{ data: ownFavs, error: e1 }, { data: likedIds, error: e2 }] = await Promise.all([
    db.from('recipes').select('*').eq('user_id', userId).eq('is_favorite', true),
    db.from('likes').select('recipe_id').eq('user_id', userId),
  ])
  if (e1) throw e1
  if (e2) throw e2

  const ownFavIds = new Set(ownFavs.map(r => r.id))
  const foreignIds = likedIds.map(l => l.recipe_id).filter(id => !ownFavIds.has(id))

  let foreignRecipes = []
  if (foreignIds.length) {
    const { data, error } = await db.from('recipes').select('*').in('id', foreignIds)
    if (error) throw error
    foreignRecipes = data
  }

  return [...ownFavs, ...foreignRecipes]
}

// ── Rezepte ──────────────────────────────────

export async function getAllRecipes({ userId } = {}) {
  let query = db.from('recipes').select('*').order('created_at', { ascending: false })
  if (userId) query = query.eq('user_id', userId)
  const { data, error } = await query
  if (error) throw error
  return data
}

// "Alle Rezepte" aus User-Sicht: eigene + gespeicherte fremde Rezepte.
// Explizit gefiltert (statt nur auf RLS zu verlassen), damit Admins im
// "User View" exakt dasselbe sehen wie ein normaler User.
export async function getOwnAndSavedRecipes(ownUserId) {
  const savedIds = await getSavedRecipeIds(ownUserId)
  let query = db.from('recipes').select('*').order('created_at', { ascending: false })
  if (savedIds.length > 0) {
    query = query.or(`user_id.eq.${ownUserId},id.in.(${savedIds.join(',')})`)
  } else {
    query = query.eq('user_id', ownUserId)
  }
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getOwnRecipeCount(userId) {
  const { count, error } = await db
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (error) throw error
  return count || 0
}

export async function getRecipeById(id) {
  const { data, error } = await db
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function insertRecipe(recipe) {
  const { data, error } = await db
    .from('recipes')
    .insert(recipe)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRecipe(id, fields) {
  const { data, error } = await db
    .from('recipes')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRecipe(id) {
  const { error } = await db
    .from('recipes')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function toggleFavorite(id, current) {
  return updateRecipe(id, { is_favorite: !current })
}

export async function getDiscoveryRecipes(excludeUserId) {
  let query = db.from('recipes').select('*').eq('visibility', 'public').order('created_at', { ascending: false })
  if (excludeUserId) query = query.neq('user_id', excludeUserId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getRecipesByIds(ids) {
  if (!ids.length) return []
  const { data, error } = await db.from('recipes').select('*').in('id', ids)
  if (error) throw error
  return data
}

// ── Likes ────────────────────────────────────

export async function getLikesForRecipeIds(ids) {
  if (!ids.length) return []
  const { data, error } = await db.from('likes').select('recipe_id, user_id').in('recipe_id', ids)
  if (error) throw error
  return data
}

export async function likeRecipe(recipeId, userId) {
  const { error } = await db.from('likes').insert({ recipe_id: recipeId, user_id: userId })
  if (error) throw error
}

export async function unlikeRecipe(recipeId, userId) {
  const { error } = await db.from('likes').delete().eq('recipe_id', recipeId).eq('user_id', userId)
  if (error) throw error
}

// ── Ratings ──────────────────────────────────

export async function getRatingsForRecipeIds(ids) {
  if (!ids.length) return []
  const { data, error } = await db.from('ratings').select('recipe_id, user_id, score').in('recipe_id', ids)
  if (error) throw error
  return data
}

export async function rateRecipe(recipeId, userId, score) {
  const { error } = await db
    .from('ratings')
    .upsert({ recipe_id: recipeId, user_id: userId, score }, { onConflict: 'recipe_id,user_id' })
  if (error) throw error
}

// ── Gespeicherte Rezepte ──────────────────────

export async function getSavedRecipeIds(userId) {
  const { data, error } = await db.from('saved_recipes').select('recipe_id').eq('user_id', userId)
  if (error) throw error
  return data.map(r => r.recipe_id)
}

export async function saveRecipe(recipeId, userId) {
  const { error } = await db.from('saved_recipes').insert({ recipe_id: recipeId, user_id: userId })
  if (error) throw error
}

export async function unsaveRecipe(recipeId, userId) {
  const { error } = await db.from('saved_recipes').delete().eq('recipe_id', recipeId).eq('user_id', userId)
  if (error) throw error
}

// ── Quotes ───────────────────────────────────

export async function getQuotesForUser() {
  const { data, error } = await db
    .from('quotes')
    .select('*')
  if (error) throw error
  return data
}

export async function getAllQuotes() {
  const { data, error } = await db
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function insertQuote(quote) {
  const { data, error } = await db
    .from('quotes')
    .insert(quote)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateQuote(id, fields) {
  const { data, error } = await db
    .from('quotes')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteQuote(id) {
  const { error } = await db.from('quotes').delete().eq('id', id)
  if (error) throw error
}

// ── Bilder (Storage) ─────────────────────────

export async function uploadImage(file, path) {
  const { data, error } = await db.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true })
  if (error) throw error
  return getImageUrl(data.path)
}

export function getImageUrl(path) {
  const { data } = db.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path)
  return data.publicUrl
}

export async function deleteImage(path) {
  await db.storage.from(STORAGE_BUCKET).remove([path])
}

// ── Eigene Filter-Tabs ────────────────────────

export async function getCustomFilters(userId) {
  const { data, error } = await db
    .from('custom_filters')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order')
  if (error) throw error
  return data || []
}

export async function createCustomFilter(userId, fields) {
  const { data, error } = await db
    .from('custom_filters')
    .insert({ user_id: userId, ...fields })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCustomFilter(id, fields) {
  const { data, error } = await db
    .from('custom_filters')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCustomFilter(id) {
  const { error } = await db.from('custom_filters').delete().eq('id', id)
  if (error) throw error
}

export async function reorderCustomFilters(updates) {
  // updates = [{ id, sort_order }, ...]
  for (const u of updates) {
    await db.from('custom_filters').update({ sort_order: u.sort_order }).eq('id', u.id)
  }
}

// ── Sidebar-Layout ────────────────────────────

export async function getSidebarLayout(userId) {
  const { data, error } = await db
    .from('sidebar_layout')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order')
  if (error) throw error
  return data || []
}

export async function upsertSidebarItems(items) {
  // items = [{ user_id, item_key, section, visible, sort_order }, ...]
  const { error } = await db
    .from('sidebar_layout')
    .upsert(items, { onConflict: 'user_id,item_key' })
  if (error) throw error
}

export async function resetSidebarLayout(userId) {
  await db.from('sidebar_layout').delete().eq('user_id', userId)
  await db.from('sidebar_section_order').delete().eq('user_id', userId)
}

export async function getSidebarSectionOrder(userId) {
  const { data, error } = await db
    .from('sidebar_section_order')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order')
  if (error) throw error
  return data || []
}

export async function saveSidebarSectionOrder(userId, sections) {
  // sections = ['sammlung', 'kapitel', 'social', 'custom_filters']
  const rows = sections.map((section, i) => ({ user_id: userId, section, sort_order: i }))
  const { error } = await db
    .from('sidebar_section_order')
    .upsert(rows, { onConflict: 'user_id,section' })
  if (error) throw error
}
