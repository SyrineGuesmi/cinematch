// ---------------------------------------------------------------------------
// Project configuration - copy this file to config.ts and fill in your own
// values (see README.md).
//
// Note: the Firebase web config is NOT a secret (it only identifies your
// project; access is controlled by Firestore security rules). The TMDB key is
// a free read-only key. Still, don't commit your real values to a public repo.
// ---------------------------------------------------------------------------

export const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// TMDB "API Key" (v3 auth) from https://www.themoviedb.org/settings/api
export const tmdbApiKey = 'YOUR_TMDB_API_KEY';
