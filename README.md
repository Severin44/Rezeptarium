# Rezeptarium 🌿

Fabiennes persönliches Rezeptbuch im Cottagecore-Bibliotheks-Stil.

---

## Setup (einmalig, ca. 15 Minuten)

### 1. Supabase Projekt erstellen
1. Gehe auf [supabase.com](https://supabase.com) → "Start your project"
2. Neues Projekt erstellen (Region: Europe West)
3. Warte bis das Projekt fertig ist (~1 Minute)

### 2. Datenbank einrichten
1. Im Supabase Dashboard: **SQL Editor** → **New Query**
2. Inhalt von `supabase-setup.sql` reinkopieren
3. **Run** klicken

### 3. Keys eintragen
1. Im Supabase Dashboard: **Project Settings** → **API**
2. Kopiere **Project URL** und **anon public key**
3. Trage sie in `js/config.js` ein:

```js
const SUPABASE_URL = 'https://dein-projekt.supabase.co'
const SUPABASE_KEY = 'dein-anon-key'
```

### 4. App starten
Einfach `index.html` im Browser öffnen — fertig!

Oder für Hosting: Ordner auf [Netlify Drop](https://app.netlify.com/drop) ziehen.

---

## Zitate anpassen

In `js/quotes.js` kannst du beliebig viele Grüsse und Zitate für Fabienne hinzufügen:

```js
{
  text: "Dein Zitat hier.",
  from: "von dir, Sevi 🐶"
},
```

---

## Dateistruktur

```
rezeptarium/
├── index.html
├── supabase-setup.sql
├── css/
│   └── style.css
└── js/
    ├── config.js      ← Supabase Keys (hier eintragen!)
    ├── quotes.js      ← Zitate & Grüsse für Fabienne
    ├── parser.js      ← Zutaten-Parser & Instructions-Renderer
    ├── db.js          ← Alle Supabase Operationen
    └── app.js         ← App-Logik & UI
```
