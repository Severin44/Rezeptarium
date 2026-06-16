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

// ── Rezepte ──────────────────────────────────

export async function getAllRecipes({ userId } = {}) {
  let query = db.from('recipes').select('*').order('created_at', { ascending: false })
  if (userId) query = query.eq('user_id', userId)
  const { data, error } = await query
  if (error) throw error
  return data
}

// "Alle Rezepte" aus User-Sicht: eigene + öffentliche Rezepte anderer.
// Wird explizit so gefiltert (statt sich nur auf RLS zu verlassen), damit
// Admins im "User View" exakt das sehen, was ein normaler User sieht —
// die RLS-Policy "Admin sieht alle" würde sonst trotzdem alles liefern.
export async function getOwnAndPublicRecipes(ownUserId) {
  const { data, error } = await db
    .from('recipes')
    .select('*')
    .or(`is_public.eq.true,user_id.eq.${ownUserId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
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
  let query = db.from('recipes').select('*').eq('is_public', true).order('created_at', { ascending: false })
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
