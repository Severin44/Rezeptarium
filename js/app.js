// ─────────────────────────────────────────────
//  App Logic
// ─────────────────────────────────────────────

let allRecipes = []
let activeFilter = ''
let searchQuery = ''
let editingId = null
let emptyStateEl = null
let activeSeasons = []
let activeTags = []
let currentTags = []
let eventsBound = false

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
  if (eventsBound) return
  eventsBound = true
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

  // Saison-Filter Dropdown
  document.getElementById('season-btn').addEventListener('click', e => {
    e.stopPropagation()
    const panel = document.getElementById('season-panel')
    const tagPanel = document.getElementById('tag-panel')
    tagPanel.hidden = true
    panel.hidden = !panel.hidden
  })
  // Desktop Saison-Checkboxen (im Dropdown-Panel)
  document.querySelectorAll('#season-panel .season-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      activeSeasons = [...document.querySelectorAll('#season-panel .season-cb:checked')].map(c => c.value)
      updateFilterLabels()
      renderGrid()
    })
  })

  // Tag-Filter Dropdown (Desktop)
  document.getElementById('tag-btn').addEventListener('click', e => {
    e.stopPropagation()
    const panel = document.getElementById('tag-panel')
    const seasonPanel = document.getElementById('season-panel')
    seasonPanel.hidden = true
    panel.hidden = !panel.hidden
  })

  // Dropdowns schliessen bei Klick ausserhalb
  document.addEventListener('click', () => {
    document.getElementById('season-panel').hidden = true
    document.getElementById('tag-panel').hidden = true
  })
  document.getElementById('season-drop').addEventListener('click', e => e.stopPropagation())
  document.getElementById('tag-drop').addEventListener('click', e => e.stopPropagation())

  // Mobile Filter-Modal
  document.getElementById('filter-modal-btn').addEventListener('click', openFilterModal)
  document.getElementById('filter-modal-close').addEventListener('click', closeFilterModal)
  document.getElementById('filter-modal-overlay').addEventListener('click', closeFilterModal)
  document.getElementById('filter-modal-apply').addEventListener('click', applyFilterModal)
  document.getElementById('filter-modal-reset').addEventListener('click', resetFilterModal)

  // Tag-Input im Formular
  const tagInput = document.getElementById('f-tag-input')
  tagInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = tagInput.value.trim().replace(/,$/, '')
      if (val && !currentTags.includes(val)) addFormTag(val)
      tagInput.value = ''
      document.getElementById('tag-suggest-box').hidden = true
    } else if (e.key === 'Backspace' && !tagInput.value && currentTags.length) {
      currentTags.pop()
      renderFormTagPills()
    }
  })
  tagInput.addEventListener('input', () => showTagSuggestions(tagInput.value))
  tagInput.addEventListener('blur', () => {
    setTimeout(() => { document.getElementById('tag-suggest-box').hidden = true }, 150)
  })

  // Add-Buttons
  document.getElementById('btn-add-sidebar').addEventListener('click', openAddForm)
  document.getElementById('btn-add-main').addEventListener('click', openAddForm)
  document.getElementById('btn-add-mobile').addEventListener('click', openAddForm)

  // Mobile Burger
  document.getElementById('burger-btn').addEventListener('click', openSidebar)
  document.getElementById('sidebar-close').addEventListener('click', closeSidebar)
  document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar)

  // Sidebar auf Mobile schliessen wenn Nav-Item geklickt
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => { if (window.innerWidth <= 700) closeSidebar() })
  })

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
    populateTagFilterPanel()
    populateModalTagGroup()
    renderGrid()
  } catch (e) {
    showToast('Fehler beim Laden der Rezepte.', 'error')
    console.error(e)
  }
}

// ── Tag-Filter Panel befüllen ─────────────────

