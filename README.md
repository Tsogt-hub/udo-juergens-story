# Die Udo Jürgens Story - Website

Eine moderne Künstler-Website mit Admin-Panel, inspiriert von [die-udo-juergens-story.de](https://www.die-udo-juergens-story.de/).

## Features

- **Startseite** mit Hero-Bereich, Künstler-Vorstellung und nächsten Terminen
- **Künstler-Seite** mit Biografie und Bildergalerie (inkl. Lightbox)
- **Termine** – Übersicht aller kommenden Veranstaltungen
- **Kritiken** – Pressestimmen und Rezensionen
- **Presse & Videos** – Medienberichte
- **Kontakt** – Kontaktformular und Kontaktdaten
- **Admin-Panel** mit:
  - Dashboard mit Statistiken
  - Termine verwalten (hinzufügen, bearbeiten, löschen)
  - Bilder hochladen und verwalten
  - Kritiken verwalten
  - Website-Einstellungen (Titel, Biografie, Bilder, Social Media, etc.)
  - Passwort ändern

## Technologie

- **Backend**: Node.js + Express
- **Datenbank**: SQLite (via sql.js)
- **Templates**: EJS
- **Bild-Upload**: Multer
- **Auth**: Session-basiert mit bcryptjs

## Installation

```bash
# Abhängigkeiten installieren
npm install

# Server starten
npm start
```

## Zugang

- **Website**: http://localhost:3000
- **Admin-Panel**: http://localhost:3000/admin
- **Login**: Benutzername: `admin` / Passwort: `admin123`

> **Wichtig**: Bitte ändern Sie das Passwort nach dem ersten Login unter Einstellungen!

## Projektstruktur

```
├── server.js           # Express Server
├── db.js               # Datenbank-Schicht (SQLite)
├── package.json
├── data/               # SQLite Datenbank-Datei
├── public/
│   ├── css/
│   │   ├── style.css   # Hauptstylesheet
│   │   └── admin.css   # Admin-Panel Styles
│   ├── js/
│   │   └── main.js     # Frontend JavaScript
│   └── uploads/
│       └── images/     # Hochgeladene Bilder
└── views/
    ├── partials/       # Header, Footer, Flash
    ├── admin/          # Admin-Panel Templates
    │   └── partials/   # Admin Header/Footer
    ├── index.ejs       # Startseite
    ├── kuenstler.ejs   # Künstler-Seite
    ├── termine.ejs     # Termine
    ├── kritiken.ejs    # Kritiken
    ├── presse.ejs      # Presse & Videos
    ├── kontakt.ejs     # Kontakt
    └── error.ejs       # Fehlerseite
```
