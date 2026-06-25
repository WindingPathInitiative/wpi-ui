import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'callback',
    loadComponent: () => import('./callback').then(m => m.CallbackComponent),
  },
  {
    path: 'logout',
    loadComponent: () => import('./logout').then(m => m.LogoutComponent),
  },
];
