# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt sinngemäß [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

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
