import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from './services/auth.service';

// Note: inject() must be called BEFORE any `await` in a guard.

/** Only logged-in, active users. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  return auth.profile()?.isActive ? true : router.parseUrl('/login');
};

/** Only administrators. */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  return auth.profile()?.role === 'admin' ? true : router.parseUrl('/tabs/home');
};

/** Login / register pages: redirect to the app if already logged in. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  return auth.profile() ? router.parseUrl('/tabs/home') : true;
};
