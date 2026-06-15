// ─────────────────────────────────────────────
//  App Logic
// ─────────────────────────────────────────────

let allRecipes = []
let activeFilter = ''
let searchQuery = ''
let editingId = null
let emptyStateEl = null

// ── Init ──────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const session = await getSession()
  if (session) {
    showApp()
  } else {
    showLoginScreen()
  }

  db.auth.onAuthStateChange((event, session) => {
    if (session) showApp()
    else showLoginScreen()
  })

  document.getElementById('btn-login').addEventListener('click', handleLogin)
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin()
  })
})

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim()
  const password = document.getElementById('login-password').value
  const btn = document.getElementById('btn-login')
  const errorEl = document.getElementById('login-error')

  errorEl.style.display = 'none'
  btn.disabled = true
  document.getElementById('login-label').textContent = 'Wird geladen…'

  try {
    await signIn(email, password)
  } catch (e) {
    errorEl.textContent = 'E-Mail oder Passwort falsch.'
    errorEl.style.display = 'block'
    btn.disabled = false
    document.getElementById('login-label').textContent = 'Eintreten'
  }
}

function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'block'
  document.getElementById('app-shell').style.display = 'none'
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none'
  document.getElementById('app-shell').style.display = 'grid'
  initQuote()
  bindEvents()
  loadRecipes()
}

// ── Quote ────────────────────────────────────

const SNOOPY_IMGS = Array.from({length: 24}, (_, i) =>
  `assets/snoopy_svg/Untitled-1-${String(i + 2).padStart(2, '0')}.svg`
)

function getRandomSnoopyImg() {
  return SNOOPY_IMGS[Math.floor(Math.random() * SNOOPY_IMGS.length)]
}

function initQuote() {
  const quote = getRandomQuote()
  document.getElementById('quote-text').textContent = `„${quote.text}"`
  document.getElementById('quote-meta').textContent = quote.from
  document.getElementById('quote-snoopy').src = getRandomSnoopyImg()
}


// ── Events ───────────────────────────────────

function bindEvents() {
  emptyStateEl = document.getElementById('empty-state')

  // Navigation
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter
      console.log('Filter geklickt:', filter)

      if (filter === 'favorite') {
        activeFilter = '__fav__'
      } else {
        activeFilter = filter || ''
      }

      console.log('activeFilter gesetzt auf:', activeFilter)

      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')

      showView('grid')
      renderGrid()
    })
  })

  // Zitat rotieren
  document.getElementById('btn-refresh-quote').addEventListener('click', () => {
    const q = document.getElementById('quote-text')
    const m = document.getElementById('quote-meta')
    q.style.opacity = '0'
    m.style.opacity = '0'
    setTimeout(() => {
      const quote = getRandomQuote()
      q.textContent = `„${quote.text}"`
      m.textContent = quote.from
      q.style.opacity = '1'
      m.style.opacity = '1'
      document.getElementById('quote-snoopy').src = getRandomSnoopyImg()
    }, 250)
  })

  // Suche
  document.getElementById('search-input').addEventListener('input', e => {
    searchQuery = e.target.value.toLowerCase()
    renderGrid()
  })

  // Sortierung
  document.getElementById('sort-select').addEventListener('change', renderGrid)

  // Add-Buttons
  document.getElementById('btn-add-sidebar').addEventListener('click', openAddForm)
  document.getElementById('btn-add-main').addEventListener('click', openAddForm)

  // Back
  document.getElementById('btn-back-detail').addEventListener('click', () => showView('grid'))
  document.getElementById('btn-back-form').addEventListener('click', () => showView('grid'))
  document.getElementById('btn-cancel-form').addEventListener('click', () => showView('grid'))

  // Titelbild Upload
  const uploadArea = document.getElementById('upload-area')
  const coverInput = document.getElementById('cover-input')
  uploadArea.addEventListener('click', () => coverInput.click())
  coverInput.addEventListener('change', handleCoverPreview)

  // Bild in Instructions einfügen
  document.getElementById('btn-insert-img').addEventListener('click', () => {
    document.getElementById('inst-img-input').click()
  })
  document.getElementById('inst-img-input').addEventListener('change', handleInstImg)

  // Formular speichern
  document.getElementById('recipe-form').addEventListener('submit', handleSave)
}

