// ─────────────────────────────────────────────
//  Zitate & Grüsse für Fabienne
//  → Einfach neue Einträge hinzufügen!
//  → { text: "...", from: "..." }
// ─────────────────────────────────────────────

const QUOTES = [
  {
    text: "Kochen ist Liebe, die man essen kann.",
    from: "ein kleiner Gruss von Sevi 🐶"
  },
  {
    text: "Das Geheimnis guten Kochens ist Zeit — für die Menschen, die man bekocht.",
    from: "für dich, Fabienne ✨"
  },
  {
    text: "In der Küche passieren die schönsten Dinge.",
    from: "dein persönliches Rezeptarium"
  },
  {
    text: "Manchmal braucht man kein Rezept — nur ein bisschen Mut und viel Butter.",
    from: "Sevi weiss es 🧈"
  },
  {
    text: "Essen ist Heimweh nach einem Moment.",
    from: "für alle Lieblingsrezepte 🍂"
  },
  {
    text: "Du kochst nicht einfach — du schaffst Erinnerungen.",
    from: "in Liebe, dein Bruder"
  },
  {
    text: "Jedes Rezept hier trägt ein kleines Stück von dir.",
    from: "das Rezeptarium ❧"
  },
  {
    text: "Gutes Essen braucht Zeit. Und gute Menschen brauchen gutes Essen.",
    from: "Snoopy stimmt zu 🐾"
  },
]

function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]
}

function getDailyQuote() {
  const day = new Date().getDate()
  return QUOTES[day % QUOTES.length]
}
