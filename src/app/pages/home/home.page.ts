import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import type { Movie } from '../../models';
import { MovieService, yearOf } from '../../services/movie.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonSearchbar,
    IonContent,
    IonSpinner,
    IonButton,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
  ],
})
export class HomePage implements OnInit {
  private movieService = inject(MovieService);
  yearOf = yearOf;

  movies = signal<Movie[]>([]); // TMDB results (popular or search)
  catalog = signal<Movie[]>([]); // movies added by the admin
  loading = signal(false);
  error = signal('');
  searchText = signal('');

  private page = 1;
  private totalPages = 1;
  private allCatalog: Movie[] = [];
  private lastRequestId = 0;

  ngOnInit() {
    this.load();
  }

  /** Called when the user comes back to this tab (the admin may have added movies). */
  async ionViewWillEnter() {
    try {
      this.allCatalog = await this.movieService.getCatalog();
      this.filterCatalog();
    } catch {
      // Catalog is optional - TMDB results are still shown.
    }
  }

  onSearch(event: CustomEvent) {
    this.searchText.set((event.detail.value ?? '').trim());
    this.filterCatalog();
    this.load();
  }

  /** Loads the first page (popular movies, or search results). */
  async load() {
    const requestId = ++this.lastRequestId;
    this.page = 1;
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.fetchPage();
      if (requestId !== this.lastRequestId) return; // a newer search was started meanwhile
      this.movies.set(result.movies);
      this.totalPages = result.totalPages;
    } catch (err) {
      if (requestId !== this.lastRequestId) return;
      this.error.set((err as Error).message);
      this.movies.set([]);
    }
    this.loading.set(false);
  }

  /** Infinite scroll: loads the next page. */
  async loadMore(event: CustomEvent) {
    if (this.page < this.totalPages) {
      this.page++;
      try {
        const result = await this.fetchPage();
        this.movies.update((list) => [...list, ...result.movies]);
      } catch {
        this.page--;
      }
    }
    (event.target as HTMLIonInfiniteScrollElement).complete();
  }

  hasMore() {
    return this.page < this.totalPages;
  }

  private fetchPage() {
    const text = this.searchText();
    return text ? this.movieService.search(text, this.page) : this.movieService.popular(this.page);
  }

  private filterCatalog() {
    const text = this.searchText().toLowerCase();
    this.catalog.set(this.allCatalog.filter((m) => m.title.toLowerCase().includes(text)));
  }
}
