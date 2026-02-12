const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const compression = require('compression');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { initDb, getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Compression (gzip)
app.use(compression());

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files with caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  etag: true
}));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'udo-juergens-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Flash messages
app.use(flash());

// Global template variables
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.isLoggedIn = !!req.session.admin;
  res.locals.currentPath = req.path;
  next();
});

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public/uploads/images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Nur Bilddateien sind erlaubt!'));
  }
});

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session.admin) return next();
  res.redirect('/admin/login');
}

// ===================== PUBLIC ROUTES =====================

// Home
app.get('/', (req, res) => {
  const db = getDb();
  const settings = db.getSettings();
  const images = db.getImages(6);
  const termine = db.getTermine(4);
  res.render('index', { settings, images, termine });
});

// Künstler
app.get('/kuenstler', (req, res) => {
  const db = getDb();
  const settings = db.getSettings();
  const images = db.getImages();
  res.render('kuenstler', { settings, images });
});

// Termine
app.get('/termine', (req, res) => {
  const db = getDb();
  const settings = db.getSettings();
  const termine = db.getAllTermine();
  res.render('termine', { settings, termine });
});

// Kritiken
app.get('/kritiken', (req, res) => {
  const db = getDb();
  const settings = db.getSettings();
  const kritiken = db.getKritiken();
  res.render('kritiken', { settings, kritiken });
});

// Presse & Videos
app.get('/presse', (req, res) => {
  const db = getDb();
  const settings = db.getSettings();
  res.render('presse', { settings });
});

// Kontakt
app.get('/kontakt', (req, res) => {
  const db = getDb();
  const settings = db.getSettings();
  res.render('kontakt', { settings });
});

// ===================== ADMIN ROUTES =====================

// Login page
app.get('/admin/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin');
  res.render('admin/login');
});

// Login action
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDb();
  const admin = db.getAdmin(username);
  if (admin && bcrypt.compareSync(password, admin.password)) {
    req.session.admin = { id: admin.id, username: admin.username };
    req.flash('success', 'Erfolgreich eingeloggt!');
    return res.redirect('/admin');
  }
  req.flash('error', 'Ungültige Anmeldedaten!');
  res.redirect('/admin/login');
});

// Logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Admin Dashboard
app.get('/admin', requireAuth, (req, res) => {
  const db = getDb();
  const stats = {
    termine: db.countTermine(),
    images: db.countImages(),
    kritiken: db.countKritiken()
  };
  res.render('admin/dashboard', { stats });
});

// ---- Termine Admin ----
app.get('/admin/termine', requireAuth, (req, res) => {
  const db = getDb();
  const termine = db.getAllTermine();
  res.render('admin/termine', { termine });
});

app.post('/admin/termine/add', requireAuth, (req, res) => {
  const { datum, zeit, venue, stadt, beschreibung, ticket_link } = req.body;
  const db = getDb();
  db.addTermin({ datum, zeit, venue, stadt, beschreibung, ticket_link });
  req.flash('success', 'Termin erfolgreich hinzugefügt!');
  res.redirect('/admin/termine');
});

app.post('/admin/termine/edit/:id', requireAuth, (req, res) => {
  const { datum, zeit, venue, stadt, beschreibung, ticket_link } = req.body;
  const db = getDb();
  db.updateTermin(req.params.id, { datum, zeit, venue, stadt, beschreibung, ticket_link });
  req.flash('success', 'Termin erfolgreich aktualisiert!');
  res.redirect('/admin/termine');
});

app.post('/admin/termine/delete/:id', requireAuth, (req, res) => {
  const db = getDb();
  db.deleteTermin(req.params.id);
  req.flash('success', 'Termin erfolgreich gelöscht!');
  res.redirect('/admin/termine');
});

// ---- Images Admin ----
app.get('/admin/bilder', requireAuth, (req, res) => {
  const db = getDb();
  const images = db.getImages();
  res.render('admin/bilder', { images });
});

