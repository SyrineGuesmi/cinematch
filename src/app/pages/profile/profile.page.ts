import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBadge,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';

import { AuthService } from '../../services/auth.service';
import { takeProfilePhoto } from '../../services/photo';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInput,
    IonButton,
    IonIcon,
    IonBadge,
    IonSpinner,
  ],
})
export class ProfilePage {
  auth = inject(AuthService);
  private toast = inject(ToastController);

  firstName = '';
  lastName = '';
  age: number | null = null;
  saving = signal(false);
  error = signal('');

  ionViewWillEnter() {
    const p = this.auth.profile();
    if (!p) return;
    this.firstName = p.firstName;
    this.lastName = p.lastName;
    this.age = p.age;
  }

  async changePhoto() {
    let photoUrl: string;
    try {
      photoUrl = await takeProfilePhoto();
    } catch {
      return; // camera closed
    }
    await this.save({ photoUrl });
  }

  async saveInfo() {
    const age = Number(this.age);
    if (!this.firstName.trim() || !this.lastName.trim()) return this.error.set('Name cannot be empty.');
    if (!Number.isInteger(age) || age < 1 || age > 120) return this.error.set('Please enter a valid age.');
    await this.save({ firstName: this.firstName.trim(), lastName: this.lastName.trim(), age });
  }

  private async save(changes: Parameters<AuthService['updateMyProfile']>[0]) {
    this.error.set('');
    this.saving.set(true);
    try {
      await this.auth.updateMyProfile(changes);
      const t = await this.toast.create({ message: 'Profile updated', duration: 1500, position: 'top' });
      await t.present();
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.saving.set(false);
    }
  }
}
