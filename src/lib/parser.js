// ─────────────────────────────────────────────
//  Parser: Zutaten & Instructions rendern
// ─────────────────────────────────────────────

export function parseIngredientLine(line) {
  const trimmed = line.trim()
  if (!trimmed) return null

  // Abschnittsüberschrift: --- Name ---
  const sectionMatch = trimmed.match(/^---\s*(.+?)\s*---$/)
  if (sectionMatch) {
    return { type: 'section', title: sectionMatch[1] }
  }

  // Mengenangabe am Anfang erkennen
  const amountMatch = trimmed.match(
    /^(\d[\d.,/]*\s*(?:g|kg|ml|l|dl|cl|EL|TL|Stk\.?|Stück|Bund|Prise|Dose|Tasse|Becher|Pck\.?|Pkg\.?|Scheiben?|Zehen?|Blätter?|Blatt|Tropfen|Handvoll|etwas|nach Belieben|ca\.?)?\s*)/i
  )

  if (amountMatch && amountMatch[1].trim()) {
    return {
      type: 'ingredient',
      amount: amountMatch[1].trim(),
      name: trimmed.slice(amountMatch[1].length).trim()
    }
  }

  // Zahl ohne Einheit am Anfang
  const numMatch = trimmed.match(/^(\d+(?:[-–]\d+)?\s+)/)
  if (numMatch) {
    return {
      type: 'ingredient',
      amount: numMatch[1].trim(),
      name: trimmed.slice(numMatch[1].length).trim()
    }
  }

  return { type: 'ingredient', amount: '', name: trimmed }
}

export function renderIngredients(text) {
  if (!text) return '<p class="empty-field">Keine Zutaten angegeben.</p>'
  const lines = text.split('\n')
  let html = ''

  for (const line of lines) {
    const parsed = parseIngredientLine(line)
    if (!parsed) continue

    if (parsed.type === 'section') {
      html += `<span class="ing-section-head">${escHtml(parsed.title)}</span>`
    } else {
      html += `
        <div class="ing-row">
          <span class="ing-amount">${escHtml(parsed.amount)}</span>
          <span class="ing-name">${escHtml(parsed.name)}</span>
        </div>`
    }
  }

  return html || '<p class="empty-field">Keine Zutaten angegeben.</p>'
}

export function renderInstructions(text, imageUrls = {}) {
  if (!text) return '<p class="empty-field">Keine Zubereitung angegeben.</p>'

  const lines = text.split('\n')
  let html = ''
  let textBuffer = []

  const flushText = () => {
    if (textBuffer.length) {
      const joined = textBuffer.join('\n').trim()
      if (joined) html += `<p class="inst-para">${escHtml(joined).replace(/\n/g, '<br>')}</p>`
      textBuffer = []
    }
  }

  for (const line of lines) {
    const imgMatch = line.trim().match(/^!\[\]\((.+?)\)$/)
    if (imgMatch) {
      flushText()
      const key = imgMatch[1]
      const src = key.startsWith('http') ? key : imageUrls[key]
      if (src) {
        html += `<img src="${escHtml(src)}" class="inst-img" alt="Schritt-Bild" loading="lazy">`
      } else {
        html += `<div class="inst-img-placeholder"><i class="ti ti-photo"></i>Bild wird geladen…</div>`
      }
    } else {
      textBuffer.push(line)
    }
  }

  flushText()
  return html || '<p class="empty-field">Keine Zubereitung angegeben.</p>'
}

export function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
