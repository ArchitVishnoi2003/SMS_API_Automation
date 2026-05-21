require('dotenv').config();
const express = require('express');
const session = require('express-session');
const db = require('./db');
const { register, login, requireAuth } = require('./auth');
const { sendSms } = require('./gateway');
const { remainingToday, usedToday, canSend, DAILY_LIMIT } = require('./quota');
const { loginPage, registerPage, dashboardPage } = require('./views');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 }
}));

// ---------- public pages ----------
app.get('/', (req, res) => {
  res.redirect(req.session.userId ? '/app' : '/login');
});

app.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/app');
  res.send(loginPage());
});

app.post('/login', async (req, res) => {
  try {
    const user = await login(req.body.email, req.body.password);
    req.session.userId = user.id;
    res.redirect('/app');
  } catch (err) {
    res.status(401).send(loginPage(err.message));
  }
});

app.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/app');
  res.send(registerPage());
});

app.post('/register', async (req, res) => {
  try {
    if (!req.body.password || req.body.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    const user = await register(req.body.email, req.body.password, req.body.name);
    req.session.userId = user.id;
    res.redirect('/app');
  } catch (err) {
    res.status(400).send(registerPage(err.message));
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// ---------- authenticated dashboard ----------
app.get('/app', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(req.session.userId);
  const recent = db.prepare(`SELECT * FROM messages ORDER BY id DESC LIMIT 20`).all();
  const stats = { used: usedToday(), remaining: remainingToday(), limit: DAILY_LIMIT };
  res.send(dashboardPage(user, stats, recent));
});

// ---------- JSON API ----------
app.post('/api/send', requireAuth, async (req, res) => {
  const phone = (req.body.phone || '').trim();
  const body = (req.body.body || '').trim();

  if (!phone || !body) {
    return res.status(400).json({ error: 'phone and body are required' });
  }
  if (!canSend(1)) {
    return res.status(429).json({ error: `Daily SMS limit (${DAILY_LIMIT}) reached. Try again tomorrow.` });
  }

  const insert = db.prepare(`
    INSERT INTO messages (user_id, phone_number, body, status) VALUES (?, ?, ?, 'pending')
  `).run(req.session.userId, phone, body);
  const messageId = insert.lastInsertRowid;

  try {
    const result = await sendSms(phone, body);
    db.prepare(`
      UPDATE messages SET status = 'sent', gateway_id = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(result.id || null, messageId);
    res.json({ ok: true, messageId, gatewayId: result.id, remaining: remainingToday() });
  } catch (err) {
    const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
    db.prepare(`UPDATE messages SET status = 'failed', error = ? WHERE id = ?`).run(errMsg, messageId);
    res.status(502).json({ error: `Gateway error: ${errMsg}`, messageId });
  }
});

app.get('/api/messages', requireAuth, (req, res) => {
  const messages = db.prepare(`SELECT * FROM messages ORDER BY id DESC LIMIT 100`).all();
  res.json({
    messages,
    stats: { used: usedToday(), remaining: remainingToday(), limit: DAILY_LIMIT }
  });
});

app.get('/api/quota', requireAuth, (req, res) => {
  res.json({ used: usedToday(), remaining: remainingToday(), limit: DAILY_LIMIT });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`MAT SMS running on http://localhost:${PORT}`);
  console.log(`Daily limit: ${DAILY_LIMIT} · Gateway: ${process.env.SMS_GATEWAY_URL || 'https://api.sms-gate.app/3rdparty/v1'}`);
  if (!process.env.SMS_GATEWAY_USERNAME) {
    console.warn('⚠  SMS_GATEWAY_USERNAME / SMS_GATEWAY_PASSWORD not set — sends will fail until you configure .env');
  }
});