function populateTagFilterPanel() {
  const panel = document.getElementById('tag-panel')
  const empty = document.getElementById('tag-panel-empty')
  const allTags = [...new Set(allRecipes.flatMap(r => r.tags || []))].sort()

  if (!allTags.length) { empty.hidden = false; return }
  empty.hidden = true

  const existing = new Set([...panel.querySelectorAll('input')].map(i => i.value))
  allTags.forEach(tag => {
    if (existing.has(tag)) return
    const label = document.createElement('label')
    label.className = 'filter-opt'
    const cb = document.createElement('input')
    cb.type = 'checkbox'
    cb.value = tag
    if (activeTags.includes(tag)) cb.checked = true
    cb.addEventListener('change', () => {
      activeTags = [...panel.querySelectorAll('input:checked')].map(c => c.value)
      updateFilterLabels()
      renderGrid()
    })
    label.appendChild(cb)
    label.append(' ' + tag)
    panel.appendChild(label)
  })
}

function updateFilterLabels() {
  document.getElementById('season-label').textContent =
    activeSeasons.length ? activeSeasons.join(', ') : 'Saison'
  document.getElementById('tag-filter-label').textContent =
    activeTags.length ? `Tags (${activeTags.length})` : 'Tags'
  const total = activeSeasons.length + activeTags.length
  document.getElementById('filter-modal-label').textContent =
    total ? `Filter (${total})` : 'Filter'
}

// ── Tag-Input Formular ────────────────────────

function addFormTag(tag) {
  currentTags.push(tag)
  renderFormTagPills()
}

function removeFormTag(tag) {
  currentTags = currentTags.filter(t => t !== tag)
  renderFormTagPills()
}

function renderFormTagPills() {
  document.getElementById('f-tag-pills').innerHTML =
    currentTags.map(t =>
      `<span class="form-tag-pill">${escHtml(t)}<button type="button" class="form-tag-x" onclick="removeFormTag('${escHtml(t).replace(/'/g, "\\'")}')">×</button></span>`
    ).join('')
}

function showTagSuggestions(query) {
  const box = document.getElementById('tag-suggest-box')
  const q = query.trim().toLowerCase()
  const allTags = [...new Set(allRecipes.flatMap(r => r.tags || []))]
  const matches = allTags.filter(t => t.toLowerCase().includes(q) && !currentTags.includes(t))
  if (!matches.length || !q) { box.hidden = true; return }
  box.innerHTML = matches.map(t =>
    `<div class="tag-suggest-item" onmousedown="pickTagSuggestion('${escHtml(t).replace(/'/g, "\\'")}')">
      ${escHtml(t)}
    </div>`
  ).join('')
  box.hidden = false
}

