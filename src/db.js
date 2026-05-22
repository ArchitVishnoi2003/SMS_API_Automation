const { admin, isFirebaseInitialized } = require('./firebase');
const db = isFirebaseInitialized ? admin.firestore() : null;

// Temporary in-memory store for local bypass testing
const mockUsers = [];
const mockMessages = [];

async function getUserByEmail(email) {
  if (!db) return mockUsers.find(u => u.email === email);
  const snap = await db.collection('users').where('email', '==', email).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function getUserById(id) {
  if (!db) return mockUsers.find(u => u.id === id);
  const doc = await db.collection('users').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function createUser(email, password_hash, name) {
  const user = { email, password_hash, name, created_at: new Date().toISOString() };
  if (!db) {
    const id = 'mock-id-' + Date.now();
    mockUsers.push({ id, ...user });
    return { id, ...user };
  }
  const ref = await db.collection('users').add(user);
  return { id: ref.id, ...user };
}

async function createMessage(user_id, phone_number, body) {
  const msg = { user_id, phone_number, body, status: 'pending', created_at: new Date().toISOString() };
  if (!db) {
    const id = 'mock-msg-' + Date.now();
    mockMessages.push({ id, ...msg });
    return id;
  }
  const ref = await db.collection('messages').add(msg);
  return ref.id;
}

async function updateMessageStatus(id, status, gateway_id = null, error = null) {
  const updates = { status, sent_at: new Date().toISOString() };
  if (gateway_id) updates.gateway_id = gateway_id;
  if (error) updates.error = error;

  if (!db) {
    const msg = mockMessages.find(m => m.id === id);
    if (msg) Object.assign(msg, updates);
    return;
  }
  await db.collection('messages').doc(String(id)).update(updates);
}

async function getRecentMessages(limit = 20) {
  if (!db) return [...mockMessages].reverse().slice(0, limit);
  const snap = await db.collection('messages').orderBy('created_at', 'desc').limit(limit).get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getUsedToday(todayStartIso) {
  if (!db) {
    return mockMessages.filter(m => m.created_at >= todayStartIso && m.status !== 'failed').length;
  }
  const snap = await db.collection('messages')
    .where('created_at', '>=', todayStartIso)
    .where('status', '!=', 'failed')
    .get();
  return snap.size;
}

module.exports = {
  getUserByEmail,
  getUserById,
  createUser,
  createMessage,
  updateMessageStatus,
  getRecentMessages,
  getUsedToday
};
