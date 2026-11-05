import { Component, computed, inject } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tabs',
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home">
          <ion-icon name="film"></ion-icon>
          <ion-label>Discover</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="favorites">
          <ion-icon name="heart"></ion-icon>
          <ion-label>Favorites</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="matching">
          <ion-icon name="people"></ion-icon>
          <ion-label>Matching</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile">
          <ion-icon name="person-circle"></ion-icon>
          <ion-label>Profile</ion-label>
        </ion-tab-button>
        @if (isAdmin()) {
          <ion-tab-button tab="admin">
            <ion-icon name="shield-checkmark"></ion-icon>
            <ion-label>Admin</ion-label>
          </ion-tab-button>
        }
      </ion-tab-bar>
    </ion-tabs>
  `,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  private auth = inject(AuthService);
  isAdmin = computed(() => this.auth.profile()?.role === 'admin');
}