// ── Daten laden ───────────────────────────────

async function loadRecipes() {
  try {
    allRecipes = await getAllRecipes()
    updateCounts()
    renderGrid()
  } catch (e) {
    showToast('Fehler beim Laden der Rezepte.', 'error')
    console.error(e)
  }
}

function updateCounts() {
  document.getElementById('count-all').textContent = allRecipes.length
  document.getElementById('count-fav').textContent = allRecipes.filter(r => r.is_favorite).length
}

// ── Grid rendern ──────────────────────────────

function renderGrid() {
  const sort = document.getElementById('sort-select').value
  let list = [...allRecipes]

  // Filter
  if (activeFilter === '__fav__') {
    list = list.filter(r => r.is_favorite)
  } else if (activeFilter) {
    list = list.filter(r => r.category === activeFilter)
  }

  // Suche
  if (searchQuery) {
    list = list.filter(r =>
      r.name?.toLowerCase().includes(searchQuery) ||
      r.ingredients?.toLowerCase().includes(searchQuery)
    )
  }

  // Sortierung
  if (sort === 'az') list.sort((a, b) => a.name.localeCompare(b.name, 'de'))
  else if (sort === 'time') list.sort((a, b) => ((a.prep_time || 0) + (a.cook_time || 0)) - ((b.prep_time || 0) + (b.cook_time || 0)))
  else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const grid = document.getElementById('recipe-grid')
  const empty = emptyStateEl

  if (list.length === 0) {
    grid.innerHTML = ''
    grid.appendChild(empty)
    empty.style.display = 'flex'
    return
  }

  empty.style.display = 'none'
  grid.innerHTML = list.map(r => recipeCardHTML(r)).join('')

  // Click Events auf Karten
  grid.querySelectorAll('.recipe-card').forEach(card => {
    card.addEventListener('click', () => openDetail(card.dataset.id))
  })
}

function recipeCardHTML(r) {
  const totalTime = (r.prep_time || 0) + (r.cook_time || 0)
  const imgStyle = r.cover_image_url
    ? `background-image:url('${r.cover_image_url}');background-size:cover;background-position:center`
    : `background:${catColor(r.category)}`
  const emoji = r.cover_image_url ? '' : `<span class="card-emoji">${catEmoji(r.category)}</span>`

  return `
    <div class="recipe-card${r.is_favorite ? ' fav' : ''}" data-id="${r.id}">
      <div class="card-img" style="${imgStyle}">
        ${emoji}
        <span class="cat-badge">${escHtml(r.category || '')}</span>
        ${r.is_favorite ? '<span class="fav-badge"><i class="ti ti-heart"></i></span>' : ''}
      </div>
      <div class="card-body">
        <div class="card-name">${escHtml(r.name)}</div>
        <div class="card-meta">
          ${r.prep_time ? `<span class="meta-item"><i class="ti ti-clock"></i>${r.prep_time} Min.</span>` : ''}
          ${r.cook_time ? `<span class="meta-item"><i class="ti ti-flame"></i>${r.cook_time} Min.</span>` : ''}
          ${r.servings  ? `<span class="meta-item"><i class="ti ti-users"></i>${r.servings}</span>` : ''}
        </div>
      </div>
    </div>`
}

// ── Detail View ───────────────────────────────

async function openDetail(id) {
  try {
    const r = await getRecipeById(id)
    document.getElementById('detail-content').innerHTML = detailHTML(r)

    // Events im Detail
    document.getElementById('btn-fav').addEventListener('click', async () => {
      await toggleFavorite(r.id, r.is_favorite)
      await loadRecipes()
      openDetail(r.id)
    })
    document.getElementById('btn-edit').addEventListener('click', () => openEditForm(r))
    document.getElementById('btn-delete').addEventListener('click', () => confirmDelete(r))

    showView('detail')
  } catch (e) {
    showToast('Rezept konnte nicht geladen werden.', 'error')
  }
}

