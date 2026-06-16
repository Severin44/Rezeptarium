# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt sinngemäß [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

## [1.1.0]

### Added
- Multi-User-Unterstützung: Rezepte gehören jeweils einem User (`user_id`), neue `profiles`-Tabelle mit `is_admin`-Flag, automatisch befüllt per Trigger bei Registrierung.
- Admin kann zwischen "Alle Rezepte" und "Nur meine" wechseln und zusätzlich nach einzelnem User filtern.
- Rezeptkarte zeigt für Admins den Ersteller-Usernamen an.
- Neue `quotes`-Tabelle in Supabase: Zitate werden jetzt aus der DB geladen statt aus `quotes.js`; Zitate können global oder einem bestimmten User zugewiesen werden.
- Admin-Oberfläche unter „Verwaltung → Zitate" zum Erstellen, Bearbeiten und Löschen von Zitaten inkl. User-Zuweisung.
- Registrierung fragt nun einen Benutzernamen ab.
- SQL-Migration `supabase-migration-002-multi-user.sql` für die DB-Änderungen (user_id, profiles, quotes, RLS-Policies).
- `netlify.toml` mit Build-Befehl, Publish-Verzeichnis und SPA-Redirect für Vue Router im History-Modus.

### Changed
- `getProfile()` nutzt `.maybeSingle()` statt `.single()`, damit ein fehlendes Profil nicht mehr die gesamte App blockiert.

### Fixed
- Endlose RLS-Rekursion behoben: Die Admin-Check-Policies fragten `profiles` innerhalb einer Policy auf `profiles` selbst ab, was zu 500-Fehlern bei jedem Zugriff auf `profiles`/`recipes`/`quotes` führte. Gelöst mit einer `is_admin()` SECURITY DEFINER-Funktion (`supabase-migration-003-fix-rls-recursion.sql`), die RLS beim Admin-Check umgeht.
- Veraltete, offene RLS-Policies aus einem früheren Setup-Stand (`Lesen erlaubt`, `Nur Auth …`) entfernt, die mit den neuen restriktiven Policies kollidierten.
- `authStore.load()` fängt Fehler beim Laden des Profils jetzt ab, statt den kompletten Lade-Vorgang der Rezepte-Ansicht zu blockieren.

### Removed
- `src/lib/quotes.js` entfernt — Zitate kommen vollständig aus der Datenbank.

## [1.0.0]

### Added
- Komplettes Refactoring auf Vue 3 (Composition API), Vite, Pinia und Vue Router; Supabase bleibt als Backend unverändert.
- Neue Auth-Views: Registrierung, E-Mail-Verifizierung, Auth-Callback, Passwort-Reset-Anfrage und Passwort-Reset über Supabase Auth.
- Logout-Button in der Sidebar.
- Sichtbarer "Konto erstellen"-Button auf der Login-Seite (statt reinem Text-Link).

### Changed
- App-Struktur in Komponenten (`AppSidebar`, `QuoteBanner`, `RecipeCard`, `TagInput`, `SeasonPicker`) und Views (Grid/Detail/Form) aufgeteilt; globaler State liegt jetzt in einem Pinia-Store statt in losen Modulvariablen.
- Statische Assets liegen neu unter `public/assets`.

### Fixed
- Schrittbilder in der Zubereitung werden wieder angezeigt: `renderInstructions()` erkennt direkt gespeicherte `https://`-URLs, ohne sie in `imageUrls` nachzuschlagen.
- `TypeError` beim Laden des Tag-Filters im mobilen Filter-Modal behoben, falls die zugehörigen DOM-Elemente noch nicht existieren.
- Saison-Filter im mobilen Filter-Modal lässt sich jetzt wieder abwählen.
- Der mobile "Filter"-Button ist nun korrekt nur in der Handy-Ansicht sichtbar.
- Schrittbilder werden auf Desktop nur noch in 50% Breite angezeigt; in der mobilen Ansicht bleibt die volle Breite erhalten.

## [0.3.0]

### Added
- Saison-Filter (Frühling, Sommer, Herbst, Winter) und freie Tags für Rezepte inklusive Filter-Dropdowns in der Toolbar.
- Mobile Ansicht mit Burger-Menü, Sidebar-Drawer und gebündeltem Filter-Modal (Bottom-Sheet) für Saison/Tags/Sortierung.
- Woodstock-Icon als Favicon.
- Zufällige Snoopy-Illustrationen für das Zitat-Banner.

### Fixed
- Kategorie-Filter blieb nach dem ersten Klick eingefroren (doppelt registrierte Event-Listener durch zweifachen `bindEvents()`-Aufruf).
- Zitat des Tages war nicht wirklich zufällig.
- Filter-Dropdowns blieben dauerhaft geöffnet bzw. ließen sich gar nicht mehr öffnen.

## [0.2.0]

### Added
- Snoopy-Illustrationen in der Sidebar.

## [0.1.0]

### Added
- Login-Funktion über Supabase Auth.
- Grundgerüst der Rezeptverwaltung (Anlegen, Anzeigen, Bearbeiten, Löschen von Rezepten).
