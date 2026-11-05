import type { OnInit } from '@angular/core';
import { Component, inject, input, signal } from '@angular/core';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';

import type { Movie } from '../../models';
import { AuthService } from '../../services/auth.service';
import { MovieService, yearOf } from '../../services/movie.service';

@Component({
  selector: 'app-movie-details',
  templateUrl: 'movie-details.page.html',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonSpinner,
    IonButton,
    IonIcon,
    IonChip,
  ],
})
export class MovieDetailsPage implements OnInit {
  private movieService = inject(MovieService);
  private auth = inject(AuthService);
  private toast = inject(ToastController);
  private alertCtrl = inject(AlertController);
  yearOf = yearOf;

  /** Route parameter `:id` (bound automatically by the router). */
  id = input.required<string>();

  movie = signal<Movie | null>(null);
  isFavorite = signal(false);
  loading = signal(true);
  saving = signal(false);
  error = signal('');

  async ngOnInit() {
    try {
      const movie = await this.movieService.getMovie(this.id());
      if (!movie) throw new Error('Movie not found.');
      this.movie.set(movie);
      this.isFavorite.set(await this.movieService.isFavorite(this.auth.profile()!.uid, movie.id));
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async toggleFavorite() {
    const movie = this.movie();
    const uid = this.auth.profile()?.uid;
    if (!movie || !uid) return;

    if (this.isFavorite()) {
      // Removing is destructive: ask for confirmation first.
      const alert = await this.alertCtrl.create({
        header: 'Remove from favorites',
        message: `Remove "${movie.title}" from your playlist?`,
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'Remove', role: 'destructive', handler: () => this.removeFavorite(uid, movie) },
        ],
      });
      await alert.present();
    } else {
      await this.addFavorite(uid, movie);
    }
  }

  private async removeFavorite(uid: string, movie: Movie) {
    this.saving.set(true);
    try {
      await this.movieService.removeFavorite(uid, movie.id);
      this.isFavorite.set(false);
      this.showToast('Removed from your favorites');
    } catch (err) {
      this.showToast('Error: ' + (err as Error).message);
    } finally {
      this.saving.set(false);
    }
  }

  private async addFavorite(uid: string, movie: Movie) {
    this.saving.set(true);
    try {
      await this.movieService.addFavorite(uid, movie);
      this.isFavorite.set(true);
      this.showToast('Added to your favorites');
    } catch (err) {
      this.showToast('Error: ' + (err as Error).message);
    } finally {
      this.saving.set(false);
    }
  }

  private async showToast(message: string) {
    const t = await this.toast.create({ message, duration: 1500, position: 'top' });
    await t.present();
  }
}
