import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { AuthService, authErrorMessage } from '../../services/auth.service';
import { takeProfilePhoto } from '../../services/photo';

@Component({
  selector: 'app-register',
  templateUrl: 'register.page.html',
  imports: [
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonInput,
    IonButton,
    IonSpinner,
    IonIcon,
  ],
})
export class RegisterPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  firstName = '';
  lastName = '';
  age: number | null = null;
  email = '';
  password = '';
  photo = signal('');
  loading = signal(false);
  error = signal('');

  async takePhoto() {
    try {
      this.photo.set(await takeProfilePhoto());
    } catch {
      // The user closed the camera: nothing to do.
    }
  }

  async register() {
    this.error.set('');
    const age = Number(this.age);

    if (!this.firstName.trim() || !this.lastName.trim() || !this.email.trim() || !this.password) {
      return this.error.set('Please fill in all the fields.');
    }
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      return this.error.set('Please enter a valid age.');
    }
    if (this.password.length < 6) {
      return this.error.set('Password must be at least 6 characters.');
    }
    if (!this.photo()) {
      return this.error.set('Please take a profile picture.');
    }

    this.loading.set(true);
    try {
      await this.auth.register(
        {
          firstName: this.firstName.trim(),
          lastName: this.lastName.trim(),
          age,
          email: this.email.trim(),
          photoUrl: this.photo(),
        },
        this.password,
      );
      await this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
    } catch (err) {
      this.error.set(authErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }
}
