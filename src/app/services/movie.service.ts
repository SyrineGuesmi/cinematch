import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

import { tmdbApiKey } from '../config';
import { db } from '../firebase';
import type { Favorite, Movie } from '../models';

const TMDB_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';

/**
 * Everything related to movies:
 *  - TMDB API (browse, search, details)
 *  - `movies` collection (movies added by the admin)
 *  - `favorites` collection (each user's playlist)
 */
@Injectable({ providedIn: 'root' })
export class MovieService {
  // ---------------- TMDB ----------------

  private async tmdb(path: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(TMDB_URL + path);
    url.searchParams.set('api_key', tmdbApiKey);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB request failed (${res.status}). Check your TMDB API key.`);
    return res.json();
  }

  private fromTmdb(m: any): Movie {
    return {
      id: String(m.id),
      title: m.title,
      poster: m.poster_path ? TMDB_IMG + m.poster_path : '',
      releaseDate: m.release_date ?? '',
      genres: (m.genres ?? []).map((g: any) => g.name),
      actors: (m.credits?.cast ?? []).slice(0, 10).map((c: any) => c.name),
      overview: m.overview ?? '',
    };
  }

  async popular(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const data = await this.tmdb('/movie/popular', { page: String(page) });
    return { movies: data.results.map((m: any) => this.fromTmdb(m)), totalPages: data.total_pages };
  }

  async search(text: string, page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
    const data = await this.tmdb('/search/movie', { query: text, page: String(page) });
    return { movies: data.results.map((m: any) => this.fromTmdb(m)), totalPages: data.total_pages };
  }

  /** TMDB ids are numbers; movies added by the admin have a Firestore id. */
  async getMovie(id: string): Promise<Movie | null> {
    if (/^\d+$/.test(id)) {
      return this.fromTmdb(await this.tmdb(`/movie/${id}`, { append_to_response: 'credits' }));
    }
    const snap = await getDoc(doc(db, 'movies', id));
    return snap.exists() ? { ...(snap.data() as Movie), id: snap.id } : null;
  }

  // ---------------- Admin catalog (`movies`) ----------------

  async getCatalog(): Promise<Movie[]> {
    const snap = await getDocs(collection(db, 'movies'));
    return snap.docs.map((d) => ({ ...(d.data() as Movie), id: d.id }));
  }

  async addToCatalog(movie: Omit<Movie, 'id'>): Promise<void> {
    await addDoc(collection(db, 'movies'), { ...movie, createdAt: Date.now() });
  }

  // ---------------- Favorites ----------------

  private favId(userId: string, movieId: string) {
    return `${userId}_${movieId}`;
  }

  async getFavorites(userId: string): Promise<Favorite[]> {
    const snap = await getDocs(query(collection(db, 'favorites'), where('userId', '==', userId)));
    return snap.docs.map((d) => d.data() as Favorite).sort((a, b) => b.addedAt - a.addedAt);
  }

  /** All favorites of all users (used by the matching page). */
  async getAllFavorites(): Promise<Favorite[]> {
    const snap = await getDocs(collection(db, 'favorites'));
    return snap.docs.map((d) => d.data() as Favorite);
  }

  async isFavorite(userId: string, movieId: string): Promise<boolean> {
    const snap = await getDoc(doc(db, 'favorites', this.favId(userId, movieId)));
    return snap.exists();
  }

  async addFavorite(userId: string, movie: Movie): Promise<void> {
    const favorite: Favorite = {
      userId,
      movieId: movie.id,
      title: movie.title,
      poster: movie.poster,
      releaseDate: movie.releaseDate,
      genres: movie.genres,
      actors: movie.actors,
      addedAt: Date.now(),
    };
    await setDoc(doc(db, 'favorites', this.favId(userId, movie.id)), favorite);
  }

  async removeFavorite(userId: string, movieId: string): Promise<void> {
    await deleteDoc(doc(db, 'favorites', this.favId(userId, movieId)));
  }
}

/** "2014-11-05" -> "2014" */
export function yearOf(date: string): string {
  return date ? date.slice(0, 4) : '';
}
