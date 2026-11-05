import type { Routes } from '@angular/router';

import { adminGuard, authGuard, guestGuard } from './guards';

const movieDetails = () => import('./pages/movie-details/movie-details.page').then((m) => m.MovieDetailsPage);

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: 'home', loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage) },
      { path: 'home/movie/:id', loadComponent: movieDetails },
      {
        path: 'favorites',
        loadComponent: () => import('./pages/favorites/favorites.page').then((m) => m.FavoritesPage),
      },
      { path: 'favorites/movie/:id', loadComponent: movieDetails },
      {
        path: 'matching',
        loadComponent: () => import('./pages/matching/matching.page').then((m) => m.MatchingPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/admin/admin-dashboard.page').then((m) => m.AdminDashboardPage),
      },
      {
        path: 'admin/users',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/admin/admin-users.page').then((m) => m.AdminUsersPage),
      },
      {
        path: 'admin/add-movie',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/admin/add-movie.page').then((m) => m.AddMoviePage),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: 'tabs/home', pathMatch: 'full' },
  { path: '**', redirectTo: 'tabs/home' },
];
