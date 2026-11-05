import { describe, expect, it } from 'vitest';

import type { Favorite } from '../models';

import { MATCH_THRESHOLD, computeMatch } from './matching';

function fav(movieId: string, year: string, genres: string[], actors: string[]): Favorite {
  return {
    userId: 'x',
    movieId,
    title: 'Movie ' + movieId,
    poster: '',
    releaseDate: `${year}-01-01`,
    genres,
    actors,
    addedAt: 0,
  };
}

const inception = fav('1', '2010', ['Action', 'Sci-Fi', 'Adventure'], ['Leonardo DiCaprio', 'Tom Hardy']);
const interstellar = fav('2', '2014', ['Drama', 'Sci-Fi'], ['Matthew McConaughey', 'Anne Hathaway']);
const darkKnight = fav('3', '2008', ['Action', 'Crime'], ['Christian Bale', 'Heath Ledger', 'Tom Hardy']);
const revenant = fav('4', '2015', ['Drama', 'Western', 'Adventure'], ['Leonardo DiCaprio', 'Tom Hardy']);
const casablanca = fav('5', '1942', ['Romance', 'Drama'], ['Humphrey Bogart']);
const frozen = fav('6', '2013', ['Animation', 'Family'], ['Kristen Bell']);

describe('computeMatch', () => {
  it('gives 100% for identical playlists', () => {
    const m = computeMatch([inception, interstellar], [inception, interstellar]);
    expect(m.score).toBe(100);
    expect(m.commonMovies).toEqual(['Movie 1', 'Movie 2']);
  });

  it('gives 0% when nothing is shared and years are far apart', () => {
    const m = computeMatch([frozen], [casablanca]);
    expect(m.score).toBe(0);
  });

  it('is symmetric', () => {
    const a = [inception, darkKnight, frozen];
    const b = [inception, revenant];
    expect(computeMatch(a, b).score).toBe(computeMatch(b, a).score);
  });

  it('uses genres, actors and years even with no common movie', () => {
    // No movie in common, but same actors (DiCaprio, Hardy), similar genres and years
    const m = computeMatch([inception], [revenant]);
    expect(m.parts.movies).toBe(0);
    expect(m.parts.actors).toBe(1);
    expect(m.parts.genres).toBeGreaterThan(0);
    expect(m.score).toBeGreaterThan(0);
    expect(m.score).toBeLessThan(MATCH_THRESHOLD);
  });

  it('only very similar playlists pass the 75% threshold', () => {
    const me = [inception, interstellar, darkKnight, revenant];
    const almostSame = [inception, interstellar, darkKnight]; // 3 of my 4 movies
    const halfSame = [inception, interstellar, frozen, casablanca];

    expect(computeMatch(me, almostSame).score).toBeGreaterThan(MATCH_THRESHOLD);
    expect(computeMatch(me, halfSame).score).toBeLessThan(MATCH_THRESHOLD);
  });

  it('returns 0 for empty playlists', () => {
    expect(computeMatch([], []).score).toBe(0);
  });
});
