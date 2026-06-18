# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt sinngemäß [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

## [1.3.0] - 2026-06-18

### Added
- **Profilseiten** (`/profile/:username`): Avatar (Upload oder Farbwahl), Bio, Follower-/Following-Zähler, Rezepte nach Sichtbarkeit tabuliert.
- **Profil bearbeiten** (`/profile/edit`): Avatar-Upload oder Buchstaben-Avatar mit 6 Farboptionen, Benutzername, Bio (max. 160 Zeichen).
- **Follow-System**: Nutzern folgen/entfolgen direkt auf Profilseiten und in der User-Suche. Gegenseitiges Folgen = Freunde.
- **Drei Sichtbarkeits-Stufen**: Privat / Freunde / Öffentlich (ersetzt den alten `is_public`-Toggle). `VisibilityPicker`-Komponente im Formular.
- **Following-Feed** (`/following`): Öffentliche Rezepte aller gefolgten User.
- **Freunde-Feed** (`/friends`): Rezepte aller gegenseitigen Follower.
- **User suchen** (`/users`): Debounced Username-Suche mit Inline-Follow/Unfollow.
- **Direktes Rezept-Teilen**: Owner kann Rezept an Freunde (privat) oder alle Follower senden. Share-Modal in Detailansicht, Badge in Sidebar für ungesehene.
- **Mit mir geteilt** (Social-Sektion): empfangene Rezepte mit „New"-Badge; beim Öffnen automatisch als gesehen markiert.
- **Favoriten**-Sammlung: eigene Favoriten (`is_favorite`) + fremd gelikte Rezepte zusammen.
- **Eigene Filter-Tabs** in der Sidebar: benannte Filterkombinationen (Kategorien, Saison, Tags, Favoriten-Flag) speichern, bearbeiten und löschen. „Filterkombination als Tab speichern"-Hint erscheint automatisch bei aktiven Zusatzfiltern; „Filter aktualisieren"-Hint wenn ein bestehender Tab geöffnet und verändert wurde.
- **Kontextuelle Vorauswahl im Formular**: „Neues Rezept" aus gefilterter View übernimmt aktive Kategorie, Saisons und Tags direkt.
- **Kategorien als Mehrfachauswahl-Filter**: Kategorien-Dropdown in der Toolbar, ODER-verknüpft, unabhängig von der Sidebar.
- **Sidebar-Anpassung per Drag & Drop**: Einträge und Sektionen direkt in der Sidebar umsortieren; Einträge ein-/ausblenden. Aktivierung über „Sidebar anpassen" im Einstellungen-Menü. Einstellungen pro User in Supabase persistiert (`sidebar_layout`, `sidebar_section_order`).
- **Drei-Punkte-Menü auf allen Sidebar-Einträgen**: Reguläre Einträge erhalten „Ausblenden"; eigene Filter-Tabs zusätzlich „Bearbeiten" und „Löschen" (mit Bestätigungsdialog).
- `UserAvatar`-Komponente: Profilbild oder Buchstaben-Avatar mit Farbhintergrund, Größen sm/md/lg/xl.
- `UserChip`-Komponente: klickbarer Username-Link mit Hover-Tooltip (Avatar, Bio-Snippet, gespeicherte Rezepte).
- Sichtbarkeits-Chip in der Detailansicht (Schloss / Personen / Welt-Icon).
- Abschnittsüberschriften (`--- Name ---`) in Zubereitung und Tipps & Notizen.
- Neue `renderNotes()`-Funktion im Parser für strukturierte Notizen-Darstellung.
- DB-Migrationen: `migration_18_custom_filters_sidebar.sql` (`custom_filters`, `sidebar_layout`, `sidebar_section_order`) und `migration_19_profiles_follows_sharing.sql` (`follows`, `recipe_shares`, `visibility`, Avatar-Storage).

