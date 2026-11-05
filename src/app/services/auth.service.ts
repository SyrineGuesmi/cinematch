import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

import { auth, db } from '../firebase';
import type { UserProfile } from '../models';

const DEACTIVATED_MSG = 'Your account has been deactivated by an administrator.';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  /** Profile of the logged-in user (null when logged out). */
  readonly profile = signal<UserProfile | null>(null);

  /** Message shown on the login page (e.g. after a deactivation). */
  readonly notice = signal('');

  /** Resolves once Firebase has told us whether someone is logged in. */
  readonly ready: Promise<void>;

  private stopProfileListener?: () => void;

  constructor() {
    this.ready = new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        this.stopProfileListener?.();
        this.stopProfileListener = undefined;

        if (!user) {
          this.profile.set(null);
          resolve();
          return;
        }

        // Listen to our own profile document: if an admin deactivates the
        // account while we are using the app, we are logged out immediately.
        this.stopProfileListener = onSnapshot(
          doc(db, 'users', user.uid),
          (snap) => {
            const profile = snap.exists() ? (snap.data() as UserProfile) : null;
            if (profile && !profile.isActive) {
              this.notice.set(DEACTIVATED_MSG);
              this.logout();
            } else if (profile) {
              this.profile.set(profile);
            }
            resolve();
          },
          () => resolve(),
        );
      });
    });
  }

  async register(data: Omit<UserProfile, 'uid' | 'role' | 'isActive'>, password: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(auth, data.email, password);
    const profile: UserProfile = { ...data, uid: cred.user.uid, role: 'user', isActive: true };
    await setDoc(doc(db, 'users', profile.uid), profile);
    this.profile.set(profile);
  }

  async login(email: string, password: string): Promise<void> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    const profile = snap.data() as UserProfile | undefined;

    if (!profile) {
      await signOut(auth);
      throw new Error('No profile found for this account.');
    }
    if (!profile.isActive) {
      await signOut(auth);
      throw new Error(DEACTIVATED_MSG);
    }
    this.profile.set(profile);
  }

  async logout(): Promise<void> {
    this.stopProfileListener?.();
    this.stopProfileListener = undefined;
    this.profile.set(null);
    await signOut(auth);
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  /** Update the editable fields of the current user's profile. */
  async updateMyProfile(changes: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'age' | 'photoUrl'>>) {
    const current = this.profile();
    if (!current) return;
    await updateDoc(doc(db, 'users', current.uid), changes);
    this.profile.set({ ...current, ...changes });
  }
}

/** Turns Firebase error codes into readable messages. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Wrong email or password.';
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'Firebase is not configured: put your Firebase config in src/app/config.ts.';
    case 'auth/network-request-failed':
      return 'Network error, check your connection.';
    default:
      return (err as Error)?.message || 'Something went wrong.';
  }
}
