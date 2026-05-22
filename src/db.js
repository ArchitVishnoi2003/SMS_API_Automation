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

async function createMessage(user_id, phone_number, body, sessionId = null) {
  const msg = { user_id, phone_number, body, sessionId, status: 'pending', created_at: new Date().toISOString() };
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

async function getRecentMessages(limit = 20, sessionId = null) {
  if (!db) {
    let msgs = [...mockMessages];
    if (sessionId) msgs = msgs.filter(m => m.sessionId === sessionId);
    return msgs.reverse().slice(0, limit);
  }
  let query = db.collection('messages');
  if (sessionId) {
    query = query.where('sessionId', '==', sessionId);
  }
  const snap = await query.get();
  let docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  docs.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return docs.slice(0, limit);
}

async function getUsedToday(todayStartIso) {
  if (!db) {
    return mockMessages.filter(m => m.created_at >= todayStartIso && m.status !== 'failed').length;
  }
  const snap = await db.collection('messages')
    .where('created_at', '>=', todayStartIso)
    .get();
  
  // Filter status in memory to avoid needing a Firestore composite index
  let usedCount = 0;
  snap.forEach(doc => {
    if (doc.data().status !== 'failed') usedCount++;
  });
  return usedCount;
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
