const db = require('./db');

const DAILY_LIMIT = parseInt(process.env.DAILY_SMS_LIMIT || '100', 10);

function todayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function usedToday() {
  return await db.getUsedToday(todayStartIso());
}

async function remainingToday() {
  const used = await usedToday();
  return Math.max(0, DAILY_LIMIT - used);
}

async function canSend(count = 1) {
  const remaining = await remainingToday();
  return remaining >= count;
}

module.exports = { DAILY_LIMIT, usedToday, remainingToday, canSend };
