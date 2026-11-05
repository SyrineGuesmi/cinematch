# CineMatch – Ionic movie app

Ionic + Angular (standalone, signals) + Firebase (Auth + Firestore) + TMDB + Capacitor Camera.

## Project structure

```
src/app/
  config.ts                 Firebase config + TMDB API key  (fill this in)
  firebase.ts               Initializes Firebase (auth, db)
  models.ts                 UserProfile, Movie, Favorite interfaces
  guards.ts                 authGuard / adminGuard / guestGuard
  app.routes.ts             All routes (tabs layout)
  services/
    auth.service.ts         Register, login, logout, current profile, deactivation check
    user.service.ts         List users, activate/deactivate (admin)
    movie.service.ts        TMDB API, admin catalog (`movies`), favorites
    matching.ts             Matching algorithm (pure TypeScript functions)
    matching.spec.ts        Unit tests of the algorithm
    photo.ts                Capacitor Camera + image resize
  pages/
    login/  register/  tabs/  home/  movie-details/  favorites/  matching/  profile/
    admin/  admin-dashboard  admin-users  add-movie
firestore.rules             Firestore security rules
```

## 1. Firebase configuration

1. Go to https://console.firebase.google.com and create a project.
2. **Authentication** → Get started → enable **Email/Password**.
3. **Firestore Database** → Create database (any location, production mode).
4. **Firestore → Rules**: paste the content of `firestore.rules` and click *Publish*.
5. Copy `src/app/config.example.ts` to `src/app/config.ts` (this file is gitignored, each
   contributor keeps their own).
6. **Project settings → General → Your apps → Web app (</>)**: register an app and copy the
   `firebaseConfig` object into `src/app/config.ts`.

Firebase Storage is **not** needed: the profile picture is resized to 300 px and stored as a small
JPEG data URL in the user document (`photoUrl`), because new Firebase projects need the paid plan
to use Storage.

## 2. TMDB API key

1. Create a free account on https://www.themoviedb.org.
2. Settings → API → request an API key (developer).
3. Copy the **API Key** (v3 auth, the short one) into `tmdbApiKey` in `src/app/config.ts`.

## 3. First administrator

1. Run the app and register a normal account.
2. In the Firebase console → Firestore → `users` → your document, change `role` from `"user"` to
   `"admin"`.
3. Log out and log in again: the **Admin** tab appears.

(Users cannot make themselves admin from the app: the security rules forbid changing `role`.)

## 4. Run the application

```bash
npm install
npm start               # http://localhost:4200 (browser, webcam used for the photo)
npm test                # unit tests of the matching algorithm
```

On an Android phone:

```bash
npm run build
npx cap add android     # first time only
npx cap sync android
npx cap open android    # then Run from Android Studio
```

For the camera on Android, add these permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

## Firestore data

| Collection  | Document id            | Fields |
|-------------|------------------------|--------|
| `users`     | Firebase Auth uid      | uid, firstName, lastName, age, email, photoUrl, role (`user`/`admin`), isActive |
| `movies`    | auto                   | title, poster, releaseDate, genres[], actors[], overview, createdAt (movies added by the admin) |
| `favorites` | `<userId>_<movieId>`   | userId, movieId, addedAt + copy of title, poster, releaseDate, genres[], actors[] |

The favorite keeps a copy of the genres/actors/date so the matching page can compute every score
with only 2 queries (all users + all favorites) instead of calling TMDB for every movie.

## How each requirement is implemented

| Requirement | Where |
|---|---|
| Register (first/last name, age, email, password, camera photo) | `pages/register`, `AuthService.register`, `services/photo.ts` |
| Login / logout / own profile | `pages/login`, `pages/profile`, `AuthService` |
| Browse + search TMDB, details (poster, title, year, genres, overview, actors) | `pages/home`, `pages/movie-details`, `MovieService` |
| Add / remove favorites, private playlist | `MovieService.addFavorite/removeFavorite`, `pages/favorites`, rules: only the owner can write |
| Admin role | `role` field in `users`, `adminGuard`, `isAdmin()` in rules |
| Admin dashboard, add movie, view users, deactivate | `pages/admin/*` |
| Deactivated user can't use the app | Login refuses it, a live listener logs the user out at once, guards check `isActive`, the rules deny all data access |
| Matching > 75 % with explanation | `services/matching.ts`, `pages/matching` |

### Matching algorithm

For two users A and B (each criterion gives a value between 0 and 1):

| Criterion | Weight | Formula |
|---|---|---|
| Common movies | 35 % | Jaccard(movies A, movies B) = shared / total distinct |
| Common genres | 30 % | Jaccard(genres A, genres B) |
| Common actors | 20 % | Jaccard(actors A, actors B) (top 10 cast of each movie) |
| Similar years | 15 % | 1 − \|avg year A − avg year B\| / 20 (minimum 0) |

`score = 100 × (0.35·movies + 0.30·genres + 0.20·actors + 0.15·years)`

Users with `score > 75` are shown, with the shared movies, genres, actors and average years.
The "Show all users" toggle shows every score and its 4 parts, which helps to check the
algorithm and the threshold.

### Known simplifications

- Other users' favorites and profiles can be read by any active user, because the matching
  page runs in the app (no backend). Only the owner can modify them.
- TMDB lists come in English; genres of admin-added movies are free text, so spell them the
  same way as TMDB ("Science Fiction", "Action"...) if you want them to match.
