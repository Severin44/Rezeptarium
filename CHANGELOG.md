# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt sinngemäß [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### Added
- **Profilseiten** (`/profile/:username`): Avatar (Upload oder Farbwahl), Bio, Follower-/Following-Zähler, Rezepte nach Sichtbarkeit tabulliert.
- **Profil bearbeiten** (`/profile/edit`): Avatar-Upload oder Buchstaben-Avatar mit 6 Farboptionen, Benutzername, Bio (max. 160 Zeichen).
- **Follow-System**: Nutzern folgen/entfolgen direkt auf Profilseiten und in der User-Suche. Gegenseitiges Folgen = Freunde.
- **Drei Sichtbarkeits-Stufen**: Privat / Freunde / Öffentlich (ersetzt den alten `is_public`-Toggle). `VisibilityPicker`-Komponente im Formular mit grünem Custom-Radio.
- **Following-Feed** (`/following`): Öffentliche Rezepte aller gefolgten User.
- **Freunde-Feed** (`/friends`): Freundes- und öffentliche Rezepte aller gegenseitigen Follower.
- **User suchen** (`/users`): Debounced Username-Suche mit Inline-Follow/Unfollow.
- **Direktes Rezept-Teilen**: Owner kann Rezept an Freunde (privat) oder alle Follower (öffentlich/Freunde) senden. Share-Modal in Detailansicht, Badge in Sidebar für ungesehene.
- **Mit mir geteilt** (unter Social in der Sidebar): empfangene Rezepte mit „New"-Badge für noch nicht angesehene. Beim Öffnen wird automatisch als gesehen markiert.
- **Favoriten**-Sammlung: eigene Favoriten (`is_favorite`) + fremd gelikte Rezepte zusammen.
- `UserAvatar`-Komponente: Profilbild oder Buchstaben-Avatar mit Farbhintergrund, Größen sm/md/lg/xl.
- `UserChip`-Komponente: klickbarer Username-Link mit Hover-Tooltip (Avatar, Bio-Snippet, Anzahl gespeicherter Rezepte von dieser Person).
- Sichtbarkeits-Chip in der Detailansicht (Schloss / Personen / Welt-Icon).
- Detailansicht zeigt „aus der Sammlung von [User]" und „Geteilt von [User]" als klickbare `UserChip`s mit Profil-Tooltip.
- Löschen-Bestätigung als eigenes In-App-Modal (kein nativer Browser-Dialog mehr).
- Supabase-Migration `migration_19_profiles_follows_sharing.sql`: `follows`-, `recipe_shares`-Tabellen, `are_friends()`-Funktion, `visibility`-Spalte, Avatar-Storage-Bucket, RLS-Policies.

### Changed
- Sidebar: Social-Sektion enthält Discovery, Following, Freunde, User suchen, Mit mir geteilt. Buttons "Neues Rezept", "Mein Profil", "Abmelden" fest am unteren Rand.
- Liken eines fremden Rezepts speichert es automatisch in die Sammlung; Entspeichern entfernt automatisch den Like.
- Mit mir geteilte Rezepte: Speichern entfernt den Share-Eintrag; Ablehnen (X-Button) entfernt ohne Bestätigungsdialog.
- Herz & Rating bei eigenen nicht-privaten Rezepten sichtbar aber nicht klickbar; bei privaten Rezepten ausgeblendet. Bei geteilten privaten Rezepten klickbar, aber Zähler erst bei friends/public sichtbar.

### Fixed
- `onAuthStateChange` Handler war async und verursachte Whitescreen beim Laden — auf synchronen Handler zurückgesetzt.
- Sidebar-Buttons scrollen nicht mit der Navigation mit (overflow auf Nav verlagert).
- `seen`-Update auf `recipe_shares` schlug wegen fehlender UPDATE-RLS-Policy lautlos fehl.

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
