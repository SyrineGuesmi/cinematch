/** Document in the `users` collection (document id = Firebase Auth uid). */
export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  photoUrl: string; // small JPEG stored as a data URL
  role: 'user' | 'admin';
  isActive: boolean;
}

/** A movie, either from TMDB (numeric id) or from the `movies` collection (Firestore id). */
export interface Movie {
  id: string;
  title: string;
  poster: string;
  releaseDate: string; // "YYYY-MM-DD" (may be empty)
  genres: string[];
  actors: string[];
  overview: string;
}

/**
 * Document in the `favorites` collection (document id = `${userId}_${movieId}`).
 * It keeps a copy of the movie data needed by the matching algorithm
 * (genres, actors, release date) so matching only needs one query.
 */
export interface Favorite {
  userId: string;
  movieId: string;
  title: string;
  poster: string;
  releaseDate: string;
  genres: string[];
  actors: string[];
  addedAt: number;
}