app.post('/admin/bilder/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    req.flash('error', 'Bitte wählen Sie ein Bild aus!');
    return res.redirect('/admin/bilder');
  }
  const db = getDb();
  const { title, beschreibung } = req.body;
  db.addImage({
    filename: req.file.filename,
    originalname: req.file.originalname,
    title: title || '',
    beschreibung: beschreibung || ''
  });
  req.flash('success', 'Bild erfolgreich hochgeladen!');
  res.redirect('/admin/bilder');
});

app.post('/admin/bilder/delete/:id', requireAuth, (req, res) => {
  const db = getDb();
  const image = db.getImageById(req.params.id);
  if (image) {
    const filepath = path.join(__dirname, 'public/uploads/images', image.filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    db.deleteImage(req.params.id);
  }
  req.flash('success', 'Bild erfolgreich gelöscht!');
  res.redirect('/admin/bilder');
});

// ---- Kritiken Admin ----
app.get('/admin/kritiken', requireAuth, (req, res) => {
  const db = getDb();
  const kritiken = db.getKritiken();
  res.render('admin/kritiken', { kritiken });
});

app.post('/admin/kritiken/add', requireAuth, (req, res) => {
  const { stadt, text, quelle, datum } = req.body;
  const db = getDb();
  db.addKritik({ stadt, text, quelle, datum });
  req.flash('success', 'Kritik erfolgreich hinzugefügt!');
  res.redirect('/admin/kritiken');
});

app.post('/admin/kritiken/delete/:id', requireAuth, (req, res) => {
  const db = getDb();
  db.deleteKritik(req.params.id);
  req.flash('success', 'Kritik erfolgreich gelöscht!');
  res.redirect('/admin/kritiken');
});

// ---- Settings Admin ----
app.get('/admin/einstellungen', requireAuth, (req, res) => {
  const db = getDb();
  const settings = db.getSettings();
  res.render('admin/einstellungen', { settings });
});

app.post('/admin/einstellungen', requireAuth, upload.fields([
  { name: 'hero_image', maxCount: 1 },
  { name: 'artist_image', maxCount: 1 }
]), (req, res) => {
  const db = getDb();
  const updates = req.body;

  if (req.files && req.files.hero_image) {
    updates.hero_image = '/uploads/images/' + req.files.hero_image[0].filename;
  }
  if (req.files && req.files.artist_image) {
    updates.artist_image = '/uploads/images/' + req.files.artist_image[0].filename;
  }

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'hero_image' && key !== 'artist_image') {
      db.updateSetting(key, value);
    } else {
      db.updateSetting(key, value);
    }
  });

  req.flash('success', 'Einstellungen erfolgreich gespeichert!');
  res.redirect('/admin/einstellungen');
});

// Password change
app.post('/admin/passwort', requireAuth, (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  const db = getDb();
  const admin = db.getAdminById(req.session.admin.id);

  if (!bcrypt.compareSync(current_password, admin.password)) {
    req.flash('error', 'Aktuelles Passwort ist falsch!');
    return res.redirect('/admin/einstellungen');
  }
  if (new_password !== confirm_password) {
    req.flash('error', 'Passwörter stimmen nicht überein!');
    return res.redirect('/admin/einstellungen');
  }
  if (new_password.length < 6) {
    req.flash('error', 'Passwort muss mindestens 6 Zeichen lang sein!');
    return res.redirect('/admin/einstellungen');
  }

  db.updateAdminPassword(req.session.admin.id, bcrypt.hashSync(new_password, 10));
  req.flash('success', 'Passwort erfolgreich geändert!');
  res.redirect('/admin/einstellungen');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Ein Fehler ist aufgetreten.' });
});

// 404
app.use((req, res) => {
  res.status(404).render('error', { message: 'Seite nicht gefunden.' });
});

// Start server
async function start() {
  await initDb();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎵 Die Udo Jürgens Story läuft auf http://localhost:${PORT}`);
    console.log(`📋 Admin-Panel: http://localhost:${PORT}/admin`);
    console.log(`   Login: admin / admin123`);
  });
}

start();
