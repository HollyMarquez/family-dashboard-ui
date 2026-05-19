import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { parentGuard } from './core/guards/parent.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login').then(m => m.Login),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard').then(m => m.Dashboard),
  },
  {
    path: 'calendar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/calendar/calendar').then(m => m.Calendar),
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tasks/tasks').then(m => m.Tasks),
  },
  {
    path: 'quotes',
    canActivate: [authGuard, parentGuard],
    loadComponent: () =>
      import('./features/quotes/quotes').then(m => m.Quotes),
  },
  {
    path: 'tv',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tv-mode/tv-mode').then(m => m.TvMode),
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' },
];