### Changed
- Sidebar-Unterrand: „Neues Rezept" immer sichtbar; „Sidebar anpassen", „Mein Profil" und „Abmelden" hinter einem ⋮-Einstellungen-Button als Popover.
- Inline-„Neues Rezept"-Button in der Grid-View ausgeblendet auf Favoriten, Gespeicherte und Mit mir geteilt.
- Aktiver Sidebar-Tab vollständig als Pill dargestellt (⋮-Button übernimmt Hintergrundfarbe; Icon nur bei Hover sichtbar).
- Sidebar-Scrollbar: 1px dünner Strich in Divider-Farbe, kein Hover-Wachsen.
- Kategorie-Filter in der Sidebar setzt `activeCategories` (statt `activeFilter`).
- Liken eines fremden Rezepts speichert es automatisch in die Sammlung; Entspeichern entfernt den Like.
- Mit mir geteilte Rezepte: Speichern entfernt den Share-Eintrag; Ablehnen (X) ohne Bestätigungsdialog.
- Detailansicht zeigt „aus der Sammlung von [User]" und „Geteilt von [User]" als klickbare `UserChip`s.
- Placeholder-Text in Formular-Textareas zeigt `--- Abschnitt ---` Syntax als Beispiel.

### Fixed
- `onAuthStateChange` Handler war async und verursachte Whitescreen beim Laden.
- `seen`-Update auf `recipe_shares` schlug wegen fehlender UPDATE-RLS-Policy lautlos fehl.
- „Alle Rezepte" zeigte öffentliche Rezepte fremder User — zeigt jetzt nur eigene + gespeicherte.
- Count neben „Meine Rezepte" spiegelte die angezeigte View statt der echten Anzahl eigener Rezepte.

## [1.2.0]

### Added
- Rezepte können öffentlich geteilt werden (`is_public`-Toggle im Formular, standardmäßig privat).
- Neue Discovery-Seite (`/discovery`): zeigt öffentliche Rezepte anderer User mit Suche, Kategorie-/Saison-/Tag-Filtern und Sortierung nach Neueste/Beliebteste/Beste Bewertung.
- Likes (❤️) auf Rezeptkarten und in der Detailansicht, Bewertungen (1–5 Sterne) mit Durchschnitt in der Detailansicht, "In meine Sammlung speichern" für fremde öffentliche Rezepte.
- Sidebar-Sammlung erweitert um "Meine Rezepte", "Gespeicherte" und einen "🌍 Discovery"-Eintrag.

### Fixed
- Registrierung neuer User schlug mit 500 fehl (`relation "profiles" does not exist`): `handle_new_user()` läuft im Kontext von `auth.users`, wo `public` nicht im `search_path` enthalten ist. Gefixt mit explizitem `search_path` und schema-qualifiziertem Tabellennamen.

## [1.1.0]

### Added
- Multi-User-Unterstützung: Rezepte gehören jeweils einem User (`user_id`), neue `profiles`-Tabelle mit `is_admin`-Flag, automatisch befüllt per Trigger bei Registrierung.
- Admin kann zwischen "Alle Rezepte" und "Nur meine" wechseln und zusätzlich nach einzelnem User filtern.
- Rezeptkarte zeigt für Admins den Ersteller-Usernamen an.
- Neue `quotes`-Tabelle in Supabase: Zitate werden jetzt aus der DB geladen statt aus `quotes.js`; Zitate können global oder einem bestimmten User zugewiesen werden.
- Admin-Oberfläche unter „Verwaltung → Zitate" zum Erstellen, Bearbeiten und Löschen von Zitaten inkl. User-Zuweisung.
- Registrierung fragt nun einen Benutzernamen ab.
- `netlify.toml` mit Build-Befehl, Publish-Verzeichnis und SPA-Redirect für Vue Router im History-Modus.

### Changed
- `getProfile()` nutzt `.maybeSingle()` statt `.single()`, damit ein fehlendes Profil nicht mehr die gesamte App blockiert.

### Fixed
- Endlose RLS-Rekursion behoben: Die Admin-Check-Policies fragten `profiles` innerhalb einer Policy auf `profiles` selbst ab, was zu 500-Fehlern bei jedem Zugriff auf `profiles`/`recipes`/`quotes` führte. Gelöst mit einer `is_admin()` SECURITY DEFINER-Funktion, die RLS beim Admin-Check umgeht.
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
