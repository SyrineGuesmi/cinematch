import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular';

import { MovieService } from '../../services/movie.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Admin Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (error()) {
        <div class="error-box">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="center-box"><ion-spinner name="crescent"></ion-spinner></div>
      } @else {
        <div class="stats">
          <div class="stat">
            <span>{{ stats().users }}</span
            >Users
          </div>
          <div class="stat">
            <span>{{ stats().active }}</span
            >Active
          </div>
          <div class="stat">
            <span>{{ stats().inactive }}</span
            >Deactivated
          </div>
          <div class="stat">
            <span>{{ stats().movies }}</span
            >Catalog movies
          </div>
        </div>
      }

      <a class="admin-link" routerLink="/tabs/admin/users">
        <ion-icon name="people"></ion-icon>
        <div>
          <strong>Manage users</strong><span class="muted small-text">View accounts, deactivate / reactivate</span>
        </div>
      </a>
      <a class="admin-link" routerLink="/tabs/admin/add-movie">
        <ion-icon name="add-circle"></ion-icon>
        <div>
          <strong>Add a movie</strong><span class="muted small-text">Add a movie to the CineMatch catalog</span>
        </div>
      </a>
    </ion-content>
  `,
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonSpinner],
})
export class AdminDashboardPage {
  private userService = inject(UserService);
  private movieService = inject(MovieService);

  loading = signal(true);
  error = signal('');
  stats = signal({ users: 0, active: 0, inactive: 0, movies: 0 });

  async ionViewWillEnter() {
    this.error.set('');
    try {
      const [users, movies] = await Promise.all([this.userService.getAllUsers(), this.movieService.getCatalog()]);
      const active = users.filter((u) => u.isActive).length;
      this.stats.set({ users: users.length, active, inactive: users.length - active, movies: movies.length });
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }
}
