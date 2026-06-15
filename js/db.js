// ─────────────────────────────────────────────
//  Datenbank-Schicht (Supabase)
// ─────────────────────────────────────────────

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Auth ─────────────────────────────────────

async function signIn(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

async function signOut() {
  const { error } = await db.auth.signOut()
  if (error) throw error
}

async function getSession() {
  const { data } = await db.auth.getSession()
  return data.session
}

// ── Rezepte ──────────────────────────────────

async function getAllRecipes() {
  const { data, error } = await db
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

async function getRecipeById(id) {
  const { data, error } = await db
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

async function insertRecipe(recipe) {
  const { data, error } = await db
    .from('recipes')
    .insert(recipe)
    .select()
    .single()
  if (error) throw error
  return data
}

async function updateRecipe(id, fields) {
  const { data, error } = await db
    .from('recipes')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

async function deleteRecipe(id) {
  const { error } = await db
    .from('recipes')
    .delete()
    .eq('id', id)
  if (error) throw error
}

async function toggleFavorite(id, current) {
  return updateRecipe(id, { is_favorite: !current })
}

// ── Bilder (Storage) ─────────────────────────

async function uploadImage(file, path) {
  const { data, error } = await db.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true })
  if (error) throw error
  return getImageUrl(data.path)
}

function getImageUrl(path) {
  const { data } = db.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path)
  return data.publicUrl
}

async function deleteImage(path) {
  await db.storage.from(STORAGE_BUCKET).remove([path])
}
