import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addCircle,
  camera,
  film,
  heart,
  heartDislike,
  logOut,
  people,
  personCircle,
  shieldCheckmark,
  trash,
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    // Register the icons used in the app (<ion-icon name="...">)
    addIcons({ addCircle, camera, film, heart, heartDislike, logOut, people, personCircle, shieldCheckmark, trash });
  }
}