function pickTagSuggestion(tag) {
  if (!currentTags.includes(tag)) addFormTag(tag)
  document.getElementById('f-tag-input').value = ''
  document.getElementById('tag-suggest-box').hidden = true
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

  // Saison-Filter (OR: mindestens eine Saison muss passen)
  if (activeSeasons.length) {
    list = list.filter(r => activeSeasons.some(s => (r.seasons || []).includes(s)))
  }

  // Tag-Filter (AND: alle gewählten Tags müssen vorhanden sein)
  if (activeTags.length) {
    list = list.filter(r => activeTags.every(t => (r.tags || []).includes(t)))
  }

  // Suche
  if (searchQuery) {
    list = list.filter(r =>
      r.name?.toLowerCase().includes(searchQuery) ||
      r.ingredients?.toLowerCase().includes(searchQuery) ||
      (r.tags || []).some(t => t.toLowerCase().includes(searchQuery))
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
        ${(r.tags && r.tags.length) ? `<div class="card-tags">${r.tags.slice(0, 3).map(t => `<span class="card-tag">${escHtml(t)}</span>`).join('')}</div>` : ''}
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
      ${(r.seasons || []).map(s => `<span class="chip chip-season">${seasonEmoji(s)} ${escHtml(s)}</span>`).join('')}
    </div>
    ${(r.tags && r.tags.length) ? `<div class="detail-tags">${r.tags.map(t => `<span class="detail-tag">${escHtml(t)}</span>`).join('')}</div>` : ''}

    <div class="ornament-rule"><div class="rule-line"></div><div class="rule-diamond"></div><div class="rule-line"></div></div>

    <section class="detail-section">
      <h3 class="sec-title">Zutaten</h3>
      <div class="ing-list">${renderIngredients(r.ingredients)}</div>
    </section>

    <section class="detail-section">
      <h3 class="sec-title">Zubereitung</h3>
      <div class="inst-content">${renderInstructions(r.instructions, {})}</div>
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
  document.querySelectorAll('.f-season').forEach(cb => { cb.checked = false })
  currentTags = []
  renderFormTagPills()
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

  document.querySelectorAll('.f-season').forEach(cb => {
    cb.checked = (r.seasons || []).includes(cb.value)
  })
  currentTags = [...(r.tags || [])]
  renderFormTagPills()
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
      seasons:      [...document.querySelectorAll('.f-season:checked')].map(c => c.value),
      tags:         [...currentTags],
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

// ── Mobile Sidebar ────────────────────────────

function openSidebar() {
  document.getElementById('sidebar').classList.add('open')
  document.getElementById('sidebar-overlay').classList.add('show')
  document.body.style.overflow = 'hidden'
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open')
  document.getElementById('sidebar-overlay').classList.remove('show')
  document.body.style.overflow = ''
}

// ── Filter Modal (Mobile) ─────────────────────

function openFilterModal() {
  // Aktuellen State in Modal-UI spiegeln
  document.querySelectorAll('#filter-modal .season-cb').forEach(cb => {
    cb.checked = activeSeasons.includes(cb.value)
  })
  const sortVal = document.getElementById('sort-select').value
  document.querySelectorAll('input[name="modal-sort"]').forEach(r => {
    r.checked = r.value === sortVal
  })
  populateModalTagGroup()
  document.getElementById('filter-modal').hidden = false
  document.getElementById('filter-modal-overlay').hidden = false
  document.body.style.overflow = 'hidden'
}

function closeFilterModal() {
  document.getElementById('filter-modal').hidden = true
  document.getElementById('filter-modal-overlay').hidden = true
  document.body.style.overflow = ''
}

function applyFilterModal() {
  // Saison
  activeSeasons = [...document.querySelectorAll('#filter-modal .season-cb:checked')].map(c => c.value)
  // Tags
  activeTags = [...document.querySelectorAll('#modal-tag-group .modal-tag-pill.active')].map(el => el.dataset.tag)
  // Sortierung
  const sortVal = document.querySelector('input[name="modal-sort"]:checked')?.value || 'newest'
  document.getElementById('sort-select').value = sortVal
  updateFilterLabels()
  renderGrid()
  closeFilterModal()
}

function resetFilterModal() {
  document.querySelectorAll('#filter-modal .season-cb').forEach(cb => cb.checked = false)
  document.querySelectorAll('#modal-tag-group .modal-tag-pill').forEach(p => p.classList.remove('active'))
  document.querySelector('input[name="modal-sort"][value="newest"]').checked = true
}

function populateModalTagGroup() {
  const group = document.getElementById('modal-tag-group')
  const empty = document.getElementById('modal-tag-empty')
  const allTags = [...new Set(allRecipes.flatMap(r => r.tags || []))].sort()
  if (!allTags.length) { empty.hidden = false; return }
  empty.hidden = true
  group.innerHTML = ''
  allTags.forEach(tag => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'modal-tag-pill' + (activeTags.includes(tag) ? ' active' : '')
    btn.dataset.tag = tag
    btn.textContent = tag
    btn.addEventListener('click', () => btn.classList.toggle('active'))
    group.appendChild(btn)
  })
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

function seasonEmoji(s) {
  return { 'Frühling': '🌱', 'Sommer': '☀️', 'Herbst': '🍂', 'Winter': '❄️' }[s] || ''
}

function showToast(msg, type = 'success') {
  const el = document.getElementById('toast')
  el.textContent = msg
  el.className = `toast show${type === 'error' ? ' error' : ''}`
  clearTimeout(el._timer)
  el._timer = setTimeout(() => el.classList.remove('show'), 3000)
}
