import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput, IonSpinner } from '@ionic/angular';

import { AuthService, authErrorMessage } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  imports: [FormsModule, RouterLink, IonContent, IonInput, IonButton, IonSpinner, IonIcon],
})
export class LoginPage {
  auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  async login() {
    this.error.set('');
    this.auth.notice.set('');
    if (!this.email || !this.password) {
      this.error.set('Please enter your email and password.');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.login(this.email.trim(), this.password);
      await this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
    } catch (err) {
      this.error.set(authErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }
}
