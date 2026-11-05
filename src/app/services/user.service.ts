import { Injectable } from '@angular/core';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';

import { db } from '../firebase';
import type { UserProfile } from '../models';

/** Reading / updating other users (used by matching and the admin pages). */
@Injectable({ providedIn: 'root' })
export class UserService {
  async getAllUsers(): Promise<UserProfile[]> {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => d.data() as UserProfile);
  }

  /** Admin only (enforced by Firestore rules): activate / deactivate an account. */
  async setActive(uid: string, isActive: boolean): Promise<void> {
    await updateDoc(doc(db, 'users', uid), { isActive });
  }
}
