import type { Favorite } from '../models';

/**
 * Movie preference matching
 * -------------------------
 * The score (0-100 %) is a weighted sum of 4 criteria, each between 0 and 1:
 *
 *   movies  (35 %)  Jaccard similarity of the two sets of favorite movies
 *   genres  (30 %)  Jaccard similarity of the sets of genres of those movies
 *   actors  (20 %)  Jaccard similarity of the sets of actors of those movies
 *   years   (15 %)  1 - |average year A - average year B| / 20   (0 if 20+ years apart)
 *
 * Jaccard(A, B) = |A ∩ B| / |A ∪ B|  -> 1 when both sets are identical,
 * 0 when nothing is shared. Using "intersection / union" (and not just the
 * number of common items) means that sharing 3 movies out of 3 is better
 * than sharing 3 movies out of 50.
 */

export const WEIGHTS = { movies: 0.35, genres: 0.3, actors: 0.2, years: 0.15 };
export const MATCH_THRESHOLD = 75; // users above this score are shown as matches
const YEAR_RANGE = 20; // average years further apart than this give 0

export interface MatchDetails {
  score: number; // 0-100, rounded
  parts: { movies: number; genres: number; actors: number; years: number }; // each 0-1
  commonMovies: string[];
  commonGenres: string[];
  commonActors: string[];
  myAvgYear: number | null;
  theirAvgYear: number | null;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  return intersect(a, b).length / union.size;
}

function intersect(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter((x) => b.has(x));
}

function averageYear(favorites: Favorite[]): number | null {
  const years = favorites.map((f) => parseInt(f.releaseDate?.slice(0, 4), 10)).filter((y) => !isNaN(y));
  if (years.length === 0) return null;
  return years.reduce((sum, y) => sum + y, 0) / years.length;
}

export function computeMatch(mine: Favorite[], theirs: Favorite[]): MatchDetails {
  const myMovies = new Set(mine.map((f) => f.movieId));
  const theirMovies = new Set(theirs.map((f) => f.movieId));
  const myGenres = new Set(mine.flatMap((f) => f.genres ?? []));
  const theirGenres = new Set(theirs.flatMap((f) => f.genres ?? []));
  const myActors = new Set(mine.flatMap((f) => f.actors ?? []));
  const theirActors = new Set(theirs.flatMap((f) => f.actors ?? []));

  const myAvgYear = averageYear(mine);
  const theirAvgYear = averageYear(theirs);

  const parts = {
    movies: jaccard(myMovies, theirMovies),
    genres: jaccard(myGenres, theirGenres),
    actors: jaccard(myActors, theirActors),
    years:
      myAvgYear === null || theirAvgYear === null
        ? 0
        : Math.max(0, 1 - Math.abs(myAvgYear - theirAvgYear) / YEAR_RANGE),
  };

  const score =
    100 *
    (WEIGHTS.movies * parts.movies +
      WEIGHTS.genres * parts.genres +
      WEIGHTS.actors * parts.actors +
      WEIGHTS.years * parts.years);

  const commonIds = new Set(intersect(myMovies, theirMovies));

  return {
    score: Math.round(score),
    parts,
    commonMovies: mine.filter((f) => commonIds.has(f.movieId)).map((f) => f.title),
    commonGenres: intersect(myGenres, theirGenres),
    commonActors: intersect(myActors, theirActors),
    myAvgYear,
    theirAvgYear,
  };
}
