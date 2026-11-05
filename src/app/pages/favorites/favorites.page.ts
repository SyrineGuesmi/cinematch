import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import type { Favorite } from '../../models';
import { AuthService } from '../../services/auth.service';
import { MovieService, yearOf } from '../../services/movie.service';

@Component({
  selector: 'app-favorites',
  templateUrl: 'favorites.page.html',
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonButton, IonIcon],
})
export class FavoritesPage {
  private movieService = inject(MovieService);
  private auth = inject(AuthService);
  private alertCtrl = inject(AlertController);
  yearOf = yearOf;

  favorites = signal<Favorite[]>([]);
  loading = signal(true);
  error = signal('');

  /** Reload every time the tab is shown (favorites may have changed). */
  async ionViewWillEnter() {
    this.error.set('');
    try {
      this.favorites.set(await this.movieService.getFavorites(this.auth.profile()!.uid));
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  /** Asks for confirmation before removing a favorite (destructive action). */
  async confirmRemove(fav: Favorite, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: 'Remove from favorites',
      message: `Remove "${fav.title}" from your playlist?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Remove', role: 'destructive', handler: () => this.remove(fav) },
      ],
    });
    await alert.present();
  }

  private async remove(fav: Favorite) {
    try {
      await this.movieService.removeFavorite(fav.userId, fav.movieId);
      this.favorites.update((list) => list.filter((f) => f.movieId !== fav.movieId));
    } catch (err) {
      this.error.set((err as Error).message);
    }
  }
}