function detailHTML(r) {
  const totalPrep = r.prep_time ? `${r.prep_time} Min. Vorbereitung` : ''
  const totalCook = r.cook_time ? `${r.cook_time} Min. ${r.category === 'Backen' ? 'Backen' : 'Kochen'}` : ''

  const coverStyle = r.cover_image_url
    ? `background-image:url('${r.cover_image_url}');background-size:cover;background-position:center`
    : `background:${catColor(r.category)};display:flex;align-items:center;justify-content:center;font-size:52px`
  const coverContent = r.cover_image_url ? '' : catEmoji(r.category)

  return `
    <div class="detail-cover" style="${coverStyle}">${coverContent}</div>

    <div class="detail-header">
      <div>
        <div class="detail-eyebrow">${escHtml(r.category || '')} · aus der Sammlung</div>
        <h2 class="detail-title">${escHtml(r.name)}</h2>
      </div>
      <div class="detail-actions">
        <button class="btn-fav${r.is_favorite ? ' active' : ''}" id="btn-fav" title="${r.is_favorite ? 'Aus Favoriten entfernen' : 'Als Favorit markieren'}">
          <i class="ti ti-heart"></i>${r.is_favorite ? 'Favorit' : 'Favorisieren'}
        </button>
        <button class="btn-icon" id="btn-edit" title="Bearbeiten"><i class="ti ti-edit"></i></button>
        <button class="btn-icon danger" id="btn-delete" title="Löschen"><i class="ti ti-trash"></i></button>
      </div>
    </div>

    <div class="detail-chips">
      ${totalPrep ? `<span class="chip"><i class="ti ti-clock"></i>${totalPrep}</span>` : ''}
      ${totalCook ? `<span class="chip"><i class="ti ti-flame"></i>${totalCook}</span>` : ''}
      ${r.servings  ? `<span class="chip"><i class="ti ti-users"></i>${r.servings} Portionen</span>` : ''}
    </div>

    <div class="ornament-rule"><div class="rule-line"></div><div class="rule-diamond"></div><div class="rule-line"></div></div>

    <section class="detail-section">
      <h3 class="sec-title">Zutaten</h3>
      <div class="ing-list">${renderIngredients(r.ingredients)}</div>
    </section>

    <section class="detail-section">
      <h3 class="sec-title">Zubereitung</h3>
      <div class="inst-content">${renderInstructions(r.instructions)}</div>
    </section>

    ${r.notes ? `
    <section class="detail-section">
      <h3 class="sec-title">Tipps & Notizen</h3>
      <p class="notes-text">${escHtml(r.notes)}</p>
    </section>` : ''}
  `
}

// ── Formular ──────────────────────────────────

function openAddForm() {
  editingId = null
  document.getElementById('f-id').value = ''
  document.getElementById('recipe-form').reset()
  document.getElementById('cover-preview').style.display = 'none'
  document.getElementById('upload-area').style.display = 'flex'
  document.getElementById('form-eyebrow').textContent = 'neuer Eintrag'
  document.getElementById('form-title').textContent = 'Rezept hinzufügen'
  document.getElementById('save-label').textContent = 'Eintragen'
  showView('form')
}

function openEditForm(r) {
  editingId = r.id
  document.getElementById('f-id').value = r.id
  document.getElementById('f-name').value = r.name || ''
  document.getElementById('f-cat').value = r.category || 'Sonstiges'
  document.getElementById('f-prep').value = r.prep_time || ''
  document.getElementById('f-cook').value = r.cook_time || ''
  document.getElementById('f-port').value = r.servings || ''
  document.getElementById('f-ing').value = r.ingredients || ''
  document.getElementById('f-inst').value = r.instructions || ''
  document.getElementById('f-notes').value = r.notes || ''

  if (r.cover_image_url) {
    document.getElementById('cover-preview').src = r.cover_image_url
    document.getElementById('cover-preview').style.display = 'block'
    document.getElementById('upload-area').style.display = 'none'
  } else {
    document.getElementById('cover-preview').style.display = 'none'
    document.getElementById('upload-area').style.display = 'flex'
  }

  document.getElementById('form-eyebrow').textContent = 'Eintrag bearbeiten'
  document.getElementById('form-title').textContent = r.name
  document.getElementById('save-label').textContent = 'Speichern'
  showView('form')
}

