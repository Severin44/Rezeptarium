import { jsPDF } from 'jspdf'
import { parseIngredientLine } from './parser'

// Rezeptarium color palette (RGB)
const C = {
  bg:       [248, 246, 240],
  ink:      [46,  36,  22],
  muted:    [122, 110, 95],
  warm:     [196, 168, 130],
  warmDark: [138, 110, 78],
  border:   [216, 207, 192],
}

const CAT_COLORS = {
  'Frühstück':    [245, 237, 224],
  'Hauptgericht': [238, 242, 228],
  'Dessert':      [240, 235, 224],
  'Backen':       [250, 238, 232],
  'Snack':        [232, 240, 232],
  'Sonstiges':    [240, 236, 228],
}

const W  = 210   // A4 width mm
const H  = 297   // A4 height mm
const ML = 18    // left margin
const MR = 18    // right margin
const TW = W - ML - MR  // text width

async function toBase64(url) {
  try {
    const res  = await fetch(url)
    const blob = await res.blob()
    return await new Promise((ok, fail) => {
      const r = new FileReader()
      r.onloadend = () => ok(r.result)
      r.onerror   = fail
      r.readAsDataURL(blob)
    })
  } catch { return null }
}

function pageBg(doc) {
  doc.setFillColor(...C.bg)
  doc.rect(0, 0, W, H, 'F')
}

function ornamentRule(doc, y) {
  const cx = W / 2
  doc.setDrawColor(...C.warm)
  doc.setLineWidth(0.3)
  doc.line(ML, y, cx - 4, y)
  doc.setFillColor(...C.warm)
  doc.rect(cx - 1.5, y - 1.5, 3, 3, 'F')
  doc.line(cx + 4, y, W - MR, y)
}

