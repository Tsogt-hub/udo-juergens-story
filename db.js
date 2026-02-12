const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data', 'database.sqlite');
let db = null;

async function initDb() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS termine (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      datum TEXT NOT NULL,
      zeit TEXT DEFAULT '',
      venue TEXT NOT NULL,
      stadt TEXT NOT NULL,
      beschreibung TEXT DEFAULT '',
      ticket_link TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      originalname TEXT NOT NULL,
      title TEXT DEFAULT '',
      beschreibung TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS kritiken (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stadt TEXT NOT NULL,
      text TEXT NOT NULL,
      quelle TEXT DEFAULT '',
      datum TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT DEFAULT ''
    )
  `);

  // Seed admin if not exists
  const adminCheck = db.exec("SELECT COUNT(*) as cnt FROM admin");
  if (adminCheck[0].values[0][0] === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.run("INSERT INTO admin (username, password) VALUES (?, ?)", ['admin', hash]);
  }

  // Seed default settings
  const defaultSettings = {
    site_title: 'Die Udo Jürgens Story',
    site_subtitle: 'Sein Leben, seine Liebe, seine Musik',
    artist_name: 'Alex Parker',
    artist_role: 'Sänger & Pianist',
    artist_bio: 'Er gilt nicht grundlos als bekanntester Udo Jürgens-Interpret im gesamten deutschsprachigen Raum. Bereits seit seiner Kindheit hat Alex Parker ein Faible für die Musik von Udo Jürgens. Das Talent, unvergessliche Melodien mit mal heiteren, mal nachdenklichen und philosophischen Texten zu vereinen, faszinierte den damals 13-jährigen Klavierschüler und noch vor dem Stimmbruch – hat Parker nach eigenem Bekunden angefangen, Udo Jürgens\' Songs nachzusingen und dessen nasal geprägte, einzigartige Klangfarbe seiner Stimme nachzuahmen.\n\nGanz im Stil seines Idols versteht er es auf sympathische Art und Weise, eine einzigartige, hochemotionale Atmosphäre zwischen sich und seinem Publikum zu schaffen: „Mein Ziel ist es, die Chansons von Udo Jürgens weiterleben zu lassen und den Menschen damit eine Freude zu machen, sie vielleicht ein wenig zu trösten", erklärt Alex Parker. „Denn seine Lieder sind unsterblich!"\n\nUnd so verwundert es nicht, dass die beiden Protagonisten Gabriela Benesch & Alex Parker mit Der Udo Jürgens Story einen unvergesslichen Erinnerungsabend geschaffen haben, bei dem sie das Publikum begeistern und das „Udo Jürgens-Gefühl" immer wieder aufleben lassen.',
    hero_image: '',
    artist_image: '',
    kontakt_email: 'kontakt@beispiel.de',
    kontakt_telefon: '',
    kontakt_adresse: '',
    impressum: '© 2026 | Alle Rechte vorbehalten',
    facebook_url: '',
    youtube_url: '',
    instagram_url: '',
    meta_description: 'Die Udo Jürgens Story – Sein Leben, seine Liebe, seine Musik. Eine Hommage an den Grandseigneur der Unterhaltungsbranche.',
    og_image: ''
  };

  Object.entries(defaultSettings).forEach(([key, value]) => {
    const existing = db.exec("SELECT COUNT(*) FROM settings WHERE key = ?", [key]);
    if (existing[0].values[0][0] === 0) {
      db.run("INSERT INTO settings (key, value) VALUES (?, ?)", [key, value]);
    }
  });

  saveDb();
  console.log('✅ Datenbank initialisiert');
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function getDb() {
  return {
    // Settings
    getSettings() {
      const results = db.exec("SELECT key, value FROM settings");
      const settings = {};
      if (results.length > 0) {
        results[0].values.forEach(([key, value]) => {
          settings[key] = value;
        });
      }
      return settings;
    },

    updateSetting(key, value) {
      db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
      saveDb();
    },

    // Admin
    getAdmin(username) {
      const result = db.exec("SELECT * FROM admin WHERE username = ?", [username]);
      if (result.length > 0 && result[0].values.length > 0) {
        const cols = result[0].columns;
        const vals = result[0].values[0];
        const obj = {};
        cols.forEach((c, i) => obj[c] = vals[i]);
        return obj;
      }
      return null;
    },

    getAdminById(id) {
      const result = db.exec("SELECT * FROM admin WHERE id = ?", [id]);
      if (result.length > 0 && result[0].values.length > 0) {
        const cols = result[0].columns;
        const vals = result[0].values[0];
        const obj = {};
        cols.forEach((c, i) => obj[c] = vals[i]);
        return obj;
      }
      return null;
    },

    updateAdminPassword(id, hash) {
      db.run("UPDATE admin SET password = ? WHERE id = ?", [hash, id]);
      saveDb();
    },

    // Termine
    getAllTermine() {
      const result = db.exec("SELECT * FROM termine ORDER BY datum ASC");
      return this._toArray(result);
    },

    getTermine(limit) {
      const result = db.exec(
        "SELECT * FROM termine WHERE datum >= date('now') ORDER BY datum ASC LIMIT ?",
        [limit || 100]
      );
      return this._toArray(result);
    },

    countTermine() {
      const result = db.exec("SELECT COUNT(*) FROM termine");
      return result[0].values[0][0];
    },

    addTermin(data) {
      db.run(
        "INSERT INTO termine (datum, zeit, venue, stadt, beschreibung, ticket_link) VALUES (?, ?, ?, ?, ?, ?)",
        [data.datum, data.zeit || '', data.venue, data.stadt, data.beschreibung || '', data.ticket_link || '']
      );
      saveDb();
    },

    updateTermin(id, data) {
      db.run(
        "UPDATE termine SET datum=?, zeit=?, venue=?, stadt=?, beschreibung=?, ticket_link=? WHERE id=?",
        [data.datum, data.zeit || '', data.venue, data.stadt, data.beschreibung || '', data.ticket_link || '', id]
      );
      saveDb();
    },

    deleteTermin(id) {
      db.run("DELETE FROM termine WHERE id = ?", [id]);
      saveDb();
    },

    // Images
    getImages(limit) {
      const sql = limit
        ? "SELECT * FROM images ORDER BY created_at DESC LIMIT ?"
        : "SELECT * FROM images ORDER BY created_at DESC";
      const params = limit ? [limit] : [];
      const result = db.exec(sql, params);
      return this._toArray(result);
    },

    getImageById(id) {
      const result = db.exec("SELECT * FROM images WHERE id = ?", [id]);
      if (result.length > 0 && result[0].values.length > 0) {
        const cols = result[0].columns;
        const vals = result[0].values[0];
        const obj = {};
        cols.forEach((c, i) => obj[c] = vals[i]);
        return obj;
      }
      return null;
    },

    countImages() {
      const result = db.exec("SELECT COUNT(*) FROM images");
      return result[0].values[0][0];
    },

    addImage(data) {
      db.run(
        "INSERT INTO images (filename, originalname, title, beschreibung) VALUES (?, ?, ?, ?)",
        [data.filename, data.originalname, data.title || '', data.beschreibung || '']
      );
      saveDb();
    },

    deleteImage(id) {
      db.run("DELETE FROM images WHERE id = ?", [id]);
      saveDb();
    },

    // Kritiken
    getKritiken() {
      const result = db.exec("SELECT * FROM kritiken ORDER BY created_at DESC");
      return this._toArray(result);
    },

    countKritiken() {
      const result = db.exec("SELECT COUNT(*) FROM kritiken");
      return result[0].values[0][0];
    },

    addKritik(data) {
      db.run(
        "INSERT INTO kritiken (stadt, text, quelle, datum) VALUES (?, ?, ?, ?)",
        [data.stadt, data.text, data.quelle || '', data.datum || '']
      );
      saveDb();
    },

    deleteKritik(id) {
      db.run("DELETE FROM kritiken WHERE id = ?", [id]);
      saveDb();
    },

    // Helper
    _toArray(result) {
      if (!result.length || !result[0].values.length) return [];
      const cols = result[0].columns;
      return result[0].values.map(vals => {
        const obj = {};
        cols.forEach((c, i) => obj[c] = vals[i]);
        return obj;
      });
    }
  };
}

module.exports = { initDb, getDb };
