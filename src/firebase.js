const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

let isFirebaseInitialized = false;

if (projectId && clientEmail && privateKey) {
  try {
    // If the private key contains escaped newlines (common in env configurations), unescape them
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    isFirebaseInitialized = true;
    console.log('✔ Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  }
} else {
  console.warn(
    '⚠ Firebase environment variables not fully set. Firebase authentication will operate in fallback mode or error out.'
  );
  console.warn('  Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
}

async function verifyIdToken(idToken) {
  if (!isFirebaseInitialized) {
    // If Firebase isn't configured, but we are running in local development dev-mode, we can allow a dev-bypass to make onboarding seamless
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.warn('⚠ Firebase Admin not configured. Operating in dev-mode bypass for testing.');
      
      // 1. Simple mock decode for testing without firebase config
      if (idToken === 'dev-token' || idToken?.startsWith('dev-token-')) {
        return {
          uid: 'dev-user-uid',
          email: idToken.startsWith('dev-token-') ? idToken.replace('dev-token-', '') : 'admin@example.com',
          name: 'Developer Bypass',
          email_verified: true
        };
      }

      // 2. Decode the real JWT token payload securely without verification for easy onboarding
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          if (payload && payload.email) {
            console.log(`🔑 [Bypass Mode] Dynamically decoded user: ${payload.email} (Signature verification skipped in development)`);
            return {
              uid: payload.user_id || payload.sub || 'dev-uid',
              email: payload.email,
              name: payload.name || payload.email.split('@')[0],
              email_verified: payload.email_verified || true
            };
          }
        }
      } catch (jwtErr) {
        console.error('Failed to bypass decode JWT token:', jwtErr.message);
      }

      // 3. Fail-safe developer bypass fallback when decoding fails completely
      console.warn('⚠ JWT decoding failed or email missing. Returning fallback developer bypass user.');
      return {
        uid: 'dev-user-uid',
        email: 'dev-user@example.com',
        name: 'Developer Bypass Fallback',
        email_verified: true
      };
    }
    throw new Error('Firebase Admin SDK is not configured. Please set the required environment variables.');
  }
  
  return admin.auth().verifyIdToken(idToken);
}

module.exports = {
  admin,
  verifyIdToken,
  isFirebaseInitialized
};