export async function exportRecipeToPdf(recipe) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = ML

  function check(need = 8) {
    if (y + need > H - 16) {
      doc.addPage()
      pageBg(doc)
      y = ML
    }
  }

  function wrap(text, x, fs, color, style = 'normal', w = TW, lh = 5.5) {
    doc.setFontSize(fs)
    doc.setFont('times', style)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(String(text ?? ''), w)
    for (const ln of lines) {
      check(lh + 1)
      doc.text(ln, x, y)
      y += lh
    }
  }

  // ── Page background ───────────────────────
  pageBg(doc)

  // ── Cover image / colour block ────────────
  if (recipe.cover_image_url) {
    const img = await toBase64(recipe.cover_image_url)
    if (img) { doc.addImage(img, 'JPEG', ML, y, TW, 52); y += 55 }
  } else {
    const bg = CAT_COLORS[recipe.category] || C.bg
    doc.setFillColor(...bg)
    doc.rect(ML, y, TW, 26, 'F')
    doc.setFontSize(10)
    doc.setFont('times', 'italic')
    doc.setTextColor(...C.muted)
    doc.text(recipe.category || 'Rezeptarium', W / 2, y + 15, { align: 'center' })
    y += 29
  }

  y += 3

  // ── Recipe title ──────────────────────────
  doc.setFontSize(22)
  doc.setFont('times', 'bolditalic')
  doc.setTextColor(...C.ink)
  const titleLines = doc.splitTextToSize(recipe.name, TW)
  for (const ln of titleLines) { doc.text(ln, ML, y); y += 9 }

  y += 2

  // ── Meta line ─────────────────────────────
  const meta = [
    recipe.category,
    recipe.servings ? `${recipe.servings} Portionen` : null,
    recipe.prep_time ? `${recipe.prep_time} Min. Vorbereitung` : null,
    recipe.cook_time ? `${recipe.cook_time} Min. Kochen` : null,
    recipe.seasons?.length ? recipe.seasons.join(', ') : null,
  ].filter(Boolean).join('  ·  ')

  if (meta) {
    doc.setFontSize(9)
    doc.setFont('times', 'italic')
    doc.setTextColor(...C.muted)
    const ml = doc.splitTextToSize(meta, TW)
    for (const ln of ml) { doc.text(ln, ML, y); y += 5 }
  }

  // ── Tags ──────────────────────────────────
  if (recipe.tags?.length) {
    y += 2
    doc.setFontSize(8)
    doc.setFont('times', 'normal')
    doc.setTextColor(...C.warmDark)
    doc.text(recipe.tags.join('  ·  '), ML, y)
    y += 5
  }

  y += 4
  ornamentRule(doc, y)
  y += 8

  // ── Ingredients ───────────────────────────
  check(16)
  doc.setFontSize(14)
  doc.setFont('times', 'bolditalic')
  doc.setTextColor(...C.ink)
  doc.text('Zutaten', ML, y)
  y += 7

  if (recipe.ingredients) {
    for (const line of recipe.ingredients.split('\n')) {
      const p = parseIngredientLine(line)
      if (!p) continue
      check(6)

      if (p.type === 'section') {
        y += 2
        doc.setFontSize(9)
        doc.setFont('times', 'bolditalic')
        doc.setTextColor(...C.warmDark)
        doc.setDrawColor(...C.border)
        doc.setLineWidth(0.2)
        doc.line(ML, y - 2, ML + 40, y - 2)
        doc.text(p.title, ML, y)
        y += 6
      } else if (p.amount) {
        doc.setFontSize(10)
        doc.setTextColor(...C.ink)
        doc.setFont('times', 'bold')
        doc.text(p.amount, ML, y)
        doc.setFont('times', 'normal')
        doc.text(p.name, ML + 24, y)
        y += 5.5
      } else {
        doc.setFontSize(10)
        doc.setFont('times', 'normal')
        doc.setTextColor(...C.ink)
        doc.text(`• ${p.name}`, ML + 2, y)
        y += 5.5
      }
    }
  }

  // ── Instructions ──────────────────────────
  y += 4
  check(16)
  ornamentRule(doc, y)
  y += 8

  doc.setFontSize(14)
  doc.setFont('times', 'bolditalic')
  doc.setTextColor(...C.ink)
  doc.text('Zubereitung', ML, y)
  y += 7

  if (recipe.instructions) {
    let buf = []
    const flush = (style = 'normal') => {
      if (!buf.length) return
      const text = buf.join(' ').trim()
      buf = []
      if (!text) return
      doc.setFontSize(10)
      doc.setFont('times', style)
      doc.setTextColor(...C.ink)
      for (const ln of doc.splitTextToSize(text, TW)) {
        check(6)
        doc.text(ln, ML, y)
        y += 5.5
      }
      y += 2
    }

    for (const line of recipe.instructions.split('\n')) {
      const sec = line.trim().match(/^---\s*(.+?)\s*---$/)
      const img = line.trim().match(/^!\[\]\(/)
      if (sec) {
        flush()
        check(10)
        y += 2
        doc.setFontSize(10)
        doc.setFont('times', 'bolditalic')
        doc.setTextColor(...C.warmDark)
        doc.text(sec[1], ML, y)
        y += 6
      } else if (img) {
        flush() // skip step images for now
      } else {
        buf.push(line)
      }
    }
    flush()
  }

  // ── Notes ─────────────────────────────────
  if (recipe.notes?.trim()) {
    y += 2
    check(16)
    ornamentRule(doc, y)
    y += 8

    doc.setFontSize(14)
    doc.setFont('times', 'bolditalic')
    doc.setTextColor(...C.ink)
    doc.text('Tipps & Notizen', ML, y)
    y += 7

    let buf = []
    const flush = () => {
      if (!buf.length) return
      const text = buf.join(' ').trim()
      buf = []
      if (!text) return
      doc.setFontSize(10)
      doc.setFont('times', 'italic')
      doc.setTextColor(...C.muted)
      for (const ln of doc.splitTextToSize(text, TW)) {
        check(6)
        doc.text(ln, ML, y)
        y += 5.5
      }
      y += 2
    }

    for (const line of recipe.notes.split('\n')) {
      const sec = line.trim().match(/^---\s*(.+?)\s*---$/)
      if (sec) {
        flush()
        check(10)
        y += 2
        doc.setFontSize(10)
        doc.setFont('times', 'bolditalic')
        doc.setTextColor(...C.warmDark)
        doc.text(sec[1], ML, y)
        y += 6
      } else {
        buf.push(line)
      }
    }
    flush()
  }

  // ── Footer on every page ──────────────────
  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setDrawColor(...C.warm)
    doc.setLineWidth(0.3)
    doc.line(ML, H - 12, W - MR, H - 12)
    doc.setFontSize(7.5)
    doc.setFont('times', 'italic')
    doc.setTextColor(...C.warm)
    doc.text('Rezeptarium — meine kleine Schatzkammer', W / 2, H - 7, { align: 'center' })
    if (total > 1) {
      doc.text(`${p} / ${total}`, W - MR, H - 7, { align: 'right' })
    }
  }

  const filename = recipe.name.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').replace(/\s+/g, '_') + '.pdf'
  doc.save(filename)
}
