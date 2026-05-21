const db = require('./db');

const DAILY_LIMIT = parseInt(process.env.DAILY_SMS_LIMIT || '100', 10);

function todayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function usedToday() {
  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM messages
    WHERE created_at >= ? AND status != 'failed'
  `).get(todayStartIso());
  return row.count;
}

function remainingToday() {
  return Math.max(0, DAILY_LIMIT - usedToday());
}

function canSend(count = 1) {
  return remainingToday() >= count;
}

module.exports = { DAILY_LIMIT, usedToday, remainingToday, canSend };
