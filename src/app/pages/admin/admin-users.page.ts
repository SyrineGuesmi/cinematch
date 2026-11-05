import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import {
  IonBackButton,
  IonBadge,
  IonButtons,
  IonContent,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular';

import type { UserProfile } from '../../models';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-admin-users',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button defaultHref="/tabs/admin"></ion-back-button></ion-buttons>
        <ion-title>User Management</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (error()) {
        <div class="error-box">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="center-box"><ion-spinner name="crescent"></ion-spinner></div>
      } @else {
        <p class="muted">{{ users().length }} registered user(s)</p>
        @for (user of users(); track user.uid) {
          <div class="list-card" [class.below]="!user.isActive">
            <img class="avatar" [src]="user.photoUrl" alt="" />
            <div class="list-card-body">
              <strong>
                {{ user.firstName }} {{ user.lastName }}
                @if (user.role === 'admin') {
                  <ion-badge color="primary">Admin</ion-badge>
                }
              </strong>
              <span class="muted small-text">{{ user.email }} · {{ user.age }} y/o</span>
              <span
                class="small-text"
                [style.color]="user.isActive ? 'var(--ion-color-success)' : 'var(--ion-color-danger)'"
              >
                {{ user.isActive ? 'Active' : 'Deactivated' }}
              </span>
            </div>
            <ion-toggle
              [checked]="user.isActive"
              [disabled]="user.uid === myUid"
              (ionChange)="setActive(user, $event)"
              aria-label="Account active"
            ></ion-toggle>
          </div>
        }
      }
    </ion-content>
  `,
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonSpinner, IonToggle, IonBadge],
})
export class AdminUsersPage implements OnInit {
  private userService = inject(UserService);
  myUid = inject(AuthService).profile()?.uid;

  users = signal<UserProfile[]>([]);
  loading = signal(true);
  error = signal('');

  async ngOnInit() {
    try {
      const users = await this.userService.getAllUsers();
      this.users.set(users.sort((a, b) => a.lastName.localeCompare(b.lastName)));
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  /** Deactivating keeps the account and its data; the user just can't log in anymore. */
  async setActive(user: UserProfile, event: CustomEvent) {
    const isActive: boolean = event.detail.checked;
    this.error.set('');
    try {
      await this.userService.setActive(user.uid, isActive);
      this.users.update((list) => list.map((u) => (u.uid === user.uid ? { ...u, isActive } : u)));
    } catch (err) {
      this.error.set((err as Error).message);
      (event.target as HTMLIonToggleElement).checked = !isActive; // put the toggle back
    }
  }
}
