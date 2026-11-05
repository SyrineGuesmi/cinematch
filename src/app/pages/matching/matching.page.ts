import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonLabel, IonSpinner, IonTitle, IonToggle, IonToolbar } from '@ionic/angular';

import type { Favorite, UserProfile } from '../../models';
import { AuthService } from '../../services/auth.service';
import type { MatchDetails } from '../../services/matching';
import { MATCH_THRESHOLD, WEIGHTS, computeMatch } from '../../services/matching';
import { MovieService } from '../../services/movie.service';
import { UserService } from '../../services/user.service';

interface MatchRow {
  user: UserProfile;
  match: MatchDetails;
}

@Component({
  selector: 'app-matching',
  templateUrl: 'matching.page.html',
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonToggle, IonLabel],
})
export class MatchingPage {
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private movieService = inject(MovieService);

  threshold = MATCH_THRESHOLD;
  weights = WEIGHTS;
  loading = signal(true);
  error = signal('');
  myFavoritesCount = signal(0);
  rows = signal<MatchRow[]>([]);
  showAll = signal(false); // show every user with their score (useful to check the algorithm)

  visibleRows = computed(() =>
    this.showAll() ? this.rows() : this.rows().filter((r) => r.match.score > MATCH_THRESHOLD),
  );

  async ionViewWillEnter() {
    this.error.set('');
    try {
      const me = this.auth.profile()!;
      const [users, favorites] = await Promise.all([
        this.userService.getAllUsers(),
        this.movieService.getAllFavorites(),
      ]);

      // Group favorites by user
      const byUser = new Map<string, Favorite[]>();
      for (const f of favorites) {
        if (!byUser.has(f.userId)) byUser.set(f.userId, []);
        byUser.get(f.userId)!.push(f);
      }

      const mine = byUser.get(me.uid) ?? [];
      this.myFavoritesCount.set(mine.length);

      const rows = users
        .filter((u) => u.uid !== me.uid && u.isActive)
        .map((user) => ({ user, match: computeMatch(mine, byUser.get(user.uid) ?? []) }))
        .sort((a, b) => b.match.score - a.match.score);

      this.rows.set(rows);
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  percent(value: number) {
    return Math.round(value * 100);
  }

  /** At most `max` items, then "+N more". */
  short(list: string[], max = 4) {
    return list.length <= max ? list.join(', ') : `${list.slice(0, max).join(', ')} +${list.length - max} more`;
  }
}
