# Rezeptarium 🌿

Eine persönliche Rezeptverwaltungs-App im Cottagecore-Bibliotheks-Stil — gebaut mit Liebe für Fabienne.

---

## Was ist das Rezeptarium?

Das Rezeptarium ist eine Web-App zum Sammeln, Verwalten und Entdecken von Rezepten. Inspiriert vom Aesthetic vieler Notion-Setups, aber ohne Abo und ohne Einschränkungen — eine eigene kleine Schatzkammer.

---

## Features

- 📖 Rezepte abspeichern mit Zutaten, Zubereitung und Notizen
- 🖼️ Titelbild und Schrittbilder direkt im Rezept
- 🗂️ Kategorien, Tags und Saisons zum Organisieren
- ❤️ Favoriten markieren
- 🔍 Suchen und Filtern
- 🐶 Tägliche Grüsse von Snoopy

---

## Tech Stack

| Was | Womit |
|-----|-------|
| Frontend | Vue 3 + Vite |
| State | Pinia |
| Navigation | Vue Router |
| Datenbank | Supabase (PostgreSQL) |
| Bilder | Supabase Storage |
| Hosting | Netlify |

---

## Projektstruktur

```
rezeptarium/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.js
    ├── App.vue
    ├── assets/
    │   └── style.css
    ├── lib/
    │   ├── supabase.js
    │   ├── parser.js
    │   └── quotes.js
    ├── stores/
    │   └── recipes.js
    ├── components/
    │   ├── AppSidebar.vue
    │   ├── QuoteBanner.vue
    │   ├── RecipeCard.vue
    │   ├── TagInput.vue
    │   └── SeasonPicker.vue
    └── views/
        ├── auth/
        │   ├── LoginView.vue
        │   ├── RegisterView.vue
        │   ├── VerifyEmailView.vue
        │   ├── CallbackView.vue
        │   ├── ResetRequestView.vue
        │   └── ResetPasswordView.vue
        └── app/
            ├── GridView.vue
            ├── DetailView.vue
            └── FormView.vue
```

---

*Gebaut von Severin Lieb — für meine Schwester Fabienne* 🌿
