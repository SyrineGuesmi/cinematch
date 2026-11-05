import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';

import { MovieService } from '../../services/movie.service';

@Component({
  selector: 'app-add-movie',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/tabs/admin"></ion-back-button></ion-buttons>
        <ion-title>Add Movie</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form class="auth-box" (ngSubmit)="save()">
        @if (poster) {
          <img class="details-poster preview" [src]="poster" alt="Poster preview" />
        }
        <ion-input
          class="form-field"
          label="Title *"
          labelPlacement="floating"
          fill="outline"
          name="title"
          [(ngModel)]="title"
        ></ion-input>
        <ion-input
          class="form-field"
          label="Poster image URL"
          labelPlacement="floating"
          fill="outline"
          name="poster"
          [(ngModel)]="poster"
        ></ion-input>
        <ion-input
          class="form-field"
          label="Release date"
          labelPlacement="stacked"
          fill="outline"
          type="date"
          name="releaseDate"
          [(ngModel)]="releaseDate"
        ></ion-input>
        <ion-input
          class="form-field"
          label="Genres (comma separated)"
          labelPlacement="floating"
          fill="outline"
          name="genres"
          [(ngModel)]="genres"
          placeholder="Action, Drama"
        ></ion-input>
        <ion-input
          class="form-field"
          label="Actors (comma separated)"
          labelPlacement="floating"
          fill="outline"
          name="actors"
          [(ngModel)]="actors"
        ></ion-input>
        <ion-textarea
          class="form-field"
          label="Overview"
          labelPlacement="floating"
          fill="outline"
          [autoGrow]="true"
          name="overview"
          [(ngModel)]="overview"
        ></ion-textarea>

        @if (error()) {
          <div class="error-box">{{ error() }}</div>
        }

        <ion-button expand="block" type="submit" [disabled]="saving()">
          @if (saving()) {
            <ion-spinner name="crescent"></ion-spinner>
          } @else {
            Add movie
          }
        </ion-button>
      </form>
    </ion-content>
  `,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonInput,
    IonTextarea,
    IonButton,
    IonSpinner,
  ],
})
export class AddMoviePage {
  private movieService = inject(MovieService);
  private toast = inject(ToastController);

  title = '';
  poster = '';
  releaseDate = '';
  genres = '';
  actors = '';
  overview = '';
  saving = signal(false);
  error = signal('');

  async save() {
    this.error.set('');
    if (!this.title.trim()) return this.error.set('The title is required.');

    this.saving.set(true);
    try {
      await this.movieService.addToCatalog({
        title: this.title.trim(),
        poster: this.poster.trim(),
        releaseDate: this.releaseDate,
        genres: splitList(this.genres),
        actors: splitList(this.actors),
        overview: this.overview.trim(),
      });
      const t = await this.toast.create({ message: `"${this.title}" added`, duration: 1500, position: 'top' });
      await t.present();
      this.title = this.poster = this.releaseDate = this.genres = this.actors = this.overview = '';
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.saving.set(false);
    }
  }
}

/** "Action, Drama ," -> ["Action", "Drama"] */
function splitList(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
