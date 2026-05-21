const bcrypt = require('bcryptjs');
const db = require('./db');

async function register(email, password, name) {
  email = (email || '').trim().toLowerCase();
  if (!email) throw new Error('Email is required');

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new Error('Email already registered');

  const hash = await bcrypt.hash(password, 10);
  const result = db.prepare(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
  ).run(email, hash, (name || '').trim() || null);

  return { id: result.lastInsertRowid, email, name };
}

async function login(email, password) {
  email = (email || '').trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) throw new Error('Invalid email or password');

  const ok = await bcrypt.compare(password || '', user.password_hash);
  if (!ok) throw new Error('Invalid email or password');

  return { id: user.id, email: user.email, name: user.name };
}

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.redirect('/login');
  }
  next();
}

module.exports = { register, login, requireAuth };