async function handleSave(e) {
  e.preventDefault()
  const name = document.getElementById('f-name').value.trim()
  if (!name) { showToast('Bitte einen Namen eingeben.', 'error'); return }

  const btn = e.submitter
  btn.disabled = true
  document.getElementById('save-label').textContent = 'Wird gespeichert…'

  try {
    // Titelbild hochladen falls neu gewählt
    let coverUrl = editingId ? (await getRecipeById(editingId)).cover_image_url : null
    const coverFile = document.getElementById('cover-input').files[0]
    if (coverFile) {
      const path = `covers/${Date.now()}-${coverFile.name.replace(/\s/g, '_')}`
      coverUrl = await uploadImage(coverFile, path)
    }

    const payload = {
      name,
      category:     document.getElementById('f-cat').value,
      prep_time:    parseInt(document.getElementById('f-prep').value) || null,
      cook_time:    parseInt(document.getElementById('f-cook').value) || null,
      servings:     parseInt(document.getElementById('f-port').value) || null,
      ingredients:  document.getElementById('f-ing').value.trim() || null,
      instructions: document.getElementById('f-inst').value.trim() || null,
      notes:        document.getElementById('f-notes').value.trim() || null,
      cover_image_url: coverUrl,
    }

    if (editingId) {
      await updateRecipe(editingId, payload)
      showToast('Rezept aktualisiert.')
    } else {
      await insertRecipe(payload)
      showToast('Rezept eingetragen.')
    }

    await loadRecipes()
    showView('grid')
  } catch (err) {
    showToast('Fehler beim Speichern.', 'error')
    console.error(err)
  } finally {
    btn.disabled = false
    document.getElementById('save-label').textContent = editingId ? 'Speichern' : 'Eintragen'
  }
}

async function confirmDelete(r) {
  if (!confirm(`„${r.name}" wirklich löschen?`)) return
  try {
    await deleteRecipe(r.id)
    showToast('Rezept gelöscht.')
    await loadRecipes()
    showView('grid')
  } catch (e) {
    showToast('Fehler beim Löschen.', 'error')
  }
}

// ── Bild Uploads ──────────────────────────────

function handleCoverPreview(e) {
  const file = e.target.files[0]
  if (!file) return
  const url = URL.createObjectURL(file)
  const preview = document.getElementById('cover-preview')
  preview.src = url
  preview.style.display = 'block'
  document.getElementById('upload-area').style.display = 'none'
}

async function handleInstImg(e) {
  const file = e.target.files[0]
  if (!file) return

  const ta = document.getElementById('f-inst')
  const placeholder = `img-${Date.now()}`
  const tag = `\n![](${placeholder})\n`

  // Tag an Cursorposition einfügen
  const pos = ta.selectionStart
  ta.value = ta.value.slice(0, pos) + tag + ta.value.slice(pos)
  ta.focus()

  // Bild im Hintergrund hochladen und Tag ersetzen
  showToast('Bild wird hochgeladen…')
  try {
    const path = `instructions/${Date.now()}-${file.name.replace(/\s/g, '_')}`
    const url = await uploadImage(file, path)
    ta.value = ta.value.replace(`![](${placeholder})`, `![](${url})`)
    showToast('Bild eingefügt.')
  } catch (err) {
    ta.value = ta.value.replace(`![](${placeholder})`, '')
    showToast('Bild-Upload fehlgeschlagen.', 'error')
  }

  e.target.value = ''
}

// ── Views ─────────────────────────────────────

function showView(name) {
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active')
  })
  document.getElementById(`view-${name}`).classList.add('active')
  window.scrollTo(0, 0)
}

// ── Hilfsfunktionen ───────────────────────────

function catColor(cat) {
  const map = {
    'Frühstück':    '#f5ede0',
    'Hauptgericht': '#eef2e4',
    'Dessert':      '#f0ebe0',
    'Backen':       '#faeee8',
    'Snack':        '#e8f0e8',
    'Sonstiges':    '#f0ece4',
  }
  return map[cat] || '#f5ede0'
}

function catEmoji(cat) {
  const map = {
    'Frühstück':    '☕',
    'Hauptgericht': '🍝',
    'Dessert':      '🥧',
    'Backen':       '🥐',
    'Snack':        '🍎',
    'Sonstiges':    '🌿',
  }
  return map[cat] || '🍽️'
}

function showToast(msg, type = 'success') {
  const el = document.getElementById('toast')
  el.textContent = msg
  el.className = `toast show${type === 'error' ? ' error' : ''}`
  clearTimeout(el._timer)
  el._timer = setTimeout(() => el.classList.remove('show'), 3000)
}
